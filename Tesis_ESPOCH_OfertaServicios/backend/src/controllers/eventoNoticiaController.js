// backend/src/controllers/eventoNoticiaController.js
const Evento  = require('../models/Evento');
const Noticia = require('../models/Noticia');
const fs      = require('fs');
const path    = require('path');
const { AuditoriaLog, AuditoriaError } = require('../models/Auditoria');
const Graduado   = require('../models/Graduado');
const Empleador  = require('../models/Empleador');
const {
    enviarNotificacionEventoGraduado,
    enviarNotificacionEventoEmpleador,
} = require('../services/emailEventoService');

/* ── Helper estado automático evento ───────────────────── */
const calcEstado = (ini, fin) => {
    const now = new Date();
    if (now < new Date(ini))  return 'programado';
    if (now <= new Date(fin)) return 'en_curso';
    return 'finalizado';
};

/* ── Helper borrar imagen del disco ────────────────────── */
const borrarImagen = (ruta) => {
    if (!ruta) return;
    const abs = path.join(__dirname, '..', ruta);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
};

/* ══════════════════════════════════════════════════════════
   EVENTOS
══════════════════════════════════════════════════════════ */
exports.getEventos = async (req, res) => {
    try {
        const { estado, page = 1, limit = 20 } = req.query;

        // 1. Actualiza masivamente los estados desactualizados
        const now = new Date();
        await Evento.updateMany(
            { estado: 'programado', fechaInicio: { $lte: now }, fechaFin: { $gt: now } },
            { $set: { estado: 'en_curso' } }
        );
        await Evento.updateMany(
            { estado: { $in: ['programado', 'en_curso'] }, fechaFin: { $lte: now } },
            { $set: { estado: 'finalizado' } }
        );

        // 2. Filtra y devuelve
        const filtro = {};
        if (estado === 'vigente')        filtro.estado = { $in: ['programado', 'en_curso'] };
        else if (estado === 'historial') filtro.estado = { $in: ['finalizado', 'cancelado'] };
        else if (estado)                 filtro.estado = estado;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [eventos, total] = await Promise.all([
            Evento.find(filtro)
                .populate('creadoPor', 'nombre')
                .sort({ fechaInicio: 1 })
                .skip(skip).limit(parseInt(limit)),
            Evento.countDocuments(filtro),
        ]);
        res.json({ eventos, total, totalPaginas: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener eventos.' });
    }
};

// POST /api/eventos
exports.crearEvento = async (req, res) => {
    try {
        const { titulo, descripcion, tipo, fechaInicio, fechaFin,
                modalidad, urlAcceso, lugar, capacidadMaxima } = req.body;

        if (!titulo || !tipo || !fechaInicio || !fechaFin || !modalidad)
            return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
        if (new Date(fechaFin) <= new Date(fechaInicio))
            return res.status(400).json({ msg: 'La fecha de fin debe ser posterior a la de inicio.' });

        const evento = await Evento.create({
            titulo:          titulo.trim(),
            descripcion:     descripcion?.trim() || '',
            tipo, modalidad,
            fechaInicio:     new Date(fechaInicio),
            fechaFin:        new Date(fechaFin),
            urlAcceso:       urlAcceso?.trim() || '',
            lugar:           lugar?.trim() || '',
            capacidadMaxima: parseInt(capacidadMaxima) || 0,
            estado:          calcEstado(fechaInicio, fechaFin),
            creadoPor:       req.usuario.id,
            imagen: req.file ? req.file.path : '',
        });
        res.status(201).json({ msg: 'Evento creado.', evento });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al crear evento.' });
    }
};

// PUT /api/eventos/:id
exports.actualizarEvento = async (req, res) => {
    try {
        const adminId    = req.usuario?.id    || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        const evento = await Evento.findById(req.params.id);
        if (!evento) return res.status(404).json({ msg: 'Evento no encontrado.' });

        const estadoAnterior = evento.estado;

        const campos = ['titulo','descripcion','tipo','modalidad','urlAcceso','lugar'];
        campos.forEach(c => { if (req.body[c] !== undefined) evento[c] = req.body[c].trim?.() ?? req.body[c]; });

        if (req.body.capacidadMaxima !== undefined) evento.capacidadMaxima = parseInt(req.body.capacidadMaxima) || 0;
        if (req.body.fechaInicio) evento.fechaInicio = new Date(req.body.fechaInicio);
        if (req.body.fechaFin)    evento.fechaFin    = new Date(req.body.fechaFin);

        evento.estado = req.body.estado === 'cancelado'
            ? 'cancelado'
            : calcEstado(evento.fechaInicio, evento.fechaFin);

        if (req.file) {
            evento.imagen = req.file.path;
        }
        await evento.save();

        // Auditar solo si cambió el estado
        if (evento.estado !== estadoAnterior) {
            await AuditoriaLog.create({
                usuarioId:         String(adminId),
                usuarioEmail:      adminEmail,
                rol:               'admin',
                accion:            'CAMBIAR_ESTADO_EVENTO',
                modulo:            'Eventos',
                coleccionAfectada: 'eventos',
                descripcion:       `Evento "${evento.titulo}" cambió de estado: ${estadoAnterior} → ${evento.estado}.`,
                ip:                req.ip || 'desconocida',
            }).catch(() => {});
        }

        res.json({ msg: 'Evento actualizado.', evento });
    } catch (err) {
        console.error(err);
        await AuditoriaError.create({
            usuarioId:    String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol:          'admin',
            accion:       'ACTUALIZAR_EVENTO',
            modulo:       'Eventos',
            mensajeError: err.message,
            ip:           req.ip || 'desconocida',
        }).catch(() => {});
        res.status(500).json({ msg: 'Error al actualizar evento.' });
    }
};

// DELETE /api/eventos/:id
exports.eliminarEvento = async (req, res) => {
    try {
        const adminId    = req.usuario?.id    || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        const evento = await Evento.findById(req.params.id);
        if (!evento) return res.status(404).json({ msg: 'Evento no encontrado.' });

        borrarImagen(evento.imagen);
        await Evento.deleteOne({ _id: evento._id });

        await AuditoriaLog.create({
            usuarioId:         String(adminId),
            usuarioEmail:      adminEmail,
            rol:               'admin',
            accion:            'ELIMINAR_EVENTO',
            modulo:            'Eventos',
            coleccionAfectada: 'eventos',
            descripcion:       `Evento eliminado: "${evento.titulo}" (tipo: ${evento.tipo}, estado: ${evento.estado}).`,
            ip:                req.ip || 'desconocida',
        }).catch(() => {});

        res.json({ msg: 'Evento eliminado.' });
    } catch (err) {
        await AuditoriaError.create({
            usuarioId:    String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol:          'admin',
            accion:       'ELIMINAR_EVENTO',
            modulo:       'Eventos',
            mensajeError: err.message,
            ip:           req.ip || 'desconocida',
        }).catch(() => {});
        res.status(500).json({ msg: 'Error al eliminar evento.' });
    }
};

/* ══════════════════════════════════════════════════════════
   NOTIFICAR EVENTO
   POST /api/eventos/:id/notificar
   - Envía correo a todos los graduados con tesisVerificada=true
   - Envía correo a todos los empleadores registrados (sin filtro)
   - Sin límite de envíos — el admin decide cuándo notificar
══════════════════════════════════════════════════════════════ */
exports.notificarEvento = async (req, res) => {
    try {
        const adminId    = req.usuario?.id    || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        // ── Obtener evento ─────────────────────────────────────
        const evento = await Evento.findById(req.params.id);
        if (!evento) return res.status(404).json({ msg: 'Evento no encontrado.' });

        // ── No notificar si ya finalizó o fue cancelado ────────
        if (evento.estado === 'finalizado' || evento.estado === 'cancelado') {
            return res.status(400).json({
                msg: `No se puede notificar un evento ${evento.estado}.`,
            });
        }

        // ── Campos del evento para el correo ───────────────────
        const datosEvento = {
            tituloEvento: evento.titulo,
            fechaInicio:  evento.fechaInicio,
            modalidad:    evento.modalidad,
            lugar:        evento.lugar    || '',
            urlAcceso:    evento.urlAcceso || '',
        };

        // ── Resumen de resultados ──────────────────────────────
        const resumen = {
            graduados: { total: 0, enviados: 0, fallidos: 0 },
            empleadores: { total: 0, enviados: 0, fallidos: 0 },
        };

        // ══════════════════════════════════════════════════════
        // 1. GRADUADOS — solo tesisVerificada = true
        // ══════════════════════════════════════════════════════
        const graduados = await Graduado.find({ tesisVerificada: true })
            .select('nombres emailPersonal');

        resumen.graduados.total = graduados.length;

        for (const graduado of graduados) {
            if (!graduado.emailPersonal) {
                resumen.graduados.fallidos++;
                console.warn(`[notificarEvento] Graduado sin email: ${graduado._id}`);
                continue;
            }
            const resultado = await enviarNotificacionEventoGraduado({
                emailPersonal: graduado.emailPersonal,
                nombres:       graduado.nombres,
                ...datosEvento,
            });
            if (resultado.exito) resumen.graduados.enviados++;
            else {
                resumen.graduados.fallidos++;
                console.warn(`[notificarEvento] Fallo graduado ${graduado.emailPersonal}: ${resultado.error}`);
            }
        }

        // ══════════════════════════════════════════════════════
        // 2. EMPLEADORES — todos los registrados sin filtro
        // ══════════════════════════════════════════════════════
        const empleadores = await Empleador.find()
            .select('nombreEmpresa emailOrganizacion');

        resumen.empleadores.total = empleadores.length;

        for (const emp of empleadores) {
            if (!emp.emailOrganizacion) {
                resumen.empleadores.fallidos++;
                console.warn(`[notificarEvento] Empleador sin email: ${emp._id}`);
                continue;
            }
            const resultado = await enviarNotificacionEventoEmpleador({
                emailOrganizacion: emp.emailOrganizacion,
                nombreEmpresa:     emp.nombreEmpresa,
                ...datosEvento,
            });
            if (resultado.exito) resumen.empleadores.enviados++;
            else {
                resumen.empleadores.fallidos++;
                console.warn(`[notificarEvento] Fallo empleador ${emp.emailOrganizacion}: ${resultado.error}`);
            }
        }

        // ── Log de consola ─────────────────────────────────────
        console.log(`\n[notificarEvento] Evento: "${evento.titulo}"`);
        console.log(`  Graduados  → total: ${resumen.graduados.total}, enviados: ${resumen.graduados.enviados}, fallidos: ${resumen.graduados.fallidos}`);
        console.log(`  Empleadores→ total: ${resumen.empleadores.total}, enviados: ${resumen.empleadores.enviados}, fallidos: ${resumen.empleadores.fallidos}`);

        // ── Auditoría ──────────────────────────────────────────
        await AuditoriaLog.create({
            usuarioId:         String(adminId),
            usuarioEmail:      adminEmail,
            rol:               'admin',
            accion:            'NOTIFICAR_EVENTO',
            modulo:            'Eventos',
            coleccionAfectada: 'eventos',
            descripcion:       `Notificación del evento "${evento.titulo}" enviada. Graduados: ${resumen.graduados.enviados}/${resumen.graduados.total} enviados. Empleadores: ${resumen.empleadores.enviados}/${resumen.empleadores.total} enviados.`,
            ip:                req.ip || 'desconocida',
        }).catch(() => {});

        res.json({
            msg: `Notificación enviada. Graduados: ${resumen.graduados.enviados} enviados. Empleadores: ${resumen.empleadores.enviados} enviados.`,
            resumen,
        });

    } catch (err) {
        console.error('[notificarEvento] Error:', err);
        await AuditoriaError.create({
            usuarioId:    String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol:          'admin',
            accion:       'NOTIFICAR_EVENTO',
            modulo:       'Eventos',
            mensajeError: err.message,
            ip:           req.ip || 'desconocida',
        }).catch(() => {});
        res.status(500).json({ msg: 'Error al enviar notificaciones del evento.' });
    }
};

/* ══════════════════════════════════════════════════════════
   NOTICIAS
══════════════════════════════════════════════════════════ */

// GET /api/noticias?estado=&categoria=&page&limit
exports.getNoticias = async (req, res) => {
    try {
        const { estado, categoria, page = 1, limit = 10 } = req.query;
        const filtro = {};
        if (estado)    filtro.estado    = estado;
        if (categoria) filtro.categoria = categoria;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [noticias, total] = await Promise.all([
            Noticia.find(filtro)
                .populate('autor', 'nombre')
                .sort({ createdAt: -1 })
                .skip(skip).limit(parseInt(limit)),
            Noticia.countDocuments(filtro),
        ]);
        res.json({ noticias, total, totalPaginas: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener noticias.' });
    }
};

// POST /api/noticias
exports.crearNoticia = async (req, res) => {
    try {
        const { titulo, contenido, resumen, categoria, estado } = req.body;

        if (!titulo || !contenido || !categoria)
            return res.status(400).json({ msg: 'Título, contenido y categoría son obligatorios.' });
        if (titulo.length > 200)
            return res.status(400).json({ msg: 'El título no puede superar 200 caracteres.' });

        const estadoFinal = estado || 'borrador';
        const noticia = await Noticia.create({
            titulo:           titulo.trim(),
            contenido:        contenido.trim(),
            resumen:          resumen?.trim() || '',
            categoria,
            estado:           estadoFinal,
            autor:            req.usuario.id,
            fechaPublicacion: estadoFinal === 'publicada' ? new Date() : null,
            imagen: req.file ? req.file.path : '',
        });
        res.status(201).json({ msg: 'Noticia creada.', noticia });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al crear noticia.' });
    }
};

// PUT /api/noticias/:id
exports.actualizarNoticia = async (req, res) => {
    try {
        const adminId    = req.usuario?.id    || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        const noticia = await Noticia.findById(req.params.id);
        if (!noticia) return res.status(404).json({ msg: 'Noticia no encontrada.' });

        const estadoAnterior = noticia.estado;

        const { titulo, contenido, resumen, categoria, estado } = req.body;
        if (titulo)    noticia.titulo    = titulo.trim();
        if (contenido) noticia.contenido = contenido.trim();
        if (resumen !== undefined) noticia.resumen = resumen.trim();
        if (categoria) noticia.categoria = categoria;

        if (estado && estado !== noticia.estado) {
            noticia.estado = estado;
            if (estado === 'publicada' && !noticia.fechaPublicacion)
                noticia.fechaPublicacion = new Date();
        }
        if (req.file) {
            noticia.imagen = req.file.path;
        }
        await noticia.save();

        // Auditar solo si cambió el estado
        if (noticia.estado !== estadoAnterior) {
            await AuditoriaLog.create({
                usuarioId:         String(adminId),
                usuarioEmail:      adminEmail,
                rol:               'admin',
                accion:            'CAMBIAR_ESTADO_NOTICIA',
                modulo:            'Noticias',
                coleccionAfectada: 'noticias',
                descripcion:       `Noticia "${noticia.titulo}" cambió de estado: ${estadoAnterior} → ${noticia.estado}.`,
                ip:                req.ip || 'desconocida',
            }).catch(() => {});
        }

        res.json({ msg: 'Noticia actualizada.', noticia });
    } catch (err) {
        console.error(err);
        await AuditoriaError.create({
            usuarioId:    String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol:          'admin',
            accion:       'ACTUALIZAR_NOTICIA',
            modulo:       'Noticias',
            mensajeError: err.message,
            ip:           req.ip || 'desconocida',
        }).catch(() => {});
        res.status(500).json({ msg: 'Error al actualizar noticia.' });
    }
};

// DELETE /api/noticias/:id
exports.eliminarNoticia = async (req, res) => {
    try {
        const adminId    = req.usuario?.id    || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        const noticia = await Noticia.findById(req.params.id);
        if (!noticia) return res.status(404).json({ msg: 'Noticia no encontrada.' });

        borrarImagen(noticia.imagen);
        await Noticia.deleteOne({ _id: noticia._id });

        await AuditoriaLog.create({
            usuarioId:         String(adminId),
            usuarioEmail:      adminEmail,
            rol:               'admin',
            accion:            'ELIMINAR_NOTICIA',
            modulo:            'Noticias',
            coleccionAfectada: 'noticias',
            descripcion:       `Noticia eliminada: "${noticia.titulo}" (categoría: ${noticia.categoria}, estado: ${noticia.estado}).`,
            ip:                req.ip || 'desconocida',
        }).catch(() => {});

        res.json({ msg: 'Noticia eliminada.' });
    } catch (err) {
        await AuditoriaError.create({
            usuarioId:    String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol:          'admin',
            accion:       'ELIMINAR_NOTICIA',
            modulo:       'Noticias',
            mensajeError: err.message,
            ip:           req.ip || 'desconocida',
        }).catch(() => {});
        res.status(500).json({ msg: 'Error al eliminar noticia.' });
    }
};
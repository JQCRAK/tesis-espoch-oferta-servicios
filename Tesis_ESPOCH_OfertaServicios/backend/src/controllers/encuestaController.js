const Encuesta = require('../models/Encuesta');
const Pregunta = require('../models/Pregunta');
const RespuestaEncuesta = require('../models/RespuestaEncuesta');
const Graduado = require('../models/Graduado');
const Notificacion = require('../models/Notificacion');
const { enviarNotificacionEncuesta } = require('../services/emailEncuestaService');
const { AuditoriaLog, AuditoriaError } = require('../models/Auditoria');
const RespuestaEmpleador = require('../models/RespuestaEmpleador');


// ═══════════════════════════════════════════════════════════
// CREAR ENCUESTA
// ═══════════════════════════════════════════════════════════
const crearEncuesta = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id;
        if (!adminId) return res.status(401).json({ msg: 'Usuario no autenticado' });

        const { titulo, descripcion, consentimientoInformado, tipo, fechaInicio, fechaCierre } = req.body;

        if (!titulo || !tipo || !fechaInicio || !fechaCierre)
            return res.status(400).json({ msg: 'Campos obligatorios faltantes' });

        if (new Date(fechaCierre) <= new Date(fechaInicio))
            return res.status(400).json({ msg: 'Fecha de cierre debe ser posterior a inicio' });

        const nuevaEncuesta = new Encuesta({
            titulo,
            descripcion: descripcion || '',
            consentimientoInformado: consentimientoInformado || '',
            tipo: tipo || 'graduados',
            estado: 'borrador',
            fechaInicio,
            fechaCierre,
            creadoPor: adminId,
            totalRespuestas: 0,
            porcentajeRespuestas: 0,
            respondieron: []
        });

        await nuevaEncuesta.save();
        res.status(201).json({ msg: 'Encuesta creada correctamente', encuesta: nuevaEncuesta });
    } catch (error) {
        console.error('Error en crearEncuesta:', error);
        res.status(500).json({ msg: 'Error al crear encuesta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// LISTAR ENCUESTAS (Admin)
// ═══════════════════════════════════════════════════════════
const listarEncuestas = async (req, res) => {
    try {
        const { tipo, estado, buscar, page = 1, limit = 10 } = req.query;

        // ── Actualizar encuestas cuya fecha de cierre ya pasó ──
        const now = new Date();
        await Encuesta.updateMany(
            { estado: 'activa', fechaCierre: { $lte: now } },
            { $set: { estado: 'cerrada' } }
        );

        const filtro = {};
        if (tipo) filtro.tipo = tipo;
        if (estado) filtro.estado = estado;
        if (buscar) filtro.titulo = { $regex: buscar, $options: 'i' };

        const skip = (page - 1) * limit;
        const encuestas = await Encuesta.find(filtro)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Encuesta.countDocuments(filtro);
        res.json({ encuestas, total, paginas: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error en listarEncuestas:', error);
        res.status(500).json({ msg: 'Error al listar encuestas', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// LISTAR ENCUESTAS ACTIVAS PARA EL GRADUADO AUTENTICADO
// GET /api/graduado/encuestas
// ═══════════════════════════════════════════════════════════
const listarEncuestasGraduado = async (req, res) => {
    try {
        const graduadoId = req.usuario?.id || req.usuario?._id;
        if (!graduadoId) return res.status(401).json({ msg: 'No autenticado' });

        const graduado = await Graduado.findById(graduadoId).select('tesisVerificada');
        if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado' });

        if (!graduado.tesisVerificada) {
            return res.json({ encuestas: [], tesisVerificada: false });
        }

        // Traer todas las encuestas de graduados (activas y cerradas)
        const encuestas = await Encuesta.find({
            estado: { $in: ['activa', 'cerrada'] },
            tipo: 'graduados',
        })
            .select('titulo descripcion fechaInicio fechaCierre estado totalRespuestas consentimientoInformado')
            .sort({ createdAt: -1 });

        const resultados = await Promise.all(
            encuestas.map(async (enc) => {
                const respuesta = await RespuestaEncuesta.findOne({
                    encuesta: enc._id,
                    graduado: graduadoId,
                    estado: 'completada',
                });
                const totalPreguntas = await Pregunta.countDocuments({
                    encuesta: enc._id,
                    tipo: { $ne: 'titulo' }  // excluir títulos de sección
                });


                // ── FILTRO CLAVE ──────────────────────────────────────
                // Encuesta cerrada que el graduado NO respondió → no mostrar
                if (enc.estado === 'cerrada' && !respuesta) return null;
                // ─────────────────────────────────────────────────────

                return {
                    ...enc.toObject(),
                    yaRespondio: !!respuesta,
                    estadoRespuesta: respuesta?.estado || null,
                    totalPreguntas,
                };
            })
        );

        // Quitar los nulls (encuestas cerradas no respondidas)
        const filtradas = resultados.filter(Boolean);

        res.json({ encuestas: filtradas, tesisVerificada: true });
    } catch (error) {
        console.error('Error en listarEncuestasGraduado:', error);
        res.status(500).json({ msg: 'Error al cargar encuestas', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// OBTENER ENCUESTA POR ID
// ═══════════════════════════════════════════════════════════
const obtenerEncuesta = async (req, res) => {
    try {
        const { id } = req.params;
        const encuesta = await Encuesta.findById(id).populate('creadoPor', 'nombre email');
        if (!encuesta) return res.status(404).json({ msg: 'Encuesta no encontrada' });
        res.json(encuesta);
    } catch (error) {
        console.error('Error en obtenerEncuesta:', error);
        res.status(500).json({ msg: 'Error al obtener encuesta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR ENCUESTA
// ═══════════════════════════════════════════════════════════
const actualizarEncuesta = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';
        const { titulo, descripcion, consentimientoInformado, estado, fechaInicio, fechaCierre } = req.body;

        const encuesta = await Encuesta.findById(id);
        if (!encuesta) return res.status(404).json({ msg: 'Encuesta no encontrada' });

        if (estado) {
            const estadosValidos = ['borrador', 'activa', 'cerrada'];
            if (!estadosValidos.includes(estado))
                return res.status(400).json({ msg: 'Estado inválido' });
        }

        if (fechaInicio && fechaCierre) {
            if (new Date(fechaCierre) <= new Date(fechaInicio))
                return res.status(400).json({ msg: 'Fecha de cierre debe ser posterior a inicio' });
        }

        const estadoAnterior = encuesta.estado;

        if (titulo) encuesta.titulo = titulo;
        if (descripcion !== undefined) encuesta.descripcion = descripcion;
        if (consentimientoInformado !== undefined) encuesta.consentimientoInformado = consentimientoInformado;
        if (estado) encuesta.estado = estado;
        if (fechaInicio) encuesta.fechaInicio = fechaInicio;
        if (fechaCierre) encuesta.fechaCierre = fechaCierre;

        await encuesta.save();

        // ── Auditar solo si cambió el estado a cerrada ──
        if (estado && estado !== estadoAnterior) {
            await AuditoriaLog.create({
                usuarioId: String(adminId),
                usuarioEmail: adminEmail,
                rol: 'admin',
                accion: 'CAMBIAR_ESTADO_ENCUESTA',
                modulo: 'Encuestas',
                coleccionAfectada: 'encuestas',
                descripcion: `Encuesta "${encuesta.titulo}" cambió de estado: ${estadoAnterior} → ${estado}.`,
                ip: req.ip || 'desconocida',
            }).catch(() => { });
        }

        res.json({ msg: 'Encuesta actualizada', encuesta });
    } catch (error) {
        console.error('Error en actualizarEncuesta:', error);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'ACTUALIZAR_ENCUESTA',
            modulo: 'Encuestas',
            mensajeError: error.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error al actualizar encuesta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// DUPLICAR ENCUESTA
// ═══════════════════════════════════════════════════════════
const duplicarEncuesta = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevoTitulo } = req.body;
        const adminId = req.usuario?.id || req.usuario?._id;

        const encuestaOriginal = await Encuesta.findById(id);
        if (!encuestaOriginal) return res.status(404).json({ msg: 'Encuesta original no encontrada' });

        const nuevaEncuesta = new Encuesta({
            titulo: nuevoTitulo || `Copia de ${encuestaOriginal.titulo}`,
            descripcion: encuestaOriginal.descripcion,
            consentimientoInformado: encuestaOriginal.consentimientoInformado,
            tipo: encuestaOriginal.tipo,
            estado: 'borrador',
            fechaInicio: new Date(),
            fechaCierre: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            creadoPor: adminId,
            totalRespuestas: 0,
            porcentajeRespuestas: 0,
            respondieron: []
        });

        await nuevaEncuesta.save();

        const preguntasOriginales = await Pregunta.find({ encuesta: id });
        const preguntasNuevas = preguntasOriginales.map(p => ({
            ...p.toObject(),
            _id: undefined,
            encuesta: nuevaEncuesta._id
        }));

        if (preguntasNuevas.length > 0) await Pregunta.insertMany(preguntasNuevas);

        res.json({ msg: 'Encuesta duplicada correctamente', encuesta: nuevaEncuesta });
    } catch (error) {
        console.error('Error en duplicarEncuesta:', error);
        res.status(500).json({ msg: 'Error al duplicar encuesta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR ENCUESTA
// ═══════════════════════════════════════════════════════════
const eliminarEncuesta = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        const encuesta = await Encuesta.findById(id);
        if (!encuesta) return res.status(404).json({ msg: 'Encuesta no encontrada' });

        const snapshot = {
            titulo: encuesta.titulo,
            tipo: encuesta.tipo,
            estado: encuesta.estado,
            totalRespuestas: encuesta.totalRespuestas,
        };

        const [totalGraduados, totalEmpleadores] = await Promise.all([
            RespuestaEncuesta.countDocuments({ encuesta: id }),
            RespuestaEmpleador.countDocuments({ encuesta: id }),
        ]);

        await Encuesta.findByIdAndDelete(id);
        await Pregunta.deleteMany({ encuesta: id });
        await RespuestaEncuesta.deleteMany({ encuesta: id });
        await RespuestaEmpleador.deleteMany({ encuesta: id });
        await Notificacion.deleteMany({ encuesta: id });

        await AuditoriaLog.create({
            usuarioId: String(adminId),
            usuarioEmail: adminEmail,
            rol: 'admin',
            accion: 'ELIMINAR_ENCUESTA',
            modulo: 'Encuestas',
            coleccionAfectada: 'encuestas',
            descripcion: `Encuesta eliminada: "${snapshot.titulo}" (tipo: ${snapshot.tipo}, estado: ${snapshot.estado}). Se eliminaron ${totalGraduados} respuestas de graduados y ${totalEmpleadores} respuestas de empleadores.`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({ msg: 'Encuesta eliminada correctamente' });
    } catch (error) {
        console.error('Error en eliminarEncuesta:', error);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'ELIMINAR_ENCUESTA',
            modulo: 'Encuestas',
            mensajeError: error.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error al eliminar encuesta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// NOTIFICAR GRADUADOS — NUEVO
// POST /api/encuestas/:id/notificar
// Solo encuestas activas. Solo graduados con tesisVerificada=true.
// Crea notificación en BD + envía email a emailPersonal.
// ═══════════════════════════════════════════════════════════
const notificarGraduados = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        const encuesta = await Encuesta.findById(id);
        if (!encuesta) return res.status(404).json({ msg: 'Encuesta no encontrada' });

        if (encuesta.estado !== 'activa')
            return res.status(400).json({ msg: 'Solo se puede notificar en encuestas activas' });

        const graduados = await Graduado.find({ tesisVerificada: true })
            .select('_id nombres emailPersonal');

        if (graduados.length === 0)
            return res.status(404).json({ msg: 'No hay graduados con tesis verificada' });

        const resumen = {
            total: graduados.length,
            notificacionesCreadas: 0,
            emailsEnviados: 0,
            emailsFallidos: 0,
        };

        for (const graduado of graduados) {
            try {
                const yaNotificado = await Notificacion.findOne({
                    graduado: graduado._id,
                    encuesta: encuesta._id,
                    leido: false,
                });

                if (!yaNotificado) {
                    await Notificacion.create({
                        graduado: graduado._id,
                        tipo: 'encuesta',
                        titulo: '📋 Nueva encuesta disponible',
                        mensaje: `Tienes una encuesta pendiente: "${encuesta.titulo}". Por favor complétala antes del ${new Date(encuesta.fechaCierre).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
                        encuesta: encuesta._id,
                    });
                    resumen.notificacionesCreadas++;
                }
            } catch (notifError) {
                console.error(`Error creando notificación para ${graduado._id}:`, notifError.message);
            }

            const resultado = await enviarNotificacionEncuesta({
                emailPersonal: graduado.emailPersonal,
                nombres: graduado.nombres?.split(' ')[0] || graduado.nombres,
                tituloEncuesta: encuesta.titulo,
                fechaCierre: encuesta.fechaCierre,
            });

            if (resultado.exito) resumen.emailsEnviados++;
            else {
                resumen.emailsFallidos++;
                console.warn(`Email fallido para ${graduado.emailPersonal}: ${resultado.error}`);
            }
        }

        console.log(`[notificarGraduados] Encuesta: ${encuesta.titulo}`);
        console.log(`  Graduados notificados: ${resumen.total}`);
        console.log(`  Notificaciones BD creadas: ${resumen.notificacionesCreadas}`);
        console.log(`  Emails enviados: ${resumen.emailsEnviados}`);
        console.log(`  Emails fallidos: ${resumen.emailsFallidos}`);

        // ── Auditoría ──────────────────────────────────────────
        await AuditoriaLog.create({
            usuarioId: String(adminId),
            usuarioEmail: adminEmail,
            rol: 'admin',
            accion: 'NOTIFICAR_GRADUADOS',
            modulo: 'Encuestas',
            coleccionAfectada: 'graduados',
            descripcion: `Notificación enviada para encuesta "${encuesta.titulo}". Total: ${resumen.total}, emails enviados: ${resumen.emailsEnviados}, fallidos: ${resumen.emailsFallidos}.`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({
            msg: `Notificación enviada a ${resumen.total} graduados`,
            resumen,
        });
    } catch (error) {
        console.error('Error en notificarGraduados:', error);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'NOTIFICAR_GRADUADOS',
            modulo: 'Encuestas',
            mensajeError: error.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error al notificar graduados', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// CREAR PREGUNTA
// ═══════════════════════════════════════════════════════════
const crearPregunta = async (req, res) => {
    try {
        const { encuestaId } = req.params;
        const {
            texto, tipo, opciones,
            escalaMin, escalaMax, escalaEtiquetas,
            obligatoria, orden, seccion,
            esMatriz, items, descripcionMatriz, etiquetaMin, etiquetaMax,
            tieneCondicional,
            preguntasCondicionalSi, tiposCondicionalSi, opcionesCondicionalSi,
            preguntasCondicionalNo, tiposCondicionalNo, opcionesCondicionalNo,
        } = req.body;

        const encuesta = await Encuesta.findById(encuestaId);
        if (!encuesta) return res.status(404).json({ msg: 'Encuesta no encontrada' });

        const totalPreguntas = await Pregunta.countDocuments({
    encuesta: encuestaId,
    tipo: { $ne: 'titulo' }
});


        const nuevaPregunta = new Pregunta({
            encuesta: encuestaId,
            texto,
            tipo: tipo || 'opcion_multiple',
            opciones: opciones || [],
            escalaMin: escalaMin || 1,
            escalaMax: escalaMax || 5,
            escalaEtiquetas: escalaEtiquetas || { min: '', max: '' },
            obligatoria: obligatoria !== undefined ? obligatoria : true,
            orden: orden !== undefined ? orden : totalPreguntas,
            seccion: seccion || '',
            esMatriz: esMatriz || false,
            items: items || [],
            descripcionMatriz: descripcionMatriz || '',
            etiquetaMin: etiquetaMin || '',
            etiquetaMax: etiquetaMax || '',
            tieneCondicional: tieneCondicional || false,
            preguntasCondicionalSi: preguntasCondicionalSi || [],
            tiposCondicionalSi: tiposCondicionalSi || [],
            opcionesCondicionalSi: opcionesCondicionalSi || [],
            preguntasCondicionalNo: preguntasCondicionalNo || [],
            tiposCondicionalNo: tiposCondicionalNo || [],
            opcionesCondicionalNo: opcionesCondicionalNo || [],
        });

        await nuevaPregunta.save();
        res.status(201).json({ msg: 'Pregunta creada', pregunta: nuevaPregunta });
    } catch (error) {
        console.error('Error en crearPregunta:', error);
        res.status(500).json({ msg: 'Error al crear pregunta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// OBTENER PREGUNTAS DE ENCUESTA
// ═══════════════════════════════════════════════════════════
const obtenerPreguntas = async (req, res) => {
    try {
        const { encuestaId } = req.params;
        const preguntas = await Pregunta.find({ encuesta: encuestaId }).sort({ orden: 1 });
        res.json(preguntas);
    } catch (error) {
        console.error('Error en obtenerPreguntas:', error);
        res.status(500).json({ msg: 'Error al obtener preguntas', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR PREGUNTA
// ═══════════════════════════════════════════════════════════
const actualizarPregunta = async (req, res) => {
    try {
        const { preguntaId } = req.params;
        const {
            texto, tipo, opciones,
            escalaMin, escalaMax, obligatoria, orden,
            esMatriz, items, descripcionMatriz, etiquetaMin, etiquetaMax,
            tieneCondicional,
            preguntasCondicionalSi, tiposCondicionalSi, opcionesCondicionalSi,
            preguntasCondicionalNo, tiposCondicionalNo, opcionesCondicionalNo,
        } = req.body;

        const pregunta = await Pregunta.findById(preguntaId);
        if (!pregunta) return res.status(404).json({ msg: 'Pregunta no encontrada' });

        if (texto !== undefined) pregunta.texto = texto;
        if (tipo !== undefined) pregunta.tipo = tipo;
        if (opciones !== undefined) pregunta.opciones = opciones;
        if (escalaMin !== undefined) pregunta.escalaMin = escalaMin;
        if (escalaMax !== undefined) pregunta.escalaMax = escalaMax;
        if (obligatoria !== undefined) pregunta.obligatoria = obligatoria;
        if (orden !== undefined) pregunta.orden = orden;
        if (esMatriz !== undefined) pregunta.esMatriz = esMatriz;
        if (items !== undefined) pregunta.items = items;
        if (descripcionMatriz !== undefined) pregunta.descripcionMatriz = descripcionMatriz;
        if (etiquetaMin !== undefined) pregunta.etiquetaMin = etiquetaMin;
        if (etiquetaMax !== undefined) pregunta.etiquetaMax = etiquetaMax;
        if (tieneCondicional !== undefined) pregunta.tieneCondicional = tieneCondicional;
        if (preguntasCondicionalSi !== undefined) pregunta.preguntasCondicionalSi = preguntasCondicionalSi;
        if (tiposCondicionalSi !== undefined) pregunta.tiposCondicionalSi = tiposCondicionalSi;
        if (opcionesCondicionalSi !== undefined) pregunta.opcionesCondicionalSi = opcionesCondicionalSi;
        if (preguntasCondicionalNo !== undefined) pregunta.preguntasCondicionalNo = preguntasCondicionalNo;
        if (tiposCondicionalNo !== undefined) pregunta.tiposCondicionalNo = tiposCondicionalNo;
        if (opcionesCondicionalNo !== undefined) pregunta.opcionesCondicionalNo = opcionesCondicionalNo;

        await pregunta.save();
        res.json({ msg: 'Pregunta actualizada', pregunta });
    } catch (error) {
        console.error('Error en actualizarPregunta:', error);
        res.status(500).json({ msg: 'Error al actualizar pregunta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR PREGUNTA
// ═══════════════════════════════════════════════════════════
const eliminarPregunta = async (req, res) => {
    try {
        const { preguntaId } = req.params;
        const pregunta = await Pregunta.findByIdAndDelete(preguntaId);
        if (!pregunta) return res.status(404).json({ msg: 'Pregunta no encontrada' });
        res.json({ msg: 'Pregunta eliminada' });
    } catch (error) {
        console.error('Error en eliminarPregunta:', error);
        res.status(500).json({ msg: 'Error al eliminar pregunta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// GUARDAR RESPUESTA (Graduado)
// ═══════════════════════════════════════════════════════════
const guardarRespuesta = async (req, res) => {
    try {
        const { encuestaId } = req.params;
        const { respuestas, aceptoConsentimiento } = req.body;
        const graduadoId = req.usuario?.id || req.usuario?._id;

        if (!graduadoId) return res.status(401).json({ msg: 'Usuario no autenticado' });

        // ── Verificar doble respuesta ──────────────────────────
        const yaRespondio = await RespuestaEncuesta.findOne({
            encuesta: encuestaId,
            graduado: graduadoId,
        });
        if (yaRespondio) return res.status(400).json({ msg: 'Ya has respondido esta encuesta' });

        // ── No aceptó consentimiento ───────────────────────────
        if (!aceptoConsentimiento) {
            await RespuestaEncuesta.create({
                encuesta: encuestaId,
                graduado: graduadoId,
                aceptoConsentimiento: false,
                respuestas: [],
                estado: 'no_consintio',
            });

            // ── Marcar notificación como leída aunque no consintió ──
            await Notificacion.updateMany(
                { graduado: graduadoId, encuesta: encuestaId, leido: false },
                { leido: true, fechaLeido: new Date() }
            );

            return res.json({ msg: 'Participación registrada como no consentida' });
        }

        // ── Cargar preguntas para mapear claves ────────────────
        const preguntas = await Pregunta.find({ encuesta: encuestaId }).sort({ orden: 1 });

        // ── Convertir objeto plano {clave: valor} a array estructurado ──
        // El frontend envía un objeto donde las claves pueden ser:
        //   pregId                  → pregunta normal
        //   pregId_item_N           → fila N de una matriz
        //   pregId_si_N             → sub-pregunta condicional "Sí", índice N
        //   pregId_no_N             → sub-pregunta condicional "No", índice N
        const respuestasArray = [];

        for (const preg of preguntas) {
            if (preg.tipo === 'titulo') continue; // los títulos no se guardan

            const pregId = preg._id.toString();

            if (preg.esMatriz && preg.items && preg.items.length > 0) {
                // ── MATRIZ: guardar fila por fila ──
                const filasRespondidas = [];
                preg.items.forEach((item, idx) => {
                    const clave = `${pregId}_item_${idx}`;
                    if (respuestas[clave] !== undefined && respuestas[clave] !== null && respuestas[clave] !== '') {
                        filasRespondidas.push({ item, indice: idx, valor: respuestas[clave] });
                    }
                });
                respuestasArray.push({
                    pregunta: preg._id,
                    respuesta: filasRespondidas, // array de { item, indice, valor }
                });
            } else {
                // ── PREGUNTA NORMAL ──
                const valor = respuestas[pregId];
                respuestasArray.push({
                    pregunta: preg._id,
                    respuesta: valor !== undefined ? valor : null,
                });

                // ── CONDICIONALES (si_no) ──
                if (preg.tipo === 'si_no' && preg.tieneCondicional) {
                    const ladoElegido = valor; // 'Sí' o 'No'

                    if (ladoElegido === 'Sí' && preg.preguntasCondicionalSi?.length > 0) {
                        preg.preguntasCondicionalSi.forEach((textoSub, j) => {
                            const clave = `${pregId}_si_${j}`;
                            respuestasArray.push({
                                pregunta: preg._id,
                                esCondicional: true,
                                ladoCondicional: 'si',
                                indiceCondicional: j,
                                textoSubPregunta: textoSub,
                                respuesta: respuestas[clave] !== undefined ? respuestas[clave] : null,
                            });
                        });
                    }

                    if (ladoElegido === 'No' && preg.preguntasCondicionalNo?.length > 0) {
                        preg.preguntasCondicionalNo.forEach((textoSub, j) => {
                            const clave = `${pregId}_no_${j}`;
                            respuestasArray.push({
                                pregunta: preg._id,
                                esCondicional: true,
                                ladoCondicional: 'no',
                                indiceCondicional: j,
                                textoSubPregunta: textoSub,
                                respuesta: respuestas[clave] !== undefined ? respuestas[clave] : null,
                            });
                        });
                    }
                }
            }
        }

        // ── Guardar ────────────────────────────────────────────
        await RespuestaEncuesta.create({
            encuesta: encuestaId,
            graduado: graduadoId,
            aceptoConsentimiento: true,
            respuestas: respuestasArray,
            estado: 'completada',
        });

        // ── Actualizar contadores en la encuesta ───────────────
        const encuesta = await Encuesta.findById(encuestaId);
        encuesta.totalRespuestas = (encuesta.totalRespuestas || 0) + 1;
        if (!encuesta.respondieron.includes(graduadoId)) encuesta.respondieron.push(graduadoId);
        const totalGraduados = await Graduado.countDocuments({ tesisVerificada: true });
        encuesta.porcentajeRespuestas = totalGraduados > 0
            ? Math.round((encuesta.totalRespuestas / totalGraduados) * 100)
            : 0;
        await encuesta.save();

        // ── Marcar notificación como leída ─────────────────────
        await Notificacion.updateMany(
            { graduado: graduadoId, encuesta: encuestaId, leido: false },
            { leido: true, fechaLeido: new Date() }
        );

        res.json({ msg: 'Respuesta guardada correctamente' });
    } catch (error) {
        console.error('Error en guardarRespuesta:', error);
        res.status(500).json({ msg: 'Error al guardar respuesta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// VERIFICAR SI RESPONDIÓ
// ═══════════════════════════════════════════════════════════
const verificarRespuesta = async (req, res) => {
    try {
        const { encuestaId } = req.params;
        const graduadoId = req.usuario?.id || req.usuario?._id;

        if (!graduadoId) return res.status(401).json({ msg: 'Usuario no autenticado' });

        const respuesta = await RespuestaEncuesta.findOne({ encuesta: encuestaId, graduado: graduadoId });
        res.json({
            yaRespondio: !!respuesta,
            estado: respuesta?.estado || null
        });
    } catch (error) {
        console.error('Error en verificarRespuesta:', error);
        res.status(500).json({ msg: 'Error al verificar respuesta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// OBTENER RESPUESTAS (Admin)
// ═══════════════════════════════════════════════════════════
const obtenerRespuestas = async (req, res) => {
    try {
        const { encuestaId } = req.params;
        const respuestas = await RespuestaEncuesta.find({ encuesta: encuestaId })
            .populate('graduado', 'nombres apellidos email')
            .sort({ fechaRespuesta: -1 });

        res.json({ respuestas });
    } catch (error) {
        console.error('Error en obtenerRespuestas:', error);
        res.status(500).json({ msg: 'Error al obtener respuestas', error: error.message });
    }
};
const crypto = require('crypto');
const Empleador = require('../models/Empleador');
const { enviarNotificacionEmpleador } = require('../services/emailEmpleadorService');

const notificarEmpleadores = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        const encuesta = await Encuesta.findById(id);
        if (!encuesta) return res.status(404).json({ msg: 'Encuesta no encontrada' });
        if (encuesta.estado !== 'activa')
            return res.status(400).json({ msg: 'Solo se puede notificar en encuestas activas' });

        const empleadores = await Empleador.find({ activo: true })
            .select('_id nombreEmpresa emailOrganizacion tokenEncuesta tokenUsado tokenExpira encuestaAsociada');

        if (empleadores.length === 0)
            return res.status(404).json({ msg: 'No hay empleadores registrados' });

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resumen = {
            total: empleadores.length,
            omitidos: 0,
            emailsEnviados: 0,
            emailsFallidos: 0,
        };

        for (const emp of empleadores) {
            const mismaEncuesta = emp.encuestaAsociada?.toString() === id;

            // ── CASO 1: ya respondió → skip ──
            if (mismaEncuesta && emp.tokenUsado) {
                resumen.omitidos++;
                console.log(`[notificarEmpleadores] Skip ${emp.nombreEmpresa} — ya respondió`);
                continue;
            }

            // ── CASO 2: token vigente para esta encuesta → reusar ──
            const tieneTokenVigente =
                mismaEncuesta &&
                emp.tokenEncuesta &&
                !emp.tokenUsado &&
                emp.tokenExpira &&
                new Date(emp.tokenExpira) > new Date();

            let token;
            if (tieneTokenVigente) {
                token = emp.tokenEncuesta;
                console.log(`[notificarEmpleadores] Reusando token para ${emp.nombreEmpresa}`);
            } else {
                // ── CASO 3: encuesta distinta o token expirado → nuevo ──
                token = crypto.randomBytes(32).toString('hex');
                emp.tokenEncuesta = token;
                emp.tokenExpira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                emp.tokenUsado = false;
                emp.encuestaAsociada = encuesta._id;
                await emp.save();
                console.log(`[notificarEmpleadores] Nuevo token para ${emp.nombreEmpresa}`);
            }

            const linkEncuesta = `${FRONTEND_URL}/encuesta-empleador?token=${token}`;

            const resultado = await enviarNotificacionEmpleador({
                emailOrganizacion: emp.emailOrganizacion,
                nombreEmpresa: emp.nombreEmpresa,
                tituloEncuesta: encuesta.titulo,
                fechaCierre: encuesta.fechaCierre,
                linkEncuesta,
            });

            if (resultado.exito) resumen.emailsEnviados++;
            else resumen.emailsFallidos++;
        }

        console.log(`[notificarEmpleadores] Encuesta: ${encuesta.titulo}`);
        console.log(`  Total empleadores: ${resumen.total}`);
        console.log(`  Omitidos (ya respondieron): ${resumen.omitidos}`);
        console.log(`  Emails enviados: ${resumen.emailsEnviados}`);
        console.log(`  Emails fallidos: ${resumen.emailsFallidos}`);

        // ── Auditoría ──────────────────────────────────────────
        await AuditoriaLog.create({
            usuarioId: String(adminId),
            usuarioEmail: adminEmail,
            rol: 'admin',
            accion: 'NOTIFICAR_EMPLEADORES',
            modulo: 'Encuestas',
            coleccionAfectada: 'empleadors',
            descripcion: `Notificación enviada para encuesta "${encuesta.titulo}". Total: ${resumen.total}, enviados: ${resumen.emailsEnviados}, omitidos (ya respondieron): ${resumen.omitidos}, fallidos: ${resumen.emailsFallidos}.`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({
            msg: `Notificación enviada. ${resumen.emailsEnviados} emails enviados, ${resumen.omitidos} omitidos por ya haber respondido.`,
            resumen,
        });
    } catch (error) {
        console.error('Error en notificarEmpleadores:', error);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'NOTIFICAR_EMPLEADORES',
            modulo: 'Encuestas',
            mensajeError: error.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error al notificar empleadores', error: error.message });
    }
};
module.exports = {
    crearEncuesta,
    listarEncuestas,
    listarEncuestasGraduado,
    obtenerEncuesta,
    actualizarEncuesta,
    duplicarEncuesta,
    eliminarEncuesta,
    notificarGraduados,
    notificarEmpleadores,
    crearPregunta,
    obtenerPreguntas,
    actualizarPregunta,
    eliminarPregunta,
    guardarRespuesta,
    verificarRespuesta,
    obtenerRespuestas,
};
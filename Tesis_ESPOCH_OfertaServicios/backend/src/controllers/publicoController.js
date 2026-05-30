// backend/src/controllers/publicoController.js
const Graduado         = require('../models/Graduado');
const Proyecto         = require('../models/Proyecto');
const Certificado      = require('../models/Certificado');
const Tesis            = require('../models/Tesis');
const TendenciaSemanal = require('../models/TendenciaSemanal');
const { CATALOGO }     = require('./tendenciaController');

// ── Rate limiting manual por IP (sin dependencias externas) ──
const intentosPorIP = new Map();
const RATE_VENTANA  = 60 * 60 * 1000; // 1 hora
const RATE_LIMITE   = 10;             // máx 10 solicitudes por hora por IP

// ─────────────────────────────────────────────
function getSemanaISO(date = new Date()) {
    const d      = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return {
        semana: Math.ceil((((d - yearStart) / 86400000) + 1) / 7),
        anio:   d.getUTCFullYear(),
    };
}
function elegirCategoriaPorSemana(semana) {
    return CATALOGO[semana % CATALOGO.length];
}

// ═══════════════════════════════════════════════════════════
// GET /api/publico/graduados
// ═══════════════════════════════════════════════════════════
exports.listarGraduadosPublicos = async (req, res) => {
    try {
        const graduados = await Graduado.find({
            perfilPublico:   true,
            tesisVerificada: true,
        })
        .select('nombres apellidos fotoPerfil bio tecnologias afinidades habilidadesBlandas disponibilidad ciudad')
        .sort({ updatedAt: -1 });
        res.json(graduados);
    } catch (error) {
        console.error('Error listarGraduadosPublicos:', error);
        res.status(500).json({ msg: 'Error al obtener graduados.' });
    }
};

// ═══════════════════════════════════════════════════════════
// GET /api/publico/graduado/:id
// ═══════════════════════════════════════════════════════════
exports.getPerfilPublico = async (req, res) => {
    try {
        const graduado = await Graduado.findOne({
            _id:             req.params.id,
            perfilPublico:   true,
            tesisVerificada: true,
        }).select(
            'nombres apellidos fotoPerfil bio tecnologias afinidades ' +
            'habilidadesBlandas disponibilidad ciudad github linkedin ' +
            'perfilCompletado anioGraduacion updatedAt'
        );
        if (!graduado)
            return res.status(404).json({ msg: 'Perfil no encontrado o no disponible.' });

        const proyectos    = await Proyecto.find({ graduado: graduado._id, activo: true })
            .select('titulo descripcion tecnologias urlRepositorio imagen fechaRealizacion')
            .sort({ fechaRealizacion: -1 });
        const certificados = await Certificado.find({ graduado: graduado._id })
            .select('titulo institucion fechaFinalizacion url descripcion archivo tipoArchivo')
            .sort({ fechaFinalizacion: -1 });
        const tesis        = await Tesis.findOne({ graduado: graduado._id, verificada: true })
            .select('titulo tituloEncontrado resumen urlDspace autoresEncontrados fechaPublicacion');

        res.json({ graduado, proyectos, certificados, tesis: tesis || null });
    } catch (error) {
        console.error('Error getPerfilPublico:', error);
        res.status(500).json({ msg: 'Error al obtener el perfil.' });
    }
};

// ═══════════════════════════════════════════════════════════
// GET /api/publico/proyectos
// ═══════════════════════════════════════════════════════════
exports.listarProyectosPublicos = async (req, res) => {
    try {
        const { q = '', tech = '', todos = 'false', page = '1' } = req.query;
        const LIMIT      = 12;
        const pagina     = Math.max(1, parseInt(page) || 1);
        const skip       = (pagina - 1) * LIMIT;
        const busqueda   = q.trim();
        const techFiltro = tech.trim();

        const { semana, anio } = getSemanaISO();
        let tendencia = await TendenciaSemanal.findOne({ semana, anio });
        if (!tendencia) {
            const cat = elegirCategoriaPorSemana(semana);
            tendencia = await TendenciaSemanal.create({
                semana, anio,
                categoria:     cat.categoria,
                keywords:      cat.keywords,
                descripcion:   cat.descripcion,
                color:         cat.color,
                modoManual:    false,
                modificadoPor: 'sistema',
            });
        }

        const graduadosValidos = await Graduado.find({
            perfilPublico:   true,
            tesisVerificada: true,
        }).select('_id nombres apellidos fotoPerfil ciudad anioGraduacion afinidades').lean();

        if (graduadosValidos.length === 0) {
            return res.json({
                proyectos:       [],
                tendencia:       tendenciaResumen(tendencia, semana, anio),
                pillsTecnologia: [],
                total: 0, page: pagina, pages: 0,
            });
        }

        const graduadosMap = {};
        graduadosValidos.forEach(g => { graduadosMap[g._id.toString()] = g; });
        const idsValidos = graduadosValidos.map(g => g._id);

        let filtroBase = { graduado: { $in: idsValidos }, activo: true };

        if (busqueda) {
            filtroBase.$or = [
                { titulo:      { $regex: busqueda, $options: 'i' } },
                { tecnologias: { $regex: busqueda, $options: 'i' } },
            ];
        } else if (techFiltro) {
            filtroBase.tecnologias = { $regex: techFiltro, $options: 'i' };
        } else if (todos !== 'true' && tendencia.keywords?.length > 0) {
            filtroBase.$or = tendencia.keywords.map(kw => ({
                tecnologias: { $regex: kw, $options: 'i' },
            }));
        }

        let proyectosRaw = await Proyecto.find(filtroBase)
            .select('titulo descripcion tecnologias urlRepositorio imagen fechaRealizacion graduado')
            .sort({ fechaRealizacion: -1 })
            .lean();

        if (busqueda) {
            const rxBusq        = new RegExp(busqueda, 'i');
            const idsYaPasaron  = new Set(proyectosRaw.map(p => p._id.toString()));
            const idsGradConEsp = graduadosValidos
                .filter(g => rxBusq.test(g.afinidades?.[0]?.categoria || ''))
                .map(g => g._id);

            if (idsGradConEsp.length > 0) {
                const extraProys = await Proyecto.find({
                    graduado: { $in: idsGradConEsp },
                    activo:   true,
                    _id:      { $nin: [...idsYaPasaron] },
                })
                .select('titulo descripcion tecnologias urlRepositorio imagen fechaRealizacion graduado')
                .sort({ fechaRealizacion: -1 })
                .lean();
                proyectosRaw = [...proyectosRaw, ...extraProys];
            }
        }

        let usandoFallback = false;
        if (proyectosRaw.length === 0 && todos !== 'true' && !busqueda && !techFiltro) {
            usandoFallback = true;
            proyectosRaw   = await Proyecto.find({
                graduado: { $in: idsValidos }, activo: true,
            })
            .select('titulo descripcion tecnologias urlRepositorio imagen fechaRealizacion graduado')
            .sort({ fechaRealizacion: -1 })
            .lean();
        }

        const pillsTecnologia = calcularPills(proyectosRaw, tendencia.keywords || []);
        const total           = proyectosRaw.length;
        const pages           = Math.ceil(total / LIMIT) || 1;
        const proyectosPagina = proyectosRaw.slice(skip, skip + LIMIT);

        const proyectos = proyectosPagina.map(p => {
            const g = graduadosMap[p.graduado?.toString()];
            return {
                ...p,
                graduado: g ? {
                    _id:             g._id,
                    nombres:         g.nombres,
                    apellidos:       g.apellidos,
                    fotoPerfil:      g.fotoPerfil,
                    ciudad:          g.ciudad,
                    anioGraduacion:  g.anioGraduacion,
                    especialidadTop: g.afinidades?.[0]?.categoria || null,
                } : null,
            };
        });

        res.json({
            proyectos,
            tendencia:       tendenciaResumen(tendencia, semana, anio),
            pillsTecnologia,
            total,
            page:  pagina,
            pages,
            usandoFallback,
        });
    } catch (error) {
        console.error('Error listarProyectosPublicos:', error);
        res.status(500).json({ msg: 'Error al obtener proyectos.' });
    }
};

// ─────────────────────────────────────────────
// HELPERS privados
// ─────────────────────────────────────────────
function tendenciaResumen(t, semana, anio) {
    return {
        categoria:   t.categoria,
        descripcion: t.descripcion,
        color:       t.color,
        keywords:    t.keywords,
        modoManual:  t.modoManual,
        semana,
        anio,
    };
}

function calcularPills(proyectos, keywordsTendencia) {
    if (!keywordsTendencia.length) return [];

    const techReales = new Set();
    proyectos.forEach(p => (p.tecnologias || []).forEach(t => techReales.add(t)));

    const pills = [];
    for (const kw of keywordsTendencia) {
        if (pills.length >= 5) break;
        const rx = new RegExp(`^${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        for (const tech of techReales) {
            if (rx.test(tech) && !pills.includes(tech)) {
                pills.push(tech);
                break;
            }
        }
    }

    if (pills.length < 5) {
        for (const kw of keywordsTendencia) {
            if (pills.length >= 5) break;
            const rxParcial = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            for (const tech of techReales) {
                if (rxParcial.test(tech) && !pills.some(p => p.toLowerCase() === tech.toLowerCase())) {
                    pills.push(tech);
                    break;
                }
            }
        }
    }

    return pills;
}

// ═══════════════════════════════════════════════════════════
// POST /api/publico/notificar  (alias: /contacto)
// ═══════════════════════════════════════════════════════════
exports.notificar = async (req, res) => {
    const { graduadoId, nombre, email, empresa, mensaje } = req.body;

    // ── 1. Validación básica de campos ───────────────────
    if (!nombre?.trim() || !email?.trim() || !mensaje?.trim() || !graduadoId)
        return res.status(400).json({ msg: 'Faltan campos obligatorios.' });

    // ── 2. Validar longitud de campos ────────────────────
    if (nombre.trim().length > 100)
        return res.status(400).json({ msg: 'El nombre es demasiado largo.' });
    if (mensaje.trim().length > 1000)
        return res.status(400).json({ msg: 'El mensaje es demasiado largo.' });
    if (empresa && empresa.trim().length > 150)
        return res.status(400).json({ msg: 'El nombre de empresa es demasiado largo.' });

    // ── 3. Validar formato email ─────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()))
        return res.status(400).json({ msg: 'El correo electrónico no es válido.' });

    // ── 4. Sanitizar contra inyección MongoDB manual ─────
    const camposTexto    = [nombre, empresa, mensaje].filter(Boolean);
    const tieneInyeccion = camposTexto.some(c =>
        c.includes('$') || c.includes('{') || c.includes('}')
    );
    if (tieneInyeccion)
        return res.status(400).json({ msg: 'Caracteres no permitidos en los campos.' });

    // ── 5. Rate limit por IP ─────────────────────────────
    const ip    = req.ip || req.connection?.remoteAddress || 'unknown';
    const ahora = Date.now();
    const reg   = intentosPorIP.get(ip) || { count: 0, desde: ahora };

    if (ahora - reg.desde > RATE_VENTANA) {
        intentosPorIP.set(ip, { count: 1, desde: ahora });
    } else if (reg.count >= RATE_LIMITE) {
        return res.status(429).json({
            msg: 'Demasiadas solicitudes desde tu dirección. Intenta en una hora.',
        });
    } else {
        intentosPorIP.set(ip, { count: reg.count + 1, desde: reg.desde });
    }

    const emailNorm = email.trim().toLowerCase();

    try {
        // ── 6. Graduado existe y es público ──────────────
        const graduado = await Graduado.findOne({
            _id: graduadoId, perfilPublico: true, tesisVerificada: true,
        }).select('nombres apellidos emailPersonal');

        if (!graduado)
            return res.status(404).json({ msg: 'Perfil no encontrado.' });

        // ── 7. Anti-duplicado 24h por email ──────────────
        const hace24h          = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const NotificacionAdmin = require('../models/NotificacionAdmin');

        const duplicado = await NotificacionAdmin.findOne({
            graduado:    graduadoId,
            solicitudes: {
                $elemMatch: {
                    email:     emailNorm,
                    enviadoEn: { $gte: hace24h },
                },
            },
        });

        if (duplicado)
            return res.status(429).json({
                msg: 'Ya enviaste una solicitud a este graduado en las últimas 24 horas. Por favor espera antes de volver a intentarlo.',
            });

        // ── 8. Admins activos con email ───────────────────
        const Admin       = require('../models/Admin');
        const admins      = await Admin.find({ activo: true }).select('email nombre');
        const emailsAdmins = admins.map(a => a.email).filter(Boolean);

        // ── 9. Crear/actualizar NotificacionAdmin ─────────
        let notifAdmin = await NotificacionAdmin.findOne({
            graduado: graduadoId,
            leido:    false,
        });

        const nuevaSolicitud = {
            nombre:    nombre.trim(),
            email:     emailNorm,
            empresa:   empresa?.trim() || '',
            mensaje:   mensaje.trim(),
            enviadoEn: new Date(),
        };

        if (notifAdmin) {
            notifAdmin.solicitudes.push(nuevaSolicitud);
            notifAdmin.mensaje = `${notifAdmin.solicitudes.length} persona(s) han mostrado interés en el perfil de ${graduado.nombres} ${graduado.apellidos}.`;
            await notifAdmin.save();
        } else {
            notifAdmin = await NotificacionAdmin.create({
                graduado:    graduadoId,
                titulo:      `Solicitud de contacto — ${graduado.nombres} ${graduado.apellidos}`,
                mensaje:     `${nombre.trim()} está interesado/a en el perfil de ${graduado.nombres} ${graduado.apellidos}.`,
                solicitudes: [nuevaSolicitud],
                vistoPor:    [],
                leido:       false,
            });
        }

        // ── 10. Notificación en campana del graduado ──────
        const Notificacion = require('../models/Notificacion');
        await Notificacion.create({
            graduado: graduadoId,
            tipo:     'contacto',
            titulo:   '💼 Alguien está interesado en tu perfil',
            mensaje:  `${nombre.trim()}${empresa ? ` de ${empresa.trim()}` : ''} quiere ponerse en contacto contigo.`,
            metadata: {
                nombre:  nombre.trim(),
                email:   emailNorm,
                empresa: empresa?.trim() || '',
                mensaje: mensaje.trim(),
            },
        });

        // ── 11. Enviar correos en paralelo ────────────────
        const {
            enviarAlGraduado,
            enviarCopiaRemitente,
            enviarCopiaAdmins,
        } = require('../services/emailContactoService');

        Promise.allSettled([
            enviarAlGraduado({
                emailPersonal:    graduado.emailPersonal,
                nombresGraduado:  graduado.nombres,
                nombreRemitente:  nombre.trim(),
                emailRemitente:   emailNorm,
                empresa:          empresa?.trim() || '',
                mensaje:          mensaje.trim(),
            }),
            enviarCopiaAdmins({
                emailsAdmins,
                nombreRemitente:   nombre.trim(),
                emailRemitente:    emailNorm,
                empresa:           empresa?.trim() || '',
                mensaje:           mensaje.trim(),
                nombresGraduado:   graduado.nombres,
                apellidosGraduado: graduado.apellidos,
            }),
        ]).then(resultados => {
            resultados.forEach((r, i) => {
                const nombres = ['Graduado', 'Admins'];
                if (r.status === 'rejected')
                    console.error(`❌ [Contacto] Email ${nombres[i]}:`, r.reason);
            });
        });

        console.log(`📬 Contacto → ${graduado.nombres} ${graduado.apellidos} | De: ${nombre} <${emailNorm}>`);

        res.status(201).json({ msg: 'Solicitud enviada correctamente.' });

    } catch (error) {
        console.error('Error notificar:', error);
        res.status(500).json({ msg: 'Error al enviar la solicitud.' });
    }
};

// ═══════════════════════════════════════════════════════════
// GET /api/publico/top-tecnologias
// Devuelve las 5 tecnologías más frecuentes entre graduados públicos
// ═══════════════════════════════════════════════════════════
exports.topTecnologias = async (req, res) => {
    try {
        const graduados = await Graduado.find({
            perfilPublico:   true,
            tesisVerificada: true,
        }).select('tecnologias').lean();

        const frecuencia = {};
        graduados.forEach(g => {
            (g.tecnologias || []).forEach(t => {
                const key = t.trim().toLowerCase();
                if (!key) return;
                if (!frecuencia[key]) frecuencia[key] = { nombre: t.trim(), count: 0 };
                frecuencia[key].count++;
            });
        });

        const top5 = Object.values(frecuencia)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(t => t.nombre);

        res.json({ tecnologias: top5 });
    } catch (error) {
        console.error('Error topTecnologias:', error);
        res.status(500).json({ msg: 'Error al obtener tecnologías.' });
    }
};

exports.contacto = exports.notificar;
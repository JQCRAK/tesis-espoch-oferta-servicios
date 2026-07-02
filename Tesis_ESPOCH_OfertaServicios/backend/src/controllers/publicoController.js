// backend/src/controllers/publicoController.js
const Graduado         = require('../models/Graduado');
const Proyecto         = require('../models/Proyecto');
const Certificado      = require('../models/Certificado');
const Tesis            = require('../models/Tesis');
const TendenciaSemanal = require('../models/TendenciaSemanal');
const { CATALOGO }     = require('./tendenciaController');

// ── Rate limiting manual por IP ──
const intentosPorIP = new Map();
const RATE_VENTANA  = 60 * 60 * 1000;
const RATE_LIMITE   = 10;

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
// GET /api/publico/stats
// Devuelve estadísticas generales del portal en una sola llamada
// ═══════════════════════════════════════════════════════════
exports.getStats = async (req, res) => {
    try {
        // Graduados con tesis verificada y perfil público
        const graduadosValidos = await Graduado.find({
            perfilPublico:   true,
            tesisVerificada: true,
        }).select('_id tecnologias disponibilidad').lean();

        const idsValidos = graduadosValidos.map(g => g._id);

        // Total tecnologías únicas
        const tecSet = new Set();
        graduadosValidos.forEach(g =>
            (g.tecnologias || []).forEach(t => {
                if (t.trim()) tecSet.add(t.trim().toLowerCase());
            })
        );

        // Disponibles
        const disponibles = graduadosValidos.filter(
            g => g.disponibilidad === 'disponible'
        ).length;

        // Total proyectos activos de graduados válidos
        const totalProyectos = await Proyecto.countDocuments({
            graduado: { $in: idsValidos },
            activo:   true,
        });

        res.json({
            totalGraduados:   graduadosValidos.length,
            disponibles,
            totalTecnologias: tecSet.size,
            totalProyectos,
        });
    } catch (error) {
        console.error('Error getStats:', error);
        res.status(500).json({ msg: 'Error al obtener estadísticas.' });
    }
};

// ═══════════════════════════════════════════════════════════
// GET /api/publico/graduados
// ═══════════════════════════════════════════════════════════
exports.listarGraduadosPublicos = async (req, res) => {
    try {
        const {
            page           = '1',
            limit          = '20',
            q              = '',
            disponibilidad = '',
            tecnologia     = '',
            especialidad   = '',
        } = req.query;

        const LIMIT  = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
        const pagina = Math.max(parseInt(page) || 1, 1);
        const skip   = (pagina - 1) * LIMIT;

        const filtro = {
            perfilPublico:   true,
            tesisVerificada: true,
        };

        if (q.trim()) {
            const rx = { $regex: q.trim(), $options: 'i' };
            filtro.$or = [
                { nombres:   rx },
                { apellidos: rx },
            ];
        }

        // Filtro de disponibilidad:
        //   'disponible'      → exactamente 'disponible' (buscando empleo)
        //   'no_disponibles'  → cualquier estado que NO sea 'disponible' (trabajando, estudiando, no_disponible)
        if (disponibilidad === 'disponible') {
            filtro.disponibilidad = 'disponible';
        } else if (disponibilidad === 'no_disponibles') {
            filtro.disponibilidad = { $ne: 'disponible' };
        }

        if (tecnologia.trim()) {
            filtro.tecnologias = { $regex: tecnologia.trim(), $options: 'i' };
        }

        if (especialidad.trim()) {
            filtro['afinidades.categoria'] = { $regex: especialidad.trim(), $options: 'i' };
        }

        const [graduados, total] = await Promise.all([
            Graduado.find(filtro)
                .select('nombres apellidos fotoPerfil bio tecnologias afinidades habilidadesBlandas disponibilidad ciudad anioGraduacion')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(LIMIT)
                .lean(),
            Graduado.countDocuments(filtro),
        ]);

        // Top tecnologías solo en página 1 sin filtros
        let topTecnologias = [];
        if (pagina === 1 && !q && !tecnologia && !especialidad && !disponibilidad) {
            const todos = await Graduado.find({
                perfilPublico: true, tesisVerificada: true,
            }).select('tecnologias').lean();

            const freq = {};
            todos.forEach(g => (g.tecnologias || []).forEach(t => {
                const k = t.trim().toLowerCase();
                if (!k) return;
                if (!freq[k]) freq[k] = { nombre: t.trim(), count: 0 };
                freq[k].count++;
            }));
            topTecnologias = Object.values(freq)
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map(t => t.nombre);
        }

        res.json({
            graduados,
            total,
            page:  pagina,
            pages: Math.ceil(total / LIMIT) || 1,
            topTecnologias,
        });
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
            'perfilCompletado anioGraduacion updatedAt ' +
            'experienciasLaborales educacionFormal'
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
                proyectos: [], tendencia: tendenciaResumen(tendencia, semana, anio),
                pillsTecnologia: [], total: 0, page: pagina, pages: 0,
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
            // Filtro por tendencia con WORD BOUNDARY (\b) para evitar matches
            // parciales (ej. 'app' dentro de 'aplicación', 'dart' en 'estandarte').
            // Buscar en TÍTULO, TECNOLOGÍAS y DESCRIPCIÓN del proyecto, NO en
            // la especialidad del graduado.
            const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filtroBase.$or = tendencia.keywords.flatMap(kw => {
                const ek = escapeRegex(kw);
                return [
                    { titulo:      { $regex: `\\b${ek}\\b`, $options: 'i' } },
                    { tecnologias: { $regex: `\\b${ek}\\b`, $options: 'i' } },
                    { descripcion: { $regex: `\\b${ek}\\b`, $options: 'i' } },
                ];
            });
        }

        let proyectosRaw = await Proyecto.find(filtroBase)
            .select('titulo descripcion tecnologias urlRepositorio imagen fechaRealizacion graduado')
            .sort({ fechaRealizacion: -1 })
            .lean();

        // ── Ranking por relevancia cuando hay tendencia activa ──
        // Score: título = 3 pts, tecnologías = 2 pts, descripción = 1 pt
        // (por cada keyword que matchea). Así los proyectos más relacionados
        // con el tema aparecen primero, y los marginales al final.
        if (!busqueda && !techFiltro && todos !== 'true' && tendencia.keywords?.length > 0) {
            const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const rxs = tendencia.keywords.map(kw => new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i'));
            proyectosRaw = proyectosRaw.map(p => {
                let score = 0;
                const tit  = p.titulo || '';
                const tecs = (p.tecnologias || []).join(' ');
                const des  = p.descripcion || '';
                for (const rx of rxs) {
                    if (rx.test(tit))  score += 3;
                    if (rx.test(tecs)) score += 2;
                    if (rx.test(des))  score += 1;
                }
                return { ...p, _score: score };
            })
            .filter(p => p._score > 0)
            .sort((a, b) => b._score - a._score
                || new Date(b.fechaRealizacion) - new Date(a.fechaRealizacion));
        }

        let usandoFallback = false;
        if (proyectosRaw.length === 0 && todos !== 'true' && !busqueda && !techFiltro) {
            usandoFallback = true;
            proyectosRaw   = await Proyecto.find({ graduado: { $in: idsValidos }, activo: true })
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
                    _id: g._id, nombres: g.nombres, apellidos: g.apellidos,
                    fotoPerfil: g.fotoPerfil, ciudad: g.ciudad,
                    anioGraduacion: g.anioGraduacion,
                    especialidadTop: g.afinidades?.[0]?.categoria || null,
                } : null,
            };
        });

        res.json({
            proyectos, tendencia: tendenciaResumen(tendencia, semana, anio),
            pillsTecnologia, total, page: pagina, pages, usandoFallback,
        });
    } catch (error) {
        console.error('Error listarProyectosPublicos:', error);
        res.status(500).json({ msg: 'Error al obtener proyectos.' });
    }
};

function tendenciaResumen(t, semana, anio) {
    return {
        categoria: t.categoria, descripcion: t.descripcion,
        color: t.color, keywords: t.keywords,
        modoManual: t.modoManual, semana, anio,
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
            if (rx.test(tech) && !pills.includes(tech)) { pills.push(tech); break; }
        }
    }
    if (pills.length < 5) {
        for (const kw of keywordsTendencia) {
            if (pills.length >= 5) break;
            const rxP = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            for (const tech of techReales) {
                if (rxP.test(tech) && !pills.some(p => p.toLowerCase() === tech.toLowerCase())) {
                    pills.push(tech); break;
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

    if (!nombre?.trim() || !email?.trim() || !mensaje?.trim() || !graduadoId)
        return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
    if (nombre.trim().length > 100)
        return res.status(400).json({ msg: 'El nombre es demasiado largo.' });
    if (mensaje.trim().length > 1000)
        return res.status(400).json({ msg: 'El mensaje es demasiado largo.' });
    if (empresa && empresa.trim().length > 150)
        return res.status(400).json({ msg: 'El nombre de empresa es demasiado largo.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()))
        return res.status(400).json({ msg: 'El correo electrónico no es válido.' });

    const camposTexto    = [nombre, empresa, mensaje].filter(Boolean);
    const tieneInyeccion = camposTexto.some(c => c.includes('$') || c.includes('{') || c.includes('}'));
    if (tieneInyeccion)
        return res.status(400).json({ msg: 'Caracteres no permitidos en los campos.' });

    const ip    = req.ip || req.connection?.remoteAddress || 'unknown';
    const ahora = Date.now();
    const reg   = intentosPorIP.get(ip) || { count: 0, desde: ahora };
    if (ahora - reg.desde > RATE_VENTANA) {
        intentosPorIP.set(ip, { count: 1, desde: ahora });
    } else if (reg.count >= RATE_LIMITE) {
        return res.status(429).json({ msg: 'Demasiadas solicitudes desde tu dirección. Intenta en una hora.' });
    } else {
        intentosPorIP.set(ip, { count: reg.count + 1, desde: reg.desde });
    }

    const emailNorm = email.trim().toLowerCase();

    try {
        const graduado = await Graduado.findOne({
            _id: graduadoId, perfilPublico: true, tesisVerificada: true,
        }).select('nombres apellidos emailPersonal');
        if (!graduado)
            return res.status(404).json({ msg: 'Perfil no encontrado.' });

        const hace24h           = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const NotificacionAdmin = require('../models/NotificacionAdmin');
        const duplicado = await NotificacionAdmin.findOne({
            graduado: graduadoId,
            solicitudes: { $elemMatch: { email: emailNorm, enviadoEn: { $gte: hace24h } } },
        });
        if (duplicado)
            return res.status(429).json({
                msg: 'Ya enviaste una solicitud a este graduado en las últimas 24 horas.',
            });

        const Admin        = require('../models/Admin');
        const admins       = await Admin.find({ activo: true }).select('email nombre');
        const emailsAdmins = admins.map(a => a.email).filter(Boolean);

        let notifAdmin = await NotificacionAdmin.findOne({ graduado: graduadoId, leido: false });
        const nuevaSolicitud = {
            nombre: nombre.trim(), email: emailNorm,
            empresa: empresa?.trim() || '', mensaje: mensaje.trim(), enviadoEn: new Date(),
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

        const Notificacion = require('../models/Notificacion');
        await Notificacion.create({
            graduado: graduadoId,
            tipo:     'contacto',
            titulo:   '💼 Alguien está interesado en tu perfil',
            mensaje:  `${nombre.trim()}${empresa ? ` de ${empresa.trim()}` : ''} quiere ponerse en contacto contigo.`,
            metadata: { nombre: nombre.trim(), email: emailNorm, empresa: empresa?.trim() || '', mensaje: mensaje.trim() },
        });

        const { enviarAlGraduado, enviarCopiaAdmins } = require('../services/emailContactoService');
        Promise.allSettled([
            enviarAlGraduado({
                emailPersonal: graduado.emailPersonal, nombresGraduado: graduado.nombres,
                nombreRemitente: nombre.trim(), emailRemitente: emailNorm,
                empresa: empresa?.trim() || '', mensaje: mensaje.trim(),
            }),
            enviarCopiaAdmins({
                emailsAdmins, nombreRemitente: nombre.trim(), emailRemitente: emailNorm,
                empresa: empresa?.trim() || '', mensaje: mensaje.trim(),
                nombresGraduado: graduado.nombres, apellidosGraduado: graduado.apellidos,
            }),
        ]).then(resultados => {
            resultados.forEach((r, i) => {
                if (r.status === 'rejected')
                    console.error(`❌ [Contacto] Email ${['Graduado','Admins'][i]}:`, r.reason);
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
// ═══════════════════════════════════════════════════════════
exports.topTecnologias = async (req, res) => {
    try {
        const graduados = await Graduado.find({
            perfilPublico: true, tesisVerificada: true,
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
// backend/src/controllers/estadisticasEmpleadorController.js
const Empleador          = require('../models/Empleador');
const Encuesta           = require('../models/Encuesta');
const Pregunta           = require('../models/Pregunta');
const RespuestaEmpleador = require('../models/RespuestaEmpleador');

const norm = (s = '') =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const similitud = (a, b) => {
    const na = norm(a), nb = norm(b);
    if (na === nb) return 1;
    const tri = s => new Set([...Array(Math.max(0, s.length - 2))].map((_, i) => s.slice(i, i + 3)));
    const ta = tri(na), tb = tri(nb);
    const inter = [...ta].filter(x => tb.has(x)).length;
    const union = new Set([...ta, ...tb]).size;
    return union === 0 ? 0 : inter / union;
};

exports.getEstadisticasEmpleadores = async (req, res) => {
    try {
        // ── 1. Siempre cargar empleadores activos ─────────────
        const empleadores = await Empleador.find({ activo: true })
            .select('nombreEmpresa nombreGerente provincia ciudad tipoCapital tipoActividad emailOrganizacion encuestado tokenUsado encuestaAsociada')
            .lean();

        // ── 2. Encuestas tipo 'empleadores' ───────────────────
        const encuestas = await Encuesta.find({ tipo: 'empleadores' })
            .sort({ fechaInicio: -1 })
            .lean();

        // Si no hay encuestas, devolver empleadores igual (tab Empresas funciona)
        if (!encuestas.length) {
            const empleadoresRaw = empleadores.map(e => ({
                _id:               e._id.toString(),
                nombreEmpresa:     e.nombreEmpresa,
                nombreGerente:     e.nombreGerente,
                provincia:         e.provincia    || '',
                ciudad:            e.ciudad       || '',
                tipoCapital:       e.tipoCapital,
                tipoActividad:     e.tipoActividad,
                emailOrganizacion: e.emailOrganizacion,
                encuestado:        e.encuestado   || {},
                encuestasRespondidas: [],
                respondio:         false,
            }));
            return res.json({
                encuestas:          [],
                empleadoresRaw,
                respuestasRaw:      [],
                preguntasAgrupadas: [],
                kpis: {
                    totalEmpleadores:       empleadores.length,
                    totalEncuestas:         0,
                    totalRespuestas:        0,
                    tasaRespuesta:          0,
                    empleadoresRespondieron: 0,
                },
            });
        }

        const encuestaIds = encuestas.map(e => e._id);

        // ── 3. Respuestas con populate completo ───────────────
        const respuestas = await RespuestaEmpleador.find({ encuesta: { $in: encuestaIds } })
            .populate('empleador', 'nombreEmpresa nombreGerente provincia ciudad tipoCapital tipoActividad emailOrganizacion encuestado')
            .populate('encuesta', 'titulo fechaInicio fechaCierre estado')
            .lean();

        // ── 4. Preguntas (excluye títulos) ─────────────────────
        const preguntas = await Pregunta.find({
            encuesta: { $in: encuestaIds },
            tipo: { $ne: 'titulo' },
        }).sort({ encuesta: 1, orden: 1 }).lean();

        // ── 5. Agrupar preguntas similares ────────────────────
        const grupos = [];

        for (const preg of preguntas) {
            let encontrado = false;
            for (const g of grupos) {
                const mismoTipo =
                    g.tipo === preg.tipo ||
                    (g.tipo === 'opcion_multiple' && preg.tipo === 'checkboxes') ||
                    (g.tipo === 'checkboxes' && preg.tipo === 'opcion_multiple');
                if (!mismoTipo) continue;
                if (similitud(g.textoCanonical, preg.texto) >= 0.72) {
                    g.preguntaIds.push(preg._id.toString());
                    if (!g.encuestasAparece.includes(preg.encuesta.toString()))
                        g.encuestasAparece.push(preg.encuesta.toString());
                    (preg.opciones || []).forEach(op => { if (!g.opciones.includes(op)) g.opciones.push(op); });
                    if (preg.esMatriz) {
                        g.esMatriz = true;
                        g.items = g.items || [];
                        (preg.items || []).forEach(it => { if (!g.items.includes(it)) g.items.push(it); });
                    }
                    encontrado = true;
                    break;
                }
            }
            if (!encontrado) {
                grupos.push({
                    id: `grupo_${grupos.length}`,
                    textoCanonical: preg.texto,
                    tipo: preg.tipo,
                    opciones: [...(preg.opciones || [])],
                    esMatriz: preg.esMatriz || false,
                    items: preg.esMatriz ? [...(preg.items || [])] : [],
                    etiquetaMin: preg.etiquetaMin || '',
                    etiquetaMax: preg.etiquetaMax || '',
                    encuestasAparece: [preg.encuesta.toString()],
                    preguntaIds: [preg._id.toString()],
                    obligatoria: preg.obligatoria,
                });
            }
        }

        // ── 6. Lookup: preguntaId → respuestas enriquecidas ───
        const lookupResp = {};
        for (const r of respuestas) {
            if (r.estado !== 'completada') continue;
            const emp = r.empleador || {};
            const meta = {
                empleadorId:   emp._id?.toString()        || '',
                nombreEmpresa: emp.nombreEmpresa           || '',
                encuestaId:    r.encuesta?._id?.toString() || '',
                provincia:     emp.provincia               || '',
                ciudad:        emp.ciudad                  || '',
                tipoCapital:   emp.tipoCapital             || '',
                tipoActividad: emp.tipoActividad           || '',
            };
            for (const item of r.respuestas || []) {
                if (!item.pregunta) continue;
                const pid = item.pregunta.toString();
                if (!lookupResp[pid]) lookupResp[pid] = [];
                lookupResp[pid].push({
                    ...meta,
                    valor:            item.respuesta,
                    esCondicional:    item.esCondicional   || false,
                    ladoCondicional:  item.ladoCondicional || null,
                    textoSubPregunta: item.textoSubPregunta || '',
                });
            }
        }

        // ── 7. Grupos con respuestas ──────────────────────────
        const respCompletadas = respuestas.filter(r => r.estado === 'completada');

        const gruposConDatos = grupos.map(g => {
            const todas        = g.preguntaIds.flatMap(pid => lookupResp[pid] || []);
            const principal    = todas.filter(r => !r.esCondicional);
            const condicionales = todas.filter(r => r.esCondicional);
            return {
                ...g,
                totalRespuestas: principal.length,
                respuestasRaw:   principal,
                condicionalesRaw: condicionales,
                esComun: g.encuestasAparece.length >= Math.max(2, Math.ceil(encuestas.filter(e => e.estado === 'cerrada').length * 0.5)),
            };
        }).sort((a, b) => b.totalRespuestas - a.totalRespuestas);

        // ── 8. KPIs ───────────────────────────────────────────
        const totalEmpleadores = empleadores.length;
        const totalEncuestas   = encuestas.length;
        const totalRespuestas  = respCompletadas.length;
        const empRespondieron  = new Set(respCompletadas.map(r => r.empleador?._id?.toString()));
        const tasaRespuesta    = totalEmpleadores > 0
            ? Math.round((empRespondieron.size / totalEmpleadores) * 100)
            : 0;

        // ── 9. Empleadores enriquecidos con historial encuestas
        const empRespMap = {};
        for (const r of respCompletadas) {
            const eid = r.empleador?._id?.toString();
            if (!eid) continue;
            if (!empRespMap[eid]) empRespMap[eid] = [];
            empRespMap[eid].push(r.encuesta?._id?.toString());
        }

        const empleadoresRaw = empleadores.map(e => ({
            _id:               e._id.toString(),
            nombreEmpresa:     e.nombreEmpresa,
            nombreGerente:     e.nombreGerente,
            provincia:         e.provincia    || '',
            ciudad:            e.ciudad       || '',
            tipoCapital:       e.tipoCapital,
            tipoActividad:     e.tipoActividad,
            emailOrganizacion: e.emailOrganizacion,
            encuestado:        e.encuestado   || {},
            encuestasRespondidas: empRespMap[e._id.toString()] || [],
            respondio:         (empRespMap[e._id.toString()] || []).length > 0,
        }));

        // ── 10. Respuestas raw (tabla quién respondió) ────────
        const respuestasRaw = respCompletadas.map(r => ({
            _id:             r._id.toString(),
            encuestaId:      r.encuesta?._id?.toString()  || '',
            encuestaTitulo:  r.encuesta?.titulo            || '',
            empleadorId:     r.empleador?._id?.toString() || '',
            nombreEmpresa:   r.empleador?.nombreEmpresa   || '',
            provincia:       r.empleador?.provincia       || '',
            ciudad:          r.empleador?.ciudad          || '',
            tipoCapital:     r.empleador?.tipoCapital     || '',
            tipoActividad:   r.empleador?.tipoActividad   || '',
            datosEncuestado: r.datosEncuestado            || {},
            fechaRespuesta:  r.fechaRespuesta,
        }));

        res.json({
            encuestas: encuestas.map(e => ({
                _id:             e._id.toString(),
                titulo:          e.titulo,
                estado:          e.estado,
                fechaInicio:     e.fechaInicio,
                fechaCierre:     e.fechaCierre,
                totalRespuestas: e.totalRespuestas || 0,
            })),
            empleadoresRaw,
            respuestasRaw,
            preguntasAgrupadas: gruposConDatos,
            kpis: {
                totalEmpleadores,
                totalEncuestas,
                totalRespuestas,
                tasaRespuesta,
                empleadoresRespondieron: empRespondieron.size,
            },
        });
    } catch (err) {
        console.error('Error en getEstadisticasEmpleadores:', err);
        res.status(500).json({ msg: 'Error al obtener estadísticas de empleadores.', error: err.message });
    }
};
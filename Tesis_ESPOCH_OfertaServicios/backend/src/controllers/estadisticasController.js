// backend/src/controllers/estadisticasController.js
const Graduado          = require('../models/Graduado');
const Proyecto          = require('../models/Proyecto');
const Certificado       = require('../models/Certificado');
const RespuestaEncuesta = require('../models/RespuestaEncuesta');
const Encuesta          = require('../models/Encuesta');
const Pregunta          = require('../models/Pregunta');

const obtenerEstadisticasGenerales = async (req, res) => {
    try {
        // ── 1. Solo graduados con tesis verificada ───────────────────
        const graduados = await Graduado.find(
            { tesisVerificada: true },
            'nombres apellidos fotoPerfil genero anioGraduacion provinciaActual cantonActual disponibilidad perfilPublico tecnologias afinidades habilidadesBlandas'
        ).lean();

        const idsVerificados = graduados.map(g => g._id);
        const totalGraduados = graduados.length;

        const [proyPorGraduado, certPorGraduado] = await Promise.all([
            Proyecto.aggregate([
                { $match: { graduado: { $in: idsVerificados }, activo: true } },
                { $group: { _id: '$graduado', cantidad: { $sum: 1 } } },
            ]),
            Certificado.aggregate([
                { $match: { graduado: { $in: idsVerificados } } },
                { $group: { _id: '$graduado', cantidad: { $sum: 1 } } },
            ]),
        ]);

        const totalProyectos    = proyPorGraduado.reduce((s, r) => s + r.cantidad, 0);
        const totalCertificados = certPorGraduado.reduce((s, r) => s + r.cantidad, 0);

        let usarFallback = false;
        if (totalProyectos === 0 && idsVerificados.length > 0) {
            const checkProy = await Proyecto.countDocuments({ activo: true });
            if (checkProy > 0) usarFallback = true;
        }

        let mapProy = {}, mapCert = {};

        if (!usarFallback) {
            proyPorGraduado.forEach(r => { mapProy[r._id.toString()] = r.cantidad; });
            certPorGraduado.forEach(r => { mapCert[r._id.toString()] = r.cantidad; });
        } else {
            const idsStr = idsVerificados.map(id => id.toString());
            const [pF, cF] = await Promise.all([
                Proyecto.aggregate([
                    { $match: { activo: true } },
                    { $addFields: { graduadoStr: { $toString: '$graduado' } } },
                    { $match: { graduadoStr: { $in: idsStr } } },
                    { $group: { _id: '$graduadoStr', cantidad: { $sum: 1 } } },
                ]),
                Certificado.aggregate([
                    { $addFields: { graduadoStr: { $toString: '$graduado' } } },
                    { $match: { graduadoStr: { $in: idsStr } } },
                    { $group: { _id: '$graduadoStr', cantidad: { $sum: 1 } } },
                ]),
            ]);
            pF.forEach(r => { mapProy[r._id] = r.cantidad; });
            cF.forEach(r => { mapCert[r._id] = r.cantidad; });
        }

        const totalProyectosReal    = Object.values(mapProy).reduce((s, n) => s + n, 0) || totalProyectos;
        const totalCertificadosReal = Object.values(mapCert).reduce((s, n) => s + n, 0) || totalCertificados;

        const promedioProyectos    = totalGraduados > 0 ? parseFloat((totalProyectosReal / totalGraduados).toFixed(1)) : 0;
        const promedioCertificados = totalGraduados > 0 ? parseFloat((totalCertificadosReal / totalGraduados).toFixed(1)) : 0;

        const rangosP = { '0': 0, '1-2': 0, '3-4': 0, '5': 0 };
        const rangosC = { '0': 0, '1-2': 0, '3-4': 0, '5': 0 };

        graduados.forEach(g => {
            const id = g._id.toString();
            const np = mapProy[id] || 0;
            const nc = mapCert[id] || 0;
            if      (np === 0) rangosP['0']++;
            else if (np <= 2)  rangosP['1-2']++;
            else if (np <= 4)  rangosP['3-4']++;
            else               rangosP['5']++;
            if      (nc === 0) rangosC['0']++;
            else if (nc <= 2)  rangosC['1-2']++;
            else if (nc <= 4)  rangosC['3-4']++;
            else               rangosC['5']++;
        });

        const distribucionProyectos = [
            { rango:'0',   label:'Sin proyectos', cantidad: rangosP['0'],   color:'#ef4444' },
            { rango:'1-2', label:'1 a 2',         cantidad: rangosP['1-2'], color:'#f97316' },
            { rango:'3-4', label:'3 a 4',         cantidad: rangosP['3-4'], color:'#3b82f6' },
            { rango:'5',   label:'5 (máximo)',     cantidad: rangosP['5'],   color:'#22c55e' },
        ];

        const distribucionCertificados = [
            { rango:'0',   label:'Sin certificados', cantidad: rangosC['0'],   color:'#ef4444' },
            { rango:'1-2', label:'1 a 2',            cantidad: rangosC['1-2'], color:'#f97316' },
            { rango:'3-4', label:'3 a 4',            cantidad: rangosC['3-4'], color:'#3b82f6' },
            { rango:'5',   label:'5 (máximo)',        cantidad: rangosC['5'],   color:'#22c55e' },
        ];

        const totalDisponibles = graduados.filter(g => g.disponibilidad === 'disponible').length;
        const totalPublicos    = graduados.filter(g => g.perfilPublico).length;
        const totalEmpleados   = totalGraduados - totalDisponibles;

        const tasaEmpleabilidad = totalGraduados > 0 ? Math.round(totalEmpleados / totalGraduados * 100) : 0;
        const tasaVisibilidad   = totalGraduados > 0 ? Math.round(totalPublicos / totalGraduados * 100)  : 0;

        const cGe = {};
        graduados.forEach(g => { const k = g.genero || 'No especificado'; cGe[k] = (cGe[k] || 0) + 1; });
        const porGenero = Object.entries(cGe)
            .map(([label, valor]) => ({ label, valor, porcentaje: totalGraduados > 0 ? Math.round(valor / totalGraduados * 100) : 0 }))
            .sort((a, b) => b.valor - a.valor);

        const cAn = {};
        graduados.forEach(g => { if (g.anioGraduacion) cAn[g.anioGraduacion] = (cAn[g.anioGraduacion] || 0) + 1; });
        const porAnio = Object.entries(cAn)
            .map(([a, t]) => ({ anio: parseInt(a), total: t }))
            .sort((a, b) => a.anio - b.anio);

        const anioMax = porAnio.reduce((max, a) => a.total > max.total ? a : max, { anio: 0, total: 0 });
        const anioMin = porAnio.reduce((min, a) => a.total < min.total ? a : min, porAnio[0] || { anio: 0, total: 0 });

        let tendenciaAnual = 'estable';
        if (porAnio.length >= 2) {
            const ult = porAnio[porAnio.length - 1];
            const pen = porAnio[porAnio.length - 2];
            const delta = ult.total - pen.total;
            const p = pen.total > 0 ? Math.round((delta / pen.total) * 100) : 0;
            tendenciaAnual = delta > 0 ? `crecimiento_${p}` : delta < 0 ? `descenso_${Math.abs(p)}` : 'estable';
        }
        const promedioAnual = porAnio.length > 0
            ? Math.round(porAnio.reduce((s, a) => s + a.total, 0) / porAnio.length) : 0;

        const cPr = {}, cCa = {};
        graduados.forEach(g => {
            const p = g.provinciaActual?.trim(); if (p) cPr[p] = (cPr[p] || 0) + 1;
            const c = g.cantonActual?.trim();    if (c) cCa[c] = (cCa[c] || 0) + 1;
        });
        const porProvincia = Object.entries(cPr)
            .map(([provincia, total]) => ({ provincia, total, porcentaje: totalGraduados > 0 ? Math.round(total / totalGraduados * 100) : 0 }))
            .sort((a, b) => b.total - a.total);
        const porCanton = Object.entries(cCa)
            .map(([canton, total]) => ({ canton, total }))
            .sort((a, b) => b.total - a.total);

        const totalProvincias    = porProvincia.length;
        const concentracionTop3  = porProvincia.slice(0, 3).reduce((s, p) => s + p.total, 0);
        const indiceConcentracion = totalGraduados > 0 ? Math.round(concentracionTop3 / totalGraduados * 100) : 0;

        const cTe = {};
        graduados.forEach(g => (g.tecnologias || []).forEach(t => { if (t) cTe[t] = (cTe[t] || 0) + 1; }));
        const topTecnologias = Object.entries(cTe)
            .map(([tecnologia, total]) => ({ tecnologia, total, adopcion: totalGraduados > 0 ? Math.round(total / totalGraduados * 100) : 0 }))
            .sort((a, b) => b.total - a.total).slice(0, 20);

        const catTec = {
            frontend: ['React','Vue','Angular','TypeScript','JavaScript','HTML','CSS','Tailwind CSS','Next.js','Svelte'],
            backend:  ['Node.js','Python','Java','PHP','Django','FastAPI','Spring','Laravel','Express','NestJS'],
            data:     ['Python','Pandas','NumPy','TensorFlow','Scikit-learn','Keras','PyTorch','Power BI','Tableau','SQL'],
            cloud:    ['AWS','Azure','GCP','Docker','Kubernetes','Terraform','Ansible','CI/CD','Jenkins','GitHub Actions'],
            mobile:   ['Flutter','React Native','Kotlin','Swift','Android Studio','Ionic','Expo'],
            database: ['MongoDB','PostgreSQL','MySQL','Redis','Firebase','SQLite','Oracle','Cassandra','DynamoDB'],
        };
        const tecsPorCategoria = {};
        Object.entries(catTec).forEach(([cat, lista]) => {
            const total = lista.reduce((s, t) => s + (cTe[t] || 0), 0);
            if (total > 0) tecsPorCategoria[cat] = total;
        });

        const anioActual = new Date().getFullYear();
        const graduadosRecientes = graduados.filter(g => g.anioGraduacion >= anioActual - 2);
        const cTeRec = {};
        graduadosRecientes.forEach(g => (g.tecnologias || []).forEach(t => { if (t) cTeRec[t] = (cTeRec[t] || 0) + 1; }));
        const tecEmergentes = Object.entries(cTeRec)
            .map(([tecnologia, total]) => ({ tecnologia, total, totalGeneral: cTe[tecnologia] || 0 }))
            .filter(t => t.total >= 1)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        const cAf = {}, cHa = {};
        graduados.forEach(g => {
            (g.afinidades || []).forEach(af => { if (af.categoria) cAf[af.categoria] = (cAf[af.categoria] || 0) + 1; });
            (g.habilidadesBlandas || []).forEach(h => { if (h) cHa[h] = (cHa[h] || 0) + 1; });
        });
        const topAfinidades = Object.entries(cAf)
            .map(([categoria, total]) => ({ categoria, total, porcentaje: totalGraduados > 0 ? Math.round(total / totalGraduados * 100) : 0 }))
            .sort((a, b) => b.total - a.total);
        const topHabilidadesBlandas = Object.entries(cHa)
            .map(([habilidad, total]) => ({ habilidad, total, penetracion: totalGraduados > 0 ? Math.round(total / totalGraduados * 100) : 0 }))
            .sort((a, b) => b.total - a.total).slice(0, 15);

        const hayIA     = ['Python','TensorFlow','Scikit-learn','Keras','PyTorch'].some(t => cTe[t] > 0);
        const hayCloud  = ['AWS','Docker','Kubernetes','Azure','GCP'].some(t => cTe[t] > 0);
        const hayMobile = ['Flutter','React Native','Kotlin','Swift'].some(t => cTe[t] > 0);

        const insights = _calcularInsights({
            tasaEmpleabilidad, tasaVisibilidad, promedioProyectos, promedioCertificados,
            totalEmpleados, totalGraduados, totalDisponibles, totalProvincias,
            indiceConcentracion, porAnio, anioMax, hayIA, hayCloud, hayMobile,
        });
        const planAccion = _calcularPlanAccion({
            tasaEmpleabilidad, tasaVisibilidad, promedioProyectos, promedioCertificados,
            totalProvincias, hayMobile,
        });

        res.json({
            totalGraduados, totalPublicos, totalDisponibles, totalEmpleados,
            totalProyectos: totalProyectosReal,
            totalCertificados: totalCertificadosReal,
            promedioProyectos, promedioCertificados,
            tasaEmpleabilidad, tasaVisibilidad,
            porGenero, porAnio, porProvincia, porCanton,
            distribucionProyectos,
            distribucionCertificados,
            topTecnologias, tecsPorCategoria, tecEmergentes,
            topAfinidades, topHabilidadesBlandas,
            anioMax, anioMin, promedioAnual, tendenciaAnual,
            totalProvincias, indiceConcentracion,
            insights, planAccion,
            graduadosRaw: graduados.map(g => ({
                ...g,
                cantidadProyectos:    mapProy[g._id.toString()] || 0,
                cantidadCertificados: mapCert[g._id.toString()] || 0,
            })),
        });

    } catch (err) {
        console.error('Error en obtenerEstadisticasGenerales:', err);
        res.status(500).json({ msg: 'Error al obtener estadísticas' });
    }
};

function _calcularInsights({ tasaEmpleabilidad, tasaVisibilidad, promedioProyectos, promedioCertificados,
    totalEmpleados, totalGraduados, totalDisponibles, totalProvincias,
    indiceConcentracion, porAnio, anioMax, hayIA, hayCloud, hayMobile }) {

    const insights = [];

    if (tasaEmpleabilidad >= 80)
        insights.push({ tipo:'ok',   titulo:`Alta empleabilidad: ${tasaEmpleabilidad}%`,     detalle:`${totalEmpleados} de ${totalGraduados} graduados no buscan empleo activamente.` });
    else if (tasaEmpleabilidad >= 60)
        insights.push({ tipo:'warn', titulo:`Empleabilidad moderada: ${tasaEmpleabilidad}%`, detalle:`${totalDisponibles} graduados marcaron disponibilidad activa. Fortalecer bolsa de empleo.` });
    else
        insights.push({ tipo:'crit', titulo:`Empleabilidad crítica: ${tasaEmpleabilidad}%`,  detalle:`Más del 40% con disponibilidad activa. Acción urgente: ferias y convenios empresariales.` });

    if (tasaVisibilidad >= 80)
        insights.push({ tipo:'ok',   titulo:`Alta visibilidad: ${tasaVisibilidad}% perfiles públicos`, detalle:'Empleadores acceden a la mayoría de perfiles. Mantener incentivos de completitud.' });
    else
        insights.push({ tipo:'warn', titulo:`Solo ${tasaVisibilidad}% con perfil visible`,            detalle:'Muchos perfiles ocultos. Campaña: verificar tesis y activar perfil público.' });

    if (porAnio.length >= 2) {
        const ult = porAnio[porAnio.length - 1], pen = porAnio[porAnio.length - 2];
        const delta = ult.total - pen.total;
        if      (delta > 0) insights.push({ tipo:'ok',   titulo:`Crecimiento: +${delta} en ${ult.anio}`,             detalle:`De ${pen.total} (${pen.anio}) a ${ult.total} (${ult.anio}). Carrera en expansión.` });
        else if (delta < 0) insights.push({ tipo:'warn', titulo:`Descenso: ${Math.abs(delta)} menos en ${ult.anio}`, detalle:`De ${pen.total} (${pen.anio}) a ${ult.total} (${ult.anio}). Revisar retención.` });
        else                insights.push({ tipo:'info', titulo:`Graduaciones estables: ${ult.total}/año`,           detalle:'Número consistente. Evaluar estrategias para mayor tasa oportuna.' });
    }

    if (indiceConcentracion > 75 && totalProvincias < 5)
        insights.push({ tipo:'warn', titulo:`Alta concentración: ${indiceConcentracion}% en top 3 provincias`, detalle:'Poca distribución. Promover movilidad y alianzas regionales.' });
    else if (totalProvincias >= 8)
        insights.push({ tipo:'ok',   titulo:`Distribución en ${totalProvincias} provincias`, detalle:'Buena presencia nacional institucional.' });
    else
        insights.push({ tipo:'info', titulo:`Presencia en ${totalProvincias} provincias`,    detalle:'Objetivo: superar 8 provincias con graduados activos.' });

    if (promedioProyectos >= 3)
        insights.push({ tipo:'ok',   titulo:`Buen portafolio: ${promedioProyectos} proy/graduado`,    detalle:'Nivel adecuado de proyectos publicados. Ventaja competitiva.' });
    else if (promedioProyectos >= 1.5)
        insights.push({ tipo:'info', titulo:`Portafolio moderado: ${promedioProyectos} proy/graduado`, detalle:'Incentivar publicación de proyectos de tesis y personales.' });
    else
        insights.push({ tipo:'warn', titulo:`Portafolio bajo: ${promedioProyectos} proy/graduado`,     detalle:'Muy pocos proyectos. Campaña urgente de publicación.' });

    if (promedioCertificados >= 3)
        insights.push({ tipo:'ok',   titulo:`Alta certificación: ${promedioCertificados}/graduado`, detalle:'Excelente nivel. Refleja aprendizaje continuo.' });
    else if (promedioCertificados < 1)
        insights.push({ tipo:'warn', titulo:`Baja certificación: ${promedioCertificados}/graduado`, detalle:'Organizar talleres de certificaciones AWS, Google, Microsoft.' });

    if (hayIA)      insights.push({ tipo:'ok',   titulo:'Presencia en IA/ML detectada',         detalle:'Skills IA/ML presentes en graduados. Alta demanda global.' });
    if (hayCloud)   insights.push({ tipo:'ok',   titulo:'Competencias Cloud/DevOps presentes',  detalle:'Incentivar certificaciones oficiales AWS/Azure/GCP.' });
    if (!hayMobile) insights.push({ tipo:'info', titulo:'Escasa presencia en desarrollo móvil', detalle:'Flutter y React Native tienen alta demanda laboral.' });

    if (anioMax?.total > 0 && porAnio.length > 1)
        insights.push({ tipo:'info', titulo:`Año récord: ${anioMax.anio} con ${anioMax.total} graduados`, detalle:`Analizar factores de ${anioMax.anio} para replicar ese rendimiento.` });

    return insights;
}

function _calcularPlanAccion({ tasaEmpleabilidad, tasaVisibilidad, promedioProyectos,
    promedioCertificados, totalProvincias, hayMobile }) {
    return [
        tasaEmpleabilidad   < 70  && { prioridad:1, accion:'Activar bolsa de empleo institucional',      impacto:'alto',  meta:'Reducir disponibilidad activa a menos del 20%' },
        tasaVisibilidad     < 70  && { prioridad:2, accion:'Campaña de activación de perfiles públicos', impacto:'alto',  meta:`Llevar visibilidad del ${tasaVisibilidad}% al 80%` },
        promedioProyectos   < 2   && { prioridad:3, accion:'Campaña de publicación de proyectos y tesis',impacto:'medio', meta:'Alcanzar 2+ proyectos por graduado' },
        promedioCertificados<1.5  && { prioridad:4, accion:'Talleres de certificación tecnológica',      impacto:'medio', meta:'Alcanzar 2+ certificaciones promedio' },
        !hayMobile                && { prioridad:5, accion:'Agregar Flutter/React Native al pensum',     impacto:'medio', meta:'Cubrir demanda de desarrollo móvil' },
        totalProvincias     < 5   && { prioridad:6, accion:'Convenios con empresas fuera de Chimborazo', impacto:'bajo',  meta:'Graduados activos en 8+ provincias' },
    ].filter(Boolean);
}

// ═══════════════════════════════════════════════════════════
// ESTADÍSTICAS DE ENCUESTAS A GRADUADOS
// ═══════════════════════════════════════════════════════════
const normEnc = (s = '') =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const similitudEnc = (a, b) => {
    const na = normEnc(a), nb = normEnc(b);
    if (na === nb) return 1;
    const tri = s => new Set([...Array(Math.max(0, s.length - 2))].map((_, i) => s.slice(i, i + 3)));
    const ta = tri(na), tb = tri(nb);
    const inter = [...ta].filter(x => tb.has(x)).length;
    const union = new Set([...ta, ...tb]).size;
    return union === 0 ? 0 : inter / union;
};

const obtenerEstadisticasEncuesta = async (req, res) => {
    try {
        // ── 1. Encuestas tipo graduados ───────────────────────────────
        const encuestas = await Encuesta.find({ tipo: 'graduados' })
            .sort({ fechaInicio: -1 }).lean();

        // ── 2. Graduados con tesis verificada (base total) ────────────
        const graduadosBase = await Graduado.find({ tesisVerificada: true })
            .select('nombres apellidos emailInstitucional anioGraduacion genero provinciaActual')
            .lean();

        if (!encuestas.length) {
            return res.json({
                encuestas: [],
                graduadosRaw: graduadosBase.map(g => ({
                    _id:                  g._id.toString(),
                    nombres:              g.nombres,
                    apellidos:            g.apellidos,
                    emailInstitucional:   g.emailInstitucional,
                    anioGraduacion:       g.anioGraduacion,
                    genero:               g.genero,
                    provinciaActual:      g.provinciaActual,
                    encuestasRespondidas: [],
                    respondio:            false,
                })),
                respuestasRaw:      [],
                preguntasAgrupadas: [],
                kpis: {
                    totalGraduados:        graduadosBase.length,
                    totalEncuestas:        0,
                    totalRespuestas:       0,
                    tasaRespuesta:         0,
                    graduadosRespondieron: 0,
                },
            });
        }

        const encuestaIds = encuestas.map(e => e._id);

        // ── 3. Respuestas con datos del graduado y la encuesta ────────
        const respuestas = await RespuestaEncuesta.find({ encuesta: { $in: encuestaIds } })
            .populate('graduado', 'nombres apellidos emailInstitucional anioGraduacion genero provinciaActual')
            .populate('encuesta', 'titulo fechaInicio fechaCierre estado')
            .lean();

        // ── 4. Preguntas (sin títulos de sección) ─────────────────────
        const preguntas = await Pregunta.find({
            encuesta: { $in: encuestaIds },
            tipo:     { $ne: 'titulo' },
        }).sort({ encuesta: 1, orden: 1 }).lean();

        // ── 5. Agrupar preguntas similares ────────────────────────────
        // Normaliza tildes: "Satisfacción" y "Satisfaccion" se fusionan
        const grupos = [];
        for (const preg of preguntas) {
            let encontrado = false;
            for (const g of grupos) {
                const mismoTipo =
                    g.tipo === preg.tipo ||
                    (g.tipo === 'opcion_multiple' && preg.tipo === 'checkboxes') ||
                    (g.tipo === 'checkboxes' && preg.tipo === 'opcion_multiple');
                if (!mismoTipo) continue;
                if (similitudEnc(g.textoCanonical, preg.texto) >= 0.72) {
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
                    id:              `grupo_${grupos.length}`,
                    textoCanonical:  preg.texto,
                    tipo:            preg.tipo,
                    opciones:        [...(preg.opciones || [])],
                    esMatriz:        preg.esMatriz || false,
                    items:           preg.esMatriz ? [...(preg.items || [])] : [],
                    etiquetaMin:     preg.etiquetaMin || '',
                    etiquetaMax:     preg.etiquetaMax || '',
                    encuestasAparece:[preg.encuesta.toString()],
                    preguntaIds:     [preg._id.toString()],
                    obligatoria:     preg.obligatoria,
                });
            }
        }

        // ── 6. Lookup: preguntaId → lista de respuestas enriquecidas ──
        const respCompletadas = respuestas.filter(r => r.estado === 'completada');
        const lookupResp = {};
        for (const r of respCompletadas) {
            const grad = r.graduado || {};
            const meta = {
                graduadoId:      grad._id?.toString() || '',
                nombres:         grad.nombres         || '',
                apellidos:       grad.apellidos        || '',
                anioGraduacion:  grad.anioGraduacion   || null,
                genero:          grad.genero           || '',
                provinciaActual: grad.provinciaActual  || '',
                encuestaId:      r.encuesta?._id?.toString() || '',
            };
            for (const item of r.respuestas || []) {
                if (!item.pregunta) continue;
                const pid = item.pregunta.toString();
                if (!lookupResp[pid]) lookupResp[pid] = [];
                lookupResp[pid].push({
                    ...meta,
                    valor:            item.respuesta,
                    esCondicional:    item.esCondicional    || false,
                    ladoCondicional:  item.ladoCondicional  || null,
                    textoSubPregunta: item.textoSubPregunta || '',
                });
            }
        }

        // ── 7. Construir grupos con sus respuestas ────────────────────
        const encCerradas = encuestas.filter(e => e.estado === 'cerrada');
        const gruposConDatos = grupos.map(g => {
            const todas     = g.preguntaIds.flatMap(pid => lookupResp[pid] || []);
            const principal = todas.filter(r => !r.esCondicional);
            return {
                ...g,
                totalRespuestas: principal.length,
                respuestasRaw:   principal,
                // esComun: aparece en 2+ encuestas (o en ≥50% de las cerradas si hay varias)
                esComun: g.encuestasAparece.length >= Math.max(2,
                    Math.ceil(encCerradas.length * 0.5)),
            };
        }).sort((a, b) => b.totalRespuestas - a.totalRespuestas);

        // ── 8. KPIs ───────────────────────────────────────────────────
        const totalGraduados   = graduadosBase.length;
        const totalEncuestas   = encuestas.length;
        const totalRespuestas  = respCompletadas.length;
        const gradRespondieron = new Set(
            respCompletadas.map(r => r.graduado?._id?.toString()).filter(Boolean)
        );
        const tasaRespuesta = totalGraduados > 0
            ? Math.round((gradRespondieron.size / totalGraduados) * 100) : 0;

        // ── 9. Historial de encuestas por graduado ────────────────────
        const gradRespMap = {};
        for (const r of respCompletadas) {
            const gid = r.graduado?._id?.toString();
            if (!gid) continue;
            if (!gradRespMap[gid]) gradRespMap[gid] = [];
            gradRespMap[gid].push(r.encuesta?._id?.toString());
        }

        const graduadosRaw = graduadosBase.map(g => ({
            _id:                  g._id.toString(),
            nombres:              g.nombres,
            apellidos:            g.apellidos,
            emailInstitucional:   g.emailInstitucional,
            anioGraduacion:       g.anioGraduacion,
            genero:               g.genero,
            provinciaActual:      g.provinciaActual,
            encuestasRespondidas: gradRespMap[g._id.toString()] || [],
            respondio:            (gradRespMap[g._id.toString()] || []).length > 0,
        }));

        // ── 10. Respuestas raw para tabla del frontend ─────────────────
        const respuestasRaw = respCompletadas.map(r => ({
            _id:             r._id.toString(),
            encuestaId:      r.encuesta?._id?.toString()  || '',
            encuestaTitulo:  r.encuesta?.titulo            || '',
            graduadoId:      r.graduado?._id?.toString()  || '',
            nombres:         r.graduado?.nombres          || '',
            apellidos:       r.graduado?.apellidos        || '',
            anioGraduacion:  r.graduado?.anioGraduacion   || null,
            genero:          r.graduado?.genero           || '',
            provinciaActual: r.graduado?.provinciaActual  || '',
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
            graduadosRaw,
            respuestasRaw,
            preguntasAgrupadas: gruposConDatos,
            kpis: {
                totalGraduados,
                totalEncuestas,
                totalRespuestas,
                tasaRespuesta,
                graduadosRespondieron: gradRespondieron.size,
            },
        });

    } catch (err) {
        console.error('Error en obtenerEstadisticasEncuesta:', err);
        res.status(500).json({ msg: 'Error al obtener estadísticas de encuestas.', error: err.message });
    }
};

module.exports = { obtenerEstadisticasGenerales, obtenerEstadisticasEncuesta };
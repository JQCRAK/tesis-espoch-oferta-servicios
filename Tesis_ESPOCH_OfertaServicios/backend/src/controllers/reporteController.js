// backend/src/controllers/reporteController.js
const Evento = require('../models/Evento');
const Encuesta = require('../models/Encuesta');
const Pregunta = require('../models/Pregunta');
const RespuestaEncuesta = require('../models/RespuestaEncuesta');
const RespuestaEmpleador = require('../models/RespuestaEmpleador');
const Admin = require('../models/Admin');
const { generarWord } = require('../services/reporteService');

const NOMBRES_COMPLETOS = {
    'cguerra@espoch.edu.ec': {
        nombre: 'Cristian Oswaldo',
        apellidos: 'Guerra Flores',
        cargo: 'Docente',
    },
    'jguallo@espoch.edu.ec': {
        nombre: 'Julio Francisco',
        apellidos: 'Guallo Paca',
        cargo: 'Docente',
    },
};

/* ══════════════════════════════════════════════════════════
   GET /api/admin/reportes/opciones-informe
══════════════════════════════════════════════════════════ */
exports.opcionesInforme = async (req, res) => {
    try {
        const [eventos, encGraduados, encEmpleadores] = await Promise.all([
            Evento.find({ estado: 'finalizado' })
                .select('titulo fechaInicio fechaFin')
                .sort({ fechaInicio: -1 }),
            Encuesta.find({ estado: 'cerrada', tipo: 'graduados' })
                .select('titulo fechaInicio fechaCierre totalRespuestas')
                .sort({ createdAt: -1 }),
            Encuesta.find({ estado: 'cerrada', tipo: 'empleadores' })
                .select('titulo fechaInicio fechaCierre totalRespuestas')
                .sort({ createdAt: -1 }),
        ]);
        res.json({ eventos, encGraduados, encEmpleadores });
    } catch (error) {
        console.error('[reporteController] opcionesInforme:', error);
        res.status(500).json({ msg: 'Error al cargar opciones', error: error.message });
    }
};

/* ══════════════════════════════════════════════════════════
   GET /api/admin/reportes/preview-encuesta/:id
══════════════════════════════════════════════════════════ */
exports.previewEncuesta = async (req, res) => {
    try {
        const { id } = req.params;

        const encuesta = await Encuesta.findById(id);
        if (!encuesta) return res.status(404).json({ msg: 'Encuesta no encontrada' });

        const preguntas = await Pregunta.find({ encuesta: id, tipo: { $ne: 'titulo' } })
            .sort({ orden: 1 });

        let respuestas = [];
        if (encuesta.tipo === 'graduados') {
            respuestas = await RespuestaEncuesta.find({
                encuesta: id,
                estado: 'completada',
                aceptoConsentimiento: true,
            }).lean();
        } else {
            respuestas = await RespuestaEmpleador.find({
                encuesta: id,
                estado: 'completada',
                aceptoConsentimiento: true,
            }).lean();
        }

        const totalRespuestas = respuestas.length;

        const estadisticas = preguntas.map(preg => {
            const pregId = preg._id.toString();

            /* ── MATRIZ ── */
            if (preg.esMatriz) {
                const itemsData = preg.items.map((item, idx) => {
                    const valores = {};
                    respuestas.forEach(r => {
                        const rp = r.respuestas.find(x =>
                            x.pregunta?.toString() === pregId && !x.esCondicional
                        );
                        if (rp && Array.isArray(rp.respuesta)) {
                            const fila = rp.respuesta.find(f => f.indice === idx);
                            if (fila && fila.valor !== undefined && fila.valor !== '') {
                                const k = String(fila.valor);
                                valores[k] = (valores[k] || 0) + 1;
                            }
                        }
                    });
                    return { item, valores };
                });

                // Calcular total por item para la leyenda
                const itemsDataConTotal = itemsData.map(d => ({
                    ...d,
                    totalFilas: Object.values(d.valores).reduce((s, v) => s + v, 0),
                }));

                return {
                    _id: preg._id,
                    texto: preg.texto,
                    tipo: preg.tipo,
                    esMatriz: true,
                    tipoGrafica: 'barras_apiladas',
                    datos: itemsDataConTotal,
                    total: totalRespuestas,
                    // ── NUEVOS: columnas y etiquetas para renderizar correctamente ──
                    opciones: preg.tipo === 'opcion_multiple'
                        ? preg.opciones || []
                        : null,
                    escalaMin: preg.tipo === 'escala' ? (preg.escalaMin ?? 1) : null,
                    escalaMax: preg.tipo === 'escala' ? (preg.escalaMax ?? 5) : null,
                    etiquetaMin: preg.etiquetaMin || '',
                    etiquetaMax: preg.etiquetaMax || '',
                };
            }

            /* ── TEXTO LIBRE ── */
            if (preg.tipo === 'texto_libre') {
                const freq = {};
                respuestas.forEach(r => {
                    const rp = r.respuestas.find(x =>
                        x.pregunta?.toString() === pregId && !x.esCondicional
                    );
                    if (rp && rp.respuesta) {
                        const original = String(rp.respuesta).trim();
                        if (!original) return;
                        const clave = original
                            .toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                        if (!freq[clave]) freq[clave] = { textoOriginal: original, cantidad: 0 };
                        freq[clave].cantidad += 1;
                    }
                });
                const datos = Object.values(freq)
                    .sort((a, b) => b.cantidad - a.cantidad)
                    .map(({ textoOriginal, cantidad }) => ({ opcion: textoOriginal, cantidad }));
                return {
                    _id: preg._id, texto: preg.texto, tipo: preg.tipo,
                    tipoGrafica: 'texto_libre', datos, total: totalRespuestas,
                };
            }

            /* ── OPCIÓN MÚLTIPLE / SI_NO ── */
            if (preg.tipo === 'opcion_multiple' || preg.tipo === 'si_no') {
                const freq = {};
                respuestas.forEach(r => {
                    const rp = r.respuestas.find(x =>
                        x.pregunta?.toString() === pregId && !x.esCondicional
                    );
                    if (rp && rp.respuesta !== null && rp.respuesta !== undefined && rp.respuesta !== '') {
                        freq[String(rp.respuesta)] = (freq[String(rp.respuesta)] || 0) + 1;
                    }
                });
                const datos = Object.entries(freq).map(([opcion, cantidad]) => ({ opcion, cantidad }));

                const condicionales = [];

                if (preg.tipo === 'si_no' && preg.tieneCondicional) {
                    const lados = [];
                    if (preg.preguntasCondicionalSi?.length > 0) lados.push('si');
                    if (preg.preguntasCondicionalNo?.length > 0) lados.push('no');

                    for (const lado of lados) {
                        const listaTxtPregs = lado === 'si' ? preg.preguntasCondicionalSi : preg.preguntasCondicionalNo;
                        const listaTipos = lado === 'si' ? (preg.tiposCondicionalSi || []) : (preg.tiposCondicionalNo || []);
                        const listaOpciones = lado === 'si' ? (preg.opcionesCondicionalSi || []) : (preg.opcionesCondicionalNo || []);

                        listaTxtPregs.forEach((textoPregSub, idx) => {
                            const tipoSub = listaTipos[idx] || 'texto_libre';
                            const opcionesSub = listaOpciones[idx] || [];

                            const respsSub = respuestas
                                .map(r => r.respuestas.find(x =>
                                    x.pregunta?.toString() === pregId &&
                                    x.esCondicional === true &&
                                    x.ladoCondicional === lado &&
                                    x.indiceCondicional === idx
                                ))
                                .filter(Boolean)
                                .map(x => x.respuesta)
                                .filter(v => v !== null && v !== undefined && v !== '');

                            if (respsSub.length === 0) return;

                            let tipoGrafica = 'dona';
                            let datosGrafica = [];

                            if (tipoSub === 'texto_libre') {
                                const freq = {};
                                respsSub.forEach(r => {
                                    String(r).toLowerCase()
                                        .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
                                        .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
                                        .split(/[,.\n;]+/).map(p => p.trim()).filter(p => p.length > 2)
                                        .forEach(p => { freq[p] = (freq[p] || 0) + 1; });
                                });
                                datosGrafica = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
                                    .map(([opcion, cantidad]) => ({ opcion, cantidad }));
                                tipoGrafica = 'texto_libre';

                            } else if (tipoSub === 'opcion_multiple') {
                                const freq = {};
                                respsSub.forEach(r => { freq[String(r)] = (freq[String(r)] || 0) + 1; });
                                datosGrafica = Object.entries(freq).map(([opcion, cantidad]) => ({ opcion, cantidad }));
                                tipoGrafica = 'dona';

                            } else if (tipoSub === 'checkboxes') {
                                const freq = {};
                                respsSub.forEach(r => {
                                    const arr = Array.isArray(r) ? r : [r];
                                    arr.forEach(v => { if (v) freq[String(v)] = (freq[String(v)] || 0) + 1; });
                                });
                                datosGrafica = Object.entries(freq).sort((a, b) => b[1] - a[1])
                                    .map(([opcion, cantidad]) => ({ opcion, cantidad }));
                                tipoGrafica = 'barras_h';

                            } else if (tipoSub === 'escala') {
                                // ── escala condicional: guardar como likert con etiquetas ──
                                const min = 1;
                                const max = opcionesSub.length > 0 ? opcionesSub.length : 5;
                                const freq = {};
                                for (let i = min; i <= max; i++) freq[String(i)] = 0;
                                respsSub.forEach(r => { freq[String(r)] = (freq[String(r)] || 0) + 1; });
                                datosGrafica = Object.entries(freq).map(([opcion, cantidad]) => ({ opcion, cantidad }));
                                tipoGrafica = 'likert';

                            } else if (tipoSub === 'numero') {
                                const freq = {};
                                respsSub.forEach(r => { freq[String(r)] = (freq[String(r)] || 0) + 1; });
                                datosGrafica = Object.entries(freq).sort((a, b) => Number(a[0]) - Number(b[0]))
                                    .map(([opcion, cantidad]) => ({ opcion, cantidad }));
                                tipoGrafica = 'barras_v';
                            }

                            if (datosGrafica.length === 0) return;

                            condicionales.push({
                                textoPregSub,
                                lado,
                                tipoGrafica,
                                datos: datosGrafica,
                                total: respsSub.length,
                                // etiquetas para escala condicional
                                etiquetaMin: '',
                                etiquetaMax: '',
                                escalaMin: 1,
                                escalaMax: opcionesSub.length > 0 ? opcionesSub.length : 5,
                            });
                        });
                    }
                }

                return {
                    _id: preg._id, texto: preg.texto, tipo: preg.tipo,
                    tipoGrafica: 'dona', datos, total: totalRespuestas,
                    condicionales,
                };
            }

            /* ── CHECKBOXES ── */
            if (preg.tipo === 'checkboxes') {
                const freq = {};
                respuestas.forEach(r => {
                    const rp = r.respuestas.find(x =>
                        x.pregunta?.toString() === pregId && !x.esCondicional
                    );
                    if (rp && rp.respuesta) {
                        const arr = Array.isArray(rp.respuesta) ? rp.respuesta : [rp.respuesta];
                        arr.forEach(v => { if (v) freq[String(v)] = (freq[String(v)] || 0) + 1; });
                    }
                });
                const datos = Object.entries(freq)
                    .sort((a, b) => b[1] - a[1])
                    .map(([opcion, cantidad]) => ({ opcion, cantidad }));
                return {
                    _id: preg._id, texto: preg.texto, tipo: preg.tipo,
                    tipoGrafica: 'barras_h', datos, total: totalRespuestas,
                };
            }

            /* ── ESCALA (normal, no matriz) ── */
            if (preg.tipo === 'escala') {
                const min = preg.escalaMin ?? 1;
                const max = preg.escalaMax ?? 5;
                const freq = {};
                for (let i = min; i <= max; i++) freq[String(i)] = 0;
                respuestas.forEach(r => {
                    const rp = r.respuestas.find(x =>
                        x.pregunta?.toString() === pregId && !x.esCondicional
                    );
                    if (rp && rp.respuesta !== null && rp.respuesta !== undefined) {
                        freq[String(rp.respuesta)] = (freq[String(rp.respuesta)] || 0) + 1;
                    }
                });
                const datos = Object.entries(freq).map(([opcion, cantidad]) => ({ opcion, cantidad }));
                return {
                    _id: preg._id,
                    texto: preg.texto,
                    tipo: preg.tipo,
                    // ── likert en vez de barras_v para mostrar barra apilada con etiquetas ──
                    tipoGrafica: 'likert',
                    datos,
                    total: totalRespuestas,
                    // ── NUEVOS: etiquetas y rango ──
                    escalaMin: min,
                    escalaMax: max,
                    etiquetaMin: preg.etiquetaMin || '',
                    etiquetaMax: preg.etiquetaMax || '',
                };
            }

            /* ── NÚMERO ── */
            if (preg.tipo === 'numero') {
                const valores = [];
                respuestas.forEach(r => {
                    const rp = r.respuestas.find(x =>
                        x.pregunta?.toString() === pregId && !x.esCondicional
                    );
                    if (rp && rp.respuesta !== null && rp.respuesta !== undefined && rp.respuesta !== '') {
                        valores.push(rp.respuesta);
                    }
                });
                const freq = {};
                valores.forEach(v => { freq[String(v)] = (freq[String(v)] || 0) + 1; });
                const datos = Object.entries(freq)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([opcion, cantidad]) => ({ opcion, cantidad }));
                return {
                    _id: preg._id, texto: preg.texto, tipo: preg.tipo,
                    tipoGrafica: 'barras_v', datos, total: totalRespuestas,
                };
            }

            return null;
        }).filter(Boolean);

        res.json({
            encuesta: { _id: encuesta._id, titulo: encuesta.titulo, tipo: encuesta.tipo },
            totalRespuestas,
            estadisticas,
        });
    } catch (error) {
        console.error('[reporteController] previewEncuesta:', error);
        res.status(500).json({ msg: 'Error al cargar preview', error: error.message });
    }
};

/* ══════════════════════════════════════════════════════════
   POST /api/admin/reportes/generar-informe
══════════════════════════════════════════════════════════ */
exports.generarInforme = async (req, res) => {
    try {
        const { eventoId, encuestaGraduadosId, encuestaEmpleadoresId, anio } = req.body;

        if (!eventoId || !encuestaGraduadosId || !encuestaEmpleadoresId || !anio) {
            return res.status(400).json({
                msg: 'Faltan campos obligatorios: eventoId, encuestaGraduadosId, encuestaEmpleadoresId, anio',
            });
        }

        const evento = await Evento.findById(eventoId).lean();
        if (!evento) return res.status(404).json({ msg: 'Evento no encontrado' });

        const [encGrad, encEmp] = await Promise.all([
            Encuesta.findById(encuestaGraduadosId).lean(),
            Encuesta.findById(encuestaEmpleadoresId).lean(),
        ]);
        if (!encGrad) return res.status(404).json({ msg: 'Encuesta de graduados no encontrada' });
        if (!encEmp) return res.status(404).json({ msg: 'Encuesta de empleadores no encontrada' });

        const [pregGrad, pregEmp] = await Promise.all([
            Pregunta.find({ encuesta: encuestaGraduadosId }).sort({ orden: 1 }).lean(),
            Pregunta.find({ encuesta: encuestaEmpleadoresId }).sort({ orden: 1 }).lean(),
        ]);

        const [respGrad, respEmp] = await Promise.all([
            RespuestaEncuesta.find({
                encuesta: encuestaGraduadosId,
                estado: 'completada',
                aceptoConsentimiento: true,
            }).lean(),
            RespuestaEmpleador.find({
                encuesta: encuestaEmpleadoresId,
                estado: 'completada',
                aceptoConsentimiento: true,
            }).lean(),
        ]);

        const adminsDB = await Admin.find({}).select('nombre email').lean();
        const admins = adminsDB.map(a => {
            const completo = NOMBRES_COMPLETOS[a.email?.toLowerCase()] || null;
            return {
                nombre: completo ? completo.nombre : a.nombre || '',
                apellidos: completo ? completo.apellidos : '',
                email: a.email || '',
                cargo: completo ? completo.cargo : 'Docente',
            };
        });

        console.log(`[reporteController] Generando informe — Evento: "${evento.titulo}", Año: ${anio}`);

        const buffer = await generarWord({
            evento,
            encuestaGraduados: encGrad,
            encuestaEmpleadores: encEmp,
            preguntasGraduados: pregGrad,
            preguntasEmpleadores: pregEmp,
            respuestasGraduados: respGrad,
            respuestasEmpleadores: respEmp,
            admins,
            anio: parseInt(anio),
        });

        const nombreArchivo = `Informe_Encuentro_Graduados_${anio}.docx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);

        console.log(`[reporteController] Word enviado: "${nombreArchivo}" (${buffer.length} bytes)`);
    } catch (error) {
        console.error('[reporteController] generarInforme:', error);
        res.status(500).json({ msg: 'Error al generar el informe Word', error: error.message });
    }
};
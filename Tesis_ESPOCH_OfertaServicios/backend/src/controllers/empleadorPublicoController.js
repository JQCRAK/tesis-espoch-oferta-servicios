// backend/src/controllers/empleadorPublicoController.js
const Empleador          = require('../models/Empleador');
const Encuesta           = require('../models/Encuesta');
const Pregunta           = require('../models/Pregunta');
const RespuestaEmpleador = require('../models/RespuestaEmpleador');

// ═══════════════════════════════════════════════════════════
// GET /api/empleador/encuesta?token=xxx
// Valida el token y devuelve: datos del empleador + encuesta + preguntas
// ═══════════════════════════════════════════════════════════
exports.getEncuesta = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ msg: 'Token requerido' });

        const empleador = await Empleador.findOne({ tokenEncuesta: token });
        if (!empleador)
            return res.status(404).json({ msg: 'Link inválido o no encontrado' });

        if (empleador.tokenUsado)
            return res.status(410).json({ msg: 'Este link ya fue utilizado. Gracias por su participación.' });

        if (empleador.tokenExpira && new Date() > new Date(empleador.tokenExpira))
            return res.status(410).json({ msg: 'Este link ha expirado. Comuníquese con la carrera.' });

        const encuesta = await Encuesta.findById(empleador.encuestaAsociada)
            .select('titulo descripcion consentimientoInformado fechaCierre estado');

        if (!encuesta)
            return res.status(404).json({ msg: 'Encuesta no encontrada' });

        if (encuesta.estado !== 'activa')
            return res.status(403).json({ msg: 'La encuesta ya no está activa' });

        const preguntas = await Pregunta.find({ encuesta: encuesta._id }).sort({ orden: 1 });

        res.json({
            empleador: {
                nombreEmpresa:     empleador.nombreEmpresa,
                nombreGerente:     empleador.nombreGerente,
                emailOrganizacion: empleador.emailOrganizacion,
                tipoCapital:       empleador.tipoCapital,
                tipoActividad:     empleador.tipoActividad,
                encuestado:        empleador.encuestado,
            },
            encuesta: {
                _id:                     encuesta._id,
                titulo:                  encuesta.titulo,
                descripcion:             encuesta.descripcion,
                consentimientoInformado: encuesta.consentimientoInformado,
                fechaCierre:             encuesta.fechaCierre,
            },
            preguntas,
        });
    } catch (error) {
        console.error('Error en GET /empleador/encuesta:', error);
        res.status(500).json({ msg: 'Error al cargar la encuesta', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// PATCH /api/empleador/encuesta/datos-encuestado?token=xxx
// Guarda los datos del encuestado antes de responder
// ═══════════════════════════════════════════════════════════
exports.guardarDatosEncuestado = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ msg: 'Token requerido' });

        const empleador = await Empleador.findOne({ tokenEncuesta: token });
        if (!empleador)          return res.status(404).json({ msg: 'Token inválido' });
        if (empleador.tokenUsado) return res.status(410).json({ msg: 'Este link ya fue utilizado' });

        const {
            nombresApellidos, edad, genero, cargo, profesion,
            aniosServicio, email, telefono, estudiosEspoch,
        } = req.body;

        empleador.encuestado = {
            nombresApellidos: nombresApellidos || '',
            edad:             edad ? Number(edad) : null,
            genero:           genero    || '',
            cargo:            cargo     || '',
            profesion:        profesion || '',
            aniosServicio:    aniosServicio ? Number(aniosServicio) : null,
            email:            email    || '',
            telefono:         telefono || '',
            estudiosEspoch:   estudiosEspoch || '',
        };

        await empleador.save();
        res.json({ msg: 'Datos guardados correctamente' });
    } catch (error) {
        console.error('Error guardando datos encuestado:', error);
        res.status(500).json({ msg: 'Error al guardar datos', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// POST /api/empleador/encuesta/responder?token=xxx
// Guarda las respuestas del empleador y marca el token como usado
// ═══════════════════════════════════════════════════════════
exports.responderEncuesta = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ msg: 'Token requerido' });

        const empleador = await Empleador.findOne({ tokenEncuesta: token });
        if (!empleador)           return res.status(404).json({ msg: 'Token inválido' });
        if (empleador.tokenUsado) return res.status(410).json({ msg: 'Este link ya fue utilizado' });
        if (empleador.tokenExpira && new Date() > new Date(empleador.tokenExpira))
            return res.status(410).json({ msg: 'Este link ha expirado' });

        const { aceptoConsentimiento, respuestas } = req.body;

        // ── No aceptó consentimiento ──────────────────────────
        if (!aceptoConsentimiento) {
            await RespuestaEmpleador.create({
                encuesta:             empleador.encuestaAsociada,
                empleador:            empleador._id,
                aceptoConsentimiento: false,
                datosEncuestado:      empleador.encuestado || {},
                respuestas:           [],
                estado:               'no_consintio',
            });
            empleador.tokenUsado = true;
            await empleador.save();
            return res.json({ msg: 'Participación registrada como no consentida' });
        }

        // ── Cargar preguntas ──────────────────────────────────
        const preguntas = await Pregunta.find({ encuesta: empleador.encuestaAsociada })
            .sort({ orden: 1 });

        const respuestasArray = [];

        for (const preg of preguntas) {
            if (preg.tipo === 'titulo') continue;

            const pregId = preg._id.toString();

            if (preg.esMatriz && preg.items?.length > 0) {
                const filasRespondidas = [];
                preg.items.forEach((item, idx) => {
                    const clave = `${pregId}_item_${idx}`;
                    if (respuestas[clave] !== undefined && respuestas[clave] !== null && respuestas[clave] !== '') {
                        filasRespondidas.push({ item, indice: idx, valor: respuestas[clave] });
                    }
                });
                respuestasArray.push({ pregunta: preg._id, respuesta: filasRespondidas });
            } else {
                const valor = respuestas[pregId];
                respuestasArray.push({
                    pregunta:  preg._id,
                    respuesta: valor !== undefined ? valor : null,
                });

                if (preg.tipo === 'si_no' && preg.tieneCondicional) {
                    if (valor === 'Sí' && preg.preguntasCondicionalSi?.length > 0) {
                        preg.preguntasCondicionalSi.forEach((textoSub, j) => {
                            const clave = `${pregId}_si_${j}`;
                            respuestasArray.push({
                                pregunta:          preg._id,
                                esCondicional:     true,
                                ladoCondicional:   'si',
                                indiceCondicional: j,
                                textoSubPregunta:  textoSub,
                                respuesta:         respuestas[clave] ?? null,
                            });
                        });
                    }
                    if (valor === 'No' && preg.preguntasCondicionalNo?.length > 0) {
                        preg.preguntasCondicionalNo.forEach((textoSub, j) => {
                            const clave = `${pregId}_no_${j}`;
                            respuestasArray.push({
                                pregunta:          preg._id,
                                esCondicional:     true,
                                ladoCondicional:   'no',
                                indiceCondicional: j,
                                textoSubPregunta:  textoSub,
                                respuesta:         respuestas[clave] ?? null,
                            });
                        });
                    }
                }
            }
        }

        // ── Guardar respuesta ─────────────────────────────────
        await RespuestaEmpleador.create({
            encuesta:             empleador.encuestaAsociada,
            empleador:            empleador._id,
            aceptoConsentimiento: true,
            datosEncuestado:      empleador.encuestado || {},
            respuestas:           respuestasArray,
            estado:               'completada',
        });

        // ── Actualizar contador en la encuesta ────────────────
        const encuestaDoc = await Encuesta.findById(empleador.encuestaAsociada);
        if (encuestaDoc) {
            encuestaDoc.totalRespuestas = (encuestaDoc.totalRespuestas || 0) + 1;
            await encuestaDoc.save();
        }

        // ── Marcar token como usado ───────────────────────────
        empleador.tokenUsado = true;
        await empleador.save();

        res.json({ msg: 'Respuesta guardada correctamente' });
    } catch (error) {
        console.error('Error en POST /empleador/encuesta/responder:', error);
        res.status(500).json({ msg: 'Error al guardar respuesta', error: error.message });
    }
};
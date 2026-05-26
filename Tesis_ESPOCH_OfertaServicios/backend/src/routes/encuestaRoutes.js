const express = require('express');
const router = express.Router();
const { protegerRuta, soloRol } = require('../middleware/auth');
const encuestaController = require('../controllers/encuestaController');
const notificacionController = require('../controllers/notificacionController');
const perfilController = require('../controllers/perfilController');

const guardAdmin    = [protegerRuta, soloRol('admin')];
const guardGraduado = [protegerRuta, soloRol('graduado')];

// ═════════════════════════════════════════════════════════
// ENCUESTAS — CRUD (Admin)
// ═════════════════════════════════════════════════════════

router.post  ('/encuestas',               ...guardAdmin, encuestaController.crearEncuesta);
router.get   ('/encuestas',               ...guardAdmin, encuestaController.listarEncuestas);
router.get   ('/encuestas/:id',           ...guardAdmin, encuestaController.obtenerEncuesta);
router.patch ('/encuestas/:id',           ...guardAdmin, encuestaController.actualizarEncuesta);
router.post  ('/encuestas/:id/duplicar',  ...guardAdmin, encuestaController.duplicarEncuesta);
router.delete('/encuestas/:id',           ...guardAdmin, encuestaController.eliminarEncuesta);

// ── NOTIFICAR GRADUADOS (Admin, solo encuestas activas) ──
router.post('/encuestas/:id/notificar', ...guardAdmin, encuestaController.notificarGraduados);


// ═════════════════════════════════════════════════════════
// PREGUNTAS — CRUD (Admin)
// ═════════════════════════════════════════════════════════

router.post  ('/encuestas/:encuestaId/preguntas', ...guardAdmin, encuestaController.crearPregunta);
router.get   ('/encuestas/:encuestaId/preguntas', ...guardAdmin, encuestaController.obtenerPreguntas);
router.patch ('/preguntas/:preguntaId',           ...guardAdmin, encuestaController.actualizarPregunta);
router.delete('/preguntas/:preguntaId',           ...guardAdmin, encuestaController.eliminarPregunta);

// ═════════════════════════════════════════════════════════
// ENCUESTAS — Vista del Graduado
// ═════════════════════════════════════════════════════════

router.get('/graduado/encuestas', ...guardGraduado, encuestaController.listarEncuestasGraduado);
router.get('/graduado/encuestas/:encuestaId/preguntas', ...guardGraduado, encuestaController.obtenerPreguntas);
router.post('/encuestas/:encuestaId/respuestas', ...guardGraduado, encuestaController.guardarRespuesta);
router.get('/encuestas/:encuestaId/verificar-respuesta', ...guardGraduado, encuestaController.verificarRespuesta);

// ═════════════════════════════════════════════════════════
// RESPUESTAS — Resultados (Admin)
// ═════════════════════════════════════════════════════════

router.get('/encuestas/:encuestaId/respuestas', ...guardAdmin, encuestaController.obtenerRespuestas);

// ═════════════════════════════════════════════════════════
// NOTIFICACIONES IN-APP (Graduado)
// ═════════════════════════════════════════════════════════

router.get   ('/notificaciones',            ...guardGraduado, notificacionController.listarNotificaciones);
router.patch ('/notificaciones/leer-todas', ...guardGraduado, notificacionController.marcarTodasLeidas);
router.patch ('/notificaciones/:id/leer',   ...guardGraduado, notificacionController.marcarLeida);

router.post('/encuestas/:id/notificar-empleadores', ...guardAdmin, encuestaController.notificarEmpleadores);


// ═════════════════════════════════════════════════════════
// DATOS PERSONALES PARA ENCUESTA (Graduado)
// ═════════════════════════════════════════════════════════

router.get  ('/graduado/datos-encuesta', ...guardGraduado, perfilController.obtenerDatosEncuesta);
router.patch('/graduado/datos-encuesta', ...guardGraduado, perfilController.actualizarDatosEncuesta);

module.exports = router;
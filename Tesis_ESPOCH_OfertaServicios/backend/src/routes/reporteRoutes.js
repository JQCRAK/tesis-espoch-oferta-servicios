// backend/src/routes/reporteRoutes.js
const express = require('express');
const router  = express.Router();
const { protegerRuta, soloRol } = require('../middleware/auth');
const ctrl = require('../controllers/reporteController');

const guard = [protegerRuta, soloRol('admin')];

// Opciones para los selectores del modal (eventos + encuestas cerradas)
router.get('/opciones-informe',         ...guard, ctrl.opcionesInforme);

// Preview estadístico de una encuesta cerrada (para mostrar gráficas en el modal)
router.get('/preview-encuesta/:id',     ...guard, ctrl.previewEncuesta);

// Generar y descargar el Word del Informe Encuentro de Graduados
router.post('/generar-informe',         ...guard, ctrl.generarInforme);

module.exports = router;
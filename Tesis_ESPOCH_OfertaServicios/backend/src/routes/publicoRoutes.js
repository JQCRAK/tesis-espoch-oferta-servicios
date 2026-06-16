// backend/src/routes/publicoRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/publicoController');

router.get('/stats',            ctrl.getStats);
router.get('/graduados',        ctrl.listarGraduadosPublicos);
router.get('/graduado/:id',     ctrl.getPerfilPublico);
router.get('/proyectos',        ctrl.listarProyectosPublicos);
router.get('/top-tecnologias',  ctrl.topTecnologias);

router.post('/contacto',        ctrl.contacto);
router.post('/notificar',       ctrl.notificar);

module.exports = router;
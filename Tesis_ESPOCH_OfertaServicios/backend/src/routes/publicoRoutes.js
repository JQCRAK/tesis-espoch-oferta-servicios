// backend/src/routes/publicoRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/publicoController');

router.get ('/graduados',      ctrl.listarGraduadosPublicos);
router.get ('/graduado/:id',   ctrl.getPerfilPublico);

// ── NUEVO: proyectos públicos filtrados por tendencia semanal ──
router.get ('/proyectos',      ctrl.listarProyectosPublicos);

// ── contacto/notificar (alias: ambas rutas funcionan) ──
router.post('/contacto',       ctrl.contacto);
router.post('/notificar',      ctrl.notificar);

module.exports = router;
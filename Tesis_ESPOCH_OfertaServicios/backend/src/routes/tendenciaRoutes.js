// backend/src/routes/tendenciaRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/tendenciaController');
const { protegerRuta } = require('../middleware/auth');

// ── Pública ──
router.get('/tendencia', ctrl.getTendenciaActual);

// ── Admin — requieren token ──
router.put   ('/admin/tendencia',       protegerRuta, ctrl.setTendenciaManual);
router.delete('/admin/tendencia/reset', protegerRuta, ctrl.resetTendencia);

module.exports = router;
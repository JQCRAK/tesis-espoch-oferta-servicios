// routes/tesisRoutes.js
const express    = require('express');
const router     = express.Router();
const { obtenerMiTesis, verificarTesis, aceptarConsentimiento } = require('../controllers/tesisController');
const { protegerRuta } = require('../middleware/auth'); // ← CAMBIO AQUÍ

router.get ('/mi-tesis',               protegerRuta, obtenerMiTesis);
router.post('/verificar',              protegerRuta, verificarTesis);
router.post('/aceptar-consentimiento', protegerRuta, aceptarConsentimiento);

module.exports = router;
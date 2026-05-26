// backend/src/routes/notificacionAdminRoutes.js
const express        = require('express');
const router         = express.Router();
const { protegerRuta, soloRol } = require('../middleware/auth');
const ctrl           = require('../controllers/notificacionAdminController');

router.get ('/',            protegerRuta, soloRol('admin'), ctrl.listar);
router.patch('/leer-todas', protegerRuta, soloRol('admin'), ctrl.marcarTodasLeidas);
router.patch('/:id/leer',   protegerRuta, soloRol('admin'), ctrl.marcarLeida);

module.exports = router;
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/empleadorPublicoController');

router.get   ('/encuesta',                 ctrl.getEncuesta);
router.patch ('/encuesta/datos-encuestado', ctrl.guardarDatosEncuestado);
router.post  ('/encuesta/responder',        ctrl.responderEncuesta);

module.exports = router;
const express = require('express');
const router = express.Router();
const { obtenerCertificados, crearCertificado, actualizarCertificado, eliminarCertificado } = require('../controllers/certificadoController');
const { protegerRuta } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/',       protegerRuta, obtenerCertificados);
router.post('/',      protegerRuta, upload.single('archivo'), crearCertificado);
router.put('/:id',    protegerRuta, upload.single('archivo'), actualizarCertificado);
router.delete('/:id', protegerRuta, eliminarCertificado);

module.exports = router;
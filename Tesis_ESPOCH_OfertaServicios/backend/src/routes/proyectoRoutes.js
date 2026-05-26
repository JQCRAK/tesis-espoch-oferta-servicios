const express = require('express');
const router = express.Router();
const { obtenerProyectos, crearProyecto, actualizarProyecto, eliminarProyecto } = require('../controllers/proyectoController');
const { protegerRuta } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/',       protegerRuta, obtenerProyectos);
router.post('/',      protegerRuta, upload.single('imagen'), crearProyecto);
router.put('/:id',    protegerRuta, upload.single('imagen'), actualizarProyecto);
router.delete('/:id', protegerRuta, eliminarProyecto);

module.exports = router;
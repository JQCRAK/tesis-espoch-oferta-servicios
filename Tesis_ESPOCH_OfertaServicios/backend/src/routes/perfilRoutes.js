const express = require('express');
const router = express.Router();
const {
    obtenerPerfil,
    actualizarPerfil,
    subirFotoPerfil,
    verificarCompletitudPerfil,
    marcarBienvenida          
} = require('../controllers/perfilController');
const { protegerRuta } = require('../middleware/auth');
const { upload, cargarNombreGraduado } = require('../middleware/upload');

router.get('/mi-perfil', protegerRuta, obtenerPerfil);
router.put('/actualizar', protegerRuta, actualizarPerfil);
router.get('/verificar-completitud', protegerRuta, verificarCompletitudPerfil); 
router.post('/foto', protegerRuta, cargarNombreGraduado, upload.single('foto'), subirFotoPerfil);
router.post('/marcar-bienvenida', protegerRuta, marcarBienvenida);

module.exports = router;
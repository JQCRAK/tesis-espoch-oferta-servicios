const express = require('express');
const router = express.Router();
const {
    obtenerPerfil,
    actualizarPerfil,
    subirFotoPerfil,
    verificarCompletitudPerfil,
    marcarBienvenida,
    agregarExperiencia,
    editarExperiencia,
    eliminarExperiencia,
    agregarEducacion,
    editarEducacion,
    eliminarEducacion,
    descargarHojaVidaPDF,
    descargarHojaVidaDOCX,
    obtenerDatosHojaVida,
} = require('../controllers/perfilController');
const { protegerRuta } = require('../middleware/auth');
const { upload, cargarNombreGraduado } = require('../middleware/upload');

router.get('/mi-perfil', protegerRuta, obtenerPerfil);
router.put('/actualizar', protegerRuta, actualizarPerfil);
router.get('/verificar-completitud', protegerRuta, verificarCompletitudPerfil);
router.post('/foto', protegerRuta, cargarNombreGraduado, upload.single('foto'), subirFotoPerfil);
router.post('/marcar-bienvenida', protegerRuta, marcarBienvenida);

// ─── Experiencias laborales ───────────────────────
router.post  ('/experiencias',         protegerRuta, agregarExperiencia);
router.put   ('/experiencias/:expId',  protegerRuta, editarExperiencia);
router.delete('/experiencias/:expId',  protegerRuta, eliminarExperiencia);

// ─── Educacion formal ─────────────────────────────
router.post  ('/educacion',            protegerRuta, agregarEducacion);
router.put   ('/educacion/:eduId',     protegerRuta, editarEducacion);
router.delete('/educacion/:eduId',     protegerRuta, eliminarEducacion);

// ─── Hoja de Vida (descarga + preview) ────────────
router.get   ('/hoja-vida/datos',      protegerRuta, obtenerDatosHojaVida);
router.get   ('/hoja-vida/pdf',        protegerRuta, descargarHojaVidaPDF);
router.get   ('/hoja-vida/docx',       protegerRuta, descargarHojaVidaDOCX);

module.exports = router;
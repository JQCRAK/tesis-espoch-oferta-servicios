const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const verificacionAnteriorController = require('../controllers/verificacionAnteriorController');
const upload = require('../middleware/upload');

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET no definido — usando valor por defecto (SOLO DESARROLLO)');
}

// ══════════════════════════════════════════════════════════════
// RUTA FLUJO B — Verificación por cédula + DSpace (sin JWT)
// ══════════════════════════════════════════════════════════════
router.post(
    '/verificar-cedula-dspace',
    upload.fields([
        { name: 'cedula_frontal',   maxCount: 1 },
        { name: 'cedula_posterior', maxCount: 1 },
    ]),
    verificacionAnteriorController.verificarCedulaDspace
);

// ══════════════════════════════════════════════════════════════
// RUTAS DE REGISTRO CON CÓDIGO DE VERIFICACIÓN (Flujo A)
// ══════════════════════════════════════════════════════════════
router.post('/validar-duplicados-graduado',    authController.validarDuplicadosGraduado);
router.post('/solicitar-codigo-verificacion',  authController.solicitarCodigoVerificacion);
router.post('/verificar-codigo',               authController.verificarCodigo);
router.post('/registro-graduado-final',        authController.registrarGraduado);

// ══════════════════════════════════════════════════════════════
// RUTAS DE LOGIN Y RECUPERACIÓN
// ══════════════════════════════════════════════════════════════
router.post('/login',                              authController.loginUsuario);
router.post('/solicitar-codigo-recuperacion',      authController.solicitarCodigoRecuperacion);
router.post('/verificar-codigo-y-cambiar-password', authController.verificarCodigoYCambiarPassword);

module.exports = router;
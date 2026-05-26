const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET no definido — usando valor por defecto (SOLO DESARROLLO)');
}

// ══════════════════════════════════════════════════════════════
// RUTAS DE REGISTRO CON CÓDIGO DE VERIFICACIÓN
// ══════════════════════════════════════════════════════════════

router.post('/validar-duplicados-graduado', authController.validarDuplicadosGraduado);
router.post('/solicitar-codigo-verificacion', authController.solicitarCodigoVerificacion);
router.post('/verificar-codigo', authController.verificarCodigo);
router.post('/registro-graduado-final', authController.registrarGraduado);


// ══════════════════════════════════════════════════════════════
// RUTAS DE LOGIN Y RECUPERACIÓN
// ══════════════════════════════════════════════════════════════

router.post('/login', authController.loginUsuario);

// NUEVAS RUTAS: Recuperación de contraseña
router.post('/solicitar-codigo-recuperacion', authController.solicitarCodigoRecuperacion);
router.post('/verificar-codigo-y-cambiar-password', authController.verificarCodigoYCambiarPassword);

module.exports = router;
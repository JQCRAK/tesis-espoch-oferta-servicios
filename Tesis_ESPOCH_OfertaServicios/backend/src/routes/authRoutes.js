const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const authController               = require('../controllers/authController');
const verificacionAnteriorController = require('../controllers/verificacionAnteriorController');

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET no definido — usando valor por defecto (SOLO DESARROLLO)');
}

// ── Multer local solo para fotos de cédula (verificación temporal) ────────────
// NO va a Cloudinary — los archivos se eliminan tras la verificación en el controller
const uploadCedula = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(__dirname, '..', 'uploads', 'cedulas_tmp');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `cedula_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const ok = /image\/(jpeg|png|webp)/.test(file.mimetype);
        ok ? cb(null, true) : cb(new Error('Solo imágenes JPG, PNG o WEBP'));
    },
});

// ══════════════════════════════════════════════════════════════
// RUTA FLUJO B — Verificación por cédula + DSpace (sin JWT)
// ══════════════════════════════════════════════════════════════
router.post(
    '/verificar-cedula-dspace',
    uploadCedula.fields([
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
router.post('/login',                               authController.loginUsuario);
router.post('/solicitar-codigo-recuperacion',       authController.solicitarCodigoRecuperacion);
router.post('/verificar-codigo-y-cambiar-password', authController.verificarCodigoYCambiarPassword);

module.exports = router;
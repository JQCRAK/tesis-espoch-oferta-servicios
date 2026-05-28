// backend/src/routes/adminRoutes.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { protegerRuta, soloRol } = require('../middleware/auth');
const ctrl     = require('../controllers/adminController');
const ctrlStats = require('../controllers/estadisticasController');
const { getEstadisticasEmpleadores } = require('../controllers/estadisticasEmpleadorController');

const guard = [protegerRuta, soloRol('admin')];

const uploadCSV = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
        else cb(new Error('Solo se permiten archivos CSV.'));
    },
});

// ── MÉTRICAS ──────────────────────────────────────────────
router.get('/metricas',          ...guard, ctrl.getMetricas);
router.get('/anios-graduacion',  ...guard, ctrl.getAniosGraduacion);

// ── GRADUADOS ─────────────────────────────────────────────
router.get   ('/graduados',                          ...guard, ctrl.listarGraduados);
router.get   ('/graduados/:id',                      ...guard, ctrl.getGraduadoPorId);
router.patch ('/graduados/:id',                      ...guard, ctrl.editarGraduado);
router.patch ('/graduados/:id/verificar',            ...guard, ctrl.verificarGraduado);
router.patch ('/graduados/:id/bloquear',             ...guard, ctrl.bloquearGraduado);
router.get   ('/graduados/:id/proyectos',            ...guard, ctrl.getProyectosGraduado);
router.delete('/graduados/:id/proyectos/:proyId',    ...guard, ctrl.eliminarProyectoGraduado);
router.get   ('/graduados/:id/certificados',         ...guard, ctrl.getCertificadosGraduado);
router.delete('/graduados/:id/certificados/:certId', ...guard, ctrl.eliminarCertificadoGraduado);
router.delete('/graduados/:id',                      ...guard, ctrl.eliminarGraduado);

// ── REGISTRO Y CARGA MASIVA GRADUADOS ────────────────────
router.post('/graduados/registro-individual', ...guard, ctrl.registroIndividualGraduado);
router.post('/graduados/carga-masiva',        ...guard, uploadCSV.single('archivo'), ctrl.cargaMasivaGraduados);
router.get ('/plantilla-csv',                 ...guard, ctrl.plantillaCSVGraduados);

// ── EMPLEADORES ───────────────────────────────────────────
router.get   ('/empleadores/metricas',           ...guard, ctrl.getMetricasEmpleadores);
router.get   ('/empleadores/plantilla-csv',      ...guard, ctrl.plantillaCSVEmpleadores);
router.post  ('/empleadores/registro-individual',...guard, ctrl.registroIndividualEmpleador);
router.post  ('/empleadores/carga-masiva',       ...guard, uploadCSV.single('archivo'), ctrl.cargaMasivaEmpleadores);
router.get   ('/empleadores',                    ...guard, ctrl.listarEmpleadores);
router.get   ('/empleadores/:id',                ...guard, ctrl.getEmpleadorPorId);
router.patch ('/empleadores/:id',                ...guard, ctrl.editarEmpleador);
router.delete('/empleadores/:id',                ...guard, ctrl.eliminarEmpleador);

// ── ESTADÍSTICAS EMPLEADORES ──────────────────────────────
router.get('/estadisticas-empleadores', ...guard, getEstadisticasEmpleadores);

// ── REPORTES ──────────────────────────────────────────────
router.get('/reportes/metricas',            ...guard, ctrl.getMetricasReportes);
router.get('/reportes/anexo25-graduados',   ...guard, ctrl.getReporteAnexo25Graduados);
router.get('/reportes/anexo25-empleadores', ...guard, ctrl.getReporteAnexo25Empleadores);

// ── ESTADÍSTICAS GENERALES ────────────────────────────────
router.get('/estadisticas',              ...guard, ctrlStats.obtenerEstadisticasGenerales);
router.get('/estadisticas/encuesta', ...guard, ctrlStats.obtenerEstadisticasEncuesta);

module.exports = router;
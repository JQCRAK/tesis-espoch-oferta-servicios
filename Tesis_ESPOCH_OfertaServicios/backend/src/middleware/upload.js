// backend/src/middleware/upload.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Graduado = require('../models/Graduado');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Filtro de archivos (compartido) ────────────────────── */
const filtroArchivos = (req, file, cb) => {
  const tipo = req.query.tipo || 'general';
  if (tipo === 'certificado') {
    const ok = /jpeg|jpg|png|webp|pdf/.test(file.originalname.split('.').pop().toLowerCase())
            && /image\/(jpeg|png|webp)|application\/pdf/.test(file.mimetype);
    return ok ? cb(null, true) : cb(new Error('Solo JPG, PNG, WEBP o PDF'), false);
  }
  const ok = /jpeg|jpg|png|webp/.test(file.originalname.split('.').pop().toLowerCase())
          && /image\/(jpeg|png|webp)/.test(file.mimetype);
  return ok ? cb(null, true) : cb(new Error('Solo imagenes JPG, PNG o WEBP'), false);
};

/* ── Storage para graduados (carpeta dinámica por ID) ───── */
const storageGraduados = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const graduadoId = req.usuario?.id || 'sin_id';
    const tipo = req.query.tipo || 'general';
    return {
      folder: `portal-graduados/graduados/${graduadoId}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${tipo}_${Date.now()}`,
      transformation: tipo === 'perfil'
        ? [{ width: 500, height: 500, crop: 'fill' }]
        : [],
    };
  },
});

/* ── Storage para eventos ───────────────────────────────── */
const storageEventos = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'portal-graduados/eventos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: `evento_${Date.now()}`,
  }),
});

/* ── Storage para noticias ──────────────────────────────── */
const storageNoticias = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'portal-graduados/noticias',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: `noticia_${Date.now()}`,
  }),
});

/* ── Upload principal para graduados ────────────────────── */
const upload = multer({
  storage: storageGraduados,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: filtroArchivos,
});

/* ── Uploads específicos para eventos y noticias ─────────── */
const uploadEventos = multer({
  storage: storageEventos,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: filtroArchivos,
});

const uploadNoticias = multer({
  storage: storageNoticias,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: filtroArchivos,
});

/* ── Middleware que carga el nombre del graduado ─────────── */
const cargarNombreGraduado = async (req, res, next) => {
  try {
    const grad = await Graduado.findById(req.usuario.id).select('nombres');
    req.graduadoNombre = grad?.nombres || 'Usuario';
    next();
  } catch {
    req.graduadoNombre = 'Usuario';
    next();
  }
};

/* ── Exportar todo ───────────────────────────────────────── */
module.exports = { upload, cargarNombreGraduado, uploadEventos, uploadNoticias };
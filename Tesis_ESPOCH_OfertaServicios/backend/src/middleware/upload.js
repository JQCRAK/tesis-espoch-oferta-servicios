// backend/src/middleware/upload.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const Graduado = require('../models/Graduado');

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

/* ── Motor de almacenamiento local en disco ──
   Guarda el archivo en backend/src/uploads/<carpeta>[/<graduadoId>]
   y deja en req.file.path una ruta RELATIVA (ej. "uploads/graduados/
   <id>/perfil_169....jpg"), que es el formato que ya usa el resto
   del backend (borrado de archivos, hoja de vida) y el frontend
   (prefijo VITE_BASE_URL) para resolver las imágenes.          ── */
const crearStorageLocal = (carpeta, { porGraduado = false } = {}) => ({
  _handleFile(req, file, cb) {
    const graduadoId = porGraduado ? (req.usuario?.id || 'sin_id') : null;
    const dirRelativo = path.posix.join('uploads', carpeta, ...(graduadoId ? [graduadoId] : []));
    const dirAbsoluto = path.join(__dirname, '..', dirRelativo);

    try {
      fs.mkdirSync(dirAbsoluto, { recursive: true });
    } catch (err) {
      return cb(err);
    }

    const tipo = req.query.tipo || 'general';
    const ext = path.extname(file.originalname).toLowerCase();
    const nombreArchivo = `${tipo}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const rutaAbsoluta = path.join(dirAbsoluto, nombreArchivo);
    const rutaRelativa = path.posix.join(dirRelativo, nombreArchivo);

    const writeStream = fs.createWriteStream(rutaAbsoluta);
    file.stream.pipe(writeStream);
    writeStream.on('error', cb);
    writeStream.on('finish', () => {
      cb(null, {
        path: rutaRelativa,
        filename: nombreArchivo,
        size: writeStream.bytesWritten,
      });
    });
  },
  _removeFile(req, file, cb) {
    fs.unlink(path.join(__dirname, '..', file.path), () => cb());
  },
});

/* ── Storage para graduados (carpeta dinámica por ID) ───── */
const storageGraduados = crearStorageLocal('graduados', { porGraduado: true });

/* ── Storage para eventos ───────────────────────────────── */
const storageEventos = crearStorageLocal('eventos');

/* ── Storage para noticias ──────────────────────────────── */
const storageNoticias = crearStorageLocal('noticias');

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

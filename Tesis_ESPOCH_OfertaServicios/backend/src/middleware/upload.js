// backend/src/middleware/upload.js
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Graduado = require('../models/Graduado');

const crearCarpeta = (carpeta) => {
    if (!fs.existsSync(carpeta)) {
        fs.mkdirSync(carpeta, { recursive: true });
    }
};

const sanitizar = (texto) => {
    if (!texto) return '';
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50);
};

/* ── Storage para graduados (carpeta dinámica por ID) ───── */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const graduadoId = req.usuario?.id || 'sin_id';
        const carpeta = path.join(__dirname, '..', 'uploads', 'graduados', graduadoId);
        console.log('📁 Multer guardará en:', carpeta);
        crearCarpeta(carpeta);
        cb(null, carpeta);
    },
    filename: (req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const tipo = req.query.tipo || 'general';

        if (tipo === 'perfil') {
            const nombre = sanitizar(req.graduadoNombre || 'Usuario');
            return cb(null, nombre + '_Perfil' + ext);
        }
        if (tipo === 'proyecto') {
            const titulo = sanitizar(req.body?.titulo || 'Proyecto');
            return cb(null, titulo + '_P1' + ext);
        }
        if (tipo === 'certificado') {
            const titulo = sanitizar(req.body?.titulo || 'Certificado');
            return cb(null, titulo + '_C1' + ext);
        }
        cb(null, 'archivo_' + Date.now() + ext);
    },
});

/* ── Filtro de archivos (compartido) ────────────────────── */
const filtroArchivos = (req, file, cb) => {
    const tipo = req.query.tipo || 'general';
    if (tipo === 'certificado') {
        const ok = /jpeg|jpg|png|webp|pdf/.test(path.extname(file.originalname).toLowerCase())
                && /image\/(jpeg|png|webp)|application\/pdf/.test(file.mimetype);
        return ok ? cb(null, true) : cb(new Error('Solo JPG, PNG, WEBP o PDF'), false);
    }
    const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())
            && /image\/(jpeg|png|webp)/.test(file.mimetype);
    return ok ? cb(null, true) : cb(new Error('Solo imagenes JPG, PNG o WEBP'), false);
};

/* ── Upload principal para graduados ────────────────────── */
const upload = multer({
    storage,
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

/* ── Storage genérico para carpetas fijas ───────────────── */
const storageGenerico = (subcarpeta) => multer.diskStorage({
    destination: (req, file, cb) => {
        const carpeta = path.join(__dirname, '..', 'uploads', subcarpeta);
        crearCarpeta(carpeta);
        cb(null, carpeta);
    },
    filename: (req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const base = sanitizar(req.body?.titulo || subcarpeta);
        cb(null, `${base}_${Date.now()}${ext}`);
    },
});

/* ── Uploads específicos para eventos y noticias ─────────── */
const uploadEventos = multer({
    storage:    storageGenerico('eventos'),
    limits:     { fileSize: 10 * 1024 * 1024 },
    fileFilter: filtroArchivos,
});

const uploadNoticias = multer({
    storage:    storageGenerico('noticias'),
    limits:     { fileSize: 10 * 1024 * 1024 },
    fileFilter: filtroArchivos,
});

/* ── Exportar todo ───────────────────────────────────────── */
module.exports = { upload, cargarNombreGraduado, uploadEventos, uploadNoticias };
const Certificado = require('../models/Certificado');
const { recalcularHabilidades } = require('../utils/nlp/clasificador');
const fs = require('fs');
const path = require('path');

// GET /api/certificados
const obtenerCertificados = async (req, res) => {
    try {
        const certificados = await Certificado.find({
            graduado: req.usuario.id
        }).sort({ fechaFinalizacion: -1 });
        res.json(certificados);
    } catch (err) {
        res.status(500).json({ msg: 'Error al obtener certificados' });
    }
};

// POST /api/certificados
const crearCertificado = async (req, res) => {
    try {
        const { titulo, institucion, fechaFinalizacion, url, descripcion } = req.body;

        if (!titulo || titulo.trim() === '')
            return res.status(400).json({ msg: 'El título es obligatorio' });

        const palabrasTitulo = titulo.trim().split(/\s+/).filter(Boolean);
        if (palabrasTitulo.length < 3)
            return res.status(400).json({ msg: 'El título debe tener al menos 3 palabras' });
        if (palabrasTitulo.length > 10)
            return res.status(400).json({ msg: 'El título no puede superar las 10 palabras' });

        if (!fechaFinalizacion)
            return res.status(400).json({ msg: 'La fecha de finalización es obligatoria' });

        if (!url || url.trim() === '')
            return res.status(400).json({ msg: 'La URL de verificación es obligatoria' });
        if (!/^https?:\/\/.+\..+/.test(url.trim()))
            return res.status(400).json({ msg: 'La URL debe ser un enlace válido que comience con http:// o https://' });

        if (!descripcion || descripcion.trim().length < 10)
            return res.status(400).json({ msg: 'La descripción es obligatoria (mínimo 10 caracteres)' });

        if (!req.file)
            return res.status(400).json({ msg: 'La imagen del certificado es obligatoria' });

        const archivoRuta = `uploads/graduados/${req.usuario.id}/${req.file.filename}`;
        const ext = path.extname(req.file.originalname).toLowerCase();
        const tipoArchivo = ext === '.pdf' ? 'pdf' : 'imagen';

        const certificado = new Certificado({
            graduado:          req.usuario.id,
            titulo:            titulo.trim().substring(0, 150),
            institucion:       institucion ? institucion.trim() : '',
            fechaFinalizacion: new Date(fechaFinalizacion),
            url:               url.trim(),
            descripcion:       descripcion.trim().substring(0, 600),
            archivo:           archivoRuta,
            tipoArchivo
        });

        await certificado.save();
        recalcularHabilidades(req.usuario.id);
        res.status(201).json({ msg: 'Certificado creado', certificado });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al crear el certificado' });
    }
};

// PUT /api/certificados/:id  ← NUEVO
const actualizarCertificado = async (req, res) => {
    try {
        const certificado = await Certificado.findOne({
            _id: req.params.id,
            graduado: req.usuario.id
        });

        if (!certificado)
            return res.status(404).json({ msg: 'Certificado no encontrado' });

        const { titulo, institucion, fechaFinalizacion, url, descripcion } = req.body;

        // Validaciones igual que en crear
        if (titulo) {
            const palabras = titulo.trim().split(/\s+/).filter(Boolean);
            if (palabras.length < 3)
                return res.status(400).json({ msg: 'El título debe tener al menos 3 palabras' });
            if (palabras.length > 10)
                return res.status(400).json({ msg: 'El título no puede superar las 10 palabras' });
            certificado.titulo = titulo.trim().substring(0, 150);
        }

        if (institucion !== undefined) certificado.institucion = institucion.trim();
        if (fechaFinalizacion)         certificado.fechaFinalizacion = new Date(fechaFinalizacion);
        if (descripcion)               certificado.descripcion = descripcion.trim().substring(0, 600);

        if (url !== undefined) {
            if (!/^https?:\/\/.+\..+/.test(url.trim()))
                return res.status(400).json({ msg: 'La URL debe ser un enlace válido' });
            certificado.url = url.trim();
        }

        // Reemplazar imagen solo si llega una nueva
        if (req.file) {
            // Eliminar archivo viejo del disco
            if (certificado.archivo) {
                const rutaVieja = path.join(__dirname, '..', certificado.archivo);
                if (fs.existsSync(rutaVieja)) fs.unlinkSync(rutaVieja);
            }
            const ext = path.extname(req.file.originalname).toLowerCase();
            certificado.archivo    = `uploads/graduados/${req.usuario.id}/${req.file.filename}`;
            certificado.tipoArchivo = ext === '.pdf' ? 'pdf' : 'imagen';
        }

        await certificado.save();
        recalcularHabilidades(req.usuario.id);
        res.json({ msg: 'Certificado actualizado', certificado });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al actualizar el certificado' });
    }
};

// DELETE /api/certificados/:id
const eliminarCertificado = async (req, res) => {
    try {
        const certificado = await Certificado.findOne({
            _id: req.params.id,
            graduado: req.usuario.id
        });

        if (!certificado)
            return res.status(404).json({ msg: 'Certificado no encontrado' });

        // ── Eliminar archivo físico ─────────────────────────────
        if (certificado.archivo) {
            const ruta = path.join(__dirname, '..', certificado.archivo);
            if (fs.existsSync(ruta)) {
                fs.unlinkSync(ruta);
            } else {
                console.warn('Archivo de certificado no encontrado en disco:', ruta);
            }
        }

        await Certificado.deleteOne({ _id: certificado._id });
        recalcularHabilidades(req.usuario.id);
        res.json({ msg: 'Certificado eliminado' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al eliminar el certificado' });
    }
};

module.exports = { obtenerCertificados, crearCertificado, actualizarCertificado, eliminarCertificado };
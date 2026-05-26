const Proyecto = require('../models/Proyecto');
const { recalcularAfinidades } = require('./perfilController');
const { recalcularHabilidades } = require('../utils/nlp/clasificador');
const fs = require('fs');
const path = require('path');

// GET /api/proyectos
const obtenerProyectos = async (req, res) => {
    try {
        const proyectos = await Proyecto.find({
            graduado: req.usuario.id,
            activo: true
        }).sort({ fechaCreacion: -1 });
        res.json(proyectos);
    } catch (err) {
        res.status(500).json({ msg: 'Error al obtener proyectos' });
    }
};

// POST /api/proyectos
const crearProyecto = async (req, res) => {
    try {
        const { titulo, descripcion, tecnologias, urlRepositorio, fechaRealizacion } = req.body;

        // ── Validaciones obligatorias ──────────────────────────────
        if (!titulo || titulo.trim() === '') {
            return res.status(400).json({ msg: 'El título es obligatorio' });
        }

        const palabrasTitulo = titulo.trim().split(/\s+/).filter(Boolean);
        if (palabrasTitulo.length < 3) {
            return res.status(400).json({ msg: 'El título debe tener al menos 3 palabras' });
        }
        if (palabrasTitulo.length > 10) {
            return res.status(400).json({ msg: 'El título no puede superar las 10 palabras' });
        }

        if (!descripcion || descripcion.trim() === '') {
            return res.status(400).json({ msg: 'La descripción es obligatoria' });
        }

        // Imagen obligatoria solo en creación
        if (!req.file) {
            return res.status(400).json({ msg: 'La imagen del proyecto es obligatoria' });
        }

        // ── Procesar tecnologías ───────────────────────────────────
        let tecArray = [];
        if (tecnologias) {
            try { tecArray = JSON.parse(tecnologias); }
            catch { tecArray = tecnologias.split(',').map(t => t.trim()).filter(Boolean); }
        }

        // ── Crear y guardar ────────────────────────────────────────
        const proyecto = new Proyecto({
            graduado: req.usuario.id,
            titulo: titulo.trim().substring(0, 150),
            descripcion: descripcion.trim().substring(0, 1000),
            tecnologias: tecArray.slice(0, 20),
            urlRepositorio: urlRepositorio ? urlRepositorio.trim() : '',
            fechaRealizacion: fechaRealizacion ? new Date(fechaRealizacion) : null,
            imagen: `uploads/graduados/${req.usuario.id}/${req.file.filename}`,
        });

        await proyecto.save();
        await recalcularAfinidades(req.usuario.id);

        // ── Recalcular habilidades en segundo plano ──
        recalcularHabilidades(req.usuario.id);

        res.status(201).json({ msg: 'Proyecto creado', proyecto });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al crear el proyecto' });
    }
};

// PUT /api/proyectos/:id
// La imagen es OPCIONAL en edición: solo se reemplaza si llega un archivo nuevo
const actualizarProyecto = async (req, res) => {
    try {
        const proyecto = await Proyecto.findOne({
            _id: req.params.id,
            graduado: req.usuario.id
        });

        if (!proyecto) {
            return res.status(404).json({ msg: 'Proyecto no encontrado' });
        }

        const { titulo, descripcion, tecnologias, urlRepositorio, fechaRealizacion } = req.body;

        // Actualizar solo los campos que llegan
        if (titulo) proyecto.titulo = titulo.trim().substring(0, 150);
        if (descripcion) proyecto.descripcion = descripcion.trim().substring(0, 1000);
        if (urlRepositorio !== undefined) proyecto.urlRepositorio = urlRepositorio.trim();
        if (fechaRealizacion) proyecto.fechaRealizacion = new Date(fechaRealizacion);

        if (tecnologias) {
            let tecArray = [];
            try { tecArray = JSON.parse(tecnologias); }
            catch { tecArray = tecnologias.split(',').map(t => t.trim()).filter(Boolean); }
            proyecto.tecnologias = tecArray.slice(0, 20);
        }

        // Reemplazar imagen solo si llega una nueva
        if (req.file) {
            if (proyecto.imagen) {
                const rutaVieja = path.join(__dirname, '..', proyecto.imagen);
                if (fs.existsSync(rutaVieja)) fs.unlinkSync(rutaVieja);
            }
            proyecto.imagen = `uploads/graduados/${req.usuario.id}/${req.file.filename}`;
        }

        await proyecto.save();
        await recalcularAfinidades(req.usuario.id);

        // ── Recalcular habilidades en segundo plano ──
        recalcularHabilidades(req.usuario.id);

        res.json({ msg: 'Proyecto actualizado', proyecto });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al actualizar el proyecto' });
    }
};

// DELETE /api/proyectos/:id
const eliminarProyecto = async (req, res) => {
    try {
        const proyecto = await Proyecto.findOne({
            _id: req.params.id,
            graduado: req.usuario.id
        });

        if (!proyecto) {
            return res.status(404).json({ msg: 'Proyecto no encontrado' });
        }

        // ── Eliminar imagen física ──────────────────────────────
        if (proyecto.imagen) {
            // La ruta guardada es relativa al root del backend,
            // ej: "uploads/graduados/abc123/archivo.jpg"
            const ruta = path.join(__dirname, '..', proyecto.imagen);
            if (fs.existsSync(ruta)) {
                fs.unlinkSync(ruta);
            } else {
                console.warn('Imagen no encontrada en disco:', ruta);
            }
        }

        // ── Eliminar documento de la BD (eliminación real) ──────
        await Proyecto.deleteOne({ _id: proyecto._id });

        await recalcularAfinidades(req.usuario.id);
        recalcularHabilidades(req.usuario.id);

        res.json({ msg: 'Proyecto eliminado' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al eliminar el proyecto' });
    }
};

module.exports = { obtenerProyectos, crearProyecto, actualizarProyecto, eliminarProyecto };
const mongoose = require('mongoose');

const ProyectoSchema = new mongoose.Schema({
    graduado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Graduado',
        required: true
    },
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    descripcion: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    tecnologias: [{
        type: String,
        trim: true
    }],
    urlRepositorio: {
        type: String,
        trim: true,
        default: ''
    },
    imagen: {
        type: String,
        required: true
    },
    fechaRealizacion: {
        type: Date,
        default: null
    },
    // Categoría detectada automáticamente por el modelo NLP
    categoria: {
        type: String,
        enum: [
            'Desarrollo Web', 'Desarrollo Móvil', 'Bases de Datos',
            'Inteligencia Artificial', 'Desarrollo de Escritorio',
            'Ciberseguridad', 'DevOps', 'Consultoría', 'Sin categoría'
        ],
        default: 'Sin categoría'
    },
    activo: {
        type: Boolean,
        default: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Proyecto', ProyectoSchema);
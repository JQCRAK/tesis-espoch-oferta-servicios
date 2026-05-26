// backend/src/models/Noticia.js
const mongoose = require('mongoose');

const NoticiaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    contenido: {
        type: String,
        required: true,
    },
    resumen: {
        type: String,
        default: '',
        trim: true,
        maxlength: 300,
    },
    imagen: {
        type: String,
        default: '',
    },
    categoria: {
        type: String,
        enum: ['convocatoria', 'comunicado', 'logro', 'evento', 'oportunidad_laboral'],
        required: true,
    },
    estado: {
        type: String,
        enum: ['borrador', 'publicada', 'archivada'],
        default: 'borrador',
    },
    autor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
    fechaPublicacion: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Noticia', NoticiaSchema);
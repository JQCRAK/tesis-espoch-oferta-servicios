// backend/src/models/Notificacion.js
const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({

    // ── DESTINATARIO ─────────────────────────────────────────
    graduado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Graduado',
        required: true,
        index: true,
    },

    // ── CONTENIDO ────────────────────────────────────────────
    tipo: {
        type: String,
        enum: ['encuesta', 'evento', 'noticia', 'sistema', 'contacto'],
        default: 'encuesta',
    },

    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },

    mensaje: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },

    // ── REFERENCIA OPCIONAL (a qué encuesta apunta) ──────────
    encuesta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Encuesta',
        default: null,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // ── ESTADO ───────────────────────────────────────────────
    leido: {
        type: Boolean,
        default: false,
        index: true,
    },

    fechaLeido: {
        type: Date,
        default: null,
    },

}, { timestamps: true });

// Índice compuesto para cargar notificaciones de un graduado rápido
NotificacionSchema.index({ graduado: 1, createdAt: -1 });
NotificacionSchema.index({ graduado: 1, leido: 1 });

module.exports = mongoose.model('Notificacion', NotificacionSchema);
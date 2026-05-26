// models/Tesis.js
const mongoose = require('mongoose');

const TesisSchema = new mongoose.Schema({

    // ── Relación con el graduado ─────────────────────────
    graduado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Graduado',
        required: true,
        unique: true  // Un graduado = una tesis
    },

    // ── Datos ingresados por el graduado ─────────────────
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    resumen: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000  // ~250 palabras con margen
    },
    urlDspace: {
        type: String,
        required: true,
        trim: true
    },

    // ── Datos extraídos del dspace al verificar ───────────
    tituloEncontrado:   { type: String,   default: '' },
    autoresEncontrados: { type: [String], default: [] },

    fechaPublicacion: { type: Date, default: null },

    // ── Estado de la verificación ─────────────────────────
    verificada:        { type: Boolean, default: false },
    fechaVerificacion: { type: Date,    default: null },

    // ── Consentimiento de publicación ─────────────────────
    consentimientoAceptado: { type: Boolean, default: false },
    fechaConsentimiento:    { type: Date,    default: null },
    ipConsentimiento:       { type: String,  default: '' },

}, { timestamps: true });

module.exports = mongoose.model('Tesis', TesisSchema);
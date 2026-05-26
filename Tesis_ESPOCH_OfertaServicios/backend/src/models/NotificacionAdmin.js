// backend/src/models/NotificacionAdmin.js
const mongoose = require('mongoose');

// Una sola notificación compartida por todos los admins.
// solicitudes[] sirve como anti-duplicado de 24h (nombre+email+graduadoId).

const SolicitudSchema = new mongoose.Schema({
    nombre:    { type: String, required: true, trim: true },
    email:     { type: String, required: true, trim: true, lowercase: true },
    empresa:   { type: String, trim: true, default: '' },
    mensaje:   { type: String, required: true, trim: true },
    enviadoEn: { type: Date, default: Date.now },
}, { _id: false });

const NotificacionAdminSchema = new mongoose.Schema({

    // ── Graduado al que se quieren contactar ──────────────
    graduado: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Graduado',
        required: true,
        index: true,
    },

    // ── Contenido visible en el panel ─────────────────────
    titulo:  { type: String, required: true, trim: true, maxlength: 200 },
    mensaje: { type: String, required: true, trim: true, maxlength: 1000 },

    // ── Historial de solicitudes (anti-duplicado 24h) ─────
    solicitudes: { type: [SolicitudSchema], default: [] },

    // ── Control de lectura compartida ─────────────────────
    // Cuando cualquier admin la lee, se agrega su ID aquí.
    // Si vistoPor.length > 0  →  ya fue vista por alguien.
    vistoPor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Graduado',   // los admins también son documentos Graduado/Admin
    }],

    leido: { type: Boolean, default: false, index: true },

}, { timestamps: true });

NotificacionAdminSchema.index({ graduado: 1, createdAt: -1 });

module.exports = mongoose.model('NotificacionAdmin', NotificacionAdminSchema);
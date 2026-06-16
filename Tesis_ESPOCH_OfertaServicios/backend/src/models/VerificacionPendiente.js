const mongoose = require('mongoose');

const VerificacionPendienteSchema = new mongoose.Schema({
    emailInstitucional: { type: String, required: true, unique: true, lowercase: true, trim: true },
    nombres: { type: String, required: true, trim: true },
    codigo: { type: String, required: true },
    intentos: { type: Number, default: 0 },
    verificado: { type: Boolean, default: false },
    expiraEn: { type: Date, required: true },
}, { timestamps: true });

VerificacionPendienteSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VerificacionPendiente', VerificacionPendienteSchema);
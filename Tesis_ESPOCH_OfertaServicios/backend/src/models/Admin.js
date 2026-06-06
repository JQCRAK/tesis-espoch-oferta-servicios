const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    nombre:    { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    cargo:     { type: String, required: true, trim: true },
    rol:       { type: String, default: 'admin' },

    codigoRecuperacion: {
        codigo:    { type: String, default: '' },
        expiresAt: { type: Date,   default: null },
        intentos:  { type: Number, default: 0 },
    },

    intentosFallidos: {
        contador:      { type: Number, default: 0 },
        bloqueadoHasta:{ type: Date,   default: null },
        ultimoIntento: { type: Date,   default: null },
    },

}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
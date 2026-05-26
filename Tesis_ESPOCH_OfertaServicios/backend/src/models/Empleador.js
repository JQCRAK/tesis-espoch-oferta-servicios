// backend/src/models/Empleador.js
const mongoose = require('mongoose');

const EmpleadorSchema = new mongoose.Schema({

    // ═══ GRUPO B — Datos de la organización ═══
    nombreEmpresa:          { type: String, required: true, trim: true },
    nombreGerente:          { type: String, required: true, trim: true },
    emailOrganizacion:      { type: String, required: true, trim: true, lowercase: true, unique: true },
    telefonoOrganizacion:   { type: String, default: '', trim: true },   // ← NUEVO: contacto empresa
    provincia:              { type: String, default: '', trim: true },   // ← NUEVO
    ciudad:                 { type: String, default: '', trim: true },   // ← NUEVO
    tipoCapital:            { type: String, enum: ['Pública', 'Privada', 'Mixto'], required: true },
    tipoActividad:          { type: String, enum: ['Industrial', 'Comercial', 'Servicios'], required: true },

    // ═══ GRUPO A — Datos del encuestado (se llenan al responder la encuesta) ═══
    encuestado: {
        nombresApellidos: { type: String, default: '' },
        edad:             { type: Number, default: null },
        genero:           { type: String, enum: ['Masculino', 'Femenino', 'LGTBI', ''], default: '' },
        cargo:            { type: String, default: '' },
        profesion:        { type: String, default: '' },
        aniosServicio:    { type: Number, default: null },
        email:            { type: String, default: '' },
        telefono:         { type: String, default: '' },
        estudiosEspoch:   { type: String, enum: ['Grado', 'Posgrado', 'Ninguno', ''], default: '' },
    },

    // ═══ TOKEN para responder encuestas sin login ═══
    tokenEncuesta:    { type: String,   default: null },
    tokenExpira:      { type: Date,     default: null },
    tokenUsado:       { type: Boolean,  default: false },
    encuestaAsociada: { type: mongoose.Schema.Types.ObjectId, ref: 'Encuesta', default: null },

    // ═══ Control ═══
    activo:    { type: Boolean, default: true },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

}, { timestamps: true });

module.exports = mongoose.model('Empleador', EmpleadorSchema);
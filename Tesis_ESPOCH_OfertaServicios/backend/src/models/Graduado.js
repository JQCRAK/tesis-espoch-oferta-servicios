const mongoose = require('mongoose');

const GraduadoSchema = new mongoose.Schema({

    // ── DATOS PERSONALES ──────────────────────────────────────────
    nombres:            { type: String, required: true, trim: true },
    apellidos:          { type: String, required: true, trim: true },

    cedula:             { type: String, required: true, unique: true, trim: true },
    telefono:           { type: String, required: true, unique: true, trim: true },

    cedulaHash:         { type: String, required: true, unique: true, trim: true },
    telefonoHash:       { type: String, required: true, unique: true, trim: true },

    genero: {
        type: String,
        enum: ['Masculino', 'Femenino', 'No binario', 'Prefiero no decir'],
        required: true,
        trim: true
    },
    fechaNacimiento:   { type: Date, required: true },
    tieneDiscapacidad: {
        type: String,
        enum: ['No', 'Sí - Visual', 'Sí - Auditiva', 'Sí - Física/Motriz', 'Sí - Intelectual', 'Sí - Psicosocial', 'Sí - Otra'],
        required: true
    },

    // ── CIUDADANÍA ───────────────────────────────────────────────
    ciudadania: {
        type: String,
        enum: ['Nacional', 'Extranjera', ''],
        default: '',
        trim: true,
    },

    // ── UBICACIÓN ACTUAL ─────────────────────────────────────────
    // El graduado llena esto en su perfil; se usa para el dashboard geográfico del admin
    provinciaActual: { type: String, default: '', trim: true },
    cantonActual:    { type: String, default: '', trim: true },

    // ── CORREOS ──────────────────────────────────────────────────
    emailInstitucional: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailPersonal:      { type: String, required: true, unique: true, lowercase: true, trim: true },

    emailPersonalHash:  { type: String, default: '', trim: true },

    // ── SEGURIDAD ────────────────────────────────────────────────
    password:        { type: String, required: true },
    verificado:      { type: Boolean, default: false },

    codigoVerificacion: {
        codigo:     { type: String, default: '' },
        expiresAt:  { type: Date, default: null },
        intentos:   { type: Number, default: 0 },
        verificado: { type: Boolean, default: false }
    },

    intentosFallidos: {
        contador:       { type: Number, default: 0 },
        bloqueadoHasta: { type: Date, default: null },
        ultimoIntento:  { type: Date, default: null }
    },

    codigoRecuperacion: {
        codigo:    { type: String, default: '' },
        expiresAt: { type: Date, default: null },
        intentos:  { type: Number, default: 0 }
    },

    cuentaBloqueada: { type: Boolean, default: false },

    // ── PERFIL PROFESIONAL ───────────────────────────────────────
    bio:             { type: String, default: '', maxlength: 500 },
    fotoPerfil:      { type: String, default: '' },
    disponibilidad:  { type: String, enum: ['disponible', 'no_disponible'], default: 'disponible' },
    github:          { type: String, default: '', trim: true },
    linkedin:        { type: String, default: '', trim: true },

    tecnologias:        { type: [String], default: [] },
    afinidades:         { type: [mongoose.Schema.Types.Mixed], default: [] },
    habilidadesBlandas: { type: [String], default: [] },

    // ── VERIFICACIÓN DE GRADUACIÓN ────────────────────────────────
    tesisVerificada:   { type: Boolean, default: false },
    anioGraduacion:    { type: Number,  default: null },

    // ── CONSENTIMIENTO ───────────────────────────────────────────
    perfilPublico:     { type: Boolean, default: false },
    terminosAceptados: { type: Boolean, default: false },
    terminosVersionId: { type: String,  default: '' },
    fechaAceptacion:   { type: Date,    default: null },
    ipAceptacion:      { type: String,  default: '' },

    perfilCompletado:  { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Graduado', GraduadoSchema);
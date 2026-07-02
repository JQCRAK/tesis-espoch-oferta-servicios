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
        enum: ['Masculino', 'Femenino', 'LGBTI'],
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
    provinciaActual: { type: String, default: '', trim: true },
    cantonActual:    { type: String, default: '', trim: true },

    // ── CORREOS ──────────────────────────────────────────────────
    emailInstitucional: { type: String, required: false, lowercase: true, trim: true },
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
    bienvenidaMostrada: { type: Boolean, default: false },

    // ── PERFIL PROFESIONAL ───────────────────────────────────────
    bio:             { type: String, default: '', maxlength: 500 },
    fotoPerfil:      { type: String, default: '' },
    disponibilidad: {
        type: String,
        enum: ['disponible', 'trabajando', 'estudiando', 'no_disponible'],
        default: 'disponible',
    },
    github:          { type: String, default: '', trim: true },
    linkedin:        { type: String, default: '', trim: true },

    tecnologias:        { type: [String], default: [] },
    afinidades:         { type: [mongoose.Schema.Types.Mixed], default: [] },
    habilidadesBlandas: { type: [String], default: [] },

    // ── EXPERIENCIA LABORAL (auto-declarada; el admin la verifica con la hoja de vida fisica) ──
    experienciasLaborales: {
        type: [{
            cargo:        { type: String, required: true, trim: true, maxlength: 120 },
            empresa:      { type: String, required: true, trim: true, maxlength: 150 },
            fechaInicio:  { type: Date,   required: true },
            fechaFin:     { type: Date,   default: null },
            actual:       { type: Boolean, default: false },
            descripcion:  { type: String, default: '', maxlength: 500 },
            verificadoPorAdmin: { type: Boolean, default: false },
        }],
        default: [],
    },

    // ── EDUCACION FORMAL (titulos academicos previos / paralelos) ──
    educacionFormal: {
        type: [{
            institucion:  { type: String, required: true, trim: true, maxlength: 150 },
            titulo:       { type: String, required: true, trim: true, maxlength: 150 },
            nivel: {
                type: String,
                enum: ['Secundaria', 'Tercer Nivel', 'Cuarto Nivel', 'PhD', 'Otro'],
                default: 'Tercer Nivel',
            },
            anioInicio:   { type: Number, default: null },
            anioFin:      { type: Number, default: null },
            verificadoPorAdmin: { type: Boolean, default: false },
        }],
        default: [],
    },

    // ── VERIFICACIÓN DE GRADUACIÓN ────────────────────────────────
    tesisVerificada:   { type: Boolean, default: false },
    anioGraduacion:    { type: Number,  default: null },

    // ── LIMPIEZA AUTOMÁTICA ──────────────────────────────────────
    // Fecha en que se envió el correo de advertencia por falta de tesis.
    // null = advertencia aún no enviada.
    // Si tesisVerificada pasa a true, este campo se resetea a null.
    advertenciaSinTesisEnviada: { type: Date, default: null },

    // ── CONSENTIMIENTO ───────────────────────────────────────────
    perfilPublico:     { type: Boolean, default: false },
    terminosAceptados: { type: Boolean, default: false },
    terminosVersionId: { type: String,  default: '' },
    fechaAceptacion:   { type: Date,    default: null },
    ipAceptacion:      { type: String,  default: '' },

    perfilCompletado:  { type: Number, default: 0 },

}, { timestamps: true });


GraduadoSchema.index(
    { emailInstitucional: 1 },
    { unique: true, partialFilterExpression: { emailInstitucional: { $type: "string" } } }
);

module.exports = mongoose.model('Graduado', GraduadoSchema);
const mongoose = require('mongoose');

const EncuestaSchema = new mongoose.Schema({

    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },

    descripcion: {
        type: String,
        default: '',
        trim: true,
        maxlength: 1000
    },

    // ★ NUEVO: texto del consentimiento informado
    consentimientoInformado: {
        type: String,
        default: '',
        trim: true,
        maxlength: 3000
    },

    tipo: {
        type: String,
        enum: ['graduados', 'empleadores'],
        required: true
    },

    estado: {
        type: String,
        enum: ['borrador', 'activa', 'cerrada'],
        default: 'borrador'
    },

    fechaInicio: {
        type: Date,
        required: true
    },

    fechaCierre: {
        type: Date,
        required: true
    },

    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },

    totalRespuestas: {
        type: Number,
        default: 0
    },

    porcentajeRespuestas: {
        type: Number,
        default: 0
    },

    respondieron: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Graduado'
    }],

}, { timestamps: true });

EncuestaSchema.pre('save', async function () {
    if (this.fechaCierre <= this.fechaInicio) {
        throw new Error('La fecha de cierre debe ser posterior a la fecha de inicio.');
    }
});

module.exports = mongoose.model('Encuesta', EncuestaSchema);
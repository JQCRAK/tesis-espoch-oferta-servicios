const mongoose = require('mongoose');

const RespuestaEncuestaSchema = new mongoose.Schema({
    encuesta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Encuesta',
        required: true,
    },
    graduado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Graduado',
        required: true,
    },
    aceptoConsentimiento: {
        type: Boolean,
        required: true,
        default: false,
    },
    respuestas: [{
        pregunta: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pregunta',
        },
        respuesta: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        esCondicional: { type: Boolean, default: false },
        ladoCondicional: { type: String, enum: ['si', 'no', null], default: null },
        indiceCondicional: { type: Number, default: null },
        textoSubPregunta: { type: String, default: '' },
    }],
    fechaRespuesta: {
        type: Date,
        default: Date.now,
    },
    estado: {
        type: String,
        enum: ['completada', 'no_consintio'],
        default: 'completada',
    },
}, { timestamps: true });

RespuestaEncuestaSchema.index({ encuesta: 1, graduado: 1 }, { unique: true });

module.exports = mongoose.model('RespuestaEncuesta', RespuestaEncuestaSchema);
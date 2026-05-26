const mongoose = require('mongoose');

const RespuestaEmpleadorSchema = new mongoose.Schema({
    encuesta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Encuesta',
        required: true,
    },
    empleador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empleador',
        required: true,
    },
    aceptoConsentimiento: {
        type: Boolean,
        required: true,
        default: false,
    },
    // Snapshot de los datos del encuestado al momento de responder
    datosEncuestado: {
        nombresApellidos: { type: String, default: '' },
        edad:             { type: Number, default: null },
        genero:           { type: String, default: '' },
        cargo:            { type: String, default: '' },
        profesion:        { type: String, default: '' },
        aniosServicio:    { type: Number, default: null },
        email:            { type: String, default: '' },
        telefono:         { type: String, default: '' },
        estudiosEspoch:   { type: String, default: '' },
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
        esCondicional:      { type: Boolean, default: false },
        ladoCondicional:    { type: String, enum: ['si', 'no', null], default: null },
        indiceCondicional:  { type: Number, default: null },
        textoSubPregunta:   { type: String, default: '' },
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

// Un empleador solo puede responder una vez por encuesta
RespuestaEmpleadorSchema.index({ encuesta: 1, empleador: 1 }, { unique: true });

module.exports = mongoose.model('RespuestaEmpleador', RespuestaEmpleadorSchema);
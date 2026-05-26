// backend/src/models/Evento.js
const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    descripcion: {
        type: String,
        default: '',
        trim: true,
    },
    tipo: {
        type: String,
        enum: ['encuentro', 'webinar', 'seminario', 'curso'],
        required: true,
    },
    fechaInicio: {
        type: Date,
        required: true,
    },
    fechaFin: {
        type: Date,
        required: true,
    },
    modalidad: {
        type: String,
        enum: ['presencial', 'virtual', 'hibrida'],
        required: true,
    },
    urlAcceso: {
        type: String,
        default: '',
        trim: true,
    },
    lugar: {
        type: String,
        default: '',
        trim: true,
    },
    capacidadMaxima: {
        type: Number,
        default: 0,
    },
    inscritos: {
        type: Number,
        default: 0,
    },
    estado: {
        type: String,
        enum: ['programado', 'en_curso', 'finalizado', 'cancelado'],
        default: 'programado',
    },
    imagen: {
        type: String,
        default: '',
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
}, { timestamps: true });

/* Actualizar estado automáticamente según fechas */
EventoSchema.methods.actualizarEstado = function () {
    const ahora = new Date();
    if (this.estado === 'cancelado') return;
    if (ahora < this.fechaInicio)   this.estado = 'programado';
    else if (ahora <= this.fechaFin) this.estado = 'en_curso';
    else                             this.estado = 'finalizado';
};

module.exports = mongoose.model('Evento', EventoSchema);
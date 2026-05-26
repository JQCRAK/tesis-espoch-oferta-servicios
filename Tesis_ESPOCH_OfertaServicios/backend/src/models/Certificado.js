const mongoose = require('mongoose');

const CertificadoSchema = new mongoose.Schema({
    graduado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Graduado',
        required: true
    },
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    institucion: {
        type: String,
        trim: true,
        default: ''
    },
    // Renombrado de 'fecha' → 'fechaFinalizacion'
    fechaFinalizacion: {
        type: Date,
        required: true
    },
    // URL de la plataforma/curso (ej: enlace de Udemy, Coursera, certificado online)
    url: {
        type: String,
        trim: true,
        default: ''
    },
    // Descripción obligatoria: qué aprendió o qué hizo para obtener el certificado
    descripcion: {
        type: String,
        required: true,
        trim: true,
        maxlength: 600
    },
    // Puede ser imagen (jpg/png) o PDF
    archivo: {
        type: String,
        required: true
    },
    tipoArchivo: {
        type: String,
        enum: ['imagen', 'pdf', null],
        default: null
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Certificado', CertificadoSchema);
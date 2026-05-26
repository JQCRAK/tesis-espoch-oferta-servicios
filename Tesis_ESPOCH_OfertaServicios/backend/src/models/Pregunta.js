const mongoose = require('mongoose');

const PreguntaSchema = new mongoose.Schema({
  encuesta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encuesta',
    required: true
  },

  texto: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  tipo: {
    type: String,
    enum: ['opcion_multiple', 'texto_libre', 'escala', 'si_no', 'checkboxes', 'titulo', 'numero'],
    required: true
  },

  opciones: [{
    type: String,
    trim: true
  }],

  escalaMin: { type: Number, default: 1 },
  escalaMax: { type: Number, default: 5 },
  escalaEtiquetas: {
    min: { type: String, default: '' },
    max: { type: String, default: '' }
  },

  obligatoria: { type: Boolean, default: false },
  orden: { type: Number, required: true },

  // ═══════════ MODO MATRIZ ═══════════
  // Activo cuando esMatriz=true en tipos 'escala' y 'opcion_multiple'
  // Muestra una tabla con 'items' como filas y la escala/opciones como columnas
  esMatriz: {
    type: Boolean,
    default: false
  },

  // Filas de la tabla (ej: ["OE 01. Trabajar en equipos...", "OE 02. Investigar..."])
  items: [{
    type: String,
    trim: true
  }],

  // Texto descriptivo/instrucción que aparece debajo del título (opcional)
  descripcionMatriz: {
    type: String,
    default: '',
    trim: true
  },

  // Etiquetas para escala (ej: "1=Excelente", "5=Insuficiente")
  etiquetaMin: { type: String, default: '', trim: true },
  etiquetaMax: { type: String, default: '', trim: true },

  // ═══════════ LÓGICA CONDICIONAL (solo para si_no) ═══════════
  tieneCondicional: { type: Boolean, default: false },

  preguntasCondicionalSi: [{ type: String, trim: true }],
  tiposCondicionalSi: [{
    type: String,
    enum: ['opcion_multiple', 'texto_libre', 'escala', 'checkboxes', 'numero'],
    default: 'texto_libre'
  }],
  opcionesCondicionalSi: [[{ type: String, trim: true }]],

  preguntasCondicionalNo: [{ type: String, trim: true }],
  tiposCondicionalNo: [{
    type: String,
   enum: ['opcion_multiple', 'texto_libre', 'escala', 'checkboxes', 'numero'],
    default: 'texto_libre'
  }],
  opcionesCondicionalNo: [[{ type: String, trim: true }]],

  // Compatibilidad con lógica anterior
  mostrarSi: {
    preguntaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pregunta', default: null },
    respuestaEsperada: { type: String, default: '' }
  },

  seccion: { type: String, default: '' },

}, { timestamps: true });

// ═══════════ VALIDACIONES ═══════════
PreguntaSchema.pre('save', async function () {
  // Opción múltiple y checkboxes: mín 2 opciones
  if (
    (this.tipo === 'opcion_multiple' || this.tipo === 'checkboxes') &&
    (!this.opciones || this.opciones.length < 2)
  ) {
    throw new Error('Preguntas de opción múltiple deben tener al menos 2 opciones');
  }

  // Modo matriz: debe tener al menos 1 ítem
  if (this.esMatriz && (!this.items || this.items.length === 0)) {
    throw new Error('El modo tabla/matriz requiere al menos 1 ítem');
  }

  // Si es si_no con condicional, validar lado SÍ
  if (this.tipo === 'si_no' && this.tieneCondicional) {
    if (!this.preguntasCondicionalSi || this.preguntasCondicionalSi.length === 0) {
      throw new Error('Si tiene condiciones, debe haber al menos 1 pregunta para SÍ');
    }
    for (let i = 0; i < this.preguntasCondicionalSi.length; i++) {
      const tipo = this.tiposCondicionalSi && this.tiposCondicionalSi[i];
      if (tipo === 'opcion_multiple' || tipo === 'checkboxes') {
        const opts = this.opcionesCondicionalSi && this.opcionesCondicionalSi[i];
        if (!opts || opts.length < 2) throw new Error(`Pregunta ${i + 1} en SÍ debe tener al menos 2 opciones`);
      }
    }
    if (this.preguntasCondicionalNo && this.preguntasCondicionalNo.length > 0) {
      for (let i = 0; i < this.preguntasCondicionalNo.length; i++) {
        const tipo = this.tiposCondicionalNo && this.tiposCondicionalNo[i];
        if (tipo === 'opcion_multiple' || tipo === 'checkboxes') {
          const opts = this.opcionesCondicionalNo && this.opcionesCondicionalNo[i];
          if (!opts || opts.length < 2) throw new Error(`Pregunta ${i + 1} en NO debe tener al menos 2 opciones`);
        }
      }
    }
  }
});

PreguntaSchema.index({ encuesta: 1, orden: 1 });
PreguntaSchema.index({ encuesta: 1, tipo: 1 });

module.exports = mongoose.model('Pregunta', PreguntaSchema);
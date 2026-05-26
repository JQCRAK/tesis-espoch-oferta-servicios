// backend/src/models/TendenciaSemanal.js
const mongoose = require('mongoose');

/**
 * TendenciaSemanal
 * ─────────────────────────────────────────────────────────────────────────────
 * Almacena la tendencia tecnológica activa para la semana actual.
 * Solo existe UN documento activo a la vez (upsert por semana).
 *
 * Campos clave:
 *  - semana:       Número de semana ISO del año  (ej: 20)
 *  - anio:         Año correspondiente           (ej: 2026)
 *  - categoria:    Nombre legible                (ej: "Desarrollo Web")
 *  - keywords:     Array de strings que se comparan con Proyecto.tecnologias
 *                  (comparación case-insensitive)
 *  - descripcion:  Texto corto para mostrar en UI
 *  - color:        Color hex para el badge en el frontend
 *  - icono:        Nombre del icono (string, usado en frontend con react-icons)
 *  - modoManual:   true = admin lo fijó; false = rotación automática
 *  - fijadoHasta:  Fecha hasta la cual el admin quiere mantenerlo fijo
 * ─────────────────────────────────────────────────────────────────────────────
 */
const TendenciaSemanalSchema = new mongoose.Schema(
    {
        semana: { type: Number, required: true },
        anio:   { type: Number, required: true },

        categoria:   { type: String, required: true, trim: true },
        keywords:    [{ type: String, trim: true }],
        descripcion: { type: String, trim: true, default: '' },
        color:       { type: String, default: '#be1e2d' },
        icono:       { type: String, default: 'FaCode' },

        // Control de sobreescritura manual
        modoManual:  { type: Boolean, default: false },
        fijadoHasta: { type: Date, default: null },

        // Quién la configuró manualmente
        modificadoPor: { type: String, default: 'sistema' },
    },
    { timestamps: true }
);

// Índice único: una sola tendencia por semana/año
TendenciaSemanalSchema.index({ semana: 1, anio: 1 }, { unique: true });

module.exports = mongoose.model('TendenciaSemanal', TendenciaSemanalSchema);
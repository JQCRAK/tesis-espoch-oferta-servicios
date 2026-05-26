const mongoose = require('mongoose');

// ─────────────────────────────────────────────
//  COLECCIÓN: auditoria_logs
//  Registra TODAS las acciones exitosas del sistema
//  Se alimenta desde el bloque TRY de cada controller
// ─────────────────────────────────────────────
const logSchema = new mongoose.Schema({
    usuarioId:      { type: String, default: 'anonimo' },
    usuarioEmail:   { type: String, default: 'desconocido' },
    rol:            { type: String, default: 'graduado' },
    accion:         { type: String, required: true },   
    modulo:         { type: String, required: true },   
    coleccionAfectada: { type: String, default: '' },  
    descripcion:    { type: String, default: '' },      
    ip:             { type: String, default: 'desconocida' },
    fechaHora:      { type: Date,   default: Date.now }
});

// ─────────────────────────────────────────────
//  COLECCIÓN: auditoria_errores
//  Registra TODOS los errores del sistema
//  Se alimenta desde el bloque CATCH de cada controller
// ─────────────────────────────────────────────
const errorSchema = new mongoose.Schema({
    usuarioId:      { type: String, default: 'anonimo' },
    usuarioEmail:   { type: String, default: 'desconocido' },
    rol:            { type: String, default: 'graduado' },
    accion:         { type: String, required: true },   
    modulo:         { type: String, required: true },   
    mensajeError:   { type: String, default: '' },      
    ip:             { type: String, default: 'desconocida' },
    fechaHora:      { type: Date,   default: Date.now }
});

const AuditoriaLog   = mongoose.model('auditoria_log',   logSchema);
const AuditoriaError = mongoose.model('auditoria_error', errorSchema);

module.exports = { AuditoriaLog, AuditoriaError };
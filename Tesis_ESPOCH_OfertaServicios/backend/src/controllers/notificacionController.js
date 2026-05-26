// backend/src/controllers/notificacionController.js
const Notificacion = require('../models/Notificacion');

// ═══════════════════════════════════════════════════════════
// LISTAR NOTIFICACIONES DEL GRADUADO AUTENTICADO
// GET /api/notificaciones
// ═══════════════════════════════════════════════════════════
const listarNotificaciones = async (req, res) => {
    try {
        const graduadoId = req.usuario?.id || req.usuario?._id;
        if (!graduadoId) return res.status(401).json({ msg: 'No autenticado' });

        const notificaciones = await Notificacion.find({ graduado: graduadoId })
            .sort({ createdAt: -1 })
            .limit(50)                          // máximo 50 en el panel
            .populate('encuesta', 'titulo estado fechaCierre');

        const noLeidas = await Notificacion.countDocuments({
            graduado: graduadoId,
            leido: false,
        });

        res.json({ notificaciones, noLeidas });
    } catch (error) {
        console.error('Error en listarNotificaciones:', error);
        res.status(500).json({ msg: 'Error al cargar notificaciones' });
    }
};

// ═══════════════════════════════════════════════════════════
// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
// PATCH /api/notificaciones/:id/leer
// ═══════════════════════════════════════════════════════════
const marcarLeida = async (req, res) => {
    try {
        const graduadoId = req.usuario?.id || req.usuario?._id;
        const { id } = req.params;

        const notif = await Notificacion.findOneAndUpdate(
            { _id: id, graduado: graduadoId },
            { leido: true, fechaLeido: new Date() },
            { new: true }
        );

        if (!notif) return res.status(404).json({ msg: 'Notificación no encontrada' });

        res.json({ msg: 'Marcada como leída', notificacion: notif });
    } catch (error) {
        console.error('Error en marcarLeida:', error);
        res.status(500).json({ msg: 'Error al marcar notificación' });
    }
};

// ═══════════════════════════════════════════════════════════
// MARCAR TODAS LAS NOTIFICACIONES COMO LEÍDAS
// PATCH /api/notificaciones/leer-todas
// ═══════════════════════════════════════════════════════════
const marcarTodasLeidas = async (req, res) => {
    try {
        const graduadoId = req.usuario?.id || req.usuario?._id;
        if (!graduadoId) return res.status(401).json({ msg: 'No autenticado' });

        await Notificacion.updateMany(
            { graduado: graduadoId, leido: false },
            { leido: true, fechaLeido: new Date() }
        );

        res.json({ msg: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        console.error('Error en marcarTodasLeidas:', error);
        res.status(500).json({ msg: 'Error al actualizar notificaciones' });
    }
};

module.exports = {
    listarNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
};
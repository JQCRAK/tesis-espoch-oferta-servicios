// backend/src/controllers/notificacionAdminController.js
const NotificacionAdmin = require('../models/NotificacionAdmin');

// ═══════════════════════════════════════════════════════════
// GET /api/admin/notificaciones
// Lista las notificaciones para el panel del admin.
// ═══════════════════════════════════════════════════════════
const listar = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id;

        const notificaciones = await NotificacionAdmin.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('graduado', 'nombres apellidos fotoPerfil')
            .lean();

        // noLeidas = las que este admin específico aún no ha visto
        // (vistoPor no contiene su ID) Y además leido=false globalmente
        const noLeidas = notificaciones.filter(n =>
            !n.leido &&
            !n.vistoPor.some(id => id.toString() === adminId?.toString())
        ).length;

        res.json({ notificaciones, noLeidas });
    } catch (error) {
        console.error('Error listar notificaciones admin:', error);
        res.status(500).json({ msg: 'Error al cargar notificaciones.' });
    }
};

// ═══════════════════════════════════════════════════════════
// PATCH /api/admin/notificaciones/:id/leer
// Marca como vista por ESTE admin.
// Si todos los admins activos ya la vieron → leido = true global.
// ═══════════════════════════════════════════════════════════
const marcarLeida = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id;
        const { id }  = req.params;

        const notif = await NotificacionAdmin.findById(id);
        if (!notif)
            return res.status(404).json({ msg: 'Notificación no encontrada.' });

        // Agregar adminId a vistoPor si no está ya
        const yaVisto = notif.vistoPor.some(
            v => v.toString() === adminId?.toString()
        );

        if (!yaVisto) {
            notif.vistoPor.push(adminId);
        }

        // Contar admins activos totales para decidir si marcar leido global
        const Admin  = require('../models/Admin');
        const totalAdmins = await Admin.countDocuments({ activo: true });

        if (notif.vistoPor.length >= totalAdmins) {
            notif.leido = true;
        }

        await notif.save();

        res.json({ msg: 'Marcada como leída.', notificacion: notif });
    } catch (error) {
        console.error('Error marcarLeida admin:', error);
        res.status(500).json({ msg: 'Error al marcar notificación.' });
    }
};

// ═══════════════════════════════════════════════════════════
// PATCH /api/admin/notificaciones/leer-todas
// Marca todas como vistas por este admin.
// ═══════════════════════════════════════════════════════════
const marcarTodasLeidas = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id;
        if (!adminId)
            return res.status(401).json({ msg: 'No autenticado.' });

        const Admin = require('../models/Admin');
        const totalAdmins = await Admin.countDocuments({ activo: true });

        // Agregar adminId a todas las no leídas donde no esté ya
        const pendientes = await NotificacionAdmin.find({
            leido:    false,
            vistoPor: { $ne: adminId },
        });

        for (const n of pendientes) {
            n.vistoPor.push(adminId);
            if (n.vistoPor.length >= totalAdmins) n.leido = true;
            await n.save();
        }

        res.json({ msg: 'Todas marcadas como leídas.' });
    } catch (error) {
        console.error('Error marcarTodasLeidas admin:', error);
        res.status(500).json({ msg: 'Error al actualizar notificaciones.' });
    }
};

module.exports = { listar, marcarLeida, marcarTodasLeidas };
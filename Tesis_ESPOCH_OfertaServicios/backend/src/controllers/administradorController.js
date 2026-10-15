// backend/src/controllers/administradorController.js
// Gestión (CRUD) de las cuentas de administrador del portal.
// Cada alta, edición y baja queda registrada en auditoria_logs con el
// administrador que la ejecutó.
const Admin = require('../models/Admin');
const { AuditoriaLog, AuditoriaError } = require('../models/Auditoria');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const MODULO = 'Administradores';
const CAMPOS_PUBLICOS = 'nombre apellidos email cargo rol createdAt updatedAt';

const validarPasswordFuerte = (password) =>
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// El token solo lleva id, rol y nombre: el email del actor se lee de la BD
const obtenerActor = async (req) => {
    const id = req.usuario?.id || req.usuario?._id;
    const actor = id ? await Admin.findById(id).select('nombre apellidos email') : null;
    return {
        id: String(id || 'desconocido'),
        email: actor?.email || 'desconocido',
        nombre: actor ? `${actor.nombre} ${actor.apellidos}` : 'desconocido',
    };
};

const registrarLog = (req, actor, accion, descripcion) =>
    AuditoriaLog.create({
        usuarioId: actor.id,
        usuarioEmail: actor.email,
        rol: 'admin',
        accion,
        modulo: MODULO,
        coleccionAfectada: 'admins',
        descripcion,
        ip: req.ip || 'desconocida',
    }).catch(() => { });

const registrarError = (req, accion, err) =>
    AuditoriaError.create({
        usuarioId: String(req.usuario?.id || 'desconocido'),
        usuarioEmail: req.usuario?.email || 'desconocido',
        rol: 'admin',
        accion,
        modulo: MODULO,
        mensajeError: err.message,
        ip: req.ip || 'desconocida',
    }).catch(() => { });

// ═══════════════════════════════════════════════════════════
// LISTAR ADMINISTRADORES
// ═══════════════════════════════════════════════════════════
exports.listarAdministradores = async (req, res) => {
    try {
        const actorId = String(req.usuario?.id || '');
        const admins = await Admin.find().select(CAMPOS_PUBLICOS).sort({ createdAt: 1 }).lean();
        res.json({
            administradores: admins.map(a => ({ ...a, esActual: String(a._id) === actorId })),
            total: admins.length,
        });
    } catch (err) {
        await registrarError(req, 'LISTAR_ADMINISTRADORES', err);
        res.status(500).json({ msg: 'Error al listar administradores.' });
    }
};

// ═══════════════════════════════════════════════════════════
// CREAR ADMINISTRADOR
// ═══════════════════════════════════════════════════════════
exports.crearAdministrador = async (req, res) => {
    try {
        const nombre = (req.body.nombre || '').trim();
        const apellidos = (req.body.apellidos || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();
        const cargo = (req.body.cargo || '').trim();
        const password = req.body.password || '';

        if (!nombre || !apellidos || !email || !cargo || !password)
            return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
        if (!validarEmail(email))
            return res.status(400).json({ msg: 'El correo electrónico no es válido.' });
        if (!validarPasswordFuerte(password))
            return res.status(400).json({ msg: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.' });
        if (await Admin.exists({ email }))
            return res.status(400).json({ msg: 'Ya existe un administrador con ese correo.' });

        const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const nuevo = await Admin.create({ nombre, apellidos, email, cargo, password: hash, rol: 'admin' });

        const actor = await obtenerActor(req);
        await registrarLog(req, actor, 'CREAR_ADMINISTRADOR',
            `${actor.nombre} agregó al administrador "${nombre} ${apellidos}" (email: ${email}, cargo: ${cargo}).`);

        res.status(201).json({ msg: `Administrador "${nombre} ${apellidos}" agregado correctamente.`, id: nuevo._id });
    } catch (err) {
        await registrarError(req, 'CREAR_ADMINISTRADOR', err);
        res.status(500).json({ msg: 'Error al crear administrador.' });
    }
};

// ═══════════════════════════════════════════════════════════
// EDITAR ADMINISTRADOR
// ═══════════════════════════════════════════════════════════
exports.editarAdministrador = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ msg: 'Identificador no válido.' });

        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ msg: 'Administrador no encontrado.' });

        const cambios = [];
        for (const campo of ['nombre', 'apellidos', 'cargo']) {
            if (req.body[campo] === undefined) continue;
            const valor = String(req.body[campo]).trim();
            if (!valor) return res.status(400).json({ msg: `El campo ${campo} no puede estar vacío.` });
            if (valor !== admin[campo]) { cambios.push(campo); admin[campo] = valor; }
        }

        if (req.body.email !== undefined) {
            const email = String(req.body.email).trim().toLowerCase();
            if (!validarEmail(email))
                return res.status(400).json({ msg: 'El correo electrónico no es válido.' });
            if (email !== admin.email) {
                if (await Admin.exists({ email, _id: { $ne: admin._id } }))
                    return res.status(400).json({ msg: 'Ya existe un administrador con ese correo.' });
                cambios.push('email');
                admin.email = email;
            }
        }

        if (req.body.password) {
            if (!validarPasswordFuerte(req.body.password))
                return res.status(400).json({ msg: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.' });
            admin.password = await bcrypt.hash(req.body.password, await bcrypt.genSalt(10));
            cambios.push('contraseña');
        }

        if (cambios.length === 0) return res.json({ msg: 'No hay cambios que guardar.' });
        await admin.save();

        const actor = await obtenerActor(req);
        await registrarLog(req, actor, 'EDITAR_ADMINISTRADOR',
            `${actor.nombre} editó al administrador "${admin.nombre} ${admin.apellidos}" (email: ${admin.email}). Campos modificados: ${cambios.join(', ')}.`);

        res.json({ msg: 'Administrador actualizado correctamente.' });
    } catch (err) {
        await registrarError(req, 'EDITAR_ADMINISTRADOR', err);
        res.status(500).json({ msg: 'Error al editar administrador.' });
    }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR ADMINISTRADOR
// ═══════════════════════════════════════════════════════════
exports.eliminarAdministrador = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ msg: 'Identificador no válido.' });
        if (String(req.usuario?.id) === String(req.params.id))
            return res.status(400).json({ msg: 'No puedes eliminar tu propia cuenta.' });
        if (await Admin.countDocuments() <= 1)
            return res.status(400).json({ msg: 'Debe existir al menos un administrador.' });

        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) return res.status(404).json({ msg: 'Administrador no encontrado.' });

        const actor = await obtenerActor(req);
        await registrarLog(req, actor, 'ELIMINAR_ADMINISTRADOR',
            `${actor.nombre} eliminó al administrador "${admin.nombre} ${admin.apellidos}" (email: ${admin.email}, cargo: ${admin.cargo}).`);

        res.json({ msg: `Administrador "${admin.nombre} ${admin.apellidos}" eliminado correctamente.` });
    } catch (err) {
        await registrarError(req, 'ELIMINAR_ADMINISTRADOR', err);
        res.status(500).json({ msg: 'Error al eliminar administrador.' });
    }
};

// ═══════════════════════════════════════════════════════════
// HISTORIAL DE MOVIMIENTOS (auditoría del módulo)
// ═══════════════════════════════════════════════════════════
exports.historialAdministradores = async (req, res) => {
    try {
        const limite = Math.min(parseInt(req.query.limit, 10) || 30, 100);
        const movimientos = await AuditoriaLog.find({ modulo: MODULO })
            .select('usuarioEmail accion descripcion ip fechaHora')
            .sort({ fechaHora: -1 })
            .limit(limite)
            .lean();
        res.json({ movimientos });
    } catch (err) {
        await registrarError(req, 'HISTORIAL_ADMINISTRADORES', err);
        res.status(500).json({ msg: 'Error al cargar el historial.' });
    }
};

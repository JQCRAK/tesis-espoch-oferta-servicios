const Graduado = require('../models/Graduado');
const fs = require('fs');
const path = require('path');
const { encriptar, desencriptar, hashParaBusqueda } = require('../utils/cryptoHelper');

// ─────────────────────────────────────────────────────
// Lista oficial de provincias del Ecuador
// ─────────────────────────────────────────────────────
const PROVINCIAS_EC = [
    'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo',
    'Cotopaxi', 'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas',
    'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago',
    'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena',
    'Santo Domingo de los Tsáchilas', 'Sucumbíos', 'Tungurahua',
    'Zamora Chinchipe'
];

// ─────────────────────────────────────────────────────
// calcularProgreso
// Campos obligatorios para tener perfil "completo":
//   1. Foto de perfil
//   2. Bio (descripción > 20 chars)
//   3. Disponibilidad
//   4. Provincia actual
//   5. Cantón actual
// GitHub/LinkedIn son opcionales → NO cuentan para el progreso
// ─────────────────────────────────────────────────────
const calcularProgreso = (graduado) => {
    let puntos = 0;
    const total = 5;

    if (graduado.fotoPerfil) puntos++;
    if (graduado.bio && graduado.bio.trim().length > 20) puntos++;
    if (graduado.disponibilidad) puntos++;
    if (graduado.provinciaActual && graduado.provinciaActual.trim() !== '') puntos++;
    if (graduado.cantonActual && graduado.cantonActual.trim() !== '') puntos++;

    return Math.round((puntos / total) * 100);
};

// ─────────────────────────────────────────────────────
// Verifica si el perfil está listo para publicar tesis
// Devuelve { listo: true } o { listo: false, faltantes: [...] }
// ─────────────────────────────────────────────────────
const verificarPerfilCompleto = (graduado) => {
    const faltantes = [];

    if (!graduado.fotoPerfil)
        faltantes.push('foto de perfil');
    if (!graduado.bio || graduado.bio.trim().length <= 20)
        faltantes.push('descripción profesional');
    if (!graduado.disponibilidad)
        faltantes.push('disponibilidad laboral');
    if (!graduado.provinciaActual || graduado.provinciaActual.trim() === '')
        faltantes.push('provincia actual');
    if (!graduado.cantonActual || graduado.cantonActual.trim() === '')
        faltantes.push('cantón actual');

    return {
        listo: faltantes.length === 0,
        faltantes
    };
};

const calcularAfinidades = (proyectos) => {
    const conteo = {};
    proyectos.forEach(proyecto => {
        if (proyecto.categoria) {
            conteo[proyecto.categoria] = (conteo[proyecto.categoria] || 0) + 1;
        }
    });
    const total = Object.values(conteo).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(conteo)
        .map(([categoria, puntos]) => ({
            categoria,
            puntos,
            porcentaje: Math.round((puntos / total) * 100)
        }))
        .sort((a, b) => b.puntos - a.puntos);
};

const prepararParaFrontend = (graduado) => {
    const obj = graduado.toObject ? graduado.toObject() : { ...graduado };
    delete obj.password;
    delete obj.cedulaHash;
    delete obj.telefonoHash;
    delete obj.emailPersonalHash;
    try { obj.cedula = desencriptar(obj.cedula); } catch { obj.cedula = ''; }
    try { obj.telefono = desencriptar(obj.telefono); } catch { obj.telefono = ''; }
    return obj;
};

// ─────────────────────────────────────────────────────
// GET /api/perfil/mi-perfil
// ─────────────────────────────────────────────────────
const obtenerPerfil = async (req, res) => {
    try {
        const graduado = await Graduado.findById(req.usuario.id);
        if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado' });
        res.json(prepararParaFrontend(graduado));
    } catch (err) {
        console.error('Error en obtenerPerfil:', err);
        res.status(500).json({ msg: 'Error al obtener el perfil' });
    }
};

// ─────────────────────────────────────────────────────
// PUT /api/perfil/actualizar
// ─────────────────────────────────────────────────────
const actualizarPerfil = async (req, res) => {
    try {
        const {
            bio, github, linkedin, disponibilidad, perfilPublico,
            telefono, emailPersonal, tieneDiscapacidad,
            provinciaActual, cantonActual          // ← NUEVOS
        } = req.body;

        const graduado = await Graduado.findById(req.usuario.id);
        if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado' });

        const cambios = {};

        // ── Teléfono ──
        if (telefono !== undefined) {
            const tel = telefono.trim();
            if (!/^[0-9]{10}$/.test(tel))
                return res.status(400).json({ msg: 'El teléfono debe tener exactamente 10 dígitos.' });
            const nuevoHash = hashParaBusqueda(tel);
            if (nuevoHash !== graduado.telefonoHash) {
                const existe = await Graduado.findOne({ telefonoHash: nuevoHash, _id: { $ne: req.usuario.id } });
                if (existe)
                    return res.status(400).json({ msg: 'Ese número de teléfono ya está registrado por otro graduado.' });
                cambios.telefono = encriptar(tel);
                cambios.telefonoHash = nuevoHash;
            }
        }

        // ── Email personal ──
        if (emailPersonal !== undefined) {
            const emailLimpio = emailPersonal.trim().toLowerCase();
            if (emailLimpio.endsWith('@espoch.edu.ec'))
                return res.status(400).json({ msg: 'El correo personal no puede ser un correo institucional ESPOCH.' });
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio))
                return res.status(400).json({ msg: 'El correo personal no tiene un formato válido.' });
            if (graduado.emailInstitucional && graduado.emailInstitucional.endsWith('@espoch.edu.ec') && emailLimpio === graduado.emailInstitucional)
                return res.status(400).json({ msg: 'El correo personal no puede ser el mismo que el institucional.' });
            if (emailLimpio !== graduado.emailPersonal) {
                const existe = await Graduado.findOne({ emailPersonal: emailLimpio, _id: { $ne: req.usuario.id } });
                if (existe)
                    return res.status(400).json({ msg: 'Ese correo personal ya está registrado por otro graduado.' });
                cambios.emailPersonal = emailLimpio;
            }
        }

        // ── Discapacidad ──
        if (tieneDiscapacidad !== undefined) {
            const opcionesValidas = ['No', 'Sí - Visual', 'Sí - Auditiva', 'Sí - Física/Motriz', 'Sí - Intelectual', 'Sí - Psicosocial', 'Sí - Otra'];
            if (!opcionesValidas.includes(tieneDiscapacidad))
                return res.status(400).json({ msg: 'Opción de discapacidad no válida.' });
            cambios.tieneDiscapacidad = tieneDiscapacidad;
        }

        // ── Provincia ──
        if (provinciaActual !== undefined) {
            const prov = provinciaActual.trim();
            if (prov !== '' && !PROVINCIAS_EC.includes(prov))
                return res.status(400).json({ msg: 'La provincia seleccionada no es válida.' });
            cambios.provinciaActual = prov;
        }

        // ── Cantón ──
        if (cantonActual !== undefined) {
            const canton = cantonActual.trim();
            if (canton.length > 80)
                return res.status(400).json({ msg: 'El cantón no puede superar los 80 caracteres.' });
            cambios.cantonActual = canton;
        }

        // ── Campos simples ──
        if (bio !== undefined) cambios.bio = bio.substring(0, 500);
        if (github !== undefined) cambios.github = github.trim();
        if (linkedin !== undefined) cambios.linkedin = linkedin.trim();
        if (disponibilidad !== undefined) cambios.disponibilidad = disponibilidad;
        if (perfilPublico !== undefined) cambios.perfilPublico = perfilPublico;

        // ── Recalcular progreso con los datos actualizados ──
        const datosActualizados = { ...graduado.toObject(), ...cambios };
        cambios.perfilCompletado = calcularProgreso(datosActualizados);

        const actualizado = await Graduado.findByIdAndUpdate(
            req.usuario.id,
            { $set: cambios },
            { new: true, runValidators: false }
        );

        res.json({ msg: 'Perfil actualizado', graduado: prepararParaFrontend(actualizado) });
    } catch (err) {
        console.error('Error en actualizarPerfil:', err);
        res.status(500).json({ msg: 'Error al actualizar el perfil' });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/perfil/foto
// ─────────────────────────────────────────────────────
const subirFotoPerfil = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No se recibió ninguna imagen' });

        const graduado = await Graduado.findById(req.usuario.id);
        if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado' });

        graduado.fotoPerfil = req.file.path;
        graduado.perfilCompletado = calcularProgreso(graduado);
        await graduado.save();

        res.json({ msg: 'Foto actualizada', fotoPerfil: graduado.fotoPerfil, perfilCompletado: graduado.perfilCompletado });
    } catch (err) {
        console.error('ERROR FOTO:', err?.message || String(err));
        console.error('HTTP:', err?.http_code);
        console.error('STACK:', err?.stack);
        res.status(500).json({
            msg: 'Error al subir la foto',
            detalle: err?.message || String(err),
            http_code: err?.http_code
        });
    }
};

// ─────────────────────────────────────────────────────
// GET /api/graduado/datos-encuesta
// ─────────────────────────────────────────────────────
const obtenerDatosEncuesta = async (req, res) => {
    try {
        const graduado = await Graduado.findById(req.usuario.id)
            .select(
                'nombres apellidos fechaNacimiento genero cedula telefono ' +
                'emailPersonal tieneDiscapacidad anioGraduacion ciudadania ' +
                'provinciaActual cantonActual'
            );
        if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado' });

        const obj = graduado.toObject();
        try { obj.cedula = desencriptar(obj.cedula); } catch { obj.cedula = ''; }
        try { obj.telefono = desencriptar(obj.telefono); } catch { obj.telefono = ''; }

        res.json(obj);
    } catch (err) {
        console.error('Error en obtenerDatosEncuesta:', err);
        res.status(500).json({ msg: 'Error al obtener datos' });
    }
};

// ─────────────────────────────────────────────────────
// PATCH /api/graduado/datos-encuesta
// ─────────────────────────────────────────────────────
const actualizarDatosEncuesta = async (req, res) => {
    try {
        const { telefono, emailPersonal, anioGraduacion, ciudadania } = req.body;

        const graduado = await Graduado.findById(req.usuario.id);
        if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado' });

        const cambios = {};

        if (telefono !== undefined && telefono.trim() !== '') {
            const tel = telefono.trim();
            if (!/^[0-9]{10}$/.test(tel))
                return res.status(400).json({ msg: 'El teléfono debe tener exactamente 10 dígitos.' });
            const nuevoHash = hashParaBusqueda(tel);
            if (nuevoHash !== graduado.telefonoHash) {
                const existe = await Graduado.findOne({ telefonoHash: nuevoHash, _id: { $ne: req.usuario.id } });
                if (existe)
                    return res.status(400).json({ msg: 'Ese número de teléfono ya está registrado.' });
                cambios.telefono = encriptar(tel);
                cambios.telefonoHash = nuevoHash;
            }
        }

        if (emailPersonal !== undefined && emailPersonal.trim() !== '') {
            const emailLimpio = emailPersonal.trim().toLowerCase();
            if (emailLimpio.endsWith('@espoch.edu.ec'))
                return res.status(400).json({ msg: 'El correo personal no puede ser institucional.' });
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio))
                return res.status(400).json({ msg: 'Formato de correo inválido.' });
            if (graduado.emailInstitucional && graduado.emailInstitucional.endsWith('@espoch.edu.ec') && emailLimpio === graduado.emailInstitucional)
                return res.status(400).json({ msg: 'El correo personal no puede ser el mismo que el institucional.' });
            if (emailLimpio !== graduado.emailPersonal) {
                const existe = await Graduado.findOne({ emailPersonal: emailLimpio, _id: { $ne: req.usuario.id } });
                if (existe)
                    return res.status(400).json({ msg: 'Ese correo ya está registrado.' });
                cambios.emailPersonal = emailLimpio;
            }
        }

        if (anioGraduacion !== undefined && anioGraduacion !== null && anioGraduacion !== '') {
            const anio = parseInt(anioGraduacion);
            const anioActual = new Date().getFullYear();
            if (isNaN(anio) || anio < 1990 || anio > anioActual)
                return res.status(400).json({ msg: `El año de graduación debe estar entre 1990 y ${anioActual}.` });
            cambios.anioGraduacion = anio;
        }

        if (ciudadania !== undefined) {
            if (!['Nacional', 'Extranjera'].includes(ciudadania))
                return res.status(400).json({ msg: 'Ciudadanía debe ser Nacional o Extranjera.' });
            cambios.ciudadania = ciudadania;
        }

        if (Object.keys(cambios).length === 0)
            return res.status(400).json({ msg: 'No hay cambios para guardar.' });

        await Graduado.findByIdAndUpdate(
            req.usuario.id,
            { $set: cambios },
            { new: true, runValidators: false }
        );

        res.json({ msg: 'Datos actualizados correctamente.' });
    } catch (err) {
        console.error('Error en actualizarDatosEncuesta:', err);
        res.status(500).json({ msg: 'Error al actualizar datos' });
    }
};

// ─────────────────────────────────────────────────────
// GET /api/perfil/verificar-completitud
// El frontend llama esto ANTES de abrir el modal de tesis
// para saber si el perfil está listo
// ─────────────────────────────────────────────────────
const verificarCompletitudPerfil = async (req, res) => {
    try {
        const graduado = await Graduado.findById(req.usuario.id);
        if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado' });

        const resultado = verificarPerfilCompleto(graduado);
        res.json(resultado);
    } catch (err) {
        console.error('Error en verificarCompletitudPerfil:', err);
        res.status(500).json({ msg: 'Error al verificar el perfil' });
    }
};

// ─────────────────────────────────────────────────────
// HELPER exportado — recalcular afinidades
// ─────────────────────────────────────────────────────
const recalcularAfinidades = async (graduadoId) => {
    try {
        const Proyecto = require('../models/Proyecto');
        const proyectos = await Proyecto.find({ graduado: graduadoId, activo: true });
        const afinidades = calcularAfinidades(proyectos);
        await Graduado.findByIdAndUpdate(graduadoId, { afinidades });
    } catch (err) {
        console.error('Error al recalcular afinidades:', err);
    }
};

module.exports = {
    obtenerPerfil,
    actualizarPerfil,
    subirFotoPerfil,
    obtenerDatosEncuesta,
    actualizarDatosEncuesta,
    verificarCompletitudPerfil,  // ← NUEVO
    recalcularAfinidades,
    PROVINCIAS_EC,               // ← exportado para usar en el frontend si se necesita
};
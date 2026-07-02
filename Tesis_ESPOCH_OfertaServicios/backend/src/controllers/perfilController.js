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

const marcarBienvenida = async (req, res) => {
    try {
        await Graduado.findByIdAndUpdate(
            req.usuario.id,
            { bienvenidaMostrada: true },
            { runValidators: false }
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ msg: 'Error' });
    }
};

// ═══════════════════════════════════════════════════════════════
// EXPERIENCIAS LABORALES — auto-declaradas. El admin las verifica
// despues con la hoja de vida fisica del graduado.
// ═══════════════════════════════════════════════════════════════
const NIVELES_EDU = ['Secundaria', 'Tercer Nivel', 'Cuarto Nivel', 'PhD', 'Otro'];

const _validarExperiencia = (data) => {
    if (!data.cargo || !data.cargo.trim())   return 'El cargo es obligatorio.';
    if (!data.empresa || !data.empresa.trim()) return 'La empresa es obligatoria.';
    if (!data.fechaInicio)                   return 'La fecha de inicio es obligatoria.';
    if (data.fechaFin && new Date(data.fechaFin) < new Date(data.fechaInicio))
        return 'La fecha de fin no puede ser anterior a la de inicio.';
    if (data.descripcion && data.descripcion.length > 500)
        return 'La descripcion no puede exceder 500 caracteres.';
    return null;
};

const _normalizarExperiencia = (data) => ({
    cargo:       data.cargo.trim(),
    empresa:     data.empresa.trim(),
    fechaInicio: new Date(data.fechaInicio),
    fechaFin:    data.actual ? null : (data.fechaFin ? new Date(data.fechaFin) : null),
    actual:      Boolean(data.actual),
    descripcion: (data.descripcion || '').trim(),
});

const agregarExperiencia = async (req, res) => {
    const error = _validarExperiencia(req.body);
    if (error) return res.status(400).json({ msg: error });
    try {
        const grad = await Graduado.findById(req.usuario.id);
        if (!grad) return res.status(404).json({ msg: 'Graduado no encontrado' });
        grad.experienciasLaborales.push(_normalizarExperiencia(req.body));
        await grad.save();
        res.json({ ok: true, experiencias: grad.experienciasLaborales });
    } catch (err) {
        res.status(500).json({ msg: 'Error al guardar la experiencia' });
    }
};

const editarExperiencia = async (req, res) => {
    const error = _validarExperiencia(req.body);
    if (error) return res.status(400).json({ msg: error });
    try {
        const grad = await Graduado.findById(req.usuario.id);
        if (!grad) return res.status(404).json({ msg: 'Graduado no encontrado' });
        const exp = grad.experienciasLaborales.id(req.params.expId);
        if (!exp) return res.status(404).json({ msg: 'Experiencia no encontrada' });
        Object.assign(exp, _normalizarExperiencia(req.body));
        // Si era verificada y el graduado la edita, se invalida la verificacion previa
        exp.verificadoPorAdmin = false;
        await grad.save();
        res.json({ ok: true, experiencias: grad.experienciasLaborales });
    } catch (err) {
        res.status(500).json({ msg: 'Error al actualizar la experiencia' });
    }
};

const eliminarExperiencia = async (req, res) => {
    try {
        const grad = await Graduado.findById(req.usuario.id);
        if (!grad) return res.status(404).json({ msg: 'Graduado no encontrado' });
        const exp = grad.experienciasLaborales.id(req.params.expId);
        if (!exp) return res.status(404).json({ msg: 'Experiencia no encontrada' });
        exp.deleteOne();
        await grad.save();
        res.json({ ok: true, experiencias: grad.experienciasLaborales });
    } catch (err) {
        res.status(500).json({ msg: 'Error al eliminar la experiencia' });
    }
};

// ═══════════════════════════════════════════════════════════════
// EDUCACION FORMAL — titulos academicos del graduado
// ═══════════════════════════════════════════════════════════════
const _validarEducacion = (data) => {
    if (!data.institucion || !data.institucion.trim()) return 'La institucion es obligatoria.';
    if (!data.titulo || !data.titulo.trim())           return 'El titulo es obligatorio.';
    if (data.nivel && !NIVELES_EDU.includes(data.nivel))
        return 'El nivel academico no es valido.';
    const ai = Number(data.anioInicio), af = Number(data.anioFin);
    const anioActual = new Date().getFullYear();
    if (data.anioInicio && (ai < 1950 || ai > anioActual + 1))
        return 'El año de inicio no es razonable.';
    if (data.anioFin && (af < 1950 || af > anioActual + 10))
        return 'El año de fin no es razonable.';
    if (data.anioInicio && data.anioFin && af < ai)
        return 'El año de fin no puede ser menor al de inicio.';
    return null;
};

const _normalizarEducacion = (data) => ({
    institucion: data.institucion.trim(),
    titulo:      data.titulo.trim(),
    nivel:       data.nivel || 'Tercer Nivel',
    anioInicio:  data.anioInicio ? Number(data.anioInicio) : null,
    anioFin:     data.anioFin ? Number(data.anioFin) : null,
});

const agregarEducacion = async (req, res) => {
    const error = _validarEducacion(req.body);
    if (error) return res.status(400).json({ msg: error });
    try {
        const grad = await Graduado.findById(req.usuario.id);
        if (!grad) return res.status(404).json({ msg: 'Graduado no encontrado' });
        grad.educacionFormal.push(_normalizarEducacion(req.body));
        await grad.save();
        res.json({ ok: true, educacion: grad.educacionFormal });
    } catch (err) {
        res.status(500).json({ msg: 'Error al guardar la educacion' });
    }
};

const editarEducacion = async (req, res) => {
    const error = _validarEducacion(req.body);
    if (error) return res.status(400).json({ msg: error });
    try {
        const grad = await Graduado.findById(req.usuario.id);
        if (!grad) return res.status(404).json({ msg: 'Graduado no encontrado' });
        const edu = grad.educacionFormal.id(req.params.eduId);
        if (!edu) return res.status(404).json({ msg: 'Educacion no encontrada' });
        Object.assign(edu, _normalizarEducacion(req.body));
        edu.verificadoPorAdmin = false;
        await grad.save();
        res.json({ ok: true, educacion: grad.educacionFormal });
    } catch (err) {
        res.status(500).json({ msg: 'Error al actualizar la educacion' });
    }
};

const eliminarEducacion = async (req, res) => {
    try {
        const grad = await Graduado.findById(req.usuario.id);
        if (!grad) return res.status(404).json({ msg: 'Graduado no encontrado' });
        const edu = grad.educacionFormal.id(req.params.eduId);
        if (!edu) return res.status(404).json({ msg: 'Educacion no encontrada' });
        edu.deleteOne();
        await grad.save();
        res.json({ ok: true, educacion: grad.educacionFormal });
    } catch (err) {
        res.status(500).json({ msg: 'Error al eliminar la educacion' });
    }
};

// ═══════════════════════════════════════════════════════════════
//  HOJA DE VIDA — descarga PDF / DOCX (solo el propio graduado)
// ═══════════════════════════════════════════════════════════════
const _cargarDatosHojaVida = async (graduadoId) => {
    const Proyecto    = require('../models/Proyecto');
    const Certificado = require('../models/Certificado');
    const Tesis       = require('../models/Tesis');

    const graduado = await Graduado.findById(graduadoId);
    if (!graduado) return null;

    const [proyectos, certificados, tesis] = await Promise.all([
        Proyecto.find({ graduado: graduadoId, activo: true }).sort({ fechaRealizacion: -1 }).lean(),
        Certificado.find({ graduado: graduadoId }).sort({ fechaFinalizacion: -1 }).lean(),
        Tesis.findOne({ graduado: graduadoId, verificada: true }).lean(),
    ]);

    // Desencriptar cédula y teléfono (en BD están encriptados)
    let cedulaPlain   = '';
    let telefonoPlain = '';
    try { cedulaPlain   = graduado.cedula   ? desencriptar(graduado.cedula)   : ''; } catch (e) {}
    try { telefonoPlain = graduado.telefono ? desencriptar(graduado.telefono) : ''; } catch (e) {}

    // Cargar foto del graduado (puede ser URL Cloudinary)
    const { cargarFotoBuffer } = require('../services/hojaVidaService');
    const fotoBuffer = graduado.fotoPerfil ? await cargarFotoBuffer(graduado.fotoPerfil) : null;

    return { graduado: graduado.toObject(), proyectos, certificados, tesis, cedulaPlain, telefonoPlain, fotoBuffer };
};

const _nombreArchivo = (graduado, ext) => {
    const limpio = `${graduado.nombres || ''}_${graduado.apellidos || ''}`
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_').replace(/^_|_$/g, '');
    return `HojaDeVida_${limpio || 'graduado'}.${ext}`;
};

const descargarHojaVidaPDF = async (req, res) => {
    try {
        const datos = await _cargarDatosHojaVida(req.usuario.id);
        if (!datos) return res.status(404).json({ msg: 'Graduado no encontrado' });

        const { generarPDF } = require('../services/hojaVidaService');
        const buffer = await generarPDF(datos);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${_nombreArchivo(datos.graduado, 'pdf')}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (err) {
        console.error('[HojaVida PDF] Error:', err);
        res.status(500).json({ msg: 'Error al generar el PDF: ' + err.message });
    }
};

const descargarHojaVidaDOCX = async (req, res) => {
    try {
        const datos = await _cargarDatosHojaVida(req.usuario.id);
        if (!datos) return res.status(404).json({ msg: 'Graduado no encontrado' });

        const { generarDOCX } = require('../services/hojaVidaService');
        const buffer = await generarDOCX(datos);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${_nombreArchivo(datos.graduado, 'docx')}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (err) {
        console.error('[HojaVida DOCX] Error:', err);
        res.status(500).json({ msg: 'Error al generar el DOCX: ' + err.message });
    }
};

// Devuelve los datos JSON para el modal de previsualización en el frontend
const obtenerDatosHojaVida = async (req, res) => {
    try {
        const datos = await _cargarDatosHojaVida(req.usuario.id);
        if (!datos) return res.status(404).json({ msg: 'Graduado no encontrado' });
        // No mandamos fotoBuffer (binario) ni datos sensibles que no se usan en el preview
        const { fotoBuffer, graduado, ...resto } = datos;
        const safeGrad = { ...graduado };
        delete safeGrad.password;
        delete safeGrad.codigoVerificacion;
        delete safeGrad.codigoRecuperacion;
        delete safeGrad.intentosFallidos;
        delete safeGrad.cedulaHash;
        delete safeGrad.telefonoHash;
        delete safeGrad.emailPersonalHash;
        delete safeGrad.cedula;     // versión encriptada — el cliente NO la necesita
        delete safeGrad.telefono;   // versión encriptada
        res.json({ ...resto, graduado: safeGrad });
    } catch (err) {
        console.error('[HojaVida JSON] Error:', err);
        res.status(500).json({ msg: 'Error al cargar datos de hoja de vida' });
    }
};

module.exports = {
    obtenerPerfil,
    actualizarPerfil,
    subirFotoPerfil,
    obtenerDatosEncuesta,
    actualizarDatosEncuesta,
    verificarCompletitudPerfil,
    recalcularAfinidades,
    marcarBienvenida,
    agregarExperiencia,
    editarExperiencia,
    eliminarExperiencia,
    agregarEducacion,
    editarEducacion,
    eliminarEducacion,
    descargarHojaVidaPDF,
    descargarHojaVidaDOCX,
    obtenerDatosHojaVida,
    PROVINCIAS_EC,
};
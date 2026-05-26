// backend/src/controllers/adminController.js
const Graduado = require('../models/Graduado');
const Proyecto = require('../models/Proyecto');
const Certificado = require('../models/Certificado');
const Empleador = require('../models/Empleador');
const { AuditoriaLog, AuditoriaError } = require('../models/Auditoria');
const { recalcularAfinidades } = require('./perfilController');
const { recalcularHabilidades } = require('../utils/nlp/clasificador');
const { encriptar, desencriptar, hashParaBusqueda } = require('../utils/cryptoHelper');
const { enviarCredenciales } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const csv = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// HELPERS GRADUADOS
// ─────────────────────────────────────────────────────────────
const prepararGraduadoAdmin = (graduado) => {
    const obj = graduado.toObject ? graduado.toObject() : { ...graduado };
    delete obj.password;
    delete obj.cedulaHash;
    delete obj.telefonoHash;
    delete obj.emailPersonalHash;
    try { obj.cedula = desencriptar(obj.cedula); } catch { obj.cedula = ''; }
    try { obj.telefono = desencriptar(obj.telefono); } catch { obj.telefono = ''; }
    return obj;
};
const capitalizar = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
        .trim()
        .split(/\s+/)
        .map(palabra => {
            if (!palabra) return '';
            return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
        })
        .join(' ');
};

const generarPassword = (apellidos, cedula) => {
    const letras = apellidos
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z]/g, '')
        .substring(0, 3);
    const primero = letras.charAt(0).toUpperCase();
    const resto = letras.slice(1).toLowerCase();
    const ultimas = String(cedula).slice(-4);
    return `${primero}${resto}${ultimas}#`;
};

const validarCedula = (cedula) => {
    if (!/^[0-9]{10}$/.test(cedula)) return false;
    const prov = parseInt(cedula.substring(0, 2));
    if (prov < 1 || (prov > 24 && prov !== 30)) return false;
    const tipoDoc = parseInt(cedula.substring(2, 3));
    if (tipoDoc > 5) return false;
    return true;
};

const normalizarFila = (fila) => {
    const norm = {};
    for (const [k, v] of Object.entries(fila)) {
        const clave = k.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const valor = typeof v === 'string' ? v.trim().replace(/^'+/, '') : v;
        norm[clave] = valor;
    }
    return {
        nombres: norm['nombres'] || norm['nombre'] || '',
        apellidos: norm['apellidos'] || norm['apellido'] || '',
        cedula: norm['cedula'] || norm['ci'] || '',
        emailPersonal: norm['email personal'] || norm['emailpersonal'] || norm['email'] || '',
        telefono: norm['telefono'] || norm['celular'] || '',
        genero: norm['genero'] || norm['sexo'] || '',
        fechaNacimiento: norm['fecha nacimiento'] || norm['fechanacimiento'] || norm['fecha de nacimiento'] || '',
        tieneDiscapacidad: norm['discapacidad'] || norm['tiene discapacidad'] || 'No',
    };
};

const GENEROS_VALIDOS = ['Masculino', 'Femenino', 'No binario'];
const DISCAPACIDAD_VALIDA = ['No', 'Sí - Visual', 'Sí - Auditiva', 'Sí - Física/Motriz', 'Sí - Intelectual', 'Sí - Psicosocial', 'Sí - Otra'];

// ─────────────────────────────────────────────────────────────
// HELPERS EMPLEADORES
// ─────────────────────────────────────────────────────────────
const normalizarFilaEmpleador = (fila) => {
    const norm = {};
    for (const [k, v] of Object.entries(fila)) {
        const clave = k.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const valor = typeof v === 'string' ? v.trim().replace(/^'+/, '') : v;
        norm[clave] = valor;
    }
    return {
        nombreEmpresa: norm['nombre empresa'] || norm['nombreempresa'] || norm['empresa'] || '',
        nombreGerente: norm['nombre gerente'] || norm['nombregerente'] || norm['gerente'] || '',
        emailOrganizacion: norm['email organizacion'] || norm['emailorganizacion'] || norm['email'] || '',
        telefonoOrganizacion: norm['telefono organizacion'] || norm['telefonoorganizacion'] || norm['telefono'] || '',
        provincia: norm['provincia'] || '',
        ciudad: norm['ciudad'] || '',
        tipoCapital: norm['tipo capital'] || norm['tipocapital'] || norm['capital'] || '',
        tipoActividad: norm['tipo actividad'] || norm['tipoactividad'] || norm['actividad'] || '',
    };
};

const TIPOS_CAPITAL_VALIDOS = ['Pública', 'Privada', 'Mixto'];
const TIPOS_ACTIVIDAD_VALIDOS = ['Industrial', 'Comercial', 'Servicios'];

// ═══════════════════════════════════════════════════════════
// MÉTRICAS GRADUADOS
// ═══════════════════════════════════════════════════════════
exports.getMetricas = async (req, res) => {
    try {
        const [totalGraduados, perfilesPublicos, verificados, pendientes, disponibles] =
            await Promise.all([
                Graduado.countDocuments(),
                Graduado.countDocuments({ perfilPublico: true, tesisVerificada: true }),
                Graduado.countDocuments({ verificado: true }),
                Graduado.countDocuments({ verificado: false }),
                Graduado.countDocuments({ disponibilidad: 'disponible' }),
            ]);
        res.json({ totalGraduados, perfilesPublicos, verificados, pendientes, disponibles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener métricas.' });
    }
};

// ═══════════════════════════════════════════════════════════
// AÑOS DE GRADUACIÓN
// ═══════════════════════════════════════════════════════════
exports.getAniosGraduacion = async (req, res) => {
    try {
        const anios = await Graduado.distinct('anioGraduacion', { anioGraduacion: { $ne: null } });
        const ordenados = anios.filter(a => typeof a === 'number' && a > 1990).sort((a, b) => b - a);
        res.json(ordenados);
    } catch (err) {
        res.status(500).json({ msg: 'Error al obtener años.' });
    }
};

// ═══════════════════════════════════════════════════════════
// LISTAR GRADUADOS
// ═══════════════════════════════════════════════════════════
exports.listarGraduados = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const buscar = req.query.buscar?.trim();
        const estado = req.query.estado;
        const anio = parseInt(req.query.anio);

        const filtro = {};
        if (buscar) {
            const rx = { $regex: buscar, $options: 'i' };
            filtro.$or = [
                { nombres: rx }, { apellidos: rx },
                { emailInstitucional: rx }, { emailPersonal: rx },
                { tecnologias: rx },
            ];
        }
        if (estado === 'verificado') filtro.verificado = true;
        if (estado === 'pendiente') filtro.verificado = false;
        if (estado === 'bloqueado' || estado === 'antiguo') filtro.cuentaBloqueada = true;
        if (!isNaN(anio)) filtro.anioGraduacion = anio;

        const [graduados, total] = await Promise.all([
            Graduado.find(filtro)
                .select(
                    'nombres apellidos emailInstitucional emailPersonal telefono fotoPerfil ' +
                    'verificado cuentaBloqueada perfilPublico tesisVerificada ' +
                    'disponibilidad perfilCompletado anioGraduacion tecnologias ' +
                    'bio github linkedin habilidadesBlandas afinidades createdAt'
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Graduado.countDocuments(filtro),
        ]);

        res.json({ graduados, total, pagina: page, totalPaginas: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ msg: 'Error al obtener graduados.' });
    }
};

// ═══════════════════════════════════════════════════════════
// OBTENER GRADUADO POR ID
// ═══════════════════════════════════════════════════════════
exports.getGraduadoPorId = async (req, res) => {
    try {
        const graduado = await Graduado.findById(req.params.id);
        if (!graduado) return res.status(404).json({ msg: 'No encontrado.' });
        res.json(prepararGraduadoAdmin(graduado));
    } catch (err) {
        console.error('Error en GET /graduados/:id:', err);
        res.status(500).json({ msg: 'Error.' });
    }
};

// ═══════════════════════════════════════════════════════════
// EDITAR DATOS SENSIBLES GRADUADO
// ═══════════════════════════════════════════════════════════
exports.editarGraduado = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';
        const { telefono, emailPersonal } = req.body;

        const graduado = await Graduado.findById(req.params.id);
        if (!graduado) return res.status(404).json({ msg: 'No encontrado.' });

        const campos = {};
        const cambios = [];

        if (telefono !== undefined) {
            const tel = telefono.trim();
            if (tel !== '' && !/^[0-9]{10}$/.test(tel))
                return res.status(400).json({ msg: 'El teléfono debe tener exactamente 10 dígitos.' });
            if (tel !== '') {
                const nuevoHash = hashParaBusqueda(tel);
                if (nuevoHash !== graduado.telefonoHash) {
                    const existe = await Graduado.findOne({ telefonoHash: nuevoHash, _id: { $ne: req.params.id } });
                    if (existe) return res.status(400).json({ msg: 'Ese número ya está registrado.' });
                    campos.telefono = encriptar(tel);
                    campos.telefonoHash = nuevoHash;
                    cambios.push('teléfono');
                }
            }
        }

        if (emailPersonal !== undefined) {
            const emailLimpio = emailPersonal.trim().toLowerCase();
            if (emailLimpio !== '') {
                if (emailLimpio.endsWith('@espoch.edu.ec'))
                    return res.status(400).json({ msg: 'No puede ser un correo institucional.' });
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio))
                    return res.status(400).json({ msg: 'Formato de correo inválido.' });
                if (emailLimpio !== graduado.emailPersonal) {
                    const existe = await Graduado.findOne({ emailPersonal: emailLimpio, _id: { $ne: req.params.id } });
                    if (existe) return res.status(400).json({ msg: 'Ese correo ya está registrado.' });
                    campos.emailPersonal = emailLimpio;
                    cambios.push('email personal');
                }
            }
        }

        if (Object.keys(campos).length === 0)
            return res.status(400).json({ msg: 'No hay cambios para guardar.' });

        const actualizado = await Graduado.findByIdAndUpdate(req.params.id, { $set: campos }, { new: true });

        await AuditoriaLog.create({
            usuarioId: String(adminId),
            usuarioEmail: adminEmail,
            rol: 'admin',
            accion: 'EDITAR_GRADUADO',
            modulo: 'Graduados',
            coleccionAfectada: 'graduados',
            descripcion: `Datos editados de "${graduado.nombres} ${graduado.apellidos}": ${cambios.join(', ')}.`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({ msg: 'Actualizado correctamente.', graduado: prepararGraduadoAdmin(actualizado) });
    } catch (err) {
        console.error('Error en editarGraduado:', err);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'EDITAR_GRADUADO',
            modulo: 'Graduados',
            mensajeError: err.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error al actualizar.' });
    }
};

// ═══════════════════════════════════════════════════════════
// VERIFICAR GRADUADO
// ═══════════════════════════════════════════════════════════
exports.verificarGraduado = async (req, res) => {
    try {
        const graduado = await Graduado.findByIdAndUpdate(
            req.params.id,
            { verificado: Boolean(req.body.verificado) },
            { new: true, select: 'nombres apellidos verificado' }
        );
        if (!graduado) return res.status(404).json({ msg: 'No encontrado.' });
        res.json({ msg: 'Verificación actualizada.', graduado });
    } catch (err) {
        res.status(500).json({ msg: 'Error.' });
    }
};

// ═══════════════════════════════════════════════════════════
// BLOQUEAR / DESBLOQUEAR GRADUADO
// ═══════════════════════════════════════════════════════════
exports.bloquearGraduado = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';
        const bloqueado = Boolean(req.body.bloqueado);

        const graduado = await Graduado.findByIdAndUpdate(
            req.params.id,
            { cuentaBloqueada: bloqueado },
            { new: true, select: 'nombres apellidos emailPersonal cuentaBloqueada' }
        );
        if (!graduado) return res.status(404).json({ msg: 'No encontrado.' });

        await AuditoriaLog.create({
            usuarioId: String(adminId),
            usuarioEmail: adminEmail,
            rol: 'admin',
            accion: bloqueado ? 'BLOQUEAR_GRADUADO' : 'DESBLOQUEAR_GRADUADO',
            modulo: 'Graduados',
            coleccionAfectada: 'graduados',
            descripcion: `Graduado "${graduado.nombres} ${graduado.apellidos}" (${graduado.emailPersonal}) fue ${bloqueado ? 'bloqueado' : 'desbloqueado'}.`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({ msg: 'Bloqueo actualizado.', graduado });
    } catch (err) {
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'BLOQUEAR_GRADUADO',
            modulo: 'Graduados',
            mensajeError: err.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error.' });
    }
};

// ═══════════════════════════════════════════════════════════
// OBTENER PROYECTOS DE GRADUADO
// ═══════════════════════════════════════════════════════════
exports.getProyectosGraduado = async (req, res) => {
    try {
        const proyectos = await Proyecto.find({ graduado: req.params.id, activo: true })
            .sort({ fechaRealizacion: -1 });
        res.json(proyectos);
    } catch (err) {
        res.status(500).json({ msg: 'Error.' });
    }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR PROYECTO DE GRADUADO
// ═══════════════════════════════════════════════════════════
exports.eliminarProyectoGraduado = async (req, res) => {
    try {
        const proyecto = await Proyecto.findOne({ _id: req.params.proyId, graduado: req.params.id });
        if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado.' });
        if (proyecto.imagen) {
            const ruta = path.join(__dirname, '..', proyecto.imagen);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }
        await Proyecto.deleteOne({ _id: proyecto._id });
        await recalcularAfinidades(req.params.id);
        recalcularHabilidades(req.params.id);
        res.json({ msg: 'Proyecto eliminado.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al eliminar proyecto.' });
    }
};

// ═══════════════════════════════════════════════════════════
// OBTENER CERTIFICADOS DE GRADUADO
// ═══════════════════════════════════════════════════════════
exports.getCertificadosGraduado = async (req, res) => {
    try {
        const certificados = await Certificado.find({ graduado: req.params.id })
            .sort({ fechaFinalizacion: -1 });
        res.json(certificados);
    } catch (err) {
        res.status(500).json({ msg: 'Error.' });
    }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR CERTIFICADO DE GRADUADO
// ═══════════════════════════════════════════════════════════
exports.eliminarCertificadoGraduado = async (req, res) => {
    try {
        const certificado = await Certificado.findOne({ _id: req.params.certId, graduado: req.params.id });
        if (!certificado) return res.status(404).json({ msg: 'Certificado no encontrado.' });
        if (certificado.archivo) {
            const ruta = path.join(__dirname, '..', certificado.archivo);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }
        await Certificado.deleteOne({ _id: certificado._id });
        recalcularHabilidades(req.params.id);
        res.json({ msg: 'Certificado eliminado.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al eliminar certificado.' });
    }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR GRADUADO
// ═══════════════════════════════════════════════════════════
exports.eliminarGraduado = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ msg: 'ID de estudiante inválido.' });

        const graduado = await Graduado.findById(id);
        if (!graduado) return res.status(404).json({ msg: 'Estudiante no encontrado.' });

        const { nombres, apellidos, fotoPerfil } = graduado;
        const carpetaGraduado = path.join(__dirname, '..', 'uploads', 'graduados', id);

        if (fotoPerfil) {
            try {
                const rutaFoto = path.join(__dirname, '..', fotoPerfil);
                if (fs.existsSync(rutaFoto)) fs.unlinkSync(rutaFoto);
            } catch (err) { console.error('Error eliminando foto:', err.message); }
        }

        try {
            const proyectos = await Proyecto.find({ graduado: id });
            for (const proyecto of proyectos) {
                if (proyecto.imagen) {
                    try {
                        const rutaImg = path.join(__dirname, '..', proyecto.imagen);
                        if (fs.existsSync(rutaImg)) fs.unlinkSync(rutaImg);
                    } catch (err) { console.error(err.message); }
                }
            }
            await Proyecto.deleteMany({ graduado: id });
        } catch (err) { console.error('Error procesando proyectos:', err.message); }

        try {
            const certificados = await Certificado.find({ graduado: id });
            for (const certificado of certificados) {
                if (certificado.archivo) {
                    try {
                        const rutaArch = path.join(__dirname, '..', certificado.archivo);
                        if (fs.existsSync(rutaArch)) fs.unlinkSync(rutaArch);
                    } catch (err) { console.error(err.message); }
                }
            }
            await Certificado.deleteMany({ graduado: id });
        } catch (err) { console.error('Error procesando certificados:', err.message); }

        try {
            const Tesis = require('../models/Tesis');
            await Tesis.deleteMany({ graduado: id });
        } catch (err) { console.error('Error procesando tesis:', err.message); }

        try {
            if (fs.existsSync(carpetaGraduado))
                fs.rmSync(carpetaGraduado, { recursive: true, force: true });
        } catch (err) { console.error('Error eliminando carpeta:', err.message); }

        const graduadoEliminado = await Graduado.findByIdAndDelete(id);

        await AuditoriaLog.create({
            usuarioId: String(adminId),
            usuarioEmail: adminEmail,
            rol: 'admin',
            accion: 'ELIMINAR_GRADUADO',
            modulo: 'Graduados',
            coleccionAfectada: 'graduados',
            descripcion: `Graduado eliminado: "${nombres} ${apellidos}" (email: ${graduadoEliminado.emailPersonal}).`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.status(200).json({
            msg: `Estudiante "${nombres} ${apellidos}" y todos sus datos han sido eliminados permanentemente.`,
            graduado: {
                _id: graduadoEliminado._id,
                nombres: graduadoEliminado.nombres,
                apellidos: graduadoEliminado.apellidos,
            },
        });
    } catch (error) {
        console.error('Error al eliminar estudiante:', error);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'ELIMINAR_GRADUADO',
            modulo: 'Graduados',
            mensajeError: error.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error al eliminar el estudiante.', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// REGISTRO INDIVIDUAL GRADUADO
// ═══════════════════════════════════════════════════════════
exports.registroIndividualGraduado = async (req, res) => {
    try {
        const {
            nombres, apellidos, cedula, emailPersonal, telefono,
            genero, fechaNacimiento, tieneDiscapacidad, password: passwordManual,
        } = req.body;

        if (!nombres || !apellidos || !cedula || !emailPersonal || !telefono || !genero || !fechaNacimiento)
            return res.status(400).json({ msg: 'Faltan campos obligatorios.' });

        if (!validarCedula(cedula.trim()))
            return res.status(400).json({ msg: 'La cédula ingresada no es válida.' });

        if (!/^[0-9]{10}$/.test(telefono.trim()))
            return res.status(400).json({ msg: 'El teléfono debe tener 10 dígitos.' });

        const emailLimpio = emailPersonal.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio))
            return res.status(400).json({ msg: 'El correo personal no es válido.' });

        const fechaNac = new Date(fechaNacimiento);
        const edadMinima = new Date();
        edadMinima.setFullYear(edadMinima.getFullYear() - 20);
        if (isNaN(fechaNac.getTime()) || fechaNac > edadMinima)
            return res.status(400).json({ msg: 'El graduado debe tener al menos 20 años.' });

        const cedulaSoloNum = cedula.trim().replace(/\D/g, '');
        let cedulaLimpia;
        if (cedulaSoloNum.length === 9) cedulaLimpia = '0' + cedulaSoloNum;
        else if (cedulaSoloNum.length === 10) cedulaLimpia = cedulaSoloNum;
        else return res.status(400).json({ msg: 'La cédula debe tener 9 o 10 dígitos.' });

        const telefonoSoloNum = telefono.trim().replace(/\D/g, '');
        let telefonoLimpio;
        if (telefonoSoloNum.length === 9) telefonoLimpio = '0' + telefonoSoloNum;
        else if (telefonoSoloNum.length === 10) telefonoLimpio = telefonoSoloNum;
        else return res.status(400).json({ msg: 'El teléfono debe tener 9 o 10 dígitos.' });

        const hashCedula = hashParaBusqueda(cedulaLimpia);
        const hashTelefono = hashParaBusqueda(telefonoLimpio);

        if (await Graduado.findOne({ cedulaHash: hashCedula }))
            return res.status(400).json({ msg: 'La cédula ya está registrada.' });
        if (await Graduado.findOne({ telefonoHash: hashTelefono }))
            return res.status(400).json({ msg: 'El teléfono ya está registrado.' });
        if (await Graduado.findOne({ emailPersonal: emailLimpio }))
            return res.status(400).json({ msg: 'El correo personal ya está registrado.' });

        const password = passwordManual?.trim() || generarPassword(apellidos, cedulaLimpia);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoGraduado = new Graduado({
            nombres: capitalizar(nombres), apellidos: capitalizar(apellidos),
            cedula: encriptar(cedulaLimpia), cedulaHash: hashCedula,
            telefono: encriptar(telefonoLimpio), telefonoHash: hashTelefono,
            emailPersonal: emailLimpio, emailInstitucional: emailLimpio,
            password: hashedPassword,
            genero: genero || 'Prefiero no decir',
            fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : new Date('2000-01-01'),
            tieneDiscapacidad: tieneDiscapacidad || 'No',
            verificado: true, cuentaBloqueada: false, perfilPublico: false,
            terminosAceptados: false, tesisVerificada: false,
            disponibilidad: 'disponible', perfilCompletado: 0,
        });

        await nuevoGraduado.save();

        const carpeta = path.join(__dirname, '..', 'uploads', 'graduados', nuevoGraduado._id.toString());
        if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });

        enviarCredenciales({
            nombres: nuevoGraduado.nombres, apellidos: nuevoGraduado.apellidos,
            emailPersonal: emailLimpio, password,
        }).catch(err => console.error('Error enviando correo:', err));

        res.status(201).json({
            msg: 'Graduado registrado correctamente. Se envió un correo con sus credenciales.',
            graduado: prepararGraduadoAdmin(nuevoGraduado),
        });
    } catch (err) {
        console.error('Error en registro individual:', err);
        if (err.code === 11000) {
            const campo = Object.keys(err.keyPattern)[0];
            const msgs = {
                emailPersonal: 'El correo personal ya está registrado.',
                cedulaHash: 'La cédula ya está registrada.',
                telefonoHash: 'El teléfono ya está registrado.',
            };
            return res.status(400).json({ msg: msgs[campo] || 'Dato duplicado.' });
        }
        res.status(500).json({ msg: 'Error interno al registrar.' });
    }
};

// ═══════════════════════════════════════════════════════════
// CARGA MASIVA GRADUADOS
// ═══════════════════════════════════════════════════════════
exports.cargaMasivaGraduados = async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No se recibió ningún archivo CSV.' });

    const reporte = { total: 0, exitosos: 0, fallidos: 0, detalle: [] };

    try {
        const contenidoCSV = req.file.buffer.toString('latin1');
        const muestraTexto = contenidoCSV.substring(0, 500);
        const delimitador = (muestraTexto.match(/;/g) || []).length >= (muestraTexto.match(/,/g) || []).length ? ';' : ',';

        let filas;
        try {
            filas = csv.parse(contenidoCSV, {
                columns: true, skip_empty_lines: true, trim: true,
                delimiter: delimitador, from_line: 2,
            });
        } catch (parseErr) {
            return res.status(400).json({ msg: 'El archivo CSV no tiene un formato válido.' });
        }

        reporte.total = filas.length;
        if (filas.length === 0) return res.status(400).json({ msg: 'El CSV está vacío.' });
        if (filas.length > 200) return res.status(400).json({ msg: 'El CSV no puede tener más de 200 filas por carga.' });

        const cedulasEnCSV = new Set();
        const telefonosEnCSV = new Set();
        const emailsEnCSV = new Set();

        for (let i = 0; i < filas.length; i++) {
            const filaNum = i + 3;
            const datos = normalizarFila(filas[i]);

            if (datos.nombres && (
                datos.nombres.toLowerCase().includes('[ejemplo]') ||
                datos.nombres.toLowerCase().startsWith('ejemplo')
            )) continue;

            const resultado = {
                fila: filaNum, nombres: datos.nombres || '—', apellidos: datos.apellidos || '—',
                email: datos.emailPersonal || '—', cedula: datos.cedula || '—',
                estado: 'error', motivo: '', password: '',
            };

            try {
                if (!datos.nombres) throw new Error('Falta el campo "nombres".');
                if (!datos.apellidos) throw new Error('Falta el campo "apellidos".');
                if (!datos.cedula) throw new Error('Falta el campo "cédula".');
                if (!datos.emailPersonal) throw new Error('Falta el campo "email personal".');
                if (!datos.telefono) throw new Error('Falta el campo "teléfono".');
                if (!datos.genero) throw new Error('Falta el campo "género".');
                if (!datos.fechaNacimiento) throw new Error('Falta el campo "fecha nacimiento".');

                const cedulaSoloNum = datos.cedula.replace(/\D/g, '');
                let cedulaLimpia;
                if (cedulaSoloNum.length === 9) cedulaLimpia = '0' + cedulaSoloNum;
                else if (cedulaSoloNum.length === 10) cedulaLimpia = cedulaSoloNum;
                else throw new Error(`Cédula inválida: debe tener 9 o 10 dígitos (recibido: ${cedulaSoloNum.length}).`);

                const telefonoSoloNum = datos.telefono.replace(/\D/g, '');
                let telefonoLimpio;
                if (telefonoSoloNum.length === 9) telefonoLimpio = '0' + telefonoSoloNum;
                else if (telefonoSoloNum.length === 10) telefonoLimpio = telefonoSoloNum;
                else throw new Error(`Teléfono inválido: debe tener 9 o 10 dígitos (recibido: ${telefonoSoloNum.length}).`);

                let fechaNac;
                if (datos.fechaNacimiento.includes('/')) {
                    const [dia, mes, anio] = datos.fechaNacimiento.split('/');
                    fechaNac = new Date(`${anio}-${mes}-${dia}`);
                } else if (datos.fechaNacimiento.includes('-')) {
                    fechaNac = new Date(datos.fechaNacimiento);
                } else {
                    throw new Error('Formato de fecha no reconocido. Use DD/MM/YYYY o YYYY-MM-DD.');
                }

                if (isNaN(fechaNac.getTime())) throw new Error('Fecha de nacimiento inválida.');
                const edadMinima = new Date();
                edadMinima.setFullYear(edadMinima.getFullYear() - 20);
                if (fechaNac > edadMinima) throw new Error('El graduado debe tener al menos 20 años.');

                if (!validarCedula(cedulaLimpia)) throw new Error('Cédula inválida.');
                if (!/^[0-9]{10}$/.test(telefonoLimpio)) throw new Error('El teléfono debe tener 10 dígitos numéricos.');

                const emailLimpio = datos.emailPersonal.trim().toLowerCase();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio))
                    throw new Error('El correo personal no tiene un formato válido.');

                const generoValido = GENEROS_VALIDOS.find(g => g.toLowerCase() === datos.genero.toLowerCase());
                if (!generoValido) throw new Error(`Género inválido. Valores válidos: ${GENEROS_VALIDOS.join(', ')}.`);

                if (cedulasEnCSV.has(cedulaLimpia)) throw new Error('Cédula duplicada dentro del archivo CSV.');
                if (telefonosEnCSV.has(telefonoLimpio)) throw new Error('Teléfono duplicado dentro del archivo CSV.');
                if (emailsEnCSV.has(emailLimpio)) throw new Error('Correo personal duplicado dentro del archivo CSV.');

                const hashCedula = hashParaBusqueda(cedulaLimpia);
                const hashTelefono = hashParaBusqueda(telefonoLimpio);

                const [dupCedula, dupTel, dupEmail] = await Promise.all([
                    Graduado.findOne({ cedulaHash: hashCedula }),
                    Graduado.findOne({ telefonoHash: hashTelefono }),
                    Graduado.findOne({ emailPersonal: emailLimpio }),
                ]);

                if (dupCedula) throw new Error(`Cédula ${cedulaLimpia} ya está registrada en el sistema.`);
                if (dupTel) throw new Error(`Teléfono ${telefonoLimpio} ya está registrado en el sistema.`);
                if (dupEmail) throw new Error(`Correo ${emailLimpio} ya está registrado en el sistema.`);

                const password = generarPassword(datos.apellidos, cedulaLimpia);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                const discapacidadValida = DISCAPACIDAD_VALIDA.find(
                    d => d.toLowerCase() === (datos.tieneDiscapacidad || 'No').toLowerCase()
                ) || 'No';

                const nuevoGraduado = new Graduado({
                    nombres: capitalizar(datos.nombres), apellidos: capitalizar(datos.apellidos),
                    cedula: encriptar(cedulaLimpia), cedulaHash: hashCedula,
                    telefono: encriptar(telefonoLimpio), telefonoHash: hashTelefono,
                    emailPersonal: emailLimpio, emailInstitucional: emailLimpio,
                    password: hashedPassword, genero: generoValido, fechaNacimiento: fechaNac,
                    tieneDiscapacidad: discapacidadValida,
                    verificado: true, cuentaBloqueada: false, perfilPublico: false,
                    terminosAceptados: false, tesisVerificada: false,
                    disponibilidad: 'disponible', perfilCompletado: 0,
                });

                await nuevoGraduado.save();

                const carpeta = path.join(__dirname, '..', 'uploads', 'graduados', nuevoGraduado._id.toString());
                if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });

                cedulasEnCSV.add(cedulaLimpia);
                telefonosEnCSV.add(telefonoLimpio);
                emailsEnCSV.add(emailLimpio);

                resultado.estado = 'exitoso';
                resultado.password = password;

                try {
                    await enviarCredenciales({
                        nombres: nuevoGraduado.nombres, apellidos: nuevoGraduado.apellidos,
                        emailPersonal: emailLimpio, password,
                    });
                    resultado.motivo = 'Registrado y correo enviado correctamente.';
                } catch (emailErr) {
                    console.error(`Error enviando correo a ${emailLimpio}:`, emailErr.message);
                    resultado.motivo = 'Registrado pero el correo no pudo enviarse.';
                }
                reporte.exitosos++;

            } catch (err) {
                resultado.estado = 'error';
                resultado.motivo = err.message || 'Error desconocido.';
                reporte.fallidos++;
            }

            reporte.detalle.push(resultado);
        }

        // ── Auditoría carga masiva graduados ──
        await AuditoriaLog.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'CARGA_MASIVA_GRADUADOS',
            modulo: 'Graduados',
            coleccionAfectada: 'graduados',
            descripcion: `Carga masiva CSV: ${reporte.exitosos} graduados registrados, ${reporte.fallidos} fallidos de ${reporte.total} filas.`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({
            msg: `Carga completada: ${reporte.exitosos} exitosos, ${reporte.fallidos} con errores.`,
            reporte,
        });
    } catch (err) {
        console.error('Error en carga masiva:', err);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'CARGA_MASIVA_GRADUADOS',
            modulo: 'Graduados',
            mensajeError: err.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error interno al procesar el CSV.' });
    }
};

// ═══════════════════════════════════════════════════════════
// PLANTILLA CSV GRADUADOS
// ═══════════════════════════════════════════════════════════
exports.plantillaCSVGraduados = (req, res) => {
    const instrucciones = 'Complete desde FILA 5. Si cedula o telefono comienzan en 0, se completaran automaticamente. NO modifique filas 1 a 4.;;;;;;;\n';
    const cab = 'nombres;apellidos;cedula;email personal;telefono;genero;fecha nacimiento;discapacidad\n';
    const ej1 = '[Ejemplo] Juan Carlos;Perez Lopez;0601234567;juanperez@gmail.com;0991234567;Masculino;1995-06-15;No\n';
    const ej2 = '[Ejemplo] Maria Elena;Guaman Torres;0602345678;mariaguaman@hotmail.com;0982345678;Femenino;1997-03-22;Si - Visual\n';
    const contenido = instrucciones + cab + ej1 + ej2;
    res.setHeader('Content-Type', 'text/csv; charset=windows-1252');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_graduados_espoch.csv"');
    res.send(Buffer.from(contenido, 'latin1'));
};

// ═══════════════════════════════════════════════════════════
// MÉTRICAS EMPLEADORES
// ═══════════════════════════════════════════════════════════
exports.getMetricasEmpleadores = async (req, res) => {
    try {
        const [total, publicas, privadas, mixtas] = await Promise.all([
            Empleador.countDocuments({ activo: true }),
            Empleador.countDocuments({ activo: true, tipoCapital: 'Pública' }),
            Empleador.countDocuments({ activo: true, tipoCapital: 'Privada' }),
            Empleador.countDocuments({ activo: true, tipoCapital: 'Mixto' }),
        ]);
        res.json({ total, publicas, privadas, mixtas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener métricas de empleadores.' });
    }
};

// ═══════════════════════════════════════════════════════════
// PLANTILLA CSV EMPLEADORES
// ═══════════════════════════════════════════════════════════
exports.plantillaCSVEmpleadores = (req, res) => {
    const instrucciones = 'Complete desde FILA 5. NO modifique filas 1 a 4. telefono organizacion, provincia y ciudad son opcionales.;;;;;;;\n';
    const cab = 'nombre empresa;nombre gerente;email organizacion;telefono organizacion;provincia;ciudad;tipo capital;tipo actividad\n';
    const ej1 = '[Ejemplo] TechCorp S.A.;Juan Perez;techcorp@empresa.com;0991234567;Chimborazo;Riobamba;Privada;Servicios\n';
    const ej2 = '[Ejemplo] Municipio Riobamba;Ana Torres;municipio@gob.ec;032961000;Chimborazo;Riobamba;Publica;Industrial\n';
    const ej3 = '[Ejemplo] Constructora MixCo;Carlos Vera;mixco@empresa.com;;Pichincha;Quito;Mixto;Comercial\n';
    const contenido = instrucciones + cab + ej1 + ej2 + ej3;
    res.setHeader('Content-Type', 'text/csv; charset=windows-1252');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_empleadores_espoch.csv"');
    res.send(Buffer.from(contenido, 'latin1'));
};

// ═══════════════════════════════════════════════════════════
// REGISTRO INDIVIDUAL EMPLEADOR
// ═══════════════════════════════════════════════════════════
exports.registroIndividualEmpleador = async (req, res) => {
    try {
        const {
            nombreEmpresa, nombreGerente, emailOrganizacion,
            telefonoOrganizacion, provincia, ciudad,
            tipoCapital, tipoActividad,
        } = req.body;
        const adminId = req.usuario?.id || req.usuario?._id;

        // Todos obligatorios
        if (!nombreEmpresa || !nombreGerente || !emailOrganizacion ||
            !telefonoOrganizacion || !provincia || !ciudad ||
            !tipoCapital || !tipoActividad)
            return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });

        const emailLimpio = emailOrganizacion.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio))
            return res.status(400).json({ msg: 'El correo de la organización no es válido.' });

        const telSolo = telefonoOrganizacion.trim().replace(/\D/g, '');
        if (telSolo.length < 7 || telSolo.length > 10)
            return res.status(400).json({ msg: 'El teléfono debe tener entre 7 y 10 dígitos.' });

        if (!TIPOS_CAPITAL_VALIDOS.includes(tipoCapital))
            return res.status(400).json({ msg: `Tipo de capital inválido. Valores: ${TIPOS_CAPITAL_VALIDOS.join(', ')}.` });

        if (!TIPOS_ACTIVIDAD_VALIDOS.includes(tipoActividad))
            return res.status(400).json({ msg: `Tipo de actividad inválido. Valores: ${TIPOS_ACTIVIDAD_VALIDOS.join(', ')}.` });

        if (await Empleador.findOne({ emailOrganizacion: emailLimpio, activo: true }))
            return res.status(400).json({ msg: 'Ya existe una empresa registrada con ese correo.' });

        const nombreLimpio = nombreEmpresa.trim();
        if (await Empleador.findOne({ nombreEmpresa: { $regex: `^${nombreLimpio}$`, $options: 'i' }, activo: true }))
            return res.status(400).json({ msg: 'Ya existe una empresa registrada con ese nombre.' });

        const nuevoEmpleador = new Empleador({
            nombreEmpresa: nombreLimpio,                        // empresa: sin capitalizar
            nombreGerente: capitalizar(nombreGerente),          // ← capitalizar
            emailOrganizacion: emailLimpio,
            telefonoOrganizacion: telefonoOrganizacion.trim(),
            provincia: capitalizar(provincia),              // ← capitalizar
            ciudad: capitalizar(ciudad),                 // ← capitalizar
            tipoCapital,
            tipoActividad,
            activo: true,
            creadoPor: adminId,
        });

        await nuevoEmpleador.save();
        res.status(201).json({ msg: 'Empleador registrado correctamente.', empleador: nuevoEmpleador });
    } catch (err) {
        console.error('Error en registro-individual empleador:', err);
        if (err.code === 11000)
            return res.status(400).json({ msg: 'El correo de la organización ya está registrado.' });
        res.status(500).json({ msg: 'Error interno al registrar.' });
    }
};

// ═══════════════════════════════════════════════════════════
// CARGA MASIVA EMPLEADORES
// ═══════════════════════════════════════════════════════════
exports.cargaMasivaEmpleadores = async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No se recibió ningún archivo CSV.' });

    const reporte = { total: 0, exitosos: 0, fallidos: 0, detalle: [] };

    try {
        const contenidoCSV = req.file.buffer.toString('latin1');
        const muestra = contenidoCSV.substring(0, 500);
        const delimitador = (muestra.match(/;/g) || []).length >= (muestra.match(/,/g) || []).length ? ';' : ',';

        let filas;
        try {
            filas = csv.parse(contenidoCSV, {
                columns: true, skip_empty_lines: true, trim: true,
                delimiter: delimitador, from_line: 2,
            });
        } catch (e) {
            return res.status(400).json({ msg: 'El archivo CSV no tiene un formato válido.' });
        }

        reporte.total = filas.length;
        if (filas.length === 0) return res.status(400).json({ msg: 'El CSV está vacío.' });
        if (filas.length > 200) return res.status(400).json({ msg: 'Máximo 200 filas por carga.' });

        const emailsEnCSV = new Set();
        const adminId = req.usuario?.id || req.usuario?._id;

        for (let i = 0; i < filas.length; i++) {
            const filaNum = i + 3;
            const datos = normalizarFilaEmpleador(filas[i]);

            if (
                datos.nombreEmpresa.toLowerCase().includes('[ejemplo]') ||
                datos.nombreEmpresa.toLowerCase().startsWith('ejemplo')
            ) continue;

            const resultado = {
                fila: filaNum, nombreEmpresa: datos.nombreEmpresa || '—',
                email: datos.emailOrganizacion || '—', estado: 'error', motivo: '',
            };

            try {
                if (!datos.nombreEmpresa) throw new Error('Falta "nombre empresa".');
                if (!datos.nombreGerente) throw new Error('Falta "nombre gerente".');
                if (!datos.emailOrganizacion) throw new Error('Falta "email organizacion".');
                if (!datos.tipoCapital) throw new Error('Falta "tipo capital".');
                if (!datos.tipoActividad) throw new Error('Falta "tipo actividad".');
                const telSoloCSV = datos.telefonoOrganizacion.replace(/\D/g, '');
                if (telSoloCSV.length < 7 || telSoloCSV.length > 10)
                    throw new Error('Teléfono inválido: debe tener entre 7 y 10 dígitos.');
                if (!datos.provincia) throw new Error('Falta "provincia".');
                if (!datos.ciudad) throw new Error('Falta "ciudad".');

                const emailLimpio = datos.emailOrganizacion.trim().toLowerCase();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio))
                    throw new Error('Correo de organización inválido.');

                const normalizar = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                const capitalValido = TIPOS_CAPITAL_VALIDOS.find(v => normalizar(v) === normalizar(datos.tipoCapital));
                if (!capitalValido) throw new Error(`Tipo capital inválido. Valores: ${TIPOS_CAPITAL_VALIDOS.join(', ')}.`);

                const actividadValida = TIPOS_ACTIVIDAD_VALIDOS.find(v => normalizar(v) === normalizar(datos.tipoActividad));
                if (!actividadValida) throw new Error(`Tipo actividad inválido. Valores: ${TIPOS_ACTIVIDAD_VALIDOS.join(', ')}.`);

                if (emailsEnCSV.has(emailLimpio)) throw new Error('Correo duplicado dentro del CSV.');

                if (await Empleador.findOne({ emailOrganizacion: emailLimpio, activo: true }))
                    throw new Error(`El correo ${emailLimpio} ya está registrado en el sistema.`);

                const nomLimpio = datos.nombreEmpresa.trim();
                if (await Empleador.findOne({ nombreEmpresa: { $regex: `^${nomLimpio}$`, $options: 'i' }, activo: true }))
                    throw new Error(`La empresa "${nomLimpio}" ya está registrada en el sistema.`);

                await Empleador.create({
                    nombreEmpresa: nomLimpio,
                    nombreGerente: capitalizar(datos.nombreGerente),
                    emailOrganizacion: emailLimpio,
                    telefonoOrganizacion: datos.telefonoOrganizacion.trim(),
                    provincia: capitalizar(datos.provincia),
                    ciudad: capitalizar(datos.ciudad),
                    tipoCapital: capitalValido,
                    tipoActividad: actividadValida,
                    activo: true,
                    creadoPor: adminId,
                });

                emailsEnCSV.add(emailLimpio);
                resultado.estado = 'exitoso';
                resultado.motivo = 'Registrado correctamente.';
                reporte.exitosos++;
            } catch (err) {
                resultado.estado = 'error';
                resultado.motivo = err.message || 'Error desconocido.';
                reporte.fallidos++;
            }

            reporte.detalle.push(resultado);
        }

        // ── Auditoría carga masiva empleadores ──
        await AuditoriaLog.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'CARGA_MASIVA_EMPLEADORES',
            modulo: 'Empleadores',
            coleccionAfectada: 'empleadors',
            descripcion: `Carga masiva CSV: ${reporte.exitosos} empleadores registrados, ${reporte.fallidos} fallidos de ${reporte.total} filas.`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({
            msg: `Carga completada: ${reporte.exitosos} exitosos, ${reporte.fallidos} con errores.`,
            reporte,
        });
    } catch (err) {
        console.error('Error en carga masiva empleadores:', err);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'CARGA_MASIVA_EMPLEADORES',
            modulo: 'Empleadores',
            mensajeError: err.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error interno al procesar el CSV.' });
    }
};

// ═══════════════════════════════════════════════════════════
// LISTAR EMPLEADORES
// ═══════════════════════════════════════════════════════════
exports.listarEmpleadores = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const buscar = req.query.buscar?.trim();
        const tipoCapital = req.query.tipoCapital;
        const tipoActividad = req.query.tipoActividad;

        const filtro = { activo: true };
        if (buscar) {
            const rx = { $regex: buscar, $options: 'i' };
            filtro.$or = [{ nombreEmpresa: rx }, { nombreGerente: rx }, { emailOrganizacion: rx }];
        }
        if (tipoCapital) filtro.tipoCapital = tipoCapital;
        if (tipoActividad) filtro.tipoActividad = tipoActividad;

        const [empleadores, total] = await Promise.all([
            Empleador.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Empleador.countDocuments(filtro),
        ]);

        res.json({ empleadores, total, pagina: page, totalPaginas: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ msg: 'Error al obtener empleadores.' });
    }
};

// ═══════════════════════════════════════════════════════════
// OBTENER EMPLEADOR POR ID
// ═══════════════════════════════════════════════════════════
exports.getEmpleadorPorId = async (req, res) => {
    try {
        const empleador = await Empleador.findById(req.params.id);
        if (!empleador) return res.status(404).json({ msg: 'Empleador no encontrado.' });
        res.json(empleador);
    } catch (err) {
        res.status(500).json({ msg: 'Error al obtener empleador.' });
    }
};

// ═══════════════════════════════════════════════════════════
// EDITAR EMPLEADOR
// ═══════════════════════════════════════════════════════════
exports.editarEmpleador = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        // ← CORRECCIÓN: incluir los 3 campos nuevos en la desestructuración
        const {
            nombreEmpresa, nombreGerente, emailOrganizacion,
            telefonoOrganizacion, provincia, ciudad,
            tipoCapital, tipoActividad,
        } = req.body;

        const empleador = await Empleador.findById(req.params.id);
        if (!empleador) return res.status(404).json({ msg: 'Empleador no encontrado.' });

        const campos = {};
        const cambios = [];

        if (nombreEmpresa !== undefined) {
            const nomLimpio = nombreEmpresa.trim();
            if (nomLimpio.toLowerCase() !== empleador.nombreEmpresa.toLowerCase()) {
                const dupNombre = await Empleador.findOne({
                    nombreEmpresa: { $regex: `^${nomLimpio}$`, $options: 'i' },
                    activo: true, _id: { $ne: req.params.id },
                });
                if (dupNombre) return res.status(400).json({ msg: 'Ya existe una empresa registrada con ese nombre.' });
            }
            campos.nombreEmpresa = nomLimpio;
            cambios.push('nombre empresa');
        }

        if (nombreGerente !== undefined) {
            campos.nombreGerente = capitalizar(nombreGerente);
            cambios.push('gerente');
        }

        if (emailOrganizacion !== undefined) {
            const emailLimpio = emailOrganizacion.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio))
                return res.status(400).json({ msg: 'Correo de organización inválido.' });
            if (emailLimpio !== empleador.emailOrganizacion) {
                const existe = await Empleador.findOne({
                    emailOrganizacion: emailLimpio, activo: true, _id: { $ne: req.params.id },
                });
                if (existe) return res.status(400).json({ msg: 'Ese correo ya está registrado.' });
                campos.emailOrganizacion = emailLimpio;
                cambios.push('email organización');
            }
        }

        if (telefonoOrganizacion !== undefined) {
            const telTrim = telefonoOrganizacion.trim();
            if (telTrim !== '') {
                const telSolo = telTrim.replace(/\D/g, '');
                if (telSolo.length < 7 || telSolo.length > 12)
                    return res.status(400).json({ msg: 'El teléfono debe tener entre 7 y 12 dígitos.' });
            }
            campos.telefonoOrganizacion = telTrim;
            cambios.push('teléfono organización');
        }

        if (provincia !== undefined) {
            campos.provincia = capitalizar(provincia);
            cambios.push('provincia');
        }

        if (ciudad !== undefined) {
            campos.ciudad = capitalizar(ciudad);
            cambios.push('ciudad');
        }

        if (tipoCapital !== undefined) {
            if (!TIPOS_CAPITAL_VALIDOS.includes(tipoCapital))
                return res.status(400).json({ msg: 'Tipo de capital inválido.' });
            campos.tipoCapital = tipoCapital;
            cambios.push('tipo capital');
        }

        if (tipoActividad !== undefined) {
            if (!TIPOS_ACTIVIDAD_VALIDOS.includes(tipoActividad))
                return res.status(400).json({ msg: 'Tipo de actividad inválido.' });
            campos.tipoActividad = tipoActividad;
            cambios.push('tipo actividad');
        }

        if (Object.keys(campos).length === 0)
            return res.status(400).json({ msg: 'No hay cambios para guardar.' });

        const actualizado = await Empleador.findByIdAndUpdate(
            req.params.id, { $set: campos }, { new: true }
        );

        await AuditoriaLog.create({
            usuarioId: String(adminId),
            usuarioEmail: adminEmail,
            rol: 'admin',
            accion: 'EDITAR_EMPLEADOR',
            modulo: 'Empleadores',
            coleccionAfectada: 'empleadors',
            descripcion: `Empleador "${empleador.nombreEmpresa}" editado. Campos: ${cambios.join(', ')}.`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({ msg: 'Empleador actualizado correctamente.', empleador: actualizado });
    } catch (err) {
        console.error('Error en editarEmpleador:', err);
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'EDITAR_EMPLEADOR',
            modulo: 'Empleadores',
            mensajeError: err.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error al actualizar.' });
    }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR EMPLEADOR
// ═══════════════════════════════════════════════════════════
exports.eliminarEmpleador = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id;
        const adminEmail = req.usuario?.email || 'desconocido';

        const empleador = await Empleador.findByIdAndDelete(req.params.id);
        if (!empleador) return res.status(404).json({ msg: 'Empleador no encontrado.' });

        await AuditoriaLog.create({
            usuarioId: String(adminId),
            usuarioEmail: adminEmail,
            rol: 'admin',
            accion: 'ELIMINAR_EMPLEADOR',
            modulo: 'Empleadores',
            coleccionAfectada: 'empleadors',
            descripcion: `Empleador eliminado: "${empleador.nombreEmpresa}" (email: ${empleador.emailOrganizacion}).`,
            ip: req.ip || 'desconocida',
        }).catch(() => { });

        res.json({ msg: `Empleador "${empleador.nombreEmpresa}" eliminado correctamente.` });
    } catch (err) {
        await AuditoriaError.create({
            usuarioId: String(req.usuario?.id || 'desconocido'),
            usuarioEmail: req.usuario?.email || 'desconocido',
            rol: 'admin',
            accion: 'ELIMINAR_EMPLEADOR',
            modulo: 'Empleadores',
            mensajeError: err.message,
            ip: req.ip || 'desconocida',
        }).catch(() => { });
        res.status(500).json({ msg: 'Error al eliminar empleador.' });
    }
};

exports.getReporteAnexo25Graduados = async (req, res) => {
    try {
        const anioInicio = parseInt(req.query.anioInicio);
        const anioFin = parseInt(req.query.anioFin) || anioInicio;
        const orden = req.query.orden || 'apellidos_asc';

        // Filtro por anioGraduacion
        const filtro = { tesisVerificada: true };  // ← solo graduados con tesis verificada
        if (!isNaN(anioInicio)) {
            filtro.anioGraduacion = { $gte: anioInicio, $lte: anioFin };
        }

        // Ordenamiento
        const sortMap = {
            apellidos_asc: { apellidos: 1 },
            apellidos_desc: { apellidos: -1 },
            nombres_asc: { nombres: 1 },
            nombres_desc: { nombres: -1 },
        };
        const sortObj = sortMap[orden] || { apellidos: 1 };

        const raw = await Graduado.find(filtro)
            .select('nombres apellidos cedula emailPersonal telefono anioGraduacion')
            .sort(sortObj);

        const graduados = raw.map((g, idx) => {
            const obj = g.toObject();
            let cedula = '—', telefono = '—';
            try { cedula = desencriptar(obj.cedula) || '—'; } catch { cedula = '—'; }
            try { telefono = desencriptar(obj.telefono) || '—'; } catch { telefono = '—'; }
            return {
                nro: idx + 1,
                apellidos: obj.apellidos || '—',
                nombres: obj.nombres || '—',
                cedula,
                email: obj.emailPersonal || '—',
                celular: telefono,
            };
        });

        // Años disponibles (anioGraduacion)
        const aniosRaw = await Graduado.distinct('anioGraduacion', { anioGraduacion: { $ne: null } });
        const aniosDisponibles = aniosRaw.filter(a => typeof a === 'number' && a > 1990).sort((a, b) => b - a);

        res.json({
            periodo: {
                anioInicio: isNaN(anioInicio) ? null : anioInicio,
                anioFin: isNaN(anioFin) ? null : anioFin,
            },
            orden,
            graduados,
            aniosDisponibles,
            total: graduados.length,
        });
    } catch (err) {
        console.error('Error en getReporteAnexo25Graduados:', err);
        res.status(500).json({ msg: 'Error al generar el reporte de graduados.' });
    }
};

// REPORTE ANEXO 25 — EMPLEADORES

exports.getReporteAnexo25Empleadores = async (req, res) => {
    try {
        const anioInicio = parseInt(req.query.anioInicio);
        const anioFin = parseInt(req.query.anioFin) || anioInicio;
        const orden = req.query.orden || 'empresa_asc';

        // Filtro por createdAt (año de registro)
        const filtro = { activo: true };
        if (!isNaN(anioInicio)) {
            filtro.createdAt = {
                $gte: new Date(`${anioInicio}-01-01T00:00:00.000Z`),
                $lte: new Date(`${anioFin}-12-31T23:59:59.999Z`),
            };
        }

        // Ordenamiento
        const sortMap = {
            empresa_asc: { nombreEmpresa: 1 },
            empresa_desc: { nombreEmpresa: -1 },
            gerente_asc: { nombreGerente: 1 },
            gerente_desc: { nombreGerente: -1 },
        };
        const sortObj = sortMap[orden] || { nombreEmpresa: 1 };

        const raw = await Empleador.find(filtro)
            .select('nombreEmpresa nombreGerente provincia ciudad emailOrganizacion telefonoOrganizacion createdAt')
            .sort(sortObj);

        const empleadores = raw.map((e, idx) => ({
            nro: idx + 1,
            nombreOrganizacion: e.nombreEmpresa || '—',
            nombreGerente: e.nombreGerente || '—',
            provincia: e.provincia || '—',
            ciudad: e.ciudad || '—',
            email: e.emailOrganizacion || '—',
            contacto: e.telefonoOrganizacion || '—',
        }));

        // Años disponibles (createdAt)
        const aniosRaw = await Empleador.aggregate([
            { $match: { activo: true } },
            { $group: { _id: { $year: '$createdAt' } } },
            { $sort: { _id: -1 } },
        ]);
        const aniosDisponibles = aniosRaw.map(a => a._id).filter(a => a > 2000);

        res.json({
            periodo: {
                anioInicio: isNaN(anioInicio) ? null : anioInicio,
                anioFin: isNaN(anioFin) ? null : anioFin,
            },
            orden,
            empleadores,
            aniosDisponibles,
            total: empleadores.length,
        });
    } catch (err) {
        console.error('Error en getReporteAnexo25Empleadores:', err);
        res.status(500).json({ msg: 'Error al generar el reporte de empleadores.' });
    }
};

// MÉTRICAS PARA REPORTES

exports.getMetricasReportes = async (req, res) => {
    try {
        const [totalGraduados, tesisVerificados, perfilesPublicos, verificados, disponibles, totalEmpleadores] =
            await Promise.all([
                Graduado.countDocuments(),
                Graduado.countDocuments({ tesisVerificada: true }),
                Graduado.countDocuments({ perfilPublico: true, tesisVerificada: true }),
                Graduado.countDocuments({ verificado: true }),
                Graduado.countDocuments({ disponibilidad: 'disponible' }),
                Empleador.countDocuments({ activo: true }),
            ]);
        res.json({ totalGraduados, tesisVerificados, perfilesPublicos, verificados, disponibles, totalEmpleadores });
    } catch (err) {
        res.status(500).json({ msg: 'Error al obtener métricas.' });
    }
};
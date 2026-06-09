const Graduado = require('../models/Graduado');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { encriptar, desencriptar, hashParaBusqueda } = require('../utils/cryptoHelper');
const { enviarCodigoVerificacion } = require('../services/emailVerificacionService');
const { enviarCodigoRecuperacion } = require('../services/emailRecuperacionService');

// ============================================
// HELPERS
// ============================================
const validarPasswordFuerte = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(password);
};

/**
 * VALIDACIÓN DE CÉDULA ECUATORIANA - MEJORADA
 * Sin fórmula matemática, solo validación lógica
 * 
 * Reglas:
 * 1. Exactamente 10 dígitos
 * 2. Primeros 2 dígitos (provincia): 01-24 o 30 (extranjeros)
 * 3. Tercer dígito: 0-5 (tipo de documento)
 */
const validarCedulaEcuatoriana = (cedula) => {
    // 1️⃣ Exactamente 10 dígitos
    if (!/^\d{10}$/.test(cedula)) {
        return false;
    }

    // 2️⃣ Provincia: 01-24 o 30
    const provincia = parseInt(cedula.substring(0, 2), 10);
    const provinciaValida = (provincia >= 1 && provincia <= 24) || provincia === 30;

    if (!provinciaValida) {
        return false;
    }

    // 3️⃣ Tipo de documento: 0-5
    const tipoDocumento = parseInt(cedula.substring(2, 3), 10);

    if (tipoDocumento > 5) {
        return false;
    }

    return true;
};

const validarCorreoEspoch = (email) => email.trim().toLowerCase().endsWith('@espoch.edu.ec');

const generarToken = (id, rol, nombre) =>
    jwt.sign({ id, rol, nombre }, process.env.JWT_SECRET || 'secreto_super_seguro', { expiresIn: '30d' });

const generarCodigoVerificacion = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// 1. VALIDAR DUPLICADOS
// ============================================
exports.validarDuplicadosGraduado = async (req, res) => {
    const { emailInstitucional, emailPersonal, cedula, telefono } = req.body;
    try {
        const instEmail = emailInstitucional.trim().toLowerCase();
        const persEmail = emailPersonal.trim().toLowerCase();
        const cedulaLimpia = cedula.trim();
        const telefonoLimpio = telefono.trim();

        if (!req.body.flujoSinCorreo && !validarCorreoEspoch(instEmail))
            return res.status(400).json({ msg: 'El correo institucional debe ser @espoch.edu.ec' });

        if (!validarCedulaEcuatoriana(cedulaLimpia))
            return res.status(400).json({ msg: 'La cédula ingresada no es válida. Verifica los 10 dígitos, la provincia (01-24 o 30) y el tipo de documento (0-5).' });

        const hashCedula = hashParaBusqueda(cedulaLimpia);
        const hashTelefono = hashParaBusqueda(telefonoLimpio);

        if (await Graduado.findOne({ cedulaHash: hashCedula }))
            return res.status(400).json({ msg: 'La cédula ingresada ya está registrada.' });

        if (await Graduado.findOne({ telefonoHash: hashTelefono }))
            return res.status(400).json({ msg: 'El teléfono ingresado ya está registrado.' });

        if (await Graduado.findOne({ emailPersonal: persEmail }))
            return res.status(400).json({ msg: `El correo personal ${persEmail} ya está registrado.` });

        if (await Graduado.findOne({ emailInstitucional: instEmail }))
            return res.status(400).json({ msg: `El correo institucional ${instEmail} ya está registrado.` });

        res.status(200).json({ msg: 'Validación exitosa' });
    } catch (error) {
        console.error('Error en validación:', error);
        res.status(500).json({ msg: 'Error al validar datos.' });
    }
};

// ============================================
// 2. SOLICITAR CÓDIGO DE VERIFICACIÓN
// ============================================
exports.solicitarCodigoVerificacion = async (req, res) => {
    const { emailInstitucional, nombres } = req.body;

    console.log('\n[AuthController] POST /solicitar-codigo-verificacion');
    console.log(`  📧 Email: ${emailInstitucional}`);

    try {
        if (!emailInstitucional || !emailInstitucional.trim())
            return res.status(400).json({ msg: 'El email institucional es requerido.' });

        if (!nombres || !nombres.trim())
            return res.status(400).json({ msg: 'El nombre es requerido.' });

        const instEmail = emailInstitucional.trim().toLowerCase();

        if (!validarCorreoEspoch(instEmail))
            return res.status(400).json({ msg: 'El email debe ser @espoch.edu.ec' });

        let graduado = await Graduado.findOne({ emailInstitucional: instEmail });

        if (!graduado) {
            console.log('[AuthController] Creando registro temporal...');
            graduado = new Graduado({
                emailInstitucional: instEmail,
                nombres: nombres.trim(),
                apellidos: 'Temporal',
                cedula: 'temp',
                cedulaHash: 'temp',
                telefono: 'temp',
                telefonoHash: 'temp',
                password: 'temp',
                genero: 'LGBTI',
                fechaNacimiento: new Date('2000-01-01'),
                tieneDiscapacidad: 'No',
                emailPersonal: 'temp@temp.com',
            });
        }

        const codigo = generarCodigoVerificacion();
        const ahora = new Date();
        const expiracion = new Date(ahora.getTime() + 15 * 60 * 1000);

        graduado.codigoVerificacion = {
            codigo,
            expiresAt: expiracion,
            intentos: 0,
            verificado: false,
        };

        await graduado.save();
        console.log(`[AuthController] Código generado: ${codigo}`);

        try {
            await enviarCodigoVerificacion({
                emailInstitucional: instEmail,
                codigo,
                nombres: nombres.trim(),
            });
            console.log('[AuthController] ✅ Código enviado al email\n');
        } catch (emailError) {
            console.error('[AuthController] ❌ Error al enviar email:', emailError.message);
            return res.status(500).json({
                msg: 'Error al enviar el código. Intenta nuevamente.'
            });
        }

        res.status(200).json({
            msg: 'Código enviado a tu email institucional.',
            emailInstitucional: instEmail,
        });

    } catch (error) {
        console.error('[AuthController] Error en solicitar-codigo:', error);
        res.status(500).json({ msg: 'Error al procesar la solicitud.' });
    }
};

// ============================================
// 3. VERIFICAR CÓDIGO
// ============================================
exports.verificarCodigo = async (req, res) => {
    const { emailInstitucional, codigo } = req.body;

    console.log('\n[AuthController] POST /verificar-codigo');
    console.log(`  📧 Email: ${emailInstitucional}`);
    console.log(`  🔐 Código ingresado: ${codigo}`);

    try {
        if (!emailInstitucional || !codigo)
            return res.status(400).json({ msg: 'Email y código requeridos.' });

        const instEmail = emailInstitucional.trim().toLowerCase();
        const graduado = await Graduado.findOne({ emailInstitucional: instEmail });

        if (!graduado)
            return res.status(404).json({ msg: 'Usuario no encontrado.' });

        const { codigoVerificacion } = graduado;

        if (!codigoVerificacion || !codigoVerificacion.codigo)
            return res.status(400).json({ msg: 'No se solicito ningún código. Inicia nuevamente.' });

        if (new Date() > codigoVerificacion.expiresAt)
            return res.status(400).json({ msg: 'El código ha expirado. Solicita uno nuevo.' });

        if (codigoVerificacion.intentos >= 5)
            return res.status(429).json({ msg: 'Demasiados intentos fallidos. Solicita un nuevo código.' });

        if (codigoVerificacion.codigo !== codigo.trim()) {
            graduado.codigoVerificacion.intentos += 1;
            await graduado.save();
            const intentosRestantes = 5 - graduado.codigoVerificacion.intentos;
            return res.status(400).json({
                msg: `Código incorrecto. ${intentosRestantes} intentos restantes.`
            });
        }

        console.log('[AuthController] ✅ Código verificado correctamente\n');

        graduado.codigoVerificacion.verificado = true;
        graduado.verificado = true;
        await graduado.save();

        res.status(200).json({
            msg: 'Código verificado exitosamente.',
            emailInstitucional: instEmail,
        });

    } catch (error) {
        console.error('[AuthController] Error en verificar-codigo:', error);
        res.status(500).json({ msg: 'Error al verificar el código.' });
    }
};

// ============================================
// 4. REGISTRO GRADUADO
// ============================================
exports.registrarGraduado = async (req, res) => {
    const {
        emailInstitucional, emailPersonal, password,
        cedula, telefono, nombres, apellidos,
        genero, fechaNacimiento, tieneDiscapacidad,
        flujoSinCorreo,
        ...restoDatos
    } = req.body;

    console.log('\n[AuthController] POST /registro-graduado-final');
    console.log(`  📧 Email inst: ${emailInstitucional} | flujoSinCorreo: ${flujoSinCorreo}`);

    try {
        // ── Validar campos obligatorios comunes ───────────────────────────
        if (!emailPersonal || !password || !cedula || !telefono ||
            !nombres || !apellidos || !genero || !fechaNacimiento || !tieneDiscapacidad) {
            return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
        }

        const esSinCorreo = flujoSinCorreo === true || flujoSinCorreo === 'true';
        const instEmail = esSinCorreo ? '' : (emailInstitucional || '').trim().toLowerCase();
        const persEmail = emailPersonal.trim().toLowerCase();
        const cedulaLimpia = cedula.trim();
        const telefonoLimpio = telefono.trim();

        // ── Validar correo institucional solo en Flujo A ──────────────────
        if (!esSinCorreo) {
            if (!instEmail || !validarCorreoEspoch(instEmail))
                return res.status(400).json({ msg: 'El correo institucional debe ser @espoch.edu.ec' });
            if (instEmail === persEmail)
                return res.status(400).json({ msg: 'El correo personal y el institucional no pueden ser iguales.' });
        }

        if (!validarCedulaEcuatoriana(cedulaLimpia))
            return res.status(400).json({ msg: 'La cédula no es válida.' });

        if (!validarPasswordFuerte(password))
            return res.status(400).json({ msg: 'La contraseña no cumple los requisitos de seguridad.' });

        const hashCedula = hashParaBusqueda(cedulaLimpia);
        const hashTelefono = hashParaBusqueda(telefonoLimpio);

        // ── VALIDAR DUPLICADOS antes de guardar ───────────────────────────
        // Cédula — el más importante para evitar duplicar un graduado
        if (await Graduado.findOne({ cedulaHash: hashCedula }))
            return res.status(400).json({ msg: 'Ya existe una cuenta registrada con esa cédula.' });

        if (await Graduado.findOne({ telefonoHash: hashTelefono }))
            return res.status(400).json({ msg: 'El teléfono ya está registrado.' });

        if (await Graduado.findOne({ emailPersonal: persEmail }))
            return res.status(400).json({ msg: 'El correo personal ya está registrado.' });

        if (!esSinCorreo && instEmail &&
            await Graduado.findOne({ emailInstitucional: instEmail })) {
            // En flujo A, buscar si ya existe el registro temporal para actualizarlo
            // (el flujo de código ya lo creó previamente)
        }

        const capitalizarPalabras = (texto) =>
            texto.trim().toLowerCase().split(/\s+/)
                .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

        // ── Flujo A: buscar graduado temporal ya creado por el código ─────
        let graduado;
        if (!esSinCorreo) {
            graduado = await Graduado.findOne({ emailInstitucional: instEmail });
            if (!graduado)
                return res.status(404).json({ msg: 'Registro no encontrado. Comienza nuevamente.' });
            if (!graduado.codigoVerificacion?.verificado)
                return res.status(400).json({ msg: 'Debes verificar tu código primero.' });
        } else {
            // ── Flujo B: crear graduado nuevo con datos reales directamente ──
            graduado = new Graduado({
                emailInstitucional: null,
                emailPersonal: persEmail,
                nombres: capitalizarPalabras(nombres),
                apellidos: capitalizarPalabras(apellidos),
                cedula: encriptar(cedulaLimpia),
                cedulaHash: hashCedula,
                telefono: encriptar(telefonoLimpio),
                telefonoHash: hashTelefono,
                password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
                genero,
                fechaNacimiento: new Date(fechaNacimiento),
                tieneDiscapacidad,
                verificado: true,
                cuentaBloqueada: false,
                perfilPublico: false,
                terminosAceptados: false,
                intentosFallidos: { contador: 0, bloqueadoHasta: null, ultimoIntento: null },
            });
            await graduado.save();
            const token = generarToken(graduado._id, 'graduado', graduado.nombres);
            return res.status(201).json({
                _id: graduado._id,
                nombre: graduado.nombres,
                email: graduado.emailPersonal,
                rol: 'graduado',
                tesisVerificada: false,
                token,
            });
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const cedulaEncriptada = encriptar(cedulaLimpia);
        const telefonoEncriptado = encriptar(telefonoLimpio);

        graduado.nombres = capitalizarPalabras(nombres);
        graduado.apellidos = capitalizarPalabras(apellidos);
        graduado.cedula = cedulaEncriptada;
        graduado.cedulaHash = hashCedula;
        graduado.telefono = telefonoEncriptado;
        graduado.telefonoHash = hashTelefono;
        graduado.emailPersonal = persEmail;
        graduado.emailInstitucional = esSinCorreo ? '' : instEmail;
        graduado.password = hashedPassword;
        graduado.genero = genero;
        graduado.fechaNacimiento = new Date(fechaNacimiento);
        graduado.tieneDiscapacidad = tieneDiscapacidad;
        graduado.verificado = true;
        graduado.cuentaBloqueada = false;
        graduado.perfilPublico = false;
        graduado.terminosAceptados = false;
        graduado.intentosFallidos = { contador: 0, bloqueadoHasta: null, ultimoIntento: null };

        // Guardar título de tesis verificado si vino del Flujo B
        if (restoDatos.tituloTesisVerificado) {
            graduado.tituloTesisVerificado = restoDatos.tituloTesisVerificado;
        }

        await graduado.save();
        console.log('[AuthController] ✅ Graduado registrado completamente\n');

        const token = generarToken(graduado._id, 'graduado', graduado.nombres);

        res.status(201).json({
            _id: graduado._id,
            nombre: graduado.nombres,
            email: graduado.emailPersonal,
            rol: 'graduado',
            tesisVerificada: false,
            token,
        });

    } catch (error) {
        console.error('[AuthController] Error en registro-final:', error);
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            const msgs = {
                emailInstitucional: 'El correo institucional ya está registrado.',
                emailPersonal: 'El correo personal ya está registrado.',
                cedulaHash: 'Ya existe una cuenta con esa cédula.',
                telefonoHash: 'El teléfono ya está registrado.',
            };
            return res.status(400).json({ msg: msgs[campo] || 'Dato duplicado detectado.' });
        }
        res.status(500).json({ msg: 'Error interno al guardar los datos.' });
    }
};

// ============================================
// 5. LOGIN
// ============================================
exports.loginUsuario = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password)
            return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });

        const emailLimpio = email.trim().toLowerCase();

        // ¿Es admin?
        const admin = await Admin.findOne({ email: emailLimpio });
        if (admin) {
            const esCorrecta = await bcrypt.compare(password, admin.password);
            if (!esCorrecta) return res.status(400).json({ msg: 'Contraseña incorrecta.' });

            const token = generarToken(admin._id, 'admin', admin.nombre);
            return res.json({
                _id: admin._id,
                nombre: admin.nombre,
                email: admin.email,
                rol: 'admin',
                token,
            });
        }

        // ¿Es graduado?
        const graduado = await Graduado.findOne({ emailPersonal: emailLimpio });
        if (!graduado)
            return res.status(400).json({ msg: 'Usuario no encontrado. Verifica tus credenciales.' });

        // ✅ VALIDAR BLOQUEO TEMPORAL
        if (graduado.intentosFallidos && graduado.intentosFallidos.bloqueadoHasta) {
            if (new Date() < new Date(graduado.intentosFallidos.bloqueadoHasta)) {
                const tiempoRestante = Math.ceil((new Date(graduado.intentosFallidos.bloqueadoHasta) - new Date()) / 1000 / 60);
                return res.status(429).json({
                    msg: `Cuenta bloqueada por demasiados intentos fallidos. Intenta en ${tiempoRestante} minutos.`
                });
            } else {
                graduado.intentosFallidos.contador = 0;
                graduado.intentosFallidos.bloqueadoHasta = null;
                await graduado.save();
            }
        }

        const esCorrecta = await bcrypt.compare(password, graduado.password);
        if (!esCorrecta) {
            if (!graduado.intentosFallidos) {
                graduado.intentosFallidos = { contador: 0, bloqueadoHasta: null, ultimoIntento: null };
            }

            graduado.intentosFallidos.contador += 1;
            graduado.intentosFallidos.ultimoIntento = new Date();

            if (graduado.intentosFallidos.contador >= 5) {
                const ahora = new Date();
                const bloqueadoHasta = new Date(ahora.getTime() + 30 * 60 * 1000);
                graduado.intentosFallidos.bloqueadoHasta = bloqueadoHasta;
                console.log(`[AuthController] 🔒 Usuario ${emailLimpio} bloqueado por 30 minutos`);
            }

            await graduado.save();

            const intentosRestantes = Math.max(0, 5 - graduado.intentosFallidos.contador);
            if (intentosRestantes > 0) {
                return res.status(400).json({
                    msg: `Contraseña incorrecta. ${intentosRestantes} intentos restantes.`
                });
            } else {
                return res.status(429).json({
                    msg: 'Cuenta bloqueada por demasiados intentos fallidos. Intenta en 30 minutos o usa "Olvidé mi contraseña".'
                });
            }
        }

        // ✅ CONTRASEÑA CORRECTA: Resetear intentos
        if (graduado.intentosFallidos) {
            graduado.intentosFallidos.contador = 0;
            graduado.intentosFallidos.bloqueadoHasta = null;
            graduado.intentosFallidos.ultimoIntento = null;
            await graduado.save();
        }

        if (graduado.cuentaBloqueada) {
            return res.status(200).json({
                cuentaBloqueada: true,
                msg: 'Cuenta desactivada — proceso de graduación completado.',
            });
        }

        const token = generarToken(graduado._id, 'graduado', graduado.nombres);

        res.json({
            _id: graduado._id,
            nombre: graduado.nombres,
            email: graduado.emailPersonal,
            rol: 'graduado',
            tesisVerificada: graduado.tesisVerificada || false,
            bienvenidaMostrada: graduado.bienvenidaMostrada || false,
            token,
        });

    } catch (error) {
        console.error('[AuthController] Error en login:', error);
        res.status(500).json({ msg: 'Error interno en el servidor.' });
    }
};

// ============================================
// 6. SOLICITAR CÓDIGO DE RECUPERACIÓN
// ============================================
exports.solicitarCodigoRecuperacion = async (req, res) => {
    const { email } = req.body;

    console.log('\n[AuthController] POST /solicitar-codigo-recuperacion');
    console.log(`  📧 Email: ${email}`);

    try {
        if (!email || !email.trim())
            return res.status(400).json({ msg: 'El correo es requerido.' });

        const emailLimpio = email.trim().toLowerCase();

        // ── Buscar si es admin primero ────────────────────────────────────
        const admin = await Admin.findOne({ email: emailLimpio });
        if (admin) {
            const codigo = generarCodigoVerificacion();
            const expiracion = new Date(Date.now() + 15 * 60 * 1000);

            admin.codigoRecuperacion = { codigo, expiresAt: expiracion, intentos: 0 };
            await admin.save();

            console.log(`[AuthController] Código de recuperación (admin) generado: ${codigo}`);

            try {
                // Reutilizamos el mismo servicio de email que el graduado
                await enviarCodigoRecuperacion({
                    emailPersonal: emailLimpio,
                    nombres: admin.nombre,
                    codigo,
                });
                console.log('[AuthController] ✅ Código de recuperación (admin) enviado\n');
            } catch (emailError) {
                console.error('[AuthController] ❌ Error al enviar código (admin):', emailError.message);
                return res.status(500).json({ msg: 'Error al enviar el código. Intenta nuevamente.' });
            }

            return res.status(200).json({
                msg: 'Código enviado a tu correo institucional.',
                email: emailLimpio,
            });
        }

        // ── Si no es admin, buscar en graduados ───────────────────────────
        const graduado = await Graduado.findOne({ emailPersonal: emailLimpio });
        if (!graduado)
            return res.status(400).json({ msg: 'No encontramos una cuenta con ese correo.' });

        const codigo = generarCodigoVerificacion();
        const expiracion = new Date(Date.now() + 15 * 60 * 1000);

        graduado.codigoRecuperacion = { codigo, expiresAt: expiracion, intentos: 0 };
        await graduado.save();

        console.log(`[AuthController] Código de recuperación generado: ${codigo}`);

        try {
            await enviarCodigoRecuperacion({
                emailPersonal: emailLimpio,
                nombres: graduado.nombres,
                codigo,
            });
            console.log('[AuthController] ✅ Código de recuperación enviado\n');
        } catch (emailError) {
            console.error('[AuthController] ❌ Error al enviar código:', emailError.message);
            return res.status(500).json({ msg: 'Error al enviar el código. Intenta nuevamente.' });
        }

        res.status(200).json({
            msg: 'Código enviado a tu correo personal.',
            email: emailLimpio,
        });

    } catch (error) {
        console.error('[AuthController] Error en solicitar-recuperacion:', error);
        res.status(500).json({ msg: 'Error al procesar la solicitud.' });
    }
};

// ============================================
// 7. VERIFICAR CÓDIGO Y CAMBIAR CONTRASEÑA
// ============================================
exports.verificarCodigoYCambiarPassword = async (req, res) => {
    const { email, codigo, nuevaPassword } = req.body;

    console.log('\n[AuthController] POST /verificar-codigo-y-cambiar-password');
    console.log(`  📧 Email: ${email}`);

    try {
        if (!email || !codigo || !nuevaPassword)
            return res.status(400).json({ msg: 'Todos los campos son requeridos.' });

        const emailLimpio = email.trim().toLowerCase();

        // ── Determinar si es admin o graduado ─────────────────────────────
        const admin    = await Admin.findOne({ email: emailLimpio });
        const usuario  = admin || await Graduado.findOne({ emailPersonal: emailLimpio });

        if (!usuario)
            return res.status(400).json({ msg: 'Usuario no encontrado.' });

        const { codigoRecuperacion } = usuario;

        if (!codigoRecuperacion || !codigoRecuperacion.codigo)
            return res.status(400).json({ msg: 'No hay solicitud de recuperación activa.' });

        if (new Date() > new Date(codigoRecuperacion.expiresAt))
            return res.status(400).json({ msg: 'El código ha expirado. Solicita uno nuevo.' });

        if (codigoRecuperacion.intentos >= 5)
            return res.status(429).json({ msg: 'Demasiados intentos fallidos. Solicita un nuevo código.' });

        if (codigoRecuperacion.codigo !== codigo.trim()) {
            usuario.codigoRecuperacion.intentos += 1;
            await usuario.save();
            const intentosRestantes = 5 - usuario.codigoRecuperacion.intentos;
            return res.status(400).json({
                msg: `Código incorrecto. ${intentosRestantes} intentos restantes.`
            });
        }

        // ✅ Código correcto — validar nueva contraseña
        if (!validarPasswordFuerte(nuevaPassword))
            return res.status(400).json({ msg: 'La contraseña no cumple los requisitos de seguridad.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

        usuario.password = hashedPassword;
        usuario.codigoRecuperacion = { codigo: '', expiresAt: null, intentos: 0 };

        // Resetear intentos fallidos de login si existen (por si el admin fue bloqueado)
        if (usuario.intentosFallidos) {
            usuario.intentosFallidos = { contador: 0, bloqueadoHasta: null, ultimoIntento: null };
        }

        await usuario.save();

        const tipoUsuario = admin ? 'Administrador' : 'Graduado';
        console.log(`[AuthController] ✅ Contraseña cambiada (${tipoUsuario}): ${emailLimpio}\n`);

        res.status(200).json({
            msg: 'Contraseña cambiada exitosamente. Ahora puedes iniciar sesión.',
        });

    } catch (error) {
        console.error('[AuthController] Error en cambiar-password:', error);
        res.status(500).json({ msg: 'Error al cambiar la contraseña.' });
    }
};

// ============================================
// HELPER EXPORTADO
// ============================================
exports.obtenerDatosSensibles = (graduado) => ({
    cedula: desencriptar(graduado.cedula),
    telefono: desencriptar(graduado.telefono)
});
// src/pages/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaEnvelope, FaLock, FaUniversity,
    FaPhone, FaIdCard,
    FaSpinner, FaCheckCircle, FaExclamationTriangle,
    FaRedo, FaArrowLeft, FaUserGraduate,
    FaVenusMars, FaCalendarAlt, FaWheelchair,
    FaEye, FaEyeSlash, FaArrowRight, FaInfoCircle,
    FaImage, FaTimes, FaSearch, FaShieldAlt
} from 'react-icons/fa';
import '../index.css';
import { guardarSesion } from '../utils/storageSeguro';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/auth';

const ofuscar   = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
const desofuscar = (str) => JSON.parse(decodeURIComponent(escape(atob(str))));

// ─── Input contraseña con ojito ───────────────────────────────────────────────
const PasswordInput = ({ value, onChange, placeholder = 'Contraseña', name = 'password', required = true, minLength = 8 }) => {
    const [show, setShow] = useState(false);
    return (
        <div style={s.inputGroupIcon}>
            <FaLock style={s.ico} />
            <input
                type={show ? 'text' : 'password'}
                name={name}
                placeholder={placeholder}
                style={s.inp}
                value={value}
                onChange={onChange}
                minLength={minLength}
                required={required}
                autoComplete={name === 'password' ? 'current-password' : 'new-password'}
            />
            <button type="button" onMouseDown={e => e.preventDefault()}
                onClick={() => setShow(v => !v)} style={s.ojito} tabIndex={-1}>
                {show ? <FaEyeSlash /> : <FaEye />}
            </button>
        </div>
    );
};

// ─── Campo con label ──────────────────────────────────────────────────────────
const Campo = ({ label, children, required: req, extra }) => (
    <div style={s.campoWrapper}>
        <label style={s.campoLabel}>
            {label} {req && <span style={{ color: 'var(--color-espoch-rojo)' }}>*</span>}
            {extra && <span style={s.campoExtra}>{extra}</span>}
        </label>
        {children}
    </div>
);

// ─── Barra de progreso ────────────────────────────────────────────────────────
const BarraProgreso = ({ paso, total, labelPaso }) => (
    <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-texto-secundario)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Paso {paso} de {total}{labelPaso ? `: ${labelPaso}` : ''}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-espoch-rojo)', fontWeight: 700 }}>
                {Math.round((paso / total) * 100)}%
            </span>
        </div>
        <div style={{ height: 4, backgroundColor: '#e9ecef', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${(paso / total) * 100}%`, backgroundColor: 'var(--color-espoch-rojo)', borderRadius: 4, transition: 'width 0.4s ease' }} />
        </div>
    </div>
);

// ─── Uploader compacto de cédula ─────────────────────────────────────────────
const ImageUploader = ({ label, required: req, preview, onChange, onQuitar, accept = 'image/jpeg,image/png,image/webp', inputRef, opcional }) => (
    <div style={{ marginBottom: 10 }}>
        <label style={{ ...s.campoLabel, marginBottom: 4 }}>
            {label}
            {req && <span style={{ color: 'var(--color-espoch-rojo)', marginLeft: 3 }}>*</span>}
            {opcional && <span style={{ fontSize: '0.67rem', color: '#9ca3af', marginLeft: 6, fontWeight: 400 }}>(opcional)</span>}
        </label>
        {preview ? (
            <div style={s.imgPreviewWrap}>
                <img src={preview} alt={label} style={s.imgPreviewCompacta} />
                <button type="button" onClick={onQuitar} style={s.btnQuitarImg}>
                    <FaTimes style={{ fontSize: '0.6rem', marginRight: 2 }} />Quitar
                </button>
            </div>
        ) : (
            <div style={s.uploadZoneCompacta} onClick={() => inputRef.current?.click()}>
                <FaImage style={{ fontSize: '1.1rem', color: '#adb5bd', marginRight: 8, flexShrink: 0 }} />
                <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Haz clic para subir imagen</p>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#9ca3af' }}>JPG, PNG o WEBP · Máx 5MB</p>
                </div>
            </div>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={onChange} style={{ display: 'none' }} />
    </div>
);

// ═════════════════════════════════════════════════════════════════════════════
const Login = () => {
    const navigate = useNavigate();

    const [modo, setModo] = useState('login');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    // ── Flujo A/B ──────────────────────────────────────────────────────────
    // 'ninguno' | 'conCorreo' | 'sinCorreo'
    const [flujoRegistro, setFlujoRegistro] = useState('ninguno');
    const [pasoRegistro, setPasoRegistro]   = useState(1);

    // ── Flujo A (código verificación) ─────────────────────────────────────
    const [esperandoCodigo, setEsperandoCodigo]       = useState(false);
    const [verificandoCodigo, setVerificandoCodigo]   = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    // ── Flujo B (cédula + DSpace) ─────────────────────────────────────────
    const [cedFrontalFile, setCedFrontalFile]     = useState(null);
    const [cedFrontalPreview, setCedFrontalPreview] = useState(null);
    const [cedPosteriorFile, setCedPosteriorFile]   = useState(null);
    const [cedPosteriorPreview, setCedPosteriorPreview] = useState(null);
    const [urlDspaceB, setUrlDspaceB]             = useState('');
    const [verificandoB, setVerificandoB]         = useState(false);
    const [verificadoB, setVerificadoB]           = useState(false); // verde ✅
    const [datosVerificadosB, setDatosVerificadosB] = useState(null);

    const frontalRef   = useRef(null);
    const posteriorRef = useRef(null);

    // ── Recuperación ──────────────────────────────────────────────────────
    const [mostrarRecuperacion, setMostrarRecuperacion]             = useState(false);
    const [emailRecuperacionIngresado, setEmailRecuperacionIngresado] = useState('');
    const [esperandoCodigoRec, setEsperandoCodigoRec]               = useState(false);
    const [verificandoCodigoRec, setVerificandoCodigoRec]           = useState(false);

    const [tiempoRestante, setTiempoRestante]                 = useState(0);
    const [codigoIngresado, setCodigoIngresado]               = useState('');
    const [codigoRecuperacionIngresado, setCodigoRecIngresado] = useState('');

    const [formData, setFormData] = useState({
        password: '', nombres: '', apellidos: '', cedula: '',
        emailPersonal: '', emailInstitucional: '', email: '', telefono: '',
        genero: '', fechaNacimiento: '', tieneDiscapacidad: '',
        nuevaPassword: '', confirmarPassword: ''
    });

    // ── Restaurar datos temporales si volvió el navegador ─────────────────
    useEffect(() => {
        const datosTemporales = localStorage.getItem('tempRegistroGraduado');
        if (datosTemporales) {
            try {
                const datos = desofuscar(datosTemporales);
                setFormData(datos);
                if (datos.emailInstitucional) {
                    setEsperandoCodigo(true);
                    setFlujoRegistro('conCorreo');
                    setModo('registro');
                }
            } catch { localStorage.removeItem('tempRegistroGraduado'); }
        }
    }, []);

    useEffect(() => {
        if (tiempoRestante > 0) {
            const t = setTimeout(() => setTiempoRestante(v => v - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [tiempoRestante]);

    // ── Imagen del lateral según estado ───────────────────────────────────
    const imagenActual = () => {
        if (modo === 'registro') return pasoRegistro === 1 ? '/img/campus2.png' : '/img/campus3.jpg';
        return '/img/campus1.png';
    };

    const textoLateral = () => {
        if (mostrarRecuperacion) return {
            titulo: 'Recupera tu acceso.',
            sub: 'Ingresa tu correo personal para recibir un código y restablecer tu contraseña.',
        };
        if (modo === 'login') return {
            titulo: 'Portal de Graduados ESPOCH.',
            sub: 'Conectando a nuestros ex-alumnos con oportunidades, redes de contacto y el desarrollo profesional continuo.',
        };
        if (flujoRegistro === 'sinCorreo' && pasoRegistro === 2) return {
            titulo: 'Verificación de identidad.',
            sub: 'Subiremos tu cédula y verificaremos tu tesis en el repositorio ESPOCH para confirmar tu identidad.',
        };
        if (pasoRegistro === 1) return {
            titulo: 'Únete a la red de excelencia.',
            sub: 'Conecta con profesionales, accede a oportunidades exclusivas y mantén vivo tu vínculo con la institución.',
        };
        return {
            titulo: 'Configura tu acceso.',
            sub: 'Vincula tu correo institucional para verificar tu estatus como graduado de ESPOCH.',
        };
    };

    const validarCedula = (cedula) => {
        if (!/^\d{10}$/.test(cedula)) return false;
        const prov = parseInt(cedula.substring(0, 2), 10);
        if (!((prov >= 1 && prov <= 24) || prov === 30)) return false;
        if (parseInt(cedula.substring(2, 3), 10) > 5) return false;
        return true;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    const fechaMaxima = new Date();
    fechaMaxima.setFullYear(fechaMaxima.getFullYear() - 20);
    const fechaMaximaStr = fechaMaxima.toISOString().split('T')[0];

    // ═══════════════════════════════════════════════════════════════
    // LOGIN
    // ═══════════════════════════════════════════════════════════════
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const { data } = await axios.post(`${API_URL}/login`, {
                email: formData.email,
                password: formData.password,
            });
            if (data.cuentaBloqueada) {
                setError('Tu cuenta fue desactivada. Tu perfil sigue visible públicamente.');
                setCargando(false);
                return;
            }
            guardarSesion('usuario', data);
            if (data.rol === 'admin') navigate('/home-admin');
            else navigate('/graduado/perfil');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error de conexión con el servidor.');
            setCargando(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // REGISTRO — PASO 1 (común a ambos flujos)
    // ═══════════════════════════════════════════════════════════════
    const handlePaso1 = (e) => {
        e.preventDefault();
        setError('');
        if (!validarCedula(formData.cedula)) {
            setError('La cédula ingresada no es válida.'); return;
        }
        // Si aún no eligió flujo, no avanzar
        if (flujoRegistro === 'ninguno') {
            setError('Indica si tienes acceso a tu correo @espoch.edu.ec.'); return;
        }
        setPasoRegistro(2);
    };

    // ═══════════════════════════════════════════════════════════════
    // FLUJO A — PASO 2: correo + contraseña
    // ═══════════════════════════════════════════════════════════════
    const handlePaso2A = (e) => {
        e.preventDefault();
        setError('');
        if (formData.emailInstitucional.trim() === formData.emailPersonal.trim()) {
            setError('El correo personal y el institucional NO pueden ser iguales.'); return;
        }
        setMostrarConfirmacion(true);
    };

    const confirmarYEnviarCodigo = async () => {
        setMostrarConfirmacion(false);
        setCargando(true);
        setError('');
        try {
            await axios.post(`${API_URL}/validar-duplicados-graduado`, {
                emailInstitucional: formData.emailInstitucional,
                emailPersonal: formData.emailPersonal,
                cedula: formData.cedula,
                telefono: formData.telefono
            });
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al validar datos.');
            setCargando(false); return;
        }
        localStorage.setItem('tempRegistroGraduado', ofuscar(formData));
        try {
            await axios.post(`${API_URL}/solicitar-codigo-verificacion`, {
                emailInstitucional: formData.emailInstitucional,
                nombres: formData.nombres,
            });
            setEsperandoCodigo(true);
            setVerificandoCodigo(false);
            setTiempoRestante(60);
            setCargando(false);
            setCodigoIngresado('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al solicitar el código.');
            setCargando(false);
        }
    };

    const verificarCodigoIngresado = async () => {
        if (!codigoIngresado || codigoIngresado.length !== 6) {
            setError('El código debe tener 6 dígitos.'); return;
        }
        setCargando(true); setError('');
        try {
            await axios.post(`${API_URL}/verificar-codigo`, {
                emailInstitucional: formData.emailInstitucional,
                codigo: codigoIngresado,
            });
            setEsperandoCodigo(false);
            setVerificandoCodigo(false);
            setCodigoIngresado('');
            setCargando(false);
            completarRegistro();
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al verificar el código.');
            setCargando(false);
        }
    };

    const completarRegistro = async () => {
        setCargando(true); setError('');
        try {
            const { data } = await axios.post(`${API_URL}/registro-graduado-final`, {
                ...formData,
                verificado: true,
                perfilPublico: false,
            });
            localStorage.removeItem('tempRegistroGraduado');
            guardarSesion('usuario', data);
            setCargando(false);
            navigate('/graduado/perfil');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al completar el registro.');
            setCargando(false);
        }
    };

    const reenviarCodigo = async () => {
        if (tiempoRestante > 0) return;
        setCargando(true); setError('');
        try {
            await axios.post(`${API_URL}/solicitar-codigo-verificacion`, {
                emailInstitucional: formData.emailInstitucional,
                nombres: formData.nombres,
            });
            setTiempoRestante(60);
            setCodigoIngresado('');
            setCargando(false);
        } catch { setError('No se pudo reenviar el código.'); setCargando(false); }
    };

    // ═══════════════════════════════════════════════════════════════
    // FLUJO B — PASO 2: cédula + DSpace + contraseña
    // ═══════════════════════════════════════════════════════════════
    const handleImagenFrontal = (e) => {
        const f = e.target.files[0]; if (!f) return;
        setCedFrontalFile(f);
        setCedFrontalPreview(URL.createObjectURL(f));
        setVerificadoB(false);
        setDatosVerificadosB(null);
    };

    const handleImagenPosterior = (e) => {
        const f = e.target.files[0]; if (!f) return;
        setCedPosteriorFile(f);
        setCedPosteriorPreview(URL.createObjectURL(f));
        setVerificadoB(false);
        setDatosVerificadosB(null);
    };

    const quitarFrontal = () => {
        setCedFrontalFile(null); setCedFrontalPreview(null);
        setVerificadoB(false); setDatosVerificadosB(null);
        if (frontalRef.current) frontalRef.current.value = '';
    };

    const quitarPosterior = () => {
        setCedPosteriorFile(null); setCedPosteriorPreview(null);
        if (posteriorRef.current) posteriorRef.current.value = '';
    };

    /**
     * Llama al endpoint /verificar-cedula-dspace.
     * Si pasa → pone verificadoB = true (botón se pone verde).
     * El registro final se hace con "Finalizar".
     */
    const handleVerificarB = async () => {
        setError('');

        // ── Validaciones frontend antes de llamar al backend ──────────────
        if (!cedFrontalFile) {
            setError('❌ Debes subir la foto del frente de tu cédula.'); return;
        }
        if (!cedPosteriorFile) {
            setError('❌ Debes subir la foto del reverso de tu cédula.'); return;
        }
        if (!urlDspaceB || !urlDspaceB.includes('dspace.espoch.edu.ec')) {
            setError('❌ La URL debe ser del repositorio dspace.espoch.edu.ec'); return;
        }
        if (!formData.emailPersonal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailPersonal)) {
            setError('❌ Ingresa un correo personal válido (ej: tucorreo@gmail.com)'); return;
        }
        if (!formData.password || formData.password.length < 8) {
            setError('❌ La contraseña debe tener al menos 8 caracteres.'); return;
        }

        setVerificandoB(true);
        setVerificadoB(false);
        setDatosVerificadosB(null);

        try {
            const fd = new FormData();
            fd.append('cedula_frontal', cedFrontalFile);
            fd.append('cedula_posterior', cedPosteriorFile); // obligatorio
            fd.append('urlDspace', urlDspaceB.trim());
            fd.append('nombres', formData.nombres.trim());
            fd.append('apellidos', formData.apellidos.trim());
            fd.append('cedula', formData.cedula.trim());
            fd.append('fechaNacimiento', formData.fechaNacimiento || '');

            const { data } = await axios.post(`${API_URL}/verificar-cedula-dspace`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000, // 2 minutos — Tesseract puede tardar
            });

            setVerificadoB(true);
            setDatosVerificadosB(data);
            setError(''); // limpiar cualquier error previo
        } catch (err) {
            // Mostrar el mensaje del backend si existe, sino mensaje genérico por tipo de error
            const msg = err.response?.data?.msg;
            if (msg) {
                setError(msg);
            } else if (err.code === 'ECONNABORTED') {
                setError('La verificación tardó demasiado. Sube una foto más nítida e intenta nuevamente.');
            } else if (!err.response) {
                setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
            } else {
                setError('Error al verificar. Intenta nuevamente en unos segundos.');
            }
            setVerificadoB(false);
        } finally {
            setVerificandoB(false);
        }
    };

    /**
     * Registro final para Flujo B.
     * emailInstitucional queda vacío — el backend debe aceptarlo.
     */
    const handleFinalizarB = async () => {
        if (!verificadoB) {
            setError('Primero verifica tu identidad con el botón "Verificar".'); return;
        }
        setCargando(true); setError('');
        try {
            // Validar duplicados sin correo institucional
            await axios.post(`${API_URL}/validar-duplicados-graduado`, {
                emailInstitucional: '',   // sin correo institucional
                emailPersonal: formData.emailPersonal,
                cedula: formData.cedula,
                telefono: formData.telefono,
                flujoSinCorreo: true      // flag para que el backend omita validación de @espoch
            });
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al validar datos.');
            setCargando(false); return;
        }

        try {
            const { data } = await axios.post(`${API_URL}/registro-graduado-final`, {
                ...formData,
                emailInstitucional: '',   // sin correo institucional
                verificado: true,
                perfilPublico: false,
                flujoSinCorreo: true,
                tituloTesisVerificado: datosVerificadosB?.tituloEncontrado || '',
            });
            guardarSesion('usuario', data);
            setCargando(false);
            navigate('/graduado/perfil');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al completar el registro.');
            setCargando(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // RECUPERACIÓN DE CONTRASEÑA
    // ═══════════════════════════════════════════════════════════════
    const solicitarCodigoRecuperacion = async (e) => {
        e.preventDefault();
        setCargando(true); setError('');
        try {
            await axios.post(`${API_URL}/solicitar-codigo-recuperacion`, { email: emailRecuperacionIngresado });
            setEsperandoCodigoRec(true);
            setTiempoRestante(60);
            setCargando(false);
            setCodigoRecIngresado('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al solicitar el código.');
            setCargando(false);
        }
    };

    const cambiarContraseña = async () => {
        if (!codigoRecuperacionIngresado || codigoRecuperacionIngresado.length !== 6) {
            setError('El código debe tener 6 dígitos.'); return;
        }
        if (!formData.nuevaPassword) { setError('Ingresa tu nueva contraseña.'); return; }
        if (formData.nuevaPassword !== formData.confirmarPassword) { setError('Las contraseñas no coinciden.'); return; }
        if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(formData.nuevaPassword)) {
            setError('La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.'); return;
        }
        setCargando(true); setError('');
        try {
            await axios.post(`${API_URL}/verificar-codigo-y-cambiar-password`, {
                email: emailRecuperacionIngresado,
                codigo: codigoRecuperacionIngresado,
                nuevaPassword: formData.nuevaPassword,
            });
            setMostrarRecuperacion(false);
            setEsperandoCodigoRec(false);
            setVerificandoCodigoRec(false);
            setEmailRecuperacionIngresado('');
            setFormData(p => ({ ...p, nuevaPassword: '', confirmarPassword: '' }));
            setModo('login');
            setCargando(false);
            setTimeout(() => setError('✅ Contraseña cambiada exitosamente. Ahora puedes iniciar sesión.'), 100);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al cambiar la contraseña.');
            setCargando(false);
        }
    };

    const reenviarCodigoRecuperacion = async () => {
        if (tiempoRestante > 0) return;
        setCargando(true); setError('');
        try {
            await axios.post(`${API_URL}/solicitar-codigo-recuperacion`, { email: emailRecuperacionIngresado });
            setTiempoRestante(60); setCodigoRecIngresado(''); setCargando(false);
        } catch { setError('No se pudo reenviar el código.'); setCargando(false); }
    };

    const volverAlInicio = () => {
        setEsperandoCodigo(false); setVerificandoCodigo(false);
        setMostrarConfirmacion(false); setMostrarRecuperacion(false);
        setEsperandoCodigoRec(false); setVerificandoCodigoRec(false);
        setError(''); setTiempoRestante(0);
        setCodigoIngresado(''); setCodigoRecIngresado('');
        setEmailRecuperacionIngresado(''); setPasoRegistro(1);
        setFlujoRegistro('ninguno');
        setVerificadoB(false); setDatosVerificadosB(null);
        setCedFrontalFile(null); setCedFrontalPreview(null);
        setCedPosteriorFile(null); setCedPosteriorPreview(null);
        setUrlDspaceB('');
        localStorage.removeItem('tempRegistroGraduado');
        setFormData({
            password: '', nombres: '', apellidos: '', cedula: '',
            emailPersonal: '', emailInstitucional: '', email: '', telefono: '',
            genero: '', fechaNacimiento: '', tieneDiscapacidad: '',
            nuevaPassword: '', confirmarPassword: ''
        });
        setModo('login');
    };

    const lateral = textoLateral();

    // ─── LABELS de pasos según flujo ─────────────────────────────────────────
    const labelPaso = () => {
        if (pasoRegistro === 1) return 'Datos personales';
        if (flujoRegistro === 'conCorreo') return 'Correo y contraseña';
        return 'Verificación de identidad';
    };

    const totalPasos = 2;

    // ══════════════════════════════════════════════════════════════════════════
    return (
        <div style={s.contenedorPadre}>

            {/* ══ LADO IZQUIERDO ══ */}
            <div style={{ ...s.ladoImagen, backgroundImage: `url("${imagenActual()}")` }}>
                <div style={s.capaOscura}>
                    <button style={s.btnVolverPublico} onClick={() => navigate('/')}>
                        <FaArrowLeft style={{ marginRight: 7 }} /> Ver graduados
                    </button>
                    <div style={s.contenidoImagen}>
                        <div style={s.logoLateral}>
                            <img src="/img/ESPOCH_LOGO.png" alt="ESPOCH"
                                style={{ height: 36, objectFit: 'contain' }}
                                onError={e => e.target.style.display = 'none'} />
                            <span style={s.logoLateralText}>Portal de Graduados ESPOCH</span>
                        </div>
                        <h1 style={s.heroTitulo}>{lateral.titulo}</h1>
                        <p style={s.heroSub}>{lateral.sub}</p>
                    </div>
                </div>
            </div>

            {/* ══ LADO DERECHO ══ */}
            <div style={s.ladoFormulario}>
                <div style={s.contenedorForm}>

                    {/* ── ALERTA ── */}
                    {error && (
                        <div style={error.includes('✅') ? s.alertaExito : s.alertaError}>
                            {error.includes('✅')
                                ? <FaCheckCircle style={{ marginRight: 8, flexShrink: 0 }} />
                                : <FaExclamationTriangle style={{ marginRight: 8, flexShrink: 0, marginTop: 1 }} />}
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════
                        RECUPERACIÓN DE CONTRASEÑA
                    ════════════════════════════════════════════════════ */}
                    {mostrarRecuperacion ? (
                        <div>
                            <div style={s.encabezado}>
                                <h2 style={s.titulo}>Recuperar Contraseña</h2>
                                <p style={s.subtitulo}>Carrera de Software · ESPOCH</p>
                            </div>
                            {!esperandoCodigoRec ? (
                                <form onSubmit={solicitarCodigoRecuperacion}>
                                    <Campo label="Correo electrónico" required>
                                        <div style={s.inputGroupIcon}>
                                            <FaEnvelope style={s.ico} />
                                            <input type="email" placeholder="Tu correo personal registrado"
                                                style={s.inp} value={emailRecuperacionIngresado}
                                                onChange={e => setEmailRecuperacionIngresado(e.target.value)} required />
                                        </div>
                                    </Campo>
                                    <p style={s.hint}>📧 Recibirás un código de 6 dígitos en este correo.</p>
                                    <button type="submit" style={s.btnPrincipal} disabled={cargando}>
                                        {cargando ? <><FaSpinner style={s.spin} /> Enviando...</> : 'Solicitar Código'}
                                    </button>
                                    <button type="button" onClick={volverAlInicio} style={s.btnTexto}>← Volver al inicio de sesión</button>
                                </form>
                            ) : !verificandoCodigoRec ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={s.iconoExito}><FaCheckCircle style={{ fontSize: '2rem', color: '#2e7d32' }} /></div>
                                    <h3 style={s.subTituloSeccion}>Código enviado</h3>
                                    <p style={{ color: 'var(--color-texto-secundario)', fontSize: '0.84rem', marginBottom: 4 }}>Hemos enviado un código a:</p>
                                    <strong style={{ fontSize: '0.85rem', color: 'var(--color-texto-principal)', wordBreak: 'break-all' }}>{emailRecuperacionIngresado}</strong>
                                    <p style={{ fontSize: '0.77rem', color: 'var(--color-texto-secundario)', margin: '16px 0 6px' }}>Revisa tu bandeja (y carpeta Spam), luego presiona:</p>
                                    <button onClick={() => setVerificandoCodigoRec(true)} style={s.btnPrincipal} disabled={cargando}>
                                        {cargando ? <><FaSpinner style={s.spin} /></> : 'Ingresar código'}
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                                        <button onClick={reenviarCodigoRecuperacion} disabled={tiempoRestante > 0 || cargando}
                                            style={{ ...s.btnSecundario, opacity: tiempoRestante > 0 ? 0.55 : 1 }}>
                                            <FaRedo style={{ marginRight: 6 }} />
                                            {tiempoRestante > 0 ? `Reenviar en ${tiempoRestante}s` : 'Reenviar código'}
                                        </button>
                                        <button onClick={volverAlInicio} style={s.btnTexto}>← Volver al inicio</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h3 style={s.subTituloSeccion}>Ingresa el código y tu nueva contraseña</h3>
                                    <Campo label="Código de verificación" required>
                                        <div style={s.inputCodigo}>
                                            <input type="text" maxLength="6" placeholder="000000"
                                                value={codigoRecuperacionIngresado}
                                                onChange={e => setCodigoRecIngresado(e.target.value.replace(/\D/g, ''))}
                                                style={s.inpCodigo} />
                                        </div>
                                    </Campo>
                                    <Campo label="Nueva contraseña" required>
                                        <PasswordInput value={formData.nuevaPassword}
                                            onChange={e => setFormData(p => ({ ...p, nuevaPassword: e.target.value }))}
                                            placeholder="Nueva contraseña" name="nuevaPassword" />
                                    </Campo>
                                    <Campo label="Confirmar contraseña" required>
                                        <PasswordInput value={formData.confirmarPassword}
                                            onChange={e => setFormData(p => ({ ...p, confirmarPassword: e.target.value }))}
                                            placeholder="Repite tu contraseña" name="confirmarPassword" />
                                    </Campo>
                                    <p style={s.hint}>Mínimo 8 caracteres · 1 mayúscula · 1 número · 1 carácter especial</p>
                                    <button onClick={cambiarContraseña} style={s.btnPrincipal} disabled={cargando}>
                                        {cargando ? <><FaSpinner style={s.spin} /> Cambiando...</> : '✅ Cambiar Contraseña'}
                                    </button>
                                    <button onClick={() => setVerificandoCodigoRec(false)} style={s.btnTexto}>← Atrás</button>
                                </div>
                            )}
                        </div>

                    /* ════════════════════════════════════════════════════
                       ESPERANDO CÓDIGO (Flujo A)
                    ════════════════════════════════════════════════════ */
                    ) : esperandoCodigo && !verificandoCodigo ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={s.encabezado}>
                                <h2 style={s.titulo}>Verificar Correo</h2>
                                <p style={s.subtitulo}>Carrera de Software · ESPOCH</p>
                            </div>
                            <div style={s.iconoExito}><FaCheckCircle style={{ fontSize: '2rem', color: '#2e7d32' }} /></div>
                            <h3 style={s.subTituloSeccion}>Código enviado</h3>
                            <p style={{ color: 'var(--color-texto-secundario)', fontSize: '0.84rem', marginBottom: 4 }}>Hemos enviado un código a:</p>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--color-texto-principal)', wordBreak: 'break-all' }}>{formData.emailInstitucional}</strong>
                            <p style={{ fontSize: '0.77rem', color: 'var(--color-texto-secundario)', margin: '16px 0 6px' }}>Revisa tu bandeja (y carpeta Spam), luego presiona:</p>
                            <button onClick={() => setVerificandoCodigo(true)} style={s.btnPrincipal} disabled={cargando}>Ingresar código</button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                                <button onClick={reenviarCodigo} disabled={tiempoRestante > 0 || cargando}
                                    style={{ ...s.btnSecundario, opacity: tiempoRestante > 0 ? 0.55 : 1 }}>
                                    <FaRedo style={{ marginRight: 6 }} />
                                    {tiempoRestante > 0 ? `Reenviar en ${tiempoRestante}s` : 'Reenviar código'}
                                </button>
                                <button onClick={volverAlInicio} style={s.btnTexto}>Volver al inicio</button>
                            </div>
                        </div>

                    ) : esperandoCodigo && verificandoCodigo ? (
                        <div>
                            <div style={s.encabezado}>
                                <h2 style={s.titulo}>Verificar Código</h2>
                                <p style={s.subtitulo}>Carrera de Software · ESPOCH</p>
                            </div>
                            <Campo label="Código de verificación" required>
                                <div style={s.inputCodigo}>
                                    <input type="text" maxLength="6" placeholder="000000"
                                        value={codigoIngresado}
                                        onChange={e => setCodigoIngresado(e.target.value.replace(/\D/g, ''))}
                                        style={s.inpCodigo} />
                                </div>
                            </Campo>
                            <button onClick={verificarCodigoIngresado} style={s.btnPrincipal}
                                disabled={cargando || codigoIngresado.length !== 6}>
                                {cargando ? <><FaSpinner style={s.spin} /> Verificando...</> : 'Verificar'}
                            </button>
                            <button onClick={() => setVerificandoCodigo(false)} style={s.btnTexto}>← Atrás</button>
                        </div>

                    ) : mostrarConfirmacion ? (
                        <div>
                            <div style={s.encabezado}>
                                <h2 style={s.titulo}>Confirmar Datos</h2>
                                <p style={s.subtitulo}>Carrera de Software · ESPOCH</p>
                            </div>
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <FaExclamationTriangle style={{ fontSize: '1.8rem', color: '#f59e0b', marginBottom: 8 }} />
                                <p style={{ color: 'var(--color-texto-secundario)', fontSize: '0.84rem', margin: 0 }}>Revisa que tus datos sean correctos antes de continuar.</p>
                            </div>
                            <div style={s.resumen}>
                                <div style={s.resumenGrid}>
                                    <div>
                                        <p><strong>Nombres:</strong> {formData.nombres}</p>
                                        <p><strong>Apellidos:</strong> {formData.apellidos}</p>
                                        <p><strong>Cédula:</strong> {formData.cedula}</p>
                                        <p><strong>Teléfono:</strong> {formData.telefono}</p>
                                        <p><strong>Género:</strong> {formData.genero}</p>
                                        <p><strong>Nacimiento:</strong> {formData.fechaNacimiento}</p>
                                        <p><strong>Discapacidad:</strong> {formData.tieneDiscapacidad}</p>
                                    </div>
                                    <div>
                                        <p style={{ wordBreak: 'break-all' }}><strong>Email personal:</strong><br />{formData.emailPersonal}</p>
                                        <p style={{ wordBreak: 'break-all' }}><strong>Email ESPOCH:</strong><br />{formData.emailInstitucional}</p>
                                    </div>
                                </div>
                            </div>
                            <p style={s.hint}>Se enviará un código de verificación a tu email institucional.</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={confirmarYEnviarCodigo}
                                    style={{ ...s.btnPrincipal, flex: 1, marginBottom: 0 }} disabled={cargando}>
                                    {cargando ? <><FaSpinner style={s.spin} /> Enviando...</> : '✅ Confirmar y continuar'}
                                </button>
                                <button onClick={() => setMostrarConfirmacion(false)} style={s.btnCancelar}>Editar</button>
                            </div>
                        </div>

                    ) : modo === 'login' ? (
                        /* ════════════════════════════════════════════════
                           LOGIN
                        ════════════════════════════════════════════════ */
                        <>
                            <div style={s.encabezado}>
                                <img src="/img/ESPOCH_LOGO.png" alt="ESPOCH" style={s.logo}
                                    onError={e => e.target.style.display = 'none'} />
                                <h2 style={s.titulo}>Iniciar Sesión</h2>
                                <p style={s.subtitulo}>Bienvenido de nuevo. Por favor, ingresa tus credenciales.</p>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <Campo label="Correo electrónico" required>
                                    <div style={s.inputGroupIcon}>
                                        <FaEnvelope style={s.ico} />
                                        <input type="email" name="email" placeholder="ejemplo@espoch.edu.ec"
                                            style={s.inp} value={formData.email} onChange={handleChange} required />
                                    </div>
                                </Campo>
                                <Campo label="Contraseña" required>
                                    <PasswordInput value={formData.password} onChange={handleChange} placeholder="••••••••" />
                                </Campo>
                                <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -4 }}>
                                    <button type="button" style={s.linkOlvide}
                                        onClick={() => { setMostrarRecuperacion(true); setError(''); setEmailRecuperacionIngresado(''); }}>
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <button type="submit" style={s.btnPrincipal} disabled={cargando}>
                                    {cargando ? <><FaSpinner style={s.spin} /> Cargando...</> : 'INGRESAR'}
                                </button>
                            </form>
                            <p style={{ textAlign: 'center', margin: '14px 0 0', fontSize: '0.84rem', color: 'var(--color-texto-secundario)' }}>
                                ¿No tienes cuenta?{' '}
                                <button type="button" style={s.linkSwitch}
                                    onClick={() => { setModo('registro'); setPasoRegistro(1); setError(''); }}>
                                    Regístrate
                                </button>
                            </p>
                            <div style={s.avisoBloqueado}>
                                <FaInfoCircle style={{ marginRight: 6, flexShrink: 0 }} />
                                Si tu cuenta ha sido bloqueada por inactividad, contacta a soporte técnico.
                            </div>
                        </>

                    ) : pasoRegistro === 1 ? (
                        /* ════════════════════════════════════════════════
                           REGISTRO — PASO 1 (común a ambos flujos)
                        ════════════════════════════════════════════════ */
                        <>
                            <div style={s.encabezado}>
                                <h2 style={s.titulo}>Crear Cuenta</h2>
                            </div>
                            <BarraProgreso paso={1} total={totalPasos} labelPaso={labelPaso()} />

                            <div style={s.avisoInfo}>
                                <FaInfoCircle style={{ marginRight: 6, flexShrink: 0 }} />
                                Solo para graduados de la Carrera de Software ESPOCH
                            </div>

                            <form onSubmit={handlePaso1}>
                                <div style={s.filaDoble}>
                                    <Campo label="Nombres" required>
                                        <div style={s.inputGroup}>
                                            <input type="text" name="nombres" placeholder="Tus nombres"
                                                style={s.inp} value={formData.nombres} onChange={handleChange} required />
                                        </div>
                                    </Campo>
                                    <Campo label="Apellidos" required>
                                        <div style={s.inputGroup}>
                                            <input type="text" name="apellidos" placeholder="Tus apellidos"
                                                style={s.inp} value={formData.apellidos} onChange={handleChange} required />
                                        </div>
                                    </Campo>
                                </div>
                                <div style={s.filaDoble}>
                                    <Campo label="Cédula" required>
                                        <div style={s.inputGroupIcon}>
                                            <FaIdCard style={s.ico} />
                                            <input type="text" name="cedula" placeholder="10 dígitos"
                                                style={s.inp} value={formData.cedula} onChange={handleChange}
                                                pattern="[0-9]{10}" maxLength="10" required />
                                        </div>
                                    </Campo>
                                    <Campo label="Celular" required>
                                        <div style={s.inputGroupIcon}>
                                            <FaPhone style={s.ico} />
                                            <input type="tel" name="telefono" placeholder="09XXXXXXXX"
                                                style={s.inp} value={formData.telefono} onChange={handleChange}
                                                pattern="[0-9]{10}" maxLength="10" required />
                                        </div>
                                    </Campo>
                                </div>
                                <div style={s.filaDoble}>
                                    <Campo label="Género" required>
                                        <div style={s.inputGroupIcon}>
                                            <FaVenusMars style={s.ico} />
                                            <select name="genero" style={s.inp} value={formData.genero} onChange={handleChange} required>
                                                <option value="">Seleccione...</option>
                                                <option>Masculino</option>
                                                <option>Femenino</option>
                                                <option>No binario</option>
                                                <option>Prefiero no decirlo</option>
                                            </select>
                                        </div>
                                    </Campo>
                                    <Campo label="Discapacidad" required>
                                        <div style={s.inputGroupIcon}>
                                            <FaWheelchair style={s.ico} />
                                            <select name="tieneDiscapacidad" style={s.inp} value={formData.tieneDiscapacidad} onChange={handleChange} required>
                                                <option value="">Seleccione...</option>
                                                <option>No</option>
                                                <option>Sí - Visual</option>
                                                <option>Sí - Auditiva</option>
                                                <option>Sí - Física/Motriz</option>
                                                <option>Sí - Intelectual</option>
                                                <option>Sí - Psicosocial</option>
                                                <option>Sí - Otra</option>
                                            </select>
                                        </div>
                                    </Campo>
                                </div>
                                <Campo label="Fecha de nacimiento" required>
                                    <div style={s.inputGroupIcon}>
                                        <FaCalendarAlt style={s.ico} />
                                        <input type="date" name="fechaNacimiento"
                                            style={{ ...s.inp, colorScheme: 'light' }}
                                            value={formData.fechaNacimiento} onChange={handleChange}
                                            max={fechaMaximaStr} required />
                                    </div>
                                </Campo>

                                {/* ── Pregunta: ¿Tienes correo @espoch.edu.ec? ── */}
                                <div style={s.flujoSelector}>
                                    <p style={s.flujoSelectorLabel}>
                                        <FaUniversity style={{ marginRight: 6, color: 'var(--color-espoch-rojo)' }} />
                                        ¿Tienes acceso a tu correo <strong>@espoch.edu.ec</strong>?
                                    </p>
                                    <div style={s.flujoOpciones}>
                                        <button
                                            type="button"
                                            style={{
                                                ...s.flujoBtn,
                                                ...(flujoRegistro === 'conCorreo' ? s.flujoBtnActivo : {})
                                            }}
                                            onClick={() => { setFlujoRegistro('conCorreo'); setError(''); }}
                                        >
                                            <FaCheckCircle style={{ marginRight: 6, fontSize: '0.85rem' }} />
                                            Sí, tengo acceso
                                        </button>
                                        <button
                                            type="button"
                                            style={{
                                                ...s.flujoBtn,
                                                ...(flujoRegistro === 'sinCorreo' ? s.flujoBtnActivoB : {})
                                            }}
                                            onClick={() => { setFlujoRegistro('sinCorreo'); setError(''); }}
                                        >
                                            <FaShieldAlt style={{ marginRight: 6, fontSize: '0.85rem' }} />
                                            No tengo acceso
                                        </button>
                                    </div>
                
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                    <button type="button" onClick={volverAlInicio} style={s.btnTexto}>← Volver al inicio</button>
                                    <button type="submit"
                                        style={{ ...s.btnPrincipal, width: 'auto', padding: '10px 24px', marginBottom: 0 }}
                                        disabled={cargando || flujoRegistro === 'ninguno'}>
                                        Siguiente <FaArrowRight style={{ marginLeft: 6 }} />
                                    </button>
                                </div>
                            </form>

                            <p style={{ textAlign: 'center', margin: '14px 0 0', fontSize: '0.84rem', color: 'var(--color-texto-secundario)' }}>
                                ¿Ya tienes cuenta?{' '}
                                <button type="button" style={s.linkSwitch} onClick={() => { setModo('login'); setError(''); }}>
                                    Iniciar sesión
                                </button>
                            </p>
                        </>

                    ) : flujoRegistro === 'conCorreo' ? (
                        /* ════════════════════════════════════════════════
                           FLUJO A — PASO 2: correo institucional + pass
                        ════════════════════════════════════════════════ */
                        <>
                            <div style={s.encabezado}>
                                <h2 style={s.titulo}>Detalles de la cuenta</h2>
                            </div>
                            <BarraProgreso paso={2} total={totalPasos} labelPaso={labelPaso()} />

                            <form onSubmit={handlePaso2A}>
                                <Campo label="Correo personal" required>
                                    <div style={s.inputGroupIcon}>
                                        <FaEnvelope style={s.ico} />
                                        <input type="email" name="emailPersonal" placeholder="ejemplo@gmail.com"
                                            style={s.inp} value={formData.emailPersonal} onChange={handleChange} required />
                                    </div>
                                </Campo>
                                <Campo label="Correo @espoch.edu.ec" required extra="✅ Requerido">
                                    <div style={s.inputGroupVerde}>
                                        <FaUniversity style={s.icoVerde} />
                                        <input type="email" name="emailInstitucional"
                                            placeholder="nombre.apellido@espoch.edu.ec"
                                            style={s.inp} value={formData.emailInstitucional}
                                            onChange={handleChange}
                                            pattern=".+@espoch\.edu\.ec" title="Debe ser @espoch.edu.ec" required />
                                    </div>
                                    <p style={{ ...s.hint, marginTop: 4 }}>
                                        <FaInfoCircle style={{ marginRight: 4 }} />
                                        Necesario para validar tu identidad como graduado.
                                    </p>
                                </Campo>
                                <Campo label="Contraseña" required>
                                    <PasswordInput value={formData.password} onChange={handleChange}
                                        placeholder="Contraseña segura" name="password" />
                                    <div style={s.checklistPass}>
                                        <p style={s.checklistTitulo}>La contraseña debe contener:</p>
                                        <p style={checkItem(formData.password.length >= 8)}>✓ Al menos 8 caracteres</p>
                                        <p style={checkItem(/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password))}>✓ Una letra mayúscula y una minúscula</p>
                                        <p style={checkItem(/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password))}>✓ Un número o símbolo especial</p>
                                    </div>
                                </Campo>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                                    <button type="button" onClick={() => { setPasoRegistro(1); setError(''); }} style={s.btnTexto}>← Volver al paso anterior</button>
                                    <button type="submit"
                                        style={{ ...s.btnPrincipal, width: 'auto', padding: '10px 24px', marginBottom: 0 }}
                                        disabled={cargando}>
                                        {cargando ? <><FaSpinner style={s.spin} /></> : <>REGISTRARME <FaArrowRight style={{ marginLeft: 6 }} /></>}
                                    </button>
                                </div>
                            </form>
                        </>

                    ) : (
                        /* ════════════════════════════════════════════════
                           FLUJO B — PASO 2: cédula foto + DSpace + pass
                        ════════════════════════════════════════════════ */
                        <>
                            <BarraProgreso paso={2} total={totalPasos} labelPaso={labelPaso()} />



                            {/* Fotos cédula — dos columnas compactas */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                <ImageUploader
                                    label="Cédula — frente"
                                    required
                                    preview={cedFrontalPreview}
                                    onChange={handleImagenFrontal}
                                    onQuitar={quitarFrontal}
                                    inputRef={frontalRef}
                                />
                                <ImageUploader
                                    label="Cédula — reverso"
                                    required
                                    preview={cedPosteriorPreview}
                                    onChange={handleImagenPosterior}
                                    onQuitar={quitarPosterior}
                                    inputRef={posteriorRef}
                                />
                            </div>
                            <p style={{ ...s.hint, marginBottom: 10, marginTop: -4 }}>
                                <FaInfoCircle style={{ marginRight: 4, flexShrink: 0 }} />
                                Sube fotos nítidas del frente y reverso de tu cédula con buena iluminación.
                            </p>

                            {/* URL DSpace */}
                            <Campo label="URL de tu tesis en el repositorio ESPOCH" required>
                                <div style={s.inputGroupIcon}>
                                    <FaSearch style={s.ico} />
                                    <input type="url" placeholder="https://dspace.espoch.edu.ec/items/..."
                                        style={s.inp} value={urlDspaceB}
                                        onChange={e => { setUrlDspaceB(e.target.value); setVerificadoB(false); setDatosVerificadosB(null); }} />
                                </div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--color-texto-secundario)', marginTop: 3, display: 'block' }}>
                                    Ve a <a href="https://dspace.espoch.edu.ec" target="_blank" rel="noopener noreferrer"
                                        style={{ color: '#1d4ed8', fontWeight: 600 }}>dspace.espoch.edu.ec</a>, busca tu tesis y copia la URL completa
                                </span>
                            </Campo>

                            {/* Correo personal */}
                            <Campo label="Correo personal" required>
                                <div style={s.inputGroupIcon}>
                                    <FaEnvelope style={s.ico} />
                                    <input type="email" name="emailPersonal" placeholder="ejemplo@gmail.com"
                                        style={s.inp} value={formData.emailPersonal} onChange={handleChange} required />
                                </div>
                            </Campo>

                            {/* Contraseña */}
                            <Campo label="Contraseña" required>
                                <PasswordInput value={formData.password} onChange={handleChange}
                                    placeholder="Contraseña segura" name="password" />
                                <div style={s.checklistPass}>
                                    <p style={s.checklistTitulo}>La contraseña debe contener:</p>
                                    <p style={checkItem(formData.password.length >= 8)}>✓ Al menos 8 caracteres</p>
                                    <p style={checkItem(/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password))}>✓ Una letra mayúscula y una minúscula</p>
                                    <p style={checkItem(/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password))}>✓ Un número o símbolo especial</p>
                                </div>
                            </Campo>

                            {/* ── Error local visible sin scroll ── */}
                            {error && !verificadoB && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 8,
                                    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                                    borderLeft: '3px solid #dc2626',
                                    borderRadius: 8, padding: '10px 12px', marginBottom: 10,
                                    fontSize: '0.79rem', color: '#dc2626', lineHeight: 1.5
                                }}>
                                    <FaExclamationTriangle style={{ flexShrink: 0, marginTop: 1 }} />
                                    <span>{error}</span>
                                </div>
                            )}



                            {/* Botones */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                <button type="button" onClick={() => { setPasoRegistro(1); setError(''); }} style={s.btnCancelar}>
                                    ← Atrás
                                </button>

                                {/* Botón VERIFICAR — se pone verde cuando pasa */}
                                {!verificadoB ? (
                                    <button type="button" onClick={handleVerificarB}
                                        style={{ ...s.btnPrincipal, flex: 1, marginBottom: 0, backgroundColor: '#1d4ed8' }}
                                        disabled={verificandoB}>
                                        {verificandoB
                                            ? <><FaSpinner style={s.spin} /> Verificando identidad...</>
                                            : <><FaShieldAlt style={{ marginRight: 6 }} />Verificar identidad</>}
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleFinalizarB}
                                        style={{ ...s.btnPrincipal, flex: 1, marginBottom: 0, backgroundColor: '#15803d' }}
                                        disabled={cargando}>
                                        {cargando
                                            ? <><FaSpinner style={s.spin} /> Registrando...</>
                                            : <><FaCheckCircle style={{ marginRight: 6 }} />Finalizar registro</>}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const checkItem = (cumple) => ({
    margin: '2px 0', fontSize: '0.73rem',
    color: cumple ? '#2e7d32' : 'var(--color-texto-secundario)',
    display: 'flex', alignItems: 'center', gap: 4
});

// ══════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════════════════════════
const s = {
    contenedorPadre: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" },
    ladoImagen: { flex: '0 0 42%', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-image 0.4s ease' },
    capaOscura: { position: 'absolute', inset: 0, backgroundColor: 'rgba(160, 20, 35, 0.88)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', color: 'white', padding: '40px 44px' },
    btnVolverPublico: { display: 'flex', alignItems: 'center', position: 'absolute', top: 20, left: 20, padding: '7px 14px', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)' },
    contenidoImagen: { maxWidth: 360 },
    logoLateral: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
    logoLateralText: { fontSize: '0.9rem', fontWeight: 700, color: 'white', letterSpacing: '-0.01em' },
    heroTitulo: { fontSize: '2rem', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2, letterSpacing: '-0.02em' },
    heroSub: { fontSize: '0.9rem', lineHeight: 1.65, margin: 0, color: 'rgba(255,255,255,0.82)' },
    ladoFormulario: { flex: 1, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', overflowY: 'auto' },
    contenedorForm: { width: '100%', maxWidth: '420px' },
    encabezado: { marginBottom: 20 },
    logo: { width: 80, height: 'auto', display: 'block', margin: '0 auto 16px', objectFit: 'contain' },
    titulo: { color: '#1a1a1a', margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' },
    subtitulo: { color: '#6b7280', margin: 0, fontSize: '0.82rem' },
    subTituloSeccion: { color: '#1a1a1a', margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700 },
    alertaError: { display: 'flex', alignItems: 'flex-start', backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 12px', borderRadius: 8, fontSize: '0.81rem', border: '1px solid #fecaca', marginBottom: 16, lineHeight: 1.5, gap: 8 },
    alertaExito: { display: 'flex', alignItems: 'flex-start', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '10px 12px', borderRadius: 8, fontSize: '0.81rem', border: '1px solid #bbf7d0', marginBottom: 16, lineHeight: 1.5, gap: 8 },
    avisoInfo: { display: 'flex', alignItems: 'center', backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: 7, padding: '8px 12px', fontSize: '0.78rem', color: '#92400e', marginBottom: 16 },
    avisoVerif: { display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 14 },
    avisoBloqueado: { display: 'flex', alignItems: 'flex-start', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, padding: '10px 12px', fontSize: '0.74rem', color: '#6b7280', marginTop: 16, lineHeight: 1.6, gap: 8 },
    campoWrapper: { marginBottom: 14 },
    campoLabel: { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5, letterSpacing: '0.01em' },
    campoExtra: { marginLeft: 8, fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 },
    filaDoble: { display: 'flex', gap: 10 },
    inputGroup: { flex: 1, backgroundColor: 'white', borderRadius: 8, padding: '10px 12px', border: '1.5px solid #e5e7eb' },
    inputGroupIcon: { display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, padding: '10px 12px', border: '1.5px solid #e5e7eb', gap: 8, width: '100%', boxSizing: 'border-box', flex: 1 },
    inputGroupVerde: { display: 'flex', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, padding: '10px 12px', border: '2px solid #16a34a', gap: 8, width: '100%', boxSizing: 'border-box' },
    ico: { color: '#9ca3af', fontSize: '0.88rem', flexShrink: 0 },
    icoVerde: { color: '#16a34a', fontSize: '0.88rem', flexShrink: 0 },
    inp: { border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', fontSize: '0.87rem', color: '#111827', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" },
    ojito: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', flexShrink: 0, display: 'flex', alignItems: 'center', fontSize: '0.95rem', lineHeight: 1, transition: 'color 0.2s', userSelect: 'none', WebkitUserSelect: 'none' },
    inputCodigo: { backgroundColor: '#eff6ff', border: '2px solid #1d4ed8', borderRadius: 10, padding: '12px 16px' },
    inpCodigo: { fontSize: '1.8rem', textAlign: 'center', letterSpacing: '8px', fontWeight: 900, border: 'none', backgroundColor: 'transparent', borderRadius: 6, padding: '4px', width: '100%', fontFamily: 'monospace', color: '#1d4ed8', outline: 'none', boxSizing: 'border-box' },
    checklistPass: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, padding: '10px 12px', marginTop: 8 },
    checklistTitulo: { margin: '0 0 5px', fontSize: '0.73rem', fontWeight: 700, color: '#374151' },
    hint: { fontSize: '0.72rem', color: '#6b7280', paddingLeft: 2, marginTop: 4, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 4 },
    btnPrincipal: { width: '100%', padding: '12px', backgroundColor: '#be1e2d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4, letterSpacing: '0.4px', transition: 'background-color 0.2s' },
    btnSecundario: { width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
    btnCancelar: { padding: '10px 18px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#374151', whiteSpace: 'nowrap' },
    btnTexto: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.83rem', padding: '8px 0', display: 'block', width: '100%', textAlign: 'center' },
    linkSwitch: { background: 'none', border: 'none', color: '#be1e2d', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem', padding: 0 },
    linkOlvide: { background: 'none', border: 'none', color: '#be1e2d', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0 },
    resumen: { textAlign: 'left', backgroundColor: '#f9fafb', padding: '14px', borderRadius: 8, marginBottom: 12, fontSize: '0.76rem', lineHeight: 1.8, color: '#111827', border: '1px solid #e5e7eb' },
    resumenGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    iconoExito: { width: 60, height: 60, borderRadius: '50%', backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
    spin: { animation: 'spin 1s linear infinite', flexShrink: 0 },
    // Selector de flujo
    flujoSelector: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 12 },
    flujoSelectorLabel: { margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center' },
    flujoOpciones: { display: 'flex', gap: 8 },
    flujoBtn: { flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
    flujoBtnActivo: { backgroundColor: '#dcfce7', borderColor: '#16a34a', color: '#15803d' },
    flujoBtnActivoB: { backgroundColor: '#dbeafe', borderColor: '#2563eb', color: '#1d4ed8' },
    flujoAviso: { display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '8px 10px', marginTop: 10, fontSize: '0.73rem', color: '#1e40af', lineHeight: 1.5 },
    // Imágenes cédula — zona compacta
    uploadZone: { border: '2px dashed #d1d5db', borderRadius: 8, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#fafafa' },
    uploadZoneCompacta: { border: '1.5px dashed #d1d5db', borderRadius: 7, padding: '9px 12px', cursor: 'pointer', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 },
    uploadTxt: { margin: 0, fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 },
    uploadHint: { margin: '2px 0 0', fontSize: '0.68rem', color: '#9ca3af' },
    imgPreviewWrap: { position: 'relative', borderRadius: 7, overflow: 'hidden', border: '1px solid #e5e7eb' },
    imgPreview: { width: '100%', maxHeight: 130, objectFit: 'cover', display: 'block' },
    imgPreviewCompacta: { width: '100%', maxHeight: 80, objectFit: 'cover', display: 'block' },
    btnQuitarImg: { position: 'absolute', top: 5, right: 5, display: 'inline-flex', alignItems: 'center', padding: '2px 7px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.67rem', fontWeight: 600 },
    // Banner verificado
    verificadoBanner: { display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginTop: 8 },
};

export default Login;
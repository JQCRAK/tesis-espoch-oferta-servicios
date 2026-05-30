// src/pages/graduado/PerfilGraduado.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserCircle, FaCamera, FaSave, FaSpinner, FaCheckCircle,
    FaPlus, FaTimes, FaGithub, FaLinkedin, FaExclamationTriangle,
    FaCode, FaCertificate, FaBriefcase, FaEdit, FaTrash,
    FaLink, FaCalendarAlt, FaImage, FaGlobe, FaLock,
    FaMedal, FaChartBar, FaHandshake, FaExternalLinkAlt,
    FaLightbulb, FaStar, FaEye, FaBuilding, FaShieldAlt, FaTrophy,
    FaGraduationCap, FaSearch, FaUniversity, FaEnvelope, FaPhone,
    FaMapMarkerAlt  
} from 'react-icons/fa';
import '../../index.css';
import { leerSesion, guardarSesion } from '../../utils/storageSeguro';
import { eliminarSesion } from '../../utils/storageSeguro';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const LIMITE_PROYECTOS = 5;
const LIMITE_CERTIFICADOS = 5;
const LIMITE_PALABRAS_DESC = 250;
const PROVINCIAS_EC = [
    'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo',
    'Cotopaxi', 'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas',
    'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago',
    'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena',
    'Santo Domingo de los Tsáchilas', 'Sucumbíos', 'Tungurahua',
    'Zamora Chinchipe'
];

const nivelAfinidad = (pct) => {
    if (pct >= 60) return { label: 'Experto', color: 'var(--color-espoch-rojo)', bg: '#ffebee' };
    if (pct >= 35) return { label: 'Avanzado', color: '#f57f17', bg: '#fff8e1' };
    return { label: 'Intermedio', color: 'var(--color-tech-azul)', bg: 'var(--color-tech-azul-claro)' };
};

const urlFoto = (ruta) => {
    if (!ruta) return null;
    // Si ya es una URL completa de Cloudinary, usarla directamente
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
        return `${ruta}?t=${Date.now()}`;
    }
    const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
    return `${BASE}/${ruta}?t=${Date.now()}`;
};

const contarPalabras = (texto) => texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length;

// ─── Panel de consejos ─────────────────────────────────
const PanelConsejos = ({ onPublicar, tesisVerificada }) => {
    const [idx, setIdx] = useState(0);
    const [visible, setVisible] = useState(true);

    const consejos = [
        {
            icon: FaStar, color: '#f57f17', bg: '#fff8e1', border: '#ffe082',
            titulo: 'Elige tus mejores trabajos',
            texto: 'Las empresas ven solo tus 5 proyectos. Sube los que mejor demuestren tu nivel técnico y creatividad.'
        },
        {
            icon: FaEye, color: 'var(--color-tech-azul)', bg: 'var(--color-tech-azul-claro)', border: '#bee3f8',
            titulo: 'Describe con impacto',
            texto: 'Explica qué problema resolviste, qué tecnologías usaste y cuál fue el resultado. Un reclutador decide en 30 segundos.'
        },
        {
            icon: FaBuilding, color: '#2e7d32', bg: '#e8f5e9', border: '#c8e6c9',
            titulo: 'Proyectos reales > ejercicios',
            texto: 'Prioriza proyectos para clientes, tesis o productos reales. Demuestran que puedes trabajar bajo presión.'
        },
        {
            icon: FaCertificate, color: 'var(--color-espoch-rojo)', bg: '#ffebee', border: '#ffcdd2',
            titulo: 'Certifícate en lo que practicas',
            texto: 'Sube certificados de tecnologías que realmente usas. La coherencia genera más confianza.'
        },
        {
            icon: FaShieldAlt, color: '#6a1b9a', bg: '#f3e8ff', border: '#ddd6fe',
            titulo: 'Perfil público = más oportunidades',
            texto: 'Verifica tu tesis en el repositorio ESPOCH para publicar tu perfil y ser encontrado por empresas.'
        },
        {
            icon: FaTrophy, color: '#f57f17', bg: '#fff8e1', border: '#ffe082',
            titulo: 'Perfil completo = 3× más visitas',
            texto: 'Los graduados con foto, descripción, proyectos y certificados reciben tres veces más visitas de empresas.'
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setIdx(i => (i + 1) % consejos.length);
                setVisible(true);
            }, 350);
        }, 7000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={sc.panel}>
            <div style={sc.panelHeader}>
                <div style={sc.panelIconWrap}>
                    <FaLightbulb style={{ color: '#f57f17', fontSize: '1rem' }} />
                </div>
                <div>
                    <h3 style={sc.panelTitulo}>Consejos para destacar</h3>
                </div>
            </div>
            <div style={sc.consejosLista}>
                {(() => {
                    const c = consejos[idx];
                    const Icon = c.icon;
                    return (
                        <div style={{ ...sc.consejoItem, borderColor: c.border, backgroundColor: c.bg, opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease' }}>
                            <div style={{ ...sc.consejoIcoWrap, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
                                <Icon style={{ color: c.color, fontSize: '0.85rem' }} />
                            </div>
                            <div style={sc.consejoTexto}>
                                <p style={{ ...sc.consejoTitulo, color: c.color }}>{c.titulo}</p>
                                <p style={sc.consejoDesc}>{c.texto}</p>
                            </div>
                        </div>
                    );
                })()}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingTop: 4 }}>
                    {consejos.map((_, i) => (
                        <div key={i} onClick={() => { setVisible(false); setTimeout(() => { setIdx(i); setVisible(true); }, 350); }} style={{
                            width: i === idx ? 16 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
                            backgroundColor: i === idx ? consejos[idx].color : '#dee2e6',
                            transition: 'all 0.3s'
                        }} />
                    ))}
                </div>
            </div>

            {/* ── Botón publicar perfil ── */}
            {!tesisVerificada && (
                <div style={sc.panelPublicar}>
                    <FaGraduationCap style={{ color: '#6a1b9a', fontSize: '1.1rem', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-texto-principal)' }}>
                            ¿Listo para publicar tu perfil?
                        </p>
                        <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--color-texto-secundario)', lineHeight: 1.4 }}>
                            Verifica tu tesis en el repositorio ESPOCH para activar tu perfil público.
                        </p>
                    </div>
                    <button onClick={onPublicar} style={sc.btnPublicar}>
                        Publicar
                    </button>
                </div>
            )}


        </div>
    );
};

// ═══════════════════════════════════════════════════════
const PerfilGraduado = () => {
    const navigate = useNavigate();
    const fotoRef = useRef(null);
    const proyFotoRef = useRef(null);
    const certFileRef = useRef(null);

    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [token, setToken] = useState('');
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [previewFoto, setPreviewFoto] = useState(null);

    // ── Toasts ────────────────────────────────────────
    const [toasts, setToasts] = useState([]);
    const agregarToast = (msg, tipo = 'error') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, tipo }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
    };
    const ok = (msg) => agregarToast(msg, 'exito');
    const mostrarError = (msg) => { if (msg) agregarToast(msg, 'error'); };

    // ── Modal editar perfil ───────────────────────────
    const [modalAbierto, setModalAbierto] = useState(false);
    const [guardandoModal, setGuardandoModal] = useState(false);
    const [mf, setMf] = useState({
        bio: '', github: '', linkedin: '',
        disponibilidad: 'disponible', perfilPublico: false,
        telefono: '', emailPersonal: '', tieneDiscapacidad: '',
        provinciaActual: '',   // ← NUEVO
        cantonActual: '',      // ← NUEVO
    });

    // ── Modal PUBLICAR PERFIL (tesis) ─────────────────
    const [modalTesis, setModalTesis] = useState(false);
    const [pasoTesis, setPasoTesis] = useState(1);
    const [verificandoTesis, setVerificandoTesis] = useState(false);
    const [aceptandoCons, setAceptandoCons] = useState(false);
    const [datosTesisDspace, setDatosTesisDspace] = useState(null);
    const [ft, setFt] = useState({ titulo: '', resumen: '', urlDspace: '' });

    // ── Proyectos ─────────────────────────────────────
    const [proyectos, setProyectos] = useState([]);
    const [verFormProy, setVerFormProy] = useState(false);
    const [guardandoProy, setGuardandoProy] = useState(false);
    const [editandoProy, setEditandoProy] = useState(null);
    const [previewProy, setPreviewProy] = useState(null);
    const [fp, setFp] = useState({
        titulo: '', descripcion: '', urlRepositorio: '', imagen: null, fechaFinalizacion: ''
    });

    // ── Certificados ──────────────────────────────────
    const [certificados, setCertificados] = useState([]);
    const [verFormCert, setVerFormCert] = useState(false);
    const [guardandoCert, setGuardandoCert] = useState(false);
    const [previewCert, setPreviewCert] = useState(null);
    const [editandoCert, setEditandoCert] = useState(null);
    const [fc, setFc] = useState({
        titulo: '', institucion: '', fechaFinalizacion: '', url: '', descripcion: '', archivo: null
    });

    // ── Modal confirmar eliminación ───────────────────
    const [modalConfirm, setModalConfirm] = useState({
        abierto: false, tipo: '', id: null, titulo: ''
    });

    // ── Carga inicial ─────────────────────────────────
    useEffect(() => {
        document.title = 'Mi Perfil | ESPOCH Software';
        
const sesion = leerSesion('usuario');
if (!sesion) { navigate('/'); return; }
const t = sesion.token;
setToken(t);
        cargarTodo(t);
    }, [navigate]);

    const cargarTodo = async (t) => {
        try {
            const [resPerfil, resProys, resCerts] = await Promise.all([
                axios.get(`${API_URL}/perfil/mi-perfil`, { headers: { Authorization: `Bearer ${t}` } }),
                axios.get(`${API_URL}/proyectos`, { headers: { Authorization: `Bearer ${t}` } }),
                axios.get(`${API_URL}/certificados`, { headers: { Authorization: `Bearer ${t}` } }),
            ]);
            const d = resPerfil.data;
            setPerfil(d);
            setProyectos(resProys.data);
            setCertificados(resCerts.data);
            if (d.fotoPerfil) setPreviewFoto(urlFoto(d.fotoPerfil));
            setMf(prev => ({
                ...prev,
                bio: d.bio || '',
                github: d.github || '',
                linkedin: d.linkedin || '',
                disponibilidad: d.disponibilidad || 'disponible',
                perfilPublico: d.perfilPublico || false,
                telefono: d.telefono || '',
                emailPersonal: d.emailPersonal || '',
                tieneDiscapacidad: d.tieneDiscapacidad || '',
                provinciaActual: d.provinciaActual || '',
                cantonActual: d.cantonActual || '',
            }));
        } catch (err) {
            if (err.response?.status === 401) { eliminarSesion('usuario'); navigate('/'); }
        } finally { setCargando(false); }
    };

    // ── Foto de perfil ────────────────────────────────
    const handleFoto = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        const blobUrl = URL.createObjectURL(f);
        setPreviewFoto(blobUrl);
        setSubiendoFoto(true);
        const fd = new FormData(); fd.append('foto', f);
        try {
            const { data } = await axios.post(`${API_URL}/perfil/foto?tipo=perfil`, fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            URL.revokeObjectURL(blobUrl);
            setPreviewFoto(urlFoto(data.fotoPerfil));
            setPerfil(p => ({ ...p, fotoPerfil: data.fotoPerfil, perfilCompletado: data.perfilCompletado }));
            ok('Foto actualizada correctamente ✅');
        } catch {
            URL.revokeObjectURL(blobUrl);
            setPreviewFoto(perfil?.fotoPerfil ? urlFoto(perfil.fotoPerfil) : null);
            mostrarError('Error al subir la foto. Intenta nuevamente.');
        } finally {
            setSubiendoFoto(false);
            if (fotoRef.current) fotoRef.current.value = '';
        }
    };

    // ── Modal perfil ──────────────────────────────────
    const cambiarMf = (e) => {
        const { name, value, type, checked } = e.target;
        setMf(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };

    const guardarModal = async () => {
        // Validar teléfono
        if (mf.telefono && !/^[0-9]{10}$/.test(mf.telefono.trim())) {
            mostrarError('El teléfono debe tener exactamente 10 dígitos.'); return;
        }
        // Validar email personal
        if (mf.emailPersonal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mf.emailPersonal.trim())) {
            mostrarError('El correo personal no tiene un formato válido.'); return;
        }
        if (mf.emailPersonal && mf.emailPersonal.trim().toLowerCase().endsWith('@espoch.edu.ec')) {
            mostrarError('El correo personal no puede ser un correo institucional ESPOCH.'); return;
        }
        // Validar provincia — obligatoria
        if (!mf.provinciaActual || mf.provinciaActual.trim() === '') {
            mostrarError('La provincia es obligatoria. Selecciona tu provincia actual.'); return;
        }
        // Validar cantón — obligatorio
        if (!mf.cantonActual || mf.cantonActual.trim() === '') {
            mostrarError('El cantón es obligatorio. Escribe tu cantón actual.'); return;
        }

        setGuardandoModal(true);
        try {
            const { data } = await axios.put(`${API_URL}/perfil/actualizar`, {
                bio: mf.bio,
                github: mf.github,
                linkedin: mf.linkedin,
                disponibilidad: mf.disponibilidad,
                perfilPublico: mf.perfilPublico,
                telefono: mf.telefono,
                emailPersonal: mf.emailPersonal,
                tieneDiscapacidad: mf.tieneDiscapacidad,
                provinciaActual: mf.provinciaActual,   // ← NUEVO
                cantonActual: mf.cantonActual,          // ← NUEVO
            }, { headers: { Authorization: `Bearer ${token}` } });

            
const sesion = leerSesion('usuario');
guardarSesion('usuario', { ...sesion, ...data.graduado });
            setPerfil(p => ({ ...p, ...data.graduado }));
            setModalAbierto(false);
            ok('Perfil actualizado correctamente ✅');
        } catch (err) { mostrarError(err.response?.data?.msg || 'Error al guardar'); }
        finally { setGuardandoModal(false); }
    };

    // ─────────────────────────────────────────────────
    // MODAL PUBLICAR PERFIL — TESIS
    // ─────────────────────────────────────────────────
    const abrirModalTesis = async () => {
        const camposFaltantes = [];
        if (!perfil?.fotoPerfil) camposFaltantes.push('📷 foto de perfil');
        if (!perfil?.bio || perfil.bio.trim().length <= 20) camposFaltantes.push('📝 descripción profesional');
        if (!perfil?.disponibilidad) camposFaltantes.push('💼 disponibilidad');
        if (!perfil?.provinciaActual || perfil.provinciaActual.trim() === '') camposFaltantes.push('📍 provincia actual');
        if (!perfil?.cantonActual || perfil.cantonActual.trim() === '') camposFaltantes.push('📍 cantón actual');

        if (camposFaltantes.length > 0) {
            mostrarError(`Completa tu perfil antes de publicarlo. Falta: ${camposFaltantes.join(', ')}.`);
            // Abre el modal de edición para que el graduado complete los datos
            setTimeout(() => setModalAbierto(true), 800);
            return;
        }

        // Si el perfil está completo, abre el modal de tesis normalmente
        setFt({ titulo: '', resumen: '', urlDspace: '' });
        setDatosTesisDspace(null);
        setPasoTesis(1);
        setModalTesis(true);
    };

    const cerrarModalTesis = () => {
        setModalTesis(false);
        setDatosTesisDspace(null);
        setPasoTesis(1);
    };

    const handleVerificarTesis = async () => {
        if (!ft.titulo || ft.titulo.trim().length < 10) {
            mostrarError('El título debe tener al menos 10 caracteres.'); return;
        }
        if (contarPalabras(ft.resumen) < 30) {
            mostrarError('El resumen debe tener al menos 30 palabras.'); return;
        }
        if (contarPalabras(ft.resumen) > 260) {
            mostrarError('El resumen no puede superar las 250 palabras.'); return;
        }
        if (!ft.urlDspace || !ft.urlDspace.includes('dspace.espoch.edu.ec')) {
            mostrarError('La URL debe pertenecer a dspace.espoch.edu.ec'); return;
        }

        setVerificandoTesis(true);
        try {
            const { data } = await axios.post(`${API_URL}/tesis/verificar`, {
                titulo: ft.titulo.trim(),
                resumen: ft.resumen.trim(),
                urlDspace: ft.urlDspace.trim(),
            }, { headers: { Authorization: `Bearer ${token}` } });

            setDatosTesisDspace(data);
            setPasoTesis(2);
        } catch (err) {
            mostrarError(err.response?.data?.msg || 'Error al verificar la tesis. Intenta nuevamente.');
        } finally {
            setVerificandoTesis(false);
        }
    };

    const handleAceptarConsentimiento = async () => {
        setAceptandoCons(true);
        try {
            await axios.post(`${API_URL}/tesis/aceptar-consentimiento`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPerfil(p => ({ ...p, perfilPublico: true, tesisVerificada: true, terminosAceptados: true }));
            setMf(p => ({ ...p, perfilPublico: true }));

            const sesion = leerSesion('usuario');
guardarSesion('usuario', { ...sesion, tesisVerificada: true });

            cerrarModalTesis();
            ok('🎉 ¡Tu perfil ahora es público! Ya apareces en el buscador de graduados.');
        } catch (err) {
            mostrarError(err.response?.data?.msg || 'Error al procesar el consentimiento.');
        } finally {
            setAceptandoCons(false);
        }
    };

    // ─────────────────────────────────────────────────
    // PROYECTOS
    // ─────────────────────────────────────────────────
    const cambiarFp = (e) => { const { name, value } = e.target; setFp(p => ({ ...p, [name]: value })); };

    const handleImgProy = (e) => {
        const f = e.target.files[0]; if (!f) return;
        setFp(p => ({ ...p, imagen: f }));
        setPreviewProy(URL.createObjectURL(f));
    };

    const guardarProyecto = async () => {
        if (!editandoProy && proyectos.length >= LIMITE_PROYECTOS) {
            mostrarError(`Solo puedes tener ${LIMITE_PROYECTOS} proyectos. Elimina uno antes de agregar otro.`); return;
        }
        const palabrasTitulo = fp.titulo.trim().split(/\s+/).filter(Boolean);
        if (!fp.titulo || fp.titulo.trim() === '') { mostrarError('❌ El campo "Título" es obligatorio.'); return; }
        if (palabrasTitulo.length < 3) { mostrarError('❌ El título debe tener al menos 3 palabras.'); return; }
        if (palabrasTitulo.length > 10) { mostrarError('❌ El título no puede superar las 10 palabras.'); return; }
        if (!fp.fechaFinalizacion) { mostrarError('❌ La "Fecha de finalización" es obligatoria.'); return; }
        if (!fp.descripcion || fp.descripcion.trim() === '') { mostrarError('❌ La "Descripción" es obligatoria.'); return; }
        if (contarPalabras(fp.descripcion) < 10) { mostrarError('❌ La descripción debe tener al menos 10 palabras.'); return; }
        if (contarPalabras(fp.descripcion) > LIMITE_PALABRAS_DESC) { mostrarError(`❌ La descripción supera ${LIMITE_PALABRAS_DESC} palabras.`); return; }
        if (!fp.imagen && !editandoProy) { mostrarError('❌ La "Imagen del proyecto" es obligatoria.'); return; }

        setGuardandoProy(true);
        try {
            const fd = new FormData();
            fd.append('titulo', fp.titulo);
            fd.append('descripcion', fp.descripcion);
            fd.append('urlRepositorio', fp.urlRepositorio);
            fd.append('fechaRealizacion', fp.fechaFinalizacion);
            if (fp.imagen) fd.append('imagen', fp.imagen);
            if (editandoProy) {
                const { data } = await axios.put(`${API_URL}/proyectos/${editandoProy}`, fd, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                setProyectos(p => p.map(x => x._id === editandoProy ? data.proyecto : x));
                ok('Proyecto actualizado ✅');
            } else {
                const { data } = await axios.post(`${API_URL}/proyectos`, fd, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                setProyectos(p => [data.proyecto, ...p]);
                ok('Proyecto agregado correctamente ✅');
            }
            resetFp();
            // ── Refrescar habilidades/especialidades/tecnologías ──
            setTimeout(async () => {
                try {
                    const { data: perfilActualizado } = await axios.get(`${API_URL}/perfil/mi-perfil`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPerfil(perfilActualizado);
                } catch { /* silencioso */ }
            }, 1800);
        } catch (err) { mostrarError(err.response?.data?.msg || 'Error al guardar el proyecto'); }
        finally { setGuardandoProy(false); }
    };

    const resetFp = () => {
        setFp({ titulo: '', descripcion: '', urlRepositorio: '', imagen: null, fechaFinalizacion: '' });
        setPreviewProy(null); setVerFormProy(false); setEditandoProy(null);
    };

    const editarProy = (proy) => {
        setFp({
            titulo: proy.titulo, descripcion: proy.descripcion,
            urlRepositorio: proy.urlRepositorio || '',
            fechaFinalizacion: proy.fechaRealizacion?.substring(0, 10) || '',
            imagen: null
        });
        setPreviewProy(proy.imagen ? urlFoto(proy.imagen) : null);
        setEditandoProy(proy._id); setVerFormProy(true);
    };

    const eliminarProy = (id) => {
        const proy = proyectos.find(p => p._id === id);
        setModalConfirm({ abierto: true, tipo: 'proyecto', id, titulo: proy?.titulo || 'este proyecto' });
    };

    // ─────────────────────────────────────────────────
    // CERTIFICADOS
    // ─────────────────────────────────────────────────
    const cambiarFc = (e) => { const { name, value } = e.target; setFc(p => ({ ...p, [name]: value })); };

    const handleArchivoCert = (e) => {
        const f = e.target.files[0]; if (!f) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
            mostrarError('❌ Solo se permiten imágenes JPG, PNG o WEBP.');
            if (certFileRef.current) certFileRef.current.value = '';
            return;
        }
        setFc(p => ({ ...p, archivo: f }));
        setPreviewCert(URL.createObjectURL(f));
    };

    const guardarCertificado = async () => {
        if (!editandoCert && certificados.length >= LIMITE_CERTIFICADOS) {
            mostrarError(`Solo puedes tener ${LIMITE_CERTIFICADOS} certificados.`); return;
        }
        const palabrasTitulo = fc.titulo.trim().split(/\s+/).filter(Boolean);
        if (!fc.titulo || fc.titulo.trim() === '') { mostrarError('❌ El campo "Título" es obligatorio.'); return; }
        if (palabrasTitulo.length < 3) { mostrarError('❌ El título debe tener al menos 3 palabras.'); return; }
        if (palabrasTitulo.length > 10) { mostrarError('❌ El título no puede superar las 10 palabras.'); return; }
        if (!fc.fechaFinalizacion) { mostrarError('❌ La "Fecha de finalización" es obligatoria.'); return; }
        if (!fc.url || fc.url.trim() === '') { mostrarError('❌ La "URL de verificación" es obligatoria.'); return; }
        if (!/^https?:\/\/.+\..+/.test(fc.url.trim())) { mostrarError('❌ La URL no es válida.'); return; }
        if (!fc.descripcion || fc.descripcion.trim() === '') { mostrarError('❌ La "Descripción" es obligatoria.'); return; }
        if (fc.descripcion.trim().length < 10) { mostrarError('❌ La descripción es muy corta.'); return; }
        if (contarPalabras(fc.descripcion) > LIMITE_PALABRAS_DESC) { mostrarError(`❌ La descripción supera ${LIMITE_PALABRAS_DESC} palabras.`); return; }
        if (!fc.archivo && !editandoCert) { mostrarError('❌ La "Imagen del certificado" es obligatoria.'); return; }

        setGuardandoCert(true);
        try {
            const fd = new FormData();
            fd.append('titulo', fc.titulo);
            fd.append('institucion', fc.institucion);
            fd.append('fechaFinalizacion', fc.fechaFinalizacion);
            fd.append('url', fc.url);
            fd.append('descripcion', fc.descripcion);
            if (fc.archivo) fd.append('archivo', fc.archivo);
            if (editandoCert) {
                const { data } = await axios.put(`${API_URL}/certificados/${editandoCert}`, fd, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                setCertificados(c => c.map(x => x._id === editandoCert ? data.certificado : x));
                ok('Certificado actualizado ✅');
            } else {
                const { data } = await axios.post(`${API_URL}/certificados`, fd, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                setCertificados(c => [data.certificado, ...c]);
                ok('Certificado agregado correctamente ✅');
            }
            resetFc();
            // ── Refrescar habilidades/especialidades/tecnologías ──
            setTimeout(async () => {
                try {
                    const { data: perfilActualizado } = await axios.get(`${API_URL}/perfil/mi-perfil`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPerfil(perfilActualizado);
                } catch { /* silencioso */ }
            }, 1800);
        } catch (err) { mostrarError(err.response?.data?.msg || 'Error al guardar el certificado'); }
        finally { setGuardandoCert(false); }
    };

    const editarCert = (cert) => {
        setFc({
            titulo: cert.titulo, institucion: cert.institucion || '',
            fechaFinalizacion: cert.fechaFinalizacion?.substring(0, 10) || '',
            url: cert.url || '', descripcion: cert.descripcion || '', archivo: null
        });
        setPreviewCert(cert.archivo ? urlFoto(cert.archivo) : null);
        setEditandoCert(cert._id); setVerFormCert(true);
    };

    const resetFc = () => {
        setFc({ titulo: '', institucion: '', fechaFinalizacion: '', url: '', descripcion: '', archivo: null });
        setPreviewCert(null); setVerFormCert(false); setEditandoCert(null);
    };

    const eliminarCert = (id) => {
        const cert = certificados.find(c => c._id === id);
        setModalConfirm({ abierto: true, tipo: 'certificado', id, titulo: cert?.titulo || 'este certificado' });
    };

    const confirmarEliminar = async () => {
        const { tipo, id } = modalConfirm;
        setModalConfirm({ abierto: false, tipo: '', id: null, titulo: '' });
        try {
            if (tipo === 'proyecto') {
                await axios.delete(`${API_URL}/proyectos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                setProyectos(p => p.filter(x => x._id !== id));
                ok('Proyecto eliminado');
            } else {
                await axios.delete(`${API_URL}/certificados/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                setCertificados(c => c.filter(x => x._id !== id));
                ok('Certificado eliminado');
            }
            // ── Refrescar habilidades/especialidades/tecnologías ──
            setTimeout(async () => {
                try {
                    const { data: perfilActualizado } = await axios.get(`${API_URL}/perfil/mi-perfil`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPerfil(perfilActualizado);
                } catch { /* silencioso */ }
            }, 1800);
        } catch { mostrarError('Error al eliminar. Intenta nuevamente.'); }
    };

    const cerrarModalConfirm = () => setModalConfirm({ abierto: false, tipo: '', id: null, titulo: '' });

    const progreso = perfil?.perfilCompletado || 0;

    if (cargando) return (
        <div style={s.cargando}><div style={s.spinner} /></div>
    );

    return (
        <div style={s.page}>
            <div style={s.container}>

                {/* ── BANNER PERFIL INCOMPLETO ── */}
                {perfil?.tesisVerificada && progreso < 100 && (() => {
                    const faltante = [];
                    if (!perfil?.fotoPerfil) faltante.push('📷 foto de perfil');
                    if (!perfil?.bio || perfil.bio.trim().length <= 20) faltante.push('📝 descripción');
                    if (!perfil?.disponibilidad) faltante.push('💼 disponibilidad');
                    if (!perfil?.provinciaActual || perfil.provinciaActual.trim() === '') faltante.push('📍 provincia');
                    if (!perfil?.cantonActual || perfil.cantonActual.trim() === '') faltante.push('📍 cantón');
                    return (
                        <div style={s.banner}>
                            <FaExclamationTriangle style={{ color: '#f57f17', fontSize: '1rem', flexShrink: 0, marginTop: 1 }} />
                            <div style={{ flex: 1 }}>
                                <p style={s.bannerTitulo}>Perfil incompleto — {progreso}% completado</p>
                                <p style={s.bannerSub}>Te falta: <strong>{faltante.join(', ')}</strong></p>
                            </div>
                            <button style={s.bannerBtn} onClick={() => setModalAbierto(true)}>Completar</button>
                        </div>
                    );
                })()}

                {/* ══ CABECERA ══ */}
                <div style={s.cabecera}>
                    <div style={s.cabeceraTop}>
                        <div style={s.fotoYNombre}>
                            <div style={s.fotoWrap} onClick={() => fotoRef.current.click()}>
                                {previewFoto
                                    ? <img src={previewFoto} alt="perfil" style={s.fotoImg} />
                                    : <FaUserCircle style={s.fotoIcono} />
                                }
                                <div style={s.fotoOverlay}>
                                    {subiendoFoto
                                        ? <FaSpinner className="spin" style={{ color: 'white', fontSize: '0.85rem' }} />
                                        : <FaCamera style={{ color: 'white', fontSize: '0.85rem' }} />
                                    }
                                </div>
                            </div>
                            <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp"
                                onChange={handleFoto} style={{ display: 'none' }} />
                            <div style={s.nombreInfo}>
                                <h1 style={s.nombre}>{perfil?.nombres} {perfil?.apellidos}</h1>
                                <p style={s.tituloProf}>Ingeniero/a de Software · ESPOCH</p>
                                <div style={s.badgesRow}>
                                    <span style={{
                                        ...s.badge,
                                        backgroundColor: perfil?.disponibilidad === 'disponible' ? '#e8f5e9' : '#ffebee',
                                        color: perfil?.disponibilidad === 'disponible' ? 'var(--estado-exito)' : 'var(--estado-error)',
                                        border: `1px solid ${perfil?.disponibilidad === 'disponible' ? '#c8e6c9' : '#ffcdd2'}`,
                                    }}>
                                        {perfil?.disponibilidad === 'disponible' ? 'Disponible' : 'No disponible'}
                                    </span>
                                    <span style={{
                                        ...s.badge,
                                        backgroundColor: perfil?.perfilPublico ? 'var(--color-tech-azul-claro)' : '#f5f5f5',
                                        color: perfil?.perfilPublico ? 'var(--color-tech-azul)' : 'var(--color-texto-secundario)',
                                        border: `1px solid ${perfil?.perfilPublico ? '#bee3f8' : '#e0e0e0'}`
                                    }}>
                                        {perfil?.perfilPublico
                                            ? <><FaGlobe style={{ fontSize: '0.65rem', marginRight: 4 }} />Público</>
                                            : <><FaLock style={{ fontSize: '0.65rem', marginRight: 4 }} />Privado</>
                                        }
                                    </span>
                                    {perfil?.tesisVerificada && (
                                        <span style={{
                                            ...s.badge,
                                            backgroundColor: '#f3e8ff', color: '#6a1b9a',
                                            border: '1px solid #ddd6fe'
                                        }}>
                                            <FaGraduationCap style={{ fontSize: '0.65rem', marginRight: 4 }} />Graduado verificado
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
                            <button style={s.btnEditarCab} onClick={() => setModalAbierto(true)}>
                                <FaEdit style={{ marginRight: 5 }} />Editar perfil
                            </button>
                            {!perfil?.tesisVerificada && (
                                <button style={s.btnPublicarCab} onClick={abrirModalTesis}>
                                    <FaGraduationCap style={{ marginRight: 5 }} />Publicar perfil
                                </button>
                            )}
                        </div>
                    </div>

                    {perfil?.tesisVerificada && progreso < 100 && (
                        <div style={s.progresoArea}>
                            <div style={s.progresoHeader}>
                                <span style={s.progresoLbl}>Perfil completado</span>
                                <span style={{ ...s.progresoLbl, fontWeight: '700', color: 'var(--color-espoch-rojo)' }}>{progreso}%</span>
                            </div>
                            <div style={s.progresoTrack}>
                                <div style={{ ...s.progresoFill, width: `${progreso}%`, backgroundColor: 'var(--color-espoch-rojo)' }} />
                            </div>
                        </div>
                    )}

                    <div style={s.extras}>
                        {perfil?.github && <a href={perfil.github} target="_blank" rel="noopener noreferrer" style={s.redLink}><FaGithub style={{ marginRight: 4 }} />GitHub</a>}
                        {perfil?.linkedin && <a href={perfil.linkedin} target="_blank" rel="noopener noreferrer" style={s.redLink}><FaLinkedin style={{ marginRight: 4 }} />LinkedIn</a>}
                    </div>
                </div>

                {/* ══ CUERPO: 3 COLUMNAS ══ */}
                <div style={s.body}>

                    {/* ── COLUMNA IZQUIERDA ── */}
                    <div style={s.colIzq}>
                        {perfil?.bio ? (
                            <div style={s.card}>
                                <h2 style={s.cardH}>Sobre mí</h2>
                                <p style={s.bioTxt}>{perfil.bio}</p>
                            </div>
                        ) : (
                            <div style={{ ...s.card, border: '1px dashed #dee2e6', backgroundColor: '#fafafa' }}>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-texto-secundario)', textAlign: 'center' }}>
                                    Sin descripción — <button onClick={() => setModalAbierto(true)} style={s.linkBtn}>agregar</button>
                                </p>
                            </div>
                        )}



                        <div style={s.card}>
                            <h2 style={s.cardH}><FaChartBar style={s.cardIco} />Especialidades</h2>
                            <p style={s.cardSub}>Detectadas desde tus proyectos y certificados</p>
                            {perfil?.afinidades?.length > 0 ? (
                                perfil.afinidades.map((af, i) => {
                                    const nv = nivelAfinidad(af.porcentaje);
                                    return (
                                        <div key={i} style={s.afRow}>
                                            <div style={s.afInfo}>
                                                <span style={s.afNombre}>{af.categoria}</span>
                                                <span style={{ ...s.afBadge, color: nv.color, backgroundColor: nv.bg }}>{nv.label}</span>
                                            </div>
                                            <div style={s.afTrack}>
                                                <div style={{ ...s.afFill, width: `${af.porcentaje}%`, backgroundColor: nv.color }} />
                                            </div>
                                            <span style={s.afPct}>{af.porcentaje}%</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={s.emptySmall}>
                                    <FaMedal style={{ fontSize: '1.6rem', color: '#dee2e6', marginBottom: 6 }} />
                                    <p style={s.emptySmallTxt}>Sube proyectos o certificados para detectar especialidades</p>
                                </div>
                            )}
                        </div>


                    </div>

                    {/* ── COLUMNA CENTRO ── */}
                    <div style={s.colCentro}>

                        {/* ═══ PROYECTOS ═══ */}
                        <div style={s.card}>
                            <div style={s.secHeader}>
                                <div>
                                    <h2 style={s.cardH}><FaBriefcase style={s.cardIco} />Proyectos</h2>
                                    <p style={s.cardSub}>
                                        Para calcular especialidades y tecnologías · <span style={{ fontWeight: '700', color: proyectos.length >= LIMITE_PROYECTOS ? 'var(--estado-error)' : 'var(--color-texto-secundario)' }}>{proyectos.length}/{LIMITE_PROYECTOS}</span>
                                    </p>
                                </div>
                                <button
                                    style={verFormProy ? s.btnCancelSec : proyectos.length >= LIMITE_PROYECTOS ? s.btnAddSecDisabled : s.btnAddSec}
                                    onClick={() => {
                                        if (proyectos.length >= LIMITE_PROYECTOS && !verFormProy) { mostrarError(`Solo puedes tener ${LIMITE_PROYECTOS} proyectos.`); return; }
                                        verFormProy ? resetFp() : setVerFormProy(true);
                                    }}
                                    disabled={!verFormProy && proyectos.length >= LIMITE_PROYECTOS}
                                >
                                    {verFormProy ? <><FaTimes style={{ marginRight: 4 }} />Cancelar</> : <><FaPlus style={{ marginRight: 4 }} />Nuevo</>}
                                </button>
                            </div>



                            {verFormProy && (
                                <div style={s.formCard}>
                                    <h3 style={s.formH}>{editandoProy ? 'Editar proyecto' : 'Nuevo proyecto'}</h3>
                                    <div style={s.grid2}>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Título *</label>
                                            <div style={s.inputWrap}>
                                                <input name="titulo" value={fp.titulo} onChange={cambiarFp}
                                                    placeholder="Ej: Sistema de gestión académica ESPOCH" style={s.inp} />
                                            </div>
                                            <span style={{ fontSize: '0.69rem', color: fp.titulo.trim().split(/\s+/).filter(Boolean).length > 10 ? 'var(--estado-error)' : 'var(--color-texto-secundario)', marginTop: 2 }}>
                                                {fp.titulo.trim() === '' ? 0 : fp.titulo.trim().split(/\s+/).filter(Boolean).length}/10 palabras · mín 3
                                            </span>
                                        </div>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Fecha de finalización *</label>
                                            <div style={s.inputWrap}>
                                                <FaCalendarAlt style={s.icoInp} />
                                                <input type="date" name="fechaFinalizacion" value={fp.fechaFinalizacion} onChange={cambiarFp} style={s.inp} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Descripción *</label>
                                        <div style={{ ...s.inputWrap, alignItems: 'flex-start', paddingTop: 10 }}>
                                            <textarea name="descripcion" value={fp.descripcion} onChange={cambiarFp}
                                                placeholder="Ej: Desarrollé un sistema usando React y Node.js..."
                                                style={{ ...s.inp, minHeight: 100, resize: 'vertical' }} />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: contarPalabras(fp.descripcion) > LIMITE_PALABRAS_DESC - 25 ? 'var(--estado-alerta)' : 'var(--color-texto-secundario)', marginTop: 3 }}>
                                            {contarPalabras(fp.descripcion)}/{LIMITE_PALABRAS_DESC} palabras
                                        </span>
                                        <div style={s.guiaBox}>
                                            <p style={s.guiaTitulo}>💡 Incluye en tu descripción:</p>
                                            <div style={s.guiaGrid}>
                                                <span style={s.guiaItem}>👥 ¿Solo o en equipo?</span>
                                                <span style={s.guiaItem}>🛠️ ¿Qué tecnologías usaste?</span>
                                                <span style={s.guiaItem}>❓ ¿Qué problema resolviste?</span>
                                                <span style={s.guiaItem}>✅ ¿Cuál fue el resultado?</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>URL del repositorio (Opcional)</label>
                                        <div style={s.inputWrap}>
                                            <FaLink style={s.icoInp} />
                                            <input name="urlRepositorio" value={fp.urlRepositorio} onChange={cambiarFp}
                                                placeholder="https://github.com/usuario/repo" style={s.inp} />
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Imagen del proyecto *</label>
                                        <div style={s.uploadZone} onClick={() => !previewProy && proyFotoRef.current.click()}>
                                            {previewProy
                                                ? <div style={{ position: 'relative' }}>
                                                    <img src={previewProy} alt="preview" style={{ width: '100%', maxHeight: 130, objectFit: 'cover', borderRadius: 6 }} />
                                                    <button type="button" onClick={e => { e.stopPropagation(); setPreviewProy(null); setFp(p => ({ ...p, imagen: null })); if (proyFotoRef.current) proyFotoRef.current.value = ''; }} style={s.btnQuitarImg}>
                                                        <FaTimes style={{ fontSize: '0.65rem' }} /> Quitar
                                                    </button>
                                                </div>
                                                : <><FaImage style={{ fontSize: '1.6rem', color: '#adb5bd', marginBottom: 5 }} />
                                                    <p style={s.uploadTxt}>Haz clic para subir imagen</p>
                                                    <p style={s.uploadHint}>Solo JPG, PNG o WEBP · Máx 5MB</p></>
                                            }
                                        </div>
                                        <input ref={proyFotoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImgProy} style={{ display: 'none' }} />
                                    </div>
                                    <div style={s.formFooter}>
                                        <button type="button" onClick={resetFp} style={s.btnCancelForm}>Cancelar</button>
                                        <button type="button" style={s.btnSaveForm} onClick={guardarProyecto} disabled={guardandoProy}>
                                            {guardandoProy ? <><FaSpinner className="spin" style={{ marginRight: 6 }} />Guardando...</> : <><FaSave style={{ marginRight: 5 }} />{editandoProy ? 'Actualizar' : 'Guardar'}</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {proyectos.length === 0 && !verFormProy ? (
                                <div style={s.emptyState}>
                                    <FaBriefcase style={{ fontSize: '2rem', color: '#dee2e6', marginBottom: 8 }} />
                                    <p style={s.emptyH}>Aún no tienes proyectos</p>
                                    <p style={s.emptySub}>Agrega hasta {LIMITE_PROYECTOS} proyectos para mostrar tu experiencia</p>
                                    <button style={s.emptyBtn} onClick={() => setVerFormProy(true)}>
                                        <FaPlus style={{ marginRight: 5 }} />Agregar primer proyecto
                                    </button>
                                </div>
                            ) : (
                                <div style={s.proyGrid}>
                                    {proyectos.map(proy => (
                                        <div key={proy._id} style={s.proyCard}>
                                            {proy.imagen
                                                ? <img src={urlFoto(proy.imagen)} alt={proy.titulo} style={s.proyImg} />
                                                : <div style={s.proyImgPlaceholder}><FaImage style={{ fontSize: '1.4rem', color: '#dee2e6' }} /></div>
                                            }
                                            <div style={s.proyBody}>
                                                <div style={s.proyTop}>
                                                    <h3 style={s.proyTitulo}>{proy.titulo}</h3>
                                                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                                                        <button style={s.iconBtn} onClick={() => editarProy(proy)}><FaEdit /></button>
                                                        <button style={{ ...s.iconBtn, color: 'var(--estado-error)' }} onClick={() => eliminarProy(proy._id)}><FaTrash /></button>
                                                    </div>
                                                </div>
                                                <p style={s.proyDesc}>{proy.descripcion}</p>
                                                {proy.tecnologias?.length > 0 && (
                                                    <div style={{ ...s.tagsWrap, marginTop: 6 }}>
                                                        {proy.tecnologias.slice(0, 4).map((t, i) => <span key={i} style={s.tagTecSm}>{t}</span>)}
                                                        {proy.tecnologias.length > 4 && <span style={s.tagTecSm}>+{proy.tecnologias.length - 4}</span>}
                                                    </div>
                                                )}
                                                <div style={s.proyFooter}>
                                                    {proy.fechaRealizacion && <span style={s.proyMeta}><FaCalendarAlt style={{ marginRight: 3 }} />{new Date(proy.fechaRealizacion).getFullYear()}</span>}
                                                    {proy.urlRepositorio && <a href={proy.urlRepositorio} target="_blank" rel="noopener noreferrer" style={s.proyLink}><FaLink style={{ marginRight: 3 }} />Repo</a>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ═══ CERTIFICADOS ═══ */}
                        <div style={s.card}>
                            <div style={s.secHeader}>
                                <div>
                                    <h2 style={s.cardH}><FaCertificate style={s.cardIco} />Certificados y Talleres</h2>
                                    <p style={s.cardSub}>
                                        ESPOCH u otras instituciones · <span style={{ fontWeight: '700', color: certificados.length >= LIMITE_CERTIFICADOS ? 'var(--estado-error)' : 'var(--color-texto-secundario)' }}>{certificados.length}/{LIMITE_CERTIFICADOS}</span>
                                    </p>
                                </div>
                                <button
                                    style={verFormCert ? s.btnCancelSec : certificados.length >= LIMITE_CERTIFICADOS ? s.btnAddSecDisabled : s.btnAddSec}
                                    onClick={() => {
                                        if (certificados.length >= LIMITE_CERTIFICADOS && !verFormCert) { mostrarError(`Solo puedes tener ${LIMITE_CERTIFICADOS} certificados.`); return; }
                                        verFormCert ? resetFc() : setVerFormCert(true);
                                    }}
                                    disabled={!verFormCert && certificados.length >= LIMITE_CERTIFICADOS}
                                >
                                    {verFormCert ? <><FaTimes style={{ marginRight: 4 }} />Cancelar</> : <><FaPlus style={{ marginRight: 4 }} />Nuevo</>}
                                </button>
                            </div>



                            {verFormCert && (
                                <div style={s.formCard}>
                                    <h3 style={s.formH}>{editandoCert ? 'Editar certificado' : 'Nuevo certificado / taller'}</h3>
                                    <div style={s.grid2}>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Título *</label>
                                            <div style={s.inputWrap}>
                                                <input name="titulo" value={fc.titulo} onChange={cambiarFc}
                                                    placeholder="Ej: Taller de React Avanzado con Hooks" style={s.inp} />
                                            </div>
                                            <span style={{ fontSize: '0.69rem', color: fc.titulo.trim().split(/\s+/).filter(Boolean).length > 10 ? 'var(--estado-error)' : 'var(--color-texto-secundario)', marginTop: 2 }}>
                                                {fc.titulo.trim() === '' ? 0 : fc.titulo.trim().split(/\s+/).filter(Boolean).length}/10 palabras · mín 3
                                            </span>
                                        </div>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Fecha de finalización *</label>
                                            <div style={s.inputWrap}>
                                                <FaCalendarAlt style={s.icoInp} />
                                                <input type="date" name="fechaFinalizacion" value={fc.fechaFinalizacion} onChange={cambiarFc} style={s.inp} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Institución / Organizador</label>
                                        <div style={s.inputWrap}>
                                            <input name="institucion" value={fc.institucion} onChange={cambiarFc} placeholder="Ej: ESPOCH, Udemy..." style={s.inp} />
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>URL de verificación *</label>
                                        <div style={s.inputWrap}>
                                            <FaExternalLinkAlt style={s.icoInp} />
                                            <input name="url" value={fc.url} onChange={cambiarFc}
                                                placeholder="https://udemy.com/certificate/..." style={s.inp} />
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>¿Qué aprendiste? *</label>
                                        <div style={{ ...s.inputWrap, alignItems: 'flex-start', paddingTop: 10 }}>
                                            <textarea name="descripcion" value={fc.descripcion} onChange={cambiarFc}
                                                placeholder="Ej: Completé un curso de 40 horas sobre Node.js..."
                                                style={{ ...s.inp, minHeight: 90, resize: 'vertical' }} />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: contarPalabras(fc.descripcion) > LIMITE_PALABRAS_DESC - 25 ? 'var(--estado-alerta)' : 'var(--color-texto-secundario)', marginTop: 3 }}>
                                            {contarPalabras(fc.descripcion)}/{LIMITE_PALABRAS_DESC} palabras
                                        </span>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Imagen del certificado *</label>
                                        <div style={s.uploadZone} onClick={() => !previewCert && certFileRef.current.click()}>
                                            {previewCert
                                                ? <div style={{ position: 'relative' }}>
                                                    <img src={previewCert} alt="cert" style={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 6 }} />
                                                    <button type="button" onClick={e => { e.stopPropagation(); setPreviewCert(null); setFc(p => ({ ...p, archivo: null })); if (certFileRef.current) certFileRef.current.value = ''; }} style={s.btnQuitarImg}>
                                                        <FaTimes style={{ fontSize: '0.65rem' }} /> Quitar
                                                    </button>
                                                </div>
                                                : <><FaImage style={{ fontSize: '1.6rem', color: '#adb5bd', marginBottom: 5 }} />
                                                    <p style={s.uploadTxt}>Subir imagen del certificado</p>
                                                    <p style={s.uploadHint}>JPG, PNG o WEBP · Máx 5MB</p></>
                                            }
                                        </div>
                                        <input ref={certFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleArchivoCert} style={{ display: 'none' }} />
                                    </div>
                                    <div style={s.formFooter}>
                                        <button type="button" onClick={resetFc} style={s.btnCancelForm}>Cancelar</button>
                                        <button type="button" style={s.btnSaveForm} onClick={guardarCertificado} disabled={guardandoCert}>
                                            {guardandoCert ? <><FaSpinner className="spin" style={{ marginRight: 6 }} />Guardando...</> : <><FaSave style={{ marginRight: 5 }} />Guardar</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {certificados.length === 0 && !verFormCert ? (
                                <div style={s.emptyState}>
                                    <FaCertificate style={{ fontSize: '2rem', color: '#dee2e6', marginBottom: 8 }} />
                                    <p style={s.emptyH}>Aún no tienes certificados</p>
                                    <p style={s.emptySub}>Agrega hasta {LIMITE_CERTIFICADOS} talleres y certificaciones</p>
                                    <button style={s.emptyBtn} onClick={() => setVerFormCert(true)}>
                                        <FaPlus style={{ marginRight: 5 }} />Agregar primer certificado
                                    </button>
                                </div>
                            ) : (
                                <div style={s.certGrid}>
                                    {certificados.map(cert => (
                                        <div key={cert._id} style={s.certCard}>
                                            {cert.archivo
                                                ? <img src={urlFoto(cert.archivo)} alt={cert.titulo} style={s.certImg} />
                                                : <div style={s.certImgPlaceholder}><FaCertificate style={{ fontSize: '1.6rem', color: '#dee2e6' }} /></div>
                                            }
                                            <div style={s.certBody}>
                                                <div style={s.certInfo}>
                                                    <p style={s.certTitulo}>{cert.titulo}</p>
                                                    {cert.institucion && <p style={s.certInst}>{cert.institucion}</p>}
                                                    {cert.descripcion && <p style={s.certDesc}>{cert.descripcion}</p>}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                                                        <p style={s.certFecha}>
                                                            <FaCalendarAlt style={{ marginRight: 3 }} />
                                                            {new Date(cert.fechaFinalizacion).toLocaleDateString('es-EC', { year: 'numeric', month: 'short' })}
                                                        </p>
                                                        {cert.url && (
                                                            <a href={cert.url} target="_blank" rel="noopener noreferrer" style={s.certUrl}>
                                                                <FaExternalLinkAlt style={{ marginRight: 3, fontSize: '0.6rem' }} />Ver certificado
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end', marginTop: 6 }}>
                                                    <button style={s.iconBtn} onClick={() => editarCert(cert)}><FaEdit /></button>
                                                    <button style={{ ...s.iconBtn, color: 'var(--estado-error)' }} onClick={() => eliminarCert(cert._id)}><FaTrash /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── COLUMNA DERECHA — CONSEJOS ── */}
                    <div style={s.colDer}>
                        <div style={s.consejosSticky}>
                            <PanelConsejos
                                onPublicar={abrirModalTesis}
                                tesisVerificada={perfil?.tesisVerificada}
                            />
                            <div style={{ ...s.card, marginTop: 12 }}>
                                <h2 style={s.cardH}><FaHandshake style={s.cardIco} />Habilidades Blandas</h2>
                                <p style={s.cardSub}>Detectadas desde tus proyectos y certificados</p>
                                {perfil?.habilidadesBlandas?.length > 0 ? (
                                    <div style={s.tagsWrap}>
                                        {perfil.habilidadesBlandas.map((h, i) => <span key={i} style={s.tagBlanda}>{h}</span>)}
                                    </div>
                                ) : (
                                    <div style={s.emptySmall}>
                                        <FaHandshake style={{ fontSize: '1.6rem', color: '#dee2e6', marginBottom: 6 }} />
                                        <p style={s.emptySmallTxt}>Agrega proyectos o certificados para detectar habilidades blandas</p>
                                    </div>
                                )}
                            </div>
                            <div style={{ ...s.card, marginTop: 12 }}>
                                <h2 style={s.cardH}><FaCode style={s.cardIco} />Tecnologías</h2>
                                <p style={s.cardSub}>Detectadas desde tus proyectos y certificados</p>
                                {perfil?.tecnologias?.length > 0 ? (
                                    <div style={s.tagsWrap}>
                                        {perfil.tecnologias.map((t, i) => <span key={i} style={s.tagTec}>{t}</span>)}
                                    </div>
                                ) : (
                                    <div style={s.emptySmall}>
                                        <FaCode style={{ fontSize: '1.6rem', color: '#dee2e6', marginBottom: 6 }} />
                                        <p style={s.emptySmallTxt}>Agrega certificados para detectar tecnologías</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                MODAL PUBLICAR PERFIL — TESIS
            ══════════════════════════════════════════════════ */}
            {modalTesis && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget && !verificandoTesis && !aceptandoCons) cerrarModalTesis(); }}>
                    <div style={{ ...s.modal, maxWidth: 540 }}>
                        <div style={{ ...s.modalHeader, borderBottom: '2px solid #6a1b9a' }}>
                            <div>
                                <h2 style={s.modalTitulo}>
                                    {pasoTesis === 1 ? '🎓 Verificar graduación' : '📋 Autorización de publicación'}
                                </h2>
                                <p style={s.modalSub}>
                                    {pasoTesis === 1
                                        ? 'Ingresa los datos de tu tesis para confirmar que eres graduado ESPOCH'
                                        : 'Lee y acepta los términos antes de publicar tu perfil'}
                                </p>
                            </div>
                            {!verificandoTesis && !aceptandoCons && (
                                <button style={s.modalClose} onClick={cerrarModalTesis}><FaTimes /></button>
                            )}
                        </div>

                        <div style={st.pasosBar}>
                            <div style={{ ...st.paso, ...(pasoTesis >= 1 ? st.pasoActivo : {}) }}>
                                <div style={{ ...st.pasoCirculo, ...(pasoTesis >= 1 ? st.pasoCirculoActivo : {}) }}>
                                    {pasoTesis > 1 ? <FaCheckCircle style={{ fontSize: '0.85rem' }} /> : '1'}
                                </div>
                                <span style={st.pasoLabel}>Verificar tesis</span>
                            </div>
                            <div style={st.pasoLinea} />
                            <div style={{ ...st.paso, ...(pasoTesis >= 2 ? st.pasoActivo : {}) }}>
                                <div style={{ ...st.pasoCirculo, ...(pasoTesis >= 2 ? st.pasoCirculoActivo : {}) }}>2</div>
                                <span style={st.pasoLabel}>Consentimiento</span>
                            </div>
                        </div>

                        <div style={s.modalBody}>
                            {pasoTesis === 1 && (
                                <>
                                    <div style={st.infoBanner}>
                                        <FaUniversity style={{ color: '#6a1b9a', flexShrink: 0, fontSize: '1rem' }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.81rem', color: '#4a0080' }}>
                                                Verificación automática con el Repositorio ESPOCH
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5 }}>
                                                El sistema consultará <strong>dspace.espoch.edu.ec</strong> para confirmar que tu tesis existe y que eres el autor registrado. El título debe coincidir exactamente.
                                            </p>
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Título de tu tesis de grado *</label>
                                        <div style={s.inputWrap}>
                                            <input
                                                value={ft.titulo}
                                                onChange={e => setFt(p => ({ ...p, titulo: e.target.value }))}
                                                placeholder="Ej: Sistema de información para la toma de decisiones..."
                                                style={s.inp}
                                            />
                                        </div>
                                        <span style={{ fontSize: '0.69rem', color: 'var(--color-texto-secundario)', marginTop: 2 }}>
                                            Escríbelo exactamente como aparece en el repositorio ESPOCH
                                        </span>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>URL de tu tesis en el repositorio ESPOCH *</label>
                                        <div style={s.inputWrap}>
                                            <FaSearch style={s.icoInp} />
                                            <input
                                                value={ft.urlDspace}
                                                onChange={e => setFt(p => ({ ...p, urlDspace: e.target.value }))}
                                                placeholder="https://dspace.espoch.edu.ec/items/..."
                                                style={s.inp}
                                            />
                                        </div>
                                        <span style={{ fontSize: '0.69rem', color: 'var(--color-texto-secundario)', marginTop: 2 }}>
                                            Ve a <a href="https://dspace.espoch.edu.ec" target="_blank" rel="noopener noreferrer" style={{ color: '#6a1b9a', fontWeight: 600 }}>dspace.espoch.edu.ec</a>, busca tu tesis y copia la URL completa de la página
                                        </span>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>
                                            Resumen de tu tesis *
                                            <span style={{ fontWeight: 400, color: 'var(--color-texto-secundario)', marginLeft: 6 }}>
                                                ({contarPalabras(ft.resumen)}/250 palabras)
                                            </span>
                                        </label>
                                        <div style={{ ...s.inputWrap, alignItems: 'flex-start', paddingTop: 10 }}>
                                            <textarea
                                                value={ft.resumen}
                                                onChange={e => setFt(p => ({ ...p, resumen: e.target.value }))}
                                                placeholder="Escribe un resumen de tu tesis en tus propias palabras (mínimo 30 palabras, máximo 250)..."
                                                style={{ ...s.inp, minHeight: 110, resize: 'vertical' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: contarPalabras(ft.resumen) > 250 ? 'var(--estado-error)' : contarPalabras(ft.resumen) > 220 ? 'var(--estado-alerta)' : 'var(--color-texto-secundario)'
                                            }}>
                                                {contarPalabras(ft.resumen)}/250
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {pasoTesis === 2 && datosTesisDspace && (
                                <>
                                    <div style={st.verificadoBanner}>
                                        <FaCheckCircle style={{ color: 'var(--estado-exito)', fontSize: '1.4rem', flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#1b5e20' }}>
                                                ✅ Tesis verificada en el Repositorio ESPOCH
                                            </p>
                                            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#2e7d32' }}>
                                                Título encontrado: <em>"{datosTesisDspace.tituloEncontrado}"</em>
                                            </p>
                                            {datosTesisDspace.autoresEncontrados?.length > 0 && (
                                                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#2e7d32' }}>
                                                    Autores: {datosTesisDspace.autoresEncontrados.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div style={st.terminosBox}>
                                        <div style={st.terminosBadge}>Res. 423.CP.2024 · LOPDP Ecuador</div>
                                        <h4 style={st.terminosTitulo}>Autorización de Tratamiento de Datos Personales</h4>
                                        <p style={st.terminosP}>
                                            De conformidad con la <strong>Resolución 423.CP.2024 — Políticas de Protección de Datos Personales de la ESPOCH</strong> y la <strong>Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP)</strong>, al aceptar autorizas que la Carrera de Software publique tu perfil profesional.
                                        </p>
                                        <p style={{ ...st.terminosP, fontWeight: 700, color: 'var(--color-texto-principal)', marginBottom: 4 }}>
                                            Datos que serán visibles públicamente:
                                        </p>
                                        <ul style={st.terminosLista}>
                                            <li>Nombres y apellidos completos</li>
                                            <li>Título de tu tesis de grado</li>
                                            <li>Proyectos, certificados y habilidades detectadas</li>
                                            <li>Disponibilidad laboral y descripción profesional</li>
                                        </ul>
                                        <div style={st.terminosAlerta}>
                                            🔒 <strong>Tus datos de contacto (correo, teléfono, cédula) NUNCA serán publicados.</strong> Los interesados contactarán al administrador institucional como intermediario.
                                        </div>
                                        <p style={st.terminosP}>
                                            Conforme a los <strong>Arts. 11-12 de la Res. 423.CP.2024</strong>, puedes <strong>activar o desactivar</strong> tu perfil público en cualquier momento desde la sección "Editar perfil".
                                        </p>
                                    </div>
                                    <div style={st.consentimientoAviso}>
                                        <FaShieldAlt style={{ color: '#6a1b9a', flexShrink: 0 }} />
                                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#4a0080', lineHeight: 1.5 }}>
                                            Al hacer clic en <strong>"Aceptar y publicar"</strong>, declaras haber leído y aceptado los términos del tratamiento de datos conforme a la normativa institucional de la ESPOCH. Tu perfil pasará a ser <strong>público automáticamente</strong>.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={s.modalFooter}>
                            {pasoTesis === 1 && (
                                <>
                                    <button style={s.btnCancelForm} onClick={cerrarModalTesis} disabled={verificandoTesis}>Cancelar</button>
                                    <button
                                        style={{ ...s.btnSaveForm, backgroundColor: '#6a1b9a', color: 'white', border: 'none' }}
                                        onClick={handleVerificarTesis}
                                        disabled={verificandoTesis}
                                    >
                                        {verificandoTesis
                                            ? <><FaSpinner className="spin" style={{ marginRight: 6 }} />Verificando en dspace...</>
                                            : <><FaSearch style={{ marginRight: 6 }} />Verificar tesis</>
                                        }
                                    </button>
                                </>
                            )}
                            {pasoTesis === 2 && (
                                <>
                                    <button style={s.btnCancelForm} onClick={() => setPasoTesis(1)} disabled={aceptandoCons}>← Volver</button>
                                    <button
                                        style={{ ...s.btnSaveForm, backgroundColor: 'var(--color-espoch-verde, #2e7d32)', color: 'white', border: 'none' }}
                                        onClick={handleAceptarConsentimiento}
                                        disabled={aceptandoCons}
                                    >
                                        {aceptandoCons
                                            ? <><FaSpinner className="spin" style={{ marginRight: 6 }} />Publicando perfil...</>
                                            : <><FaCheckCircle style={{ marginRight: 6 }} />Aceptar y publicar</>
                                        }
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MODAL EDITAR PERFIL ══ */}
            {modalAbierto && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalAbierto(false); }}>
                    <div style={s.modal}>
                        <div style={s.modalHeader}>
                            <div>
                                <h2 style={s.modalTitulo}>{progreso < 100 ? 'Completar perfil' : 'Editar perfil'}</h2>
                                <p style={s.modalSub}>Actualiza tu información de contacto y perfil profesional</p>
                            </div>
                            <button style={s.modalClose} onClick={() => setModalAbierto(false)}><FaTimes /></button>
                        </div>
                        <div style={s.modalBody}>

                            {/* ── Sección: datos de contacto (editables) ── */}
                            <div style={s.modalSec}>
                                <h3 style={s.modalSecH}>Datos de contacto</h3>



                                {/* Datos fijos (solo lectura) */}
                                <div style={s.grid2}>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Nombres</label>
                                        <div style={{ ...s.inputWrap, backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}>
                                            <input value={perfil?.nombres || ''} readOnly style={{ ...s.inp, color: 'var(--color-texto-secundario)', cursor: 'not-allowed' }} />
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Apellidos</label>
                                        <div style={{ ...s.inputWrap, backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}>
                                            <input value={perfil?.apellidos || ''} readOnly style={{ ...s.inp, color: 'var(--color-texto-secundario)', cursor: 'not-allowed' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Teléfono (editable) */}
                                <div style={s.campo}>
                                    <label style={s.lbl}>Teléfono celular</label>
                                    <div style={s.inputWrap}>
                                        <FaPhone style={s.icoInp} />
                                        <input
                                            name="telefono"
                                            value={mf.telefono}
                                            onChange={cambiarMf}
                                            placeholder="10 dígitos"
                                            style={s.inp}
                                            maxLength={10}
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.69rem', color: 'var(--color-texto-secundario)', marginTop: 2 }}>
                                        Solo dígitos · 10 caracteres exactos
                                    </span>
                                </div>

                                {/* Correo personal (editable) */}
                                <div style={s.campo}>
                                    <label style={s.lbl}>Correo personal</label>
                                    <div style={s.inputWrap}>
                                        <FaEnvelope style={s.icoInp} />
                                        <input
                                            name="emailPersonal"
                                            type="email"
                                            value={mf.emailPersonal}
                                            onChange={cambiarMf}
                                            placeholder="tucorreo@gmail.com"
                                            style={s.inp}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.69rem', color: 'var(--color-texto-secundario)', marginTop: 2 }}>
                                        No puede ser un correo @espoch.edu.ec
                                    </span>
                                </div>

                                {/* Discapacidad (editable) */}
                                <div style={s.campo}>
                                    <label style={s.lbl}>Discapacidad</label>
                                    <select name="tieneDiscapacidad" value={mf.tieneDiscapacidad} onChange={cambiarMf} style={s.select}>
                                        <option value="">Seleccionar...</option>
                                        <option>No</option>
                                        <option>Sí - Visual</option>
                                        <option>Sí - Auditiva</option>
                                        <option>Sí - Física/Motriz</option>
                                        <option>Sí - Intelectual</option>
                                        <option>Sí - Psicosocial</option>
                                        <option>Sí - Otra</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Sección: descripción profesional ── */}
                            <div style={s.modalSec}>
                                <h3 style={s.modalSecH}>Descripción profesional</h3>
                                <div style={{ ...s.inputWrap, alignItems: 'flex-start', paddingTop: 10 }}>
                                    <textarea name="bio" value={mf.bio} onChange={cambiarMf}
                                        placeholder="Cuéntanos sobre ti..."
                                        style={{ ...s.inp, minHeight: 85, resize: 'vertical' }} maxLength={500} />
                                </div>
                                <div style={{ textAlign: 'right', marginTop: 3 }}>
                                    <span style={{ fontSize: '0.7rem', color: mf.bio.length > 450 ? 'var(--estado-alerta)' : 'var(--color-texto-secundario)' }}>
                                        {mf.bio.length}/500
                                    </span>
                                </div>
                            </div>

                            {/* ── Sección: disponibilidad ── */}
                            <div style={s.modalSec}>
                                <h3 style={s.modalSecH}>Disponibilidad</h3>
                                <select name="disponibilidad" value={mf.disponibilidad} onChange={cambiarMf} style={s.select}>
                                    <option value="disponible">Disponible</option>
                                    <option value="no_disponible">No disponible</option>
                                </select>
                            </div>

                            {/* ── Sección: ubicación actual ── */}
                            <div style={s.modalSec}>
                                <h3 style={s.modalSecH}>
                                    <FaMapMarkerAlt style={{ color: 'var(--color-espoch-rojo)', marginRight: 6, fontSize: '0.85rem' }} />
                                    Ubicación actual
                                </h3>
                                <p style={{ margin: '0 0 10px', fontSize: '0.73rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5 }}>
                                    Indica dónde te encuentras actualmente. Esta información es necesaria para publicar tu perfil.
                                </p>

                                {/* Provincia */}
                                <div style={s.campo}>
                                    <label style={s.lbl}>Provincia *</label>
                                    <select
                                        name="provinciaActual"
                                        value={mf.provinciaActual}
                                        onChange={cambiarMf}
                                        style={s.select}
                                    >
                                        <option value="">Selecciona tu provincia...</option>
                                        {PROVINCIAS_EC.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    {!mf.provinciaActual && (
                                        <span style={{ fontSize: '0.68rem', color: '#f57f17', marginTop: 2 }}>
                                            ⚠ Obligatorio para publicar tu perfil
                                        </span>
                                    )}
                                </div>

                                {/* Cantón */}
                                <div style={s.campo}>
                                    <label style={s.lbl}>Cantón *</label>
                                    <div style={s.inputWrap}>
                                        <input
                                            name="cantonActual"
                                            value={mf.cantonActual}
                                            onChange={cambiarMf}
                                            placeholder="Ej: Riobamba, Ambato, Guayaquil..."
                                            style={s.inp}
                                            maxLength={80}
                                        />
                                    </div>
                                    {!mf.cantonActual && (
                                        <span style={{ fontSize: '0.68rem', color: '#f57f17', marginTop: 2 }}>
                                            ⚠ Obligatorio para publicar tu perfil
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* ── Sección: redes ── */}
                            <div style={s.modalSec}>
                                <h3 style={s.modalSecH}>Redes y portafolio</h3>
                                <div style={s.campo}>
                                    <label style={s.lbl}>GitHub</label>
                                    <div style={s.inputWrap}>
                                        <FaGithub style={s.icoInp} />
                                        <input type="url" name="github" value={mf.github} onChange={cambiarMf} placeholder="https://github.com/tu-usuario" style={s.inp} />
                                    </div>
                                </div>
                                <div style={s.campo}>
                                    <label style={s.lbl}>LinkedIn</label>
                                    <div style={s.inputWrap}>
                                        <FaLinkedin style={s.icoInp} />
                                        <input type="url" name="linkedin" value={mf.linkedin} onChange={cambiarMf} placeholder="https://linkedin.com/in/tu-usuario" style={s.inp} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Sección: visibilidad ── */}
                            {perfil?.tesisVerificada && (
                                <div style={{ ...s.modalSec, borderBottom: 'none', marginBottom: 0 }}>
                                    <h3 style={s.modalSecH}>Visibilidad del perfil</h3>
                                    <div style={s.visRow}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-texto-principal)' }}>
                                                {mf.perfilPublico ? 'Perfil Público' : 'Perfil Privado'}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--color-texto-secundario)' }}>
                                                {mf.perfilPublico ? 'Los clientes pueden encontrarte en el buscador' : 'Solo tú y el administrador pueden verte'}
                                            </p>
                                        </div>
                                        <label style={{ cursor: 'pointer' }}>
                                            <input type="checkbox" name="perfilPublico" checked={mf.perfilPublico} onChange={cambiarMf} style={{ display: 'none' }} />
                                            <div style={{ ...s.swTrack, backgroundColor: mf.perfilPublico ? 'var(--color-espoch-verde)' : '#ccc' }}>
                                                <div style={{ ...s.swThumb, transform: mf.perfilPublico ? 'translateX(22px)' : 'translateX(2px)' }} />
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {!perfil?.tesisVerificada && (
                                <div style={{ ...s.modalSec, borderBottom: 'none', marginBottom: 0 }}>
                                    <h3 style={s.modalSecH}>🌐 Visibilidad del perfil</h3>
                                    <div style={st.visPrivadoAviso}>
                                        <FaLock style={{ color: '#6a1b9a', flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.82rem', color: '#4a0080' }}>
                                                Tu perfil está en modo privado
                                            </p>
                                            <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5 }}>
                                                Para publicarlo, primero verifica tu tesis en el repositorio ESPOCH.
                                                <button onClick={() => { setModalAbierto(false); abrirModalTesis(); }} style={{ background: 'none', border: 'none', color: '#6a1b9a', fontWeight: 700, cursor: 'pointer', padding: '0 4px', textDecoration: 'underline', fontSize: '0.72rem' }}>
                                                    Verificar ahora →
                                                </button>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={s.modalFooter}>
                            <button style={s.btnCancelForm} onClick={() => setModalAbierto(false)}>Cancelar</button>
                            <button style={s.btnSaveForm} onClick={guardarModal} disabled={guardandoModal}>
                                {guardandoModal
                                    ? <><FaSpinner className="spin" style={{ marginRight: 6 }} />Guardando...</>
                                    : <><FaSave style={{ marginRight: 6 }} />Guardar cambios</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MODAL CONFIRMAR ELIMINACIÓN ══ */}
            {modalConfirm.abierto && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) cerrarModalConfirm(); }}>
                    <div style={s.modalConfirm}>
                        <div style={s.modalConfirmIco}>
                            <FaTrash style={{ fontSize: '1.5rem', color: 'var(--estado-error)' }} />
                        </div>
                        <h3 style={s.modalConfirmH}>¿Eliminar {modalConfirm.tipo}?</h3>
                        <p style={s.modalConfirmSub}>
                            Estás a punto de eliminar <strong>"{modalConfirm.titulo}"</strong>. Esta acción no se puede deshacer.
                        </p>
                        <div style={s.modalConfirmBtns}>
                            <button style={s.btnCancelForm} onClick={cerrarModalConfirm}>Cancelar</button>
                            <button style={s.btnEliminarConfirm} onClick={confirmarEliminar}>
                                <FaTrash style={{ marginRight: 6, fontSize: '0.8rem' }} />Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ TOASTS ══ */}
            <div style={s.toastContainer}>
                {toasts.map(t => (
                    <div key={t.id} style={{
                        ...s.toastItem,
                        backgroundColor: t.tipo === 'exito' ? '#e8f5e9' : '#ffebee',
                        color: t.tipo === 'exito' ? 'var(--estado-exito)' : 'var(--estado-error)',
                        border: `1px solid ${t.tipo === 'exito' ? '#c8e6c9' : '#ffcdd2'}`,
                        borderLeft: `4px solid ${t.tipo === 'exito' ? 'var(--estado-exito)' : 'var(--estado-error)'}`,
                    }}>
                        {t.tipo === 'exito'
                            ? <FaCheckCircle style={{ fontSize: '1rem', flexShrink: 0, marginTop: 2 }} />
                            : <FaExclamationTriangle style={{ fontSize: '1rem', flexShrink: 0, marginTop: 2 }} />
                        }
                        <span style={{ flex: 1 }}>{t.msg}</span>
                        <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={s.toastClose}>
                            <FaTimes style={{ fontSize: '0.7rem' }} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════
const s = {
    cargando: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-fondo-web)' },
    spinner: { width: 36, height: 36, border: '4px solid #f0f0f0', borderTop: '4px solid var(--color-espoch-rojo)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    page: { minHeight: '100%', backgroundColor: 'var(--color-fondo-web)', paddingBottom: 48 },
    container: { maxWidth: 1280, margin: '0 auto', padding: '16px 20px 0' },

    banner: { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderLeft: '4px solid #f57f17', borderRadius: 8, padding: '12px 16px', marginBottom: 12 },
    bannerTitulo: { margin: 0, fontWeight: '700', fontSize: '0.87rem', color: 'var(--color-texto-principal)' },
    bannerSub: { margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--color-texto-secundario)' },
    bannerBtn: { padding: '7px 16px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 },

    cabecera: { backgroundColor: 'white', borderTop: '3px solid var(--color-espoch-rojo)', padding: '18px 22px 14px', borderRadius: 10, border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 14 },
    cabeceraTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
    fotoYNombre: { display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 0 },
    fotoWrap: { position: 'relative', cursor: 'pointer', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-espoch-rojo)', flexShrink: 0 },
    fotoImg: { width: '100%', height: '100%', objectFit: 'cover' },
    fotoIcono: { fontSize: 80, color: '#dee2e6', display: 'block' },
    fotoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 26 },
    nombreInfo: { flex: 1, minWidth: 0 },
    nombre: { margin: '0 0 2px', fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    tituloProf: { margin: '0 0 7px', fontSize: '0.78rem', color: 'var(--color-espoch-rojo)', fontWeight: '600' },
    badgesRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
    badge: { padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center' },
    btnEditarCab: { display: 'inline-flex', alignItems: 'center', padding: '7px 14px', backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: 6, color: 'var(--color-texto-secundario)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' },
    btnPublicarCab: { display: 'inline-flex', alignItems: 'center', padding: '7px 14px', backgroundColor: '#f3e8ff', border: '1px solid #ddd6fe', borderRadius: 6, color: '#6a1b9a', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap' },
    progresoArea: { marginBottom: 10 },
    progresoHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
    progresoLbl: { fontSize: '0.72rem', color: 'var(--color-texto-secundario)', fontWeight: '500' },
    progresoTrack: { height: 5, backgroundColor: '#e9ecef', borderRadius: 10, overflow: 'hidden' },
    progresoFill: { height: '100%', borderRadius: 10, transition: 'width 0.4s ease' },
    extras: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    redLink: { display: 'inline-flex', alignItems: 'center', fontSize: '0.74rem', color: 'var(--color-tech-azul)', textDecoration: 'none', fontWeight: '600' },

    body: { display: 'grid', gridTemplateColumns: '240px 1fr 230px', gap: 14, alignItems: 'start' },
    colIzq: { display: 'flex', flexDirection: 'column', gap: 12 },
    colCentro: { display: 'flex', flexDirection: 'column', gap: 12 },
    colDer: { display: 'flex', flexDirection: 'column', gap: 12 },
    consejosSticky: { position: 'sticky', top: 16 },

    card: { backgroundColor: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    cardH: { margin: '0 0 3px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-texto-principal)', display: 'flex', alignItems: 'center', gap: 6 },
    cardIco: { color: 'var(--color-espoch-rojo)', fontSize: '0.85rem' },
    cardSub: { margin: '0 0 10px', fontSize: '0.72rem', color: 'var(--color-texto-secundario)' },
    bioTxt: { margin: 0, fontSize: '0.82rem', color: 'var(--color-texto-principal)', lineHeight: 1.65 },
    linkBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-espoch-rojo)', fontWeight: '600', fontSize: '0.78rem', padding: 0, textDecoration: 'underline' },

    tagsWrap: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 },
    tagTec: { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: 'var(--color-tech-azul-claro)', color: 'var(--color-tech-azul)', padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: '500', border: '1px solid #bee3f8' },
    tagTecSm: { backgroundColor: 'var(--color-tech-azul-claro)', color: 'var(--color-tech-azul)', padding: '2px 6px', borderRadius: 20, fontSize: '0.67rem', fontWeight: '500', border: '1px solid #bee3f8' },
    tagBlanda: { display: 'inline-flex', alignItems: 'center', backgroundColor: '#f3e8ff', color: '#7c3aed', padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: '500', border: '1px solid #ddd6fe' },
    emptySmall: { textAlign: 'center', padding: '8px 0' },
    emptySmallTxt: { margin: 0, fontSize: '0.74rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5 },

    afRow: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 },
    afInfo: { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 85 },
    afNombre: { fontSize: '0.74rem', fontWeight: '600', color: 'var(--color-texto-principal)' },
    afBadge: { fontSize: '0.62rem', fontWeight: '700', padding: '1px 5px', borderRadius: 10, display: 'inline-block' },
    afTrack: { flex: 1, height: 5, backgroundColor: '#e9ecef', borderRadius: 10, overflow: 'hidden' },
    afFill: { height: '100%', borderRadius: 10, transition: 'width 0.4s' },
    afPct: { fontSize: '0.68rem', fontWeight: '700', color: 'var(--color-texto-secundario)', minWidth: 28, textAlign: 'right' },

    secHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
    btnAddSec: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.77rem', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 },
    btnAddSecDisabled: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', backgroundColor: '#e9ecef', color: '#adb5bd', border: 'none', borderRadius: 6, cursor: 'not-allowed', fontSize: '0.77rem', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 },
    btnCancelSec: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer', fontSize: '0.77rem', fontWeight: '600', color: 'var(--color-texto-secundario)', whiteSpace: 'nowrap', flexShrink: 0 },
    limiteAlerta: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: 7, padding: '9px 13px', fontSize: '0.78rem', color: '#6d4c00', marginBottom: 12 },

    formCard: { backgroundColor: 'var(--color-fondo-web)', border: '1px solid #e9ecef', borderRadius: 8, padding: '14px', marginBottom: 14 },
    formH: { margin: '0 0 12px', fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    campo: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 },
    lbl: { fontSize: '0.76rem', fontWeight: '600', color: 'var(--color-texto-principal)' },
    select: { padding: '8px 10px', borderRadius: 6, border: '1px solid #e9ecef', fontSize: '0.83rem', backgroundColor: 'var(--color-fondo-web)', color: 'var(--color-texto-principal)', outline: 'none' },
    inputWrap: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 6, padding: '7px 11px', gap: 8 },
    inp: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.83rem', color: 'var(--color-texto-principal)', fontFamily: 'inherit' },
    icoInp: { fontSize: '0.82rem', color: '#adb5bd', flexShrink: 0 },
    uploadZone: { border: '2px dashed #dee2e6', borderRadius: 8, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', backgroundColor: 'white' },
    uploadTxt: { margin: 0, fontSize: '0.78rem', color: 'var(--color-texto-secundario)', fontWeight: '500' },
    uploadHint: { margin: '2px 0 0', fontSize: '0.68rem', color: '#adb5bd' },
    formFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
    btnCancelForm: { padding: '7px 14px', backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer', fontSize: '0.81rem', fontWeight: '600', color: 'var(--color-texto-secundario)' },
    btnSaveForm: { display: 'inline-flex', alignItems: 'center', padding: '7px 16px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', fontSize: '0.83rem', fontWeight: '600', borderRadius: 6, cursor: 'pointer' },
    btnQuitarImg: { position: 'absolute', top: 6, right: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' },
    guiaBox: { marginTop: 8, backgroundColor: '#f0f7ff', border: '1px solid #bee3f8', borderRadius: 7, padding: '9px 12px' },
    guiaTitulo: { margin: '0 0 6px', fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-tech-azul)' },
    guiaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' },
    guiaItem: { fontSize: '0.7rem', color: '#4a6fa5', lineHeight: 1.45 },

    visRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-fondo-web)', padding: 12, borderRadius: 8 },
    swTrack: { width: 46, height: 26, borderRadius: 13, position: 'relative', transition: 'background-color 0.25s' },
    swThumb: { position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'transform 0.25s' },

    emptyState: { textAlign: 'center', padding: '20px 16px' },
    emptyH: { margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    emptySub: { margin: '0 0 12px', fontSize: '0.76rem', color: 'var(--color-texto-secundario)' },
    emptyBtn: { display: 'inline-flex', alignItems: 'center', padding: '7px 14px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.79rem', fontWeight: '600' },

    proyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10, marginTop: 4 },
    proyCard: { border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden', backgroundColor: 'white' },
    proyImg: { width: '100%', height: 105, objectFit: 'cover' },
    proyImgPlaceholder: { width: '100%', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-fondo-web)', borderBottom: '1px solid #f0f0f0' },
    proyBody: { padding: '10px 12px' },
    proyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
    proyTitulo: { margin: 0, fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-texto-principal)', flex: 1 },
    proyDesc: { margin: '0 0 4px', fontSize: '0.74rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    proyFooter: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, paddingTop: 6, borderTop: '1px solid #f5f5f5' },
    proyMeta: { display: 'inline-flex', alignItems: 'center', fontSize: '0.68rem', color: 'var(--color-texto-secundario)' },
    proyLink: { display: 'inline-flex', alignItems: 'center', fontSize: '0.68rem', color: 'var(--color-tech-azul)', textDecoration: 'none', fontWeight: '600' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', borderRadius: 4, fontSize: '0.78rem' },

    certGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10, marginTop: 4 },
    certCard: { display: 'flex', flexDirection: 'column', border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden', backgroundColor: 'white' },
    certIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#ffebee', border: '1px solid #ffcdd2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    certInfo: { flex: 1, minWidth: 0 },
    certTitulo: { margin: 0, fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    certInst: { margin: '1px 0 0', fontSize: '0.72rem', color: 'var(--color-texto-secundario)' },
    certDesc: { margin: '4px 0 0', fontSize: '0.73rem', color: 'var(--color-texto-principal)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    certFecha: { display: 'inline-flex', alignItems: 'center', margin: 0, fontSize: '0.68rem', color: 'var(--color-texto-secundario)' },
    certUrl: { display: 'inline-flex', alignItems: 'center', fontSize: '0.68rem', color: 'var(--color-tech-azul)', textDecoration: 'none', fontWeight: '600' },
    certImg: { width: '100%', height: 105, objectFit: 'cover' },
    certImgPlaceholder: { width: '100%', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-fondo-web)', borderBottom: '1px solid #f0f0f0' },
    certBody: { padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1 },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' },
    modal: { backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px 13px', borderBottom: '2px solid var(--color-espoch-rojo)', flexShrink: 0 },
    modalTitulo: { margin: 0, fontSize: '0.97rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    modalSub: { margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--color-texto-secundario)' },
    modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-secundario)', fontSize: '0.97rem', padding: 4, display: 'flex', alignItems: 'center' },
    modalBody: { flex: 1, overflowY: 'auto', padding: '14px 20px' },
    modalSec: { marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' },
    modalSecH: { margin: '0 0 10px', fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '11px 20px', borderTop: '1px solid #e9ecef', flexShrink: 0, backgroundColor: 'var(--color-fondo-web)', borderRadius: '0 0 12px 12px' },
    modalConfirm: { backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 390, padding: '32px 28px 24px', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
    modalConfirmIco: { width: 60, height: 60, borderRadius: '50%', backgroundColor: '#ffebee', border: '2px solid #ffcdd2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    modalConfirmH: { margin: '0 0 4px', fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-texto-principal)', textTransform: 'capitalize' },
    modalConfirmSub: { margin: '0 0 20px', fontSize: '0.83rem', color: 'var(--color-texto-secundario)', lineHeight: 1.6, maxWidth: 300 },
    modalConfirmBtns: { display: 'flex', gap: 10, justifyContent: 'center', width: '100%' },
    btnEliminarConfirm: { display: 'inline-flex', alignItems: 'center', padding: '8px 22px', backgroundColor: 'var(--estado-error)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.84rem', fontWeight: '700' },

    toastContainer: { position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 370, pointerEvents: 'none' },
    toastItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, boxShadow: '0 4px 18px rgba(0,0,0,0.13)', fontSize: '0.82rem', fontWeight: '500', lineHeight: 1.5, pointerEvents: 'auto' },
    toastClose: { background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px', opacity: 0.6, display: 'flex', alignItems: 'center', flexShrink: 0, color: 'inherit' },
};

// Estilos panel consejos
const sc = {
    panel: { backgroundColor: 'white', borderRadius: 10, border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' },
    panelHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px 11px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fffbf0' },
    panelIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff8e1', border: '1px solid #ffe082', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    panelTitulo: { margin: 0, fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    panelSub: { margin: '1px 0 0', fontSize: '0.68rem', color: 'var(--color-texto-secundario)' },
    consejosLista: { padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
    consejoItem: { display: 'flex', gap: 9, alignItems: 'flex-start', padding: '9px 10px', borderRadius: 8, border: '1px solid' },
    consejoIcoWrap: { width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    consejoTexto: { flex: 1, minWidth: 0 },
    consejoTitulo: { margin: '0 0 2px', fontSize: '0.72rem', fontWeight: '700' },
    consejoDesc: { margin: 0, fontSize: '0.67rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5 },
    panelPublicar: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', backgroundColor: '#f3e8ff', borderTop: '1px solid #ddd6fe' },
    btnPublicar: { padding: '5px 12px', backgroundColor: '#6a1b9a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 },
    panelFooter: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#fff8e1', borderTop: '1px solid #ffe082' },
    panelFooterTxt: { margin: 0, fontSize: '0.68rem', color: '#6d4c00', lineHeight: 1.4 },
};

// Estilos exclusivos del modal tesis
const st = {
    pasosBar: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderBottom: '1px solid #f0f0f0', backgroundColor: 'var(--color-fondo-web)', flexShrink: 0 },
    paso: { display: 'flex', alignItems: 'center', gap: 6, opacity: 0.45 },
    pasoActivo: { opacity: 1 },
    pasoCirculo: { width: 26, height: 26, borderRadius: '50%', backgroundColor: '#e9ecef', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 },
    pasoCirculoActivo: { backgroundColor: '#6a1b9a', color: 'white' },
    pasoLabel: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-texto-principal)' },
    pasoLinea: { width: 40, height: 2, backgroundColor: '#dee2e6' },
    infoBanner: { display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: '#f3e8ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '10px 14px', marginBottom: 16 },
    verificadoBanner: { display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 8, padding: '12px 14px', marginBottom: 14 },
    terminosBox: { backgroundColor: 'var(--color-fondo-web)', border: '1px solid #e9ecef', borderRadius: 8, padding: '14px', marginBottom: 12, maxHeight: '38vh', overflowY: 'auto', scrollbarWidth: 'thin' },
    terminosBadge: { display: 'inline-block', backgroundColor: '#6a1b9a', color: 'white', fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginBottom: 6 },
    terminosTitulo: { margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-texto-principal)' },
    terminosP: { fontSize: '0.76rem', color: 'var(--color-texto-secundario)', lineHeight: 1.6, margin: '0 0 8px' },
    terminosLista: { fontSize: '0.75rem', color: 'var(--color-texto-secundario)', lineHeight: 1.8, paddingLeft: 18, margin: '0 0 8px' },
    terminosAlerta: { backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6, padding: '8px 12px', fontSize: '0.74rem', color: 'var(--color-texto-principal)', lineHeight: 1.55, margin: '8px 0' },
    consentimientoAviso: { display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#f3e8ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '10px 12px' },
    visPrivadoAviso: { display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: '#f3e8ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '10px 12px' },
};

// Estilos específicos del modal editar perfil
const sm = {
    avisoFijo: { display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#f3e8ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '9px 12px', marginBottom: 12 },
};

export default PerfilGraduado;
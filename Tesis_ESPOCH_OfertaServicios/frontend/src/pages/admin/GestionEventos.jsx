// frontend/src/pages/admin/GestionEventos.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaClock,
    FaMapMarkerAlt, FaFilter, FaNewspaper,
    FaChevronLeft, FaChevronRight, FaTimes, FaSave,
    FaSpinner, FaGlobe, FaVideo, FaUsers, FaLink, FaImage,
    FaBell, FaCheckCircle, FaTimesCircle, FaGraduationCap, FaBuilding,
} from 'react-icons/fa';
import { leerSesion } from '../../utils/storageSeguro';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};
const fmtFecha = (d) => d
    ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
const fmtFechaCorta = (d) => d
    ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const GRADIENTES = [
    'linear-gradient(135deg,#1a237e 0%,#0d47a1 100%)',
    'linear-gradient(135deg,#004d40 0%,#00897b 100%)',
    'linear-gradient(135deg,#4a148c 0%,#8e24aa 100%)',
    'linear-gradient(135deg,#b71c1c 0%,#e53935 100%)',
    'linear-gradient(135deg,#e65100 0%,#f57c00 100%)',
];

const CAT_COLOR = {
    convocatoria: { bg: '#e3f2fd', color: '#1565c0' },
    comunicado: { bg: '#fff8e1', color: '#f57f17' },
    logro: { bg: '#e8f5e9', color: '#2e7d32' },
    evento: { bg: '#f3e8ff', color: '#6a1b9a' },
    oportunidad_laboral: { bg: '#ffebee', color: '#c62828' },
};
const CAT_LABEL = {
    convocatoria: 'Convocatoria', comunicado: 'Comunicado',
    logro: 'Logro', evento: 'Evento', oportunidad_laboral: 'Oportunidad Laboral',
};
const EST_COLOR = {
    programado: { bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb', label: 'Programado' },
    en_curso: { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9', label: 'En curso' },
    finalizado: { bg: '#f5f5f5', color: '#757575', border: '#e0e0e0', label: 'Finalizado' },
    cancelado: { bg: '#ffebee', color: '#c62828', border: '#ffcdd2', label: 'Cancelado' },
};
const MOD_ICON = { presencial: FaMapMarkerAlt, virtual: FaVideo, hibrida: FaLink };

const LIMIT = 10;

/* ═══════════════════════════════════════════════════════════ */
const GestionEventos = () => {

    /* ── Eventos vigentes (carrusel) ─────────────────────── */
    const [eventosVigentes, setEventosVigentes] = useState([]);
    const [cargandoVig, setCargandoVig] = useState(true);
    const [slide, setSlide] = useState(0);
    const intervalRef = useRef(null);

    /* ── Historial eventos (paginado 10) ─────────────────── */
    const [histEventos, setHistEventos] = useState([]);
    const [totalHistEv, setTotalHistEv] = useState(0);
    const [paginaHistEv, setPaginaHistEv] = useState(1);
    const [totalPagsHistEv, setTotalPagsHistEv] = useState(1);
    const [cargandoHistEv, setCargandoHistEv] = useState(false);

    /* ── Noticias (paginado 10) ──────────────────────────── */
    const [noticias, setNoticias] = useState([]);
    const [totalNot, setTotalNot] = useState(0);
    const [paginaNot, setPaginaNot] = useState(1);
    const [totalPagsNot, setTotalPagsNot] = useState(1);
    const [cargandoNot, setCargandoNot] = useState(true);
    const [filtroNot, setFiltroNot] = useState('');

    /* ── Modal crear/editar ──────────────────────────────── */
    const [modal, setModal] = useState(false);
    const [tipoModal, setTipoModal] = useState('evento');
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [errModal, setErrModal] = useState('');
    const [imgFile, setImgFile] = useState(null);
    const [imgPreview, setImgPreview] = useState(null);
    const [imgExistente, setImgExistente] = useState('');
    const imgRef = useRef(null);

    /* Formulario Evento */
    const EVF0 = { titulo: '', descripcion: '', tipo: 'webinar', fechaInicio: '', fechaFin: '', modalidad: 'virtual', urlAcceso: '', lugar: '', capacidadMaxima: '' };
    const [fev, setFev] = useState(EVF0);

    /* Formulario Noticia */
    const NF0 = { titulo: '', contenido: '', resumen: '', categoria: 'comunicado', estado: 'borrador' };
    const [fnot, setFnot] = useState(NF0);

    /* ── Confirmar eliminar ──────────────────────────────── */
    const [confirmar, setConfirmar] = useState({ abierto: false, tipo: '', id: '', titulo: '' });
    const [eliminando, setEliminando] = useState(false);

    /* ── Notificar evento ────────────────────────────────── */
    const [notifConfirm, setNotifConfirm] = useState({ abierto: false, evento: null });
    const [notifCargando, setNotifCargando] = useState(false);
    const [notifResultado, setNotifResultado] = useState(null); // null | { resumen, titulo }

    /* ══════════════════════════════════════════════════════
       CARGA DE DATOS
    ══════════════════════════════════════════════════════ */
    const cargarVigentes = useCallback(async () => {
        setCargandoVig(true);
        try {
            const res = await axios.get(`${API}/eventos?estado=vigente&limit=100`, { headers: hdrs() });
            setEventosVigentes(res.data.eventos || []);
            setSlide(0);
        } catch { /* silencioso */ }
        finally { setCargandoVig(false); }
    }, []);

    const cargarHistEventos = useCallback(async (pag = 1) => {
        setCargandoHistEv(true);
        try {
            const res = await axios.get(`${API}/eventos?estado=historial&page=${pag}&limit=${LIMIT}`, { headers: hdrs() });
            setHistEventos(res.data.eventos || []);
            setTotalHistEv(res.data.total || 0);
            setTotalPagsHistEv(res.data.totalPaginas || 1);
        } catch { /* silencioso */ }
        finally { setCargandoHistEv(false); }
    }, []);

    const cargarNoticias = useCallback(async (pag = 1, est = '') => {
        setCargandoNot(true);
        try {
            const p = new URLSearchParams({ page: pag, limit: LIMIT });
            if (est) p.append('estado', est);
            const res = await axios.get(`${API}/noticias?${p}`, { headers: hdrs() });
            setNoticias(res.data.noticias || []);
            setTotalNot(res.data.total || 0);
            setTotalPagsNot(res.data.totalPaginas || 1);
        } catch { /* silencioso */ }
        finally { setCargandoNot(false); }
    }, []);

    useEffect(() => {
        cargarVigentes();
        cargarHistEventos(1);
        cargarNoticias(1);
    }, [cargarVigentes, cargarHistEventos, cargarNoticias]);

    /* ══════════════════════════════════════════════════════
       CARRUSEL
    ══════════════════════════════════════════════════════ */
    const totalSlides = Math.max(1, Math.ceil(eventosVigentes.length / 3));
    const eventosSlide = eventosVigentes.slice(slide * 3, slide * 3 + 3);

    useEffect(() => {
        if (eventosVigentes.length <= 3) return;
        intervalRef.current = setInterval(() => {
            setSlide(s => (s + 1) % totalSlides);
        }, 4000);
        return () => clearInterval(intervalRef.current);
    }, [eventosVigentes.length, totalSlides]);

    const prevSlide = () => { clearInterval(intervalRef.current); setSlide(s => (s - 1 + totalSlides) % totalSlides); };
    const nextSlide = () => { clearInterval(intervalRef.current); setSlide(s => (s + 1) % totalSlides); };

    /* ══════════════════════════════════════════════════════
       PAGINADORES
    ══════════════════════════════════════════════════════ */
    const irPagHistEv = (p) => { setPaginaHistEv(p); cargarHistEventos(p); };
    const irPagNot = (p) => { setPaginaNot(p); cargarNoticias(p, filtroNot); };

    const Paginador = ({ pagina, totalPags, onIr }) => {
        if (totalPags <= 1) return null;
        const ini = Math.max(1, pagina - 2);
        const fin = Math.min(totalPags, ini + 4);
        const pags = Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
        return (
            <div style={s.pagRow}>
                <button style={{ ...s.pagBtn, opacity: pagina === 1 ? 0.4 : 1 }}
                    onClick={() => onIr(pagina - 1)} disabled={pagina === 1}>
                    <FaChevronLeft style={{ fontSize: '0.6rem' }} />
                </button>
                {ini > 1 && <span style={s.pagPuntos}>···</span>}
                {pags.map(p => (
                    <button key={p} style={{
                        ...s.pagBtn,
                        background: p === pagina ? 'var(--color-espoch-rojo)' : 'white',
                        color: p === pagina ? 'white' : '#6c757d',
                        border: p === pagina ? '1px solid var(--color-espoch-rojo)' : '1px solid #e9ecef',
                        fontWeight: p === pagina ? '700' : '400',
                    }} onClick={() => onIr(p)}>{p}</button>
                ))}
                {fin < totalPags && <span style={s.pagPuntos}>···</span>}
                <button style={{ ...s.pagBtn, opacity: pagina === totalPags ? 0.4 : 1 }}
                    onClick={() => onIr(pagina + 1)} disabled={pagina === totalPags}>
                    <FaChevronRight style={{ fontSize: '0.6rem' }} />
                </button>
            </div>
        );
    };

    /* ══════════════════════════════════════════════════════
       FORMULARIO — HELPERS
    ══════════════════════════════════════════════════════ */
    const resetForms = () => {
        setEditId(null); setImgFile(null); setImgPreview(null); setImgExistente(''); setErrModal('');
        setFev(EVF0); setFnot(NF0);
        if (imgRef.current) imgRef.current.value = '';
    };

    const handleImgChange = (e) => {
        const f = e.target.files[0] || null;
        setImgFile(f);
        setImgPreview(f ? URL.createObjectURL(f) : (imgExistente ? (imgExistente.startsWith('http') ? imgExistente : `${BASE}/${imgExistente}`) : null));
    };

    const quitarImagen = () => {
        setImgFile(null);
        setImgPreview(imgExistente ? (imgExistente.startsWith('http') ? imgExistente : `${BASE}/${imgExistente}`) : null);
        if (imgRef.current) imgRef.current.value = '';
    };

    /* ── Validaciones ────────────────────────────────────── */
    const validarEvento = () => {
        if (!fev.titulo.trim()) return 'El campo "Título" es obligatorio.';
        if (!fev.tipo) return 'El campo "Tipo" es obligatorio.';
        if (!fev.fechaInicio) return 'El campo "Fecha y hora inicio" es obligatorio.';
        if (!fev.fechaFin) return 'El campo "Fecha y hora fin" es obligatorio.';
        if (new Date(fev.fechaFin) <= new Date(fev.fechaInicio))
            return 'La fecha de fin debe ser posterior a la de inicio.';
        if (!fev.modalidad) return 'El campo "Modalidad" es obligatorio.';
        if ((fev.modalidad === 'virtual' || fev.modalidad === 'hibrida') && !fev.urlAcceso.trim())
            return 'El campo "URL de acceso" es obligatorio para modalidad virtual o híbrida.';
        if ((fev.modalidad === 'presencial' || fev.modalidad === 'hibrida') && !fev.lugar.trim())
            return 'El campo "Lugar" es obligatorio para modalidad presencial o híbrida.';
        return null;
    };

    const validarNoticia = () => {
        if (!fnot.titulo.trim()) return 'El campo "Título" es obligatorio.';
        if (!fnot.contenido.trim()) return 'El campo "Contenido" es obligatorio.';
        if (!fnot.categoria) return 'El campo "Categoría" es obligatorio.';
        return null;
    };

    /* ── Guardar evento ──────────────────────────────────── */
    const guardarEvento = async () => {
        const err = validarEvento(); if (err) { setErrModal(err); return; }
        setGuardando(true); setErrModal('');
        try {
            const fd = new FormData();
            Object.entries(fev).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
            if (imgFile) fd.append('imagen', imgFile);
            const url = editId ? `${API}/eventos/${editId}` : `${API}/eventos`;
            await axios[editId ? 'put' : 'post'](url, fd, { headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' } });
            setModal(false); resetForms();
            cargarVigentes(); cargarHistEventos(paginaHistEv);
        } catch (e) { setErrModal(e.response?.data?.msg || 'Error al guardar evento.'); }
        finally { setGuardando(false); }
    };

    /* ── Guardar noticia ─────────────────────────────────── */
    const guardarNoticia = async () => {
        const err = validarNoticia(); if (err) { setErrModal(err); return; }
        setGuardando(true); setErrModal('');
        try {
            const fd = new FormData();
            Object.entries(fnot).forEach(([k, v]) => fd.append(k, v));
            if (imgFile) fd.append('imagen', imgFile);
            const url = editId ? `${API}/noticias/${editId}` : `${API}/noticias`;
            await axios[editId ? 'put' : 'post'](url, fd, { headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' } });
            setModal(false); resetForms(); cargarNoticias(paginaNot, filtroNot);
        } catch (e) { setErrModal(e.response?.data?.msg || 'Error al guardar noticia.'); }
        finally { setGuardando(false); }
    };

    /* ── Eliminar ────────────────────────────────────────── */
    const confirmarEliminar = async () => {
        setEliminando(true);
        try {
            const url = confirmar.tipo === 'evento' ? `${API}/eventos/${confirmar.id}` : `${API}/noticias/${confirmar.id}`;
            await axios.delete(url, { headers: hdrs() });
            setConfirmar({ abierto: false, tipo: '', id: '', titulo: '' });
            if (confirmar.tipo === 'evento') { cargarVigentes(); cargarHistEventos(paginaHistEv); }
            else cargarNoticias(paginaNot, filtroNot);
        } catch { /* silencioso */ }
        finally { setEliminando(false); }
    };

    /* ── Abrir editar evento ─────────────────────────────── */
    const editarEvento = (ev) => {
        setTipoModal('evento'); setEditId(ev._id);
        setFev({
            titulo: ev.titulo, descripcion: ev.descripcion || '', tipo: ev.tipo,
            fechaInicio: ev.fechaInicio?.substring(0, 16) || '',
            fechaFin: ev.fechaFin?.substring(0, 16) || '',
            modalidad: ev.modalidad, urlAcceso: ev.urlAcceso || '',
            lugar: ev.lugar || '', capacidadMaxima: ev.capacidadMaxima || '',
        });
        const r = ev.imagen || '';
        setImgExistente(r); setImgPreview(r ? (r.startsWith('http') ? r : `${BASE}/${r}`) : null);
        setImgFile(null); setErrModal(''); setModal(true);
        if (imgRef.current) imgRef.current.value = '';
    };

    /* ── Abrir editar noticia ────────────────────────────── */
    const editarNoticia = (n) => {
        setTipoModal('noticia'); setEditId(n._id);
        setFnot({ titulo: n.titulo, contenido: n.contenido, resumen: n.resumen || '', categoria: n.categoria, estado: n.estado });
        const r = n.imagen || '';
        setImgExistente(r); setImgPreview(r ? (r.startsWith('http') ? r : `${BASE}/${r}`) : null);
        setImgFile(null); setErrModal(''); setModal(true);
        if (imgRef.current) imgRef.current.value = '';
    };

    /* ── Notificar evento ────────────────────────────────── */
    const abrirNotifConfirm = (ev) => {
        setNotifConfirm({ abierto: true, evento: ev });
    };

    const ejecutarNotificacion = async () => {
        if (!notifConfirm.evento) return;
        setNotifCargando(true);
        try {
            const res = await axios.post(
                `${API}/eventos/${notifConfirm.evento._id}/notificar`,
                {},
                { headers: hdrs() }
            );
            setNotifConfirm({ abierto: false, evento: null });
            setNotifResultado({
                titulo: notifConfirm.evento.titulo,
                resumen: res.data.resumen,
            });
        } catch (e) {
            setNotifConfirm({ abierto: false, evento: null });
            setNotifResultado({
                titulo: notifConfirm.evento?.titulo || 'Evento',
                error: e.response?.data?.msg || 'Error al enviar notificaciones.',
            });
        } finally {
            setNotifCargando(false);
        }
    };

    /* ── Puede notificar: solo si NO está finalizado ni cancelado ── */
    const puedeNotificar = (ev) =>
        ev.estado !== 'finalizado' && ev.estado !== 'cancelado';

    /* ══════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════ */
    return (
        <div style={s.page}>

            {/* ═══ HEADER ═══ */}
            <div style={s.header}>
                <div>
                    <h1 style={s.headerTit}>Administra la agenda institucional y las noticias para la comunidad de graduados</h1>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ ...s.btnNuevo, background: '#1976d2' }}
                        onClick={() => { setTipoModal('noticia'); resetForms(); setModal(true); }}>
                        <FaPlus style={{ fontSize: '0.75rem' }} /> Nueva Noticia
                    </button>
                    <button style={s.btnNuevo}
                        onClick={() => { setTipoModal('evento'); resetForms(); setModal(true); }}>
                        <FaPlus style={{ fontSize: '0.75rem' }} /> Nuevo Evento
                    </button>
                </div>
            </div>

            {/* ═══ EVENTOS VIGENTES — CARRUSEL ═══ */}
            <section>
                <div style={s.secHead}>
                    <h2 style={s.secTit}>
                        <FaCalendarAlt style={{ color: 'var(--color-espoch-rojo)', fontSize: '0.95rem' }} />
                        Eventos Vigentes
                        {eventosVigentes.length > 0 &&
                            <span style={s.contadorBadge}>{eventosVigentes.length}</span>
                        }
                    </h2>
                    {totalSlides > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={s.slideInfo}>{slide + 1} / {totalSlides}</span>
                            <button style={s.slidBtn} onClick={prevSlide}><FaChevronLeft style={{ fontSize: '0.65rem' }} /></button>
                            <button style={s.slidBtn} onClick={nextSlide}><FaChevronRight style={{ fontSize: '0.65rem' }} /></button>
                        </div>
                    )}
                </div>

                {cargandoVig ? (
                    <div style={s.cargandoArea}><FaSpinner style={{ fontSize: '1.5rem', color: '#adb5bd' }} /></div>
                ) : eventosVigentes.length === 0 ? (
                    <div style={s.emptyCard}>
                        <FaCalendarAlt style={{ fontSize: '2rem', color: '#dee2e6', marginBottom: 8 }} />
                        <p style={s.emptyTit}>No hay eventos vigentes</p>
                        <p style={s.emptySub}>Los eventos programados o en curso aparecerán aquí como carrusel.</p>
                    </div>
                ) : (
                    <>
                        <div style={s.eventosGrid}>
                            {eventosSlide.map((ev, idx) => {
                                const bEst = EST_COLOR[ev.estado] || EST_COLOR.programado;
                                const ModIc = MOD_ICON[ev.modalidad] || FaGlobe;
                                const puedeNot = puedeNotificar(ev);
                                return (
                                    <div key={ev._id} style={s.eventoCard}>
                                        <div style={{
                                            ...s.eventoImg,
                                            background: ev.imagen
                                                ? `url(${ev.imagen.startsWith('http') ? ev.imagen : BASE + '/' + ev.imagen}) center/cover`
                                                : GRADIENTES[(slide * 3 + idx) % GRADIENTES.length],
                                        }}>
                                            <span style={{ ...s.badgeEst, background: bEst.bg, color: bEst.color, border: `1px solid ${bEst.border}` }}>
                                                {bEst.label.toUpperCase()}
                                            </span>
                                            <div style={s.eventoImgOverlay} />
                                        </div>
                                        <div style={s.eventoBody}>
                                            <div style={s.eventoFechaRow}>
                                                <FaClock style={{ fontSize: '0.62rem', color: '#adb5bd' }} />
                                                <span style={s.eventoFecha}>{fmtFecha(ev.fechaInicio)}</span>
                                            </div>
                                            <p style={s.eventoTit}>{ev.titulo}</p>
                                            <p style={s.eventoDesc}>{ev.descripcion || '—'}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <ModIc style={{ fontSize: '0.65rem', color: '#adb5bd' }} />
                                                <span style={s.eventoLugarTxt}>
                                                    {ev.modalidad === 'virtual'
                                                        ? (ev.urlAcceso || 'Enlace virtual')
                                                        : ev.modalidad === 'hibrida'
                                                            ? `${ev.lugar || ''}${ev.lugar && ev.urlAcceso ? ' · ' : ''}${ev.urlAcceso || ''}`
                                                            : (ev.lugar || '—')
                                                    }
                                                </span>
                                            </div>
                                            {ev.capacidadMaxima > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <FaUsers style={{ fontSize: '0.62rem', color: '#adb5bd' }} />
                                                    <span style={s.eventoLugarTxt}>{ev.inscritos} / {ev.capacidadMaxima} inscritos</span>
                                                </div>
                                            )}
                                            <div style={s.eventoFooter}>
                                                <button style={s.btnGestionar} onClick={() => editarEvento(ev)}>Gestionar</button>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {/* ── Botón notificar (campana) ── */}
                                                    {puedeNot && (
                                                        <button
                                                            style={s.btnCampana}
                                                            onClick={() => abrirNotifConfirm(ev)}
                                                            title="Notificar a graduados y empleadores"
                                                        >
                                                            <FaBell style={{ fontSize: '0.65rem' }} />
                                                        </button>
                                                    )}
                                                    {/* ── Botón eliminar ── */}
                                                    <button
                                                        style={{ ...s.btnAccSm, color: '#c62828', background: '#ffebee', border: '1px solid #ffcdd2' }}
                                                        onClick={() => setConfirmar({ abierto: true, tipo: 'evento', id: ev._id, titulo: ev.titulo })}
                                                    >
                                                        <FaTrash style={{ fontSize: '0.65rem' }} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalSlides > 1 && (
                            <div style={s.dotsRow}>
                                {Array.from({ length: totalSlides }).map((_, i) => (
                                    <div key={i}
                                        onClick={() => { clearInterval(intervalRef.current); setSlide(i); }}
                                        style={{
                                            width: i === slide ? 20 : 7, height: 7, borderRadius: 4,
                                            background: i === slide ? 'var(--color-espoch-rojo)' : '#dee2e6',
                                            cursor: 'pointer', transition: 'all 0.3s',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ═══ HISTORIAL EVENTOS ═══ */}
            <section>
                <div style={s.secHead}>
                    <h2 style={s.secTit}>
                        <FaCalendarAlt style={{ color: '#adb5bd', fontSize: '0.9rem' }} />
                        Historial de Eventos
                        {totalHistEv > 0 && <span style={{ ...s.contadorBadge, background: '#f5f5f5', color: '#757575' }}>{totalHistEv}</span>}
                    </h2>
                </div>
                <div style={s.card}>
                    <table style={s.tabla}>
                        <thead>
                            <tr style={s.trHead}>
                                <th style={s.th}>TÍTULO</th>
                                <th style={s.th}>TIPO</th>
                                <th style={s.th}>FECHA INICIO</th>
                                <th style={s.th}>MODALIDAD</th>
                                <th style={{ ...s.th, textAlign: 'center' }}>ESTADO</th>
                                <th style={{ ...s.th, textAlign: 'center' }}>ACC.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargandoHistEv
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                                        <td key={j} style={s.td}><div style={{ height: 11, borderRadius: 5, background: '#f0f0f0', width: j === 0 ? '70%' : '50%' }} /></td>
                                    ))}</tr>
                                ))
                                : histEventos.length === 0
                                    ? <tr><td colSpan={6} style={s.tdVacio}>No hay eventos en el historial.</td></tr>
                                    : histEventos.map(ev => {
                                        const bEst = EST_COLOR[ev.estado] || EST_COLOR.finalizado;
                                        return (
                                            <tr key={ev._id} style={s.trBody}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={s.td}><span style={s.noticiaTit}>{ev.titulo}</span></td>
                                                <td style={s.td}><span style={{ ...s.catBadge, background: '#f3e8ff', color: '#6a1b9a' }}>{ev.tipo}</span></td>
                                                <td style={s.td}><span style={s.fechaTxt}>{fmtFechaCorta(ev.fechaInicio)}</span></td>
                                                <td style={s.td}><span style={s.fechaTxt}>{ev.modalidad}</span></td>
                                                <td style={{ ...s.td, textAlign: 'center' }}>
                                                    <span style={{ ...s.visBadge, background: bEst.bg, color: bEst.color, border: `1px solid ${bEst.border}` }}>
                                                        {bEst.label}
                                                    </span>
                                                </td>
                                                <td style={{ ...s.td, textAlign: 'center' }}>
                                                    <button style={{ ...s.btnAccSm, color: '#c62828', background: '#ffebee', border: '1px solid #ffcdd2' }}
                                                        onClick={() => setConfirmar({ abierto: true, tipo: 'evento', id: ev._id, titulo: ev.titulo })}>
                                                        <FaTrash style={{ fontSize: '0.65rem' }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                            }
                        </tbody>
                    </table>
                    {!cargandoHistEv && histEventos.length > 0 && (
                        <div style={s.footTabla}>
                            <p style={s.contadorTxt}>
                                Mostrando {(paginaHistEv - 1) * LIMIT + 1}–{Math.min(paginaHistEv * LIMIT, totalHistEv)} de {totalHistEv} eventos
                            </p>
                            <Paginador pagina={paginaHistEv} totalPags={totalPagsHistEv} onIr={irPagHistEv} />
                        </div>
                    )}
                </div>
            </section>

            {/* ═══ HISTORIAL NOTICIAS ═══ */}
            <section>
                <div style={s.secHead}>
                    <h2 style={s.secTit}>
                        <FaNewspaper style={{ color: 'var(--color-espoch-rojo)', fontSize: '0.95rem' }} />
                        Historial de Noticias y Publicaciones
                        {totalNot > 0 && <span style={s.contadorBadge}>{totalNot}</span>}
                    </h2>
                    <div style={s.selectWrap}>
                        <FaFilter style={{ fontSize: '0.58rem', color: '#adb5bd' }} />
                        <select value={filtroNot}
                            onChange={e => { setFiltroNot(e.target.value); setPaginaNot(1); cargarNoticias(1, e.target.value); }}
                            style={s.selectEl}>
                            <option value="">Todos los estados</option>
                            <option value="borrador">Borrador</option>
                            <option value="publicada">Publicadas</option>
                            <option value="archivada">Archivadas</option>
                        </select>
                    </div>
                </div>
                <div style={s.card}>
                    <table style={s.tabla}>
                        <thead>
                            <tr style={s.trHead}>
                                <th style={{ ...s.th, width: 60 }}>FOTO</th>
                                <th style={{ ...s.th, width: 100 }}>FECHA</th>
                                <th style={s.th}>TÍTULO DE LA NOTICIA</th>
                                <th style={{ ...s.th, width: 150 }}>AUTOR</th>
                                <th style={{ ...s.th, width: 110, textAlign: 'center' }}>VISIBILIDAD</th>
                                <th style={{ ...s.th, width: 90, textAlign: 'center' }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargandoNot
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                                        <td key={j} style={s.td}><div style={{ height: 11, borderRadius: 5, background: '#f0f0f0', width: j === 2 ? '75%' : '50%' }} /></td>
                                    ))}</tr>
                                ))
                                : noticias.length === 0
                                    ? <tr><td colSpan={6} style={s.tdVacio}>No hay noticias registradas.</td></tr>
                                    : noticias.map(n => {
                                        const cat = CAT_COLOR[n.categoria] || { bg: '#f5f5f5', color: '#757575' };
                                        const nom = n.autor?.nombre || 'Admin';
                                        const ini = nom.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                                        return (
                                            <tr key={n._id} style={s.trBody}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={s.td}>
                                                    {n.imagen
                                                        ? <img src={n.imagen?.startsWith('http') ? n.imagen : `${BASE}/${n.imagen}`} alt={n.titulo} style={s.miniatura}
                                                            onError={e => { e.target.style.display = 'none'; }} />
                                                        : <div style={s.miniaturaPlaceholder}><FaImage style={{ fontSize: '0.85rem', color: '#ced4da' }} /></div>
                                                    }
                                                </td>
                                                <td style={s.td}><span style={s.fechaTxt}>{fmtFechaCorta(n.createdAt)}</span></td>
                                                <td style={s.td}>
                                                    <p style={s.noticiaTit}>{n.titulo}</p>
                                                    <span style={{ ...s.catBadge, background: cat.bg, color: cat.color }}>
                                                        {CAT_LABEL[n.categoria] || n.categoria}
                                                    </span>
                                                </td>
                                                <td style={s.td}>
                                                    <div style={s.autorCell}>
                                                        <div style={{ ...s.autorAvatar, background: 'var(--color-espoch-rojo)' }}>{ini}</div>
                                                        <span style={s.autorNom}>{nom}</span>
                                                    </div>
                                                </td>
                                                <td style={{ ...s.td, textAlign: 'center' }}>
                                                    <span style={{
                                                        ...s.visBadge,
                                                        background: n.estado === 'publicada' ? '#e8f5e9' : n.estado === 'borrador' ? '#fff8e1' : '#f5f5f5',
                                                        color: n.estado === 'publicada' ? '#2e7d32' : n.estado === 'borrador' ? '#f57f17' : '#757575',
                                                        border: `1px solid ${n.estado === 'publicada' ? '#c8e6c9' : n.estado === 'borrador' ? '#ffe082' : '#e0e0e0'}`,
                                                    }}>
                                                        {n.estado.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ ...s.td, textAlign: 'center' }}>
                                                    <div style={s.accsRow}>
                                                        <button style={s.btnAcc} onClick={() => editarNoticia(n)} title="Editar">
                                                            <FaEdit style={{ fontSize: '0.7rem' }} />
                                                        </button>
                                                        <button style={{ ...s.btnAcc, color: '#c62828', background: '#ffebee', border: '1px solid #ffcdd2' }}
                                                            onClick={() => setConfirmar({ abierto: true, tipo: 'noticia', id: n._id, titulo: n.titulo })}
                                                            title="Eliminar">
                                                            <FaTrash style={{ fontSize: '0.7rem' }} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                            }
                        </tbody>
                    </table>
                    {!cargandoNot && noticias.length > 0 && (
                        <div style={s.footTabla}>
                            <p style={s.contadorTxt}>
                                Mostrando {(paginaNot - 1) * LIMIT + 1}–{Math.min(paginaNot * LIMIT, totalNot)} de {totalNot} noticias
                            </p>
                            <Paginador pagina={paginaNot} totalPags={totalPagsNot} onIr={irPagNot} />
                        </div>
                    )}
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                MODAL CREAR / EDITAR
            ══════════════════════════════════════════════════════ */}
            {modal && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setModal(false); resetForms(); } }}>
                    <div style={{ ...s.modal, maxWidth: tipoModal === 'noticia' ? 600 : 580 }}>
                        <div style={{ ...s.modalHead, borderColor: tipoModal === 'noticia' ? '#1976d2' : 'var(--color-espoch-rojo)' }}>
                            <div>
                                <h2 style={s.modalTit}>{editId ? 'Editar' : 'Nuevo'} {tipoModal === 'evento' ? 'Evento' : 'Noticia'}</h2>
                                <p style={s.modalSub}>
                                    {tipoModal === 'evento'
                                        ? 'Res. 018.CP.2025 · Art. 58-60 · Actividades de fortalecimiento profesional'
                                        : 'Comunicados e información para la comunidad de graduados'}
                                </p>
                            </div>
                            <button style={s.modalClose} onClick={() => { setModal(false); resetForms(); }}>
                                <FaTimes style={{ fontSize: '0.85rem' }} />
                            </button>
                        </div>
                        <div style={s.modalBody}>
                            {errModal && <div style={s.errMsg}>⚠️ {errModal}</div>}

                            {/* ══ FORM EVENTO ══ */}
                            {tipoModal === 'evento' && (
                                <>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Título *</label>
                                        <input value={fev.titulo} onChange={e => setFev(p => ({ ...p, titulo: e.target.value }))}
                                            style={s.inp} placeholder="Ej: Webinar sobre Tendencias en IA" />
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Descripción</label>
                                        <textarea value={fev.descripcion} onChange={e => setFev(p => ({ ...p, descripcion: e.target.value }))}
                                            style={{ ...s.inp, minHeight: 75, resize: 'vertical' }} placeholder="Descripción del evento..." />
                                    </div>
                                    <div style={s.grid2}>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Tipo *</label>
                                            <select value={fev.tipo} onChange={e => setFev(p => ({ ...p, tipo: e.target.value }))} style={s.inp}>
                                                <option value="webinar">Webinar</option>
                                                <option value="encuentro">Encuentro</option>
                                                <option value="seminario">Seminario</option>
                                                <option value="curso">Curso</option>
                                            </select>
                                        </div>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Modalidad *</label>
                                            <select value={fev.modalidad} onChange={e => setFev(p => ({ ...p, modalidad: e.target.value }))} style={s.inp}>
                                                <option value="virtual">Virtual</option>
                                                <option value="presencial">Presencial</option>
                                                <option value="hibrida">Híbrida</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={s.grid2}>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Fecha y hora inicio *</label>
                                            <input type="datetime-local" value={fev.fechaInicio}
                                                onChange={e => setFev(p => ({ ...p, fechaInicio: e.target.value }))} style={s.inp} />
                                        </div>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Fecha y hora fin *</label>
                                            <input type="datetime-local" value={fev.fechaFin}
                                                onChange={e => setFev(p => ({ ...p, fechaFin: e.target.value }))} style={s.inp} />
                                        </div>
                                    </div>
                                    {fev.modalidad === 'virtual' && (
                                        <div style={s.campo}>
                                            <label style={s.lbl}>URL de acceso * <span style={s.modTag}>Virtual</span></label>
                                            <input value={fev.urlAcceso} onChange={e => setFev(p => ({ ...p, urlAcceso: e.target.value }))}
                                                style={s.inp} placeholder="https://zoom.us/j/..." />
                                        </div>
                                    )}
                                    {fev.modalidad === 'presencial' && (
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Lugar * <span style={s.modTag}>Presencial</span></label>
                                            <input value={fev.lugar} onChange={e => setFev(p => ({ ...p, lugar: e.target.value }))}
                                                style={s.inp} placeholder="Ej: Auditorio Principal ESPOCH" />
                                        </div>
                                    )}
                                    {fev.modalidad === 'hibrida' && (
                                        <div style={s.hibridaBox}>
                                            <p style={s.hibridaLabel}>🔀 Modalidad Híbrida — completa ambos campos</p>
                                            <div style={s.grid2}>
                                                <div style={s.campo}>
                                                    <label style={s.lbl}>Lugar * <span style={s.modTag}>Presencial</span></label>
                                                    <input value={fev.lugar} onChange={e => setFev(p => ({ ...p, lugar: e.target.value }))}
                                                        style={s.inp} placeholder="Auditorio ESPOCH" />
                                                </div>
                                                <div style={s.campo}>
                                                    <label style={s.lbl}>URL de acceso * <span style={s.modTag}>Virtual</span></label>
                                                    <input value={fev.urlAcceso} onChange={e => setFev(p => ({ ...p, urlAcceso: e.target.value }))}
                                                        style={s.inp} placeholder="https://zoom.us/..." />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Capacidad máxima <span style={{ fontWeight: '400', color: '#adb5bd' }}>(0 = sin límite)</span></label>
                                        <input type="number" value={fev.capacidadMaxima}
                                            onChange={e => setFev(p => ({ ...p, capacidadMaxima: e.target.value }))}
                                            style={s.inp} placeholder="0" min={0} />
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Imagen de portada (opcional)</label>
                                        {imgPreview && (
                                            <div style={{ position: 'relative', marginBottom: 8 }}>
                                                <img src={imgPreview} alt="preview"
                                                    style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 7, border: '1px solid #e9ecef' }} />
                                                <button type="button" onClick={quitarImagen}
                                                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: '0.7rem' }}>
                                                    <FaTimes style={{ fontSize: '0.6rem' }} /> Quitar
                                                </button>
                                            </div>
                                        )}
                                        <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp"
                                            onChange={handleImgChange} style={{ fontSize: '0.77rem', color: '#6c757d' }} />
                                        {imgExistente && !imgFile && (
                                            <span style={{ fontSize: '0.68rem', color: '#2e7d32' }}>✓ Imagen actual — sube una nueva para reemplazarla</span>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ══ FORM NOTICIA ══ */}
                            {tipoModal === 'noticia' && (
                                <>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Título * <span style={{ fontWeight: '400', color: '#adb5bd' }}>(máx 200)</span></label>
                                        <input value={fnot.titulo} onChange={e => setFnot(p => ({ ...p, titulo: e.target.value }))}
                                            style={s.inp} placeholder="Título de la noticia" maxLength={200} />
                                        <span style={{ fontSize: '0.67rem', color: fnot.titulo.length > 180 ? '#f57f17' : '#adb5bd' }}>{fnot.titulo.length}/200</span>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Resumen <span style={{ fontWeight: '400', color: '#adb5bd' }}>(máx 300)</span></label>
                                        <input value={fnot.resumen} onChange={e => setFnot(p => ({ ...p, resumen: e.target.value }))}
                                            style={s.inp} placeholder="Breve resumen para vista previa" maxLength={300} />
                                        <span style={{ fontSize: '0.67rem', color: '#adb5bd' }}>{fnot.resumen.length}/300</span>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Contenido *</label>
                                        <textarea value={fnot.contenido} onChange={e => setFnot(p => ({ ...p, contenido: e.target.value }))}
                                            style={{ ...s.inp, minHeight: 120, resize: 'vertical' }} placeholder="Contenido completo de la noticia..." />
                                    </div>
                                    <div style={s.grid2}>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Categoría *</label>
                                            <select value={fnot.categoria} onChange={e => setFnot(p => ({ ...p, categoria: e.target.value }))} style={s.inp}>
                                                <option value="comunicado">Comunicado</option>
                                                <option value="convocatoria">Convocatoria</option>
                                                <option value="logro">Logro</option>
                                                <option value="evento">Evento</option>
                                                <option value="oportunidad_laboral">Oportunidad Laboral</option>
                                            </select>
                                        </div>
                                        <div style={s.campo}>
                                            <label style={s.lbl}>Estado</label>
                                            <select value={fnot.estado} onChange={e => setFnot(p => ({ ...p, estado: e.target.value }))} style={s.inp}>
                                                <option value="borrador">Borrador</option>
                                                <option value="publicada">Publicar ahora</option>
                                                <option value="archivada">Archivar</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={s.campo}>
                                        <label style={s.lbl}>Imagen de portada (opcional)</label>
                                        {imgPreview && (
                                            <div style={{ position: 'relative', marginBottom: 8 }}>
                                                <img src={imgPreview} alt="preview"
                                                    style={{ width: '100%', maxHeight: 130, objectFit: 'cover', borderRadius: 7, border: '1px solid #e9ecef' }} />
                                                <button type="button" onClick={quitarImagen}
                                                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: '0.7rem' }}>
                                                    <FaTimes style={{ fontSize: '0.6rem' }} /> Quitar
                                                </button>
                                            </div>
                                        )}
                                        <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp"
                                            onChange={handleImgChange} style={{ fontSize: '0.77rem', color: '#6c757d' }} />
                                        {imgExistente && !imgFile && (
                                            <span style={{ fontSize: '0.68rem', color: '#2e7d32' }}>✓ Imagen actual — sube una nueva para reemplazarla</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={s.modalFoot}>
                            <button style={s.btnCancelar} onClick={() => { setModal(false); resetForms(); }}>Cancelar</button>
                            <button
                                style={{ ...s.btnGuardar, background: tipoModal === 'noticia' ? '#1976d2' : 'var(--color-espoch-rojo)' }}
                                onClick={tipoModal === 'evento' ? guardarEvento : guardarNoticia}
                                disabled={guardando}>
                                {guardando
                                    ? <><FaSpinner style={{ marginRight: 5 }} />Guardando...</>
                                    : <><FaSave style={{ marginRight: 5 }} />{editId ? 'Actualizar' : 'Guardar'}</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MODAL CONFIRMAR ELIMINAR ══ */}
            {confirmar.abierto && (
                <div style={{ ...s.overlay, zIndex: 1100 }}>
                    <div style={s.modalConfirm}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗑️</div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50' }}>
                            ¿Eliminar {confirmar.tipo}?
                        </h3>
                        <p style={{ margin: '0 0 18px', fontSize: '0.79rem', color: '#6c757d', textAlign: 'center', lineHeight: 1.6 }}>
                            Se eliminará permanentemente <strong>"{confirmar.titulo}"</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button style={s.btnCancelar}
                                onClick={() => setConfirmar({ abierto: false, tipo: '', id: '', titulo: '' })}>
                                Cancelar
                            </button>
                            <button style={{ ...s.btnGuardar, background: '#c62828' }}
                                onClick={confirmarEliminar} disabled={eliminando}>
                                {eliminando ? <FaSpinner style={{ marginRight: 5 }} /> : null}
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                MODAL CONFIRMAR NOTIFICACIÓN
            ══════════════════════════════════════════════════════ */}
            {notifConfirm.abierto && !notifCargando && (
                <div style={{ ...s.overlay, zIndex: 1100 }}>
                    <div style={s.modalConfirm}>
                        {/* Ícono campana animada */}
                        <div style={s.notifIconWrap}>
                            <FaBell style={{ fontSize: '1.6rem', color: '#f57f17' }} />
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50', textAlign: 'center' }}>
                            ¿Enviar notificación?
                        </h3>
                        <p style={{ margin: '0 0 4px', fontSize: '0.82rem', fontWeight: '600', color: '#2c3e50', textAlign: 'center' }}>
                            "{notifConfirm.evento?.titulo}"
                        </p>
                        <p style={{ margin: '0 0 20px', fontSize: '0.77rem', color: '#6c757d', textAlign: 'center', lineHeight: 1.6 }}>
                            Se enviará un correo de invitación a todos los <strong>graduados</strong> con tesis
                            verificada y a todos los <strong>empleadores</strong> registrados en el sistema.
                        </p>

                        {/* Chips de destinatarios */}
                        <div style={s.notifChips}>
                            <div style={{ ...s.notifChip, background: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                                <FaGraduationCap style={{ fontSize: '0.72rem', color: '#2e7d32' }} />
                                <span style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: '600' }}>Graduados verificados</span>
                            </div>
                            <div style={{ ...s.notifChip, background: '#e3f2fd', border: '1px solid #bbdefb' }}>
                                <FaBuilding style={{ fontSize: '0.72rem', color: '#1565c0' }} />
                                <span style={{ fontSize: '0.75rem', color: '#1565c0', fontWeight: '600' }}>Todos los empleadores</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                            <button style={{ ...s.btnCancelar, flex: 1 }}
                                onClick={() => setNotifConfirm({ abierto: false, evento: null })}>
                                Cancelar
                            </button>
                            <button style={{ ...s.btnGuardar, flex: 1, background: '#f57f17', justifyContent: 'center' }}
                                onClick={ejecutarNotificacion}>
                                <FaBell style={{ marginRight: 6, fontSize: '0.75rem' }} />
                                Sí, notificar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                MODAL CARGANDO — ENVIANDO NOTIFICACIONES
            ══════════════════════════════════════════════════════ */}
            {notifCargando && (
                <div style={{ ...s.overlay, zIndex: 1200 }}>
                    <div style={{ ...s.modalConfirm, gap: 16 }}>
                        {/* Spinner animado */}
                        <div style={s.spinnerWrap}>
                            <div style={s.spinnerRing} />
                            <FaBell style={s.spinnerIcon} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#2c3e50', textAlign: 'center' }}>
                            Enviando notificaciones...
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#6c757d', textAlign: 'center', lineHeight: 1.6 }}>
                            Estamos enviando correos a graduados y empleadores.<br />
                            Esto puede tomar unos segundos.
                        </p>
                        {/* Barra de progreso animada */}
                        <div style={s.progressBar}>
                            <div style={s.progressFill} />
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                MODAL RESULTADO — NOTIFICACIONES ENVIADAS
            ══════════════════════════════════════════════════════ */}
            {notifResultado && (
                <div style={{ ...s.overlay, zIndex: 1200 }}>
                    <div style={{ ...s.modalConfirm, maxWidth: 400 }}>
                        {notifResultado.error ? (
                            /* ── Error ── */
                            <>
                                <div style={{ ...s.notifIconWrap, background: '#ffebee', border: '1px solid #ffcdd2' }}>
                                    <FaTimesCircle style={{ fontSize: '1.6rem', color: '#c62828' }} />
                                </div>
                                <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '700', color: '#c62828', textAlign: 'center' }}>
                                    Error al enviar
                                </h3>
                                <p style={{ margin: '0 0 20px', fontSize: '0.78rem', color: '#6c757d', textAlign: 'center', lineHeight: 1.6 }}>
                                    {notifResultado.error}
                                </p>
                            </>
                        ) : (
                            /* ── Éxito ── */
                            <>
                                <div style={{ ...s.notifIconWrap, background: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                                    <FaCheckCircle style={{ fontSize: '1.6rem', color: '#2e7d32' }} />
                                </div>
                                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50', textAlign: 'center' }}>
                                    ¡Notificaciones enviadas!
                                </h3>
                                <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: '#6c757d', textAlign: 'center' }}>
                                    {notifResultado.titulo}
                                </p>

                                {/* Tarjetas de resumen */}
                                <div style={s.resumenGrid}>
                                    {/* Graduados */}
                                    <div style={s.resumenCard}>
                                        <div style={{ ...s.resumenIconWrap, background: '#e8f5e9' }}>
                                            <FaGraduationCap style={{ fontSize: '1rem', color: '#2e7d32' }} />
                                        </div>
                                        <p style={s.resumenLabel}>Graduados</p>
                                        <p style={{ ...s.resumenNum, color: '#2e7d32' }}>
                                            {notifResultado.resumen?.graduados?.enviados ?? 0}
                                            <span style={s.resumenTotal}>/{notifResultado.resumen?.graduados?.total ?? 0}</span>
                                        </p>
                                        <p style={s.resumenSub}>enviados</p>
                                        {(notifResultado.resumen?.graduados?.fallidos ?? 0) > 0 && (
                                            <p style={s.resumenFallido}>
                                                {notifResultado.resumen.graduados.fallidos} fallidos
                                            </p>
                                        )}
                                    </div>

                                    {/* Empleadores */}
                                    <div style={s.resumenCard}>
                                        <div style={{ ...s.resumenIconWrap, background: '#e3f2fd' }}>
                                            <FaBuilding style={{ fontSize: '1rem', color: '#1565c0' }} />
                                        </div>
                                        <p style={s.resumenLabel}>Empleadores</p>
                                        <p style={{ ...s.resumenNum, color: '#1565c0' }}>
                                            {notifResultado.resumen?.empleadores?.enviados ?? 0}
                                            <span style={s.resumenTotal}>/{notifResultado.resumen?.empleadores?.total ?? 0}</span>
                                        </p>
                                        <p style={s.resumenSub}>enviados</p>
                                        {(notifResultado.resumen?.empleadores?.fallidos ?? 0) > 0 && (
                                            <p style={s.resumenFallido}>
                                                {notifResultado.resumen.empleadores.fallidos} fallidos
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            style={{ ...s.btnGuardar, background: 'var(--color-espoch-rojo)', width: '100%', justifyContent: 'center', marginTop: 4 }}
                            onClick={() => setNotifResultado(null)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   ESTILOS
═══════════════════════════════════════════════════════════ */
const s = {
    page: { maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22, fontFamily: "'Segoe UI',Roboto,sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
    headerTit: { margin: '0 0 4px', fontSize: '1.25rem', fontWeight: '800', color: '#2c3e50' },
    btnNuevo: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0, whiteSpace: 'nowrap' },
    secHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    secTit: { margin: 0, fontSize: '1rem', fontWeight: '700', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 8 },
    contadorBadge: { fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: 20, background: 'var(--color-espoch-rojo)', color: 'white' },
    slideInfo: { fontSize: '0.72rem', color: '#adb5bd', fontWeight: '600' },
    slidBtn: { width: 30, height: 30, borderRadius: 6, background: 'white', border: '1px solid #e9ecef', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' },
    dotsRow: { display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 },
    cargandoArea: { display: 'flex', justifyContent: 'center', padding: 40 },
    emptyCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', background: 'white', borderRadius: 10, border: '1px dashed #dee2e6', textAlign: 'center' },
    emptyTit: { margin: '0 0 4px', fontSize: '0.9rem', fontWeight: '700', color: '#2c3e50' },
    emptySub: { margin: 0, fontSize: '0.75rem', color: '#adb5bd' },
    eventosGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
    eventoCard: { backgroundColor: 'white', borderRadius: 12, border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    eventoImg: { position: 'relative', height: 150, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 10 },
    eventoImgOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.25) 100%)' },
    badgeEst: { position: 'relative', zIndex: 1, fontSize: '0.6rem', fontWeight: '800', padding: '3px 9px', borderRadius: 20, letterSpacing: '0.5px' },
    eventoBody: { padding: '13px 15px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 },
    eventoFechaRow: { display: 'flex', alignItems: 'center', gap: 5 },
    eventoFecha: { fontSize: '0.69rem', color: '#adb5bd' },
    eventoTit: { margin: 0, fontSize: '0.88rem', fontWeight: '700', color: '#2c3e50', lineHeight: 1.4 },
    eventoDesc: { margin: 0, fontSize: '0.73rem', color: '#6c757d', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 },
    eventoLugarTxt: { fontSize: '0.69rem', color: '#adb5bd' },
    eventoFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 9, borderTop: '1px solid #f0f0f0' },
    btnGestionar: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: '700', color: 'var(--color-espoch-rojo)' },
    btnAccSm: { width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', border: '1px solid #e9ecef', cursor: 'pointer', color: '#6c757d', flexShrink: 0 },

    /* ── Botón campana ── */
    btnCampana: { width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff8e1', border: '1px solid #ffe082', cursor: 'pointer', color: '#f57f17', flexShrink: 0, transition: 'all 0.15s' },

    card: { backgroundColor: 'white', borderRadius: 10, border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    trHead: { borderBottom: '2px solid #f0f0f0', backgroundColor: '#fafafa' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '0.62rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.8px', whiteSpace: 'nowrap' },
    trBody: { borderBottom: '1px solid #f8f9fa', transition: 'background 0.1s' },
    td: { padding: '10px 14px', verticalAlign: 'middle' },
    tdVacio: { padding: '28px', textAlign: 'center', color: '#adb5bd', fontSize: '0.8rem' },
    fechaTxt: { fontSize: '0.76rem', color: '#6c757d', fontWeight: '500' },
    noticiaTit: { margin: '0 0 3px', fontSize: '0.82rem', fontWeight: '700', color: '#2c3e50' },
    catBadge: { fontSize: '0.64rem', fontWeight: '500', padding: '2px 7px', borderRadius: 4 },
    miniatura: { width: 50, height: 38, objectFit: 'cover', borderRadius: 6, border: '1px solid #e9ecef', display: 'block' },
    miniaturaPlaceholder: { width: 50, height: 38, borderRadius: 6, border: '1px solid #e9ecef', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    autorCell: { display: 'flex', alignItems: 'center', gap: 8 },
    autorAvatar: { width: 28, height: 28, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '700', flexShrink: 0 },
    autorNom: { fontSize: '0.76rem', color: '#6c757d' },
    visBadge: { display: 'inline-block', fontSize: '0.62rem', fontWeight: '700', padding: '3px 9px', borderRadius: 20, letterSpacing: '0.3px' },
    accsRow: { display: 'flex', gap: 6, justifyContent: 'center' },
    btnAcc: { width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', border: '1px solid #e9ecef', cursor: 'pointer', color: '#6c757d', flexShrink: 0 },
    selectWrap: { display: 'flex', alignItems: 'center', gap: 7, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 7, padding: '7px 10px' },
    selectEl: { border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', color: '#6c757d', cursor: 'pointer', fontFamily: "'Segoe UI',Roboto,sans-serif" },
    footTabla: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 8 },
    contadorTxt: { margin: 0, fontSize: '0.7rem', color: '#adb5bd' },
    pagRow: { display: 'flex', gap: 4, alignItems: 'center' },
    pagBtn: { minWidth: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e9ecef', background: 'white', cursor: 'pointer', fontSize: '0.75rem', color: '#6c757d', padding: '0 8px' },
    pagPuntos: { fontSize: '0.75rem', color: '#adb5bd', padding: '0 2px' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' },
    modal: { backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px 13px', borderBottom: '2px solid', flexShrink: 0 },
    modalTit: { margin: '0 0 2px', fontSize: '0.95rem', fontWeight: '700', color: '#2c3e50' },
    modalSub: { margin: 0, fontSize: '0.69rem', color: '#adb5bd' },
    modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '0.9rem', padding: 4, display: 'flex', alignItems: 'center' },
    modalBody: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa', borderRadius: '0 0 12px 12px', flexShrink: 0 },
    modalConfirm: { backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 360, padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.22)' },
    errMsg: { padding: '10px 13px', background: '#fff3e0', border: '1px solid #ffe082', borderLeft: '4px solid #f57f17', borderRadius: 7, color: '#e65100', fontSize: '0.77rem', margin: '0 0 14px', lineHeight: 1.5 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 },
    campo: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 },
    lbl: { fontSize: '0.75rem', fontWeight: '600', color: '#2c3e50' },
    inp: { padding: '8px 11px', border: '1px solid #e9ecef', borderRadius: 7, fontSize: '0.8rem', color: '#2c3e50', outline: 'none', fontFamily: "'Segoe UI',Roboto,sans-serif", backgroundColor: '#f8f9fa' },
    btnCancelar: { padding: '8px 16px', background: 'transparent', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#6c757d' },
    btnGuardar: { display: 'inline-flex', alignItems: 'center', padding: '8px 18px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' },
    hibridaBox: { background: '#f0f7ff', border: '1px solid #bbdefb', borderRadius: 8, padding: '12px 14px', marginBottom: 10 },
    hibridaLabel: { margin: '0 0 10px', fontSize: '0.74rem', fontWeight: '700', color: '#1565c0' },
    modTag: { marginLeft: 6, fontSize: '0.62rem', fontWeight: '600', padding: '1px 6px', borderRadius: 4, background: '#e3f2fd', color: '#1565c0' },

    /* ── Notificación — modal confirmación ── */
    notifIconWrap: { width: 56, height: 56, borderRadius: 16, background: '#fff8e1', border: '1px solid #ffe082', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    notifChips: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 },
    notifChip: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20 },

    /* ── Spinner cargando ── */
    spinnerWrap: { position: 'relative', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    spinnerRing: {
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '3px solid #f0f0f0',
        borderTop: '3px solid #f57f17',
        animation: 'spin 0.9s linear infinite',
    },
    spinnerIcon: { fontSize: '1.3rem', color: '#f57f17', position: 'relative', zIndex: 1 },

    /* ── Barra progreso ── */
    progressBar: { width: '100%', height: 4, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
    progressFill: {
        height: '100%', width: '40%', background: 'linear-gradient(90deg,#f57f17,#ff9800)',
        borderRadius: 4, animation: 'slide 1.4s ease-in-out infinite',
    },

    /* ── Resultado resumen ── */
    resumenGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginBottom: 4 },
    resumenCard: { background: '#fafafa', border: '1px solid #e9ecef', borderRadius: 10, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
    resumenIconWrap: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    resumenLabel: { margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px' },
    resumenNum: { margin: 0, fontSize: '1.5rem', fontWeight: '800', lineHeight: 1 },
    resumenTotal: { fontSize: '0.85rem', fontWeight: '400', color: '#adb5bd' },
    resumenSub: { margin: 0, fontSize: '0.68rem', color: '#adb5bd' },
    resumenFallido: { margin: 0, fontSize: '0.68rem', color: '#c62828', fontWeight: '600' },
};

/* ── Keyframes inyectados en <head> ── */
if (typeof document !== 'undefined' && !document.getElementById('gev-keyframes')) {
    const style = document.createElement('style');
    style.id = 'gev-keyframes';
    style.textContent = `
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes slide { 0%{transform:translateX(-100%)} 50%{transform:translateX(150%)} 100%{transform:translateX(-100%)} }
    `;
    document.head.appendChild(style);
}

export default GestionEventos;
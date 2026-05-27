// frontend/src/pages/admin/HomeAdmin.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserGraduate, FaGlobe, FaClipboardList, FaCalendarAlt,
    FaFileExport, FaArrowRight, FaFire, FaSync, FaCheck,
    FaLock, FaUnlock, FaChevronDown, FaExclamationTriangle,
    FaRobot, FaEdit,
} from 'react-icons/fa';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const FONT = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

import { leerSesion } from '../../utils/storageSeguro';

const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};
const fmtNum = (n) => {
    if (n === null || n === undefined || n === '—') return '—';
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
    return n;
};
const iniciales = (n = '', a = '') =>
    `${n[0] || ''}${a[0] || ''}`.toUpperCase() || '?';

const PER = {
    publico: { label: 'Público', bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb' },
    privado: { label: 'Privado', bg: '#f3e8ff', color: '#6a1b9a', border: '#ddd6fe' },
};
const EST = {
    verificado: { label: 'Tesis ✓',   bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
    pendiente:  { label: 'Sin tesis',  bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
    bloqueado:  { label: 'Bloqueado',  bg: '#ffebee', color: '#c62828', border: '#ffcdd2' },
};
const estadoGrad = (g) => {
    if (g.cuentaBloqueada)  return 'bloqueado';
    if (g.tesisVerificada)  return 'verificado';
    return 'pendiente';
};

const METS = [
    { key: 'totalGraduados',   etiq: 'GRADUADOS REGISTRADOS', icon: FaUserGraduate,  color: '#e53935', bg: '#ffebee', border: '#ffcdd2', top: '#e53935' },
    { key: 'perfilesPublicos', etiq: 'PERFILES PÚBLICOS',      icon: FaGlobe,         color: '#1976d2', bg: '#e3f2fd', border: '#bbdefb', top: '#1976d2' },
    { key: 'encuestasActivas', etiq: 'ENCUESTAS ACTIVAS',      icon: FaClipboardList, color: '#2e7d32', bg: '#e8f5e9', border: '#c8e6c9', top: '#2e7d32' },
    { key: 'eventosProximos',  etiq: 'EVENTOS PRÓXIMOS',       icon: FaCalendarAlt,   color: '#f57f17', bg: '#fff8e1', border: '#ffe082', top: '#f57f17' },
];

const ACCIONES = [
    { icon: FaCalendarAlt,  label: 'Crear Eventos',   color: '#1976d2', bg: '#e3f2fd', border: '#bbdefb', path: '/home-admin/eventos'   },
    { icon: FaClipboardList,label: 'Crear Encuestas', color: '#2e7d32', bg: '#e8f5e9', border: '#c8e6c9', path: '/home-admin/encuestas' },
    { icon: FaFileExport,   label: 'Ver Reportes',    color: '#6a1b9a', bg: '#f3e8ff', border: '#ddd6fe', path: '/home-admin/reportes'  },
];

// ══════════════════════════════════════════════════════════
// WIDGET TENDENCIA SEMANAL
// Solo 2 modos: Automático | Manual
// ══════════════════════════════════════════════════════════
const WidgetTendencia = () => {
    const [tendencia,    setTendencia]    = useState(null);
    const [catalogo,     setCatalogo]     = useState([]);
    const [cargando,     setCargando]     = useState(true);
    const [modo,         setModo]         = useState('auto');   // 'auto' | 'manual'
    const [seleccionada, setSeleccionada] = useState('');
    const [abierto,      setAbierto]      = useState(false);
    const [guardando,    setGuardando]    = useState(false);
    const [reseteando,   setReseteando]   = useState(false);
    const [exito,        setExito]        = useState('');
    const [error,        setError]        = useState('');

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const { data } = await axios.get(`${API}/tendencia`);
            setTendencia(data);
            setCatalogo(data.catalogo || []);
            setSeleccionada(data.categoria);
            setModo(data.modoManual ? 'manual' : 'auto');
        } catch (e) {
            console.error('[Tendencia widget]', e.message);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const handleModo = (nuevoModo) => {
        setModo(nuevoModo);
        setError('');
        setExito('');
        // Si cambia a auto y era manual → resetear de inmediato
        if (nuevoModo === 'auto' && tendencia?.modoManual) {
            resetear();
        }
    };

    const guardar = async () => {
        if (!seleccionada) return;
        setGuardando(true); setError(''); setExito('');
        try {
            await axios.put(`${API}/admin/tendencia`, { categoria: seleccionada }, { headers: hdrs() });
            setExito(`Tendencia fijada: "${seleccionada}"`);
            await cargar();
            setTimeout(() => setExito(''), 4000);
        } catch (e) {
            setError(e.response?.data?.msg || 'Error al guardar.');
        } finally {
            setGuardando(false);
            setAbierto(false);
        }
    };

    const resetear = async () => {
        setReseteando(true); setError(''); setExito('');
        try {
            await axios.delete(`${API}/admin/tendencia/reset`, { headers: hdrs() });
            setExito('Modo automático activado.');
            await cargar();
            setTimeout(() => setExito(''), 4000);
        } catch (e) {
            setError(e.response?.data?.msg || 'Error al resetear.');
        } finally {
            setReseteando(false);
        }
    };

    const catActual = catalogo.find(c => c.categoria === tendencia?.categoria);

    return (
        <div style={wt.wrap}>
            {/* Cabecera */}
            <div style={wt.cabecera}>
                <div style={{ ...wt.ico, backgroundColor: (catActual?.color || '#be1e2d') + '15' }}>
                    <FaFire style={{ color: catActual?.color || '#be1e2d', fontSize: '0.9rem' }} />
                </div>
                <div>
                    <p style={{ ...wt.titulo, fontFamily: FONT }}>Tendencia Semanal de Proyectos</p>
                    <p style={{ ...wt.sub, fontFamily: FONT }}>
                        Semana {tendencia?.semana} · {tendencia?.anio}
                    </p>
                </div>
            </div>

            {/* Categoría activa */}
            {!cargando && tendencia && (
                <div style={{ ...wt.catBox, borderLeft: `3px solid ${catActual?.color || '#be1e2d'}` }}>
                    <p style={{ ...wt.catLabel, fontFamily: FONT }}>Mostrando en Página de Proyectos</p>
                    <p style={{ ...wt.catNombre, color: catActual?.color || '#be1e2d', fontFamily: FONT }}>
                        {tendencia.categoria}
                    </p>
                    <p style={{ ...wt.catDesc, fontFamily: FONT }}>{tendencia.descripcion}</p>
                </div>
            )}

            {/* Toggle Automático / Manual */}
            <div style={wt.toggle}>
                <button
                    style={{
                        ...wt.toggleBtn,
                        fontFamily: FONT,
                        backgroundColor: modo === 'auto' ? '#0f172a' : '#f8fafc',
                        color:           modo === 'auto' ? 'white'   : '#64748b',
                        border: `1px solid ${modo === 'auto' ? '#0f172a' : '#e2e8f0'}`,
                    }}
                    onClick={() => handleModo('auto')}
                    disabled={reseteando}
                >
                    {reseteando
                        ? <FaSync style={{ marginRight: 5, fontSize: '0.65rem', animation: 'spin 0.8s linear infinite' }} />
                        : <FaRobot style={{ marginRight: 5, fontSize: '0.65rem' }} />
                    }
                    Automático
                </button>
                <button
                    style={{
                        ...wt.toggleBtn,
                        fontFamily: FONT,
                        backgroundColor: modo === 'manual' ? '#be1e2d' : '#f8fafc',
                        color:           modo === 'manual' ? 'white'   : '#64748b',
                        border: `1px solid ${modo === 'manual' ? '#be1e2d' : '#e2e8f0'}`,
                    }}
                    onClick={() => handleModo('manual')}
                >
                    <FaEdit style={{ marginRight: 5, fontSize: '0.65rem' }} />
                    Manual
                </button>
            </div>

            {/* Descripción del modo activo */}
            <p style={{ ...wt.modoDesc, fontFamily: FONT }}>
                {modo === 'auto'
                    ? 'El sistema rota automáticamente cada lunes según el calendario de tendencias.'
                    : 'Elige la categoría que se destacará esta semana en la página de proyectos.'
                }
            </p>

            {/* Selector — solo visible en modo manual */}
            {modo === 'manual' && (
                <div style={wt.selectorArea}>
                    <p style={{ ...wt.selectorLabel, fontFamily: FONT }}>Selecciona la categoría</p>
                    <div style={{ position: 'relative' }}>
                        <button
                            style={{ ...wt.dropBtn, fontFamily: FONT }}
                            onClick={() => setAbierto(a => !a)}
                        >
                            <span style={wt.dropDot(catActual?.color)} />
                            <span style={{ flex: 1, textAlign: 'left' }}>
                                {seleccionada || 'Seleccionar categoría...'}
                            </span>
                            <FaChevronDown style={{
                                fontSize: '0.62rem', color: '#94a3b8',
                                transform: abierto ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s',
                            }} />
                        </button>

                        {abierto && (
                            <div style={wt.dropdown}>
                                {catalogo.map(cat => (
                                    <button
                                        key={cat.categoria}
                                        style={{
                                            ...wt.dropItem,
                                            fontFamily: FONT,
                                            backgroundColor: seleccionada === cat.categoria ? '#f8fafc' : 'white',
                                        }}
                                        onClick={() => { setSeleccionada(cat.categoria); setAbierto(false); }}
                                    >
                                        <span style={wt.dropDot(cat.color)} />
                                        <span style={{ flex: 1 }}>{cat.categoria}</span>
                                        {seleccionada === cat.categoria && (
                                            <FaCheck style={{ fontSize: '0.6rem', color: '#2e7d32' }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        style={{
                            ...wt.btnGuardar,
                            fontFamily: FONT,
                            opacity: (!seleccionada || guardando) ? 0.55 : 1,
                        }}
                        onClick={guardar}
                        disabled={!seleccionada || guardando}
                    >
                        {guardando
                            ? <><FaSync style={{ marginRight: 5, animation: 'spin 0.8s linear infinite' }} />Guardando...</>
                            : <><FaLock style={{ marginRight: 5 }} />Fijar esta tendencia</>
                        }
                    </button>
                </div>
            )}

           
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// HOME ADMIN
// ══════════════════════════════════════════════════════════
const HomeAdmin = () => {
    const navigate = useNavigate();
    const [metricas,  setMetricas]  = useState(null);
    const [graduados, setGraduados] = useState([]);
    const [total,     setTotal]     = useState(0);
    const [cargando,  setCargando]  = useState(true);
    const [error,     setError]     = useState('');

    const cargar = useCallback(async () => {
        setCargando(true); setError('');
        try {
            const [mRes, gRes, encGradRes, encEmpRes, evRes] = await Promise.all([
                axios.get(`${API}/admin/metricas`,                                   { headers: hdrs() }),
                axios.get(`${API}/admin/graduados?page=1&limit=5`,                   { headers: hdrs() }),
                axios.get(`${API}/encuestas?estado=activa&tipo=graduados&limit=1`,   { headers: hdrs() }),
                axios.get(`${API}/encuestas?estado=activa&tipo=empleadores&limit=1`, { headers: hdrs() }),
                axios.get(`${API}/eventos?estado=vigente&limit=100`,                 { headers: hdrs() }),
            ]);
            const totalActivas  = (encGradRes.data.total || 0) + (encEmpRes.data.total || 0);
            const totalVigentes = (evRes.data.eventos || []).length;
            setMetricas({ ...mRes.data, encuestasActivas: totalActivas, eventosProximos: totalVigentes });
            setGraduados(gRes.data.graduados);
            setTotal(gRes.data.total);
        } catch (e) {
            console.error(e);
            setError('No se pudieron cargar los datos. Verifica tu sesión.');
        } finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    return (
        <div style={s.page}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ═══ MÉTRICAS ═══ */}
            <div style={s.gridMet}>
                {METS.map(m => {
                    const Icon = m.icon;
                    const val  = metricas?.[m.key] ?? '—';
                    return (
                        <div key={m.key} style={{ ...s.metCard, borderTop: `3px solid ${m.top}` }}>
                            <div style={s.metRow}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={s.metEtiq}>{m.etiq}</p>
                                    <p style={s.metVal}>
                                        {cargando ? <span style={{ color: '#ced4da' }}>···</span> : fmtNum(val)}
                                    </p>
                                </div>
                                <div style={{ ...s.metIco, background: m.bg, border: `1px solid ${m.border}` }}>
                                    <Icon style={{ fontSize: '1.1rem', color: m.color }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ CUERPO ═══ */}
            <div style={s.cuerpo}>

                {/* ── Columna principal (registros + widget tendencia) ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Registros recientes */}
                    <div style={s.card}>
                        <div style={s.cardHead}>
                            <div>
                                <h2 style={s.cardTit}>Registros Recientes</h2>
                                {!cargando && !error && (
                                    <p style={s.cardSub}>Últimos 5 de {total} graduados registrados</p>
                                )}
                            </div>
                            <button style={s.btnVerTodos} onClick={() => navigate('/home-admin/graduados')}>
                                VER TODOS
                            </button>
                        </div>

                        {error && <p style={s.errMsg}>{error}</p>}

                        {!error && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={s.tabla}>
                                    <thead>
                                        <tr style={s.trHead}>
                                            <th style={s.th}>NOMBRE</th>
                                            <th style={s.th}>EMAIL</th>
                                            <th style={s.th}>ESTADO</th>
                                            <th style={s.th}>PERFIL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cargando
                                            ? Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i}>
                                                    {Array.from({ length: 4 }).map((__, j) => (
                                                        <td key={j} style={s.td}>
                                                            <div style={{ ...s.skBar, width: j === 1 ? '80%' : '60%' }} />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                            : graduados.length === 0
                                                ? <tr><td colSpan={4} style={s.tdVacio}>No hay graduados registrados aún.</td></tr>
                                                : graduados.map(g => {
                                                    const est  = estadoGrad(g);
                                                    const bEst = EST[est];
                                                    const bPer = g.perfilPublico ? PER.publico : PER.privado;
                                                    return (
                                                        <tr key={g._id} style={s.trBody}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                            <td style={s.td}>
                                                                <div style={s.nomCell}>
                                                                    <div style={{ ...s.avatarTbl, background: bEst.bg, color: bEst.color }}>
                                                                        {iniciales(g.nombres, g.apellidos)}
                                                                    </div>
                                                                    <div>
                                                                        <p style={s.nomTxt}>{g.nombres} {g.apellidos}</p>
                                                                        {g.anioGraduacion && <p style={s.nomSub}>Graduado {g.anioGraduacion}</p>}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={s.td}><span style={s.emailTxt}>{g.emailInstitucional}</span></td>
                                                            <td style={s.td}>
                                                                <span style={{ ...s.badge, background: bEst.bg, color: bEst.color, border: `1px solid ${bEst.border}` }}>
                                                                    {bEst.label}
                                                                </span>
                                                            </td>
                                                            <td style={s.td}>
                                                                <span style={{ ...s.badge, background: bPer.bg, color: bPer.color, border: `1px solid ${bPer.border}` }}>
                                                                    {bPer.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                        }
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Widget tendencia — debajo de Registros Recientes */}
                    <WidgetTendencia />
                </div>

                {/* ── Acciones rápidas ── */}
                <div style={s.cardAcciones}>
                    <h2 style={{ ...s.cardTit, marginBottom: 16 }}>Acciones Rápidas</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {ACCIONES.map(acc => {
                            const Icon = acc.icon;
                            return (
                                <button key={acc.label} style={s.accBtn} onClick={() => navigate(acc.path)}>
                                    <div style={{ ...s.accIco, background: acc.bg, border: `1px solid ${acc.border}` }}>
                                        <Icon style={{ fontSize: '0.82rem', color: acc.color }} />
                                    </div>
                                    <span style={s.accLabel}>{acc.label}</span>
                                    <FaArrowRight style={{ fontSize: '0.6rem', color: '#adb5bd', marginLeft: 'auto', flexShrink: 0 }} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════
const s = {
    page:         { maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: FONT },
    gridMet:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
    metCard:      { backgroundColor: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    metRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
    metEtiq:      { margin: '0 0 6px', fontSize: '0.59rem', fontWeight: 700, color: '#adb5bd', letterSpacing: '0.9px' },
    metVal:       { margin: 0, fontSize: '2rem', fontWeight: 800, color: '#2c3e50', lineHeight: 1 },
    metIco:       { width: 42, height: 42, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cuerpo:       { display: 'grid', gridTemplateColumns: '1fr 230px', gap: 14, alignItems: 'start' },
    card:         { backgroundColor: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    cardAcciones: { backgroundColor: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    cardHead:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    cardTit:      { margin: '0 0 2px', fontSize: '0.9rem', fontWeight: 700, color: '#2c3e50' },
    cardSub:      { margin: 0, fontSize: '0.7rem', color: '#adb5bd' },
    btnVerTodos:  { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.69rem', fontWeight: 700, color: '#be1e2d', letterSpacing: '0.4px', whiteSpace: 'nowrap', flexShrink: 0 },
    tabla:        { width: '100%', borderCollapse: 'collapse' },
    trHead:       { borderBottom: '2px solid #f0f0f0' },
    th:           { padding: '7px 10px', textAlign: 'left', fontSize: '0.61rem', fontWeight: 700, color: '#adb5bd', letterSpacing: '0.7px', whiteSpace: 'nowrap' },
    trBody:       { borderBottom: '1px solid #f8f9fa', transition: 'background 0.1s' },
    td:           { padding: '10px 10px', verticalAlign: 'middle' },
    tdVacio:      { padding: '30px 10px', textAlign: 'center', color: '#adb5bd', fontSize: '0.8rem' },
    skBar:        { height: 12, borderRadius: 6, background: '#f0f0f0' },
    nomCell:      { display: 'flex', alignItems: 'center', gap: 9 },
    avatarTbl:    { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 },
    nomTxt:       { margin: 0, fontSize: '0.79rem', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' },
    nomSub:       { margin: 0, fontSize: '0.65rem', color: '#adb5bd' },
    emailTxt:     { fontSize: '0.74rem', color: '#6c757d' },
    badge:        { display: 'inline-block', fontSize: '0.64rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' },
    errMsg:       { padding: '12px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 7, color: '#c62828', fontSize: '0.77rem', textAlign: 'center', margin: '0 0 12px' },
    accBtn:       { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, cursor: 'pointer', width: '100%', textAlign: 'left' },
    accIco:       { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    accLabel:     { fontSize: '0.79rem', fontWeight: 600, color: '#2c3e50' },
};

// Estilos widget tendencia
const wt = {
    wrap:         { backgroundColor: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    cabecera:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
    ico:          { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    titulo:       { margin: '0 0 1px', fontSize: '0.88rem', fontWeight: 700, color: '#2c3e50' },
    sub:          { margin: 0, fontSize: '0.67rem', color: '#adb5bd' },
    catBox:       { backgroundColor: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginBottom: 14 },
    catLabel:     { margin: '0 0 3px', fontSize: '0.59rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' },
    catNombre:    { margin: '0 0 3px', fontSize: '0.92rem', fontWeight: 800, lineHeight: 1.2 },
    catDesc:      { margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 },
    // Toggle 2 botones
    toggle:       { display: 'flex', gap: 6, marginBottom: 8 },
    toggleBtn:    { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 10px', borderRadius: 7, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, transition: 'all 0.15s' },
    modoDesc:     { margin: '0 0 12px', fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.5 },
    // Selector manual
    selectorArea: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 },
    selectorLabel:{ margin: 0, fontSize: '0.69rem', fontWeight: 700, color: '#475569' },
    dropBtn:      { width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: '0.79rem', color: '#0f172a', fontWeight: 500 },
    dropDot:      (color) => ({ width: 8, height: 8, borderRadius: '50%', backgroundColor: color || '#be1e2d', flexShrink: 0 }),
    dropdown:     { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 240, overflowY: 'auto' },
    dropItem:     { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 11px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#0f172a', fontWeight: 500, textAlign: 'left' },
    btnGuardar:   { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', width: '100%', background: 'linear-gradient(135deg,#be1e2d,#9b1623)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 },
    alerta:       { padding: '7px 10px', borderRadius: 7, fontSize: '0.71rem', fontWeight: 500, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 },
};

export default HomeAdmin;
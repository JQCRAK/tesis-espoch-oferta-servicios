// frontend/src/pages/admin/HomeAdmin.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserGraduate, FaGlobe, FaClipboardList, FaCalendarAlt,
    FaFileExport, FaArrowRight,
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
    verificado: { label: 'Verificado', bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
    pendiente:  { label: 'Pendiente',  bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
    bloqueado:  { label: 'Bloqueado',  bg: '#ffebee', color: '#c62828', border: '#ffcdd2' },
};
const estadoGrad = (g) => {
    if (g.cuentaBloqueada) return 'bloqueado';
    if (g.tesisVerificada) return 'verificado';
    return 'pendiente';
};

const METS = [
    { key: 'totalGraduados',   etiq: 'GRADUADOS REGISTRADOS', icon: FaUserGraduate,  color: '#e53935', bg: '#ffebee', border: '#ffcdd2', top: '#e53935' },
    { key: 'perfilesPublicos', etiq: 'PERFILES PÚBLICOS',      icon: FaGlobe,         color: '#1976d2', bg: '#e3f2fd', border: '#bbdefb', top: '#1976d2' },
    { key: 'encuestasActivas', etiq: 'ENCUESTAS ACTIVAS',      icon: FaClipboardList, color: '#2e7d32', bg: '#e8f5e9', border: '#c8e6c9', top: '#2e7d32' },
    { key: 'eventosProximos',  etiq: 'EVENTOS PRÓXIMOS',       icon: FaCalendarAlt,   color: '#f57f17', bg: '#fff8e1', border: '#ffe082', top: '#f57f17' },
];

const ACCIONES = [
    { icon: FaCalendarAlt,   label: 'Crear Eventos',   color: '#1976d2', bg: '#e3f2fd', border: '#bbdefb', path: '/home-admin/eventos'   },
    { icon: FaClipboardList, label: 'Crear Encuestas', color: '#2e7d32', bg: '#e8f5e9', border: '#c8e6c9', path: '/home-admin/encuestas' },
    { icon: FaFileExport,    label: 'Ver Reportes',    color: '#6a1b9a', bg: '#f3e8ff', border: '#ddd6fe', path: '/home-admin/reportes'  },
];

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

                {/* ── Registros recientes ── */}
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
                                        <th style={s.th}>TESIS</th>
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

export default HomeAdmin;
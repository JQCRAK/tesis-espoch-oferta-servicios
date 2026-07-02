// frontend/src/pages/admin/TabIndicadoresGraduados.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    FaChartPie, FaMapMarkerAlt, FaCode, FaBriefcase,
    FaGraduationCap, FaUsers, FaClipboardList,
    FaExclamationTriangle, FaHandshake,
    FaBuilding, FaTrophy, FaLightbulb, FaCheckCircle,
    FaTimesCircle, FaFilter, FaTimes, FaCalendarAlt,
    FaMapMarked, FaVenusMars, FaGlobeAmericas,
    FaArrowUp, FaArrowDown, FaBullseye, FaUserCircle,
    FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';

// ── Constantes ────────────────────────────────────────────────
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

const ROJO    = '#BE1E2D';
const AZUL    = '#1565C0';
const VERDE   = '#2E7D32';
const NARANJA = '#E65100';
const MORADO  = '#4527A0';
const CIAN    = '#00695C';
const GRIS    = '#37474F';
const FONT    = "'Segoe UI', system-ui, -apple-system, sans-serif";
const PALETA  = [ROJO, AZUL, VERDE, NARANJA, MORADO, CIAN, GRIS,
    '#AD1457', '#00838F', '#558B2F', '#4E342E', '#0277BD'];
const PALETA_LIGHT = [
    '#f7c5c9','#b3c9f0','#b2dfb4','#f9cba8','#c5bce8','#a8d5cc',
    '#b0bec5','#f4b8d1','#a8d8db','#c8dba6','#c8b5b0','#a5c9e8',
];

// ── Helpers ───────────────────────────────────────────────────
const pct        = (v, t) => (t === 0 ? 0 : Math.round((v / t) * 100));
const norm       = s => s?.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim() ?? '';
const CANTON_ALIAS = { 'banos': 'banos de agua santa', 'lago agrio': 'nueva loja', 'san miguel de riobamba': 'riobamba' };
const normCanton = n => { const k = norm(n); return CANTON_ALIAS[k] || k; };
const urlFoto    = (ruta) => (!ruta ? null : `${BASE_URL}/${ruta}`);
const iniciales  = (nombres, apellidos) => {
    const n = (nombres || '').trim()[0] || '';
    const a = (apellidos || '').trim()[0] || '';
    return (n + a).toUpperCase() || '?';
};
const colorAvatar = (str) => {
    const colores = [ROJO, AZUL, VERDE, NARANJA, MORADO, CIAN, GRIS, '#AD1457', '#00838F'];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return colores[Math.abs(h) % colores.length];
};

// ── Estilos globales (solo se inyectan una vez) ───────────────
if (typeof document !== 'undefined' && !document.getElementById('tab-ind-kf')) {
    const st = document.createElement('style');
    st.id = 'tab-ind-kf';
    st.textContent = `
        @keyframes est-spin   { to { transform: rotate(360deg); } }
        @keyframes est-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .est-anim { animation: est-fadein 0.28s ease both; }
        .leaflet-container { font-family: 'Segoe UI', system-ui, sans-serif !important; }
        .leaflet-tooltip {
            font-family: 'Segoe UI', system-ui, sans-serif !important;
            border-radius: 6px !important; border: 1px solid #e2e8f0 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            padding: 8px 12px !important; font-size: 0.78rem !important;
            color: #0f172a !important; background: white !important;
        }
        .leaflet-tooltip::before { display: none !important; }
        .leaflet-control-zoom { border: 1px solid #e2e8f0 !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; overflow: hidden !important; }
        .leaflet-control-zoom a { color: #374151 !important; font-size: 16px !important; width: 32px !important; height: 32px !important; line-height: 32px !important; background: white !important; }
        .leaflet-control-zoom a:hover { background: #f8fafc !important; color: #BE1E2D !important; }
        .leaflet-control-attribution { font-size: 0.58rem !important; }
        .leaflet-bar { border: none !important; }
        .fil-select {
            padding: 5px 8px; border-radius: 6px; border: 1px solid #e5e7eb;
            font-size: 0.73rem; font-family: 'Segoe UI', system-ui, sans-serif;
            color: #374151; background: white; outline: none; cursor: pointer;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .fil-select:focus { border-color: #BE1E2D; box-shadow: 0 0 0 2px #BE1E2D22; }
        .fil-select.activo { border-color: #BE1E2D; color: #0f172a; box-shadow: 0 0 0 2px #BE1E2D15; }
        .prov-row:hover { background: #f1f5f9 !important; }
        .grad-card:hover { background: #f8fafc !important; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.09) !important; }
        .pag-btn:hover:not(:disabled) { background: #BE1E2D !important; color: white !important; border-color: #BE1E2D !important; }
    `;
    document.head.appendChild(st);
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTES UI
// ══════════════════════════════════════════════════════════════

const Barra = ({ label, valor, total, color, compact = false }) => {
    const p = pct(valor, total);
    return (
        <div style={{ marginBottom: compact ? 6 : 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, alignItems: 'baseline' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: compact ? '0.71rem' : '0.74rem', color: '#374151', fontFamily: FONT, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                <span style={{ fontSize: '0.69rem', color: '#6b7280', fontFamily: FONT, whiteSpace: 'nowrap', marginLeft: 6 }}>
                    <strong style={{ color: '#111827' }}>{valor}</strong>
                    <span style={{ color: '#d1d5db', margin: '0 2px' }}>·</span>{p}%
                </span>
            </div>
            <div style={{ height: compact ? 5 : 6, backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p}%`, backgroundColor: color, borderRadius: 99, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
            </div>
        </div>
    );
};

const Donut = ({ segs, r = 42, g = 12, sz = 100, label, sublabel }) => {
    const cx = sz / 2, cy = sz / 2, circ = 2 * Math.PI * r;
    const tot = segs.reduce((a, s) => a + (s.v || 0), 0);
    if (tot === 0) return <svg width={sz} height={sz}><circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={g} /></svg>;
    let off = 0;
    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={g} />
                {segs.map((s, i) => { const da = ((s.v || 0) / tot) * circ; const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth={g} strokeDasharray={`${da} ${circ}`} strokeDashoffset={-off} strokeLinecap="butt" />; off += da; return el; })}
            </svg>
            {label && (
                <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: sz > 100 ? '1.2rem' : '0.9rem', fontWeight: 800, color: '#111827', lineHeight: 1, fontFamily: FONT }}>{label}</div>
                    {sublabel && <div style={{ fontSize: '0.56rem', color: '#9ca3af', fontFamily: FONT, marginTop: 1 }}>{sublabel}</div>}
                </div>
            )}
        </div>
    );
};

const KPI = ({ icon: Icon, valor, label, sub, color, delay = 0 }) => (
    <div className="est-anim" style={{
        background: 'white', borderRadius: 10, padding: '9px 12px',
        border: '1px solid #e5e7eb', borderLeft: `4px solid ${color}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', gap: 9,
        animationDelay: `${delay}ms`,
    }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon style={{ color, fontSize: '0.82rem' }} />
        </div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontFamily: FONT }}>{valor}</div>
            <div style={{ fontSize: '0.63rem', fontWeight: 600, color: '#6b7280', fontFamily: FONT, marginTop: 2 }}>{label}</div>
            {sub && <div style={{ fontSize: '0.57rem', color: '#9ca3af', fontFamily: FONT, marginTop: 1 }}>{sub}</div>}
        </div>
    </div>
);

const Panel = ({ titulo, sub, icon: Icon, color, children, delay = 0, style = {} }) => (
    <div className="est-anim" style={{
        background: 'white', borderRadius: 10, border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden',
        animationDelay: `${delay}ms`, ...style,
    }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid #f1f5f9', background: `linear-gradient(135deg,${color}09 0%,transparent 100%)`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ color, fontSize: '0.74rem' }} />
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.80rem', fontWeight: 700, color: '#0f172a', fontFamily: FONT }}>{titulo}</div>
                {sub && <div style={{ fontSize: '0.61rem', color: '#9ca3af', fontFamily: FONT }}>{sub}</div>}
            </div>
        </div>
        <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
);

const Tag = ({ label, color }) => (
    <span style={{
        display: 'inline-block', padding: '2px 7px', borderRadius: 99,
        fontSize: '0.66rem', fontWeight: 600, margin: '2px',
        background: `${color}12`, color, border: `1px solid ${color}25`, fontFamily: FONT,
    }}>{label}</span>
);

const Insight = ({ tipo, titulo, detalle, delay = 0 }) => {
    const cfg = {
        ok:   { Ico: FaCheckCircle,        color: VERDE,   bg: '#f0fdf4', bd: '#bbf7d0', lbl: 'Fortaleza' },
        warn: { Ico: FaExclamationTriangle, color: NARANJA, bg: '#fff7ed', bd: '#fed7aa', lbl: 'Atención'  },
        crit: { Ico: FaTimesCircle,         color: ROJO,    bg: '#fef2f2', bd: '#fecaca', lbl: 'Crítico'   },
        info: { Ico: FaLightbulb,           color: AZUL,    bg: '#eff6ff', bd: '#bfdbfe', lbl: 'Sugerencia'},
    }[tipo] || { Ico: FaLightbulb, color: AZUL, bg: '#eff6ff', bd: '#bfdbfe', lbl: 'Info' };
    const { Ico } = cfg;
    return (
        <div className="est-anim" style={{
            background: cfg.bg, border: `1px solid ${cfg.bd}`, borderLeft: `3px solid ${cfg.color}`,
            borderRadius: 7, padding: '8px 11px', display: 'flex', gap: 8, alignItems: 'flex-start',
            animationDelay: `${delay}ms`,
        }}>
            <Ico style={{ color: cfg.color, fontSize: '0.82rem', flexShrink: 0, marginTop: 1 }} />
            <div>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: FONT }}>{cfg.lbl} · </span>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#0f172a', fontFamily: FONT }}>{titulo}</span>
                {detalle && <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#6b7280', fontFamily: FONT, lineHeight: 1.5 }}>{detalle}</p>}
            </div>
        </div>
    );
};

const Gauge = ({ valor, color, titulo, sz = 80 }) => {
    const r = sz * 0.36, cx = sz / 2, cy = sz * 0.58;
    const arcTotal = Math.PI * r, arcFill = arcTotal * Math.min(valor / 100, 1);
    const x1 = cx - r, x2 = cx + r;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <svg width={sz} height={sz * 0.6} viewBox={`0 0 ${sz} ${sz * 0.6}`}>
                    <path d={`M ${x1} ${cy} A ${r} ${r} 0 0 1 ${x2} ${cy}`} fill="none" stroke="#f1f5f9" strokeWidth={sz * 0.11} strokeLinecap="round" />
                    <path d={`M ${x1} ${cy} A ${r} ${r} 0 0 1 ${x2} ${cy}`} fill="none" stroke={color} strokeWidth={sz * 0.11} strokeLinecap="round" strokeDasharray={`${arcFill} ${arcTotal + 10}`} />
                </svg>
                <div style={{ position: 'absolute', bottom: 2, textAlign: 'center', lineHeight: 1 }}>
                    <span style={{ fontSize: sz > 75 ? '0.95rem' : '0.78rem', fontWeight: 800, color: '#0f172a', fontFamily: FONT }}>{valor}%</span>
                </div>
            </div>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#6b7280', fontFamily: FONT }}>{titulo}</span>
        </div>
    );
};

const BarrasVerticales = ({ data, alto = 80 }) => {
    if (!data?.length) return null;
    const maxVal = Math.max(...data.map(d => d.total), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%' }}>
            {data.map((d, i) => {
                const h = Math.max(6, Math.round((d.total / maxVal) * alto));
                const color = PALETA[i % PALETA.length];
                return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.60rem', fontWeight: 700, color: '#374151', fontFamily: FONT, marginBottom: 2 }}>{d.total}</span>
                        <div style={{ width: '100%', height: h, backgroundColor: color, borderRadius: '3px 3px 0 0' }} />
                        <span style={{ fontSize: '0.58rem', color: '#9ca3af', fontFamily: FONT, marginTop: 3 }}>{d.anio}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ── Avatar ────────────────────────────────────────────────────
const AvatarGraduado = ({ nombres, apellidos, fotoPerfil, size = 36 }) => {
    const [imgErr, setImgErr] = useState(false);
    const url = urlFoto(fotoPerfil);
    const ini = iniciales(nombres, apellidos);
    const bg  = colorAvatar(ini);
    if (url && !imgErr) {
        return (
            <img src={url} alt={`${nombres} ${apellidos}`} onError={() => setImgErr(true)}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
            />
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: bg, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.36 + 'px', fontWeight: 800, fontFamily: FONT,
            flexShrink: 0, border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', letterSpacing: '-0.5px',
        }}>
            {ini}
        </div>
    );
};

// ── Lista paginada de graduados ───────────────────────────────
const POR_PAGINA = 12;

const ListaGraduados = ({ graduados, filtros }) => {
    const [pagina, setPagina] = useState(1);
    useEffect(() => { setPagina(1); }, [filtros.provincia, filtros.canton]);

    if (!graduados?.length) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FaUsers style={{ color: ROJO, fontSize: '0.60rem' }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Graduados</span>
                        {filtros.canton && <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontFamily: FONT }}>· {filtros.canton}</span>}
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: 16 }}>
                        <FaUserCircle style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: 6 }} />
                        <p style={{ margin: 0, fontSize: '0.70rem', color: '#94a3b8', fontFamily: FONT }}>
                            Sin graduados{filtros.canton ? ` en ${filtros.canton}` : ''}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const totalPag  = Math.ceil(graduados.length / POR_PAGINA);
    const inicio    = (pagina - 1) * POR_PAGINA;
    const pagActual = graduados.slice(inicio, inicio + POR_PAGINA);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaUsers style={{ color: ROJO, fontSize: '0.60rem' }} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Graduados</span>
                    {filtros.canton && <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontFamily: FONT }}>· {filtros.canton}</span>}
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: ROJO, background: `${ROJO}12`, border: `1px solid ${ROJO}25`, borderRadius: 99, padding: '0px 6px', fontFamily: FONT, marginLeft: 'auto' }}>
                        {graduados.length}
                    </span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 6, padding: '4px 10px 4px 8px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                <div />
                <span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textTransform: 'uppercase' }}>Graduado</span>
                <span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textTransform: 'uppercase' }}>Estado</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {pagActual.map((g, i) => {
                    const esDis = g.disponibilidad === 'disponible';
                    return (
                        <div key={g._id || i} className="grad-card" style={{
                            display: 'grid', gridTemplateColumns: '28px 1fr auto',
                            alignItems: 'center', gap: 7, padding: '6px 10px 6px 8px',
                            background: i % 2 === 0 ? '#fef9f9' : 'transparent',
                            minHeight: 40, cursor: 'default', transition: 'all 0.15s ease',
                        }}>
                            <AvatarGraduado nombres={g.nombres} apellidos={g.apellidos} fotoPerfil={g.fotoPerfil} size={26} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e293b', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {g.nombres} {g.apellidos}
                                </div>
                                {g.anioGraduacion && (
                                    <span style={{ fontSize: '0.57rem', color: '#94a3b8', fontFamily: FONT }}>Graduado {g.anioGraduacion}</span>
                                )}
                            </div>
                            <span style={{
                                fontSize: '0.56rem', fontWeight: 700,
                                background: esDis ? `${VERDE}15` : `${GRIS}12`,
                                color: esDis ? VERDE : GRIS,
                                border: `1px solid ${esDis ? VERDE : GRIS}25`,
                                borderRadius: 99, padding: '2px 5px', fontFamily: FONT, whiteSpace: 'nowrap',
                            }}>
                                {esDis ? 'Disponible' : 'Empleado'}
                            </span>
                        </div>
                    );
                })}
            </div>
            {totalPag > 1 && (
                <div style={{ flexShrink: 0, borderTop: '1px solid #f1f5f9', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
                    <span style={{ fontSize: '0.60rem', color: '#94a3b8', fontFamily: FONT }}>
                        {inicio + 1}–{Math.min(inicio + POR_PAGINA, graduados.length)} de {graduados.length}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button className="pag-btn" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}
                            style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #e5e7eb', background: 'white', color: pagina === 1 ? '#d1d5db' : '#374151', cursor: pagina === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', transition: 'all 0.15s' }}>
                            <FaChevronLeft />
                        </button>
                        {Array.from({ length: Math.min(totalPag, 5) }, (_, i) => {
                            let pg;
                            if (totalPag <= 5)           pg = i + 1;
                            else if (pagina <= 3)         pg = i + 1;
                            else if (pagina >= totalPag - 2) pg = totalPag - 4 + i;
                            else                          pg = pagina - 2 + i;
                            return (
                                <button key={pg} className="pag-btn" onClick={() => setPagina(pg)} style={{
                                    width: 22, height: 22, borderRadius: 5,
                                    border: `1px solid ${pagina === pg ? ROJO : '#e5e7eb'}`,
                                    background: pagina === pg ? ROJO : 'white',
                                    color: pagina === pg ? 'white' : '#374151',
                                    cursor: 'pointer', fontSize: '0.62rem',
                                    fontWeight: pagina === pg ? 700 : 400,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: FONT, transition: 'all 0.15s',
                                }}>{pg}</button>
                            );
                        })}
                        <button className="pag-btn" disabled={pagina === totalPag} onClick={() => setPagina(p => p + 1)}
                            style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #e5e7eb', background: 'white', color: pagina === totalPag ? '#d1d5db' : '#374151', cursor: pagina === totalPag ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', transition: 'all 0.15s' }}>
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Columna izquierda del mapa ────────────────────────────────
const ColIzquierda = ({ filtros, porProvincia, porCanton, total, mitad }) => {
    const hayFiltroProv = !!filtros.provincia;
    if (hayFiltroProv) {
        const vacia = !porCanton?.length;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FaMapMarkerAlt style={{ color: ROJO, fontSize: '0.60rem' }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Cantones</span>
                        <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontFamily: FONT }}>· {filtros.provincia}</span>
                        {!vacia && (
                            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: ROJO, background: `${ROJO}12`, border: `1px solid ${ROJO}25`, borderRadius: 99, padding: '0px 6px', fontFamily: FONT, marginLeft: 'auto' }}>
                                {porCanton.length}
                            </span>
                        )}
                    </div>
                </div>
                {!vacia && (
                    <div style={{ display: 'grid', gridTemplateColumns: '10px 1fr 1fr 1fr', gap: 6, padding: '4px 10px 4px 8px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                        <div /><span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textTransform: 'uppercase' }}>Cantón</span>
                        <span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textAlign: 'center' }}>N</span>
                        <span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textAlign: 'center' }}>%</span>
                    </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                    {vacia ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontFamily: FONT }}>Sin cantones</span>
                        </div>
                    ) : (
                        porCanton.map((c, i) => {
                            const color  = PALETA[i % PALETA.length];
                            const porc   = pct(c.total, total);
                            const activo = filtros.canton && normCanton(filtros.canton) === normCanton(c.canton);
                            return (
                                <div key={i} className="prov-row" style={{
                                    display: 'grid', gridTemplateColumns: '10px 1fr 1fr 1fr',
                                    alignItems: 'center', gap: 6, padding: '6px 10px 6px 8px',
                                    background: activo ? `${ROJO}08` : i % 2 === 0 ? '#fef2f2' : 'transparent',
                                    minHeight: 32, borderLeft: activo ? `3px solid ${ROJO}` : '3px solid transparent',
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.70rem', fontWeight: activo ? 700 : 500, color: activo ? ROJO : '#1e293b', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{c.canton}</span>
                                    <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#0f172a', fontFamily: FONT, textAlign: 'center' }}>{c.total}</span>
                                    <span style={{ fontSize: '0.60rem', fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}25`, borderRadius: 99, padding: '2px 4px', textAlign: 'center', fontFamily: FONT, whiteSpace: 'nowrap', display: 'block', margin: '0 auto', width: 'fit-content' }}>{porc}%</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    const provincias = porProvincia.slice(0, mitad);
    const vacia = !provincias?.length;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaMapMarkerAlt style={{ color: CIAN, fontSize: '0.60rem' }} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Provincias</span>
                    {!vacia && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: CIAN, background: `${CIAN}12`, border: `1px solid ${CIAN}25`, borderRadius: 99, padding: '0px 6px', fontFamily: FONT }}>1–{provincias.length}</span>}
                </div>
            </div>
            {!vacia && (
                <div style={{ display: 'grid', gridTemplateColumns: '10px 1fr 1fr 1fr', gap: 6, padding: '4px 10px 4px 8px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                    <div /><span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textTransform: 'uppercase' }}>Provincia</span>
                    <span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textAlign: 'center' }}>N</span>
                    <span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textAlign: 'center' }}>%</span>
                </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {vacia ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontFamily: FONT }}>—</span></div> : (
                    provincias.map((p, i) => {
                        const color = PALETA[i % PALETA.length];
                        const porc  = pct(p.total, total);
                        return (
                            <div key={i} className="prov-row" style={{ display: 'grid', gridTemplateColumns: '10px 1fr 1fr 1fr', alignItems: 'center', gap: 6, padding: '6px 10px 6px 8px', background: i % 2 === 0 ? '#f8fafc' : 'transparent', minHeight: 32 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                                <span style={{ fontSize: '0.70rem', fontWeight: 500, color: '#1e293b', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.provincia}</span>
                                <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#0f172a', fontFamily: FONT, textAlign: 'center' }}>{p.total}</span>
                                <span style={{ fontSize: '0.60rem', fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}25`, borderRadius: 99, padding: '2px 4px', textAlign: 'center', fontFamily: FONT, whiteSpace: 'nowrap', display: 'block', margin: '0 auto', width: 'fit-content' }}>{porc}%</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// ── Columna derecha del mapa ──────────────────────────────────
const ColDerecha = ({ filtros, porProvincia, graduadosFiltrados, total, offset }) => {
    const hayFiltroProv = !!filtros.provincia;
    if (hayFiltroProv) {
        return <ListaGraduados graduados={graduadosFiltrados} filtros={filtros} total={total} />;
    }
    const provincias = porProvincia.slice(offset);
    const vacia = !provincias?.length;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaMapMarkerAlt style={{ color: CIAN, fontSize: '0.60rem' }} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Provincias</span>
                    {!vacia && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: CIAN, background: `${CIAN}12`, border: `1px solid ${CIAN}25`, borderRadius: 99, padding: '0px 6px', fontFamily: FONT }}>{offset + 1}–{offset + provincias.length}</span>}
                </div>
            </div>
            {!vacia && (
                <div style={{ display: 'grid', gridTemplateColumns: '10px 1fr 1fr 1fr', gap: 6, padding: '4px 10px 4px 8px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                    <div /><span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textTransform: 'uppercase' }}>Provincia</span>
                    <span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textAlign: 'center' }}>N</span>
                    <span style={{ fontSize: '0.57rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textAlign: 'center' }}>%</span>
                </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {vacia ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontFamily: FONT }}>—</span></div> : (
                    provincias.map((p, i) => {
                        const realIdx = i + offset;
                        const color   = PALETA[realIdx % PALETA.length];
                        const porc    = pct(p.total, total);
                        return (
                            <div key={i} className="prov-row" style={{ display: 'grid', gridTemplateColumns: '10px 1fr 1fr 1fr', alignItems: 'center', gap: 6, padding: '6px 10px 6px 8px', background: i % 2 === 0 ? '#f8fafc' : 'transparent', minHeight: 32 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                                <span style={{ fontSize: '0.70rem', fontWeight: 500, color: '#1e293b', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.provincia}</span>
                                <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#0f172a', fontFamily: FONT, textAlign: 'center' }}>{p.total}</span>
                                <span style={{ fontSize: '0.60rem', fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}25`, borderRadius: 99, padding: '2px 4px', textAlign: 'center', fontFamily: FONT, whiteSpace: 'nowrap', display: 'block', margin: '0 auto', width: 'fit-content' }}>{porc}%</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// ── Filtros inline ────────────────────────────────────────────
const DISP_LABELS = {
    'disponible':    'Buscando empleo',
    'trabajando':    'Trabajando',
    'estudiando':    'Estudiando',
    'no_disponible': 'No disponible',
};

const FiltrosInline = ({ datos, filtros, onChange, onLimpiar }) => {
    if (!datos?.graduadosRaw) return null;
    const raw = datos.graduadosRaw;

    const listaExcepto = (excluir) => {
        let lista = raw;
        if (excluir !== 'anio'          && filtros.anio)          lista = lista.filter(g => String(g.anioGraduacion) === filtros.anio);
        if (excluir !== 'provincia'     && filtros.provincia)     lista = lista.filter(g => g.provinciaActual === filtros.provincia);
        if (excluir !== 'canton'        && filtros.canton)        lista = lista.filter(g => g.cantonActual === filtros.canton);
        if (excluir !== 'genero'        && filtros.genero)        lista = lista.filter(g => g.genero === filtros.genero);
        if (excluir !== 'disponibilidad' && filtros.disponibilidad) lista = lista.filter(g => g.disponibilidad === filtros.disponibilidad);
        if (excluir !== 'especialidad'  && filtros.especialidad)  lista = lista.filter(g => (g.afinidades || []).some(a => a.categoria === filtros.especialidad));
        return lista;
    };

    const anios          = [...new Set(listaExcepto('anio').map(g => g.anioGraduacion).filter(Boolean))].sort();
    const provs          = [...new Set(listaExcepto('provincia').map(g => g.provinciaActual).filter(Boolean))].sort();
    const cantones       = filtros.provincia ? [...new Set(listaExcepto('canton').filter(g => g.provinciaActual === filtros.provincia).map(g => g.cantonActual).filter(Boolean))].sort() : [];
    const generos        = [...new Set(listaExcepto('genero').map(g => g.genero).filter(Boolean))].sort();
    const disponibles    = [...new Set(listaExcepto('disponibilidad').map(g => g.disponibilidad).filter(Boolean))].sort();
    const especialidades = [...new Set(listaExcepto('especialidad').flatMap(g => (g.afinidades || []).map(a => a.categoria)).filter(Boolean))].sort();

    const hayF   = Object.values(filtros).some(v => v !== '');
    const activos = Object.values(filtros).filter(v => v !== '').length;
    const etiquetas = { anio: 'Año', provincia: 'Provincia', canton: 'Cantón', genero: 'Género', disponibilidad: 'Disponibilidad', especialidad: 'Especialidad' };

    const Sel = ({ campo, placeholder, opciones, labelMap }) => (
        <select value={filtros[campo]} onChange={e => onChange(campo, e.target.value)}
            className={`fil-select${filtros[campo] ? ' activo' : ''}`}
            disabled={opciones.length === 0} style={{ opacity: opciones.length === 0 ? 0.45 : 1 }}>
            <option value="">{placeholder}{opciones.length === 0 ? ' —' : ''}</option>
            {opciones.map(op => <option key={op} value={op}>{labelMap?.[op] ?? op}</option>)}
        </select>
    );

    return (
        <div className="est-anim" style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '10px 14px', animationDelay: '20ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: `${ROJO}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaFilter style={{ color: ROJO, fontSize: '0.62rem' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', fontFamily: FONT }}>Filtros</span>
                    {hayF && <span style={{ background: ROJO, color: 'white', borderRadius: 99, fontSize: '0.55rem', fontWeight: 700, padding: '1px 5px', fontFamily: FONT }}>{activos}</span>}
                </div>
                <div style={{ width: 1, height: 20, background: '#e5e7eb', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    <Sel campo="anio"           placeholder="Año"            opciones={anios.map(String)} />
                    <Sel campo="provincia"      placeholder="Provincia"      opciones={provs} />
                    {filtros.provincia && <Sel campo="canton" placeholder="Cantón" opciones={cantones} />}
                    <Sel campo="genero"         placeholder="Género"         opciones={generos} />
                    <Sel campo="disponibilidad" placeholder="Disponibilidad" opciones={disponibles} labelMap={DISP_LABELS} />
                    <Sel campo="especialidad"   placeholder="Especialidad"   opciones={especialidades} />
                </div>
                {hayF && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        {Object.entries(filtros).filter(([, v]) => v).map(([k, v]) => (
                            <span key={k} style={{ background: `${ROJO}12`, color: ROJO, border: `1px solid ${ROJO}25`, borderRadius: 99, fontSize: '0.63rem', fontWeight: 600, padding: '2px 7px', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <span style={{ color: '#9ca3af', fontSize: '0.58rem' }}>{etiquetas[k]}:</span>&nbsp;{DISP_LABELS[v] ?? v}
                                <button onClick={() => onChange(k, '')} style={{ background: 'none', border: 'none', color: ROJO, cursor: 'pointer', padding: 0, fontSize: '0.70rem', lineHeight: 1, opacity: 0.7 }}>×</button>
                            </span>
                        ))}
                        <button onClick={onLimpiar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.65rem', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 2, padding: '2px 4px' }}>
                            <FaTimes style={{ fontSize: '0.55rem' }} />Limpiar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// MAPA
// ══════════════════════════════════════════════════════════════
const BOUNDS_PROV = {
    'azuay': [[-3.35, -79.40], [-2.38, -78.55]], 'bolivar': [[-1.95, -79.38], [-1.20, -78.60]],
    'canar': [[-3.10, -79.40], [-2.10, -78.60]], 'carchi': [[0.30, -78.35], [0.92, -77.60]],
    'chimborazo': [[-2.30, -79.10], [-1.25, -78.20]], 'cotopaxi': [[-1.50, -79.18], [-0.35, -78.30]],
    'el oro': [[-3.80, -80.35], [-2.95, -79.55]], 'esmeraldas': [[0.50, -80.30], [1.45, -78.85]],
    'guayas': [[-3.15, -80.35], [-1.55, -79.20]], 'imbabura': [[0.10, -78.75], [0.65, -77.80]],
    'loja': [[-4.70, -80.25], [-3.30, -78.85]], 'los rios': [[-1.80, -79.90], [-0.65, -79.20]],
    'manabi': [[-1.90, -80.90], [-0.05, -79.70]], 'morona santiago': [[-3.90, -78.50], [-1.45, -76.70]],
    'napo': [[-1.50, -78.30], [-0.30, -76.90]], 'orellana': [[-1.30, -77.50], [0.50, -75.20]],
    'pastaza': [[-2.70, -78.20], [-1.00, -75.80]], 'pichincha': [[-0.65, -79.10], [0.20, -78.00]],
    'santa elena': [[-3.20, -81.10], [-1.80, -80.30]], 'santo domingo de los tsachilas': [[-0.65, -79.60], [0.05, -78.90]],
    'sucumbios': [[-0.35, -77.60], [0.60, -75.20]], 'tungurahua': [[-1.60, -78.90], [-1.05, -78.20]],
    'zamora chinchipe': [[-5.00, -79.40], [-3.30, -77.90]],
};
const EC = [[-4.80, -80.50], [1.20, -75.80]];

const ControladorZoom = ({ filtros, cantonesGeoData }) => {
    const map = useMap();
    useEffect(() => {
        if (filtros.canton && cantonesGeoData) {
            const feat = cantonesGeoData.features?.find(f => {
                const n = f.properties?.DPA_DESCAN || f.properties?.DPA_CANTON || f.properties?.NAME_2 || '';
                return normCanton(n) === normCanton(filtros.canton);
            });
            if (feat) { try { const b = window.L.geoJSON(feat).getBounds(); if (b.isValid()) { map.fitBounds(b, { padding: [40, 40], maxZoom: 12 }); return; } } catch (_) { } }
        }
        if (filtros.provincia && cantonesGeoData) {
            const feats = cantonesGeoData.features?.filter(f => { const n = f.properties?.DPA_DESPRO || f.properties?.NAME_1 || ''; return norm(n) === norm(filtros.provincia); });
            if (feats?.length) { try { const b = window.L.geoJSON({ type: 'FeatureCollection', features: feats }).getBounds(); if (b.isValid()) { map.fitBounds(b, { padding: [30, 30], maxZoom: 10 }); return; } } catch (_) { } }
            const b = BOUNDS_PROV[norm(filtros.provincia)]; if (b) { map.fitBounds(b, { padding: [20, 20] }); return; }
        }
        map.fitBounds(EC, { padding: [8, 8], maxZoom: 8 });
    }, [filtros.provincia, filtros.canton]);
    return null;
};

const ZoomWatcher = ({ onZoom }) => {
    const map = useMap();
    useEffect(() => { map.on('zoomend', onZoom); return () => map.off('zoomend', onZoom); }, [map, onZoom]);
    return null;
};

const EtiquetasCantones = ({ cantonesGeoData, filtroProvNorm, lookupCant, lookupProv, filtroCanton }) => {
    const map = useMap();
    useEffect(() => {
        if (!cantonesGeoData?.features || !filtroProvNorm) return;
        const markers = [];
        const candidatos = [];
        cantonesGeoData.features.forEach(feature => {
            const np = feature.properties?.DPA_DESPRO || feature.properties?.NAME_1 || '';
            if (norm(np) !== filtroProvNorm) return;
            const nc = feature.properties?.DPA_DESCAN || feature.properties?.DPA_CANTON || feature.properties?.NAME_2 || '';
            if (!nc) return;
            const g = lookupCant[normCanton(nc)] || lookupCant[norm(nc)] || 0;
            if (g === 0) return;
            try {
                const layer = window.L.geoJSON(feature); const bounds = layer.getBounds();
                if (!bounds.isValid()) return;
                const sw = map.latLngToContainerPoint(bounds.getSouthWest());
                const ne = map.latLngToContainerPoint(bounds.getNorthEast());
                const pxW = Math.abs(ne.x - sw.x), pxH = Math.abs(ne.y - sw.y), area = pxW * pxH;
                candidatos.push({ feature, nc, g, bounds, pxW, pxH, area });
            } catch (_) { }
        });
        const total = candidatos.length;
        const cantonSelNorm = filtroCanton ? normCanton(filtroCanton) : '';
        candidatos.forEach(({ feature, nc, g, bounds, pxW, pxH, area }) => {
            const center = bounds.getCenter();
            const esSeleccionado = cantonSelNorm && (normCanton(nc) === cantonSelNorm || norm(nc) === cantonSelNorm);
            const palabras = nc.split(' ');
            let lineas;
            if (palabras.length === 1) lineas = [palabras[0]];
            else if (palabras.length === 2) lineas = palabras;
            else { const mid = Math.ceil(palabras.length / 2); lineas = [palabras.slice(0, mid).join(' '), palabras.slice(mid).join(' ')]; }
            const maxChars = Math.max(...lineas.map(l => l.length));
            const numLineas = lineas.length;
            const lado = Math.sqrt(area);
            const porArea = Math.floor((lado * 0.20) / (maxChars * 0.62));
            const porAncho = Math.floor((pxW * 0.65) / (maxChars * 0.62));
            const porAlto = Math.floor((pxH * 0.45) / (numLineas * 1.3));
            const limitGlobal = esSeleccionado ? 13 : total <= 3 ? 9 : total <= 6 ? 8 : 7;
            let fontSize = Math.min(porArea, porAncho, porAlto, limitGlobal);
            fontSize = Math.max(6, fontSize);
            if (fontSize < 6) return;
            const mostrarConteo = esSeleccionado ? true : (area >= 8000 && total <= 3 && fontSize >= 8);
            const iconW = pxW, iconH = pxH;
            const lineasHTML = lineas.map(linea => `<div style="font-family:${FONT};font-size:${fontSize}px;font-weight:${esSeleccionado ? 900 : 700};color:#ffffff;text-shadow:-1px -1px 0 rgba(0,0,0,0.85),1px -1px 0 rgba(0,0,0,0.85),-1px 1px 0 rgba(0,0,0,0.85),1px 1px 0 rgba(0,0,0,0.85),0 2px 3px rgba(0,0,0,0.95);text-align:center;white-space:nowrap;line-height:1.15;letter-spacing:0px;text-transform:uppercase;max-width:${pxW * 0.90}px;overflow:hidden;">${linea}</div>`).join('');
            const icon = window.L.divIcon({ className: '', html: `<div style="width:${iconW}px;height:${iconH}px;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;overflow:hidden;gap:0px;">${lineasHTML}${mostrarConteo ? `<div style="font-family:${FONT};font-size:${Math.max(6, fontSize - 1)}px;font-weight:600;color:rgba(255,255,255,0.85);text-shadow:0 1px 2px rgba(0,0,0,0.95);text-align:center;white-space:nowrap;margin-top:1px;line-height:1;">${g} grad.</div>` : ''}</div>`, iconSize: [iconW, iconH], iconAnchor: [iconW / 2, iconH / 2] });
            try { const marker = window.L.marker(center, { icon, interactive: false, zIndexOffset: 1000 }); marker.addTo(map); markers.push(marker); } catch (_) { }
        });
        return () => { markers.forEach(m => { try { map.removeLayer(m); } catch (_) { } }) };
    }, [cantonesGeoData, filtroProvNorm, lookupCant, lookupProv, filtroCanton, map]);
    return null;
};

const MapaGraduados = ({ porProvincia, porCanton, filtros, geoData }) => {
    const refC = useRef(null), refP = useRef(null);
    const [zoomKey, setZoomKey] = useState(0);
    const onZoom = useCallback(() => setZoomKey(k => k + 1), []);

    const lookupProv = useMemo(() => {
        const m = {};
        (porProvincia || []).forEach((p, i) => { m[norm(p.provincia)] = { total: p.total, color: PALETA[i % PALETA.length], colorLight: PALETA_LIGHT[i % PALETA_LIGHT.length] }; });
        return m;
    }, [porProvincia]);

    const lookupCant = useMemo(() => {
        const m = {};
        (porCanton || []).forEach(c => { m[normCanton(c.canton)] = c.total; });
        return m;
    }, [porCanton]);

    const filtroProvNorm = norm(filtros.provincia || '');
    const hayFiltroProv  = !!filtros.provincia;

    const getC = f => f.properties?.DPA_DESCAN || f.properties?.DPA_CANTON || f.properties?.NAME_2 || f.properties?.canton || '';
    const getP = f => f.properties?.DPA_DESPRO || f.properties?.NAME_1 || f.properties?.provincia || '';

    const lookupCantRef     = useRef(lookupCant);
    const lookupProvRef     = useRef(lookupProv);
    const hayFiltroPrvRef   = useRef(hayFiltroProv);
    const filtroProvNormRef = useRef(filtroProvNorm);
    useEffect(() => { lookupCantRef.current = lookupCant; }, [lookupCant]);
    useEffect(() => { lookupProvRef.current = lookupProv; }, [lookupProv]);
    useEffect(() => { hayFiltroPrvRef.current = hayFiltroProv; }, [hayFiltroProv]);
    useEffect(() => { filtroProvNormRef.current = filtroProvNorm; }, [filtroProvNorm]);

    const estCanton = useCallback((feature) => {
        const nc = getC(feature), np = getP(feature), pn = norm(np);
        const g  = lookupCant[normCanton(nc)] || lookupCant[norm(nc)] || 0;
        const pv = lookupProv[pn];
        if (hayFiltroProv && pn !== filtroProvNorm) return { fillColor: '#dde2e8', fillOpacity: 0.55, color: '#94a3b8', weight: 0.4 };
        if (!pv) return { fillColor: '#edf0f4', fillOpacity: 0.5, color: '#94a3b8', weight: 0.4 };
        if (!g)  return { fillColor: pv.colorLight, fillOpacity: 0.35, color: '#000', weight: 0.8 };
        return { fillColor: pv.color, fillOpacity: 0.80, color: '#000', weight: 1.2 };
    }, [lookupProv, lookupCant, hayFiltroProv, filtroProvNorm]);

    const estCantonRef = useRef(estCanton);
    useEffect(() => { estCantonRef.current = estCanton; }, [estCanton]);

    const estProv = useCallback((feature) => {
        const pn = norm(getP(feature)), pv = lookupProv[pn];
        if (hayFiltroProv && pn === filtroProvNorm && pv) return { fillOpacity: 0, color: pv.color, weight: 3 };
        return { fillOpacity: 0, color: pv ? '#475569' : '#94a3b8', weight: pv ? 1.8 : 0.8 };
    }, [lookupProv, hayFiltroProv, filtroProvNorm]);

    const estEc   = useCallback(() => ({ fillColor: '#e2e8f0', fillOpacity: 0.08, color: '#64748b', weight: 1.5 }), []);

    const onEach = useCallback((feature, layer) => {
        const nc = getC(feature), np = getP(feature);
        layer.on({
            mouseover(e) {
                const lCant = lookupCantRef.current, lProv = lookupProvRef.current;
                const hayFP = hayFiltroPrvRef.current, filtProv = filtroProvNormRef.current;
                const g  = lCant[normCanton(nc)] || lCant[norm(nc)] || 0;
                const pv = lProv[norm(np)];
                if (!pv) return;
                if (hayFP && norm(np) !== filtProv) return;
                const color = pv.color;
                layer.unbindTooltip();
                layer.bindTooltip(
                    `<div style="font-family:${FONT};min-width:120px">
                        <div style="font-weight:700;font-size:0.82rem;color:${color};margin-bottom:3px">${nc}</div>
                        <div style="font-size:0.74rem;color:#374151">
                            ${g > 0 ? `<strong style="color:#111827">${g}</strong> graduado${g !== 1 ? 's' : ''}` : '<span style="color:#9ca3af">Sin graduados</span>'}
                        </div>
                        <div style="font-size:0.64rem;color:#9ca3af;margin-top:2px">${np}</div>
                    </div>`,
                    { direction: 'top', opacity: 1, sticky: true }
                ).openTooltip(e.latlng);
                e.target.setStyle({ fillOpacity: g > 0 ? 1 : 0.5, weight: 2.5, color: '#000' });
                e.target.bringToFront();
            },
            mouseout(e) { layer.unbindTooltip(); e.target.setStyle(estCantonRef.current(feature)); },
        });
    }, []);

    const keyC = useMemo(() => {
        const cantStr = Object.entries(lookupCant).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|');
        return `c-${cantStr}-${filtros.provincia}-${filtros.canton}`;
    }, [lookupCant, filtros.provincia, filtros.canton]);

    const keyP = useMemo(() => `p-${JSON.stringify(Object.keys(lookupProv))}-${filtros.provincia}`, [lookupProv, filtros.provincia]);

    if (!porProvincia?.length || !geoData?.ecuador || !geoData?.cantones || !geoData?.provincias) {
        return (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <FaGlobeAmericas style={{ fontSize: '2rem', color: '#94a3b8' }} />
                <p style={{ margin: 0, fontSize: '0.80rem', color: '#475569', fontFamily: FONT, fontWeight: 700 }}>
                    {!geoData?.cantones ? 'Cargando mapa...' : 'Sin datos geográficos'}
                </p>
            </div>
        );
    }

    return (
        <MapContainer bounds={EC} boundsOptions={{ padding: [8, 8] }} minZoom={6.4} maxZoom={13}
            maxBounds={[[-5.5, -82.0], [2.0, -74.5]]} maxBoundsViscosity={0.9}
            style={{ width: '100%', height: '100%', borderRadius: 8, zIndex: 1 }}
            scrollWheelZoom zoomControl>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/" target="_blank">CARTO</a>'
                subdomains="abcd" maxZoom={19} />
            <GeoJSON key="ec" data={geoData.ecuador} style={estEc} />
            <GeoJSON key={keyC} ref={refC} data={geoData.cantones} style={estCanton} onEachFeature={onEach} />
            <GeoJSON key={keyP} ref={refP} data={geoData.provincias} style={estProv} />
            <ControladorZoom filtros={filtros} cantonesGeoData={geoData.cantones} />
            <ZoomWatcher onZoom={onZoom} />
            {hayFiltroProv && (
                <EtiquetasCantones
                    key={`etq-${filtroProvNorm}-${zoomKey}`}
                    cantonesGeoData={geoData.cantones}
                    filtroProvNorm={filtroProvNorm}
                    lookupCant={lookupCant}
                    lookupProv={lookupProv}
                    filtroCanton={filtros.canton}
                />
            )}
        </MapContainer>
    );
};

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL DEL TAB
// ══════════════════════════════════════════════════════════════
const TabIndicadoresGraduados = ({ df, datos, filtros, cambiarFiltro, limpiar, geoData, geoError }) => {
    const {
        totalGraduados = 0, totalPublicos = 0, totalDisponibles = 0,
        disponibilidadCounts = {},
        totalProyectos = 0, totalCertificados = 0, promedioProyectos = 0, promedioCertificados = 0,
        tasaEmpleabilidad, tasaVisibilidad,
        porGenero = [], porAnio = [], porProvincia = [], porCanton = [],
        topTecnologias = [], topAfinidades = [], topHabilidadesBlandas = [],
        anioMax = {}, insights = [], planAccion = [], tecsPorCategoria = {},
        tecEmergentes = [],
        distribucionProyectos = [], distribucionCertificados = [],
        graduadosFiltrados = [],
    } = df;

    const totalEmpleados = totalGraduados - totalDisponibles;
    const hayF     = Object.values(filtros).some(v => v !== '');
    const tasaEmp  = tasaEmpleabilidad ?? pct(totalEmpleados, totalGraduados);
    const tasaVis  = tasaVisibilidad   ?? pct(totalPublicos, totalGraduados);
    const tasaProy = Math.min(Math.round((promedioProyectos / 5) * 100), 100);
    const tasaCert = Math.min(Math.round((promedioCertificados / 4) * 100), 100);

    let badgeTendencia = 0;
    if (porAnio.length >= 2) {
        const ult = porAnio[porAnio.length - 1], pen = porAnio[porAnio.length - 2];
        badgeTendencia = pen.total > 0 ? Math.round(((ult.total - pen.total) / pen.total) * 100) : 0;
    }

    const mitadProv = Math.ceil(porProvincia.length / 2);
    const sinD = { margin: 0, fontSize: '0.74rem', color: '#9ca3af', textAlign: 'center', padding: '12px 0', fontFamily: FONT };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* 1. KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
                <KPI icon={FaUsers}        valor={totalGraduados}   label="Graduados"         sub="Con tesis verificada"                color={ROJO}   delay={0}   />
                <KPI icon={FaGraduationCap}valor={totalPublicos}    label="Perfiles públicos" sub={`${tasaVis}% visibles`}             color={AZUL}   delay={40}  />
                <KPI icon={FaBriefcase}    valor={totalEmpleados}   label="Empleados"         sub={`${tasaEmp}% del total`}            color={VERDE}  delay={80}  />
                <KPI icon={FaTrophy}       valor={totalCertificados}label="Certificados"      sub={`~${promedioCertificados} por graduado`} color={MORADO} delay={120} />
                <KPI icon={FaCode}         valor={totalProyectos}   label="Proyectos"         sub={`~${promedioProyectos} por graduado`}    color={CIAN}   delay={160} />
                <KPI icon={FaHandshake}    valor={totalDisponibles} label="Buscan empleo"     sub={`${pct(totalDisponibles, totalGraduados)}% disponibles`} color={NARANJA} delay={200} />
            </div>

            {/* 2. Filtros */}
            <FiltrosInline datos={datos} filtros={filtros} onChange={cambiarFiltro} onLimpiar={limpiar} />

            {/* 3. Bloque mapa */}
            <div className="est-anim" style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', animationDelay: '80ms' }}>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9', background: `linear-gradient(135deg,${CIAN}0a,transparent)`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${CIAN}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FaMapMarked style={{ color: CIAN, fontSize: '0.80rem' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', fontFamily: FONT }}>Distribución Geográfica</div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: FONT }}>
                            Ubicación actual de graduados · Ecuador continental
                            {filtros.provincia && <span style={{ color: ROJO, marginLeft: 4, fontWeight: 600 }}>· {filtros.provincia}{filtros.canton ? ` › ${filtros.canton}` : ''}</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        {[[PALETA[0], 'Con graduados'], [PALETA_LIGHT[0], 'Sin graduados en cantón'], ['#edf0f4', 'Sin presencia']].map(([bg, lbl]) => (
                            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ width: 13, height: 13, borderRadius: 3, background: bg, border: '1px solid #94a3b8' }} />
                                <span style={{ fontSize: '0.62rem', color: '#6b7280', fontFamily: FONT }}>{lbl}</span>
                            </div>
                        ))}
                        {filtros.provincia && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: `${ROJO}10`, border: `1px solid ${ROJO}25`, borderRadius: 99 }}>
                                <FaUsers style={{ color: ROJO, fontSize: '0.58rem' }} />
                                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: ROJO, fontFamily: FONT }}>
                                    {graduadosFiltrados.length} graduado{graduadosFiltrados.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {geoError && (
                    <div style={{ padding: '9px 16px', background: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaExclamationTriangle style={{ color: '#d97706', fontSize: '0.80rem', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#92400e', fontFamily: FONT }}>
                            No se pudieron cargar los archivos GeoJSON. Verifica <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: 3, fontSize: '0.68rem' }}>public/geo/</code>
                        </p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px 1fr', gap: 0, height: 460 }}>
                    <div style={{ borderRight: '1px solid #f1f5f9', overflow: 'hidden' }}>
                        <ColIzquierda filtros={filtros} porProvincia={porProvincia} porCanton={porCanton} total={totalGraduados} mitad={mitadProv} />
                    </div>
                    <div style={{ padding: '8px', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', height: '100%' }}>
                        <MapaGraduados porProvincia={porProvincia} porCanton={porCanton} filtros={filtros} geoData={geoData} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <ColDerecha filtros={filtros} porProvincia={porProvincia} graduadosFiltrados={graduadosFiltrados} total={totalGraduados} offset={mitadProv} />
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', padding: '14px 20px', background: '#fafafa' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '0.63rem', fontWeight: 700, color: '#94a3b8', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Indicadores clave de calidad
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
                        <Gauge valor={tasaEmp}  color={tasaEmp >= 70 ? VERDE : tasaEmp >= 50 ? NARANJA : ROJO} titulo="Empleabilidad" sz={84} />
                        <Gauge valor={tasaVis}  color={tasaVis >= 70 ? AZUL : NARANJA}                         titulo="Visibilidad"   sz={84} />
                        <Gauge valor={tasaProy} color={CIAN}                                                    titulo="Portafolio"    sz={84} />
                        <Gauge valor={tasaCert} color={MORADO}                                                  titulo="Certificación" sz={84} />
                    </div>
                </div>
            </div>

            {/* 4. Género | Disponibilidad | Graduados por año */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
                <Panel titulo="Género" sub="Distribución por sexo" icon={FaVenusMars} color={AZUL} delay={120}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <Donut segs={porGenero.map((g, i) => ({ v: g.valor, c: PALETA[i] }))} r={38} g={11} sz={96} label={totalGraduados} sublabel="total" />
                        <div style={{ width: '100%' }}>
                            {porGenero.map((g, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETA[i], flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.72rem', color: '#374151', flex: 1, fontFamily: FONT }}>{g.label}</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#111827', fontFamily: FONT }}>{g.valor}</span>
                                    <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontFamily: FONT }}>({pct(g.valor, totalGraduados)}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>

                <Panel titulo="Disponibilidad" sub="Estado laboral" icon={FaBriefcase} color={VERDE} delay={160}>
                    {(() => {
                        // 4 estados de disponibilidad (con fallback a totalDisponibles si no llegó el objeto)
                        const dc = disponibilidadCounts && Object.keys(disponibilidadCounts).length > 0
                            ? disponibilidadCounts
                            : { disponible: totalDisponibles, trabajando: 0, estudiando: 0, no_disponible: Math.max(totalGraduados - totalDisponibles, 0) };
                        const filas = [
                            { key: 'disponible',    label: 'Buscando empleo', color: NARANJA, v: dc.disponible    || 0 },
                            { key: 'trabajando',    label: 'Trabajando',      color: VERDE,   v: dc.trabajando    || 0 },
                            { key: 'estudiando',    label: 'Estudiando',      color: MORADO,  v: dc.estudiando    || 0 },
                            { key: 'no_disponible', label: 'No disponible',   color: GRIS,    v: dc.no_disponible || 0 },
                        ];
                        const totalEstados = filas.reduce((s, f) => s + f.v, 0);
                        const segs = filas.filter(f => f.v > 0).map(f => ({ v: f.v, c: f.color }));
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                <Donut
                                    segs={segs.length > 0 ? segs : [{ v: 1, c: '#e5e7eb' }]}
                                    r={38} g={11} sz={96}
                                    label={`${tasaEmp}%`} sublabel="empleados"
                                />
                                <div style={{ width: '100%' }}>
                                    {filas.map(f => (
                                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.72rem', color: '#374151', flex: 1, fontFamily: FONT }}>{f.label}</span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: f.color, fontFamily: FONT }}>{f.v}</span>
                                            <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontFamily: FONT }}>({pct(f.v, totalEstados || totalGraduados)}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </Panel>

                <Panel titulo="Graduados por año" sub="Tendencia histórica de egresados" icon={FaCalendarAlt} color={MORADO} delay={200}>
                    {porAnio.length === 0 ? <p style={sinD}>Sin datos</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <BarrasVerticales data={porAnio} alto={80} />
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {anioMax?.anio > 0 && (
                                    <div style={{ background: `${MORADO}10`, border: `1px solid ${MORADO}25`, borderRadius: 7, padding: '5px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <FaTrophy style={{ color: MORADO, fontSize: '0.72rem' }} />
                                        <span style={{ fontSize: '0.68rem', color: '#374151', fontFamily: FONT }}>Año récord: <strong style={{ color: MORADO }}>{anioMax.anio}</strong> · {anioMax.total} graduados</span>
                                    </div>
                                )}
                                {badgeTendencia !== 0 && (
                                    <div style={{ background: badgeTendencia > 0 ? `${VERDE}10` : `${ROJO}10`, border: `1px solid ${badgeTendencia > 0 ? VERDE : ROJO}25`, borderRadius: 7, padding: '5px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {badgeTendencia > 0 ? <FaArrowUp style={{ color: VERDE, fontSize: '0.72rem' }} /> : <FaArrowDown style={{ color: ROJO, fontSize: '0.72rem' }} />}
                                        <span style={{ fontSize: '0.68rem', color: '#374151', fontFamily: FONT }}>{badgeTendencia > 0 ? '+' : ''}{badgeTendencia}% vs año anterior</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Panel>
            </div>

            {/* Nota metodológica */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                <FaExclamationTriangle style={{ color: '#d97706', fontSize: '0.72rem', flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: '0.67rem', color: '#92400e', fontFamily: FONT, lineHeight: 1.6 }}>
                    <strong>Supuesto metodológico:</strong> La tasa de empleabilidad se calcula sobre graduados con <em>disponibilidad = "no disponible"</em>, lo que indica que no buscan empleo activamente. Esto incluye graduados empleados, en posgrado o con perfil no actualizado. Los valores deben interpretarse como indicador de referencia, no como dato exacto de inserción laboral.
                </p>
            </div>

            {/* 5. Tecnologías */}
            <Panel titulo="Tecnologías más Usadas" sub="Detectadas desde proyectos publicados · graduados verificados" icon={FaCode} color={AZUL} delay={240}>
                {topTecnologias.length === 0 ? <p style={sinD}>Sin tecnologías</p> : (
                    <>
                        {Object.keys(tecsPorCategoria || {}).length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                {Object.entries(tecsPorCategoria).sort((a, b) => b[1] - a[1]).map(([cat, tot], i) => (
                                    <div key={cat} style={{ background: `${PALETA[i % PALETA.length]}10`, border: `1px solid ${PALETA[i % PALETA.length]}25`, borderRadius: 6, padding: '4px 9px', display: 'flex', gap: 5, alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: PALETA[i % PALETA.length], fontFamily: FONT, textTransform: 'capitalize' }}>{cat}</span>
                                        <span style={{ fontSize: '0.60rem', color: '#6b7280', fontFamily: FONT }}>{tot}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0 28px', marginBottom: 12 }}>
                            {topTecnologias.slice(0, 12).map((t, i) => (
                                <Barra key={i} label={t.tecnologia} valor={t.total} total={totalGraduados} color={PALETA[i % PALETA.length]} />
                            ))}
                        </div>
                        {topTecnologias.length > 12 && (
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, marginBottom: 12 }}>
                                <p style={{ margin: '0 0 5px', fontSize: '0.61rem', fontWeight: 700, color: '#9ca3af', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Otras tecnologías detectadas</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {topTecnologias.slice(12).map((t, i) => <Tag key={i} label={`${t.tecnologia} (${t.total})`} color={PALETA[(i + 12) % PALETA.length]} />)}
                                </div>
                            </div>
                        )}
                        {tecEmergentes.length > 0 && (
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.62rem', fontWeight: 700, color: '#374151', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <FaArrowUp style={{ color: VERDE, fontSize: '0.58rem' }} />Tendencia reciente — últimos 2 años
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {tecEmergentes.map((t, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', background: `${VERDE}0e`, border: `1px solid ${VERDE}25`, borderRadius: 7 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: VERDE, flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#1e293b', fontFamily: FONT }}>{t.tecnologia}</span>
                                            <span style={{ fontSize: '0.60rem', color: VERDE, fontWeight: 700, fontFamily: FONT }}>{t.total}</span>
                                            {t.totalGeneral > 0 && <span style={{ fontSize: '0.57rem', color: '#94a3b8', fontFamily: FONT }}>/{t.totalGeneral} total</span>}
                                        </div>
                                    ))}
                                </div>
                                <p style={{ margin: '6px 0 0', fontSize: '0.60rem', color: '#9ca3af', fontFamily: FONT }}>Tecnologías usadas por graduados de los últimos 2 años. Refleja las tendencias más recientes del mercado laboral.</p>
                            </div>
                        )}
                    </>
                )}
            </Panel>

            {/* 6. Distribución portafolio */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Panel titulo="Distribución de Proyectos por Graduado" sub={`Total: ${totalProyectos} proyectos · Promedio: ${promedioProyectos} por graduado`} icon={FaCode} color={CIAN} delay={260}>
                    {distribucionProyectos.length === 0 ? <p style={sinD}>Sin datos</p> : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
                                {distribucionProyectos.map((r, i) => {
                                    const p2 = totalGraduados > 0 ? Math.round(r.cantidad / totalGraduados * 100) : 0;
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#374151', fontFamily: FONT }}>{r.label}</span>
                                                </div>
                                                <span style={{ fontSize: '0.68rem', fontFamily: FONT, color: '#6b7280' }}><strong style={{ color: '#111827' }}>{r.cantidad}</strong> grad. · {p2}%</span>
                                            </div>
                                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${p2}%`, background: r.color, borderRadius: 99, transition: 'width 0.7s ease' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ padding: '7px 10px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 6 }}>
                                <p style={{ margin: 0, fontSize: '0.64rem', color: '#0f766e', fontFamily: FONT, lineHeight: 1.5 }}>El portafolio máximo es de <strong>5 proyectos</strong> por graduado. Graduados con 3–5 proyectos representan el perfil más competitivo para empleadores.</p>
                            </div>
                        </>
                    )}
                </Panel>

                <Panel titulo="Distribución de Certificados por Graduado" sub={`Total: ${totalCertificados} certificados · Promedio: ${promedioCertificados} por graduado`} icon={FaTrophy} color={MORADO} delay={270}>
                    {distribucionCertificados.length === 0 ? <p style={sinD}>Sin datos</p> : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
                                {distribucionCertificados.map((r, i) => {
                                    const p2 = totalGraduados > 0 ? Math.round(r.cantidad / totalGraduados * 100) : 0;
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#374151', fontFamily: FONT }}>{r.label}</span>
                                                </div>
                                                <span style={{ fontSize: '0.68rem', fontFamily: FONT, color: '#6b7280' }}><strong style={{ color: '#111827' }}>{r.cantidad}</strong> grad. · {p2}%</span>
                                            </div>
                                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${p2}%`, background: r.color, borderRadius: 99, transition: 'width 0.7s ease' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ padding: '7px 10px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 6 }}>
                                <p style={{ margin: 0, fontSize: '0.64rem', color: '#6b21a8', fontFamily: FONT, lineHeight: 1.5 }}>El portafolio máximo es de <strong>5 certificados</strong> por graduado. Certificaciones en cloud, IA y DevOps tienen mayor valoración en el mercado.</p>
                            </div>
                        </>
                    )}
                </Panel>
            </div>

            {/* 7. Especialidades + Habilidades */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Panel titulo="Especialidades" sub="Por categoría de proyectos" icon={FaChartPie} color={ROJO} delay={280}>
                    {topAfinidades.length === 0 ? <p style={sinD}>Sin especialidades</p> : (
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                            <Donut segs={topAfinidades.map((a, i) => ({ v: a.total, c: PALETA[i] }))} r={44} g={13} sz={112} />
                            <div style={{ flex: 1 }}>
                                {topAfinidades.map((a, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: PALETA[i], flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.71rem', color: '#374151', flex: 1, fontFamily: FONT }}>{a.categoria}</span>
                                        <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#111827', fontFamily: FONT }}>{a.total}</span>
                                        <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontFamily: FONT }}>{pct(a.total, totalGraduados)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Panel>

                <Panel titulo="Habilidades Blandas" sub="Detectadas por NLP" icon={FaHandshake} color={MORADO} delay={300}>
                    {topHabilidadesBlandas.length === 0 ? <p style={sinD}>Sin habilidades</p> : (
                        <>
                            {topHabilidadesBlandas.slice(0, 7).map((h, i) => (
                                <Barra key={i} label={h.habilidad} valor={h.total} total={totalGraduados} color={MORADO} compact />
                            ))}
                            {topHabilidadesBlandas.length > 7 && (
                                <div style={{ marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 7, display: 'flex', flexWrap: 'wrap' }}>
                                    {topHabilidadesBlandas.slice(7).map((h, i) => <Tag key={i} label={h.habilidad} color={MORADO} />)}
                                </div>
                            )}
                        </>
                    )}
                </Panel>
            </div>

            {/* 8. Insights + Plan de acción */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12 }}>
                <div className="est-anim" style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden', animationDelay: '360ms' }}>
                    <div style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9', background: `linear-gradient(135deg,${ROJO}09,transparent)`, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${ROJO}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaLightbulb style={{ color: ROJO, fontSize: '0.82rem' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: FONT }}>Análisis de Situación Institucional</div>
                            <div style={{ fontSize: '0.61rem', color: '#9ca3af', fontFamily: FONT }}>
                                Generado automáticamente · {(insights || []).length} observaciones
                                {hayF && <span style={{ color: ROJO, marginLeft: 4 }}>· Filtrado aplicado</span>}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                            {[['crit', 'Crítico', ROJO], ['warn', 'Atención', NARANJA], ['ok', 'Fortaleza', VERDE], ['info', 'Sugerencia', AZUL]].map(([tipo, lbl, c]) => (
                                <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                                    <span style={{ fontSize: '0.60rem', color: '#6b7280', fontFamily: FONT }}>{lbl}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: '13px 16px' }}>
                        {(insights || []).length === 0 ? <p style={sinD}>Sin datos suficientes</p> : (
                            <>
                                {['crit', 'warn', 'ok', 'info'].map(tipo => {
                                    const grupo = (insights || []).filter(r => r.tipo === tipo);
                                    if (!grupo.length) return null;
                                    const lbls = { crit: '🔴 Puntos Críticos', warn: '⚠️ Puntos de Atención', ok: '✅ Fortalezas', info: '💡 Sugerencias' };
                                    return (
                                        <div key={tipo} style={{ marginBottom: 12 }}>
                                            <p style={{ margin: '0 0 6px', fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: FONT }}>{lbls[tipo]}</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 6 }}>
                                                {grupo.map((r, i) => <Insight key={i} tipo={r.tipo} titulo={r.titulo} detalle={r.detalle} delay={i * 35} />)}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ marginTop: 4, padding: '8px 12px', background: '#f8fafc', borderRadius: 7, border: '1px solid #e5e7eb' }}>
                                    <p style={{ margin: 0, fontSize: '0.67rem', color: '#9ca3af', fontFamily: FONT, lineHeight: 1.6 }}>
                                        <strong style={{ color: '#6b7280' }}>Nota metodológica:</strong> Análisis generado desde perfiles, proyectos y certificados. Complementar con encuestas según Res. 018.CP.2025.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="est-anim" style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden', animationDelay: '380ms' }}>
                    <div style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9', background: `linear-gradient(135deg,${AZUL}09,transparent)`, display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${AZUL}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaBullseye style={{ color: AZUL, fontSize: '0.82rem' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: FONT }}>Plan de Acción</div>
                            <div style={{ fontSize: '0.61rem', color: '#9ca3af', fontFamily: FONT }}>Acciones priorizadas por impacto</div>
                        </div>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                        {(planAccion || []).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <FaCheckCircle style={{ color: VERDE, fontSize: '1.6rem', marginBottom: 8 }} />
                                <p style={{ margin: 0, fontSize: '0.74rem', color: VERDE, fontFamily: FONT, fontWeight: 600 }}>¡Sin acciones críticas!</p>
                                <p style={{ margin: '4px 0 0', fontSize: '0.66rem', color: '#9ca3af', fontFamily: FONT }}>Todos los indicadores están en niveles aceptables.</p>
                            </div>
                        ) : (
                            (planAccion || []).map((a, i) => {
                                const imp = { alto: ROJO, medio: NARANJA, bajo: CIAN }[a.impacto] || AZUL;
                                return (
                                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < planAccion.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <div style={{ width: 22, height: 22, borderRadius: 6, background: `${imp}15`, border: `1px solid ${imp}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: imp, fontFamily: FONT }}>{a.prioridad}</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', fontFamily: FONT, marginBottom: 2 }}>{a.accion}</div>
                                            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.60rem', fontWeight: 700, color: imp, background: `${imp}12`, border: `1px solid ${imp}25`, borderRadius: 99, padding: '1px 5px', fontFamily: FONT }}>Impacto {a.impacto}</span>
                                                <span style={{ fontSize: '0.60rem', color: '#9ca3af', fontFamily: FONT }}>{a.meta}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TabIndicadoresGraduados;
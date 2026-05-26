// frontend/src/pages/admin/AdminLayout.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
    FaTachometerAlt, FaUserGraduate, FaClipboardList,
    FaChartBar, FaChartPie, FaCalendarAlt, FaSignOutAlt, FaBars,
    FaTimes, FaBell, FaShieldAlt, FaBuilding,
    FaCircle, FaCheckDouble, FaUserCircle, FaEnvelope,
} from 'react-icons/fa';
import axios from 'axios';
import { leerSesion, eliminarSesion } from '../../utils/storageSeguro';
import useInactivityTimeout from '../../utils/useInactivityTimeout';
import SessionWarningModal from '../../utils/SessionWarningModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const POLL_INTERVAL = 60_000;

const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};
const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
const urlFoto = (ruta) =>
    ruta ? `${BASE}/${ruta}` : null;

const fmtFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-EC', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
    });

const NAV_ITEMS = [
    { key: 'dashboard', label: 'Panel Principal', icon: FaTachometerAlt, path: '/home-admin' },
    { key: 'graduados', label: 'Graduados', icon: FaUserGraduate, path: '/home-admin/graduados' },
    { key: 'empleadores', label: 'Empleadores', icon: FaBuilding, path: '/home-admin/empleadores' },
    { key: 'encuestas', label: 'Encuestas', icon: FaClipboardList, path: '/home-admin/encuestas' },
    { key: 'estadisticas', label: 'Estadísticas', icon: FaChartPie, path: '/home-admin/estadisticas' },
    { key: 'reportes', label: 'Reportes', icon: FaChartBar, path: '/home-admin/reportes' },
    { key: 'eventos', label: 'Eventos', icon: FaCalendarAlt, path: '/home-admin/eventos' },
];

const SIDEBAR_W = 200;
const COLLAPSED = 54;

// ══════════════════════════════════════════════
// COMPONENTE AUXILIAR — tarjeta de cada solicitud
// ══════════════════════════════════════════════
const SolicitudItem = ({ sol }) => (
    <div style={sn.solicItem}>
        <div style={sn.solicHeader}>
            <span style={sn.solicNombre}>{sol.nombre}</span>
            <span style={sn.solicFecha}>{fmtFecha(sol.enviadoEn)}</span>
        </div>
        {sol.empresa ? (
            <p style={sn.solicEmpresa}>🏢 {sol.empresa}</p>
        ) : null}
        <a href={'mailto:' + sol.email} style={sn.solicEmail}>
            <FaEnvelope style={{ marginRight: 4, fontSize: '0.6rem' }} />
            {sol.email}
        </a>
        <p style={sn.solicMensaje}>"{sol.mensaje}"</p>
    </div>
);

// ══════════════════════════════════════════════
// COMPONENTE DETALLE NOTIFICACIÓN
// ══════════════════════════════════════════════
const DetalleNotif = ({ notif, onVolver }) => (
    <div style={sn.detalle}>
        <button style={sn.btnVolver} onClick={onVolver}>
            ← Volver
        </button>

        <div style={sn.detalleGrad}>
            {notif.graduado?.fotoPerfil ? (
                <img
                    src={urlFoto(notif.graduado.fotoPerfil)}
                    alt=""
                    style={sn.detalleGradFoto}
                />
            ) : (
                <FaUserCircle style={{ fontSize: '2rem', color: '#adb5bd' }} />
            )}
            <div>
                <p style={sn.detalleGradNombre}>
                    {notif.graduado?.nombres} {notif.graduado?.apellidos}
                </p>
                <p style={sn.detalleGradSub}>
                    Ing. en Software · ESPOCH
                </p>
            </div>
        </div>

        <p style={sn.detalleFecha}>{fmtFecha(notif.createdAt)}</p>

        <p style={sn.detalleSolicTitulo}>
            {notif.solicitudes?.length || 0} interesado(s)
        </p>

        <div style={sn.solicLista}>
            {(notif.solicitudes || []).map((sol, i) => (
                <SolicitudItem key={i} sol={sol} />
            ))}
        </div>
    </div>
);

// ══════════════════════════════════════════════
// ADMIN LAYOUT
// ══════════════════════════════════════════════
const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const notifRef = useRef(null);

    // ─────────────────────────────────────────────────────────────────────────
    // TODOS LOS useState PRIMERO — antes de cualquier return condicional
    // Regla de React: los hooks NUNCA pueden ir después de un return condicional
    // ─────────────────────────────────────────────────────────────────────────
    const [expandido, setExpandido] = useState(true);
    const [notifAbierto, setNotifAbierto] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [cargandoNotif, setCargandoNotif] = useState(false);
    const [notifDetalle, setNotifDetalle] = useState(null);
    const [showSessionWarning, setShowSessionWarning] = useState(false);

    // ─────────────────────────────────────────────────────────────────────────
    // TODOS LOS useCallback DESPUÉS de los useState, antes del return condicional
    // ─────────────────────────────────────────────────────────────────────────
    const handleSessionLogout = useCallback(() => {
        setShowSessionWarning(false);
        eliminarSesion('usuario');
        navigate('/login');
    }, [navigate]);

    const { extendSession } = useInactivityTimeout({
        timeoutMs: 10 * 1000,     // ⬅ PRUEBA: 2 min → cambiar a 15 * 60 * 1000 en producción
        warningMs: 5 * 1000,       // ⬅ advertencia 30 s antes del cierre
        onWarning: () => setShowSessionWarning(true),
        onLogout: handleSessionLogout,
    });

    const cargarNotificaciones = useCallback(async () => {
        try {
            const resp = await axios.get(
                `${API}/admin/notificaciones`,
                { headers: hdrs() }
            );
            setNotificaciones(resp.data.notificaciones || []);
            setNoLeidas(resp.data.noLeidas || 0);
        } catch (e) {
            console.warn('No se pudieron cargar notificaciones admin:', e.message);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // TODOS LOS useEffect DESPUÉS de los useCallback, antes del return condicional
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        cargarNotificaciones();
        const intervalo = setInterval(cargarNotificaciones, POLL_INTERVAL);
        return () => clearInterval(intervalo);
    }, [cargarNotificaciones]);

    // ─────────────────────────────────────────────────────────────────────────
    // RECIÉN AQUÍ el return condicional — después de TODOS los hooks
    // ─────────────────────────────────────────────────────────────────────────
    const usuario = leerSesion('usuario') || {};
    if (!usuario || usuario.rol !== 'admin') {
        navigate('/login');
        return null;
    }

    // ── Abrir / cerrar panel ────────────────────────────
    const abrirPanel = async () => {
        const abriendo = !notifAbierto;
        setNotifAbierto(abriendo);
        if (abriendo) {
            setCargandoNotif(true);
            await cargarNotificaciones();
            setCargandoNotif(false);
        } else {
            setNotifDetalle(null);
        }
    };

    // ── Marcar una como leída y mostrar detalle ─────────
    const marcarLeida = async (notif) => {
        setNotifDetalle(notif);
        setNotificaciones(ns =>
            ns.map(n => n._id === notif._id ? { ...n, leido: true } : n)
        );
        setNoLeidas(prev => Math.max(0, prev - 1));
        try {
            await axios.patch(
                `${API}/admin/notificaciones/${notif._id}/leer`,
                {},
                { headers: hdrs() }
            );
            await cargarNotificaciones();
        } catch (e) {
            console.warn('Error al marcar notif admin:', e.message);
            cargarNotificaciones();
        }
    };

    // ── Marcar todas ────────────────────────────────────
    const marcarTodasLeidas = async () => {
        setNotificaciones(ns => ns.map(n => ({ ...n, leido: true })));
        setNoLeidas(0);
        setNotifDetalle(null);
        try {
            await axios.patch(
                `${API}/admin/notificaciones/leer-todas`,
                {},
                { headers: hdrs() }
            );
            await cargarNotificaciones();
        } catch (e) {
            console.warn('Error marcar todas admin:', e.message);
            cargarNotificaciones();
        }
    };

    const cerrarSesion = () => {
        eliminarSesion('usuario');
        navigate('/login');
    };

    const estaActivo = (path) =>
        path === '/home-admin'
            ? location.pathname === '/home-admin'
            : location.pathname.startsWith(path);

    const sbW = expandido ? SIDEBAR_W : COLLAPSED;

    return (
        <div style={s.root}>

            {/* ══ SIDEBAR ══ */}
            <aside style={{ ...s.sidebar, width: sbW }}>

                <div style={s.sbHead}>
                    {expandido && (
                        <div style={s.logoRow}>
                            <div style={s.logoIco}>
                                <FaShieldAlt style={{ fontSize: '0.75rem', color: 'white' }} />
                            </div>
                            <div>
                                <p style={s.logoMain}>Admin Panel</p>
                                <p style={s.logoSub}>ESPOCH Software</p>
                            </div>
                        </div>
                    )}
                    <button
                        style={{ ...s.btnToggle, margin: expandido ? '0' : '0 auto' }}
                        onClick={() => setExpandido(v => !v)}
                    >
                        {expandido
                            ? <FaTimes style={{ fontSize: '0.58rem', color: '#6c757d' }} />
                            : <FaBars style={{ fontSize: '0.58rem', color: '#6c757d' }} />
                        }
                    </button>
                </div>

                <div style={s.linea} />

                <nav style={s.nav}>
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const activo = estaActivo(item.path);
                        return (
                            <button
                                key={item.key}
                                style={{
                                    ...s.navItem,
                                    backgroundColor: activo ? '#fff5f5' : 'transparent',
                                    borderLeft: activo
                                        ? '3px solid var(--color-espoch-rojo)'
                                        : '3px solid transparent',
                                    justifyContent: expandido ? 'flex-start' : 'center',
                                    paddingLeft: expandido ? 10 : 0,
                                }}
                                onClick={() => navigate(item.path)}
                                title={!expandido ? item.label : undefined}
                            >
                                <Icon style={{
                                    fontSize: '0.85rem',
                                    color: activo ? 'var(--color-espoch-rojo)' : '#adb5bd',
                                    flexShrink: 0,
                                }} />
                                {expandido && (
                                    <span style={{
                                        ...s.navLabel,
                                        color: activo ? '#2c3e50' : '#6c757d',
                                        fontWeight: activo ? '700' : '500',
                                    }}>
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div style={s.sbFoot}>
                    <div style={s.linea} />
                    {expandido ? (
                        <div style={s.footRow}>
                            <div style={s.avatarFoot}>
                                {(usuario.nombre || 'A')[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={s.footNombre}>{usuario.nombre || 'Admin'}</p>
                                <p style={s.footRol}>Administrador</p>
                            </div>
                            <button style={s.btnSalir} onClick={cerrarSesion} title="Cerrar sesión">
                                <FaSignOutAlt style={{ fontSize: '0.68rem', color: '#6c757d' }} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                            <button style={s.btnSalir} onClick={cerrarSesion} title="Cerrar sesión">
                                <FaSignOutAlt style={{ fontSize: '0.68rem', color: '#6c757d' }} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* ══ ÁREA PRINCIPAL ══ */}
            <div style={{ ...s.main, marginLeft: sbW, transition: 'margin-left 0.2s ease' }}>

                {/* TOPBAR */}
                <header style={s.topbar}>
                    <h1 style={s.topTitulo}>
                        Panel Administrativo · Carrera de Software ESPOCH
                    </h1>
                    <div style={s.topDer}>

                        {/* ══ CAMPANA ══ */}
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button
                                style={s.btnIcono}
                                onClick={abrirPanel}
                                title="Notificaciones"
                            >
                                <FaBell style={{ fontSize: '0.82rem', color: '#6c757d' }} />
                                {noLeidas > 0 && (
                                    <span style={s.notifBadge}>
                                        {noLeidas > 9 ? '9+' : noLeidas}
                                    </span>
                                )}
                            </button>

                            {notifAbierto && (
                                <React.Fragment>
                                    <div
                                        style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                                        onClick={() => {
                                            setNotifAbierto(false);
                                            setNotifDetalle(null);
                                        }}
                                    />

                                    <div style={sn.panel}>

                                        <div style={sn.header}>
                                            <span style={sn.titulo}>Notificaciones</span>
                                            {noLeidas > 0 && (
                                                <button
                                                    style={sn.btnMarcarTodas}
                                                    onClick={marcarTodasLeidas}
                                                >
                                                    <FaCheckDouble size={10} style={{ marginRight: 4 }} />
                                                    Marcar todas leídas
                                                </button>
                                            )}
                                        </div>

                                        {notifDetalle ? (
                                            <DetalleNotif
                                                notif={notifDetalle}
                                                onVolver={() => setNotifDetalle(null)}
                                            />
                                        ) : (
                                            <div style={sn.lista}>
                                                {cargandoNotif ? (
                                                    <div style={sn.vacio}>
                                                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#adb5bd' }}>
                                                            Cargando...
                                                        </p>
                                                    </div>
                                                ) : notificaciones.length === 0 ? (
                                                    <div style={sn.vacio}>
                                                        <FaBell style={{ fontSize: '1.6rem', color: '#dee2e6', marginBottom: 6 }} />
                                                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#adb5bd' }}>
                                                            Sin notificaciones por ahora
                                                        </p>
                                                    </div>
                                                ) : (
                                                    notificaciones.map(n => {
                                                        const esNueva = !n.leido;
                                                        return (
                                                            <div
                                                                key={n._id}
                                                                style={{
                                                                    ...sn.item,
                                                                    backgroundColor: esNueva ? '#fff8f8' : 'transparent',
                                                                    borderLeft: esNueva
                                                                        ? '3px solid var(--color-espoch-rojo)'
                                                                        : '3px solid transparent',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => marcarLeida(n)}
                                                            >
                                                                <div style={sn.itemDot}>
                                                                    {esNueva && (
                                                                        <FaCircle style={{
                                                                            fontSize: '0.45rem',
                                                                            color: 'var(--color-espoch-rojo)',
                                                                        }} />
                                                                    )}
                                                                </div>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <p style={{
                                                                        margin: '0 0 2px',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: '700',
                                                                        color: esNueva
                                                                            ? 'var(--color-espoch-rojo)'
                                                                            : '#adb5bd',
                                                                    }}>
                                                                        {n.titulo}
                                                                    </p>
                                                                    <p style={{
                                                                        margin: '0 0 3px',
                                                                        fontSize: '0.78rem',
                                                                        color: '#2c3e50',
                                                                        fontWeight: esNueva ? '600' : '400',
                                                                        lineHeight: 1.45,
                                                                        overflow: 'hidden',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                    }}>
                                                                        {n.mensaje}
                                                                    </p>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <span style={sn.fecha}>
                                                                            {fmtFecha(n.createdAt)}
                                                                        </span>
                                                                        {n.solicitudes?.length > 0 && (
                                                                            <span style={sn.countBadge}>
                                                                                {n.solicitudes.length} interesado(s)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}

                                        {!notifDetalle && noLeidas === 0 && notificaciones.length > 0 && (
                                            <div style={sn.footer}>Todo al día ✓</div>
                                        )}
                                    </div>
                                </React.Fragment>
                            )}
                        </div>

                        <div style={s.avatarTop} title={usuario.nombre}>
                            {(usuario.nombre || 'A')[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* CONTENIDO */}
                <main style={s.contenido}>
                    <Outlet />
                </main>
            </div>

            {/* ══ MODAL INACTIVIDAD — ISO/IEC 27002:2022 Control 8.1 / NIST AC-12 ══ */}
            <SessionWarningModal
                visible={showSessionWarning}
                secondsLeft={5}          // ← debe coincidir con warningMs / 1000
                onExtend={() => { extendSession(); setShowSessionWarning(false); }}
                onLogout={handleSessionLogout}
            />
        </div>
    );
};

// ══════════════════════════════════════════════
// ESTILOS LAYOUT
// ══════════════════════════════════════════════
const s = {
    root: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Segoe UI', Roboto, sans-serif" },
    sidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, backgroundColor: 'white', borderRight: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden', zIndex: 100, boxShadow: '2px 0 8px rgba(0,0,0,0.05)' },
    sbHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 10px', minHeight: 60, flexShrink: 0, gap: 8 },
    logoRow: { display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 },
    logoIco: { width: 28, height: 28, borderRadius: 7, backgroundColor: 'var(--color-espoch-rojo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    logoMain: { margin: 0, fontSize: '0.8rem', fontWeight: '800', color: '#2c3e50', whiteSpace: 'nowrap' },
    logoSub: { margin: 0, fontSize: '0.58rem', color: '#adb5bd', whiteSpace: 'nowrap' },
    btnToggle: { background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 6, cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    linea: { height: 1, backgroundColor: '#f0f0f0', margin: '0 10px', flexShrink: 0 },
    nav: { flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'hidden' },
    navItem: { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', width: '100%', minHeight: 38, transition: 'background 0.12s', textAlign: 'left' },
    navLabel: { fontSize: '0.8rem', whiteSpace: 'nowrap' },
    sbFoot: { flexShrink: 0, paddingBottom: 8 },
    footRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px' },
    avatarFoot: { width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: '700', flexShrink: 0 },
    footNombre: { margin: 0, fontSize: '0.72rem', fontWeight: '600', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    footRol: { margin: 0, fontSize: '0.58rem', color: '#adb5bd' },
    btnSalir: { background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 6, cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    main: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },
    topbar: { position: 'sticky', top: 0, zIndex: 50, height: 58, backgroundColor: 'white', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 },
    topTitulo: { margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#2c3e50' },
    topDer: { display: 'flex', alignItems: 'center', gap: 10 },
    btnIcono: { position: 'relative', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    notifBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'var(--color-espoch-rojo)', color: 'white', borderRadius: '50%', fontSize: '0.52rem', fontWeight: '700', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', lineHeight: 1 },
    avatarTop: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' },
    contenido: { flex: 1, padding: '22px 26px', backgroundColor: '#f0f2f5', overflowY: 'auto' },
};

// ══════════════════════════════════════════════
// ESTILOS PANEL NOTIFICACIONES
// ══════════════════════════════════════════════
const sn = {
    panel: { position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 340, backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.16)', zIndex: 200, overflow: 'hidden' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px 9px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' },
    titulo: { fontSize: '0.84rem', fontWeight: '700', color: '#2c3e50' },
    btnMarcarTodas: { display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--color-espoch-rojo)', fontWeight: '600', padding: 0 },
    lista: { maxHeight: 360, overflowY: 'auto' },
    item: { display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f5f5f5', transition: 'background-color 0.15s' },
    itemDot: { width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingTop: 3 },
    fecha: { fontSize: '0.66rem', color: '#adb5bd' },
    countBadge: { fontSize: '0.62rem', backgroundColor: '#fff1f2', color: 'var(--color-espoch-rojo)', border: '1px solid #fecdd3', borderRadius: 20, padding: '1px 6px', fontWeight: '600' },
    vacio: { textAlign: 'center', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    footer: { textAlign: 'center', padding: '8px', fontSize: '0.72rem', color: '#adb5bd', backgroundColor: '#fafafa', borderTop: '1px solid #f0f0f0' },
    detalle: { maxHeight: 420, overflowY: 'auto', padding: '12px 14px' },
    btnVolver: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.74rem', color: 'var(--color-espoch-rojo)', fontWeight: '700', padding: '0 0 10px', display: 'block' },
    detalleGrad: { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', border: '1px solid #e9ecef', borderRadius: 8, padding: '10px 12px', marginBottom: 8 },
    detalleGradFoto: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-espoch-rojo)', flexShrink: 0 },
    detalleGradNombre: { margin: '0 0 1px', fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' },
    detalleGradSub: { margin: 0, fontSize: '0.65rem', color: '#64748b' },
    detalleFecha: { margin: '0 0 10px', fontSize: '0.66rem', color: '#adb5bd' },
    detalleSolicTitulo: { margin: '0 0 8px', fontSize: '0.74rem', fontWeight: '700', color: '#0f172a' },
    solicLista: { display: 'flex', flexDirection: 'column', gap: 8 },
    solicItem: { backgroundColor: '#f8fafc', border: '1px solid #e9ecef', borderRadius: 8, padding: '10px 12px' },
    solicHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    solicNombre: { fontSize: '0.78rem', fontWeight: '700', color: '#0f172a' },
    solicFecha: { fontSize: '0.62rem', color: '#adb5bd' },
    solicEmpresa: { margin: '0 0 3px', fontSize: '0.7rem', color: '#64748b' },
    solicEmail: { display: 'inline-flex', alignItems: 'center', fontSize: '0.7rem', color: 'var(--color-espoch-rojo)', fontWeight: '600', textDecoration: 'none', marginBottom: 5 },
    solicMensaje: { margin: 0, fontSize: '0.72rem', color: '#374151', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '3px solid #e9ecef', paddingLeft: 8 },
};

export default AdminLayout;
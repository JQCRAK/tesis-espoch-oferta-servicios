// frontend/src/pages/graduado/LayoutGraduado.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserCircle, FaClipboardList,
    FaBell, FaBullhorn, FaSignOutAlt,
    FaCircle, FaCheckDouble, FaEnvelope,
    FaBuilding, FaUser, FaBars, FaTimes,
} from 'react-icons/fa';
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

const NAV_ITEMS = [
    { icon: FaBullhorn,      label: 'Noticias',  path: '/graduado/noticias' },
    { icon: FaClipboardList, label: 'Encuestas', path: '/graduado/encuestas' },
    { icon: FaUserCircle,    label: 'Mi Perfil', path: '/graduado/perfil' },
];

// ══════════════════════════════════════════════
// HOOK ANCHO DE VENTANA
// ══════════════════════════════════════════════
const useWindowWidth = () => {
    const [width, setWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );
    useEffect(() => {
        const fn = () => setWidth(window.innerWidth);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);
    return width;
};

// ══════════════════════════════════════════════
// FILA EMAIL
// ══════════════════════════════════════════════
const FilaEmail = ({ email }) => (
    <div style={nd.fila}>
        <div style={nd.filaIco}>
            <FaEnvelope style={{ fontSize: '0.62rem', color: '#64748b' }} />
        </div>
        <div style={nd.filaInfo}>
            <span style={nd.filaLabel}>Correo</span>
            <a href={'mailto:' + email} style={nd.emailLink}>
                {email || '—'}
            </a>
        </div>
    </div>
);

// ══════════════════════════════════════════════
// DETALLE CONTACTO
// ══════════════════════════════════════════════
const DetalleContacto = ({ notif, onVolver }) => {
    const meta = notif.metadata || {};
    return (
        <div style={nd.wrap}>
            <button style={nd.btnVolver} onClick={onVolver}>
                ← Volver
            </button>

            <div style={nd.cabecera}>
                <div style={nd.iconoWrap}>
                    <FaEnvelope style={{ color: '#be1e2d', fontSize: '1rem' }} />
                </div>
                <div>
                    <p style={nd.cabeceraH}>Alguien está interesado en tu perfil</p>
                    <p style={nd.cabeceraF}>
                        {new Date(notif.createdAt).toLocaleDateString('es-EC', {
                            day: 'numeric', month: 'long',
                            hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>

            <div style={nd.seccion}>
                <p style={nd.secTitulo}>DATOS DEL INTERESADO</p>

                <div style={nd.fila}>
                    <div style={nd.filaIco}>
                        <FaUser style={{ fontSize: '0.62rem', color: '#be1e2d' }} />
                    </div>
                    <div style={nd.filaInfo}>
                        <span style={nd.filaLabel}>Nombre</span>
                        <span style={nd.filaVal}>{meta.nombre || '—'}</span>
                    </div>
                </div>

                {meta.empresa ? (
                    <div style={nd.fila}>
                        <div style={nd.filaIco}>
                            <FaBuilding style={{ fontSize: '0.62rem', color: '#64748b' }} />
                        </div>
                        <div style={nd.filaInfo}>
                            <span style={nd.filaLabel}>Empresa</span>
                            <span style={nd.filaVal}>{meta.empresa}</span>
                        </div>
                    </div>
                ) : null}

                <FilaEmail email={meta.email || ''} />
            </div>

            <div style={nd.seccion}>
                <p style={nd.secTitulo}>MENSAJE</p>
                <div style={nd.mensajeBox}>
                    <p style={nd.mensajeTxt}>
                        {meta.mensaje || notif.mensaje}
                    </p>
                </div>
            </div>

            <div style={nd.aviso}>
                <FaEnvelope style={{ color: '#be1e2d', flexShrink: 0, fontSize: '0.68rem', marginTop: 1 }} />
                <span style={nd.avisoTxt}>
                    También recibiste estos datos en tu correo personal.
                    Puedes responder directamente a <strong>{meta.email}</strong>.
                </span>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// LAYOUT GRADUADO
// ══════════════════════════════════════════════
const LayoutGraduado = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const notifRef  = useRef(null);
    const width     = useWindowWidth();
    const isMobile  = width <= 768;
    const isTablet  = width <= 1024;

    // ─────────────────────────────────────────────────────────────────────────
    // TODOS LOS useState PRIMERO — antes de cualquier return condicional
    // ─────────────────────────────────────────────────────────────────────────
    const [usuario,            setUsuario]            = useState(null);
    const [notifAbierto,       setNotifAbierto]       = useState(false);
    const [notificaciones,     setNotificaciones]     = useState([]);
    const [noLeidas,           setNoLeidas]           = useState(0);
    const [cargandoNotif,      setCargandoNotif]      = useState(false);
    const [notifDetalle,       setNotifDetalle]       = useState(null);
    const [showSessionWarning, setShowSessionWarning] = useState(false);
    const [menuMovilAbierto,   setMenuMovilAbierto]   = useState(false);

    // ─────────────────────────────────────────────────────────────────────────
    // TODOS LOS useCallback Y HOOKS PERSONALIZADOS — antes del return condicional
    // ─────────────────────────────────────────────────────────────────────────
    const handleSessionLogout = useCallback(() => {
        setShowSessionWarning(false);
        eliminarSesion('usuario');
        navigate('/login');
    }, [navigate]);

    const { extendSession } = useInactivityTimeout({
        timeoutMs: 15 * 60 * 1000,
        warningMs: 30 * 1000,
        onWarning: () => setShowSessionWarning(true),
        onLogout:  handleSessionLogout,
    });

    const cargarUsuario = useCallback(() => {
        const u = leerSesion('usuario');
        if (!u) { navigate('/'); return; }
        setUsuario(u);
    }, [navigate]);

    const cargarNotificaciones = useCallback(async () => {
        try {
            const resp = await axios.get(`${API}/notificaciones`, { headers: hdrs() });
            setNotificaciones(resp.data.notificaciones || []);
            setNoLeidas(resp.data.noLeidas || 0);
        } catch (e) {
            console.warn('No se pudieron cargar notificaciones:', e.message);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // TODOS LOS useEffect — antes del return condicional
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        cargarUsuario();
    }, [cargarUsuario, location.pathname]);

    useEffect(() => {
        cargarNotificaciones();
        const intervalo = setInterval(cargarNotificaciones, POLL_INTERVAL);
        return () => clearInterval(intervalo);
    }, [cargarNotificaciones]);

    // Cerrar menú móvil al cambiar de ruta
    useEffect(() => {
        setMenuMovilAbierto(false);
    }, [location.pathname]);

    // Cerrar menú móvil al hacer resize a desktop
    useEffect(() => {
        if (!isMobile) setMenuMovilAbierto(false);
    }, [isMobile]);

    // ─────────────────────────────────────────────────────────────────────────
    // Funciones regulares (no hooks) — pueden ir en cualquier lugar
    // ─────────────────────────────────────────────────────────────────────────
    const marcarLeida = async (id) => {
        setNotificaciones(ns =>
            ns.map(n => n._id === id ? { ...n, leido: true } : n)
        );
        setNoLeidas(prev => Math.max(0, prev - 1));
        try {
            await axios.patch(
                `${API}/notificaciones/${id}/leer`,
                {},
                { headers: hdrs() }
            );
        } catch (e) {
            console.warn('Error al marcar notificación:', e.message);
            cargarNotificaciones();
        }
    };

    const marcarTodasLeidas = async () => {
        setNotificaciones(ns => ns.map(n => ({ ...n, leido: true })));
        setNoLeidas(0);
        setNotifDetalle(null);
        try {
            await axios.patch(
                `${API}/notificaciones/leer-todas`,
                {},
                { headers: hdrs() }
            );
        } catch (e) {
            console.warn('Error al marcar todas:', e.message);
            cargarNotificaciones();
        }
    };

    const handleClickNotif = async (notif) => {
        if (!notif.leido) await marcarLeida(notif._id);
        if (notif.tipo === 'contacto') setNotifDetalle(notif);
    };

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

    const cerrarSesion = () => {
        eliminarSesion('usuario');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    // ══════════════════════════════════════════════
    // ESTILOS RESPONSIVOS DINÁMICOS
    // ══════════════════════════════════════════════
    const navbarStyle = {
        height: isMobile ? '56px' : '62px',
        minHeight: isMobile ? '56px' : '62px',
        backgroundColor: 'var(--color-espoch-rojo)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 14px' : isTablet ? '0 16px' : '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        flexShrink: 0,
        zIndex: 100,
        position: 'relative',
    };

    const notifPanelStyle = {
        position: 'fixed',
        top: isMobile ? '56px' : 'auto',
        right: isMobile ? '0' : '0',
        left: isMobile ? '0' : 'auto',
        bottom: isMobile ? '0' : 'auto',
        marginTop: isMobile ? '0' : '10px',
        width: isMobile ? '100%' : '320px',
        backgroundColor: 'white',
        border: isMobile ? 'none' : '1px solid #e9ecef',
        borderRadius: isMobile ? '0' : '10px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
        zIndex: 200,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isMobile ? 'calc(100vh - 56px)' : '420px',
    };

    return (
        <div style={styles.root}>
            {/* ══ NAVBAR ══ */}
            <nav style={navbarStyle}>

                {/* Logo */}
                <div style={styles.logoArea}>
                    <div style={styles.logoBadge}>
                        <img
                            src="/img/ESPOCH_LOGO.png"
                            alt="ESPOCH"
                            style={{ height: '28px', width: '28px', objectFit: 'contain' }}
                            onError={e => {
                                if (!e.target.dataset.fallback) {
                                    e.target.dataset.fallback = '1';
                                    e.target.src = '/img/FIE_LOGO.png';
                                } else {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML =
                                        '<span style="color:white;font-weight:800;font-size:0.85rem">ES</span>';
                                }
                            }}
                        />
                    </div>
                    <div>
                        <div style={{ ...styles.logoTitulo, fontSize: isMobile ? '0.78rem' : '0.9rem' }}>
                            Portal de Graduados
                        </div>
                        {!isMobile && (
                            <div style={styles.logoSub}>Carrera de Software · ESPOCH</div>
                        )}
                    </div>
                </div>

                {/* Nav central — solo en desktop/tablet */}
                {!isMobile && (
                    <div style={styles.navCentro}>
                        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
                            const activo = isActive(path);
                            return (
                                <button
                                    key={path}
                                    onClick={() => navigate(path)}
                                    style={{ ...styles.navBtn, ...(activo ? styles.navBtnActivo : {}) }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon style={styles.navIcon} />
                                        {!isTablet || width > 900 ? label : null}
                                    </span>
                                    <span style={{
                                        display: 'block', height: '2px',
                                        width: activo ? '100%' : '0%',
                                        backgroundColor: 'white', borderRadius: '2px',
                                        transition: 'width 0.2s ease',
                                    }} />
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Derecha */}
                <div style={{ ...styles.navDerecha, gap: isMobile ? '6px' : '10px' }}>
                    {!isMobile && usuario && (
                        <span style={styles.userName}>
                            {usuario.nombres?.split(' ')[0] || usuario.nombre?.split(' ')[0]}
                        </span>
                    )}

                    {/* ── CAMPANA ── */}
                    <div ref={notifRef} style={{ position: 'relative' }}>
                        <button
                            style={styles.btnCampana}
                            onClick={abrirPanel}
                            title="Notificaciones"
                        >
                            <FaBell size={isMobile ? 17 : 15} />
                            {noLeidas > 0 && (
                                <span style={styles.badge}>
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

                                <div style={notifPanelStyle}>

                                    <div style={styles.notifHeader}>
                                        <span style={styles.notifTitulo}>Notificaciones</span>
                                        {noLeidas > 0 && (
                                            <button
                                                style={styles.btnMarcarTodas}
                                                onClick={marcarTodasLeidas}
                                            >
                                                <FaCheckDouble size={10} style={{ marginRight: 4 }} />
                                                Marcar todas leídas
                                            </button>
                                        )}
                                    </div>

                                    {notifDetalle ? (
                                        <div style={{ flex: 1, overflowY: 'auto' }}>
                                            <DetalleContacto
                                                notif={notifDetalle}
                                                onVolver={() => setNotifDetalle(null)}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ ...styles.notifLista, flex: 1, overflowY: 'auto' }}>
                                            {cargandoNotif ? (
                                                <div style={styles.notifVacio}>
                                                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#adb5bd' }}>
                                                        Cargando...
                                                    </p>
                                                </div>
                                            ) : notificaciones.length === 0 ? (
                                                <div style={styles.notifVacio}>
                                                    <FaBell style={{ fontSize: '1.6rem', color: '#dee2e6', marginBottom: 6 }} />
                                                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#adb5bd' }}>
                                                        Sin notificaciones por ahora
                                                    </p>
                                                </div>
                                            ) : (
                                                notificaciones.map(n => (
                                                    <div
                                                        key={n._id}
                                                        style={{
                                                            ...styles.notifItem,
                                                            backgroundColor: n.leido ? 'transparent' : '#fff8f8',
                                                            borderLeft: n.leido
                                                                ? '3px solid transparent'
                                                                : '3px solid var(--color-espoch-rojo)',
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={() => handleClickNotif(n)}
                                                    >
                                                        <div style={styles.notifDot}>
                                                            {!n.leido && (
                                                                <FaCircle style={{ fontSize: '0.45rem', color: 'var(--color-espoch-rojo)' }} />
                                                            )}
                                                        </div>

                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{
                                                                margin: '0 0 2px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '700',
                                                                color: n.leido ? '#adb5bd' : 'var(--color-espoch-rojo)',
                                                            }}>
                                                                {n.titulo}
                                                            </p>
                                                            <p style={{
                                                                margin: '0 0 3px',
                                                                fontSize: '0.78rem',
                                                                color: '#2c3e50',
                                                                fontWeight: n.leido ? '400' : '600',
                                                                lineHeight: 1.45,
                                                                overflow: 'hidden',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                            }}>
                                                                {n.mensaje}
                                                            </p>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={styles.notifFecha}>
                                                                    {new Date(n.createdAt).toLocaleDateString('es-EC', {
                                                                        day: 'numeric', month: 'short',
                                                                        hour: '2-digit', minute: '2-digit',
                                                                    })}
                                                                </span>
                                                                {n.tipo === 'contacto' && (
                                                                    <span style={styles.tipoBadge}>
                                                                        Ver detalle →
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {!notifDetalle && noLeidas === 0 && notificaciones.length > 0 && (
                                        <div style={styles.notifFooter}>Todo al día ✓</div>
                                    )}
                                </div>
                            </React.Fragment>
                        )}
                    </div>

                    {!isMobile && (
                        <button style={styles.btnSalir} onClick={cerrarSesion}>
                            <FaSignOutAlt size={11} />
                            Salir
                        </button>
                    )}

                    {/* Hamburguesa — solo móvil */}
                    {isMobile && (
                        <button
                            onClick={() => setMenuMovilAbierto(v => !v)}
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: 7,
                                color: 'white',
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                        >
                            {menuMovilAbierto ? <FaTimes size={15} /> : <FaBars size={15} />}
                        </button>
                    )}
                </div>
            </nav>

            {/* ══ MENÚ MÓVIL DESPLEGABLE ══ */}
            {isMobile && menuMovilAbierto && (
                <div style={{
                    backgroundColor: '#a01825',
                    zIndex: 99,
                    flexShrink: 0,
                    borderBottom: '2px solid rgba(255,255,255,0.15)',
                    padding: '6px 0 8px',
                }}>
                    {/* Nombre usuario */}
                    {usuario && (
                        <div style={{
                            padding: '6px 18px 10px',
                            borderBottom: '1px solid rgba(255,255,255,0.15)',
                            marginBottom: 4,
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Hola, </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'white' }}>
                                {usuario.nombres?.split(' ')[0] || usuario.nombre?.split(' ')[0]}
                            </span>
                        </div>
                    )}

                    {/* Ítems de nav */}
                    {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
                        const activo = isActive(path);
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    padding: '11px 18px',
                                    background: activo ? 'rgba(255,255,255,0.18)' : 'transparent',
                                    border: 'none',
                                    borderLeft: activo ? '3px solid white' : '3px solid transparent',
                                    color: activo ? 'white' : 'rgba(255,255,255,0.75)',
                                    fontSize: '0.87rem',
                                    fontWeight: activo ? '700' : '500',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <Icon style={{ fontSize: '0.9rem', flexShrink: 0 }} />
                                {label}
                            </button>
                        );
                    })}

                    {/* Cerrar sesión */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 6, paddingTop: 6 }}>
                        <button
                            onClick={cerrarSesion}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                width: '100%',
                                padding: '10px 18px',
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.65)',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <FaSignOutAlt size={13} />
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            )}

            {/* ══ CONTENIDO ══ */}
            <div style={styles.contenido}>
                <Outlet />
            </div>

            {/* ══ MODAL INACTIVIDAD — ISO/IEC 27002:2022 Control 8.1 / NIST AC-12 ══ */}
            <SessionWarningModal
                visible={showSessionWarning}
                secondsLeft={30}
                onExtend={() => { extendSession(); setShowSessionWarning(false); }}
                onLogout={handleSessionLogout}
            />
        </div>
    );
};

// ══════════════════════════════════════════════
// ESTILOS LAYOUT
// ══════════════════════════════════════════════
const styles = {
    root:           { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--color-fondo-web)', overflow: 'hidden' },
    logoArea:       { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
    logoBadge:      { width: '38px', height: '38px', backgroundColor: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: '3px' },
    logoTitulo:     { color: 'white', fontWeight: '700', fontSize: '0.9rem', lineHeight: 1.2 },
    logoSub:        { color: 'rgba(255,255,255,0.55)', fontSize: '0.62rem', letterSpacing: '0.04em', marginTop: '1px' },
    navCentro:      { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', flexWrap: 'nowrap' },
    navBtn:         { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '0', color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontWeight: '500', whiteSpace: 'nowrap', transition: 'color 0.15s' },
    navBtnActivo:   { color: 'white', fontWeight: '700' },
    navIcon:        { fontSize: '0.82rem', flexShrink: 0 },
    navDerecha:     { display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 },
    userName:       { fontSize: '0.8rem', fontWeight: '500', color: 'rgba(255,255,255,0.88)' },
    btnSalir:       { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 13px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'rgba(255,255,255,0.70)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '500', transition: 'background-color 0.15s', whiteSpace: 'nowrap' },
    contenido:      { flex: 1, overflowY: 'auto', overflowX: 'hidden', backgroundColor: 'var(--color-fondo-web)' },
    btnCampana:     { position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.80)', padding: '6px 8px', display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.15s' },
    badge:          { position: 'absolute', top: 2, right: 2, backgroundColor: '#ff3d3d', color: 'white', borderRadius: '50%', fontSize: '0.58rem', fontWeight: '700', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--color-espoch-rojo)', lineHeight: 1 },
    notifHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px 9px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', flexShrink: 0 },
    notifTitulo:    { fontSize: '0.84rem', fontWeight: '700', color: '#2c3e50' },
    btnMarcarTodas: { display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--color-espoch-rojo)', fontWeight: '600', padding: 0 },
    notifLista:     { maxHeight: 340, overflowY: 'auto' },
    notifItem:      { display: 'flex', gap: 10, padding: '10px 14px', transition: 'background-color 0.15s', borderBottom: '1px solid #f5f5f5' },
    notifDot:       { width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingTop: 3 },
    notifFecha:     { fontSize: '0.68rem', color: '#adb5bd' },
    tipoBadge:      { fontSize: '0.62rem', color: '#be1e2d', fontWeight: '700' },
    notifVacio:     { textAlign: 'center', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    notifFooter:    { textAlign: 'center', padding: '8px', fontSize: '0.72rem', color: '#adb5bd', backgroundColor: '#fafafa', borderTop: '1px solid #f0f0f0', flexShrink: 0 },
};

// ══════════════════════════════════════════════
// ESTILOS DETALLE CONTACTO
// ══════════════════════════════════════════════
const nd = {
    wrap:       { padding: '12px 14px' },
    btnVolver:  { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.74rem', color: 'var(--color-espoch-rojo)', fontWeight: '700', padding: '0 0 10px', display: 'block' },
    cabecera:   { display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 12px', marginBottom: 12 },
    iconoWrap:  { width: 32, height: 32, borderRadius: 8, backgroundColor: 'white', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cabeceraH:  { margin: '0 0 2px', fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.35 },
    cabeceraF:  { margin: 0, fontSize: '0.64rem', color: '#64748b' },
    seccion:    { marginBottom: 10 },
    secTitulo:  { margin: '0 0 6px', fontSize: '0.62rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em' },
    fila:       { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 7, marginBottom: 5 },
    filaIco:    { width: 20, height: 20, borderRadius: 5, backgroundColor: 'white', border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    filaInfo:   { display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 },
    filaLabel:  { fontSize: '0.6rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
    filaVal:    { fontSize: '0.76rem', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word' },
    emailLink:  { fontSize: '0.76rem', fontWeight: '600', color: '#be1e2d', textDecoration: 'none', wordBreak: 'break-all' },
    mensajeBox: { backgroundColor: '#f8fafc', border: '1px solid #e9ecef', borderLeft: '3px solid #be1e2d', borderRadius: 7, padding: '10px 12px' },
    mensajeTxt: { margin: 0, fontSize: '0.76rem', color: '#374151', lineHeight: 1.65, fontStyle: 'italic' },
    aviso:      { display: 'flex', alignItems: 'flex-start', gap: 7, backgroundColor: '#fff8f0', border: '1px solid #fed7aa', borderRadius: 7, padding: '8px 10px', marginTop: 10 },
    avisoTxt:   { margin: 0, fontSize: '0.66rem', color: '#64748b', lineHeight: 1.5 },
};

export default LayoutGraduado;
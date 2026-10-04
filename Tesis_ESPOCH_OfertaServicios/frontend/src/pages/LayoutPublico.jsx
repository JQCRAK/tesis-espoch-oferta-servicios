// frontend/src/pages/LayoutPublico.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import {
    FaBars, FaNewspaper, FaProjectDiagram, FaUsers, FaBookOpen,
    FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaGlobe,
    FaFacebook, FaChevronDown, FaChevronUp, FaTimes,
} from 'react-icons/fa';

const FONT = "'Rotis', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
const ROJO = '#BC0613'; // rojo oficial del sitio de la ESPOCH

// ── Hook responsive ──────────────────────────────────────────────────────────
const useWindowWidth = () => {
    const [width, setWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1200
    );
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return width;
};

// ══════════════════════════════════════════════
// ACORDEÓN FOOTER
// ══════════════════════════════════════════════
const acordeonItems = [
    {
        titulo: 'Objetivos Educacionales',
        items: [
            { cod: 'OB1', texto: 'Trabajar en equipos multidisciplinarios de forma efectiva comunicando información y soluciones en una variedad de contextos profesionales.' },
            { cod: 'OB2', texto: 'Investigar problemas complejos del sector productivo de la sociedad, aplicando conocimientos de las ciencias básicas, matemática e ingeniería de software para proponer soluciones efectivas.' },
            { cod: 'OB3', texto: 'Desarrollar soluciones de software aplicando los principios fundamentales de la ingeniería de software en un marco ético, adaptándose a entornos dinámicos.' },
            { cod: 'OB4', texto: 'Liderar proyectos o emprendimientos tecnológicos de software sostenibles alcanzando los objetivos propuestos de manera eficiente.' },
        ]
    },
    {
        titulo: 'Resultados de Aprendizaje',
        items: [
            { cod: 'RA1', texto: 'Habilidad para comunicar efectivamente en español e inglés: información, ideas, problemas y soluciones sostenibles en el ámbito de la ingeniería de software y la sociedad.' },
            { cod: 'RA2', texto: 'Habilidad para investigar los problemas del sector productivo de la sociedad, aplicando conocimientos de las ciencias básicas y matemática, utilizando estándares, metodologías, métodos y técnicas de la ingeniería de software.' },
            { cod: 'RA3', texto: 'Habilidad para analizar procesos, productos y sistemas complejos del entorno para proponer alternativas de soluciones software.' },
            { cod: 'RA4', texto: 'Habilidad para diseñar productos software que satisfacen los requerimientos establecidos.' },
            { cod: 'RA5', texto: 'Habilidad para implementar productos de software utilizando tecnologías y herramientas, tanto de forma individual como en equipos interdisciplinarios, fomentando el aprendizaje continuo.' },
            { cod: 'RA6', texto: 'Habilidad para gestionar éticamente proyectos o emprendimientos tecnológicos de software innovadores para contribuir responsablemente al sector productivo de la sociedad.' },
        ]
    }
];

const AcordeonFooter = () => {
    const [abierto, setAbierto] = useState(null);
    return (
        <div>
            {acordeonItems.map((sec, idx) => (
                <div key={idx} style={ac.bloque}>
                    <button style={ac.encabezado} onClick={() => setAbierto(abierto === idx ? null : idx)}>
                        <span style={ac.encabezadoTxt}>{sec.titulo}</span>
                        {abierto === idx ? <FaChevronUp style={ac.chevron} /> : <FaChevronDown style={ac.chevron} />}
                    </button>
                    {abierto === idx && (
                        <div style={ac.cuerpo}>
                            {sec.items.map((it, i) => (
                                <div key={i} style={ac.fila}>
                                    <span style={ac.cod}>{it.cod}</span>
                                    <p style={ac.texto}>{it.texto}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// ══════════════════════════════════════════════
// LAYOUT PÚBLICO
// ══════════════════════════════════════════════
const LayoutPublico = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const width = useWindowWidth();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isSmall = width < 1024;

    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        setMenuAbierto(false);
    }, [location.pathname]);

    useEffect(() => {
        if (isMobile && menuAbierto) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, menuAbierto]);

    const navItems = [
        { path: '/', label: 'Perfiles', labelFull: 'Perfiles Profesionales', icon: <FaUsers /> },
        { path: '/noticias', label: 'Noticias', labelFull: 'Noticias', icon: <FaNewspaper /> },
        { path: '/proyectos', label: 'Proyectos', labelFull: 'Proyectos', icon: <FaProjectDiagram /> },
    ];

    const irA = (path) => {
        navigate(path);
        setMenuAbierto(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const esActivo = (path) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const footerGridStyle = isMobile
        ? { ...s.footerInner, gridTemplateColumns: '1fr', gap: 28 }
        : isTablet
            ? { ...s.footerInner, gridTemplateColumns: '1fr 1fr', gap: 28 }
            : s.footerInner;

    return (
        <div style={s.page}>

            {/* ════════ NAVBAR ════════ */}
            <nav style={s.navbar}>
                <div style={{
                    ...s.navInner,
                    height: isMobile ? 68 : 89,
                    padding: isMobile ? '0 16px' : '0 24px',
                }}>
                    {/* Brand */}
                    <div style={s.navBrand} onClick={() => irA('/')}>
                        <img
                            src="/img/logo-espoch-blanco.png"
                            alt="Escuela Superior Politécnica de Chimborazo"
                            style={{ height: isMobile ? 32 : 46, width: 'auto', display: 'block' }}
                        />
                    </div>

                    {/* Links desktop/tablet */}
                    {!isSmall && (
                        <div style={s.navLinks}>
                            {navItems.map(item => (
                                <button
                                    key={item.path}
                                    style={{ ...s.navLink, ...(esActivo(item.path) ? s.navLinkActivo : {}) }}
                                    onClick={() => irA(item.path)}
                                >
                                    <span style={{ marginRight: 6, display: 'flex' }}>{item.icon}</span>
                                    {item.labelFull}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Links tablet (iconos + label corto) */}
                    {isTablet && (
                        <div style={{ ...s.navLinks, gap: 2 }}>
                            {navItems.map(item => (
                                <button
                                    key={item.path}
                                    style={{
                                        ...s.navLink,
                                        ...(esActivo(item.path) ? s.navLinkActivo : {}),
                                        padding: '8px 10px',
                                        fontSize: '0.9rem',
                                    }}
                                    onClick={() => irA(item.path)}
                                >
                                    <span style={{ marginRight: 5, display: 'flex' }}>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Botones desktop */}
                    {!isSmall && (
                        <div style={{ display: 'flex', gap: 8, marginLeft: 8, flexShrink: 0 }}>
                            <button
                                style={s.navBtnLogin}
                                onClick={() => navigate('/login')}
                            >
                                Ingresar
                            </button>
                            <button
                                style={{
                                    ...s.navBtnLogin,
                                    backgroundColor: 'white',
                                    color: ROJO,
                                    border: '1px solid white',
                                }}
                                onClick={() => navigate('/login', { state: { modo: 'registro' } })}
                            >
                                Registrarse
                            </button>
                        </div>
                    )}

                    {/* Hamburguesa móvil */}
                    {isSmall && (
                        <button
                            style={s.hamburger}
                            onClick={() => setMenuAbierto(!menuAbierto)}
                            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                        >
                            {menuAbierto ? <FaTimes /> : <FaBars />}
                        </button>
                    )}
                </div>

                {/* ── Menú móvil / tablet — overlay lateral ── */}
                {isSmall && menuAbierto && (
                    <>
                        {/* Overlay oscuro detrás */}
                        <div
                            style={s.menuOverlay}
                            onClick={() => setMenuAbierto(false)}
                        />
                        {/* Panel deslizable */}
                        <div style={{
                            ...s.menuPanel,
                            width: isMobile ? '80vw' : '320px',
                        }}>
                            {/* Cabecera panel */}
                            <div style={s.menuPanelHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <img
                                        src="/img/logo-espoch-blanco.png"
                                        alt="Escuela Superior Politécnica de Chimborazo"
                                        style={{ height: 30, width: 'auto', display: 'block' }}
                                    />
                                </div>
                                <button
                                    style={s.menuPanelClose}
                                    onClick={() => setMenuAbierto(false)}
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Items de navegación */}
                            <div style={s.menuPanelNav}>
                                {navItems.map(item => (
                                    <button
                                        key={item.path}
                                        style={{
                                            ...s.menuPanelItem,
                                            ...(esActivo(item.path) ? s.menuPanelItemActivo : {}),
                                        }}
                                        onClick={() => irA(item.path)}
                                    >
                                        <span style={{
                                            ...s.menuPanelItemIco,
                                            color: esActivo(item.path) ? ROJO : '#6b7280',
                                        }}>
                                            {item.icon}
                                        </span>
                                        <span style={{ fontFamily: FONT }}>{item.labelFull}</span>
                                        {esActivo(item.path) && (
                                            <span style={s.menuPanelActiveDot} />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Separador */}
                            <div style={s.menuPanelDivider} />

                            {/* Botón login en panel */}
                            <div style={{ padding: '16px 20px' }}>
                                <button
                                    style={s.menuPanelLoginBtn}
                                    onClick={() => { navigate('/login'); setMenuAbierto(false); }}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    style={{
                                        ...s.menuPanelLoginBtn,
                                        marginTop: 8,
                                        backgroundColor: 'transparent',
                                        border: '1px solid #BC0613',
                                        color: ROJO,
                                        boxShadow: 'none',
                                    }}
                                    onClick={() => { navigate('/login', { state: { modo: 'registro' } }); setMenuAbierto(false); }}
>
                                Registrarse
                            </button>
                            <p style={{
                                margin: '10px 0 0', fontSize: '0.68rem',
                                color: '#9ca3af', textAlign: 'center',
                                fontFamily: FONT, lineHeight: 1.5,
                            }}>
                                Acceso exclusivo para graduados<br />
                                <strong style={{ color: '#6b7280' }}>@espoch.edu.ec</strong>
                            </p>
                        </div>
                    </div>
            </>
                )}
        </nav>

            {/* ════════ CONTENIDO ════════ */ }
    <main style={s.main}>
        <Outlet />
    </main>

    {/* ════════ FOOTER ════════ */ }
    <footer style={s.footer}>
        <div style={footerGridStyle}>

            {/* Columna 1 — Identidad */}
            <div style={s.footerCol}>
                <img
                    src="/img/logo-fie-blanco.png"
                    alt="Facultad de Informática y Electrónica ESPOCH"
                    style={s.footerFieLogo}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                    <a href="https://www.facebook.com/ESPOCH.FIE" target="_blank" rel="noopener noreferrer"
                        style={s.iconBtn} title="Facebook · FIE ESPOCH">
                        <FaFacebook />
                    </a>
                    <a href="https://www.espoch.edu.ec" target="_blank" rel="noopener noreferrer"
                        style={s.iconBtn} title="Sitio web ESPOCH">
                        <FaGlobe />
                    </a>
                </div>
            </div>

            {/* Columna 2 — Contactos */}
            <div style={s.footerCol}>
                <h4 style={s.footerTitulo}>Contactos</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    <div style={s.footerContactoItem}>
                        <FaMapMarkerAlt style={s.footerIco} />
                        <span>Panamericana Sur Km 1½,<br />Riobamba, Chimborazo, Ecuador</span>
                    </div>
                    <div style={s.footerContactoItem}>
                        <FaPhoneAlt style={s.footerIco} />
                        <span>032-998-200 Extensión 2605</span>
                    </div>
                    <div style={s.footerContactoItem}>
                        <FaEnvelope style={s.footerIco} />
                        <span>carrera.software@espoch.edu.ec</span>
                    </div>
                    <a href="https://www.espoch.edu.ec" target="_blank" rel="noopener noreferrer"
                        style={s.footerWebLink}>
                        <FaGlobe style={{ marginRight: 6 }} />www.espoch.edu.ec
                    </a>
                </div>
                <div style={s.fichaWrap}>
                    <div style={s.fichaItem}>
                        <span style={s.fichaLabel}>Duración</span>
                        <span style={s.fichaValor}>8 semestres</span>
                    </div>
                    <div style={s.fichaItem}>
                        <span style={s.fichaLabel}>Modalidad</span>
                        <span style={s.fichaValor}>Presencial</span>
                    </div>
                </div>
                <div style={{ marginTop: 14 }}>
                    <p style={{ ...s.footerDesc, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
                        Coordinadora
                    </p>
                    <p style={{ ...s.footerDesc, marginBottom: 5 }}>
                        Gladys Lorena Aguirre Sailema
                    </p>
                </div>
            </div>

            {/* Columna 3 — Explorar */}
            <div style={s.footerCol}>
                <h4 style={s.footerTitulo}>Explorar</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                    {navItems.map(item => (
                        <button key={item.path} style={s.footerLink} onClick={() => irA(item.path)}>
                            <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                            {item.labelFull}
                        </button>
                    ))}
                </div>
                <AcordeonFooter />
            </div>

            {/* Columna 4 — Portal Graduados */}
            <div style={s.footerCol}>
                <h4 style={s.footerTitulo}>Portal Graduados</h4>
                <p style={s.footerDesc}>
                    ¿Eres graduado de la Carrera de Software? Accede a tu perfil profesional
                    y gestiona tu portafolio de manera segura.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button style={s.btnAcceso} onClick={() => navigate('/login')}>
                        Iniciar Sesión
                    </button>
                    <button style={s.btnGuia} onClick={() => navigate('/documentacion')}>
                        <FaBookOpen style={{ marginRight: 7 }} />
                        Guía de Usuario
                    </button>
                </div>
                <p style={{ ...s.footerDesc, marginTop: 10 }}>
                    Acceso exclusivo con correo<br />
                    <strong>@espoch.edu.ec</strong>
                </p>
            </div>
        </div>

        <div style={s.footerBottom}>
            <p style={s.footerCopy}>
                Escuela Superior Politécnica de Chimborazo © {new Date().getFullYear()}. Todos los derechos reservados.
            </p>
            <p style={s.footerCopy}>
                Carrera de Software · Facultad de Informática y Electrónica · Plataforma de Vinculación con la Colectividad
            </p>
        </div>
    </footer>
        </div >
    );
};

// ══════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════
const s = {
    page: { minHeight: '100vh', backgroundColor: 'var(--color-fondo-web)', fontFamily: FONT, display: 'flex', flexDirection: 'column' },
    main: { flex: 1 },

    // NAVBAR
    navbar: { backgroundColor: ROJO, boxShadow: '0 2px 8px rgba(0,0,0,0.18)', position: 'sticky', top: 0, zIndex: 100 },
    navInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 89, gap: 16 },
    navBrand: { display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 },
    navLinks: { display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' },
    navLink: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 4, backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, fontFamily: FONT },
    navLinkActivo: { backgroundColor: 'rgba(255,255,255,0.20)', color: 'white', fontWeight: 600 },
    navBtnLogin: {
        marginLeft: 8, padding: '12px 24px',
        backgroundColor: 'transparent',
        border: '1px solid rgba(255,255,255,0.7)',
        borderRadius: 4, color: 'white', cursor: 'pointer',
        fontSize: '1rem', fontWeight: 500, fontFamily: FONT,
        flexShrink: 0, whiteSpace: 'nowrap',
        transition: 'background-color 0.15s',
    },

    // Hamburguesa
    hamburger: {
        display: 'flex', background: 'none', border: 'none',
        color: 'white', fontSize: '1.3rem', cursor: 'pointer',
        marginLeft: 'auto', padding: 8,
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 6,
    },

    // Overlay detrás del menú panel
    menuOverlay: {
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.48)',
        zIndex: 200,
        backdropFilter: 'blur(2px)',
    },

    // Panel lateral deslizable
    menuPanel: {
        position: 'fixed', top: 0, right: 0,
        height: '100vh',
        backgroundColor: 'white',
        zIndex: 201,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
    },
    menuPanelHeader: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: ROJO,
        flexShrink: 0,
    },
    menuPanelClose: {
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 7, color: 'white',
        cursor: 'pointer', fontSize: '1rem',
        width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    menuPanelNav: {
        display: 'flex', flexDirection: 'column',
        padding: '12px 12px 0',
        gap: 4,
    },
    menuPanelItem: {
        display: 'flex', alignItems: 'center',
        gap: 12, padding: '12px 14px',
        borderRadius: 9, border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer', fontSize: '0.88rem',
        fontWeight: 500, color: '#374151',
        fontFamily: FONT, textAlign: 'left',
        position: 'relative',
        transition: 'background-color 0.15s',
    },
    menuPanelItemActivo: {
        backgroundColor: '#fff1f2',
        color: ROJO,
        fontWeight: 700,
    },
    menuPanelItemIco: {
        fontSize: '0.9rem', flexShrink: 0,
        width: 20, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
    },
    menuPanelActiveDot: {
        marginLeft: 'auto',
        width: 6, height: 6,
        borderRadius: '50%',
        backgroundColor: ROJO,
        flexShrink: 0,
    },
    menuPanelDivider: {
        height: 1, backgroundColor: '#f3f4f6',
        margin: '12px 20px',
    },
    menuPanelLoginBtn: {
        width: '100%', padding: '11px',
        backgroundColor: ROJO, color: 'white',
        border: 'none', borderRadius: 8,
        cursor: 'pointer', fontWeight: 700,
        fontSize: '0.88rem', fontFamily: FONT,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(190,30,45,0.3)',
    },

    // FOOTER
    footer: { backgroundColor: ROJO },
    footerInner: {
        maxWidth: 1300, margin: '0 auto',
        padding: '48px 24px 40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 40,
    },
    footerCol: { display: 'flex', flexDirection: 'column' },
    footerFieLogo: { width: 190, maxWidth: '100%', height: 'auto', display: 'block' },
    footerDesc: { color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.6, margin: 0, fontFamily: FONT },
    footerTitulo: {
        color: '#FFFFFF', fontWeight: 700, fontSize: '0.94rem',
        margin: '0 0 16px', textTransform: 'uppercase',
        fontFamily: FONT, paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.30)',
    },
    footerLink: {
        display: 'flex', alignItems: 'center', background: 'none',
        border: 'none', cursor: 'pointer', color: '#FFFFFF',
        fontSize: '0.9rem', fontWeight: 500, padding: '5px 0', textAlign: 'left', fontFamily: FONT,
    },
    footerContactoItem: {
        color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 500,
        display: 'flex', alignItems: 'flex-start', gap: 10,
        lineHeight: 1.55, fontFamily: FONT,
    },
    footerIco: { color: '#FFFFFF', flexShrink: 0, marginTop: 4 },
    footerWebLink: {
        display: 'flex', alignItems: 'center',
        color: '#FFFFFF', fontSize: '0.9rem',
        textDecoration: 'none', fontWeight: 600, fontFamily: FONT,
    },
    iconBtn: {
        width: 38, height: 38, borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.45)',
        color: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', fontSize: '1rem',
    },
    btnAcceso: {
        marginTop: 14, padding: '12px 24px',
        backgroundColor: '#FFFFFF', color: ROJO,
        border: 'none', borderRadius: 4, cursor: 'pointer',
        fontWeight: 600, fontSize: '1rem', alignSelf: 'flex-start',
        fontFamily: FONT,
    },
    btnGuia: {
        marginTop: 14, padding: '12px 24px',
        display: 'flex', alignItems: 'center',
        backgroundColor: 'transparent', color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.7)', borderRadius: 4, cursor: 'pointer',
        fontWeight: 600, fontSize: '1rem', alignSelf: 'flex-start',
        fontFamily: FONT,
    },
    fichaWrap: { display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' },
    fichaItem: {
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.30)',
        borderRadius: 4, padding: '8px 14px',
    },
    fichaLabel: {
        fontSize: '0.7rem', fontWeight: 700,
        color: '#FFFFFF', textTransform: 'uppercase',
        letterSpacing: '0.4px', fontFamily: FONT, opacity: 0.85,
    },
    fichaValor: {
        fontSize: '0.94rem', color: '#FFFFFF',
        fontWeight: 600, fontFamily: FONT, marginTop: 2,
    },
    footerBottom: { borderTop: '1px solid rgba(255,255,255,0.30)', padding: '18px 24px', textAlign: 'center' },
    footerCopy: { color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', margin: '3px 0', fontFamily: FONT },
};

const ac = {
    bloque: { borderTop: '1px solid rgba(255,255,255,0.30)' },
    encabezado: {
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', gap: 8,
    },
    encabezadoTxt: {
        fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF',
        textAlign: 'left', fontFamily: FONT, textTransform: 'uppercase',
    },
    chevron: { color: '#FFFFFF', fontSize: '0.8rem', flexShrink: 0 },
    cuerpo: { paddingBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 },
    fila: { display: 'flex', alignItems: 'flex-start', gap: 8 },
    cod: {
        display: 'inline-block', minWidth: 36,
        backgroundColor: '#FFFFFF', color: ROJO,
        fontSize: '0.72rem', fontWeight: 700,
        padding: '2px 6px', borderRadius: 3,
        fontFamily: FONT,
        marginTop: 2, flexShrink: 0,
        textAlign: 'center',
    },
    texto: {
        fontSize: '0.85rem', fontWeight: 500, color: '#FFFFFF',
        lineHeight: 1.55, margin: 0, fontFamily: FONT,
    },
};

export default LayoutPublico;
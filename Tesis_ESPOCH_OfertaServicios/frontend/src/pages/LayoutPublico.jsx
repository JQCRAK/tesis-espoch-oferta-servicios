// frontend/src/pages/LayoutPublico.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import {
    FaBars, FaNewspaper, FaProjectDiagram, FaUsers,
    FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaGlobe,
    FaFacebook, FaChevronDown, FaChevronUp, FaTimes,
} from 'react-icons/fa';

const FONT = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

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
    const navigate      = useNavigate();
    const location      = useLocation();
    const width         = useWindowWidth();
    const isMobile      = width < 768;
    const isTablet      = width >= 768 && width < 1024;
    const isSmall       = width < 1024; // mobile + tablet

    const [menuAbierto, setMenuAbierto] = useState(false);

    // Cerrar menú al cambiar de ruta
    useEffect(() => {
        setMenuAbierto(false);
    }, [location.pathname]);

    // Bloquear scroll del body cuando el menú móvil está abierto
    useEffect(() => {
        if (isMobile && menuAbierto) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, menuAbierto]);

    const navItems = [
        { path: '/',          label: 'Perfiles',   labelFull: 'Perfiles Profesionales', icon: <FaUsers /> },
        { path: '/noticias',  label: 'Noticias',   labelFull: 'Noticias',               icon: <FaNewspaper /> },
        { path: '/proyectos', label: 'Proyectos',  labelFull: 'Proyectos',              icon: <FaProjectDiagram /> },
    ];

    const irA = (path) => {
        navigate(path);
        setMenuAbierto(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const esActivo = (path) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    // ── Footer grid: 4 col desktop, 2 col tablet, 1 col mobile ──────────────
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
                    padding: isMobile ? '0 16px' : '0 24px',
                }}>
                    {/* Brand */}
                    <div style={s.navBrand} onClick={() => irA('/')}>
                        <img
                            src="/img/ESPOCH_LOGO.png"
                            alt="ESPOCH"
                            style={{ height: isMobile ? 28 : 36, objectFit: 'contain' }}
                            onError={e => e.target.style.display = 'none'}
                        />
                        <div>
                            <div style={{
                                ...s.navBrandPrincipal,
                                fontSize: isMobile ? '0.82rem' : '0.92rem',
                            }}>
                                Carrera de Software
                            </div>
                            {!isMobile && (
                                <div style={s.navBrandSub}>FIE · ESPOCH · Riobamba</div>
                            )}
                        </div>
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
                                        padding: '7px 10px',
                                        fontSize: '0.78rem',
                                    }}
                                    onClick={() => irA(item.path)}
                                >
                                    <span style={{ marginRight: 5, display: 'flex' }}>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Botón Login desktop */}
                    {!isSmall && (
                        <button
                            style={s.navBtnLogin}
                            onClick={() => navigate('/login')}
                        >
                            Ingresar
                        </button>
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
                                        src="/img/ESPOCH_LOGO.png"
                                        alt="ESPOCH"
                                        style={{ height: 28, objectFit: 'contain' }}
                                        onError={e => e.target.style.display = 'none'}
                                    />
                                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', fontFamily: FONT }}>
                                        Carrera de Software
                                    </span>
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
                                            color: esActivo(item.path) ? '#be1e2d' : '#6b7280',
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

            {/* ════════ CONTENIDO ════════ */}
            <main style={s.main}>
                <Outlet />
            </main>

            {/* ════════ FOOTER ════════ */}
            <footer style={s.footer}>
                <div style={footerGridStyle}>

                    {/* Columna 1 — Identidad */}
                    <div style={s.footerCol}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={s.footerFieLogoWrap}>
                                <img
                                    src="/img/FIE_LOGO.png"
                                    alt="FIE ESPOCH"
                                    style={s.footerFieLogo}
                                    onError={e => {
                                        e.target.parentElement.style.display = 'none';
                                        const fallback = e.target.parentElement.nextSibling;
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                            </div>
                            <div style={{ ...s.footerFieLogoFallback, display: 'none' }}>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.55rem', fontWeight: 700 }}>FIE</span>
                            </div>
                            <div>
                                <div style={s.footerBrand}>Facultad de Informática y Electrónica</div>
                                <div style={s.footerBrandSub}>Escuela Superior Politécnica de Chimborazo</div>
                            </div>
                        </div>
                        <p style={{ ...s.footerDesc, lineHeight: 1.7, marginBottom: 16 }}>
                            Escuela Superior Politécnica de Chimborazo<br />
                            © {new Date().getFullYear()}. Todos los derechos reservados.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
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
                            <p style={{ ...s.footerDesc, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginBottom: 4, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                Coordinador
                            </p>
                            <p style={{ ...s.footerDesc, color: 'rgba(255,255,255,0.65)', marginBottom: 5 }}>
                                Ing. Omar Salvador Gómez Gómez
                            </p>
                            <div style={s.footerContactoItem}>
                                <FaEnvelope style={{ ...s.footerIco, marginTop: 1 }} />
                                <span style={{ fontSize: '0.76rem' }}>ogomez@espoch.edu.ec</span>
                            </div>
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
                        <button style={s.btnAcceso} onClick={() => navigate('/login')}>
                            Iniciar Sesión
                        </button>
                        <p style={{ ...s.footerDesc, marginTop: 10, fontSize: '0.73rem', lineHeight: 1.6 }}>
                            Acceso exclusivo con correo<br />
                            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>@espoch.edu.ec</strong>
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
        </div>
    );
};

// ══════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════
const s = {
    page:    { minHeight: '100vh', backgroundColor: 'var(--color-fondo-web)', fontFamily: FONT, display: 'flex', flexDirection: 'column' },
    main:    { flex: 1 },

    // NAVBAR
    navbar:  { backgroundColor: 'var(--color-espoch-rojo)', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', position: 'sticky', top: 0, zIndex: 100 },
    navInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 16 },
    navBrand: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 },
    navBrandPrincipal: { color: 'white', fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.2px', fontFamily: FONT },
    navBrandSub: { color: 'rgba(255,255,255,0.62)', fontSize: '0.67rem', fontWeight: 400, fontFamily: FONT },
    navLinks: { display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' },
    navLink:  { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.82)', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 500, fontFamily: FONT },
    navLinkActivo: { backgroundColor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 700 },
    navBtnLogin: {
        marginLeft: 8, padding: '7px 16px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: 7, color: 'white', cursor: 'pointer',
        fontSize: '0.8rem', fontWeight: 700, fontFamily: FONT,
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
        backgroundColor: 'var(--color-espoch-rojo)',
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
        color: '#be1e2d',
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
        backgroundColor: '#be1e2d',
        flexShrink: 0,
    },
    menuPanelDivider: {
        height: 1, backgroundColor: '#f3f4f6',
        margin: '12px 20px',
    },
    menuPanelLoginBtn: {
        width: '100%', padding: '11px',
        backgroundColor: '#be1e2d', color: 'white',
        border: 'none', borderRadius: 8,
        cursor: 'pointer', fontWeight: 700,
        fontSize: '0.88rem', fontFamily: FONT,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(190,30,45,0.3)',
    },

    // FOOTER
    footer: { backgroundColor: 'var(--color-texto-principal)' },
    footerInner: {
        maxWidth: 1200, margin: '0 auto',
        padding: '40px 24px 36px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 36,
    },
    footerCol: { display: 'flex', flexDirection: 'column' },
    footerFieLogoWrap: {
        width: 72, height: 56, backgroundColor: '#ffffff',
        borderRadius: 8, padding: '5px 7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
    },
    footerFieLogo: { width: '100%', height: '100%', objectFit: 'contain' },
    footerFieLogoFallback: {
        width: 72, height: 56, borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    footerBrand: { color: 'white', fontWeight: 800, fontSize: '0.88rem', fontFamily: FONT, lineHeight: 1.3 },
    footerBrandSub: { color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontFamily: FONT, lineHeight: 1.4 },
    footerDesc: { color: 'rgba(255,255,255,0.50)', fontSize: '0.8rem', lineHeight: 1.7, margin: 0, fontFamily: FONT },
    footerTitulo: {
        color: '#FFFFFF', fontWeight: 700, fontSize: '0.76rem',
        margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '1.2px',
        fontFamily: FONT, paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.09)',
    },
    footerLink: {
        display: 'flex', alignItems: 'center', background: 'none',
        border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)',
        fontSize: '0.82rem', padding: '5px 0', textAlign: 'left', fontFamily: FONT,
    },
    footerContactoItem: {
        color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        lineHeight: 1.55, fontFamily: FONT,
    },
    footerIco: { color: 'var(--color-espoch-rojo)', flexShrink: 0, marginTop: 3 },
    footerWebLink: {
        display: 'flex', alignItems: 'center',
        color: 'var(--color-tech-azul-claro)', fontSize: '0.8rem',
        textDecoration: 'none', fontWeight: 600, fontFamily: FONT,
    },
    iconBtn: {
        width: 34, height: 34, borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.14)',
        color: 'rgba(255,255,255,0.62)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', fontSize: '0.88rem',
    },
    btnAcceso: {
        marginTop: 14, padding: '11px 20px',
        backgroundColor: 'var(--color-espoch-rojo)', color: 'white',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        fontWeight: 700, fontSize: '0.88rem', alignSelf: 'flex-start',
        fontFamily: FONT, boxShadow: '0 2px 8px rgba(190,30,45,0.4)',
    },
    fichaWrap: { display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' },
    fichaItem: {
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 7, padding: '7px 12px',
    },
    fichaLabel: {
        fontSize: '0.59rem', fontWeight: 700,
        color: 'var(--color-espoch-rojo)', textTransform: 'uppercase',
        letterSpacing: '0.6px', fontFamily: FONT,
    },
    fichaValor: {
        fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)',
        fontWeight: 600, fontFamily: FONT, marginTop: 2,
    },
    footerBottom: { borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px 24px', textAlign: 'center' },
    footerCopy: { color: 'rgba(255,255,255,0.28)', fontSize: '0.71rem', margin: '3px 0', fontFamily: FONT },
};

const ac = {
    bloque: { borderTop: '1px solid rgba(255,255,255,0.08)' },
    encabezado: {
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0', gap: 8,
    },
    encabezadoTxt: {
        fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.68)',
        textAlign: 'left', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.7px',
    },
    chevron:  { color: '#BE1E2D', fontSize: '0.68rem', flexShrink: 0 },
    cuerpo:   { paddingBottom: 12, display: 'flex', flexDirection: 'column', gap: 9 },
    fila:     { display: 'flex', alignItems: 'flex-start', gap: 8 },
    cod: {
        display: 'inline-block', minWidth: 32,
        backgroundColor: '#BE1E2D', color: '#FFFFFF',
        fontSize: '0.6rem', fontWeight: 800,
        padding: '2px 5px', borderRadius: 4,
        letterSpacing: '0.3px', fontFamily: FONT,
        marginTop: 2, flexShrink: 0,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.15)',
    },
    texto: {
        fontSize: '0.73rem', color: 'rgba(255,255,255,0.50)',
        lineHeight: 1.55, margin: 0, fontFamily: FONT,
    },
};

export default LayoutPublico;
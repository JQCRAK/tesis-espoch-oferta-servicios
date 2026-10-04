// frontend/src/pages/docs/Documentacion.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSearch, FaChevronRight, FaBookOpen, FaArrowLeft } from 'react-icons/fa';
import { categoriasPublico, articulosPublico } from './docsPublicoData';
import { categoriasGraduado, articulosGraduado } from './docsGraduadoData';
import { categoriasAdmin, articulosAdmin } from './docsAdminData';
import { categoriasTecnico, articulosTecnico } from './docsTecnicoData';

const FONT = "'Rotis', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
const ROJO = '#BC0613';

// ── Configuración por sección (público / graduado) ──
const SECCIONES = {
    publico: {
        base: '/documentacion',
        categorias: categoriasPublico,
        articulos: articulosPublico,
        titulo: 'Guía de Usuario',
        subtitulo: 'Cómo usar el Portal de Graduados de la Carrera de Software ESPOCH: buscar perfiles, contactar graduados, crear tu cuenta y más.',
    },
    graduado: {
        base: '/graduado/documentacion',
        categorias: categoriasGraduado,
        articulos: articulosGraduado,
        titulo: 'Guía del Graduado',
        subtitulo: 'Cómo usar tu panel de graduado: tu perfil, proyectos y certificados, encuestas de seguimiento, noticias y notificaciones.',
    },
    admin: {
        base: '/home-admin/documentacion',
        categorias: categoriasAdmin,
        articulos: articulosAdmin,
        titulo: 'Manual de Usuario — Administrador',
        subtitulo: 'Cómo usar el panel de administración: graduados, empleadores, encuestas, estadísticas, reportes y eventos.',
    },
    tecnico: {
        base: '/home-admin/documentacion-tecnica',
        categorias: categoriasTecnico,
        articulos: articulosTecnico,
        titulo: 'Manual Técnico',
        subtitulo: 'Arquitectura, base de datos, API REST, seguridad y despliegue del Portal de Graduados ESPOCH, para el equipo técnico.',
    },
};

const useWindowWidth = () => {
    const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    useEffect(() => {
        const h = () => setW(window.innerWidth);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);
    return w;
};

/* ══════════════════════════════════════════════
   BARRA LATERAL — árbol de categorías/artículos
   (equivalente al "User Docs" de la documentación de Odoo)
══════════════════════════════════════════════ */
const Sidebar = ({ cfg, slugActivo }) => (
    <nav style={s.sidebar}>
        <Link to={cfg.base} style={s.sidebarTitulo}>
            <FaBookOpen style={{ marginRight: 8 }} />
            {cfg.titulo}
        </Link>
        {cfg.categorias.map(cat => (
            <div key={cat.id} style={{ marginBottom: 14 }}>
                <p style={s.sidebarCategoria}>{cat.icono} {cat.titulo}</p>
                {cat.articulos.map(slug => {
                    const art = cfg.articulos[slug];
                    const activo = slug === slugActivo;
                    return (
                        <Link
                            key={slug}
                            to={`${cfg.base}/${slug}`}
                            style={{ ...s.sidebarLink, ...(activo ? s.sidebarLinkActivo : {}) }}
                        >
                            {art.titulo}
                        </Link>
                    );
                })}
            </div>
        ))}
    </nav>
);

/* ══════════════════════════════════════════════
   ÍNDICE — grid de categorías, estilo Odoo docs
══════════════════════════════════════════════ */
const Indice = ({ cfg }) => {
    const navigate = useNavigate();
    const [busqueda, setBusqueda] = useState('');

    const termino = busqueda.trim().toLowerCase();
    const coincide = (slug) => {
        if (!termino) return true;
        const art = cfg.articulos[slug];
        return art.titulo.toLowerCase().includes(termino) || art.resumen.toLowerCase().includes(termino);
    };

    return (
        <div style={s.pagina}>
            <div style={s.indiceHero}>
                <h1 style={s.indiceTitulo}>{cfg.titulo}</h1>
                <p style={s.indiceSub}>{cfg.subtitulo}</p>
                <div style={s.buscadorBox}>
                    <FaSearch style={{ color: '#9ca3af', fontSize: '0.95rem', flexShrink: 0 }} />
                    <input
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="¿Qué estás buscando?"
                        style={s.buscadorInput}
                    />
                </div>
            </div>

            <div style={s.gridCategorias}>
                {cfg.categorias.map(cat => {
                    const items = cat.articulos.filter(coincide);
                    if (termino && items.length === 0) return null;
                    return (
                        <div key={cat.id} style={s.catCard}>
                            <h2 style={s.catTitulo}>{cat.icono} {cat.titulo}</h2>
                            <div style={s.catDivider} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {items.map(slug => (
                                    <button
                                        key={slug}
                                        style={s.catLink}
                                        onClick={() => navigate(`${cfg.base}/${slug}`)}
                                    >
                                        {cfg.articulos[slug].titulo}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════
   ARTÍCULO — contenido con texto + capturas reales
══════════════════════════════════════════════ */
const Bloque = ({ b }) => {
    if (b.t === 'h3') return <h3 style={s.artH3}>{b.c}</h3>;
    if (b.t === 'p') return <p style={s.artP} dangerouslySetInnerHTML={{ __html: b.c }} />;
    if (b.t === 'list') return (
        <ul style={s.artLista}>
            {b.items.map((it, i) => <li key={i} style={s.artListaItem} dangerouslySetInnerHTML={{ __html: it }} />)}
        </ul>
    );
    if (b.t === 'img') return (
        <figure style={s.figura}>
            <img src={`/img/docs/${b.src}`} alt={b.alt} style={s.figuraImg} loading="lazy" />
            {b.caption && <figcaption style={s.figuraCaption}>{b.caption}</figcaption>}
        </figure>
    );
    if (b.t === 'code') return (
        <pre style={s.codeBlock}><code>{b.c}</code></pre>
    );
    if (b.t === 'table') return (
        <div style={s.tablaWrap}>
            <table style={s.tabla}>
                <thead>
                    <tr>{b.head.map((h, i) => <th key={i} style={s.tablaTh}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {b.rows.map((row, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : 'white' }}>
                            {row.map((cell, j) => (
                                <td key={j} style={s.tablaTd} dangerouslySetInnerHTML={{ __html: cell }} />
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    return null;
};

const Articulo = ({ cfg, slug }) => {
    const art = cfg.articulos[slug];
    const navigate = useNavigate();
    const isMobile = useWindowWidth() < 860;

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [slug]);

    if (!art) return (
        <div style={s.pagina}>
            <p style={s.artP}>No se encontró ese artículo. <Link to={cfg.base} style={{ color: ROJO, fontWeight: 700 }}>Volver a la guía</Link>.</p>
        </div>
    );

    // Categoría a la que pertenece, y artículo siguiente (navegación tipo Odoo)
    const catActual = cfg.categorias.find(c => c.articulos.includes(slug));
    const todos = cfg.categorias.flatMap(c => c.articulos);
    const idx = todos.indexOf(slug);
    const siguiente = todos[idx + 1];

    return (
        <div style={{ ...s.pagina, display: 'flex', gap: 32, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
            {!isMobile && <Sidebar cfg={cfg} slugActivo={slug} />}

            <article style={s.articulo}>
                <nav style={s.breadcrumb}>
                    <Link to={cfg.base} style={s.breadcrumbLink}>{cfg.titulo}</Link>
                    <FaChevronRight style={{ fontSize: '0.6rem', margin: '0 8px', color: '#9ca3af' }} />
                    <span>{catActual?.titulo}</span>
                </nav>

                <h1 style={s.artTitulo}>{art.titulo}</h1>
                <p style={s.artResumen}>{art.resumen}</p>

                <div style={{ marginTop: 20 }}>
                    {art.bloques.map((b, i) => <Bloque key={i} b={b} />)}
                </div>

                <div style={s.artFooterNav}>
                    <button style={s.btnVolverIndice} onClick={() => navigate(cfg.base)}>
                        <FaArrowLeft style={{ marginRight: 8 }} /> Toda la guía
                    </button>
                    {siguiente && (
                        <button style={s.btnSiguienteArt} onClick={() => navigate(`${cfg.base}/${siguiente}`)}>
                            Siguiente: {cfg.articulos[siguiente].titulo} <FaChevronRight style={{ marginLeft: 8, fontSize: '0.75rem' }} />
                        </button>
                    )}
                </div>
            </article>
        </div>
    );
};

/* ══════════════════════════════════════════════ */
const Documentacion = ({ seccion = 'publico' }) => {
    const { slug } = useParams();
    const cfg = SECCIONES[seccion] || SECCIONES.publico;
    return slug ? <Articulo cfg={cfg} slug={slug} /> : <Indice cfg={cfg} />;
};

export default Documentacion;

/* ══════════════════════════════════════════════
   ESTILOS
══════════════════════════════════════════════ */
const s = {
    pagina: { maxWidth: 1240, margin: '0 auto', padding: '40px 24px 64px', fontFamily: FONT },

    // ── Índice ──
    indiceHero: { textAlign: 'center', maxWidth: 680, margin: '0 auto 44px' },
    indiceTitulo: { margin: '0 0 12px', fontSize: '2.4rem', fontWeight: 900, color: '#1a1a1a', fontFamily: FONT },
    indiceSub: { margin: '0 0 26px', fontSize: '1.05rem', color: '#6b7280', lineHeight: 1.6, fontFamily: FONT },
    buscadorBox: { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '13px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    buscadorInput: { flex: 1, border: 'none', outline: 'none', fontSize: '1rem', fontFamily: FONT, color: '#1a1a1a', backgroundColor: 'transparent' },

    gridCategorias: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px 44px' },
    catCard: { minWidth: 0 },
    catTitulo: { margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 800, color: '#1a1a1a', fontFamily: FONT },
    catDivider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 14 },
    catLink: { textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0d6e6e', fontSize: '0.96rem', fontFamily: FONT, fontWeight: 600, textDecoration: 'none', width: 'fit-content' },

    // ── Sidebar del artículo ──
    sidebar: { width: 260, flexShrink: 0, position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', paddingRight: 8 },
    sidebarTitulo: { display: 'flex', alignItems: 'center', fontSize: '1rem', fontWeight: 800, color: ROJO, textDecoration: 'none', fontFamily: FONT, marginBottom: 18, paddingBottom: 12, borderBottom: `2px solid ${ROJO}` },
    sidebarCategoria: { margin: '0 0 6px', fontSize: '0.74rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: FONT },
    sidebarLink: { display: 'block', fontSize: '0.88rem', color: '#4b5563', textDecoration: 'none', padding: '6px 10px', borderRadius: 6, fontFamily: FONT, lineHeight: 1.4 },
    sidebarLinkActivo: { backgroundColor: '#fdeceb', color: ROJO, fontWeight: 700 },

    // ── Artículo ──
    articulo: { flex: 1, minWidth: 0 },
    breadcrumb: { display: 'flex', alignItems: 'center', fontSize: '0.82rem', color: '#9ca3af', marginBottom: 14, fontFamily: FONT },
    breadcrumbLink: { color: '#9ca3af', textDecoration: 'none' },
    artTitulo: { margin: '0 0 8px', fontSize: '1.9rem', fontWeight: 900, color: '#1a1a1a', fontFamily: FONT, lineHeight: 1.25 },
    artResumen: { margin: 0, fontSize: '1.02rem', color: '#6b7280', lineHeight: 1.6, fontFamily: FONT },
    artH3: { margin: '28px 0 10px', fontSize: '1.15rem', fontWeight: 800, color: '#1a1a1a', fontFamily: FONT },
    artP: { margin: '0 0 16px', fontSize: '0.98rem', color: '#374151', lineHeight: 1.75, fontFamily: FONT },
    artLista: { margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 },
    artListaItem: { fontSize: '0.96rem', color: '#374151', lineHeight: 1.65, fontFamily: FONT },

    codeBlock: { margin: '0 0 18px', padding: '14px 16px', backgroundColor: '#1a1a1a', color: '#e5e7eb', borderRadius: 8, fontSize: '0.84rem', lineHeight: 1.6, overflowX: 'auto', fontFamily: "'Consolas', 'Monaco', monospace" },

    tablaWrap: { margin: '0 0 18px', overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 },
    tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', fontFamily: FONT },
    tablaTh: { textAlign: 'left', padding: '9px 12px', backgroundColor: '#f8fafc', color: '#4b5563', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
    tablaTd: { padding: '9px 12px', color: '#374151', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' },

    figura: { margin: '22px 0 26px' },
    figuraImg: { width: '100%', display: 'block', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 4px 18px rgba(0,0,0,0.08)' },
    figuraCaption: { marginTop: 10, fontSize: '0.84rem', color: '#9ca3af', textAlign: 'center', fontFamily: FONT, lineHeight: 1.5 },

    artFooterNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 40, paddingTop: 24, borderTop: '1px solid #e5e7eb' },
    btnVolverIndice: { display: 'flex', alignItems: 'center', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#4b5563', fontFamily: FONT },
    btnSiguienteArt: { display: 'flex', alignItems: 'center', backgroundColor: ROJO, color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, fontFamily: FONT },
};

// frontend/src/pages/Proyectos.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaSearch, FaTimes, FaFire, FaUserCircle, FaMapMarkerAlt,
    FaCalendarAlt, FaExternalLinkAlt, FaChevronLeft, FaChevronRight,
    FaCode, FaArrowRight, FaBriefcase, FaLayerGroup,
} from 'react-icons/fa';

const API_URL  = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
const urlMedia = (r) => {
    if (!r) return null;
    if (r.startsWith('http://') || r.startsWith('https://')) return r;
    return `${BASE}/${r}`;
};
const FONT     = "'Segoe UI', system-ui, -apple-system, sans-serif";

const CSS = `
@keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
@keyframes spin    { to { transform:rotate(360deg); } }
@keyframes shimmer { from { background-position:-200% center; } to { background-position:200% center; } }
.proy-card { transition: box-shadow .2s, transform .2s; }
.proy-card:hover { box-shadow:0 10px 28px rgba(0,0,0,.12) !important; transform:translateY(-2px); }
.pill-btn  { transition: background .15s, color .15s, border-color .15s; cursor:pointer; }
.ver-btn   { transition: background .15s, color .15s; }
.ver-btn:hover { background:#be1e2d !important; color:white !important; }
.pag-btn:hover:not([disabled]) { background:#be1e2d !important; color:white !important; }
img { -webkit-touch-callout:none; user-select:none; }
* { box-sizing:border-box; }
`;

// ── Skeleton ────────────────────────────────────────────────
const Sk = () => (
    <div style={{backgroundColor:'white', borderRadius:12, overflow:'hidden', border:'1px solid #e9ecef'}}>
        <div style={{height:160, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200%', animation:'shimmer 1.3s infinite'}} />
        <div style={{padding:'14px 16px'}}>
            {[75,100,55].map((w,i) => (
                <div key={i} style={{height:12, borderRadius:6, marginBottom:10, width:`${w}%`, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200%', animation:'shimmer 1.3s infinite'}} />
            ))}
        </div>
    </div>
);

// ── Card de proyecto ─────────────────────────────────────────
const ProyectoCard = ({ proyecto, navigate }) => {
    const g    = proyecto.graduado;
    const tecs = (proyecto.tecnologias || []).slice(0, 3);
    const masT = (proyecto.tecnologias || []).length - 3;

    return (
        <div className="proy-card" style={card.wrap}>
            {/* Imagen */}
            <div style={card.imgBox}>
                {proyecto.imagen
                    ? <img src={urlMedia(proyecto.imagen)} alt={proyecto.titulo}
                           style={card.img} onContextMenu={e => e.preventDefault()} draggable={false} />
                    : <div style={card.imgPlaceholder}>
                        <FaBriefcase style={{fontSize:'1.8rem', color:'#cbd5e1'}} />
                      </div>
                }
                {proyecto.fechaRealizacion && (
                    <span style={card.anio}>
                        <FaCalendarAlt style={{marginRight:3, fontSize:'0.5rem'}} />
                        {new Date(proyecto.fechaRealizacion).getFullYear()}
                    </span>
                )}
            </div>

            {/* Cuerpo */}
            <div style={card.body}>
                <h3 style={{...card.titulo, fontFamily:FONT}}>{proyecto.titulo}</h3>
                <p  style={{...card.desc,   fontFamily:FONT}}>{proyecto.descripcion}</p>
                {tecs.length > 0 && (
                    <div style={card.tagsRow}>
                        {tecs.map((t, i) => (
                            <span key={i} style={{...card.tag, fontFamily:FONT}}>{t}</span>
                        ))}
                        {masT > 0 && <span style={{...card.tagMas, fontFamily:FONT}}>+{masT}</span>}
                    </div>
                )}
            </div>

            {/* Footer graduado */}
            <div style={card.footer}>
                <div style={card.gradRow}>
                    <div style={card.avatarWrap}>
                        {g?.fotoPerfil
                            ? <img src={urlMedia(g.fotoPerfil)} alt="" style={card.avatarImg}
                                   onContextMenu={e => e.preventDefault()} draggable={false} />
                            : <FaUserCircle style={{fontSize:'1.3rem', color:'#cbd5e1'}} />
                        }
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                        <p style={{...card.gradNombre, fontFamily:FONT}}>
                            {g ? `${g.nombres} ${g.apellidos}` : 'Graduado ESPOCH'}
                        </p>
                        {g?.especialidadTop && (
                            <p style={{...card.gradEsp, fontFamily:FONT}}>{g.especialidadTop}</p>
                        )}
                        {g?.ciudad && (
                            <p style={{...card.gradCiudad, fontFamily:FONT}}>
                                <FaMapMarkerAlt style={{marginRight:3, fontSize:'0.5rem'}} />{g.ciudad}
                            </p>
                        )}
                    </div>
                </div>
                <div style={card.footerBtns}>
                    {proyecto.urlRepositorio && (
                        <a href={proyecto.urlRepositorio} target="_blank" rel="noopener noreferrer"
                           style={{...card.repoLink, fontFamily:FONT}} onClick={e => e.stopPropagation()}>
                            <FaExternalLinkAlt style={{marginRight:3, fontSize:'0.58rem'}} />Repo
                        </a>
                    )}
                    {g && (
                        <button className="ver-btn"
                            onClick={() => navigate(`/perfil/${g._id}`)}
                            style={{...card.verBtn, fontFamily:FONT}}>
                            Ver perfil <FaArrowRight style={{marginLeft:4, fontSize:'0.58rem'}} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
const Proyectos = () => {
    const navigate = useNavigate();

    const [proyectos,      setProyectos]      = useState([]);
    const [tendencia,      setTendencia]      = useState(null);
    const [pills,          setPills]          = useState([]);
    const [cargando,       setCargando]       = useState(true);
    const [error,          setError]          = useState('');
    const [busqueda,       setBusqueda]       = useState('');
    const [techActiva,     setTechActiva]     = useState('');
    const [mostrarTodos,   setMostrarTodos]   = useState(false);
    const [usandoFallback, setUsandoFallback] = useState(false);
    const [page,           setPage]           = useState(1);
    const [pages,          setPages]          = useState(1);
    const [total,          setTotal]          = useState(0);

    const debounceRef = useRef(null);

    useEffect(() => {
        document.title = 'Proyectos · Carrera de Software ESPOCH';
    }, []);

    const fetchProyectos = useCallback(async (params = {}) => {
        setCargando(true);
        setError('');
        try {
            const qs = new URLSearchParams();
            if (params.q)          qs.set('q',     params.q);
            if (params.tech)       qs.set('tech',  params.tech);
            if (params.todos)      qs.set('todos', 'true');
            qs.set('page', params.page || 1);

            const { data } = await axios.get(`${API_URL}/publico/proyectos?${qs}`);
            setProyectos(data.proyectos       || []);
            setTendencia(data.tendencia       || null);
            setPills(data.pillsTecnologia     || []);
            setTotal(data.total               || 0);
            setPages(data.pages               || 1);
            setUsandoFallback(data.usandoFallback || false);
        } catch {
            setError('No se pudieron cargar los proyectos. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { fetchProyectos({ page: 1 }); }, [fetchProyectos]);

    const handleBusqueda = (valor) => {
        setBusqueda(valor);
        setTechActiva('');
        setPage(1);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchProyectos({ q: valor, todos: mostrarTodos, page: 1 });
        }, 400);
    };

    const limpiarBusqueda = () => {
        setBusqueda('');
        setTechActiva('');
        setPage(1);
        fetchProyectos({ todos: mostrarTodos, page: 1 });
    };

    const handlePill = (tech) => {
        const nueva = techActiva === tech ? '' : tech;
        setTechActiva(nueva);
        setBusqueda('');
        setPage(1);
        fetchProyectos({ tech: nueva, todos: mostrarTodos, page: 1 });
    };

    const handleToggleTodos = () => {
        const nuevo = !mostrarTodos;
        setMostrarTodos(nuevo);
        setTechActiva('');
        setBusqueda('');
        setPage(1);
        fetchProyectos({ todos: nuevo, page: 1 });
    };

    const irPagina = (p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchProyectos({ q: busqueda, tech: techActiva, todos: mostrarTodos, page: p });
    };

    const tendColor = tendencia?.color || '#be1e2d';

    return (
        <>
        <style>{CSS}</style>

        {/* ══ HERO — fondo blanco ══ */}
        <div style={p.hero}>
            <div style={p.heroInner}>

                {/* Columna izquierda: título */}
                <div style={p.heroIzq}>
                    <p style={{...p.heroEtiqueta, fontFamily:FONT}}>
                        <FaLayerGroup style={{marginRight:6, fontSize:'0.68rem'}} />
                        GALERÍA DE EXCELENCIA
                    </p>
                    <h1 style={{...p.heroTitulo, fontFamily:FONT}}>
                        Proyectos de<br />
                        <span style={{color:'#be1e2d'}}>Graduados</span>
                    </h1>
                    <p style={{...p.heroSub, fontFamily:FONT}}>
                        Desarrollos reales de la Carrera de Software ESPOCH.
                        Solo graduados con tesis verificada y perfil público.
                    </p>
                </div>

                {/* Columna derecha: buscador */}
                <div style={p.heroDer}>
                    <div style={p.buscadorBox}>
                        <FaSearch style={{color:'#94a3b8', fontSize:'0.9rem', flexShrink:0}} />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={e => handleBusqueda(e.target.value)}
                            placeholder="Buscar por título, tecnología o especialidad..."
                            style={{...p.buscadorInp, fontFamily:FONT}}
                            autoComplete="off"
                        />
                        {busqueda && (
                            <button onClick={limpiarBusqueda} style={p.buscadorX}>
                                <FaTimes style={{fontSize:'0.7rem'}} />
                            </button>
                        )}
                    </div>
                    <p style={{...p.buscadorHint, fontFamily:FONT}}>
                        Busca por título del proyecto, tecnología usada o especialidad del graduado
                    </p>
                </div>
            </div>

            {/* Línea divisoria inferior */}
            <div style={p.heroDivider} />
        </div>

        {/* ══ CONTENIDO ══ */}
        <div style={p.pagina}>

            {/* ── Banner tendencia ── */}
            {tendencia && !cargando && (
                <div style={{...p.tendBanner, borderLeft:`4px solid ${tendColor}`}}>
                    <div style={{...p.tendIco, backgroundColor:tendColor + '18'}}>
                        <FaFire style={{color:tendColor, fontSize:'1rem'}} />
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:2}}>
                            <span style={{...p.tendLabel, fontFamily:FONT}}>
                                Tendencia semana {tendencia.semana}
                            </span>
                            {tendencia.modoManual && (
                                <span style={{...p.badgeManual, fontFamily:FONT}}>Admin</span>
                            )}
                            {usandoFallback && (
                                <span style={{...p.badgeFallback, fontFamily:FONT}}>Todos los proyectos</span>
                            )}
                        </div>
                        <p style={{...p.tendCat, color:tendColor, fontFamily:FONT}}>
                            {tendencia.categoria}
                        </p>
                        <p style={{...p.tendDesc, fontFamily:FONT}}>{tendencia.descripcion}</p>
                    </div>
                    <button
                        onClick={handleToggleTodos}
                        style={{...p.btnToggle, fontFamily:FONT,
                            background: mostrarTodos ? '#f1f5f9' : 'white',
                            color:      mostrarTodos ? '#be1e2d' : '#64748b',
                        }}
                    >
                        {mostrarTodos ? 'Ver tendencia' : 'Ver todos'}
                    </button>
                </div>
            )}

            {/* ── Pills tecnología ── */}
            {pills.length > 0 && !busqueda && (
                <div style={p.pillsArea}>
                    <span style={{...p.pillsLabel, fontFamily:FONT}}>
                        <FaCode style={{marginRight:5, color:tendColor}} />
                        Tecnologías en tendencia:
                    </span>
                    <div style={p.pillsRow}>
                        <button className="pill-btn" onClick={() => handlePill('')}
                            style={{...p.pill, fontFamily:FONT,
                                background:  !techActiva ? tendColor : 'white',
                                color:       !techActiva ? 'white'   : '#475569',
                                borderColor: !techActiva ? tendColor : '#e2e8f0',
                                fontWeight:  !techActiva ? 700 : 500,
                            }}
                        >Todos</button>
                        {pills.map(tech => (
                            <button key={tech} className="pill-btn" onClick={() => handlePill(tech)}
                                style={{...p.pill, fontFamily:FONT,
                                    background:  techActiva === tech ? tendColor : 'white',
                                    color:       techActiva === tech ? 'white'   : '#475569',
                                    borderColor: techActiva === tech ? tendColor : '#e2e8f0',
                                    fontWeight:  techActiva === tech ? 700 : 500,
                                }}
                            >{tech}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Contador ── */}
            {!cargando && !error && (
                <p style={{...p.contador, fontFamily:FONT}}>
                    {busqueda
                        ? <><strong>{total}</strong> resultado{total!==1?'s':''} para "<em>{busqueda}</em>"</>
                        : techActiva
                            ? <><strong>{total}</strong> proyecto{total!==1?'s':''} con <strong>{techActiva}</strong></>
                            : mostrarTodos
                                ? <><strong>{total}</strong> proyecto{total!==1?'s':''} en total</>
                                : <><strong>{total}</strong> proyecto{total!==1?'s':''} en tendencia · <span style={{color:tendColor}}>{tendencia?.categoria}</span></>
                    }
                </p>
            )}

            {/* ── Error ── */}
            {error && (
                <div style={{...p.errorBox, fontFamily:FONT}}>
                    {error}
                    <button onClick={() => fetchProyectos({page:1})}
                        style={{...p.btnRetry, fontFamily:FONT}}>Reintentar</button>
                </div>
            )}

            {/* ── Grid ── */}
            {cargando ? (
                <div style={p.grid}>
                    {Array.from({length:9}).map((_,i) => <Sk key={i} />)}
                </div>
            ) : proyectos.length === 0 && !error ? (
                <div style={p.empty}>
                    <FaBriefcase style={{fontSize:'2.4rem', color:'#cbd5e1', marginBottom:12}} />
                    <p style={{...p.emptyTit, fontFamily:FONT}}>Sin proyectos</p>
                    <p style={{...p.emptySub, fontFamily:FONT}}>
                        {busqueda
                            ? `No se encontraron proyectos para "${busqueda}"`
                            : techActiva
                                ? `No hay proyectos con ${techActiva} aún`
                                : 'No hay proyectos publicados en esta categoría'
                        }
                    </p>
                    <button onClick={limpiarBusqueda}
                        style={{...p.btnVacioLimpiar, fontFamily:FONT}}>
                        Ver todos los proyectos
                    </button>
                </div>
            ) : (
                <div style={p.grid}>
                    {proyectos.map((proy, i) => (
                        <div key={proy._id} style={{animation:`fadeUp .28s ease ${i * .04}s both`}}>
                            <ProyectoCard proyecto={proy} navigate={navigate} />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Paginación ── */}
            {!cargando && pages > 1 && (
                <div style={p.paginacion}>
                    <button className="pag-btn"
                        style={{...p.pagBtn, opacity: page<=1 ? .4 : 1}}
                        onClick={() => page > 1 && irPagina(page - 1)}
                        disabled={page <= 1}
                    >
                        <FaChevronLeft style={{fontSize:'0.65rem'}} />
                    </button>

                    {Array.from({length:pages}, (_,i) => i+1)
                        .filter(n => n===1 || n===pages || Math.abs(n-page)<=1)
                        .reduce((acc, n, idx, arr) => {
                            if (idx > 0 && n - arr[idx-1] > 1) acc.push('…');
                            acc.push(n);
                            return acc;
                        }, [])
                        .map((item, i) => item === '…'
                            ? <span key={`e${i}`} style={{...p.pagSep, fontFamily:FONT}}>···</span>
                            : <button key={item} className="pag-btn"
                                style={{...p.pagBtn, fontFamily:FONT,
                                    background:  item===page ? '#be1e2d' : 'white',
                                    color:       item===page ? 'white'   : '#475569',
                                    borderColor: item===page ? '#be1e2d' : '#e2e8f0',
                                    fontWeight:  item===page ? 700 : 500,
                                }}
                                onClick={() => irPagina(item)}
                              >{item}</button>
                        )
                    }

                    <button className="pag-btn"
                        style={{...p.pagBtn, opacity: page>=pages ? .4 : 1}}
                        onClick={() => page < pages && irPagina(page + 1)}
                        disabled={page >= pages}
                    >
                        <FaChevronRight style={{fontSize:'0.65rem'}} />
                    </button>
                </div>
            )}
        </div>
        </>
    );
};

// ═══════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════
const p = {
    // Hero — fondo BLANCO
    hero:          { backgroundColor: 'white', borderBottom: '1px solid #e9ecef' },
    heroInner:     { maxWidth: 1160, margin: '0 auto', padding: '40px 20px 32px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'center' },
    heroIzq:       { },
    heroEtiqueta:  { margin: '0 0 12px', fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center' },
    heroTitulo:    { margin: '0 0 12px', fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' },
    heroSub:       { margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.65, maxWidth: 420 },
    heroDer:       { },
    heroDivider:   { height: 3, background: 'linear-gradient(90deg, #be1e2d 0%, #e11d48 50%, transparent 100%)' },
    buscadorBox:   { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' },
    buscadorInp:   { flex: 1, border: 'none', outline: 'none', fontSize: '0.86rem', color: '#0f172a', backgroundColor: 'transparent' },
    buscadorX:     { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 3 },
    buscadorHint:  { margin: '8px 0 0 2px', fontSize: '0.64rem', color: '#94a3b8', lineHeight: 1.5 },

    // Página
    pagina:        { maxWidth: 1160, margin: '0 auto', padding: '24px 16px 56px' },

    // Banner tendencia
    tendBanner:    { display: 'flex', alignItems: 'flex-start', gap: 14, backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 12, padding: '14px 16px', marginBottom: 18, boxShadow: '0 1px 6px rgba(0,0,0,.05)' },
    tendIco:       { width: 40, height: 40, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    tendLabel:     { fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' },
    tendCat:       { margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.2 },
    tendDesc:      { margin: 0, fontSize: '0.73rem', color: '#64748b', lineHeight: 1.5 },
    badgeManual:   { fontSize: '0.57rem', fontWeight: 700, backgroundColor: '#fef9c3', color: '#a16207', border: '1px solid #fde047', borderRadius: 20, padding: '2px 7px' },
    badgeFallback: { fontSize: '0.57rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2px 7px' },
    btnToggle:     { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: '0.71rem', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' },

    // Pills
    pillsArea:     { marginBottom: 18 },
    pillsLabel:    { display: 'flex', alignItems: 'center', fontSize: '0.71rem', fontWeight: 700, color: '#475569', marginBottom: 8 },
    pillsRow:      { display: 'flex', gap: 7, flexWrap: 'wrap' },
    pill:          { padding: '5px 14px', borderRadius: 20, border: '1px solid', fontSize: '0.74rem' },

    // Contador
    contador:      { margin: '0 0 14px', fontSize: '0.74rem', color: '#94a3b8' },

    // Grid
    grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))', gap: 18 },

    // Vacío
    empty:         { textAlign: 'center', padding: '52px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    emptyTit:      { margin: '0 0 6px', fontSize: '0.96rem', fontWeight: 700, color: '#0f172a' },
    emptySub:      { margin: '0 0 16px', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.6 },
    btnVacioLimpiar:{ padding: '7px 18px', backgroundColor: '#be1e2d', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.77rem', fontWeight: 700 },

    // Error
    errorBox:      { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 18px', color: '#b91c1c', fontSize: '0.8rem', textAlign: 'center', marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
    btnRetry:      { display: 'inline-flex', alignItems: 'center', padding: '5px 14px', backgroundColor: '#be1e2d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },

    // Paginación
    paginacion:    { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 32 },
    pagBtn:        { width: 34, height: 34, borderRadius: 7, border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', transition: 'background .15s, color .15s' },
    pagSep:        { color: '#94a3b8', fontSize: '0.78rem', padding: '0 3px' },
};

// Estilos card
const card = {
    wrap:           { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column' },
    imgBox:         { position: 'relative', height: 160, overflow: 'hidden', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    img:            { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    imgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
    anio:           { position: 'absolute', top: 9, right: 9, display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(15,23,42,.65)', color: 'white', padding: '3px 7px', borderRadius: 20, fontSize: '0.58rem', fontWeight: 700, backdropFilter: 'blur(4px)' },
    body:           { padding: '12px 14px 8px', flex: 1 },
    titulo:         { margin: '0 0 5px', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    desc:           { margin: '0 0 9px', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    tagsRow:        { display: 'flex', flexWrap: 'wrap', gap: 4 },
    tag:            { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 7px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 600, border: '1px solid #bfdbfe' },
    tagMas:         { backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '2px 6px', borderRadius: 20, fontSize: '0.6rem' },
    footer:         { padding: '9px 14px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 },
    gradRow:        { display: 'flex', alignItems: 'flex-start', gap: 8 },
    avatarWrap:     { width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #e2e8f0', flexShrink: 0, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    avatarImg:      { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    gradNombre:     { margin: 0, fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 },
    gradEsp:        { margin: '1px 0 0', fontSize: '0.6rem', fontWeight: 600, color: '#be1e2d' },
    gradCiudad:     { margin: '1px 0 0', fontSize: '0.6rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center' },
    footerBtns:     { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
    repoLink:       { display: 'inline-flex', alignItems: 'center', fontSize: '0.62rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' },
    verBtn:         { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: '0.63rem', fontWeight: 700, color: '#475569' },
};

export default Proyectos;
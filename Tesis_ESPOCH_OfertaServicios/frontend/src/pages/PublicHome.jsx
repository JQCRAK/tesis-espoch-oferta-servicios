// frontend/src/pages/PublicHome.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserCircle, FaMapMarkerAlt, FaCode, FaBriefcase,
    FaSearch, FaGraduationCap, FaTimes, FaEye,
    FaChevronLeft, FaChevronRight, FaSlidersH, FaFilter,
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const BASE    = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
const FONT    = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

const urlFoto = (ruta) => {
    if (!ruta) return null;
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
    return `${BASE}/${ruta}`;
};

// Formatea números: 1500 → 1.5K, 1000000 → 1M
const fmtNum = (n) => {
    if (!n && n !== 0) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace('.0', '')}K`;
    return String(n);
};

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
// CONSTELACIÓN ANIMADA
// ══════════════════════════════════════════════
const Constellation = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = canvas.width  = canvas.offsetWidth;
        let H = canvas.height = canvas.offsetHeight;
        const nodes = Array.from({ length: 50 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
            r: Math.random() * 1.4 + 0.5,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > W) n.vx *= -1;
                if (n.y < 0 || n.y > H) n.vy *= -1;
                for (let j = i + 1; j < nodes.length; j++) {
                    const m = nodes[j];
                    const d = Math.hypot(n.x - m.x, n.y - m.y);
                    if (d < 105) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(200,220,255,${0.11 * (1 - d / 105)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y);
                        ctx.stroke();
                    }
                }
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200,220,255,0.45)';
                ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };
        draw();
        const onResize = () => {
            W = canvas.width  = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
    }, []);
    return (
        <canvas ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />
    );
};

// ══════════════════════════════════════════════
// CONTADOR ANIMADO
// ══════════════════════════════════════════════
const Counter = ({ value, label }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!value) return;
        let start = 0;
        const step = Math.ceil(value / 28);
        const t = setInterval(() => {
            start += step;
            if (start >= value) { setCount(value); clearInterval(t); }
            else setCount(start);
        }, 38);
        return () => clearInterval(t);
    }, [value]);
    return (
        <div style={s.heroStatItem}>
            <span style={s.heroStatNum}>{fmtNum(count)}</span>
            <span style={s.heroStatLabel}>{label}</span>
        </div>
    );
};

// ══════════════════════════════════════════════
// SKELETON
// ══════════════════════════════════════════════
const SkeletonCard = () => (
    <div style={{ ...ts.card, gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={sk.circle} />
            <div style={{ flex: 1 }}>
                <div style={{ ...sk.line, width: '70%', marginBottom: 8 }} />
                <div style={{ ...sk.line, width: '50%' }} />
            </div>
        </div>
        <div style={{ ...sk.line, width: '40%' }} />
        <div style={{ display: 'flex', gap: 6 }}>
            {[60, 80, 50].map((w, i) => (
                <div key={i} style={{ ...sk.line, width: w, height: 22, borderRadius: 20 }} />
            ))}
        </div>
    </div>
);

// ══════════════════════════════════════════════
// PAGINADOR
// ══════════════════════════════════════════════
const Paginador = ({ page, pages, onIr }) => {
    if (pages <= 1) return null;
    const ini  = Math.max(1, page - 2);
    const fin  = Math.min(pages, ini + 4);
    const nums = Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 28 }}>
            <button style={{ ...s.pagBtn, opacity: page <= 1 ? 0.4 : 1 }}
                disabled={page <= 1} onClick={() => onIr(page - 1)}>
                <FaChevronLeft style={{ fontSize: '0.6rem' }} />
            </button>
            {ini > 1 && <span style={s.pagSep}>···</span>}
            {nums.map(n => (
                <button key={n} onClick={() => onIr(n)} style={{
                    ...s.pagBtn,
                    background: n === page ? 'var(--color-espoch-rojo)' : 'white',
                    color:      n === page ? 'white' : '#6c757d',
                    border:     n === page ? '1px solid var(--color-espoch-rojo)' : '1px solid #e9ecef',
                    fontWeight: n === page ? 700 : 400,
                }}>{n}</button>
            ))}
            {fin < pages && <span style={s.pagSep}>···</span>}
            <button style={{ ...s.pagBtn, opacity: page >= pages ? 0.4 : 1 }}
                disabled={page >= pages} onClick={() => onIr(page + 1)}>
                <FaChevronRight style={{ fontSize: '0.6rem' }} />
            </button>
        </div>
    );
};

// ══════════════════════════════════════════════
// TARJETA GRADUADO
// ══════════════════════════════════════════════
const TarjetaGraduado = ({ graduado }) => {
    const navigate = useNavigate();
    const [hov, setHov] = useState(false);

    const disp = {
        disponible:    { bg: '#e8f5e9', color: '#1b5e20', border: '#a5d6a7', label: 'Disponible',    dot: '#2e7d32' },
        no_disponible: { bg: '#fff8e1', color: '#e65100', border: '#ffe082', label: 'No disponible', dot: '#f57f17' },
    }[graduado.disponibilidad] || { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0', label: '—', dot: '#9e9e9e' };

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                ...ts.card,
                transform:  hov ? 'translateY(-3px)' : 'none',
                boxShadow:  hov ? '0 10px 28px rgba(0,0,0,0.11)' : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
        >
            <div style={ts.header}>
                <div style={ts.fotoWrap}>
                    {graduado.fotoPerfil
                        ? <img src={urlFoto(graduado.fotoPerfil)} alt="" style={ts.foto} />
                        : <FaUserCircle style={ts.fotoIcon} />}
                </div>
                <div style={ts.info}>
                    <h3 style={ts.nombre}>{graduado.nombres} {graduado.apellidos}</h3>
                    <p style={ts.subtitulo}>Ing. Software · ESPOCH</p>
                    {graduado.ciudad && (
                        <p style={ts.ciudad}>
                            <FaMapMarkerAlt style={{ marginRight: 4, fontSize: '0.7rem' }} />
                            {graduado.ciudad}
                        </p>
                    )}
                </div>
            </div>

            <span style={{ ...ts.badge, backgroundColor: disp.bg, color: disp.color, border: `1px solid ${disp.border}` }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: disp.dot, marginRight: 6, flexShrink: 0 }} />
                {disp.label}
            </span>

            {graduado.bio && <p style={ts.bio}>{graduado.bio}</p>}

            {graduado.tecnologias?.length > 0 && (
                <div style={ts.seccion}>
                    <p style={ts.secLabel}>
                        <FaCode style={{ marginRight: 5, color: 'var(--color-espoch-rojo)' }} />Tecnologías
                    </p>
                    <div style={ts.tagsWrap}>
                        {graduado.tecnologias.slice(0, 5).map((t, i) => <span key={i} style={ts.tag}>{t}</span>)}
                        {graduado.tecnologias.length > 5 && (
                            <span style={ts.tagMas}>+{graduado.tecnologias.length - 5}</span>
                        )}
                    </div>
                </div>
            )}

            {graduado.afinidades?.length > 0 && (
                <div style={ts.seccion}>
                    <p style={ts.secLabel}>
                        <FaBriefcase style={{ marginRight: 5, color: 'var(--color-espoch-rojo)' }} />Especialidades
                    </p>
                    <div style={ts.tagsWrap}>
                        {graduado.afinidades.slice(0, 3).map((af, i) => (
                            <span key={i} style={ts.tagEsp}>{af.categoria || af}</span>
                        ))}
                    </div>
                </div>
            )}

            <div style={ts.footerCard}>
                <button style={ts.btnVerPerfil} onClick={() => navigate(`/perfil/${graduado._id}`)}>
                    <FaEye style={{ marginRight: 5 }} />Ver perfil
                </button>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// PUBLIC HOME
// ══════════════════════════════════════════════
const PublicHome = () => {
    const width    = useWindowWidth();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const [graduados,      setGraduados]      = useState([]);
    const [total,          setTotal]          = useState(0);
    const [page,           setPage]           = useState(1);
    const [pages,          setPages]          = useState(1);
    const [topTecnologias, setTopTecnologias] = useState([]);
    const [cargando,       setCargando]       = useState(true);

    const [busqueda,   setBusqueda]   = useState('');
    const [filtroDisp, setFiltroDisp] = useState('');
    const [filtroTec,  setFiltroTec]  = useState('');

    // Stats reales del portal
    const [stats, setStats] = useState({
        totalGraduados:   0,
        disponibles:      0,
        totalTecnologias: 0,
        totalProyectos:   0,
    });

    const debounceRef = useRef(null);
    const inputRef    = useRef(null);

    useEffect(() => {
        document.title = 'Perfiles Profesionales · Carrera de Software ESPOCH';
        // Una sola llamada para todas las stats
        axios.get(`${API_URL}/publico/stats`)
            .then(({ data }) => setStats(data))
            .catch(() => {});
        // Carga inicial de graduados
        fetchGraduados({ page: 1, q: '', disponibilidad: '', tecnologia: '' });
    }, []);

    const fetchGraduados = useCallback(async (params = {}) => {
        setCargando(true);
        try {
            const { data } = await axios.get(`${API_URL}/publico/graduados`, {
                params: {
                    page:          params.page          ?? 1,
                    limit:         20,
                    q:             params.q             ?? busqueda,
                    disponibilidad: params.disponibilidad ?? filtroDisp,
                    tecnologia:    params.tecnologia    ?? filtroTec,
                },
            });
            setGraduados(data.graduados    || []);
            setTotal(data.total            || 0);
            setPage(data.page              || 1);
            setPages(data.pages            || 1);
            if (data.topTecnologias?.length > 0) setTopTecnologias(data.topTecnologias);
        } catch { /* silencioso */ }
        finally { setCargando(false); }
    }, [busqueda, filtroDisp, filtroTec]);

    const handleBusqueda = (valor) => {
        setBusqueda(valor);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchGraduados({ q: valor, disponibilidad: filtroDisp, tecnologia: filtroTec, page: 1 });
        }, 400);
    };

    const handleFiltroDisp = (val) => {
        const nuevo = filtroDisp === val ? '' : val;
        setFiltroDisp(nuevo);
        fetchGraduados({ q: busqueda, disponibilidad: nuevo, tecnologia: filtroTec, page: 1 });
    };

    const handleFiltroTec = (tec) => {
        const nuevo = filtroTec === tec ? '' : tec;
        setFiltroTec(nuevo);
        fetchGraduados({ q: busqueda, disponibilidad: filtroDisp, tecnologia: nuevo, page: 1 });
    };

    const limpiarTodo = () => {
        setBusqueda('');
        setFiltroDisp('');
        setFiltroTec('');
        if (inputRef.current) inputRef.current.value = '';
        fetchGraduados({ q: '', disponibilidad: '', tecnologia: '', page: 1 });
    };

    const irPagina = (pg) => {
        setPage(pg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchGraduados({ page: pg });
    };

    const hayFiltros = busqueda || filtroDisp || filtroTec;

    // Stats para el hero — datos reales del endpoint /stats
    const statsData = [
        { value: stats.totalGraduados,   label: 'Graduados'   },
        { value: stats.disponibles,       label: 'Disponibles' },
        { value: stats.totalTecnologias,  label: 'Tecnologías' },
        { value: stats.totalProyectos,    label: 'Proyectos'   },
    ];

    return (
        <>
            <style>{`
                @keyframes spin    { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
                @keyframes fadeIn  { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;} }
                @keyframes shimmer { from{background-position:-200% center;}to{background-position:200% center;} }
            `}</style>

            {/* ════════ HERO ════════ */}
            <header style={{
                ...s.hero,
                padding: isMobile ? '32px 16px 36px' : '52px 20px 60px',
            }}>
                <div style={s.heroBgImagen} />
                <div style={s.heroBgOverlay} />
                <Constellation />

                <div style={{ ...s.heroContent, maxWidth: isMobile ? '100%' : 740 }}>
                    <div style={{
                        ...s.heroBadge,
                        fontSize: isMobile ? '0.67rem' : '0.75rem',
                        padding:  isMobile ? '4px 12px' : '5px 18px',
                    }}>
                        Facultad de Informática y Electrónica · ESPOCH
                    </div>

                    <h1 style={{
                        ...s.heroTitulo,
                        fontSize:     isMobile ? '1.7rem' : isTablet ? '2.1rem' : '2.6rem',
                        marginBottom: isMobile ? 10 : 14,
                    }}>
                        Encuentra Talento en<br />
                        <span style={s.heroAcento}>Software Politécnico</span>
                    </h1>

                    {!isMobile && (
                        <p style={s.heroSub}>
                            Conecta con graduados especializados en desarrollo de software,
                            inteligencia artificial, bases de datos, mobile y más.
                        </p>
                    )}

                    {/* Buscador */}
                    <div style={{
                        ...s.buscadorCard,
                        padding:      isMobile ? '6px 6px 10px' : '8px 8px 12px',
                        marginBottom: isMobile ? 18 : 28,
                    }}>
                        <div style={s.buscadorFila}>
                            <FaSearch style={s.buscadorIco} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={isMobile ? 'Buscar nombre o tecnología...' : 'Busca por nombre, tecnología o especialidad...'}
                                defaultValue={busqueda}
                                onChange={e => handleBusqueda(e.target.value)}
                                style={{ ...s.buscadorInput, fontSize: isMobile ? '0.88rem' : '0.98rem' }}
                                autoComplete="off"
                            />
                            {busqueda && (
                                <button style={s.buscadorLimpiar} onClick={limpiarTodo}>
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        {topTecnologias.length > 0 && (
                            <div style={{
                                ...s.sugerencias,
                                flexWrap:            isMobile ? 'nowrap' : 'wrap',
                                overflowX:           isMobile ? 'auto' : 'visible',
                                paddingBottom:       isMobile ? 4 : 0,
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth:      'none',
                            }}>
                                <span style={{ ...s.sugLabel, flexShrink: 0, fontSize: isMobile ? '0.67rem' : '0.72rem' }}>
                                    Populares:
                                </span>
                                {topTecnologias.map(tag => (
                                    <button key={tag} onClick={() => handleFiltroTec(tag)} style={{
                                        ...s.sugTag,
                                        flexShrink: 0,
                                        fontSize:   isMobile ? '0.67rem' : '0.72rem',
                                        padding:    isMobile ? '2px 8px' : '3px 11px',
                                        background: filtroTec === tag ? 'var(--color-espoch-rojo)' : 'var(--color-tech-azul-claro)',
                                        color:      filtroTec === tag ? 'white' : 'var(--color-tech-azul)',
                                        border:     filtroTec === tag ? '1px solid var(--color-espoch-rojo)' : '1px solid #b8d4f5',
                                        fontWeight: filtroTec === tag ? 700 : 500,
                                    }}>{tag}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats — grid 2x2 en móvil, fila en desktop */}
                    {isMobile ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%' }}>
                            {statsData.map((st, i) => (
                                <div key={st.label} style={{
                                    display:       'flex',
                                    flexDirection: 'column',
                                    alignItems:    'center',
                                    padding:       '10px 8px',
                                    borderRight:   i % 2 === 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                                    borderBottom:  i < 2       ? '1px solid rgba(255,255,255,0.15)' : 'none',
                                }}>
                                    <span style={{ ...s.heroStatNum, fontSize: '1.55rem' }}>{fmtNum(st.value)}</span>
                                    <span style={{ ...s.heroStatLabel, fontSize: '0.64rem' }}>{st.label}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={s.heroStats}>
                            {statsData.map((st, i) => (
                                <React.Fragment key={st.label}>
                                    <Counter value={st.value} label={st.label} />
                                    {i < statsData.length - 1 && <div style={s.heroStatDiv} />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* ════════ CONTENIDO ════════ */}
            <div style={{ ...s.contenido, padding: isMobile ? '18px 12px 40px' : '24px 20px 52px' }}>

                {/* Barra filtros */}
                <div style={{
                    ...s.filtrosBar,
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems:    isMobile ? 'stretch' : 'center',
                    gap: 10, marginBottom: isMobile ? 14 : 18,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ ...s.filtrosLabel, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FaSlidersH style={{ fontSize: '0.72rem' }} />Disponibilidad:
                        </span>
                        {[
                            { val: 'disponible',    label: 'Disponibles', dot: '#2e7d32' },
                            { val: 'no_disponible', label: 'Ocupados',    dot: '#f57f17' },
                        ].map(({ val, label, dot }) => (
                            <button key={val} onClick={() => handleFiltroDisp(val)} style={{
                                ...s.chip,
                                ...(filtroDisp === val ? s.chipActivo : {}),
                                fontSize: isMobile ? '0.73rem' : '0.78rem',
                                padding:  isMobile ? '4px 10px' : '5px 13px',
                            }}>
                                <span style={{
                                    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                                    backgroundColor: filtroDisp === val ? 'white' : dot,
                                    marginRight: 5, flexShrink: 0,
                                }} />{label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: isMobile ? 0 : 'auto', flexWrap: 'wrap' }}>
                        <span style={{ ...s.filtrosDer, fontSize: isMobile ? '0.73rem' : '0.8rem' }}>
                            {cargando
                                ? 'Buscando...'
                                : busqueda
                                    ? <><strong>{total}</strong> resultado{total !== 1 ? 's' : ''} para "<em>{busqueda}</em>"</>
                                    : <><strong>{total}</strong> perfil{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}</>
                            }
                        </span>
                        {hayFiltros && (
                            <button onClick={limpiarTodo} style={s.btnLimpiarFiltros}>
                                <FaTimes style={{ marginRight: 4, fontSize: '0.6rem' }} />Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* Chip tecnología activa */}
                {filtroTec && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', color: '#6c757d', fontFamily: FONT }}>
                            <FaFilter style={{ marginRight: 5, fontSize: '0.62rem' }} />Tecnología:
                        </span>
                        <span style={s.chipTecActivo}>
                            {filtroTec}
                            <button onClick={() => handleFiltroTec(filtroTec)} style={s.chipTecX}>
                                <FaTimes style={{ fontSize: '0.55rem' }} />
                            </button>
                        </span>
                    </div>
                )}

                {/* Grid */}
                {cargando ? (
                    <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(280px,1fr))' }}>
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : graduados.length === 0 ? (
                    <div style={s.vacio}>
                        <FaGraduationCap style={{ fontSize: '3rem', color: '#dee2e6', marginBottom: 12 }} />
                        <p style={{ fontWeight: 700, color: 'var(--color-texto-principal)', marginBottom: 4, fontFamily: FONT, fontSize: '0.95rem' }}>
                            {hayFiltros ? 'Sin resultados para estos filtros' : 'No hay perfiles registrados aún'}
                        </p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-texto-secundario)', marginBottom: 16, fontFamily: FONT }}>
                            {hayFiltros ? 'Prueba ajustando los filtros o limpiando la búsqueda' : 'Pronto aparecerán los perfiles aquí'}
                        </p>
                        {hayFiltros && (
                            <button style={s.btnLimpiarVacio} onClick={limpiarTodo}>Ver todos los perfiles</button>
                        )}
                    </div>
                ) : (
                    <>
                        <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(280px,1fr))' }}>
                            {graduados.map(g => <TarjetaGraduado key={g._id} graduado={g} />)}
                        </div>
                        <Paginador page={page} pages={pages} onIr={irPagina} />
                        {pages > 1 && (
                            <p style={{ textAlign: 'center', marginTop: 10, fontSize: '0.72rem', color: '#adb5bd', fontFamily: FONT }}>
                                Mostrando {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} de {total} perfiles
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

// ══════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════
const s = {
    hero:            { position: 'relative', textAlign: 'center', overflow: 'hidden', backgroundColor: '#0f1428' },
    heroBgImagen:    { position: 'absolute', inset: 0, backgroundImage: 'url("/img/EDIFICIO_FIE_LOGO.jpg")', backgroundSize: 'cover', backgroundPosition: 'center 35%', filter: 'saturate(0.7) brightness(0.5) contrast(1.05)', zIndex: 0 },
    heroBgOverlay:   { position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(190,30,45,0.68) 0%, rgba(120,10,18,0.62) 40%, rgba(12,18,40,0.80) 100%)', zIndex: 1 },
    heroContent:     { margin: '0 auto', position: 'relative', zIndex: 2 },
    heroBadge:       { display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.11)', border: '1px solid rgba(255,255,255,0.28)', color: 'rgba(255,255,255,0.92)', fontWeight: 600, borderRadius: 20, marginBottom: 18, letterSpacing: '0.6px', fontFamily: FONT },
    heroTitulo:      { color: '#FFFFFF', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.15, fontFamily: FONT, textShadow: '0 2px 16px rgba(0,0,0,0.5)' },
    heroAcento:      { color: 'rgba(255,255,255,0.78)' },
    heroSub:         { color: 'rgba(255,255,255,0.85)', fontSize: '0.96rem', lineHeight: 1.7, margin: '0 auto 28px', maxWidth: 520, fontFamily: FONT, textShadow: '0 1px 6px rgba(0,0,0,0.4)' },
    buscadorCard:    { backgroundColor: 'white', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.38)' },
    buscadorFila:    { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' },
    buscadorIco:     { color: 'var(--color-espoch-rojo)', fontSize: '1.1rem', flexShrink: 0, marginLeft: 4 },
    buscadorInput:   { flex: 1, border: 'none', outline: 'none', color: 'var(--color-texto-principal)', padding: '10px 8px', fontFamily: FONT, backgroundColor: 'transparent' },
    buscadorLimpiar: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', padding: 6 },
    sugerencias:     { display: 'flex', alignItems: 'center', gap: 7, padding: '4px 14px 2px' },
    sugLabel:        { color: 'var(--color-texto-secundario)', fontWeight: 600, fontFamily: FONT },
    sugTag:          { borderRadius: 20, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', border: '1px solid' },
    heroStats:       { display: 'flex', justifyContent: 'center', alignItems: 'center' },
    heroStatItem:    { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' },
    heroStatNum:     { color: 'white', fontSize: '1.85rem', fontWeight: 900, lineHeight: 1, display: 'block', fontFamily: FONT, textShadow: '0 2px 8px rgba(0,0,0,0.4)' },
    heroStatLabel:   { color: 'rgba(255,255,255,0.62)', fontSize: '0.72rem', marginTop: 4, display: 'block', fontFamily: FONT },
    heroStatDiv:     { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.22)' },
    contenido:       { maxWidth: 1200, margin: '0 auto' },
    filtrosBar:      { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' },
    filtrosLabel:    { fontSize: '0.78rem', color: 'var(--color-texto-secundario)', fontWeight: 600, fontFamily: FONT },
    chip:            { display: 'inline-flex', alignItems: 'center', borderRadius: 20, border: '1px solid #dee2e6', backgroundColor: 'white', color: 'var(--color-texto-secundario)', cursor: 'pointer', fontWeight: 500, fontFamily: FONT, transition: 'all 0.15s' },
    chipActivo:      { backgroundColor: 'var(--color-espoch-rojo)', color: 'white', borderColor: 'var(--color-espoch-rojo)', fontWeight: 700 },
    filtrosDer:      { color: 'var(--color-texto-secundario)', fontFamily: FONT },
    btnLimpiarFiltros: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-texto-secundario)', fontFamily: FONT },
    chipTecActivo:   { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 10px', fontSize: '0.74rem', fontWeight: 600, fontFamily: FONT },
    chipTecX:        { background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', display: 'flex', alignItems: 'center', padding: 0, marginLeft: 2 },
    grid:            { display: 'grid', gap: 18, animation: 'fadeIn 0.3s' },
    vacio:           { textAlign: 'center', padding: '52px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    btnLimpiarVacio: { padding: '9px 20px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontFamily: FONT, fontSize: '0.84rem' },
    pagBtn:          { minWidth: 34, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.79rem', fontFamily: FONT, border: '1px solid #e9ecef', background: 'white', color: '#6c757d', padding: '0 8px', transition: 'all 0.15s' },
    pagSep:          { fontSize: '0.8rem', color: '#adb5bd', padding: '0 3px', fontFamily: FONT },
};

const ts = {
    card:        { backgroundColor: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeIn 0.3s', fontFamily: FONT },
    header:      { display: 'flex', gap: 12, alignItems: 'flex-start' },
    fotoWrap:    { width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-espoch-rojo)', flexShrink: 0 },
    foto:        { width: '100%', height: '100%', objectFit: 'cover' },
    fotoIcon:    { fontSize: 56, color: '#dee2e6', display: 'block' },
    info:        { flex: 1, minWidth: 0 },
    nombre:      { margin: '0 0 2px', fontSize: '0.93rem', fontWeight: 700, color: 'var(--color-texto-principal)', fontFamily: FONT },
    subtitulo:   { margin: '0 0 2px', fontSize: '0.73rem', color: 'var(--color-espoch-rojo)', fontWeight: 600, fontFamily: FONT },
    ciudad:      { margin: 0, fontSize: '0.71rem', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', fontFamily: FONT },
    badge:       { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.71rem', fontWeight: 600, alignSelf: 'flex-start', fontFamily: FONT },
    bio:         { margin: 0, fontSize: '0.79rem', color: 'var(--color-texto-principal)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: FONT },
    seccion:     { display: 'flex', flexDirection: 'column', gap: 5 },
    secLabel:    { margin: 0, fontSize: '0.73rem', fontWeight: 700, color: 'var(--color-texto-principal)', display: 'flex', alignItems: 'center', fontFamily: FONT },
    tagsWrap:    { display: 'flex', flexWrap: 'wrap', gap: 5 },
    tag:         { backgroundColor: 'var(--tag-bg-azul)', color: 'var(--tag-text-azul)', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 500, border: '1px solid #bbdefb', fontFamily: FONT },
    tagMas:      { backgroundColor: 'var(--color-fondo-web)', color: 'var(--color-texto-secundario)', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontFamily: FONT },
    tagEsp:      { backgroundColor: '#fce4ec', color: 'var(--color-espoch-rojo)', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 500, border: '1px solid #f8bbd0', fontFamily: FONT },
    footerCard:  { marginTop: 'auto', display: 'flex' },
    btnVerPerfil:{ flex: 1, padding: '8px 10px', backgroundColor: 'white', color: 'var(--color-espoch-rojo)', border: '1px solid var(--color-espoch-rojo)', borderRadius: 8, cursor: 'pointer', fontSize: '0.79rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, transition: 'all 0.15s' },
};

const sk = {
    line:   { height: 12, borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200%', animation: 'shimmer 1.3s infinite' },
    circle: { width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200%', animation: 'shimmer 1.3s infinite', flexShrink: 0 },
};

export default PublicHome;
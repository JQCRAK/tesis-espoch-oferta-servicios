// frontend/src/pages/Noticias.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    FaNewspaper, FaCalendarAlt, FaMapMarkerAlt, FaVideo,
    FaTimes, FaClock, FaLink, FaChevronRight, FaChevronLeft,
} from 'react-icons/fa';

const API  = import.meta.env.VITE_API_URL  || 'http://localhost:4000/api';
const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
const FONT = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

/* ── Helpers seguros ────────────────────────────────────── */
const fmtLarga = (d) => d ? new Date(d).toLocaleDateString('es-EC', { day:'numeric', month:'long',  year:'numeric' }) : '—';
const fmtCorta = (d) => d ? new Date(d).toLocaleDateString('es-EC', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtHora  = (d) => d ? new Date(d).toLocaleTimeString('es-EC', { hour:'2-digit', minute:'2-digit' }) : '';
const fmtMes   = (d) => d ? new Date(d).toLocaleDateString('es-EC', { month:'short' }).toUpperCase() : '';
const fmtDia   = (d) => d ? new Date(d).getDate() : '';

const truncar = (txt = '', max = 180) => {
    const l = txt.replace(/<[^>]*>/g, '').trim();
    return l.length > max ? l.substring(0, max) + '…' : l;
};
const imgUrl = (ruta) => {
    if (!ruta) return null;
    if (/^(javascript|data|vbscript):/i.test(ruta)) return null;
    if (/^https?:\/\//i.test(ruta) && !ruta.startsWith(BASE)) return null;
    return `${BASE}/${ruta.replace(/^\//, '')}`;
};

const CAT_LABEL = {
    convocatoria:'Convocatoria', comunicado:'Comunicado Oficial',
    logro:'Logro', evento:'Evento', oportunidad_laboral:'Op. Laboral',
};
const CAT_CLR = {
    convocatoria:       { bg:'#e3f2fd', color:'#1565c0' },
    comunicado:         { bg:'#ffebee', color:'#c62828' },
    logro:              { bg:'#e8f5e9', color:'#2e7d32' },
    evento:             { bg:'#f3e8ff', color:'#6a1b9a' },
    oportunidad_laboral:{ bg:'#fff8e1', color:'#f57f17' },
};
const GRADS = [
    'linear-gradient(145deg,#004d40,#00897b)',
    'linear-gradient(145deg,#0d47a1,#1976d2)',
    'linear-gradient(145deg,#4a148c,#7b1fa2)',
    'linear-gradient(145deg,#b71c1c,#d32f2f)',
    'linear-gradient(145deg,#e65100,#f4511e)',
    'linear-gradient(145deg,#1b5e20,#388e3c)',
];
const MOD_ICO = { presencial: FaMapMarkerAlt, virtual: FaVideo, hibrida: FaLink };

/* ════════════════════════════════════════════════════════
   COMPONENTE: Imagen con fondo blur + foto nítida encima
   ────────────────────────────────────────────────────────
   - El fondo desenfocado ocupa todo el contenedor
   - La imagen nítida se centra encima con padding
   - Si no hay imagen usa gradiente institucional
════════════════════════════════════════════════════════ */
const ImgBlur = ({ url, grad, h = 200, radius = '10px 10px 0 0', children }) => (
    <div style={{
        position:'relative', height:h, overflow:'hidden',
        borderRadius:radius, background:'#0d0d0d', flexShrink:0,
    }}>
        {/* ── Capa 1: fondo desenfocado ── */}
        {url
            ? <div style={{
                position:'absolute', inset:0,
                backgroundImage:`url(${url})`,
                backgroundSize:'cover',
                backgroundPosition:'center',
                filter:'blur(10px) brightness(0.4) saturate(0.8)',
                transform:'scale(1.12)',
              }} />
            : <div style={{
                position:'absolute', inset:0,
                background:grad,
                filter:'brightness(0.55)',
              }} />
        }

        {/* ── Capa 2: imagen nítida centrada ── */}
        <div style={{
            position:'absolute', inset:0, zIndex:1,
            display:'flex', alignItems:'center', justifyContent:'center',
            padding: url ? '10px 16px' : 0,
        }}>
            {url
                ? <img
                    src={url} alt="" loading="lazy"
                    style={{
                        maxWidth:'100%', maxHeight:'100%',
                        objectFit:'contain',
                        borderRadius:7,
                        boxShadow:'0 4px 24px rgba(0,0,0,0.55)',
                    }}
                    onError={e => { e.target.style.display='none'; }}
                  />
                : <div style={{
                    position:'absolute', inset:0,
                    background:grad, borderRadius:radius,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <FaNewspaper style={{ fontSize:'2.2rem', color:'rgba(255,255,255,0.25)' }} />
                  </div>
            }
        </div>

        {/* ── Capa 3: contenido (badges, botones) ── */}
        <div style={{ position:'absolute', inset:0, zIndex:2 }}>
            {children}
        </div>
    </div>
);

/* ── Skeleton ── */
const Sk = ({ h=11, w='100%', mb=0 }) => (
    <div style={{ height:h, width:w, borderRadius:4, background:'#efefef', marginBottom:mb }} />
);

/* ═══════════════════════════════════════════════════════════
   PÁGINA
═══════════════════════════════════════════════════════════ */
const Noticias = () => {
    useEffect(() => { document.title = 'Noticias · Carrera de Software ESPOCH'; }, []);

    const [vista,     setVista]     = useState('noticias');
    const [noticias,  setNoticias]  = useState([]);
    const [eventos,   setEventos]   = useState([]);
    const [cargando,  setCargando]  = useState(true);
    const [pagina,    setPagina]    = useState(1);
    const [totalPags, setTotalPags] = useState(1);
    const [modal,     setModal]     = useState(null);
    const LIMIT = 12;

    /* ── Carga ───────────────────────────────────────────── */
    const cargar = useCallback(async (pag = 1) => {
        setCargando(true);
        try {
            const [nRes, eRes] = await Promise.all([
                axios.get(`${API}/noticias`, {
                    params: { estado:'publicada', page:pag, limit:LIMIT },
                }),
                // Solo eventos vigentes (programado o en_curso) — el backend filtra por estado=vigente
                axios.get(`${API}/eventos`, {
                    params: { estado:'vigente', limit:20 },
                }),
            ]);
            setNoticias(nRes.data.noticias  || []);
            setTotalPags(nRes.data.totalPaginas || 1);
            setEventos(eRes.data.eventos    || []);
        } catch { /* silencioso */ }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(1); }, [cargar]);

    useEffect(() => {
        const fn = e => { if (e.key === 'Escape') setModal(null); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, []);

    const irPag = (p) => {
        setPagina(p); cargar(p);
        window.scrollTo({ top:0, behavior:'smooth' });
    };

    /* ── Paginador ── */
    const Paginador = () => {
        if (totalPags <= 1) return null;
        const ini  = Math.max(1, pagina - 2);
        const fin  = Math.min(totalPags, ini + 4);
        const pags = Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
        return (
            <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:28, alignItems:'center' }}>
                <button style={{ ...s.pagBtn, opacity:pagina===1?0.4:1 }}
                    disabled={pagina===1} onClick={() => irPag(pagina-1)}>
                    <FaChevronLeft style={{ fontSize:'0.6rem' }} />
                </button>
                {ini > 1 && <span style={s.pagPts}>···</span>}
                {pags.map(p => (
                    <button key={p} onClick={() => irPag(p)} style={{
                        ...s.pagBtn,
                        background: p===pagina ? 'var(--color-espoch-rojo)' : 'white',
                        color:      p===pagina ? 'white' : '#6c757d',
                        border:     p===pagina ? '1px solid var(--color-espoch-rojo)' : '1px solid #e9ecef',
                        fontWeight: p===pagina ? '700' : '400',
                    }}>{p}</button>
                ))}
                {fin < totalPags && <span style={s.pagPts}>···</span>}
                <button style={{ ...s.pagBtn, opacity:pagina===totalPags?0.4:1 }}
                    disabled={pagina===totalPags} onClick={() => irPag(pagina+1)}>
                    <FaChevronRight style={{ fontSize:'0.6rem' }} />
                </button>
            </div>
        );
    };

    /* ── Vista Eventos — solo vigentes con fecha inicio y fin ── */
    const VistaEventos = () => (
        <div style={s.gridEventos}>
            {cargando
                ? Array.from({length:6}).map((_,i) => (
                    <div key={i} style={s.evCard}>
                        <div style={{ height:150, background:'#efefef', borderRadius:'9px 9px 0 0' }} />
                        <div style={{ padding:'12px 14px' }}>
                            <Sk h={10} w="40%" mb={8} />
                            <Sk h={14} w="85%" mb={6} />
                            <Sk h={10} w="60%" mb={4} />
                            <Sk h={10} w="50%" mb={0} />
                        </div>
                    </div>
                ))
                : eventos.length === 0
                    ? <div style={{ ...s.emptyBox, gridColumn:'1/-1' }}>
                        <FaCalendarAlt style={{ fontSize:'2.5rem', color:'#dee2e6', marginBottom:10 }} />
                        <p style={s.emptyTit}>Sin eventos vigentes</p>
                        <p style={s.emptySub}>Los próximos eventos aparecerán aquí.</p>
                      </div>
                    : eventos.map((ev, i) => {
                        const url  = imgUrl(ev.imagen);
                        const bEst = ev.estado === 'en_curso'
                            ? { bg:'#e8f5e9', color:'#2e7d32', label:'En curso' }
                            : { bg:'#e3f2fd', color:'#1565c0', label:'Próximo'  };
                        const MIc = MOD_ICO[ev.modalidad] || FaLink;
                        return (
                            <div key={ev._id} style={s.evCard}
                                onClick={() => setModal({ item:ev, tipo:'evento' })}
                                onKeyDown={e => e.key==='Enter' && setModal({ item:ev, tipo:'evento' })}
                                tabIndex={0} role="button">

                                <ImgBlur url={url} grad={GRADS[i % GRADS.length]} h={150} radius="9px 9px 0 0">
                                    <span style={{
                                        position:'absolute', top:9, right:9,
                                        ...s.badge, background:bEst.bg, color:bEst.color,
                                    }}>
                                        {bEst.label}
                                    </span>
                                </ImgBlur>

                                <div style={s.evBody}>
                                    <h3 style={s.evTit}>{ev.titulo}</h3>

                                    {/* Fecha inicio → fin */}
                                    <div style={s.evFechasBox}>
                                        <div style={s.evFechaItem}>
                                            <span style={s.evFechaLabel}>Inicio</span>
                                            <span style={s.evFechaVal}>
                                                {fmtCorta(ev.fechaInicio)}
                                                {fmtHora(ev.fechaInicio) && ` · ${fmtHora(ev.fechaInicio)}`}
                                            </span>
                                        </div>
                                        <div style={s.evFechaSep}>→</div>
                                        <div style={s.evFechaItem}>
                                            <span style={s.evFechaLabel}>Fin</span>
                                            <span style={s.evFechaVal}>
                                                {fmtCorta(ev.fechaFin)}
                                                {fmtHora(ev.fechaFin) && ` · ${fmtHora(ev.fechaFin)}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Modalidad/lugar */}
                                    {(ev.lugar || ev.urlAcceso) && (
                                        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
                                            <MIc style={{ fontSize:'0.6rem', color:'#adb5bd', flexShrink:0 }} />
                                            <span style={{ fontSize:'0.69rem', color:'#adb5bd' }}>
                                                {ev.modalidad==='virtual' ? 'Virtual'
                                                    : ev.modalidad==='hibrida' ? `${ev.lugar||''} · Virtual`
                                                    : (ev.lugar||'Presencial')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
            }
        </div>
    );

    /* ── Vista Noticias — fiel al Figma ── */
    const principal   = noticias[0] || null;
    const secundarias = noticias.slice(1);

    const VistaNoticiasContent = () => (
        <>
            {/* NOTICIA DESTACADA */}
            {cargando ? (
                <div style={s.featCard}>
                    <div style={{ height:260, background:'#efefef', borderRadius:'10px 10px 0 0' }} />
                    <div style={{ padding:'18px 22px' }}>
                        <Sk h={10} w="25%" mb={12} />
                        <Sk h={22} w="78%" mb={7} />
                        <Sk h={22} w="52%" mb={14} />
                        <Sk h={12} w="100%" mb={6} />
                        <Sk h={12} w="80%"  mb={6} />
                        <Sk h={12} w="60%"  mb={0} />
                    </div>
                </div>
            ) : principal ? (
                <div style={s.featCard}
                    onClick={() => setModal({ item:principal, tipo:'noticia' })}
                    onKeyDown={e => e.key==='Enter' && setModal({ item:principal, tipo:'noticia' })}
                    tabIndex={0} role="button">

                    {/* Imagen: blur fondo + nítida encima */}
                    <ImgBlur url={imgUrl(principal.imagen)} grad={GRADS[0]} h={260} radius="10px 10px 0 0">
                        {(() => {
                            const c = CAT_CLR[principal.categoria] || CAT_CLR.comunicado;
                            return (
                                <span style={{
                                    position:'absolute', top:12, left:14,
                                    ...s.badge, background:c.bg, color:c.color,
                                }}>
                                    {CAT_LABEL[principal.categoria] || principal.categoria}
                                </span>
                            );
                        })()}
                    </ImgBlur>

                    <div style={s.featBody}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                            <FaCalendarAlt style={{ fontSize:'0.68rem', color:'#adb5bd' }} />
                            <span style={s.fechaTxt}>
                                {fmtLarga(principal.fechaPublicacion || principal.createdAt)}
                            </span>
                        </div>
                        <h2 style={s.featTit}>{principal.titulo}</h2>
                        <p  style={s.featDesc}>
                            {truncar(principal.resumen || principal.contenido, 220)}
                        </p>
                        <span style={s.btnLeer}>
                            Leer más <FaChevronRight style={{ fontSize:'0.6rem', marginLeft:4 }} />
                        </span>
                    </div>
                </div>
            ) : (
                <div style={s.emptyBox}>
                    <FaNewspaper style={{ fontSize:'2.5rem', color:'#dee2e6', marginBottom:10 }} />
                    <p style={s.emptyTit}>Sin noticias publicadas aún</p>
                    <p style={s.emptySub}>Vuelve pronto para ver las novedades.</p>
                </div>
            )}

            {/* GRID SECUNDARIAS 2 columnas */}
            {(cargando || secundarias.length > 0) && (
                <div style={s.grid2}>
                    {cargando
                        ? Array.from({length:4}).map((_,i) => (
                            <div key={i} style={s.secCard}>
                                <div style={{ height:145, background:'#efefef', borderRadius:'9px 9px 0 0' }} />
                                <div style={{ padding:'12px 14px' }}>
                                    <Sk h={9}  w="35%" mb={8} />
                                    <Sk h={14} w="90%" mb={5} />
                                    <Sk h={14} w="65%" mb={9} />
                                    <Sk h={10} w="100%" mb={4} />
                                    <Sk h={10} w="75%"  mb={0} />
                                </div>
                            </div>
                        ))
                        : secundarias.map((n, i) => (
                            <div key={n._id} style={s.secCard}
                                onClick={() => setModal({ item:n, tipo:'noticia' })}
                                onKeyDown={e => e.key==='Enter' && setModal({ item:n, tipo:'noticia' })}
                                tabIndex={0} role="button">

                                <ImgBlur url={imgUrl(n.imagen)} grad={GRADS[(i+1) % GRADS.length]} h={145} radius="9px 9px 0 0" />

                                <div style={s.secBody}>
                                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                                        <FaCalendarAlt style={{ fontSize:'0.6rem', color:'#adb5bd' }} />
                                        <span style={{ ...s.fechaTxt, fontSize:'0.7rem' }}>
                                            {fmtCorta(n.fechaPublicacion || n.createdAt)}
                                        </span>
                                    </div>
                                    <h3 style={s.secTit}>{n.titulo}</h3>
                                    <p  style={s.secDesc}>{truncar(n.resumen || n.contenido, 100)}</p>
                                    <span style={s.btnLeerSm}>
                                        Leer más <FaChevronRight style={{ fontSize:'0.55rem', marginLeft:3 }} />
                                    </span>
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}
            <Paginador />
        </>
    );

    /* ════════════════════════════════════════════════════
       RENDER PRINCIPAL
    ════════════════════════════════════════════════════ */
    return (
        <div style={s.wrap}>
            <div style={s.cuerpo}>
                <div style={s.layout}>

                    {/* ═══ COLUMNA PRINCIPAL ═══ */}
                    <div style={s.colMain}>

                        {/* Pestañas — SIN título redundante */}
                        <div style={s.tabs}>
                            {[
                                { k:'noticias', l:'Noticias',  ico: FaNewspaper },
                                { k:'eventos',  l:'Eventos',   ico: FaCalendarAlt },
                            ].map(t => {
                                const Ico    = t.ico;
                                const activo = vista === t.k;
                                return (
                                    <button key={t.k} onClick={() => setVista(t.k)} style={{
                                        ...s.tab,
                                        borderBottom: activo ? '2px solid var(--color-espoch-rojo)' : '2px solid transparent',
                                        color:        activo ? 'var(--color-espoch-rojo)' : '#6c757d',
                                        fontWeight:   activo ? '700' : '500',
                                        background:   activo ? 'white' : 'transparent',
                                    }}>
                                        <Ico style={{ fontSize:'0.75rem' }} /> {t.l}
                                    </button>
                                );
                            })}
                        </div>

                        {vista === 'noticias' ? <VistaNoticiasContent /> : <VistaEventos />}
                    </div>

                    {/* ═══ SIDEBAR ═══ */}
                    <aside style={s.sidebar}>

                        {/* Próximos eventos */}
                        <div style={s.sideCard}>
                            <h3 style={s.sideTit}>
                                <FaCalendarAlt style={{ color:'var(--color-espoch-rojo)', fontSize:'0.82rem' }} />
                                Próximos Eventos
                            </h3>

                            {cargando
                                ? Array.from({length:3}).map((_,i) => (
                                    <div key={i} style={{ display:'flex', gap:9, marginBottom:12 }}>
                                        <div style={{ width:36, height:42, borderRadius:7, background:'#efefef', flexShrink:0 }} />
                                        <div style={{ flex:1 }}>
                                            <Sk h={10} w="90%" mb={5} />
                                            <Sk h={8}  w="60%" mb={0} />
                                        </div>
                                    </div>
                                ))
                                : eventos.length === 0
                                    ? <p style={{ fontSize:'0.75rem', color:'#adb5bd', textAlign:'center', padding:'8px 0', margin:0 }}>
                                        Sin eventos próximos.
                                      </p>
                                    : eventos.slice(0, 5).map(ev => {
                                        const esCurso = ev.estado === 'en_curso';
                                        return (
                                            <div key={ev._id} style={s.evSide}
                                                onClick={() => setModal({ item:ev, tipo:'evento' })}
                                                onKeyDown={e => e.key==='Enter' && setModal({ item:ev, tipo:'evento' })}
                                                tabIndex={0} role="button">
                                                <div style={{
                                                    ...s.evBlk,
                                                    background: esCurso ? '#e8f5e9' : '#e3f2fd',
                                                    border: `1px solid ${esCurso ? '#c8e6c9' : '#bbdefb'}`,
                                                }}>
                                                    <span style={{ ...s.evMes, color: esCurso?'#2e7d32':'#1565c0' }}>
                                                        {fmtMes(ev.fechaInicio)}
                                                    </span>
                                                    <span style={{ ...s.evDia, color: esCurso?'#1b5e20':'#0d47a1' }}>
                                                        {fmtDia(ev.fechaInicio)}
                                                    </span>
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <p style={s.evSideNom}>{ev.titulo}</p>
                                                    <span style={s.evSideMeta}>
                                                        {fmtHora(ev.fechaInicio)}
                                                        {(ev.lugar || ev.urlAcceso)
                                                            ? ` · ${ev.modalidad==='virtual' ? 'Virtual' : (ev.lugar||'Presencial')}`
                                                            : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                            }

                            {!cargando && eventos.length > 0 && (
                                <button style={s.btnVerTodos} onClick={() => setVista('eventos')}>
                                    Ver todos los eventos
                                </button>
                            )}
                        </div>

                        {/* Banner */}
                        <div style={s.banner}>
                            <div style={s.bannerStripe} />
                            <div style={s.bannerBody}>
                                <p style={s.bannerTit}>¿Eres graduado ESPOCH?</p>
                                <p style={s.bannerSub}>
                                    Crea tu perfil profesional y conecta con empresas del sector tecnológico.
                                </p>
                                <a href="/login" style={s.bannerBtn}>Acceder al portal →</a>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                MODAL — solo texto plano, sin innerHTML
            ══════════════════════════════════════════════════ */}
            {modal && (() => {
                const { item, tipo } = modal;
                const url  = imgUrl(item.imagen);
                const cat  = CAT_CLR[item.categoria] || { bg:'#f5f5f5', color:'#555' };
                const bEst = item.estado==='en_curso'
                    ? { bg:'#e8f5e9', color:'#2e7d32', label:'En curso' }
                    : { bg:'#e3f2fd', color:'#1565c0', label:'Próximo'  };
                const MIc  = MOD_ICO[item.modalidad] || FaLink;

                return (
                    <div style={s.overlay}
                        role="dialog" aria-modal="true" aria-label={item.titulo}
                        onClick={e => { if(e.target===e.currentTarget) setModal(null); }}>
                        <div style={s.modalBox}>

                            {/* Imagen modal con blur + nítida */}
                            <ImgBlur url={url} grad={GRADS[0]} h={210} radius="14px 14px 0 0">
                                {/* Badge */}
                                {tipo==='noticia'
                                    ? <span style={{ position:'absolute', top:12, left:14,
                                        ...s.badge, background:cat.bg, color:cat.color }}>
                                        {CAT_LABEL[item.categoria]||item.categoria}
                                      </span>
                                    : <span style={{ position:'absolute', top:12, left:14,
                                        ...s.badge, background:bEst.bg, color:bEst.color }}>
                                        📅 {bEst.label}
                                      </span>
                                }
                                {/* Cerrar */}
                                <button style={s.modalClose} onClick={() => setModal(null)} aria-label="Cerrar">
                                    <FaTimes style={{ fontSize:'0.8rem' }} />
                                </button>
                                {/* Título + fecha superpuestos */}
                                <div style={{
                                    position:'absolute', bottom:0, left:0, right:0,
                                    padding:'28px 20px 14px',
                                    background:'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                                }}>
                                    <h2 style={s.modalImgTit}>{item.titulo}</h2>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                        <FaCalendarAlt style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.7)' }} />
                                        <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.85)', fontFamily:FONT }}>
                                            {tipo==='noticia'
                                                ? fmtLarga(item.fechaPublicacion || item.createdAt)
                                                : `${fmtLarga(item.fechaInicio)} → ${fmtLarga(item.fechaFin)}`}
                                        </span>
                                    </div>
                                </div>
                            </ImgBlur>

                            {/* Cuerpo */}
                            <div style={s.modalBody}>
                                {/* Info extra evento */}
                                {tipo==='evento' && (
                                    <div style={s.evInfoBox}>
                                        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                                            {item.tipo && (
                                                <span style={{ ...s.badge, background:'#f3e8ff', color:'#6a1b9a' }}>
                                                    {item.tipo}
                                                </span>
                                            )}
                                            <span style={{ ...s.badge, background: bEst.bg, color: bEst.color }}>
                                                {bEst.label}
                                            </span>
                                        </div>
                                        {/* Fechas inicio → fin */}
                                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                                            <FaClock style={{ fontSize:'0.75rem', color:'var(--color-espoch-rojo)', flexShrink:0 }} />
                                            <div>
                                                <span style={{ fontSize:'0.8rem', color:'#2c3e50', fontWeight:'600' }}>
                                                    {fmtLarga(item.fechaInicio)} {fmtHora(item.fechaInicio) && `· ${fmtHora(item.fechaInicio)}`}
                                                </span>
                                                {item.fechaFin && (
                                                    <span style={{ fontSize:'0.78rem', color:'#6c757d', display:'block' }}>
                                                        hasta {fmtLarga(item.fechaFin)} {fmtHora(item.fechaFin) && `· ${fmtHora(item.fechaFin)}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Lugar */}
                                        {(item.lugar || item.urlAcceso) && (
                                            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:7 }}>
                                                <MIc style={{ fontSize:'0.75rem', color:'var(--color-espoch-rojo)', flexShrink:0 }} />
                                                <span style={{ fontSize:'0.81rem', color:'#2c3e50' }}>
                                                    {item.modalidad==='virtual' ? (item.urlAcceso||'Virtual')
                                                        : item.modalidad==='hibrida' ? `${item.lugar||''} · ${item.urlAcceso||''}`
                                                        : (item.lugar||'Presencial')}
                                                </span>
                                            </div>
                                        )}
                                        {item.capacidadMaxima > 0 && (
                                            <p style={{ margin:'6px 0 0', fontSize:'0.77rem', color:'#6c757d' }}>
                                                {item.inscritos||0} / {item.capacidadMaxima} inscritos
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Resumen */}
                                {(item.resumen || item.descripcion) && (
                                    <div style={s.modalResBox}>
                                        <p style={s.modalRes}>{item.resumen || item.descripcion}</p>
                                    </div>
                                )}

                                {/* Contenido párrafos — texto plano seguro */}
                                {item.contenido &&
                                    item.contenido.split('\n')
                                        .map(p => p.trim()).filter(Boolean)
                                        .map((p, i) => <p key={i} style={s.modalP}>{p}</p>)
                                }
                            </div>

                            <div style={s.modalFoot}>
                                <span style={{ fontSize:'0.69rem', color:'#adb5bd', fontFamily:FONT }}>
                                    Carrera de Software — ESPOCH
                                </span>
                                <button style={s.btnCerrar} onClick={() => setModal(null)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   ESTILOS
═══════════════════════════════════════════════════════════ */
const s = {
    wrap:   { minHeight:'60vh', background:'#f4f5f7', fontFamily:FONT },
    cuerpo: { maxWidth:1160, margin:'0 auto', padding:'24px 20px 60px' },
    layout: { display:'grid', gridTemplateColumns:'1fr 290px', gap:24, alignItems:'start' },
    colMain:{ display:'flex', flexDirection:'column', gap:18 },

    /* Pestañas — sin título encima */
    tabs: {
        display:'flex', gap:0,
        borderBottom:'2px solid #e9ecef',
        marginBottom:4,
    },
    tab: {
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'8px 18px',
        background:'none', border:'none',
        borderBottom:'2px solid transparent',
        cursor:'pointer', fontSize:'0.84rem',
        fontFamily:FONT, transition:'all 0.15s',
        marginBottom:-2,
    },

    /* Noticia destacada */
    featCard: { backgroundColor:'white', borderRadius:10, border:'1px solid #e8eaed', boxShadow:'0 1px 8px rgba(0,0,0,0.07)', overflow:'hidden', cursor:'pointer', outline:'none' },
    featBody: { padding:'16px 20px 18px' },
    fechaTxt: { fontSize:'0.73rem', color:'#adb5bd', fontFamily:FONT },
    featTit:  { margin:'0 0 8px', fontSize:'1.18rem', fontWeight:'800', color:'#1a1a2e', lineHeight:1.35, fontFamily:FONT },
    featDesc: { margin:'0 0 12px', fontSize:'0.83rem', color:'#6c757d', lineHeight:1.68, fontFamily:FONT },
    btnLeer:  { display:'inline-flex', alignItems:'center', color:'var(--color-espoch-rojo)', fontWeight:'700', fontSize:'0.82rem', cursor:'pointer', fontFamily:FONT },
    badge:    { fontSize:'0.62rem', fontWeight:'700', padding:'3px 9px', borderRadius:20, letterSpacing:'0.3px', display:'inline-block' },

    /* Grid 2 col noticias */
    grid2:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
    secCard: { backgroundColor:'white', borderRadius:9, border:'1px solid #e8eaed', overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column', boxShadow:'0 1px 5px rgba(0,0,0,0.06)', outline:'none' },
    secBody: { padding:'11px 13px 14px', flex:1, display:'flex', flexDirection:'column' },
    secTit:  { margin:'0 0 4px', fontSize:'0.87rem', fontWeight:'700', color:'#1a1a2e', lineHeight:1.38, fontFamily:FONT, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },
    secDesc: { margin:'0 0 7px', fontSize:'0.75rem', color:'#6c757d', lineHeight:1.57, flex:1, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden', fontFamily:FONT },
    btnLeerSm:{ display:'inline-flex', alignItems:'center', color:'var(--color-espoch-rojo)', fontWeight:'700', fontSize:'0.75rem', cursor:'pointer', marginTop:'auto', fontFamily:FONT },

    /* Grid eventos 3 col */
    gridEventos: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 },
    evCard:  { backgroundColor:'white', borderRadius:9, border:'1px solid #e8eaed', overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column', boxShadow:'0 1px 5px rgba(0,0,0,0.06)', outline:'none' },
    evBody:  { padding:'10px 12px 13px', flex:1 },
    evTit:   { margin:'0 0 8px', fontSize:'0.83rem', fontWeight:'700', color:'#1a1a2e', lineHeight:1.35, fontFamily:FONT, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },

    /* Fechas inicio/fin en tarjeta evento */
    evFechasBox:  { display:'flex', alignItems:'center', gap:6, background:'#f8f9fa', border:'1px solid #f0f0f0', borderRadius:6, padding:'6px 9px' },
    evFechaItem:  { display:'flex', flexDirection:'column', gap:1, flex:1 },
    evFechaLabel: { fontSize:'0.58rem', fontWeight:'700', color:'#adb5bd', textTransform:'uppercase', letterSpacing:'0.4px' },
    evFechaVal:   { fontSize:'0.68rem', color:'#2c3e50', fontWeight:'600', fontFamily:FONT },
    evFechaSep:   { fontSize:'0.75rem', color:'#adb5bd', fontWeight:'700', flexShrink:0 },

    /* Empty */
    emptyBox:{ display:'flex', flexDirection:'column', alignItems:'center', padding:'44px 20px', background:'white', borderRadius:10, border:'1px dashed #dee2e6', textAlign:'center' },
    emptyTit:{ margin:'0 0 4px', fontWeight:'700', color:'#2c3e50', fontSize:'0.9rem', fontFamily:FONT },
    emptySub:{ margin:0, fontSize:'0.75rem', color:'#adb5bd', fontFamily:FONT },

    /* Paginador */
    pagBtn: { minWidth:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'0.79rem', fontFamily:FONT, border:'1px solid #e9ecef', background:'white', color:'#6c757d', padding:'0 8px' },
    pagPts: { fontSize:'0.8rem', color:'#adb5bd', padding:'0 3px' },

    /* Sidebar */
    sidebar:    { display:'flex', flexDirection:'column', gap:14, position:'sticky', top:16 },
    sideCard:   { backgroundColor:'white', borderRadius:9, border:'1px solid #e8eaed', padding:'14px 16px', boxShadow:'0 1px 5px rgba(0,0,0,0.05)' },
    sideTit:    { margin:'0 0 13px', fontSize:'0.88rem', fontWeight:'700', color:'#1a1a2e', display:'flex', alignItems:'center', gap:7, fontFamily:FONT },
    evSide:     { display:'flex', alignItems:'flex-start', gap:9, marginBottom:11, paddingBottom:11, borderBottom:'1px solid #f0f0f0', cursor:'pointer', outline:'none' },
    evBlk:      { width:36, minWidth:36, borderRadius:7, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'4px 2px' },
    evMes:      { fontSize:'0.54rem', fontWeight:'700', letterSpacing:'0.5px', lineHeight:1 },
    evDia:      { fontSize:'1.05rem', fontWeight:'800', lineHeight:1.1 },
    evSideNom:  { margin:'0 0 2px', fontSize:'0.75rem', fontWeight:'600', color:'#1a1a2e', lineHeight:1.38, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', fontFamily:FONT },
    evSideMeta: { fontSize:'0.65rem', color:'#adb5bd', fontFamily:FONT },
    btnVerTodos:{ width:'100%', padding:'7px', background:'#f8f9fa', border:'1px solid #e9ecef', borderRadius:7, cursor:'pointer', fontSize:'0.74rem', fontWeight:'600', color:'var(--color-espoch-rojo)', marginTop:4, fontFamily:FONT },

    /* Banner */
    banner:      { backgroundColor:'white', borderRadius:9, border:'1px solid #e8eaed', overflow:'hidden', boxShadow:'0 1px 5px rgba(0,0,0,0.05)' },
    bannerStripe:{ height:5, background:'linear-gradient(90deg,var(--color-espoch-rojo) 0%,#1565c0 100%)' },
    bannerBody:  { padding:'14px 16px 16px' },
    bannerTit:   { margin:'0 0 5px', fontSize:'0.86rem', fontWeight:'700', color:'#1a1a2e', fontFamily:FONT },
    bannerSub:   { margin:'0 0 12px', fontSize:'0.74rem', color:'#6c757d', lineHeight:1.58, fontFamily:FONT },
    bannerBtn:   { display:'block', textAlign:'center', padding:'8px', backgroundColor:'var(--color-espoch-rojo)', color:'white', borderRadius:7, fontSize:'0.76rem', fontWeight:'700', textDecoration:'none', fontFamily:FONT },

    /* Modal */
    overlay:    { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16, backdropFilter:'blur(4px)' },
    modalBox:   { backgroundColor:'white', borderRadius:14, width:'100%', maxWidth:660, maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.28)', overflow:'hidden' },
    modalImgTit:{ margin:'0 0 4px', fontSize:'1.1rem', fontWeight:'800', color:'white', lineHeight:1.3, textShadow:'0 1px 6px rgba(0,0,0,0.5)', fontFamily:FONT },
    modalClose: { position:'absolute', top:10, right:10, width:30, height:30, borderRadius:'50%', background:'rgba(0,0,0,0.42)', border:'none', cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center' },
    modalBody:  { flex:1, overflowY:'auto', padding:'16px 22px' },
    evInfoBox:  { background:'#f8f9fa', border:'1px solid #e9ecef', borderRadius:8, padding:'11px 14px', marginBottom:14 },
    modalResBox:{ background:'#f8f9fa', borderLeft:'4px solid var(--color-espoch-rojo)', borderRadius:'0 6px 6px 0', padding:'10px 14px', marginBottom:14 },
    modalRes:   { margin:0, fontSize:'0.84rem', color:'#495057', lineHeight:1.7, fontStyle:'italic', fontFamily:FONT },
    modalP:     { margin:'0 0 12px', fontSize:'0.85rem', color:'#2c3e50', lineHeight:1.72, fontFamily:FONT },
    modalFoot:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 22px', borderTop:'1px solid #e9ecef', background:'#f8f9fa', flexShrink:0 },
    btnCerrar:  { padding:'6px 16px', background:'transparent', border:'1px solid #dee2e6', borderRadius:7, cursor:'pointer', fontSize:'0.78rem', fontWeight:'600', color:'#6c757d', fontFamily:FONT },
};

export default Noticias;
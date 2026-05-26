// frontend/src/pages/PerfilPublico.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserCircle, FaGithub, FaLinkedin, FaCode, FaBriefcase,
    FaCertificate, FaGraduationCap, FaMapMarkerAlt, FaLink,
    FaCalendarAlt, FaExternalLinkAlt, FaSpinner,
    FaTimes, FaCheckCircle, FaExclamationTriangle, FaArrowLeft,
    FaHandshake, FaChartBar, FaImage, FaShieldAlt, FaMedal,
    FaGlobe, FaLock, FaBell, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';

const API_URL = 'http://localhost:4000/api';
const urlMedia = (ruta) => ruta ? `http://localhost:4000/${ruta}` : null;
const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";

const DISP = {
    disponible: { bg: '#dcfce7', color: '#15803d', border: '#86efac', dot: '#22c55e', label: 'Disponible' },
    no_disponible: { bg: '#fef9c3', color: '#a16207', border: '#fde047', dot: '#eab308', label: 'No disponible' },
};

const nivelAfinidad = (pct) => {
    if (pct >= 60) return { label: 'Experto', color: '#be1e2d', bg: '#fff1f2', bar: 'linear-gradient(90deg,#be1e2d,#f43f5e)' };
    if (pct >= 35) return { label: 'Avanzado', color: '#d97706', bg: '#fffbeb', bar: 'linear-gradient(90deg,#d97706,#fbbf24)' };
    return { label: 'Intermedio', color: '#2563eb', bg: '#eff6ff', bar: 'linear-gradient(90deg,#2563eb,#60a5fa)' };
};

const ImgProtegida = ({ src, alt, style = {} }) => (
    <img src={src} alt={alt}
        style={{ ...style, userSelect: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
        draggable={false}
    />
);

// ══════════════════════════════════════════════
// CARRUSEL — 2 items por página, sin bugs de timer
// ══════════════════════════════════════════════
const ITEMS_POR_PAGINA = 2;

const Carrusel = ({ items, renderItem, titulo, icono: Icono, vacio, autoMs = 5000 }) => {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / ITEMS_POR_PAGINA));

    const [page, setPage] = useState(0);
    const [dir, setDir] = useState(''); // 'left' | 'right' | ''
    const [key, setKey] = useState(0); // fuerza re-render del slide

    const timerRef = useRef(null);
    const pausedRef = useRef(false);
    const pageRef = useRef(page);
    pageRef.current = page;

    // ── navegar a una página concreta ──
    const goTo = useCallback((nextPage, direction) => {
        if (pages <= 1 || nextPage === pageRef.current) return;
        setDir(direction);
        setPage(nextPage);
        setKey(k => k + 1);
    }, [pages]);

    // ── auto-avance estable: usa ref para no recrear el interval ──
    useEffect(() => {
        if (pages <= 1) return;
        timerRef.current = setInterval(() => {
            if (!pausedRef.current) {
                const next = (pageRef.current + 1) % pages;
                setDir('left');
                setPage(next);
                setKey(k => k + 1);
            }
        }, autoMs);
        return () => clearInterval(timerRef.current);
    }, [pages, autoMs]); // solo depende de pages y autoMs, NO de page

    const pausar = () => { pausedRef.current = true; };
    const reanudar = () => { pausedRef.current = false; };

    const prev = () => goTo((page - 1 + pages) % pages, 'right');
    const next = () => goTo((page + 1) % pages, 'left');

    const slice = items.slice(page * ITEMS_POR_PAGINA, page * ITEMS_POR_PAGINA + ITEMS_POR_PAGINA);

    return (
        <div style={cr.wrap}>
            {/* Cabecera */}
            <div style={cr.header}>
                <p style={{ ...cr.titulo, fontFamily: FONT }}>
                    {Icono && <Icono style={cr.ico} />}
                    {titulo}
                    {total > 0 && <span style={{ ...cr.countBadge, fontFamily: FONT }}>{total}</span>}
                </p>
                {pages > 1 && (
                    <div style={cr.controles}>
                        <button style={cr.btnNav} onClick={prev} title="Anterior">
                            <FaChevronLeft size={9} />
                        </button>
                        <span style={{ ...cr.paginador, fontFamily: FONT }}>{page + 1} / {pages}</span>
                        <button style={cr.btnNav} onClick={next} title="Siguiente">
                            <FaChevronRight size={9} />
                        </button>
                    </div>
                )}
            </div>

            {total === 0 ? (
                <div style={cr.vacio}>{vacio}</div>
            ) : (
                <div onMouseEnter={pausar} onMouseLeave={reanudar}>
                    {/* Slide — key fuerza re-mount para limpiar animación */}
                    <div
                        key={key}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${ITEMS_POR_PAGINA}, 1fr)`,
                            gap: 10,
                            animation: dir === 'left' ? 'crLeft  0.25s ease both'
                                : dir === 'right' ? 'crRight 0.25s ease both'
                                    : 'none',
                        }}
                    >
                        {slice.map((item, i) => (
                            <div key={`${page}-${i}`}>{renderItem(item)}</div>
                        ))}
                        {/* Celda fantasma si página impar */}
                        {slice.length < ITEMS_POR_PAGINA && (
                            <div style={cr.ghost} />
                        )}
                    </div>

                    {/* Dots */}
                    {pages > 1 && (
                        <div style={cr.dots}>
                            {Array.from({ length: pages }).map((_, i) => (
                                <button
                                    key={i}
                                    style={{
                                        ...cr.dot,
                                        backgroundColor: i === page ? '#be1e2d' : '#e2e8f0',
                                        width: i === page ? 16 : 6,
                                    }}
                                    onClick={() => goTo(i, i > page ? 'left' : 'right')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════
// MODAL NOTIFICAR
// ══════════════════════════════════════════════
const ModalNotificar = ({ graduado, onCerrar }) => {
    const [form, setForm] = useState({ nombre: '', email: '', empresa: '', mensaje: '' });
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onCerrar(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onCerrar]);

    const cambiar = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const enviar = async () => {
        if (!form.nombre || !form.email || !form.mensaje) {
            setError('Completa los campos obligatorios.'); return;
        }
        setEnviando(true); setError('');
        try {
            await axios.post(`${API_URL}/publico/notificar`, { graduadoId: graduado._id, ...form });
            setExito(true);
        } catch (err) {
            setError(
                err.response?.status === 429
                    ? err.response.data.msg
                    : (err.response?.data?.msg || 'Error al enviar. Intenta nuevamente.')
            );
        } finally { setEnviando(false); }
    };

    return (
        <div style={mc.overlay} onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}>
            <div style={mc.modal}>
                <div style={mc.banda} />
                <div style={mc.head}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={mc.bellWrap}><FaBell style={{ color: '#be1e2d', fontSize: '0.85rem' }} /></div>
                        <div>
                            <h2 style={{ ...mc.titulo, fontFamily: FONT }}>Notificar a {graduado.nombres}</h2>
                            <p style={{ ...mc.sub, fontFamily: FONT }}>Tu mensaje llegará directamente al graduado.</p>
                        </div>
                    </div>
                    <button style={mc.btnX} onClick={onCerrar}><FaTimes size={11} /></button>
                </div>
                {exito ? (
                    <div style={mc.exitoWrap}>
                        <div style={mc.exitoCircle}><FaCheckCircle style={{ color: '#16a34a', fontSize: '1.8rem' }} /></div>
                        <h3 style={{ ...mc.exitoH, fontFamily: FONT }}>¡Notificación enviada!</h3>
                        <p style={{ ...mc.exitoP, fontFamily: FONT }}>
                            El graduado recibirá tu mensaje. Si está interesado, se pondrá en contacto contigo.
                        </p>
                        <button style={{ ...mc.btnEnviar, fontFamily: FONT }} onClick={onCerrar}>Cerrar</button>
                    </div>
                ) : (
                    <div style={mc.body}>
                        <div style={mc.chip}>
                            <div style={mc.chipFotoWrap}>
                                {graduado.fotoPerfil
                                    ? <ImgProtegida src={urlMedia(graduado.fotoPerfil)} alt="" style={mc.chipFoto} />
                                    : <FaUserCircle style={{ fontSize: '1.6rem', color: '#94a3b8' }} />
                                }
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ ...mc.chipNombre, fontFamily: FONT }}>{graduado.nombres} {graduado.apellidos}</p>
                                <p style={{ ...mc.chipSub2, fontFamily: FONT }}>Ing. en Software · ESPOCH</p>
                            </div>
                            <div style={{ ...mc.chipBadge, fontFamily: FONT }}>
                                <FaShieldAlt style={{ fontSize: '0.5rem', marginRight: 3 }} />Verificado
                            </div>
                        </div>
                        {error && (
                            <div style={{ ...mc.alerta, fontFamily: FONT }}>
                                <FaExclamationTriangle style={{ marginRight: 6, flexShrink: 0 }} />{error}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[
                                { name: 'nombre', label: 'Tu nombre *', placeholder: 'Ej: Juan Pérez', type: 'text' },
                                { name: 'email', label: 'Correo electrónico *', placeholder: 'tu@correo.com', type: 'email' },
                            ].map(f => (
                                <div key={f.name} style={mc.campo}>
                                    <label style={{ ...mc.lbl, fontFamily: FONT }}>{f.label}</label>
                                    <input type={f.type} name={f.name} value={form[f.name]} onChange={cambiar}
                                        placeholder={f.placeholder} style={{ ...mc.inp, fontFamily: FONT }} />
                                </div>
                            ))}
                        </div>
                        <div style={mc.campo}>
                            <label style={{ ...mc.lbl, fontFamily: FONT }}>Empresa u organización (opcional)</label>
                            <input name="empresa" value={form.empresa} onChange={cambiar}
                                placeholder="Ej: Mi Empresa S.A." style={{ ...mc.inp, fontFamily: FONT }} />
                        </div>
                        <div style={mc.campo}>
                            <label style={{ ...mc.lbl, fontFamily: FONT }}>¿Por qué te interesa este perfil? *</label>
                            <textarea name="mensaje" value={form.mensaje} onChange={cambiar}
                                placeholder="Cuéntanos sobre el proyecto o vacante..."
                                style={{ ...mc.inp, minHeight: 72, resize: 'vertical', fontFamily: FONT }} />
                        </div>
                        <div style={mc.avisoInfo}>
                            <FaBell style={{ color: '#be1e2d', flexShrink: 0, marginTop: 1, fontSize: '0.68rem' }} />
                            <span style={{ fontFamily: FONT }}>
                                Tu solicitud va <strong>directamente al graduado</strong>. Tus datos no son compartidos sin su consentimiento.
                            </span>
                        </div>
                        <div style={mc.footer}>
                            <button style={{ ...mc.btnCancelar, fontFamily: FONT }} onClick={onCerrar}>Cancelar</button>
                            <button style={{ ...mc.btnEnviar, fontFamily: FONT }} onClick={enviar} disabled={enviando}>
                                {enviando
                                    ? <><FaSpinner style={{ marginRight: 6, animation: 'spin 1s linear infinite' }} />Enviando...</>
                                    : <><FaBell style={{ marginRight: 6 }} />Enviar notificación</>
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// MODAL PROYECTO
// ══════════════════════════════════════════════
const ModalProyecto = ({ proyecto, onCerrar }) => {
    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onCerrar(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onCerrar]);

    return (
        <div style={md.overlay} onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}>
            <div style={md.modal}>
                {proyecto.imagen ? (
                    <div style={md.imgHeader}>
                        <ImgProtegida src={urlMedia(proyecto.imagen)} alt={proyecto.titulo} style={md.imgHero} />
                        <div style={md.imgOverlay} />
                        <div style={md.imgHeaderContent}>
                            <h2 style={{ ...md.imgTitulo, fontFamily: FONT }}>{proyecto.titulo}</h2>
                        </div>
                        <button style={md.btnClose} onClick={onCerrar}><FaTimes size={11} /></button>
                        <div style={md.imgProtWrap}>
                            <FaLock style={{ fontSize: '0.5rem', marginRight: 3 }} />
                            <span style={{ fontFamily: FONT, fontSize: '0.56rem' }}>Imagen protegida</span>
                        </div>
                    </div>
                ) : (
                    <div style={md.headerSin}>
                        <div style={md.headerBanda} />
                        <div style={md.headerInner}>
                            <h2 style={{ ...md.headerTitulo, fontFamily: FONT }}>{proyecto.titulo}</h2>
                            <button style={md.btnCloseFlat} onClick={onCerrar}><FaTimes size={11} /></button>
                        </div>
                    </div>
                )}
                <div style={md.body}>
                    <div style={md.seccion}>
                        <h3 style={{ ...md.secTitulo, fontFamily: FONT }}>Descripción</h3>
                        <p style={{ ...md.texto, fontFamily: FONT }}>{proyecto.descripcion}</p>
                    </div>
                    {proyecto.tecnologias?.length > 0 && (
                        <div style={md.seccion}>
                            <h3 style={{ ...md.secTitulo, fontFamily: FONT }}>Tecnologías</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {proyecto.tecnologias.map((t, i) => (
                                    <span key={i} style={{ ...md.tagTec, fontFamily: FONT }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={md.metaGrid}>
                        {proyecto.fechaRealizacion && (
                            <div style={md.metaItem}>
                                <span style={{ ...md.metaLabel, fontFamily: FONT }}>Año</span>
                                <span style={{ ...md.metaVal, fontFamily: FONT }}>
                                    <FaCalendarAlt style={{ marginRight: 4, color: '#be1e2d' }} />
                                    {new Date(proyecto.fechaRealizacion).getFullYear()}
                                </span>
                            </div>
                        )}
                    </div>
                    {(proyecto.urlRepositorio || proyecto.urlDemo) && (
                        <div style={md.linksRow}>
                            {proyecto.urlRepositorio && (
                                <a href={proyecto.urlRepositorio} target="_blank" rel="noopener noreferrer"
                                    style={{ ...md.linkBtn, fontFamily: FONT }}>
                                    <FaLink style={{ marginRight: 5 }} />Ver repositorio
                                </a>
                            )}
                            {proyecto.urlDemo && (
                                <a href={proyecto.urlDemo} target="_blank" rel="noopener noreferrer"
                                    style={{ ...md.linkBtnGreen, fontFamily: FONT }}>
                                    <FaGlobe style={{ marginRight: 5 }} />Ver demo
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// MODAL CERTIFICADO
// ══════════════════════════════════════════════
const ModalCertificado = ({ cert, onCerrar }) => {
    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onCerrar(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onCerrar]);

    return (
        <div style={md.overlay} onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}>
            <div style={md.modal}>
                <div style={md.headerSin}>
                    <div style={md.headerBanda} />
                    <div style={md.headerInner}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={md.medalWrap}>
                                <FaMedal style={{ color: '#be1e2d', fontSize: '0.85rem' }} />
                            </div>
                            <div>
                                <h2 style={{ ...md.headerTitulo, fontFamily: FONT }}>{cert.titulo}</h2>
                                {cert.institucion && <p style={{ ...md.subInst, fontFamily: FONT }}>{cert.institucion}</p>}
                            </div>
                        </div>
                        <button style={md.btnCloseFlat} onClick={onCerrar}><FaTimes size={11} /></button>
                    </div>
                </div>
                <div style={md.body}>
                    {cert.archivo && cert.tipoArchivo === 'imagen' && (
                        <div style={md.certImgContainer}>
                            <ImgProtegida src={urlMedia(cert.archivo)} alt={cert.titulo} style={md.certImgGrande} />
                            <div style={md.certProtBadge}>
                                <FaLock style={{ fontSize: '0.5rem', marginRight: 4 }} />
                                <span style={{ fontFamily: FONT }}>Imagen protegida · No descargable</span>
                            </div>
                        </div>
                    )}
                    {cert.descripcion && (
                        <div style={md.seccion}>
                            <h3 style={{ ...md.secTitulo, fontFamily: FONT }}>Descripción</h3>
                            <p style={{ ...md.texto, fontFamily: FONT }}>{cert.descripcion}</p>
                        </div>
                    )}
                    <div style={md.metaGrid}>
                        {cert.fechaFinalizacion && (
                            <div style={md.metaItem}>
                                <span style={{ ...md.metaLabel, fontFamily: FONT }}>Fecha</span>
                                <span style={{ ...md.metaVal, fontFamily: FONT }}>
                                    <FaCalendarAlt style={{ marginRight: 4, color: '#be1e2d' }} />
                                    {new Date(cert.fechaFinalizacion).toLocaleDateString('es-EC', { year: 'numeric', month: 'long' })}
                                </span>
                            </div>
                        )}
                        {cert.institucion && (
                            <div style={md.metaItem}>
                                <span style={{ ...md.metaLabel, fontFamily: FONT }}>Institución</span>
                                <span style={{ ...md.metaVal, fontFamily: FONT }}>{cert.institucion}</span>
                            </div>
                        )}
                    </div>
                    {cert.url && (
                        <div style={md.linksRow}>
                            <a href={cert.url} target="_blank" rel="noopener noreferrer"
                                style={{ ...md.linkBtn, fontFamily: FONT }}>
                                <FaExternalLinkAlt style={{ marginRight: 5 }} />Verificar certificado
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════
const PerfilPublico = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error404, setError404] = useState(false);
    const [modalNotif, setModalNotif] = useState(false);
    const [modalProy, setModalProy] = useState(null);
    const [modalCert, setModalCert] = useState(null);

    useEffect(() => {
        const bloquear = (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); };
        document.addEventListener('contextmenu', bloquear);
        return () => document.removeEventListener('contextmenu', bloquear);
    }, []);

    useEffect(() => {
        document.title = 'Perfil · ESPOCH Software';
        window.scrollTo(0, 0);
        axios.get(`${API_URL}/publico/graduado/${id}`)
            .then(({ data }) => {
                setDatos(data);
                document.title = `${data.graduado.nombres} ${data.graduado.apellidos} · ESPOCH`;
            })
            .catch(err => { if (err.response?.status === 404) setError404(true); })
            .finally(() => setCargando(false));
    }, [id]);

    if (cargando) return (
        <div style={s.centrado}>
            <div style={s.spinner} />
            <p style={{ marginTop: 12, color: '#64748b', fontFamily: FONT, fontSize: '0.75rem' }}>Cargando perfil...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error404 || !datos) return (
        <div style={s.centrado}>
            <div style={s.notFoundBox}>
                <FaGraduationCap style={{ fontSize: '1.6rem', color: '#cbd5e1' }} />
            </div>
            <p style={{ fontWeight: 700, color: '#0f172a', fontFamily: FONT, marginBottom: 3, fontSize: '0.85rem' }}>Perfil no encontrado</p>
            <p style={{ color: '#94a3b8', fontSize: '0.72rem', fontFamily: FONT, marginBottom: 14 }}>Este perfil no existe o no está disponible.</p>
            <button style={{ ...s.btnVolver, fontFamily: FONT }} onClick={() => navigate('/')}>
                <FaArrowLeft style={{ marginRight: 5 }} />Volver al inicio
            </button>
        </div>
    );

    const { graduado, proyectos, certificados, tesis } = datos;
    const disp = DISP[graduado.disponibilidad] || DISP['no_disponible'];

    // Año de graduación: campo directo del modelo (agregado al select del backend)
    // Fallback a fechaPublicacion de tesis si el campo aún no existe en el response
    const anioGrad = graduado.anioGraduacion
        || (tesis?.fechaPublicacion ? new Date(tesis.fechaPublicacion).getUTCFullYear() : null);

    // ── render slide proyecto ──
    const renderProy = (proy) => (
        <div style={s.slideCard} className="slide-card" onClick={() => setModalProy(proy)}>
            {proy.imagen ? (
                <div style={s.slideImgWrap}>
                    <ImgProtegida src={urlMedia(proy.imagen)} alt={proy.titulo} style={s.slideImg} />
                    <div className="slide-overlay" style={s.slideOverlay}>
                        <span style={{ ...s.overlayTxt, fontFamily: FONT }}>Ver detalle</span>
                    </div>
                </div>
            ) : (
                <div style={{ ...s.slideImgWrap, ...s.slideNoImg }}>
                    <FaImage style={{ fontSize: '1.4rem', color: '#e2e8f0' }} />
                    <div className="slide-overlay" style={s.slideOverlay}>
                        <span style={{ ...s.overlayTxt, fontFamily: FONT }}>Ver detalle</span>
                    </div>
                </div>
            )}
            <div style={s.slideBody}>
                <p style={{ ...s.slideTitulo, fontFamily: FONT }}>{proy.titulo}</p>
                <p style={{ ...s.slideDesc, fontFamily: FONT }}>{proy.descripcion}</p>
                {proy.tecnologias?.length > 0 && (
                    <div style={{ ...s.tagsWrap, marginTop: 6 }}>
                        {proy.tecnologias.slice(0, 3).map((t, j) => (
                            <span key={j} style={{ ...s.tagTecSm, fontFamily: FONT }}>{t}</span>
                        ))}
                        {proy.tecnologias.length > 3 && (
                            <span style={{ ...s.tagMas, fontFamily: FONT }}>+{proy.tecnologias.length - 3}</span>
                        )}
                    </div>
                )}
                <div style={s.slideMeta}>
                    {proy.fechaRealizacion && (
                        <span style={{ ...s.metaTxt, fontFamily: FONT }}>
                            <FaCalendarAlt style={{ marginRight: 3 }} />
                            {new Date(proy.fechaRealizacion).getFullYear()}
                        </span>
                    )}
                    {proy.urlRepositorio && (
                        <a href={proy.urlRepositorio} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ ...s.metaLink, fontFamily: FONT }}>
                            <FaLink style={{ marginRight: 3 }} />Repo
                        </a>
                    )}
                    <span style={{ ...s.verMas, marginLeft: 'auto', fontFamily: FONT }}>Ver más →</span>
                </div>
            </div>
        </div>
    );

    // ── render slide certificado ──
    const renderCert = (cert) => (
        <div style={s.slideCard} className="slide-card" onClick={() => setModalCert(cert)}>
            {cert.archivo && cert.tipoArchivo === 'imagen' ? (
                <div style={s.slideImgWrap}>
                    <ImgProtegida src={urlMedia(cert.archivo)} alt={cert.titulo} style={s.slideImg} />
                    <div className="slide-overlay" style={s.slideOverlay}>
                        <span style={{ ...s.overlayTxt, fontFamily: FONT }}>Ver certificado</span>
                    </div>
                </div>
            ) : (
                <div style={{ ...s.slideImgWrap, ...s.slideNoImg, backgroundColor: '#fffbeb' }}>
                    <FaMedal style={{ fontSize: '1.8rem', color: '#fcd34d' }} />
                    <div className="slide-overlay" style={s.slideOverlay}>
                        <span style={{ ...s.overlayTxt, fontFamily: FONT }}>Ver certificado</span>
                    </div>
                </div>
            )}
            <div style={s.slideBody}>
                <p style={{ ...s.slideTitulo, fontFamily: FONT }}>{cert.titulo}</p>
                {cert.institucion && (
                    <p style={{ ...s.certInstSlide, fontFamily: FONT }}>{cert.institucion}</p>
                )}
                <div style={s.slideMeta}>
                    {cert.fechaFinalizacion && (
                        <span style={{ ...s.metaTxt, fontFamily: FONT }}>
                            <FaCalendarAlt style={{ marginRight: 3 }} />
                            {new Date(cert.fechaFinalizacion).toLocaleDateString('es-EC', { year: 'numeric', month: 'short' })}
                        </span>
                    )}
                    <span style={{ ...s.verMas, marginLeft: 'auto', fontFamily: FONT }}>Ver más →</span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
                @keyframes shimmer { from { background-position:-200% center; } to { background-position:200% center; } }
                @keyframes crLeft  { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }
                @keyframes crRight { from { opacity:0; transform:translateX(-32px); } to { opacity:1; transform:translateX(0); } }
                .btn-notif:hover  { transform:translateY(-1px); box-shadow:0 5px 16px rgba(190,30,45,0.38) !important; }
                .btn-volver:hover { background-color:#f1f5f9 !important; }
                .red-link:hover   { background-color:#f1f5f9 !important; }
                .slide-card:hover .slide-overlay { opacity:1 !important; }
                img { -webkit-touch-callout:none; }
                * { box-sizing:border-box; }
            `}</style>

            {/* NAVBAR */}
            <div style={s.navBar}>
                <div style={s.navInner}>
                    <button className="btn-volver" style={{ ...s.btnVolver, fontFamily: FONT }} onClick={() => navigate(-1)}>
                        <FaArrowLeft style={{ marginRight: 4 }} />Volver
                    </button>
                    <div style={s.navLogo}>
                        <span style={{ color: '#be1e2d', fontWeight: 800, fontSize: '0.78rem', fontFamily: FONT }}>ESPOCH</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontFamily: FONT }}> · Perfiles de Software</span>
                    </div>
                </div>
            </div>

            <div style={s.page}>
                <div style={s.grid3}>

                    {/* ══ COLUMNA IZQUIERDA ══ */}
                    <div style={s.colLeft}>
                        <div style={s.cardIdentidad}>
                            <div style={s.cardBanda} />
                            <div style={s.identidadInner}>

                                {/* Foto */}
                                <div style={s.fotoWrap}>
                                    {graduado.fotoPerfil
                                        ? <ImgProtegida src={urlMedia(graduado.fotoPerfil)} alt={graduado.nombres} style={s.fotoImg} />
                                        : <div style={s.fotoFallback}><FaUserCircle style={{ fontSize: 52, color: '#cbd5e1' }} /></div>
                                    }
                                </div>

                                {/* Nombre */}
                                <h1 style={{ ...s.nombre, fontFamily: FONT }}>
                                    {graduado.nombres} {graduado.apellidos}
                                </h1>
                                <p style={{ ...s.cargoTxt, fontFamily: FONT }}>Ingeniería en Software · ESPOCH</p>

                                {/* Badges disponibilidad */}
                                <div style={s.badgesStack}>
                                    <span style={{ ...s.badgeEspoch, fontFamily: FONT }}>
                                        <FaGraduationCap style={{ fontSize: '0.55rem', marginRight: 4 }} />ESPOCH Verificado
                                    </span>
                                    <span style={{ ...s.badgeDisp, backgroundColor: disp.bg, color: disp.color, border: `1px solid ${disp.border}`, fontFamily: FONT }}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: disp.dot, display: 'inline-block', marginRight: 4 }} />
                                        {disp.label}
                                    </span>
                                </div>

                                {/* Año de promoción — badge limpio sin label */}
                                <div style={s.metaFila}>
                                    {anioGrad && (
                                        <div style={{ ...s.metaChip, fontFamily: FONT }}>
                                            <FaGraduationCap style={{ fontSize: '0.62rem', color: '#be1e2d', marginRight: 5 }} />
                                            <span style={s.metaChipTxt}>Promoción {anioGrad}</span>
                                        </div>
                                    )}
                                    {graduado.ciudad && (
                                        <div style={{ ...s.metaChip, fontFamily: FONT }}>
                                            <FaMapMarkerAlt style={{ fontSize: '0.6rem', color: '#64748b', marginRight: 5 }} />
                                            <span style={s.metaChipTxt}>{graduado.ciudad}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Botón único */}
                                <button className="btn-notif" style={{ ...s.btnNotif, fontFamily: FONT }} onClick={() => setModalNotif(true)}>
                                    <FaBell style={{ marginRight: 6 }} />Contactar
                                </button>

                                {/* Redes */}
                                {(graduado.github || graduado.linkedin) && (
                                    <div style={s.redesRow}>
                                        {graduado.github && (
                                            <a href={graduado.github} target="_blank" rel="noopener noreferrer"
                                                className="red-link" style={{ ...s.redLink, fontFamily: FONT }}>
                                                <FaGithub style={{ marginRight: 4, fontSize: '0.72rem' }} />GitHub
                                            </a>
                                        )}
                                        {graduado.linkedin && (
                                            <a href={graduado.linkedin} target="_blank" rel="noopener noreferrer"
                                                className="red-link" style={{ ...s.redLink, color: '#0a66c2', fontFamily: FONT }}>
                                                <FaLinkedin style={{ marginRight: 4, fontSize: '0.72rem' }} />LinkedIn
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sobre mí */}
                        {graduado.bio && (
                            <div style={s.card}>
                                <p style={{ ...s.secTit, fontFamily: FONT }}>
                                    <FaUserCircle style={s.secIco} />Sobre Mí
                                </p>
                                <p style={{ ...s.bioTxt, fontFamily: FONT }}>{graduado.bio}</p>
                            </div>
                        )}
                    </div>

                    {/* ══ COLUMNA CENTRAL: tecn + habilidades + proyectos + certs ══ */}
                    <div style={s.colMid}>

                        {/* Fila superior: Tecnologías | Habilidades Blandas */}
                        {(graduado.tecnologias?.length > 0 || graduado.habilidadesBlandas?.length > 0) && (
                            <div style={s.filaDoble}>
                                {graduado.tecnologias?.length > 0 && (
                                    <div style={{ ...s.card, flex: 1, minWidth: 0 }}>
                                        <p style={{ ...s.secTit, fontFamily: FONT }}>
                                            <FaCode style={s.secIco} />Tecnologías Core
                                        </p>
                                        <div style={s.tagsWrap}>
                                            {graduado.tecnologias.map((t, i) => (
                                                <span key={i} style={{ ...s.tagTec, fontFamily: FONT }}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {graduado.habilidadesBlandas?.length > 0 && (
                                    <div style={{ ...s.card, flex: 1, minWidth: 0 }}>
                                        <p style={{ ...s.secTit, fontFamily: FONT }}>
                                            <FaHandshake style={s.secIco} />Habilidades Blandas
                                        </p>
                                        <div style={s.tagsWrap}>
                                            {graduado.habilidadesBlandas.map((h, i) => (
                                                <span key={i} style={{ ...s.tagBlanda, fontFamily: FONT }}>{h}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Carrusel Proyectos */}
                        <div style={s.card}>
                            <Carrusel
                                items={proyectos}
                                renderItem={renderProy}
                                titulo="Proyectos"
                                icono={FaBriefcase}
                                autoMs={5000}
                                vacio={
                                    <div style={s.emptyBox}>
                                        <FaBriefcase style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: 6 }} />
                                        <p style={{ ...s.emptyTxt, fontFamily: FONT }}>Sin proyectos publicados aún</p>
                                    </div>
                                }
                            />
                        </div>

                        {/* Carrusel Certificados */}
                        <div style={s.card}>
                            <Carrusel
                                items={certificados}
                                renderItem={renderCert}
                                titulo="Certificaciones"
                                icono={FaCertificate}
                                autoMs={5000}
                                vacio={
                                    <div style={s.emptyBox}>
                                        <FaCertificate style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: 6 }} />
                                        <p style={{ ...s.emptyTxt, fontFamily: FONT }}>Sin certificados publicados aún</p>
                                    </div>
                                }
                            />
                        </div>
                    </div>

                    {/* ══ COLUMNA DERECHA: Especialidades + Tesis ══ */}
                    <div style={s.colRight}>

                        {/* Especialidades */}
                        {graduado.afinidades?.length > 0 && (
                            <div style={s.card}>
                                <p style={{ ...s.secTit, fontFamily: FONT }}>
                                    <FaChartBar style={s.secIco} />Especialidades
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {graduado.afinidades.map((af, i) => {
                                        const nv = nivelAfinidad(af.porcentaje);
                                        return (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                                                        <span style={{ ...s.afNombre, fontFamily: FONT }}>{af.categoria}</span>
                                                        <span style={{ ...s.afBadge, color: nv.color, backgroundColor: nv.bg, fontFamily: FONT }}>{nv.label}</span>
                                                    </div>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: nv.color, fontFamily: FONT, flexShrink: 0, marginLeft: 6 }}>{af.porcentaje}%</span>
                                                </div>
                                                <div style={{ height: 5, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', borderRadius: 10, width: `${af.porcentaje}%`, background: nv.bar, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tesis de grado — debajo de especialidades */}
                        {tesis && (
                            <div style={{ ...s.card, borderLeft: '3px solid #be1e2d' }}>
                                <p style={{ ...s.secTit, fontFamily: FONT }}>
                                    <FaGraduationCap style={s.secIco} />Tesis de Grado
                                </p>
                                <p style={{ ...s.tesisTitulo, fontFamily: FONT }}>
                                    {tesis.tituloEncontrado || tesis.titulo}
                                </p>
                                {tesis.autoresEncontrados?.length > 0 && (
                                    <p style={{ ...s.tesisAutor, fontFamily: FONT }}>
                                        {tesis.autoresEncontrados.join(', ')}
                                    </p>
                                )}
                                {tesis.resumen && (
                                    <p style={{ ...s.tesisResumen, fontFamily: FONT }}>{tesis.resumen}</p>
                                )}
                                {tesis.urlDspace && (
                                    <a href={tesis.urlDspace} target="_blank" rel="noopener noreferrer"
                                        style={{ ...s.tesisLink, fontFamily: FONT }}>
                                        <FaExternalLinkAlt style={{ marginRight: 4, fontSize: '0.58rem' }} />
                                        Ver en repositorio ESPOCH
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalProy && <ModalProyecto proyecto={modalProy} onCerrar={() => setModalProy(null)} />}
            {modalCert && <ModalCertificado cert={modalCert} onCerrar={() => setModalCert(null)} />}
            {modalNotif && <ModalNotificar graduado={graduado} onCerrar={() => setModalNotif(false)} />}
        </>
    );
};

// ══════════════════════════════════════════════
// ESTILOS PÁGINA
// ══════════════════════════════════════════════
const s = {
    centrado: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' },
    spinner: { width: 32, height: 32, borderRadius: '50%', border: '3px solid #f1f5f9', borderTopColor: '#be1e2d', animation: 'spin 0.8s linear infinite' },
    notFoundBox: { width: 56, height: 56, borderRadius: '50%', backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },

    navBar: { backgroundColor: 'white', borderBottom: '1px solid #e9ecef', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    navInner: { maxWidth: 1160, margin: '0 auto', height: 44, display: 'flex', alignItems: 'center', gap: 10 },
    btnVolver: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: '#475569', transition: 'background-color 0.15s' },
    navLogo: { flex: 1 },

    page: { maxWidth: 1160, margin: '0 auto', padding: '14px 16px 40px' },
    grid3: { display: 'grid', gridTemplateColumns: '220px 1fr 224px', gap: 12, alignItems: 'start' },
    colLeft: { display: 'flex', flexDirection: 'column', gap: 10 },
    colMid: { display: 'flex', flexDirection: 'column', gap: 10 },
    colRight: { display: 'flex', flexDirection: 'column', gap: 10 },

    filaDoble: { display: 'flex', gap: 10, alignItems: 'flex-start' },

    card: { backgroundColor: 'white', borderRadius: 11, padding: '13px 14px', border: '1px solid #e9ecef', boxShadow: '0 1px 5px rgba(0,0,0,0.04)', animation: 'fadeUp 0.35s ease both' },
    cardIdentidad: { backgroundColor: 'white', borderRadius: 11, border: '1px solid #e9ecef', boxShadow: '0 1px 5px rgba(0,0,0,0.04)', overflow: 'hidden', animation: 'fadeUp 0.3s ease both' },
    cardBanda: { height: 3, background: 'linear-gradient(90deg,#be1e2d,#e11d48)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' },
    identidadInner: { padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },

    fotoWrap: { width: 76, height: 76, borderRadius: '50%', border: '2.5px solid #be1e2d', overflow: 'hidden', backgroundColor: '#f8fafc', boxShadow: '0 2px 10px rgba(190,30,45,0.14)', marginBottom: 10 },
    fotoImg: { width: '100%', height: '100%', objectFit: 'cover' },
    fotoFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },

    nombre: { margin: '0 0 2px', fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' },
    cargoTxt: { margin: '0 0 9px', fontSize: '0.68rem', color: '#64748b', fontWeight: 500 },

    badgesStack: { display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 },
    badgeEspoch: { display: 'inline-flex', alignItems: 'center', padding: '2px 7px', backgroundColor: '#fff1f2', color: '#be1e2d', border: '1px solid #fecdd3', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700 },
    badgeDisp: { display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700 },

    // Fila de chips: año + ciudad — al mismo nivel, sin label encima
    metaFila: { display: 'flex', flexDirection: 'column', gap: 5, width: '100%', marginBottom: 12 },
    metaChip: { display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 7, padding: '6px 10px' },
    metaChipTxt: { fontSize: '0.71rem', fontWeight: 600, color: '#0f172a' },

    btnNotif: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', background: 'linear-gradient(135deg,#be1e2d,#9b1623)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700, boxShadow: '0 3px 10px rgba(190,30,45,0.24)', transition: 'transform 0.15s, box-shadow 0.15s', marginBottom: 10 },

    redesRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
    redLink: { display: 'inline-flex', alignItems: 'center', fontSize: '0.68rem', color: '#374151', fontWeight: 600, textDecoration: 'none', padding: '3px 9px', backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', transition: 'background-color 0.15s' },

    secTit: { margin: '0 0 10px', fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 },
    secIco: { color: '#be1e2d', fontSize: '0.68rem', flexShrink: 0 },

    bioTxt: { margin: 0, fontSize: '0.73rem', color: '#374151', lineHeight: 1.65 },
    tesisTitulo: { margin: '0 0 4px', fontSize: '0.73rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.45 },
    tesisAutor: { margin: '0 0 5px', fontSize: '0.63rem', color: '#7c3aed', fontWeight: 600 },
    tesisResumen: { margin: '0 0 7px', fontSize: '0.67rem', color: '#475569', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    tesisLink: { display: 'inline-flex', alignItems: 'center', fontSize: '0.65rem', color: '#7c3aed', fontWeight: 600, textDecoration: 'none' },

    tagsWrap: { display: 'flex', flexWrap: 'wrap', gap: 5 },
    tagTec: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 9px', borderRadius: 20, fontSize: '0.64rem', fontWeight: 600, border: '1px solid #bfdbfe' },
    tagTecSm: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 500, border: '1px solid #bfdbfe' },
    tagBlanda: { backgroundColor: '#faf5ff', color: '#7c3aed', padding: '3px 9px', borderRadius: 20, fontSize: '0.64rem', fontWeight: 600, border: '1px solid #e9d5ff' },
    tagMas: { backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '2px 6px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 500 },

    afNombre: { fontSize: '0.71rem', fontWeight: 600, color: '#0f172a' },
    afBadge: { fontSize: '0.57rem', fontWeight: 700, padding: '1px 5px', borderRadius: 8 },

    slideCard: { border: '1px solid #e9ecef', borderRadius: 10, overflow: 'hidden', backgroundColor: 'white', cursor: 'pointer' },
    slideImgWrap: { position: 'relative', width: '100%', height: 120, overflow: 'hidden', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    slideNoImg: { height: 76 },
    slideImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    slideOverlay: { position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease' },
    overlayTxt: { color: 'white', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(190,30,45,0.88)', padding: '4px 9px', borderRadius: 5 },
    slideBody: { padding: '8px 10px' },
    slideTitulo: { margin: '0 0 3px', fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    slideDesc: { margin: 0, fontSize: '0.66rem', color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    certInstSlide: { margin: '0 0 2px', fontSize: '0.61rem', color: '#7c3aed', fontWeight: 600 },
    slideMeta: { display: 'flex', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px solid #f1f5f9', gap: 6 },
    metaTxt: { display: 'inline-flex', alignItems: 'center', fontSize: '0.61rem', color: '#94a3b8' },
    metaLink: { display: 'inline-flex', alignItems: 'center', fontSize: '0.61rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' },
    verMas: { fontSize: '0.62rem', color: '#be1e2d', fontWeight: 700 },

    emptyBox: { textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    emptyTxt: { margin: 0, fontSize: '0.7rem', color: '#94a3b8' },
};

// ══════════════════════════════════════════════
// ESTILOS CARRUSEL
// ══════════════════════════════════════════════
const cr = {
    wrap: { display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    titulo: { margin: 0, fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 },
    ico: { color: '#be1e2d', fontSize: '0.68rem', flexShrink: 0 },
    countBadge: { marginLeft: 4, backgroundColor: '#f1f5f9', color: '#64748b', padding: '1px 7px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 600 },
    controles: { display: 'flex', alignItems: 'center', gap: 4 },
    btnNav: { width: 24, height: 24, borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'background-color 0.15s', flexShrink: 0 },
    paginador: { fontSize: '0.63rem', color: '#94a3b8', fontWeight: 600, minWidth: 30, textAlign: 'center' },
    dots: { display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 },
    dot: { height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease', flexShrink: 0 },
    vacio: { padding: '8px 0' },
    ghost: { border: '1px dashed #f1f5f9', borderRadius: 10, backgroundColor: '#fafafa', minHeight: 76 },
};

// ══════════════════════════════════════════════
// ESTILOS MODALES
// ══════════════════════════════════════════════
const md = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16, backdropFilter: 'blur(4px)' },
    modal: { backgroundColor: 'white', borderRadius: 13, width: '100%', maxWidth: 510, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 56px rgba(0,0,0,0.26)', overflow: 'hidden', animation: 'fadeUp 0.22s ease both' },
    imgHeader: { position: 'relative', width: '100%', height: 190, flexShrink: 0, overflow: 'hidden', backgroundColor: '#0f172a' },
    imgHero: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.72 },
    imgOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' },
    imgHeaderContent: { position: 'absolute', bottom: 12, left: 16, right: 48 },
    imgTitulo: { margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'white', lineHeight: 1.3 },
    btnClose: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },
    imgProtWrap: { position: 'absolute', top: 8, left: 10, display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.44)', color: 'rgba(255,255,255,0.65)', padding: '2px 7px', borderRadius: 20 },
    headerSin: { backgroundColor: 'white', flexShrink: 0 },
    headerBanda: { height: 3, background: 'linear-gradient(90deg,#be1e2d,#e11d48)' },
    headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 15px 10px' },
    headerTitulo: { margin: '0 0 1px', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' },
    subInst: { margin: 0, fontSize: '0.66rem', color: '#64748b' },
    btnCloseFlat: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0 },
    medalWrap: { width: 30, height: 30, borderRadius: 7, backgroundColor: '#fff1f2', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    body: { flex: 1, overflowY: 'auto', padding: '14px 16px 18px' },
    certImgContainer: { marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #e9ecef', backgroundColor: '#f8fafc' },
    certImgGrande: { width: '100%', maxHeight: 290, objectFit: 'contain', display: 'block' },
    certProtBadge: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: '0.6rem', color: '#94a3b8', gap: 3 },
    seccion: { marginBottom: 12 },
    secTitulo: { margin: '0 0 5px', fontSize: '0.64rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' },
    texto: { margin: 0, fontSize: '0.76rem', color: '#374151', lineHeight: 1.65 },
    metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12, backgroundColor: '#f8fafc', borderRadius: 7, padding: '10px 12px', border: '1px solid #f1f5f9' },
    metaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
    metaLabel: { fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
    metaVal: { fontSize: '0.74rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center' },
    tagTec: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: 20, fontSize: '0.64rem', fontWeight: 600, border: '1px solid #bfdbfe' },
    linksRow: { display: 'flex', gap: 7, flexWrap: 'wrap' },
    linkBtn: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' },
    linkBtnGreen: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' },
};

const mc = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16, backdropFilter: 'blur(4px)' },
    modal: { backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 450, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 18px 52px rgba(0,0,0,0.24)', overflow: 'hidden', animation: 'fadeUp 0.22s ease both' },
    banda: { height: 3, background: 'linear-gradient(90deg,#be1e2d,#e11d48)', flexShrink: 0 },
    head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 15px 10px' },
    bellWrap: { width: 30, height: 30, borderRadius: 7, backgroundColor: '#fff1f2', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    titulo: { margin: '0 0 1px', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' },
    sub: { margin: 0, fontSize: '0.65rem', color: '#64748b', lineHeight: 1.45 },
    btnX: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0 },
    body: { flex: 1, overflowY: 'auto', padding: '10px 15px' },
    exitoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', textAlign: 'center', gap: 5 },
    exitoCircle: { width: 56, height: 56, borderRadius: '50%', backgroundColor: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
    exitoH: { margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' },
    exitoP: { margin: '2px 0 12px', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.55, maxWidth: 260 },
    chip: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 10px', marginBottom: 10 },
    chipFotoWrap: { width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: '2px solid #be1e2d', flexShrink: 0, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    chipFoto: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    chipNombre: { margin: '0 0 1px', fontWeight: 700, fontSize: '0.76rem', color: '#0f172a' },
    chipSub2: { margin: 0, fontSize: '0.62rem', color: '#94a3b8' },
    chipBadge: { marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', backgroundColor: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '2px 6px', borderRadius: 20, fontSize: '0.58rem', fontWeight: 700, whiteSpace: 'nowrap' },
    alerta: { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '6px 9px', borderRadius: 6, fontSize: '0.68rem', marginBottom: 8, display: 'flex', alignItems: 'center' },
    campo: { display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 7 },
    lbl: { fontSize: '0.66rem', fontWeight: 600, color: '#374151' },
    inp: { padding: '6px 9px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.75rem', color: '#0f172a', outline: 'none', backgroundColor: '#f8fafc', transition: 'border-color 0.15s' },
    avisoInfo: { display: 'flex', alignItems: 'flex-start', gap: 7, backgroundColor: '#fff8f0', border: '1px solid #fed7aa', borderRadius: 6, padding: '7px 9px', fontSize: '0.64rem', color: '#64748b', lineHeight: 1.5, marginBottom: 0 },
    footer: { display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '9px 15px', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
    btnCancelar: { padding: '6px 11px', backgroundColor: 'transparent', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: '#64748b' },
    btnEnviar: { padding: '6px 14px', background: 'linear-gradient(135deg,#be1e2d,#9b1623)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center' },
};

export default PerfilPublico;
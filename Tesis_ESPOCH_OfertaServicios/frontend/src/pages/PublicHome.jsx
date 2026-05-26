// frontend/src/pages/PublicHome.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserCircle, FaMapMarkerAlt, FaCode, FaBriefcase,
    FaSearch, FaEnvelope, FaGraduationCap, FaSpinner,
    FaTimes, FaCheckCircle, FaExclamationTriangle,
    FaRocket, FaUsers, FaMicrochip, FaStar, FaEye,
} from 'react-icons/fa';

const API_URL  = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
const urlFoto = (ruta) => {
    if (!ruta) return null;
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
    return `${BASE}/${ruta}`;
};
const FONT     = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

// ══════════════════════════════════════════════
// CONSTELACIÓN ANIMADA (función nueva)
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
        <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
        />
    );
};

// ══════════════════════════════════════════════
// CONTADOR ANIMADO (función nueva)
// ══════════════════════════════════════════════
const Counter = ({ value, label }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
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
            <span style={s.heroStatNum}>{count}</span>
            <span style={s.heroStatLabel}>{label}</span>
        </div>
    );
};

// ══════════════════════════════════════════════
// MODAL CONTACTO (original)
// ══════════════════════════════════════════════
const ModalContacto = ({ graduado, onCerrar }) => {
    const [form,     setForm]     = useState({ nombre: '', email: '', empresa: '', mensaje: '' });
    const [enviando, setEnviando] = useState(false);
    const [exito,    setExito]    = useState(false);
    const [error,    setError]    = useState('');

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleEnviar = async () => {
        if (!form.nombre || !form.email || !form.mensaje) {
            setError('Por favor completa los campos obligatorios.'); return;
        }
        setEnviando(true); setError('');
        try {
            await axios.post(`${API_URL}/contacto`, { graduadoId: graduado._id, ...form });
            setExito(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al enviar. Intenta nuevamente.');
        } finally { setEnviando(false); }
    };

    return (
        <div style={ms.overlay} onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}>
            <div style={ms.modal}>
                <div style={ms.mHeader}>
                    <div>
                        <h2 style={ms.titulo}>Solicitar contacto</h2>
                        <p style={ms.sub}>Tu solicitud irá al administrador, quien se pondrá en contacto contigo.</p>
                    </div>
                    <button style={ms.btnClose} onClick={onCerrar}><FaTimes /></button>
                </div>

                {exito ? (
                    <div style={ms.exitoWrap}>
                        <FaCheckCircle style={{ fontSize: '2.5rem', color: 'var(--estado-exito)', marginBottom: 12 }} />
                        <h3 style={{ margin: '0 0 8px', color: 'var(--color-texto-principal)' }}>¡Solicitud enviada!</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-texto-secundario)', textAlign: 'center' }}>
                            El administrador revisará tu solicitud pronto.
                        </p>
                        <button style={ms.btnPrincipal} onClick={onCerrar}>Cerrar</button>
                    </div>
                ) : (
                    <div style={ms.body}>
                        <div style={ms.chip}>
                            {graduado.fotoPerfil
                                ? <img src={urlFoto(graduado.fotoPerfil)} alt="" style={ms.chipFoto} />
                                : <FaUserCircle style={{ fontSize: '2rem', color: 'var(--color-texto-secundario)' }} />
                            }
                            <div>
                                <p style={ms.chipNombre}>{graduado.nombres} {graduado.apellidos}</p>
                                <p style={ms.chipSub}>{graduado.ciudad}</p>
                            </div>
                        </div>

                        {error && (
                            <div style={ms.alerta}>
                                <FaExclamationTriangle style={{ marginRight: 6 }} />{error}
                            </div>
                        )}

                        {[
                            { name: 'nombre',  label: 'Tu nombre completo *',             type: 'text',  placeholder: 'Ej: Juan Pérez' },
                            { name: 'email',   label: 'Tu correo electrónico *',           type: 'email', placeholder: 'tu@correo.com' },
                            { name: 'empresa', label: 'Empresa u organización (opcional)', type: 'text',  placeholder: 'Ej: Mi Empresa S.A.' },
                        ].map(({ name, label, type, placeholder }) => (
                            <div key={name} style={ms.campo}>
                                <label style={ms.lbl}>{label}</label>
                                <input type={type} name={name} value={form[name]}
                                    onChange={handleChange} placeholder={placeholder} style={ms.inp} />
                            </div>
                        ))}

                        <div style={ms.campo}>
                            <label style={ms.lbl}>¿Por qué te interesa este perfil? *</label>
                            <textarea name="mensaje" value={form.mensaje} onChange={handleChange}
                                placeholder="Cuéntanos sobre el proyecto o vacante..."
                                style={{ ...ms.inp, minHeight: 90, resize: 'vertical' }} />
                        </div>

                        <p style={ms.aviso}>🔒 Tu información solo será vista por el administrador de la carrera.</p>

                        <div style={ms.footerModal}>
                            <button style={ms.btnCancelar} onClick={onCerrar}>Cancelar</button>
                            <button style={ms.btnPrincipal} onClick={handleEnviar} disabled={enviando}>
                                {enviando
                                    ? <><FaSpinner style={{ marginRight: 6, animation: 'spin 1s linear infinite' }} />Enviando...</>
                                    : <><FaEnvelope style={{ marginRight: 6 }} />Enviar solicitud</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// TARJETA GRADUADO (diseño original + funciones nuevas)
// ══════════════════════════════════════════════
const TarjetaGraduado = ({ graduado, onContactar }) => {
    const navigate = useNavigate();
    const [hov, setHov] = useState(false);

    const disp = {
        disponible:    { bg: '#e8f5e9', color: '#1b5e20', border: '#a5d6a7', label: 'Disponible',    dot: '#2e7d32' },
        ocupado:       { bg: '#fff8e1', color: '#e65100', border: '#ffe082', label: 'Ocupado',       dot: '#f57f17' },
        no_disponible: { bg: '#ffebee', color: '#b71c1c', border: '#ffcdd2', label: 'No disponible', dot: '#c62828' },
    }[graduado.disponibilidad] || { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0', label: '—', dot: '#9e9e9e' };

    const irAPerfil = () => navigate(`/perfil/${graduado._id}`);

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                ...ts.card,
                transform: hov ? 'translateY(-4px)' : 'none',
                boxShadow: hov
                    ? '0 12px 32px rgba(0,0,0,0.13)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
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
                    <p style={ts.ciudad}>
                        <FaMapMarkerAlt style={{ marginRight: 4, fontSize: '0.7rem' }} />
                        {graduado.ciudad}
                    </p>
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

            {graduado.tarifaHora > 0 && (
                <p style={ts.tarifa}><strong>${graduado.tarifaHora}</strong>/hora</p>
            )}

            {/* Botones: Ver perfil + Contactar */}
            <div style={ts.footerCard}>
                <button style={ts.btnVerPerfil} onClick={irAPerfil}>
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
    const [graduados,     setGraduados]     = useState([]);
    const [cargando,      setCargando]      = useState(true);
    const [busqueda,      setBusqueda]      = useState('');
    const [filtroDisp,    setFiltroDisp]    = useState('todos');
    const [modalGraduado, setModalGraduado] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        document.title = 'Perfiles Profesionales · Carrera de Software ESPOCH';
        axios.get(`${API_URL}/publico/graduados`)
            .then(({ data }) => setGraduados(data))
            .catch(err => console.error(err))
            .finally(() => setCargando(false));
    }, []);

    const graduadosFiltrados = graduados.filter(g => {
        const t = busqueda.toLowerCase();
        const matchBusqueda = !busqueda ||
            `${g.nombres} ${g.apellidos}`.toLowerCase().includes(t) ||
            g.tecnologias?.some(x => x.toLowerCase().includes(t)) ||
            g.afinidades?.some(a => (a.categoria || a).toLowerCase().includes(t)) ||
            g.ciudad?.toLowerCase().includes(t);

        const matchDisp = filtroDisp === 'todos' ||
            (filtroDisp === 'disponible'    && g.disponibilidad === 'disponible') ||
            (filtroDisp === 'no_disponible' && g.disponibilidad === 'no_disponible');

        return matchBusqueda && matchDisp;
    });

    const totalTecs        = [...new Set(graduados.flatMap(g => g.tecnologias || []))].length;
    const disponibles      = graduados.filter(g => g.disponibilidad === 'disponible').length;
    const conEspecialidades = graduados.filter(g => g.afinidades?.length > 0).length;

    const filtroOpciones = [
        { val: 'todos',         label: 'Todos',       dot: null },
        { val: 'disponible',    label: 'Disponibles', dot: '#2e7d32' },
        { val: 'no_disponible', label: 'Ocupados',    dot: '#f57f17' },
    ];

    return (
        <>
            {/* ════════ HERO ════════ */}
            <header style={s.hero}>
                <div style={s.heroBgImagen} />
                <div style={s.heroBgOverlay} />
                <Constellation />
                <div style={s.heroContent}>
                    <div style={s.heroBadge}>
                        Facultad de Informática y Electrónica · ESPOCH
                    </div>
                    <h1 style={s.heroTitulo}>
                        Encuentra Talento en<br />
                        <span style={s.heroAcento}>Software Politécnico</span>
                    </h1>
                    <p style={s.heroSub}>
                        Conecta con graduados especializados en desarrollo de software,
                        inteligencia artificial, bases de datos, mobile y más.
                    </p>

                    {/* Buscador */}
                    <div style={s.buscadorCard}>
                        <div style={s.buscadorFila}>
                            <FaSearch style={s.buscadorIco} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Busca por tecnología, nombre, especialidad o ciudad..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                style={s.buscadorInput}
                                autoComplete="off"
                            />
                            {busqueda && (
                                <button style={s.buscadorLimpiar} onClick={() => { setBusqueda(''); inputRef.current?.focus(); }}>
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                        <div style={s.sugerencias}>
                            <span style={s.sugLabel}>Búsquedas populares:</span>
                            {['React', 'Node.js', 'Python', 'Flutter', 'Machine Learning',].map(tag => (
                                <button key={tag} style={s.sugTag} onClick={() => setBusqueda(tag)}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats con contador animado */}
                    <div style={s.heroStats}>
                        <Counter value={graduados.length} label="Graduados" />
                        <div style={s.heroStatDiv} />
                        <Counter value={disponibles} label="Disponibles" />
                        <div style={s.heroStatDiv} />
                        <Counter value={totalTecs} label="Tecnologías" />
                        <div style={s.heroStatDiv} />
                        <Counter value={conEspecialidades} label="Especializados" />
                    </div>
                </div>
            </header>

            {/* ════════ GRID PERFILES ════════ */}
            <div style={s.contenido}>
                <div style={s.filtrosBar}>
                    <div style={s.filtrosIzq}>
                        <span style={s.filtrosLabel}>Filtrar por:</span>
                        {filtroOpciones.map(({ val, label, dot }) => (
                            <button key={val}
                                style={{ ...s.chip, ...(filtroDisp === val ? s.chipActivo : {}) }}
                                onClick={() => setFiltroDisp(val)}>
                                {dot && (
                                    <span style={{
                                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                        backgroundColor: filtroDisp === val ? 'white' : dot,
                                        marginRight: 6, flexShrink: 0,
                                    }} />
                                )}
                                {label}
                            </button>
                        ))}
                    </div>
                    <span style={s.filtrosDer}>
                        {busqueda
                            ? <>{graduadosFiltrados.length} resultado{graduadosFiltrados.length !== 1 ? 's' : ''} para "<strong>{busqueda}</strong>"</>
                            : <>{graduados.length} perfil{graduados.length !== 1 ? 'es' : ''} registrado{graduados.length !== 1 ? 's' : ''}</>
                        }
                    </span>
                </div>

                {cargando ? (
                    <div style={s.cargando}>
                        <FaSpinner style={{ fontSize: '2.2rem', color: 'var(--color-espoch-rojo)', animation: 'spin 1s linear infinite' }} />
                        <p style={{ marginTop: 14, color: 'var(--color-texto-secundario)' }}>Cargando perfiles...</p>
                    </div>
                ) : graduadosFiltrados.length === 0 ? (
                    <div style={s.vacio}>
                        <FaGraduationCap style={{ fontSize: '3.5rem', color: '#dee2e6', marginBottom: 14 }} />
                        <p style={{ fontWeight: 700, color: 'var(--color-texto-principal)', marginBottom: 4 }}>
                            {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay perfiles registrados aún'}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginBottom: 16 }}>
                            {busqueda ? 'Prueba con otro término' : 'Pronto aparecerán los perfiles aquí'}
                        </p>
                        {busqueda && (
                            <button style={s.btnLimpiarVacio} onClick={() => setBusqueda('')}>
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={s.grid}>
                        {graduadosFiltrados.map(g => (
                            <TarjetaGraduado key={g._id} graduado={g} onContactar={setModalGraduado} />
                        ))}
                    </div>
                )}
            </div>

            {modalGraduado && (
                <ModalContacto graduado={modalGraduado} onCerrar={() => setModalGraduado(null)} />
            )}

            <style>{`
                @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
            `}</style>
        </>
    );
};

// ══════════════════════════════════════════════
// ESTILOS — HERO (original, con constelación encima)
// ══════════════════════════════════════════════
const s = {
    hero:           { position: 'relative', padding: '56px 20px 64px', textAlign: 'center', overflow: 'hidden', backgroundColor: '#0f1428' },
    heroBgImagen:   { position: 'absolute', inset: 0, backgroundImage: 'url("/img/EDIFICIO_FIE_LOGO.jpg")', backgroundSize: 'cover', backgroundPosition: 'center 35%', backgroundRepeat: 'no-repeat', filter: 'saturate(0.7) brightness(0.5) contrast(1.05)', zIndex: 0 },
    heroBgOverlay:  { position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(190,30,45,0.68) 0%, rgba(120,10,18,0.62) 40%, rgba(12,18,40,0.80) 100%)', zIndex: 1 },
    heroContent:    { maxWidth: 740, margin: '0 auto', position: 'relative', zIndex: 2 },
    heroBadge:      { display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.11)', border: '1px solid rgba(255,255,255,0.28)', color: 'rgba(255,255,255,0.92)', fontSize: '0.77rem', fontWeight: 600, padding: '5px 18px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.6px', fontFamily: FONT },
    heroTitulo:     { color: '#FFFFFF', fontSize: '2.8rem', fontWeight: 900, margin: '0 0 14px', lineHeight: 1.15, fontFamily: FONT, textShadow: '0 2px 16px rgba(0,0,0,0.5)' },
    heroAcento:     { color: 'rgba(255,255,255,0.78)' },
    heroSub:        { color: 'rgba(255,255,255,0.85)', fontSize: '1rem', lineHeight: 1.7, margin: '0 auto 32px', maxWidth: 560, fontFamily: FONT, textShadow: '0 1px 6px rgba(0,0,0,0.4)' },
    buscadorCard:   { backgroundColor: 'white', borderRadius: 14, padding: '8px 8px 12px', boxShadow: '0 8px 40px rgba(0,0,0,0.38)', marginBottom: 32 },
    buscadorFila:   { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' },
    buscadorIco:    { color: 'var(--color-espoch-rojo)', fontSize: '1.15rem', flexShrink: 0, marginLeft: 4 },
    buscadorInput:  { flex: 1, border: 'none', outline: 'none', fontSize: '1rem', color: 'var(--color-texto-principal)', padding: '10px 8px', fontFamily: FONT, backgroundColor: 'transparent' },
    buscadorLimpiar:{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', padding: 6 },
    sugerencias:    { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '4px 16px 2px' },
    sugLabel:       { fontSize: '0.73rem', color: 'var(--color-texto-secundario)', fontWeight: 600, fontFamily: FONT },
    sugTag:         { padding: '3px 12px', backgroundColor: 'var(--color-tech-azul-claro)', color: 'var(--color-tech-azul)', border: '1px solid #b8d4f5', borderRadius: 20, fontSize: '0.73rem', cursor: 'pointer', fontWeight: 500, fontFamily: FONT },
    heroStats:      { display: 'flex', justifyContent: 'center', alignItems: 'center' },
    heroStatItem:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 22px' },
    heroStatNum:    { color: 'white', fontSize: '1.9rem', fontWeight: 900, lineHeight: 1, display: 'block', fontFamily: FONT, textShadow: '0 2px 8px rgba(0,0,0,0.4)' },
    heroStatLabel:  { color: 'rgba(255,255,255,0.62)', fontSize: '0.73rem', marginTop: 5, display: 'block', fontFamily: FONT },
    heroStatDiv:    { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.22)' },
    contenido:      { maxWidth: 1200, margin: '0 auto', padding: '28px 20px 52px' },
    filtrosBar:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
    filtrosIzq:     { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    filtrosLabel:   { fontSize: '0.8rem', color: 'var(--color-texto-secundario)', fontWeight: 600, fontFamily: FONT },
    chip:           { display: 'inline-flex', alignItems: 'center', padding: '5px 14px', borderRadius: 20, border: '1px solid #dee2e6', backgroundColor: 'white', color: 'var(--color-texto-secundario)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: FONT },
    chipActivo:     { backgroundColor: 'var(--color-espoch-rojo)', color: 'white', borderColor: 'var(--color-espoch-rojo)', fontWeight: 700 },
    filtrosDer:     { fontSize: '0.82rem', color: 'var(--color-texto-secundario)', fontFamily: FONT },
    grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, animation: 'fadeIn 0.3s' },
    cargando:       { textAlign: 'center', padding: '70px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    vacio:          { textAlign: 'center', padding: '60px 20px' },
    btnLimpiarVacio:{ padding: '9px 22px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontFamily: FONT },
};

// ══════════════════════════════════════════════
// ESTILOS — TARJETA (original + botón "Ver perfil")
// ══════════════════════════════════════════════
const ts = {
    card:        { backgroundColor: 'white', borderRadius: 12, padding: '18px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeIn 0.3s', fontFamily: FONT },
    header:      { display: 'flex', gap: 12, alignItems: 'flex-start' },
    fotoWrap:    { width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-espoch-rojo)', flexShrink: 0 },
    foto:        { width: '100%', height: '100%', objectFit: 'cover' },
    fotoIcon:    { fontSize: 56, color: '#dee2e6', display: 'block' },
    info:        { flex: 1, minWidth: 0 },
    nombre:      { margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-texto-principal)', fontFamily: FONT },
    subtitulo:   { margin: '0 0 2px', fontSize: '0.75rem', color: 'var(--color-espoch-rojo)', fontWeight: 600, fontFamily: FONT },
    ciudad:      { margin: 0, fontSize: '0.73rem', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', fontFamily: FONT },
    badge:       { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, alignSelf: 'flex-start', fontFamily: FONT },
    bio:         { margin: 0, fontSize: '0.8rem', color: 'var(--color-texto-principal)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: FONT },
    seccion:     { display: 'flex', flexDirection: 'column', gap: 6 },
    secLabel:    { margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-texto-principal)', display: 'flex', alignItems: 'center', fontFamily: FONT },
    tagsWrap:    { display: 'flex', flexWrap: 'wrap', gap: 5 },
    tag:         { backgroundColor: 'var(--tag-bg-azul)', color: 'var(--tag-text-azul)', padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 500, border: '1px solid #bbdefb', fontFamily: FONT },
    tagMas:      { backgroundColor: 'var(--color-fondo-web)', color: 'var(--color-texto-secundario)', padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontFamily: FONT },
    tagEsp:      { backgroundColor: '#fce4ec', color: 'var(--color-espoch-rojo)', padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 500, border: '1px solid #f8bbd0', fontFamily: FONT },
    tarifa:      { margin: 0, fontSize: '0.82rem', color: 'var(--color-espoch-verde)', backgroundColor: '#e8f5e9', padding: '4px 10px', borderRadius: 6, display: 'inline-block', alignSelf: 'flex-start', border: '1px solid #c8e6c9', fontFamily: FONT },
    footerCard:  { marginTop: 'auto', display: 'flex', gap: 7 },
    btnVerPerfil:{ flex: 1, padding: '8px 10px', backgroundColor: 'white', color: 'var(--color-espoch-rojo)', border: '1px solid var(--color-espoch-rojo)', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT },
    btnContactar:{ flex: 2, padding: '8px 10px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT },
};

// ══════════════════════════════════════════════
// ESTILOS — MODAL CONTACTO (original)
// ══════════════════════════════════════════════
const ms = {
    overlay:     { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
    modal:       { backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 460, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.22)', overflow: 'hidden' },
    mHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px 14px', borderBottom: '2px solid var(--color-espoch-rojo)' },
    titulo:      { margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-texto-principal)', fontFamily: FONT },
    sub:         { margin: 0, fontSize: '0.76rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5, fontFamily: FONT },
    btnClose:    { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-secundario)', fontSize: '1rem', padding: 4, display: 'flex', alignItems: 'center' },
    body:        { flex: 1, overflowY: 'auto', padding: '16px 20px' },
    exitoWrap:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', textAlign: 'center' },
    chip:        { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'var(--color-fondo-web)', border: '1px solid #e9ecef', borderRadius: 10, padding: '10px 14px', marginBottom: 14 },
    chipFoto:    { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-espoch-rojo)', flexShrink: 0 },
    chipNombre:  { margin: '0 0 2px', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-texto-principal)', fontFamily: FONT },
    chipSub:     { margin: 0, fontSize: '0.73rem', color: 'var(--color-texto-secundario)', fontFamily: FONT },
    alerta:      { backgroundColor: '#ffebee', color: 'var(--estado-error)', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', marginBottom: 12, display: 'flex', alignItems: 'center', border: '1px solid #ffcdd2' },
    campo:       { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 },
    lbl:         { fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-texto-principal)', fontFamily: FONT },
    inp:         { padding: '9px 12px', border: '1px solid #e9ecef', borderRadius: 6, fontSize: '0.85rem', color: 'var(--color-texto-principal)', outline: 'none', fontFamily: FONT, backgroundColor: 'var(--color-fondo-web)' },
    aviso:       { fontSize: '0.74rem', color: 'var(--color-texto-secundario)', backgroundColor: 'var(--color-tech-azul-claro)', padding: '8px 12px', borderRadius: 6, margin: '4px 0 14px', lineHeight: 1.5 },
    footerModal: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #e9ecef', backgroundColor: 'var(--color-fondo-web)' },
    btnCancelar: { padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, color: 'var(--color-texto-secundario)', fontFamily: FONT },
    btnPrincipal:{ padding: '8px 18px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 700, display: 'flex', alignItems: 'center', marginTop: 16, fontFamily: FONT },
};

export default PublicHome;
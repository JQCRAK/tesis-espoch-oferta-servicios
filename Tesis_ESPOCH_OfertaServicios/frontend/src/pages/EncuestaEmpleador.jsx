// frontend/src/pages/EncuestaEmpleador.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const FONT      = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
const FONT_SANS = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
const ROJO      = '#BE1E2D';
const ROJO_OSCURO = '#8B1421';
const ROJO_CLARO  = '#F9E8EA';
const GRIS_LINEA  = '#E8E8E8';
const TEXTO       = '#1A1A1A';
const TEXTO_SUAVE = '#6B6B6B';

if (typeof document !== 'undefined' && !document.getElementById('emp-estilos-globales')) {
    const st = document.createElement('style');
    st.id = 'emp-estilos-globales';
    st.textContent = `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInToast {
            from { opacity: 0; transform: translateY(20px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes pulseRojo {
            0%, 100% { box-shadow: 0 0 0 0 rgba(190,30,45,0.18); }
            50%       { box-shadow: 0 0 0 7px rgba(190,30,45,0);   }
        }

        .emp-inp:focus {
            border-color: ${ROJO} !important;
            box-shadow: 0 0 0 3px rgba(190,30,45,0.10) !important;
            outline: none;
        }
        .emp-radio-btn:hover  { border-color: ${ROJO} !important; background: ${ROJO_CLARO} !important; }
        .emp-opcion:hover     { border-color: ${ROJO} !important; background: ${ROJO_CLARO} !important; }
        .emp-btn-escala:hover { border-color: ${ROJO} !important; color: ${ROJO} !important; }
        .emp-btn-sinno:hover  { border-color: ${ROJO} !important; }

        .emp-tarjeta-preg { animation: fadeInUp 0.28s ease both; }
        .emp-btn-enviar:hover { background: ${ROJO_OSCURO} !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(190,30,45,0.35) !important; }
        .emp-btn-enviar { transition: all 0.18s ease; }
        .emp-btn-volver:hover { background: #EBEBEB !important; }
        .emp-btn-continuar:hover { background: ${ROJO_OSCURO} !important; transform: translateY(-1px); }
        .emp-btn-continuar { transition: all 0.18s ease; }
    `;
    document.head.appendChild(st);
}

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
// TOAST
// ══════════════════════════════════════════════
const Toast = ({ mensaje, visible, onOcultar }) => {
    useEffect(() => {
        if (!visible) return;
        const t = setTimeout(() => onOcultar(), 5000);
        return () => clearTimeout(t);
    }, [visible, mensaje, onOcultar]);

    if (!visible) return null;
    return (
        <div style={{
            position: 'fixed', bottom: 28, right: 24, zIndex: 9999,
            background: '#1A1A1A', color: 'white', borderRadius: 4,
            padding: '14px 18px', maxWidth: 380,
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            animation: 'slideInToast 0.3s ease',
            fontFamily: FONT_SANS, borderLeft: `4px solid ${ROJO}`,
        }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ROJO, flexShrink: 0, marginTop: 6 }} />
            <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: '0.72rem', fontWeight: '700', color: ROJO, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Campos incompletos
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '400', lineHeight: 1.55, color: 'rgba(255,255,255,0.88)' }}>
                    {mensaje}
                </p>
            </div>
            <button onClick={onOcultar} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
                cursor: 'pointer', fontSize: '1.1rem', padding: 0, flexShrink: 0,
                lineHeight: 1, marginTop: 1,
            }}>×</button>
        </div>
    );
};

// ══════════════════════════════════════════════
// BARRA DE PASOS
// ══════════════════════════════════════════════
const PASOS = ['Consentimiento', 'Sus Datos', 'Cuestionario'];
const estadoAPaso = { consentimiento: 0, datos: 1, preguntas: 2 };

const BarraPasos = ({ estado }) => {
    const actual = estadoAPaso[estado] ?? -1;
    if (actual < 0) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, fontFamily: FONT_SANS }}>
            {PASOS.map((label, i) => {
                const comp = i < actual;
                const actv = i === actual;
                return (
                    <React.Fragment key={i}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                background: comp ? ROJO : actv ? ROJO : 'transparent',
                                border: `2px solid ${comp || actv ? ROJO : GRIS_LINEA}`,
                                fontSize: '0.7rem', fontWeight: '700',
                                color: comp || actv ? 'white' : TEXTO_SUAVE,
                                transition: 'all 0.2s',
                            }}>
                                {comp ? '✓' : i + 1}
                            </div>
                            <span style={{
                                fontSize: '0.65rem', fontWeight: actv ? '700' : '400',
                                color: actv ? ROJO : comp ? TEXTO : TEXTO_SUAVE,
                                letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.2,
                            }}>{label}</span>
                        </div>
                        {i < PASOS.length - 1 && (
                            <div style={{ height: 2, flex: 2, background: i < actual ? ROJO : GRIS_LINEA, marginBottom: 22, transition: 'background 0.3s' }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ══════════════════════════════════════════════
// CABECERA INSTITUCIONAL
// ══════════════════════════════════════════════
const Cabecera = ({ subtitulo, titulo }) => (
    <div style={{
        background: ROJO, padding: '28px 32px 24px',
        borderRadius: '12px 12px 0 0', position: 'relative', overflow: 'hidden',
    }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 180, height: '100%', opacity: 0.06 }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, border: '40px solid white', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -60, right: -20, width: 140, height: 140, border: '30px solid white', borderRadius: '50%' }} />
        </div>
        <p style={{
            margin: '0 0 6px', fontSize: '0.6rem', fontWeight: '700',
            color: 'rgba(255,255,255,0.65)', letterSpacing: '2px',
            textTransform: 'uppercase', fontFamily: FONT_SANS,
        }}>{subtitulo}</p>
        <h1 style={{
            margin: 0, fontSize: '1.15rem', fontWeight: '600',
            color: 'white', fontFamily: FONT, lineHeight: 1.3, maxWidth: 520,
        }}>{titulo}</h1>
    </div>
);

// ══════════════════════════════════════════════
// TABLA MATRIZ
// ══════════════════════════════════════════════
const TablaMatriz = ({ items, columnas, respuestas, onRespuesta, pregId }) => (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: FONT_SANS }}>
            <thead>
                <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: '40%', color: TEXTO_SUAVE, fontWeight: '600', borderBottom: `2px solid ${GRIS_LINEA}`, fontSize: '0.7rem', letterSpacing: '0.3px' }}></th>
                    {columnas.map((col, i) => (
                        <th key={i} style={{ padding: '8px 6px', textAlign: 'center', color: TEXTO_SUAVE, fontWeight: '700', minWidth: 58, borderBottom: `2px solid ${GRIS_LINEA}`, fontSize: '0.7rem' }}>{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {items.map((item, rowIdx) => {
                    const itemId = `${pregId}_item_${rowIdx}`;
                    return (
                        <tr key={rowIdx} style={{ borderBottom: `1px solid ${rowIdx % 2 === 0 ? GRIS_LINEA : 'transparent'}`, background: rowIdx % 2 !== 0 ? '#FAFAFA' : 'white' }}>
                            <td style={{ padding: '11px 12px', fontSize: '0.79rem', color: TEXTO, lineHeight: 1.45, fontWeight: '500' }}>{item}</td>
                            {columnas.map((col, colIdx) => {
                                const sel = respuestas[itemId] === col;
                                return (
                                    <td key={colIdx} style={{ padding: '10px 6px', textAlign: 'center' }}>
                                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <input type="radio" name={itemId} checked={sel}
                                                onChange={() => onRespuesta(itemId, col)}
                                                style={{ width: 17, height: 17, cursor: 'pointer', accentColor: ROJO }} />
                                        </label>
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

// ══════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════
const EncuestaEmpleador = () => {
    const token    = new URLSearchParams(window.location.search).get('token');
    const width    = useWindowWidth();
    const isMobile = width < 768;

    const [estado,   setEstado]   = useState('cargando');
    const [errorMsg, setErrorMsg] = useState('');
    const [datos,    setDatos]    = useState(null);

    const [encuestado, setEncuestado] = useState({
        nombresApellidos: '', edad: '', genero: '',
        cargo: '', profesion: '', aniosServicio: '',
        email: '', telefono: '', estudiosEspoch: '',
    });

    const [respuestas,              setRespuestas]              = useState({});
    const [condicionalesVisibles,   setCondicionalesVisibles]   = useState({});
    const [toastMsg,                setToastMsg]                = useState('');
    const [toastVisible,            setToastVisible]            = useState(false);

    const mostrarToast = (msg) => {
        setToastMsg(msg);
        setToastVisible(false);
        setTimeout(() => setToastVisible(true), 50);
    };

    useEffect(() => {
        if (!token) { setEstado('error'); setErrorMsg('No se proporcionó un enlace válido.'); return; }
        cargarEncuesta();
    }, []);

    const cargarEncuesta = async () => {
        try {
            const resp = await axios.get(`${API}/empleador/encuesta?token=${token}`);
            const d = resp.data;
            setDatos(d);
            if (d.empleador.encuestado) {
                setEncuestado({
                    nombresApellidos: d.empleador.encuestado.nombresApellidos || '',
                    edad:             d.empleador.encuestado.edad             || '',
                    genero:           d.empleador.encuestado.genero           || '',
                    cargo:            d.empleador.encuestado.cargo            || '',
                    profesion:        d.empleador.encuestado.profesion        || '',
                    aniosServicio:    d.empleador.encuestado.aniosServicio    || '',
                    email:            d.empleador.encuestado.email            || '',
                    telefono:         d.empleador.encuestado.telefono         || '',
                    estudiosEspoch:   d.empleador.encuestado.estudiosEspoch   || '',
                });
            }
            setEstado('consentimiento');
        } catch (e) {
            setErrorMsg(e.response?.data?.msg || 'Error al cargar la encuesta.');
            setEstado('error');
        }
    };

    const manejarRespuesta = (pregId, valor, tipo) => {
        setRespuestas(prev => ({ ...prev, [pregId]: valor }));
        if (tipo === 'si_no') setCondicionalesVisibles(prev => ({ ...prev, [pregId]: valor }));
    };

    const manejarCheckbox = (pregId, opcion) => {
        setRespuestas(prev => {
            const actual = prev[pregId] || [];
            return { ...prev, [pregId]: actual.includes(opcion) ? actual.filter(o => o !== opcion) : [...actual, opcion] };
        });
    };

    const cambiarEncuestado = (campo, valor) => setEncuestado(prev => ({ ...prev, [campo]: valor }));

    const validarPreguntas = (preguntas) => {
        const errores = [];
        const excedidasInfo = [];
        let numCounter = 0;
        const numMap = {};
        for (const p of preguntas) {
            if (p.tipo !== 'titulo') { numCounter++; numMap[p._id] = numCounter; }
        }
        for (const preg of preguntas) {
            if (preg.tipo === 'titulo' || !preg.obligatoria) continue;
            const num = numMap[preg._id];
            if (preg.esMatriz && preg.items?.length > 0) {
                const faltantes = preg.items.filter((_, idx) => {
                    const r = respuestas[`${preg._id}_item_${idx}`];
                    return r === undefined || r === null || r === '';
                });
                if (faltantes.length > 0) errores.push(num);
                continue;
            }
            const r = respuestas[preg._id];
            const vacia = preg.tipo === 'checkboxes'
                ? (!r || r.length === 0)
                : (r === undefined || r === null || r === '');
            if (vacia) { errores.push(num); continue; }
            // Validación de límite en checkboxes
            if (preg.tipo === 'checkboxes' && Number(preg.limiteSeleccion) > 0
                && r.length > Number(preg.limiteSeleccion)) {
                errores.push(num);
                excedidasInfo.push({ num, lim: Number(preg.limiteSeleccion) });
                continue;
            }
            if (preg.tipo === 'si_no' && preg.tieneCondicional) {
                if (r === 'Sí' && preg.preguntasCondicionalSi?.length > 0) {
                    preg.preguntasCondicionalSi.forEach((_, j) => {
                        const subR = respuestas[`${preg._id}_si_${j}`];
                        const subVacia = preg.tiposCondicionalSi?.[j] === 'checkboxes'
                            ? (!subR || subR.length === 0)
                            : (subR === undefined || subR === null || subR === '');
                        if (subVacia) errores.push(num);
                    });
                }
                if (r === 'No' && preg.preguntasCondicionalNo?.length > 0) {
                    preg.preguntasCondicionalNo.forEach((_, j) => {
                        const subR = respuestas[`${preg._id}_no_${j}`];
                        const subVacia = preg.tiposCondicionalNo?.[j] === 'checkboxes'
                            ? (!subR || subR.length === 0)
                            : (subR === undefined || subR === null || subR === '');
                        if (subVacia) errores.push(num);
                    });
                }
            }
        }
        return { nums: [...new Set(errores)].sort((a, b) => a - b), excedidasInfo };
    };

    if (estado === 'cargando') return (
        <div style={css.centrado}>
            <div style={css.spinner} />
            <p style={{ color: TEXTO_SUAVE, fontSize: '0.82rem', marginTop: 16, fontFamily: FONT_SANS }}>Cargando encuesta...</p>
        </div>
    );

    if (estado === 'error') return (
        <div style={css.centrado}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${ROJO}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 2, height: 20, background: ROJO, borderRadius: 1 }} />
            </div>
            <h2 style={{ color: ROJO, margin: '0 0 8px', fontSize: '1rem', fontFamily: FONT, fontWeight: '600' }}>Enlace no disponible</h2>
            <p style={{ color: TEXTO_SUAVE, fontSize: '0.82rem', maxWidth: 340, textAlign: 'center', lineHeight: 1.65, fontFamily: FONT_SANS }}>{errorMsg}</p>
            <p style={{ color: '#B0B0B0', fontSize: '0.72rem', marginTop: 16, fontFamily: FONT_SANS }}>
                Consultas: <a href="mailto:carrera.software@espoch.edu.ec" style={{ color: ROJO, textDecoration: 'none', fontWeight: '600' }}>carrera.software@espoch.edu.ec</a>
            </p>
        </div>
    );

    if (estado === 'enviado') return (
        <div style={css.centrado}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F0FAF2', border: '2px solid #2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: '1.4rem' }}>
                ✓
            </div>
            <h2 style={{ color: '#2e7d32', margin: '0 0 10px', fontSize: '1.1rem', fontFamily: FONT, fontWeight: '600' }}>Gracias por su participación</h2>
            <p style={{ color: TEXTO_SUAVE, fontSize: '0.83rem', maxWidth: 400, textAlign: 'center', lineHeight: 1.7, fontFamily: FONT_SANS }}>
                Sus respuestas han sido registradas correctamente. Su opinión contribuye a mejorar la formación académica de la Carrera de Software de la ESPOCH.
            </p>
            <div style={{ marginTop: 24, height: 1, width: 60, background: GRIS_LINEA }} />
            <p style={{ color: '#B0B0B0', fontSize: '0.7rem', marginTop: 16, fontFamily: FONT_SANS, letterSpacing: '0.5px' }}>ESPOCH · Carrera de Software</p>
        </div>
    );

    const { encuesta, preguntas, empleador } = datos;

    const cardPadding = isMobile ? '20px 16px' : '28px 32px';

    if (estado === 'consentimiento') return (
        <div style={css.pagina}>
            <div style={css.tarjeta}>
                <Cabecera subtitulo="Encuesta a Empleadores" titulo={encuesta.titulo} />
                <div style={{ padding: cardPadding }}>
                    <BarraPasos estado={estado} />
                    <div style={{ marginBottom: 8 }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: '600', color: TEXTO, fontFamily: FONT }}>
                            Consentimiento Informado
                        </h3>
                        <p style={{ margin: '0 0 16px', fontSize: '0.72rem', color: TEXTO_SUAVE, fontFamily: FONT_SANS }}>
                            Lea detenidamente el siguiente texto antes de continuar
                        </p>
                        <div style={{ background: '#FAFAFA', border: `1px solid ${GRIS_LINEA}`, borderLeft: `3px solid ${ROJO}`, borderRadius: '0 6px 6px 0', padding: '18px 20px', marginBottom: 24, maxHeight: 260, overflowY: 'auto', lineHeight: 1.75 }}>
                            <p style={{ margin: 0, fontSize: '0.83rem', color: '#3A3A3A', fontFamily: FONT_SANS, textAlign: 'justify' }}>
                                {encuesta.consentimientoInformado}
                            </p>
                        </div>
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: '0.82rem', fontWeight: '600', color: TEXTO, textAlign: 'center', fontFamily: FONT_SANS }}>
                        ¿Acepta participar en esta investigación?
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                        <button onClick={() => setEstado('datos')} style={{
                            padding: '13px', background: '#F0FAF2',
                            border: '1.5px solid #2e7d32', borderRadius: 6,
                            cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
                            color: '#2e7d32', fontFamily: FONT_SANS, transition: 'all 0.15s',
                        }}>
                            Sí, acepto participar
                        </button>
                        <button onClick={async () => {
                            try {
                                await axios.post(`${API}/empleador/encuesta/responder?token=${token}`, { aceptoConsentimiento: false, respuestas: {} });
                            } catch (e) { console.warn(e.response?.data?.msg); }
                            setEstado('enviado');
                        }} style={{
                            padding: '13px', background: ROJO_CLARO,
                            border: `1.5px solid ${ROJO}`, borderRadius: 6,
                            cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
                            color: ROJO, fontFamily: FONT_SANS, transition: 'all 0.15s',
                        }}>
                            No acepto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (estado === 'datos') {
        const validarDatos = () => {
            if (!encuestado.nombresApellidos.trim()) return 'El campo Nombres y Apellidos es obligatorio.';
            if (!encuestado.edad || isNaN(encuestado.edad)) return 'Ingrese su edad.';
            if (+encuestado.edad < 18) return 'Debe ser mayor de 18 años para participar.';
            if (+encuestado.edad > 100) return 'Ingrese una edad válida.';
            if (!encuestado.genero) return 'Seleccione su género.';
            if (!encuestado.cargo.trim()) return 'El campo Cargo es obligatorio.';
            if (!encuestado.profesion.trim()) return 'El campo Profesión es obligatorio.';
            if (encuestado.aniosServicio === '' || encuestado.aniosServicio === null || +encuestado.aniosServicio < 0) return 'Ingrese los años de servicio.';
            if (!encuestado.email.trim()) return 'El campo Correo electrónico es obligatorio.';
            if (!encuestado.email.includes('@')) return 'El correo debe contener @.';
            if (!encuestado.telefono.trim()) return 'El campo Teléfono es obligatorio.';
            if (encuestado.telefono.length !== 10) return 'El teléfono debe tener exactamente 10 dígitos.';
            return null;
        };

        const filaDoble = {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 0 : '0 20px',
        };

        return (
            <div style={css.pagina}>
                <div style={css.tarjeta}>
                    <Cabecera subtitulo="Paso 1 de 2 — Sus Datos" titulo={encuesta.titulo} />
                    <div style={{ padding: cardPadding }}>
                        <BarraPasos estado={estado} />

                        <SeccionLabel>Organización</SeccionLabel>
                        <div style={{ background: '#F8F9FC', border: `1px solid #DDE1EE`, borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
                            <p style={{ margin: '0 0 12px', fontSize: '0.68rem', color: '#7B83AA', fontFamily: FONT_SANS, lineHeight: 1.55 }}>
                                Datos de registro oficial · Solo lectura.
                                Para actualizaciones escriba a{' '}
                                <a href="mailto:carrera.software@espoch.edu.ec" style={{ color: ROJO, fontWeight: '600', textDecoration: 'none' }}>carrera.software@espoch.edu.ec</a>
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px 16px' }}>
                                {[
                                    ['Empresa',                empleador.nombreEmpresa],
                                    ['Gerente',               empleador.nombreGerente],
                                    ['Correo institucional',   empleador.emailOrganizacion],
                                    ['Tipo según capital',     empleador.tipoCapital],
                                    ['Tipo según actividad',   empleador.tipoActividad],
                                ].map(([lbl, val], i) => (
                                    <div key={i} style={{ gridColumn: !isMobile && i === 2 ? '1 / -1' : 'auto' }}>
                                        <p style={{ margin: '0 0 2px', fontSize: '0.65rem', fontWeight: '700', color: '#9099BB', textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: FONT_SANS }}>{lbl}</p>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: TEXTO, fontFamily: FONT_SANS, fontWeight: '500', padding: '5px 0', borderBottom: `1px solid ${GRIS_LINEA}` }}>{val || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <SeccionLabel>Información del Encuestado</SeccionLabel>
                        <p style={{ margin: '-8px 0 18px', fontSize: '0.72rem', color: TEXTO_SUAVE, fontFamily: FONT_SANS }}>
                            Todos los campos marcados con <span style={{ color: ROJO }}>*</span> son obligatorios
                        </p>

                        <CampoForm label="Nombres y Apellidos *">
                            <input type="text" value={encuestado.nombresApellidos} className="emp-inp"
                                onChange={e => cambiarEncuestado('nombresApellidos', e.target.value)}
                                placeholder="Ej: Juan Carlos Pérez López"
                                style={css.input} />
                        </CampoForm>

                        <div style={filaDoble}>
                            <CampoForm label="Edad *">
                                <input type="number" value={encuestado.edad} min="18" max="100" className="emp-inp"
                                    onChange={e => cambiarEncuestado('edad', e.target.value)}
                                    placeholder="Ej: 35"
                                    style={{ ...css.input, width: '100%' }} />
                            </CampoForm>
                            <CampoForm label="Años de servicio *">
                                <input type="number" value={encuestado.aniosServicio} min="0" className="emp-inp"
                                    onChange={e => cambiarEncuestado('aniosServicio', e.target.value)}
                                    placeholder="Ej: 5"
                                    style={{ ...css.input, width: '100%' }} />
                            </CampoForm>
                        </div>

                        <CampoForm label="Género *">
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {['Masculino', 'Femenino', 'LGTBI'].map(op => (
                                    <label key={op} className="emp-radio-btn" style={{
                                        display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                                        padding: '8px 16px', borderRadius: 5,
                                        border: `1.5px solid ${encuestado.genero === op ? ROJO : GRIS_LINEA}`,
                                        background: encuestado.genero === op ? ROJO_CLARO : 'white',
                                        fontSize: '0.82rem', fontFamily: FONT_SANS,
                                        fontWeight: encuestado.genero === op ? '700' : '400',
                                        color: encuestado.genero === op ? ROJO : TEXTO,
                                        transition: 'all 0.15s',
                                    }}>
                                        <input type="radio" name="genero" value={op} checked={encuestado.genero === op}
                                            onChange={() => cambiarEncuestado('genero', op)}
                                            style={{ accentColor: ROJO }} />
                                        {op}
                                    </label>
                                ))}
                            </div>
                        </CampoForm>

                        <div style={filaDoble}>
                            <CampoForm label="Cargo *">
                                <input type="text" value={encuestado.cargo} className="emp-inp"
                                    onChange={e => cambiarEncuestado('cargo', e.target.value)}
                                    placeholder="Ej: Jefe de Sistemas"
                                    style={{ ...css.input, width: '100%' }} />
                            </CampoForm>
                            <CampoForm label="Profesión *">
                                <input type="text" value={encuestado.profesion} className="emp-inp"
                                    onChange={e => cambiarEncuestado('profesion', e.target.value)}
                                    placeholder="Ej: Ing. en Sistemas"
                                    style={{ ...css.input, width: '100%' }} />
                            </CampoForm>
                        </div>

                        <div style={filaDoble}>
                            <CampoForm label="Correo electrónico *">
                                <input type="email" value={encuestado.email} className="emp-inp"
                                    onChange={e => cambiarEncuestado('email', e.target.value)}
                                    placeholder="Ej: juan@empresa.com"
                                    style={{ ...css.input, width: '100%' }} />
                            </CampoForm>
                            <CampoForm label="Teléfono *">
                                <input type="text" value={encuestado.telefono} className="emp-inp"
                                    onChange={e => cambiarEncuestado('telefono', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Ej: 0987654321"
                                    style={{ ...css.input, width: '100%' }} />
                            </CampoForm>
                        </div>

                        <CampoForm label="Ha realizado sus estudios en la ESPOCH">
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {['Grado', 'Posgrado', 'Ninguno'].map(op => (
                                    <label key={op} className="emp-radio-btn" style={{
                                        display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                                        padding: '8px 16px', borderRadius: 5,
                                        border: `1.5px solid ${encuestado.estudiosEspoch === op ? ROJO : GRIS_LINEA}`,
                                        background: encuestado.estudiosEspoch === op ? ROJO_CLARO : 'white',
                                        fontSize: '0.82rem', fontFamily: FONT_SANS,
                                        fontWeight: encuestado.estudiosEspoch === op ? '700' : '400',
                                        color: encuestado.estudiosEspoch === op ? ROJO : TEXTO,
                                        transition: 'all 0.15s',
                                    }}>
                                        <input type="radio" name="estudiosEspoch" value={op} checked={encuestado.estudiosEspoch === op}
                                            onChange={() => cambiarEncuestado('estudiosEspoch', op)}
                                            style={{ accentColor: ROJO }} />
                                        {op}
                                    </label>
                                ))}
                            </div>
                        </CampoForm>

                        <button className="emp-btn-continuar" onClick={async () => {
                            const err = validarDatos();
                            if (err) { mostrarToast(err); return; }
                            try {
                                await axios.patch(`${API}/empleador/encuesta/datos-encuestado?token=${token}`, encuestado);
                            } catch (e) { console.error(e); }
                            setEstado('preguntas');
                        }} style={{
                            width: '100%', marginTop: 8, padding: '13px',
                            background: ROJO, color: 'white', border: 'none',
                            borderRadius: 6, cursor: 'pointer', fontWeight: '700',
                            fontSize: '0.88rem', fontFamily: FONT_SANS, letterSpacing: '0.3px',
                        }}>
                            Continuar al cuestionario
                        </button>
                    </div>
                </div>
                <Toast mensaje={toastMsg} visible={toastVisible} onOcultar={() => setToastVisible(false)} />
            </div>
        );
    }

    if (estado === 'preguntas') {
        const renderSubPregunta = (pregPadreId, lado, idx, texto, tipo, opciones) => {
            const subId = `${pregPadreId}_${lado}_${idx}`;
            const esSi  = lado === 'si';
            return (
                <div key={subId} style={{
                    marginBottom: 8, padding: '12px 14px',
                    background: esSi ? '#F4FAF5' : '#FFF8F0',
                    border: `1px solid ${esSi ? '#C8E6C9' : '#FFE0B2'}`,
                    borderRadius: 5,
                }}>
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: '600', color: TEXTO, fontFamily: FONT_SANS }}>{texto}</p>

                    {tipo === 'texto_libre' && (
                        <textarea value={respuestas[subId] || ''} onChange={e => manejarRespuesta(subId, e.target.value, tipo)}
                            placeholder="Escribe tu respuesta..." className="emp-inp"
                            style={{ width: '100%', padding: '7px 10px', border: `1px solid ${GRIS_LINEA}`, borderRadius: 4, fontSize: '0.78rem', minHeight: 48, outline: 'none', resize: 'vertical', fontFamily: FONT_SANS, boxSizing: 'border-box' }} />
                    )}
                    {tipo === 'opcion_multiple' && (opciones || []).map((op, k) => (
                        <label key={k} className="emp-opcion" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.78rem', marginBottom: 4, padding: '5px 8px', borderRadius: 4, border: `1px solid ${respuestas[subId] === op ? ROJO : 'transparent'}`, background: respuestas[subId] === op ? ROJO_CLARO : 'transparent', fontFamily: FONT_SANS }}>
                            <input type="radio" name={subId} value={op} checked={respuestas[subId] === op} onChange={() => manejarRespuesta(subId, op, tipo)} style={{ accentColor: ROJO }} />{op}
                        </label>
                    ))}
                    {tipo === 'checkboxes' && (() => {
                        const lim = Number(preg.limiteSeleccion) || 0;
                        const seleccionadas = (respuestas[subId] || []).length;
                        const limAlcanzado = lim > 0 && seleccionadas >= lim;
                        return (
                            <>
                                {lim > 0 && (
                                    <div style={{
                                        background: limAlcanzado ? '#ffebee' : '#fff8e1',
                                        border: `1px solid ${limAlcanzado ? '#ffcdd2' : '#ffe082'}`,
                                        color: limAlcanzado ? '#c62828' : '#6d4c00',
                                        padding: '5px 9px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
                                        marginBottom: 5, fontFamily: FONT_SANS,
                                    }}>
                                        {limAlcanzado
                                            ? `Alcanzaste el máximo de ${lim} selecciones — desmarca una para cambiar.`
                                            : `Máximo ${lim} opción${lim === 1 ? '' : 'es'} (${seleccionadas}/${lim}).`}
                                    </div>
                                )}
                                {(opciones || []).map((op, k) => {
                                    const sel = (respuestas[subId] || []).includes(op);
                                    const bloq = !sel && limAlcanzado;
                                    return (
                                        <label key={k} className="emp-opcion" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: bloq ? 'not-allowed' : 'pointer', fontSize: '0.78rem', marginBottom: 4, padding: '5px 8px', borderRadius: 4, border: `1px solid ${sel ? ROJO : 'transparent'}`, background: sel ? ROJO_CLARO : 'transparent', fontFamily: FONT_SANS, opacity: bloq ? 0.55 : 1 }}>
                                            <input type="checkbox" checked={sel} disabled={bloq} onChange={() => {
                                                const a = respuestas[subId] || [];
                                                if (a.includes(op)) manejarRespuesta(subId, a.filter(x => x !== op), tipo);
                                                else if (lim === 0 || a.length < lim) manejarRespuesta(subId, [...a, op], tipo);
                                            }} style={{ accentColor: ROJO }} />{op}
                                        </label>
                                    );
                                })}
                            </>
                        );
                    })()}
                    {tipo === 'escala' && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} className="emp-btn-escala" onClick={() => manejarRespuesta(subId, n, tipo)} style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid ${respuestas[subId] === n ? ROJO : GRIS_LINEA}`, background: respuestas[subId] === n ? ROJO : 'white', color: respuestas[subId] === n ? 'white' : TEXTO_SUAVE, cursor: 'pointer', fontWeight: '700', fontSize: '0.72rem', transition: 'all 0.15s' }}>{n}</button>
                            ))}
                        </div>
                    )}
                    {tipo === 'numero' && (
                        <input type="number" value={respuestas[subId] || ''} min="0" className="emp-inp"
                            onChange={e => {
                                const v = e.target.value;
                                if (v === '' || (/^\d+$/.test(v) && parseInt(v) >= 0)) manejarRespuesta(subId, v, tipo);
                            }}
                            placeholder="Ingresa un número..."
                            style={{ width: isMobile ? '100%' : '180px', padding: '7px 10px', border: `1px solid ${GRIS_LINEA}`, borderRadius: 4, fontSize: '0.78rem', outline: 'none', fontFamily: FONT_SANS, boxSizing: 'border-box' }} />
                    )}
                </div>
            );
        };

        const renderPregunta = (preg, num) => {
            if (preg.tipo === 'titulo') {
                return (
                    <div key={preg._id} style={{ margin: '24px 0 10px', padding: '12px 16px', borderLeft: `3px solid ${ROJO}`, background: '#FAFAFA' }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: TEXTO, fontFamily: FONT, letterSpacing: '0.2px' }}>{preg.texto}</p>
                    </div>
                );
            }

            const base = {
                marginBottom: 12, padding: isMobile ? '14px 14px' : '16px 18px',
                background: 'white', border: `1px solid ${GRIS_LINEA}`, borderRadius: 8,
            };

            if (preg.esMatriz && preg.items?.length > 0) {
                const columnas = preg.tipo === 'escala' ? [1, 2, 3, 4, 5] : (preg.opciones || []);
                return (
                    <div key={preg._id} className="emp-tarjeta-preg" style={base}>
                        <p style={{ margin: '0 0 4px', fontSize: '0.87rem', fontWeight: '600', color: TEXTO, fontFamily: FONT_SANS, lineHeight: 1.4 }}>
                            <span style={{ color: ROJO, fontWeight: '700', marginRight: 6 }}>{num}.</span>
                            {preg.texto}
                            {preg.obligatoria && <span style={{ color: ROJO, marginLeft: 3 }}>*</span>}
                        </p>
                        {preg.descripcionMatriz && <p style={{ margin: '0 0 8px', fontSize: '0.74rem', color: TEXTO_SUAVE, fontFamily: FONT_SANS }}>{preg.descripcionMatriz}</p>}
                        {preg.tipo === 'escala' && (
                            <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
                                {preg.etiquetaMin && <span style={{ fontSize: '0.68rem', color: TEXTO_SUAVE, fontFamily: FONT_SANS }}>1 = {preg.etiquetaMin}</span>}
                                {preg.etiquetaMax && <span style={{ fontSize: '0.68rem', color: TEXTO_SUAVE, fontFamily: FONT_SANS }}>5 = {preg.etiquetaMax}</span>}
                            </div>
                        )}
                        <TablaMatriz items={preg.items} columnas={columnas} respuestas={respuestas}
                            onRespuesta={(itemId, val) => manejarRespuesta(itemId, val, preg.tipo)}
                            pregId={preg._id} />
                    </div>
                );
            }

            return (
                <div key={preg._id} className="emp-tarjeta-preg" style={base}>
                    <p style={{ margin: '0 0 12px', fontSize: '0.87rem', fontWeight: '600', color: TEXTO, fontFamily: FONT_SANS, lineHeight: 1.45 }}>
                        <span style={{ color: ROJO, fontWeight: '700', marginRight: 6 }}>{num}.</span>
                        {preg.texto}
                        {preg.obligatoria && <span style={{ color: ROJO, marginLeft: 3 }}>*</span>}
                        {preg.tipo === 'checkboxes' && Number(preg.limiteSeleccion) > 0 && (
                            <span style={{ marginLeft: 8, fontSize: '0.74rem', fontWeight: 700, color: '#6d4c00', background: '#fff8e1', padding: '2px 8px', borderRadius: 10, border: '1px solid #ffe082' }}>
                                Marca máximo {preg.limiteSeleccion} {preg.limiteSeleccion === 1 ? 'opción' : 'opciones'}
                            </span>
                        )}
                    </p>

                    {preg.tipo === 'texto_libre' && (
                        <textarea value={respuestas[preg._id] || ''} onChange={e => manejarRespuesta(preg._id, e.target.value, preg.tipo)}
                            placeholder="Escribe tu respuesta..." className="emp-inp"
                            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${GRIS_LINEA}`, borderRadius: 5, fontSize: '0.82rem', minHeight: 68, outline: 'none', resize: 'vertical', fontFamily: FONT_SANS, boxSizing: 'border-box' }} />
                    )}

                    {preg.tipo === 'numero' && (
                        <input type="number" value={respuestas[preg._id] || ''} min="0" className="emp-inp"
                            onChange={e => { const v = e.target.value; if (v === '' || (/^\d+$/.test(v) && parseInt(v) >= 0)) manejarRespuesta(preg._id, v, preg.tipo); }}
                            placeholder="Ingresa un número..."
                            style={{ ...css.input, width: isMobile ? '100%' : '180px' }} />
                    )}

                    {preg.tipo === 'opcion_multiple' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(preg.opciones || []).map((op, i) => (
                                <label key={i} className="emp-opcion" style={{
                                    display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                                    padding: '9px 12px', borderRadius: 5, fontSize: '0.83rem', fontFamily: FONT_SANS,
                                    background: respuestas[preg._id] === op ? ROJO_CLARO : '#FAFAFA',
                                    border: `1.5px solid ${respuestas[preg._id] === op ? ROJO : GRIS_LINEA}`,
                                    color: respuestas[preg._id] === op ? ROJO_OSCURO : TEXTO,
                                    fontWeight: respuestas[preg._id] === op ? '600' : '400',
                                    transition: 'all 0.12s',
                                }}>
                                    <input type="radio" name={preg._id} value={op} checked={respuestas[preg._id] === op}
                                        onChange={() => manejarRespuesta(preg._id, op, preg.tipo)}
                                        style={{ accentColor: ROJO, flexShrink: 0 }} />{op}
                                </label>
                            ))}
                        </div>
                    )}

                    {preg.tipo === 'checkboxes' && (() => {
                        const lim = Number(preg.limiteSeleccion) || 0;
                        const seleccionadas = (respuestas[preg._id] || []).length;
                        const limAlcanzado = lim > 0 && seleccionadas >= lim;
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {lim > 0 && (
                                    <div style={{
                                        background: limAlcanzado ? '#ffebee' : '#fff8e1',
                                        border: `1px solid ${limAlcanzado ? '#ffcdd2' : '#ffe082'}`,
                                        color: limAlcanzado ? '#c62828' : '#6d4c00',
                                        padding: '6px 10px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600,
                                        marginBottom: 4, fontFamily: FONT_SANS,
                                    }}>
                                        {limAlcanzado
                                            ? `Alcanzaste el máximo de ${lim} selecciones — desmarca una para cambiar.`
                                            : `Máximo ${lim} opción${lim === 1 ? '' : 'es'} (${seleccionadas}/${lim} seleccionada${seleccionadas === 1 ? '' : 's'}).`}
                                    </div>
                                )}
                                {(preg.opciones || []).map((op, i) => {
                                    const sel = (respuestas[preg._id] || []).includes(op);
                                    const bloq = !sel && limAlcanzado;
                                    return (
                                        <label key={i} className="emp-opcion" style={{
                                            display: 'flex', alignItems: 'center', gap: 9,
                                            cursor: bloq ? 'not-allowed' : 'pointer',
                                            padding: '9px 12px', borderRadius: 5, fontSize: '0.83rem', fontFamily: FONT_SANS,
                                            background: sel ? ROJO_CLARO : (bloq ? '#f5f5f5' : '#FAFAFA'),
                                            border: `1.5px solid ${sel ? ROJO : GRIS_LINEA}`,
                                            color: sel ? ROJO_OSCURO : (bloq ? '#adb5bd' : TEXTO),
                                            fontWeight: sel ? '600' : '400',
                                            opacity: bloq ? 0.55 : 1,
                                            transition: 'all 0.12s',
                                        }}>
                                            <input type="checkbox" checked={sel} disabled={bloq}
                                                onChange={() => {
                                                    const a = respuestas[preg._id] || [];
                                                    if (a.includes(op)) manejarRespuesta(preg._id, a.filter(x => x !== op), preg.tipo);
                                                    else if (lim === 0 || a.length < lim) manejarRespuesta(preg._id, [...a, op], preg.tipo);
                                                }}
                                                style={{ accentColor: ROJO, flexShrink: 0 }} />{op}
                                        </label>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    {preg.tipo === 'escala' && (
                        <div>
                            <div style={{ display: 'flex', gap: isMobile ? 6 : 8, justifyContent: 'center', margin: '8px 0 6px', flexWrap: 'wrap' }}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} className="emp-btn-escala" onClick={() => manejarRespuesta(preg._id, n, preg.tipo)} style={{
                                        width: isMobile ? 44 : 40, height: isMobile ? 44 : 40,
                                        borderRadius: '50%',
                                        border: `2px solid ${respuestas[preg._id] === n ? ROJO : GRIS_LINEA}`,
                                        background: respuestas[preg._id] === n ? ROJO : 'white',
                                        color: respuestas[preg._id] === n ? 'white' : TEXTO_SUAVE,
                                        cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem',
                                        fontFamily: FONT_SANS, transition: 'all 0.15s',
                                        animation: respuestas[preg._id] === n ? 'pulseRojo 0.4s ease' : 'none',
                                    }}>{n}</button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: TEXTO_SUAVE, fontFamily: FONT_SANS }}>
                                <span>{preg.etiquetaMin || 'Muy malo'}</span>
                                <span>{preg.etiquetaMax || 'Excelente'}</span>
                            </div>
                        </div>
                    )}

                    {preg.tipo === 'si_no' && (
                        <div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['Sí', 'No'].map(op => (
                                    <button key={op} className="emp-btn-sinno" onClick={() => manejarRespuesta(preg._id, op, preg.tipo)} style={{
                                        flex: 1, padding: '10px', borderRadius: 5,
                                        border: `2px solid ${respuestas[preg._id] === op ? (op === 'Sí' ? '#2e7d32' : ROJO) : GRIS_LINEA}`,
                                        background: respuestas[preg._id] === op ? (op === 'Sí' ? '#F0FAF2' : ROJO_CLARO) : 'white',
                                        color: respuestas[preg._id] === op ? (op === 'Sí' ? '#2e7d32' : ROJO) : TEXTO_SUAVE,
                                        cursor: 'pointer', fontWeight: '700', fontSize: '0.87rem',
                                        fontFamily: FONT_SANS, transition: 'all 0.15s',
                                    }}>{op}</button>
                                ))}
                            </div>
                            {condicionalesVisibles[preg._id] === 'Sí' && preg.tieneCondicional && preg.preguntasCondicionalSi?.length > 0 && (
                                <div style={{ marginTop: 12, paddingLeft: isMobile ? 8 : 12, borderLeft: `3px solid #2e7d32` }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.7rem', fontWeight: '700', color: '#2e7d32', fontFamily: FONT_SANS, letterSpacing: '0.3px' }}>
                                        PREGUNTAS ADICIONALES
                                    </p>
                                    {preg.preguntasCondicionalSi.map((t, j) => renderSubPregunta(preg._id, 'si', j, t, preg.tiposCondicionalSi?.[j], preg.opcionesCondicionalSi?.[j]))}
                                </div>
                            )}
                            {condicionalesVisibles[preg._id] === 'No' && preg.tieneCondicional && preg.preguntasCondicionalNo?.length > 0 && (
                                <div style={{ marginTop: 12, paddingLeft: isMobile ? 8 : 12, borderLeft: `3px solid ${ROJO}` }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.7rem', fontWeight: '700', color: ROJO, fontFamily: FONT_SANS, letterSpacing: '0.3px' }}>
                                        PREGUNTAS ADICIONALES
                                    </p>
                                    {preg.preguntasCondicionalNo.map((t, j) => renderSubPregunta(preg._id, 'no', j, t, preg.tiposCondicionalNo?.[j], preg.opcionesCondicionalNo?.[j]))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        };

        let numCounter = 0;
        const preguntasConNum = preguntas.map(preg => ({
            preg,
            num: preg.tipo !== 'titulo' ? ++numCounter : null,
        }));

        return (
            <div style={css.pagina}>
                <Toast mensaje={toastMsg} visible={toastVisible} onOcultar={() => setToastVisible(false)} />
                <div style={css.tarjeta}>
                    <Cabecera subtitulo="Paso 2 de 2 — Cuestionario" titulo={encuesta.titulo} />
                    <div style={{ padding: cardPadding }}>
                        <BarraPasos estado={estado} />

                        <button className="emp-btn-volver" onClick={() => setEstado('datos')} style={{
                            marginBottom: 20, padding: '7px 14px', background: '#F4F4F4',
                            border: 'none', borderRadius: 5, cursor: 'pointer',
                            fontSize: '0.76rem', fontWeight: '600', color: TEXTO_SUAVE,
                            fontFamily: FONT_SANS, transition: 'background 0.15s',
                        }}>
                            ← Volver a mis datos
                        </button>

                        {preguntas.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: TEXTO_SUAVE, fontSize: '0.85rem', fontFamily: FONT_SANS }}>
                                Esta encuesta aún no tiene preguntas configuradas.
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: TEXTO_SUAVE, fontFamily: FONT_SANS }}>
                                        {preguntasConNum.filter(x => x.num !== null).length} preguntas ·
                                        Los campos con <span style={{ color: ROJO, fontWeight: '700' }}>*</span> son obligatorios
                                    </p>
                                </div>

                                <div style={{ height: 1, background: GRIS_LINEA, marginBottom: 20 }} />

                                {preguntasConNum.map(({ preg, num }) => renderPregunta(preg, num))}

                                <div style={{ height: 1, background: GRIS_LINEA, margin: '8px 0 20px' }} />

                                <button className="emp-btn-enviar" onClick={async () => {
                                    const { nums: faltantes, excedidasInfo } = validarPreguntas(preguntas);
                                    if (excedidasInfo && excedidasInfo.length > 0) {
                                        const e0 = excedidasInfo[0];
                                        mostrarToast(`En la pregunta #${e0.num} marcaste más de ${e0.lim} opciones. El máximo permitido es ${e0.lim}.`);
                                        return;
                                    }
                                    if (faltantes.length > 0) {
                                        const lista = faltantes.length <= 5
                                            ? faltantes.map(n => `#${n}`).join(', ')
                                            : faltantes.slice(0, 5).map(n => `#${n}`).join(', ') + ` y ${faltantes.length - 5} más`;
                                        mostrarToast(`Faltan respuestas obligatorias en las preguntas: ${lista}.`);
                                        return;
                                    }
                                    try {
                                        await axios.post(`${API}/empleador/encuesta/responder?token=${token}`, {
                                            aceptoConsentimiento: true,
                                            respuestas,
                                        });
                                        setEstado('enviado');
                                    } catch (err) {
                                        mostrarToast(err.response?.data?.msg || 'Error al enviar. Inténtalo de nuevo.');
                                    }
                                }} style={{
                                    width: '100%', padding: '13px',
                                    background: ROJO, color: 'white',
                                    border: 'none', borderRadius: 6,
                                    cursor: 'pointer', fontWeight: '700',
                                    fontSize: '0.88rem', fontFamily: FONT_SANS,
                                    letterSpacing: '0.3px',
                                    boxShadow: `0 4px 16px rgba(190,30,45,0.25)`,
                                }}>
                                    Enviar respuestas
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

// ══════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ══════════════════════════════════════════════
const SeccionLabel = ({ children }) => (
    <p style={{
        margin: '0 0 12px', fontSize: '0.68rem', fontWeight: '700',
        color: TEXTO_SUAVE, textTransform: 'uppercase', letterSpacing: '1.2px',
        fontFamily: FONT_SANS, paddingBottom: 6, borderBottom: `1px solid ${GRIS_LINEA}`,
    }}>{children}</p>
);

const CampoForm = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', marginBottom: 6, color: TEXTO, fontFamily: FONT_SANS }}>{label}</label>
        {children}
    </div>
);

// ══════════════════════════════════════════════
// ESTILOS BASE
// ══════════════════════════════════════════════
const css = {
    pagina: {
        minHeight: '100vh',
        background: '#F2F2F2',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '32px 16px 60px',
    },
    tarjeta: {
        background: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 700,
        boxShadow: '0 2px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'hidden',
    },
    input: {
        width: '100%',
        padding: '9px 12px',
        border: `1px solid ${GRIS_LINEA}`,
        borderRadius: 5,
        fontSize: '0.83rem',
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: FONT_SANS,
        color: TEXTO,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        background: 'white',
    },
    centrado: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: '#F2F2F2',
        fontFamily: FONT_SANS,
    },
    spinner: {
        width: 36,
        height: 36,
        border: `3px solid ${GRIS_LINEA}`,
        borderTop: `3px solid ${ROJO}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
};

export default EncuestaEmpleador;
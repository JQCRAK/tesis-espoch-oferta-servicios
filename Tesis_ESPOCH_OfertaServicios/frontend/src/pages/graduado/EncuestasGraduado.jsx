// frontend/src/pages/graduado/EncuestasGraduado.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaClipboardList, FaClock, FaCheckCircle, FaLock, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
import { leerSesion } from '../../utils/storageSeguro';
const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};

const FONT = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
const FONT_FORM = "'Georgia', 'Times New Roman', serif";
const FONT_SANS = "'Segoe UI', system-ui, -apple-system, sans-serif";

// ── Colores del formulario (igual que EncuestaEmpleador) ──
const ROJO = '#BE1E2D';
const ROJO_OSC = '#8B1421';
const ROJO_CLARO = '#F9E8EA';
const GRIS_LN = '#E8E8E8';
const TEXTO = '#1A1A1A';
const TEXTO_S = '#6B6B6B';

const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const fmtFechaNac = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }); };
const calcularEstado = (enc) => {
    if (enc.estadoRespuesta === 'completada') return 'completada';
    if (enc.estado !== 'activa') return 'cerrada'; // este caso ya no llega, pero por seguridad
    return 'pendiente';
};

const ESTADO_CFG = {
    pendiente: { bg: '#fff8e1', color: '#f57f17', label: 'Pendiente', Ico: FaClock },
    completada: { bg: '#e8f5e9', color: '#2e7d32', label: 'Completada', Ico: FaCheckCircle },
    cerrada: { bg: '#f5f5f5', color: '#9e9e9e', label: 'Cerrada', Ico: FaLock },
};

// ══════════════════════════════════════════════════════════════
// ESTILOS GLOBALES — inyectados una sola vez
// ══════════════════════════════════════════════════════════════
if (typeof document !== 'undefined' && !document.getElementById('eg-estilos-globales')) {
    const st = document.createElement('style');
    st.id = 'eg-estilos-globales';
    st.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

        @keyframes spin          { to { transform: rotate(360deg); } }
        @keyframes slideInToast  { from { opacity:0; transform:translateY(20px) scale(0.96);} to { opacity:1; transform:translateY(0) scale(1);} }
        @keyframes fadeInUp      { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes pulseRojo     { 0%,100%{ box-shadow:0 0 0 0 rgba(190,30,45,0.18);} 50%{ box-shadow:0 0 0 7px rgba(190,30,45,0);} }

        .eg-inp:focus            { border-color:${ROJO}!important; box-shadow:0 0 0 3px rgba(190,30,45,0.10)!important; outline:none; }
        .eg-radio-btn:hover      { border-color:${ROJO}!important; background:${ROJO_CLARO}!important; }
        .eg-opcion:hover         { border-color:${ROJO}!important; background:${ROJO_CLARO}!important; }
        .eg-btn-escala:hover     { border-color:${ROJO}!important; color:${ROJO}!important; }
        .eg-btn-sinno:hover      { border-color:${ROJO}!important; }
        .eg-tarjeta-preg         { animation: fadeInUp 0.26s ease both; }
        .eg-btn-enviar:hover     { background:${ROJO_OSC}!important; transform:translateY(-1px); box-shadow:0 6px 20px rgba(190,30,45,0.35)!important; }
        .eg-btn-enviar           { transition:all 0.18s ease; }
        .eg-btn-sig:hover        { background:${ROJO_OSC}!important; transform:translateY(-1px); }
        .eg-btn-sig              { transition:all 0.18s ease; }
        .eg-btn-atras:hover      { background:#E2E2E2!important; }
        .eg-ciudadania:hover     { border-color:${ROJO}!important; }
    `;
    document.head.appendChild(st);
}

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════
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
            <button onClick={onOcultar} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '1.1rem', padding: 0, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>×</button>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// CABECERA MODAL (igual que EncuestaEmpleador)
// ══════════════════════════════════════════════════════════════
const CabeceraModal = ({ titulo, onCerrar }) => (
    <div style={{
        background: ROJO, padding: '24px 28px 20px',
        borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0,
    }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 180, height: '100%', opacity: 0.06, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, border: '40px solid white', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -60, right: -20, width: 140, height: 140, border: '30px solid white', borderRadius: '50%' }} />
        </div>
        <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 5px', fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: FONT_SANS }}>
                Encuesta de Graduados · ESPOCH
            </p>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600', color: 'white', fontFamily: FONT_FORM, lineHeight: 1.3, maxWidth: 580, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {titulo}
            </h2>
        </div>
        <button onClick={onCerrar} style={{
            background: 'rgba(255,255,255,0.18)', border: 'none',
            borderRadius: 6, color: 'white', width: 32, height: 32, cursor: 'pointer',
            fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, marginLeft: 14, transition: 'background 0.15s',
        }}>×</button>
    </div>
);

// ══════════════════════════════════════════════════════════════
// BARRA DE PASOS (misma estética que EncuestaEmpleador)
// ══════════════════════════════════════════════════════════════
const PASOS_CFG = [
    { id: 'consentimiento', label: 'Consentimiento' },
    { id: 'info_general', label: 'Mis Datos' },
    { id: 'preguntas', label: 'Encuesta' },
];
const PASO_IDX = { consentimiento: 0, info_general: 1, preguntas: 2 };

const BarraPasos = ({ paso }) => {
    const actIdx = PASO_IDX[paso] ?? -1;
    if (actIdx < 0) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 26, fontFamily: FONT_SANS, padding: '16px 28px 0' }}>
            {PASOS_CFG.map((p, i) => {
                const comp = i < actIdx;
                const actv = i === actIdx;
                return (
                    <React.Fragment key={i}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                background: comp ? ROJO : actv ? ROJO : 'transparent',
                                border: `2px solid ${comp || actv ? ROJO : GRIS_LN}`,
                                fontSize: '0.7rem', fontWeight: '700',
                                color: comp || actv ? 'white' : TEXTO_S,
                                transition: 'all 0.2s',
                            }}>
                                {comp ? '✓' : i + 1}
                            </div>
                            <span style={{
                                fontSize: '0.65rem', fontWeight: actv ? '700' : '400',
                                color: actv ? ROJO : comp ? TEXTO : TEXTO_S,
                                letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.2,
                            }}>{p.label}</span>
                        </div>
                        {i < PASOS_CFG.length - 1 && (
                            <div style={{ height: 2, flex: 2, background: i < actIdx ? ROJO : GRIS_LN, marginBottom: 20, transition: 'background 0.3s' }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// TABLA MATRIZ
// ══════════════════════════════════════════════════════════════
const TablaMatriz = ({ items, columnas, respuestas, onRespuesta, pregId, esOpcionMultiple }) => (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: FONT_SANS }}>
            <thead>
                <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: '40%', color: TEXTO_S, fontWeight: '600', borderBottom: `2px solid ${GRIS_LN}`, fontSize: '0.7rem', letterSpacing: '0.3px' }}></th>
                    {columnas.map((col, i) => (
                        <th key={i} style={{ padding: '8px 6px', textAlign: 'center', color: TEXTO_S, fontWeight: '700', minWidth: 58, borderBottom: `2px solid ${GRIS_LN}`, fontSize: '0.7rem' }}>{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {items.map((item, rowIdx) => {
                    const itemId = `${pregId}_item_${rowIdx}`;
                    return (
                        <tr key={rowIdx} style={{ borderBottom: `1px solid ${rowIdx % 2 === 0 ? GRIS_LN : 'transparent'}`, background: rowIdx % 2 !== 0 ? '#FAFAFA' : 'white' }}>
                            <td style={{ padding: '11px 12px', fontSize: '0.79rem', color: TEXTO, lineHeight: 1.45, fontWeight: '500' }}>{item}</td>
                            {columnas.map((col, colIdx) => {
                                const val = esOpcionMultiple ? col : colIdx + 1;
                                const sel = respuestas[itemId] === val;
                                return (
                                    <td key={colIdx} style={{ padding: '10px 6px', textAlign: 'center' }}>
                                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <input type="radio" name={itemId} checked={sel} onChange={() => onRespuesta(itemId, val)}
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

// ══════════════════════════════════════════════════════════════
// CAMPO SOLO LECTURA
// ══════════════════════════════════════════════════════════════
const Campo = ({ label, val }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: '0.65rem', fontWeight: '700', color: TEXTO_S, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: FONT_SANS }}>{label}</label>
        <div style={{ padding: '9px 12px', background: '#F8F9FA', border: `1px solid ${GRIS_LN}`, borderRadius: 6, fontSize: '0.83rem', color: TEXTO, fontFamily: FONT_SANS, minHeight: 36 }}>{val || '—'}</div>
    </div>
);

// ══════════════════════════════════════════════════════════════
// AUXILIARES DEL FORMULARIO
// ══════════════════════════════════════════════════════════════
const SeccionLabel = ({ children }) => (
    <p style={{ margin: '0 0 10px', fontSize: '0.65rem', fontWeight: '700', color: TEXTO_S, textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: FONT_SANS, paddingBottom: 6, borderBottom: `1px solid ${GRIS_LN}` }}>
        {children}
    </p>
);
const CampoForm = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '600', marginBottom: 5, color: TEXTO, fontFamily: FONT_SANS }}>{label}</label>
        {children}
    </div>
);

const inputBase = {
    width: '100%', padding: '9px 12px',
    border: `1px solid ${GRIS_LN}`, borderRadius: 5,
    fontSize: '0.83rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: FONT_SANS,
    color: TEXTO, background: 'white',
    transition: 'border-color 0.15s, box-shadow 0.15s',
};

// ══════════════════════════════════════════════════════════════
// PASO 1 — CONSENTIMIENTO
// ══════════════════════════════════════════════════════════════
const PasoConsentimiento = ({ encuesta, onAceptar, onRechazar }) => (
    <div style={{ padding: '0 28px 28px' }}>
        <div style={{ marginBottom: 8 }}>
            <h3 style={{ margin: '0 0 3px', fontSize: '0.95rem', fontWeight: '600', color: TEXTO, fontFamily: FONT_FORM }}>
                Consentimiento Informado
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.72rem', color: TEXTO_S, fontFamily: FONT_SANS }}>
                Lea detenidamente el siguiente texto antes de continuar
            </p>
            <div style={{
                background: '#FAFAFA', border: `1px solid ${GRIS_LN}`,
                borderLeft: `3px solid ${ROJO}`, borderRadius: '0 6px 6px 0',
                padding: '18px 20px', marginBottom: 22,
                maxHeight: 250, overflowY: 'auto', lineHeight: 1.75,
            }}>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#3A3A3A', fontFamily: FONT_SANS, textAlign: 'justify' }}>
                    {encuesta.consentimientoInformado ||
                        'Estimados graduados de la ESPOCH, el propósito de esta encuesta es recopilar información sobre su situación laboral, competencias y formación académica. Toda la información será tratada de manera confidencial. Su participación es completamente voluntaria.'}
                </p>
            </div>
        </div>

        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', fontWeight: '600', color: TEXTO, textAlign: 'center', fontFamily: FONT_SANS }}>
            ¿Acepta participar en esta investigación?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={onAceptar} style={{
                padding: '13px', background: '#F0FAF2',
                border: '1.5px solid #2e7d32', borderRadius: 6,
                cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
                color: '#2e7d32', fontFamily: FONT_SANS, transition: 'all 0.15s',
            }}>Sí, acepto participar</button>
            <button onClick={onRechazar} style={{
                padding: '13px', background: ROJO_CLARO,
                border: `1.5px solid ${ROJO}`, borderRadius: 6,
                cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
                color: ROJO, fontFamily: FONT_SANS, transition: 'all 0.15s',
            }}>No acepto</button>
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════
// PASO 2 — INFORMACIÓN GENERAL
// ══════════════════════════════════════════════════════════════
const PasoInfoGeneral = ({ onSiguiente, onAtras }) => {
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [anio, setAnio] = useState('');
    const [ciudadania, setCiudadania] = useState('');

    useEffect(() => {
        axios.get(`${API}/graduado/datos-encuesta`, { headers: hdrs() })
            .then(r => {
                const d = r.data;
                setDatos(d);
                setTelefono(d.telefono || '');
                setEmail(d.emailPersonal || '');
                setAnio(d.anioGraduacion ? String(d.anioGraduacion) : '');
                setCiudadania(d.ciudadania || '');
            })
            .catch(() => setError('No se pudieron cargar tus datos.'))
            .finally(() => setLoading(false));
    }, []);

    const validarYSiguiente = async () => {
        setError(''); setExito('');
        // Teléfono — exactamente 10 dígitos
        if (!telefono.trim()) { setError('El campo Celular es obligatorio.'); return; }
        if (!/^[0-9]{10}$/.test(telefono.trim())) { setError('El celular debe tener exactamente 10 dígitos.'); return; }
        // Email — al menos @
        if (!email.trim()) { setError('El campo Correo Personal es obligatorio.'); return; }
        if (!email.includes('@')) { setError('El correo debe contener @.'); return; }
        // Año
        if (!anio.trim()) { setError('El año de graduación es obligatorio.'); return; }
        const anioNum = parseInt(anio);
        if (isNaN(anioNum) || anioNum < 1990 || anioNum > new Date().getFullYear()) { setError(`El año debe estar entre 1990 y ${new Date().getFullYear()}.`); return; }
        // Ciudadanía
        if (!ciudadania) { setError('Debe seleccionar su ciudadanía.'); return; }

        setGuardando(true);
        try {
            await axios.patch(`${API}/graduado/datos-encuesta`,
                { telefono: telefono.trim(), emailPersonal: email.trim(), anioGraduacion: anioNum, ciudadania },
                { headers: hdrs() }
            );
            setExito('Datos guardados correctamente.');
            setTimeout(() => onSiguiente(), 700);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al guardar los datos.');
        } finally { setGuardando(false); }
    };

    if (loading) return (
        <div style={{ padding: '0 28px 28px' }}>
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <div style={frmCss.spinner} />
                <p style={{ margin: '14px 0 0', fontSize: '0.82rem', color: TEXTO_S, fontFamily: FONT_SANS }}>Cargando tus datos...</p>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '0 28px 28px' }}>
            {/* Aviso */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '10px 14px', marginBottom: 20 }}>
                <span style={{ flexShrink: 0, fontSize: '0.9rem' }}>ℹ️</span>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#1D4ED8', lineHeight: 1.55, fontFamily: FONT_SANS }}>
                    Los campos con <strong>✏️</strong> son editables. Al hacer clic en <strong>Guardar y continuar</strong> se actualizarán tus datos.
                </p>
            </div>

            {/* Datos de solo lectura */}
            <SeccionLabel>Datos Personales</SeccionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 14px', marginBottom: 18 }}>
                <Campo label="Nombres y Apellidos" val={`${datos?.nombres || ''} ${datos?.apellidos || ''}`.trim()} />
                <Campo label="Fecha de Nacimiento" val={fmtFechaNac(datos?.fechaNacimiento)} />
                <Campo label="Género" val={datos?.genero || '—'} />
                <Campo label="Cédula" val={datos?.cedula || '—'} />
                <Campo label="Presenta Discapacidad" val={datos?.tieneDiscapacidad || '—'} />
            </div>

            {/* Datos editables */}
            <SeccionLabel>Datos Editables ✏️</SeccionLabel>

            {/* Correo personal */}
            <CampoForm label="Correo Personal *">
                <input type="email" value={email} onChange={ev => setEmail(ev.target.value)}
                    placeholder="correo@gmail.com" className="eg-inp" style={inputBase} />
            </CampoForm>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
                {/* Celular */}
                <CampoForm label="Número de Celular *">
                    <input type="text" value={telefono}
                        onChange={ev => setTelefono(ev.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10 dígitos" maxLength={10} inputMode="numeric"
                        className="eg-inp" style={inputBase} />
                    <span style={{ fontSize: '0.68rem', color: telefono.length === 10 ? '#2e7d32' : TEXTO_S, marginTop: 3, display: 'block', fontFamily: FONT_SANS }}>
                        {telefono.length}/10 dígitos
                    </span>
                </CampoForm>

                {/* Año de graduación */}
                <CampoForm label="Año de Graduación *">
                    <input type="number" value={anio} onChange={ev => setAnio(ev.target.value)}
                        placeholder={`Ej: ${new Date().getFullYear() - 2}`}
                        min={1990} max={new Date().getFullYear()}
                        className="eg-inp" style={inputBase} />
                    <span style={{ fontSize: '0.68rem', color: TEXTO_S, marginTop: 3, display: 'block', fontFamily: FONT_SANS }}>
                        Corrígelo si hubo retraso en la tesis
                    </span>
                </CampoForm>
            </div>

            {/* Ciudadanía */}
            <CampoForm label="Ciudadanía *">
                <div style={{ display: 'flex', gap: 8 }}>
                    {['Nacional', 'Extranjera'].map(op => (
                        <label key={op} className="eg-radio-btn" style={{
                            display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                            padding: '9px 20px', borderRadius: 5,
                            border: `1.5px solid ${ciudadania === op ? ROJO : GRIS_LN}`,
                            background: ciudadania === op ? ROJO_CLARO : 'white',
                            fontSize: '0.83rem', fontFamily: FONT_SANS,
                            fontWeight: ciudadania === op ? '700' : '400',
                            color: ciudadania === op ? ROJO : TEXTO,
                            transition: 'all 0.15s',
                        }}>
                            <input type="radio" name="ciudadania" value={op} checked={ciudadania === op}
                                onChange={() => setCiudadania(op)} style={{ accentColor: ROJO }} />
                            {op}
                        </label>
                    ))}
                </div>
            </CampoForm>

            {error && (
                <div style={{ padding: '10px 14px', background: ROJO_CLARO, color: ROJO, border: `1px solid #F5C6CB`, borderRadius: 6, fontSize: '0.8rem', marginBottom: 12, fontFamily: FONT_SANS }}>
                    {error}
                </div>
            )}
            {exito && (
                <div style={{ padding: '10px 14px', background: '#E8F5E9', color: '#2e7d32', border: '1px solid #C8E6C9', borderRadius: 6, fontSize: '0.8rem', marginBottom: 12, fontFamily: FONT_SANS }}>
                    {exito}
                </div>
            )}

            {/* Navegación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 16, borderTop: `1px solid ${GRIS_LN}`, marginTop: 8 }}>
                <button className="eg-btn-atras" onClick={onAtras} disabled={guardando} style={{
                    display: 'flex', alignItems: 'center', padding: '10px 20px',
                    background: '#F0F0F0', border: 'none', borderRadius: 6,
                    cursor: 'pointer', fontWeight: '600', fontSize: '0.84rem',
                    color: TEXTO_S, fontFamily: FONT_SANS, transition: 'background 0.15s',
                }}>
                    <FaArrowLeft style={{ marginRight: 6, fontSize: '0.72rem' }} /> Atrás
                </button>
                <button className="eg-btn-sig" onClick={validarYSiguiente} disabled={guardando} style={{
                    display: 'flex', alignItems: 'center', padding: '10px 24px',
                    background: ROJO, color: 'white', border: 'none', borderRadius: 6,
                    cursor: 'pointer', fontWeight: '700', fontSize: '0.84rem',
                    fontFamily: FONT_SANS, boxShadow: `0 4px 14px rgba(190,30,45,0.25)`,
                }}>
                    {guardando ? 'Guardando...' : <><span>Guardar y continuar</span><FaArrowRight style={{ marginLeft: 6, fontSize: '0.72rem' }} /></>}
                </button>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// PASO 3 — PREGUNTAS
// ══════════════════════════════════════════════════════════════
const PasoPreguntas = ({ encuesta, onAtras, onEnviar }) => {
    const [preguntas, setPreguntas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [resp, setResp_] = useState({});
    const [conds, setConds] = useState({});
    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);

    const mostrarToast = (msg) => {
        setToastMsg(msg); setToastVisible(false);
        setTimeout(() => setToastVisible(true), 50);
    };

    useEffect(() => {
        axios.get(`${API}/graduado/encuestas/${encuesta._id}/preguntas`, { headers: hdrs() })
            .then(r => setPreguntas((r.data || []).sort((a, b) => (a.orden || 0) - (b.orden || 0))))
            .catch(() => mostrarToast('Error al cargar las preguntas. Recarga la página.'))
            .finally(() => setLoading(false));
    }, [encuesta._id]);

    const setR = (pregId, valor, tipo) => {
        setResp_(prev => ({ ...prev, [pregId]: valor }));
        if (tipo === 'si_no') setConds(prev => ({ ...prev, [pregId]: valor }));
    };
    const setChk = (pregId, op) => {
        setResp_(prev => {
            const a = prev[pregId] || [];
            return { ...prev, [pregId]: a.includes(op) ? a.filter(x => x !== op) : [...a, op] };
        });
    };

    // ── Validación ──
    const validar = () => {
        const errores = [];
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
                    const r = resp[`${preg._id}_item_${idx}`];
                    return r === undefined || r === null || r === '';
                });
                if (faltantes.length > 0) errores.push({ num });
                continue;
            }
            const r = resp[preg._id];
            const vacia = preg.tipo === 'checkboxes' ? (!r || r.length === 0) : (r === undefined || r === null || r === '');
            if (vacia) { errores.push({ num }); continue; }
            if (preg.tipo === 'si_no' && preg.tieneCondicional) {
                const elegido = conds[preg._id];
                if (elegido === 'Sí' && preg.preguntasCondicionalSi?.length > 0) {
                    preg.preguntasCondicionalSi.forEach((_, j) => {
                        const subR = resp[`${preg._id}_si_${j}`];
                        const subVacia = preg.tiposCondicionalSi?.[j] === 'checkboxes' ? (!subR || subR.length === 0) : (subR === undefined || subR === null || subR === '');
                        if (subVacia) errores.push({ num });
                    });
                }
            }
        }
        return errores;
    };

    const enviar = async () => {
        const errores = validar();
        if (errores.length > 0) {
            const nums = [...new Set(errores.map(e => e.num))].sort((a, b) => a - b);
            const lista = nums.length <= 5 ? nums.map(n => `#${n}`).join(', ') : nums.slice(0, 5).map(n => `#${n}`).join(', ') + ` y ${nums.length - 5} más`;
            mostrarToast(`Faltan respuestas obligatorias en las preguntas: ${lista}.`);
            return;
        }
        setEnviando(true);
        try {
            await axios.post(`${API}/encuestas/${encuesta._id}/respuestas`,
                { aceptoConsentimiento: true, respuestas: resp },
                { headers: hdrs() }
            );
            onEnviar();
        } catch (err) {
            mostrarToast(err.response?.data?.msg || 'Error al enviar. Intenta de nuevo.');
        } finally { setEnviando(false); }
    };

    // ── Sub-pregunta condicional ──
    const renderSub = (padreId, lado, idx, texto, tipo, opciones) => {
        const subId = `${padreId}_${lado}_${idx}`;
        const esSi = lado === 'si';
        return (
            <div key={subId} style={{
                marginBottom: 8, padding: '12px 14px',
                background: esSi ? '#F4FAF5' : '#FFF8F0',
                border: `1px solid ${esSi ? '#C8E6C9' : '#FFE0B2'}`,
                borderRadius: 5,
            }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: '600', color: TEXTO, fontFamily: FONT_SANS }}>{texto}</p>
                {tipo === 'texto_libre' && (
                    <textarea value={resp[subId] || ''} onChange={ev => setR(subId, ev.target.value, tipo)}
                        placeholder="Escribe tu respuesta..." className="eg-inp"
                        style={{ width: '100%', padding: '7px 10px', border: `1px solid ${GRIS_LN}`, borderRadius: 4, fontSize: '0.78rem', minHeight: 48, outline: 'none', resize: 'vertical', fontFamily: FONT_SANS, boxSizing: 'border-box' }} />
                )}
                {tipo === 'opcion_multiple' && (opciones || []).map((op, k) => (
                    <label key={k} className="eg-opcion" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.78rem', marginBottom: 4, padding: '5px 8px', borderRadius: 4, border: `1px solid ${resp[subId] === op ? ROJO : 'transparent'}`, background: resp[subId] === op ? ROJO_CLARO : 'transparent', fontFamily: FONT_SANS }}>
                        <input type="radio" name={subId} value={op} checked={resp[subId] === op} onChange={() => setR(subId, op, tipo)} style={{ accentColor: ROJO }} />{op}
                    </label>
                ))}
                {tipo === 'checkboxes' && (opciones || []).map((op, k) => {
                    const sel = (resp[subId] || []).includes(op);
                    return (
                        <label key={k} className="eg-opcion" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.78rem', marginBottom: 4, padding: '5px 8px', borderRadius: 4, border: `1px solid ${sel ? ROJO : 'transparent'}`, background: sel ? ROJO_CLARO : 'transparent', fontFamily: FONT_SANS }}>
                            <input type="checkbox" checked={sel} onChange={() => { const a = resp[subId] || []; setR(subId, a.includes(op) ? a.filter(x => x !== op) : [...a, op], tipo); }} style={{ accentColor: ROJO }} />{op}
                        </label>
                    );
                })}
                {tipo === 'escala' && (
                    <div style={{ display: 'flex', gap: 5 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} className="eg-btn-escala" onClick={() => setR(subId, n, tipo)} style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid ${resp[subId] === n ? ROJO : GRIS_LN}`, background: resp[subId] === n ? ROJO : 'white', color: resp[subId] === n ? 'white' : TEXTO_S, cursor: 'pointer', fontWeight: '700', fontSize: '0.72rem', transition: 'all 0.15s' }}>{n}</button>
                        ))}
                    </div>
                )}
                {tipo === 'numero' && (
                    <input
                        type="number"
                        value={resp[subId] || ''}
                        min="0"
                        className="eg-inp"
                        onChange={ev => {
                            const v = ev.target.value;
                            if (v === '' || (/^\d+$/.test(v) && parseInt(v) >= 0)) {
                                setR(subId, v, tipo);
                            }
                        }}
                        placeholder="Ingresa un número..."
                        style={{
                            width: '180px',
                            padding: '7px 10px',
                            border: `1px solid ${GRIS_LN}`,
                            borderRadius: 4,
                            fontSize: '0.78rem',
                            outline: 'none',
                            fontFamily: FONT_SANS,
                            boxSizing: 'border-box',
                        }}
                    />
                )}
            </div>
        );
    };

    // ── Render pregunta ──
    const renderP = (preg, num) => {
        // Título de sección
        if (preg.tipo === 'titulo') {
            return (
                <div key={preg._id} style={{ margin: '22px 0 10px', padding: '12px 16px', borderLeft: `3px solid ${ROJO}`, background: '#FAFAFA', borderRadius: '0 4px 4px 0' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: TEXTO, fontFamily: FONT_FORM, letterSpacing: '0.2px' }}>{preg.texto}</p>
                </div>
            );
        }

        const base = { marginBottom: 12, padding: '16px 18px', background: 'white', border: `1px solid ${GRIS_LN}`, borderRadius: 8 };

        // Matriz
        if (preg.esMatriz && preg.items?.length > 0) {
            const cols = preg.tipo === 'escala' ? [1, 2, 3, 4, 5] : (preg.opciones || []);
            return (
                <div key={preg._id} className="eg-tarjeta-preg" style={base}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.87rem', fontWeight: '600', color: TEXTO, fontFamily: FONT_SANS, lineHeight: 1.4 }}>
                        <span style={{ color: ROJO, fontWeight: '700', marginRight: 6 }}>{num}.</span>
                        {preg.texto}{preg.obligatoria && <span style={{ color: ROJO, marginLeft: 3 }}>*</span>}
                    </p>
                    {preg.descripcionMatriz && <p style={{ margin: '0 0 8px', fontSize: '0.74rem', color: TEXTO_S, fontFamily: FONT_SANS }}>{preg.descripcionMatriz}</p>}
                    {preg.tipo === 'escala' && (
                        <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
                            {preg.etiquetaMin && <span style={{ fontSize: '0.68rem', color: TEXTO_S, fontFamily: FONT_SANS }}>1 = {preg.etiquetaMin}</span>}
                            {preg.etiquetaMax && <span style={{ fontSize: '0.68rem', color: TEXTO_S, fontFamily: FONT_SANS }}>5 = {preg.etiquetaMax}</span>}
                        </div>
                    )}
                    <TablaMatriz items={preg.items} columnas={cols} respuestas={resp}
                        onRespuesta={(id, v) => setR(id, v, preg.tipo)}
                        pregId={preg._id} esOpcionMultiple={preg.tipo === 'opcion_multiple'} />
                </div>
            );
        }

        // Pregunta estándar
        return (
            <div key={preg._id} className="eg-tarjeta-preg" style={base}>
                <p style={{ margin: '0 0 12px', fontSize: '0.87rem', fontWeight: '600', color: TEXTO, fontFamily: FONT_SANS, lineHeight: 1.45 }}>
                    <span style={{ color: ROJO, fontWeight: '700', marginRight: 6 }}>{num}.</span>
                    {preg.texto}{preg.obligatoria && <span style={{ color: ROJO, marginLeft: 3 }}>*</span>}
                </p>

                {preg.tipo === 'texto_libre' && (
                    <textarea value={resp[preg._id] || ''} onChange={ev => setR(preg._id, ev.target.value, preg.tipo)}
                        placeholder="Escribe tu respuesta aquí..." className="eg-inp"
                        style={{ width: '100%', padding: '9px 12px', border: `1px solid ${GRIS_LN}`, borderRadius: 5, fontSize: '0.82rem', minHeight: 68, outline: 'none', resize: 'vertical', fontFamily: FONT_SANS, boxSizing: 'border-box' }} />
                )}

                {preg.tipo === 'numero' && (
                    <input type="number" value={resp[preg._id] || ''} min="0" className="eg-inp"
                        onChange={ev => { const v = ev.target.value; if (v === '' || (/^\d+$/.test(v) && parseInt(v) >= 0)) setR(preg._id, v, preg.tipo); }}
                        placeholder="Ingresa un número..."
                        style={{ ...inputBase, width: '180px' }} />
                )}

                {preg.tipo === 'opcion_multiple' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(preg.opciones || []).map((op, i) => (
                            <label key={i} className="eg-opcion" style={{
                                display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                                padding: '9px 12px', borderRadius: 5, fontSize: '0.83rem', fontFamily: FONT_SANS,
                                background: resp[preg._id] === op ? ROJO_CLARO : '#FAFAFA',
                                border: `1.5px solid ${resp[preg._id] === op ? ROJO : GRIS_LN}`,
                                color: resp[preg._id] === op ? ROJO_OSC : TEXTO,
                                fontWeight: resp[preg._id] === op ? '600' : '400',
                                transition: 'all 0.12s',
                            }}>
                                <input type="radio" name={preg._id} value={op} checked={resp[preg._id] === op}
                                    onChange={() => setR(preg._id, op, preg.tipo)}
                                    style={{ accentColor: ROJO, flexShrink: 0 }} />{op}
                            </label>
                        ))}
                    </div>
                )}

                {preg.tipo === 'checkboxes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(preg.opciones || []).map((op, i) => {
                            const sel = (resp[preg._id] || []).includes(op);
                            return (
                                <label key={i} className="eg-opcion" style={{
                                    display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                                    padding: '9px 12px', borderRadius: 5, fontSize: '0.83rem', fontFamily: FONT_SANS,
                                    background: sel ? ROJO_CLARO : '#FAFAFA',
                                    border: `1.5px solid ${sel ? ROJO : GRIS_LN}`,
                                    color: sel ? ROJO_OSC : TEXTO,
                                    fontWeight: sel ? '600' : '400',
                                    transition: 'all 0.12s',
                                }}>
                                    <input type="checkbox" checked={sel} onChange={() => setChk(preg._id, op)}
                                        style={{ accentColor: ROJO, flexShrink: 0 }} />{op}
                                </label>
                            );
                        })}
                    </div>
                )}

                {preg.tipo === 'escala' && (
                    <div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '8px 0 6px' }}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} className="eg-btn-escala" onClick={() => setR(preg._id, n, preg.tipo)} style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    border: `2px solid ${resp[preg._id] === n ? ROJO : GRIS_LN}`,
                                    background: resp[preg._id] === n ? ROJO : 'white',
                                    color: resp[preg._id] === n ? 'white' : TEXTO_S,
                                    cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem',
                                    fontFamily: FONT_SANS, transition: 'all 0.15s',
                                    animation: resp[preg._id] === n ? 'pulseRojo 0.4s ease' : 'none',
                                }}>{n}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: TEXTO_S, fontFamily: FONT_SANS }}>
                            <span>{preg.etiquetaMin || 'Muy malo'}</span>
                            <span>{preg.etiquetaMax || 'Excelente'}</span>
                        </div>
                    </div>
                )}

                {preg.tipo === 'si_no' && (
                    <div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['Sí', 'No'].map(op => (
                                <button key={op} className="eg-btn-sinno" onClick={() => setR(preg._id, op, preg.tipo)} style={{
                                    flex: 1, padding: '10px', borderRadius: 5,
                                    border: `2px solid ${resp[preg._id] === op ? (op === 'Sí' ? '#2e7d32' : ROJO) : GRIS_LN}`,
                                    background: resp[preg._id] === op ? (op === 'Sí' ? '#F0FAF2' : ROJO_CLARO) : 'white',
                                    color: resp[preg._id] === op ? (op === 'Sí' ? '#2e7d32' : ROJO) : TEXTO_S,
                                    cursor: 'pointer', fontWeight: '700', fontSize: '0.87rem',
                                    fontFamily: FONT_SANS, transition: 'all 0.15s',
                                }}>{op}</button>
                            ))}
                        </div>
                        {conds[preg._id] === 'Sí' && preg.tieneCondicional && preg.preguntasCondicionalSi?.length > 0 && (
                            <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '3px solid #2e7d32' }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.7rem', fontWeight: '700', color: '#2e7d32', fontFamily: FONT_SANS, letterSpacing: '0.3px' }}>PREGUNTAS ADICIONALES</p>
                                {preg.preguntasCondicionalSi.map((t, j) => renderSub(preg._id, 'si', j, t, preg.tiposCondicionalSi?.[j], preg.opcionesCondicionalSi?.[j]))}
                            </div>
                        )}
                        {conds[preg._id] === 'No' && preg.tieneCondicional && preg.preguntasCondicionalNo?.length > 0 && (
                            <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: `3px solid ${ROJO}` }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.7rem', fontWeight: '700', color: ROJO, fontFamily: FONT_SANS, letterSpacing: '0.3px' }}>PREGUNTAS ADICIONALES</p>
                                {preg.preguntasCondicionalNo.map((t, j) => renderSub(preg._id, 'no', j, t, preg.tiposCondicionalNo?.[j], preg.opcionesCondicionalNo?.[j]))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return (
        <div style={{ padding: '0 28px 28px' }}>
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <div style={frmCss.spinner} />
                <p style={{ margin: '14px 0 0', fontSize: '0.82rem', color: TEXTO_S, fontFamily: FONT_SANS }}>Cargando preguntas...</p>
            </div>
        </div>
    );

    // Calcular números visibles (sin contar títulos)
    let numCounter = 0;
    const preguntasConNum = preguntas.map(preg => ({
        preg, num: preg.tipo !== 'titulo' ? ++numCounter : null,
    }));
    const totalPregs = preguntasConNum.filter(x => x.num !== null).length;

    return (
        <div style={{ padding: '0 28px 28px' }}>
            <Toast mensaje={toastMsg} visible={toastVisible} onOcultar={() => setToastVisible(false)} />

            {preguntas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: TEXTO_S, fontSize: '0.85rem', fontFamily: FONT_SANS }}>
                    Esta encuesta aún no tiene preguntas configuradas.
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: TEXTO_S, fontFamily: FONT_SANS }}>
                            {totalPregs} preguntas · Los campos con <span style={{ color: ROJO, fontWeight: '700' }}>*</span> son obligatorios
                        </p>
                    </div>
                    <div style={{ height: 1, background: GRIS_LN, marginBottom: 16 }} />

                    {preguntasConNum.map(({ preg, num }) => renderP(preg, num))}

                    <div style={{ height: 1, background: GRIS_LN, margin: '8px 0 18px' }} />

                    {/* Navegación */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <button className="eg-btn-atras" onClick={onAtras} disabled={enviando} style={{
                            display: 'flex', alignItems: 'center', padding: '10px 20px',
                            background: '#F0F0F0', border: 'none', borderRadius: 6,
                            cursor: 'pointer', fontWeight: '600', fontSize: '0.84rem',
                            color: TEXTO_S, fontFamily: FONT_SANS, transition: 'background 0.15s',
                        }}>
                            <FaArrowLeft style={{ marginRight: 6, fontSize: '0.72rem' }} /> Atrás
                        </button>
                        <button className="eg-btn-enviar" onClick={enviar} disabled={enviando} style={{
                            padding: '11px 28px', background: ROJO, color: 'white',
                            border: 'none', borderRadius: 6, cursor: 'pointer',
                            fontWeight: '700', fontSize: '0.88rem', fontFamily: FONT_SANS,
                            letterSpacing: '0.3px', boxShadow: `0 4px 16px rgba(190,30,45,0.25)`,
                        }}>
                            {enviando ? 'Enviando...' : 'Enviar respuestas'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// MODAL RESPONDER
// ══════════════════════════════════════════════════════════════
const ModalResponder = ({ encuesta, onCerrar, onCompletada }) => {
    const [paso, setPaso] = useState('consentimiento');
    const enProgreso = ['consentimiento', 'info_general', 'preguntas'].includes(paso);

    return (
        <div onClick={ev => { if (ev.target === ev.currentTarget) onCerrar(); }}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '16px',
            }}>
            <div onClick={ev => ev.stopPropagation()} style={{
                background: '#F2F2F2', borderRadius: 16, width: '100%', maxWidth: 760,
                maxHeight: '92vh', overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Cabecera roja */}
                <CabeceraModal titulo={encuesta.titulo} onCerrar={onCerrar} />

                {/* Barra de pasos */}
                {enProgreso && (
                    <div style={{ background: 'white', borderBottom: `1px solid ${GRIS_LN}`, paddingBottom: 14 }}>
                        <BarraPasos paso={paso} />
                    </div>
                )}

                {/* Contenido scrollable */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {/* Pequeño espaciado superior dentro del contenido */}
                    <div style={{ paddingTop: 22 }}>
                        {paso === 'consentimiento' && (
                            <PasoConsentimiento encuesta={encuesta}
                                onAceptar={() => setPaso('info_general')}
                                onRechazar={async () => {
                                    try {
                                        await axios.post(`${API}/encuestas/${encuesta._id}/respuestas`,
                                            { aceptoConsentimiento: false, respuestas: {} },
                                            { headers: hdrs() }
                                        );
                                    } catch (e) { console.warn('Rechazo ya registrado:', e.response?.data?.msg); }
                                    setPaso('rechazado');
                                }} />
                        )}
                        {paso === 'info_general' && (
                            <PasoInfoGeneral
                                onSiguiente={() => setPaso('preguntas')}
                                onAtras={() => setPaso('consentimiento')} />
                        )}
                        {paso === 'preguntas' && (
                            <PasoPreguntas encuesta={encuesta}
                                onAtras={() => setPaso('info_general')}
                                onEnviar={() => { setPaso('enviado'); onCompletada && onCompletada(); }} />
                        )}

                        {paso === 'enviado' && (
                            <div style={{ textAlign: 'center', padding: '56px 28px' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FAF2', border: '2px solid #2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.5rem' }}>✓</div>
                                <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: '600', color: '#2e7d32', fontFamily: FONT_FORM }}>
                                    ¡Gracias por tu participación!
                                </h3>
                                <p style={{ margin: '0 0 28px', fontSize: '0.85rem', color: TEXTO_S, lineHeight: 1.7, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto', fontFamily: FONT_SANS }}>
                                    Tus respuestas han sido registradas correctamente. Tu colaboración contribuye a la mejora continua de la ESPOCH.
                                </p>
                                <div style={{ height: 1, width: 60, background: GRIS_LN, margin: '0 auto 18px' }} />
                                <button onClick={onCerrar} style={{
                                    padding: '11px 32px', background: ROJO, color: 'white',
                                    border: 'none', borderRadius: 6, cursor: 'pointer',
                                    fontWeight: '700', fontSize: '0.88rem', fontFamily: FONT_SANS,
                                    boxShadow: `0 4px 14px rgba(190,30,45,0.25)`,
                                }}>Cerrar</button>
                                <p style={{ color: '#B0B0B0', fontSize: '0.7rem', marginTop: 18, fontFamily: FONT_SANS, letterSpacing: '0.5px' }}>ESPOCH · Carrera de Software</p>
                            </div>
                        )}

                        {paso === 'rechazado' && (
                            <div style={{ textAlign: 'center', padding: '56px 28px' }}>
                                <div style={{ width: 52, height: 52, borderRadius: '50%', background: ROJO_CLARO, border: `2px solid ${ROJO}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.3rem' }}>✗</div>
                                <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: '600', color: ROJO, fontFamily: FONT_FORM }}>
                                    Participación no consentida
                                </h3>
                                <p style={{ margin: '0 0 28px', fontSize: '0.85rem', color: TEXTO_S, lineHeight: 1.7, fontFamily: FONT_SANS }}>
                                    Tu decisión ha sido registrada. No se recopilarán tus respuestas.
                                </p>
                                <button onClick={onCerrar} style={{
                                    padding: '11px 32px', background: '#F0F0F0', color: '#555',
                                    border: 'none', borderRadius: 6, cursor: 'pointer',
                                    fontWeight: '600', fontSize: '0.88rem', fontFamily: FONT_SANS,
                                }}>Cerrar</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// CSS base del formulario
// ══════════════════════════════════════════════════════════════
const frmCss = {
    spinner: {
        width: 34, height: 34,
        border: `3px solid ${GRIS_LN}`,
        borderTop: `3px solid ${ROJO}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto',
    },
};

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — SIN CAMBIOS
// ══════════════════════════════════════════════════════════════
const EncuestasGraduado = () => {
    const [encuestas, setEncuestas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState('todas');
    const [sinTesis, setSinTesis] = useState(false);
    const [encuestaActiva, setEncuestaActiva] = useState(null);

    const cargar = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const r = await axios.get(`${API}/graduado/encuestas`, { headers: hdrs() });
            setEncuestas(r.data.encuestas || []);
            setSinTesis(!r.data.tesisVerificada);
        } catch { setError('No se pudieron cargar las encuestas. Intenta de nuevo.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    const lista = encuestas.filter(enc => { const est = calcularEstado(enc); if (filtro === 'todas') return true; if (filtro === 'pendiente') return est === 'pendiente'; if (filtro === 'completada') return est === 'completada'; return true; });

    const pendientes = encuestas.filter(e => calcularEstado(e) === 'pendiente').length;
    const completadas = encuestas.filter(e => e.estadoRespuesta === 'completada').length;

    return (
        <div style={s.wrap}>
            <div style={s.cuerpo}>
                <div style={s.encabezado}>
                    <h1 style={s.tituloPag}>
                        <FaClipboardList style={{ color: 'var(--color-espoch-rojo)', fontSize: '1rem' }} />
                        Completa las encuestas asignadas y contribuye al seguimiento de graduados
                    </h1>

                </div>

                {!loading && !error && !sinTesis && (
                    <div style={s.resumenGrid}>
                        <div style={{ ...s.resumenCard, borderTop: '3px solid #f57f17' }}>
                            <span style={{ ...s.resumenNum, color: '#f57f17' }}>{pendientes}</span>
                            <span style={s.resumenLbl}>Pendientes</span>
                        </div>
                        <div style={{ ...s.resumenCard, borderTop: '3px solid #2e7d32' }}>
                            <span style={{ ...s.resumenNum, color: '#2e7d32' }}>{completadas}</span>
                            <span style={s.resumenLbl}>Completadas</span>
                        </div>
                        <div style={{ ...s.resumenCard, borderTop: '3px solid var(--color-espoch-rojo)' }}>
                            <span style={{ ...s.resumenNum, color: 'var(--color-espoch-rojo)' }}>{encuestas.length}</span>
                            <span style={s.resumenLbl}>Total asignadas</span>
                        </div>
                    </div>
                )}

                {!loading && !error && !sinTesis && (
                    <div style={s.filtros}>
                        {['todas', 'pendiente', 'completada'].map(f => (
                            <button key={f} onClick={() => setFiltro(f)} style={{
                                ...s.filtroBtn,
                                background: filtro === f ? 'var(--color-espoch-rojo)' : 'white',
                                color: filtro === f ? 'white' : '#6c757d',
                                border: filtro === f ? '1px solid var(--color-espoch-rojo)' : '1px solid #e9ecef',
                                fontWeight: filtro === f ? '700' : '500',
                            }}>{{ todas: 'Todas', pendiente: 'Pendientes', completada: 'Completadas' }[f]}</button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div style={s.estadoBox}>
                        <div style={s.spinner} />
                        <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#adb5bd' }}>Cargando encuestas...</p>
                    </div>
                )}

                {!loading && error && (
                    <div style={{ ...s.estadoBox, background: '#ffebee', border: '1px solid #ffcdd2' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#c62828', fontWeight: '600' }}>{error}</p>
                    </div>
                )}

                {!loading && !error && sinTesis && (
                    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e8eaed', padding: '44px 24px', textAlign: 'center', boxShadow: '0 1px 5px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>🎓</div>
                        <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50', fontFamily: FONT }}>Graduación no verificada</h3>
                        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#6c757d', lineHeight: 1.65, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', fontFamily: FONT }}>
                            Las encuestas están disponibles únicamente para graduados con <strong>tesis verificada</strong> por el administrador de la Carrera de Software.
                        </p>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: '#adb5bd', fontFamily: FONT }}>
                            Una vez que tu graduación sea verificada, las encuestas aparecerán aquí automáticamente.
                        </p>
                    </div>
                )}

                {!loading && !error && !sinTesis && (
                    <div style={s.lista}>
                        {lista.length === 0 ? (
                            <div style={s.emptyBox}>
                                <FaClipboardList style={{ fontSize: '2.5rem', color: '#dee2e6', marginBottom: 10 }} />
                                <p style={s.emptyTit}>{filtro === 'todas' ? 'No tienes encuestas asignadas aún' : `Sin encuestas en "${filtro}"`}</p>
                                <p style={s.emptySub}>Cuando el administrador active una encuesta aparecerá aquí.</p>
                            </div>
                        ) : lista.map(enc => {
                            const estadoKey = calcularEstado(enc);
                            const esPend = estadoKey === 'pendiente';
                            return (
                                <div key={enc._id} style={s.card}>
                                    <div style={s.cardLeft}>
                                        <h3 style={s.cardTit}>{enc.titulo}</h3>
                                        {enc.descripcion && <p style={s.cardDesc}>{enc.descripcion}</p>}
                                        <div style={s.cardMeta}>
                                            {enc.totalPreguntas > 0 && (
                                                <span style={s.metaItem}><FaClipboardList style={{ fontSize: '0.6rem' }} />{enc.totalPreguntas} preguntas</span>
                                            )}
                                            <span style={s.metaItem}><FaClock style={{ fontSize: '0.6rem' }} />Límite: {fmtFecha(enc.fechaCierre)}</span>
                                        </div>
                                    </div>
                                    <div style={s.cardRight}>
                                        {esPend
                                            ? <button onClick={() => setEncuestaActiva(enc)} style={s.btnResponder}>Responder</button>
                                            : <span style={{ padding: '9px 22px', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', borderRadius: 7, fontSize: '0.83rem', fontWeight: '700', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Completada</span>
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {encuestaActiva && (
                <ModalResponder
                    encuesta={encuestaActiva}
                    onCerrar={() => setEncuestaActiva(null)}
                    onCompletada={cargar}
                />
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// ESTILOS — parte exterior (tarjetas, filtros) sin cambios
// ══════════════════════════════════════════════════════════════
const s = {
    wrap: { minHeight: '100%', background: 'var(--color-fondo-web, #f4f5f7)', fontFamily: FONT },
    cuerpo: { maxWidth: 860, margin: '0 auto', padding: '22px 20px 50px' },
    encabezado: { marginBottom: 20 },
    tituloPag: { margin: '0 0 4px', fontSize: '1.15rem', fontWeight: '800', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 9, fontFamily: FONT },
    subtituloPag: { margin: 0, fontSize: '0.78rem', color: '#6c757d', fontFamily: FONT },
    resumenGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
    resumenCard: { background: 'white', borderRadius: 9, border: '1px solid #e8eaed', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    resumenNum: { fontSize: '1.6rem', fontWeight: '800', lineHeight: 1, fontFamily: FONT },
    resumenLbl: { fontSize: '0.73rem', color: '#6c757d', fontFamily: FONT },
    filtros: { display: 'flex', gap: 7, marginBottom: 16 },
    filtroBtn: { padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: '0.78rem', fontFamily: FONT, transition: 'all 0.15s' },
    estadoBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 20px', background: 'white', borderRadius: 10, border: '1px solid #e8eaed', textAlign: 'center' },
    spinner: { width: 32, height: 32, border: '3px solid #f0f0f0', borderTop: '3px solid var(--color-espoch-rojo)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    lista: { display: 'flex', flexDirection: 'column', gap: 12 },
    card: { background: 'white', borderRadius: 10, border: '1px solid #e8eaed', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 5px rgba(0,0,0,0.06)' },
    cardLeft: { flex: 1, minWidth: 0 },
    cardRight: { flexShrink: 0 },
    cardTit: { margin: '0 0 5px', fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', fontFamily: FONT },
    cardDesc: { margin: '0 0 9px', fontSize: '0.78rem', color: '#6c757d', lineHeight: 1.55, fontFamily: FONT },
    cardMeta: { display: 'flex', gap: 14, flexWrap: 'wrap' },
    metaItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#adb5bd', fontFamily: FONT },
    btnResponder: { padding: '9px 22px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 7, fontSize: '0.83rem', fontWeight: '700', cursor: 'pointer', fontFamily: FONT },
    emptyBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 20px', background: 'white', borderRadius: 10, border: '1px dashed #dee2e6', textAlign: 'center' },
    emptyTit: { margin: '0 0 4px', fontWeight: '700', color: '#2c3e50', fontSize: '0.9rem', fontFamily: FONT },
    emptySub: { margin: 0, fontSize: '0.75rem', color: '#adb5bd', fontFamily: FONT },
};

if (typeof document !== 'undefined' && !document.getElementById('EncuestasGraduado-styles')) {
    const st = document.createElement('style');
    st.id = 'EncuestasGraduado-styles';
    st.textContent = `
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes slideInToast { from { opacity:0; transform:translateY(20px) scale(0.96);} to { opacity:1; transform:translateY(0) scale(1);} }
    `;
    document.head.appendChild(st);
}

export default EncuestasGraduado;
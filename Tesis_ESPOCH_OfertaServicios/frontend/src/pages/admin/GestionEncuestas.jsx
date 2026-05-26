// frontend/src/pages/admin/GestionEncuestas.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { leerSesion } from '../../utils/storageSeguro';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};
const LIMIT = 10;

const CONSENTIMIENTO_DEFAULT = `Estimados graduados de la Carrera de Sistemas, Sistemas Informáticos y Software de la ESPOCH, el propósito de esta encuesta es recopilar opiniones sobre su formación académica, habilidades profesionales, empleabilidad, oportunidades de emprendimiento y continuidad de estudios, y cómo estos factores han contribuido a su inserción laboral. Toda la información que proporcione será tratada de manera confidencial. Su participación en esta encuesta es completamente voluntaria. Si tiene preguntas sobre la investigación, puede comunicarse antes, durante o después de su participación al correo: carrera.software@espoch.edu.ec. Su colaboración será de gran ayuda para mejorar nuestra oferta académica.`;

const CONSENTIMIENTO_EMPLEADORES_DEFAULT = `Sr/a. empleador/a: Consentimiento informado. El objetivo de esta encuesta es determinar las opiniones que los empleadores manifiestan en relación al desempeño profesional de los graduados de la Carrera de Software de la ESPOCH, que laboran en la organización de su dirección, posibilitando de ser pertinente cambios que conduzcan al mejoramiento continuo de la calidad en la formación de profesionales de grado. La información que nos brinde será tratada de manera confidencial. Su participación es totalmente voluntaria y puede darla por terminada en cualquier momento. Asimismo, puede plantear todas sus dudas respecto a la investigación antes, durante y después de su participación al mail carrera.software@espoch.edu.ec. La información que nos pueda brindar será de gran ayuda. Acepta participar de esta investigación:`;

// ═══════════ MODAL RESULTADO NOTIFICACIÓN ═══════════
const ModalResultadoNotificacion = ({ visible, resumen, onCerrar }) => {
    if (!visible || !resumen) return null;
    return (
        <div onClick={onCerrar} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1005 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, padding: '28px 32px', textAlign: 'center', maxWidth: 380, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
                    {resumen.emailsFallidos === 0 ? '✅' : '⚠️'}
                </div>
                <h2 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50' }}>Notificación enviada</h2>
                <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#6c757d' }}>
                    Se procesaron <strong>{resumen.total}</strong> graduados con tesis verificada.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                    <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 8, padding: '10px 8px' }}>
                        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#2e7d32' }}>{resumen.notificacionesCreadas}</p>
                        <p style={{ margin: 0, fontSize: '0.68rem', color: '#2e7d32', fontWeight: '600' }}>Notif. en app</p>
                    </div>
                    <div style={{ background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 8, padding: '10px 8px' }}>
                        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1565c0' }}>{resumen.emailsEnviados}</p>
                        <p style={{ margin: 0, fontSize: '0.68rem', color: '#1565c0', fontWeight: '600' }}>Emails enviados</p>
                    </div>
                    {resumen.emailsFallidos > 0 && (
                        <div style={{ gridColumn: '1 / -1', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '10px 8px' }}>
                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#f57f17' }}>{resumen.emailsFallidos}</p>
                            <p style={{ margin: 0, fontSize: '0.68rem', color: '#f57f17', fontWeight: '600' }}>Emails no enviados (ver consola)</p>
                        </div>
                    )}
                </div>
                <button onClick={onCerrar} style={{ padding: '8px 24px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

// ═══════════ MODAL PRÓXIMAMENTE ═══════════
const ModalProximamente = ({ visible, onCerrar }) => {
    if (!visible) return null;
    return (
        <div onClick={onCerrar} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1005 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, padding: '32px 36px', textAlign: 'center', maxWidth: 360, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>🚧</div>
                <h2 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50' }}>Próximamente</h2>
                <p style={{ margin: '0 0 20px', fontSize: '0.83rem', color: '#6c757d', lineHeight: 1.6 }}>
                    La notificación por correo a empleadores estará disponible en el siguiente sprint.
                </p>
                <button onClick={onCerrar} style={{ padding: '8px 24px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                    Entendido
                </button>
            </div>
        </div>
    );
};

// ═══════════ MODAL CONFIRMACIÓN ═══════════
const ModalConfirmar = ({ visible, titulo, mensaje, onConfirmar, onCancelar, peligroso, textoConfirmando }) => {
    const [procesando, setProcesando] = useState(false);
    if (!visible) return null;

    if (procesando) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
                <div style={{ background: 'white', borderRadius: 14, padding: '36px 40px', textAlign: 'center', maxWidth: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                    <div style={{ width: 52, height: 52, border: '5px solid #f0f0f0', borderTop: '5px solid var(--color-espoch-rojo)', borderRadius: '50%', animation: 'spin-modal 0.8s linear infinite', margin: '0 auto 18px' }} />
                    <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50' }}>{textoConfirmando || 'Procesando...'}</h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#adb5bd', lineHeight: 1.5 }}>Por favor espera, esto puede tomar unos segundos.</p>
                </div>
                <style>{`@keyframes spin-modal { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div onClick={onCancelar} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, padding: '24px 28px', textAlign: 'center', maxWidth: 350, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{peligroso ? '⚠️' : '❓'}</div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50' }}>{titulo}</h2>
                <p style={{ margin: '0 0 20px', color: '#6c757d', fontSize: '0.85rem' }}>{mensaje}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={onCancelar} style={{ padding: '8px 18px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Cancelar</button>
                    <button onClick={async () => { setProcesando(true); await onConfirmar(); setProcesando(false); }} style={{ padding: '8px 18px', background: peligroso ? '#c62828' : 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Confirmar</button>
                </div>
            </div>
        </div>
    );
};

// ═══════════ TABLA MATRIZ ═══════════
const TablaMatriz = ({ items, columnas, respuestas, onRespuesta, pregId, esOpcionMultiple }) => {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', width: '40%', color: '#555', fontWeight: '600' }}></th>
                        {columnas.map((col, i) => (
                            <th key={i} style={{ padding: '8px 6px', textAlign: 'center', color: '#555', fontWeight: '700', minWidth: 60 }}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, rowIdx) => {
                        const itemId = `${pregId}_item_${rowIdx}`;
                        return (
                            <tr key={rowIdx} style={{ borderBottom: '1px solid #f0f0f0', background: rowIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px', fontSize: '0.78rem', fontWeight: '600', color: '#2c3e50', lineHeight: 1.4 }}>{item}</td>
                                {columnas.map((col, colIdx) => {
                                    const val = esOpcionMultiple ? col : colIdx + 1;
                                    const sel = respuestas[itemId] === val;
                                    return (
                                        <td key={colIdx} style={{ padding: '10px 6px', textAlign: 'center' }}>
                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <input type="radio" name={itemId} checked={sel} onChange={() => onRespuesta(itemId, val)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-espoch-rojo)' }} />
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
};

// ═══════════ MODAL VISTA PREVIA ═══════════
const ModalVistaPrevia = ({ visible, encuesta, onCerrar }) => {
    const [preguntas, setPreguntas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paso, setPaso] = useState('consentimiento');
    const [consentimiento, setConsentimiento] = useState(null);
    const [respuestas, setRespuestas] = useState({});
    const [condicionalesVisibles, setCondicionalesVisibles] = useState({});

    useEffect(() => {
        if (visible && encuesta?._id) {
            cargarPreguntas();
            setPaso('consentimiento');
            setConsentimiento(null);
            setRespuestas({});
            setCondicionalesVisibles({});
        }
    }, [visible, encuesta]);

    const cargarPreguntas = async () => {
        setLoading(true);
        try {
            const resp = await axios.get(`${API}/encuestas/${encuesta._id}/preguntas`, { headers: hdrs() });
            setPreguntas((resp.data || []).sort((a, b) => (a.orden || 0) - (b.orden || 0)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const manejarConsentimiento = (acepto) => {
        setConsentimiento(acepto);
        if (acepto) setPaso('preguntas');
        else setPaso('enviado');
    };

    const manejarRespuesta = (pregId, valor, tipo) => {
        setRespuestas((prev) => ({ ...prev, [pregId]: valor }));
        if (tipo === 'si_no') setCondicionalesVisibles((prev) => ({ ...prev, [pregId]: valor }));
    };

    const manejarCheckbox = (pregId, opcion) => {
        setRespuestas((prev) => {
            const actual = prev[pregId] || [];
            if (actual.includes(opcion)) return { ...prev, [pregId]: actual.filter((o) => o !== opcion) };
            return { ...prev, [pregId]: [...actual, opcion] };
        });
    };

    const renderPregunta = (preg, idx) => {
        const base = { marginBottom: 14, padding: '12px 14px', background: 'white', border: '1px solid #e9ecef', borderRadius: 8 };

        if (preg.tipo === 'titulo') {
            return (
                <div key={preg._id || idx} style={{ marginBottom: 10, padding: '14px 16px', background: '#f0f0f0', borderRadius: 8, borderLeft: '4px solid var(--color-espoch-rojo)' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1a1a2e', textDecoration: 'underline', textUnderlineOffset: 4, letterSpacing: '0.02em' }}>{preg.texto}</p>
                </div>
            );
        }

        const esMatriz = preg.esMatriz && preg.items && preg.items.length > 0;
        if (esMatriz) {
            const columnas = preg.tipo === 'escala' ? [1, 2, 3, 4, 5] : (preg.opciones || []);
            return (
                <div key={preg._id || idx} style={base}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' }}>
                        <span style={{ color: 'var(--color-espoch-rojo)', marginRight: 6 }}>{idx + 1}.</span>
                        {preg.texto}
                        {preg.obligatoria && <span style={{ color: '#c62828', marginLeft: 4 }}>*</span>}
                    </p>
                    {preg.descripcionMatriz && <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#666', lineHeight: 1.4 }}>{preg.descripcionMatriz}</p>}
                    {preg.tipo === 'escala' && (
                        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                            {preg.etiquetaMin && <span style={{ fontSize: '0.7rem', color: '#adb5bd' }}>1 = {preg.etiquetaMin}</span>}
                            {preg.etiquetaMax && <span style={{ fontSize: '0.7rem', color: '#adb5bd' }}>5 = {preg.etiquetaMax}</span>}
                        </div>
                    )}
                    <TablaMatriz items={preg.items} columnas={columnas} respuestas={respuestas} onRespuesta={(itemId, val) => manejarRespuesta(itemId, val, preg.tipo)} pregId={preg._id || idx} esOpcionMultiple={preg.tipo === 'opcion_multiple'} />
                </div>
            );
        }

        return (
            <div key={preg._id || idx} style={base}>
                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '600', color: '#2c3e50' }}>
                    <span style={{ color: 'var(--color-espoch-rojo)', marginRight: 6 }}>{idx + 1}.</span>
                    {preg.texto}
                    {preg.obligatoria && <span style={{ color: '#c62828', marginLeft: 4 }}>*</span>}
                </p>
                {preg.tipo === 'texto_libre' && <textarea value={respuestas[preg._id] || ''} onChange={(e) => manejarRespuesta(preg._id, e.target.value, preg.tipo)} placeholder="Escribe tu respuesta..." style={{ width: '100%', padding: '8px', border: '1px solid #dee2e6', borderRadius: 5, fontSize: '0.8rem', minHeight: 60, outline: 'none', resize: 'vertical' }} />}
                {preg.tipo === 'numero' && (
                    <input
                        type="number"
                        value={respuestas[preg._id] || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (/^\d+$/.test(val) && parseInt(val) >= 0)) {
                                manejarRespuesta(preg._id, val, preg.tipo);
                            }
                        }}
                        placeholder="Ingresa un número..."
                        min="0"
                        style={{
                            width: '100%', padding: '8px', border: '1px solid #dee2e6',
                            borderRadius: 5, fontSize: '0.8rem', outline: 'none'
                        }}
                    />
                )}
                {preg.tipo === 'opcion_multiple' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(preg.opciones || []).map((op, i) => (
                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 5, background: respuestas[preg._id] === op ? '#ffebee' : '#f8f9fa', border: `1px solid ${respuestas[preg._id] === op ? 'var(--color-espoch-rojo)' : '#e9ecef'}`, fontSize: '0.8rem' }}>
                                <input type="radio" name={preg._id} value={op} checked={respuestas[preg._id] === op} onChange={() => manejarRespuesta(preg._id, op, preg.tipo)} style={{ accentColor: 'var(--color-espoch-rojo)' }} />
                                {op}
                            </label>
                        ))}
                    </div>
                )}
                {preg.tipo === 'checkboxes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(preg.opciones || []).map((op, i) => {
                            const sel = (respuestas[preg._id] || []).includes(op);
                            return (
                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 5, background: sel ? '#ffebee' : '#f8f9fa', border: `1px solid ${sel ? 'var(--color-espoch-rojo)' : '#e9ecef'}`, fontSize: '0.8rem' }}>
                                    <input type="checkbox" checked={sel} onChange={() => manejarCheckbox(preg._id, op)} style={{ accentColor: 'var(--color-espoch-rojo)' }} />
                                    {op}
                                </label>
                            );
                        })}
                    </div>
                )}
                {preg.tipo === 'escala' && (
                    <div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '6px 0' }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} onClick={() => manejarRespuesta(preg._id, n, preg.tipo)} style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${respuestas[preg._id] === n ? 'var(--color-espoch-rojo)' : '#dee2e6'}`, background: respuestas[preg._id] === n ? 'var(--color-espoch-rojo)' : 'white', color: respuestas[preg._id] === n ? 'white' : '#666', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>{n}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#adb5bd' }}>
                            <span>{preg.etiquetaMin || 'Muy malo'}</span><span>{preg.etiquetaMax || 'Excelente'}</span>
                        </div>
                    </div>
                )}
                {preg.tipo === 'si_no' && (
                    <div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['Sí', 'No'].map((op) => (
                                <button key={op} onClick={() => manejarRespuesta(preg._id, op, preg.tipo)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: `2px solid ${respuestas[preg._id] === op ? (op === 'Sí' ? '#2e7d32' : '#c62828') : '#dee2e6'}`, background: respuestas[preg._id] === op ? (op === 'Sí' ? '#e8f5e9' : '#ffebee') : 'white', color: respuestas[preg._id] === op ? (op === 'Sí' ? '#2e7d32' : '#c62828') : '#666', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>{op}</button>
                            ))}
                        </div>
                        {condicionalesVisibles[preg._id] === 'Sí' && preg.tieneCondicional && preg.preguntasCondicionalSi?.length > 0 && (
                            <div style={{ marginTop: 10, paddingLeft: 10, borderLeft: '3px solid #2e7d32' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '0.7rem', fontWeight: '700', color: '#2e7d32' }}>Preguntas adicionales:</p>
                                {preg.preguntasCondicionalSi.map((subTexto, j) => renderSubPregunta(preg._id, 'si', j, subTexto, preg.tiposCondicionalSi?.[j], preg.opcionesCondicionalSi?.[j]))}
                            </div>
                        )}
                        {condicionalesVisibles[preg._id] === 'No' && preg.tieneCondicional && preg.preguntasCondicionalNo?.length > 0 && (
                            <div style={{ marginTop: 10, paddingLeft: 10, borderLeft: '3px solid #c62828' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '0.7rem', fontWeight: '700', color: '#c62828' }}>Preguntas adicionales:</p>
                                {preg.preguntasCondicionalNo.map((subTexto, j) => renderSubPregunta(preg._id, 'no', j, subTexto, preg.tiposCondicionalNo?.[j], preg.opcionesCondicionalNo?.[j]))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderSubPregunta = (pregPadreId, lado, idx, texto, tipo, opciones) => {
        const subId = `${pregPadreId}_${lado}_${idx}`;
        return (
            <div key={subId} style={{ marginBottom: 8, padding: '8px 10px', background: lado === 'si' ? '#f1f8e9' : '#fff3e0', border: `1px solid ${lado === 'si' ? '#c5e1a5' : '#ffcc80'}`, borderRadius: 5 }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: '600', color: '#2c3e50' }}>{texto}</p>
                {tipo === 'texto_libre' && <textarea value={respuestas[subId] || ''} onChange={(e) => manejarRespuesta(subId, e.target.value, tipo)} placeholder="Escribe tu respuesta..." style={{ width: '100%', padding: '6px', border: '1px solid #dee2e6', borderRadius: 4, fontSize: '0.75rem', minHeight: 40, outline: 'none', resize: 'vertical' }} />}
                {tipo === 'opcion_multiple' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(opciones || []).map((op, k) => (
                            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.75rem' }}>
                                <input type="radio" name={subId} value={op} checked={respuestas[subId] === op} onChange={() => manejarRespuesta(subId, op, tipo)} style={{ accentColor: 'var(--color-espoch-rojo)' }} />
                                {op}
                            </label>
                        ))}
                    </div>
                )}
                {tipo === 'escala' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} onClick={() => manejarRespuesta(subId, n, tipo)} style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${respuestas[subId] === n ? 'var(--color-espoch-rojo)' : '#dee2e6'}`, background: respuestas[subId] === n ? 'var(--color-espoch-rojo)' : 'white', color: respuestas[subId] === n ? 'white' : '#666', cursor: 'pointer', fontWeight: '700', fontSize: '0.7rem' }}>{n}</button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (!visible) return null;

    return (
        <div onClick={onCerrar} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#f5f6f7', borderRadius: 14, width: '95%', maxWidth: 780, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}>
                <div style={{ padding: '14px 18px', background: 'var(--color-espoch-rojo)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '14px 14px 0 0' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>👁️ VISTA PREVIA — así lo verá el encuestado</p>
                        <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'white' }}>{encuesta?.titulo}</h2>
                    </div>
                    <button onClick={onCerrar} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', width: 30, height: 30, cursor: 'pointer', fontSize: '1rem', fontWeight: '700' }}>×</button>
                </div>
                <div style={{ padding: '18px' }}>
                    {paso === 'consentimiento' && (
                        <div style={{ background: 'white', borderRadius: 10, padding: '20px', border: '1px solid #e9ecef' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '2px solid #f0f0f0' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff8e1', border: '2px solid #f57f17', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📋</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#2c3e50' }}>Consentimiento Informado</h3>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#adb5bd' }}>Lea detenidamente antes de participar</p>
                                </div>
                            </div>
                            <div style={{ background: '#fafafa', border: '1px solid #e9ecef', borderRadius: 8, padding: '14px', marginBottom: 16, lineHeight: 1.6 }}>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#444', textAlign: 'justify' }}>{encuesta?.consentimientoInformado}</p>
                            </div>
                            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50', textAlign: 'center' }}>Acepto participar en esta investigación:</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => manejarConsentimiento(true)} style={{ flex: 1, padding: '12px', background: '#e8f5e9', border: '2px solid #2e7d32', borderRadius: 8, cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: '#2e7d32' }}>Sí, acepto participar</button>
                                <button onClick={() => manejarConsentimiento(false)} style={{ flex: 1, padding: '12px', background: '#ffebee', border: '2px solid #c62828', borderRadius: 8, cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: '#c62828' }}>No, no acepto</button>
                            </div>
                        </div>
                    )}
                    {paso === 'preguntas' && (
                        <div>
                            <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span></span>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#2e7d32', fontWeight: '600' }}>Consentimiento aceptado — puedes responder la encuesta</p>
                            </div>
                            {loading ? <p style={{ textAlign: 'center', color: '#adb5bd', padding: 20 }}>Cargando preguntas...</p>
                                : preguntas.length === 0
                                    ? <div style={{ background: 'white', borderRadius: 8, padding: 20, textAlign: 'center', border: '1px solid #e9ecef' }}><p style={{ color: '#adb5bd', fontSize: '0.85rem' }}>⚠️ Esta encuesta aún no tiene preguntas</p></div>
                                    : (
                                        <>
                                            {preguntas.map((preg, idx) => renderPregunta(preg, idx))}
                                            <button style={{ width: '100%', marginTop: 6, padding: '12px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }} onClick={() => setPaso('enviado')}>Enviar respuestas</button>
                                        </>
                                    )}
                        </div>
                    )}
                    {paso === 'enviado' && (
                        <div style={{ background: 'white', borderRadius: 10, padding: '30px 20px', textAlign: 'center', border: '1px solid #e9ecef' }}>
                            {consentimiento
                                ? <><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div><h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: '700', color: '#2e7d32' }}>¡Respuestas enviadas!</h3><p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#666' }}>Gracias por tu participación. Tu información ha sido registrada correctamente (Modo Simulación).</p></>
                                : <><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📋</div><h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: '700', color: '#c62828' }}>Participación no consentida</h3><p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#666' }}>Tu decisión ha sido registrada. No se recopilarán tus respuestas.</p></>
                            }
                            <button onClick={() => { setPaso('consentimiento'); setConsentimiento(null); setRespuestas({}); setCondicionalesVisibles({}); }} style={{ padding: '8px 20px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', color: '#555' }}>↺ Ver desde el inicio</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════ SECCIÓN ITEMS MATRIZ ═══════════
const SeccionItemsMatriz = ({ items, onChange, placeholder = 'Ej: OE 01. Trabajar en equipos...' }) => {
    const agregar = () => onChange([...items, '']);
    const eliminar = (i) => onChange(items.filter((_, j) => j !== i));
    const cambiar = (i, val) => { const tmp = [...items]; tmp[i] = val; onChange(tmp); };
    return (
        <div style={{ marginTop: 10 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 6, color: '#2c3e50' }}>
                📋 Ítems / filas de la tabla *
                <span style={{ fontWeight: '400', color: '#adb5bd', marginLeft: 6 }}>— cada ítem es una fila</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', color: '#888', flexShrink: 0 }}>{i + 1}</div>
                        <input type="text" value={item} onChange={(e) => cambiar(i, e.target.value)} placeholder={placeholder} style={{ flex: 1, padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: 5, fontSize: '0.78rem', outline: 'none' }} />
                        {items.length > 1 && <button onClick={() => eliminar(i)} style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: '0.6rem', flexShrink: 0 }}>✕</button>}
                    </div>
                ))}
            </div>
            <button onClick={agregar} style={{ marginTop: 8, fontSize: '0.72rem', padding: '6px 10px', background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 4, cursor: 'pointer', fontWeight: '600' }}>+ Agregar ítem</button>
        </div>
    );
};

// ═══════════ FORMULARIO PREGUNTA ═══════════
const FormularioPregunta = ({ visible, encuestaId, preguntaEditar, onGuardar, onCerrar }) => {
    const esEdicion = !!preguntaEditar;
    const estadoInicial = {
        texto: '', tipo: 'opcion_multiple', opciones: ['', ''], obligatoria: true,
        esMatriz: false, items: [''], descripcionMatriz: '', etiquetaMin: '', etiquetaMax: '',
        tieneCondicional: false,
        preguntasCondicionalSi: [''], tiposCondicionalSi: ['texto_libre'], opcionesCondicionalSi: [[]],
        preguntasCondicionalNo: [''], tiposCondicionalNo: ['texto_libre'], opcionesCondicionalNo: [[]],
    };
    const [form, setForm] = useState(estadoInicial);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const tiposDisponibles = [
        { value: 'texto_libre', label: 'Texto libre' },
        { value: 'opcion_multiple', label: 'Opción múltiple' },
        { value: 'escala', label: 'Escala 1-5' },
        { value: 'checkboxes', label: 'Selección múltiple' },
        { value: 'numero', label: 'Número entero' },
    ];

    useEffect(() => {
        if (preguntaEditar) {
            setForm({
                texto: preguntaEditar.texto || '', tipo: preguntaEditar.tipo || 'opcion_multiple',
                opciones: preguntaEditar.opciones?.length >= 2 ? preguntaEditar.opciones : ['', ''],
                obligatoria: preguntaEditar.obligatoria ?? true,
                esMatriz: preguntaEditar.esMatriz || false,
                items: preguntaEditar.items?.length > 0 ? preguntaEditar.items : [''],
                descripcionMatriz: preguntaEditar.descripcionMatriz || '',
                etiquetaMin: preguntaEditar.etiquetaMin || '', etiquetaMax: preguntaEditar.etiquetaMax || '',
                tieneCondicional: preguntaEditar.tieneCondicional || false,
                preguntasCondicionalSi: preguntaEditar.preguntasCondicionalSi?.length > 0 ? preguntaEditar.preguntasCondicionalSi : [''],
                tiposCondicionalSi: preguntaEditar.tiposCondicionalSi?.length > 0 ? preguntaEditar.tiposCondicionalSi : ['texto_libre'],
                opcionesCondicionalSi: preguntaEditar.opcionesCondicionalSi?.length > 0 ? preguntaEditar.opcionesCondicionalSi : [[]],
                preguntasCondicionalNo: preguntaEditar.preguntasCondicionalNo?.length > 0 ? preguntaEditar.preguntasCondicionalNo : [''],
                tiposCondicionalNo: preguntaEditar.tiposCondicionalNo?.length > 0 ? preguntaEditar.tiposCondicionalNo : ['texto_libre'],
                opcionesCondicionalNo: preguntaEditar.opcionesCondicionalNo?.length > 0 ? preguntaEditar.opcionesCondicionalNo : [[]],
            });
        } else { setForm(estadoInicial); }
        setError('');
    }, [preguntaEditar, visible]);

    const agregarFila = (lado) => {
        if (lado === 'si') setForm((f) => ({ ...f, preguntasCondicionalSi: [...f.preguntasCondicionalSi, ''], tiposCondicionalSi: [...f.tiposCondicionalSi, 'texto_libre'], opcionesCondicionalSi: [...f.opcionesCondicionalSi, []] }));
        else setForm((f) => ({ ...f, preguntasCondicionalNo: [...f.preguntasCondicionalNo, ''], tiposCondicionalNo: [...f.tiposCondicionalNo, 'texto_libre'], opcionesCondicionalNo: [...f.opcionesCondicionalNo, []] }));
    };
    const eliminarFila = (lado, idx) => {
        if (lado === 'si') setForm((f) => ({ ...f, preguntasCondicionalSi: f.preguntasCondicionalSi.filter((_, i) => i !== idx), tiposCondicionalSi: f.tiposCondicionalSi.filter((_, i) => i !== idx), opcionesCondicionalSi: f.opcionesCondicionalSi.filter((_, i) => i !== idx) }));
        else setForm((f) => ({ ...f, preguntasCondicionalNo: f.preguntasCondicionalNo.filter((_, i) => i !== idx), tiposCondicionalNo: f.tiposCondicionalNo.filter((_, i) => i !== idx), opcionesCondicionalNo: f.opcionesCondicionalNo.filter((_, i) => i !== idx) }));
    };
    const cambiarTextoCond = (lado, idx, val) => {
        if (lado === 'si') { const tmp = [...form.preguntasCondicionalSi]; tmp[idx] = val; setForm((f) => ({ ...f, preguntasCondicionalSi: tmp })); }
        else { const tmp = [...form.preguntasCondicionalNo]; tmp[idx] = val; setForm((f) => ({ ...f, preguntasCondicionalNo: tmp })); }
    };
    const cambiarTipoCond = (lado, idx, val) => {
        if (lado === 'si') { const tmp = [...form.tiposCondicionalSi]; tmp[idx] = val; setForm((f) => ({ ...f, tiposCondicionalSi: tmp })); }
        else { const tmp = [...form.tiposCondicionalNo]; tmp[idx] = val; setForm((f) => ({ ...f, tiposCondicionalNo: tmp })); }
    };
    const agregarOpcionCond = (lado, idx) => {
        if (lado === 'si') { const tmp = form.opcionesCondicionalSi.map((a) => [...a]); tmp[idx] = [...(tmp[idx] || []), '']; setForm((f) => ({ ...f, opcionesCondicionalSi: tmp })); }
        else { const tmp = form.opcionesCondicionalNo.map((a) => [...a]); tmp[idx] = [...(tmp[idx] || []), '']; setForm((f) => ({ ...f, opcionesCondicionalNo: tmp })); }
    };
    const cambiarOpcionCond = (lado, idx, j, val) => {
        if (lado === 'si') { const tmp = form.opcionesCondicionalSi.map((a) => [...a]); tmp[idx][j] = val; setForm((f) => ({ ...f, opcionesCondicionalSi: tmp })); }
        else { const tmp = form.opcionesCondicionalNo.map((a) => [...a]); tmp[idx][j] = val; setForm((f) => ({ ...f, opcionesCondicionalNo: tmp })); }
    };
    const eliminarOpcionCond = (lado, idx, j) => {
        if (lado === 'si') { const tmp = form.opcionesCondicionalSi.map((a) => [...a]); tmp[idx] = tmp[idx].filter((_, k) => k !== j); setForm((f) => ({ ...f, opcionesCondicionalSi: tmp })); }
        else { const tmp = form.opcionesCondicionalNo.map((a) => [...a]); tmp[idx] = tmp[idx].filter((_, k) => k !== j); setForm((f) => ({ ...f, opcionesCondicionalNo: tmp })); }
    };

    const manejarGuardar = async () => {
        setError('');
        if (!form.texto.trim()) { setError('Texto obligatorio'); return; }
        if (form.tipo === 'opcion_multiple' && !form.esMatriz && form.opciones.filter((o) => o.trim()).length < 2) { setError('Mín 2 opciones'); return; }
        if (form.tipo === 'opcion_multiple' && form.esMatriz && form.opciones.filter((o) => o.trim()).length < 2) { setError('Mín 2 opciones compartidas para la tabla'); return; }
        if (form.esMatriz && form.items.filter((i) => i.trim()).length < 1) { setError('Agrega al menos 1 ítem a la tabla'); return; }
        if (form.tipo === 'si_no' && form.tieneCondicional && form.preguntasCondicionalSi.filter((p) => p.trim()).length === 0) { setError('Debe haber al menos 1 pregunta en el lado SÍ'); return; }

        setGuardando(true);
        try {
            const esCond = form.tipo === 'si_no' && form.tieneCondicional;
            const payload = {
                texto: form.texto.trim(), tipo: form.tipo,
                opciones: (form.tipo === 'opcion_multiple' || form.tipo === 'checkboxes') ? form.opciones.filter((o) => o.trim()) : (form.tipo === 'si_no' ? ['Sí', 'No'] : []),
                obligatoria: form.obligatoria,
                esMatriz: (form.tipo === 'escala' || form.tipo === 'opcion_multiple') ? form.esMatriz : false,
                items: form.esMatriz ? form.items.filter((i) => i.trim()) : [],
                descripcionMatriz: form.esMatriz ? form.descripcionMatriz.trim() : '',
                etiquetaMin: form.tipo === 'escala' ? form.etiquetaMin.trim() : '',
                etiquetaMax: form.tipo === 'escala' ? form.etiquetaMax.trim() : '',
                tieneCondicional: esCond,
                preguntasCondicionalSi: esCond ? form.preguntasCondicionalSi.filter((p) => p.trim()) : [],
                tiposCondicionalSi: esCond ? form.tiposCondicionalSi.slice(0, form.preguntasCondicionalSi.filter((p) => p.trim()).length) : [],
                opcionesCondicionalSi: esCond ? form.opcionesCondicionalSi.slice(0, form.preguntasCondicionalSi.filter((p) => p.trim()).length) : [],
                preguntasCondicionalNo: esCond ? form.preguntasCondicionalNo.filter((p) => p.trim()) : [],
                tiposCondicionalNo: esCond ? form.tiposCondicionalNo.slice(0, form.preguntasCondicionalNo.filter((p) => p.trim()).length) : [],
                opcionesCondicionalNo: esCond ? form.opcionesCondicionalNo.slice(0, form.preguntasCondicionalNo.filter((p) => p.trim()).length) : [],
            };
            if (esEdicion) await axios.patch(`${API}/preguntas/${preguntaEditar._id}`, payload, { headers: hdrs() });
            else await axios.post(`${API}/encuestas/${encuestaId}/preguntas`, payload, { headers: hdrs() });
            onGuardar();
            setForm(estadoInicial);
        } catch (e) { setError(e.response?.data?.msg || 'Error al guardar'); }
        finally { setGuardando(false); }
    };

    const soportaMatriz = form.tipo === 'escala' || form.tipo === 'opcion_multiple';
    const esTitulo = form.tipo === 'titulo';

    const renderColumna = (lado) => {
        const esSi = lado === 'si';
        const preguntas = esSi ? form.preguntasCondicionalSi : form.preguntasCondicionalNo;
        const tipos = esSi ? form.tiposCondicionalSi : form.tiposCondicionalNo;
        const opciones = esSi ? form.opcionesCondicionalSi : form.opcionesCondicionalNo;
        const color = esSi ? '#2e7d32' : '#c62828';
        const bg = esSi ? '#e8f5e9' : '#ffebee';
        const border = esSi ? '#c8e6c9' : '#ffcdd2';
        return (
            <div style={{ padding: 10, background: bg, border: `2px solid ${border}`, borderRadius: 6 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: '700', color, textAlign: 'center' }}>{esSi ? 'SI RESPONDE SÍ' : 'SI RESPONDE NO'}</h4>
                {preguntas.map((preg, i) => (
                    <div key={i} style={{ marginBottom: 10, padding: 8, background: 'white', border: `1px solid ${border}`, borderRadius: 4 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            <input type="text" value={preg} onChange={(e) => cambiarTextoCond(lado, i, e.target.value)} placeholder="Escribe la pregunta..." style={{ flex: 1, padding: '6px 8px', border: `1px solid ${border}`, borderRadius: 3, fontSize: '0.75rem', outline: 'none' }} />
                            {preguntas.length > 1 && <button onClick={() => eliminarFila(lado, i)} style={{ width: 24, height: 24, borderRadius: 3, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: '0.6rem' }}>✕</button>}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', marginBottom: 3, color }}>Tipo:</label>
                            <select value={tipos[i] || 'texto_libre'} onChange={(e) => cambiarTipoCond(lado, i, e.target.value)} style={{ width: '100%', padding: '4px 6px', border: `1px solid ${border}`, borderRadius: 3, fontSize: '0.7rem', outline: 'none' }}>
                                {tiposDisponibles.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        {(tipos[i] === 'opcion_multiple' || tipos[i] === 'checkboxes') && (
                            <div style={{ marginTop: 6 }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', marginBottom: 2, color }}>Opciones:</label>
                                {(opciones[i] || []).map((op, j) => (
                                    <div key={j} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                        <input type="text" value={op} onChange={(e) => cambiarOpcionCond(lado, i, j, e.target.value)} placeholder={`Opción ${j + 1}`} style={{ flex: 1, padding: '4px 6px', border: `1px solid ${border}`, borderRadius: 3, fontSize: '0.7rem', outline: 'none' }} />
                                        {(opciones[i] || []).length > 1 && <button onClick={() => eliminarOpcionCond(lado, i, j)} style={{ width: 20, height: 20, borderRadius: 2, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: '0.5rem' }}>✕</button>}
                                    </div>
                                ))}
                                <button onClick={() => agregarOpcionCond(lado, i)} style={{ fontSize: '0.65rem', padding: '3px 6px', background: 'white', color, border: `1px solid ${border}`, borderRadius: 3, cursor: 'pointer', fontWeight: '600' }}>+ Opción</button>
                            </div>
                        )}
                    </div>
                ))}
                <button onClick={() => agregarFila(lado)} style={{ fontSize: '0.7rem', padding: '6px 8px', background: border, color, border: `1px solid ${color}`, borderRadius: 4, cursor: 'pointer', fontWeight: '700', width: '100%' }}>+ Agregar pregunta en {esSi ? 'SÍ' : 'NO'}</button>
            </div>
        );
    };

    if (!visible) return null;

    return (
        <div onClick={onCerrar} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1003 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '95%', maxWidth: 750, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '2px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{esEdicion ? '✏️ Editar Pregunta' : '➕ Agregar Pregunta'}</h2>
                    <button onClick={onCerrar} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#adb5bd' }}>×</button>
                </div>
                <div style={{ padding: '16px 20px' }}>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>
                            {esTitulo ? 'Texto del título de sección *' : form.esMatriz ? 'Pregunta *' : 'Pregunta *'}
                        </label>
                        <textarea value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder={form.esMatriz ? 'Ej: Evaluación de Objetivos Educacionales' : 'Ej: ¿Usted trabaja actualmente?'} style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.85rem', minHeight: 60, outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>Tipo *</label>
                        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value, esMatriz: false })} style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }}>
                            <option value="titulo">Título de sección</option>
                            <option value="opcion_multiple">Opción múltiple</option>
                            <option value="si_no">Sí/No</option>
                            <option value="escala">Escala 1-5</option>
                            <option value="texto_libre">Texto libre</option>
                            <option value="checkboxes">Selección múltiple</option>
                            <option value="numero">Número entero</option>
                        </select>
                    </div>
                    {soportaMatriz && !esTitulo && (
                        <div style={{ marginBottom: 12, padding: '10px 14px', background: form.esMatriz ? '#e8f0fe' : '#f8f9fa', border: `1px solid ${form.esMatriz ? '#3d5afe' : '#dee2e6'}`, borderRadius: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <div onClick={() => setForm((f) => ({ ...f, esMatriz: !f.esMatriz }))} style={{ width: 42, height: 24, borderRadius: 12, background: form.esMatriz ? '#3d5afe' : '#ccc', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                                    <div style={{ position: 'absolute', top: 3, left: form.esMatriz ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: form.esMatriz ? '#1a237e' : '#555' }}>{form.esMatriz ? 'Modo tabla / matriz activado' : 'Activar modo tabla / matriz'}</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>{form.tipo === 'escala' ? 'Permite evaluar múltiples ítems con escala 1-5 en una tabla' : 'Permite evaluar múltiples ítems con las mismas opciones en una tabla'}</p>
                                </div>
                            </label>
                        </div>
                    )}
                    {form.tipo === 'opcion_multiple' && !form.esMatriz && (
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>Opciones *</label>
                            {form.opciones.map((op, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                    <input type="text" value={op} onChange={(e) => { const tmp = [...form.opciones]; tmp[i] = e.target.value; setForm({ ...form, opciones: tmp }); }} placeholder={`Opción ${i + 1}`} style={{ flex: 1, padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 4, fontSize: '0.8rem', outline: 'none' }} />
                                    {form.opciones.length > 2 && <button onClick={() => setForm({ ...form, opciones: form.opciones.filter((_, j) => j !== i) })} style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>}
                                </div>
                            ))}
                            <button onClick={() => setForm({ ...form, opciones: [...form.opciones, ''] })} style={{ fontSize: '0.75rem', padding: '6px 10px', background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 4, cursor: 'pointer', fontWeight: '600' }}>+ Opción</button>
                        </div>
                    )}
                    {form.tipo === 'checkboxes' && (
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>Opciones de selección múltiple *<span style={{ fontWeight: '400', color: '#adb5bd', marginLeft: 6 }}>— el encuestado puede marcar varias</span></label>
                            {form.opciones.map((op, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                    <input type="text" value={op} onChange={(e) => { const tmp = [...form.opciones]; tmp[i] = e.target.value; setForm({ ...form, opciones: tmp }); }} placeholder={`Opción ${i + 1}`} style={{ flex: 1, padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 4, fontSize: '0.8rem', outline: 'none' }} />
                                    {form.opciones.length > 2 && <button onClick={() => setForm({ ...form, opciones: form.opciones.filter((_, j) => j !== i) })} style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>}
                                </div>
                            ))}
                            <button onClick={() => setForm({ ...form, opciones: [...form.opciones, ''] })} style={{ fontSize: '0.75rem', padding: '6px 10px', background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 4, cursor: 'pointer', fontWeight: '600' }}>+ Opción</button>
                        </div>
                    )}
                    {form.esMatriz && (
                        <div style={{ marginBottom: 12, padding: '14px', background: '#f8f9ff', border: '1px solid #c5cae9', borderRadius: 8 }}>
                            
                            {form.tipo === 'escala' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: 4, color: '#555' }}>Etiqueta valor 1</label>
                                        <input type="text" value={form.etiquetaMin} onChange={(e) => setForm({ ...form, etiquetaMin: e.target.value })} placeholder="Ej: Excelente" style={{ width: '100%', padding: '7px 10px', border: '1px solid #c5cae9', borderRadius: 4, fontSize: '0.78rem', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: 4, color: '#555' }}>Etiqueta valor 5</label>
                                        <input type="text" value={form.etiquetaMax} onChange={(e) => setForm({ ...form, etiquetaMax: e.target.value })} placeholder="Ej: Insuficiente" style={{ width: '100%', padding: '7px 10px', border: '1px solid #c5cae9', borderRadius: 4, fontSize: '0.78rem', outline: 'none' }} />
                                    </div>
                                </div>
                            )}
                            {form.tipo === 'opcion_multiple' && (
                                <div style={{ marginBottom: 10 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: 6, color: '#555' }}>Opciones compartidas (columnas de la tabla) *</label>
                                    {form.opciones.map((op, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', color: '#3d5afe', flexShrink: 0 }}>{i + 1}</div>
                                            <input type="text" value={op} onChange={(e) => { const tmp = [...form.opciones]; tmp[i] = e.target.value; setForm({ ...form, opciones: tmp }); }} placeholder={`Opción ${i + 1}`} style={{ flex: 1, padding: '6px 10px', border: '1px solid #c5cae9', borderRadius: 4, fontSize: '0.78rem', outline: 'none' }} />
                                            {form.opciones.length > 2 && <button onClick={() => setForm({ ...form, opciones: form.opciones.filter((_, j) => j !== i) })} style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: '0.6rem' }}>✕</button>}
                                        </div>
                                    ))}
                                    <button onClick={() => setForm({ ...form, opciones: [...form.opciones, ''] })} style={{ marginTop: 4, fontSize: '0.72rem', padding: '5px 9px', background: '#e8eaf6', color: '#3d5afe', border: '1px solid #c5cae9', borderRadius: 4, cursor: 'pointer', fontWeight: '600' }}>+ Columna</button>
                                </div>
                            )}
                            <SeccionItemsMatriz items={form.items} onChange={(newItems) => setForm((f) => ({ ...f, items: newItems }))} />
                            {form.items.filter(i => i.trim()).length > 0 && (
                                <div style={{ marginTop: 12, padding: '10px', background: 'white', border: '1px solid #c5cae9', borderRadius: 6 }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '0.7rem', fontWeight: '700', color: '#3d5afe' }}>👁️ Previsualización</p>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #e8eaf6' }}>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', width: '40%' }}></th>
                                                    {(form.tipo === 'escala' ? [1, 2, 3, 4, 5] : form.opciones.filter(o => o.trim())).map((col, i) => (
                                                        <th key={i} style={{ padding: '4px 6px', textAlign: 'center', color: '#3d5afe', minWidth: 36 }}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.items.filter(i => i.trim()).map((item, r) => (
                                                    <tr key={r} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '4px 6px', fontWeight: '600', color: '#2c3e50', lineHeight: 1.3 }}>{item}</td>
                                                        {(form.tipo === 'escala' ? [1, 2, 3, 4, 5] : form.opciones.filter(o => o.trim())).map((_, c) => (
                                                            <td key={c} style={{ padding: '4px 6px', textAlign: 'center' }}>
                                                                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #c5cae9', margin: '0 auto' }} />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {form.tipo === 'escala' && !form.esMatriz && (
                        <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: 4 }}>Etiqueta mínimo (1)</label>
                                <input type="text" value={form.etiquetaMin} onChange={(e) => setForm({ ...form, etiquetaMin: e.target.value })} placeholder="Ej: Muy malo" style={{ width: '100%', padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 4, fontSize: '0.8rem', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: 4 }}>Etiqueta máximo (5)</label>
                                <input type="text" value={form.etiquetaMax} onChange={(e) => setForm({ ...form, etiquetaMax: e.target.value })} placeholder="Ej: Excelente" style={{ width: '100%', padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 4, fontSize: '0.8rem', outline: 'none' }} />
                            </div>
                        </div>
                    )}
                    {form.tipo === 'si_no' && (
                        <div style={{ marginBottom: 12, padding: 12, background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', marginBottom: 12 }}>
                                <input type="checkbox" checked={form.tieneCondicional} onChange={(e) => setForm({ ...form, tieneCondicional: e.target.checked })} />
                                ¿Tiene preguntas condicionales según la respuesta?
                            </label>
                            {form.tieneCondicional && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                                    {renderColumna('si')}
                                    {renderColumna('no')}
                                </div>
                            )}
                        </div>
                    )}
                    {!esTitulo && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 10 }}>
                            <input type="checkbox" checked={form.obligatoria} onChange={(e) => setForm({ ...form, obligatoria: e.target.checked })} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Obligatoria</span>
                        </label>
                    )}
                    {error && <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: 6, fontSize: '0.75rem', marginBottom: 10 }}>⚠️ {error}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onCerrar} style={{ flex: 1, padding: '8px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Cancelar</button>
                        <button onClick={manejarGuardar} disabled={guardando} style={{ flex: 1, padding: '8px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Guardar'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════ MODAL PREGUNTAS ═══════════
const ModalPreguntas = ({ visible, encuestaId, onCerrar }) => {
    const [preguntas, setPreguntas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalForm, setModalForm] = useState({ visible: false, pregunta: null });
    const [confirmarElim, setConfirmarElim] = useState({ visible: false, pregId: null });

    useEffect(() => { if (visible && encuestaId) cargarPreguntas(); }, [visible, encuestaId]);

    const cargarPreguntas = async () => {
        setLoading(true);
        try {
            const resp = await axios.get(`${API}/encuestas/${encuestaId}/preguntas`, { headers: hdrs() });
            setPreguntas((resp.data || []).sort((a, b) => (a.orden || 0) - (b.orden || 0)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const manejarMover = async (pregId, dir) => {
        const idx = preguntas.findIndex((p) => p._id === pregId);
        if ((dir === 'arriba' && idx === 0) || (dir === 'abajo' && idx === preguntas.length - 1)) return;
        const nuevas = [...preguntas];
        const target = dir === 'arriba' ? idx - 1 : idx + 1;
        [nuevas[idx], nuevas[target]] = [nuevas[target], nuevas[idx]];
        for (let i = 0; i < nuevas.length; i++) {
            try { await axios.patch(`${API}/preguntas/${nuevas[i]._id}`, { orden: i }, { headers: hdrs() }); } catch (e) { console.error(e); }
        }
        setPreguntas(nuevas);
    };

    const manejarEliminar = async () => {
        try {
            await axios.delete(`${API}/preguntas/${confirmarElim.pregId}`, { headers: hdrs() });
            setConfirmarElim({ visible: false, pregId: null });
            cargarPreguntas();
        } catch (e) { console.error(e); }
    };

    const labelTipo = (t, esMatriz) => {
        const base = t === 'opcion_multiple' ? 'Múltiple' : t === 'si_no' ? 'Sí/No' : t === 'escala' ? 'Escala' : t === 'texto_libre' ? 'Texto' : t === 'checkboxes' ? 'Selección múltiple' : t === 'titulo' ? 'Título de sección' : t === 'numero' ? 'Número entero' : (t || '');
        return esMatriz ? `${base} — Tabla` : base;
    };

    if (!visible) return null;

    return (
        <div onClick={onCerrar} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '95%', maxWidth: 900, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '2px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Preguntas</h2>
                    <button onClick={onCerrar} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#adb5bd' }}>×</button>
                </div>
                <div style={{ padding: '16px 20px' }}>
                    <button onClick={() => setModalForm({ visible: true, pregunta: null })} style={{ width: '100%', padding: '10px', marginBottom: 12, background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>+ Agregar pregunta</button>
                    {loading ? <p style={{ textAlign: 'center', color: '#adb5bd' }}>Cargando...</p>
                        : preguntas.length === 0 ? <p style={{ textAlign: 'center', color: '#adb5bd', padding: '15px' }}>Sin preguntas</p>
                            : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {preguntas.map((preg, idx) => (
                                        <div key={preg._id}>
                                            <div style={{ border: `1px solid ${preg.esMatriz ? '#c5cae9' : '#dee2e6'}`, borderRadius: 8, padding: 10, background: preg.esMatriz ? '#f8f9ff' : '#f8f9fa' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-espoch-rojo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>{idx + 1}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ margin: '0 0 3px', fontSize: '0.8rem', fontWeight: '700', color: '#2c3e50' }}>{preg.texto}</p>
                                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>
                                                            {labelTipo(preg.tipo, preg.esMatriz)}
                                                            {preg.obligatoria && ' • Obligatoria'}
                                                            {preg.tieneCondicional && ' • Condicional'}
                                                            {preg.esMatriz && preg.items?.length > 0 && ` • ${preg.items.length} ítems`}
                                                        </p>
                                                        {preg.esMatriz && preg.items?.length > 0 && (
                                                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                                {preg.items.slice(0, 3).map((item, j) => (
                                                                    <span key={j} style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#e8eaf6', color: '#3d5afe', borderRadius: 3, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                                                                ))}
                                                                {preg.items.length > 3 && <span style={{ fontSize: '0.65rem', color: '#adb5bd' }}>+{preg.items.length - 3} más</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <button onClick={() => manejarMover(preg._id, 'arriba')} disabled={idx === 0} style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid #dee2e6', background: 'white', cursor: 'pointer', fontSize: '0.65rem', opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                                                        <button onClick={() => manejarMover(preg._id, 'abajo')} disabled={idx === preguntas.length - 1} style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid #dee2e6', background: 'white', cursor: 'pointer', fontSize: '0.65rem', opacity: idx === preguntas.length - 1 ? 0.4 : 1 }}>↓</button>
                                                        <button onClick={() => setModalForm({ visible: true, pregunta: preg })} style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid #bbdefb', background: '#e3f2fd', cursor: 'pointer', color: '#1565c0', fontSize: '0.65rem' }}>✏️</button>
                                                        <button onClick={() => setConfirmarElim({ visible: true, pregId: preg._id })} style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid #ffcdd2', background: '#ffebee', cursor: 'pointer', color: '#c62828', fontSize: '0.65rem' }}>🗑</button>
                                                    </div>
                                                </div>
                                            </div>
                                            {preg.tieneCondicional && (
                                                <div style={{ marginLeft: 30, marginTop: 6, paddingLeft: 12, borderLeft: '3px solid #f57f17' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                        <div>
                                                            <p style={{ margin: '0 0 6px', fontSize: '0.7rem', fontWeight: '700', color: '#2e7d32' }}>Si responde SÍ:</p>
                                                            {preg.preguntasCondicionalSi?.length > 0 ? preg.preguntasCondicionalSi.map((sub, j) => (
                                                                <div key={j} style={{ padding: 6, background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 4, marginBottom: 4, fontSize: '0.7rem' }}>
                                                                    <p style={{ margin: '0 0 2px', fontWeight: '600' }}>• {sub}</p>
                                                                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>{labelTipo(preg.tiposCondicionalSi?.[j])}</p>
                                                                </div>
                                                            )) : <p style={{ fontSize: '0.7rem', color: '#999', fontStyle: 'italic' }}>Sin preguntas</p>}
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: '0 0 6px', fontSize: '0.7rem', fontWeight: '700', color: '#c62828' }}>Si responde NO:</p>
                                                            {preg.preguntasCondicionalNo?.length > 0 ? preg.preguntasCondicionalNo.map((sub, j) => (
                                                                <div key={j} style={{ padding: 6, background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 4, marginBottom: 4, fontSize: '0.7rem' }}>
                                                                    <p style={{ margin: '0 0 2px', fontWeight: '600' }}>• {sub}</p>
                                                                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>{labelTipo(preg.tiposCondicionalNo?.[j])}</p>
                                                                </div>
                                                            )) : <p style={{ fontSize: '0.7rem', color: '#999', fontStyle: 'italic' }}>Continúa normalmente</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                </div>
            </div>
            <FormularioPregunta visible={modalForm.visible} encuestaId={encuestaId} preguntaEditar={modalForm.pregunta} onGuardar={() => { setModalForm({ visible: false, pregunta: null }); cargarPreguntas(); }} onCerrar={() => setModalForm({ visible: false, pregunta: null })} />
            <ModalConfirmar visible={confirmarElim.visible} titulo="¿Eliminar pregunta?" mensaje="Se eliminará permanentemente." onConfirmar={manejarEliminar} onCancelar={() => setConfirmarElim({ visible: false, pregId: null })} peligroso />
        </div>
    );
};

// ═══════════ MODAL ENCUESTA ═══════════
const ModalEncuesta = ({ visible, encuesta, tipoActivo, onGuardar, onCerrar }) => {
    const consentimientoDefault = tipoActivo === 'empleadores' ? CONSENTIMIENTO_EMPLEADORES_DEFAULT : CONSENTIMIENTO_DEFAULT;

    const [form, setForm] = useState({ titulo: '', descripcion: '', consentimientoInformado: consentimientoDefault, fechaInicio: '', fechaCierre: '', estado: 'borrador' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (encuesta) {
            const fmt = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
            setForm({ titulo: encuesta.titulo, descripcion: encuesta.descripcion || '', consentimientoInformado: encuesta.consentimientoInformado || consentimientoDefault, fechaInicio: fmt(encuesta.fechaInicio), fechaCierre: fmt(encuesta.fechaCierre), estado: encuesta.estado });
        } else {
            setForm({ titulo: '', descripcion: '', consentimientoInformado: consentimientoDefault, fechaInicio: '', fechaCierre: '', estado: 'borrador' });
        }
        setError('');
    }, [encuesta, visible, tipoActivo]);

    const manejarGuardar = () => {
        setError('');
        if (!form.titulo.trim()) { setError('Título obligatorio'); return; }
        if (!form.fechaInicio || !form.fechaCierre) { setError('Fechas obligatorias'); return; }
        if (new Date(form.fechaCierre) <= new Date(form.fechaInicio)) { setError('Cierre debe ser posterior al inicio'); return; }
        if (!form.consentimientoInformado.trim()) { setError('El consentimiento informado es obligatorio'); return; }
        onGuardar(form);
    };

    if (!visible) return null;

    return (
        <div onClick={onCerrar} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '90%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '2px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{encuesta ? 'Editar' : 'Nueva'} Encuesta — {tipoActivo === 'empleadores' ? 'Empleadores' : 'Graduados'}</h2>
                    <button onClick={onCerrar} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#adb5bd' }}>×</button>
                </div>
                <div style={{ padding: '16px 20px' }}>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>Título *</label>
                        <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título de la encuesta" style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>
                            Consentimiento Informado *
                            <span style={{ fontWeight: '400', color: '#adb5bd', marginLeft: 6 }}>— texto que verá el encuestado antes de responder</span>
                        </label>
                        <textarea value={form.consentimientoInformado} onChange={(e) => setForm({ ...form, consentimientoInformado: e.target.value })} placeholder="Escribe aquí el texto del consentimiento informado..." style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.82rem', minHeight: 120, outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
                        <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#adb5bd' }}>{form.consentimientoInformado.length}/3000 caracteres</p>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>Descripción interna</label>
                        <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Notas internas (no visible para el encuestado)" style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.85rem', minHeight: 50, outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>Inicio *</label>
                            <input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>Cierre *</label>
                            <input type="date" value={form.fechaCierre} onChange={(e) => setForm({ ...form, fechaCierre: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: 4 }}>Estado</label>
                        <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }}>
                            <option value="borrador">Borrador</option>
                            <option value="activa">Activa</option>
                            <option value="cerrada">Cerrada</option>
                        </select>
                    </div>
                    {error && <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: 6, fontSize: '0.75rem', marginBottom: 10 }}>⚠️ {error}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onCerrar} style={{ flex: 1, padding: '8px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Cancelar</button>
                        <button onClick={manejarGuardar} style={{ flex: 1, padding: '8px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════ COMPONENTE PRINCIPAL ═══════════
const GestionEncuestas = () => {
    const [tipoActivo, setTipoActivo] = useState('graduados');
    const [encuestas, setEncuestas] = useState([]);
    const [total, setTotal] = useState(0);
    const [paginas, setPaginas] = useState(1);
    const [pagina, setPagina] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [buscar, setBuscar] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [encuestaEditar, setEncuestaEditar] = useState(null);
    const [modalPreguntasVisible, setModalPreguntasVisible] = useState(false);
    const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
    const [modalVistaPrevia, setModalVistaPrevia] = useState({ visible: false, encuesta: null });
    const [confirmarElim, setConfirmarElim] = useState({ visible: false, encId: null, titulo: '' });
    const [confirmarDup, setConfirmarDup] = useState({ visible: false, encId: null });
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    // Graduados — notificación
    const [confirmarNotif, setConfirmarNotif] = useState({ visible: false, encId: null, titulo: '' });
    const [resultadoNotif, setResultadoNotif] = useState({ visible: false, resumen: null });
    // Empleadores — próximamente
    const [modalProximamente, setModalProximamente] = useState(false);

    const cargar = useCallback(async (q = '', est = '', pag = 1) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ page: pag, limit: LIMIT });
            if (q) params.append('buscar', q);
            if (est) params.append('estado', est);
            params.append('tipo', tipoActivo);
            const resp = await axios.get(`${API}/encuestas?${params}`, { headers: hdrs() });
            setEncuestas(resp.data.encuestas || []);
            setTotal(resp.data.total || 0);
            setPaginas(resp.data.paginas || 1);
        } catch (e) { console.error(e); setError('Error al cargar'); }
        finally { setLoading(false); }
    }, [tipoActivo]);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        const t = setTimeout(() => { setPagina(1); cargar(buscar, filtroEstado, 1); }, 300);
        return () => clearTimeout(t);
    }, [buscar, filtroEstado, cargar]);

    const cambiarTipo = (tipo) => {
        setTipoActivo(tipo);
        setBuscar('');
        setFiltroEstado('');
        setPagina(1);
    };

    const manejarGuardarEncuesta = async (datos) => {
        try {
            const payload = { ...datos, tipo: tipoActivo };
            if (encuestaEditar) await axios.patch(`${API}/encuestas/${encuestaEditar._id}`, payload, { headers: hdrs() });
            else await axios.post(`${API}/encuestas`, payload, { headers: hdrs() });
            setModalVisible(false); setEncuestaEditar(null);
            cargar(buscar, filtroEstado, pagina);
        } catch (e) { setError(e.response?.data?.msg || 'Error'); }
    };

    const manejarEliminar = async () => {
        try {
            await axios.delete(`${API}/encuestas/${confirmarElim.encId}`, { headers: hdrs() });
            setConfirmarElim({ visible: false, encId: null, titulo: '' });
            cargar(buscar, filtroEstado, pagina);
        } catch (e) { setError(e.response?.data?.msg || 'Error'); }
    };

    const manejarNotificar = async () => {
        try {
            const endpoint = tipoActivo === 'graduados'
                ? `${API}/encuestas/${confirmarNotif.encId}/notificar`
                : `${API}/encuestas/${confirmarNotif.encId}/notificar-empleadores`;
            const resp = await axios.post(endpoint, {}, { headers: hdrs() });
            setConfirmarNotif({ visible: false, encId: null, titulo: '' });
            setResultadoNotif({ visible: true, resumen: resp.data.resumen });
        } catch (e) {
            setConfirmarNotif({ visible: false, encId: null, titulo: '' });
            setError(e.response?.data?.msg || 'Error al notificar');
        }
    };

    const manejarDuplicar = async () => {
        if (!nuevoTitulo.trim()) return;
        try {
            await axios.post(`${API}/encuestas/${confirmarDup.encId}/duplicar`, { nuevoTitulo: nuevoTitulo.trim() }, { headers: hdrs() });
            setConfirmarDup({ visible: false, encId: null });
            setNuevoTitulo('');
            cargar(buscar, filtroEstado, pagina);
        } catch (e) {
            setError(e.response?.data?.msg || 'Error al duplicar');
            setConfirmarDup({ visible: false, encId: null });
        }
    };

    const estadActiva = encuestas.filter((e) => e.estado === 'activa').length;
    const estadBorrador = encuestas.filter((e) => e.estado === 'borrador').length;
    const estadCerrada = encuestas.filter((e) => e.estado === 'cerrada').length;
    const totalRespuestas = encuestas.reduce((sum, e) => sum + (e.totalRespuestas || 0), 0);

    const fmtNum = (n) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
        return String(n);
    };
    return (
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '16px', background: '#f5f6f7', minHeight: '100vh' }}>

            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: '3px solid #e9ecef', marginBottom: 14 }}>
                <button style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', color: tipoActivo === 'graduados' ? 'var(--color-espoch-rojo)' : '#adb5bd', borderBottom: tipoActivo === 'graduados' ? '3px solid var(--color-espoch-rojo)' : 'none' }}
                    onClick={() => cambiarTipo('graduados')}>Graduados</button>
                <button style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', color: tipoActivo === 'empleadores' ? 'var(--color-espoch-rojo)' : '#adb5bd', borderBottom: tipoActivo === 'empleadores' ? '3px solid var(--color-espoch-rojo)' : 'none' }}
                    onClick={() => cambiarTipo('empleadores')}>Empleadores</button>
            </div>

            {/* STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 14 }}>
                {[
                    { label: 'ACTIVAS', val: estadActiva, bg: '#e8f5e9', border: '#c8e6c9', color: '#2e7d32' },
                    { label: 'BORRADOR', val: estadBorrador, bg: '#fff8e1', border: '#ffe082', color: '#f57f17' },
                    { label: 'CERRADAS', val: estadCerrada, bg: '#ffebee', border: '#ffcdd2', color: '#c62828' },
                    { label: 'RESPUESTAS', val: totalRespuestas, bg: '#e3f2fd', border: '#bbdefb', color: '#1565c0' },
                ].map((s) => (
                    <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: '700', color: s.color }}>{s.label}</p>
                        <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: s.color }}>{fmtNum(s.val)}</p>
                    </div>
                ))}
            </div>

            {/* TABLA */}
            <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 14, border: '1px solid #e9ecef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Encuestas ({total})</h3>
                    <button onClick={() => { setEncuestaEditar(null); setModalVisible(true); }} style={{ padding: '8px 14px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>+ Nueva</button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input type="text" placeholder="Buscar..." value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} style={{ flex: 1, padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.75rem', outline: 'none' }} />
                    <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }} style={{ padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: '0.75rem', outline: 'none' }}>
                        <option value="">Todos</option>
                        <option value="borrador">Borrador</option>
                        <option value="activa">Activa</option>
                        <option value="cerrada">Cerrada</option>
                    </select>
                </div>
                {error && <div style={{ padding: 8, background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: 6, fontSize: '0.7rem', marginBottom: 10 }}>⚠️ {error}</div>}
                {loading ? <p style={{ textAlign: 'center', color: '#adb5bd', fontSize: '0.75rem' }}>Cargando...</p>
                    : encuestas.length === 0 ? <p style={{ textAlign: 'center', color: '#adb5bd', padding: '15px', fontSize: '0.75rem' }}>Sin encuestas</p>
                        : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                            {['TÍTULO', 'ESTADO', 'FECHAS', 'RESP.', 'ACCIONES'].map((h) => (
                                                <th key={h} style={{ padding: '8px', textAlign: h === 'ACCIONES' ? 'right' : 'left', fontWeight: '700', color: '#adb5bd', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {encuestas.map((enc) => {
                                            const estado = enc.estado === 'borrador' ? { label: 'Borrador', bg: '#fff8e1', color: '#f57f17' } : enc.estado === 'activa' ? { label: 'Activa', bg: '#e8f5e9', color: '#2e7d32' } : { label: 'Cerrada', bg: '#ffebee', color: '#c62828' };
                                            return (
                                                <tr key={enc._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '8px', fontWeight: '600', color: '#2c3e50' }}>{enc.titulo}</td>
                                                    <td style={{ padding: '8px' }}><span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '3px 7px', borderRadius: '12px', background: estado.bg, color: estado.color }}>{estado.label}</span></td>
                                                    <td style={{ padding: '8px', color: '#666', fontSize: '0.75rem' }}>{new Date(enc.fechaInicio).toLocaleDateString('es')} - {new Date(enc.fechaCierre).toLocaleDateString('es')}</td>
                                                    <td style={{ padding: '8px', fontWeight: '700' }}>{enc.totalRespuestas || 0}</td>
                                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>

                                                            {/* ── BOTÓN NOTIFICAR ── */}
                                                            {enc.estado === 'activa' && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (tipoActivo === 'graduados') {
                                                                            setConfirmarNotif({ visible: true, encId: enc._id, titulo: enc.titulo });
                                                                        } else {
                                                                            setConfirmarNotif({ visible: true, encId: enc._id, titulo: enc.titulo });
                                                                        }
                                                                    }}
                                                                    title={tipoActivo === 'graduados' ? 'Notificar a graduados' : 'Notificar a empleadores'}
                                                                    style={{
                                                                        width: 32, height: 32, borderRadius: 6,
                                                                        border: '1px solid #ce93d8',
                                                                        background: '#f3e5f5',
                                                                        color: '#6a1b9a',
                                                                        cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                                        position: 'relative',
                                                                    }}
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                                    </svg>
                                                                    {tipoActivo === 'empleadores' && (
                                                                        <span style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', fontSize: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>!</span>
                                                                    )}
                                                                </button>
                                                            )}

                                                            <button onClick={() => { setEncuestaSeleccionada(enc); setModalPreguntasVisible(true); }} title="Gestionar preguntas" style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #bbdefb', background: '#e3f2fd', color: '#1565c0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                            </button>
                                                            <button onClick={() => setModalVistaPrevia({ visible: true, encuesta: enc })} title="Vista previa" style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #c8e6c9', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                            </button>
                                                            <button onClick={() => { setEncuestaEditar(enc); setModalVisible(true); }} title="Editar" style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #bbdefb', background: '#e3f2fd', color: '#1565c0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                            </button>
                                                            <button onClick={() => { setNuevoTitulo(`Copia de ${enc.titulo}`); setConfirmarDup({ visible: true, encId: enc._id }); }} title="Duplicar" style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #dee2e6', background: '#f1efe8', color: '#5f5e5a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                            </button>
                                                            <button onClick={() => setConfirmarElim({ visible: true, encId: enc._id, titulo: enc.titulo })} title="Eliminar" style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                {!loading && paginas > 1 && (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10 }}>
                        <button onClick={() => { const p = Math.max(1, pagina - 1); setPagina(p); cargar(buscar, filtroEstado, p); }} disabled={pagina === 1} style={{ minWidth: 28, height: 28, borderRadius: 4, border: '1px solid #dee2e6', background: 'white', cursor: 'pointer', fontSize: '0.7rem' }}>◀</button>
                        {Array.from({ length: paginas }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => { setPagina(p); cargar(buscar, filtroEstado, p); }} style={{ minWidth: 28, height: 28, borderRadius: 4, border: p === pagina ? '1px solid var(--color-espoch-rojo)' : '1px solid #dee2e6', background: p === pagina ? 'var(--color-espoch-rojo)' : 'white', color: p === pagina ? 'white' : '#666', cursor: 'pointer', fontSize: '0.7rem', fontWeight: p === pagina ? '700' : '400' }}>{p}</button>
                        ))}
                        <button onClick={() => { const p = Math.min(paginas, pagina + 1); setPagina(p); cargar(buscar, filtroEstado, p); }} disabled={pagina === paginas} style={{ minWidth: 28, height: 28, borderRadius: 4, border: '1px solid #dee2e6', background: 'white', cursor: 'pointer', fontSize: '0.7rem' }}>▶</button>
                    </div>
                )}
            </div>

            {/* MODALES */}
            <ModalEncuesta visible={modalVisible} encuesta={encuestaEditar} tipoActivo={tipoActivo} onGuardar={manejarGuardarEncuesta} onCerrar={() => { setModalVisible(false); setEncuestaEditar(null); }} />
            <ModalPreguntas visible={modalPreguntasVisible} encuestaId={encuestaSeleccionada?._id} onCerrar={() => { setModalPreguntasVisible(false); setEncuestaSeleccionada(null); }} />
            <ModalVistaPrevia visible={modalVistaPrevia.visible} encuesta={modalVistaPrevia.encuesta} onCerrar={() => setModalVistaPrevia({ visible: false, encuesta: null })} />

            {/* Notificación graduados */}
            <ModalConfirmar
                visible={confirmarNotif.visible}
                titulo={tipoActivo === 'graduados' ? '¿Notificar a graduados?' : '¿Notificar a empleadores?'}
                mensaje={tipoActivo === 'graduados'
                    ? `Se enviará una notificación in-app y un correo a todos los graduados con tesis verificada sobre la encuesta "${confirmarNotif.titulo}".`
                    : `Se generará un link único por empleador y se enviará un correo a todos los empleadores activos para la encuesta "${confirmarNotif.titulo}".`
                }
                onConfirmar={manejarNotificar}
                onCancelar={() => setConfirmarNotif({ visible: false, encId: null, titulo: '' })}
                peligroso={false}
                textoConfirmando="Enviando notificaciones..."
            />
            <ModalResultadoNotificacion visible={resultadoNotif.visible} resumen={resultadoNotif.resumen} onCerrar={() => setResultadoNotif({ visible: false, resumen: null })} />

            {/* Próximamente empleadores */}
            <ModalProximamente visible={modalProximamente} onCerrar={() => setModalProximamente(false)} />

            <ModalConfirmar visible={confirmarElim.visible} titulo="¿Eliminar encuesta?" mensaje={`Se eliminará "${confirmarElim.titulo}", todas sus preguntas y TODAS las respuestas recopiladas (graduados o empleadores). Esta acción es irreversible.`} onConfirmar={manejarEliminar} onCancelar={() => setConfirmarElim({ visible: false, encId: null, titulo: '' })} peligroso />

            {confirmarDup.visible && (
                <div onClick={() => setConfirmarDup({ visible: false, encId: null })} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 10, padding: '20px 24px', textAlign: 'center', maxWidth: 320, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: '700' }}>Duplicar Encuesta</h3>
                        <input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} placeholder="Nuevo título..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 6, marginBottom: 12, fontSize: '0.8rem', outline: 'none' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setConfirmarDup({ visible: false, encId: null })} style={{ flex: 1, padding: '7px', background: '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}>Cancelar</button>
                            <button onClick={manejarDuplicar} style={{ flex: 1, padding: '7px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}>Duplicar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionEncuestas;
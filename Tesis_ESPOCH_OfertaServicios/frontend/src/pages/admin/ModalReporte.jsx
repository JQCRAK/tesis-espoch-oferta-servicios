// frontend/src/pages/admin/ModalReporte.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    FaTimes, FaCalendarAlt, FaSpinner, FaFileWord,
    FaArrowRight, FaArrowLeft,
    FaGraduationCap, FaBuilding, FaCheckCircle, FaUsers,
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
import { leerSesion } from '../../utils/storageSeguro';

const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};

const PALETA = [
    '#BE1E2D', '#1565C0', '#2E7D32', '#F57F17', '#6A1B9A',
    '#00695C', '#AD1457', '#4527A0', '#0277BD', '#558B2F',
];

/* ══════════════════════════════════════════════════════════
   AGRUPAR NÚMEROS EN RANGOS
══════════════════════════════════════════════════════════ */
const agruparNumeros = (valores) => {
    const nums = valores.map(Number).filter(n => !isNaN(n));
    if (nums.length === 0) return [];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (min === max) return [{ opcion: String(min), cantidad: nums.length }];
    const rango = max - min;
    const paso = rango <= 10 ? 1 : rango <= 30 ? 5 : rango <= 100 ? 10 : rango <= 500 ? 50 : 100;
    const buckets = {};
    nums.forEach(n => {
        const inicio = Math.floor(n / paso) * paso;
        const fin = inicio + paso - 1;
        const key = paso === 1 ? String(inicio) : `${inicio}-${fin}`;
        buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([opcion, cantidad]) => ({ opcion, cantidad }));
};

/* ══════════════════════════════════════════════════════════
   DONA
══════════════════════════════════════════════════════════ */
const GraficaDona = ({ datos, total }) => {
    if (!datos || datos.length === 0) return <SinRespuestas />;

    const dataConPct = datos.map(d => ({
        ...d,
        pct: total > 0 ? Math.round((d.cantidad / total) * 100) : 0,
    }));

    const RADIAN = Math.PI / 180;
    const renderLabel = ({ cx, cy, midAngle, outerRadius, pct }) => {
        if (pct < 3) return null;
        const radius = outerRadius + 18;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="#2c3e50" textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: '0.65rem', fontWeight: '700' }}>
                {pct}%
            </text>
        );
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{
                flex: '0 0 auto', minWidth: 180, maxWidth: 260,
                display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 16,
            }}>
                {dataConPct.map((d, i) => (
                    <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '14px 1fr 28px',
                        alignItems: 'center', gap: '0 6px', minHeight: 20,
                    }}>
                        <span style={{
                            width: 11, height: 11, borderRadius: 3,
                            background: PALETA[i % PALETA.length], flexShrink: 0, justifySelf: 'center',
                        }} />
                        <span style={{ fontSize: '0.73rem', color: '#2c3e50', lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {d.opcion}
                        </span>
                        <span style={{
                            fontSize: '0.73rem', fontWeight: '700',
                            color: PALETA[i % PALETA.length], textAlign: 'right',
                        }}>
                            {d.cantidad}
                        </span>
                    </div>
                ))}
            </div>
            <div style={{ flex: '0 0 220px', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie data={dataConPct} dataKey="cantidad" nameKey="opcion"
                            cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                            strokeWidth={2} stroke="#fff" labelLine={false} label={renderLabel}>
                            {dataConPct.map((_, i) => (
                                <Cell key={i} fill={PALETA[i % PALETA.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(v, n) => [`${v} resp. (${dataConPct.find(d => d.opcion === n)?.pct}%)`, n]}
                            contentStyle={{ fontSize: '0.72rem' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   BARRAS HORIZONTALES
══════════════════════════════════════════════════════════ */
const GraficaBarrasH = ({ datos }) => {
    if (!datos || datos.length === 0) return <SinRespuestas />;

    const maxCant = Math.max(...datos.map(d => d.cantidad));
    const ticksMid = Math.round(maxCant / 2);

    return (
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto', minWidth: 200, maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {datos.map((d, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        minHeight: 36, padding: '4px 12px 4px 0',
                    }}>
                        <span style={{
                            width: 10, height: 10, borderRadius: 2,
                            background: PALETA[i % PALETA.length], flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '0.71rem', color: '#2c3e50', flex: 1, lineHeight: 1.35 }}>
                            {d.opcion}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2c3e50', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>
                            {d.cantidad}
                        </span>
                    </div>
                ))}
                <div style={{ height: 22 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                        display: 'flex', justifyContent: 'space-between', pointerEvents: 'none',
                    }}>
                        {[0, 1, 2].map((_, i) => (
                            <div key={i} style={{ width: i === 0 ? 2 : 1, height: '100%', background: i === 0 ? '#adb5bd' : '#e0e0e0' }} />
                        ))}
                    </div>
                    {datos.map((d, i) => {
                        const pct = maxCant > 0 ? (d.cantidad / maxCant) * 100 : 0;
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', minHeight: 36, padding: '4px 0', position: 'relative' }}>
                                <div style={{
                                    height: 16,
                                    width: `${Math.max(pct, d.cantidad > 0 ? 1.5 : 0)}%`,
                                    background: PALETA[i % PALETA.length],
                                    borderRadius: '0 4px 4px 0',
                                    minWidth: d.cantidad > 0 ? 4 : 0,
                                }} />
                            </div>
                        );
                    })}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#adb5bd' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: 2, height: 22, alignItems: 'flex-end' }}>
                    {[0, ticksMid, maxCant].map((v, i) => (
                        <span key={i} style={{ fontSize: '0.62rem', color: '#6c757d' }}>{v}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   BARRAS VERTICALES — números agrupados en rangos
══════════════════════════════════════════════════════════ */
const GraficaBarrasV = ({ datos }) => {
    if (!datos || datos.length === 0) return <SinRespuestas />;
    return (
        <ResponsiveContainer width="100%" height={190}>
            <BarChart data={datos} margin={{ left: 0, right: 10, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="opcion" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v} resp.`]} contentStyle={{ fontSize: '0.72rem' }} />
                <Bar dataKey="cantidad" fill={PALETA[1]} radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
        </ResponsiveContainer>
    );
};

/* ══════════════════════════════════════════════════════════
   ESCALA LIKERT — barra apilada con etiquetas min/max
══════════════════════════════════════════════════════════ */
const LIKERT_COLORES = ['#D32F2F', '#EF6C00', '#FBC02D', '#558B2F', '#1565C0'];

const GraficaLikert = ({ datos, etiquetaMin, etiquetaMax, escalaMin, escalaMax }) => {
    if (!datos || datos.length === 0) return <SinRespuestas />;

    const totalResp = datos.reduce((s, d) => s + d.cantidad, 0) || 1;
    const segmentos = datos.map((d, i) => ({
        ...d,
        pct: Math.round((d.cantidad / totalResp) * 100),
        color: LIKERT_COLORES[i % LIKERT_COLORES.length],
    }));

    const hayEtiquetas = etiquetaMin || etiquetaMax;

    return (
        <div>
            {/* Leyenda con colores + opción + cantidad */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 10 }}>
                {segmentos.map((s, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#495057' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                        <span>{s.opcion}</span>
                        <span style={{ fontWeight: '700', color: s.color }}>({s.cantidad})</span>
                    </span>
                ))}
            </div>

            {/* Etiquetas min/max encima de la barra */}
            {hayEtiquetas && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.65rem', color: '#6c757d', fontStyle: 'italic' }}>
                        {escalaMin}{etiquetaMin ? ` = ${etiquetaMin}` : ''}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#6c757d', fontStyle: 'italic' }}>
                        {escalaMax}{etiquetaMax ? ` = ${etiquetaMax}` : ''}
                    </span>
                </div>
            )}

            {/* Barra apilada */}
            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 28 }}>
                {segmentos.map((s, i) => (
                    s.pct > 0 && (
                        <div key={i}
                            title={`${s.opcion}: ${s.cantidad} (${s.pct}%)`}
                            style={{
                                width: `${s.pct}%`, background: s.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            {s.pct >= 8 && (
                                <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: '700' }}>
                                    {s.pct}%
                                </span>
                            )}
                        </div>
                    )
                ))}
            </div>

            {/* Conteos debajo */}
            <div style={{ display: 'flex', marginTop: 8, gap: 0 }}>
                {segmentos.map((s, i) => (
                    s.pct > 0 && (
                        <div key={i} style={{ width: `${s.pct}%`, textAlign: 'center', fontSize: '0.62rem', color: '#6c757d' }}>
                            {s.cantidad}
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   MATRIZ — misma estética que GraficaBarrasH
   Leyenda izquierda: ítem + total respuestas
   Barras apiladas a la derecha, una fila por ítem
══════════════════════════════════════════════════════════ */
const GraficaMatriz = ({ datos, etiquetaMin, etiquetaMax, escalaMin, escalaMax, opciones }) => {
    if (!datos || datos.length === 0) return <SinRespuestas />;

    // Obtener todas las columnas únicas ordenadas
    const columnas = [...new Set(datos.flatMap(d => Object.keys(d.valores || {})))]
        .sort((a, b) => {
            const na = Number(a), nb = Number(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });

    if (columnas.length === 0) return <SinRespuestas />;

    // Total máximo por fila (para escalar las barras)
    const maxTotal = Math.max(...datos.map(d => Object.values(d.valores || {}).reduce((s, v) => s + v, 0)));

    const hayEtiquetas = etiquetaMin || etiquetaMax;

    return (
        <div>
            {/* Leyenda de columnas (colores) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 10 }}>
                {columnas.map((col, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#495057' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: PALETA[i % PALETA.length], flexShrink: 0 }} />
                        <span>{col}</span>
                        {hayEtiquetas && (
                            <>
                                {col === String(escalaMin) && etiquetaMin && (
                                    <span style={{ fontStyle: 'italic', color: '#adb5bd', fontSize: '0.65rem' }}>({etiquetaMin})</span>
                                )}
                                {col === String(escalaMax) && etiquetaMax && (
                                    <span style={{ fontStyle: 'italic', color: '#adb5bd', fontSize: '0.65rem' }}>({etiquetaMax})</span>
                                )}
                            </>
                        )}
                    </span>
                ))}
            </div>

            {/* Filas: leyenda izquierda + barra derecha */}
            <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>

                {/* Columna izquierda: texto del ítem + total */}
                <div style={{ flex: '0 0 auto', minWidth: 180, maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {datos.map((d, i) => {
                        const totalFila = Object.values(d.valores || {}).reduce((s, v) => s + v, 0);
                        return (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                minHeight: 36, padding: '4px 12px 4px 0',
                            }}>
                                <span style={{
                                    fontSize: '0.71rem', color: '#2c3e50', flex: 1,
                                    lineHeight: 1.3, wordBreak: 'break-word',
                                }}>
                                    {d.item.length > 55 ? d.item.substring(0, 55) + '…' : d.item}
                                </span>
                                <span style={{
                                    fontSize: '0.72rem', fontWeight: '700', color: '#2c3e50',
                                    minWidth: 22, textAlign: 'right', flexShrink: 0,
                                }}>
                                    {totalFila}
                                </span>
                            </div>
                        );
                    })}
                    <div style={{ height: 22 }} />
                </div>

                {/* Columna derecha: barras apiladas */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {/* Líneas verticales de cuadrícula */}
                        <div style={{
                            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                            display: 'flex', justifyContent: 'space-between', pointerEvents: 'none',
                        }}>
                            {[0, 1, 2].map((_, i) => (
                                <div key={i} style={{
                                    width: i === 0 ? 2 : 1, height: '100%',
                                    background: i === 0 ? '#adb5bd' : '#e0e0e0',
                                }} />
                            ))}
                        </div>

                        {/* Fila por ítem */}
                        {datos.map((d, i) => {
                            const totalFila = Object.values(d.valores || {}).reduce((s, v) => s + v, 0);
                            const pctFila = maxTotal > 0 ? (totalFila / maxTotal) * 100 : 0;

                            return (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center',
                                    minHeight: 36, padding: '4px 0', position: 'relative',
                                }}>
                                    {/* Barra apilada proporcional al total de fila */}
                                    <div style={{
                                        display: 'flex',
                                        width: `${Math.max(pctFila, totalFila > 0 ? 1.5 : 0)}%`,
                                        height: 16,
                                        borderRadius: '0 4px 4px 0',
                                        overflow: 'hidden',
                                        minWidth: totalFila > 0 ? 4 : 0,
                                    }}>
                                        {columnas.map((col, ci) => {
                                            const cant = d.valores[col] || 0;
                                            const pctSeg = totalFila > 0 ? (cant / totalFila) * 100 : 0;
                                            if (pctSeg === 0) return null;
                                            return (
                                                <div
                                                    key={ci}
                                                    title={`${d.item} — ${col}: ${cant}`}
                                                    style={{
                                                        width: `${pctSeg}%`,
                                                        background: PALETA[ci % PALETA.length],
                                                        height: '100%',
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Línea base */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#adb5bd' }} />
                    </div>

                    {/* Eje X */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: 2, height: 22, alignItems: 'flex-end' }}>
                        {[0, Math.round(maxTotal / 2), maxTotal].map((v, i) => (
                            <span key={i} style={{ fontSize: '0.62rem', color: '#6c757d' }}>{v}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   TEXTO LIBRE
══════════════════════════════════════════════════════════ */
const GraficaTextoLibre = ({ datos }) => {
    if (!datos || datos.length === 0) return <SinRespuestas />;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 280, overflowY: 'auto' }}>
            {datos.map((d, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'baseline', gap: 8,
                    padding: '5px 10px',
                    background: i % 2 === 0 ? '#fafafa' : 'white',
                    borderRadius: 4, fontSize: '0.74rem', color: '#2c3e50', lineHeight: 1.4,
                }}>
                    <span style={{ flex: 1 }}>{d.opcion}</span>
                    {d.cantidad > 1 && (
                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#adb5bd', flexShrink: 0 }}>
                            ×{d.cantidad}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

const SinRespuestas = () => (
    <p style={{ fontSize: '0.74rem', color: '#adb5bd', textAlign: 'center', padding: '14px 0' }}>
        Sin respuestas para esta pregunta
    </p>
);

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL: GraficaPregunta
   Recibe el stat completo y despacha al componente correcto
══════════════════════════════════════════════════════════ */
const GraficaPregunta = ({ stat, totalEncuesta }) => {
    if (!stat) return <SinRespuestas />;

    // Campos de etiquetas y escala que vienen del backend
    const etiquetaMin = stat.etiquetaMin || '';
    const etiquetaMax = stat.etiquetaMax || '';
    const escalaMin   = stat.escalaMin   ?? 1;
    const escalaMax   = stat.escalaMax   ?? 5;
    const opciones    = stat.opciones    || [];

    switch (stat.tipoGrafica) {
        case 'dona':
            return <GraficaDona datos={stat.datos} total={totalEncuesta} />;

        case 'barras_h':
            return <GraficaBarrasH datos={stat.datos} />;

        case 'barras_v':
            return <GraficaBarrasV datos={stat.datos} />;

        case 'barras_apiladas':
            // Matriz: pasa etiquetas y opciones para la leyenda
            return (
                <GraficaMatriz
                    datos={stat.datos}
                    etiquetaMin={etiquetaMin}
                    etiquetaMax={etiquetaMax}
                    escalaMin={escalaMin}
                    escalaMax={escalaMax}
                    opciones={opciones}
                />
            );

        case 'likert':
        case 'escala':
            return (
                <GraficaLikert
                    datos={stat.datos}
                    etiquetaMin={etiquetaMin}
                    etiquetaMax={etiquetaMax}
                    escalaMin={escalaMin}
                    escalaMax={escalaMax}
                />
            );

        case 'texto_libre':
            return <GraficaTextoLibre datos={stat.datos} />;

        default:
            return <SinRespuestas />;
    }
};

/* ══════════════════════════════════════════════════════════
   CARD DE PREGUNTA
══════════════════════════════════════════════════════════ */
const PreguntaCard = ({ stat, totalEncuesta }) => {
    return (
        <div style={s.pregCard}>
            <p style={s.pregTxt}>{stat.texto}</p>
            <div style={s.graficaWrap}>
                <GraficaPregunta stat={stat} totalEncuesta={totalEncuesta} />
            </div>
            {stat.condicionales?.length > 0 && stat.condicionales.map((sub, j) => (
                <div key={j} style={s.condBlock}>
                    <span style={s.condTag}>
                        {sub.lado === 'si' ? '↳ Si respondió Sí' : '↳ Si respondió No'}
                    </span>
                    <p style={s.subPregTxt}>{sub.textoPregSub}</p>
                    <div style={s.graficaWrap}>
                        <GraficaPregunta stat={sub} totalEncuesta={sub.total} />
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   CONTADOR TOTAL
══════════════════════════════════════════════════════════ */
const ContadorTotal = ({ total, color }) => (
    <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px',
        background: `${color}12`, border: `1px solid ${color}30`,
        borderRadius: 6, marginBottom: 16,
    }}>
        <span style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: '500' }}>
            Total que respondieron:
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: '800', color }}>
            {total}
        </span>
    </div>
);

/* ══════════════════════════════════════════════════════════
   MODAL PRINCIPAL
══════════════════════════════════════════════════════════ */
const ModalReporte = ({ onClose }) => {
    const [paso, setPaso] = useState(1);
    const [opciones, setOpciones] = useState(null);
    const [cargandoOpc, setCargandoOpc] = useState(true);

    const [eventoId, setEventoId] = useState('');
    const [encGradId, setEncGradId] = useState('');
    const [encEmpId, setEncEmpId] = useState('');
    const [anio, setAnio] = useState(String(new Date().getFullYear()));
    const [errPaso1, setErrPaso1] = useState('');

    const [previewGrad, setPreviewGrad] = useState(null);
    const [previewEmp, setPreviewEmp] = useState(null);
    const [cargandoPrev, setCargandoPrev] = useState(false);

    const [descargando, setDescargando] = useState(false);
    const [exito, setExito] = useState(false);

    useEffect(() => {
        axios.get(`${API}/admin/reportes/opciones-informe`, { headers: hdrs() })
            .then(({ data }) => setOpciones(data))
            .catch(() => setOpciones({ eventos: [], encGraduados: [], encEmpleadores: [] }))
            .finally(() => setCargandoOpc(false));
    }, []);

    useEffect(() => {
        if (!eventoId || !opciones) return;
        const ev = opciones.eventos.find(e => e._id === eventoId);
        if (ev?.fechaInicio) setAnio(String(new Date(ev.fechaInicio).getFullYear()));
    }, [eventoId, opciones]);

    const irPaso2 = async () => {
        if (!eventoId) return setErrPaso1('Selecciona un evento.');
        if (!encGradId) return setErrPaso1('Selecciona la encuesta de graduados.');
        if (!encEmpId) return setErrPaso1('Selecciona la encuesta de empleadores.');
        if (!anio) return setErrPaso1('Ingresa el año del informe.');
        setErrPaso1('');
        setCargandoPrev(true);
        setPaso(2);
        try {
            const [rGrad, rEmp] = await Promise.all([
                axios.get(`${API}/admin/reportes/preview-encuesta/${encGradId}`, { headers: hdrs() }),
                axios.get(`${API}/admin/reportes/preview-encuesta/${encEmpId}`, { headers: hdrs() }),
            ]);
            setPreviewGrad(rGrad.data);
            setPreviewEmp(rEmp.data);
        } catch {
            setErrPaso1('Error al cargar previsualización.');
            setPaso(1);
        } finally {
            setCargandoPrev(false);
        }
    };

    const descargarWord = async () => {
        setDescargando(true);
        try {
            const resp = await axios.post(
                `${API}/admin/reportes/generar-informe`,
                { eventoId, encuestaGraduadosId: encGradId, encuestaEmpleadoresId: encEmpId, anio },
                { headers: hdrs(), responseType: 'blob' }
            );
            const url = URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Informe_Encuentro_Graduados_${anio}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            setExito(true);
        } catch {
            alert('Error al generar el Word. Intenta nuevamente.');
        } finally {
            setDescargando(false);
        }
    };

    const eventoSeleccionado = opciones?.eventos.find(e => e._id === eventoId);

    return (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={s.modal}>

                {/* CABECERA */}
                <div style={s.head}>
                    <div>
                        <h2 style={s.tit}>Informe Encuentro de Graduados</h2>
                        <p style={s.sub}>Anexo 19 · Res. 018.CP.2025 · Carrera de Software ESPOCH</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={s.pasos}>
                            {[1, 2].map(p => (
                                <React.Fragment key={p}>
                                    <div style={{
                                        ...s.pasoCirculo,
                                        background: paso >= p ? '#BE1E2D' : '#e9ecef',
                                        color: paso >= p ? 'white' : '#adb5bd',
                                    }}>{p}</div>
                                    {p < 2 && <div style={{ width: 24, height: 2, background: paso > p ? '#BE1E2D' : '#e9ecef' }} />}
                                </React.Fragment>
                            ))}
                        </div>
                        <button style={s.btnClose} onClick={onClose}><FaTimes /></button>
                    </div>
                </div>

                {/* PASO 1 */}
                {paso === 1 && (
                    <div style={s.body}>
                        {cargandoOpc ? (
                            <div style={s.loadBox}>
                                <FaSpinner style={{ fontSize: '1.4rem', color: '#adb5bd', animation: 'spin 1s linear infinite' }} />
                                <span style={{ fontSize: '0.8rem', color: '#adb5bd' }}>Cargando opciones...</span>
                            </div>
                        ) : (
                            <>
                                <p style={s.pasotit}>Paso 1 — Selecciona los datos del informe</p>
                                {errPaso1 && <div style={s.errBox}>⚠️ {errPaso1}</div>}

                                <div style={s.campo}>
                                    <label style={s.lbl}>
                                        <FaCalendarAlt style={{ marginRight: 6, color: '#BE1E2D' }} />
                                        Evento <span style={s.req}>*</span>
                                    </label>
                                    <select value={eventoId} onChange={e => setEventoId(e.target.value)} style={s.sel}>
                                        <option value="">— Selecciona un evento finalizado —</option>
                                        {opciones?.eventos.map(ev => (
                                            <option key={ev._id} value={ev._id}>
                                                {ev.titulo} ({new Date(ev.fechaInicio).getFullYear()})
                                            </option>
                                        ))}
                                    </select>
                                    {opciones?.eventos.length === 0 && <span style={s.hint}>No hay eventos finalizados aún.</span>}
                                </div>

                                <div style={s.campo}>
                                    <label style={s.lbl}>
                                        <FaGraduationCap style={{ marginRight: 6, color: '#2e7d32' }} />
                                        Encuesta de Graduados <span style={s.req}>*</span>
                                    </label>
                                    <select value={encGradId} onChange={e => setEncGradId(e.target.value)} style={s.sel}>
                                        <option value="">— Selecciona encuesta cerrada —</option>
                                        {opciones?.encGraduados.map(enc => (
                                            <option key={enc._id} value={enc._id}>
                                                {enc.titulo} ({enc.totalRespuestas} resp.)
                                            </option>
                                        ))}
                                    </select>
                                    {opciones?.encGraduados.length === 0 && <span style={s.hint}>No hay encuestas de graduados cerradas.</span>}
                                </div>

                                <div style={s.campo}>
                                    <label style={s.lbl}>
                                        <FaBuilding style={{ marginRight: 6, color: '#1565c0' }} />
                                        Encuesta de Empleadores <span style={s.req}>*</span>
                                    </label>
                                    <select value={encEmpId} onChange={e => setEncEmpId(e.target.value)} style={s.sel}>
                                        <option value="">— Selecciona encuesta cerrada —</option>
                                        {opciones?.encEmpleadores.map(enc => (
                                            <option key={enc._id} value={enc._id}>
                                                {enc.titulo} ({enc.totalRespuestas} resp.)
                                            </option>
                                        ))}
                                    </select>
                                    {opciones?.encEmpleadores.length === 0 && <span style={s.hint}>No hay encuestas de empleadores cerradas.</span>}
                                </div>

                                <div style={s.campo}>
                                    <label style={s.lbl}>
                                        Año del informe <span style={s.req}>*</span>
                                        <span style={{ marginLeft: 6, fontSize: '0.67rem', color: '#adb5bd', fontWeight: '400' }}>
                                            (autocompletado desde el evento)
                                        </span>
                                    </label>
                                    <input
                                        type="number" value={anio} onChange={e => setAnio(e.target.value)}
                                        min={2020} max={2040} style={{ ...s.sel, width: 120 }}
                                    />
                                </div>

                                {eventoSeleccionado && (
                                    <div style={s.resumenBox}>
                                        <p style={{ margin: '0 0 6px', fontSize: '0.73rem', fontWeight: '700', color: '#2c3e50' }}>
                                            Resumen del informe a generar:
                                        </p>
                                        <p style={s.resumenLin}>📅 <strong>Evento:</strong> {eventoSeleccionado.titulo}</p>
                                        <p style={s.resumenLin}>🎓 <strong>Encuesta graduados:</strong> {opciones?.encGraduados.find(e => e._id === encGradId)?.titulo || '—'}</p>
                                        <p style={s.resumenLin}>🏢 <strong>Encuesta empleadores:</strong> {opciones?.encEmpleadores.find(e => e._id === encEmpId)?.titulo || '—'}</p>
                                        <p style={s.resumenLin}>📄 <strong>Año:</strong> {anio}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* PASO 2 */}
                {paso === 2 && (
                    <div style={s.body}>
                        {cargandoPrev ? (
                            <div style={s.loadBox}>
                                <FaSpinner style={{ fontSize: '1.4rem', color: '#BE1E2D', animation: 'spin 1s linear infinite' }} />
                                <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>Cargando previsualización...</span>
                            </div>
                        ) : exito ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 20px' }}>
                                <FaCheckCircle style={{ fontSize: '3rem', color: '#2e7d32' }} />
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#2c3e50' }}>
                                    ¡Word generado exitosamente!
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d', textAlign: 'center' }}>
                                    El archivo <strong>Informe_Encuentro_Graduados_{anio}.docx</strong> se descargó en tu computadora.
                                    Las secciones B, C, D, F, G y H están vacías para que las completes en Word.
                                </p>
                                <button style={{ ...s.btnPrimario, background: '#2e7d32' }} onClick={onClose}>
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            <>
                                <p style={s.pasotit}>Paso 2 — Previsualización del análisis estadístico</p>
                                <p style={{ margin: '0 0 20px', fontSize: '0.75rem', color: '#6c757d' }}>
                                    Estas gráficas se incluirán en la Sección E del Word.
                                </p>

                                {previewGrad && (
                                    <>
                                        <div style={s.seccionLabel}>
                                            <FaGraduationCap style={{ color: '#2e7d32' }} />
                                            <span>E.1 — Encuesta a Graduados</span>
                                        </div>
                                        <ContadorTotal total={previewGrad.totalRespuestas} color="#2e7d32" />
                                        {previewGrad.estadisticas.length === 0 ? (
                                            <p style={{ fontSize: '0.76rem', color: '#adb5bd', padding: '12px 0' }}>Sin datos de respuestas.</p>
                                        ) : (
                                            previewGrad.estadisticas.map((stat, i) => (
                                                <PreguntaCard key={i} stat={stat} totalEncuesta={previewGrad.totalRespuestas} />
                                            ))
                                        )}
                                    </>
                                )}

                                {previewEmp && (
                                    <>
                                        <div style={{ ...s.seccionLabel, marginTop: 28 }}>
                                            <FaBuilding style={{ color: '#1565c0' }} />
                                            <span>E.2 — Encuesta a Empleadores</span>
                                        </div>
                                        <ContadorTotal total={previewEmp.totalRespuestas} color="#1565c0" />
                                        {previewEmp.estadisticas.length === 0 ? (
                                            <p style={{ fontSize: '0.76rem', color: '#adb5bd', padding: '12px 0' }}>Sin datos de respuestas.</p>
                                        ) : (
                                            previewEmp.estadisticas.map((stat, i) => (
                                                <PreguntaCard key={i} stat={stat} totalEncuesta={previewEmp.totalRespuestas} />
                                            ))
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* PIE */}
                {!exito && (
                    <div style={s.foot}>
                        {paso === 2 && (
                            <button style={s.btnSecundario} onClick={() => setPaso(1)} disabled={descargando}>
                                <FaArrowLeft style={{ fontSize: '0.7rem' }} /> Volver
                            </button>
                        )}
                        <span style={{ flex: 1 }} />
                        <button style={s.btnCerrar} onClick={onClose} disabled={descargando}>Cancelar</button>
                        {paso === 1 ? (
                            <button
                                style={s.btnPrimario} onClick={irPaso2}
                                disabled={cargandoOpc || !eventoId || !encGradId || !encEmpId}
                            >
                                Siguiente <FaArrowRight style={{ fontSize: '0.7rem' }} />
                            </button>
                        ) : (
                            !exito && !cargandoPrev && (
                                <button
                                    style={{ ...s.btnPrimario, background: '#1565c0', gap: 8 }}
                                    onClick={descargarWord} disabled={descargando}
                                >
                                    {descargando
                                        ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Generando Word...</>
                                        : <><FaFileWord style={{ fontSize: '0.85rem' }} /> Descargar Word</>
                                    }
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   ESTILOS
══════════════════════════════════════════════════════════ */
const s = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' },
    modal: { backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 800, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
    head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 13px', borderBottom: '2px solid #BE1E2D', flexShrink: 0 },
    tit: { margin: '0 0 2px', fontSize: '0.95rem', fontWeight: '700', color: '#2c3e50' },
    sub: { margin: 0, fontSize: '0.7rem', color: '#adb5bd' },
    pasos: { display: 'flex', alignItems: 'center', gap: 4 },
    pasoCirculo: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '700', transition: 'all 0.2s' },
    btnClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '1rem', padding: 4, display: 'flex', alignItems: 'center' },
    body: { flex: 1, overflowY: 'auto', padding: '18px 22px' },
    loadBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '40px', background: '#f8f9fa', borderRadius: 8 },
    pasotit: { margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' },
    errBox: { padding: '10px 14px', background: '#fff3e0', border: '1px solid #ffe082', borderLeft: '4px solid #f57f17', borderRadius: 7, color: '#e65100', fontSize: '0.77rem', marginBottom: 14 },
    campo: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
    lbl: { fontSize: '0.78rem', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center' },
    req: { color: '#BE1E2D', marginLeft: 3 },
    sel: { padding: '8px 11px', border: '1px solid #e9ecef', borderRadius: 7, fontSize: '0.8rem', color: '#2c3e50', outline: 'none', background: '#f8f9fa', cursor: 'pointer', fontFamily: "'Segoe UI',Roboto,sans-serif" },
    hint: { fontSize: '0.69rem', color: '#f57f17' },
    resumenBox: { background: '#f0f7ff', border: '1px solid #bbdefb', borderRadius: 8, padding: '12px 16px', marginTop: 8 },
    resumenLin: { margin: '0 0 4px', fontSize: '0.76rem', color: '#2c3e50' },
    seccionLabel: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 10px', borderBottom: '2px solid #f0f0f0', marginBottom: 16, fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' },
    pregCard: { background: '#fafafa', border: '1px solid #e9ecef', borderRadius: 8, padding: '13px 15px', marginBottom: 12 },
    pregTxt: { margin: '0 0 10px', fontSize: '0.79rem', fontWeight: '600', color: '#2c3e50', lineHeight: 1.4 },
    graficaWrap: { background: 'white', borderRadius: 6, padding: '10px', border: '1px solid #f0f0f0' },
    condBlock: { marginTop: 14, borderLeft: '3px solid #e9ecef', paddingLeft: 14 },
    condTag: { display: 'inline-block', fontSize: '0.68rem', fontStyle: 'italic', color: '#adb5bd', marginBottom: 5, background: '#f8f9fa', padding: '2px 8px', borderRadius: 10 },
    subPregTxt: { margin: '0 0 6px', fontSize: '0.76rem', fontWeight: '600', color: '#495057' },
    foot: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa', borderRadius: '0 0 12px 12px', flexShrink: 0 },
    btnPrimario: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#BE1E2D', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' },
    btnSecundario: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', color: '#6c757d', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' },
    btnCerrar: { padding: '8px 14px', background: 'transparent', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#6c757d' },
};

export default ModalReporte;
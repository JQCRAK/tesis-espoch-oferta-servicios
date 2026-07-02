// src/pages/graduado/SeccionHojaVida.jsx
// Experiencias laborales + Educacion formal del graduado.
// Auto-declarado: el graduado es responsable de respaldar la informacion ante las empresas.
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaBriefcase, FaUniversity, FaPlus, FaEdit, FaTrash, FaTimes,
    FaSave, FaSpinner, FaExclamationTriangle, FaCalendarAlt, FaBuilding,
    FaGraduationCap,
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const NIVELES = ['Secundaria', 'Tercer Nivel', 'Cuarto Nivel', 'PhD', 'Otro'];
const ANIO_ACTUAL = new Date().getFullYear();

const fmtRangoFecha = (ini, fin, actual) => {
    if (!ini) return '';
    const opts = { year: 'numeric', month: 'short' };
    const d1 = new Date(ini).toLocaleDateString('es-EC', opts);
    if (actual) return `${d1} — actualidad`;
    if (!fin) return d1;
    const d2 = new Date(fin).toLocaleDateString('es-EC', opts);
    return `${d1} — ${d2}`;
};

const toInputDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date)) return '';
    return date.toISOString().slice(0, 10);
};

// Hook responsive (mismo patron que PerfilGraduado.jsx)
const useWindowSize = () => {
    const [size, setSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1024 });
    useEffect(() => {
        const handler = () => setSize({ width: window.innerWidth });
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return size;
};

// ════════════════════════════════════════════════════════════════════
//  ESTILOS — copia exacta de los usados en Proyectos / Certificados
//  para mantener el mismo lenguaje visual (mismas variables CSS, mismas
//  medidas, mismos tipos de letra heredados del index.css)
// ════════════════════════════════════════════════════════════════════
const s = {
    card: { backgroundColor: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    cardH: { margin: '0 0 3px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-texto-principal)', display: 'flex', alignItems: 'center', gap: 6 },
    cardIco: { color: 'var(--color-espoch-rojo)', fontSize: '0.85rem' },
    cardSub: { margin: '0 0 10px', fontSize: '0.72rem', color: 'var(--color-texto-secundario)' },

    secHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
    btnAddSec: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.77rem', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 },
    btnCancelSec: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer', fontSize: '0.77rem', fontWeight: '600', color: 'var(--color-texto-secundario)', whiteSpace: 'nowrap', flexShrink: 0 },

    formCard: { backgroundColor: 'var(--color-fondo-web)', border: '1px solid #e9ecef', borderRadius: 8, padding: '14px', marginBottom: 14 },
    formH: { margin: '0 0 12px', fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    campo: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 },
    lbl: { fontSize: '0.76rem', fontWeight: '600', color: 'var(--color-texto-principal)' },
    select: { padding: '8px 10px', borderRadius: 6, border: '1px solid #e9ecef', fontSize: '0.83rem', backgroundColor: 'var(--color-fondo-web)', color: 'var(--color-texto-principal)', outline: 'none' },
    inputWrap: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 6, padding: '7px 11px', gap: 8 },
    inp: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.83rem', color: 'var(--color-texto-principal)', fontFamily: 'inherit' },
    icoInp: { fontSize: '0.82rem', color: '#adb5bd', flexShrink: 0 },

    formFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
    btnCancelForm: { padding: '7px 14px', backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer', fontSize: '0.81rem', fontWeight: '600', color: 'var(--color-texto-secundario)' },
    btnSaveForm: { display: 'inline-flex', alignItems: 'center', padding: '7px 16px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', fontSize: '0.83rem', fontWeight: '600', borderRadius: 6, cursor: 'pointer' },

    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', borderRadius: 4, fontSize: '0.78rem' },

    // Item del listado — mismo lenguaje visual que proyectos/certificados
    item:       { border: '1px solid #e9ecef', borderRadius: 8, padding: '10px 12px', marginTop: 8, backgroundColor: 'white' },
    itemHead:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
    itemTitulo: { margin: 0, fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-texto-principal)', flex: 1 },
    itemSub:    { margin: '1px 0 0', fontSize: '0.72rem', color: 'var(--color-texto-secundario)' },
    itemDesc:   { margin: '4px 0 0', fontSize: '0.73rem', color: 'var(--color-texto-principal)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    itemFecha:  { display: 'inline-flex', alignItems: 'center', margin: 0, fontSize: '0.68rem', color: 'var(--color-texto-secundario)', marginTop: 4, gap: 4 },
    itemFooter: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, paddingTop: 6, borderTop: '1px solid #f5f5f5' },

    emptyState: { textAlign: 'center', padding: '20px 16px' },
    emptyIco:   { fontSize: '2rem', color: '#dee2e6', marginBottom: 8 },
    emptyH:     { margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    emptySub:   { margin: '0 0 12px', fontSize: '0.76rem', color: 'var(--color-texto-secundario)' },
    emptyBtn:   { display: 'inline-flex', alignItems: 'center', padding: '7px 14px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.79rem', fontWeight: '600' },

    // Aviso superior — mismo estilo que el "banner" del padre
    aviso: { display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderLeft: '4px solid #f57f17', borderRadius: 8, padding: '12px 16px', marginBottom: 12 },
    avisoIco: { color: '#f57f17', fontSize: '1.05rem', flexShrink: 0, marginTop: 2 },
    avisoTit: { margin: 0, fontWeight: '700', fontSize: '0.84rem', color: 'var(--color-texto-principal)' },
    avisoTxt: { margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--color-texto-secundario)', lineHeight: 1.55 },

    checkboxRow: { display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-texto-principal)', marginBottom: 10 },

    // ── Modal confirmar eliminación (mismo estilo que Proyectos/Certificados) ──
    overlay:        { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16, backdropFilter: 'blur(2px)' },
    modalConfirm:   { backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 390, padding: '32px 28px 24px', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
    modalConfirmIco:{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#ffebee', border: '2px solid #ffcdd2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    modalConfirmH:  { margin: '0 0 4px', fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-texto-principal)' },
    modalConfirmSub:{ margin: '0 0 20px', fontSize: '0.83rem', color: 'var(--color-texto-secundario)', lineHeight: 1.6, maxWidth: 300 },
    modalConfirmBtns:{ display: 'flex', gap: 10, justifyContent: 'center', width: '100%' },
    btnCancelConfirm:{ padding: '8px 18px', backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: 7, cursor: 'pointer', fontSize: '0.84rem', fontWeight: '600', color: 'var(--color-texto-secundario)' },
    btnEliminarConfirm:{ display: 'inline-flex', alignItems: 'center', padding: '8px 22px', backgroundColor: 'var(--estado-error)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.84rem', fontWeight: '700' },
};

// ════════════════════════════════════════════════════════════════════
//  FORMULARIO: Experiencia laboral
// ════════════════════════════════════════════════════════════════════
const FormExperiencia = ({ inicial, onGuardar, onCancelar, guardando }) => {
    const [f, setF] = useState(inicial || {
        cargo: '', empresa: '', fechaInicio: '', fechaFin: '', actual: false, descripcion: '',
    });
    const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
    const submit = (e) => { e.preventDefault(); onGuardar(f); };

    return (
        <form onSubmit={submit} style={s.formCard}>
            <h3 style={s.formH}>{inicial && inicial._id ? 'Editar experiencia' : 'Nueva experiencia'}</h3>

            <div style={s.campo}>
                <label style={s.lbl}>Cargo *</label>
                <div style={s.inputWrap}>
                    <FaBriefcase style={s.icoInp} />
                    <input type="text" value={f.cargo} onChange={e => set('cargo', e.target.value)}
                           placeholder="Ej: Desarrollador Backend" maxLength={120} required style={s.inp} />
                </div>
            </div>

            <div style={s.campo}>
                <label style={s.lbl}>Empresa / Institución *</label>
                <div style={s.inputWrap}>
                    <FaBuilding style={s.icoInp} />
                    <input type="text" value={f.empresa} onChange={e => set('empresa', e.target.value)}
                           placeholder="Ej: Banco Pichincha" maxLength={150} required style={s.inp} />
                </div>
            </div>

            <div style={s.grid2}>
                <div style={s.campo}>
                    <label style={s.lbl}>Fecha de inicio *</label>
                    <div style={s.inputWrap}>
                        <FaCalendarAlt style={s.icoInp} />
                        <input type="date" value={toInputDate(f.fechaInicio)} onChange={e => set('fechaInicio', e.target.value)}
                               max={toInputDate(new Date())} required style={s.inp} />
                    </div>
                </div>
                <div style={s.campo}>
                    <label style={s.lbl}>Fecha de fin</label>
                    <div style={{ ...s.inputWrap, opacity: f.actual ? 0.5 : 1 }}>
                        <FaCalendarAlt style={s.icoInp} />
                        <input type="date" value={toInputDate(f.fechaFin)} onChange={e => set('fechaFin', e.target.value)}
                               max={toInputDate(new Date())} disabled={f.actual} style={s.inp} />
                    </div>
                </div>
            </div>

            <label style={s.checkboxRow}>
                <input type="checkbox" checked={f.actual} onChange={e => set('actual', e.target.checked)} />
                Trabajo actual (todavía estoy en este puesto)
            </label>

            <div style={s.campo}>
                <label style={s.lbl}>Descripción / Logros (opcional)</label>
                <div style={{ ...s.inputWrap, alignItems: 'flex-start', paddingTop: 8 }}>
                    <textarea value={f.descripcion} onChange={e => set('descripcion', e.target.value)}
                              placeholder="¿Qué hiciste? ¿Qué tecnologías usaste? ¿Cuál fue el impacto?"
                              maxLength={500} style={{ ...s.inp, minHeight: 72, resize: 'vertical' }} />
                </div>
                <span style={{ fontSize: '0.69rem', color: 'var(--color-texto-secundario)', marginTop: 2 }}>
                    {(f.descripcion || '').length}/500 caracteres
                </span>
            </div>

            <div style={s.formFooter}>
                <button type="button" onClick={onCancelar} style={s.btnCancelForm} disabled={guardando}>Cancelar</button>
                <button type="submit" style={s.btnSaveForm} disabled={guardando}>
                    {guardando
                        ? <><FaSpinner className="spin" style={{ marginRight: 6 }} />Guardando...</>
                        : <><FaSave style={{ marginRight: 5 }} />{inicial && inicial._id ? 'Actualizar' : 'Guardar'}</>}
                </button>
            </div>
        </form>
    );
};

// ════════════════════════════════════════════════════════════════════
//  FORMULARIO: Educacion formal — solo año de graduacion
// ════════════════════════════════════════════════════════════════════
const FormEducacion = ({ inicial, onGuardar, onCancelar, guardando }) => {
    const [f, setF] = useState(inicial || {
        institucion: '', titulo: '', nivel: 'Tercer Nivel', anioFin: '',
    });
    const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
    const submit = (e) => { e.preventDefault(); onGuardar(f); };

    return (
        <form onSubmit={submit} style={s.formCard}>
            <h3 style={s.formH}>{inicial && inicial._id ? 'Editar educación' : 'Nueva educación'}</h3>

            <div style={s.campo}>
                <label style={s.lbl}>Institución *</label>
                <div style={s.inputWrap}>
                    <FaUniversity style={s.icoInp} />
                    <input type="text" value={f.institucion} onChange={e => set('institucion', e.target.value)}
                           placeholder="Ej: Escuela Superior Politécnica de Chimborazo" maxLength={150} required style={s.inp} />
                </div>
            </div>

            <div style={s.campo}>
                <label style={s.lbl}>Título obtenido *</label>
                <div style={s.inputWrap}>
                    <FaGraduationCap style={s.icoInp} />
                    <input type="text" value={f.titulo} onChange={e => set('titulo', e.target.value)}
                           placeholder="Ej: Ingeniero en Software" maxLength={150} required style={s.inp} />
                </div>
            </div>

            <div style={s.grid2}>
                <div style={s.campo}>
                    <label style={s.lbl}>Nivel académico *</label>
                    <select value={f.nivel} onChange={e => set('nivel', e.target.value)} style={s.select}>
                        {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div style={s.campo}>
                    <label style={s.lbl}>Año de graduación</label>
                    <div style={s.inputWrap}>
                        <FaCalendarAlt style={s.icoInp} />
                        <input type="number" min={1950} max={ANIO_ACTUAL + 10}
                               value={f.anioFin || ''} onChange={e => set('anioFin', e.target.value)}
                               placeholder={`Ej: ${ANIO_ACTUAL}`} style={s.inp} />
                    </div>
                </div>
            </div>

            <div style={s.formFooter}>
                <button type="button" onClick={onCancelar} style={s.btnCancelForm} disabled={guardando}>Cancelar</button>
                <button type="submit" style={s.btnSaveForm} disabled={guardando}>
                    {guardando
                        ? <><FaSpinner className="spin" style={{ marginRight: 6 }} />Guardando...</>
                        : <><FaSave style={{ marginRight: 5 }} />{inicial && inicial._id ? 'Actualizar' : 'Guardar'}</>}
                </button>
            </div>
        </form>
    );
};

// ════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════
const SeccionHojaVida = ({ token, experiencias = [], educacion = [], onOk, onError, onActualizar }) => {
    const { width } = useWindowSize();
    const isMobile = width < 900;

    const notifyOk    = (m) => (typeof onOk === 'function')    ? onOk(m)    : null;
    const notifyError = (m) => (typeof onError === 'function') ? onError(m) : alert(m);

    // Experiencias
    const [verFormExp, setVerFormExp] = useState(false);
    const [editandoExp, setEditandoExp] = useState(null);
    const [guardandoExp, setGuardandoExp] = useState(false);

    // Educacion
    const [verFormEdu, setVerFormEdu] = useState(false);
    const [editandoEdu, setEditandoEdu] = useState(null);
    const [guardandoEdu, setGuardandoEdu] = useState(false);

    // Modal de confirmación (mismo estilo que Proyectos/Certificados)
    const [modalConfirm, setModalConfirm] = useState({ abierto: false, tipo: '', titulo: '', onConfirmar: null });
    const cerrarModalConfirm = () => setModalConfirm({ abierto: false, tipo: '', titulo: '', onConfirmar: null });

    const headers = { Authorization: `Bearer ${token}` };

    // ── handlers experiencia ──
    const guardarExp = async (data) => {
        setGuardandoExp(true);
        try {
            if (editandoExp && editandoExp._id) {
                const { data: r } = await axios.put(`${API_URL}/perfil/experiencias/${editandoExp._id}`, data, { headers });
                onActualizar({ experienciasLaborales: r.experiencias });
                notifyOk('Experiencia actualizada');
            } else {
                const { data: r } = await axios.post(`${API_URL}/perfil/experiencias`, data, { headers });
                onActualizar({ experienciasLaborales: r.experiencias });
                notifyOk('Experiencia agregada');
            }
            setVerFormExp(false); setEditandoExp(null);
        } catch (err) {
            notifyError(err.response?.data?.msg || 'Error al guardar experiencia');
        } finally { setGuardandoExp(false); }
    };

    const pedirBorrarExp = (exp) => {
        setModalConfirm({
            abierto: true,
            tipo: 'experiencia',
            titulo: `${exp.cargo} — ${exp.empresa}`,
            onConfirmar: async () => {
                try {
                    const { data: r } = await axios.delete(`${API_URL}/perfil/experiencias/${exp._id}`, { headers });
                    onActualizar({ experienciasLaborales: r.experiencias });
                    notifyOk('Experiencia eliminada');
                } catch (err) {
                    notifyError(err.response?.data?.msg || 'Error al eliminar');
                } finally {
                    cerrarModalConfirm();
                }
            },
        });
    };

    // ── handlers educacion ──
    const guardarEdu = async (data) => {
        setGuardandoEdu(true);
        try {
            if (editandoEdu && editandoEdu._id) {
                const { data: r } = await axios.put(`${API_URL}/perfil/educacion/${editandoEdu._id}`, data, { headers });
                onActualizar({ educacionFormal: r.educacion });
                notifyOk('Educación actualizada');
            } else {
                const { data: r } = await axios.post(`${API_URL}/perfil/educacion`, data, { headers });
                onActualizar({ educacionFormal: r.educacion });
                notifyOk('Educación agregada');
            }
            setVerFormEdu(false); setEditandoEdu(null);
        } catch (err) {
            notifyError(err.response?.data?.msg || 'Error al guardar educación');
        } finally { setGuardandoEdu(false); }
    };

    const pedirBorrarEdu = (edu) => {
        setModalConfirm({
            abierto: true,
            tipo: 'educación',
            titulo: `${edu.titulo} — ${edu.institucion}`,
            onConfirmar: async () => {
                try {
                    const { data: r } = await axios.delete(`${API_URL}/perfil/educacion/${edu._id}`, { headers });
                    onActualizar({ educacionFormal: r.educacion });
                    notifyOk('Educación eliminada');
                } catch (err) {
                    notifyError(err.response?.data?.msg || 'Error al eliminar');
                } finally {
                    cerrarModalConfirm();
                }
            },
        });
    };

    const expsOrdenadas = experiencias.slice().sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
    const edusOrdenadas = educacion.slice().sort((a, b) => (b.anioFin || 0) - (a.anioFin || 0));

    return (
        <div>
            {/* AVISO al graduado (responsabilidad propia, no admin) */}
            <div style={s.aviso}>
                <FaExclamationTriangle style={s.avisoIco} />
                <div>
                    <p style={s.avisoTit}>Solo registra información real y demostrable</p>
                    <p style={s.avisoTxt}>
                        Cuando postules a una empresa, te pedirán certificados que respalden cada experiencia
                        y título académico que figure en tu hoja de vida. Si inventas datos, la empresa lo
                        detectará y <strong>perderás credibilidad</strong>. Sé honesto: tú eres responsable
                        de poder respaldar todo lo que escribas aquí.
                    </p>
                </div>
            </div>

            {/* GRID 2 columnas (1 columna en movil/tablet) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
                alignItems: 'stretch',
            }}>

                {/* ═══════════════ EXPERIENCIA LABORAL ═══════════════ */}
                <div style={{ ...s.card, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={s.secHeader}>
                        <div>
                            <h2 style={s.cardH}><FaBriefcase style={s.cardIco} />Experiencia laboral</h2>
                            <p style={s.cardSub}>
                                Empleos previos y actuales · <span style={{ fontWeight: 700, color: 'var(--color-texto-secundario)' }}>{experiencias.length}</span>
                            </p>
                        </div>
                        <button
                            style={verFormExp ? s.btnCancelSec : s.btnAddSec}
                            onClick={() => {
                                if (verFormExp) { setVerFormExp(false); setEditandoExp(null); }
                                else { setEditandoExp(null); setVerFormExp(true); }
                            }}
                        >
                            {verFormExp
                                ? <><FaTimes style={{ marginRight: 4 }} />Cancelar</>
                                : <><FaPlus style={{ marginRight: 4 }} />Nuevo</>}
                        </button>
                    </div>

                    {verFormExp && (
                        <FormExperiencia
                            inicial={editandoExp || null}
                            onGuardar={guardarExp}
                            onCancelar={() => { setVerFormExp(false); setEditandoExp(null); }}
                            guardando={guardandoExp}
                        />
                    )}

                    {experiencias.length === 0 && !verFormExp ? (
                        <div style={s.emptyState}>
                            <FaBriefcase style={s.emptyIco} />
                            <p style={s.emptyH}>Aún no tienes experiencias registradas</p>
                            <p style={s.emptySub}>Agrega tus empleos para mostrar tu trayectoria</p>
                            <button style={s.emptyBtn} onClick={() => setVerFormExp(true)}>
                                <FaPlus style={{ marginRight: 5 }} />Agregar primera experiencia
                            </button>
                        </div>
                    ) : (
                        <div>
                            {expsOrdenadas.map(exp => (
                                <div key={exp._id} style={s.item}>
                                    <div style={s.itemHead}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={s.itemTitulo}>{exp.cargo}</h3>
                                            <p style={s.itemSub}>{exp.empresa}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                                            <button style={s.iconBtn} onClick={() => { setEditandoExp(exp); setVerFormExp(true); }}><FaEdit /></button>
                                            <button style={{ ...s.iconBtn, color: 'var(--estado-error)' }} onClick={() => pedirBorrarExp(exp)}><FaTrash /></button>
                                        </div>
                                    </div>
                                    {exp.descripcion && <p style={s.itemDesc}>{exp.descripcion}</p>}
                                    <div style={s.itemFooter}>
                                        <span style={s.itemFecha}><FaCalendarAlt />{fmtRangoFecha(exp.fechaInicio, exp.fechaFin, exp.actual)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══════════════ EDUCACIÓN FORMAL ═══════════════ */}
                <div style={{ ...s.card, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={s.secHeader}>
                        <div>
                            <h2 style={s.cardH}><FaUniversity style={s.cardIco} />Educación formal</h2>
                            <p style={s.cardSub}>
                                Títulos académicos obtenidos · <span style={{ fontWeight: 700, color: 'var(--color-texto-secundario)' }}>{educacion.length}</span>
                            </p>
                        </div>
                        <button
                            style={verFormEdu ? s.btnCancelSec : s.btnAddSec}
                            onClick={() => {
                                if (verFormEdu) { setVerFormEdu(false); setEditandoEdu(null); }
                                else { setEditandoEdu(null); setVerFormEdu(true); }
                            }}
                        >
                            {verFormEdu
                                ? <><FaTimes style={{ marginRight: 4 }} />Cancelar</>
                                : <><FaPlus style={{ marginRight: 4 }} />Nuevo</>}
                        </button>
                    </div>

                    {verFormEdu && (
                        <FormEducacion
                            inicial={editandoEdu || null}
                            onGuardar={guardarEdu}
                            onCancelar={() => { setVerFormEdu(false); setEditandoEdu(null); }}
                            guardando={guardandoEdu}
                        />
                    )}

                    {educacion.length === 0 && !verFormEdu ? (
                        <div style={s.emptyState}>
                            <FaUniversity style={s.emptyIco} />
                            <p style={s.emptyH}>Aún no has registrado tus títulos</p>
                            <p style={s.emptySub}>Agrega tus estudios formales (bachillerato, pregrado, postgrado)</p>
                            <button style={s.emptyBtn} onClick={() => setVerFormEdu(true)}>
                                <FaPlus style={{ marginRight: 5 }} />Agregar primer título
                            </button>
                        </div>
                    ) : (
                        <div>
                            {edusOrdenadas.map(edu => (
                                <div key={edu._id} style={s.item}>
                                    <div style={s.itemHead}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={s.itemTitulo}>{edu.titulo}</h3>
                                            <p style={s.itemSub}>{edu.institucion} · {edu.nivel}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                                            <button style={s.iconBtn} onClick={() => { setEditandoEdu(edu); setVerFormEdu(true); }}><FaEdit /></button>
                                            <button style={{ ...s.iconBtn, color: 'var(--estado-error)' }} onClick={() => pedirBorrarEdu(edu)}><FaTrash /></button>
                                        </div>
                                    </div>
                                    {edu.anioFin && (
                                        <div style={s.itemFooter}>
                                            <span style={s.itemFecha}><FaCalendarAlt />Graduado en {edu.anioFin}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* ══ MODAL CONFIRMAR ELIMINACIÓN ══ */}
            {modalConfirm.abierto && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) cerrarModalConfirm(); }}>
                    <div style={s.modalConfirm}>
                        <div style={s.modalConfirmIco}>
                            <FaTrash style={{ fontSize: '1.5rem', color: 'var(--estado-error)' }} />
                        </div>
                        <h3 style={s.modalConfirmH}>¿Eliminar {modalConfirm.tipo}?</h3>
                        <p style={s.modalConfirmSub}>
                            Estás a punto de eliminar <strong>"{modalConfirm.titulo}"</strong>. Esta acción no se puede deshacer.
                        </p>
                        <div style={s.modalConfirmBtns}>
                            <button style={s.btnCancelConfirm} onClick={cerrarModalConfirm}>Cancelar</button>
                            <button style={s.btnEliminarConfirm} onClick={() => modalConfirm.onConfirmar && modalConfirm.onConfirmar()}>
                                <FaTrash style={{ marginRight: 6, fontSize: '0.8rem' }} />Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeccionHojaVida;

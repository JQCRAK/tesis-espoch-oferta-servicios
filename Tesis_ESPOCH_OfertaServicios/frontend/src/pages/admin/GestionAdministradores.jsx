// frontend/src/pages/admin/GestionAdministradores.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    FaUserShield, FaPlus, FaTimes, FaSave, FaSpinner, FaEdit, FaTrash,
    FaHistory, FaExclamationTriangle, FaUserPlus, FaUserMinus, FaUserEdit,
} from 'react-icons/fa';
import { leerSesion } from '../../utils/storageSeguro';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8351/api';
const FONT = "'Rotis', 'Segoe UI',Roboto,sans-serif";
const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};

const FORM_VACIO = { nombre: '', apellidos: '', email: '', cargo: '', password: '' };
const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const ACCIONES = {
    CREAR_ADMINISTRADOR: { label: 'Agregado', Icon: FaUserPlus, bg: '#e8f5e9', border: '#c8e6c9', color: '#2e7d32' },
    EDITAR_ADMINISTRADOR: { label: 'Editado', Icon: FaUserEdit, bg: '#e3f2fd', border: '#bbdefb', color: '#1565c0' },
    ELIMINAR_ADMINISTRADOR: { label: 'Eliminado', Icon: FaUserMinus, bg: '#ffebee', border: '#ffcdd2', color: '#c62828' },
};

const iniciales = (n = '', a = '') => `${n[0] || ''}${a[0] || ''}`.toUpperCase() || '?';
const fmtFecha = (f) => new Date(f).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtFechaHora = (f) => new Date(f).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const GestionAdministradores = () => {
    const [admins, setAdmins] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');

    const [modalForm, setModalForm] = useState({ abierto: false, id: null });
    const [form, setForm] = useState(FORM_VACIO);
    const [errForm, setErrForm] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [modalElim, setModalElim] = useState({ abierto: false, id: null, nombre: '' });
    const [eliminando, setEliminando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true); setError('');
        try {
            const [aRes, hRes] = await Promise.all([
                axios.get(`${API}/admin/administradores`, { headers: hdrs() }),
                axios.get(`${API}/admin/administradores/historial`, { headers: hdrs() }),
            ]);
            setAdmins(aRes.data.administradores || []);
            setMovimientos(hRes.data.movimientos || []);
        } catch (e) {
            setError(e.response?.data?.msg || 'No se pudieron cargar los administradores.');
        } finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const abrirNuevo = () => { setForm(FORM_VACIO); setErrForm(''); setModalForm({ abierto: true, id: null }); };
    const abrirEditar = (a) => {
        setForm({ nombre: a.nombre, apellidos: a.apellidos, email: a.email, cargo: a.cargo, password: '' });
        setErrForm('');
        setModalForm({ abierto: true, id: a._id });
    };
    const cerrarForm = () => { if (!guardando) setModalForm({ abierto: false, id: null }); };
    const cambiar = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

    const guardar = async () => {
        const editando = !!modalForm.id;
        if (!form.nombre.trim() || !form.apellidos.trim() || !form.email.trim() || !form.cargo.trim())
            return setErrForm('Completa nombres, apellidos, correo y cargo.');
        if (!editando && !form.password)
            return setErrForm('Ingresa una contraseña inicial.');
        if (form.password && !REGEX_PASSWORD.test(form.password))
            return setErrForm('La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.');

        setGuardando(true); setErrForm('');
        try {
            const datos = { nombre: form.nombre, apellidos: form.apellidos, email: form.email, cargo: form.cargo };
            if (form.password) datos.password = form.password;
            const resp = editando
                ? await axios.patch(`${API}/admin/administradores/${modalForm.id}`, datos, { headers: hdrs() })
                : await axios.post(`${API}/admin/administradores`, datos, { headers: hdrs() });
            setModalForm({ abierto: false, id: null });
            setAviso(resp.data.msg);
            await cargar();
        } catch (e) {
            setErrForm(e.response?.data?.msg || 'No se pudo guardar el administrador.');
        } finally { setGuardando(false); }
    };

    const eliminar = async () => {
        setEliminando(true);
        try {
            const resp = await axios.delete(`${API}/admin/administradores/${modalElim.id}`, { headers: hdrs() });
            setAviso(resp.data.msg);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.msg || 'No se pudo eliminar el administrador.');
        } finally {
            setEliminando(false);
            setModalElim({ abierto: false, id: null, nombre: '' });
        }
    };

    const editando = !!modalForm.id;

    return (
        <div style={s.page}>

            {/* TABLA */}
            <div style={s.card}>
                <div style={s.cardHead}>
                    <div>
                        <h2 style={s.cardTit}>Gestión de Administradores</h2>
                        {!cargando && !error && <p style={s.cardSub}>{admins.length} administrador(es) con acceso al panel</p>}
                    </div>
                    <button style={s.btnNuevo} onClick={abrirNuevo}>
                        <FaPlus style={{ fontSize: '0.95rem' }} />Nuevo Administrador
                    </button>
                </div>

                {aviso && (
                    <p style={s.okMsg}>
                        {aviso}
                        <button style={s.cerrarAviso} onClick={() => setAviso('')} title="Cerrar"><FaTimes /></button>
                    </p>
                )}
                {error && <p style={s.errMsg}>{error}</p>}

                <div style={{ overflowX: 'auto' }}>
                    <table style={s.tabla}>
                        <thead>
                            <tr style={s.trHead}>
                                {['ADMINISTRADOR', 'CORREO', 'CARGO', 'REGISTRADO', 'ACCIONES'].map(h => <th key={h} style={s.th}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {cargando
                                ? Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 5 }).map((__, j) => <td key={j} style={s.td}><div style={{ ...s.skBar, width: j === 0 ? '70%' : '50%' }} /></td>)}</tr>
                                ))
                                : admins.length === 0
                                    ? <tr><td colSpan={5} style={s.tdVacio}>No hay administradores registrados.</td></tr>
                                    : admins.map(a => (
                                        <tr key={a._id} style={s.trBody}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={s.td}>
                                                <div style={s.nomCell}>
                                                    <div style={s.avatar}>{iniciales(a.nombre, a.apellidos)}</div>
                                                    <p style={s.nomTxt}>
                                                        {a.nombre} {a.apellidos}
                                                        {a.esActual && <span style={s.badgeTu}>Tú</span>}
                                                    </p>
                                                </div>
                                            </td>
                                            <td style={s.td}><span style={s.txtGris}>{a.email}</span></td>
                                            <td style={s.td}><span style={s.txtGris}>{a.cargo}</span></td>
                                            <td style={s.td}><span style={{ fontSize: '0.95rem', color: '#adb5bd' }}>{a.createdAt ? fmtFecha(a.createdAt) : '—'}</span></td>
                                            <td style={s.td}>
                                                <div style={s.accsRow}>
                                                    <button style={{ ...s.btnAcc, background: '#e3f2fd', border: '1px solid #bbdefb', color: '#1565c0' }} onClick={() => abrirEditar(a)} title="Editar"><FaEdit style={{ fontSize: '0.95rem' }} /></button>
                                                    <button
                                                        style={{ ...s.btnAcc, background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', opacity: a.esActual ? 0.35 : 1, cursor: a.esActual ? 'not-allowed' : 'pointer' }}
                                                        onClick={() => setModalElim({ abierto: true, id: a._id, nombre: `${a.nombre} ${a.apellidos}` })}
                                                        disabled={a.esActual}
                                                        title={a.esActual ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}
                                                    ><FaTrash style={{ fontSize: '0.95rem' }} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* HISTORIAL DE MOVIMIENTOS */}
            <div style={s.card}>
                <div style={s.cardHead}>
                    <div>
                        <h2 style={s.cardTit}><FaHistory style={{ fontSize: '0.95rem', marginRight: 7, color: '#adb5bd' }} />Historial de Movimientos</h2>
                        <p style={s.cardSub}>Quién agregó, editó o eliminó administradores</p>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={s.tabla}>
                        <thead>
                            <tr style={s.trHead}>
                                {['FECHA', 'ACCIÓN', 'REALIZADO POR', 'DETALLE'].map(h => <th key={h} style={s.th}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {!cargando && movimientos.length === 0
                                ? <tr><td colSpan={4} style={s.tdVacio}>Aún no hay movimientos registrados.</td></tr>
                                : movimientos.map(m => {
                                    const acc = ACCIONES[m.accion] || { label: m.accion, Icon: FaUserShield, bg: '#f8f9fa', border: '#e9ecef', color: '#6c757d' };
                                    return (
                                        <tr key={m._id} style={s.trBody}>
                                            <td style={{ ...s.td, whiteSpace: 'nowrap' }}><span style={{ fontSize: '0.9rem', color: '#6c757d' }}>{fmtFechaHora(m.fechaHora)}</span></td>
                                            <td style={s.td}>
                                                <span style={{ ...s.badge, background: acc.bg, color: acc.color, border: `1px solid ${acc.border}` }}>
                                                    <acc.Icon style={{ fontSize: '0.8rem', marginRight: 5, verticalAlign: '-1px' }} />{acc.label}
                                                </span>
                                            </td>
                                            <td style={s.td}><span style={s.txtGris}>{m.usuarioEmail}</span></td>
                                            <td style={s.td}><span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>{m.descripcion}</span></td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {modalForm.abierto && (
                <div style={s.overlay} onClick={cerrarForm}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={{ ...s.modalHead, borderBottomColor: '#BC0613' }}>
                            <div>
                                <h3 style={s.modalTit}>{editando ? 'Editar Administrador' : 'Nuevo Administrador'}</h3>
                                <p style={s.modalSub}>{editando ? 'Actualiza los datos de la cuenta' : 'Tendrá acceso completo al panel de administración'}</p>
                            </div>
                            <button style={s.modalClose} onClick={cerrarForm}><FaTimes /></button>
                        </div>
                        <div style={s.modalBody}>
                            <div style={s.grid2}>
                                <label style={s.campo}>
                                    <span style={s.label}>NOMBRES</span>
                                    <input style={s.input} value={form.nombre} onChange={cambiar('nombre')} maxLength={60} />
                                </label>
                                <label style={s.campo}>
                                    <span style={s.label}>APELLIDOS</span>
                                    <input style={s.input} value={form.apellidos} onChange={cambiar('apellidos')} maxLength={60} />
                                </label>
                            </div>
                            <label style={s.campo}>
                                <span style={s.label}>CORREO ELECTRÓNICO</span>
                                <input style={s.input} type="email" value={form.email} onChange={cambiar('email')} placeholder="usuario@espoch.edu.ec" maxLength={100} />
                            </label>
                            <label style={s.campo}>
                                <span style={s.label}>CARGO</span>
                                <input style={s.input} value={form.cargo} onChange={cambiar('cargo')} placeholder="Ej. Docente, Coordinador de Carrera" maxLength={80} />
                            </label>
                            <label style={s.campo}>
                                <span style={s.label}>{editando ? 'NUEVA CONTRASEÑA (OPCIONAL)' : 'CONTRASEÑA INICIAL'}</span>
                                <input style={s.input} type="password" value={form.password} onChange={cambiar('password')} autoComplete="new-password" />
                                <span style={s.ayuda}>
                                    Mínimo 8 caracteres, una mayúscula, un número y un símbolo.
                                    {editando ? ' Déjala vacía para no cambiarla.' : ' El administrador puede cambiarla desde "¿Olvidaste tu contraseña?".'}
                                </span>
                            </label>
                            {errForm && <p style={{ ...s.errMsg, margin: '4px 0 0' }}>{errForm}</p>}
                        </div>
                        <div style={s.modalFoot}>
                            <button style={s.btnCancelar} onClick={cerrarForm} disabled={guardando}>Cancelar</button>
                            <button style={{ ...s.btnGuardar, opacity: guardando ? 0.7 : 1 }} onClick={guardar} disabled={guardando}>
                                {guardando ? <FaSpinner style={{ marginRight: 7 }} /> : <FaSave style={{ marginRight: 7 }} />}
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {modalElim.abierto && (
                <div style={s.overlay}>
                    <div style={s.modalConfirm}>
                        <div style={s.confirmIco}><FaExclamationTriangle style={{ fontSize: '1.4rem', color: '#c62828' }} /></div>
                        <h3 style={s.confirmH}>¿Eliminar administrador?</h3>
                        <p style={s.confirmSub}>
                            <strong>{modalElim.nombre}</strong> perderá el acceso al panel de inmediato. Esta acción queda registrada en el historial.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={s.btnCancelar} onClick={() => setModalElim({ abierto: false, id: null, nombre: '' })} disabled={eliminando}>Cancelar</button>
                            <button style={{ ...s.btnGuardar, backgroundColor: '#c62828', opacity: eliminando ? 0.7 : 1 }} onClick={eliminar} disabled={eliminando}>
                                <FaTrash style={{ marginRight: 7 }} />{eliminando ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    page: { maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: FONT },
    card: { backgroundColor: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10, flexWrap: 'wrap' },
    cardTit: { margin: '0 0 2px', fontSize: '1.1rem', fontWeight: '700', color: '#2c3e50' },
    cardSub: { margin: 0, fontSize: '0.95rem', color: '#adb5bd' },
    btnNuevo: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', backgroundColor: '#BC0613', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '1rem', fontWeight: '700', flexShrink: 0 },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    trHead: { borderBottom: '2px solid #f0f0f0' },
    th: { padding: '8px 10px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.7px', whiteSpace: 'nowrap' },
    trBody: { borderBottom: '1px solid #f8f9fa', transition: 'background 0.1s' },
    td: { padding: '10px 10px', verticalAlign: 'middle' },
    tdVacio: { padding: '32px 10px', textAlign: 'center', color: '#adb5bd', fontSize: '1rem' },
    skBar: { height: 11, borderRadius: 5, background: '#f0f0f0' },
    nomCell: { display: 'flex', alignItems: 'center', gap: 9 },
    avatar: { width: 36, height: 36, borderRadius: 8, background: '#BC0613', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: '700', flexShrink: 0 },
    nomTxt: { margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#2c3e50', whiteSpace: 'nowrap' },
    txtGris: { fontSize: '0.95rem', color: '#6c757d' },
    badge: { display: 'inline-block', fontSize: '0.85rem', fontWeight: '600', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
    badgeTu: { marginLeft: 7, fontSize: '0.75rem', fontWeight: '700', padding: '2px 7px', borderRadius: 20, background: '#fff1f2', color: '#BC0613', border: '1px solid #fecdd3' },
    accsRow: { display: 'flex', gap: 5, alignItems: 'center' },
    btnAcc: { width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', border: '1px solid #e9ecef', cursor: 'pointer', color: '#6c757d', flexShrink: 0 },
    errMsg: { padding: '10px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 7, color: '#c62828', fontSize: '0.95rem', margin: '0 0 10px' },
    okMsg: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px', background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 7, color: '#2e7d32', fontSize: '0.95rem', margin: '0 0 10px' },
    cerrarAviso: { background: 'none', border: 'none', cursor: 'pointer', color: '#2e7d32', fontSize: '0.85rem', padding: 2, display: 'flex' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' },
    modal: { backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', fontFamily: FONT },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px 13px', borderBottom: '2px solid', flexShrink: 0 },
    modalTit: { margin: '0 0 2px', fontSize: '1.1rem', fontWeight: '700', color: '#2c3e50' },
    modalSub: { margin: 0, fontSize: '0.95rem', color: '#adb5bd' },
    modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '1.1rem', padding: 4 },
    modalBody: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa', borderRadius: '0 0 12px 12px', flexShrink: 0, alignItems: 'center' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    campo: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: '0.8rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.4px' },
    input: { padding: '9px 11px', border: '1px solid #e9ecef', borderRadius: 7, fontSize: '0.95rem', color: '#2c3e50', outline: 'none', background: '#f8f9fa', fontFamily: FONT, width: '100%', boxSizing: 'border-box' },
    ayuda: { fontSize: '0.8rem', color: '#adb5bd', lineHeight: 1.4 },
    btnCancelar: { padding: '8px 16px', background: 'transparent', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '1rem', fontWeight: '600', color: '#6c757d' },
    btnGuardar: { display: 'inline-flex', alignItems: 'center', padding: '8px 18px', backgroundColor: '#BC0613', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '1rem', fontWeight: '700' },
    modalConfirm: { backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 380, padding: '28px 24px 22px', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: FONT },
    confirmIco: { width: 56, height: 56, borderRadius: '50%', backgroundColor: '#ffebee', border: '2px solid #ffcdd2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    confirmH: { margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '700', color: '#2c3e50' },
    confirmSub: { margin: '0 0 16px', fontSize: '0.95rem', color: '#6c757d', lineHeight: 1.6 },
};

export default GestionAdministradores;

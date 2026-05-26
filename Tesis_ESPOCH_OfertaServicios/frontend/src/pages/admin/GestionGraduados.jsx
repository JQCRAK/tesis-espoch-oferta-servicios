// frontend/src/pages/admin/GestionGraduados.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    FaUserGraduate, FaCheckCircle, FaClock, FaSearch, FaGlobe,
    FaLock, FaUnlock, FaChevronLeft, FaChevronRight,
    FaFilter, FaCalendarAlt, FaUserPlus, FaTimes, FaSave,
    FaSpinner, FaEdit, FaCode, FaCertificate,
    FaLink, FaExternalLinkAlt, FaHandshake, FaTrash,
    FaExclamationTriangle, FaEye, FaIdCard, FaPhone,
    FaEnvelope, FaVenusMars, FaBirthdayCake, FaWheelchair,
    FaGithub, FaLinkedin, FaUpload, FaDownload,
    FaUsers, FaUser, FaFileAlt, FaChevronDown,
} from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
import { leerSesion } from '../../utils/storageSeguro';

const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};

const iniciales = (n = '', a = '') => `${n[0] || ''}${a[0] || ''}`.toUpperCase() || '?';
const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-EC', { year: 'numeric', month: 'short' }) : '—';
const fmtFechaLarga = (d) => d ? new Date(d).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

const pareceEncriptado = (val) => {
    if (!val || typeof val !== 'string') return false;
    return val.length > 30 && !/\s/.test(val) && /[^a-zA-Z0-9@.\-_+]/.test(val);
};
const valorSeguro = (val) => pareceEncriptado(val) ? '••••••••' : (val || '—');

const EST_BADGE = {
    verificado: { label: 'Verificado', bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
    pendiente: { label: 'Pendiente', bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
    bloqueado: { label: 'Bloqueado', bg: '#ffebee', color: '#c62828', border: '#ffcdd2' },
};
const TEC_COLORS = [
    { bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb' },
    { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
    { bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
    { bg: '#f3e8ff', color: '#6a1b9a', border: '#ddd6fe' },
    { bg: '#ffebee', color: '#c62828', border: '#ffcdd2' },
    { bg: '#e0f7fa', color: '#006064', border: '#b2ebf2' },
];
const tecColor = (n = '') => TEC_COLORS[n.charCodeAt(0) % TEC_COLORS.length];
const estadoGrad = (g) => g.cuentaBloqueada ? 'bloqueado' : g.verificado ? 'verificado' : 'pendiente';

const METS = [
    { key: 'totalGraduados', etiq: 'GRADUADOS REGISTRADOS', icon: FaUserGraduate, color: '#e53935', bg: '#ffebee', border: '#ffcdd2', top: '#e53935' },
    { key: 'perfilesPublicos', etiq: 'PERFILES PÚBLICOS', icon: FaGlobe, color: '#1976d2', bg: '#e3f2fd', border: '#bbdefb', top: '#1976d2' },
    { key: 'verificados', etiq: 'CUENTAS VERIFICADAS', icon: FaCheckCircle, color: '#2e7d32', bg: '#e8f5e9', border: '#c8e6c9', top: '#2e7d32' },
    { key: 'disponibles', etiq: 'DISPONIBLES', icon: FaClock, color: '#f57f17', bg: '#fff8e1', border: '#ffe082', top: '#f57f17' },
];
const LIMIT = 20;

/* ═══════════════════════════════════════════════════════════ */
const GestionGraduados = () => {
    /* Lista */
    const [metricas, setMetricas] = useState(null);
    const [graduados, setGraduados] = useState([]);
    const [total, setTotal] = useState(0);
    const [paginas, setPaginas] = useState(1);
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [aniosDispo, setAniosDispo] = useState([]);

    /* Filtros */
    const [buscar, setBuscar] = useState('');
    const [filtroEst, setFiltroEst] = useState('');
    const [filtroAnio, setFiltroAnio] = useState('');

    /* Acción en fila */
    const [accion, setAccion] = useState({ id: null, tipo: '' });

    /* ── Dropdown "Nuevo Graduado" ── */
    const [menuNuevo, setMenuNuevo] = useState(false);
    const menuRef = useRef(null);

    /* ── Modal VER ── */
    const [modalVer, setModalVer] = useState(false);
    const [gradDetalle, setGradDetalle] = useState(null);
    const [gradSel, setGradSel] = useState(null);
    const [proysSel, setProysSel] = useState([]);
    const [certsSel, setCertsSel] = useState([]);
    const [cargandoVer, setCargandoVer] = useState(false);
    const [tabVer, setTabVer] = useState('info');

    /* Edición contacto en modal VER */
    const [editandoContacto, setEditandoContacto] = useState(false);
    const [formContacto, setFormContacto] = useState({ telefono: '', emailPersonal: '' });
    const [guardandoContacto, setGuardandoContacto] = useState(false);
    const [errContacto, setErrContacto] = useState('');

    /* Confirmar eliminar proyecto/cert */
    const [confirmElim, setConfirmElim] = useState({ abierto: false, tipo: '', id: '', titulo: '' });
    const [eliminando, setEliminando] = useState(false);

    /* ── Modal eliminar ESTUDIANTE ── */
    const [modalElimEst, setModalElimEst] = useState({ abierto: false, id: null, nombre: '' });
    const [eliminandoEst, setEliminandoEst] = useState(false);

    /* ── Modal INDIVIDUAL ── */
    const [modalInd, setModalInd] = useState(false);
    const [guardandoInd, setGuardandoInd] = useState(false);
    const [errInd, setErrInd] = useState('');
    const [formInd, setFormInd] = useState({
        nombres: '', apellidos: '', cedula: '', emailPersonal: '',
        telefono: '', genero: '', fechaNacimiento: '', tieneDiscapacidad: 'No',
    });

    /* ── Modal MASIVO CSV ── */
    const [modalMasivo, setModalMasivo] = useState(false);
    const [archivoCsv, setArchivoCsv] = useState(null);
    const [cargandoMasivo, setCargandoMasivo] = useState(false);
    const [errMasivo, setErrMasivo] = useState('');
    const csvInputRef = useRef(null);

    /* ── Modal REPORTE ── */
    const [modalReporte, setModalReporte] = useState(false);
    const [reporte, setReporte] = useState(null);
    const [tabReporte, setTabReporte] = useState('todos');

    /* ── Cerrar dropdown al click fuera ── */
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuNuevo(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── Carga lista ── */
    const cargar = useCallback(async (q = '', est = '', anio = '', pag = 1) => {
        setCargando(true); setError('');
        try {
            const params = new URLSearchParams({ page: pag, limit: LIMIT });
            if (q) params.append('buscar', q);
            if (anio) params.append('anio', anio);
            if (est === 'antiguo') params.append('estado', 'bloqueado');
            else if (est) params.append('estado', est);

            const [mRes, gRes, aRes] = await Promise.all([
                axios.get(`${API}/admin/metricas`, { headers: hdrs() }),
                axios.get(`${API}/admin/graduados?${params}`, { headers: hdrs() }),
                axios.get(`${API}/admin/anios-graduacion`, { headers: hdrs() }),
            ]);
            setMetricas(mRes.data);
            let lista = gRes.data.graduados;
            if (est === 'antiguo') {
                const corte = new Date().getFullYear() - 5;
                lista = lista.filter(g => g.anioGraduacion && g.anioGraduacion <= corte);
            }
            setGraduados(lista);
            setTotal(gRes.data.total);
            setPaginas(gRes.data.totalPaginas);
            setAniosDispo(aRes.data);
        } catch (e) {
            console.error(e); setError('Error al cargar. Verifica tu sesión.');
        } finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        const t = setTimeout(() => { setPagina(1); cargar(buscar, filtroEst, filtroAnio, 1); }, 380);
        return () => clearTimeout(t);
    }, [buscar, filtroEst, filtroAnio]);

    const irPagina = (p) => { setPagina(p); cargar(buscar, filtroEst, filtroAnio, p); };

    /* ── Abrir modal VER ── */
    const abrirVer = async (g, abrirEdicion = false) => {
        setGradSel(g);
        setGradDetalle(null);
        setProysSel([]); setCertsSel([]);
        setEditandoContacto(abrirEdicion);
        setErrContacto('');
        setTabVer('info');
        setModalVer(true);
        setCargandoVer(true);
        setFormContacto({ telefono: '', emailPersonal: '' });
        try {
            const [dRes, pRes, cRes] = await Promise.all([
                axios.get(`${API}/admin/graduados/${g._id}`, { headers: hdrs() }),
                axios.get(`${API}/admin/graduados/${g._id}/proyectos`, { headers: hdrs() }),
                axios.get(`${API}/admin/graduados/${g._id}/certificados`, { headers: hdrs() }),
            ]);
            const detalle = dRes.data;
            setGradDetalle(detalle);
            setFormContacto({
                telefono: pareceEncriptado(detalle.telefono) ? '' : (detalle.telefono || ''),
                emailPersonal: pareceEncriptado(detalle.emailPersonal) ? '' : (detalle.emailPersonal || ''),
            });
            setProysSel(pRes.data);
            setCertsSel(cRes.data);
        } catch { setErrContacto('Error al cargar datos del graduado.'); }
        finally { setCargandoVer(false); }
    };

    /* ── Guardar contacto ── */
    const guardarContacto = async () => {
        setErrContacto('');
        if (formContacto.telefono && !/^[0-9]{10}$/.test(formContacto.telefono.trim())) {
            setErrContacto('El teléfono debe tener exactamente 10 dígitos.'); return;
        }
        setGuardandoContacto(true);
        try {
            const { data } = await axios.patch(
                `${API}/admin/graduados/${gradSel._id}`,
                { telefono: formContacto.telefono.trim(), emailPersonal: formContacto.emailPersonal.trim() },
                { headers: hdrs() }
            );
            setGradDetalle(prev => ({ ...prev, ...data.graduado }));
            setFormContacto({
                telefono: pareceEncriptado(data.graduado.telefono) ? '' : (data.graduado.telefono || ''),
                emailPersonal: pareceEncriptado(data.graduado.emailPersonal) ? '' : (data.graduado.emailPersonal || ''),
            });
            setGraduados(prev => prev.map(g =>
                g._id === gradSel._id ? { ...g, emailPersonal: data.graduado.emailPersonal } : g
            ));
            setEditandoContacto(false);
        } catch (e) { setErrContacto(e.response?.data?.msg || 'Error al guardar.'); }
        finally { setGuardandoContacto(false); }
    };

    /* ── Eliminar proyecto/certificado ── */
    const pedirEliminar = (tipo, id, titulo) => setConfirmElim({ abierto: true, tipo, id, titulo });
    const confirmarEliminar = async () => {
        const { tipo, id } = confirmElim;
        setEliminando(true);
        try {
            const url = tipo === 'proyecto'
                ? `${API}/admin/graduados/${gradSel._id}/proyectos/${id}`
                : `${API}/admin/graduados/${gradSel._id}/certificados/${id}`;
            await axios.delete(url, { headers: hdrs() });
            if (tipo === 'proyecto') setProysSel(p => p.filter(x => x._id !== id));
            else setCertsSel(c => c.filter(x => x._id !== id));
            setConfirmElim({ abierto: false, tipo: '', id: '', titulo: '' });
        } catch (e) {
            setErrContacto(e.response?.data?.msg || 'Error al eliminar.');
            setConfirmElim({ abierto: false, tipo: '', id: '', titulo: '' });
        } finally { setEliminando(false); }
    };

    /* ── Bloquear/Desbloquear ── */
    const toggleBloqueado = async (g) => {
        setAccion({ id: g._id, tipo: 'bloquear' });
        try {
            await axios.patch(`${API}/admin/graduados/${g._id}/bloquear`,
                { bloqueado: !g.cuentaBloqueada }, { headers: hdrs() });
            cargar(buscar, filtroEst, filtroAnio, pagina);
        } catch { setError('Error al actualizar.'); }
        finally { setAccion({ id: null, tipo: '' }); }
    };

    /* ── ELIMINAR ESTUDIANTE COMPLETO ── */
    const pedirEliminarEstudiante = (g) => {
        setModalElimEst({ abierto: true, id: g._id, nombre: `${g.nombres} ${g.apellidos}` });
    };

    const confirmarEliminarEstudiante = async () => {
        const { id } = modalElimEst;
        setEliminandoEst(true);
        try {
            await axios.delete(`${API}/admin/graduados/${id}`, { headers: hdrs() });
            setModalElimEst({ abierto: false, id: null, nombre: '' });
            setModalVer(false);
            cargar(buscar, filtroEst, filtroAnio, pagina);
        } catch (e) {
            setError(e.response?.data?.msg || 'Error al eliminar el estudiante.');
            setModalElimEst({ abierto: false, id: null, nombre: '' });
        } finally { setEliminandoEst(false); }
    };

    const fechaMaxGrad = new Date();
    fechaMaxGrad.setFullYear(fechaMaxGrad.getFullYear() - 20);
    const fechaMaxGradStr = fechaMaxGrad.toISOString().split('T')[0];

    /* ── Registro INDIVIDUAL ── */
    const abrirInd = () => {
        setMenuNuevo(false);
        setFormInd({ nombres: '', apellidos: '', cedula: '', emailPersonal: '', telefono: '', genero: '', fechaNacimiento: '', tieneDiscapacidad: 'No' });
        setErrInd('');
        setModalInd(true);
    };


    

    const guardarInd = async () => {
        setErrInd('');
        const { nombres, apellidos, cedula, emailPersonal, telefono, genero, fechaNacimiento } = formInd;
        if (!nombres || !apellidos || !cedula || !emailPersonal || !telefono || !genero || !fechaNacimiento) {
            setErrInd('Completa todos los campos obligatorios.'); return;
        }
        setGuardandoInd(true);
        try {
            await axios.post(`${API}/admin/graduados/registro-individual`, formInd, { headers: hdrs() });
            setModalInd(false);
            cargar(buscar, filtroEst, filtroAnio, pagina);
        } catch (e) { setErrInd(e.response?.data?.msg || 'Error al registrar.'); }
        finally { setGuardandoInd(false); }
    };

    /* ── Descargar plantilla CSV ── */
    const descargarPlantilla = async () => {
        try {
            const resp = await axios.get(`${API}/admin/plantilla-csv`, {
                headers: hdrs(),
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_graduados_espoch.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch { alert('Error al descargar la plantilla.'); }
    };

    /* ── Abrir modal MASIVO ── */
    const abrirMasivo = () => {
        setMenuNuevo(false);
        setArchivoCsv(null);
        setErrMasivo('');
        if (csvInputRef.current) csvInputRef.current.value = '';
        setModalMasivo(true);
    };

    /* ── Procesar CSV ── */
    const procesarCSV = async () => {
        if (!archivoCsv) { setErrMasivo('Selecciona un archivo CSV.'); return; }
        setErrMasivo('');
        setCargandoMasivo(true);
        try {
            const fd = new FormData();
            fd.append('archivo', archivoCsv);
            const { data } = await axios.post(`${API}/admin/graduados/carga-masiva`, fd, {
                headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' }
            });
            setModalMasivo(false);
            setReporte(data.reporte);
            setTabReporte('todos');
            setModalReporte(true);
            cargar(buscar, filtroEst, filtroAnio, pagina);
        } catch (e) {
            setErrMasivo(e.response?.data?.msg || 'Error al procesar el CSV.');
        } finally { setCargandoMasivo(false); }
    };

    /* ── Paginador ── */
    const Paginador = () => {
        if (paginas <= 1) return null;
        const ini = Math.max(1, pagina - 2);
        const fin = Math.min(paginas, ini + 4);
        const pags = Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
        return (
            <div style={s.pagRow}>
                <button style={{ ...s.pagBtn, opacity: pagina === 1 ? 0.4 : 1 }}
                    onClick={() => irPagina(pagina - 1)} disabled={pagina === 1}>
                    <FaChevronLeft style={{ fontSize: '0.6rem' }} />
                </button>
                {ini > 1 && <span style={s.pagPuntos}>···</span>}
                {pags.map(p => (
                    <button key={p} style={{
                        ...s.pagBtn,
                        background: p === pagina ? 'var(--color-espoch-rojo)' : 'white',
                        color: p === pagina ? 'white' : '#6c757d',
                        border: p === pagina ? '1px solid var(--color-espoch-rojo)' : '1px solid #e9ecef',
                        fontWeight: p === pagina ? '700' : '400',
                    }} onClick={() => irPagina(p)}>{p}</button>
                ))}
                {fin < paginas && <span style={s.pagPuntos}>···</span>}
                <button style={{ ...s.pagBtn, opacity: pagina === paginas ? 0.4 : 1 }}
                    onClick={() => irPagina(pagina + 1)} disabled={pagina === paginas}>
                    <FaChevronRight style={{ fontSize: '0.6rem' }} />
                </button>
            </div>
        );
    };

    /* ── Filtro del reporte ── */
    const detalleFiltrado = reporte?.detalle?.filter(d => {
        if (tabReporte === 'exitosos') return d.estado === 'exitoso';
        if (tabReporte === 'errores') return d.estado === 'error';
        return true;
    }) || [];

    /* ══════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════ */
    return (
        <div style={s.page}>

            {/* MÉTRICAS */}
            <div style={s.gridMet}>
                {METS.map(m => {
                    const Icon = m.icon;
                    return (
                        <div key={m.key} style={{ ...s.metCard, borderTop: `3px solid ${m.top}` }}>
                            <div style={s.metRow}>
                                <div>
                                    <p style={s.metEtiq}>{m.etiq}</p>
                                    <p style={s.metVal}>
                                        {cargando ? <span style={{ color: '#ced4da' }}>···</span> : (metricas?.[m.key] ?? '—')}
                                    </p>
                                </div>
                                <div style={{ ...s.metIco, background: m.bg, border: `1px solid ${m.border}` }}>
                                    <Icon style={{ fontSize: '1rem', color: m.color }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* TABLA */}
            <div style={s.card}>
                <div style={s.cardHead}>
                    <div>
                        <h2 style={s.cardTit}>Gestión de Graduados</h2>
                        {!cargando && !error && (
                            <p style={s.cardSub}>{total} graduados · página {pagina} de {paginas}</p>
                        )}
                    </div>

                    {/* ── Dropdown Nuevo Graduado ── */}
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button style={s.btnNuevo} onClick={() => setMenuNuevo(v => !v)}>
                            <FaUserPlus style={{ fontSize: '0.78rem' }} />
                            Nuevo Graduado
                            <FaChevronDown style={{ fontSize: '0.6rem', marginLeft: 2 }} />
                        </button>
                        {menuNuevo && (
                            <div style={s.dropdown}>
                                <button style={s.dropItem} onClick={abrirInd}>
                                    <div style={{ ...s.dropIco, background: '#e3f2fd', border: '1px solid #bbdefb' }}>
                                        <FaUser style={{ color: '#1565c0', fontSize: '0.75rem' }} />
                                    </div>
                                    <div>
                                        <p style={s.dropTit}>Individual</p>
                                        <p style={s.dropSub}>Registrar un graduado manualmente</p>
                                    </div>
                                </button>
                                <div style={s.dropDivider} />
                                <button style={s.dropItem} onClick={abrirMasivo}>
                                    <div style={{ ...s.dropIco, background: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                                        <FaUsers style={{ color: '#2e7d32', fontSize: '0.75rem' }} />
                                    </div>
                                    <div>
                                        <p style={s.dropTit}>Carga masiva CSV</p>
                                        <p style={s.dropSub}>Subir múltiples graduados desde un archivo</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filtros */}
                <div style={s.filtrosRow}>
                    <div style={s.busqWrap}>
                        <FaSearch style={{ fontSize: '0.65rem', color: '#adb5bd', flexShrink: 0 }} />
                        <input type="text" placeholder="Buscar por nombre, cédula o tecnología..."
                            value={buscar} onChange={e => setBuscar(e.target.value)} style={s.busqInp} />
                    </div>
                    <div style={s.selectWrap}>
                        <FaCalendarAlt style={{ fontSize: '0.62rem', color: '#adb5bd', flexShrink: 0 }} />
                        <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)} style={s.selectEl}>
                            <option value="">Promoción</option>
                            {aniosDispo.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div style={s.selectWrap}>
                        <FaFilter style={{ fontSize: '0.58rem', color: '#adb5bd', flexShrink: 0 }} />
                        <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)} style={s.selectEl}>
                            <option value="">Estado: Todos</option>
                            <option value="verificado">Verificados</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="bloqueado">Bloqueados</option>
                            <option value="antiguo">Antiguos (+5 años)</option>
                        </select>
                    </div>
                </div>

                {error && <p style={s.errMsg}>{error}</p>}

                {!error && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={s.tabla}>
                            <thead>
                                <tr style={s.trHead}>
                                    <th style={s.th}>NOMBRE</th>
                                    <th style={s.th}>EMAIL</th>
                                    <th style={s.th}>PERFIL</th>
                                    <th style={s.th}>TESIS</th>
                                    <th style={s.th}>PERFIL %</th>
                                    <th style={s.th}>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando
                                    ? Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                                            <td key={j} style={s.td}><div style={{ ...s.skBar, width: j === 1 ? '75%' : '50%' }} /></td>
                                        ))}</tr>
                                    ))
                                    : graduados.length === 0
                                        ? <tr><td colSpan={6} style={s.tdVacio}>No se encontraron graduados.</td></tr>
                                        : graduados.map(g => {
                                            const est = estadoGrad(g);
                                            const bEst = EST_BADGE[est];
                                            const enAcc = accion.id === g._id;
                                            const bPer = g.perfilPublico
                                                ? { label: 'Público', bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb' }
                                                : { label: 'Privado', bg: '#f3e8ff', color: '#6a1b9a', border: '#ddd6fe' };
                                            return (
                                                <tr key={g._id} style={s.trBody}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                    <td style={s.td}>
                                                        <div style={s.nomCell}>
                                                            {g.fotoPerfil
                                                                ? <img src={g.fotoPerfil?.startsWith('http') ? g.fotoPerfil : `${BASE}/${g.fotoPerfil}`} alt="" style={s.avatarImg} />
                                                                : <div style={{ ...s.avatarTbl, background: bEst.bg, color: bEst.color }}>
                                                                    {iniciales(g.nombres, g.apellidos)}
                                                                </div>
                                                            }
                                                            <div>
                                                                <p style={s.nomTxt}>{g.nombres} {g.apellidos}</p>
                                                                <p style={s.nomSub}>{g.anioGraduacion || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={s.td}>
                                                        <span style={s.emailTxt}>
                                                            {pareceEncriptado(g.emailPersonal) ? g.emailInstitucional : (g.emailPersonal || g.emailInstitucional)}
                                                        </span>
                                                    </td>
                                                    <td style={s.td}>
                                                        <span style={{ ...s.badge, background: bPer.bg, color: bPer.color, border: `1px solid ${bPer.border}` }}>{bPer.label}</span>
                                                    </td>
                                                    <td style={s.td}>
                                                        <span style={{ ...s.badge, background: g.tesisVerificada ? '#e8f5e9' : '#f5f5f5', color: g.tesisVerificada ? '#2e7d32' : '#9e9e9e', border: `1px solid ${g.tesisVerificada ? '#c8e6c9' : '#e0e0e0'}` }}>
                                                            {g.tesisVerificada ? '✓ Verificada' : 'Pendiente'}
                                                        </span>
                                                    </td>
                                                    <td style={s.td}>
                                                        <div style={s.progresoWrap}>
                                                            <div style={s.progresoTrack}>
                                                                <div style={{ ...s.progresoFill, width: `${g.perfilCompletado || 0}%`, background: g.perfilCompletado >= 80 ? '#2e7d32' : g.perfilCompletado >= 50 ? '#f57f17' : '#e53935' }} />
                                                            </div>
                                                            <span style={s.progresoTxt}>{g.perfilCompletado || 0}%</span>
                                                        </div>
                                                    </td>
                                                    <td style={s.td}>
                                                        <div style={s.accsRow}>
                                                            <button style={s.btnAcc} onClick={() => abrirVer(g)} title="Ver perfil">
                                                                <FaEye style={{ fontSize: '0.7rem' }} />
                                                            </button>
                                                            <button style={{ ...s.btnAcc, background: '#e3f2fd', border: '1px solid #bbdefb', color: '#1565c0' }}
                                                                onClick={() => abrirVer(g, true)} title="Editar datos">
                                                                <FaEdit style={{ fontSize: '0.7rem' }} />
                                                            </button>
                                                            <button style={{
                                                                ...s.btnAcc,
                                                                background: '#ffebee',
                                                                border: '1px solid #ffcdd2',
                                                                color: '#c62828',
                                                                opacity: eliminandoEst ? 0.5 : 1,
                                                            }} onClick={() => !eliminandoEst && pedirEliminarEstudiante(g)}
                                                                title="Eliminar estudiante permanentemente"
                                                                disabled={eliminandoEst}>
                                                                <FaTrash style={{ fontSize: '0.7rem' }} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                }
                            </tbody>
                        </table>
                    </div>
                )}

                {!cargando && !error && graduados.length > 0 && (
                    <div style={s.footTabla}>
                        <p style={s.contadorTxt}>
                            Mostrando {(pagina - 1) * LIMIT + 1}–{Math.min(pagina * LIMIT, total)} de {total} graduados
                        </p>
                        <Paginador />
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════
                MODAL VER
            ══════════════════════════════════════════ */}
            {modalVer && gradSel && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalVer(false); }}>
                    <div style={{ ...s.modal, maxWidth: 700 }}>
                        <div style={{ ...s.modalHead, borderColor: 'var(--color-espoch-rojo)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {(gradDetalle?.fotoPerfil || gradSel.fotoPerfil)
                                    ? <img src={`${BASE}/${gradDetalle?.fotoPerfil || gradSel.fotoPerfil}`} alt=""
                                        style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-espoch-rojo)' }} />
                                    : <div style={s.avatarModal}>{iniciales(gradSel.nombres, gradSel.apellidos)}</div>
                                }
                                <div>
                                    <h2 style={s.modalTit}>{gradSel.nombres} {gradSel.apellidos}</h2>
                                    <p style={s.modalSub}>{gradSel.emailInstitucional} · Promoción {gradSel.anioGraduacion || '—'}</p>
                                </div>
                            </div>
                            <button style={s.modalClose} onClick={() => setModalVer(false)}><FaTimes /></button>
                        </div>

                        <div style={s.tabs}>
                            {[
                                { k: 'info', l: 'Información' },
                                { k: 'proyectos', l: `Proyectos (${proysSel.length})` },
                                { k: 'certificados', l: `Certificados (${certsSel.length})` },
                            ].map(t => (
                                <button key={t.k} style={{ ...s.tab, ...(tabVer === t.k ? s.tabActivo : {}) }}
                                    onClick={() => setTabVer(t.k)}>{t.l}</button>
                            ))}
                        </div>

                        <div style={s.modalBody}>
                            {cargandoVer
                                ? <div style={{ textAlign: 'center', padding: 32 }}><FaSpinner style={{ fontSize: '1.5rem', color: '#adb5bd' }} /></div>
                                : <>
                                    {tabVer === 'info' && gradDetalle && (
                                        <>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {(() => { const b = EST_BADGE[estadoGrad(gradDetalle)]; return <span style={{ ...s.badge, background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>{b.label}</span>; })()}
                                                    <span style={{ ...s.badge, background: gradDetalle.perfilPublico ? '#e3f2fd' : '#f3e8ff', color: gradDetalle.perfilPublico ? '#1565c0' : '#6a1b9a', border: `1px solid ${gradDetalle.perfilPublico ? '#bbdefb' : '#ddd6fe'}` }}>
                                                        {gradDetalle.perfilPublico ? 'Perfil Público' : 'Perfil Privado'}
                                                    </span>
                                                    <span style={{ ...s.badge, background: gradDetalle.tesisVerificada ? '#e8f5e9' : '#f5f5f5', color: gradDetalle.tesisVerificada ? '#2e7d32' : '#9e9e9e', border: `1px solid ${gradDetalle.tesisVerificada ? '#c8e6c9' : '#e0e0e0'}` }}>
                                                        {gradDetalle.tesisVerificada ? 'Tesis Verificada' : 'Sin Tesis'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ ...s.verSec, marginTop: 8, marginBottom: 14 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                    <div>
                                                        <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: '700', color: '#2c3e50' }}>Estado de la cuenta</p>
                                                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#adb5bd' }}>
                                                            {gradDetalle.cuentaBloqueada ? 'Cuenta bloqueada' : 'Cuenta activa'}
                                                        </p>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: 48,
                                                            height: 26,
                                                            borderRadius: 15,
                                                            background: gradDetalle.cuentaBloqueada ? '#ffebee' : '#e8f5e9',
                                                            border: `2px solid ${gradDetalle.cuentaBloqueada ? '#ffcdd2' : '#c8e6c9'}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '0 2px',
                                                            cursor: accion.id === gradDetalle._id ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.3s',
                                                            opacity: accion.id === gradDetalle._id ? 0.5 : 1,
                                                        }}
                                                        onClick={() => {
                                                            if (accion.id === gradDetalle._id) return;
                                                            setAccion({ id: gradDetalle._id, tipo: 'bloquear' });
                                                            axios.patch(`${API}/admin/graduados/${gradDetalle._id}/bloquear`,
                                                                { bloqueado: !gradDetalle.cuentaBloqueada }, { headers: hdrs() })
                                                                .then(() => {
                                                                    setGradDetalle(prev => ({ ...prev, cuentaBloqueada: !prev.cuentaBloqueada }));
                                                                    cargar(buscar, filtroEst, filtroAnio, pagina);
                                                                })
                                                                .catch(e => setErrContacto(e.response?.data?.msg || 'Error al actualizar bloqueo.'))
                                                                .finally(() => setAccion({ id: null, tipo: '' }));
                                                        }}>
                                                        <div
                                                            style={{
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                background: gradDetalle.cuentaBloqueada ? '#c62828' : '#2e7d32',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                fontSize: '0.65rem',
                                                                fontWeight: '700',
                                                                transition: 'all 0.3s',
                                                                marginLeft: gradDetalle.cuentaBloqueada ? '2px' : '22px',
                                                            }}>
                                                            {gradDetalle.cuentaBloqueada ? '✕' : '✓'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={s.verSec}>
                                                <p style={s.verSecTit}>Datos personales</p>
                                                <div style={s.grid3}>
                                                    {[
                                                        { ico: FaIdCard, label: 'Cédula', val: valorSeguro(gradDetalle.cedula) },
                                                        { ico: FaPhone, label: 'Teléfono', val: valorSeguro(gradDetalle.telefono) },
                                                        { ico: FaEnvelope, label: 'Correo personal', val: valorSeguro(gradDetalle.emailPersonal) },
                                                        { ico: FaEnvelope, label: 'Correo institucional', val: gradDetalle.emailInstitucional || '—' },
                                                        { ico: FaVenusMars, label: 'Género', val: gradDetalle.genero || '—' },
                                                        { ico: FaBirthdayCake, label: 'Fecha nacimiento', val: fmtFechaLarga(gradDetalle.fechaNacimiento) },
                                                        { ico: FaWheelchair, label: 'Discapacidad', val: gradDetalle.tieneDiscapacidad || '—' },
                                                        { ico: FaCalendarAlt, label: 'Año graduación', val: gradDetalle.anioGraduacion || '—' },
                                                    ].map((d, i) => (
                                                        <div key={i} style={s.datoItem}>
                                                            <span style={s.datoLabel}><d.ico style={{ marginRight: 4, fontSize: '0.7rem' }} />{d.label}</span>
                                                            <span style={s.datoVal}>{d.val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={s.verSec}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                    <p style={s.verSecTit}>Datos editables</p>
                                                    {!editandoContacto && (
                                                        <button style={s.btnEditInline} onClick={() => {
                                                            setFormContacto({
                                                                telefono: pareceEncriptado(gradDetalle.telefono) ? '' : (gradDetalle.telefono || ''),
                                                                emailPersonal: pareceEncriptado(gradDetalle.emailPersonal) ? '' : (gradDetalle.emailPersonal || ''),
                                                            });
                                                            setEditandoContacto(true); setErrContacto('');
                                                        }}>
                                                            <FaEdit style={{ fontSize: '0.65rem' }} /> Editar
                                                        </button>
                                                    )}
                                                </div>
                                                {errContacto && <p style={{ ...s.errMsg, marginBottom: 8 }}>{errContacto}</p>}
                                                {editandoContacto ? (
                                                    <div style={s.editContactoCard}>
                                                        <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: '#6c757d' }}>
                                                            Solo se puede modificar el teléfono y el correo personal. Se almacenan encriptados automáticamente.
                                                        </p>
                                                        <div style={s.grid2}>
                                                            <div style={s.campo}>
                                                                <label style={s.lbl}><FaPhone style={{ marginRight: 4, fontSize: '0.7rem' }} />Teléfono</label>
                                                                <input value={formContacto.telefono}
                                                                    onChange={e => setFormContacto(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '') }))}
                                                                    style={s.inp} placeholder="10 dígitos" maxLength={10} inputMode="numeric" />
                                                                <span style={{ fontSize: '0.65rem', color: '#adb5bd', marginTop: 2 }}>{formContacto.telefono.length}/10</span>
                                                            </div>
                                                            <div style={s.campo}>
                                                                <label style={s.lbl}><FaEnvelope style={{ marginRight: 4, fontSize: '0.7rem' }} />Correo personal</label>
                                                                <input value={formContacto.emailPersonal}
                                                                    onChange={e => setFormContacto(p => ({ ...p, emailPersonal: e.target.value }))}
                                                                    style={s.inp} placeholder="correo@gmail.com" type="email" />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                                                            <button style={s.btnCancelar} onClick={() => { setEditandoContacto(false); setErrContacto(''); }}>Cancelar</button>
                                                            <button style={s.btnGuardar} onClick={guardarContacto} disabled={guardandoContacto}>
                                                                {guardandoContacto ? <><FaSpinner style={{ marginRight: 5 }} />Guardando...</> : <><FaSave style={{ marginRight: 5 }} />Guardar</>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={s.grid2}>
                                                        <div style={s.datoItem}>
                                                            <span style={s.datoLabel}><FaPhone style={{ marginRight: 4, fontSize: '0.7rem' }} />Teléfono</span>
                                                            <span style={s.datoVal}>{valorSeguro(gradDetalle.telefono)}</span>
                                                        </div>
                                                        <div style={s.datoItem}>
                                                            <span style={s.datoLabel}><FaEnvelope style={{ marginRight: 4, fontSize: '0.7rem' }} />Correo personal</span>
                                                            <span style={s.datoVal}>{valorSeguro(gradDetalle.emailPersonal)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {gradDetalle.bio && (
                                                <div style={s.verSec}>
                                                    <p style={s.verSecTit}>Sobre mí</p>
                                                    <p style={s.verBio}>{gradDetalle.bio}</p>
                                                </div>
                                            )}
                                            {(gradDetalle.github || gradDetalle.linkedin) && (
                                                <div style={s.verSec}>
                                                    <p style={s.verSecTit}>Redes</p>
                                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                        {gradDetalle.github && <a href={gradDetalle.github} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: '#2c3e50', fontWeight: '600', textDecoration: 'none' }}><FaGithub style={{ fontSize: '0.85rem' }} />GitHub</a>}
                                                        {gradDetalle.linkedin && <a href={gradDetalle.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: '#1565c0', fontWeight: '600', textDecoration: 'none' }}><FaLinkedin style={{ fontSize: '0.85rem' }} />LinkedIn</a>}
                                                    </div>
                                                </div>
                                            )}
                                            {gradDetalle.tecnologias?.length > 0 && (
                                                <div style={s.verSec}>
                                                    <p style={s.verSecTit}><FaCode style={s.secIco} /> Tecnologías</p>
                                                    <div style={s.tagsWrap}>
                                                        {gradDetalle.tecnologias.map((t, i) => { const c = tecColor(t); return <span key={i} style={{ fontSize: '0.7rem', padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontWeight: '600' }}>{t}</span>; })}
                                                    </div>
                                                </div>
                                            )}
                                            {gradDetalle.habilidadesBlandas?.length > 0 && (
                                                <div style={{ ...s.verSec, borderBottom: 'none', marginBottom: 0 }}>
                                                    <p style={s.verSecTit}><FaHandshake style={s.secIco} /> Habilidades Blandas</p>
                                                    <div style={s.tagsWrap}>
                                                        {gradDetalle.habilidadesBlandas.map((h, i) => <span key={i} style={{ fontSize: '0.7rem', padding: '3px 9px', borderRadius: 20, background: '#f3e8ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: '500' }}>{h}</span>)}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {tabVer === 'proyectos' && (
                                        proysSel.length === 0 ? <p style={s.verVacio}>Sin proyectos registrados.</p>
                                            : proysSel.map(p => (
                                                <div key={p._id} style={s.verItem}>
                                                    {p.imagen && <img src={`${BASE}/${p.imagen}`} alt="" style={{ width: 60, height: 46, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={s.verItemTit}>{p.titulo}</p>
                                                        <p style={s.verItemDesc}>{p.descripcion}</p>
                                                        <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                                                            {p.tecnologias?.slice(0, 3).map((t, i) => { const c = tecColor(t); return <span key={i} style={{ fontSize: '0.6rem', fontWeight: '700', padding: '1px 6px', borderRadius: 4, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{t.toUpperCase()}</span>; })}
                                                            <span style={{ fontSize: '0.64rem', color: '#adb5bd', marginLeft: 'auto' }}>{fmtFecha(p.fechaRealizacion)}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                                                        {p.urlRepositorio && <a href={p.urlRepositorio} target="_blank" rel="noopener noreferrer" style={{ color: '#1565c0' }}><FaLink style={{ fontSize: '0.72rem' }} /></a>}
                                                        <button style={s.btnTrash} onClick={() => pedirEliminar('proyecto', p._id, p.titulo)}><FaTrash style={{ fontSize: '0.65rem' }} /></button>
                                                    </div>
                                                </div>
                                            ))
                                    )}

                                    {tabVer === 'certificados' && (
                                        certsSel.length === 0 ? <p style={s.verVacio}>Sin certificados registrados.</p>
                                            : certsSel.map(c => (
                                                <div key={c._id} style={s.verItem}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ffebee', border: '1px solid #ffcdd2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <FaCertificate style={{ color: 'var(--color-espoch-rojo)', fontSize: '0.9rem' }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={s.verItemTit}>{c.titulo}</p>
                                                        {c.institucion && <p style={{ margin: '1px 0', fontSize: '0.7rem', color: '#6c757d' }}>{c.institucion}</p>}
                                                        <p style={s.verItemDesc}>{c.descripcion}</p>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                                            <span style={{ fontSize: '0.64rem', color: '#adb5bd' }}>{fmtFecha(c.fechaFinalizacion)}</span>
                                                            {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.64rem', color: '#1565c0', display: 'flex', alignItems: 'center', gap: 3 }}><FaExternalLinkAlt style={{ fontSize: '0.58rem' }} />Ver certificado</a>}
                                                        </div>
                                                    </div>
                                                    <button style={s.btnTrash} onClick={() => pedirEliminar('certificado', c._id, c.titulo)}><FaTrash style={{ fontSize: '0.65rem' }} /></button>
                                                </div>
                                            ))
                                    )}
                                </>
                            }
                        </div>
                        <div style={s.modalFoot}>
                            <button style={s.btnCancelar} onClick={() => setModalVer(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ CONFIRMAR ELIMINAR PROY/CERT ══ */}
            {confirmElim.abierto && (
                <div style={{ ...s.overlay, zIndex: 1100 }}>
                    <div style={s.modalConfirm}>
                        <div style={s.confirmIco}><FaExclamationTriangle style={{ fontSize: '1.5rem', color: '#f57f17' }} /></div>
                        <h3 style={s.confirmH}>¿Eliminar {confirmElim.tipo}?</h3>
                        <p style={s.confirmSub}>Se eliminará permanentemente <strong>"{confirmElim.titulo}"</strong>. Las tecnologías se recalcularán.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button style={s.btnCancelar} onClick={() => setConfirmElim({ abierto: false, tipo: '', id: '', titulo: '' })}>Cancelar</button>
                            <button style={{ ...s.btnGuardar, background: '#c62828' }} onClick={confirmarEliminar} disabled={eliminando}>
                                {eliminando ? <FaSpinner style={{ marginRight: 5 }} /> : <FaTrash style={{ marginRight: 5 }} />}Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ CONFIRMAR ELIMINAR ESTUDIANTE ══ */}
            {modalElimEst.abierto && (
                <div style={{ ...s.overlay, zIndex: 1100 }}>
                    <div style={s.modalConfirm}>
                        <div style={s.confirmIco}>
                            <FaExclamationTriangle style={{ fontSize: '1.8rem', color: '#c62828' }} />
                        </div>
                        <h3 style={s.confirmH}>¿Eliminar estudiante permanentemente?</h3>
                        <p style={s.confirmSub}>
                            Se eliminarán <strong>todos los datos</strong> de:<br />
                            <strong style={{ color: '#c62828' }}>"{modalElimEst.nombre}"</strong><br /><br />
                            ❌ Información personal ❌ Foto de perfil<br />
                            ❌ Todos los proyectos ❌ Todas las imágenes<br />
                            ❌ Todos los certificados ❌ Tesis verificada<br /><br />
                            <strong style={{ color: '#c62828' }}>Esta acción NO se puede deshacer.</strong>
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button style={s.btnCancelar}
                                onClick={() => setModalElimEst({ abierto: false, id: null, nombre: '' })}
                                disabled={eliminandoEst}>Cancelar</button>
                            <button style={{ ...s.btnGuardar, background: '#c62828' }}
                                onClick={confirmarEliminarEstudiante} disabled={eliminandoEst}>
                                {eliminandoEst
                                    ? <><FaSpinner style={{ marginRight: 5, animation: 'spin 1s linear infinite' }} />Eliminando...</>
                                    : <><FaTrash style={{ marginRight: 5 }} />Sí, eliminar permanentemente</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                MODAL INDIVIDUAL
            ══════════════════════════════════════════ */}
            {modalInd && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalInd(false); }}>
                    <div style={s.modal}>
                        <div style={{ ...s.modalHead, borderColor: 'var(--color-espoch-rojo)' }}>
                            <div>
                                <h2 style={s.modalTit}>Nuevo Graduado — Individual</h2>
                                <p style={s.modalSub}>Se enviará la contraseña temporal al correo personal del graduado.</p>
                            </div>
                            <button style={s.modalClose} onClick={() => setModalInd(false)}><FaTimes /></button>
                        </div>
                        <div style={s.modalBody}>
                            {errInd && <p style={s.errMsg}>{errInd}</p>}

                            {/* Aviso contraseña */}
                            <div style={s.avisoPass}>
                                <span style={{ fontSize: '0.8rem' }}>🔑</span>
                                <p style={{ margin: 0, fontSize: '0.74rem', color: '#1b5e20', lineHeight: 1.5 }}>
                                    La contraseña se generará automáticamente con el patrón: <strong>3 letras apellido + últimas 4 cédula + #</strong><br />
                                    Ej: apellido "Pérez", cédula "···4567" → <code style={{ background: '#c8e6c9', padding: '1px 5px', borderRadius: 3 }}>Per4567#</code><br />
                                    Se enviará al correo personal del graduado.
                                </p>
                            </div>

                            <div style={s.grid2}>
                                <div style={s.campo}><label style={s.lbl}>Nombres *</label>
                                    <input value={formInd.nombres} onChange={e => setFormInd(p => ({ ...p, nombres: e.target.value }))} style={s.inp} placeholder="Ej: Juan Carlos" /></div>
                                <div style={s.campo}><label style={s.lbl}>Apellidos *</label>
                                    <input value={formInd.apellidos} onChange={e => setFormInd(p => ({ ...p, apellidos: e.target.value }))} style={s.inp} placeholder="Ej: Pérez López" /></div>
                            </div>
                            <div style={s.grid2}>
                                <div style={s.campo}><label style={s.lbl}>Cédula *</label>
                                    <input value={formInd.cedula} onChange={e => setFormInd(p => ({ ...p, cedula: e.target.value.replace(/\D/g, '') }))} style={s.inp} placeholder="10 dígitos" maxLength={10} inputMode="numeric" /></div>
                                <div style={s.campo}><label style={s.lbl}>Teléfono *</label>
                                    <input value={formInd.telefono} onChange={e => setFormInd(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '') }))} style={s.inp} placeholder="10 dígitos" maxLength={10} inputMode="numeric" /></div>
                            </div>
                            <div style={s.campo}><label style={s.lbl}>Correo personal * <span style={{ fontWeight: 400, color: '#adb5bd' }}>(se usará para login y recibir la contraseña)</span></label>
                                <input value={formInd.emailPersonal} onChange={e => setFormInd(p => ({ ...p, emailPersonal: e.target.value }))} style={s.inp} placeholder="graduado@gmail.com" type="email" /></div>
                            <div style={s.grid2}>
                                <div style={s.campo}><label style={s.lbl}>Género *</label>
                                    <select value={formInd.genero} onChange={e => setFormInd(p => ({ ...p, genero: e.target.value }))} style={s.inp}>
                                        <option value="">Seleccionar...</option>
                                        <option>Masculino</option><option>Femenino</option>
                                        <option>LGTBI</option>
                                    </select></div>
                                <div style={s.campo}><label style={s.lbl}>Fecha nacimiento *</label>
                                    <input type="date" value={formInd.fechaNacimiento} onChange={e => setFormInd(p => ({ ...p, fechaNacimiento: e.target.value }))} style={{ ...s.inp, colorScheme: 'light' }} max={fechaMaxGradStr} title="El graduado debe tener al menos 20 años" /></div>
                            </div>
                            <div style={s.campo}><label style={s.lbl}>Discapacidad</label>
                                <select value={formInd.tieneDiscapacidad} onChange={e => setFormInd(p => ({ ...p, tieneDiscapacidad: e.target.value }))} style={s.inp}>
                                    <option>No</option><option>Sí - Visual</option><option>Sí - Auditiva</option>
                                    <option>Sí - Física/Motriz</option><option>Sí - Intelectual</option>
                                    <option>Sí - Psicosocial</option><option>Sí - Otra</option>
                                </select></div>
                        </div>
                        <div style={s.modalFoot}>
                            <button style={s.btnCancelar} onClick={() => setModalInd(false)}>Cancelar</button>
                            <button style={s.btnGuardar} onClick={guardarInd} disabled={guardandoInd}>
                                {guardandoInd ? <><FaSpinner style={{ marginRight: 5 }} />Registrando...</> : <><FaSave style={{ marginRight: 5 }} />Registrar y enviar correo</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                MODAL MASIVO CSV
            ══════════════════════════════════════════ */}
            {modalMasivo && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget && !cargandoMasivo) setModalMasivo(false); }}>
                    <div style={{ ...s.modal, maxWidth: 540 }}>
                        <div style={{ ...s.modalHead, borderColor: '#2e7d32' }}>
                            <div>
                                <h2 style={s.modalTit}>Carga masiva de graduados</h2>
                                <p style={s.modalSub}>Registra múltiples graduados desde un archivo CSV · Máx. 200 filas</p>
                            </div>
                            {!cargandoMasivo && <button style={s.modalClose} onClick={() => setModalMasivo(false)}><FaTimes /></button>}
                        </div>
                        <div style={s.modalBody}>

                            {/* Paso 1 — Descargar plantilla */}
                            <div style={s.pasoBox}>
                                <div style={s.pasoNum}>1</div>
                                <div style={{ flex: 1 }}>
                                    <p style={s.pasoTit}>Descarga la plantilla CSV</p>
                                    <p style={s.pasoDesc}>
                                        Contiene las columnas requeridas y 3 filas de ejemplo.<br />
                                        Ábrela con Excel o Google Sheets, llena los datos y guarda como CSV.
                                    </p>
                                    <button style={s.btnDescarga} onClick={descargarPlantilla}>
                                        <FaDownload style={{ marginRight: 6, fontSize: '0.78rem' }} />
                                        Descargar plantilla_graduados_espoch.csv
                                    </button>
                                </div>
                            </div>

                            {/* Columnas requeridas */}
                            <div style={s.columnasBox}>
                                <p style={{ margin: '0 0 6px', fontSize: '0.71rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.5px' }}>COLUMNAS DEL CSV</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {['nombres', 'apellidos', 'cedula', 'email personal', 'telefono', 'genero', 'fecha nacimiento', 'discapacidad'].map(c => (
                                        <span key={c} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: '#f0f7ff', color: '#1565c0', border: '1px solid #bbdefb', fontWeight: '600', fontFamily: 'monospace' }}>{c}</span>
                                    ))}
                                </div>
                                <p style={{ margin: '6px 0 0', fontSize: '0.68rem', color: '#adb5bd' }}>
                                    Fecha en formato <code>YYYY-MM-DD</code> · Género: Masculino / Femenino / No binario / Prefiero no decir
                                </p>
                            </div>

                            {/* Paso 2 — Subir CSV */}
                            <div style={s.pasoBox}>
                                <div style={s.pasoNum}>2</div>
                                <div style={{ flex: 1 }}>
                                    <p style={s.pasoTit}>Sube el archivo CSV completado</p>
                                    <p style={s.pasoDesc}>
                                        Se registrarán todos los graduados, se generará una contraseña temporal para cada uno y se enviará por correo.
                                    </p>
                                    <div style={s.dropZona}
                                        onClick={() => !cargandoMasivo && csvInputRef.current?.click()}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => {
                                            e.preventDefault();
                                            const f = e.dataTransfer.files[0];
                                            if (f?.name.endsWith('.csv')) setArchivoCsv(f);
                                        }}>
                                        {archivoCsv ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <FaFileAlt style={{ fontSize: '1.4rem', color: '#2e7d32', flexShrink: 0 }} />
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700', color: '#2e7d32' }}>{archivoCsv.name}</p>
                                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#adb5bd' }}>{(archivoCsv.size / 1024).toFixed(1)} KB · Listo para procesar</p>
                                                </div>
                                                <button onClick={e => { e.stopPropagation(); setArchivoCsv(null); if (csvInputRef.current) csvInputRef.current.value = ''; }}
                                                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '0.85rem' }}>
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <FaUpload style={{ fontSize: '1.8rem', color: '#adb5bd', marginBottom: 6 }} />
                                                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: '#6c757d' }}>Arrastra el CSV aquí o haz clic para seleccionar</p>
                                                <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: '#adb5bd' }}>Solo archivos .csv · Máx. 5 MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input ref={csvInputRef} type="file" accept=".csv,text/csv"
                                        onChange={e => { const f = e.target.files[0]; if (f) setArchivoCsv(f); }}
                                        style={{ display: 'none' }} />
                                </div>
                            </div>

                            {/* Aviso contraseña */}
                            <div style={s.avisoPass}>
                                <span style={{ fontSize: '0.8rem' }}>🔑</span>
                                <p style={{ margin: 0, fontSize: '0.73rem', color: '#1b5e20', lineHeight: 1.5 }}>
                                    Contraseña temporal: <strong>3 letras apellido + últimas 4 cédula + #</strong><br />
                                    Ejemplo: "Pérez", cédula "···4567" → <code style={{ background: '#c8e6c9', padding: '1px 5px', borderRadius: 3 }}>Per4567#</code><br />
                                    Se envía automáticamente al correo personal de cada graduado.
                                </p>
                            </div>

                            {errMasivo && <p style={{ ...s.errMsg, marginTop: 8 }}>{errMasivo}</p>}

                            {cargandoMasivo && (
                                <div style={s.cargandoMasivo}>
                                    <FaSpinner style={{ fontSize: '1.4rem', color: 'var(--color-espoch-rojo)', animation: 'spin 1s linear infinite' }} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-texto-principal)' }}>Procesando graduados...</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6c757d' }}>Registrando y enviando correos. Por favor espera.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={s.modalFoot}>
                            {!cargandoMasivo && <button style={s.btnCancelar} onClick={() => setModalMasivo(false)}>Cancelar</button>}
                            <button style={{ ...s.btnGuardar, background: '#2e7d32', opacity: archivoCsv && !cargandoMasivo ? 1 : 0.5 }}
                                onClick={procesarCSV} disabled={!archivoCsv || cargandoMasivo}>
                                {cargandoMasivo
                                    ? <><FaSpinner style={{ marginRight: 5 }} />Procesando...</>
                                    : <><FaUpload style={{ marginRight: 5 }} />Procesar CSV y registrar</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                MODAL REPORTE
            ══════════════════════════════════════════ */}
            {modalReporte && reporte && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalReporte(false); }}>
                    <div style={{ ...s.modal, maxWidth: 680 }}>
                        <div style={{ ...s.modalHead, borderColor: reporte.fallidos === 0 ? '#2e7d32' : '#f57f17' }}>
                            <div>
                                <h2 style={s.modalTit}>
                                    {reporte.fallidos === 0 ? '✅ Carga completada exitosamente' : '⚠️ Carga completada con advertencias'}
                                </h2>
                                <p style={s.modalSub}>Reporte detallado de la carga masiva de graduados</p>
                            </div>
                            <button style={s.modalClose} onClick={() => setModalReporte(false)}><FaTimes /></button>
                        </div>

                        {/* Resumen */}
                        <div style={s.reporteResumen}>
                            <div style={{ ...s.reporteStat, background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                <span style={s.reporteStatNum}>{reporte.total}</span>
                                <span style={s.reporteStatLbl}>TOTAL</span>
                            </div>
                            <div style={{ ...s.reporteStat, background: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                                <span style={{ ...s.reporteStatNum, color: '#2e7d32' }}>{reporte.exitosos}</span>
                                <span style={{ ...s.reporteStatLbl, color: '#2e7d32' }}>EXITOSOS</span>
                            </div>
                            <div style={{ ...s.reporteStat, background: '#ffebee', border: '1px solid #ffcdd2' }}>
                                <span style={{ ...s.reporteStatNum, color: '#c62828' }}>{reporte.fallidos}</span>
                                <span style={{ ...s.reporteStatLbl, color: '#c62828' }}>CON ERRORES</span>
                            </div>
                        </div>

                        {/* Tabs del reporte */}
                        <div style={{ ...s.tabs, padding: '0 20px' }}>
                            {[
                                { k: 'todos', l: `Todos (${reporte.total})` },
                                { k: 'exitosos', l: `✅ Exitosos (${reporte.exitosos})` },
                                { k: 'errores', l: `❌ Errores (${reporte.fallidos})` },
                            ].map(t => (
                                <button key={t.k} style={{ ...s.tab, ...(tabReporte === t.k ? s.tabActivo : {}) }}
                                    onClick={() => setTabReporte(t.k)}>{t.l}</button>
                            ))}
                        </div>

                        <div style={{ ...s.modalBody, padding: '12px 20px' }}>
                            {detalleFiltrado.length === 0 ? (
                                <p style={s.verVacio}>No hay registros en esta categoría.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {detalleFiltrado.map((d, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            padding: '10px 12px', borderRadius: 8,
                                            background: d.estado === 'exitoso' ? '#f1f8e9' : '#fff8f8',
                                            border: `1px solid ${d.estado === 'exitoso' ? '#c8e6c9' : '#ffcdd2'}`,
                                        }}>
                                            <div style={{
                                                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: d.estado === 'exitoso' ? '#2e7d32' : '#c62828',
                                                fontSize: '0.7rem', color: 'white', fontWeight: '700', marginTop: 1
                                            }}>
                                                {d.estado === 'exitoso' ? '✓' : '✕'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2c3e50' }}>
                                                        {d.nombres} {d.apellidos}
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', color: '#adb5bd' }}>Fila {d.fila}</span>
                                                    {d.estado === 'exitoso' && d.password && (
                                                        <span style={{ fontSize: '0.65rem', background: '#c8e6c9', color: '#1b5e20', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: '700' }}>
                                                            🔑 {d.password}
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#6c757d' }}>
                                                    {d.email} · {d.cedula}
                                                </p>
                                                <p style={{
                                                    margin: '3px 0 0', fontSize: '0.72rem',
                                                    color: d.estado === 'exitoso' ? '#2e7d32' : '#c62828',
                                                    fontWeight: d.estado === 'error' ? '600' : '400'
                                                }}>
                                                    {d.motivo}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={s.modalFoot}>
                            {reporte.fallidos > 0 && (
                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#f57f17', flex: 1 }}>
                                    ⚠️ Los graduados con error no fueron registrados. Corrígelos en el CSV y vuelve a subirlos.
                                </p>
                            )}
                            <button style={s.btnCancelar} onClick={() => setModalReporte(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   ESTILOS
═══════════════════════════════════════════════════════════ */
const s = {
    page: { maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'Segoe UI',Roboto,sans-serif" },
    gridMet: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 },
    metCard: { backgroundColor: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    metRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    metEtiq: { margin: '0 0 5px', fontSize: '0.58rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.8px' },
    metVal: { margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#2c3e50', lineHeight: 1 },
    metIco: { width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    card: { backgroundColor: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    cardTit: { margin: '0 0 2px', fontSize: '0.9rem', fontWeight: '700', color: '#2c3e50' },
    cardSub: { margin: 0, fontSize: '0.7rem', color: '#adb5bd' },
    btnNuevo: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 },

    /* Dropdown */
    dropdown: { position: 'absolute', top: 'calc(100% + 6px)', right: 0, backgroundColor: 'white', borderRadius: 10, border: '1px solid #e9ecef', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 260, overflow: 'hidden' },
    dropItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' },
    dropIco: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    dropTit: { margin: 0, fontSize: '0.82rem', fontWeight: '700', color: '#2c3e50' },
    dropSub: { margin: '2px 0 0', fontSize: '0.69rem', color: '#adb5bd' },
    dropDivider: { height: 1, backgroundColor: '#f0f0f0', margin: '0 12px' },

    filtrosRow: { display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
    busqWrap: { display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 180, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '9px 12px' },
    busqInp: { border: 'none', background: 'transparent', outline: 'none', fontSize: '0.77rem', color: '#2c3e50', width: '100%', fontFamily: "'Segoe UI',Roboto,sans-serif" },
    selectWrap: { display: 'flex', alignItems: 'center', gap: 7, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '9px 12px', flexShrink: 0 },
    selectEl: { border: 'none', background: 'transparent', outline: 'none', fontSize: '0.76rem', color: '#6c757d', cursor: 'pointer', fontFamily: "'Segoe UI',Roboto,sans-serif" },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    trHead: { borderBottom: '2px solid #f0f0f0' },
    th: { padding: '8px 10px', textAlign: 'left', fontSize: '0.61rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.7px', whiteSpace: 'nowrap' },
    trBody: { borderBottom: '1px solid #f8f9fa', transition: 'background 0.1s' },
    td: { padding: '10px 10px', verticalAlign: 'middle' },
    tdVacio: { padding: '32px 10px', textAlign: 'center', color: '#adb5bd', fontSize: '0.8rem' },
    skBar: { height: 11, borderRadius: 5, background: '#f0f0f0' },
    nomCell: { display: 'flex', alignItems: 'center', gap: 9 },
    avatarImg: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
    avatarTbl: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', flexShrink: 0 },
    nomTxt: { margin: 0, fontSize: '0.78rem', fontWeight: '600', color: '#2c3e50', whiteSpace: 'nowrap' },
    nomSub: { margin: 0, fontSize: '0.66rem', color: '#adb5bd' },
    emailTxt: { fontSize: '0.74rem', color: '#6c757d' },
    badge: { display: 'inline-block', fontSize: '0.63rem', fontWeight: '600', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
    progresoWrap: { display: 'flex', alignItems: 'center', gap: 6 },
    progresoTrack: { flex: 1, height: 5, background: '#f0f0f0', borderRadius: 10, overflow: 'hidden', minWidth: 50 },
    progresoFill: { height: '100%', borderRadius: 10, transition: 'width 0.3s' },
    progresoTxt: { fontSize: '0.65rem', fontWeight: '700', color: '#6c757d', minWidth: 28 },
    accsRow: { display: 'flex', gap: 5, alignItems: 'center' },
    btnAcc: { width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', border: '1px solid #e9ecef', cursor: 'pointer', color: '#6c757d', flexShrink: 0 },
    errMsg: { padding: '10px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 7, color: '#c62828', fontSize: '0.75rem', textAlign: 'center', margin: '0 0 10px' },
    footTabla: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 },
    contadorTxt: { margin: 0, fontSize: '0.7rem', color: '#adb5bd' },
    pagRow: { display: 'flex', gap: 4, alignItems: 'center' },
    pagBtn: { minWidth: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e9ecef', background: 'white', cursor: 'pointer', fontSize: '0.75rem', color: '#6c757d', padding: '0 8px' },
    pagPuntos: { fontSize: '0.75rem', color: '#adb5bd', padding: '0 2px' },

    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' },
    modal: { backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px 13px', borderBottom: '2px solid', flexShrink: 0 },
    modalTit: { margin: '0 0 2px', fontSize: '0.95rem', fontWeight: '700', color: '#2c3e50' },
    modalSub: { margin: 0, fontSize: '0.71rem', color: '#adb5bd' },
    modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '0.9rem', padding: 4, display: 'flex', alignItems: 'center' },
    modalBody: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa', borderRadius: '0 0 12px 12px', flexShrink: 0, alignItems: 'center' },
    avatarModal: { width: 46, height: 46, borderRadius: '50%', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', flexShrink: 0 },

    tabs: { display: 'flex', borderBottom: '2px solid #f0f0f0', padding: '0 20px', flexShrink: 0 },
    tab: { padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#adb5bd', borderBottom: '2px solid transparent', marginBottom: -2 },
    tabActivo: { color: 'var(--color-espoch-rojo)', borderBottomColor: 'var(--color-espoch-rojo)' },

    verSec: { marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' },
    verSecTit: { margin: '0 0 10px', fontSize: '0.8rem', fontWeight: '700', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 6 },
    secIco: { color: 'var(--color-espoch-rojo)', fontSize: '0.78rem' },
    verBio: { margin: 0, fontSize: '0.78rem', color: '#6c757d', lineHeight: 1.6 },
    verVacio: { margin: 0, fontSize: '0.75rem', color: '#adb5bd', fontStyle: 'italic' },
    verItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 11px', background: '#f8f9fa', border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 7 },
    verItemTit: { margin: '0 0 2px', fontSize: '0.78rem', fontWeight: '600', color: '#2c3e50' },
    verItemDesc: { margin: 0, fontSize: '0.71rem', color: '#6c757d', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    tagsWrap: { display: 'flex', flexWrap: 'wrap', gap: 5 },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 },
    datoItem: { display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 10px', background: '#f8f9fa', border: '1px solid #f0f0f0', borderRadius: 7 },
    datoLabel: { fontSize: '0.62rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.4px', display: 'flex', alignItems: 'center' },
    datoVal: { fontSize: '0.77rem', fontWeight: '600', color: '#2c3e50', wordBreak: 'break-all' },
    btnEditInline: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 6, cursor: 'pointer', fontSize: '0.69rem', fontWeight: '600', color: '#1565c0' },
    editContactoCard: { background: '#f0f7ff', border: '1px solid #bbdefb', borderRadius: 8, padding: '14px', marginTop: 6 },
    btnTrash: { width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffebee', border: '1px solid #ffcdd2', cursor: 'pointer', color: '#c62828', flexShrink: 0 },
    modalConfirm: { backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 380, padding: '28px 24px 22px', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
    confirmIco: { width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fff8e1', border: '2px solid #ffe082', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    confirmH: { margin: '0 0 4px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50' },
    confirmSub: { margin: '0 0 16px', fontSize: '0.79rem', color: '#6c757d', lineHeight: 1.6 },
    campo: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 },
    lbl: { fontSize: '0.75rem', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center' },
    inp: { padding: '8px 11px', border: '1px solid #e9ecef', borderRadius: 7, fontSize: '0.8rem', color: '#2c3e50', outline: 'none', fontFamily: "'Segoe UI',Roboto,sans-serif", backgroundColor: '#f8f9fa', width: '100%', boxSizing: 'border-box' },
    btnCancelar: { padding: '8px 16px', background: 'transparent', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#6c757d' },
    btnGuardar: { display: 'inline-flex', alignItems: 'center', padding: '8px 18px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' },

    /* Masivo */
    pasoBox: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    pasoNum: { width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800', flexShrink: 0, marginTop: 1 },
    pasoTit: { margin: '0 0 3px', fontSize: '0.84rem', fontWeight: '700', color: '#2c3e50' },
    pasoDesc: { margin: '0 0 8px', fontSize: '0.73rem', color: '#6c757d', lineHeight: 1.5 },
    btnDescarga: { display: 'inline-flex', alignItems: 'center', padding: '7px 14px', backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 7, cursor: 'pointer', fontSize: '0.76rem', fontWeight: '700' },
    columnasBox: { backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '10px 12px', marginBottom: 16 },
    dropZona: { border: '2px dashed #dee2e6', borderRadius: 8, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', backgroundColor: 'white', transition: 'border-color 0.2s' },
    avisoPass: { display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 8, padding: '10px 12px', marginTop: 8 },
    cargandoMasivo: { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '12px 16px', marginTop: 12 },

    /* Reporte */
    reporteResumen: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '14px 20px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 },
    reporteStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', borderRadius: 8, gap: 3 },
    reporteStatNum: { fontSize: '1.6rem', fontWeight: '800', color: '#2c3e50', lineHeight: 1 },
    reporteStatLbl: { fontSize: '0.58rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.8px' },
};

export default GestionGraduados;
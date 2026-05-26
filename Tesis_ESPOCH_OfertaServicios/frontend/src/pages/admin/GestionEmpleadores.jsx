// frontend/src/pages/admin/GestionEmpleadores.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    FaBuilding, FaSearch, FaFilter, FaChevronLeft, FaChevronRight,
    FaPlus, FaTimes, FaSave, FaSpinner, FaEdit, FaTrash,
    FaEye, FaUser, FaUsers, FaDownload, FaUpload,
    FaFileAlt, FaChevronDown, FaIndustry, FaStore, FaLandmark,
    FaExclamationTriangle, FaPhone, FaMapMarkerAlt,
} from 'react-icons/fa';
import { leerSesion } from '../../utils/storageSeguro';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};
const LIMIT = 20;

const TIPO_CAPITAL_OPTS   = ['Pública', 'Privada', 'Mixto'];
const TIPO_ACTIVIDAD_OPTS = ['Industrial', 'Comercial', 'Servicios'];

const PROVINCIAS_EC = [
    'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi',
    'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja',
    'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana', 'Pastaza',
    'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
    'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe',
];

const CAPITAL_BADGE = {
    'Pública': { bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb' },
    'Privada': { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
    'Mixto':   { bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
};
const ACTIVIDAD_BADGE = {
    'Industrial': { bg: '#fce4ec', color: '#880e4f', border: '#f48fb1' },
    'Comercial':  { bg: '#e8eaf6', color: '#283593', border: '#9fa8da' },
    'Servicios':  { bg: '#e0f2f1', color: '#00695c', border: '#80cbc4' },
};

const iniciales = (nombre = '') =>
    nombre.split(' ').map(p => p[0] || '').slice(0, 2).join('').toUpperCase() || '?';

const FORM_IND_VACIO = {
    nombreEmpresa: '', nombreGerente: '', emailOrganizacion: '',
    telefonoOrganizacion: '', provincia: '', ciudad: '',
    tipoCapital: '', tipoActividad: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS del subformulario — declarados FUERA para que sean estables
// ─────────────────────────────────────────────────────────────────────────────
const sf = {
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    campo: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 },
    lbl:   { fontSize: '0.75rem', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center' },
    inp:   { padding: '8px 11px', border: '1px solid #e9ecef', borderRadius: 7, fontSize: '0.8rem', color: '#2c3e50', outline: 'none', fontFamily: "'Segoe UI',Roboto,sans-serif", backgroundColor: '#f8f9fa', width: '100%', boxSizing: 'border-box' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBFORMULARIO declarado FUERA del componente padre
// CRÍTICO: si se declara dentro, React lo desmonta/monta en cada render
// y eso hace que los inputs pierdan el foco al escribir una letra
// ─────────────────────────────────────────────────────────────────────────────
const CamposOrganizacion = ({ form, onChange }) => (
    <>
        <div style={sf.grid2}>
            <div style={sf.campo}>
                <label style={sf.lbl}>Nombre de la empresa *</label>
                <input value={form.nombreEmpresa} onChange={e => onChange('nombreEmpresa', e.target.value)}
                    style={sf.inp} placeholder="Ej: TechCorp S.A." />
            </div>
            <div style={sf.campo}>
                <label style={sf.lbl}>Gerente / Propietario *</label>
                <input value={form.nombreGerente} onChange={e => onChange('nombreGerente', e.target.value)}
                    style={sf.inp} placeholder="Ej: Juan Pérez" />
            </div>
        </div>
        <div style={sf.campo}>
            <label style={sf.lbl}>Correo de la organización *</label>
            <input value={form.emailOrganizacion} onChange={e => onChange('emailOrganizacion', e.target.value)}
                style={sf.inp} placeholder="empresa@correo.com" type="email" />
        </div>
        <div style={sf.grid2}>
            <div style={sf.campo}>
                <label style={sf.lbl}><FaPhone style={{ marginRight: 4, fontSize: '0.65rem' }} />Teléfono de contacto *</label>
                <input value={form.telefonoOrganizacion} onChange={e => onChange('telefonoOrganizacion', e.target.value)}
                    style={sf.inp} placeholder="Ej: 0991234567" />
            </div>
            <div style={sf.campo}>
                <label style={sf.lbl}><FaMapMarkerAlt style={{ marginRight: 4, fontSize: '0.65rem' }} />Provincia *</label>
                <select value={form.provincia} onChange={e => onChange('provincia', e.target.value)} style={sf.inp}>
                    <option value="">Seleccionar...</option>
                    {PROVINCIAS_EC.map(p => <option key={p}>{p}</option>)}
                </select>
            </div>
        </div>
        <div style={sf.grid2}>
            <div style={sf.campo}>
                <label style={sf.lbl}><FaMapMarkerAlt style={{ marginRight: 4, fontSize: '0.65rem' }} />Ciudad *</label>
                <input value={form.ciudad} onChange={e => onChange('ciudad', e.target.value)}
                    style={sf.inp} placeholder="Ej: Riobamba" />
            </div>
            <div style={sf.campo}>
                <label style={sf.lbl}>Tipo de capital *</label>
                <select value={form.tipoCapital} onChange={e => onChange('tipoCapital', e.target.value)} style={sf.inp}>
                    <option value="">Seleccionar...</option>
                    {TIPO_CAPITAL_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
            </div>
        </div>
        <div style={sf.campo}>
            <label style={sf.lbl}>Tipo de actividad *</label>
            <select value={form.tipoActividad} onChange={e => onChange('tipoActividad', e.target.value)} style={sf.inp}>
                <option value="">Seleccionar...</option>
                {TIPO_ACTIVIDAD_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
        </div>
    </>
);

// ─────────────────────────────────────────────────────────────────────────────

const GestionEmpleadores = () => {
    const [metricas, setMetricas]       = useState(null);
    const [empleadores, setEmpleadores] = useState([]);
    const [total, setTotal]             = useState(0);
    const [paginas, setPaginas]         = useState(1);
    const [pagina, setPagina]           = useState(1);
    const [cargando, setCargando]       = useState(true);
    const [error, setError]             = useState('');

    const [buscar, setBuscar]                   = useState('');
    const [filtroCapital, setFiltroCapital]     = useState('');
    const [filtroActividad, setFiltroActividad] = useState('');

    const [menuNuevo, setMenuNuevo] = useState(false);
    const menuRef = useRef(null);

    const [modalVer, setModalVer]   = useState(false);
    const [empSel, setEmpSel]       = useState(null);
    const [editando, setEditando]   = useState(false);
    const [formEdit, setFormEdit]   = useState({});
    const [guardando, setGuardando] = useState(false);
    const [errEdit, setErrEdit]     = useState('');

    const [modalInd, setModalInd]         = useState(false);
    const [guardandoInd, setGuardandoInd] = useState(false);
    const [errInd, setErrInd]             = useState('');
    const [formInd, setFormInd]           = useState(FORM_IND_VACIO);

    const [modalMasivo, setModalMasivo]       = useState(false);
    const [archivoCsv, setArchivoCsv]         = useState(null);
    const [cargandoMasivo, setCargandoMasivo] = useState(false);
    const [errMasivo, setErrMasivo]           = useState('');
    const csvRef = useRef(null);

    const [modalReporte, setModalReporte] = useState(false);
    const [reporte, setReporte]           = useState(null);
    const [tabReporte, setTabReporte]     = useState('todos');

    const [modalElim, setModalElim] = useState({ abierto: false, id: null, nombre: '' });
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuNuevo(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const cargar = useCallback(async (q = '', cap = '', act = '', pag = 1) => {
        setCargando(true); setError('');
        try {
            const params = new URLSearchParams({ page: pag, limit: LIMIT });
            if (q)   params.append('buscar', q);
            if (cap) params.append('tipoCapital', cap);
            if (act) params.append('tipoActividad', act);
            const [mRes, eRes] = await Promise.all([
                axios.get(`${API}/admin/empleadores/metricas`, { headers: hdrs() }),
                axios.get(`${API}/admin/empleadores?${params}`, { headers: hdrs() }),
            ]);
            setMetricas(mRes.data);
            setEmpleadores(eRes.data.empleadores || []);
            setTotal(eRes.data.total || 0);
            setPaginas(eRes.data.totalPaginas || 1);
        } catch (e) { console.error(e); setError('Error al cargar empleadores.'); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        const t = setTimeout(() => { setPagina(1); cargar(buscar, filtroCapital, filtroActividad, 1); }, 350);
        return () => clearTimeout(t);
    }, [buscar, filtroCapital, filtroActividad]);

    const irPagina = (p) => { setPagina(p); cargar(buscar, filtroCapital, filtroActividad, p); };

    // Handlers para CamposOrganizacion — useCallback para estabilidad
    const handleEditChange = useCallback((key, val) => setFormEdit(f => ({ ...f, [key]: val })), []);
    const handleIndChange  = useCallback((key, val) => setFormInd(f  => ({ ...f, [key]: val })), []);

    const abrirVer = (emp, abrirEdicion = false) => {
        setEmpSel(emp);
        setEditando(abrirEdicion);
        setFormEdit({
            nombreEmpresa:        emp.nombreEmpresa,
            nombreGerente:        emp.nombreGerente,
            emailOrganizacion:    emp.emailOrganizacion,
            telefonoOrganizacion: emp.telefonoOrganizacion || '',
            provincia:            emp.provincia || '',
            ciudad:               emp.ciudad || '',
            tipoCapital:          emp.tipoCapital,
            tipoActividad:        emp.tipoActividad,
        });
        setErrEdit('');
        setModalVer(true);
    };

    const guardarEdicion = async () => {
        setErrEdit('');
        const { nombreEmpresa, nombreGerente, emailOrganizacion,
                telefonoOrganizacion, provincia, ciudad,
                tipoCapital, tipoActividad } = formEdit;
        if (!nombreEmpresa || !nombreGerente || !emailOrganizacion ||
            !telefonoOrganizacion || !provincia || !ciudad ||
            !tipoCapital || !tipoActividad) {
            setErrEdit('Todos los campos son obligatorios.'); return;
        }
        setGuardando(true);
        try {
            const { data } = await axios.patch(
                `${API}/admin/empleadores/${empSel._id}`, formEdit, { headers: hdrs() }
            );
            setEmpSel(data.empleador);
            setEditando(false);
            cargar(buscar, filtroCapital, filtroActividad, pagina);
        } catch (e) { setErrEdit(e.response?.data?.msg || 'Error al guardar.'); }
        finally { setGuardando(false); }
    };

    const abrirInd = () => {
        setMenuNuevo(false);
        setFormInd(FORM_IND_VACIO);
        setErrInd('');
        setModalInd(true);
    };

    const guardarInd = async () => {
        setErrInd('');
        const { nombreEmpresa, nombreGerente, emailOrganizacion,
                telefonoOrganizacion, provincia, ciudad,
                tipoCapital, tipoActividad } = formInd;
        if (!nombreEmpresa || !nombreGerente || !emailOrganizacion ||
            !telefonoOrganizacion || !provincia || !ciudad ||
            !tipoCapital || !tipoActividad) {
            setErrInd('Todos los campos son obligatorios.'); return;
        }
        setGuardandoInd(true);
        try {
            await axios.post(`${API}/admin/empleadores/registro-individual`, formInd, { headers: hdrs() });
            setModalInd(false);
            cargar(buscar, filtroCapital, filtroActividad, pagina);
        } catch (e) { setErrInd(e.response?.data?.msg || 'Error al registrar.'); }
        finally { setGuardandoInd(false); }
    };

    const confirmarEliminar = async () => {
        setEliminando(true);
        try {
            await axios.delete(`${API}/admin/empleadores/${modalElim.id}`, { headers: hdrs() });
            setModalElim({ abierto: false, id: null, nombre: '' });
            if (modalVer) setModalVer(false);
            cargar(buscar, filtroCapital, filtroActividad, pagina);
        } catch (e) { setError(e.response?.data?.msg || 'Error al eliminar.'); }
        finally { setEliminando(false); }
    };

    const descargarPlantilla = async () => {
        try {
            const resp = await axios.get(`${API}/admin/empleadores/plantilla-csv`, { headers: hdrs(), responseType: 'blob' });
            const url  = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href  = url;
            link.setAttribute('download', 'plantilla_empleadores_espoch.csv');
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch { alert('Error al descargar la plantilla.'); }
    };

    const abrirMasivo = () => {
        setMenuNuevo(false);
        setArchivoCsv(null); setErrMasivo('');
        if (csvRef.current) csvRef.current.value = '';
        setModalMasivo(true);
    };

    const procesarCSV = async () => {
        if (!archivoCsv) { setErrMasivo('Selecciona un archivo CSV.'); return; }
        setErrMasivo(''); setCargandoMasivo(true);
        try {
            const fd = new FormData();
            fd.append('archivo', archivoCsv);
            const { data } = await axios.post(`${API}/admin/empleadores/carga-masiva`, fd, {
                headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' }
            });
            setModalMasivo(false);
            setReporte(data.reporte); setTabReporte('todos'); setModalReporte(true);
            cargar(buscar, filtroCapital, filtroActividad, pagina);
        } catch (e) { setErrMasivo(e.response?.data?.msg || 'Error al procesar el CSV.'); }
        finally { setCargandoMasivo(false); }
    };

    const Paginador = () => {
        if (paginas <= 1) return null;
        const ini  = Math.max(1, pagina - 2);
        const fin  = Math.min(paginas, ini + 4);
        const pags = Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
        return (
            <div style={s.pagRow}>
                <button style={{ ...s.pagBtn, opacity: pagina === 1 ? 0.4 : 1 }} onClick={() => irPagina(pagina - 1)} disabled={pagina === 1}><FaChevronLeft style={{ fontSize: '0.6rem' }} /></button>
                {ini > 1 && <span style={s.pagPuntos}>···</span>}
                {pags.map(p => (
                    <button key={p} style={{ ...s.pagBtn, background: p === pagina ? 'var(--color-espoch-rojo)' : 'white', color: p === pagina ? 'white' : '#6c757d', border: p === pagina ? '1px solid var(--color-espoch-rojo)' : '1px solid #e9ecef', fontWeight: p === pagina ? '700' : '400' }} onClick={() => irPagina(p)}>{p}</button>
                ))}
                {fin < paginas && <span style={s.pagPuntos}>···</span>}
                <button style={{ ...s.pagBtn, opacity: pagina === paginas ? 0.4 : 1 }} onClick={() => irPagina(pagina + 1)} disabled={pagina === paginas}><FaChevronRight style={{ fontSize: '0.6rem' }} /></button>
            </div>
        );
    };

    const detalleFiltrado = reporte?.detalle?.filter(d => {
        if (tabReporte === 'exitosos') return d.estado === 'exitoso';
        if (tabReporte === 'errores')  return d.estado === 'error';
        return true;
    }) || [];

    return (
        <div style={s.page}>

            {/* MÉTRICAS */}
            <div style={s.gridMet}>
                {[
                    { label: 'TOTAL EMPRESAS', key: 'total',    Icon: FaBuilding, bg: '#ffebee', border: '#ffcdd2', color: '#c62828', top: '#c62828' },
                    { label: 'PÚBLICAS',        key: 'publicas', Icon: FaLandmark, bg: '#e3f2fd', border: '#bbdefb', color: '#1565c0', top: '#1565c0' },
                    { label: 'PRIVADAS',        key: 'privadas', Icon: FaStore,    bg: '#e8f5e9', border: '#c8e6c9', color: '#2e7d32', top: '#2e7d32' },
                    { label: 'MIXTAS',          key: 'mixtas',   Icon: FaIndustry, bg: '#fff8e1', border: '#ffe082', color: '#f57f17', top: '#f57f17' },
                ].map(m => (
                    <div key={m.label} style={{ ...s.metCard, borderTop: `3px solid ${m.top}` }}>
                        <div style={s.metRow}>
                            <div>
                                <p style={s.metEtiq}>{m.label}</p>
                                <p style={s.metVal}>{cargando ? <span style={{ color: '#ced4da' }}>···</span> : (metricas?.[m.key] ?? '—')}</p>
                            </div>
                            <div style={{ ...s.metIco, background: m.bg, border: `1px solid ${m.border}` }}>
                                <m.Icon style={{ fontSize: '1rem', color: m.color }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* TABLA */}
            <div style={s.card}>
                <div style={s.cardHead}>
                    <div>
                        <h2 style={s.cardTit}>Gestión de Empleadores</h2>
                        {!cargando && !error && <p style={s.cardSub}>{total} empresas · página {pagina} de {paginas}</p>}
                    </div>
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button style={s.btnNuevo} onClick={() => setMenuNuevo(v => !v)}>
                            <FaPlus style={{ fontSize: '0.72rem' }} />Nuevo Empleador<FaChevronDown style={{ fontSize: '0.6rem', marginLeft: 2 }} />
                        </button>
                        {menuNuevo && (
                            <div style={s.dropdown}>
                                <button style={s.dropItem} onClick={abrirInd}>
                                    <div style={{ ...s.dropIco, background: '#e3f2fd', border: '1px solid #bbdefb' }}><FaUser style={{ color: '#1565c0', fontSize: '0.75rem' }} /></div>
                                    <div><p style={s.dropTit}>Individual</p><p style={s.dropSub}>Registrar una empresa manualmente</p></div>
                                </button>
                                <div style={s.dropDivider} />
                                <button style={s.dropItem} onClick={abrirMasivo}>
                                    <div style={{ ...s.dropIco, background: '#e8f5e9', border: '1px solid #c8e6c9' }}><FaUsers style={{ color: '#2e7d32', fontSize: '0.75rem' }} /></div>
                                    <div><p style={s.dropTit}>Carga masiva CSV</p><p style={s.dropSub}>Registrar múltiples empresas desde archivo</p></div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div style={s.filtrosRow}>
                    <div style={s.busqWrap}>
                        <FaSearch style={{ fontSize: '0.65rem', color: '#adb5bd', flexShrink: 0 }} />
                        <input type="text" placeholder="Buscar por empresa, gerente o correo..."
                            value={buscar} onChange={e => setBuscar(e.target.value)} style={s.busqInp} />
                    </div>
                    <div style={s.selectWrap}>
                        <FaFilter style={{ fontSize: '0.6rem', color: '#adb5bd', flexShrink: 0 }} />
                        <select value={filtroCapital} onChange={e => setFiltroCapital(e.target.value)} style={s.selectEl}>
                            <option value="">Capital: Todos</option>
                            {TIPO_CAPITAL_OPTS.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div style={s.selectWrap}>
                        <FaFilter style={{ fontSize: '0.6rem', color: '#adb5bd', flexShrink: 0 }} />
                        <select value={filtroActividad} onChange={e => setFiltroActividad(e.target.value)} style={s.selectEl}>
                            <option value="">Actividad: Todas</option>
                            {TIPO_ACTIVIDAD_OPTS.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>

                {error && <p style={s.errMsg}>{error}</p>}
                {!error && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={s.tabla}>
                            <thead>
                                <tr style={s.trHead}>
                                    {['EMPRESA', 'GERENTE / PROPIETARIO', 'UBICACIÓN', 'CAPITAL', 'ACTIVIDAD', 'REGISTRADO', 'ACCIONES'].map(h => <th key={h} style={s.th}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {cargando
                                    ? Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j} style={s.td}><div style={{ ...s.skBar, width: j === 0 ? '70%' : '50%' }} /></td>)}</tr>
                                    ))
                                    : empleadores.length === 0
                                        ? <tr><td colSpan={7} style={s.tdVacio}>No se encontraron empleadores.</td></tr>
                                        : empleadores.map(emp => {
                                            const bCap = CAPITAL_BADGE[emp.tipoCapital]     || CAPITAL_BADGE['Privada'];
                                            const bAct = ACTIVIDAD_BADGE[emp.tipoActividad] || ACTIVIDAD_BADGE['Servicios'];
                                            return (
                                                <tr key={emp._id} style={s.trBody}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                    <td style={s.td}>
                                                        <div style={s.nomCell}>
                                                            <div style={s.avatarEmp}>{iniciales(emp.nombreEmpresa)}</div>
                                                            <div>
                                                                <p style={s.nomTxt}>{emp.nombreEmpresa}</p>
                                                                <p style={s.nomSub}>{emp.emailOrganizacion}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={s.td}>
                                                        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '600', color: '#2c3e50' }}>{emp.nombreGerente}</p>
                                                        {emp.telefonoOrganizacion && <p style={{ margin: '1px 0 0', fontSize: '0.66rem', color: '#adb5bd' }}><FaPhone style={{ marginRight: 3, fontSize: '0.58rem' }} />{emp.telefonoOrganizacion}</p>}
                                                    </td>
                                                    <td style={s.td}>
                                                        {(emp.ciudad || emp.provincia)
                                                            ? <p style={{ margin: 0, fontSize: '0.74rem', color: '#6c757d' }}><FaMapMarkerAlt style={{ marginRight: 3, fontSize: '0.62rem', color: '#adb5bd' }} />{[emp.ciudad, emp.provincia].filter(Boolean).join(', ')}</p>
                                                            : <span style={{ fontSize: '0.72rem', color: '#ced4da' }}>—</span>}
                                                    </td>
                                                    <td style={s.td}><span style={{ ...s.badge, background: bCap.bg, color: bCap.color, border: `1px solid ${bCap.border}` }}>{emp.tipoCapital}</span></td>
                                                    <td style={s.td}><span style={{ ...s.badge, background: bAct.bg, color: bAct.color, border: `1px solid ${bAct.border}` }}>{emp.tipoActividad}</span></td>
                                                    <td style={s.td}><span style={{ fontSize: '0.72rem', color: '#adb5bd' }}>{new Date(emp.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
                                                    <td style={s.td}>
                                                        <div style={s.accsRow}>
                                                            <button style={s.btnAcc} onClick={() => abrirVer(emp)} title="Ver"><FaEye style={{ fontSize: '0.7rem' }} /></button>
                                                            <button style={{ ...s.btnAcc, background: '#e3f2fd', border: '1px solid #bbdefb', color: '#1565c0' }} onClick={() => abrirVer(emp, true)} title="Editar"><FaEdit style={{ fontSize: '0.7rem' }} /></button>
                                                            <button style={{ ...s.btnAcc, background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828' }} onClick={() => setModalElim({ abierto: true, id: emp._id, nombre: emp.nombreEmpresa })} title="Eliminar"><FaTrash style={{ fontSize: '0.7rem' }} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                            </tbody>
                        </table>
                    </div>
                )}
                {!cargando && !error && empleadores.length > 0 && (
                    <div style={s.footTabla}>
                        <p style={s.contadorTxt}>Mostrando {(pagina - 1) * LIMIT + 1}–{Math.min(pagina * LIMIT, total)} de {total} empresas</p>
                        <Paginador />
                    </div>
                )}
            </div>

            {/* ══ MODAL VER / EDITAR ══ */}
            {modalVer && empSel && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalVer(false); }}>
                    <div style={{ ...s.modal, maxWidth: 600 }}>
                        <div style={{ ...s.modalHead, borderColor: 'var(--color-espoch-rojo)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ ...s.avatarEmp, width: 44, height: 44, fontSize: '0.9rem', borderRadius: 10 }}>{iniciales(empSel.nombreEmpresa)}</div>
                                <div>
                                    <h2 style={s.modalTit}>{empSel.nombreEmpresa}</h2>
                                    <p style={s.modalSub}>{empSel.emailOrganizacion}</p>
                                </div>
                            </div>
                            <button style={s.modalClose} onClick={() => setModalVer(false)}><FaTimes /></button>
                        </div>
                        <div style={s.modalBody}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                                {(() => { const b = CAPITAL_BADGE[empSel.tipoCapital] || {}; return <span style={{ ...s.badge, background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>{empSel.tipoCapital}</span>; })()}
                                {(() => { const b = ACTIVIDAD_BADGE[empSel.tipoActividad] || {}; return <span style={{ ...s.badge, background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>{empSel.tipoActividad}</span>; })()}
                                {empSel.ciudad && <span style={{ ...s.badge, background: '#f3e8ff', color: '#6a1b9a', border: '1px solid #ddd6fe' }}><FaMapMarkerAlt style={{ marginRight: 3, fontSize: '0.58rem' }} />{empSel.ciudad}</span>}
                            </div>
                            <div style={s.verSec}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <p style={s.verSecTit}>Datos de la organización</p>
                                    {!editando && (
                                        <button style={s.btnEditInline} onClick={() => {
                                            setFormEdit({ nombreEmpresa: empSel.nombreEmpresa, nombreGerente: empSel.nombreGerente, emailOrganizacion: empSel.emailOrganizacion, telefonoOrganizacion: empSel.telefonoOrganizacion || '', provincia: empSel.provincia || '', ciudad: empSel.ciudad || '', tipoCapital: empSel.tipoCapital, tipoActividad: empSel.tipoActividad });
                                            setEditando(true); setErrEdit('');
                                        }}>
                                            <FaEdit style={{ fontSize: '0.65rem' }} /> Editar
                                        </button>
                                    )}
                                </div>
                                {errEdit && <p style={{ ...s.errMsg, marginBottom: 8 }}>{errEdit}</p>}
                                {editando ? (
                                    <div style={s.editCard}>
                                        <CamposOrganizacion form={formEdit} onChange={handleEditChange} />
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                                            <button style={s.btnCancelar} onClick={() => { setEditando(false); setErrEdit(''); }}>Cancelar</button>
                                            <button style={s.btnGuardar} onClick={guardarEdicion} disabled={guardando}>
                                                {guardando ? <><FaSpinner style={{ marginRight: 5 }} />Guardando...</> : <><FaSave style={{ marginRight: 5 }} />Guardar</>}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={s.grid3}>
                                        {[
                                            { label: 'Nombre empresa',      val: empSel.nombreEmpresa },
                                            { label: 'Gerente/Propietario', val: empSel.nombreGerente },
                                            { label: 'Correo organización', val: empSel.emailOrganizacion },
                                            { label: 'Teléfono contacto',   val: empSel.telefonoOrganizacion || '—' },
                                            { label: 'Provincia',           val: empSel.provincia || '—' },
                                            { label: 'Ciudad',              val: empSel.ciudad || '—' },
                                            { label: 'Tipo de capital',     val: empSel.tipoCapital },
                                            { label: 'Tipo de actividad',   val: empSel.tipoActividad },
                                            { label: 'Registrado',          val: new Date(empSel.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                        ].map((d, i) => (
                                            <div key={i} style={s.datoItem}>
                                                <span style={s.datoLabel}>{d.label}</span>
                                                <span style={s.datoVal}>{d.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ ...s.verSec, borderBottom: 'none', marginBottom: 0 }}>
                                <p style={s.verSecTit}>Datos del encuestado</p>
                                {empSel.encuestado?.nombresApellidos ? (
                                    <div style={s.grid2}>
                                        {[
                                            { label: 'Nombres y apellidos', val: empSel.encuestado.nombresApellidos },
                                            { label: 'Cargo',               val: empSel.encuestado.cargo || '—' },
                                            { label: 'Profesión',           val: empSel.encuestado.profesion || '—' },
                                            { label: 'Email',               val: empSel.encuestado.email || '—' },
                                            { label: 'Teléfono',            val: empSel.encuestado.telefono || '—' },
                                            { label: 'Estudios ESPOCH',     val: empSel.encuestado.estudiosEspoch || '—' },
                                        ].map((d, i) => (
                                            <div key={i} style={s.datoItem}><span style={s.datoLabel}>{d.label}</span><span style={s.datoVal}>{d.val}</span></div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '14px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#adb5bd', fontStyle: 'italic' }}>ℹ️ Se completarán cuando la empresa responda su primera encuesta.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={s.modalFoot}>
                            <button style={{ ...s.btnCancelar, color: '#c62828', borderColor: '#ffcdd2', marginRight: 'auto', display: 'inline-flex', alignItems: 'center' }}
                                onClick={() => setModalElim({ abierto: true, id: empSel._id, nombre: empSel.nombreEmpresa })}>
                                <FaTrash style={{ marginRight: 5, fontSize: '0.65rem' }} />Eliminar
                            </button>
                            <button style={s.btnCancelar} onClick={() => setModalVer(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MODAL INDIVIDUAL ══ */}
            {modalInd && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalInd(false); }}>
                    <div style={{ ...s.modal, maxWidth: 560 }}>
                        <div style={{ ...s.modalHead, borderColor: 'var(--color-espoch-rojo)' }}>
                            <div>
                                <h2 style={s.modalTit}>Nuevo Empleador — Individual</h2>
                                <p style={s.modalSub}>Todos los campos son obligatorios *</p>
                            </div>
                            <button style={s.modalClose} onClick={() => setModalInd(false)}><FaTimes /></button>
                        </div>
                        <div style={s.modalBody}>
                            {errInd && <p style={s.errMsg}>{errInd}</p>}
                            <CamposOrganizacion form={formInd} onChange={handleIndChange} />
                        </div>
                        <div style={s.modalFoot}>
                            <button style={s.btnCancelar} onClick={() => setModalInd(false)}>Cancelar</button>
                            <button style={s.btnGuardar} onClick={guardarInd} disabled={guardandoInd}>
                                {guardandoInd ? <><FaSpinner style={{ marginRight: 5 }} />Registrando...</> : <><FaSave style={{ marginRight: 5 }} />Registrar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MODAL MASIVO ══ */}
            {modalMasivo && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget && !cargandoMasivo) setModalMasivo(false); }}>
                    <div style={{ ...s.modal, maxWidth: 560 }}>
                        <div style={{ ...s.modalHead, borderColor: '#2e7d32' }}>
                            <div>
                                <h2 style={s.modalTit}>Carga masiva de empleadores</h2>
                                <p style={s.modalSub}>Registra múltiples empresas desde CSV · Máx. 200 filas</p>
                            </div>
                            {!cargandoMasivo && <button style={s.modalClose} onClick={() => setModalMasivo(false)}><FaTimes /></button>}
                        </div>
                        <div style={s.modalBody}>
                            <div style={s.pasoBox}>
                                <div style={s.pasoNum}>1</div>
                                <div style={{ flex: 1 }}>
                                    <p style={s.pasoTit}>Descarga la plantilla CSV</p>
                                    <p style={s.pasoDesc}>Todos los campos son obligatorios: empresa, gerente, correo, teléfono, provincia, ciudad, capital y actividad.</p>
                                    <button style={s.btnDescarga} onClick={descargarPlantilla}>
                                        <FaDownload style={{ marginRight: 6, fontSize: '0.78rem' }} />Descargar plantilla_empleadores_espoch.csv
                                    </button>
                                </div>
                            </div>
                            <div style={s.columnasBox}>
                                <p style={{ margin: '0 0 6px', fontSize: '0.71rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.5px' }}>COLUMNAS DEL CSV (todas obligatorias)</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {['nombre empresa', 'nombre gerente', 'email organizacion', 'telefono organizacion', 'provincia', 'ciudad', 'tipo capital', 'tipo actividad'].map(c => (
                                        <span key={c} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: '#fff8e1', color: '#e65100', border: '1px solid #ffe082', fontWeight: '600', fontFamily: 'monospace' }}>{c}</span>
                                    ))}
                                </div>
                                <p style={{ margin: '6px 0 0', fontSize: '0.68rem', color: '#adb5bd' }}>Capital: <strong>Pública / Privada / Mixto</strong> · Actividad: <strong>Industrial / Comercial / Servicios</strong></p>
                            </div>
                            <div style={s.pasoBox}>
                                <div style={s.pasoNum}>2</div>
                                <div style={{ flex: 1 }}>
                                    <p style={s.pasoTit}>Sube el archivo CSV completado</p>
                                    <div style={s.dropZona} onClick={() => !cargandoMasivo && csvRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.csv')) setArchivoCsv(f); }}>
                                        {archivoCsv ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <FaFileAlt style={{ fontSize: '1.4rem', color: '#2e7d32', flexShrink: 0 }} />
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700', color: '#2e7d32' }}>{archivoCsv.name}</p>
                                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#adb5bd' }}>{(archivoCsv.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button onClick={e => { e.stopPropagation(); setArchivoCsv(null); if (csvRef.current) csvRef.current.value = ''; }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd' }}><FaTimes /></button>
                                            </div>
                                        ) : (
                                            <><FaUpload style={{ fontSize: '1.8rem', color: '#adb5bd', marginBottom: 6 }} /><p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: '#6c757d' }}>Arrastra el CSV aquí o haz clic</p><p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: '#adb5bd' }}>Solo .csv · Máx. 5 MB</p></>
                                        )}
                                    </div>
                                    <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={e => { const f = e.target.files[0]; if (f) setArchivoCsv(f); }} style={{ display: 'none' }} />
                                </div>
                            </div>
                            {errMasivo && <p style={{ ...s.errMsg, marginTop: 8 }}>{errMasivo}</p>}
                            {cargandoMasivo && <div style={s.cargandoBox}><FaSpinner style={{ fontSize: '1.4rem', color: 'var(--color-espoch-rojo)' }} /><div><p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem' }}>Procesando empleadores...</p><p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6c757d' }}>Por favor espera.</p></div></div>}
                        </div>
                        <div style={s.modalFoot}>
                            {!cargandoMasivo && <button style={s.btnCancelar} onClick={() => setModalMasivo(false)}>Cancelar</button>}
                            <button style={{ ...s.btnGuardar, background: '#2e7d32', opacity: archivoCsv && !cargandoMasivo ? 1 : 0.5 }} onClick={procesarCSV} disabled={!archivoCsv || cargandoMasivo}>
                                {cargandoMasivo ? <><FaSpinner style={{ marginRight: 5 }} />Procesando...</> : <><FaUpload style={{ marginRight: 5 }} />Procesar CSV</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MODAL REPORTE ══ */}
            {modalReporte && reporte && (
                <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalReporte(false); }}>
                    <div style={{ ...s.modal, maxWidth: 640 }}>
                        <div style={{ ...s.modalHead, borderColor: reporte.fallidos === 0 ? '#2e7d32' : '#f57f17' }}>
                            <div>
                                <h2 style={s.modalTit}>{reporte.fallidos === 0 ? '✅ Carga completada' : '⚠️ Carga con advertencias'}</h2>
                                <p style={s.modalSub}>Reporte de carga masiva de empleadores</p>
                            </div>
                            <button style={s.modalClose} onClick={() => setModalReporte(false)}><FaTimes /></button>
                        </div>
                        <div style={s.reporteResumen}>
                            {[
                                { label: 'TOTAL', val: reporte.total, bg: '#f8f9fa', border: '#e9ecef', color: '#2c3e50' },
                                { label: 'EXITOSOS', val: reporte.exitosos, bg: '#e8f5e9', border: '#c8e6c9', color: '#2e7d32' },
                                { label: 'ERRORES', val: reporte.fallidos, bg: '#ffebee', border: '#ffcdd2', color: '#c62828' },
                            ].map(r => (
                                <div key={r.label} style={{ ...s.reporteStat, background: r.bg, border: `1px solid ${r.border}` }}>
                                    <span style={{ ...s.reporteStatNum, color: r.color }}>{r.val}</span>
                                    <span style={{ ...s.reporteStatLbl, color: r.color }}>{r.label}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ ...s.tabs, padding: '0 20px' }}>
                            {[{ k: 'todos', l: `Todos (${reporte.total})` }, { k: 'exitosos', l: `✅ Exitosos (${reporte.exitosos})` }, { k: 'errores', l: `❌ Errores (${reporte.fallidos})` }].map(t => (
                                <button key={t.k} style={{ ...s.tab, ...(tabReporte === t.k ? s.tabActivo : {}) }} onClick={() => setTabReporte(t.k)}>{t.l}</button>
                            ))}
                        </div>
                        <div style={{ ...s.modalBody, padding: '12px 20px' }}>
                            {detalleFiltrado.length === 0
                                ? <p style={{ color: '#adb5bd', fontSize: '0.78rem', textAlign: 'center', fontStyle: 'italic' }}>Sin registros.</p>
                                : detalleFiltrado.map((d, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: d.estado === 'exitoso' ? '#f1f8e9' : '#fff8f8', border: `1px solid ${d.estado === 'exitoso' ? '#c8e6c9' : '#ffcdd2'}` }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: d.estado === 'exitoso' ? '#2e7d32' : '#c62828', fontSize: '0.7rem', color: 'white', fontWeight: '700', marginTop: 1 }}>{d.estado === 'exitoso' ? '✓' : '✕'}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2c3e50' }}>{d.nombreEmpresa}</span>
                                                <span style={{ fontSize: '0.65rem', color: '#adb5bd' }}>Fila {d.fila}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#6c757d' }}>{d.email}</p>
                                            <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: d.estado === 'exitoso' ? '#2e7d32' : '#c62828', fontWeight: d.estado === 'error' ? '600' : '400' }}>{d.motivo}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <div style={s.modalFoot}>
                            {reporte.fallidos > 0 && <p style={{ margin: 0, fontSize: '0.72rem', color: '#f57f17', flex: 1 }}>⚠️ Corrige los errores y vuelve a subirlos.</p>}
                            <button style={s.btnCancelar} onClick={() => setModalReporte(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ CONFIRMAR ELIMINAR ══ */}
            {modalElim.abierto && (
                <div style={{ ...s.overlay, zIndex: 1100 }}>
                    <div style={s.modalConfirm}>
                        <div style={s.confirmIco}><FaExclamationTriangle style={{ fontSize: '1.8rem', color: '#c62828' }} /></div>
                        <h3 style={s.confirmH}>¿Eliminar empleador?</h3>
                        <p style={s.confirmSub}>Se eliminará <strong style={{ color: '#c62828' }}>"{modalElim.nombre}"</strong>.<br /><strong>Esta acción no se puede deshacer.</strong></p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button style={s.btnCancelar} onClick={() => setModalElim({ abierto: false, id: null, nombre: '' })} disabled={eliminando}>Cancelar</button>
                            <button style={{ ...s.btnGuardar, background: '#c62828' }} onClick={confirmarEliminar} disabled={eliminando}>
                                {eliminando ? <><FaSpinner style={{ marginRight: 5 }} />Eliminando...</> : <><FaTrash style={{ marginRight: 5 }} />Sí, eliminar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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
    avatarEmp: { width: 36, height: 36, borderRadius: 8, background: 'var(--color-espoch-rojo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 },
    nomTxt: { margin: 0, fontSize: '0.78rem', fontWeight: '600', color: '#2c3e50', whiteSpace: 'nowrap' },
    nomSub: { margin: 0, fontSize: '0.66rem', color: '#adb5bd' },
    badge: { display: 'inline-block', fontSize: '0.63rem', fontWeight: '600', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
    accsRow: { display: 'flex', gap: 5, alignItems: 'center' },
    btnAcc: { width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', border: '1px solid #e9ecef', cursor: 'pointer', color: '#6c757d', flexShrink: 0 },
    errMsg: { padding: '10px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 7, color: '#c62828', fontSize: '0.75rem', margin: '0 0 10px' },
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
    modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '0.9rem', padding: 4 },
    modalBody: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa', borderRadius: '0 0 12px 12px', flexShrink: 0, alignItems: 'center' },
    verSec: { marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' },
    verSecTit: { margin: '0 0 10px', fontSize: '0.8rem', fontWeight: '700', color: '#2c3e50' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 },
    datoItem: { display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 10px', background: '#f8f9fa', border: '1px solid #f0f0f0', borderRadius: 7 },
    datoLabel: { fontSize: '0.62rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.4px' },
    datoVal: { fontSize: '0.77rem', fontWeight: '600', color: '#2c3e50', wordBreak: 'break-all' },
    btnEditInline: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 6, cursor: 'pointer', fontSize: '0.69rem', fontWeight: '600', color: '#1565c0' },
    editCard: { background: '#f0f7ff', border: '1px solid #bbdefb', borderRadius: 8, padding: '14px', marginTop: 6 },
    btnCancelar: { padding: '8px 16px', background: 'transparent', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#6c757d' },
    btnGuardar: { display: 'inline-flex', alignItems: 'center', padding: '8px 18px', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' },
    pasoBox: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    pasoNum: { width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--color-espoch-rojo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800', flexShrink: 0, marginTop: 1 },
    pasoTit: { margin: '0 0 3px', fontSize: '0.84rem', fontWeight: '700', color: '#2c3e50' },
    pasoDesc: { margin: '0 0 8px', fontSize: '0.73rem', color: '#6c757d', lineHeight: 1.5 },
    btnDescarga: { display: 'inline-flex', alignItems: 'center', padding: '7px 14px', backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 7, cursor: 'pointer', fontSize: '0.76rem', fontWeight: '700' },
    columnasBox: { backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '10px 12px', marginBottom: 16 },
    dropZona: { border: '2px dashed #dee2e6', borderRadius: 8, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', backgroundColor: 'white' },
    cargandoBox: { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '12px 16px', marginTop: 12 },
    tabs: { display: 'flex', borderBottom: '2px solid #f0f0f0', flexShrink: 0 },
    tab: { padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#adb5bd', borderBottom: '2px solid transparent', marginBottom: -2 },
    tabActivo: { color: 'var(--color-espoch-rojo)', borderBottomColor: 'var(--color-espoch-rojo)' },
    reporteResumen: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '14px 20px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 },
    reporteStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', borderRadius: 8, gap: 3 },
    reporteStatNum: { fontSize: '1.6rem', fontWeight: '800', lineHeight: 1 },
    reporteStatLbl: { fontSize: '0.58rem', fontWeight: '700', letterSpacing: '0.8px' },
    modalConfirm: { backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 380, padding: '28px 24px 22px', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
    confirmIco: { width: 56, height: 56, borderRadius: '50%', backgroundColor: '#ffebee', border: '2px solid #ffcdd2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    confirmH: { margin: '0 0 4px', fontSize: '1rem', fontWeight: '700', color: '#2c3e50' },
    confirmSub: { margin: '0 0 16px', fontSize: '0.79rem', color: '#6c757d', lineHeight: 1.6 },
};

export default GestionEmpleadores;
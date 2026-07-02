// src/pages/graduado/PreviewHojaVida.jsx
// Modal de previsualización + descarga (PDF y DOCX) de la Hoja de Vida.
// Diseño profesional estilo CV: cabecera blanca con logos, nombre grande,
// secciones con banda verde, datos personales en tabla con foto a la derecha.
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    FaTimes, FaFilePdf, FaFileWord, FaSpinner, FaExclamationTriangle,
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';

const ROJO = '#BE1E2D';
const VERDE = '#1B5E20';
const TEXTO = '#1F2937';
const TEXTO_SUAVE = '#4B5563';
const BORDE = '#E5E7EB';

const DISP_LABEL = {
    'disponible':    'Buscando empleo',
    'trabajando':    'Trabajando',
    'estudiando':    'Estudiando',
    'no_disponible': 'No disponible',
};

const fmt = (d, opts = { year: 'numeric', month: 'long' }) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-EC', opts);
};
const fmtRango = (ini, fin, actual) => {
    if (!ini) return '';
    const d1 = fmt(ini);
    if (actual) return `${d1} — actualidad`;
    if (!fin) return d1;
    return `${d1} — ${fmt(fin)}`;
};
const fmtCompleta = (d) => fmt(d, { day: '2-digit', month: 'long', year: 'numeric' });
const anyo = (d) => d ? new Date(d).getFullYear() : '';

// ────────────── Estilos ──────────────
const st = {
    overlay: {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: 16, backdropFilter: 'blur(3px)',
    },
    modal: {
        backgroundColor: '#f3f4f6', borderRadius: 12, width: '100%',
        maxWidth: 920, maxHeight: '94vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)', overflow: 'hidden',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 22px', borderBottom: `3px solid ${ROJO}`, background: 'white',
        flexShrink: 0,
    },
    headerH:   { margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXTO },
    headerSub: { margin: '2px 0 0', fontSize: '0.75rem', color: TEXTO_SUAVE },
    close: {
        background: 'none', border: 'none', cursor: 'pointer', color: TEXTO_SUAVE,
        fontSize: '1rem', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 6,
    },
    body: { flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f3f4f6' },
    footer: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 10, padding: '12px 22px', borderTop: `1px solid ${BORDE}`, background: 'white',
        flexShrink: 0, flexWrap: 'wrap',
    },
    btnPdf: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 8, border: 'none',
        background: ROJO, color: 'white',
        fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    btnWord: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 8, border: 'none',
        background: '#1d4ed8', color: 'white',
        fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    btnCerrar: {
        padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
        background: 'white', color: '#475569',
        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
    },
    // ── Hoja ──
    hoja: {
        background: 'white', maxWidth: 760, margin: '0 auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)', borderRadius: 4, overflow: 'hidden',
    },
    cabecera: {
        background: 'white', padding: '18px 26px',
        display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: `3px solid ${VERDE}`,
    },
    cabLogo: { width: 64, height: 64, objectFit: 'contain', flexShrink: 0 },
    cabTexto: { flex: 1, textAlign: 'center' },
    cabTit:   { margin: 0, fontSize: '0.9rem', fontWeight: 800, color: TEXTO, letterSpacing: 0.3 },
    cabSub:   { margin: '3px 0 0', fontSize: '0.72rem', color: TEXTO_SUAVE },
    cabCv:    { margin: '4px 0 0', fontSize: '0.74rem', fontWeight: 700, color: ROJO },

    nombre:    { margin: '18px 0 0', fontSize: '1.4rem', fontWeight: 800, color: TEXTO, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
    carrera:   { margin: '4px 0 18px', fontSize: '0.82rem', color: ROJO, textAlign: 'center', fontWeight: 600 },

    bandaSec: { background: VERDE, color: 'white', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 24px' },

    contenido: { padding: '0 24px 24px' },

    // Tabla de datos personales (con foto al lado)
    bloqueDatos: { display: 'grid', gridTemplateColumns: '1fr 110px', gap: 14, alignItems: 'start', padding: '12px 0' },
    fotoBox: {
        width: 100, height: 124, border: `1.5px solid ${ROJO}`, overflow: 'hidden',
        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700,
    },
    fotoImg: { width: '100%', height: '100%', objectFit: 'cover' },

    filaDato: {
        display: 'grid', gridTemplateColumns: '170px 1fr', gap: 10,
        padding: '6px 4px', borderBottom: `1px solid ${BORDE}`,
        fontSize: '0.78rem',
    },
    filaLbl: { fontWeight: 700, color: TEXTO },
    filaVal: { color: TEXTO_SUAVE },

    // Fila con fecha + título + sub (Formación, Cert, Proyectos)
    filaItem: { display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12, padding: '8px 4px', borderBottom: `1px solid ${BORDE}` },
    itemAnio: { fontWeight: 700, color: TEXTO_SUAVE, fontSize: '0.78rem' },
    itemTit:  { margin: 0, fontWeight: 700, color: TEXTO, fontSize: '0.82rem' },
    itemSub:  { margin: '2px 0 0', fontSize: '0.74rem', color: VERDE },

    // Experiencia: rango + cargo/empresa/desc
    filaExp:  { display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, padding: '10px 4px', borderBottom: `1px solid ${BORDE}` },
    expFecha: { fontSize: '0.74rem', fontWeight: 700, color: TEXTO_SUAVE },
    expCargo: { margin: 0, fontSize: '0.84rem', fontWeight: 700, color: TEXTO },
    expEmp:   { margin: '2px 0 0', fontSize: '0.76rem', color: VERDE },
    expDesc:  { margin: '4px 0 0', fontSize: '0.74rem', color: TEXTO, lineHeight: 1.55, textAlign: 'justify' },

    bio: { fontSize: '0.78rem', color: TEXTO, lineHeight: 1.6, padding: '10px 4px', textAlign: 'justify' },

    tesisTit:  { margin: '8px 4px 4px', fontWeight: 700, color: TEXTO, fontSize: '0.82rem', textAlign: 'justify' },
    tesisRes:  { margin: '0 4px 4px', fontSize: '0.74rem', color: TEXTO_SUAVE, lineHeight: 1.55, textAlign: 'justify' },
    tesisLink: { margin: '0 4px 8px', fontSize: '0.72rem', fontStyle: 'italic', color: ROJO },

    pie: { textAlign: 'center', fontSize: '0.66rem', color: TEXTO_SUAVE, padding: '18px 4px 6px', fontStyle: 'italic', borderTop: '1px dashed #e2e8f0', marginTop: 14 },

    avisoVacio: { background: '#fef9c3', border: '1px solid #fde047', color: '#a16207', borderRadius: 6, padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 8, margin: '12px 24px' },
    cargando: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 40, color: TEXTO_SUAVE, fontSize: '0.82rem' },
};

const Linea = ({ label, valor }) => valor ? (
    <div style={st.filaDato}>
        <span style={st.filaLbl}>{label}</span>
        <span style={st.filaVal}>{valor}</span>
    </div>
) : null;

const PreviewHojaVida = ({ token, abierto, onCerrar }) => {
    const [datos, setDatos]         = useState(null);
    const [cargando, setCargando]   = useState(false);
    const [error, setError]         = useState('');
    const [descargando, setDescargando] = useState(null);

    useEffect(() => {
        if (!abierto) return;
        setCargando(true); setError('');
        axios.get(`${API_URL}/perfil/hoja-vida/datos`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setDatos(r.data))
            .catch(e => setError(e.response?.data?.msg || 'Error al cargar los datos'))
            .finally(() => setCargando(false));
    }, [abierto, token]);

    const descargar = async (formato) => {
        setDescargando(formato);
        try {
            const url = `${API_URL}/perfil/hoja-vida/${formato}`;
            const r = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            const blob = new Blob([r.data], {
                type: formato === 'pdf'
                    ? 'application/pdf'
                    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            const cd = r.headers['content-disposition'] || '';
            const m  = cd.match(/filename="?([^";]+)"?/);
            a.download = m ? m[1] : `HojaDeVida.${formato}`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
        } catch (e) {
            alert('No se pudo descargar el archivo: ' + (e.response?.data?.msg || e.message));
        } finally {
            setDescargando(null);
        }
    };

    if (!abierto) return null;

    return (
        <div style={st.overlay} onClick={onCerrar}>
            <div style={st.modal} onClick={e => e.stopPropagation()}>
                <div style={st.header}>
                    <div>
                        <h3 style={st.headerH}>Vista previa de tu Hoja de Vida</h3>
                        <p style={st.headerSub}>Revisa los datos antes de descargar</p>
                    </div>
                    <button style={st.close} onClick={onCerrar}><FaTimes /></button>
                </div>

                <div style={st.body}>
                    {cargando && (
                        <div style={st.cargando}>
                            <FaSpinner className="spin" style={{ fontSize: '1.5rem', color: ROJO }} />
                            <span>Preparando vista previa…</span>
                        </div>
                    )}
                    {error && (
                        <div style={st.avisoVacio}>
                            <FaExclamationTriangle />{error}
                        </div>
                    )}
                    {datos && !cargando && <HojaPreview datos={datos} />}
                </div>

                <div style={st.footer}>
                    <button style={st.btnCerrar} onClick={onCerrar} disabled={!!descargando}>Cerrar</button>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button style={st.btnWord} onClick={() => descargar('docx')} disabled={!datos || !!descargando}>
                            {descargando === 'docx' ? <FaSpinner className="spin" /> : <FaFileWord />}
                            {descargando === 'docx' ? 'Generando...' : 'Descargar Word'}
                        </button>
                        <button style={st.btnPdf} onClick={() => descargar('pdf')} disabled={!datos || !!descargando}>
                            {descargando === 'pdf' ? <FaSpinner className="spin" /> : <FaFilePdf />}
                            {descargando === 'pdf' ? 'Generando...' : 'Descargar PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Sub-componente: la hoja en sí ───────────────────────────────────
const HojaPreview = ({ datos }) => {
    const { graduado, proyectos = [], certificados = [], tesis, cedulaPlain, telefonoPlain } = datos;
    const ubicacion = [graduado.cantonActual, graduado.provinciaActual].filter(Boolean).join(', ');
    const fotoUrl = graduado.fotoPerfil
        ? (graduado.fotoPerfil.startsWith('http') ? graduado.fotoPerfil : `${BASE_URL}/${graduado.fotoPerfil}`)
        : null;

    const expOrd = (graduado.experienciasLaborales || []).slice().sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
    const eduOrd = (graduado.educacionFormal || []).slice().sort((a, b) => (b.anioFin || 0) - (a.anioFin || 0));

    return (
        <div style={st.hoja}>
            {/* CABECERA blanca con logos */}
            <div style={st.cabecera}>
                <img src="/img/ESPOCH_LOGO.png" alt="ESPOCH" style={st.cabLogo} />
                <div style={st.cabTexto}>
                    <p style={st.cabTit}>ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO</p>
                    <p style={st.cabSub}>Facultad de Informática y Electrónica · Carrera de Software</p>
                    <p style={st.cabCv}>RESUMEN DE HOJA DE VIDA — CV</p>
                </div>
                <img src="/img/SOFTWARE_LOGO.png" alt="Software" style={st.cabLogo} />
            </div>

            {/* Nombre grande */}
            <p style={st.nombre}>{graduado.nombres} {graduado.apellidos}</p>
            <p style={st.carrera}>Ingeniero en Software · ESPOCH</p>

            {/* DATOS PERSONALES */}
            <div style={st.bandaSec}>Datos personales</div>
            <div style={st.contenido}>
                <div style={st.bloqueDatos}>
                    <div>
                        <Linea label="Cédula"               valor={cedulaPlain} />
                        <Linea label="Correo institucional" valor={graduado.emailInstitucional} />
                        <Linea label="Correo personal"      valor={graduado.emailPersonal} />
                        <Linea label="Teléfono"             valor={telefonoPlain} />
                        <Linea label="Fecha de nacimiento"  valor={graduado.fechaNacimiento ? fmtCompleta(graduado.fechaNacimiento) : null} />
                        <Linea label="Género"               valor={graduado.genero} />
                        <Linea label="Discapacidad"         valor={graduado.tieneDiscapacidad} />
                        <Linea label="Ubicación"            valor={ubicacion} />
                        <Linea label="Año de graduación"    valor={graduado.anioGraduacion} />
                        <Linea label="GitHub"               valor={graduado.github} />
                        <Linea label="LinkedIn"             valor={graduado.linkedin} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {fotoUrl
                            ? <img src={fotoUrl} alt="" style={{ ...st.fotoBox, ...st.fotoImg }} />
                            : <div style={st.fotoBox}>SIN FOTO</div>}
                    </div>
                </div>
            </div>

            {/* SOBRE MÍ */}
            {graduado.bio && graduado.bio.trim() && (
                <>
                    <div style={st.bandaSec}>Sobre mí</div>
                    <div style={st.contenido}>
                        <p style={st.bio}>{graduado.bio.trim()}</p>
                    </div>
                </>
            )}

            {/* FORMACIÓN */}
            {eduOrd.length > 0 && (
                <>
                    <div style={st.bandaSec}>Formación</div>
                    <div style={st.contenido}>
                        {eduOrd.map(edu => (
                            <div key={edu._id} style={st.filaItem}>
                                <span style={st.itemAnio}>{edu.anioFin || '—'}</span>
                                <div>
                                    <p style={st.itemTit}>{edu.titulo}</p>
                                    <p style={st.itemSub}>{edu.institucion} · {edu.nivel}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* EXPERIENCIA LABORAL */}
            {expOrd.length > 0 && (
                <>
                    <div style={st.bandaSec}>Experiencia laboral</div>
                    <div style={st.contenido}>
                        {expOrd.map(exp => (
                            <div key={exp._id} style={st.filaExp}>
                                <span style={st.expFecha}>{fmtRango(exp.fechaInicio, exp.fechaFin, exp.actual)}</span>
                                <div>
                                    <p style={st.expCargo}>{exp.cargo}</p>
                                    <p style={st.expEmp}>{exp.empresa}</p>
                                    {exp.descripcion && <p style={st.expDesc}>{exp.descripcion}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* CERTIFICACIONES — solo título + institución + año */}
            {certificados.length > 0 && (
                <>
                    <div style={st.bandaSec}>Certificaciones y capacitaciones</div>
                    <div style={st.contenido}>
                        {certificados.map(cert => (
                            <div key={cert._id} style={st.filaItem}>
                                <span style={st.itemAnio}>{anyo(cert.fechaFinalizacion) || '—'}</span>
                                <div>
                                    <p style={st.itemTit}>{cert.titulo}</p>
                                    {cert.institucion && <p style={st.itemSub}>{cert.institucion}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* PROYECTOS — solo título + tecnologías + año */}
            {proyectos.length > 0 && (
                <>
                    <div style={st.bandaSec}>Proyectos destacados</div>
                    <div style={st.contenido}>
                        {proyectos.map(proy => (
                            <div key={proy._id} style={st.filaItem}>
                                <span style={st.itemAnio}>{anyo(proy.fechaRealizacion) || '—'}</span>
                                <div>
                                    <p style={st.itemTit}>{proy.titulo}</p>
                                    {proy.tecnologias?.length > 0 && <p style={st.itemSub}>{proy.tecnologias.join(' · ')}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* COMPETENCIAS */}
            {((graduado.tecnologias?.length > 0) || (graduado.habilidadesBlandas?.length > 0)) && (
                <>
                    <div style={st.bandaSec}>Competencias</div>
                    <div style={st.contenido}>
                        {graduado.tecnologias?.length > 0 && (
                            <div style={st.filaDato}>
                                <span style={st.filaLbl}>Tecnologías</span>
                                <span style={st.filaVal}>{graduado.tecnologias.join(' · ')}</span>
                            </div>
                        )}
                        {graduado.habilidadesBlandas?.length > 0 && (
                            <div style={st.filaDato}>
                                <span style={st.filaLbl}>Habilidades blandas</span>
                                <span style={st.filaVal}>{graduado.habilidadesBlandas.join(' · ')}</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* TESIS — solo título + URL */}
            {tesis && (
                <>
                    <div style={st.bandaSec}>Tesis de grado</div>
                    <div style={st.contenido}>
                        <p style={st.tesisTit}>{tesis.tituloEncontrado || tesis.titulo}</p>
                        {tesis.urlDspace && <p style={st.tesisLink}>Repositorio: {tesis.urlDspace}</p>}
                    </div>
                </>
            )}

            <div style={st.contenido}>
                <p style={st.pie}>Generado por el Portal de Graduados ESPOCH · {fmtCompleta(new Date())}</p>
            </div>
        </div>
    );
};

export default PreviewHojaVida;

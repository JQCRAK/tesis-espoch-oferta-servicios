// frontend/src/components/ModalBienvenida.jsx
import React, { useState, useEffect } from 'react';
import {
    FaGraduationCap, FaCheckCircle, FaBriefcase,
    FaCertificate, FaClipboardList, FaExclamationTriangle,
    FaRegClock
} from 'react-icons/fa';
import axios from 'axios';
import { leerSesion } from '../utils/storageSeguro';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ModalBienvenida = ({ onCerrar }) => {
    const [segundos, setSegundos] = useState(10);
    const [marcando, setMarcando] = useState(false);

    useEffect(() => {
        if (segundos <= 0) return;
        const t = setTimeout(() => setSegundos(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [segundos]);

    const handleAceptar = async () => {
        setMarcando(true);
        try {
            const sesion = leerSesion('usuario');
            await axios.post(`${API_URL}/perfil/marcar-bienvenida`, {}, {
                headers: { Authorization: `Bearer ${sesion?.token}` }
            });
        } catch { /* silencioso */ }
        onCerrar();
    };

    return (
        <div style={s.overlay}>
            <div style={s.modal}>

                {/* ── Encabezado ── */}
                <div style={s.header}>
                    <img
                        src="/img/ESPOCH_LOGO.png"
                        alt="ESPOCH"
                        style={s.logo}
                        onError={e => e.target.style.display = 'none'}
                    />
                    <h2 style={s.titulo}>¡Bienvenido al Portal de Graduados!</h2>
                    <p style={s.subtitulo}>Carrera de Ingeniería de Software · ESPOCH</p>
                </div>

                {/* ── Cuerpo ── */}
                <div style={s.cuerpo}>

                    {/* Alerta plazo tesis */}
                    <div style={s.alertaPlazo}>
                        <FaExclamationTriangle style={{ color: '#d97706', fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.84rem', color: '#92400e' }}>
                                Importante — Plazo para verificar tu tesis
                            </p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#78350f', lineHeight: 1.6 }}>
                                Tienes <strong>18 meses</strong> desde hoy para verificar tu tesis en el repositorio ESPOCH.
                                Si no lo haces en ese plazo, <strong>tu cuenta será eliminada automáticamente</strong> del sistema.
                            </p>
                        </div>
                    </div>

                    {/* Pasos recomendados — grid 2×2 */}
                    <p style={{ margin: '16px 0 10px', fontWeight: 700, fontSize: '0.83rem', color: '#1e293b' }}>
                        Para aprovechar al máximo tu perfil:
                    </p>

                    <div style={s.grid}>
                        <div style={s.paso}>
                            <div style={{ ...s.pasoIco, backgroundColor: '#ede9fe' }}>
                                <FaGraduationCap style={{ color: '#7c3aed', fontSize: '1.1rem' }} />
                            </div>
                            <p style={s.pasoTitulo}>Verifica tu tesis</p>
                            <p style={s.pasoDesc}>Ve a "Publicar perfil" y pega la URL de tu tesis en el repositorio ESPOCH. El sistema la verificará automáticamente.</p>
                        </div>

                        <div style={s.paso}>
                            <div style={{ ...s.pasoIco, backgroundColor: '#dbeafe' }}>
                                <FaBriefcase style={{ color: '#1d4ed8', fontSize: '1.1rem' }} />
                            </div>
                            <p style={s.pasoTitulo}>Agrega proyectos</p>
                            <p style={s.pasoDesc}>Sube hasta 5 proyectos para que el sistema detecte tus especialidades y tecnologías automáticamente.</p>
                        </div>

                        <div style={s.paso}>
                            <div style={{ ...s.pasoIco, backgroundColor: '#fce7f3' }}>
                                <FaCertificate style={{ color: '#be185d', fontSize: '1.1rem' }} />
                            </div>
                            <p style={s.pasoTitulo}>Sube certificados</p>
                            <p style={s.pasoDesc}>Agrega certificados y talleres para enriquecer tu perfil con tecnologías y habilidades detectadas.</p>
                        </div>

                        <div style={s.paso}>
                            <div style={{ ...s.pasoIco, backgroundColor: '#dcfce7' }}>
                                <FaClipboardList style={{ color: '#15803d', fontSize: '1.1rem' }} />
                            </div>
                            <p style={s.pasoTitulo}>Participa en encuestas</p>
                            <p style={s.pasoDesc}>Con tu tesis verificada recibirás invitaciones para encuestas de seguimiento a graduados de la carrera.</p>
                        </div>
                    </div>

                    <div style={s.notaFinal}>
                        <FaCheckCircle style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#166534', lineHeight: 1.6 }}>
                            Tu perfil es <strong>privado por defecto</strong>. Solo se publicará cuando verifiques tu tesis y aceptes los términos de tratamiento de datos.
                        </p>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={s.footer}>
                    {segundos > 0 && (
                        <div style={s.contadorWrap}>
                            <FaRegClock style={{ color: '#6b7280', fontSize: '0.85rem' }} />
                            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                Lee la información antes de continuar ({segundos}s)
                            </span>
                        </div>
                    )}
                    <button
                        onClick={handleAceptar}
                        disabled={segundos > 0 || marcando}
                        style={{
                            ...s.btnAceptar,
                            ...(segundos > 0 ? s.btnAceptarDisabled : {})
                        }}
                    >
                        {marcando
                            ? 'Cargando...'
                            : segundos > 0
                                ? `Entendido (${segundos}s)`
                                : '✅ Entendido, ir a mi perfil'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

const s = {
    overlay: {
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 16,
        backdropFilter: 'blur(3px)',
    },
    modal: {
        backgroundColor: 'white', borderRadius: 16,
        width: '100%', maxWidth: 540,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
    },
    header: {
        background: 'linear-gradient(135deg, #be1e2d 0%, #7c1525 100%)',
        padding: '22px 24px 18px',
        textAlign: 'center',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    },
    logo: {
        height: 48, objectFit: 'contain',
        filter: 'brightness(0) invert(1)', // fuerza blanco sobre fondo rojo
        marginBottom: 4,
    },
    titulo: { margin: 0, fontSize: '1.12rem', fontWeight: 800, color: 'white' },
    subtitulo: { margin: 0, fontSize: '0.76rem', color: 'rgba(255,255,255,0.82)' },
    cuerpo: {
        flex: 1, overflowY: 'auto', padding: '18px 22px',
        scrollbarWidth: 'thin',
    },
    alertaPlazo: {
        display: 'flex', alignItems: 'flex-start', gap: 10,
        backgroundColor: '#fffbeb', border: '1px solid #fde68a',
        borderLeft: '4px solid #d97706',
        borderRadius: 8, padding: '12px 14px',
    },
    // Grid 2×2 para los pasos
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
    },
    paso: {
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#f8fafc', borderRadius: 10,
        padding: '14px 14px', border: '1px solid #e2e8f0',
    },
    pasoIco: {
        width: 40, height: 40, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    pasoTitulo: { margin: 0, fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' },
    pasoDesc: { margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.55 },
    notaFinal: {
        display: 'flex', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
        borderRadius: 8, padding: '10px 12px', marginTop: 14,
    },
    footer: {
        padding: '14px 22px 18px',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#f8fafc',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    },
    contadorWrap: {
        display: 'flex', alignItems: 'center', gap: 6,
    },
    btnAceptar: {
        width: '100%', padding: '12px',
        backgroundColor: '#be1e2d', color: 'white',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        fontWeight: 700, fontSize: '0.9rem',
        transition: 'background-color 0.2s',
    },
    btnAceptarDisabled: {
        backgroundColor: '#9ca3af', cursor: 'not-allowed',
    },
};

export default ModalBienvenida;
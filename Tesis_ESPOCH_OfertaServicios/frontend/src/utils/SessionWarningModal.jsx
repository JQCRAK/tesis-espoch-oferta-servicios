import { useEffect, useState } from 'react';

const SessionWarningModal = ({ visible, secondsLeft, onExtend, onLogout }) => {
    const [countdown, setCountdown] = useState(secondsLeft);

    useEffect(() => {
        if (!visible) return;
        setCountdown(secondsLeft);

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [visible, secondsLeft]);

    if (!visible) return null;

    const countColor = countdown <= 10 ? '#dc2626' : '#e67e22';

    return (
        <div style={m.overlay}>
            <div style={m.modal}>

                {/* Icono */}
                <div style={m.iconWrap}>
                    <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>⏱️</span>
                </div>

                <h2 style={m.title}>¿Sigues ahí?</h2>

                <p style={m.msg}>
                    Tu sesión se cerrará automáticamente por inactividad en:
                </p>

                {/* Cuenta regresiva */}
                <div style={{ ...m.countdown, color: countColor }}>
                    {countdown}s
                </div>

                <p style={m.sub}>
                    Cualquier trabajo no guardado podría perderse.
                </p>

                {/* Botones */}
                <div style={m.btnRow}>
                    <button style={m.btnExtend} onClick={onExtend}>
                        Continuar sesión
                    </button>
                    <button style={m.btnLogout} onClick={onLogout}>
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

const m = {
    overlay: {
        position:        'fixed',
        inset:           0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          9999,
        backdropFilter:  'blur(2px)',
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius:    '16px',
        padding:         '2rem 2.5rem',
        maxWidth:        '400px',
        width:           '90%',
        textAlign:       'center',
        boxShadow:       '0 24px 64px rgba(0,0,0,0.25)',
    },
    iconWrap:  { marginBottom: '0.75rem' },
    title: {
        fontSize:   '1.35rem',
        fontWeight: '800',
        color:      '#1a1a2e',
        margin:     '0 0 0.5rem',
    },
    msg: {
        color:        '#555',
        fontSize:     '0.9rem',
        marginBottom: '0.25rem',
        lineHeight:   1.5,
    },
    countdown: {
        fontSize:   '3.5rem',
        fontWeight: '900',
        margin:     '0.5rem 0',
        transition: 'color 0.3s',
    },
    sub: {
        color:        '#999',
        fontSize:     '0.8rem',
        marginBottom: '1.5rem',
    },
    btnRow: {
        display:        'flex',
        gap:            '0.85rem',
        justifyContent: 'center',
    },
    btnExtend: {
        backgroundColor: '#be1e2d',   
        color:           '#fff',
        border:          'none',
        borderRadius:    '8px',
        padding:         '0.65rem 1.4rem',
        fontWeight:      '700',
        fontSize:        '0.9rem',
        cursor:          'pointer',
    },
    btnLogout: {
        backgroundColor: 'transparent',
        color:           '#be1e2d',
        border:          '2px solid #be1e2d',
        borderRadius:    '8px',
        padding:         '0.65rem 1.4rem',
        fontWeight:      '700',
        fontSize:        '0.9rem',
        cursor:          'pointer',
    },
};

export default SessionWarningModal;
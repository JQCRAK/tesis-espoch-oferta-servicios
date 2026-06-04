// frontend/src/utils/useInactivityTimeout.js
import { useEffect, useRef, useCallback } from 'react';

const useInactivityTimeout = ({
    timeoutMs = 15 * 60 * 1000,
    warningMs = 30 * 1000,
    onWarning,
    onLogout,
}) => {
    const timeoutRef         = useRef(null);
    const warningRef         = useRef(null);
    const isWarningActiveRef = useRef(false);

    const clearTimers = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
    }, []);

    const startTimers = useCallback(() => {
        clearTimers();
        isWarningActiveRef.current = false;

        warningRef.current = setTimeout(() => {
            isWarningActiveRef.current = true;
            onWarning?.();
        }, timeoutMs - warningMs);

        timeoutRef.current = setTimeout(() => {
            onLogout?.();
        }, timeoutMs);
    }, [timeoutMs, warningMs, onWarning, onLogout, clearTimers]);

    const handleActivity = useCallback(() => {
        if (!isWarningActiveRef.current) {
            startTimers();
        }
    }, [startTimers]);

    useEffect(() => {
        const handleOffline = () => {
            clearTimers();
            onLogout?.();
        };

        window.addEventListener('offline', handleOffline);
        return () => window.removeEventListener('offline', handleOffline);
    }, [onLogout, clearTimers]);
    // ────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
        startTimers();

        return () => {
            clearTimers();
            EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
        };
    }, [handleActivity, startTimers, clearTimers]);

    const extendSession = useCallback(() => {
        isWarningActiveRef.current = false;
        startTimers();
    }, [startTimers]);

    return { extendSession };
};

export default useInactivityTimeout;
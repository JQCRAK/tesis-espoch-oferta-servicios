import CryptoJS from 'crypto-js';

const CLAVE = 'ESPOCH_PORTAL_GRADUADOS_2025_AES_KEY';

/**
 * Guarda un objeto cifrado en localStorage.
 * @param {string} key   - nombre de la clave en localStorage
 * @param {object} valor - objeto JavaScript a cifrar y guardar
 */
export const guardarSesion = (key, valor) => {
    const texto   = JSON.stringify(valor);
    const cifrado = CryptoJS.AES.encrypt(texto, CLAVE).toString();
    localStorage.setItem(key, cifrado);
};

/**
 * Lee y descifra un objeto desde localStorage.
 * Devuelve null si no existe o si el valor está corrupto.
 * @param {string} key - nombre de la clave en localStorage
 * @returns {object|null}
 */
export const leerSesion = (key) => {
    const cifrado = localStorage.getItem(key);
    if (!cifrado) return null;
    try {
        const bytes  = CryptoJS.AES.decrypt(cifrado, CLAVE);
        const texto  = bytes.toString(CryptoJS.enc.Utf8);
        if (!texto) return null;
        return JSON.parse(texto);
    } catch {
        // Si está corrupto o manipulado, lo eliminamos por seguridad
        localStorage.removeItem(key);
        return null;
    }
};

/**
 * Elimina la sesión del localStorage.
 * @param {string} key - nombre de la clave en localStorage
 */
export const eliminarSesion = (key) => {
    localStorage.removeItem(key);
};
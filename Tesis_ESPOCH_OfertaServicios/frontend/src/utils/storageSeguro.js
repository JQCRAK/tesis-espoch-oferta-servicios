import CryptoJS from 'crypto-js';

const CLAVE = 'ESPOCH_PORTAL_GRADUADOS_2025_AES_KEY';


export const guardarSesion = (key, valor) => {
    const texto   = JSON.stringify(valor);
    const cifrado = CryptoJS.AES.encrypt(texto, CLAVE).toString();
    localStorage.setItem(key, cifrado);
};

export const leerSesion = (key) => {
    const cifrado = localStorage.getItem(key);
    if (!cifrado) return null;
    try {
        const bytes  = CryptoJS.AES.decrypt(cifrado, CLAVE);
        const texto  = bytes.toString(CryptoJS.enc.Utf8);
        if (!texto) return null;
        return JSON.parse(texto);
    } catch {
        localStorage.removeItem(key);
        return null;
    }
};


export const eliminarSesion = (key) => {
    localStorage.removeItem(key);
};
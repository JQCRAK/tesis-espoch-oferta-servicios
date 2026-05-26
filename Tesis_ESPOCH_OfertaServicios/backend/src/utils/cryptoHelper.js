const crypto = require('crypto');

const ALGORITHM  = 'aes-256-cbc';
const SECRET_KEY = process.env.CRYPTO_SECRET; 
const IV_LENGTH  = 16;

if (!SECRET_KEY || SECRET_KEY.length !== 32) {
    throw new Error('CRYPTO_SECRET debe tener exactamente 32 caracteres en el .env');
}

/**
 * Encripta un texto plano.
 * Devuelve "iv:textoEncriptado" en hex.
 */
const encriptar = (texto) => {
    const iv        = crypto.randomBytes(IV_LENGTH);
    const cipher    = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(String(texto)), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Desencripta un texto que tenga el formato "iv:textoEncriptado".
 * Devuelve el valor original en texto plano.
 */
const desencriptar = (textoEncriptado) => {
    const [ivHex, encHex] = textoEncriptado.split(':');
    const iv        = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher  = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
};

/**
 * Hash SHA-256 del valor normalizado.
 * Se usa para buscar duplicados sin desencriptar toda la colección.
 */
const hashParaBusqueda = (valor) =>
    crypto.createHash('sha256').update(String(valor).trim().toLowerCase()).digest('hex');

module.exports = { encriptar, desencriptar, hashParaBusqueda };
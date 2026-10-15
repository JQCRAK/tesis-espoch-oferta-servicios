const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protegerRuta = async (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Acceso denegado. No hay token.' });
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
    } catch (err) {
        return res.status(401).json({ msg: 'Token inválido o expirado.' });
    }

    // Un administrador eliminado pierde el acceso aunque su token siga vigente
    if (decoded.rol === 'admin') {
        try {
            if (!await Admin.exists({ _id: decoded.id }))
                return res.status(401).json({ msg: 'La cuenta de administrador ya no existe.' });
        } catch (err) {
            return res.status(500).json({ msg: 'Error al validar la sesión.' });
        }
    }

    req.usuario = decoded;
    next();
};

const soloRol = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({
                msg: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`
            });
        }
        next();
    };
};

module.exports = { protegerRuta, soloRol };
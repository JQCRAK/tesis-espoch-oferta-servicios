const jwt = require('jsonwebtoken');

const protegerRuta = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Acceso denegado. No hay token.' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Token inválido o expirado.' });
    }
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
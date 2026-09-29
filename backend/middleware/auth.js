const jwt = require('jsonwebtoken');


function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado, falta el token' });
  }

  const token = authHeader.split(' ')[1]; 

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datos; 
    next(); 
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}


function verificarAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'No tenés permisos de administrador' });
  }
  next();
}

module.exports = { verificarToken, verificarAdmin };
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');


router.post('/registro', async (req, res) => {
  try {
    const { nombre, apellido, dni, email, password, aceptaTerminos } = req.body;

    if (!nombre || !apellido || !dni || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    
    const dniLimpio = String(dni).trim();
    if (!/^\d{7,8}$/.test(dniLimpio)) {
      return res.status(400).json({ error: 'El DNI debe tener 7 u 8 números, sin puntos' });
    }

    
    if (aceptaTerminos !== true) {
      return res.status(400).json({ error: 'Tienes que aceptar el uso de tus datos para registrarte' });
    }

    const [existentesEmail] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existentesEmail.length > 0) {
      return res.status(400).json({ error: 'Ese email ya está registrado' });
    }

    const [existentesDni] = await db.query('SELECT id FROM usuarios WHERE dni = ?', [dniLimpio]);
    if (existentesDni.length > 0) {
      return res.status(400).json({ error: 'Ese DNI ya está registrado' });
    }

    
    const passwordHasheada = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, apellido, dni, email, password, consentimiento_fecha) VALUES (?, ?, ?, ?, ?, NOW())',
      [nombre, apellido, dniLimpio, email, passwordHasheada]
    );

    res.status(201).json({ id: result.insertId, mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (usuarios.length === 0) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos' });
    }

    const usuario = usuarios[0];

    
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos' });
    }

    
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

module.exports = router;
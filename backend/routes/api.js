const { verificarToken, verificarAdmin } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { prepararBaseDeDatos } = require('../config/migraciones');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + '-' + file.originalname;
    cb(null, nombreUnico);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});


router.get('/categorias', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categorias');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});


router.get('/reportes', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.descripcion, r.foto_url, r.direccion, r.estado, r.fecha_creacion,
             r.latitud, r.longitud,
             c.nombre AS categoria
      FROM reportes r
      JOIN categorias c ON r.categoria_id = c.id
      ORDER BY r.fecha_creacion DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});


router.post('/reportes', verificarToken, (req, res, next) => {
  upload.single('foto')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La foto no puede pesar más de 5MB' });
      }
      return res.status(400).json({ error: 'Error al subir la foto' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { usuario_id, categoria_id, descripcion, direccion, latitud, longitud } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'La foto es obligatoria' });
    }

    const foto_url = `/uploads/${req.file.filename}`;

    const [result] = await db.query(
      'INSERT INTO reportes (usuario_id, categoria_id, descripcion, foto_url, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, categoria_id, descripcion, foto_url, direccion, latitud || null, longitud || null]
    );

    res.status(201).json({ id: result.insertId, mensaje: 'Reporte creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el reporte' });
  }
});


router.get('/mis-reportes', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.descripcion, r.foto_url, r.direccion, r.estado, r.fecha_creacion,
             r.latitud, r.longitud,
             c.nombre AS categoria
      FROM reportes r
      JOIN categorias c ON r.categoria_id = c.id
      WHERE r.usuario_id = ?
      ORDER BY r.fecha_creacion DESC
    `, [req.usuario.id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tus reportes' });
  }
});


router.put('/reportes/:id/estado', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await prepararBaseDeDatos();
    const estadosValidos = ['pendiente', 'en_proceso', 'resuelto'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    await db.query(
      `UPDATE reportes
       SET estado = ?,
           fecha_resolucion = CASE
             WHEN ? = 'resuelto' THEN COALESCE(fecha_resolucion, NOW())
             ELSE NULL
           END
       WHERE id = ?`,
      [estado, estado, id]
    );

    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

router.delete('/reportes/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM reportes WHERE id = ?', [id]);
    res.json({ mensaje: 'Reporte eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el reporte' });
  }
});

router.get('/admin/reportes', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await prepararBaseDeDatos();
    const [rows] = await db.query(`
      SELECT r.id, r.descripcion, r.foto_url, r.direccion, r.estado, r.fecha_creacion,
             r.fecha_resolucion, r.latitud, r.longitud,
             c.nombre AS categoria,
             u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.dni AS usuario_dni
      FROM reportes r
      JOIN categorias c ON r.categoria_id = c.id
      JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY r.fecha_creacion DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

module.exports = router;
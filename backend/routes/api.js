const { verificarToken, verificarAdmin } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { prepararBaseDeDatos } = require('../config/migraciones');
const { registrarHistorial } = require('../config/historial');
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


const TEXTO_ESTADO = { pendiente: 'Pendiente', en_proceso: 'En proceso', resuelto: 'Resuelto' };

router.put('/reportes/:id/estado', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await prepararBaseDeDatos();
    const estadosValidos = ['pendiente', 'en_proceso', 'resuelto'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const [previos] = await db.query('SELECT estado FROM reportes WHERE id = ?', [id]);
    if (previos.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
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

    if (previos[0].estado !== estado) {
      await registrarHistorial([{
        reporteId: id,
        usuario: req.usuario.nombre,
        accion: 'estado',
        detalle: `${TEXTO_ESTADO[previos[0].estado] || previos[0].estado} → ${TEXTO_ESTADO[estado]}`,
      }]);
    }

    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

router.put('/reportes/:id/gestion', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await prepararBaseDeDatos();
    const { id } = req.params;
    const responsable = String(req.body.responsable || '').trim().slice(0, 100);
    const notas = String(req.body.notas_internas || '').trim().slice(0, 2000);

    const [previos] = await db.query('SELECT responsable, notas_internas FROM reportes WHERE id = ?', [id]);
    if (previos.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    await db.query(
      'UPDATE reportes SET responsable = ?, notas_internas = ? WHERE id = ?',
      [responsable || null, notas || null, id]
    );

    const entradas = [];
    if ((previos[0].responsable || '') !== responsable) {
      entradas.push({
        reporteId: id,
        usuario: req.usuario.nombre,
        accion: 'responsable',
        detalle: responsable ? `Responsable: ${responsable}` : 'Se quitó el responsable',
      });
    }
    if ((previos[0].notas_internas || '') !== notas) {
      entradas.push({ reporteId: id, usuario: req.usuario.nombre, accion: 'notas', detalle: 'Actualizó las notas internas' });
    }
    await registrarHistorial(entradas);

    res.json({ mensaje: 'Gestión actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar los datos de gestión' });
  }
});

router.put('/reportes-lote', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await prepararBaseDeDatos();
    const ids = Array.isArray(req.body.ids)
      ? [...new Set(req.body.ids.map(Number).filter(Number.isInteger))].slice(0, 500)
      : [];
    const { estado } = req.body;
    const responsable = typeof req.body.responsable === 'string'
      ? req.body.responsable.trim().slice(0, 100)
      : null;

    if (ids.length === 0) {
      return res.status(400).json({ error: 'No se eligió ningún reporte' });
    }
    if (estado === undefined && responsable === null) {
      return res.status(400).json({ error: 'No se indicó ningún cambio' });
    }
    if (estado !== undefined && !TEXTO_ESTADO[estado]) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const [previos] = await db.query('SELECT id, estado, responsable FROM reportes WHERE id IN (?)', [ids]);
    const entradas = [];

    if (estado !== undefined) {
      await db.query(
        `UPDATE reportes
         SET estado = ?,
             fecha_resolucion = CASE
               WHEN ? = 'resuelto' THEN COALESCE(fecha_resolucion, NOW())
               ELSE NULL
             END
         WHERE id IN (?)`,
        [estado, estado, ids]
      );
      previos.filter((r) => r.estado !== estado).forEach((r) => entradas.push({
        reporteId: r.id,
        usuario: req.usuario.nombre,
        accion: 'estado',
        detalle: `${TEXTO_ESTADO[r.estado] || r.estado} → ${TEXTO_ESTADO[estado]}`,
      }));
    }

    if (responsable !== null) {
      await db.query('UPDATE reportes SET responsable = ? WHERE id IN (?)', [responsable || null, ids]);
      previos.filter((r) => (r.responsable || '') !== responsable).forEach((r) => entradas.push({
        reporteId: r.id,
        usuario: req.usuario.nombre,
        accion: 'responsable',
        detalle: responsable ? `Responsable: ${responsable}` : 'Se quitó el responsable',
      }));
    }

    await registrarHistorial(entradas);

    res.json({ mensaje: 'Reportes actualizados correctamente', cantidad: previos.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar los reportes' });
  }
});

router.get('/admin/reportes/:id/historial', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await prepararBaseDeDatos();
    const [rows] = await db.query(
      `SELECT id, usuario_nombre, accion, detalle, fecha
       FROM historial_reportes
       WHERE reporte_id = ?
       ORDER BY fecha DESC, id DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el historial' });
  }
});

router.delete('/reportes/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM reportes WHERE id = ?', [id]);
    await db.query('DELETE FROM historial_reportes WHERE reporte_id = ?', [id]).catch(() => {});
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
             r.fecha_resolucion, r.responsable, r.notas_internas, r.latitud, r.longitud,
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
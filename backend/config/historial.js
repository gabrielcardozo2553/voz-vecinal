const db = require('./db');

async function registrarHistorial(entradas) {
  if (!entradas.length) return;
  const filas = entradas.map((e) => [e.reporteId, e.usuario || null, e.accion, e.detalle || null]);
  try {
    await db.query(
      'INSERT INTO historial_reportes (reporte_id, usuario_nombre, accion, detalle) VALUES ?',
      [filas]
    );
  } catch (error) {
    console.error('No se pudo guardar el historial:', error.message);
  }
}

module.exports = { registrarHistorial };

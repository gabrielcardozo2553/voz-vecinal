const db = require('./db');

let preparada = null;

async function agregarColumnaSiFalta(tabla, columna, definicion) {
  const [existe] = await db.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tabla, columna]
  );
  if (existe.length === 0) {
    await db.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
    console.log(`Se agregó la columna ${tabla}.${columna}`);
  }
}

function describirError(error) {
  const interno = error.errors && error.errors[0];
  return error.message || error.code || (interno && (interno.message || interno.code)) || String(error);
}

function prepararBaseDeDatos() {
  if (!preparada) {
    preparada = (async () => {
      await agregarColumnaSiFalta('reportes', 'fecha_resolucion', 'DATETIME NULL');
      await agregarColumnaSiFalta('reportes', 'responsable', 'VARCHAR(100) NULL');
      await agregarColumnaSiFalta('reportes', 'notas_internas', 'TEXT NULL');
      await agregarColumnaSiFalta('reportes', 'categoria_otro', 'VARCHAR(100) NULL');
      await db.query(`
        INSERT INTO categorias (nombre)
        SELECT 'Otros' FROM DUAL
        WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Otros')
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS mensajes_reporte (
          id INT AUTO_INCREMENT PRIMARY KEY,
          reporte_id INT NOT NULL,
          autor VARCHAR(10) NOT NULL,
          autor_nombre VARCHAR(100) NULL,
          texto TEXT NOT NULL,
          fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_mensajes_reporte (reporte_id)
        )
      `);
      await agregarColumnaSiFalta('mensajes_reporte', 'foto_url', 'VARCHAR(255) NULL');
      await db.query(`
        CREATE TABLE IF NOT EXISTS historial_reportes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          reporte_id INT NOT NULL,
          usuario_nombre VARCHAR(100) NULL,
          accion VARCHAR(30) NOT NULL,
          detalle VARCHAR(255) NULL,
          fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_historial_reporte (reporte_id)
        )
      `);
    })().catch((error) => {
      preparada = null;
      console.error('No se pudo preparar la base de datos:', describirError(error));
      throw error;
    });
  }
  return preparada;
}

module.exports = { prepararBaseDeDatos };

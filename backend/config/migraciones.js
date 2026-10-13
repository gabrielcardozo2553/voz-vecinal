const db = require('./db');

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

async function prepararBaseDeDatos() {
  await agregarColumnaSiFalta('reportes', 'fecha_resolucion', 'DATETIME NULL');
}

module.exports = { prepararBaseDeDatos };

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
    })().catch((error) => {
      preparada = null;
      console.error('No se pudo preparar la base de datos:', describirError(error));
      throw error;
    });
  }
  return preparada;
}

module.exports = { prepararBaseDeDatos };

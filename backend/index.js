require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth'); 
const { prepararBaseDeDatos } = require('./config/migraciones');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);   
app.use('/uploads', express.static('uploads'));  

app.get('/', (req, res) => {
  res.send('API de Reportes Vecinales funcionando');
});

const PORT = process.env.PORT || 2000;
prepararBaseDeDatos()
  .catch((error) => console.error('No se pudo preparar la base de datos:', error.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  });

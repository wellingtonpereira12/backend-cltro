const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes'); // Importe apenas as rotas de autenticação

const app = express();

require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());
app.use('/api/auth',authRoutes);


// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

module.exports = app;



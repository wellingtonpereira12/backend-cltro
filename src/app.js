const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const accountRoutes = require('./routes/accountRoutes.js');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', accountRoutes);

module.exports = app;

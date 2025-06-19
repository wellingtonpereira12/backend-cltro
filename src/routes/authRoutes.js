const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para registro de nova conta
router.post('/register', authController.register);

// Rota para autenticação
router.post('/login', authController.login);

// Rota para obter dados do usuário autenticado
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
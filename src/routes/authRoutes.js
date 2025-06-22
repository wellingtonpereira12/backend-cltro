const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas (requerem autenticação)
router.post('/computaVoto', authMiddleware, authController.computaVoto);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
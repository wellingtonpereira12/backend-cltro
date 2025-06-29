const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const PaymentController = require('../controllers/paymentController');
const { receiveNotification } = require('../controllers/webhookController');
const validateSignature = require('../middlewares/validateSignature');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/webhook', validateSignature, receiveNotification);


// Rotas protegidas (requerem autenticação)
router.post('/computaVoto', authMiddleware, authController.computaVoto);
router.get('/me', authMiddleware, authController.getMe);
router.post('/pagamento-direto', authMiddleware, PaymentController.criarPagamentoDireto);

module.exports = router;
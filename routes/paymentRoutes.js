// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Criar uma sessão de checkout do Stripe
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Verificar o status de um pagamento
router.get('/status/:sessionId', paymentController.checkPaymentStatus);

// Adicionar um produto (para testes)
router.post('/add-product', paymentController.addProduct);

// Listar produtos disponíveis
router.get('/products', paymentController.listProducts);

module.exports = router;
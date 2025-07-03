// routes/nativePaymentRoutes.js
const express = require('express');
const router = express.Router();
const nativePaymentController = require('../controllers/nativePaymentController');

router.post('/create-payment-intent', nativePaymentController.createPaymentIntent);
router.post('/confirm-payment-intent', nativePaymentController.confirmPaymentIntent);

module.exports = router;
// routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Handle Stripe webhook events
// Note: The raw body parsing middleware is applied in server.js
router.post('/webhook', webhookController.handleWebhook);

module.exports = router;
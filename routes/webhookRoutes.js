// routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Webhook para eventos do Stripe
 *     tags: [Webhooks]
 *     description: Endpoint para receber eventos do Stripe via webhook
 *     security: []
 *     requestBody:
 *       description: Corpo do evento enviado pelo Stripe
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Evento processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Assinatura de webhook inválida ou erro de processamento
 *       500:
 *         description: Erro no servidor ao processar o evento
 */
router.post('/webhook', webhookController.handleWebhook);

module.exports = router;
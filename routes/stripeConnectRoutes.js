// routes/stripeConnectRoutes.js
const express = require('express');
const router = express.Router();
const stripeConnectController = require('../controllers/stripeConnectController');

/**
 * @swagger
 * /api/stripe/connect/create-account:
 *   post:
 *     summary: Criar uma nova conta Stripe Connect
 *     tags: [Stripe Connect]
 *     description: Cria uma nova conta Stripe Connect para um vendedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StripeConnectAccount'
 *     responses:
 *       200:
 *         description: Conta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accountId:
 *                   type: string
 *                   example: acct_123456789
 *                 onboardingUrl:
 *                   type: string
 *                   example: https://connect.stripe.com/setup/s/abc123
 *                 status:
 *                   type: object
 *                   properties:
 *                     charges_enabled:
 *                       type: boolean
 *                     details_submitted:
 *                       type: boolean
 *                     payouts_enabled:
 *                       type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/create-account', stripeConnectController.createConnectAccount);

/**
 * @swagger
 * /api/stripe/connect/status/{stripeAccountId}:
 *   get:
 *     summary: Obter o status da conta Stripe Connect
 *     tags: [Stripe Connect]
 *     description: Recupera o status atual de uma conta Stripe Connect
 *     parameters:
 *       - in: path
 *         name: stripeAccountId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta Stripe (começa com acct_)
 *     responses:
 *       200:
 *         description: Status da conta recuperado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accountId:
 *                   type: string
 *                   example: acct_123456789
 *                 status:
 *                   type: object
 *                   properties:
 *                     charges_enabled:
 *                       type: boolean
 *                     details_submitted:
 *                       type: boolean
 *                     payouts_enabled:
 *                       type: boolean
 *                     requirements:
 *                       type: object
 *                 account_type:
 *                   type: string
 *                   example: standard
 *                 business_type:
 *                   type: string
 *                   example: individual
 *                 email:
 *                   type: string
 *                   format: email
 *                 country:
 *                   type: string
 *                   example: BR
 *                 created:
 *                   type: string
 *                   format: date-time
 *                 canReceivePayments:
 *                   type: boolean
 *                 dashboardUrl:
 *                   type: string
 *                   example: https://dashboard.stripe.com/account
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Conta não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Conta Stripe não encontrada
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/status/:stripeAccountId', stripeConnectController.getAccountStatus);

/**
 * @swagger
 * /api/stripe/connect/refresh-onboarding/{uid}:
 *   post:
 *     summary: Gerar um novo link de onboarding
 *     tags: [Stripe Connect]
 *     description: Gera um novo link de onboarding para usuários que não completaram o processo
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário no sistema
 *     responses:
 *       200:
 *         description: Novo link de onboarding gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accountId:
 *                   type: string
 *                   example: acct_123456789
 *                 onboardingUrl:
 *                   type: string
 *                   example: https://connect.stripe.com/setup/s/abc123
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found or no Stripe account connected
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/refresh-onboarding/:uid', stripeConnectController.refreshOnboardingLink);

module.exports = router;
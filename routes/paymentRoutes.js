// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * /api/payments/create-checkout-session:
 *   post:
 *     summary: Criar uma sessão de checkout do Stripe
 *     tags: [Pagamentos]
 *     description: Cria uma nova sessão de checkout do Stripe para processamento de pagamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutSession'
 *     responses:
 *       200:
 *         description: Sessão de checkout criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sessionId:
 *                   type: string
 *                   example: cs_test_a1b2c3d4e5f6g7h8i9j0
 *                 checkoutUrl:
 *                   type: string
 *                   example: https://checkout.stripe.com/pay/cs_test_a1b2c3
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/create-checkout-session', paymentController.createCheckoutSession);

/**
 * @swagger
 * /api/payments/status/{sessionId}:
 *   get:
 *     summary: Verificar o status de um pagamento
 *     tags: [Pagamentos]
 *     description: Recupera o status atual de uma sessão de pagamento
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da sessão de checkout do Stripe
 *     responses:
 *       200:
 *         description: Status do pagamento recuperado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sessionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: paid
 *                 amountTotal:
 *                   type: integer
 *                   example: 9900
 *                 currency:
 *                   type: string
 *                   example: brl
 *                 customer:
 *                   type: string
 *                 paymentIntent:
 *                   type: string
 *                 metadata:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/status/:sessionId', paymentController.checkPaymentStatus);

/**
 * @swagger
 * /api/payments/add-product:
 *   post:
 *     summary: Adicionar um produto
 *     tags: [Produtos]
 *     description: Adiciona um novo produto (para testes)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Produto Premium"
 *               description:
 *                 type: string
 *                 example: "Um produto de alta qualidade"
 *               price:
 *                 type: number
 *                 example: 99.00
 *                 description: "Preço em reais"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://exemplo.com/imagem.jpg"]
 *     responses:
 *       200:
 *         description: Produto adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/add-product', paymentController.addProduct);

/**
 * @swagger
 * /api/payments/products:
 *   get:
 *     summary: Listar produtos disponíveis
 *     tags: [Produtos]
 *     description: Recupera a lista de todos os produtos disponíveis
 *     responses:
 *       200:
 *         description: Lista de produtos recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/products', paymentController.listProducts);

module.exports = router;
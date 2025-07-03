// routes/paymentRoutes.js - Rotas atualizadas com Payment Intent
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * /create-payment-intent:
 *   post:
 *     summary: Criar Payment Intent para pagamento integrado
 *     description: Cria um Payment Intent para processar pagamentos diretamente no app, repassando a taxa de plataforma e o valor ao vendedor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - stripeAccountId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID do produto a ser comprado
 *               stripeAccountId:
 *                 type: string
 *                 description: ID da conta Stripe Connect do vendedor
 *               quantity:
 *                 type: integer
 *                 default: 1
 *               customerInfo:
 *                 type: object
 *                 description: Informações do cliente (opcional)
 *     responses:
 *       200:
 *         description: Payment Intent criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 clientSecret:
 *                   type: string
 *                 paymentIntentId:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *                 fees:
 *                   type: object
 *                   properties:
 *                     platformFeeAmount:
 *                       type: integer
 *                     sellerAmount:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Produto ou conta Stripe não encontrada
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/create-payment-intent', paymentController.createPaymentIntent);

/**
 * @swagger
 * /confirm-payment:
 *   post:
 *     summary: Confirmar pagamento
 *     description: Confirma o pagamento de um Payment Intent após o cliente inserir os dados do cartão.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *               - paymentMethodId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 description: ID do Payment Intent
 *               paymentMethodId:
 *                 type: string
 *                 description: ID do método de pagamento (cartão)
 *     responses:
 *       200:
 *         description: Pagamento confirmado ou ação adicional necessária
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentIntentId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 requiresAction:
 *                   type: boolean
 *                 clientSecret:
 *                   type: string
 *                 nextAction:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/confirm-payment', paymentController.confirmPayment);

/**
 * @swagger
 * /payment-intent/{paymentIntentId}/status:
 *   get:
 *     summary: Verificar status do Payment Intent
 *     description: Retorna o status de um pagamento via Payment Intent.
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do Payment Intent
 *     responses:
 *       200:
 *         description: Status do Payment Intent retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentIntentId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 amount:
 *                   type: integer
 *                 currency:
 *                   type: string
 *                 paymentMethod:
 *                   type: string
 *                 metadata:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Payment Intent não encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/payment-intent/:paymentIntentId/status', paymentController.checkPaymentStatus);

// === ENDPOINTS EXISTENTES (para compatibilidade) ===

/**
 * @swagger
 * /create-checkout-session:
 *   post:
 *     summary: Criar sessão de checkout do Stripe
 *     description: Cria uma sessão de checkout do Stripe para processar pagamentos via página externa.
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
 *                 sessionId:
 *                   type: string
 *                 checkoutUrl:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Produto ou conta Stripe não encontrada
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/create-checkout-session', paymentController.createCheckoutSession);

/**
 * @swagger
 * /status/{sessionId}:
 *   get:
 *     summary: Verificar status do pagamento via sessão
 *     description: Retorna o status de um pagamento realizado via sessão de checkout do Stripe.
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sessão de checkout
 *     responses:
 *       200:
 *         description: Status da sessão retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 amountTotal:
 *                   type: integer
 *                 currency:
 *                   type: string
 *                 customer:
 *                   type: string
 *                 paymentIntent:
 *                   type: string
 *                 metadata:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Sessão não encontrada
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/status/:sessionId', paymentController.checkPaymentStatus);

// === ENDPOINTS DE PRODUTOS ===

/**
 * @swagger
 * /add-product:
 *   post:
 *     summary: Adicionar produto
 *     description: Adiciona um novo produto para testes.
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 description: Preço em reais (será convertido para centavos)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
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
 * /products:
 *   get:
 *     summary: Listar produtos disponíveis
 *     description: Retorna a lista de produtos disponíveis para compra.
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/products', paymentController.listProducts);

module.exports = router;
// config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Pagamentos Stripe Connect',
      version: '1.0.0',
      description: 'API para gerenciamento de contas e pagamentos via Stripe Connect',
      contact: {
        name: 'Suporte',
        email: 'suporte@seuapp.com',
      },
    },
    servers: [
      {
        url: config.appUrl,
        description: 'Servidor de desenvolvimento',
      },
      {
        url: config.frontendUrl,
        description: 'Servidor frontend',
      },
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'integer', description: 'Preço em centavos' },
            images: { type: 'array', items: { type: 'string' } }
          },
        },
        CheckoutSession: {
          type: 'object',
          required: ['productId', 'stripeAccountId'],
          properties: {
            productId: { type: 'string' },
            stripeAccountId: { type: 'string', description: 'ID da conta Stripe Connect do vendedor' },
            quantity: { type: 'integer', default: 1 },
            successUrl: { type: 'string' },
            cancelUrl: { type: 'string' },
          },
        },
        StripeConnectAccount: {
          type: 'object',
          required: ['email', 'uid'],
          properties: {
            email: { type: 'string', format: 'email' },
            country: { type: 'string', default: 'BR' },
            business_type: { type: 'string', enum: ['individual', 'company'], default: 'individual' },
            uid: { type: 'string', description: 'ID do usuário no sistema' },
            name: { type: 'string' },
            phone: { type: 'string' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Requisição inválida',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Parâmetros inválidos' },
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Erro no servidor',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Erro interno no servidor' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Caminhos para os arquivos que contêm as anotações
};

const specs = swaggerJsdoc(options);

module.exports = specs;

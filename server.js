// server.js - Modificado para funcionar na Vercel
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Load environment variables
dotenv.config();

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Stripe Connect API',
      version: '1.0.0',
      description: 'API for Stripe Connect integration',
    },
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

// Import routes
const stripeConnectRoutes = require('./routes/stripeConnectRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { 
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API de Pagamentos - Documentação"
}));


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Special middleware for Stripe webhooks (raw body)
app.use('/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api/stripe/connect', stripeConnectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Exportar a instância do Express para a Vercel
module.exports = app;
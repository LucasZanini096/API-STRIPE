
// server.js - Atualizado para incluir rotas de onboarding
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const stripeConnectRoutes = require('./routes/stripeConnectRoutes');
const stripeOnboardingRoutes = require('./routes/stripeOnboardingRoutes'); // Nova rota
const nativePaymentRoutes = require('./routes/nativePaymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Special middleware for Stripe webhooks (raw body)
app.use('/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api/stripe/connect', stripeConnectRoutes);
app.use('/api/stripe/onboarding', stripeOnboardingRoutes); // Nova rota para onboarding customizado
app.use('/api/payments', paymentRoutes);
app.use('/', webhookRoutes);
app.use('/api/native-payments', nativePaymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      stripe_connect: 'active',
      stripe_onboarding: 'active',
      payments: 'active',
      webhooks: 'active'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'FlutterFlow Stripe API',
    version: '2.0.0',
    endpoints: {
      stripe_connect: {
        'POST /api/stripe/connect/create-account': 'Create Standard Stripe account',
        'GET /api/stripe/connect/status': 'Get account status'
      },
      stripe_onboarding: {
        'POST /api/stripe/onboarding/create-custom-account': 'Create Custom account for API onboarding',
        'PUT /api/stripe/onboarding/accounts/:id/basic-info': 'Update basic business info',
        'PUT /api/stripe/onboarding/accounts/:id/personal-info': 'Update personal info',
        'POST /api/stripe/onboarding/accounts/:id/bank-account': 'Add bank account',
        'POST /api/stripe/onboarding/accounts/:id/accept-terms': 'Accept terms of service',
        'GET /api/stripe/onboarding/accounts/:id/requirements': 'Get account requirements',
        'GET /api/stripe/onboarding/accounts/:id/progress': 'Get onboarding progress',
        'POST /api/stripe/onboarding/accounts/:id/upload-document': 'Upload verification document'
      },
      payments: {
        'POST /api/payments/create-checkout-session': 'Create payment session'
      }
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: '/api/docs'
  });
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`🔗 Stripe Connect: Ready`);
    console.log(`🎯 Custom Onboarding: Ready`);
  });
}

// Exportar a instância do Express para a Vercel
module.exports = app;
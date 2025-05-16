// config/index.js
require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Application URLs
  appUrl: process.env.APP_URL || 'https://api-stripe-o3zkpzvzx-lucas-zanini-da-silvas-projects.vercel.app/',
  frontendUrl: process.env.FRONTEND_APP_URL || 'http://localhost:8080',
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    connectAccountType: 'standard', // 'standard', 'express', or 'custom'
    platformFeePercent: 10, // Platform fee percentage (for when processing payments)
  },
  
  // Default country and business type for Stripe Connect
  defaults: {
    country: 'BR',
    businessType: 'individual',
  },
  
  // Webhook configuration
  webhooks: {
    stripeEvents: [
      'account.updated',
      'account.application.authorized',
      'account.application.deauthorized',
      'account.external_account.created',
      'capability.updated',
      'person.updated'
    ]
  },
  
  // API rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};
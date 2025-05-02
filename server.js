// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const stripeConnectRoutes = require('./routes/stripeConnectRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Special middleware for Stripe webhooks (raw body)
app.use('/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api/stripe/connect', stripeConnectRoutes);
app.use('/', webhookRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Launch the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
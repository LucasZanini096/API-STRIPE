// routes/stripeConnectRoutes.js
const express = require('express');
const router = express.Router();
const stripeConnectController = require('../controllers/stripeConnectController');

// Create a new Stripe Connect account
router.post('/create-account', stripeConnectController.createConnectAccount);

// Get onboarding status for a user
router.get('/status/:stripeAccountId', stripeConnectController.getAccountStatus);

// Generate a fresh onboarding link for users who haven't completed onboarding
router.post('/refresh-onboarding/:uid', stripeConnectController.refreshOnboardingLink);

module.exports = router;
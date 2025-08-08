// routes/stripeOnboardingRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const stripeOnboardingController = require('../controllers/stripeOnboardingController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens e PDFs são permitidos'), false);
    }
  }
});

// Create custom account for API-based onboarding
router.post('/create-custom-account', stripeOnboardingController.createCustomAccount);

// Update basic business information
router.put('/accounts/:accountId/basic-info', stripeOnboardingController.updateBasicInfo);

// Update personal information
router.put('/accounts/:accountId/personal-info', stripeOnboardingController.updatePersonalInfo);

// Add bank account
router.post('/accounts/:accountId/bank-account', stripeOnboardingController.addBankAccount);

// Accept terms of service
router.post('/accounts/:accountId/accept-terms', stripeOnboardingController.acceptTerms);

// Get account requirements and status
router.get('/accounts/:accountId/requirements', stripeOnboardingController.getAccountRequirements);

// Get onboarding progress
router.get('/accounts/:accountId/progress', stripeOnboardingController.getOnboardingProgress);

// Upload verification documents
router.post('/accounts/:accountId/upload-document', 
  upload.single('document'), 
  stripeOnboardingController.uploadDocument
);

module.exports = router;
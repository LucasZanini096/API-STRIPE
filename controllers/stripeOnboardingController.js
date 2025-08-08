// controllers/stripeOnboardingController.js
const dotenv = require('dotenv');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

dotenv.config();

// In-memory storage for onboarding sessions
const onboardingSessions = {};

/**
 * Create a custom Stripe Connect account for API-based onboarding
 */
exports.createCustomAccount = async (req, res) => {
  try {
    const { 
      email, 
      country = 'BR', 
      business_type = 'individual',
      uid,
      name,
      phone
    } = req.body;

    if (!email || !uid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e UID são obrigatórios' 
      });
    }

    // Create a Custom Connected Account for API-based onboarding
    const account = await stripe.accounts.create({
      type: 'custom',
      country,
      business_type,
      email,
      metadata: {
        user_id: uid,
        app_name: 'FlutterFlow Marketplace',
        onboarding_type: 'custom'
      },
      // Request necessary capabilities
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });

    // Store onboarding session
    onboardingSessions[uid] = {
      accountId: account.id,
      email,
      name,
      phone,
      currentStep: 'basic_info',
      requirements: account.requirements,
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      accountId: account.id,
      onboardingSteps: account.requirements,
      currentStep: 'basic_info',
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      }
    });

  } catch (error) {
    console.error('Error creating custom Stripe account:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update account with basic business information
 */
exports.updateBasicInfo = async (req, res) => {
  try {
    const { accountId } = req.params;
    const {
      business_name,
      business_url,
      product_description,
      support_phone,
      support_email,
      business_type
    } = req.body;

    const updateData = {
      business_profile: {
        name: business_name,
        url: business_url,
        product_description,
        support_phone,
        support_email
      }
    };

    // Update business type if provided
    if (business_type) {
      updateData.business_type = business_type;
    }

    const account = await stripe.accounts.update(accountId, updateData);

    res.json({
      success: true,
      accountId: account.id,
      requirements: account.requirements,
      nextStep: 'personal_info',
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      }
    });

  } catch (error) {
    console.error('Error updating basic info:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update account with personal information (for individuals)
 */
exports.updatePersonalInfo = async (req, res) => {
  try {
    const { accountId } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      dob_day,
      dob_month,
      dob_year,
      cpf,
      address_line1,
      address_line2,
      address_city,
      address_state,
      address_postal_code
    } = req.body;

    const updateData = {
      individual: {
        first_name,
        last_name,
        email,
        phone,
        dob: {
          day: parseInt(dob_day),
          month: parseInt(dob_month),
          year: parseInt(dob_year)
        },
        id_number: cpf, // CPF for Brazil
        address: {
          line1: address_line1,
          line2: address_line2,
          city: address_city,
          state: address_state,
          postal_code: address_postal_code,
          country: 'BR'
        }
      }
    };

    const account = await stripe.accounts.update(accountId, updateData);

    res.json({
      success: true,
      accountId: account.id,
      requirements: account.requirements,
      nextStep: 'bank_account',
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      }
    });

  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Add bank account for payouts
 */
exports.addBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const {
      account_holder_name,
      account_holder_type = 'individual',
      routing_number, // Código do banco no Brasil
      account_number
    } = req.body;

    // Create external account (bank account)
    const externalAccount = await stripe.accounts.createExternalAccount(
      accountId,
      {
        external_account: {
          object: 'bank_account',
          country: 'BR',
          currency: 'brl',
          account_holder_name,
          account_holder_type,
          routing_number, // Código do banco
          account_number
        }
      }
    );

    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      success: true,
      accountId: account.id,
      externalAccountId: externalAccount.id,
      requirements: account.requirements,
      nextStep: 'terms_acceptance',
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      }
    });

  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Accept terms of service
 */
exports.acceptTerms = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { user_agent, ip_address } = req.body;

    const account = await stripe.accounts.update(accountId, {
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: ip_address || req.ip || req.connection.remoteAddress,
        user_agent: user_agent || req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      accountId: account.id,
      requirements: account.requirements,
      nextStep: 'complete',
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      }
    });

  } catch (error) {
    console.error('Error accepting terms:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get account requirements and current status
 */
exports.getAccountRequirements = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);

    // Determine current onboarding step based on requirements
    let currentStep = 'complete';
    const requirements = account.requirements;

    if (requirements.currently_due.length > 0) {
      if (requirements.currently_due.some(req => req.includes('tos_acceptance'))) {
        currentStep = 'terms_acceptance';
      } else if (requirements.currently_due.some(req => req.includes('external_account'))) {
        currentStep = 'bank_account';
      } else if (requirements.currently_due.some(req => req.includes('individual'))) {
        currentStep = 'personal_info';
      } else if (requirements.currently_due.some(req => req.includes('business_profile'))) {
        currentStep = 'basic_info';
      }
    }

    res.json({
      success: true,
      accountId: account.id,
      currentStep,
      requirements: {
        currently_due: requirements.currently_due,
        eventually_due: requirements.eventually_due,
        past_due: requirements.past_due,
        pending_verification: requirements.pending_verification,
        disabled_reason: requirements.disabled_reason,
        current_deadline: requirements.current_deadline
      },
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      },
      capabilities: account.capabilities
    });

  } catch (error) {
    console.error('Error getting account requirements:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Upload document for verification
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { document_type, purpose = 'identity_document' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    // Upload file to Stripe
    const file = await stripe.files.create({
      purpose: 'identity_document',
      file: {
        data: req.file.buffer,
        name: req.file.originalname,
        type: req.file.mimetype
      }
    }, {
      stripeAccount: accountId
    });

    // Update account with document
    let updateData = {};
    
    if (document_type === 'identity_front') {
      updateData = {
        individual: {
          verification: {
            document: {
              front: file.id
            }
          }
        }
      };
    } else if (document_type === 'identity_back') {
      updateData = {
        individual: {
          verification: {
            document: {
              back: file.id
            }
          }
        }
      };
    }

    const account = await stripe.accounts.update(accountId, updateData);

    res.json({
      success: true,
      accountId: account.id,
      fileId: file.id,
      requirements: account.requirements,
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      }
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get onboarding progress summary
 */
exports.getOnboardingProgress = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);
    const requirements = account.requirements;

    // Calculate completion percentage
    const totalSteps = 4; // basic_info, personal_info, bank_account, terms_acceptance
    let completedSteps = 0;

    // Check completed steps
    if (!requirements.currently_due.some(req => req.includes('business_profile'))) {
      completedSteps++;
    }
    if (!requirements.currently_due.some(req => req.includes('individual'))) {
      completedSteps++;
    }
    if (!requirements.currently_due.some(req => req.includes('external_account'))) {
      completedSteps++;
    }
    if (!requirements.currently_due.some(req => req.includes('tos_acceptance'))) {
      completedSteps++;
    }

    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

    res.json({
      success: true,
      accountId: account.id,
      progress: {
        completionPercentage,
        completedSteps,
        totalSteps,
        currentStep: completedSteps < totalSteps ? 
          ['basic_info', 'personal_info', 'bank_account', 'terms_acceptance'][completedSteps] : 
          'complete'
      },
      requirements: {
        currently_due: requirements.currently_due,
        past_due: requirements.past_due,
        disabled_reason: requirements.disabled_reason
      },
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        is_complete: completedSteps === totalSteps && account.details_submitted
      }
    });

  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// controllers/stripeConnectController.js
const dotenv = require('dotenv');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In-memory storage for users
const users = {};

// Create a new Stripe Connect account
exports.createConnectAccount = async (req, res) => {
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
        message: 'Email and user ID are required' 
      });
    }

    // Create a Stripe Connected Account (Standard)
    const account = await stripe.accounts.create({
      type: 'standard',
      email,
      country,
      business_type,
      metadata: {
        user_id: uid,
        app_name: 'FlutterFlow Marketplace'
      }
    });

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.APP_URL}/stripe/reauth?uid=${uid}`,
      return_url: `${process.env.APP_URL}/stripe/return?uid=${uid}`,
      type: 'account_onboarding',
    });

    // Store user details in memory
    users[uid] = {
      email,
      name,
      phone,
      stripeAccountId: account.id,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      payouts_enabled: account.payouts_enabled,
      created_at: new Date().toISOString()
    };

    // Return success with account link
    res.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      status: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      }
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get onboarding status for a user
// Função atualizada para obter status da conta usando o ID do Stripe diretamente
exports.getAccountStatus = async (req, res) => {
  try {
    const { stripeAccountId } = req.params;
    
    // Validar o formato básico do ID da conta Stripe
    if (!stripeAccountId || !stripeAccountId.startsWith('acct_')) {
      return res.status(400).json({
        success: false,
        message: 'ID da conta Stripe inválido. Deve começar com "acct_"'
      });
    }

    try {
      // Obter detalhes atualizados diretamente do Stripe
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      // Retornar status
      res.json({
        success: true,
        accountId: stripeAccountId,
        status: {
          charges_enabled: account.charges_enabled,
          details_submitted: account.details_submitted,
          payouts_enabled: account.payouts_enabled,
          requirements: account.requirements
        },
        account_type: account.type,
        business_type: account.business_type,
        email: account.email,
        country: account.country,
        created: new Date(account.created * 1000).toISOString(),
        canReceivePayments: account.charges_enabled,
        dashboardUrl: 'https://dashboard.stripe.com/account'
      });
    } catch (stripeError) {
      // Tratamento específico para erros do Stripe
      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({
          success: false,
          message: 'Conta Stripe não encontrada'
        });
      }
      
      // Outros erros do Stripe
      return res.status(400).json({
        success: false,
        message: `Erro ao consultar conta Stripe: ${stripeError.message}`,
        code: stripeError.code
      });
    }

  } catch (error) {
    console.error('Erro ao recuperar status da conta:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate a fresh onboarding link for users who haven't completed onboarding
exports.refreshOnboardingLink = async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Check if user exists in our in-memory storage
    if (!users[uid] || !users[uid].stripeAccountId) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no Stripe account connected'
      });
    }

    const stripeAccountId = users[uid].stripeAccountId;

    // Create new account link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.APP_URL}/stripe/reauth?uid=${uid}`,
      return_url: `${process.env.APP_URL}/stripe/return?uid=${uid}`,
      type: 'account_onboarding',
    });

    // Return new onboarding URL
    res.json({
      success: true,
      accountId: stripeAccountId,
      onboardingUrl: accountLink.url
    });

  } catch (error) {
    console.error('Error refreshing onboarding link:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export users object for webhook controller to access
exports.users = users;
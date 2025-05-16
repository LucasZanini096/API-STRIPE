// controllers/webhookController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeConnectController = require('./stripeConnectController');

// Access the shared users object
const users = stripeConnectController.users;

// Handle Stripe webhook events
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Adaptação para funcionar na Vercel
    const rawBody = req.rawBody || req.body;
    
    // Verificar se rawBody é uma string (como esperado pelo Stripe)
    const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log event for debugging
  console.log(`Received webhook event: ${event.type}`);
  console.log('Event data:', JSON.stringify(event.data.object, null, 2));

  // Handle specific Stripe events
  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
        
      case 'account.application.authorized':
        await handleApplicationAuthorized(event.data.object);
        break;
        
      case 'account.application.deauthorized':
        await handleApplicationDeauthorized(event.data.object);
        break;
        
      case 'account.external_account.created':
        await handleExternalAccountCreated(event.data.object);
        break;
        
      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object);
        break;
        
      case 'person.updated':
        await handlePersonUpdated(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    res.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    res.status(500).send(`Error processing webhook event: ${error.message}`);
  }
};

// Handle account.updated event
async function handleAccountUpdated(account) {
  try {
    console.log(`Processing account.updated for account: ${account.id}`);
    
    // Find user with this Stripe account ID
    const uid = Object.keys(users).find(key => 
      users[key].stripeAccountId === account.id
    );
    
    if (uid) {
      // Update user status in memory
      const wasChargesEnabled = users[uid].charges_enabled;
      
      users[uid] = {
        ...users[uid],
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        last_updated: new Date().toISOString()
      };
      
      console.log(`Updated status for user ${uid}, account ${account.id}`);
      
      // Send notification if status changed significantly
      if (account.charges_enabled && !wasChargesEnabled) {
        // User can now receive payments
        console.log(`User ${uid} can now receive payments!`);
        // In a real app, you might send a push notification, email, etc.
      }
    } else {
      console.log(`No user found for Stripe account: ${account.id}`);
    }
  } catch (error) {
    console.error('Error handling account.updated event:', error);
    throw error;
  }
}

// Handle account.application.authorized event
async function handleApplicationAuthorized(application) {
  console.log(`Connect application authorized for account: ${application.id}`);
  // Implementation depends on your business logic
}

// Handle account.application.deauthorized event
async function handleApplicationDeauthorized(application) {
  console.log(`Connect application deauthorized for account: ${application.id}`);
  
  try {
    // Mark the user as disconnected in memory
    const uid = Object.keys(users).find(key => 
      users[key].stripeAccountId === application.id
    );
    
    if (uid) {
      users[uid] = {
        ...users[uid],
        is_active: false,
        disconnected_at: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error handling deauthorization:', error);
    throw error;
  }
}

// Handle account.external_account.created event
async function handleExternalAccountCreated(bankAccount) {
  console.log(`Bank account added to account: ${bankAccount.account}`);
  // Implementation depends on your business logic
}

// Handle capability.updated event
async function handleCapabilityUpdated(capability) {
  console.log(`Capability ${capability.id} updated for account: ${capability.account}`);
  // Implementation depends on your business logic
}

// Handle person.updated event
async function handlePersonUpdated(person) {
  console.log(`Person ${person.id} updated for account: ${person.account}`);
  // Implementation depends on your business logic
}

// Função atualizada para lidar com checkout.session.completed
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log(`Checkout session completed: ${session.id}`);
    
    // Extrair metadados da sessão
    const { productId, stripeAccountId, platformFee } = session.metadata || {};
    
    if (!productId || !stripeAccountId) {
      console.log('Metadados incompletos na sessão de checkout:', session.id);
      return;
    }
    
    // Buscar informações da conta do vendedor diretamente no Stripe
    let sellerAccount;
    try {
      sellerAccount = await stripe.accounts.retrieve(stripeAccountId);
    } catch (error) {
      console.error(`Erro ao buscar conta do vendedor ${stripeAccountId}:`, error);
      return;
    }
    
    // Buscar o PaymentIntent associado à sessão
    let paymentIntent = null;
    if (session.payment_intent) {
      paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    }
    
    // Registrar o pagamento para o painel administrativo
    if (paymentIntent) {
      adminController.registerPayment({
        paymentIntentId: paymentIntent.id,
        sessionId: session.id,
        timestamp: new Date().toISOString(),
        amount: session.amount_total,
        currency: session.currency,
        status: paymentIntent.status,
        customerEmail: session.customer_details?.email,
        sellerInfo: {
          stripeAccountId: stripeAccountId,
          email: sellerAccount.email,
          business_type: sellerAccount.business_type,
          country: sellerAccount.country
        },
        productInfo: {
          id: productId,
          name: session.line_items?.data[0]?.description || 'Produto',
          quantity: session.line_items?.data[0]?.quantity || 1,
          unitAmount: session.line_items?.data[0]?.price?.unit_amount
        },
        platformFee: platformFee ? parseInt(platformFee) : null,
        paymentMethod: session.payment_method_types[0]
      });
    }
    
    console.log(`Pagamento processado para o produto ${productId}`);
    console.log(`Valor total: ${session.amount_total / 100} ${session.currency.toUpperCase()}`);
    console.log(`Taxa da plataforma: ${platformFee ? parseInt(platformFee) / 100 : 'N/A'} ${session.currency.toUpperCase()}`);
    console.log(`Valor líquido para o vendedor: ${(session.amount_total - (platformFee ? parseInt(platformFee) : 0)) / 100} ${session.currency.toUpperCase()}`);
    
    // Em um cenário real, você atualizaria:
    // 1. O status do pedido no banco de dados
    // 2. O histórico de transações do vendedor
    // 3. Enviaria notificações para o comprador e o vendedor
    
  } catch (error) {
    console.error('Erro ao processar checkout.session.completed:', error);
    throw error;
  }
}
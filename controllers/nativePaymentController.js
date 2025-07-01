// controllers/nativePaymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'brl', productId, stripeAccountId, customerId } = req.body;

    if (!amount || !productId || !stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, productId e stripeAccountId são obrigatórios'
      });
    }

    // Verificar se a conta pode receber pagamentos
    const account = await stripe.accounts.retrieve(stripeAccountId);
    
    if (!account.charges_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Conta Stripe ainda não pode receber pagamentos'
      });
    }

    // Calcular taxa da plataforma (exemplo: 5%)
    const platformFeeAmount = Math.round(amount * 0.05);

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: ['card'],
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: stripeAccountId,
      },
      metadata: {
        productId: productId,
        stripeAccountId: stripeAccountId,
        platformFee: platformFeeAmount.toString()
      },
      customer: customerId,
      setup_future_usage: 'on_session' // Para salvar método de pagamento
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      platformFee: platformFeeAmount
    });

  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.confirmPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID é obrigatório'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      charges: paymentIntent.charges?.data || []
    });

  } catch (error) {
    console.error('Erro ao confirmar Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
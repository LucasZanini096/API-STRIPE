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

    // Criar Payment Intent COM AS CONFIGURAÇÕES CORRETAS
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
      // ADICIONE ESTAS CONFIGURAÇÕES IMPORTANTES:
      description: `Produto: ${productId}`,
      capture_method: 'automatic',
      confirmation_method: 'manual',
      confirm: false,
      setup_future_usage: 'on_session'
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
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID é obrigatório'
      });
    }

    let paymentIntent;

    // Se um payment method foi fornecido, confirmar o pagamento
    if (paymentMethodId) {
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: `${process.env.FRONTEND_APP_URL}/payment/return`, // ADICIONE ESTA LINHA
      });
    } else {
      // Apenas recuperar o status atual
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    }

    // MELHORE A RESPOSTA COMO NO paymentController:
    if (paymentIntent.status === 'succeeded') {
      res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        charges: paymentIntent.charges?.data || [],
        application_fee_amount: paymentIntent.application_fee_amount,
        message: 'Pagamento realizado com sucesso!'
      });
    } else if (paymentIntent.status === 'requires_action') {
      res.json({
        success: false,
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action
      });
    } else {
      res.json({
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        charges: paymentIntent.charges?.data || [],
        application_fee_amount: paymentIntent.application_fee_amount
      });
    }

  } catch (error) {
    console.error('Erro ao confirmar Payment Intent:', error);
    
    // MELHORE O TRATAMENTO DE ERRO:
    if (error.type === 'StripeCardError') {
      res.status(400).json({
        success: false,
        message: error.message,
        decline_code: error.decline_code
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

// ADICIONE ESTE MÉTODO PARA TESTE COMPLETO:
exports.createAndConfirmPayment = async (req, res) => {
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

    // Criar e confirmar Payment Intent automaticamente para teste
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
      description: `Produto: ${productId}`,
      capture_method: 'automatic',
      // Confirmar automaticamente com cartão de teste
      payment_method_data: {
        type: 'card',
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2025,
          cvc: '123'
        }
      },
      confirm: true,
      return_url: `${process.env.FRONTEND_APP_URL}/payment/return`
    });

    res.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: amount,
      currency: currency,
      platformFee: platformFeeAmount,
      charges: paymentIntent.charges?.data || [],
      application_fee_amount: paymentIntent.application_fee_amount,
      message: 'Pagamento processado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao processar pagamento completo:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
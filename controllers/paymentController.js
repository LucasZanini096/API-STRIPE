// controllers/paymentController.js - Versão com Payment Intent integrado
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeConnectController = require('./stripeConnectController');

// In-memory product database (manter existente)
const products = [
  {
    id: 'prod_001',
    name: 'Produto Premium',
    description: 'Um produto de alta qualidade',
    price: 9900, // R$ 99,00 (em centavos)
    images: ['https://exemplo.com/imagem.jpg']
  },
  {
    id: 'prod_002',
    name: 'Serviço Básico',
    description: 'Um serviço essencial',
    price: 4990, // R$ 49,90 (em centavos)
    images: []
  }
];

// NOVA FUNÇÃO: Criar Payment Intent para pagamento integrado
exports.createPaymentIntent = async (req, res) => {
  try {
    const {
      productId,
      stripeAccountId,
      quantity = 1,
      customerInfo = {}
    } = req.body;

    // Validar parâmetros
    if (!productId || !stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'productId e stripeAccountId são obrigatórios'
      });
    }

    // Encontrar o produto
    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar se a conta Stripe Connect existe e está ativa
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      if (!account.charges_enabled) {
        return res.status(400).json({
          success: false,
          message: 'Conta Stripe ainda não pode receber pagamentos. O onboarding não foi concluído.'
        });
      }

      // Calcular valores
      const unitAmount = product.price;
      const totalAmount = unitAmount * quantity;
      const platformFeePercent = 10;
      const platformFeeAmount = Math.round(totalAmount * (platformFeePercent / 100));

      // Criar Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'brl',
        payment_method_types: ['card'],
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          productId: product.id,
          stripeAccountId: stripeAccountId,
          platformFee: platformFeeAmount,
          quantity: quantity
        },
        description: `${product.name} - Quantidade: ${quantity}`,
        // Configurações para captura automática
        capture_method: 'automatic',
        confirmation_method: 'manual',
        confirm: false,
      });

      // Retornar client_secret para o frontend
      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          unitAmount: unitAmount,
          quantity: quantity,
          totalAmount: totalAmount
        },
        fees: {
          platformFeeAmount: platformFeeAmount,
          sellerAmount: totalAmount - platformFeeAmount
        }
      });

    } catch (stripeError) {
      console.error('Erro do Stripe:', stripeError);
      
      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({
          success: false,
          message: 'Conta Stripe Connect não encontrada'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Erro ao verificar conta Stripe: ${stripeError.message}`
      });
    }

  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// NOVA FUNÇÃO: Confirmar pagamento no backend
exports.confirmPayment = async (req, res) => {
  try {
    const {
      paymentIntentId,
      paymentMethodId
    } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'paymentIntentId e paymentMethodId são obrigatórios'
      });
    }

    // Confirmar o Payment Intent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${process.env.FRONTEND_APP_URL}/payment/return`,
    });

    // Verificar o status
    if (paymentIntent.status === 'succeeded') {
      res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        message: 'Pagamento realizado com sucesso!'
      });
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure ou outra autenticação necessária
      res.json({
        success: false,
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action
      });
    } else {
      res.status(400).json({
        success: false,
        status: paymentIntent.status,
        message: 'Falha no pagamento'
      });
    }

  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    
    if (error.type === 'StripeCardError') {
      res.status(400).json({
        success: false,
        message: error.message,
        decline_code: error.decline_code
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
};

// FUNÇÃO EXISTENTE: Create checkout session (manter para compatibilidade)
exports.createCheckoutSession = async (req, res) => {
  try {
    const {
      productId,
      stripeAccountId,
      quantity = 1,
      successUrl,
      cancelUrl
    } = req.body;

    // Validar parâmetros
    if (!productId || !stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'productId e stripeAccountId são obrigatórios'
      });
    }

    // Encontrar o produto
    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar se a conta Stripe Connect existe e está ativa
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      if (!account.charges_enabled) {
        return res.status(400).json({
          success: false,
          message: 'Conta Stripe ainda não pode receber pagamentos. O onboarding não foi concluído.'
        });
      }
      
      const platformFeePercent = 10;
      const platformFeeAmount = Math.round(product.price * quantity * (platformFeePercent / 100));

      const success_url = successUrl || `${process.env.FRONTEND_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = cancelUrl || `${process.env.FRONTEND_APP_URL}/payment/cancel`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: product.name,
                description: product.description,
                images: product.images
              },
              unit_amount: product.price,
            },
            quantity: quantity,
          },
        ],
        mode: 'payment',
        success_url: success_url,
        cancel_url: cancel_url,
        payment_intent_data: {
          application_fee_amount: platformFeeAmount,
          transfer_data: {
            destination: stripeAccountId,
          },
        },
        metadata: {
          productId: product.id,
          stripeAccountId: stripeAccountId,
          platformFee: platformFeeAmount
        }
      });

      res.json({
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      });
      
    } catch (stripeError) {
      console.error('Erro do Stripe:', stripeError);
      
      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({
          success: false,
          message: 'Conta Stripe Connect não encontrada'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Erro ao verificar conta Stripe: ${stripeError.message}`
      });
    }

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verificar status de um pagamento
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId, paymentIntentId } = req.params;

    let result = {};

    if (sessionId) {
      // Verificar status via sessão (método existente)
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      result = {
        success: true,
        sessionId: session.id,
        status: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customer: session.customer,
        paymentIntent: session.payment_intent,
        metadata: session.metadata
      };
    } else if (paymentIntentId) {
      // Verificar status via Payment Intent (novo método)
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      result = {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        metadata: paymentIntent.metadata
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'sessionId ou paymentIntentId é obrigatório'
      });
    }

    res.json(result);

  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Funções existentes (manter)
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      images = []
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nome e preço são obrigatórios'
      });
    }

    const id = 'prod_' + Date.now().toString().slice(-6);

    const newProduct = {
      id,
      name,
      description,
      price: parseInt(price * 100),
      images
    };

    products.push(newProduct);

    res.json({
      success: true,
      product: newProduct
    });

  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.listProducts = async (req, res) => {
  try {
    res.json({
      success: true,
      products: products
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
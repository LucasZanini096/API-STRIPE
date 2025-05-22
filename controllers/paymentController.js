// controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeConnectController = require('./stripeConnectController');

// In-memory product database
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

// Create a payment session (Stripe Checkout)
exports.createCheckoutSession = async (req, res) => {
  try {
    const {
      productId,
      stripeAccountId, // ID da conta Stripe Connect do vendedor
      name,
      price,
      description,
      image,
      quantity = 1,
    } = req.body;

    console.log('Dados recebidos:', { productId, stripeAccountId, name, price, description, image, quantity });

    // Validar parâmetros obrigatórios
    if (!productId || !stripeAccountId || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'productId, stripeAccountId, name e price são obrigatórios'
      });
    }

    // Validar e converter preço
    let priceInCents;
    try {
      const priceFloat = parseFloat(price);
      if (isNaN(priceFloat) || priceFloat <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Preço deve ser um número válido maior que zero'
        });
      }
      priceInCents = Math.round(priceFloat * 100); // Converter para centavos
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao processar preço: deve ser um número válido'
      });
    }

    // Preparar array de imagens - CORREÇÃO AQUI
    let images = [];
    if (image) {
      if (typeof image === 'string' && image.trim() !== '') {
        // Se for uma string, adicionar ao array
        images = [image];
      } else if (Array.isArray(image)) {
        // Se já for um array, filtrar URLs válidas
        images = image.filter(img => typeof img === 'string' && img.trim() !== '');
      }
    }

    console.log('Images processadas:', images);

    // Criar objeto do produto
    const product = {
      id: productId,
      name: name,
      description: description || 'Produto disponível para compra',
      price: priceInCents,
      images: images // Array de strings com URLs das imagens
    };

    console.log('Produto criado:', product);

    // Verificar se a conta Stripe Connect existe e está ativa
    try {
      // Consultar a conta diretamente no Stripe
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      console.log('Conta Stripe encontrada:', {
        id: account.id,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted
      });
      
      // Verificar se o vendedor pode receber pagamentos
      if (!account.charges_enabled) {
        return res.status(400).json({
          success: false,
          message: 'Conta Stripe ainda não pode receber pagamentos. O onboarding não foi concluído.'
        });
      }
      
      // Calcular a taxa da plataforma (10%)
      const platformFeePercent = 10;
      const platformFeeAmount = Math.round(product.price * quantity * (platformFeePercent / 100));

      // URLs de redirecionamento
      const success_url = `${process.env.FRONTEND_APP_URL}/Confirmation_Payment`;
      const cancel_url = `${process.env.FRONTEND_APP_URL}/Cancel_Payment`;

      console.log('URLs de redirecionamento:', { success_url, cancel_url });
      console.log('Taxa da plataforma:', platformFeeAmount);

      // Criar uma sessão de checkout do Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: product.name,
                description: product.description,
                images: product.images // Array de URLs válidas
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
          platformFee: platformFeeAmount.toString()
        }
      });

      console.log('Sessão criada com sucesso:', {
        id: session.id,
        url: session.url
      });

      // Retornar a sessão criada
      res.json({
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos de expiração
      });
      
    } catch (stripeError) {
      // Erros específicos do Stripe
      console.error('Erro do Stripe:', stripeError);
      
      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({
          success: false,
          message: 'Conta Stripe Connect não encontrada'
        });
      }
      
      // Tratar erro específico de imagem
      if (stripeError.message && stripeError.message.includes('Invalid array')) {
        return res.status(400).json({
          success: false,
          message: 'Erro no formato da imagem. Verifique se a URL da imagem é válida.',
          details: stripeError.message
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Erro ao verificar conta Stripe: ${stripeError.message}`
      });
    }

  } catch (error) {
    console.error('Erro geral ao criar sessão de checkout:', error);
    res.status(500).json({
      success: false,
      message: `Erro interno do servidor: ${error.message}`
    });
  }
};

// Verificar status de um pagamento
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'ID da sessão é obrigatório'
      });
    }

    // Recuperar a sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Retornar o status do pagamento
    res.json({
      success: true,
      sessionId: session.id,
      status: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customer: session.customer,
      paymentIntent: session.payment_intent,
      metadata: session.metadata
    });

  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Adicionar um produto (para testes)
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

    // Criar ID único para o produto
    const id = 'prod_' + Date.now().toString().slice(-6);

    // Adicionar produto à "base de dados"
    const newProduct = {
      id,
      name,
      description,
      price: parseInt(price * 100), // Converter para centavos
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

// Listar produtos disponíveis
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
// server.js - Modificado para incluir o Swagger
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerSpecs = require('./config/swagger');
const serveSwaggerUI = require('./config/swagger-ui'); // Nossa implementação personalizada

// Load environment variables
dotenv.config();

// Import routes
const stripeConnectRoutes = require('./routes/stripeConnectRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
//const docsRoutes = require('./routes/docsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos do diretório public
app.use(express.static('public'));

// Special middleware for Stripe webhooks (raw body)
app.use('/webhook', (req, res, next) => {
  if (req.method === 'POST') {
    let rawBody = '';
    req.setEncoding('utf8');
    
    req.on('data', chunk => { rawBody += chunk; });
    
    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpecs, { 
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API de Pagamentos - Documentação"
}));

// Rota raiz - página inicial com links para documentação
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API de Pagamentos - Stripe Connect</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #6772e5;
          border-bottom: 2px solid #6772e5;
          padding-bottom: 10px;
        }
        .links {
          background-color: #f6f9fc;
          padding: 20px;
          border-radius: 4px;
          margin-top: 20px;
        }
        .links a {
          display: block;
          color: #6772e5;
          text-decoration: none;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .links a:hover {
          text-decoration: underline;
        }
        .version {
          font-size: 12px;
          color: #666;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <h1>API de Pagamentos - Stripe Connect</h1>
      <p>Bem-vindo à API de integração para processamento de pagamentos via Stripe Connect.</p>
      
      <div class="links">
        <h2>Links Importantes:</h2>
        <a href="${baseUrl}/api-docs">📚 Documentação da API (Swagger)</a>
        <a href="${baseUrl}/api/docs/swagger.json">📄 Download da Documentação (JSON)</a>
        <a href="${baseUrl}/health">🔍 Status da API</a>
        <a href="${baseUrl}/api-docs-status">🔍 Status do Swagger</a>
      </div>
      
      <p class="version">Versão: 1.0.0</p>
    </body>
    </html>
  `);
});

// Routes
app.use('/api/stripe/connect', stripeConnectRoutes);
app.use('/api/payments', paymentRoutes);
//app.use('/api/docs', docsRoutes);
app.use('/', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1' ? true : false,
    vercelUrl: process.env.VERCEL_URL || null
  });
});

// Rota específica para verificar se o Swagger está disponível
app.get('/api-docs-status', (req, res) => {
  res.status(200).json({
    swagger: 'available',
    url: `${req.protocol}://${req.get('host')}/api-docs`,
    docs_json: `${req.protocol}://${req.get('host')}/api/docs/swagger.json`
  });
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
}

// Exportar a instância do Express para a Vercel
module.exports = app;
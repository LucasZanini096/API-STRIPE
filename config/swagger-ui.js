// config/swagger-ui.js
const swaggerUiAssetPath = require('swagger-ui-dist').getAbsoluteFSPath();
const fs = require('fs');
const path = require('path');

// Função para servir os arquivos do Swagger UI
const serveSwaggerUI = (app) => {
  // Gerar HTML do Swagger UI
  const generateHTML = (swaggerUrl) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API de Pagamentos - Documentação</title>
      <link rel="stylesheet" type="text/css" href="./api-docs/swagger-ui.css" />
      <style>
        .topbar { display: none }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="./api-docs/swagger-ui-bundle.js" charset="UTF-8"></script>
      <script src="./api-docs/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
      <script>
        window.onload = function() {
          window.ui = SwaggerUIBundle({
            url: "${swaggerUrl}",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
          });
        }
      </script>
    </body>
    </html>
    `;
  };

  // Servir arquivos estáticos para o Swagger UI
  const serveSwaggerFile = (res, filePath, contentType) => {
    try {
      const fileContent = fs.readFileSync(filePath);
      res.setHeader('Content-Type', contentType);
      res.send(fileContent);
    } catch (error) {
      console.error(`Erro ao servir arquivo ${filePath}:`, error);
      res.status(500).send(`Erro ao carregar o arquivo: ${error.message}`);
    }
  };

  // Configurar rotas para servir os arquivos do Swagger UI
  app.get('/api-docs', (req, res) => {
    const html = generateHTML('/api/docs/swagger.json');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api-docs/swagger-ui.css', (req, res) => {
    serveSwaggerFile(res, path.join(swaggerUiAssetPath, 'swagger-ui.css'), 'text/css');
  });

  app.get('/api-docs/swagger-ui-bundle.js', (req, res) => {
    serveSwaggerFile(res, path.join(swaggerUiAssetPath, 'swagger-ui-bundle.js'), 'application/javascript');
  });

  app.get('/api-docs/swagger-ui-standalone-preset.js', (req, res) => {
    serveSwaggerFile(res, path.join(swaggerUiAssetPath, 'swagger-ui-standalone-preset.js'), 'application/javascript');
  });
};

module.exports = serveSwaggerUI;
// scripts/setup-swagger.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verifica se já temos o swagger-ui-dist instalado
try {
  require.resolve('swagger-ui-dist');
  console.log('swagger-ui-dist já está instalado.');
} catch (error) {
  // Se não estiver instalado, instala
  console.log('Instalando swagger-ui-dist...');
  execSync('npm install --save swagger-ui-dist', { stdio: 'inherit' });
  console.log('swagger-ui-dist instalado com sucesso!');
}

// Verifica se o diretório de assets existe
const assetsDir = path.join(__dirname, '../public/swagger-ui');
if (!fs.existsSync(assetsDir)) {
  console.log('Criando diretório de assets do Swagger UI...');
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Copia os arquivos necessários do swagger-ui-dist para o diretório public
const swaggerUiDistPath = require('swagger-ui-dist').getAbsoluteFSPath();
const fileNames = ['swagger-ui.css', 'swagger-ui-bundle.js', 'swagger-ui-standalone-preset.js'];

fileNames.forEach(fileName => {
  const srcPath = path.join(swaggerUiDistPath, fileName);
  const destPath = path.join(assetsDir, fileName);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copiado ${fileName} para ${destPath}`);
  } else {
    console.error(`Arquivo não encontrado: ${srcPath}`);
  }
});

console.log('Setup do Swagger UI concluído com sucesso!');
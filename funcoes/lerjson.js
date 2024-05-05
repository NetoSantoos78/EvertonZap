const fs = require('fs').promises;

async function dadosJson() {
    try {
        // Leitura do arquivo config.json
        const configPath = './config.json';
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData); // Retorna os dados lidos do arquivo JSON
    } catch (error) {
        console.error('Erro ao ler o arquivo config.json:', error);
        throw error; // Lança o erro para ser tratado onde a função é chamada
    }
}

module.exports = { dadosJson };
const fs = require('fs').promises;

// Defina o caminho do seu arquivo JSON aqui
const caminhoArquivo = './config.json'; // Substitua pelo caminho do seu arquivo JSON

async function carregarJSON() {
    try {
        const dados = await fs.readFile(caminhoArquivo, 'utf8');
        return JSON.parse(dados);
    } catch (erro) {
        console.error('Erro ao carregar o arquivo JSON:', erro.message);
        return [];
    }
}

async function obterTaxaEntregaEspecifica(chave) {
    const json = await carregarJSON();

    for (const item of json) {
        if (item.taxaEntrega && item.taxaEntrega[chave]) {
            return item.taxaEntrega[chave];
        }
    }

    return null; // Caso não encontre a chave específica na taxaEntrega
}

module.exports = {
    obterTaxaEntregaEspecifica
};

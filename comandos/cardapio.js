const fs = require('fs').promises;

// Função assíncrona para ler o arquivo JSON
async function lerCardapio(nomeArquivo) {
    try {
        const data = await fs.readFile(nomeArquivo, 'utf8');
        const cardapio = JSON.parse(data);
        return cardapio;
    } catch (error) {
        throw error;
    }
}


// Caminho para o arquivo JSON
const caminhoArquivo = './cardapio/burguers.json';


async function cardapioIndividual(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const produtoNome = produto.produto;
                const ingredientes = produto.ingredientes;
                const valor = produto.valor;
                return { produtoNome, ingredientes, valor };
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}



async function cardapioCompleto(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ ${ingredientes.join(", ")}\n   ❯ R$: ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}

async function sandubaCompleto(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ R$: ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}

async function cardapioExtras(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                let extrasString = '';
                const extrasPrecos = produto.extrasPrecos;
                Object.keys(extrasPrecos).forEach((extra, index) => {
                    const numeroEmoji = emojisNumeros[index]; // Obter emoji do número
                    extrasString += `${numeroEmoji} ${extra}: R$ ${extrasPrecos[extra]}\n`;
                });
                return extrasString;
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}


async function valorExtraEspecifico(lanche, indiceExtra) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasPrecos = Object.values(produto.extrasPrecos); // Obtém os preços dos extras
                const valorExtra = extrasPrecos[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (valorExtra) {
                    return valorExtra;
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}


const emojisNumeros = [
    "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", 
    "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟",
    "1️⃣1️⃣", "1️⃣2️⃣", "1️⃣3️⃣", "1️⃣4️⃣", "1️⃣5️⃣",
    "1️⃣6️⃣", "1️⃣7️⃣", "1️⃣8️⃣", "1️⃣9️⃣", "2️⃣0️⃣"
];

module.exports = {
    cardapioIndividual,
    cardapioCompleto,
    cardapioExtras,
    valorExtraEspecifico,
    sandubaCompleto
};
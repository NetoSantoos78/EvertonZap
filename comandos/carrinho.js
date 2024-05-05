const fs = require('fs');
const path = require('path');

// Função para adicionar um pedido ao carrinho
function adicionarPedido(jsonData, pessoa, numeroContato, numeroPedido, produtos, extras, valor, status) {
    // Cria um novo objeto com os dados do pedido
    const novoPedido = {
        numeroPedido: numeroPedido,
        nomeComprador: pessoa,
        contatoComprador: numeroContato,
        produtos: produtos.join(', '),
        extras: extras,
        valor: valor,
        status: status
    };
    // Verifica se já existe um registro para a pessoa no JSON
    if (!jsonData[pessoa]) {
        // Se não existir, cria um novo registro para a pessoa
        jsonData[pessoa] = [];
    }
    // Adiciona o novo pedido ao array de pedidos da pessoa
    jsonData[pessoa].push(novoPedido);
    return jsonData;
}
// Função para carregar o JSON do arquivo
function carregarJSON(nomeArquivo) {
    try {
        return JSON.parse(fs.readFileSync(nomeArquivo, 'utf8'));
    } catch (err) {
        console.error('Erro ao ler o arquivo JSON:', err);
        return {};
    }
}
// Função para salvar o JSON em um arquivo
function salvarJSON(jsonData, nomeArquivo) {
    fs.writeFile(nomeArquivo, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) throw err;
        console.log('Arquivo salvo com sucesso!');
    });
}

// Função para adicionar um pedido ao carrinho e salvar no arquivo
function addCarrinho(numeroContato, pessoa, numeroPedido, produtos, extras, valor, status) {
    // Carrega o JSON do arquivo existente, se houver
    let jsonData = {};

    try {
        jsonData = JSON.parse(fs.readFileSync('./carrinho.json', 'utf8'));
    } catch (err) {
        console.error('Erro ao ler o arquivo JSON:', err);
    }

    // Adiciona o pedido ao carrinho
    if (!jsonData[numeroContato]) {
        jsonData[numeroContato] = [];
    }

    const pedido = {
        numeroPedido: numeroPedido,
        nomeComprador: pessoa,
        contatoComprador: numeroContato,
        produtos: produtos,
        extras: extras,
        valor: valor,
        status: status
    };

    jsonData[numeroContato].push(pedido);

    // Salva o carrinho de compras no arquivo JSON
    salvarJSON(jsonData, './carrinho.json'); // Nome do arquivo onde deseja salvar o JSON
}


// Função para verificar se um diretório existe e criar, se necessário
function verificarECriarDiretorio(diretorio) {
    if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio, { recursive: true });
    }
}

// Função para criar um arquivo JSON com os dados do pedido na pasta "pedidos"
function salvarPedidoComoJSON(numeroContato, numeroPedido, jsonData) {
    const diretorioPedidos = path.join(__dirname, '../vendas');
    verificarECriarDiretorio(diretorioPedidos);
    const nomeArquivo = path.join(diretorioPedidos, `#${numeroPedido}.json`);

    fs.writeFile(nomeArquivo, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) throw err;
        console.log(`Pedido #${numeroPedido} salvo como JSON.`);
    });
}

// Função para atualizar o status de um pedido
function atualizarStatusPedido(numeroPedido, novoStatus) {
    const nomeArquivoCarrinho = './carrinho.json'; // Nome do arquivo onde os dados do carrinho são armazenados

    // Carrega o JSON do carrinho
    let jsonDataCarrinho = carregarJSON(nomeArquivoCarrinho);

    // Verifica se o número do pedido existe no JSON do carrinho
    if (jsonDataCarrinho) {
        for (const pessoa in jsonDataCarrinho) {
            const pedidos = jsonDataCarrinho[pessoa];
            if (Array.isArray(pedidos)) { // Verifica se pedidos é um array
                for (let i = 0; i < pedidos.length; i++) {
                    if (pedidos[i].numeroPedido === numeroPedido) {
                        // Atualiza o status do pedido
                        pedidos[i].status = novoStatus;
                        console.log(`Status do pedido ${numeroPedido} atualizado para ${novoStatus}`);
                        // Se o novo status for "aprovado", salva o pedido como JSON na pasta "pedidos"
                        if (novoStatus === "entregue" || novoStatus === "recusado" || novoStatus === "cancelado") {
                            // Salva o pedido como JSON na pasta "pedidos"
                            salvarPedidoComoJSON(pessoa, numeroPedido, pedidos[i]);
                            // Remove o pedido do JSON do carrinho
                            pedidos.splice(i, 1);
                            // Se não houver mais pedidos para essa pessoa, remove a chave correspondente do JSON do carrinho
                            if (pedidos.length === 0) {
                                delete jsonDataCarrinho[pessoa];
                            }
                            // Salva o JSON do carrinho atualizado no arquivo
                            salvarJSON(jsonDataCarrinho, nomeArquivoCarrinho);
                        } else {
                            // Se o novo status não for "aprovado", apenas salva o JSON do carrinho atualizado no arquivo
                            salvarJSON(jsonDataCarrinho, nomeArquivoCarrinho);
                        }
                        return; // Encerra a função após atualizar o status
                    }
                }
            } else {
                console.log('Erro: Os pedidos não estão no formato esperado.');
                return;
            }
        }
        // Se o número do pedido não for encontrado
        console.log(`Pedido com número ${numeroPedido} não encontrado.`);
    }
}


/*
// Exemplo de chamada da função para atualizar o status de um pedido
atualizarStatusPedido("123456", "entregue"); // Substitua "123456" pelo número do pedido que deseja atualizar

// Exemplo de chamada da função addCarrinho

addCarrinho(
    "557996325079", // Número de contato
    "Netoo",        // Nome do comprador
    "123456BS",       // Número do pedido
    ["Hamburguer", "Batata Frita", "Refrigerante"], // Produtos
    { // Extras
        "Hamburguer": "Queijo, Alface, Tomate",
        "Batata Frita": "Molho Especial",
        "Refrigerante": "Gelo"
    },
    "15,00", // Valor
    "pendente" // Status
);
*/

module.exports = {
    addCarrinho,
    atualizarStatusPedido
}
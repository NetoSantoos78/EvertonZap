const fs = require('fs').promises;
const emojiStrip = require('emoji-strip');
const path = require('path');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const puppeteer = require('puppeteer');
const { Client, MessageMedia, Poll, LocalAuth } = require('whatsapp-web.js');
const { criarPagamento, criarPagamentoRenovacao } = require('./criarCompra.js');
const { dataFormatada, horaFormatada } = require('./funcoes/pegardata.js');
const { cardapioIndividual, cardapioCompleto, cardapioExtras, valorExtraEspecifico, sandubaCompleto, nomeExtraEspecifico } = require('./comandos/cardapio.js');
const { addCarrinho, atualizarStatusPedido } = require('./comandos/carrinho.js')
const { Callback } = require('puppeteer');
const { clear } = require('console');

const TIMEOUT_INTERVAL = 300000; // 15 segundos em milissegundos

const respostas = {
    menu: '',
    semAtendimento: 'Desculpa, não consegui entender o que você falou, por favor mande *"menu"* para iniciar seu pedido.',
    cardapio: 'Por favor, escolha o que deseja pedir.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    cardapioAdd: 'Por favor, escolha o que deseja adicionar.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    cardapiover: 'Por favor, escolha o que deseja ver.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    adicionais: 'Deseja por algo a mais em seu sanduíche?\n1️⃣ Sim\n2️⃣ Não',
    maisUmAdicional: 'Deseja adicionar mais algo ao seu sanduíche?\n1️⃣ Sim\n2️⃣ Não',
    maisAlgoPedido: 'Quer complementar seu pedido com algo a mais? Ex.: Com uma batata, refrigerante, sorvete?\n1️⃣ Sim\n2️⃣ Não',
    pizzasTipos: 'Qual tipo de pizza deseja?\n1️⃣ Especiais\n2️⃣ Tradicionais',
    extraSanduba: 'Escolha abaixo o que deseja adicionar em seu sanduíche.',
    quantidade: 'Poderia me falar quantos desse lanche você deseja? EX: *1, 2, 3*',
    voltarMenu: 'Digite *"menu"* para voltar ao menu principal.',
    verCarrinho: 'Tudo certo, por favor, confira seu pedido e confirme se está tudo certo antes de confirmá-lo.',
    nomeperfil: '',
    carrinho: '',
    qualnome: ''
}

const client = new Client({
    puppeteer: {
        headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreDefaultArgs: ['--disable-dev-shm-usage'], ignoreHTTPSErrors: true
    },
    authStrategy: new LocalAuth(),
    webVersion: '2.2409.2',
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2409.2.html'
    },
});

const estadosIndividuais = {};
const carrrinhoIndividuais = {};

function getEstadoIndividual(numeroContato) {
    if (!estadosIndividuais.hasOwnProperty(numeroContato)) {
        estadosIndividuais[numeroContato] = {
            atendimento: 0,
            menu: 0,
            mensagemRecebida: false, // Adicionando a propriedade mensagemRecebida ao estado
            resp1: 0,
            resp2: 0,
            resp3: 0,
            resp4: 0,
            resp5: 0,
            resp6: 0,
            resp7: 0,
            resp8: 0,
            resp9: 0,
            resp10: 0,
            respx: 0,
            escolha: '',
        };
    }
    return estadosIndividuais[numeroContato];
}

function getCardapioIndividual(numeroContato) {
    if (!carrrinhoIndividuais.hasOwnProperty(numeroContato)) {
        carrrinhoIndividuais[numeroContato] = {
            contato: '',
            comprador: '',
            idPedido: '',
            produtos: {},
            extras: [],
            preco: '0',
            idProduto: 0,
        };
    }
    return carrrinhoIndividuais[numeroContato];
}
// Função para iniciar o atendimento
function iniciarAtendimento(numeroContato) {
    const estado = getEstadoIndividual(numeroContato);
    estado.atendimento = 1; // Altera o estado de atendimento para 1

    // Inicia o timer de inatividade
    iniciarTimerInatividade(numeroContato);
}

// Função para verificar e encerrar o atendimento por inatividade
function verificarInatividade(numeroContato) {
    const estado = getEstadoIndividual(numeroContato);

    // Se o atendimento estiver ativo e não houver mensagens recentes
    if (estado.atendimento === 1 && !estado.mensagemRecebida) {
        // Define o estado de atendimento como 0 para encerrar o atendimento
        estado.atendimento = 0;
        estado.menu = 0; // Reinicia o estado do menu
        client.sendMessage(numeroContato, `Estarei encerrando seu atendimento.\nAgradecemos seu contato.🙂\nQualquer dúvida, sinta-se à vontade em entrar em contato usando "menu"`);
        console.log(`Atendimento para ${numeroContato} encerrado devido à inatividade.`);
    }

    // Limpa o indicador de mensagem recebida após verificar a inatividade
    estado.mensagemRecebida = false;
}

// Função para iniciar o timer de inatividade
function iniciarTimerInatividade(numeroContato) {
    setTimeout(() => {
        verificarInatividade(numeroContato);
    }, TIMEOUT_INTERVAL);
}

client.on('message_create', message => {
    if (!message.fromMe) {
        const notifyName = message._data.notifyName;
        respostas.nomeperfil = notifyName;
        respostas.menu = `Fala, ${notifyName}!\nDiz aí quais delícias vai querer hoje?\nEscolha algo na lista.\n1️⃣ Fazer pedido\n2️⃣ Cardápio\n3️⃣ Atendimento\nEscolha uma opção da lista.`
    }
});

client.on('qr', (qr) => {
    console.log('Escanee o QR code abaixo com o seu celular:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp está pronto!');
});
// Função para remover acentos de uma string
function removerAcentos(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
function gerarCodigo() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        codigo += caracteres.charAt(indiceAleatorio);
    }
    return codigo;
}


function limparNome(nomeUsuario) {
    // Remover emojis e espaços em branco extras, incluindo espaços em branco no início e no final
    const nomeLimpo = emojiStrip(nomeUsuario).replace(/^\s+|\s+$/g, '');
    return nomeLimpo;
}

// Compra dos sanduba
async function sandubas(numeroContato, client) {
    sandubaCompleto((output, error) => {
        if (error) {
            client.sendMessage(numeroContato, "Erro ao obter o cardápio:");
            // Aqui você pode enviar uma mensagem de erro para o usuário, se necessário
        } else {
            const retorno = output;
            client.sendMessage(numeroContato, retorno);
            // Aqui você pode enviar o cardápio completo para o usuário
        }
    });
}
// Ver tudo dos sandubas
async function tudosandubas(numeroContato, client) {
    cardapioCompleto((output, error) => {
        if (error) {
            client.sendMessage(numeroContato, "Erro ao obter o cardápio:");
            // Aqui você pode enviar uma mensagem de erro para o usuário, se necessário
        } else {
            const retorno = output;
            client.sendMessage(numeroContato, retorno);
            setTimeout(() => {
                // Enviar a segunda mensagem após 25 segundos
                client.sendMessage(
                    numeroContato,
                    'Este é todo nosso cardápio do sanduíche. Para voltar, envie *"menu"*.'
                );
            }, 1000);
            // Aqui você pode enviar o cardápio completo para o usuário
        }
    });
}
// Info do lanche escolhido
async function sandubaIndividual(numeroContato, client, idproduto) {
    const idFinal = idproduto;
    const carrinho = getCardapioIndividual(numeroContato);
    const estado = getEstadoIndividual(numeroContato);
    carrinho.idProduto = idFinal;
    cardapioIndividual(idFinal)

        .then(resultado => {
            // Aqui você pode manipular o resultado conforme necessário
            const retorno = `Perfeito, o produto ${resultado.produtoNome} foi adicionado ao seu pedido.`;
            adicionarValorProdutoAoCarrinho(numeroContato, resultado.valor);
            adicionarProdutoAoCarrinho(numeroContato, resultado.produtoNome);
            client.sendMessage(numeroContato, retorno);
            estado.resp1 = 3;
            estado.resp2 = 1;
            estado.escolha = resultado.produtoNome;
            console.log("Sanduba Indie: " + estado.resp1)
            setTimeout(() => {
                client.sendMessage(numeroContato, respostas.maisUmAdicional);
            }, 1000);
        })
        .catch(error => {
            client.sendMessage(numeroContato, "Erro ao obter o cardápio: " + error.message);
            // Aqui você pode enviar uma mensagem de erro para o usuário, se necessário
        });
}
// Adicionando ao carrinho
// Add numero contato
function adicionarContatoAoCarrinho(numeroContato) {
    const carrinho = getCardapioIndividual(numeroContato);
    // Remove o "@c.us" e quaisquer caracteres que não sejam números
    const numeroLimpo = numeroContato.replace(/[@c.us]/g, "").replace(/\D/g, "");
    carrinho.contato = numeroLimpo;
}

// Add nome do comprador
function adicionarNomeAoCarrinho(numeroContato) {
    const carrinho = getCardapioIndividual(numeroContato);
    carrinho.comprador = limparNome(respostas.nomeperfil);
}
// Add id do pedido
function adicionarIdPedidoAoCarrinho(numeroContato) {
    const carrinho = getCardapioIndividual(numeroContato);
    const codigoAleatorio = gerarCodigo();
    carrinho.idPedido = codigoAleatorio;

}
// Add os produtos
function adicionarProdutoAoCarrinho(numeroContato, produto) {
    const pedido = getCardapioIndividual(numeroContato);
    const estado = getEstadoIndividual(numeroContato)
    // Verifica se já existe um objeto de produtos no carrinho
    if (!pedido.produtos) {
        // Se não existir, inicializa o objeto de produtos
        pedido.produtos = {};
    }

    // Define o próximo ID como o próximo número após o maior ID existente
    const proximoId = Object.keys(pedido.produtos).length + 1;

    // Adiciona o produto ao objeto de produtos com o próximo ID
    pedido.produtos[proximoId.toString()] = produto;
    estado.escolha
    let nao = "Não";
    adicionarItem2(produto, nao);

    console.log(produto + " foi adicionado ao carrinho com o ID " + proximoId);

}

// Add os extras
async function adicionarExtraAoCarrinho(numeroContato, produto, extra) {
    try {
        const carrinho = getCardapioIndividual(numeroContato);
        const estado = getEstadoIndividual(numeroContato);
        const lanche = carrinho.idProduto; // Supondo que idPedido seja o identificador do produto
        const indiceExtra = extra; // Supondo que extra seja o índice do extra no cardápio
        const valorExtra = await valorExtraEspecifico(lanche, indiceExtra);
        const nomeExtra = await nomeExtraEspecifico(lanche, indiceExtra);
        const r1 = nomeExtra.nomeItem;
        const r2 = nomeExtra.nomeExtra;
        adicionarItem2(r1, r2);
        estado.resp1 = 5
        client.sendMessage(numeroContato, respostas.maisUmAdicional);
    } catch (error) {
        console.error("Erro ao adicionar extra ao carrinho:", error);
    }
}

/////////////
const carrinhoTemp2 = [];

function adicionarItem2(lanche, ...extras) {
    // Verifica se já existe um item com o mesmo lanche no carrinho temporário
    const itemExistente = carrinhoTemp2.find(item => item.lanche === lanche);

    if (itemExistente) {
        // Atualiza a contagem dos extras no item existente
        extras.forEach(extra => {
            if (itemExistente.extraCounts[extra]) {
                itemExistente.extraCounts[extra]++;
            } else {
                itemExistente.extraCounts[extra] = 1;
            }
        });
    } else {
        // Se o item não existe, cria um novo item no carrinho temporário
        const extraCounts = {};
        extras.forEach(extra => {
            if (extraCounts[extra]) {
                extraCounts[extra]++;
            } else {
                extraCounts[extra] = 1;
            }
        });

        carrinhoTemp2.push({
            lanche: lanche,
            extraCounts: extraCounts
        });
    }
}


function adicionarItem(numeroContato) {
    const carrinho = getCardapioIndividual(numeroContato);
    const estado = getEstadoIndividual(numeroContato);

    // Objeto para armazenar a contagem de cada extra
    const extraCounts = {};
    // Array para armazenar os nomes dos lanches
    const nomesLanche = [];

    // Adiciona os itens de carrinhoTemp2 a carrinho.extras e atualiza a contagem de extras
    for (const item of carrinhoTemp2) {
        // Atualiza a contagem de cada extra
        for (const extra in item.extraCounts) {
            if (extraCounts[extra]) {
                extraCounts[extra] += item.extraCounts[extra];
            } else {
                extraCounts[extra] = item.extraCounts[extra];
            }
        }
        // Adiciona o nome do lanche ao array de nomes de lanche
        nomesLanche.push(item.lanche);
    }

    // Transforma o objeto extraCounts em um array de objetos
    const extrasArray = [];
    for (const extra in extraCounts) {
        extrasArray.push(`${extraCounts[extra]}x ${extra}`);
    }

    // Monta a lista de extras para cada item do carrinho
    const extras = [];
    for (const item of carrinhoTemp2) {
        // Remove o "Não" se houver mais de um extra
        const extrasItem = extrasArray.length > 1 && item.extraCounts['Não'] ? extrasArray.filter(extra => extra !== '1x Não').join(', ') : extrasArray.join(', ');
        extras.push({ item: item.lanche, extras: extrasItem });
    }

    // Adiciona os extras ao carrinho
    carrinho.extras.push(...extras);

    // Limpa carrinhoTemp2 para uso futuro
    carrinhoTemp2.length = 0;

}

// Add o preço
function adicionarValorProdutoAoCarrinho(numeroContato, valorProdutoNovo) {
    const carrinho = getCardapioIndividual(numeroContato);
    carrinho.preco = (parseFloat(carrinho.preco) || 0) + parseFloat(valorProdutoNovo);
    console.log("Preço add ao carro");
}
// Consultar extras disponivel
async function obterExtrasDoLanche(numeroContato, message) {
    try {
        const carrinho = getCardapioIndividual(numeroContato);
        const estado = getEstadoIndividual(numeroContato);
        const lanche = carrinho.idProduto;
        const extras = await cardapioExtras(lanche);
        client.sendMessage(numeroContato, extras);
        estado.resp1 = 4
    } catch (error) {
        console.error("Erro ao obter os extras do lanche:", error);
    }
}
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
function resetarStatus(numeroContato) {
    //const numeroContato = message.from;
    const estado = getEstadoIndividual(numeroContato);
    estado.resp1 = 0,
        estado.resp2 = 0,
        estado.resp3 = 0,
        estado.resp4 = 0,
        estado.resp5 = 0,
        estado.resp6 = 0,
        estado.resp7 = 0,
        estado.resp8 = 0,
        estado.resp9 = 0,
        estado.resp10 = 0,
        estado.respx = 0
    //console.log("Resetou tudo papai");
}
client.on('message', async (message) => {
    const numeroContato = message.from;
    const estado = getEstadoIndividual(numeroContato);
    estado.mensagemRecebida = true; // Define o indicador de mensagem recebida como verdadeiro
    if (estado.atendimento === 0) {
        iniciarAtendimento(numeroContato);
    }
    verificarEstado(numeroContato);
    // Inicia o timer de inatividade após receber uma mensagem
    iniciarTimerInatividade(numeroContato);
    // Aqui você pode adicionar a lógica para processar a mensagem recebida
    const mensagemRecebida = removerAcentos(message.body.trim().toLowerCase()); // Remover acentos e converter para minúsculas

    // Verifica se a mensagem é 'menu' e responde com a mensagem correspondente
    if (mensagemRecebida === 'menu') {
        resetarStatus(numeroContato);
        avaliarrespx(numeroContato, message);
    } else if (mensagemRecebida === '1') {
        avaliarresp1(numeroContato, message);
    } else if (mensagemRecebida === '2') {
        avaliarresp2(numeroContato, message);
    } else if (mensagemRecebida === '3') {
        avaliarresp3(numeroContato, message);
    } else if (mensagemRecebida === '4') {
        const carrinho = getCardapioIndividual(numeroContato);
        const jsonString = JSON.stringify(carrinho, null, 2);

        // Mensagem a ser enviada
        const mensagem = `Seu Carrinho:\n${jsonString}`;
        message.reply(mensagem);
        //imprimirCarrinhoTemp2(numeroContato, message)
        //message.reply("aaa")

    }
});

async function avaliarrespx(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato)
    console.log("RespX: " + estado.respx)
    switch (estado.respx) {
        case 0: // Manda o menu do cardápio
            await client.sendMessage(numeroContato, respostas.menu);
            estado.resp1 = 99;
            break;
        case 1: // Menu do cardapio de sandubas
            await sandubas(numeroContato, client);
            estado.resp1 = 2;
            break;
        case 2:
            sandubaIndividual(numeroContato, client, 1);
            break
        case 3:
            obterExtrasDoLanche(numeroContato, message);
            break
        case 4:
            adicionarExtraAoCarrinho(numeroContato, carrinho.idProduto, 1)
            break
        case 5: //ADICIONAR MAIS COISAS AO SANDUBA
            adicionarExtraAoCarrinho(numeroContato, carrinho.idProduto, 1)
            break
        case 6: // Cardapio completo para ver dos sanduba
            estado.resp1 = 20;
            estado.resp2 = 1
            avaliarresp1(numeroContato, message);
            break
        case 7: // NÃO QUER NADA NO LANCHE
            adicionarIdPedidoAoCarrinho(numeroContato);
            adicionarNomeAoCarrinho(numeroContato);
            adicionarContatoAoCarrinho(numeroContato);
            adicionarItem(numeroContato);
            message.reply(respostas.maisAlgoPedido);
            estado.resp1 = 6;
            estado.resp2 = 2
            break
        default:
            // Lidar com estado desconhecido, se necessário
            //console.log("Mensagem recebida de um remetente com estado desconhecido:", msg.body);
            break;
    }
}

async function avaliarresp1(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    switch (estado.resp1) {
        case 0: // Manda o menu do cardápio
            await avaliarrespx(numeroContato, message);

            break;
        case 1: // Mensagem que vai mandar os lanches
            estado.respx = 1;
            await message.reply("Perfeito, vou te enviar nosso cardápio, só escolher o que deseja pedir.");
            await avaliarrespx(numeroContato, message);
            break;
        case 2: // Chama o lanche com id 1
            estado.respx = 2;
            avaliarrespx(numeroContato, message)
            break
        case 3: // Lista de estra do sanduba escolhido
            estado.respx = 3;
            message.reply("Escolha abaixo o que deseja adicionar no sanduíche");
            avaliarrespx(numeroContato, message)
            break
        case 4:
            estado.respx = 4;
            avaliarrespx(numeroContato, message);
            break
        case 5:
            estado.respx = 3;
            avaliarrespx(numeroContato, message);
            break
        case 6: // ADD mais algo ao pedido
            message.reply(respostas.cardapioAdd);
            break
        case 20:
            tudosandubas(numeroContato, client);
            break;
        case 99:
            message.reply(respostas.cardapio);
            estado.resp1 = 1;
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

async function avaliarresp2(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    switch (estado.resp2) {
        case 0: // Manda o menu do cardápio
            client.sendMessage(numeroContato, respostas.cardapiover);
            break;
        case 1: // Não do menu de adicionar coisas ao lanche
            estado.respx = 7;
            await avaliarrespx(numeroContato, message);
            break;
        case 2:
            message.reply(respostas.verCarrinho);
            const carrinho = getCardapioIndividual(numeroContato);
            const jsonString = JSON.stringify(carrinho, null, 2);
            const mensagem = `${jsonString}`;
            setTimeout(() => {
                // Enviar a segunda mensagem após 0,5 segundos
                client.sendMessage( numeroContato, mensagem );
            }, 500);
            break
        // Outros casos de estado...
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

async function avaliarresp3(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    estado.resp1 = 15;
    const carrinho = getCardapioIndividual(numeroContato);
    console.log(carrinho);
    for (const key in carrinho.extras) {
        const value = carrinho.extras[key];
        const mensagem = `Seu Carrinho\nProdutos: ${value.item}\nExtras: ${value.extras}`;
        client.sendMessage(numeroContato, mensagem);
        // Agora você pode enviar a mensagem para o cliente
        // client.sendMessage(numeroContato, mensagem);
    }


}

// Função para verificar o estado de atendimento atual
function verificarEstado(numeroContato) {
    const estado = getEstadoIndividual(numeroContato);
    //console.log(`Estado de atendimento para ${numeroContato}:`, estado);
}


client.initialize();

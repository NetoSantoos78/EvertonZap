const fs = require('fs').promises;
const path = require('path');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const puppeteer = require('puppeteer');
const { Client, MessageMedia, Poll, LocalAuth } = require('whatsapp-web.js');
const { criarPagamento, criarPagamentoRenovacao } = require('./criarCompra.js');
const { dataFormatada, horaFormatada } = require('./funcoes/pegardata.js');
const { cardapioIndividual, cardapioCompleto, cardapioExtras, valorExtraEspecifico, sandubaCompleto } = require('./comandos/cardapio.js');
const { addCarrinho, atualizarStatusPedido } = require('./comandos/carrinho.js')
const { Callback } = require('puppeteer');

const TIMEOUT_INTERVAL = 300000; // 15 segundos em milissegundos

const respostas = {
    menu: '',
    semAtendimento: 'Desculpa, não consegui entender o que você falou, por favor mande *"menu"* para iniciar seu pedido.',
    cardapio: 'Por favor, escolha o que deseja pedir.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
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

function getEstadoIndividual(numeroRemetente) {
    if (!estadosIndividuais.hasOwnProperty(numeroRemetente)) {
        estadosIndividuais[numeroRemetente] = {
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
        };
    }
    return estadosIndividuais[numeroRemetente];
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
    console.log(qr);
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

// Compra dos sanduba
async function sandubas(numeroContato, client){
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
async function tudosandubas(numeroContato, client){
    cardapioCompleto((output, error) => {
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

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

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
        estado.menu = 0;
        estado.resp1 = 0;
        estado.respx = 0;
        message.reply(respostas.menu); // Envia a resposta para o contato
    } else if (mensagemRecebida === '1') {
        avaliarresp1(numeroContato, message);
    } else if (mensagemRecebida === '2') {
        avaliarresp2(numeroContato, message);
    } else if (mensagemRecebida === '3') {
        avaliarresp3(numeroContato, message);
    }
});

async function avaliarrespx(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    console.log("RespX: "+estado.respx)
    switch (estado.respx) {
        case 0: // Manda o menu do cardápio
            await client.sendMessage(numeroContato, respostas.menu);
            estado.resp1 = 1;
            
            break;
        case 1:
            await sandubas(numeroContato, client);
            break;
        case 6:
            await client.sendMessage(numeroContato, respostas.cardapiover);
            estado.resp1 = 16;
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
        case 1:
            estado.respx = 1;
            await message.reply("Perfeito, vou te enviar nosso cardápio, só escolher o que deseja pedir.");
            await avaliarrespx(numeroContato, message);
            break;
        case 16:
            tudosandubas(numeroContato, client);
            break;
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

async function avaliarresp2(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    switch (estado.resp2) {
        case 0: // Manda o menu do cardápio
            estado.respx = 6;
            await avaliarrespx(numeroContato, message);
            break;
        case 1:
            estado.respx = 1;
            await message.reply("Perfeito, vou te enviar nosso cardápio, só escolher o que deseja pedir.");
            await avaliarrespx(numeroContato, message);
            break;
        // Outros casos de estado...
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

async function avaliarresp3(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    estado.resp1 = 15;
}

// Função para verificar o estado de atendimento atual
function verificarEstado(numeroContato) {
    const estado = getEstadoIndividual(numeroContato);
    //console.log(`Estado de atendimento para ${numeroContato}:`, estado);
}


client.initialize();

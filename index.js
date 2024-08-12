const fs = require('fs').promises;
const emojiStrip = require('emoji-strip');
const path = require('path');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const puppeteer = require('puppeteer');
const { Client, MessageMedia, Poll, LocalAuth, List, Buttons } = require('whatsapp-web.js');
const { criarPagamento, criarPagamentoRenovacao } = require('./criarCompra.js');
const { dataFormatada, horaFormatada } = require('./funcoes/pegardata.js');
const { atualizarIdGrupo, obterIdGrupo, atualizarIdSuporte, obterIdGrupoSuporte } = require('./funcoes/funcao.js');
const { cardapioIndividual, cardapioCompleto, cardapioExtras, valorExtraEspecifico, sandubaCompleto, nomeExtraEspecifico,
    pizzasCompleto1, pizzasCompleto2, cardapioIndividualPizza1, nomeExtraEspecificoAcai, nomeExtraEspecificoBatatas,
    nomeExtraEspecificBebidas, nomeExtraEspecificoPizza2, nomeExtraEspecificoPizza1, valorExtraEspecificoAcai,
    valorExtraEspecificoBatatas, valorExtraEspecificoBebidas, valorExtraEspecificoPizza2, valorExtraEspecificoPizza1,
    cardapioExtrasAcai, cardapioExtrasBatatas, cardapioExtrasBebidas, cardapioExtrasPizza2, cardapioExtrasPizza1,
    acaiCompleto, batatasCompleto, bebidasCompleto, cardapioCompletoAcai, cardapioCompletoBatatas, cardapioCompletoBebidas,
    cardapioCompletoPizzas2, cardapioCompletoPizzas1, cardapioIndividualAcai, cardapioIndividualBatatas, cardapioIndividualPizza2, } = require('./comandos/cardapio.js');
const { addCarrinho, atualizarStatusPedido } = require('./comandos/carrinho.js');
const { pegarRetorno } = require('./funcoes/gerenciamentoProdutos.js')
const { verificarConcluido, verificarRegistro, cadastroEndereco } = require('./funcoes/endereco.js');
const { obterTaxaEntregaEspecifica } = require('./funcoes/entrega');
const { Callback } = require('puppeteer');
const { clear } = require('console');


const TIMEOUT_INTERVAL = 300000; // 15 segundos em milissegundos
let idenquete = "";
const respostas = {
    menu: '',
    semAtendimento: 'Desculpa, não consegui entender o que você falou, por favor mande *"menu"* para iniciar seu pedido.',
    atendimento: 'Vou te repassar para algum atendente.',
    cardapio: 'Por favor, escolha o que deseja pedir.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    cardapioAdd: 'Por favor, escolha o que deseja adicionar.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    cardapiover: 'Por favor, escolha o que deseja ver.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    adicionais: 'Deseja por algo a mais em seu ```sanduíche```?\n1️⃣ Sim\n2️⃣ Não',
    maisUmAdicional: 'Deseja adicionar mais algo ao seu sanduíche?\n1️⃣ Sim\n2️⃣ Não',
    maisAlgoPedido: 'Quer complementar seu ```pedido``` com algo a mais? Ex.: Com uma batata, refrigerante, sorvete?\n1️⃣ Sim\n2️⃣ Não',
    pizzasTipos: 'Qual tipo de pizza deseja?\n1️⃣ Especiais\n2️⃣ Tradicionais',
    confimacao: '1️⃣ Confimar\n2️⃣ Cancelar pedido',
    tam1: `\n*1️⃣ Pequena: R$:28,00*\n*2️⃣ Média R$:38,00*\n*3️⃣ Grande: R$:48,00*`,
    tam2: `\n*1️⃣ Pequena: R$:20,00*\n*2️⃣ Média R$:30,00*\n*3️⃣ Grande: R$:40,00*`,
    voltar: `Se quiser voltar ao menu principal envie *"menu"*.\n0️⃣ Menu anterior`,
    extraSanduba: 'Escolha abaixo o que deseja adicionar em seu sanduíche.',
    quantidade: 'Poderia me falar quantos desse lanche você deseja? EX: *1, 2, 3*',
    voltarMenu: 'Digite *"menu"* para voltar ao menu principal.',
    cancelar: `Seu pedido foi cancelado. É uma pena isto, mas qualquer coisa só chamar que estaremos sempre disponíveis. Basta apenas enviar *"menu"*`,
    verCarrinho: 'Tudo certo, por favor, confira seu pedido e confirme se está tudo certo antes de confirmá-lo.',
    nomeperfil: '',
    carrinho: '',
    qualnome: '',
    idgrupo: '',
}

const client = new Client({
    puppeteer: {
        headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreDefaultArgs: ['--disable-dev-shm-usage'], ignoreHTTPSErrors: true
    },
    authStrategy: new LocalAuth(),
    webVersion: "2.2409.2",
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2409.2.html",
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
            resp11: 0,
            resp12: 0,
            resp13: 0,
            resp14: 0,
            resp0: 0,
            respx: 0,
            cliente: '',
            escolha: '',
            conclusao: '',
            msg: '',
            batatas: 0
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
            extras: {},
            preco: '0',
            idProduto: 0,
        };
    }
    return carrrinhoIndividuais[numeroContato];
}
function exibirCarrinho(numeroContato) {
    const carrinho = getCardapioIndividual(numeroContato);
    console.log(JSON.stringify(carrinho, null, 2));
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
        resetarStatus(numeroContato);
    }

    // Limpa o indicador de mensagem recebida após verificar a inatividade
    estado.mensagemRecebida = false;
}

// Função para iniciar o timer de inatividade
let timeoutHandle = null;

function iniciarTimerInatividade(numeroContato) {
    if (timeoutHandle) {
        clearTimeout(timeoutHandle);  // Cancela o temporizador anterior
    }
    timeoutHandle = setTimeout(() => {
        verificarInatividade(numeroContato);
    }, TIMEOUT_INTERVAL);
}


client.on('message_create', message => {
    if (!message.fromMe) {
        const notifyName = message._data.notifyName;
        const idGupo = message._data.from;
        respostas.nomeperfil = notifyName;
        respostas.idgrupo = idGupo;
        respostas.menu = `Fala, ${notifyName}!\nDiz aí quais delícias vai querer hoje?\nEscolha algo na lista.\n1️⃣ Fazer pedido\n2️⃣ Cardápio\n3️⃣ Atendimento\nEscolha uma opção da lista.`
    }
});

client.on('qr', (qr) => {
    console.log('Escanee o QR code abaixo com o seu celular:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp está pronto!');
    const grupo = "120363319684575824@g.us";
    client.sendMessage(grupo, "[‼️] Estou online e operante");
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
function adicionarProdutoNoCart(numeroContato, lanche) {
    // Obtém o cardápio individual do contato
    const carrinho = getCardapioIndividual(numeroContato);
    // Obtém o próximo ID de produto disponível
    const novoIdProduto = carrinho.idProduto + 1;
    // Atualiza o ID do próximo produto no carrinho
    carrinho.idProduto = novoIdProduto;
    // Adiciona o lanche ao carrinho com o novo ID
    carrinho.produtos[novoIdProduto] = lanche;
    // Atualiza o carrinho no banco de dados ou onde estiver armazenado
    // Retorna o carrinho atualizado
    console.log("[!] " + lanche + " adicionado ao carrinho de: " + numeroContato)
    return carrinho;
}
// Add extra
function adicionarExtraNoCart(numeroContato, extra, quantidade) {
    // Obtém o cardápio individual do contato
    const carrinho = getCardapioIndividual(numeroContato);
    // Obtém o ID do produto atual
    const idProduto = carrinho.idProduto;

    // Verifica se o produto com o idProduto existe
    if (carrinho.produtos.hasOwnProperty(idProduto)) {
        // Se os extras para o produto ainda não existem, inicializa um objeto vazio
        if (!carrinho.extras.hasOwnProperty(idProduto)) {
            carrinho.extras[idProduto] = {};
            console.log(`[!][Inicializado] Extras para produto ID ${idProduto} inicializados.`);
        }

        // Se o extra já existe, atualiza a quantidade existente
        if (carrinho.extras[idProduto].hasOwnProperty(extra)) {
            carrinho.extras[idProduto][extra] += quantidade;
            console.log(`[!][Atualizado] ${extra} atualizado para produto ID ${idProduto} no carrinho de: ${numeroContato}. Quantidade total agora: ${carrinho.extras[idProduto][extra]}`);
        } else {
            // Se o extra não existe, adiciona o novo extra com a quantidade fornecida
            carrinho.extras[idProduto][extra] = quantidade;
            console.log(`[!][Adicionado] ${extra} adicionado ao produto ID ${idProduto} no carrinho de: ${numeroContato}. Quantidade: ${quantidade}`);
        }

        return carrinho;
    } else {
        // Se o produto não for encontrado, lança um erro
        throw new Error(`Produto com ID ${idProduto} não encontrado.`);
    }
}


// Add o preço
async function adicionarValorProdutoAoCarrinho(numeroContato, valorProdutoNovo) {
    const carrinho = getCardapioIndividual(numeroContato);
    carrinho.preco = (parseFloat(carrinho.preco) || 0) + parseFloat(valorProdutoNovo);

}

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
function resetarStatus(numeroContato) {
    //const numeroContato = message.from;
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
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
        estado.respx = 0,
        estado.cliente = '',
        estado.escolha = '',
        estado.conclusao = '',
        estado.msg = '',
        estado.batatas = 0,
        carrinho.contato = '',
        carrinho.comprador = '',
        carrinho.idPedido = '',
        carrinho.produtos = {},
        carrinho.extras = {},
        carrinho.preco = '0',
        carrinho.idProduto = 0
    console.log("[!] Dados de " + numeroContato + " foram resetados")
}
function resetarStatusMenu(numeroContato) {
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
        estado.resp11 = 0,
        estado.resp12 = 0,
        estado.resp13 = 0,
        estado.resp14 = 0,
        estado.respx = 0,
        estado.cliente = '',
        estado.escolha = '',
        estado.conclusao = '',
        estado.msg = '',
        console.log("[!] Menu de " + numeroContato + " foi resetados")
}
client.on('message_reaction', async (reaction) => {
    console.log('REACTION RECEIVED', reaction);
});

client.on('message', async (message) => {
    const numeroContato = message.from;
    const estado = getEstadoIndividual(numeroContato);
    const mensagemRecebida = removerAcentos(message.body.trim().toLowerCase());
    estado.msg = mensagemRecebida;
    const mensagemUser = estado.msg;
    estado.mensagemRecebida = true;
    /* AAAA -> (1-> parametro do seletor do switch )
      BBBB -> (10->id do lanche na mensagem de 1 a X)
      CCCC -> (10-> indice X a ser buscado no lanche escolhido) */
    if (estado.atendimento === 0) {
        iniciarAtendimento(numeroContato);
    }
    const statusConclusao = await verificarConcluido(numeroContato);
    estado.conclusao = statusConclusao;
    const carrinho = getCardapioIndividual(numeroContato);
    iniciarTimerInatividade(numeroContato);
    await avaliarmenu(numeroContato, message, mensagemUser);

    const parts = mensagemRecebida.split(' ');
    const comando = parts[0];


    // Captura respostas de enquetes
    if (message.type === 'vote_update' && idenquete) {
        const pollResponse = message.pollResponse;
        if (pollResponse) {
            console.log('Resposta ao poll recebida:', pollResponse);
            // Poll response é um array de opções escolhidas
            const respostaEscolhida = pollResponse.selectedOptions.map(option => option.name).join(', ');
            console.log(`Você escolheu: ${respostaEscolhida}`);
            return; // Não processar mais mensagens
        }
    }

    switch (parts.length) {
        case 1:
            // Comandos simples que não têm parâmetros adicionais
            switch (comando) {
                case 'car':
                    // Obtenha o carrinho do contato
                    const carrinho = getCardapioIndividual(numeroContato);
                    // Inicialize a mensagem
                    let mensagem = 'Seu pedido                     xxxxxxx\n\n';
                    // Adicione detalhes do pedido
                    mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                    // Itera sobre os produtos e seus extras
                    for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                        mensagem += `*${produto}*\n`;

                        // Verifica se há extras para o produto
                        if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                            Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                                mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                            });
                        } else {
                            mensagem += `  *↳ Nenhum extra*\n`;
                        }
                    }
                    // Adiciona detalhes de pagamento
                    mensagem += '\n*Pagamento*\n';
                    mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                    mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                    mensagem += `total                        *R$* ${carrinho.total + 1}\n`;

                    // Envia a mensagem com os detalhes formatados
                    setTimeout(() => {
                        client.sendMessage(numeroContato, mensagem);
                    }, 500);
                    break
                case 'menu':
                    avaliarrespx(numeroContato, message);
                    resetarStatusMenu(numeroContato);
                    break;
                case '0':
                    avaliarresp0(numeroContato, message);
                    break
                case '1':
                    avaliarresp1(numeroContato, message);
                    break;
                case '2':
                    avaliarresp2(numeroContato, message);
                    break;
                case '3':
                    avaliarresp3(numeroContato, message);
                    break;
                case '4':
                    avaliarresp4(numeroContato, message);
                    break;
                case '5':
                    avaliarresp5(numeroContato, message);
                    break;
                case '6':
                    avaliarresp6(numeroContato, message);
                    break;
                case '7':
                    avaliarresp7(numeroContato, message);
                    break;
                case '8':
                    avaliarresp8(numeroContato, message);
                    break;
                case '9':
                    avaliarresp9(numeroContato, message);
                    break;
                case '10':
                    avaliarresp10(numeroContato, message);
                    break;
                case '11':
                    avaliarresp11(numeroContato, message);
                    break;
                case '/reload':
                    require('child_process').exec('pm2 restart Everton', (err, stdout, stderr) => {
                        if (err) {
                            console.error(`Erro ao reiniciar o bot: ${err}`);
                            message.reply(`[!] Erro ao reiniciar o bot: ${err}`);
                            return;
                        }

                        // Enviar a resposta de que o bot está reiniciando
                        message.reply('Bot reiniciando...').then(() => {
                            // Usar setTimeout para aguardar alguns segundos antes de confirmar a reinicialização
                            setTimeout(() => {
                                require('child_process').exec('pm2 status Everton', (statusErr, statusStdout, statusStderr) => {
                                    if (statusErr) {
                                        console.error(`Erro ao verificar o status do bot: ${statusErr}`);
                                        message.reply(`[!] Erro ao verificar o status do bot: ${statusErr}`);
                                    } else {
                                        // Verificar se o bot está ativo após o reinício
                                        if (statusStdout.includes('online')) {
                                            message.reply('[!] Bot reiniciado');
                                        } else {
                                            message.reply('[!] Bot não reiniciado corretamente');
                                        }
                                    }
                                });
                            }, 2000); // Ajustar o atraso conforme necessário para garantir que o bot tenha tempo para reiniciar
                        });
                    });

                    break;
                case '/id':
                    client.sendMessage(numeroContato, "Pegando o id do seu grupo");
                    message.reply("ID: " + respostas.idgrupo);
                    break
                case '/enquete':
                    const messageSecret = [
                        1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ];
                    const pollMsg = await message.reply(
                        new Poll('Cats or Dogs?', ['Cats', 'Dogs'], {
                            messageSecret: messageSecret
                        })
                    );
                    // Armazenar o ID da enquete na variável `idenquete`
                    idenquete = pollMsg.id._serialized;
                    console.log('Enquete criada:', idenquete);
                    console.log(pollMsg)
                    break;
                case '/resposta':
                    const idEnquete = idenquete; // ID da enquete que você deseja verificar
                    const chat = await client.getChatById(message.from);
                    const mensagens = await chat.fetchMessages({ limit: 100 }); // Ajuste o limite conforme necessário

                    let encontrou = false;
                    for (const msg of mensagens) {
                        if (msg.id._serialized === idEnquete) {
                            console.log('Enquete encontrada:', msg);
                            encontrou = true;
                            break;
                        }
                    }

                    if (!encontrou) {
                        console.log('Enquete não encontrada.');
                    }
                    break;
                default:
                    message.reply('Comando não reconhecido.');
                    break;
            }
            break;
        default:
            // Comandos que podem ter parâmetros adicionais
            switch (comando) {
                case '/teste':
                    if (parts.length === 4) {
                        let param1 = parts[1] === 'null' ? null : parseInt(parts[1], 10); // Converte "null" para null e string numérica para número
                        let param2 = parts[2] === 'null' ? null : parseInt(parts[2], 10);
                        const param3 = parts[3] === 'null' ? null : parseInt(parts[3], 10);

                        console.log(`Parâmetros recebidos: param1=${param1}, param2=${param2}, param3=${param3}`);

                        try {
                            const retorno = await pegarRetorno(numeroContato, client, param1, param2, param3, estado, carrinho);
                            console.log(`Valor retornado pela função pegarRetorno: ${retorno}`);
                            message.reply(retorno);
                        } catch (error) {
                            console.error('Erro ao obter o retorno:', error);
                            message.reply(`Erro ao obter o retorno: ${error.message}`);
                        }
                    } else {
                        message.reply('Formato incorreto. Use: /teste X X X');
                    }
                    break;
                case '/gpedidos':
                    if (parts.length === 2) {
                        let param1 = parts[1];
                        console.log(`[!] Id do grupo: param1=${param1}`);

                        try {
                            const mensagemRetorno = await atualizarIdGrupo(param1);
                            message.reply(mensagemRetorno);
                        } catch (error) {
                            console.error('Erro ao obter o retorno:', error);
                            message.reply(`Erro ao obter o retorno: ${error.message}`);
                        }
                    } else {
                        message.reply(`Formato incorreto. Use: /gpedidos [idgrupo]\n*>>* Para pegar o ID, me adicione no grupo e envie */id* e eu te enviarei o id de seu grupo`);
                    }
                    break;
                case '/gajuda':
                    if (parts.length === 2) {
                        let param1 = parts[1];
                        console.log(`[!] Id do grupo: param1=${param1}`);

                        try {
                            const mensagemRetorno = await atualizarIdSuporte(param1);
                            message.reply(mensagemRetorno);
                        } catch (error) {
                            console.error('Erro ao obter o retorno:', error);
                            message.reply(`Erro ao obter o retorno: ${error.message}`);
                        }
                    } else {
                        message.reply(`Formato incorreto. Use: /gajuda [idgrupo]\n*>>* Para pegar o ID, me adicione no grupo e envie */id* e eu te enviarei o id de seu grupo`);
                    }
                    break;
                default:
                    message.reply('Comando não reconhecido ou formato incorreto.');
                    break;
            }

    }
});

async function avaliarmenu(numeroContato, message, mensagemUser) {
    const estado = getEstadoIndividual(numeroContato);
    switch (estado.conclusao) {
        case 'sim':
            console.log("[!] " + numeroContato + " -> Endereço cadastrado")
            break;
        case 'nao':
            const ignorarPadrao = /status@broadcast|@g\.us$/;
            if (ignorarPadrao.test(numeroContato)) {
                return; // A execução da função é interrompida aqui
            }

            console.log("[!] " + numeroContato + " -> Endereço não cadastrado")
            const respostaCadastro = await cadastroEndereco(numeroContato, mensagemUser, respostas);
            if (respostaCadastro) {
                client.sendMessage(numeroContato, respostaCadastro);
            }
            break;
    }
}

async function avaliarrespx(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.respx) {
        case 0: // Manda o menu do cardápio
            await client.sendMessage(numeroContato, respostas.menu);
            estado.resp1 = 1;
            estado.resp2 = 1;
            estado.resp3 = 1;
            break;
        case 1: // Menu do cardapio de sandubas
            try {
                const retorno = await pegarRetorno(numeroContato, client, 13, null, null, estado, carrinho);
                message.reply(retorno);
                estado.resp1 = 3;
                estado.resp2 = 6;
                estado.resp3 = 3;
                estado.resp4 = 2;
                estado.resp5 = 2;
                estado.resp6 = 3;
                estado.resp7 = 1;
                estado.resp8 = 1;
                estado.resp9 = 1;
                estado.resp10 = 1;
                estado.resp11 = 1;

            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break;
        case 2: // Extras do MISTO
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 1, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 1, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1;
                estado.resp1 = 5;
                estado.resp2 = 5;
                estado.resp3 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 3: // Extras do Hamburguer
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 2, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 2, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 7; // Carne
                estado.resp2 = 7; // Tomate
                estado.resp3 = 2; // Alface
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 4: // Extras do X-Burguer
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 3, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 8; // Carne
                estado.resp2 = 8; // Queijo
                estado.resp3 = 4; // Presunto
                estado.resp4 = 1; // Tomate
                estado.resp5 = 1; // Alface

            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 5: // Extras do X-Eggs
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 4, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 4, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 9; // Carne
                estado.resp2 = 9; // Ovo
                estado.resp3 = 5; // Queijo
                estado.resp4 = 3; // Presunto
                estado.resp5 = 1; // Tomate
                estado.resp6 = 1; // Alface

            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 6: // Extras do X-Calabresa
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 5, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 5, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 10; // Carne
                estado.resp2 = 10; // Ovo
                estado.resp3 = 6; // Queijo
                estado.resp4 = 4; // Presunto
                estado.resp5 = 3; // Tomate
                estado.resp6 = 2; // Alface

            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 7: // Extras do X-Frango
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 6, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 6, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 11; // Carne
                estado.resp2 = 11; // Ovo
                estado.resp3 = 7; // Queijo
                estado.resp4 = 5; // Presunto
                estado.resp5 = 4; // Tomate
                estado.resp6 = 4; // Alface

            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 8: // Extras do Burguer Especial
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 7, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 7, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 12; // Carne
                estado.resp2 = 12; // Ovo
                estado.resp3 = 8; // Queijo
                estado.resp4 = 6; // Presunto
                estado.resp5 = 5; // Tomate
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 9: // Extras do X-Eggs Bacon
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 8, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 13; // Carne
                estado.resp2 = 13; // Ovo
                estado.resp3 = 9; // Queijo
                estado.resp4 = 7; // Presunto
                estado.resp5 = 6; // Tomate
                estado.resp6 = 5;
                estado.resp7 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 10: // Extras do X-Tudo
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 9, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 14; // Carne
                estado.resp2 = 14; // Calabresa
                estado.resp3 = 10; // Bacon
                estado.resp4 = 8; // Queijo
                estado.resp5 = 7; // Presunto
                estado.resp6 = 6; // Ovo
                estado.resp7 = 3; // Frango
                estado.resp8 = 3; // Tomate
                estado.resp9 = 2; // Alface
                estado.resp10 = 2; // Milho
                estado.resp11 = 2; // Batata Palha
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 11: // Extras do Especial Burguer Top 10
            try {
                const retorno = await pegarRetorno(numeroContato, client, 33, null, 10, estado, carrinho);
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                message.reply("*Extras disponíveis para seu* *" + retorno1 + "*\n\n" + retorno + "\n0️⃣ Voltar");
                estado.resp0 = 1; // Menu inicial //
                estado.resp1 = 15; // Carne
                estado.resp2 = 15; // Calabresa
                estado.resp3 = 11; // Bacon
                estado.resp4 = 9; // Queijo
                estado.resp5 = 8; // Presunto
                estado.resp6 = 7; // Ovo
                estado.resp7 = 4; // Frango
                estado.resp8 = 3; // Tomate
                estado.resp9 = 3; // Alface
                estado.resp10 = 3; // Milho
                estado.resp11 = 3; // Batata Palha
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
                message.reply("Algo deu errado!! Estou avisando ao meu chefe o erro. Desculpa")
            }
            break
        case 12: // Menu do cardapio de pizza especial
            try {
                const retorno = await pegarRetorno(numeroContato, client, 14, null, null, estado, carrinho);
                message.reply(retorno);
                estado.resp1 = 19;
                estado.resp2 = xx;
                estado.resp3 = xx;
                estado.resp4 = xx;
                estado.resp5 = xx;
                estado.resp6 = xx;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 13: // Menu do cardapio de pizza tradicional
            try {
                const retorno = await pegarRetorno(numeroContato, client, 15, null, null, estado, carrinho);
                message.reply(retorno);
                estado.resp1 = xx;
                estado.resp2 = xx;
                estado.resp3 = xx;
                estado.resp4 = xx;
                estado.resp5 = xx;
                estado.resp6 = xx;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 14: // Confirmar qualquer pedido
            // Confirmar o pedido e enviar No pv ou grupo 
            try {
                const carrinho = getCardapioIndividual(numeroContato);
                // Inicialize a mensagem
                let mensagem = '┌─── Pedido recebido ───┐\n\n';
                // Adicione detalhes do pedido
                mensagem += `ID do Pedido:      ${carrinho.idPedido}\n`
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                // Itera sobre os produtos e seus extras
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `\n*${produto}*\n`;

                    // Verifica se há extras para o produto
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += `\n└─── Pedido recebido ───┘`
                const idGrupo = await obterIdGrupo();
                //.log('ID do grupo atual:', idGrupo);
                client.sendMessage(idGrupo, mensagem)
                client.sendMessage(numeroContato, "Pedido confirmado e enviado, basta aguardar. Qualquer atualização. Você será avisado aqui.");
                resetarStatus(numeroContato);
            } catch (error) {
                console.error('Erro ao obter o ID do grupo:', error);
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp0(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp0) {
        case 0:
            avaliarrespx(numeroContato, message);
        case 1: // Não quer nada, quer voltar ao cardapio com todos os item da loja
            message.reply(respostas.maisAlgoPedido);
            estado.resp1 = 1;
            estado.resp2 = 1;
            estado.resp3 = 1;
            break
        case 2: // Voltar do menu de ver as bebidas da loja MENU-> 2 -> 5
            message.reply(respostas.cardapiover);
            estado.respx = 12;
            estado.resp1 = 16; // Ver cardapio dos sanduiches
            estado.resp2 = 16; // Ver cardapio das pizzas que tem 
            estado.resp3 = 12; // Ver cardapio dos açaí
            estado.resp4 = 10; // Ver cardapio das batatas
            estado.resp5 = 9; // Ver cardapio das Bebidas
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
    }
}
async function avaliarresp1(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp1) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Menu do cardapio de produtos existente
            estado.respx = 1;
            estado.resp1 = 2;
            estado.resp2 = 18;
            estado.resp4 = 13;
            await client.sendMessage(numeroContato, respostas.cardapio);
            break
        case 2: // Chamada do respx
            avaliarrespx(numeroContato, message);
            break
        case 3: // Pegar o Misto da lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 1, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 1, estado, carrinho);// Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply("Perfeito, o produto " + retorno1 + " foi adicionado ao seu pedido.");
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 2;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 4: // Chamada do respx
            avaliarrespx(numeroContato, message);
            break
        case 5: // Adicionando o extra no carrinho (Misto)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, "1", estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 1, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 1, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 2;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 6: // Confirmar o pedido e enviar No pv ou grupo 
            try {
                const carrinho = getCardapioIndividual(numeroContato);
                // Inicialize a mensagem
                let mensagem = '┌─── Pedido recebido ───┐\n\n';
                // Adicione detalhes do pedido
                mensagem += `ID do Pedido:       ${carrinho.idPedido}\n`
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                // Itera sobre os produtos e seus extras
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `\n*${produto}*\n`;

                    // Verifica se há extras para o produto
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += `└─── Pedido recebido ───┘`
                const idGrupo = await obterIdGrupo();
                //.log('ID do grupo atual:', idGrupo);
                client.sendMessage(idGrupo, mensagem)
                client.sendMessage(numeroContato, "Pedido confirmado e enviado, basta aguardar. Qualquer atualização. Você será avisado aqui.");
                resetarStatus(numeroContato);
            } catch (error) {
                console.error('Erro ao obter o ID do grupo:', error);
            }
            break
        case 7: // Adicionando o extra carne (Hamburguer)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 2, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 2, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 2, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 3;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 8: // Adicionando o extra carne (X-Burguer)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 3, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 3, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 4;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 9: // Adicionando o extra carne (X-Eggs)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 4, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 4, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 4, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 5;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 10: // Adicionando o extra carne (X-Calabresa)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 5, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 5, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 5, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 6;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 11: // Adicionando o extra carne (X-Frango)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 6, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 6, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 6, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 7;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 12: // Adicionando o extra carne (Burguer Especial)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 7, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 7, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 7, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 8;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 13: // Adicionando o extra carne (X-Eggs Bacon)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 8, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 8, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 9;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 14: // Adicionando o extra carne (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 15: // Adicionando o extra carne (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4; // Chamar RESPX quando digitar->Mais algo no hamburguer
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 16: // Ver cardapio dos sanduiches 
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 2, null, null, estado, carrinho); // Nome do lanche
                message.reply(`*Nossos sanduíches*\n\n${retorno1}`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.voltar);
                    estado.resp0 = 2;
                    estado.respx = 0;
                    estado.resp1 = 1000;
                    estado.resp2 = 1000;
                    estado.resp3 = 1000;
                    estado.resp4 = 1000;
                    estado.resp5 = 1000;
                }, 500);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 17: // Pizza especial
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 8, null, null, estado, carrinho); // Nome do lanche
                message.reply(`*Nossas pizzas especiais*\n\n${retorno1}`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.voltar);
                    estado.resp0 = 2;
                    estado.respx = 0;
                    estado.resp1 = 1000;
                    estado.resp2 = 1000;
                    estado.resp3 = 1000;
                    estado.resp4 = 1000;
                    estado.resp5 = 1000;
                }, 500);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 18: // Mostrar as Pizza especial Muda ID para o comando
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 8, null, null, estado, carrinho); // Nome do lanche
                message.reply(`*Nossas pizzas especiais*\n\n${retorno1}`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, `0️⃣ Menu anterior`);
                    estado.resp0 = 2;
                    estado.respx = 0;
                    estado.resp1 = 19;
                    estado.resp2 = 22;
                    estado.resp3 = 15;
                    estado.resp4 = 11;
                    estado.resp5 = 10;
                    estado.resp6 = 8;
                }, 500);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 19: // Pizza de ATUM
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 1, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam1);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 20; // Pizza P
                estado.resp2 = 20; // Pizza M
                estado.resp3 = 13; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 20: // Add pizza de atum e tamanho P no carrinho 
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 1, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 1, 1, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 21: // Perguntar se quer mais algo no pedido
            estado.respx = 14;
            estado.resp1 = 1;
            estado.resp2 = 21;
            estado.resp3 = 1000;
            client.sendMessage(numeroContato, respostas.maisAlgoPedido);
            break
        case 22: // Add pizza de carne seca e tamanho P no carrinho
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 2, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 1, 2, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 23: // add pizza de Strogonoff P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 3, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 1, 3, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 24: // Pizza de FranBacon  P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 4, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 1, 4, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 25: // Pizza de Bancon Cheddar  P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 5, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 1, 5, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 26: // Pizza de Calabresa Cheddar P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 6, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 1, 6, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 27: // Pizza de calabresa
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 1, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 28; // Pizza P
                estado.resp2 = 29; // Pizza M
                estado.resp3 = 21; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 28: // Pizza de clabresa P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 1, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 1, 1, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 29: // Pizza Mista P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 2, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 1, 2, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 30: // Pizza 4 Queijo P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 3, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 1, 3, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 31: // Pizza de Bacon P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 4, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 1, 4, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 32: // Pizza de Frango P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 5, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 1, 5, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 33: // Pizza Portuguesa P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 6, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 1, 6, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 34: // Pizza Frango Catupiry P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 7, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 1, 7, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 1, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 35: // Batata P
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 6, null, 1, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 21, null, 1, estado, carrinho);
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora, escolha o que deseja acrescentar à batata.\nVocê pode escolher 2 itens\n" + retorno2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 36; // Calabresa 1/2
                estado.resp2 = 36; // Cheddar 1/2
                estado.resp3 = 28; // Bacon 1/2
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 36: // Loop dos adicionais Batata P
            switch (estado.batatas) {
                case 0: // Primeiro adicional
                    try {
                        const retorno1 = await pegarRetorno(numeroContato, client, 6, null, 1, estado, carrinho);// Nome do  lanche
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 1, 1, estado, carrinho); // Extra selecionado
                        const retorno3 = await pegarRetorno(numeroContato, client, 21, null, 1, estado, carrinho); // Adicionais disponivel
                        const retorno4 = await pegarRetorno(numeroContato, client, 37, null, 1, estado, carrinho);// preço da batata                     
                        adicionarProdutoNoCart(numeroContato, retorno1); // Nome ADD cart
                        adicionarValorProdutoAoCarrinho(numeroContato, retorno4); // Preço ADD cart
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ".");
                        setTimeout(() => {
                            client.sendMessage(numeroContato, "Escolha o segundo adicional.\n" + retorno3);
                        }, 500);
                        estado.respx = 1000;
                        estado.batatas = 1;
                        estado.resp1 = 36; // Calabresa 1/2
                        estado.resp2 = 36; // Cheddar 1/2
                        estado.resp3 = 28; // Bacon 1/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
                case 1: // Segundo adicional
                    try {
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 1, 1, estado, carrinho); // Extra selecionado                
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ". Confira seu pedido e confirme se está tudo certo antes de confirmá-lo.");
                        let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                        mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                        for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                            mensagem += `*${produto}*\n`;
                            if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                                Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                                    mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                                });
                            } else {
                                mensagem += `  *↳ Nenhum extra*\n`;
                            }
                        }
                        mensagem += '\n*Pagamento*\n';
                        mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                        mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                        mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                        setTimeout(() => {
                            client.sendMessage(numeroContato, mensagem);
                            setTimeout(() => {
                                client.sendMessage(numeroContato, respostas.maisAlgoPedido);
                            }, 200);
                        }, 500);
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
            }
            break
        case 37: // Loop dos adicionais Batata M
            switch (estado.batatas) {
                case 0: // Primeiro adicional
                    try {
                        const retorno1 = await pegarRetorno(numeroContato, client, 6, null, 2, estado, carrinho);// Nome do  lanche
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 1, 2, estado, carrinho); // Extra selecionado
                        const retorno3 = await pegarRetorno(numeroContato, client, 21, null, 2, estado, carrinho); // Adicionais disponivel
                        const retorno4 = await pegarRetorno(numeroContato, client, 37, null, 2, estado, carrinho);// preço da batata                     
                        adicionarProdutoNoCart(numeroContato, retorno1); // Nome ADD cart
                        adicionarValorProdutoAoCarrinho(numeroContato, retorno4); // Preço ADD cart
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ".");
                        setTimeout(() => {
                            client.sendMessage(numeroContato, "Escolha o segundo adicional.\n" + retorno3);
                        }, 500);
                        estado.respx = 1000;
                        estado.batatas = 1;
                        estado.resp1 = 36; // Calabresa 1/2
                        estado.resp2 = 36; // Cheddar 1/2
                        estado.resp3 = 28; // Bacon 1/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
                case 1: // Segundo adicional
                    try {
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 1, 2, estado, carrinho); // Extra selecionado                
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ". Confira seu pedido e confirme se está tudo certo antes de confirmá-lo.");
                        let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                        mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                        for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                            mensagem += `*${produto}*\n`;
                            if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                                Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                                    mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                                });
                            } else {
                                mensagem += `  *↳ Nenhum extra*\n`;
                            }
                        }
                        mensagem += '\n*Pagamento*\n';
                        mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                        mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                        mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                        setTimeout(() => {
                            client.sendMessage(numeroContato, mensagem);
                            client.sendMessage(numeroContato, respostas.maisAlgoPedido);
                        }, 500);
                        estado.respx = 14;
                        estado.batatas = 0;
                        estado.resp1 = 1; // Calabresa 2/2
                        estado.resp2 = 21; // Cheddar 2/2
                        estado.resp3 = 1000; // Bacon 2/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp2(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp2) {
        case 0:
            avaliarrespx(numeroContato, message);
            break
        case 1: // Manda o cardápio de leitura para os produtos da lanchonete
            await client.sendMessage(numeroContato, respostas.cardapiover);
            estado.respx = 12;
            estado.resp1 = 16; // Ver cardapio dos sanduiches
            estado.resp2 = 16; // Ver cardapio das pizzas que tem 
            estado.resp3 = 12; // Ver cardapio dos açaí
            estado.resp4 = 10; // Ver cardapio das batatas
            estado.resp5 = 9; // Ver cardapio das Bebidas
            break;
        case 2: // Recusa de algum extra
            message.reply(respostas.maisAlgoPedido);
            estado.resp1 = 1;
            estado.resp2 = 3;
            estado.respx = 1000;
            break;
        case 3: // Manda o carrinho depois de recusar tudo
            message.reply(respostas.verCarrinho);
            let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
            mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
            for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                mensagem += `*${produto}*\n`;
                if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                    Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                        mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                    });
                } else {
                    mensagem += `  *↳ Nenhum extra*\n`;
                }
            }
            mensagem += '\n*Pagamento*\n';
            mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
            mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
            mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
            setTimeout(() => {
                client.sendMessage(numeroContato, mensagem);
                client.sendMessage(numeroContato, respostas.confimacao);
                estado.resp1 = 6;
                estado.resp2 = 4;
            }, 1000);
            break;
        case 4: // Cancelamento do pedido
            message.reply(respostas.cancelar);
            resetarStatus(numeroContato);
            break;
        case 5: // Presunto como extra do misto
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 1, estado, carrinho); // Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 1, estado, carrinho); // Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 1, null, estado, carrinho); // Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`);
                estado.respx = 2;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break;
        case 6: // Pegar o Hamburguer na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 2, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 2, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 3;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break;
        case 7: // Adicionando o extra tomate (Hamburguer)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 2, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 2, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 2, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 3;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 8: // Adicionando o extra Queijo (X-Burguer)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 3, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 3, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 4;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 9: // Adicionando o extra Ovo (X-Eggs)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 4, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 4, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 5;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 10: // Adicionando o extra Calabresa (X-Calabresa)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 5, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 5, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 5, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 6;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 11: // Adicionando o extra Calabresa (X-Frango)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 6, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 6, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 6, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 7;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 12: // Adicionando o extra Calabresa (Burguer Especial)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 7, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 7, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 7, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 8;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 13: // Adicionando o extra Calabresa (X-Eggs Bacon)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 8, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 8, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 9;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 14: // Adicionando o extra Calabresa (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 15: // Adicionando o extra Calabresa (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 2, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 2, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 16: // Ver cardapio das pizzas que tem 
            message.reply(respostas.pizzasTipos);
            estado.resp1 = 17; // Pizza especial
            estado.resp2 = 17; // Pizza tradicional
            estado.resp3 = 1000;
            estado.resp4 = 1000;
            estado.resp5 = 1000;
            break
        case 17: // Ver as pizzas tradicionais
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 9, null, null, estado, carrinho); // Nome do lanche
                message.reply(`*Nossas pizzas tradicionais*\n\n${retorno1}`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.voltar);
                    estado.resp0 = 2;
                    estado.respx = 0;
                    estado.resp1 = 1000;
                    estado.resp2 = 1000;
                    estado.resp3 = 1000;
                    estado.resp4 = 1000;
                    estado.resp5 = 1000;
                }, 500);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 18: // Ver cardapio das pizzas que tem
            message.reply(respostas.pizzasTipos);
            estado.respx = 12;
            estado.resp1 = 18; // Pizza especial
            estado.resp2 = 19; // Pizza tradicional
            break
        case 19: // Mostrar as Pizza especial Muda ID para o comando
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 9, null, null, estado, carrinho); // Nome do lanche
                message.reply(`*Nossas pizzas tradicionais*\n\n${retorno1}`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, `0️⃣ Menu anterior`);
                    estado.resp0 = 2;
                    estado.respx = 0;
                    estado.resp1 = 27;
                    estado.resp2 = 28;
                    estado.resp3 = 20;
                    estado.resp4 = 12;
                    estado.resp5 = 11;
                    estado.resp6 = 9;
                    estado.resp7 = 5;
                }, 500);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 20: // Add pizza de atum e tamanho M no carrinho 
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 1, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 2, 1, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 21: // Recusar mais nada e confirmar pedido
            avaliarrespx(numeroContato, message);
            break
        case 22: // Pizza de carne seca
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 2, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam1);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 22; // Pizza P
                estado.resp2 = 23; // Pizza M
                estado.resp3 = 14; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 23: // add pizza de carne seca M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 2, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 2, 2, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 24: // add pizza de Strogonoff M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 3, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 2, 3, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 25: // Pizza de FranBacon M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 4, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 2, 4, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 26: // Pizza de Bacon Cheddar M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 5, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 2, 5, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 27: // Pizza de Calabresa Cheddar M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 6, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 2, 6, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 28: // Pizza Portuguesa
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 2, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 29; // Pizza P
                estado.resp2 = 30; // Pizza M
                estado.resp3 = 22; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 29: // Pizza Calabresa M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 1, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 2, 1, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 30: // Pizza Mista M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 2, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 2, 2, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 31: // Pizza 4 Queijos M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 3, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 2, 3, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 32: // Pizza de Bacon M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 4, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 2, 4, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 33: // Pizza de Frango M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 5, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 2, 5, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 34: // Pizza Portuguesa M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 6, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 2, 6, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 35: // Pizza Frango Catupiry M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 7, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 2, 7, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 2, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 36: // Loop dos adicionais Batata P
            switch (estado.batatas) {
                case 0: // Primeiro adicional
                    try {
                        const retorno1 = await pegarRetorno(numeroContato, client, 6, null, 1, estado, carrinho);// Nome do  lanche
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 2, 1, estado, carrinho); // Extra selecionado
                        const retorno3 = await pegarRetorno(numeroContato, client, 21, null, 1, estado, carrinho); // Adicionais disponivel
                        const retorno4 = await pegarRetorno(numeroContato, client, 37, null, 1, estado, carrinho);// preço da batata                     
                        adicionarProdutoNoCart(numeroContato, retorno1); // Nome ADD cart
                        adicionarValorProdutoAoCarrinho(numeroContato, retorno4); // Preço ADD cart
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ".");
                        setTimeout(() => {
                            client.sendMessage(numeroContato, "Escolha o segundo adicional.\n" + retorno3);
                        }, 500);
                        estado.respx = 1000;
                        estado.batatas = 1;
                        estado.resp1 = 36; // Calabresa 1/2
                        estado.resp2 = 36; // Cheddar 1/2
                        estado.resp3 = 28; // Bacon 1/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
                case 1: // Segundo adicional
                    try {
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 2, 1, estado, carrinho); // Extra selecionado                
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ".");
                        setTimeout(() => {
                            client.sendMessage(numeroContato, respostas.maisAlgoPedido);
                        }, 500);
                        estado.respx = 14;
                        estado.batatas = 0;
                        estado.resp1 = 1; // Calabresa 2/2
                        estado.resp2 = 21; // Cheddar 2/2
                        estado.resp3 = 1000; // Bacon 2/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
            }
            break
        case 37: // Batata M
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 6, null, 2, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 21, null, 2, estado, carrinho);
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora, escolha o que deseja acrescentar à batata.\nVocê pode escolher 2 itens\n" + retorno2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 37; // Calabresa 1/2
                estado.resp2 = 38; // Cheddar 1/2
                estado.resp3 = 29; // Bacon 1/2
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 38: // Loop dos adicionais Batata M
            switch (estado.batatas) {
                case 0: // Primeiro adicional
                    try {
                        const retorno1 = await pegarRetorno(numeroContato, client, 6, null, 2, estado, carrinho);// Nome do  lanche
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 2, 2, estado, carrinho); // Extra selecionado
                        const retorno3 = await pegarRetorno(numeroContato, client, 21, null, 2, estado, carrinho); // Adicionais disponivel
                        const retorno4 = await pegarRetorno(numeroContato, client, 37, null, 2, estado, carrinho);// preço da batata                     
                        adicionarProdutoNoCart(numeroContato, retorno1); // Nome ADD cart
                        adicionarValorProdutoAoCarrinho(numeroContato, retorno4); // Preço ADD cart
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ".");
                        setTimeout(() => {
                            client.sendMessage(numeroContato, "Escolha o segundo adicional.\n" + retorno3);
                        }, 500);
                        estado.respx = 1000;
                        estado.batatas = 1;
                        estado.resp1 = 36; // Calabresa 1/2
                        estado.resp2 = 36; // Cheddar 1/2
                        estado.resp3 = 28; // Bacon 1/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
                case 1: // Segundo adicional
                    try {
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 2, 2, estado, carrinho); // Extra selecionado                
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ". Confira seu pedido e confirme se está tudo certo antes de confirmá-lo.");
                        let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                        mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                        for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                            mensagem += `*${produto}*\n`;
                            if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                                Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                                    mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                                });
                            } else {
                                mensagem += `  *↳ Nenhum extra*\n`;
                            }
                        }
                        mensagem += '\n*Pagamento*\n';
                        mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                        mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                        mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                        setTimeout(() => {
                            client.sendMessage(numeroContato, mensagem);
                            setTimeout(() => {
                                client.sendMessage(numeroContato, respostas.maisAlgoPedido);
                            }, 200);
                        }, 500);
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

async function avaliarresp3(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp3) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Mandando o atendimento ao cliente
            const propriedades = ['resp1', 'resp2', 'resp4', 'resp5', 'resp6', 'resp7', 'resp8', 'resp9', 'resp10'];
            propriedades.forEach(prop => {
                estado[prop] = 999;
            });
            await client.sendMessage(numeroContato, respostas.atendimento);
            const formatar = "@";
            const formatado = numeroContato.split(formatar)[0];
            let mensagem = '┌─── Pedido de atendimento ───┐\n';
            // Adicione detalhes do pedido
            mensagem += `*▸* *Contato:* ${formatado}\n`
            mensagem += `▸ Alguém poderia entrar em contato com esse cliente? Por favor, ele está possivelmente com alguma dúvida.\n`;
            mensagem += `└─── Pedido de atendimento ───┘`
            const idGrupo = await obterIdGrupo();
            //.log('ID do grupo atual:', idGrupo);
            client.sendMessage(idGrupo, mensagem)
            break;
        case 2: // Alface do hamburguer
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 2, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 2, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 3;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 3: // Pegar o X-Burguer na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 3, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 4;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break;
        case 4: // Adicionando o extra Presunto (X-Burguer)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 3, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 3, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 4;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 5: // Adicionando o extra Queijo (X-eggs)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 4, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 4, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 5;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 6: // Adicionando o extra Queijo (X-Calabresa)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 5, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 5, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 3, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 6;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 7: // Adicionando o extra Queijo (X-Frango)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 6, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 6, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 6, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 7;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 8: // Adicionando o extra Queijo (Burguer Especial)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 7, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 7, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 7, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 8;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 9: // Adicionando o extra Queijo (X-Eggs Bacon)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 8, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 8, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 9;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 10: // Adicionando o extra Queijo (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 11: // Adicionando o extra Queijo (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 3, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 3, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 12: // Ver todos os açaí
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 12, null, null, estado, carrinho); // Nome do lanche
                message.reply(`*Açaís disponíveis*\n\n${retorno1}`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.voltar);
                    estado.resp0 = 2;
                    estado.respx = 0;
                    estado.resp1 = 1000;
                    estado.resp2 = 1000;
                    estado.resp3 = 1000;
                    estado.resp4 = 1000;
                    estado.resp5 = 1000;
                }, 500);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 13: // Add pizza de atum e tamanho G no carrinho 
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 1, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 3, 1, estado, carrinho); // Tamanho G
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 14: // Pizza de carne seca G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 2, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 3, 2, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 15: // Pizza de Strogonoff
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 3, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam1);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 23; // Pizza P
                estado.resp2 = 24; // Pizza M
                estado.resp3 = 16; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 16: // Pizza de strogonoff G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 3, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 3, 3, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 17: // Pizza de FranBacon  G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 4, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 3, 4, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 18: // Pizza de Bacon Cheddar G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 5, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 3, 5, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 19: // Pizza de Calabresa Cheddar G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 6, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 34, 3, 6, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 20: // Pizza 3 Queijos
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 3, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 30; // Pizza P
                estado.resp2 = 31; // Pizza M
                estado.resp3 = 23; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 21: // Pizza calabresa G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 1, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 3, 1, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 22: // Pizza Mista G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 2, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 3, 2, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 23: // Pizza 4 Queijos G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 3, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 3, 3, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 24: // Pizza de Bacon G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 4, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 3, 4, estado, carrinho); // Tamanho M
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 25: // Pizza de Frango G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 5, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 3, 5, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 5, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 26: // Pizza Portuguesa G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 6, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 3, 6, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 27: // Pizza Frango Catupiry G
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 7, null, estado, carrinho);// Nome do  lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 35, 3, 7, estado, carrinho); // Tamanho P
                const retorno3 = await pegarRetorno(numeroContato, client, 36, 3, 1, estado, carrinho); // Tamanho da Pizza
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarExtraNoCart(numeroContato, retorno3, 1);
                message.reply(respostas.verCarrinho);
                let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                    mensagem += `*${produto}*\n`;
                    if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                        Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                            mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                        });
                    } else {
                        mensagem += `  *↳ Nenhum extra*\n`;
                    }
                }
                mensagem += '\n*Pagamento*\n';
                mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                client.sendMessage(numeroContato, mensagem);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.confimacao);
                    estado.resp1 = 21;
                    estado.resp2 = 4;
                    estado.resp3 = 1000;
                }, 1000);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 28: // Loop dos adicionais Batata P
            console.log(estado.batatas)
            switch (estado.batatas) {
                case 0: // Primeiro adicional
                    try {
                        const retorno1 = await pegarRetorno(numeroContato, client, 6, null, 1, estado, carrinho);// Nome do  lanche
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 3, 1, estado, carrinho); // Extra selecionado
                        const retorno3 = await pegarRetorno(numeroContato, client, 21, null, 1, estado, carrinho); // Adicionais disponivel
                        const retorno4 = await pegarRetorno(numeroContato, client, 37, null, 1, estado, carrinho);// preço da batata                     
                        adicionarProdutoNoCart(numeroContato, retorno1); // Nome ADD cart
                        adicionarValorProdutoAoCarrinho(numeroContato, retorno4); // Preço ADD cart
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ".");
                        setTimeout(() => {
                            client.sendMessage(numeroContato, "Escolha o segundo adicional.\n" + retorno3);
                        }, 500);
                        estado.respx = 1000;
                        estado.batatas = 1;
                        estado.resp1 = 36; // Calabresa 1/2
                        estado.resp2 = 36; // Cheddar 1/2
                        estado.resp3 = 28; // Bacon 1/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
                case 1: // Segundo adicional
                    try {
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 3, 1, estado, carrinho); // Extra selecionado                
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ".");
                        setTimeout(() => {
                            client.sendMessage(numeroContato, respostas.maisAlgoPedido);
                        }, 500);
                        estado.respx = 14;
                        estado.batatas = 0;
                        estado.resp1 = 1; // Calabresa 2/2
                        estado.resp2 = 21; // Cheddar 2/2
                        estado.resp3 = 1000; // Bacon 2/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
            }
            break
        case 29: // Loop dos adicionais Batata M
            switch (estado.batatas) {
                case 0: // Primeiro adicional
                    try {
                        const retorno1 = await pegarRetorno(numeroContato, client, 6, null, 2, estado, carrinho);// Nome do  lanche
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 3, 2, estado, carrinho); // Extra selecionado
                        const retorno3 = await pegarRetorno(numeroContato, client, 21, null, 2, estado, carrinho); // Adicionais disponivel
                        const retorno4 = await pegarRetorno(numeroContato, client, 37, null, 2, estado, carrinho);// preço da batata                     
                        adicionarProdutoNoCart(numeroContato, retorno1); // Nome ADD cart
                        adicionarValorProdutoAoCarrinho(numeroContato, retorno4); // Preço ADD cart
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ".");
                        setTimeout(() => {
                            client.sendMessage(numeroContato, "Escolha o segundo adicional.\n" + retorno3);
                        }, 500);
                        estado.respx = 1000;
                        estado.batatas = 1;
                        estado.resp1 = 36; // Calabresa 1/2
                        estado.resp2 = 36; // Cheddar 1/2
                        estado.resp3 = 28; // Bacon 1/2
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
                case 1: // Segundo adicional
                    try {
                        const retorno2 = await pegarRetorno(numeroContato, client, 28, 3, 2, estado, carrinho); // Extra selecionado                
                        adicionarExtraNoCart(numeroContato, retorno2, 1); // Extra ADD cart
                        message.reply("Perfeito, você escolheu " + retorno2 + ". Confira seu pedido e confirme se está tudo certo antes de confirmá-lo.");
                        let mensagem = `Seu pedido                     ${carrinho.idPedido}\n\n`;
                        mensagem += `Pedido         (${Object.keys(carrinho.produtos).length} item no carrinho)\n`;
                        for (const [idProduto, produto] of Object.entries(carrinho.produtos)) {
                            mensagem += `*${produto}*\n`;
                            if (carrinho.extras.hasOwnProperty(idProduto) && Object.keys(carrinho.extras[idProduto]).length > 0) {
                                Object.entries(carrinho.extras[idProduto]).forEach(([extra, quantidade]) => {
                                    mensagem += `  *↳ ${extra}: ${quantidade}*\n`;
                                });
                            } else {
                                mensagem += `  *↳ Nenhum extra*\n`;
                            }
                        }
                        mensagem += '\n*Pagamento*\n';
                        mensagem += `subtotal                 *R$* ${carrinho.preco}\n`;
                        mensagem += `taxa de entrega    *R$* ${carrinho.taxaEntrega || '1,00'}\n`;
                        mensagem += `total                        *R$* ${carrinho.total + 1}\n`;
                        setTimeout(() => {
                            client.sendMessage(numeroContato, mensagem);
                            setTimeout(() => {
                                client.sendMessage(numeroContato, respostas.maisAlgoPedido);
                            }, 200);
                        }, 500);
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
                    break
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp4(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp4) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Mandando o atendimento ao cliente
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 4, 3, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 4, 3, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 4, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 4;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 2: // Pegar o X-Eggs na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 4, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 4, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 5;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 3: // Mandando o atendimento ao cliente
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 4, 4, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 4, 4, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 4, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 5;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 4: // Adicionando o extra Presunto (X-Calabresa)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 4, 5, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 4, 5, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 5, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 6;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 5: // Adicionando o extra Presunto (X-Frango)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 4, 6, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 4, 6, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 6, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 7;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 6: // Adicionando o extra Presunto (Burguer Especial)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 4, 7, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 4, 7, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 7, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 8;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 7: // Adicionando o extra Presunto (X-Eggs Bacon)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 4, 8, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 4, 8, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 9;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 8: // Adicionando o extra Presunto (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 4, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 4, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 9: // Adicionando o extra Presunto (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 4, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 4, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 10: //Ver cardapio das batatas
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 11, null, null, estado, carrinho); // Nome do lanche
                message.reply(`*Batatas disponíveis*\n\n${retorno1}`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.voltar);
                    estado.resp0 = 2;
                    estado.respx = 0;
                    estado.resp1 = 1000;
                    estado.resp2 = 1000;
                    estado.resp3 = 1000;
                    estado.resp4 = 1000;
                    estado.resp5 = 1000;
                }, 500);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 11: // Pizza de FranBacon
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 4, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam1);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 24; // Pizza P
                estado.resp2 = 25; // Pizza M
                estado.resp3 = 16; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 12: // Pizza de Bacon
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 4, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 31; // Pizza P
                estado.resp2 = 32; // Pizza M
                estado.resp3 = 24; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 13: // Batatas Disponivel
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 11, null, null, estado, carrinho);// Nome do  lanche
                message.reply("Aqui estão as melhores batatas que já foram vistas.");
                setTimeout(() => {
                    client.sendMessage(numeroContato, retorno1);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 35; // Batata P
                estado.resp2 = 37; // Batata M
                estado.resp3 = 1000;
                estado.resp4 = 1000;
                estado.resp5 = 1000;
                estado.resp6 = 1000;
                estado.resp7 = 1000;
                estado.resp8 = 1000;
                estado.resp9 = 1000;
                estado.resp10 = 1000;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp5(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp5) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Adicionando o extra Tomate (X-Eggs)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 5, 4, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 5, 4, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 4, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 5;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 2: // Pegar o X-Calabresa na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 5, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 5, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 6;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 3: // Adicionando o extra Presunto (X-Calabresa)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 5, 5, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 5, 5, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 5, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 6;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 4: // Adicionando o extra Presunto (X-Frango)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 5, 6, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 5, 6, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 6, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 7;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 5: // Adicionando o extra Presunto (Burguer Especial)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 5, 7, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 5, 7, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 7, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 8;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 6: // Adicionando o extra Presunto (X-Eggs Bacon)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 5, 8, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 5, 8, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 9;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 7: // Adicionando o extra Presunto (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 5, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 5, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 8: // Adicionando o extra Presunto (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 5, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 5, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 9: // Ver cardapio das Bebidas
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 10, null, null, estado, carrinho); // Nome do lanche
                message.reply(`*Bidas disponíveis*\n\n${retorno1}`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.voltar);
                    estado.resp0 = 2;
                    estado.respx = 0;
                    estado.resp1 = 1000;
                    estado.resp2 = 1000;
                    estado.resp3 = 1000;
                    estado.resp4 = 1000;
                    estado.resp5 = 1000;
                }, 500);
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 10: // Pizza de Bancon Cheddar
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 5, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam1);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 25; // Pizza P
                estado.resp2 = 26; // Pizza M
                estado.resp3 = 18; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 11: // Pizza de Frango
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 5, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 32; // Pizza P
                estado.resp2 = 33; // Pizza M
                estado.resp3 = 24; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp6(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp6) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Adicionando o extra Alface (X-Eggs)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 6, 4, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 6, 4, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 4, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 5;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 2: // Adicionando o extra Alface (X-Calabresa)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 6, 5, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 6, 5, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 5, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 6;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 3: // Pegar o X-Frango na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 6, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 6, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 6;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 4: // Adicionando o extra Alface (X-Frango)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 6, 6, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 6, 6, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 6, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 7;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 5: // Adicionando o extra Alface (X-Eggs Bacon)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 6, 8, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 6, 8, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 9;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 6: // Adicionando o extra Alface (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 6, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 6, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 7: // Adicionando o extra Alface (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 6, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 6, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 8: // Pizza de Calabresa Cheddar
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 3, 6, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam1);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 26; // Pizza P
                estado.resp2 = 27; // Pizza M
                estado.resp3 = 19; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 9: // Pizza de 4 Queijos
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 6, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 33; // Pizza P
                estado.resp2 = 34; // Pizza M
                estado.resp3 = 26; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp7(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp7) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Pegar o Burguer Especial na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 7, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 7, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 8;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 2: // Adicionando o extra Alface (X-Eggs Bacon)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 7, 8, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 7, 8, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 9;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 3: // Adicionando o extra Alface (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 7, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 7, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 4: // Adicionando o extra Alface (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 7, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 7, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 5: // Pizza de 5 Queijos
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 4, 7, null, estado, carrinho);// Nome do  lanche
                message.reply("Perfeito, você escolheu " + retorno1 + ".");
                setTimeout(() => {
                    client.sendMessage(numeroContato, "Agora por favor escolha o tamanho da pizza\n" + respostas.tam2);
                }, 500);
                estado.respx = 1000;
                estado.resp1 = 34; // Pizza P
                estado.resp2 = 35; // Pizza M
                estado.resp3 = 27; // Pizza G
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp8(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp8) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Pegar o Burguer Especial na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 8, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 8, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 9;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 2: // Adicionando o extra Alface (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 8, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 8, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 3: // Adicionando o extra Alface (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 8, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 8, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 8, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp9(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp9) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Pegar o X-Tudo na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 9, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 10;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 2: // Adicionando o extra Alface (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 9, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 9, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 3: // Adicionando o extra Alface (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 9, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 9, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp10(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp10) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Pegar o X-Tudo na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 10, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 11;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 2: // Adicionando o extra Alface (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 10, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 10, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 3: // Adicionando o extra Alface (Especial Burguer Top 10)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 10, 10, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 10, 10, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 11;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp11(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp11) {
        case 0: // Manda o menu do cardápio
            avaliarrespx(numeroContato, message);
            break;
        case 1: // Pegar o Especial Burguer Top 10 na lista
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 1, 10, null, estado, carrinho); // Nome do lanche
                const retorno2 = await pegarRetorno(numeroContato, client, 32, 1, 10, estado, carrinho); // Valor do lanche
                adicionarProdutoNoCart(numeroContato, retorno1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno2);
                adicionarIdPedidoAoCarrinho(numeroContato);
                message.reply(`Perfeito, o produto ${retorno1} foi adicionado ao seu pedido.`);
                setTimeout(() => {
                    client.sendMessage(numeroContato, respostas.adicionais);
                }, 500);
                estado.respx = 11;
                estado.resp1 = 4; // chamar o respx
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 2: // Adicionando o extra Alface (X-Tudo)
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 11, 9, estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 11, 9, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 9, null, estado, carrinho);// Nome do lanche
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);
                message.reply(`Perfeito, extra adicionado ao lanche.\n${respostas.maisUmAdicional}`)
                estado.respx = 10;
                estado.resp1 = 4;
                estado.resp2 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        case 999:
            message.reply("Repassei seu atendimento para alguém, só aguardar.");
            resetarStatus(numeroContato);
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

client.initialize();

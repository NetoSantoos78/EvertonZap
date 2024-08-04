const fs = require('fs').promises;
const emojiStrip = require('emoji-strip');
const path = require('path');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const puppeteer = require('puppeteer');
const { Client, MessageMedia, Poll, LocalAuth } = require('whatsapp-web.js');
const { criarPagamento, criarPagamentoRenovacao } = require('./criarCompra.js');
const { dataFormatada, horaFormatada } = require('./funcoes/pegardata.js');
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

const respostas = {
    menu: '',
    semAtendimento: 'Desculpa, não consegui entender o que você falou, por favor mande *"menu"* para iniciar seu pedido.',
    atendimento: 'Vou te repassar para algum atendente.',
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
            respx: 0,
            cliente: '',
            escolha: '',
            conclusao: '',
            msg: '',
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
    client.sendMessage(grupo, "[!] Estou online e operante");
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
}

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

    switch (parts.length) {
        case 1:
            // Comandos simples que não têm parâmetros adicionais
            switch (comando) {
                case 'ex':
                    const carrinhos = getCardapioIndividual(numeroContato);

                    // Verifique se `carrinhos` está corretamente definido
                    if (carrinhos) {
                        console.log(JSON.stringify(carrinhos, null, 2));
                    } else {
                        console.log('carrinhos não está definido.');
                    }
                    break;
                    break
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
                    mensagem += `subtotal                  *R$ ${carrinho.preco}*\n`;
                    mensagem += `taxa de entrega      *R$ ${carrinho.taxaEntrega || '1,00'}*\n`;
                    mensagem += `total                        *R$ ${carrinho.total + 1}*\n`;

                    // Envia a mensagem com os detalhes formatados
                    setTimeout(() => {
                        client.sendMessage(numeroContato, mensagem);
                    }, 500);
                    break
                case 'menu':
                    avaliarrespx(numeroContato, message);
                    break;
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
                    try {
                        const retorno = await pegarRetorno(numeroContato, client, 18, 9, null, estado, carrinho);
                        //console.log(retorno);
                        message.reply(retorno);
                    } catch (error) {
                        console.error('Erro ao obter o retorno:', error);
                    }
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
                    message.reply("ID: " + respostas.idgrupo);
                    break
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
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break;
        case 2: // Extras do MISTO
            try {
                const retorno = await pegarRetorno(numeroContato, client, 18, 1, null, estado, carrinho);
                message.reply(retorno);
                estado.resp1 = 5;
                estado.resp2 = 3;
                estado.resp3 = 2;
            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}
async function avaliarresp1(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    const carrinho = getCardapioIndividual(numeroContato);
    switch (estado.resp1) {
        case 0: // Manda o menu do cardápio
            await client.sendMessage(numeroContato, respostas.menu);
            estado.menu = 1;
            break;
        case 1: // Menu do cardapio de produtos existente
            estado.respx = 1;
            estado.resp1 = 2;
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
                message.reply("Perfeito, o produto " + retorno1 + " foi adicionado ao seu pedido.");


                setTimeout(() => {
                    message.reply(respostas.adicionais);
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
        case 5: // 
            try {
                const retorno1 = await pegarRetorno(numeroContato, client, 23, 1, "1", estado, carrinho);// Valor do extra
                const retorno2 = await pegarRetorno(numeroContato, client, 27, 1, 1, estado, carrinho);// Nome do extra
                const retorno3 = await pegarRetorno(numeroContato, client, 1, 1, null, estado, carrinho);// Nome do lanche
                console.log("valor do extra: " + retorno1);
                console.log("Extra escolhido: " + retorno2);
                console.log("Sanduiche escolhido: " + retorno3);
                adicionarExtraNoCart(numeroContato, retorno2, 1);
                adicionarValorProdutoAoCarrinho(numeroContato, retorno1);

            } catch (error) {
                console.error('Erro ao obter o retorno:', error);
            }
            break
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

async function avaliarresp2(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    switch (estado.resp2) {
        case 0: // Manda o menu do cardápio
            await client.sendMessage(numeroContato, respostas.menu);
            break;
        case 1: // Manda o cardapio de leitura para os produtos da lanchonete
            await client.sendMessage(numeroContato, respostas.cardapiover);
            estado.respx = 3;
            break;
        // Outros casos de estado...
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

async function avaliarresp3(numeroContato, message) {
    const estado = getEstadoIndividual(numeroContato);
    switch (estado.resp2) {
        case 0: // Manda o menu do cardápio
            await client.sendMessage(numeroContato, respostas.menu);
            break;
        case 1: // Mandando o atendimento ao cliente
            await client.sendMessage(numeroContato, respostas.atendimento);
            break;
        // Outros casos de estado...
        default:
            // Lidar com estado desconhecido, se necessário
            break;
    }
}

client.initialize();




































//async function buscarTaxaEntregaEspecifica(chaveEspecifica) {
/*    try {
        const taxaEntregaEspecifica = await obterTaxaEntregaEspecifica(chaveEspecifica);

        if (taxaEntregaEspecifica) {
            console.log(`Taxa de Entrega para '${chaveEspecifica}':`, taxaEntregaEspecifica);
            // Aqui você pode manipular a taxa de entrega como desejar
            // Exemplo: enviar para um cliente, armazenar em uma variável global, etc.
            return taxaEntregaEspecifica;
        } else {
            console.log(`Taxa de entrega para '${chaveEspecifica}' não encontrada no arquivo JSON.`);
            return null;
        }
    } catch (erro) {
        console.error('Erro ao obter a taxa de entrega específica:', erro.message);
        return null;
    }
}

// Exemplo de uso da função
(async () => {
    const chave = 'a'; // Substitua pela chave específica que você está procurando
    const taxa = await buscarTaxaEntregaEspecifica(chave);
    //console.log(taxa);
    // Use a taxa conforme necessário
})();*/
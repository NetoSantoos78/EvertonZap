const fs = require('fs').promises;

const jsonFiles = './usuarios.json'; // Substitua pelo caminho do seu arquivo JSON

// Função para carregar o JSON do arquivo
async function carregarJSON() {
    try {
        const jsonString = await fs.readFile(jsonFiles, 'utf8');
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Erro ao carregar o arquivo JSON:', error.message);
        return {};
    }
}

// Função para salvar o JSON no arquivo
async function salvarJSON(json) {
    try {
        await fs.writeFile(jsonFiles, JSON.stringify(json, null, 2));
    } catch (error) {
        console.error('Erro ao salvar o arquivo JSON:', error.message);
    }
}

// Função para editar um campo específico de um registro
async function editarCampo(numeroContato, campo, valor) {
    const json = await carregarJSON();
    if (json[numeroContato]) {
        json[numeroContato][campo] = valor;
        await salvarJSON(json);
    } else {
        console.error(`O número ${numeroContato} não foi encontrado nos dados.`);
    }
}

// Funções específicas para editar cada campo
async function editarEstado(numeroContato, novoEstado) {
    await editarCampo(numeroContato, 'estado', novoEstado);
}

async function editarEndereco(numeroContato, novoEndereco) {
    await editarCampo(numeroContato, 'endereco', novoEndereco);
}

async function editarBairro(numeroContato, novoBairro) {
    await editarCampo(numeroContato, 'bairro', novoBairro);
}

async function editarNumeroCasa(numeroContato, novoNumeroCasa) {
    await editarCampo(numeroContato, 'numeroCasa', novoNumeroCasa);
}

async function editarReferencia(numeroContato, novaReferencia) {
    await editarCampo(numeroContato, 'referencia', novaReferencia);
}

async function editarComplemento(numeroContato, novoComplemento) {
    await editarCampo(numeroContato, 'complemento', novoComplemento);
}

async function editarConcluido(numeroContato, novoConcluido) {
    await editarCampo(numeroContato, 'concluido', novoConcluido);
}

// Função para verificar se o registro está concluído
async function verificarConcluido(numeroContato) {
    const json = await carregarJSON();
    if (json[numeroContato]) {
        const registro = json[numeroContato].concluido;
        return registro === 'sim' ? 'sim' : 'nao';
    } else {
        await verificarRegistro(numeroContato);
        return 'nao'; // Caso o número de contato não exista, considere como não concluído
    }
}

// Função para verificar se um número de contato tem algum registro no JSON e criar se não tiver
async function verificarRegistro(numeroContato) {
    const json = await carregarJSON();
    if (!json[numeroContato]) {
        // Criar um registro em branco para o número de contato
        json[numeroContato] = {
            "concluido": "nao",
            "fidelidade": "0",
            "endereco": "",
            "bairro": "",
            "numeroCasa": "",
            "referencia": "",
            "complemento": "",
            "estado": 0
        };
        await salvarJSON(json);
    }
}

// Função para o cadastro de endereço
async function cadastroEndereco(numeroContato, mensagemRecebida, respostas) {
    const json = await carregarJSON();
    const registro = json[numeroContato];
    let responseMessage = '';
    console.log("[!] Endereço: " +numeroContato+" -> "+ mensagemRecebida);

    // Ignorar mensagens de 'status@broadcast'
    if (numeroContato === 'status@broadcast') {
        console.log('[!] Endereço: Mensagem de status@broadcast ignorada.');
        return; // A execução da função é interrompida aqui
    }

    function obterSaudacao() {
        const agora = new Date();
        const hora = agora.getHours();
    
        if (hora >= 0 && hora < 12) {
            return 'Bom dia';
        } else if (hora >= 12 && hora < 18) {
            return 'Boa tarde';
        } else {
            return 'Boa noite';
        }
    }
    switch (registro.estado) {
        case 0:
            const saudacao = obterSaudacao()+", verifiquei que você não tem nenhum endereço cadastrado. Vamos cadastrá-lo primeiro antes de seguir com seu pedido."
            responseMessage = saudacao+`\n\nQual é o seu endereço? *"Nome da rua"*?`;
            await editarEstado(numeroContato, 1);
            break;
        case 1:
            responseMessage = "Qual é o seu bairro / povoado?";
            await editarEstado(numeroContato, 2);
            await editarEndereco(numeroContato, mensagemRecebida);
            break;
        case 2:
            responseMessage = "Qual é o número da sua casa?";
            await editarEstado(numeroContato, 3);
            await editarBairro(numeroContato, mensagemRecebida);
            break;
        case 3:
            responseMessage = "Algum ponto de referência para adicionar? Ex. Final da rua, Casa com portão branco.";
            await editarEstado(numeroContato, 4);
            await editarNumeroCasa(numeroContato, mensagemRecebida);
            break;
        case 4:
            responseMessage = "Algum complemento? Ex. Casa de andar.";
            await editarEstado(numeroContato, 5);
            await editarReferencia(numeroContato, mensagemRecebida);
            break;
        case 5:
            responseMessage = "Pronto, seu endereço foi cadastrado!";
            responseMessage = respostas.menu;
            await editarConcluido(numeroContato, "sim");
            await editarComplemento(numeroContato, mensagemRecebida);
            await editarEstado(numeroContato, 6);
            break;
        case 6:
            await verificarRegistro(numeroContato);
            break;
        default:
            responseMessage = "Estado desconhecido.";
            break;
    }

    return responseMessage;
}

module.exports = {
    verificarConcluido,
    verificarRegistro,
    cadastroEndereco,
    editarEstado,
    editarEndereco,
    editarBairro,
    editarNumeroCasa,
    editarReferencia,
    editarComplemento,
    editarConcluido
};

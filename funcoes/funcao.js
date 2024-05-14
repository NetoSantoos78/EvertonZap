const { contatinho } = require('../index');
console.log(contatinho+"|Das funções")
const fs = require('fs');
const numeroContato = contatinho;
const jsonFile = './usuarios.json'; // Substitua pelo caminho do seu arquivo JSON


function carregarJSON() {
    try {
        const jsonString = fs.readFileSync(jsonFile, 'utf8');
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Erro ao carregar o arquivo JSON:', error.message);
        return {};
    }
}

function salvarJSON(json) {
    try {
        fs.writeFileSync(jsonFile, JSON.stringify(json, null, 2));
        console.log('JSON salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar o arquivo JSON:', error.message);
    }
}

function fazerPergunta(pergunta) {
    console.log(pergunta);
    // Aqui você pode enviar a pergunta para o usuário através do WhatsApp
}

function lidarComResposta(resposta, pergunta, json) {
    if (!json[numeroContato]) {
        json[numeroContato] = {};
    }
    json[numeroContato][pergunta] = resposta;
    salvarJSON(json);
}

function iniciarPerguntas() {
    const json = carregarJSON();
    const perguntas = [
        'Qual é o seu nome?',
        'Qual é o seu endereço?',
        'Qual é o seu número de telefone?',
        // Adicione mais perguntas conforme necessário
    ];
    perguntas.forEach(pergunta => {
        if (!json[numeroContato] || !json[numeroContato][pergunta]) {
            fazerPergunta(pergunta);
        }
    });
}

module.exports = { carregarJSON, salvarJSON, fazerPergunta, lidarComResposta, iniciarPerguntas };

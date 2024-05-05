const { format } = require('date-fns');

function dataFormatada() {
    // Obter a data atual
    const dataAtual = new Date();
    // Formatar a data no formato dd/mm/aaaa
    const qualDataHoje = format(dataAtual, 'dd/MM/yyyy');
    return qualDataHoje;
}

function horaFormatada() {
    // Função para adicionar zeros à esquerda se necessário
    function adicionarZero(numero) {
        return numero < 10 ? '0' + numero : numero;
    }
    // Obter a hora atual
    const horaAtual = new Date();
    // Extrair a hora, minuto e segundo
    const hora = adicionarZero(horaAtual.getHours());
    const minuto = adicionarZero(horaAtual.getMinutes());
    const segundo = adicionarZero(horaAtual.getSeconds());
    const queHoraE = hora + ":" + minuto + ":" + segundo;
    return queHoraE;
}

module.exports = { dataFormatada, horaFormatada };

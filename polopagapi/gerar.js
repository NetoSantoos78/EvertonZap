const api = require('./api');
//const consulta = require('./api');

async function createPixPayment() {
  try {
    const paymentData = {
      valor: "1.00",
      calendario: {
        expiracao: 3600 // Tempo de expiração em segundos
      }
    };

    const response = await api.post('/cobpix', paymentData); // Substitua '/payments' pelo endpoint correto se necessário
    const data = response.data;

    console.log('Pagamento criado com sucesso:');
    console.log('QR Code Base64:', data.qrcodeBase64);
    console.log('Pix Copia e Cola:', data.pixCopiaECola);
    console.log('TXID:', data.txid);
    console.log('Internal ID:', data.internalId);
    console.log('Unique ID:', data.uniqueId);
    console.log('Valor:', data.valor);
    console.log('Status:', data.status);
    console.log('Calendário Expiração:', data.calendario.expiracao);
    console.log('Calendário Expiração (data):', data.calendario.calendarioExpiracao);
    console.log('Calendário Criação:', data.calendario.calendarioCriacao);
    console.log('Solicitação do Pagador:', data.solicitacaoPagador);

    // Se precisar usar os valores em outras partes do código, você pode fazer o seguinte:
    const qrcodeBase64 = data.qrcodeBase64;
    const pixCopiaECola = data.pixCopiaECola;
    const txid = data.txid;
    const internalId = data.internalId;
    const uniqueId = data.uniqueId;
    const valor = data.valor;
    const status = data.status;
    const calendarioExpiracao = data.calendario.expiracao;
    const calendarioExpiracaoData = data.calendario.calendarioExpiracao;
    const calendarioCriacao = data.calendario.calendarioCriacao;
    const solicitacaoPagador = data.solicitacaoPagador;

    // Agora você pode usar essas variáveis conforme necessário
  } catch (error) {
    console.error('Erro ao criar pagamento:', error.response ? error.response.data : error.message);
  }
}

async function verificarpix(txid) {
    try {
        // Envia a requisição GET para o endpoint correto passando o txid na URL
        const response = await api.get(`/check-pix/${txid}`);
        console.log('Consulta realizada com sucesso:', response.data);
    } catch (error) {
        console.error('Erro ao realizar consulta:', error.response ? error.response.data : error.message);
    }
}

// Substitua 'qn90zulh30qw5rwd5pkugyi8oghgnpb1rku' pelo txid que deseja consultar
verificarpix('c3xl1sv2grfhslaqpemaacld0ypl6chb4oi');
//createPixPayment();

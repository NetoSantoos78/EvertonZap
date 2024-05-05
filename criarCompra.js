const fs = require('fs').promises; // Usando a versão de Promises do módulo fs
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const qrcode = require('qrcode');
const now = new Date();


function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}



async function criarPagamento(client, message, numeroformatado, session) {
  const randomString = generateRandomString(6);
  const url = 'https://api.mercadopago.com/v1/payments';
  const headers = {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': uuidv4(),
    'Authorization': 'Bearer APP_USR-2726638639292774-022600-1fd303aa3c6c8705684c6d32e85538af-715642608'
  };

  const data = {
    "additional_info": {
      "items": [
        {
          "id": randomString,
          "title": "Conexão Ilimitada",
          "description": "Conexão com os servidores Parkinho, Duração: 31 dias",
          //"picture_url": "https://http2.mlstatic.com/resources/frontend/statics/growth-sellers-landings/device-mlb-point-i_medium2x.png",
          "category_id": "electronics",
          "quantity": 1,
          "unit_price": 15.0,
          "type": "electronics",
          "event_date": now,
          "warranty": false,
          "category_descriptor": {
            "passenger": {},
            "route": {}
          }
        }
      ],
      "payer": {
        "first_name": "Cliente",
        "last_name": "Parkinho",
        "phone": {
          "area_code": 11,
          "number": "987654321"
        },
        "address": {
          "street_number": 84
        }
      },
      "shipments": {
        "receiver_address": {
          "zip_code": "49480-000",
          "state_name": "Sergipe",
          "city_name": "Simao Dias",
          "street_name": "Av das Nacoes Unidas",
          "street_number": 3003
        },
      }
    },
    "application_fee": null,
    "binary_mode": false,
    "campaign_id": null,
    "capture": true,
    "coupon_amount": null,
    "description": "Conexão ilimitada com os servidores Parkinho, por 31 DIAS",
    "differential_pricing_id": null,
    "installments": 1,
    "issuer_id": null,
    "metadata": null,
    "payer": {
      "entity_type": "individual",
      "type": "customer",
      "email": "cliente@parkinho.com",

    },
    "payment_method_id": "pix",
    "token": null,
    "transaction_amount": 15
  };
  
  try {
    const response = await axios.post(url, data, { headers });
    const paymentData = response.data;
    const qrCodeValue = response.data.point_of_interaction.transaction_data.qr_code;

    const paymentId = paymentData.id;
    const paymentStatus = paymentData.status;
    console.log("ID do pagamento:", paymentId);
    console.log("Status do pagamento:", paymentStatus);
    console.log("Chave:", qrCodeValue);

    const dataa = new Date();
    const formattedDate = `${dataa.getFullYear()}-${(dataa.getMonth() + 1).toString().padStart(2, '0')}-${dataa.getDate().toString().padStart(2, '0')}`;
    
    // Gerar o código QR localmente
    const qrCodeImagePath = 'temp-qrcode.png';
    await qrcode.toFile(qrCodeImagePath, qrCodeValue);

    // Converter a imagem para base64
    const imageData = await fs.readFile(qrCodeImagePath, { encoding: 'base64' });

    // Remover a imagem temporária
    await fs.unlink(qrCodeImagePath);

    // Ler dados existentes do arquivo JSON
    const jsonFilePath = path.join(__dirname, 'dadosPagamento.json');
    let existingPurchases;

    try {
      const existingData = await fs.readFile(jsonFilePath, 'utf8');
      existingPurchases = JSON.parse(existingData);

      // Certificar-se de que existingPurchases seja um array
      if (!Array.isArray(existingPurchases)) {
        existingPurchases = [];
      }
    } catch (error) {
      // Se houver um erro ao fazer o parse do JSON, inicialize existingPurchases como um array vazio
      existingPurchases = [];
    }

    // Adição da nova compra ao array existente
    existingPurchases.push({
      comprador: numeroformatado,
      dia: formattedDate,
      idCompra: paymentId,
      status: 'pending',
      //qrCodeImage: imageData //QR CODE
    });

    // Escrita do array atualizado de volta ao arquivo JSON
    await fs.writeFile(jsonFilePath, JSON.stringify(existingPurchases, null, 2));

    // Mensagens de resposta
    const mensagens = {
      mensagem1: `*▸Seu pagamento foi criado !!*\n*▸Segue a chave copia e cola abaixo*`,
      mensagem2: qrCodeValue,
      mensagem3: `*▸Pagamento via QR PIX*`,
      mensagem4: `${imageData}`,
      mensagem5: numeroformatado+'@c.us'
    };
    return mensagens;
    
  } catch (error) {
    console.error('Erro na requisição:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function criarPagamentoRenovacao(client, message, numeroformatado, session, nominho, senhazinha) {
  const randomString = generateRandomString(6);
  const url = 'https://api.mercadopago.com/v1/payments';
  const headers = {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': uuidv4(),
    'Authorization': 'Bearer APP_USR-6468752500299430-011723-15a90ba53e119606cafb0fbcc3dbdb20-1058721505'
  };

  const data = {
    "additional_info": {
      "items": [
        {
          "id": randomString,
          "title": "Conexão Ilimitada",
          "description": "Conexão com os servidores Parkinho, Duração: 31 dias",
          //"picture_url": "https://http2.mlstatic.com/resources/frontend/statics/growth-sellers-landings/device-mlb-point-i_medium2x.png",
          "category_id": "electronics",
          "quantity": 1,
          "unit_price": 15.0,
          "type": "electronics",
          "event_date": now,
          "warranty": false,
          "category_descriptor": {
            "passenger": {},
            "route": {}
          }
        }
      ],
      "payer": {
        "first_name": "Cliente",
        "last_name": "Parkinho",
        "phone": {
          "area_code": 11,
          "number": "987654321"
        },
        "address": {
          "street_number": 84
        }
      },
      "shipments": {
        "receiver_address": {
          "zip_code": "49480-000",
          "state_name": "Sergipe",
          "city_name": "Simao Dias",
          "street_name": "Av das Nacoes Unidas",
          "street_number": 3003
        },
      }
    },
    "application_fee": null,
    "binary_mode": false,
    "campaign_id": null,
    "capture": true,
    "coupon_amount": null,
    "description": "Conexão ilimitada com os servidores Parkinho, por 31 DIAS",
    "differential_pricing_id": null,
    "installments": 1,
    "issuer_id": null,
    "metadata": null,
    "payer": {
      "entity_type": "individual",
      "type": "customer",
      "email": "cliente@parkinho.com",

    },
    "payment_method_id": "pix",
    "token": null,
    "transaction_amount": 15
  };
  
  try {
    const response = await axios.post(url, data, { headers });
    const paymentData = response.data;
    const qrCodeValue = response.data.point_of_interaction.transaction_data.qr_code;

    const paymentId = paymentData.id;
    const paymentStatus = paymentData.status;
    console.log("ID do pagamento:", paymentId);
    console.log("Status do pagamento:", paymentStatus);
    console.log("Chave:", qrCodeValue);

    const dataa = new Date();
    const formattedDate = `${dataa.getFullYear()}-${(dataa.getMonth() + 1).toString().padStart(2, '0')}-${dataa.getDate().toString().padStart(2, '0')}`;
    
    // Gerar o código QR localmente
    const qrCodeImagePath = 'temp-qrcode.png';
    await qrcode.toFile(qrCodeImagePath, qrCodeValue);

    // Converter a imagem para base64
    const imageData = await fs.readFile(qrCodeImagePath, { encoding: 'base64' });

    // Remover a imagem temporária
    await fs.unlink(qrCodeImagePath);

    // Ler dados existentes do arquivo JSON
    const jsonFilePath = path.join(__dirname, 'dadosRenovacao.json');
    let existingPurchases;

    try {
      const existingData = await fs.readFile(jsonFilePath, 'utf8');
      existingPurchases = JSON.parse(existingData);

      // Certificar-se de que existingPurchases seja um array
      if (!Array.isArray(existingPurchases)) {
        existingPurchases = [];
      }
    } catch (error) {
      // Se houver um erro ao fazer o parse do JSON, inicialize existingPurchases como um array vazio
      existingPurchases = [];
    }

    // Adição da nova compra ao array existente
    existingPurchases.push({
      comprador: numeroformatado,
      dia: formattedDate,
      idCompra: paymentId,
      status: 'pending',
      nome: nominho,
      senha: senhazinha
      //qrCodeImage: imageData //QR CODE
    });

    // Escrita do array atualizado de volta ao arquivo JSON
    await fs.writeFile(jsonFilePath, JSON.stringify(existingPurchases, null, 2));

    // Mensagens de resposta
    const mensagens = {
      mensagem1: `*▸Seu pagamento foi criado !!*\n*▸Segue a chave copia e cola abaixo*`,
      mensagem2: qrCodeValue,
      mensagem3: `*▸Pagamento via QR PIX*`,
      mensagem4: `${imageData}`,
      mensagem5: numeroformatado+'@c.us'
    };
    return mensagens;
    
  } catch (error) {
    console.error('Erro na requisição:', error.response ? error.response.data : error.message);
    throw error;
  }
}


module.exports = { criarPagamento, criarPagamentoRenovacao };

const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.polopag.com/v1/', // URL base da API
  headers: {
    'Content-Type': 'application/json',
    'Api-Key': '85bd17f2917e9ac0e0daa1522853b3558aa6943546dd8e134f3927879cd0072a' // Substitua pela sua chave de API correta
  }
});


module.exports = api;
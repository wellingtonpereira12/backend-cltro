const axios = require('axios');
const qs = require('querystring');

class OAuthService {
  // Obter token para a aplicação (não para usuário)
  static async getAppToken() {
    console.log('getAppToken2')
    try {
      console.log('client_id:', process.env.MP_CLIENT_ID);
      console.log('client_secret:', process.env.MP_CLIENT_SECRET);
      const response = await axios.post(
        'https://api.mercadopago.com/oauth/token',
        qs.stringify({
          client_id: process.env.MP_CLIENT_ID,
          client_secret: process.env.MP_CLIENT_SECRET,
          grant_type: 'client_credentials'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );
      console.log('getAppToken2 1 ', response)

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('Erro ao obter token da aplicação:', error.response?.data || error.message);
      throw new Error('Falha ao obter token de aplicação');
    }
  }

  // Atualizar token usando refresh token
  static async refreshToken(refresh_token) {
    try {
      const response = await axios.post(
        'https://api.mercadopago.com/oauth/token',
        qs.stringify({
          client_id: process.env.MP_CLIENT_ID,
          client_secret: process.env.MP_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('Erro ao atualizar token:', error.response?.data || error.message);
      throw new Error('Falha ao atualizar token');
    }
  }
}

module.exports = OAuthService;
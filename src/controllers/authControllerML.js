const OAuthService = require('../services/oauthService');

const AuthController = {
  async handleCallback(req, res) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ error: 'Código de autorização não fornecido' });
      }

      const tokenData = await OAuthService.getToken(code);

      res.json({ 
        success: true,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        user_id: tokenData.user_id,
        scope: tokenData.scope
      });
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        details: error.response?.data || {}
      });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token não fornecido' });
      }

      const tokenData = await OAuthService.refreshToken(refresh_token);

      res.json({ 
        success: true,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in
      });
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        details: error.response?.data || {}
      });
    }
  }
};

module.exports = AuthController;
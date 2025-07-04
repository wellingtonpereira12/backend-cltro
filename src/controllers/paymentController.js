const MercadoPagoService = require('../services/mercadopagoService');
const OAuthService = require('../services/oauthService'); // Serviço para gerenciar tokens

// Cache em memória para tokens (em produção, use Redis ou banco de dados)
const tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  userId: null
};

const PaymentController = {
  async criarPagamentoDireto(req, res) {
    try {

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const userId = req.user.id;
      const { btnPagamento } = req.body;
      // Validate input
      if (!btnPagamento || (btnPagamento !== 1 && btnPagamento !== 2 && btnPagamento !== 3 && btnPagamento !== 4)) {
        return res.status(400).json({ error: 'Botão de voto inválido.' });
      }

      // Se token expirado ou não existente, obter novo
      const now = Date.now();
      let accessToken = tokenCache.accessToken;

      // Se token expirado ou não existente, obter novo
      if (!accessToken || tokenCache.expiresAt < now) {
        if (tokenCache.refreshToken) {
          try {
            const newTokens = await OAuthService.refreshToken(tokenCache.refreshToken);
            accessToken = newTokens.access_token;

            // Atualiza token e força expiração em 10 minutos
            tokenCache.accessToken = newTokens.access_token;
            tokenCache.refreshToken = newTokens.refresh_token;
            tokenCache.expiresAt = now + (10 * 60 * 1000); // FORÇAR 10 minutos
          } catch (refreshError) {
            console.error('Falha ao renovar token:', refreshError);
          }
        }

        // Se ainda não temos token, obter com credenciais
        if (!accessToken) {
          const appTokens = await OAuthService.getAppToken();
          accessToken = appTokens.access_token;

          tokenCache.accessToken = appTokens.access_token;
          tokenCache.refreshToken = appTokens.refresh_token;
          tokenCache.expiresAt = now + (10 * 60 * 1000); // FORÇAR 10 minutos
          tokenCache.userId = 'system';
        }
      }

      let valorTransaction_amount;

      switch (btnPagamento) {
        case 1:
          valorTransaction_amount = 1;
          break;
        case 2:
          valorTransaction_amount = 25;
          break;
        case 3:
          valorTransaction_amount = 50;
          break;
        case 4:
          valorTransaction_amount = 100;
          break;
        default:
          throw new Error(`Valor inválido de btnvoto: ${btnvoto}`);
      }

      const dadosPagamento = {
        transaction_amount: valorTransaction_amount, 
        description: "Doação para CLTRO",
        userId: userId
      };

      const resposta = await MercadoPagoService.criarLinkPagamento(accessToken, dadosPagamento);

      res.json({
        resposta
      });
    } catch (error) {
      console.error('Erro no controller de pagamento direto:', error);
      
      // Se erro de token inválido, limpar cache
      if (error.message.includes('Invalid access token')) {
        tokenCache.accessToken = null;
      }
      
      res.status(400).json({
        success: false,
        error: error.message || 'Erro ao processar pagamento',
        token_status: 'invalid'
      });
    }
  },
  
  // Rota para configurar token manualmente (opcional)
  async setToken(req, res) {
    try {
      const { access_token, refresh_token, expires_in } = req.body;
      
      tokenCache.accessToken = access_token;
      tokenCache.refreshToken = refresh_token;
      tokenCache.expiresAt = Date.now() + (expires_in * 1000);
      
      res.json({
        success: true,
        message: 'Token configurado com sucesso',
        expires_at: new Date(tokenCache.expiresAt)
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

module.exports = PaymentController;
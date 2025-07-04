const mercadoPagoService = require('../services/mercadoPagoServiceNotificacao.js');

const mercadoPagoController = {
  handleWebhook: async (req, res) => {
    try {
      if (process.env.MP_WEBHOOK_SECRET) {
        if (!req.body || !req.body.data || !req.body.id) {
          return res.status(400).json({ error: 'Estrutura inválida' });
        }

        const result = await mercadoPagoService.processNotification(req.body, req.headers);
        
        return res.status(200).json({ message: 'Notificação processada', result });
      }

    } catch (error) {
      console.error('Erro no controller:', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
};

module.exports = mercadoPagoController;
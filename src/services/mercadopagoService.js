const { MercadoPagoConfig, Preference } = require('mercadopago');

class MercadoPagoService {
  static async criarLinkPagamento(accessToken, dadosPagamento) {
    try {
      const client = new MercadoPagoConfig({
        accessToken,
        options: {
          timeout: 10000,
          integratorId: process.env.MP_CLIENT_ID // opcional
        }
      });

      const preference = new Preference(client);

      const preferenceData = {
        items: [
          {
            title: dadosPagamento.description || "Produto/Serviço",
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(dadosPagamento.transaction_amount) || 1
          }
        ],
        payer: {
          email: dadosPagamento.email || undefined
        },
        back_urls: {
          success: "https://seudominio.com/sucesso",
          failure: "https://seudominio.com/erro",
          pending: "https://seudominio.com/pendente"
        },
        auto_return: "approved"
      };

      const response = await preference.create({ body: preferenceData });
      console.log("Resposta do Mercado Pago:", response);

      return {
        success: true,
        init_point: response.init_point,
        json: response
      };


    } catch (error) {
      console.error("Erro ao criar link de pagamento:", error);
      return {
        success: false,
        error: `Erro ao criar link de pagamento: ${error.message}`
      };
    }
  }
}

module.exports = MercadoPagoService;

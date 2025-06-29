const { MercadoPagoConfig, Preference } = require('mercadopago');
const db = require('../config/db');

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
      
      let conn;
      conn = await db.getConnection();
      const preference = new Preference(client);

      const [result] = await conn.query(
        `INSERT INTO pagamentos (account_id, data, status, valor, processado)
        VALUES (?, SYSDATE(), 'pendente', ?, FALSE);`,
        [dadosPagamento.userId, Number(dadosPagamento.transaction_amount)]
      );

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
          success: "https://www.cltro.com/perfil",
          failure: "https://www.cltro.com/perfil",
          pending: "https://www.cltro.com/perfil"
        },
        auto_return: "approved",
        external_reference: result.insertId
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

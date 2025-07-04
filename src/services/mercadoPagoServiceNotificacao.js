const axios = require('axios');
const crypto = require('crypto');
const validationUtils = require('../utils/validationUtils');
const db = require('../config/db');

const MERCADOPAGO_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

const mercadoPagoService = {
  processNotification: async (body, headers) => {
    const notificationId = body.id;
    const resourceId = body.data.id;
    const eventType = body.type;

    if (!body || !body.data || !body.id) {
      throw new Error('Estrutura de notificação inválida');
    }

    // Validação condicional de assinatura
    if (WEBHOOK_SECRET) {
      try {
        validationUtils.validateSignature(
          headers['x-signature'] || headers['X-Signature'],
          body,
          WEBHOOK_SECRET
        );
      } catch (signatureError) {
        console.warn('Aviso: Falha na validação de assinatura:', signatureError.message);
        // Decida aqui se quer bloquear ou apenas registrar o aviso
        // throw signatureError; // Descomente para bloquear notificações não assinadas
      }
    }

    // Buscar detalhes do pagamento
    const paymentDetails = await mercadoPagoService.fetchPaymentDetails(resourceId);
    
    // Processar status
    await mercadoPagoService.handlePaymentStatus(paymentDetails);

    return {
      notificationId,
      resourceId,
      status: paymentDetails.status
    };
  },

  fetchPaymentDetails: async (paymentId) => {
    try {
      const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error.response?.data || error.message);
      throw new Error('Falha na comunicação com Mercado Pago');
    }
  },

  handlePaymentStatus: async (payment) => {

    let conn;

    try {
      conn = await db.getConnection();

      // Atualiza o pagamento no banco de dados
      const [result] = await conn.query(
        `UPDATE pagamentos
        SET status = ?
        WHERE id = ?`,
        [
          payment.status,                       
          Number(payment.external_reference)              
        ]
      );

      // Verifica se algum registro foi atualizado
      if (result.affectedRows === 0) {
        console.warn(`⚠️ Nenhum pagamento com ID ${payment.id} foi encontrado para atualizar.`);
      }

    } catch (error) {
      console.error('❌ Erro ao atualizar o pagamento:', error);
    } finally {
      if (conn) conn.release();
    }
  }

};

module.exports = mercadoPagoService;


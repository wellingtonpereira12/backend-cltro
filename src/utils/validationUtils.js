const crypto = require('crypto');

const validationUtils = {
  validateSignature: (signature, body, secret) => {
    if (!secret) {
      console.warn('Validação desativada - MP_WEBHOOK_SECRET não definido');
      return true; // Ignora validação se não houver segredo
    }
    
    if (!signature) {
      console.warn('Aviso: Notificação sem assinatura (x-signature)');
      return true; // Permite continuar sem assinatura (altere para false em produção)
    }

    try {
      const [timestamp, receivedHash] = signature.split(',');
      if (!timestamp || !receivedHash) {
        throw new Error('Formato de assinatura inválido');
      }

      const payload = `${timestamp}.${JSON.stringify(body)}`;
      const generatedHash = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      if (receivedHash !== generatedHash) {
        throw new Error('Assinatura inválida');
      }

      return true;
    } catch (error) {
      console.error('Erro na validação de assinatura:', error.message);
      throw error;
    }
  }
};

module.exports = validationUtils;
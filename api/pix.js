// /api/pix.js — Gera um pagamento PIX real via Mercado Pago
// Documentação: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post

const { MercadoPagoConfig, Payment } = require('mercadopago');

module.exports = async function handler(req, res) {
  // Permite CORS (para o site conseguir chamar a API)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const { amount, description, shelter, email } = req.body;

    // Validações básicas
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email obrigatório' });
    }

    // Inicializa o Mercado Pago com a chave secreta (vem das variáveis de ambiente)
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const payment = new Payment(client);

    // Cria o pagamento PIX
    const result = await payment.create({
      body: {
        transaction_amount: parseFloat(amount),
        description: description || `Doação Gatinhos do Rio - ${shelter || 'Abrigo'}`,
        payment_method_id: 'pix',
        payer: {
          email: email
        }
      }
    });

    // Retorna os dados do PIX pro frontend
    return res.status(200).json({
      success: true,
      payment_id: result.id,
      status: result.status,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: result.point_of_interaction?.transaction_data?.ticket_url
    });

  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    return res.status(500).json({
      error: 'Erro ao gerar PIX',
      details: error.message
    });
  }
};

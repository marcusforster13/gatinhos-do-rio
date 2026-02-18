// /api/status.js — Verifica se o PIX foi pago
const { MercadoPagoConfig, Payment } = require('mercadopago');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID do pagamento obrigatório' });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const payment = new Payment(client);
    const result = await payment.get({ id: id });

    return res.status(200).json({
      status: result.status,
      status_detail: result.status_detail,
      paid: result.status === 'approved'
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ error: 'Erro ao verificar pagamento' });
  }
};

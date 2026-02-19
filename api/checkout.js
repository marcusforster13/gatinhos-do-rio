// /api/checkout.js — Gera um Checkout Pro do Mercado Pago
// Permite PIX, Cartão de Crédito/Débito e Boleto
const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const { items, shelter, email } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Nenhum item no carrinho' });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const preference = new Preference(client);

    // Monta os itens pro Mercado Pago
    const mpItems = items.map(function(item) {
      return {
        title: item.name + ' — Gatinhos do Rio',
        description: 'Doação para ' + (shelter || 'Abrigo'),
        quantity: item.qty,
        unit_price: parseFloat(item.price),
        currency_id: 'BRL'
      };
    });

    // URL do site para redirecionamento
    const siteUrl = process.env.SITE_URL || 'https://www.gatinhosdorio.com.br';

    const result = await preference.create({
      body: {
        items: mpItems,
        payer: email ? { email: email } : undefined,
        back_urls: {
          success: siteUrl + '?payment=success',
          failure: siteUrl + '?payment=failure',
          pending: siteUrl + '?payment=pending'
        },
        auto_return: 'approved',
        statement_descriptor: 'GATINHOS DO RIO',
        external_reference: 'donation_' + Date.now()
      }
    });

    return res.status(200).json({
      success: true,
      checkout_url: result.init_point,
      sandbox_url: result.sandbox_init_point
    });

  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return res.status(500).json({
      error: 'Erro ao criar checkout',
      details: error.message
    });
  }
};

// /api/email.js — Envia email personalizado de confirmação de doação
// Usa Resend (resend.com) — 100 emails/dia grátis

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const { email, items, total, shelter, prize } = req.body;

    if (!email || !items || !total || !shelter) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

    if (!RESEND_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY não configurada' });
    }

    // Monta a lista de itens em HTML
    const itemsHtml = items.map(i =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.emoji || '🐱'} ${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">R$ ${(i.qty * i.price).toFixed(2).replace('.', ',')}</td>
      </tr>`
    ).join('');

    const prizeHtml = prize
      ? `<div style="background:#fff8e1;border-radius:12px;padding:16px;margin:16px 0;text-align:center;border:2px solid #f5c518;">
          <div style="font-size:2rem;">${prize.emoji || '🎁'}</div>
          <div style="font-weight:700;color:#5c3d1e;font-size:1.1rem;">${prize.name || 'Brinde'}</div>
          <div style="color:#888;font-size:0.85rem;">${prize.rarity || ''}</div>
        </div>`
      : '';

    // Email HTML para o doador
    const donorHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fdf6e3;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1a7a4a,#0f5c35);padding:24px;text-align:center;">
        <div style="font-size:2.5rem;">🐱</div>
        <h1 style="color:#f5c518;margin:8px 0 4px;font-size:1.5rem;">Gatinhos do Rio</h1>
        <p style="color:rgba(255,255,255,0.8);margin:0;font-size:0.9rem;">Obrigado pela sua doação!</p>
      </div>
      <div style="padding:24px;">
        <p style="color:#5c3d1e;font-size:1rem;margin-bottom:16px;">
          Sua doação foi registrada com sucesso! Os gatinhos agradecem muito 💚
        </p>
        <div style="background:white;border-radius:12px;padding:4px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;color:#5c3d1e;">
            <thead>
              <tr style="background:#f0f8f0;">
                <th style="padding:10px 12px;text-align:left;">Item</th>
                <th style="padding:10px 12px;text-align:center;">Qtd</th>
                <th style="padding:10px 12px;text-align:right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background:#f0f8f0;">
                <td colspan="2" style="padding:10px 12px;font-weight:700;">Total</td>
                <td style="padding:10px 12px;text-align:right;font-weight:700;color:#1a7a4a;font-size:1.1rem;">R$ ${total.toFixed(2).replace('.', ',')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="background:#e8f4fd;border-radius:10px;padding:12px 16px;margin-bottom:16px;">
          <strong style="color:#1e4fa8;">🏠 Abrigo:</strong>
          <span style="color:#5c3d1e;">${shelter}</span>
        </div>
        ${prizeHtml}
        <p style="color:#888;font-size:0.8rem;text-align:center;margin-top:20px;">
          Feito com ❤️ no Rio de Janeiro • Gatinhos do Rio © 2025
        </p>
      </div>
    </div>`;

    // Envia email pro doador
    const donorResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + RESEND_KEY
      },
      body: JSON.stringify({
        from: 'Gatinhos do Rio <contato@gatinhosdorio.com.br>',
        to: [email],
        subject: '🐱 Obrigado pela doação! — Gatinhos do Rio',
        html: donorHtml
      })
    });

    // Envia email pro dono (você) se configurado
    if (OWNER_EMAIL) {
      const ownerHtml = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#1a7a4a;">🎉 Nova doação recebida!</h2>
        <p><strong>Email do doador:</strong> ${email}</p>
        <p><strong>Abrigo:</strong> ${shelter}</p>
        <p><strong>Total:</strong> R$ ${total.toFixed(2).replace('.', ',')}</p>
        <h3>Itens:</h3>
        <ul>
          ${items.map(i => '<li>' + i.emoji + ' ' + i.name + ' x' + i.qty + ' — R$ ' + (i.qty * i.price).toFixed(2).replace('.', ',') + '</li>').join('')}
        </ul>
      </div>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + RESEND_KEY
        },
        body: JSON.stringify({
          from: 'Gatinhos do Rio <contato@gatinhosdorio.com.br>',
          to: [OWNER_EMAIL],
          subject: '🐱 Nova doação: R$ ' + total.toFixed(2).replace('.', ',') + ' — ' + shelter,
          html: ownerHtml
        })
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return res.status(500).json({ error: 'Erro ao enviar email' });
  }
};

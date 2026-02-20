// /api/clinic.js — Recebe solicitações de apoio de clínicas veterinárias
// Envia email para o administrador com os dados

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const { fields, html } = req.body;

    if (!fields || !fields.nome || !fields.cnpj || !fields.email) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

    if (!RESEND_KEY || !OWNER_EMAIL) {
      return res.status(500).json({ error: 'Configuração de email incompleta' });
    }

    const urgencyLabels = {
      'preventive': '🟢 Preventivo',
      'moderate': '🟡 Moderado',
      'urgent': '🔴 Urgente'
    };

    // Email para o administrador
    const adminHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf6e3;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1a7a4a,#0f5c35);padding:24px;text-align:center;">
        <div style="font-size:2.5rem;">🏥</div>
        <h1 style="color:#f5c518;margin:8px 0 4px;font-size:1.5rem;">Nova Solicitação de Apoio</h1>
        <p style="color:rgba(255,255,255,0.8);margin:0;font-size:0.9rem;">Clínica Veterinária</p>
      </div>
      <div style="padding:24px;">
        <div style="background:white;border-radius:12px;padding:16px;margin-bottom:16px;">
          <h3 style="color:#1a7a4a;margin:0 0 12px;font-size:1rem;">🏥 Dados da Clínica</h3>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Nome:</strong> ${fields.nome}</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>CNPJ:</strong> ${fields.cnpj}</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Responsável:</strong> ${fields.responsavel} (CRMV: ${fields.crmv})</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Email:</strong> ${fields.email}</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Telefone:</strong> ${fields.telefone || 'Não informado'}</p>
        </div>
        <div style="background:white;border-radius:12px;padding:16px;margin-bottom:16px;">
          <h3 style="color:#1a7a4a;margin:0 0 12px;font-size:1rem;">🩺 Procedimento</h3>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Abrigo:</strong> ${fields.abrigo || 'Não informado'}</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Tipo:</strong> ${fields.procedimento}</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Fundo vinculado:</strong> ${fields.fundo}</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Animais:</strong> ${fields.qtd || '1'}</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Valor:</strong> ${fields.valor}</p>
          <p style="margin:4px 0;color:#5c3d1e;"><strong>Urgência:</strong> ${urgencyLabels[fields.urgencia] || fields.urgencia}</p>
        </div>
        <div style="background:white;border-radius:12px;padding:16px;">
          <h3 style="color:#1a7a4a;margin:0 0 8px;font-size:1rem;">📝 Descrição</h3>
          <p style="color:#5c3d1e;line-height:1.5;">${fields.descricao || 'Nenhuma descrição fornecida.'}</p>
        </div>
      </div>
    </div>`;

    // Envia pro admin
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + RESEND_KEY
      },
      body: JSON.stringify({
        from: 'Gatinhos do Rio <contato@gatinhosdorio.com.br>',
        to: [OWNER_EMAIL],
        subject: '🏥 Nova Solicitação: ' + fields.nome + ' — ' + fields.procedimento + (fields.urgencia === 'urgent' ? ' ⚠️ URGENTE' : ''),
        html: adminHtml
      })
    });

    // Envia confirmação pra clínica
    const clinicHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fdf6e3;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1a7a4a,#0f5c35);padding:24px;text-align:center;">
        <div style="font-size:2.5rem;">🐱</div>
        <h1 style="color:#f5c518;margin:8px 0 4px;font-size:1.5rem;">Gatinhos do Rio</h1>
        <p style="color:rgba(255,255,255,0.8);margin:0;font-size:0.9rem;">Solicitação recebida!</p>
      </div>
      <div style="padding:24px;">
        <p style="color:#5c3d1e;">Olá <strong>${fields.responsavel || fields.nome}</strong>,</p>
        <p style="color:#5c3d1e;">Recebemos sua solicitação de apoio para <strong>${fields.procedimento}</strong> no valor de <strong>${fields.valor}</strong>.</p>
        <p style="color:#5c3d1e;">Nossa equipe irá analisar e entraremos em contato em breve pelo email informado.</p>
        <div style="background:#e8f5e9;border-radius:12px;padding:14px;margin:16px 0;text-align:center;">
          <strong style="color:#1a7a4a;">Status: Em análise 📋</strong>
        </div>
        <p style="color:#888;font-size:0.8rem;text-align:center;margin-top:20px;">
          Feito com ❤️ no Rio de Janeiro • Gatinhos do Rio
        </p>
      </div>
    </div>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + RESEND_KEY
      },
      body: JSON.stringify({
        from: 'Gatinhos do Rio <contato@gatinhosdorio.com.br>',
        to: [fields.email],
        subject: '🐱 Solicitação recebida — Gatinhos do Rio',
        html: clinicHtml
      })
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro clinic:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};

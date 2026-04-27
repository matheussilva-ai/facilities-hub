// api/zoho.js — Facilities Hub
// Busca tickets abertos no Zoho Desk e retorna contagem por status

const CLIENT_ID     = '1000.KWHETKXOEH2HKNKU5GLA6VBF9F7RED';
const CLIENT_SECRET = '63530435d52fe0df1ca3b81b466df13d04bf5874a4';
const REFRESH_TOKEN = '1000.8fd74150f8ca25a5723a780ed25684e6.57f11dd2d0363e433028a63502953cfc';
const ORG_ID        = '860600477';

async function getAccessToken() {
  const url = 'https://accounts.zoho.com/oauth/v2/token' +
    '?grant_type=refresh_token' +
    '&client_id=' + CLIENT_ID +
    '&client_secret=' + CLIENT_SECRET +
    '&refresh_token=' + REFRESH_TOKEN;

  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token inválido: ' + JSON.stringify(data));
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = await getAccessToken();

    // Buscar tickets abertos
    const ticketsRes = await fetch(
      'https://desk.zoho.com/api/v1/tickets?orgId=' + ORG_ID + '&status=open&limit=50',
      { headers: { 'Authorization': 'Zoho-oauthtoken ' + token, 'orgId': ORG_ID } }
    );
    const ticketsData = await ticketsRes.json();

    const tickets = ticketsData.data || [];
    const total   = ticketsData.count || tickets.length;

    // Agrupar por prioridade
    const porPrioridade = { high: 0, medium: 0, low: 0 };
    tickets.forEach(t => {
      const p = (t.priority || '').toLowerCase();
      if (p === 'high')   porPrioridade.high++;
      else if (p === 'medium') porPrioridade.medium++;
      else porPrioridade.low++;
    });

    // Últimos 3 tickets para preview
    const preview = tickets.slice(0, 3).map(t => ({
      id:       t.ticketNumber,
      assunto:  t.subject,
      status:   t.status,
      prioridade: t.priority,
      criado:   t.createdTime,
    }));

    return res.status(200).json({
      ok: true,
      total,
      porPrioridade,
      preview,
    });

  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
}

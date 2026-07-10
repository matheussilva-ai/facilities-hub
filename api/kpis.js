// api/kpis.js — Facilities Hub
// Proxy para buscar todos os tickets do Zoho Desk para os KPIs
// Mesmo padrão do zoho.js existente

const CLIENT_ID     = '1000.KWHETKXOEH2HKNKU5GLA6VBF9F7RED';
const CLIENT_SECRET = '63530435d52fe0df1ca3b81b466df13d04bf5874a4';
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ORG_ID        = '860600477';
const DEPT_ID       = '1024222000027699438';

// Cache de 10 minutos (dados históricos mudam pouco)
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function getAccessToken() {
  const res = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: REFRESH_TOKEN,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Falha ao obter access token: ' + JSON.stringify(data));
  return data.access_token;
}

async function fetchPage(token, from) {
  const params = new URLSearchParams({
    departmentId:      DEPT_ID,
    createdTimeRange:  '2026-01-01T00:00:00.000Z,2026-12-31T23:59:59.000Z',
    from:              String(from),
    limit:             '100',
    sortBy:            'createdTime',
  });

  const res = await fetch(`https://desk.zoho.com/api/v1/tickets/search?${params}`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      orgId: ORG_ID,
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Zoho API ${res.status}: ${txt}`);
  }

  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Retorna cache se ainda válido
  if (_cache && (Date.now() - _cacheTime) < CACHE_TTL) {
    return res.status(200).json({ ..._cache, cached: true });
  }

  try {
    const token = await getAccessToken();

    // Busca primeiro lote para saber o total
    const first = await fetchPage(token, 0);
    const total = first.count || 0;
    let tickets = first.data || [];

    // Pagina o restante
    const promises = [];
    for (let from = 100; from < total; from += 100) {
      promises.push(fetchPage(token, from));
    }

    // Processa em lotes de 5 para evitar rate limit
    for (let i = 0; i < promises.length; i += 5) {
      const batch = promises.slice(i, i + 5);
      const results = await Promise.all(batch);
      results.forEach(r => { tickets = tickets.concat(r.data || []); });
      if (i + 5 < promises.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    const result = { ok: true, total: tickets.length, tickets };
    _cache = result;
    _cacheTime = Date.now();

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxEMC8mqvle9pP3dZR5OwesgBMPFb_SES5NydhpzKKVuD0jP5K-5NDJF9HW4pOYh7hjow/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET — leitura: /api/terceiros?group=ghc&month=2026-09
    if (req.method === 'GET') {
      const { group, month } = req.query;
      const params = new URLSearchParams({ group: group || '', month: month || '' });
      const response = await fetch(`${GAS_URL}?${params.toString()}`);
      const data = await response.json();
      return res.status(200).json(data);
    }

    // POST — gravação: { group, date, techId, status, note }
    if (req.method === 'POST') {
      const { group, date, techId, status, note } = req.body;
      const params = new URLSearchParams({
        action: 'save',
        group: group || '',
        date: date || '',
        techId: techId || '',
        status: status || '',
        note: note || '',
      });
      const response = await fetch(`${GAS_URL}?${params.toString()}`);
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

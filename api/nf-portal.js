export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const GAS_URL = "https://script.google.com/macros/s/AKfycbxEIjDbH-Ll--prtbCmkat1rDL0r2FmXGeC2eIni-Zi1p1aydrz_rU6NAQm9MwgLKGH/exec";

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message });
  }
}

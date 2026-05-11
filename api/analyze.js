cat > /mnt/user-data/outputs/analyze.js << 'ENDOFFILE'
// api/analyze.js — Vercel Serverless Function
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key não configurada" });
  }

  try {
    const { system, user, max_tokens = 1000 } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const raw = data.content[0].text;

    // Parser robusto — tenta 3 formas
    let parsed = null;

    try { parsed = JSON.parse(raw); } catch (_) {}

    if (!parsed) {
      try {
        const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch (_) {}
    }

    if (!parsed) {
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (_) {}
    }

    return res.status(200).json({ text: raw, parsed: parsed || null });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
ENDOFFILE
echo "Feito"
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key não configurada" });

  const { type, payload } = req.body;

  try {
    // ── MODO 1: ANÁLISE — faz 2 chamadas simples separadas ──
    if (type === "analisar") {
      const { transcricao, prodNome, prodURL, siteCtx, printBase64, printMediaType } = payload;

      // Chamada 1: analisa a VSL
      const vslResp = await fetchClaude(apiKey, {
        system: "Responda APENAS com números e frases curtas. Sem JSON. Sem formatação.",
        user: `Analise esta VSL e responda exatamente neste formato (uma linha cada):
TIPO: [número de 1 a 9 do Enneagrama dominante]
EVID: [uma frase curta com evidência do texto]
BIGIDEIA: [uma frase com a Big Idea da VSL]
CENA: [cena de abertura]
ACAO: [ação e queda]
ESPELHO: [espelho coletivo]
SOLUCAO: [solução apresentada]
PROMESSA: [promessa dupla]
OBJECAO: [objeção tratada]
URGENCIA: [urgência usada]
MECANISMO: [mecanismo central]
PERSONAGEM: [perfil do narrador]

VSL:
${transcricao.slice(0, 3000)}`
      });

      // Chamada 2: analisa o produto
      const prodUser = printBase64 ? [
        { type: "image", source: { type: "base64", media_type: printMediaType, data: printBase64 } },
        { type: "text", text: `Analise este produto e responda exatamente neste formato:
TIPO: [número de 1 a 9 do Enneagrama dominante]
EVID: [uma frase curta com evidência]
BIGIDEIA: [uma frase com a Big Idea do produto]
ALINHADO: [sim ou nao — comparando com Enneagrama tipo ${parseLine(vslResp, "TIPO")} da VSL]
GAP: [se não alinhado: descrição do gap em uma frase]
OPORTUNIDADE: [oportunidade estratégica em uma frase]
CAMINHOA: [como usar mantendo Enneagrama da VSL — uma frase]
CAMINHOB: [como usar mantendo Enneagrama do produto — uma frase]
CAMINHOC: [tipo ponte sugerido e motivo — uma frase]

Produto: ${prodNome}
URL: ${prodURL}
${siteCtx}` }
      ] : `Analise este produto e responda exatamente neste formato:
TIPO: [número de 1 a 9 do Enneagrama dominante]
EVID: [uma frase curta com evidência]
BIGIDEIA: [uma frase com a Big Idea do produto]
ALINHADO: [sim ou nao — comparando com Enneagrama tipo ${parseLine(vslResp, "TIPO")} da VSL]
GAP: [se não alinhado: descrição do gap em uma frase]
OPORTUNIDADE: [oportunidade estratégica em uma frase]
CAMINHOA: [como usar mantendo Enneagrama da VSL — uma frase]
CAMINHOB: [como usar mantendo Enneagrama do produto — uma frase]
CAMINHOC: [tipo ponte sugerido e motivo — uma frase]

Produto: ${prodNome}
URL: ${prodURL}
${siteCtx}`;

      const prodResp = await fetchClaude(apiKey, {
        system: "Responda APENAS no formato solicitado. Sem JSON. Sem formatação extra.",
        user: prodUser
      });

      // Monta objeto estruturado a partir das respostas em texto simples
      const alinhado = parseLine(prodResp, "ALINHADO").toLowerCase().includes("sim");
      const resultado = {
        tipoVSL: parseInt(parseLine(vslResp, "TIPO")) || 3,
        evidVSL: parseLine(vslResp, "EVID"),
        bigIdeiaVSL: parseLine(vslResp, "BIGIDEIA"),
        tipoProduto: parseInt(parseLine(prodResp, "TIPO")) || 3,
        evidProduto: parseLine(prodResp, "EVID"),
        bigIdeiaProduto: parseLine(prodResp, "BIGIDEIA"),
        alinhados: alinhado,
        gap: parseLine(prodResp, "GAP"),
        oportunidade: parseLine(prodResp, "OPORTUNIDADE"),
        caminhos: {
          A: parseLine(prodResp, "CAMINHOA"),
          B: parseLine(prodResp, "CAMINHOB"),
          C: parseLine(prodResp, "CAMINHOC"),
        },
        caesp: {
          cena: parseLine(vslResp, "CENA"),
          acao: parseLine(vslResp, "ACAO"),
          espelho: parseLine(vslResp, "ESPELHO"),
          solucao: parseLine(vslResp, "SOLUCAO"),
          promessa: parseLine(vslResp, "PROMESSA"),
          objecao: parseLine(vslResp, "OBJECAO"),
          urgencia: parseLine(vslResp, "URGENCIA"),
          mecanismo: parseLine(vslResp, "MECANISMO"),
          personagem: parseLine(vslResp, "PERSONAGEM"),
        }
      };

      return res.status(200).json({ ok: true, resultado });
    }

    // ── MODO 2: GERAR COPY — texto livre ──
    if (type === "gerar") {
      const { system, user } = payload;
      const texto = await fetchClaude(apiKey, { system, user });
      return res.status(200).json({ ok: true, texto });
    }

    return res.status(400).json({ error: "Tipo inválido" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Faz a chamada para a API da Anthropic
async function fetchClaude(apiKey, { system, user, max_tokens = 1000 }) {
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
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

// Extrai valor de uma linha no formato "CHAVE: valor"
function parseLine(text, key) {
  const lines = text.split("\n");
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim().toUpperCase().replace(/\s+/g, "");
    if (k === key.toUpperCase().replace(/\s+/g, "")) {
      return line.slice(idx + 1).trim();
    }
  }
  return "";
}

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
 
    // ── ANALISAR CRIATIVO ─────────────────────────────
    if (type === "criativo") {
      const { printBase64, printMediaType, prodNome, prodURL, siteCtx, tipoVSL, tipoSite } = payload;
 
      let userContent;
 
      if (printBase64) {
        userContent = [
          { type: "image", source: { type: "base64", media_type: printMediaType || "image/jpeg", data: printBase64 } },
          { type: "text", text: `Analise este criativo publicitário e responda exatamente neste formato (uma linha por campo, sem JSON):
 
TIPO_CRIATIVO: [número de 1 a 9 do Enneagrama dominante no criativo]
EVID_CRIATIVO: [evidência visual ou textual que prova o tipo — uma frase]
HOOK_VISUAL: [o que chama atenção primeiro no criativo — uma frase]
MENSAGEM_CENTRAL: [mensagem principal que o criativo comunica — uma frase]
EMOCAO_ATIVADA: [emoção principal que o criativo desperta — uma frase]
CONGRUENCIA_SITE: [sim ou parcial ou nao — comparando com Enneagrama tipo ${tipoSite || "não informado"} do site]
CONGRUENCIA_VSL: [sim ou parcial ou nao — comparando com Enneagrama tipo ${tipoVSL || "não informado"} da VSL]
O_QUE_FUNCIONA: [o que está bem alinhado no criativo — duas frases]
O_QUE_QUEBRA: [o que está desalinhado ou fraco — duas frases]
AJUSTE_VISUAL: [sugestão de ajuste no elemento visual — duas frases]
AJUSTE_TEXTO: [sugestão de ajuste no texto/copy do criativo — duas frases]
AJUSTE_EMOCIONAL: [sugestão de ajuste no tom emocional — duas frases]
PRIORIDADE: [qual ajuste fazer primeiro e por quê — uma frase]
 
Produto: ${prodNome || "não informado"}
URL: ${prodURL || "não informado"}
${siteCtx || ""}` }
        ];
      } else {
        userContent = `Não foi enviado um criativo visual. Responda apenas:
TIPO_CRIATIVO: sem criativo
EVID_CRIATIVO: nenhum criativo foi enviado
HOOK_VISUAL: —
MENSAGEM_CENTRAL: —
EMOCAO_ATIVADA: —
CONGRUENCIA_SITE: —
CONGRUENCIA_VSL: —
O_QUE_FUNCIONA: —
O_QUE_QUEBRA: —
AJUSTE_VISUAL: —
AJUSTE_TEXTO: —
AJUSTE_EMOCIONAL: —
PRIORIDADE: envie um criativo para análise`;
      }
 
      const texto = await fetchClaude(apiKey, {
        system: "Você é especialista em análise de criativos publicitários e psicologia do Enneagrama. Responda APENAS no formato solicitado, uma linha por campo.",
        user: userContent,
        max_tokens: 1000,
      });
 
      const r = {
        tipoCriativo: parseLine(texto, "TIPO_CRIATIVO"),
        evidCriativo: parseLine(texto, "EVID_CRIATIVO"),
        hookVisual: parseLine(texto, "HOOK_VISUAL"),
        mensagemCentral: parseLine(texto, "MENSAGEM_CENTRAL"),
        emocaoAtivada: parseLine(texto, "EMOCAO_ATIVADA"),
        congruenciaSite: parseLine(texto, "CONGRUENCIA_SITE"),
        congruenciaVSL: parseLine(texto, "CONGRUENCIA_VSL"),
        oQueFunciona: parseLine(texto, "O_QUE_FUNCIONA"),
        oQueQuebra: parseLine(texto, "O_QUE_QUEBRA"),
        ajusteVisual: parseLine(texto, "AJUSTE_VISUAL"),
        ajusteTexto: parseLine(texto, "AJUSTE_TEXTO"),
        ajusteEmocional: parseLine(texto, "AJUSTE_EMOCIONAL"),
        prioridade: parseLine(texto, "PRIORIDADE"),
      };
 
      return res.status(200).json({ ok: true, resultado: r });
    }
 
    // ── ANALISAR VSL + PRODUTO ────────────────────────
    if (type === "analisar") {
      const { transcricao, prodNome, prodURL, siteCtx, printBase64, printMediaType } = payload;
 
      const temVSL = transcricao && transcricao.trim().length > 10;
      const temProduto = (prodNome && prodNome.trim()) || (prodURL && prodURL.trim()) || siteCtx;
 
      // Chamada 1: analisa a VSL (se tiver)
      let vslResp = "";
      if (temVSL) {
        vslResp = await fetchClaude(apiKey, {
          system: "Responda APENAS no formato solicitado. Uma linha por campo. Sem JSON. Sem formatação extra.",
          user: `Analise esta VSL e responda exatamente neste formato:
TIPO: [número 1-9 do Enneagrama dominante]
EVID: [evidência do texto que prova o tipo — uma frase]
BIGIDEIA: [Big Idea da VSL — uma frase]
CENA: [cena de abertura]
ACAO: [ação e queda — o erro inocente]
ESPELHO: [espelho coletivo]
SOLUCAO: [solução apresentada]
PROMESSA: [promessa dupla]
OBJECAO: [objeção tratada]
URGENCIA: [urgência usada]
MECANISMO: [mecanismo central do produto]
PERSONAGEM: [perfil do narrador]
 
VSL:
${transcricao.slice(0, 3000)}`,
          max_tokens: 1000,
        });
      }
 
      // Chamada 2: analisa o produto (se tiver)
      let prodResp = "";
      if (temProduto) {
        const tipoVSL = parseLine(vslResp, "TIPO") || "não identificado";
 
        const prodUserText = `Analise este produto e responda exatamente neste formato:
TIPO: [número 1-9 do Enneagrama dominante]
EVID: [evidência do site/conteúdo que prova o tipo — uma frase]
BIGIDEIA: [Big Idea do produto — uma frase]
ALINHADO: [sim ou nao — comparando com Enneagrama tipo ${tipoVSL} da VSL]
GAP: [se não alinhado: descrição do gap — uma frase]
OPORTUNIDADE: [oportunidade estratégica — uma frase]
CAMINHOA: [como usar mantendo Enneagrama da VSL — uma frase]
CAMINHOB: [como usar mantendo Enneagrama do produto — uma frase]
CAMINHOC: [tipo ponte sugerido e motivo — uma frase]
 
Produto: ${prodNome || "não informado"}
URL: ${prodURL || "não informado"}
${siteCtx || ""}`;
 
        const prodUser = printBase64 ? [
          { type: "image", source: { type: "base64", media_type: printMediaType || "image/jpeg", data: printBase64 } },
          { type: "text", text: prodUserText }
        ] : prodUserText;
 
        prodResp = await fetchClaude(apiKey, {
          system: "Responda APENAS no formato solicitado. Uma linha por campo. Sem JSON.",
          user: prodUser,
          max_tokens: 1000,
        });
      }
 
      const alinhado = parseLine(prodResp, "ALINHADO").toLowerCase().includes("sim");
 
      const resultado = {
        tipoVSL: parseInt(parseLine(vslResp, "TIPO")) || null,
        evidVSL: parseLine(vslResp, "EVID"),
        bigIdeiaVSL: parseLine(vslResp, "BIGIDEIA"),
        tipoProduto: parseInt(parseLine(prodResp, "TIPO")) || null,
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
        },
      };
 
      return res.status(200).json({ ok: true, resultado });
    }
 
    // ── GERAR COPY ────────────────────────────────────
    if (type === "gerar") {
      const { system, user } = payload;
      const texto = await fetchClaude(apiKey, { system, user, max_tokens: 1000 });
      return res.status(200).json({ ok: true, texto });
    }
 
    return res.status(400).json({ error: "Tipo inválido" });
 
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
 
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
 
function parseLine(text, key) {
  if (!text) return "";
  const lines = text.split("\n");
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim().toUpperCase().replace(/\s+/g, "_");
    const target = key.toUpperCase().replace(/\s+/g, "_");
    if (k === target) return line.slice(idx + 1).trim();
  }
  return "";
}

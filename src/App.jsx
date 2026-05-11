import { useState, useRef } from "react";

const T = {
  bg:"#0A0A0F", surface:"#12121A", card:"#1A1A28", border:"#2A2A40",
  accent:"#7C5CFC", accentB:"#5B3FD4", gold:"#F5C842", red:"#FF4D6D",
  green:"#2ECC71", muted:"#6B6B8A", text:"#E8E8F0", textSub:"#9898B8",
};

const ENNEAGRAM = {
  1:{nome:"O Perfeccionista",driver:"medo do erro, desejo de integridade",gatilho:"precisão, prova, autoridade moral",cor:"#E8B4B8"},
  2:{nome:"O Prestativo",driver:"medo de não ser amado, desejo de ser necessário",gatilho:"conexão, cuidado, pertencimento",cor:"#F9C784"},
  3:{nome:"O Realizador",driver:"medo do fracasso, desejo de sucesso visível",gatilho:"resultados, status, eficiência",cor:"#F4D03F"},
  4:{nome:"O Individualista",driver:"medo de ser comum, desejo de identidade única",gatilho:"autenticidade, profundidade, significado",cor:"#A29BFE"},
  5:{nome:"O Investigador",driver:"medo da incompetência, desejo de conhecimento",gatilho:"dados, mecanismo, lógica",cor:"#74B9FF"},
  6:{nome:"O Leal",driver:"medo do abandono, desejo de segurança",gatilho:"prova social, garantia, autoridade confiável",cor:"#55EFC4"},
  7:{nome:"O Entusiasta",driver:"medo da dor/limitação, desejo de experiência",gatilho:"possibilidade, variedade, futuro brilhante",cor:"#FDCB6E"},
  8:{nome:"O Desafiador",driver:"medo de ser controlado, desejo de poder",gatilho:"controle, força, resultado direto",cor:"#FF7675"},
  9:{nome:"O Pacificador",driver:"medo do conflito, desejo de harmonia",gatilho:"simplicidade, paz, inclusão",cor:"#B2BEC3"},
};

const FORMATOS = [
  {id:"mini_vsl", label:"Mini VSL",        desc:"60–90s",  icon:"▶"},
  {id:"vsl",      label:"VSL Completa",    desc:"5–15min", icon:"◉"},
  {id:"social",   label:"Criativo Social", desc:"15–30s",  icon:"◈"},
];

const CAMINHOS = [
  {id:"A", label:"Caminho A", desc:"Manter Enneagrama da VSL de referência"},
  {id:"B", label:"Caminho B", desc:"Manter Enneagrama do produto de destino"},
  {id:"C", label:"Caminho C", desc:"Enneagrama ponte entre os dois públicos"},
];

// ── API — chama o backend seguro ─────────────────────────
async function callAPI(system, userContent, max_tokens = 1000) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user: userContent, max_tokens }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  // Usa parsed se o backend já parseou, senão usa o texto
  if (data.parsed) return data.parsed;
  return data.text;
}

async function callAPIMultimodal(system, messages, max_tokens = 1000) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user: messages, max_tokens }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (data.parsed) return data.parsed;
  return data.text;
}

function parseJSON(raw) {
  // Se já é objeto (veio parsed do backend), retorna direto
  if (typeof raw === "object" && raw !== null) return raw;
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Falha ao interpretar resposta da IA");
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(file);
  });
}

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#0A0A0F;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fu{animation:fadeUp 0.35s ease forwards}
  input:focus,textarea:focus{border-color:#7C5CFC!important;outline:none}
  button:active{transform:scale(0.97)}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-thumb{background:#2A2A40;border-radius:3px}
  .copybox{white-space:pre-wrap;line-height:1.85;font-family:sans-serif;font-size:13px}
  .drop-zone{border:2px dashed #2A2A40;border-radius:12px;padding:24px;text-align:center;
    cursor:pointer;transition:border-color 0.2s,background 0.2s;}
  .drop-zone:hover,.drop-zone.over{border-color:#7C5CFC;background:#7C5CFC10;}
  .img-thumb{width:100%;max-height:220px;object-fit:cover;border-radius:10px;
    border:1px solid #2A2A40;display:block;}
`;

const mk = {
  card: (extra={}) => ({
    background:T.card, border:`1px solid ${T.border}`,
    borderRadius:16, padding:24, marginBottom:16, ...extra
  }),
  lbl: {
    display:"block", fontSize:10, fontWeight:700,
    letterSpacing:"0.09em", color:T.muted, marginBottom:7,
    fontFamily:"sans-serif", textTransform:"uppercase"
  },
  inp: {
    width:"100%", background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:10, color:T.text, padding:"11px 14px",
    fontSize:13, fontFamily:"sans-serif", transition:"border-color 0.2s"
  },
  ta: (rows=6) => ({
    width:"100%", background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:10, color:T.text, padding:"12px 14px",
    fontSize:13, fontFamily:"sans-serif", lineHeight:1.6,
    resize:"vertical", transition:"border-color 0.2s", minHeight: rows*22
  }),
  btn: (bg, color="#fff", extra={}) => ({
    background:bg, border:"none", borderRadius:10, color,
    padding:"12px 26px", fontSize:13, fontWeight:700,
    cursor:"pointer", fontFamily:"sans-serif",
    letterSpacing:"0.03em", transition:"opacity 0.2s", ...extra
  }),
  chip: (active, cor) => ({
    padding:"7px 15px", borderRadius:8, cursor:"pointer", fontSize:12,
    fontWeight: active?700:400, fontFamily:"sans-serif",
    border:`1px solid ${active?cor:T.border}`,
    background: active?cor+"22":"transparent",
    color: active?cor:T.textSub, transition:"all 0.15s",
  }),
  tag: (cor) => ({
    display:"inline-block", padding:"2px 10px", borderRadius:20,
    fontSize:10, fontWeight:700, background:cor+"28", color:cor,
    fontFamily:"sans-serif", letterSpacing:"0.05em",
  }),
  infoCard: (cor) => ({
    background:cor+"12", border:`1px solid ${cor}35`,
    borderRadius:12, padding:16, marginBottom:10,
  }),
  stepNum: (bg) => ({
    width:30, height:30, borderRadius:"50%",
    background: bg||`linear-gradient(135deg,${T.accent},${T.accentB})`,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:12, fontWeight:700, flexShrink:0, color:"#fff",
  }),
  spinner: {
    display:"inline-block", width:16, height:16,
    border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff",
    borderRadius:"50%", animation:"spin 0.8s linear infinite",
    marginRight:10, verticalAlign:"middle",
  },
  err: {
    background:"#FF4D6D15", border:`1px solid #FF4D6D40`,
    borderRadius:10, padding:12, color:T.red,
    fontSize:13, fontFamily:"sans-serif", marginBottom:12,
  },
};

function ImageUpload({ value, onChange, label, hint }) {
  const inputRef = useRef();
  const [over, setOver] = useState(false);

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange({ file, url });
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={mk.lbl}>{label}</label>
      <div
        className={`drop-zone${over?" over":""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); }}
      >
        {value?.url ? (
          <div>
            <img src={value.url} alt="preview" className="img-thumb" />
            <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:8 }}>
              Clique para trocar a imagem
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:28, marginBottom:8 }}>📸</div>
            <div style={{ fontSize:13, color:T.textSub, fontFamily:"sans-serif" }}>
              Arraste o printscreen aqui ou clique para selecionar
            </div>
            {hint && (
              <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:6 }}>
                {hint}
              </div>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef} type="file" accept="image/*"
        style={{ display:"none" }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}

function EnneaCard({ tipo, label, evidencias, bigIdeia }) {
  const e = ENNEAGRAM[tipo];
  if (!e) return null;
  return (
    <div style={{ ...mk.infoCard(e.cor), flex:1, minWidth:220 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <span style={mk.tag(e.cor)}>Tipo {tipo}</span>
        <span style={{ fontSize:13, fontWeight:700 }}>{e.nome}</span>
      </div>
      <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:11, color:T.textSub, fontFamily:"sans-serif", marginBottom:4 }}>
        <b style={{ color:T.text }}>Driver:</b> {e.driver}
      </div>
      <div style={{ fontSize:11, color:T.textSub, fontFamily:"sans-serif", marginBottom:10 }}>
        <b style={{ color:T.text }}>Gatilhos:</b> {e.gatilho}
      </div>
      {bigIdeia && (
        <div style={{ background:e.cor+"18", borderRadius:8, padding:10, marginBottom:8 }}>
          <div style={{ fontSize:9, fontWeight:700, color:e.cor, letterSpacing:"0.07em",
            fontFamily:"sans-serif", marginBottom:4 }}>💡 BIG IDEA</div>
          <div style={{ fontSize:12, color:T.text, fontFamily:"sans-serif", lineHeight:1.5 }}>
            {bigIdeia}
          </div>
        </div>
      )}
      {evidencias && (
        <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif",
          fontStyle:"italic", borderTop:`1px solid ${T.border}`, paddingTop:8 }}>
          {evidencias}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [modoVSL, setModoVSL]       = useState("texto");
  const [vslTexto, setVslTexto]     = useState("");
  const [vslLink, setVslLink]       = useState("");
  const [prodNome, setProdNome]     = useState("");
  const [prodURL, setProdURL]       = useState("");
  const [prodPrint, setProdPrint]   = useState(null);
  const [prodExtra, setProdExtra]   = useState("");
  const [analise, setAnalise]       = useState(null);
  const [caesp, setCAESP]           = useState(null);
  const [caminho, setCaminho]       = useState(null);
  const [enneaDest, setEnneaDest]   = useState(null);
  const [formato, setFormato]       = useState(null);
  const [copyGerada, setCopyGerada] = useState("");
  const [versoes, setVersoes]       = useState([]);
  const [copiado, setCopiado]       = useState(false);
  const [fase, setFase]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [loadMsg, setLoadMsg]       = useState("");
  const [erro, setErro]             = useState("");
  const resultRef                   = useRef(null);

  function copiar(txt) {
    navigator.clipboard.writeText(txt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function resetar() {
    setFase(1); setAnalise(null); setCAESP(null);
    setCopyGerada(""); setVersoes([]); setErro("");
    setCaminho(null); setEnneaDest(null); setFormato(null);
  }

  async function analisar() {
    setErro("");
    const transcricao = modoVSL === "link" ? `[Link YouTube: ${vslLink}]` : vslTexto;
    if (!transcricao.trim()) return setErro("Insira a transcrição ou link da VSL.");
    if (!prodNome.trim())    return setErro("Insira o nome do produto.");
    if (!prodURL.trim())     return setErro("Insira o URL do produto.");
    if (!prodPrint && !prodExtra.trim()) return setErro("Adicione o printscreen do site ou informações extras do produto.");

    setLoading(true); setFase(2);

    try {
      setLoadMsg("Lendo site do produto...");
      let siteTexto = "";
      try {
        const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(prodURL)}`);
        const d = await r.json();
        siteTexto = d.contents?.replace(/<[^>]+>/g," ").replace(/\s+/g," ").slice(0,2500) || "";
      } catch { siteTexto = ""; }

      let printBase64 = null;
      let printMediaType = "image/jpeg";
      if (prodPrint?.file) {
        setLoadMsg("Processando printscreen do site...");
        printBase64 = await fileToBase64(prodPrint.file);
        printMediaType = prodPrint.file.type || "image/jpeg";
      }

      const siteConteudo = [
        siteTexto ? `TEXTO EXTRAÍDO DO SITE:\n${siteTexto}` : "",
        prodExtra ? `INFORMAÇÕES EXTRAS:\n${prodExtra}` : "",
      ].filter(Boolean).join("\n\n");

      setLoadMsg("Analisando Enneagrama, Big Idea e estrutura C.A.E.S.P.+...");

      const systemPrompt = `Você é especialista em copywriting direto e psicologia do Enneagrama.
Analise o conteúdo fornecido e retorne APENAS JSON válido, sem markdown, sem texto fora do JSON.`;

      const jsonSchema = `{
  "tipoVSL": <número 1-9>,
  "evidVSL": "<2-3 evidências do texto da VSL que provam o tipo Enneagrama>",
  "bigIdeiaVSL": "<A Big Idea central da VSL em 1-2 frases>",
  "tipoProduto": <número 1-9>,
  "evidProduto": "<2-3 evidências do site/print que provam o tipo Enneagrama>",
  "bigIdeiaProduto": "<A Big Idea central do produto em 1-2 frases>",
  "alinhados": <true ou false>,
  "gap": "<se não alinhados: descrição do gap em 2 frases>",
  "oportunidade": "<oportunidade estratégica em 2 frases>",
  "caminhos": {
    "A": "<como aplicar mantendo Enneagrama da VSL — 2 frases>",
    "B": "<como aplicar mantendo Enneagrama do produto — 2 frases>",
    "C": "<tipo ponte sugerido e justificativa — 2 frases>"
  },
  "caesp": {
    "cena": "<cena de abertura identificada>",
    "acao": "<ação e queda>",
    "espelho": "<espelho coletivo>",
    "solucao": "<solução apresentada>",
    "promessa": "<promessa dupla>",
    "objecao": "<objeção tratada>",
    "urgencia": "<urgência usada>",
    "mecanismo": "<mecanismo central>",
    "personagem": "<perfil do narrador>"
  }
}`;

      let rawAnalise;

      if (printBase64) {
        const userMessages = [
          {
            type: "image",
            source: { type: "base64", media_type: printMediaType, data: printBase64 }
          },
          {
            type: "text",
            text: `VSL DE REFERÊNCIA:\n${transcricao.slice(0,4000)}\n\nPRODUTO: ${prodNome}\nURL: ${prodURL}\n${siteConteudo}\n\nA imagem acima é um printscreen do site do produto. Use-a para identificar o Enneagrama e a Big Idea do produto.\n\nRetorne este JSON exato:\n${jsonSchema}`
          }
        ];
        rawAnalise = await callAPIMultimodal(systemPrompt, userMessages, 1000);
      } else {
        const userText = `VSL DE REFERÊNCIA:\n${transcricao.slice(0,4000)}\n\nPRODUTO: ${prodNome}\nURL: ${prodURL}\n${siteConteudo}\n\nRetorne este JSON exato:\n${jsonSchema}`;
        rawAnalise = await callAPI(systemPrompt, userText, 1000);
      }

      // parseJSON agora aceita objeto ou string
      const dados = parseJSON(rawAnalise);
      setAnalise(dados);
      setCAESP(dados.caesp);
      setLoading(false);

    } catch(e) {
      setErro("Erro na análise: " + e.message);
      setLoading(false);
      setFase(1);
    }
  }

  async function gerarCopy(novaVersao = false) {
    if (!formato) return setErro("Escolha o formato da copy.");
    if (!analise?.alinhados && !caminho) return setErro("Escolha o caminho para fechar o gap.");
    setLoading(true); setLoadMsg("Gerando copy..."); setErro("");

    try {
      const tipoFinal = enneaDest || analise.tipoVSL;
      const en = ENNEAGRAM[tipoFinal];
      const fmt = FORMATOS.find(f => f.id === formato);

      const caminhoCtx = !analise.alinhados && caminho
        ? `CAMINHO ESCOLHIDO: ${caminho} — ${
            caminho==="A" ? `Manter Enn. Tipo ${analise.tipoVSL} da VSL`
          : caminho==="B" ? `Manter Enn. Tipo ${analise.tipoProduto} do produto`
          : `Usar Enneagrama ponte`
          }\nESTRATÉGIA: ${analise.caminhos?.[caminho]||""}`
        : "VSL e produto alinhados — use a sinergia diretamente.";

      const system = "Você é copywriter especialista em VSL e psicologia do Enneagrama. Escreva apenas a copy solicitada, sem introduções, sem explicações, sem comentários.";

      const user = `PRODUTO: ${prodNome} | URL: ${prodURL}
INFORMAÇÕES EXTRAS: ${prodExtra||"Nenhuma"}
BIG IDEA DO PRODUTO: ${analise.bigIdeiaProduto}

ESTRUTURA C.A.E.S.P.+ DA VSL DE REFERÊNCIA:
• Cena: ${caesp?.cena}
• Ação/Queda: ${caesp?.acao}
• Espelho: ${caesp?.espelho}
• Solução: ${caesp?.solucao}
• Promessa: ${caesp?.promessa}
• Objeção: ${caesp?.objecao}
• Urgência: ${caesp?.urgencia}
• Mecanismo original: ${caesp?.mecanismo}
• Personagem/narrador: ${caesp?.personagem}

ENNEAGRAMA DE DESTINO: Tipo ${tipoFinal} — ${en?.nome}
Driver: ${en?.driver}
Gatilhos: ${en?.gatilho}

${caminhoCtx}

FORMATO: ${fmt?.label} (${fmt?.desc})
${novaVersao ? "NOVA VERSÃO: varie a cena de abertura, mantenha estrutura e Enneagrama." : ""}

INSTRUÇÕES:
- Português brasileiro, tom par-a-par, confissão pessoal
- Siga C.A.E.S.P.+ adaptado ao produto
- Mini VSL e Social: indicações de cena entre [colchetes]
- VSL Completa: blocos nomeados (CENA, AÇÃO, ESPELHO, SOLUÇÃO, PROMESSA, OBJEÇÃO, CTA)
- ESCREVA APENAS A COPY`;

      const raw = await callAPI(system, user, 1000);

      if (novaVersao) {
        setVersoes(v => [...v, { texto: raw, tipo: tipoFinal, fmt: fmt?.label }]);
      } else {
        setCopyGerada(raw);
        setVersoes([]);
        setFase(4);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth" }), 150);
      }
    } catch(e) {
      setErro("Erro ao gerar: " + e.message);
    } finally {
      setLoading(false); setLoadMsg("");
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"Georgia,serif" }}>
      <style>{CSS}</style>

      <div style={{ background:`linear-gradient(135deg,${T.surface},#0D0D1A)`,
        borderBottom:`1px solid ${T.border}`, padding:"20px 28px",
        display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
          background:`linear-gradient(135deg,${T.accent},${T.accentB})`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚡</div>
        <div>
          <div style={{ fontSize:17, fontWeight:700 }}>VSL Transplanter</div>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:2 }}>
            Engenharia reversa de copy · C.A.E.S.P.+ · Enneagrama · Big Idea
          </div>
        </div>
        {fase > 1 && (
          <button onClick={resetar} style={mk.btn("transparent", T.textSub,
            { border:`1px solid ${T.border}`, marginLeft:"auto", padding:"8px 18px", fontSize:12 })}>
            ← Reiniciar
          </button>
        )}
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"32px 20px 80px" }}>

        <div className={fase >= 1 ? "fu" : ""}>
          <div style={mk.card()}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={mk.stepNum()}>1</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>VSL de Referência</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:2 }}>
                  Cole a transcrição ou insira o link do YouTube
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              {["texto","link"].map(m => (
                <button key={m} disabled={fase>1} onClick={() => setModoVSL(m)}
                  style={mk.chip(modoVSL===m, T.accent)}>
                  {m==="texto" ? "📝 Colar transcrição" : "▶ Link YouTube"}
                </button>
              ))}
            </div>
            {modoVSL === "texto" ? (
              <>
                <label style={mk.lbl}>Transcrição da VSL</label>
                <textarea value={vslTexto} onChange={e=>setVslTexto(e.target.value)}
                  placeholder="Cole aqui o texto completo da VSL de referência..."
                  style={mk.ta(8)} disabled={fase>1}/>
              </>
            ) : (
              <>
                <label style={mk.lbl}>Link do YouTube</label>
                <input value={vslLink} onChange={e=>setVslLink(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." style={mk.inp} disabled={fase>1}/>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:6 }}>
                  ⚠ Se o link não funcionar, alterne para "Colar transcrição"
                </div>
              </>
            )}
          </div>

          <div style={mk.card()}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={mk.stepNum()}>2</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>Produto de Destino</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:2 }}>
                  Nome, URL, printscreen do site e informações extras
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:180 }}>
                <label style={mk.lbl}>Nome do produto</label>
                <input value={prodNome} onChange={e=>setProdNome(e.target.value)}
                  placeholder="Ex: Protocolo Sono de Elite" style={mk.inp} disabled={fase>1}/>
              </div>
              <div style={{ flex:2, minWidth:240 }}>
                <label style={mk.lbl}>URL do site</label>
                <input value={prodURL} onChange={e=>setProdURL(e.target.value)}
                  placeholder="https://..." style={mk.inp} disabled={fase>1}/>
              </div>
            </div>
            {fase === 1 ? (
              <ImageUpload value={prodPrint} onChange={setProdPrint}
                label="Printscreen do site (foto da tela)"
                hint="A IA vai ler a imagem para identificar o Enneagrama e a Big Idea do produto"/>
            ) : prodPrint?.url ? (
              <div style={{ marginBottom:14 }}>
                <label style={mk.lbl}>Printscreen do site</label>
                <img src={prodPrint.url} alt="site" className="img-thumb" style={{ maxHeight:140 }}/>
              </div>
            ) : null}
            <label style={mk.lbl}>
              Informações extras{" "}
              <span style={{ color:T.muted, fontWeight:400, textTransform:"none" }}>
                (descrições, diferenciais, pontos que o site não mostra)
              </span>
            </label>
            <textarea value={prodExtra} onChange={e=>setProdExtra(e.target.value)}
              placeholder="Adicione qualquer informação sobre o produto..."
              style={mk.ta(4)} disabled={fase>1}/>
          </div>

          {fase === 1 && (
            <div style={{ textAlign:"center" }}>
              {erro && <div style={mk.err}>{erro}</div>}
              <button onClick={analisar}
                style={mk.btn(`linear-gradient(135deg,${T.accent},${T.accentB})`,"#fff",
                  { padding:"14px 52px", fontSize:14 })}>
                ⚡ Analisar VSL e Produto
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ textAlign:"center", padding:"40px 0" }} className="fu">
            <div style={{ ...mk.infoCard(T.accent), display:"inline-block", padding:"20px 44px" }}>
              <span style={mk.spinner}/>
              <span style={{ fontFamily:"sans-serif", fontSize:13, color:T.textSub }}>{loadMsg}</span>
            </div>
          </div>
        )}

        {!loading && analise && fase >= 2 && (
          <div className="fu">
            <div style={mk.card()}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={mk.stepNum(`linear-gradient(135deg,${T.gold},#E6AC00)`)}>
                  <span style={{ color:"#1A1A00" }}>3</span>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>Análise Completa</div>
                  <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:2 }}>
                    Big Idea · Enneagrama · Mapa de compatibilidade · C.A.E.S.P.+
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
                <EnneaCard tipo={analise.tipoVSL} label="VSL de Referência"
                  evidencias={analise.evidVSL} bigIdeia={analise.bigIdeiaVSL}/>
                <EnneaCard tipo={analise.tipoProduto} label="Site do Produto"
                  evidencias={analise.evidProduto} bigIdeia={analise.bigIdeiaProduto}/>
              </div>

              {analise.alinhados ? (
                <div style={mk.infoCard(T.green)}>
                  <span style={mk.tag(T.green)}>✓ ALINHADOS</span>
                  <p style={{ fontSize:13, color:T.text, fontFamily:"sans-serif", marginTop:8, marginBottom:0 }}>
                    {analise.oportunidade}
                  </p>
                </div>
              ) : (
                <>
                  <div style={mk.infoCard(T.red)}>
                    <span style={mk.tag(T.red)}>⚡ GAP DETECTADO</span>
                    <p style={{ fontSize:13, color:T.text, fontFamily:"sans-serif", marginTop:8, marginBottom:0 }}>
                      {analise.gap}
                    </p>
                  </div>
                  <div style={mk.infoCard(T.gold)}>
                    <span style={mk.tag(T.gold)}>◆ OPORTUNIDADE</span>
                    <p style={{ fontSize:13, color:T.text, fontFamily:"sans-serif", marginTop:8, marginBottom:0 }}>
                      {analise.oportunidade}
                    </p>
                  </div>
                  <div style={{ marginTop:14 }}>
                    <div style={{ ...mk.lbl, marginBottom:10 }}>Como fechar o gap — escolha o caminho:</div>
                    {CAMINHOS.map(c => (
                      <div key={c.id} onClick={() => setCaminho(caminho===c.id ? null : c.id)}
                        style={{ ...mk.infoCard(caminho===c.id ? T.accent : T.border),
                          cursor:"pointer", border:`1px solid ${caminho===c.id?T.accent:T.border}`,
                          transition:"all 0.15s" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <span style={mk.tag(caminho===c.id ? T.accent : T.muted)}>{c.label}</span>
                          <span style={{ fontSize:12, fontWeight:700, fontFamily:"sans-serif" }}>{c.desc}</span>
                        </div>
                        {analise.caminhos?.[c.id] && (
                          <p style={{ fontSize:12, color:T.textSub, fontFamily:"sans-serif", margin:0 }}>
                            {analise.caminhos[c.id]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {caesp && (
                <>
                  <div style={{ height:1, background:T.border, margin:"18px 0" }}/>
                  <div style={{ ...mk.lbl, marginBottom:10 }}>Estrutura C.A.E.S.P.+ extraída da VSL</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                      ["C — Cena",caesp.cena],["A — Ação",caesp.acao],
                      ["E — Espelho",caesp.espelho],["S — Solução",caesp.solucao],
                      ["P — Promessa",caesp.promessa],["O — Objeção",caesp.objecao],
                      ["U — Urgência",caesp.urgencia],["Mecanismo",caesp.mecanismo],
                    ].map(([k,v]) => (
                      <div key={k} style={{ background:T.surface, borderRadius:8, padding:10,
                        border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:9, fontWeight:700, color:T.accent,
                          fontFamily:"sans-serif", letterSpacing:"0.06em", marginBottom:4 }}>{k}</div>
                        <div style={{ fontSize:11, color:T.textSub, fontFamily:"sans-serif",
                          lineHeight:1.5 }}>{v||"—"}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ ...mk.card(), border:`1px solid ${T.accent}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                <div style={mk.stepNum(`linear-gradient(135deg,${T.green},#27AE60)`)}>4</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>Configurar Copy</div>
                  <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:2 }}>
                    Formato · Enneagrama de destino
                  </div>
                </div>
              </div>

              <div style={mk.lbl}>Formato da copy</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}>
                {FORMATOS.map(f => (
                  <button key={f.id} onClick={() => setFormato(f.id)} style={mk.chip(formato===f.id, T.accent)}>
                    {f.icon} {f.label}<span style={{ opacity:0.6, fontSize:11 }}> · {f.desc}</span>
                  </button>
                ))}
              </div>

              <div style={mk.lbl}>
                Enneagrama de destino{" "}
                <span style={{ color:T.muted, fontWeight:400, textTransform:"none" }}>(opcional)</span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:20 }}>
                {Object.entries(ENNEAGRAM).map(([num,e]) => (
                  <button key={num} onClick={() => setEnneaDest(enneaDest===+num ? null : +num)}
                    style={mk.chip(enneaDest===+num, e.cor)} title={e.driver}>
                    {num} · {e.nome.replace("O ","").replace("A ","")}
                  </button>
                ))}
              </div>

              {erro && <div style={mk.err}>{erro}</div>}
              <button onClick={() => gerarCopy(false)}
                style={mk.btn(`linear-gradient(135deg,${T.accent},${T.accentB})`,"#fff",
                  { padding:"13px 40px", fontSize:14 })}>
                ✦ Gerar Copy
              </button>
            </div>
          </div>
        )}

        {!loading && copyGerada && fase === 4 && (
          <div className="fu" ref={resultRef}>
            <div style={mk.card()}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                flexWrap:"wrap", gap:10, marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ ...mk.stepNum(`linear-gradient(135deg,${T.gold},#E6AC00)`),
                    color:"#1A1A00" }}>✓</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>Copy Gerada</div>
                    <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:2 }}>
                      {FORMATOS.find(f=>f.id===formato)?.label} ·
                      Tipo {enneaDest||analise?.tipoVSL} — {ENNEAGRAM[enneaDest||analise?.tipoVSL]?.nome}
                    </div>
                  </div>
                </div>
                <button onClick={() => copiar(copyGerada)}
                  style={mk.btn(copiado?T.green:T.surface, copiado?"#fff":T.textSub,
                    { border:`1px solid ${copiado?T.green:T.border}`, padding:"8px 18px", fontSize:12 })}>
                  {copiado ? "✓ Copiado" : "📋 Copiar"}
                </button>
              </div>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`,
                borderRadius:10, padding:18 }} className="copybox">{copyGerada}</div>
              <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
                <button onClick={() => gerarCopy(true)}
                  style={mk.btn(`linear-gradient(135deg,${T.accent},${T.accentB})`,"#fff",
                    { padding:"10px 22px", fontSize:13 })}>
                  ↻ Nova versão · mesmo Enneagrama
                </button>
                <button onClick={() => { setCopyGerada(""); setVersoes([]); }}
                  style={mk.btn("transparent", T.textSub,
                    { border:`1px solid ${T.border}`, padding:"10px 20px", fontSize:13 })}>
                  ← Mudar configurações
                </button>
              </div>
            </div>

            {versoes.length > 0 && (
              <div>
                <div style={{ ...mk.lbl, marginBottom:12 }}>Versões adicionais geradas</div>
                {versoes.map((v,i) => (
                  <div key={i} style={{ ...mk.card(), marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", marginBottom:12 }}>
                      <span style={mk.tag(T.accent)}>Versão {i+2} · {v.fmt} · Tipo {v.tipo}</span>
                      <button onClick={() => copiar(v.texto)}
                        style={mk.btn(T.surface, T.textSub,
                          { border:`1px solid ${T.border}`, padding:"6px 14px", fontSize:11 })}>
                        📋 Copiar
                      </button>
                    </div>
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`,
                      borderRadius:10, padding:16 }} className="copybox">{v.texto}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
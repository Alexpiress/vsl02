import { useState, useRef } from "react";
 
const T = {
  bg:"#0A0A0F",surface:"#12121A",card:"#1A1A28",border:"#2A2A40",
  accent:"#7C5CFC",accentB:"#5B3FD4",gold:"#F5C842",red:"#FF4D6D",
  green:"#2ECC71",orange:"#E85D04",muted:"#6B6B8A",text:"#E8E8F0",textSub:"#9898B8",
};
const ENNEAGRAM={
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
const FORMATOS=[
  {id:"mini_vsl",label:"Mini VSL",desc:"60–90s",icon:"▶"},
  {id:"vsl",label:"VSL Completa",desc:"5–15min",icon:"◉"},
  {id:"social",label:"Criativo Social",desc:"15–30s",icon:"◈"},
];
const CAMINHOS=[
  {id:"A",label:"Caminho A",desc:"Manter Enneagrama da VSL"},
  {id:"B",label:"Caminho B",desc:"Manter Enneagrama do produto"},
  {id:"C",label:"Caminho C",desc:"Enneagrama ponte"},
];
 
// ── STORAGE ───────────────────────────────────────────────
const SK="vsl_history_v4";
function loadHistory(){try{return JSON.parse(localStorage.getItem(SK)||"[]");}catch{return[];}}
function saveToHistory(e){try{const h=loadHistory();h.unshift({...e,id:Date.now(),date:new Date().toLocaleString("pt-BR")});localStorage.setItem(SK,JSON.stringify(h.slice(0,50)));}catch(_){}}
function deleteFromHistory(id){try{localStorage.setItem(SK,JSON.stringify(loadHistory().filter(e=>e.id!==id)));}catch(_){}}
 
// ── PDF ───────────────────────────────────────────────────
async function exportPDF(entry){
  if(!window.jspdf){
    await new Promise(r=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";s.onload=r;document.head.appendChild(s);});
  }
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const W=210,M=18,CW=W-M*2;let y=20;
  function nl(h=4){y+=h;if(y>270){doc.addPage();y=20;}}
  function txt(t,x,sz=10,bold=false,col=[30,30,30]){
    doc.setFontSize(sz);doc.setFont("helvetica",bold?"bold":"normal");doc.setTextColor(...col);
    const ls=doc.splitTextToSize(String(t||"—"),CW-(x-M));
    doc.text(ls,x,y);y+=ls.length*(sz*0.45)+1;if(y>270){doc.addPage();y=20;}
  }
  function sec(t,cor=[80,60,200]){nl(4);doc.setFillColor(...cor);doc.roundedRect(M,y-4,CW,9,2,2,"F");doc.setFontSize(11);doc.setFont("helvetica","bold");doc.setTextColor(255,255,255);doc.text(t,M+4,y+1);y+=9;nl(2);}
  function campo(l,v){doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setTextColor(100,100,150);doc.text(l.toUpperCase(),M,y);y+=4;txt(v,M,9.5);nl(1);}
 
  // Capa
  doc.setFillColor(17,17,27);doc.rect(0,0,210,297,"F");
  doc.setFillColor(124,92,252);doc.roundedRect(M,30,CW,60,4,4,"F");
  doc.setFontSize(22);doc.setFont("helvetica","bold");doc.setTextColor(255,255,255);doc.text("VSL Transplanter",M+8,58);
  doc.setFontSize(11);doc.setFont("helvetica","normal");doc.setTextColor(200,200,255);doc.text("Relatório Completo · v4",M+8,67);
  doc.setFontSize(9);doc.setTextColor(160,160,200);doc.text(entry.date||"",M+8,78);
  doc.addPage();y=20;
 
  // Produto
  sec("PRODUTO",[ 26,26,40]);
  if(entry.prodNome)campo("Nome",entry.prodNome);
  if(entry.prodURL)campo("URL",entry.prodURL);
  if(entry.prodExtra)campo("Extras",entry.prodExtra);
 
  // Criativo
  if(entry.criativo&&entry.criativo.tipoCriativo&&entry.criativo.tipoCriativo!=="sem criativo"){
    const cr=entry.criativo;
    const ec=ENNEAGRAM[parseInt(cr.tipoCriativo)];
    sec("ANÁLISE DO CRIATIVO",[232,93,4]);
    if(ec)campo(`Tipo ${cr.tipoCriativo} — ${ec.nome}`,"");
    campo("Hook visual",cr.hookVisual);
    campo("Mensagem central",cr.mensagemCentral);
    campo("Emoção ativada",cr.emocaoAtivada);
    campo("Congruência com site",cr.congruenciaSite);
    campo("Congruência com VSL",cr.congruenciaVSL);
    campo("O que funciona",cr.oQueFunciona);
    campo("O que quebra",cr.oQueQuebra);
    campo("Ajuste visual",cr.ajusteVisual);
    campo("Ajuste texto",cr.ajusteTexto);
    campo("Ajuste emocional",cr.ajusteEmocional);
    campo("Prioridade",cr.prioridade);
  }
 
  // Enneagrama VSL
  if(entry.analise?.tipoVSL){
    const ev=ENNEAGRAM[entry.analise.tipoVSL];
    sec("ENNEAGRAMA — VSL",[80,60,200]);
    campo(`Tipo ${entry.analise.tipoVSL} — ${ev?.nome||""}`,entry.analise.bigIdeiaVSL||"");
    campo("Evidências",entry.analise.evidVSL);
  }
 
  // Enneagrama Produto
  if(entry.analise?.tipoProduto){
    const ep=ENNEAGRAM[entry.analise.tipoProduto];
    sec("ENNEAGRAMA — PRODUTO",[60,100,160]);
    campo(`Tipo ${entry.analise.tipoProduto} — ${ep?.nome||""}`,entry.analise.bigIdeiaProduto||"");
    campo("Evidências",entry.analise.evidProduto);
  }
 
  // Gap
  if(entry.analise&&!entry.analise.alinhados){
    sec("GAP E CAMINHOS",[180,50,80]);
    campo("Gap",entry.analise.gap);
    campo("Oportunidade",entry.analise.oportunidade);
    campo("Caminho A",entry.analise.caminhos?.A);
    campo("Caminho B",entry.analise.caminhos?.B);
    campo("Caminho C",entry.analise.caminhos?.C);
  }
 
  // CAESP
  const c=entry.analise?.caesp;
  if(c&&c.cena){
    sec("C.A.E.S.P.+",[26,26,40]);
    ["cena","acao","espelho","solucao","promessa","objecao","urgencia","mecanismo"].forEach(k=>{
      if(c[k])campo(k.toUpperCase(),c[k]);
    });
  }
 
  // Copies
  if(entry.copies?.length>0){
    for(const cp of entry.copies){
      sec(`COPY — ${cp.formato||""} · Tipo ${cp.tipo||""}`,[80,60,200]);
      txt(cp.texto,M,9);nl(4);
    }
  }
 
  doc.save(`VSL_${(entry.prodNome||"relatorio").replace(/\s+/g,"_")}_${entry.id||Date.now()}.pdf`);
}
 
// ── API ───────────────────────────────────────────────────
async function apiCall(type,payload){
  const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,payload})});
  const d=await r.json();
  if(d.error)throw new Error(d.error);
  return d;
}
function fileToBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});}
 
// ── CSS ───────────────────────────────────────────────────
const CSS=`*{box-sizing:border-box;margin:0;padding:0;}body{background:#0A0A0F;}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu 0.35s ease forwards}input:focus,textarea:focus{border-color:#7C5CFC!important;outline:none}button:active{transform:scale(0.97)}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#2A2A40;border-radius:3px}.copybox{white-space:pre-wrap;line-height:1.85;font-family:sans-serif;font-size:13px}.dz{border:2px dashed #2A2A40;border-radius:12px;padding:20px;text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;}.dz:hover,.dz.over{border-color:#7C5CFC;background:#7C5CFC10;}`;
 
// ── ESTILOS ───────────────────────────────────────────────
const mk={
  card:(x={})=>({background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:24,marginBottom:16,...x}),
  lbl:{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.09em",color:T.muted,marginBottom:7,fontFamily:"sans-serif",textTransform:"uppercase"},
  inp:{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:"11px 14px",fontSize:13,fontFamily:"sans-serif",transition:"border-color 0.2s"},
  ta:(r=6)=>({width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:"12px 14px",fontSize:13,fontFamily:"sans-serif",lineHeight:1.6,resize:"vertical",transition:"border-color 0.2s",minHeight:r*22}),
  btn:(bg,color="#fff",x={})=>({background:bg,border:"none",borderRadius:10,color,padding:"12px 26px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif",letterSpacing:"0.03em",transition:"opacity 0.2s",...x}),
  chip:(a,c)=>({padding:"7px 15px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:a?700:400,fontFamily:"sans-serif",border:`1px solid ${a?c:T.border}`,background:a?c+"22":"transparent",color:a?c:T.textSub,transition:"all 0.15s"}),
  tag:(c)=>({display:"inline-block",padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:c+"28",color:c,fontFamily:"sans-serif",letterSpacing:"0.05em"}),
  ic:(c)=>({background:c+"12",border:`1px solid ${c}35`,borderRadius:12,padding:16,marginBottom:10}),
  sn:(bg)=>({width:30,height:30,borderRadius:"50%",background:bg||`linear-gradient(135deg,${T.accent},${T.accentB})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,color:"#fff"}),
  sp:{display:"inline-block",width:16,height:16,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite",marginRight:10,verticalAlign:"middle"},
  err:{background:"#FF4D6D15",border:`1px solid #FF4D6D40`,borderRadius:10,padding:12,color:T.red,fontSize:13,fontFamily:"sans-serif",marginBottom:12},
};
 
// ── COMPONENTES ───────────────────────────────────────────
function ImageDrop({value,onChange,label,hint,optional=true}){
  const ref=useRef();const[over,setOver]=useState(false);
  function handle(file){if(!file||!file.type.startsWith("image/"))return;onChange({file,url:URL.createObjectURL(file)});}
  return(
    <div style={{marginBottom:14}}>
      <label style={mk.lbl}>{label}{optional&&<span style={{color:T.muted,fontWeight:400,textTransform:"none",marginLeft:6}}>(opcional)</span>}</label>
      <div className={`dz${over?" over":""}`} onClick={()=>ref.current.click()}
        onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)}
        onDrop={e=>{e.preventDefault();setOver(false);handle(e.dataTransfer.files[0]);}}>
        {value?.url?(
          <div>
            <img src={value.url} alt="" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`}}/>
            <div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:6}}>Clique para trocar</div>
          </div>
        ):(
          <div>
            <div style={{fontSize:24,marginBottom:6}}>📸</div>
            <div style={{fontSize:12,color:T.textSub,fontFamily:"sans-serif"}}>{hint||"Arraste ou clique para selecionar"}</div>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
    </div>
  );
}
 
function EnneaCard({tipo,label,evidencias,bigIdeia}){
  const e=ENNEAGRAM[tipo];if(!e)return null;
  return(
    <div style={{...mk.ic(e.cor),flex:1,minWidth:200}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={mk.tag(e.cor)}>Tipo {tipo}</span>
        <span style={{fontSize:13,fontWeight:700}}>{e.nome}</span>
      </div>
      <div style={{fontSize:10,color:T.muted,fontFamily:"sans-serif",marginBottom:6}}>{label}</div>
      <div style={{fontSize:11,color:T.textSub,fontFamily:"sans-serif",marginBottom:4}}><b style={{color:T.text}}>Driver:</b> {e.driver}</div>
      <div style={{fontSize:11,color:T.textSub,fontFamily:"sans-serif",marginBottom:bigIdeia?10:0}}><b style={{color:T.text}}>Gatilhos:</b> {e.gatilho}</div>
      {bigIdeia&&<div style={{background:e.cor+"18",borderRadius:8,padding:8,marginBottom:6}}><div style={{fontSize:9,fontWeight:700,color:e.cor,letterSpacing:"0.07em",fontFamily:"sans-serif",marginBottom:3}}>💡 BIG IDEA</div><div style={{fontSize:11,color:T.text,fontFamily:"sans-serif",lineHeight:1.5}}>{bigIdeia}</div></div>}
      {evidencias&&<div style={{fontSize:10,color:T.muted,fontFamily:"sans-serif",fontStyle:"italic",borderTop:`1px solid ${T.border}`,paddingTop:7}}>{evidencias}</div>}
    </div>
  );
}
 
function CongruenciaTag({valor}){
  if(!valor||valor==="—")return null;
  const v=valor.toLowerCase();
  const cor=v.includes("sim")?T.green:v.includes("parcial")?T.gold:T.red;
  const label=v.includes("sim")?"✓ Congruente":v.includes("parcial")?"⚡ Parcial":"✗ Desalinhado";
  return <span style={{...mk.tag(cor),marginRight:6}}>{label}</span>;
}
 
// ── TELA HISTÓRICO ────────────────────────────────────────
function Historico({onAbrir,onVoltar}){
  const[history,setHistory]=useState(loadHistory());
  function del(id){deleteFromHistory(id);setHistory(loadHistory());}
  return(
    <div style={{maxWidth:860,margin:"0 auto",padding:"32px 20px 80px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div><div style={{fontSize:18,fontWeight:700}}>Histórico</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>{history.length} sessão(ões) salva(s)</div></div>
        <button onClick={onVoltar} style={mk.btn("transparent",T.textSub,{border:`1px solid ${T.border}`,padding:"8px 18px",fontSize:12})}>← Voltar</button>
      </div>
      {history.length===0?(
        <div style={{...mk.ic(T.muted),textAlign:"center",padding:40}}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div style={{fontSize:13,color:T.muted,fontFamily:"sans-serif"}}>Nenhuma sessão salva ainda.</div>
        </div>
      ):history.map(entry=>{
        const ev=ENNEAGRAM[entry.analise?.tipoVSL];
        const ep=ENNEAGRAM[entry.analise?.tipoProduto];
        const ec=ENNEAGRAM[parseInt(entry.criativo?.tipoCriativo)];
        return(
          <div key={entry.id} style={{...mk.card(),cursor:"pointer"}} onClick={()=>onAbrir(entry)}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{entry.prodNome||"Sem nome"}</div>
                <div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginBottom:10}}>{entry.date}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {ev&&<span style={mk.tag(ev.cor)}>VSL Tipo {entry.analise?.tipoVSL}</span>}
                  {ep&&<span style={mk.tag(ep.cor)}>Produto Tipo {entry.analise?.tipoProduto}</span>}
                  {ec&&<span style={mk.tag(T.orange)}>Criativo Tipo {entry.criativo?.tipoCriativo}</span>}
                  {entry.analise?.alinhados?<span style={mk.tag(T.green)}>✓ Alinhados</span>:<span style={mk.tag(T.red)}>⚡ Gap</span>}
                  {entry.copies?.length>0&&<span style={mk.tag(T.accent)}>{entry.copies.length} copy(ies)</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <button onClick={e=>{e.stopPropagation();exportPDF(entry);}} style={mk.btn(T.surface,T.textSub,{border:`1px solid ${T.border}`,padding:"7px 14px",fontSize:11})}>📄 PDF</button>
                <button onClick={e=>{e.stopPropagation();if(confirm("Apagar?"))del(entry.id);}} style={mk.btn(T.surface,T.red,{border:`1px solid ${T.red}40`,padding:"7px 14px",fontSize:11})}>🗑</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function App(){
  const[tela,setTela]=useState("main");
  const[sessaoAberta,setSessaoAberta]=useState(null);
 
  // Inputs
  const[modoVSL,setModoVSL]=useState("texto");
  const[vslTexto,setVslTexto]=useState("");
  const[vslLink,setVslLink]=useState("");
  const[prodNome,setProdNome]=useState("");
  const[prodURL,setProdURL]=useState("");
  const[prodPrint,setProdPrint]=useState(null);
  const[prodExtra,setProdExtra]=useState("");
  const[criativoPrint,setCriativoPrint]=useState(null);
 
  // Resultados
  const[criativo,setCriativo]=useState(null);
  const[analise,setAnalise]=useState(null);
  const[caesp,setCAESP]=useState(null);
  const[caminho,setCaminho]=useState(null);
  const[enneaDest,setEnneaDest]=useState(null);
  const[formato,setFormato]=useState(null);
  const[copyGerada,setCopyGerada]=useState("");
  const[versoes,setVersoes]=useState([]);
  const[copiado,setCopiado]=useState(false);
 
  // UI
  const[fase,setFase]=useState(1);
  const[loading,setLoading]=useState(false);
  const[loadMsg,setLoadMsg]=useState("");
  const[erro,setErro]=useState("");
  const[histCount,setHistCount]=useState(loadHistory().length);
  const copiesRef=useRef([]);
  const resultRef=useRef(null);
 
  function copiar(txt){navigator.clipboard.writeText(txt);setCopiado(true);setTimeout(()=>setCopiado(false),2000);}
  function resetar(){
    setFase(1);setCriativo(null);setAnalise(null);setCAESP(null);
    setCopyGerada("");setVersoes([]);setErro("");
    setCaminho(null);setEnneaDest(null);setFormato(null);
    copiesRef.current=[];
  }
 
  // ── ANALISAR ─────────────────────────────────────────
  async function analisar(){
    setErro("");
    // Verifica se tem pelo menos alguma coisa
    const transcricao=modoVSL==="link"?`[Link YouTube: ${vslLink}]`:vslTexto;
    const temAlgo=transcricao.trim()||prodNome.trim()||prodURL.trim()||prodExtra.trim()||prodPrint||criativoPrint;
    if(!temAlgo)return setErro("Insira pelo menos uma informação para analisar.");
    setLoading(true);setFase(2);
 
    try{
      // Lê site
      setLoadMsg("Lendo informações...");
      let siteTexto="";
      if(prodURL.trim()){
        try{
          const r=await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(prodURL)}`);
          const d=await r.json();
          siteTexto=d.contents?.replace(/<[^>]+>/g," ").replace(/\s+/g," ").slice(0,1500)||"";
        }catch(_){}
      }
      const siteCtx=[siteTexto?`TEXTO DO SITE:\n${siteTexto}`:"",prodExtra?`EXTRAS:\n${prodExtra}`:""].filter(Boolean).join("\n\n");
 
      // Processa prints
      let sitePrintB64=null,sitePrintMT="image/jpeg";
      if(prodPrint?.file){sitePrintB64=await fileToBase64(prodPrint.file);sitePrintMT=prodPrint.file.type||"image/jpeg";}
 
      let criativoPrintB64=null,criativoPrintMT="image/jpeg";
      if(criativoPrint?.file){criativoPrintB64=await fileToBase64(criativoPrint.file);criativoPrintMT=criativoPrint.file.type||"image/jpeg";}
 
      // 1. Analisa VSL + Produto
      setLoadMsg("Analisando VSL e produto...");
      const resAnalise=await apiCall("analisar",{
        transcricao:transcricao||"",
        prodNome:prodNome||"",
        prodURL:prodURL||"",
        siteCtx,
        printBase64:sitePrintB64,
        printMediaType:sitePrintMT,
      });
      const dadosAnalise=resAnalise.resultado;
      setAnalise(dadosAnalise);
      setCAESP(dadosAnalise.caesp);
 
      // 2. Analisa criativo (se tiver print)
      let dadosCriativo=null;
      if(criativoPrintB64){
        setLoadMsg("Analisando criativo...");
        const resCriativo=await apiCall("criativo",{
          printBase64:criativoPrintB64,
          printMediaType:criativoPrintMT,
          prodNome:prodNome||"",
          prodURL:prodURL||"",
          siteCtx,
          tipoVSL:dadosAnalise.tipoVSL,
          tipoSite:dadosAnalise.tipoProduto,
        });
        dadosCriativo=resCriativo.resultado;
        setCriativo(dadosCriativo);
      }
 
      setLoading(false);
    }catch(e){
      setErro("Erro na análise: "+e.message);
      setLoading(false);setFase(1);
    }
  }
 
  // ── GERAR COPY ────────────────────────────────────────
  async function gerarCopy(novaVersao=false){
    if(!formato)return setErro("Escolha o formato.");
    if(analise&&!analise.alinhados&&!caminho)return setErro("Escolha o caminho para fechar o gap.");
    setLoading(true);setLoadMsg("Gerando copy...");setErro("");
    try{
      const tipoFinal=enneaDest||analise?.tipoVSL||3;
      const en=ENNEAGRAM[tipoFinal];
      const fmt=FORMATOS.find(f=>f.id===formato);
      const caminhoCtx=analise&&!analise.alinhados&&caminho?`Caminho ${caminho}: ${analise.caminhos?.[caminho]||""}`:"Use a sinergia disponível.";
      const criatContext=criativo&&criativo.tipoCriativo!=="sem criativo"?`\nCRIATIVO ATUAL:\nEnneagrama: Tipo ${criativo.tipoCriativo}\nO que funciona: ${criativo.oQueFunciona}\nO que quebra: ${criativo.oQueQuebra}\nAjuste prioritário: ${criativo.prioridade}`:"";
 
      const system="Você é copywriter especialista em VSL e Enneagrama. Escreva apenas a copy. Sem introduções. Sem comentários.";
      const user=`PRODUTO: ${prodNome||"não informado"} | URL: ${prodURL||"não informado"}
EXTRAS: ${prodExtra||"Nenhum"}
BIG IDEA: ${analise?.bigIdeiaProduto||"não identificada"}
ESTRUTURA C.A.E.S.P.+:
Cena: ${caesp?.cena||"—"}
Ação: ${caesp?.acao||"—"}
Espelho: ${caesp?.espelho||"—"}
Solução: ${caesp?.solucao||"—"}
Promessa: ${caesp?.promessa||"—"}
Objeção: ${caesp?.objecao||"—"}
Urgência: ${caesp?.urgencia||"—"}
Mecanismo: ${caesp?.mecanismo||"—"}
Narrador: ${caesp?.personagem||"—"}
ENNEAGRAMA: Tipo ${tipoFinal} — ${en?.nome||""}
Driver: ${en?.driver||""} | Gatilhos: ${en?.gatilho||""}
${caminhoCtx}${criatContext}
FORMATO: ${fmt?.label} (${fmt?.desc})
${novaVersao?"NOVA VERSÃO: varie a abertura, mantenha estrutura e Enneagrama.":""}
Português brasileiro. Tom par-a-par. Confissão pessoal.
Mini VSL e Social: indicações de cena entre [colchetes].
VSL Completa: blocos nomeados.
ESCREVA APENAS A COPY.`;
 
      const d=await apiCall("gerar",{system,user});
      const texto=d.texto||"";
      const copyEntry={texto,tipo:tipoFinal,formato:fmt?.label};
      copiesRef.current=[...copiesRef.current,copyEntry];
 
      saveToHistory({prodNome,prodURL,prodExtra,vslTexto:vslTexto.slice(0,300),analise,criativo,copies:copiesRef.current});
      setHistCount(loadHistory().length);
 
      if(novaVersao){setVersoes(v=>[...v,{texto,tipo:tipoFinal,fmt:fmt?.label}]);}
      else{setCopyGerada(texto);setVersoes([]);setFase(4);setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth"}),150);}
    }catch(e){setErro("Erro ao gerar: "+e.message);}
    finally{setLoading(false);setLoadMsg("");}
  }
 
  // ── TELAS AUXILIARES ──────────────────────────────────
  if(tela==="historico") return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Georgia,serif"}}>
      <style>{CSS}</style>
      <Header histCount={histCount} onHist={()=>setTela("historico")} onReset={null}/>
      <Historico onAbrir={e=>{setSessaoAberta(e);setTela("sessao");}} onVoltar={()=>setTela("main")}/>
    </div>
  );
 
  if(tela==="sessao"&&sessaoAberta){
    const s=sessaoAberta;
    return(
      <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Georgia,serif"}}>
        <style>{CSS}</style>
        <div style={{background:`linear-gradient(135deg,${T.surface},#0D0D1A)`,borderBottom:`1px solid ${T.border}`,padding:"20px 28px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${T.accent},${T.accentB})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚡</div>
          <div><div style={{fontSize:16,fontWeight:700}}>{s.prodNome||"Sessão"}</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>{s.date}</div></div>
          <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
            <button onClick={()=>exportPDF(s)} style={mk.btn(T.accent,"#fff",{padding:"8px 18px",fontSize:12})}>📄 PDF</button>
            <button onClick={()=>setTela("historico")} style={mk.btn("transparent",T.textSub,{border:`1px solid ${T.border}`,padding:"8px 18px",fontSize:12})}>← Histórico</button>
          </div>
        </div>
        <div style={{maxWidth:860,margin:"0 auto",padding:"32px 20px 80px"}}>
          {s.criativo&&s.criativo.tipoCriativo!=="sem criativo"&&(
            <div style={mk.card()}>
              <div style={{...mk.lbl,marginBottom:12}}>Análise do Criativo</div>
              <CriativoCard c={s.criativo}/>
            </div>
          )}
          {(s.analise?.tipoVSL||s.analise?.tipoProduto)&&(
            <div style={mk.card()}>
              <div style={{...mk.lbl,marginBottom:12}}>Enneagrama</div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {s.analise?.tipoVSL&&<EnneaCard tipo={s.analise.tipoVSL} label="VSL" evidencias={s.analise.evidVSL} bigIdeia={s.analise.bigIdeiaVSL}/>}
                {s.analise?.tipoProduto&&<EnneaCard tipo={s.analise.tipoProduto} label="Produto" evidencias={s.analise.evidProduto} bigIdeia={s.analise.bigIdeiaProduto}/>}
              </div>
            </div>
          )}
          {s.copies?.map((cp,i)=>(
            <div key={i} style={mk.card()}>
              <div style={{...mk.lbl,marginBottom:10}}>Copy {i+1} — {cp.formato} · Tipo {cp.tipo}</div>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}} className="copybox">{cp.texto}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
 
  // ── TELA PRINCIPAL ────────────────────────────────────
  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Georgia,serif"}}>
      <style>{CSS}</style>
      <div style={{background:`linear-gradient(135deg,${T.surface},#0D0D1A)`,borderBottom:`1px solid ${T.border}`,padding:"20px 28px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${T.accent},${T.accentB})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚡</div>
        <div><div style={{fontSize:17,fontWeight:700}}>VSL Transplanter</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>C.A.E.S.P.+ · Enneagrama · Criativo · Big Idea</div></div>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          <button onClick={()=>setTela("historico")} style={mk.btn(T.surface,T.textSub,{border:`1px solid ${T.border}`,padding:"8px 14px",fontSize:12})}>📋 {histCount>0?`(${histCount})`:""}</button>
          {fase>1&&<button onClick={resetar} style={mk.btn("transparent",T.textSub,{border:`1px solid ${T.border}`,padding:"8px 14px",fontSize:12})}>← Reiniciar</button>}
        </div>
      </div>
 
      <div style={{maxWidth:860,margin:"0 auto",padding:"32px 20px 80px"}}>
        <div className="fu">
 
          {/* PASSO 1 — VSL */}
          <div style={mk.card()}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={mk.sn()}>1</div>
              <div><div style={{fontSize:14,fontWeight:700}}>VSL de Referência</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Transcrição ou link <span style={{color:T.muted}}>(opcional)</span></div></div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              {["texto","link"].map(m=>(<button key={m} disabled={fase>1} onClick={()=>setModoVSL(m)} style={mk.chip(modoVSL===m,T.accent)}>{m==="texto"?"📝 Colar transcrição":"▶ Link YouTube"}</button>))}
            </div>
            {modoVSL==="texto"?(
              <textarea value={vslTexto} onChange={e=>setVslTexto(e.target.value)} placeholder="Cole o texto da VSL de referência..." style={mk.ta(7)} disabled={fase>1}/>
            ):(
              <>
                <input value={vslLink} onChange={e=>setVslLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={mk.inp} disabled={fase>1}/>
                <div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:6}}>⚠ Se não funcionar use Colar transcrição</div>
              </>
            )}
          </div>
 
          {/* PASSO 2 — PRODUTO */}
          <div style={mk.card()}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={mk.sn()}>2</div>
              <div><div style={{fontSize:14,fontWeight:700}}>Produto de Destino</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Todos os campos são opcionais</div></div>
            </div>
            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:180}}>
                <label style={mk.lbl}>Nome <span style={{color:T.muted,fontWeight:400,textTransform:"none"}}>(opcional)</span></label>
                <input value={prodNome} onChange={e=>setProdNome(e.target.value)} placeholder="Ex: Protocolo Sono de Elite" style={mk.inp} disabled={fase>1}/>
              </div>
              <div style={{flex:2,minWidth:240}}>
                <label style={mk.lbl}>URL <span style={{color:T.muted,fontWeight:400,textTransform:"none"}}>(opcional)</span></label>
                <input value={prodURL} onChange={e=>setProdURL(e.target.value)} placeholder="https://..." style={mk.inp} disabled={fase>1}/>
              </div>
            </div>
            {fase===1?(
              <ImageDrop value={prodPrint} onChange={setProdPrint} label="Printscreen do site" hint="Arraste ou clique para selecionar"/>
            ):prodPrint?.url?(
              <div style={{marginBottom:14}}><label style={mk.lbl}>Print do site</label><img src={prodPrint.url} alt="" style={{width:"100%",maxHeight:100,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`}}/></div>
            ):null}
            <label style={mk.lbl}>Informações extras <span style={{color:T.muted,fontWeight:400,textTransform:"none"}}>(opcional)</span></label>
            <textarea value={prodExtra} onChange={e=>setProdExtra(e.target.value)} placeholder="Cole diferenciais, posicionamento, textos da página..." style={mk.ta(3)} disabled={fase>1}/>
          </div>
 
          {/* PASSO 3 — CRIATIVO */}
          <div style={{...mk.card(),border:`1px solid ${T.orange}40`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={mk.sn(`linear-gradient(135deg,${T.orange},#C94A00)`)}>3</div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>Criativo <span style={{fontSize:11,color:T.orange,fontWeight:400}}> NOVO</span></div>
                <div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Print do criativo para análise de congruência <span style={{color:T.muted}}>(opcional)</span></div>
              </div>
            </div>
            {fase===1?(
              <ImageDrop value={criativoPrint} onChange={setCriativoPrint} label="Print do criativo (imagem, anúncio, thumbnail)" hint="A IA analisa Enneagrama, congruência e sugere ajustes"/>
            ):criativoPrint?.url?(
              <div style={{marginBottom:14}}><label style={mk.lbl}>Criativo enviado</label><img src={criativoPrint.url} alt="" style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`}}/></div>
            ):(
              <div style={{fontSize:12,color:T.muted,fontFamily:"sans-serif",padding:"12px 0"}}>Nenhum criativo enviado — análise será feita com base nos outros campos.</div>
            )}
          </div>
 
          {fase===1&&(
            <div style={{textAlign:"center"}}>
              {erro&&<div style={mk.err}>{erro}</div>}
              <button onClick={analisar} style={mk.btn(`linear-gradient(135deg,${T.accent},${T.accentB})`,"#fff",{padding:"14px 52px",fontSize:14})}>⚡ Analisar</button>
            </div>
          )}
        </div>
 
        {/* LOADING */}
        {loading&&(
          <div style={{textAlign:"center",padding:"40px 0"}} className="fu">
            <div style={{...mk.ic(T.accent),display:"inline-block",padding:"20px 44px"}}>
              <span style={mk.sp}/><span style={{fontFamily:"sans-serif",fontSize:13,color:T.textSub}}>{loadMsg}</span>
            </div>
          </div>
        )}
 
        {/* RESULTADOS */}
        {!loading&&(analise||criativo)&&fase>=2&&(
          <div className="fu">
 
            {/* ANÁLISE DO CRIATIVO */}
            {criativo&&criativo.tipoCriativo!=="sem criativo"&&(
              <div style={{...mk.card(),border:`1px solid ${T.orange}50`}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                  <div style={mk.sn(`linear-gradient(135deg,${T.orange},#C94A00)`)}>🎨</div>
                  <div><div style={{fontSize:14,fontWeight:700}}>Análise do Criativo</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Congruência · Enneagrama · Sugestões</div></div>
                </div>
                <CriativoCard c={criativo}/>
              </div>
            )}
 
            {/* ANÁLISE VSL + PRODUTO */}
            {analise&&(
              <div style={mk.card()}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                  <div style={mk.sn(`linear-gradient(135deg,${T.gold},#E6AC00)`)}><span style={{color:"#1A1A00"}}>4</span></div>
                  <div><div style={{fontSize:14,fontWeight:700}}>Análise VSL + Produto</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Big Idea · Enneagrama · Gap · C.A.E.S.P.+</div></div>
                </div>
 
                <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
                  {analise.tipoVSL&&<EnneaCard tipo={analise.tipoVSL} label="VSL de Referência" evidencias={analise.evidVSL} bigIdeia={analise.bigIdeiaVSL}/>}
                  {analise.tipoProduto&&<EnneaCard tipo={analise.tipoProduto} label="Site do Produto" evidencias={analise.evidProduto} bigIdeia={analise.bigIdeiaProduto}/>}
                </div>
 
                {analise.alinhados?(
                  <div style={mk.ic(T.green)}><span style={mk.tag(T.green)}>✓ ALINHADOS</span><p style={{fontSize:13,color:T.text,fontFamily:"sans-serif",marginTop:8,marginBottom:0}}>{analise.oportunidade}</p></div>
                ):(
                  <>
                    <div style={mk.ic(T.red)}><span style={mk.tag(T.red)}>⚡ GAP</span><p style={{fontSize:13,color:T.text,fontFamily:"sans-serif",marginTop:8,marginBottom:0}}>{analise.gap}</p></div>
                    <div style={mk.ic(T.gold)}><span style={mk.tag(T.gold)}>◆ OPORTUNIDADE</span><p style={{fontSize:13,color:T.text,fontFamily:"sans-serif",marginTop:8,marginBottom:0}}>{analise.oportunidade}</p></div>
                    <div style={{marginTop:14}}>
                      <div style={{...mk.lbl,marginBottom:10}}>Como fechar o gap:</div>
                      {CAMINHOS.map(c=>(<div key={c.id} onClick={()=>setCaminho(caminho===c.id?null:c.id)} style={{...mk.ic(caminho===c.id?T.accent:T.border),cursor:"pointer",border:`1px solid ${caminho===c.id?T.accent:T.border}`,transition:"all 0.15s"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={mk.tag(caminho===c.id?T.accent:T.muted)}>{c.label}</span><span style={{fontSize:12,fontWeight:700,fontFamily:"sans-serif"}}>{c.desc}</span></div>{analise.caminhos?.[c.id]&&<p style={{fontSize:12,color:T.textSub,fontFamily:"sans-serif",margin:0}}>{analise.caminhos[c.id]}</p>}</div>))}
                    </div>
                  </>
                )}
 
                {caesp&&caesp.cena&&(
                  <>
                    <div style={{height:1,background:T.border,margin:"18px 0"}}/>
                    <div style={{...mk.lbl,marginBottom:10}}>C.A.E.S.P.+ extraído</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[["C — Cena",caesp.cena],["A — Ação",caesp.acao],["E — Espelho",caesp.espelho],["S — Solução",caesp.solucao],["P — Promessa",caesp.promessa],["O — Objeção",caesp.objecao],["U — Urgência",caesp.urgencia],["Mecanismo",caesp.mecanismo]].map(([k,v])=>(
                        v?<div key={k} style={{background:T.surface,borderRadius:8,padding:10,border:`1px solid ${T.border}`}}><div style={{fontSize:9,fontWeight:700,color:T.accent,fontFamily:"sans-serif",letterSpacing:"0.06em",marginBottom:4}}>{k}</div><div style={{fontSize:11,color:T.textSub,fontFamily:"sans-serif",lineHeight:1.5}}>{v}</div></div>:null
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
 
            {/* CONFIGURAR COPY */}
            <div style={{...mk.card(),border:`1px solid ${T.accent}`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <div style={mk.sn(`linear-gradient(135deg,${T.green},#27AE60)`)}>5</div>
                <div><div style={{fontSize:14,fontWeight:700}}>Configurar Copy</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Formato · Enneagrama de destino</div></div>
              </div>
              <div style={mk.lbl}>Formato</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
                {FORMATOS.map(f=>(<button key={f.id} onClick={()=>setFormato(f.id)} style={mk.chip(formato===f.id,T.accent)}>{f.icon} {f.label}<span style={{opacity:0.6,fontSize:11}}> · {f.desc}</span></button>))}
              </div>
              <div style={mk.lbl}>Enneagrama de destino <span style={{color:T.muted,fontWeight:400,textTransform:"none"}}>(opcional)</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:20}}>
                {Object.entries(ENNEAGRAM).map(([num,e])=>(<button key={num} onClick={()=>setEnneaDest(enneaDest===+num?null:+num)} style={mk.chip(enneaDest===+num,e.cor)} title={e.driver}>{num} · {e.nome.replace("O ","").replace("A ","")}</button>))}
              </div>
              {erro&&<div style={mk.err}>{erro}</div>}
              <button onClick={()=>gerarCopy(false)} style={mk.btn(`linear-gradient(135deg,${T.accent},${T.accentB})`,"#fff",{padding:"13px 40px",fontSize:14})}>✦ Gerar Copy</button>
            </div>
          </div>
        )}
 
        {/* COPY GERADA */}
        {!loading&&copyGerada&&fase===4&&(
          <div className="fu" ref={resultRef}>
            <div style={mk.card()}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{...mk.sn(`linear-gradient(135deg,${T.gold},#E6AC00)`),color:"#1A1A00"}}>✓</div>
                  <div><div style={{fontSize:14,fontWeight:700}}>Copy Gerada</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>{FORMATOS.find(f=>f.id===formato)?.label} · Tipo {enneaDest||analise?.tipoVSL||"—"} — {ENNEAGRAM[enneaDest||analise?.tipoVSL]?.nome||""}</div></div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>exportPDF({prodNome,prodURL,prodExtra,analise,criativo,copies:copiesRef.current,date:new Date().toLocaleString("pt-BR"),id:Date.now()})} style={mk.btn(T.surface,T.textSub,{border:`1px solid ${T.border}`,padding:"7px 14px",fontSize:12})}>📄 PDF</button>
                  <button onClick={()=>copiar(copyGerada)} style={mk.btn(copiado?T.green:T.surface,copiado?"#fff":T.textSub,{border:`1px solid ${copiado?T.green:T.border}`,padding:"7px 14px",fontSize:12})}>{copiado?"✓ Copiado":"📋 Copiar"}</button>
                </div>
              </div>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}} className="copybox">{copyGerada}</div>
              <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
                <button onClick={()=>gerarCopy(true)} style={mk.btn(`linear-gradient(135deg,${T.accent},${T.accentB})`,"#fff",{padding:"10px 22px",fontSize:13})}>↻ Nova versão · mesmo Enneagrama</button>
                <button onClick={()=>{setCopyGerada("");setVersoes([]);}} style={mk.btn("transparent",T.textSub,{border:`1px solid ${T.border}`,padding:"10px 20px",fontSize:13})}>← Mudar configurações</button>
              </div>
            </div>
            {versoes.length>0&&(
              <div>
                <div style={{...mk.lbl,marginBottom:12}}>Versões adicionais</div>
                {versoes.map((v,i)=>(<div key={i} style={{...mk.card(),marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={mk.tag(T.accent)}>Versão {i+2} · {v.fmt} · Tipo {v.tipo}</span><button onClick={()=>copiar(v.texto)} style={mk.btn(T.surface,T.textSub,{border:`1px solid ${T.border}`,padding:"6px 14px",fontSize:11})}>📋 Copiar</button></div><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}} className="copybox">{v.texto}</div></div>))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
 
// ── CARD DO CRIATIVO ──────────────────────────────────────
function CriativoCard({c}){
  const ec=ENNEAGRAM[parseInt(c.tipoCriativo)];
  return(
    <div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
        {ec&&(
          <div style={{...{background:ec.cor+"12",border:`1px solid ${ec.cor}35`,borderRadius:12,padding:14},flex:1,minWidth:180}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{display:"inline-block",padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:ec.cor+"28",color:ec.cor,fontFamily:"sans-serif"}}>Tipo {c.tipoCriativo}</span>
              <span style={{fontSize:13,fontWeight:700}}>{ec.nome}</span>
            </div>
            <div style={{fontSize:11,color:"#9898B8",fontFamily:"sans-serif",marginBottom:4}}><b style={{color:"#E8E8F0"}}>Hook visual:</b> {c.hookVisual}</div>
            <div style={{fontSize:11,color:"#9898B8",fontFamily:"sans-serif",marginBottom:4}}><b style={{color:"#E8E8F0"}}>Mensagem:</b> {c.mensagemCentral}</div>
            <div style={{fontSize:11,color:"#9898B8",fontFamily:"sans-serif"}}><b style={{color:"#E8E8F0"}}>Emoção:</b> {c.emocaoAtivada}</div>
          </div>
        )}
        <div style={{flex:1,minWidth:180}}>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:700,color:"#6B6B8A",fontFamily:"sans-serif",letterSpacing:"0.07em",marginBottom:4}}>CONGRUÊNCIA</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <CongruenciaTag valor={c.congruenciaSite} label="Site"/>
              <CongruenciaTag valor={c.congruenciaVSL} label="VSL"/>
            </div>
          </div>
        </div>
      </div>
 
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div style={{background:"#2ECC7112",border:"1px solid #2ECC7135",borderRadius:10,padding:12}}>
          <div style={{fontSize:9,fontWeight:700,color:"#2ECC71",fontFamily:"sans-serif",letterSpacing:"0.06em",marginBottom:6}}>✓ O QUE FUNCIONA</div>
          <div style={{fontSize:12,color:"#E8E8F0",fontFamily:"sans-serif",lineHeight:1.5}}>{c.oQueFunciona}</div>
        </div>
        <div style={{background:"#FF4D6D12",border:"1px solid #FF4D6D35",borderRadius:10,padding:12}}>
          <div style={{fontSize:9,fontWeight:700,color:"#FF4D6D",fontFamily:"sans-serif",letterSpacing:"0.06em",marginBottom:6}}>✗ O QUE QUEBRA</div>
          <div style={{fontSize:12,color:"#E8E8F0",fontFamily:"sans-serif",lineHeight:1.5}}>{c.oQueQuebra}</div>
        </div>
      </div>
 
      <div style={{background:"#F5C84212",border:"1px solid #F5C84235",borderRadius:10,padding:12,marginBottom:8}}>
        <div style={{fontSize:9,fontWeight:700,color:"#F5C842",fontFamily:"sans-serif",letterSpacing:"0.06em",marginBottom:8}}>SUGESTÕES DE AJUSTE</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["Visual",c.ajusteVisual],["Texto/Copy",c.ajusteTexto],["Tom emocional",c.ajusteEmocional]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:9,fontWeight:700,color:"#9898B8",fontFamily:"sans-serif",marginBottom:3}}>{l.toUpperCase()}</div><div style={{fontSize:11,color:"#E8E8F0",fontFamily:"sans-serif",lineHeight:1.5}}>{v||"—"}</div></div>
          ))}
        </div>
      </div>
 
      <div style={{background:"#7C5CFC15",border:"1px solid #7C5CFC40",borderRadius:10,padding:12}}>
        <div style={{fontSize:9,fontWeight:700,color:"#7C5CFC",fontFamily:"sans-serif",letterSpacing:"0.06em",marginBottom:4}}>⚡ PRIORIDADE</div>
        <div style={{fontSize:13,color:"#E8E8F0",fontFamily:"sans-serif",lineHeight:1.5,fontWeight:600}}>{c.prioridade}</div>
      </div>
    </div>
  );
}
 
function CongruenciaTag({valor,label}){
  if(!valor||valor==="—")return null;
  const v=valor.toLowerCase();
  const cor=v.includes("sim")?T.green:v.includes("parcial")?T.gold:T.red;
  const icon=v.includes("sim")?"✓":v.includes("parcial")?"⚡":"✗";
  return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:cor+"28",color:cor,fontFamily:"sans-serif"}}>{icon} {label}: {v.includes("sim")?"Congruente":v.includes("parcial")?"Parcial":"Desalinhado"}</span>;
}
 

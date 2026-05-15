import { useState, useRef } from "react";

const T = {
  bg:"#0A0A0F",surface:"#12121A",card:"#1A1A28",border:"#2A2A40",
  accent:"#7C5CFC",accentB:"#5B3FD4",gold:"#F5C842",red:"#FF4D6D",
  green:"#2ECC71",muted:"#6B6B8A",text:"#E8E8F0",textSub:"#9898B8",
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

async function apiAnalisar(payload) {
  const r = await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"analisar",payload})});
  const d = await r.json();
  if(d.error) throw new Error(d.error);
  return d.resultado;
}
async function apiGerar(system,user) {
  const r = await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"gerar",payload:{system,user}})});
  const d = await r.json();
  if(d.error) throw new Error(d.error);
  return d.texto;
}
function fileToBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=()=>rej(new Error("Erro"));r.readAsDataURL(file);});}

const CSS=`*{box-sizing:border-box;margin:0;padding:0;}body{background:#0A0A0F;}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu 0.35s ease forwards}input:focus,textarea:focus{border-color:#7C5CFC!important;outline:none}button:active{transform:scale(0.97)}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#2A2A40;border-radius:3px}.copybox{white-space:pre-wrap;line-height:1.85;font-family:sans-serif;font-size:13px}.dz{border:2px dashed #2A2A40;border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;}.dz:hover,.dz.over{border-color:#7C5CFC;background:#7C5CFC10;}`;

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

function ImageUpload({value,onChange}){
  const ref=useRef();const[over,setOver]=useState(false);
  function handle(file){if(!file||!file.type.startsWith("image/"))return;onChange({file,url:URL.createObjectURL(file)});}
  return(
    <div style={{marginBottom:14}}>
      <label style={mk.lbl}>Printscreen do site (foto da tela)</label>
      <div className={`dz${over?" over":""}`} onClick={()=>ref.current.click()}
        onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)}
        onDrop={e=>{e.preventDefault();setOver(false);handle(e.dataTransfer.files[0]);}}>
        {value?.url?(<div><img src={value.url} alt="p" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10,border:`1px solid ${T.border}`}}/><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:8}}>Clique para trocar</div></div>):(
          <div><div style={{fontSize:28,marginBottom:8}}>📸</div><div style={{fontSize:13,color:T.textSub,fontFamily:"sans-serif"}}>Arraste o printscreen ou clique para selecionar</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:6}}>A IA lê a imagem para identificar Enneagrama e Big Idea</div></div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
    </div>
  );
}

function EnneaCard({tipo,label,evidencias,bigIdeia}){
  const e=ENNEAGRAM[tipo];if(!e)return null;
  return(
    <div style={{...mk.ic(e.cor),flex:1,minWidth:220}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={mk.tag(e.cor)}>Tipo {tipo}</span>
        <span style={{fontSize:13,fontWeight:700}}>{e.nome}</span>
      </div>
      <div style={{fontSize:10,color:T.muted,fontFamily:"sans-serif",marginBottom:8}}>{label}</div>
      <div style={{fontSize:11,color:T.textSub,fontFamily:"sans-serif",marginBottom:4}}><b style={{color:T.text}}>Driver:</b> {e.driver}</div>
      <div style={{fontSize:11,color:T.textSub,fontFamily:"sans-serif",marginBottom:10}}><b style={{color:T.text}}>Gatilhos:</b> {e.gatilho}</div>
      {bigIdeia&&<div style={{background:e.cor+"18",borderRadius:8,padding:10,marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:e.cor,letterSpacing:"0.07em",fontFamily:"sans-serif",marginBottom:4}}>💡 BIG IDEA</div><div style={{fontSize:12,color:T.text,fontFamily:"sans-serif",lineHeight:1.5}}>{bigIdeia}</div></div>}
      {evidencias&&<div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",fontStyle:"italic",borderTop:`1px solid ${T.border}`,paddingTop:8}}>{evidencias}</div>}
    </div>
  );
}

export default function App(){
  const[modoVSL,setModoVSL]=useState("texto");
  const[vslTexto,setVslTexto]=useState("");
  const[vslLink,setVslLink]=useState("");
  const[prodNome,setProdNome]=useState("");
  const[prodURL,setProdURL]=useState("");
  const[prodPrint,setProdPrint]=useState(null);
  const[prodExtra,setProdExtra]=useState("");
  const[analise,setAnalise]=useState(null);
  const[caesp,setCAESP]=useState(null);
  const[caminho,setCaminho]=useState(null);
  const[enneaDest,setEnneaDest]=useState(null);
  const[formato,setFormato]=useState(null);
  const[copyGerada,setCopyGerada]=useState("");
  const[versoes,setVersoes]=useState([]);
  const[copiado,setCopiado]=useState(false);
  const[fase,setFase]=useState(1);
  const[loading,setLoading]=useState(false);
  const[loadMsg,setLoadMsg]=useState("");
  const[erro,setErro]=useState("");
  const resultRef=useRef(null);

  function copiar(txt){navigator.clipboard.writeText(txt);setCopiado(true);setTimeout(()=>setCopiado(false),2000);}
  function resetar(){setFase(1);setAnalise(null);setCAESP(null);setCopyGerada("");setVersoes([]);setErro("");setCaminho(null);setEnneaDest(null);setFormato(null);}

  async function analisar(){
    setErro("");
    const transcricao=modoVSL==="link"?`[Link YouTube: ${vslLink}]`:vslTexto;
    if(!transcricao.trim())return setErro("Insira a transcrição ou link da VSL.");
    if(!prodNome.trim())return setErro("Insira o nome do produto.");
    if(!prodURL.trim())return setErro("Insira o URL do produto.");
    if(!prodPrint&&!prodExtra.trim())return setErro("Adicione o printscreen ou informações extras do produto.");
    setLoading(true);setFase(2);
    try{
      setLoadMsg("Lendo site do produto...");
      let siteTexto="";
      try{const r=await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(prodURL)}`);const d=await r.json();siteTexto=d.contents?.replace(/<[^>]+>/g," ").replace(/\s+/g," ").slice(0,1500)||"";}catch(_){}

      let printBase64=null,printMediaType="image/jpeg";
      if(prodPrint?.file){setLoadMsg("Processando printscreen...");printBase64=await fileToBase64(prodPrint.file);printMediaType=prodPrint.file.type||"image/jpeg";}

      const siteCtx=[siteTexto?`TEXTO DO SITE:\n${siteTexto}`:"",prodExtra?`EXTRAS:\n${prodExtra}`:""].filter(Boolean).join("\n\n");

      setLoadMsg("Analisando VSL...");
      const resultado=await apiAnalisar({transcricao,prodNome,prodURL,siteCtx,printBase64,printMediaType});
      setAnalise(resultado);
      setCAESP(resultado.caesp);
      setLoading(false);
    }catch(e){setErro("Erro na análise: "+e.message);setLoading(false);setFase(1);}
  }

  async function gerarCopy(novaVersao=false){
    if(!formato)return setErro("Escolha o formato.");
    if(!analise?.alinhados&&!caminho)return setErro("Escolha o caminho para fechar o gap.");
    setLoading(true);setLoadMsg("Gerando copy...");setErro("");
    try{
      const tipoFinal=enneaDest||analise.tipoVSL;
      const en=ENNEAGRAM[tipoFinal];
      const fmt=FORMATOS.find(f=>f.id===formato);
      const caminhoCtx=!analise.alinhados&&caminho?`Caminho ${caminho}: ${analise.caminhos?.[caminho]||""}`:"Alinhados — use a sinergia.";
      const system="Você é copywriter especialista em VSL e Enneagrama. Escreva apenas a copy. Sem introduções. Sem comentários.";
      const user=`PRODUTO: ${prodNome} | URL: ${prodURL}
EXTRAS: ${prodExtra||"Nenhum"}
BIG IDEA: ${analise.bigIdeiaProduto}
ESTRUTURA C.A.E.S.P.+:
Cena: ${caesp?.cena}
Ação: ${caesp?.acao}
Espelho: ${caesp?.espelho}
Solução: ${caesp?.solucao}
Promessa: ${caesp?.promessa}
Objeção: ${caesp?.objecao}
Urgência: ${caesp?.urgencia}
Mecanismo: ${caesp?.mecanismo}
Narrador: ${caesp?.personagem}
ENNEAGRAMA: Tipo ${tipoFinal} — ${en?.nome}
Driver: ${en?.driver} | Gatilhos: ${en?.gatilho}
${caminhoCtx}
FORMATO: ${fmt?.label} (${fmt?.desc})
${novaVersao?"NOVA VERSÃO: varie a abertura, mantenha estrutura e Enneagrama.":""}
Português brasileiro. Tom par-a-par. Confissão pessoal.
Mini VSL e Social: indicações de cena entre [colchetes].
VSL Completa: blocos nomeados.
ESCREVA APENAS A COPY.`;
      const texto=await apiGerar(system,user);
      if(novaVersao){setVersoes(v=>[...v,{texto,tipo:tipoFinal,fmt:fmt?.label}]);}
      else{setCopyGerada(texto);setVersoes([]);setFase(4);setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth"}),150);}
    }catch(e){setErro("Erro ao gerar: "+e.message);}
    finally{setLoading(false);setLoadMsg("");}
  }

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Georgia,serif"}}>
      <style>{CSS}</style>
      <div style={{background:`linear-gradient(135deg,${T.surface},#0D0D1A)`,borderBottom:`1px solid ${T.border}`,padding:"20px 28px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:`linear-gradient(135deg,${T.accent},${T.accentB})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚡</div>
        <div><div style={{fontSize:17,fontWeight:700}}>VSL Transplanter</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Engenharia reversa de copy · C.A.E.S.P.+ · Enneagrama · Big Idea</div></div>
        {fase>1&&<button onClick={resetar} style={mk.btn("transparent",T.textSub,{border:`1px solid ${T.border}`,marginLeft:"auto",padding:"8px 18px",fontSize:12})}>← Reiniciar</button>}
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"32px 20px 80px"}}>
        <div className="fu">
          <div style={mk.card()}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={mk.sn()}>1</div>
              <div><div style={{fontSize:14,fontWeight:700}}>VSL de Referência</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Transcrição ou link do YouTube</div></div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              {["texto","link"].map(m=>(<button key={m} disabled={fase>1} onClick={()=>setModoVSL(m)} style={mk.chip(modoVSL===m,T.accent)}>{m==="texto"?"📝 Colar transcrição":"▶ Link YouTube"}</button>))}
            </div>
            {modoVSL==="texto"?(<><label style={mk.lbl}>Transcrição</label><textarea value={vslTexto} onChange={e=>setVslTexto(e.target.value)} placeholder="Cole o texto completo da VSL..." style={mk.ta(8)} disabled={fase>1}/></>):(<><label style={mk.lbl}>Link YouTube</label><input value={vslLink} onChange={e=>setVslLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={mk.inp} disabled={fase>1}/><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:6}}>⚠ Se não funcionar, use Colar transcrição</div></>)}
          </div>

          <div style={mk.card()}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={mk.sn()}>2</div>
              <div><div style={{fontSize:14,fontWeight:700}}>Produto de Destino</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Nome, URL, print e informações extras</div></div>
            </div>
            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:180}}><label style={mk.lbl}>Nome do produto</label><input value={prodNome} onChange={e=>setProdNome(e.target.value)} placeholder="Ex: Protocolo Sono de Elite" style={mk.inp} disabled={fase>1}/></div>
              <div style={{flex:2,minWidth:240}}><label style={mk.lbl}>URL do site</label><input value={prodURL} onChange={e=>setProdURL(e.target.value)} placeholder="https://..." style={mk.inp} disabled={fase>1}/></div>
            </div>
            {fase===1?(<ImageUpload value={prodPrint} onChange={setProdPrint}/>):prodPrint?.url?(<div style={{marginBottom:14}}><label style={mk.lbl}>Print do site</label><img src={prodPrint.url} alt="site" style={{width:"100%",maxHeight:120,objectFit:"cover",borderRadius:10,border:`1px solid ${T.border}`}}/></div>):null}
            <label style={mk.lbl}>Informações extras <span style={{color:T.muted,fontWeight:400,textTransform:"none"}}>(diferenciais que o site não mostra)</span></label>
            <textarea value={prodExtra} onChange={e=>setProdExtra(e.target.value)} placeholder="Cole textos, diferenciais, posicionamento..." style={mk.ta(4)} disabled={fase>1}/>
          </div>

          {fase===1&&(<div style={{textAlign:"center"}}>{erro&&<div style={mk.err}>{erro}</div>}<button onClick={analisar} style={mk.btn(`linear-gradient(135deg,${T.accent},${T.accentB})`,"#fff",{padding:"14px 52px",fontSize:14})}>⚡ Analisar VSL e Produto</button></div>)}
        </div>

        {loading&&(<div style={{textAlign:"center",padding:"40px 0"}} className="fu"><div style={{...mk.ic(T.accent),display:"inline-block",padding:"20px 44px"}}><span style={mk.sp}/><span style={{fontFamily:"sans-serif",fontSize:13,color:T.textSub}}>{loadMsg}</span></div></div>)}

        {!loading&&analise&&fase>=2&&(
          <div className="fu">
            <div style={mk.card()}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                <div style={mk.sn(`linear-gradient(135deg,${T.gold},#E6AC00)`)}><span style={{color:"#1A1A00"}}>3</span></div>
                <div><div style={{fontSize:14,fontWeight:700}}>Análise Completa</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>Big Idea · Enneagrama · Mapa · C.A.E.S.P.+</div></div>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
                <EnneaCard tipo={analise.tipoVSL} label="VSL de Referência" evidencias={analise.evidVSL} bigIdeia={analise.bigIdeiaVSL}/>
                <EnneaCard tipo={analise.tipoProduto} label="Site do Produto" evidencias={analise.evidProduto} bigIdeia={analise.bigIdeiaProduto}/>
              </div>
              {analise.alinhados?(
                <div style={mk.ic(T.green)}><span style={mk.tag(T.green)}>✓ ALINHADOS</span><p style={{fontSize:13,color:T.text,fontFamily:"sans-serif",marginTop:8,marginBottom:0}}>{analise.oportunidade}</p></div>
              ):(
                <>
                  <div style={mk.ic(T.red)}><span style={mk.tag(T.red)}>⚡ GAP DETECTADO</span><p style={{fontSize:13,color:T.text,fontFamily:"sans-serif",marginTop:8,marginBottom:0}}>{analise.gap}</p></div>
                  <div style={mk.ic(T.gold)}><span style={mk.tag(T.gold)}>◆ OPORTUNIDADE</span><p style={{fontSize:13,color:T.text,fontFamily:"sans-serif",marginTop:8,marginBottom:0}}>{analise.oportunidade}</p></div>
                  <div style={{marginTop:14}}>
                    <div style={{...mk.lbl,marginBottom:10}}>Como fechar o gap — escolha o caminho:</div>
                    {CAMINHOS.map(c=>(<div key={c.id} onClick={()=>setCaminho(caminho===c.id?null:c.id)} style={{...mk.ic(caminho===c.id?T.accent:T.border),cursor:"pointer",border:`1px solid ${caminho===c.id?T.accent:T.border}`,transition:"all 0.15s"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={mk.tag(caminho===c.id?T.accent:T.muted)}>{c.label}</span><span style={{fontSize:12,fontWeight:700,fontFamily:"sans-serif"}}>{c.desc}</span></div>{analise.caminhos?.[c.id]&&<p style={{fontSize:12,color:T.textSub,fontFamily:"sans-serif",margin:0}}>{analise.caminhos[c.id]}</p>}</div>))}
                  </div>
                </>
              )}
              {caesp&&(<>
                <div style={{height:1,background:T.border,margin:"18px 0"}}/>
                <div style={{...mk.lbl,marginBottom:10}}>C.A.E.S.P.+ extraído da VSL</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["C — Cena",caesp.cena],["A — Ação",caesp.acao],["E — Espelho",caesp.espelho],["S — Solução",caesp.solucao],["P — Promessa",caesp.promessa],["O — Objeção",caesp.objecao],["U — Urgência",caesp.urgencia],["Mecanismo",caesp.mecanismo]].map(([k,v])=>(
                    <div key={k} style={{background:T.surface,borderRadius:8,padding:10,border:`1px solid ${T.border}`}}><div style={{fontSize:9,fontWeight:700,color:T.accent,fontFamily:"sans-serif",letterSpacing:"0.06em",marginBottom:4}}>{k}</div><div style={{fontSize:11,color:T.textSub,fontFamily:"sans-serif",lineHeight:1.5}}>{v||"—"}</div></div>
                  ))}
                </div>
              </>)}
            </div>

            <div style={{...mk.card(),border:`1px solid ${T.accent}`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <div style={mk.sn(`linear-gradient(135deg,${T.green},#27AE60)`)}>4</div>
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

        {!loading&&copyGerada&&fase===4&&(
          <div className="fu" ref={resultRef}>
            <div style={mk.card()}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{...mk.sn(`linear-gradient(135deg,${T.gold},#E6AC00)`),color:"#1A1A00"}}>✓</div>
                  <div><div style={{fontSize:14,fontWeight:700}}>Copy Gerada</div><div style={{fontSize:11,color:T.muted,fontFamily:"sans-serif",marginTop:2}}>{FORMATOS.find(f=>f.id===formato)?.label} · Tipo {enneaDest||analise?.tipoVSL} — {ENNEAGRAM[enneaDest||analise?.tipoVSL]?.nome}</div></div>
                </div>
                <button onClick={()=>copiar(copyGerada)} style={mk.btn(copiado?T.green:T.surface,copiado?"#fff":T.textSub,{border:`1px solid ${copiado?T.green:T.border}`,padding:"8px 18px",fontSize:12})}>{copiado?"✓ Copiado":"📋 Copiar"}</button>
              </div>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}} className="copybox">{copyGerada}</div>
              <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
                <button onClick={()=>gerarCopy(true)} style={mk.btn(`linear-gradient(135deg,${T.accent},${T.accentB})`,"#fff",{padding:"10px 22px",fontSize:13})}>↻ Nova versão · mesmo Enneagrama</button>
                <button onClick={()=>{setCopyGerada("");setVersoes([]);}} style={mk.btn("transparent",T.textSub,{border:`1px solid ${T.border}`,padding:"10px 20px",fontSize:13})}>← Mudar configurações</button>
              </div>
            </div>
            {versoes.length>0&&(<div><div style={{...mk.lbl,marginBottom:12}}>Versões adicionais</div>{versoes.map((v,i)=>(<div key={i} style={{...mk.card(),marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={mk.tag(T.accent)}>Versão {i+2} · {v.fmt} · Tipo {v.tipo}</span><button onClick={()=>copiar(v.texto)} style={mk.btn(T.surface,T.textSub,{border:`1px solid ${T.border}`,padding:"6px 14px",fontSize:11})}>📋 Copiar</button></div><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}} className="copybox">{v.texto}</div></div>))}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

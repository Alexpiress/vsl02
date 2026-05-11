# VSL Transplanter — Guia de Deploy no Vercel

## O que está nesta pasta

```
vsl-transplanter/
├── api/
│   └── analyze.js        ← Backend seguro (sua API key fica aqui, invisível)
├── src/
│   ├── main.jsx          ← Entry point React
│   └── App.jsx           ← App completo
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## Passo a passo para publicar

### 1. Criar conta na Anthropic (API key)

1. Acesse: https://platform.anthropic.com
2. Crie uma conta ou faça login
3. Vá em **API Keys** → **Create Key**
4. Copie a chave (começa com `sk-ant-...`)
5. Guarde em lugar seguro — ela não aparece de novo

> **Custo estimado:** ~$0,01 a $0,03 por análise completa.
> Você paga só pelo que usar. Não tem mensalidade.

---

### 2. Criar conta no Vercel

1. Acesse: https://vercel.com
2. Crie conta com GitHub, Google ou e-mail
3. Plano gratuito é suficiente

---

### 3. Subir o projeto

**Opção A — Via GitHub (recomendado)**

1. Crie um repositório no GitHub e faça upload desta pasta
2. No Vercel: **Add New Project** → importe o repositório
3. Vercel detecta automaticamente que é Vite/React
4. Clique em **Deploy**

**Opção B — Via Vercel CLI**

```bash
npm install -g vercel
cd vsl-transplanter
vercel
```

---

### 4. Adicionar a API key (passo mais importante)

Depois do deploy, no painel do Vercel:

1. Vá no projeto → **Settings** → **Environment Variables**
2. Clique em **Add New**
3. Nome: `ANTHROPIC_API_KEY`
4. Valor: cole sua chave `sk-ant-...`
5. Deixe marcado: **Production**, **Preview**, **Development**
6. Clique em **Save**
7. Vá em **Deployments** → clique nos 3 pontos → **Redeploy**

> ✅ Pronto. Sua chave fica no servidor do Vercel, nunca exposta no navegador.

---

### 5. Acessar o app

O Vercel gera uma URL no formato:
`https://vsl-transplanter-xxxx.vercel.app`

Você pode conectar um domínio próprio em **Settings → Domains**.

---

## Como usar o app

1. **Passo 1** — Cole a transcrição da VSL de referência (ou link YouTube)
2. **Passo 2** — Insira o nome e URL do produto de destino + printscreen do site (foto da tela) + informações extras se quiser
3. **Analisar** — A IA identifica:
   - Enneagrama da VSL (com evidências)
   - Enneagrama do produto (com evidências do site/print)
   - Big Idea da VSL
   - Big Idea do produto
   - Gap entre os dois (se houver) + 3 caminhos para fechar
   - Estrutura C.A.E.S.P.+ extraída
4. **Passo 3** — Escolha o formato (Mini VSL / VSL Completa / Criativo Social) e o Enneagrama de destino
5. **Gerar** — Copy pronta para usar
6. **Nova versão** — Gera variações sem precisar reinserir nada

---

## Custos estimados

| Uso | Custo aproximado |
|-----|-----------------|
| 1 análise completa | ~$0,02 |
| 50 análises/mês | ~$1,00 |
| 500 análises/mês | ~$10,00 |

O plano gratuito do Vercel não tem custo de hospedagem.
Você paga só os tokens da Anthropic.

---

## Problemas comuns

**"API key não configurada"**
→ Adicione a variável `ANTHROPIC_API_KEY` no Vercel e faça redeploy.

**"Falha ao interpretar resposta"**
→ A IA retornou algo inesperado. Tente de novo — acontece raramente.

**Link do YouTube não funciona**
→ Use o modo "Colar transcrição". YouTube bloqueia acesso externo automatizado.

**Site do produto não carrega automaticamente**
→ Use o printscreen do site ou cole o texto da página no campo "Informações extras".

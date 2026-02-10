# AI News Hub - Trabalho Atual

> **Instrucoes**: Atualize este arquivo manualmente antes de iniciar uma conversa com o Claude.
> Isso fornece contexto imediato sem precisar ler todo o codebase.
> Apague os exemplos e preencha com seu trabalho real.

---

## Trabalhando Agora

**Tarefa**: Documentacao do projeto - preencher /docs com estado real do codebase

**Arquivos sendo modificados**:
- `docs/ARCHITECTURE.md` - Atualizado com modulos sentiment.js, streamgraph.js, ordem de carregamento corrigida, 3 views
- `docs/API.md` - Adicionadas interfaces SentimentService, StreamGraph, detalhes do Radar e Topic Cloud
- `docs/TECH_STACK.md` - Criado do zero: stack real (vanilla JS, CDN libs, sem build tools)
- `docs/CURRENT_WORK.md` - Este ficheiro, preenchido com estado real

**Status**: Em andamento

---

## Proximos Passos

1. Configurar Firebase (criar projeto, preencher CONFIG.FIREBASE, ativar Auth e Firestore)
2. Testar e corrigir feeds RSS que possam estar offline
3. Resolver `context.js` (usa ES6 export, incompativel com arquitetura - remover ou converter)
4. Avaliar re-ativacao de social feeds (CORS continua a ser problema)
5. Melhorar analise de sentimento (atualmente keyword-based, pouco precisa)

---

## Contexto Relevante

**Decisoes recentes**:
- Firebase Auth e Votes desabilitados (comentados em app.js:36-53) ate ter credenciais reais
- Social accounts (Twitter/X, Bluesky) removidos - CORS proxies nao conseguem acessar. Lista salva em `fontesdeletadas`
- Streamgraph de sentimento adicionado como 3a view ("Sentimento do Mercado") usando D3.js
- SentimentService extraido como modulo separado (sentiment.js) para ser reutilizado por Analytics e StreamGraph
- Tab "Popular" escondida nos filtros de recencia (requer Firebase)

**Restricoes / Limitacoes**:
- Firebase Auth esta desabilitado (comentado em app.js:36-53)
- Votos nao funcionam sem Firebase
- Filtro "Popular" escondido (depende de votos)
- `context.js` usa `export` ES6, nao carregado, possivelmente arquivo orfao
- Sentimento e keyword-based (sem NLP real) - pode classificar mal artigos ambiguos
- CORS proxies publicos sao instáveis (allorigins, corsproxy.io, cors.lol)

**Bugs conhecidos**:
- Nenhum bug critico conhecido no momento

**Dependencias externas**:
- 3 CORS proxies publicos (allorigins.win, corsproxy.io, cors.lol) - todos instáveis por natureza
- CDN jsdelivr.net (Chart.js, D3.js, chartjs-chart-treemap)
- CDN gstatic.com (Firebase SDK)
- 13 RSS feeds de terceiros (podem mudar URLs ou ficar offline a qualquer momento)

---

## Historico Recente

| Data | Mudanca | Arquivos |
|------|---------|----------|
| 10/02/2026 | Documentacao: preenchidos ARCHITECTURE.md, API.md, TECH_STACK.md, CURRENT_WORK.md | docs/* |
| Anterior | Adicionado Streamgraph de sentimento (D3.js) com filtros temporais | js/streamgraph.js, js/sentiment.js, index.html, css/styles.css |
| Anterior | Adicionado SentimentService como modulo reutilizavel | js/sentiment.js |
| Anterior | Dashboard Analytics: topic cloud, radar, most read, leaderboard | js/analytics.js |
| Anterior | Sidebar navegavel com 3 views (Feed, Resumo Executivo, Sentimento) | js/sidebar.js, js/views.js |

# AI News Hub - Arquitetura

## Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3 (variaveis customizadas), JavaScript ES5+ (vanilla) |
| Dados | RSS/Atom feeds via CORS proxies |
| Backend | Nenhum (100% client-side) |
| Auth | Firebase Auth (Google sign-in) - **desabilitado atualmente** |
| Database | Firebase Firestore (votos) - **desabilitado atualmente** |
| Charts | Chart.js 4 + chartjs-chart-treemap 2 |
| Visualizacao | D3.js 7 (streamgraph de sentimento) |
| Hosting | Qualquer servidor estatico |

## Decisoes Arquiteturais

- **Sem build tools**: sem Webpack, Vite, etc. Scripts carregados via `<script>` tags
- **Sem frameworks**: vanilla JS puro, sem React/Vue/Angular
- **Module pattern**: cada modulo e um objeto global `window.X = { ... }` (nao usa ES6 modules)
- **Firebase desabilitado**: Auth e Votes estao comentados em `app.js:36-53`. Codigo existe mas nao executa
- **CORS proxies**: RSS feeds buscados via round-robin entre 3 proxies publicos (allorigins, corsproxy.io, cors.lol)
- **Social feeds desabilitados**: `SOCIAL_ACCOUNTS` vazio (CORS proxies nao conseguem acessar Bluesky/Nitter/RSSHub). Lista salva em `fontesdeletadas`
- **Sentimento por keywords**: Analise de sentimento baseada em listas de palavras positivas/negativas (sem NLP externo)

## Estrutura de Pastas

```
/
├── index.html              # SPA - pagina unica com todas as views
├── assets/
│   └── favicon.svg         # Icone do site
├── css/
│   └── styles.css          # Todos os estilos (~1800+ linhas), temas dark/light
├── js/
│   ├── config.js           # CONFIG global: feeds, categorias, Firebase, settings, leaderboard
│   ├── auth.js             # Firebase Auth wrapper (Google sign-in)
│   ├── votes.js            # Firestore vote service (batch writes, cache local)
│   ├── feeds.js            # Fetch/parse RSS e Atom, CORS proxy, cascade social
│   ├── ui.js               # Manipulacao DOM, cards, lazy loading, toasts, TL;DR
│   ├── views.js            # ViewManager: alterna entre Feed, Analytics e Sentiment
│   ├── sentiment.js        # SentimentService: classificacao de sentimento por keywords
│   ├── analytics.js        # Dashboard: topic cloud, radar, most read, leaderboard
│   ├── streamgraph.js      # StreamGraph: barometro de humor D3.js com filtros temporais
│   ├── sidebar.js          # Menu lateral: navegacao, categorias, mobile overlay
│   └── app.js              # Orquestrador: init, cache, filtros, auto-refresh
├── firestore.rules         # Regras de seguranca Firestore
├── fontesdeletadas         # Backup de fontes sociais removidas
└── docs/                   # Documentacao do projeto
    ├── ARCHITECTURE.md     # Este ficheiro
    ├── API.md              # Interfaces dos modulos e modelos de dados
    ├── TECH_STACK.md       # Stack tecnologica detalhada
    ├── CURRENT_WORK.md     # Registo do trabalho atual
    └── .claude/
        └── instructions.md # Prompt universal para o Claude
```

## Ordem de Carregamento (importa!)

```
config.js → auth.js → votes.js → feeds.js → ui.js → views.js → sentiment.js → analytics.js → streamgraph.js → sidebar.js → app.js
```


## Fluxo de Dados Principal

```
1. App.init()
   ├── UI.cacheElements() + initTheme()
   ├── UI.renderCategoryTabs() + renderRecencyTabs()
   ├── SidebarService.init()
   ├── ViewManager.init()
   ├── StreamGraph.init()
   ├── _restoreFilterPrefs()
   ├── Tenta cache localStorage
   │   ├── Se fresco (< 15min): renderiza + refresh background
   │   └── Se vazio: mostra skeleton + fetch
   └── startAutoRefresh (15min)

2. App.refreshFeeds()
   ├── FeedService.fetchAllFeeds()
   │   ├── RSS feeds (paralelo, cada um tenta 3 proxies)
   │   └── Social feeds (cascade: Bluesky → RSSHub → Nitter) [atualmente vazio]
   ├── deduplicateArticles() → por URL normalizada + titulo
   ├── categorizeArticles() → keyword matching por categoria
   ├── enrichWithRecency() → Newest (<6h), New (6-48h), Past (>48h)
   ├── sortArticles() → por grupo recencia, depois por data
   ├── saveToCache() + applyFilters() + UI.renderCards()
   ├── Se Analytics visivel: AnalyticsPage.render()
   └── Se Sentiment visivel: StreamGraph.render()

3. Filtragem
   ├── Categoria: keyword matching (CONFIG.CATEGORIES[].keywords)
   ├── Recencia: Newest / New / Past / Popular
   ├── Busca: texto livre em titulo + descricao + fonte
   └── Popular: ordenacao por votos (requer Firebase - desabilitado)
```

## Views (3 views alternadas pelo ViewManager)

| View | Container ID | Navegacao Sidebar | Descricao |
|------|-------------|-------------------|-----------|
| Feed | `feed-view` | "Feed de Noticias" | Grid de cards com filtros de categoria, recencia e busca |
| Analytics | `analytics-view` | "Resumo Executivo" | Dashboard: Most Read, Topic Cloud, Radar, Leaderboard |
| Sentiment | `sentiment-view` | "Sentimento do Mercado" | Streamgraph D3.js com barometro de humor temporal |

## Modulos e Responsabilidades

| Modulo | Objeto Global | Responsabilidade |
|--------|--------------|-----------------|
| config.js | `CONFIG` | Feeds RSS, categorias, keywords, settings, Firebase config, AI Leaderboard |
| auth.js | `Auth` | Login/logout Google, callback de auth state |
| votes.js | `VoteService` | Toggle voto, cache local, batch load, popular |
| feeds.js | `FeedService` | Fetch RSS/Atom, parse XML, CORS proxy round-robin, cascade social |
| ui.js | `UI` | Render cards, lazy loading (IntersectionObserver, 12/batch), temas, toasts, TL;DR |
| views.js | `ViewManager` | Alternar entre Feed, Analytics e Sentiment views |
| sentiment.js | `SentimentService` | Classificacao de sentimento (positive/neutral/negative) por keyword matching |
| analytics.js | `AnalyticsPage` | Topic cloud, radar Chart.js com filtros temporais, most read, leaderboard |
| streamgraph.js | `StreamGraph` | Streamgraph D3.js: agregacao temporal, hover, anotacoes, filtros (3d/7d/30d/custom) |
| sidebar.js | `SidebarService` | Menu lateral, categorias dropdown, mobile overlay, navegacao entre views |
| app.js | `App` | Orquestrador: init, cache, filtros, auto-refresh, bind events |

## Temas (Dark/Light)

- Controlado pelo atributo `data-theme` no `<body>`
- CSS usa seletores `[data-theme="dark"]` e `[data-theme="light"]` com variaveis CSS
- Preferencia salva em `localStorage` (key: `ainewshub_theme`)
- StreamGraph observa mudancas de tema via `MutationObserver` e re-renderiza

## Cache

- **Armazenamento**: `localStorage`
- **TTL**: 15 minutos (`CONFIG.SETTINGS.cacheTtlMs`)
- **Keys**: `ainewshub_articles`, `ainewshub_timestamp`
- **Fallback stale**: se fetch falha, usa cache expirado com aviso visual
- **Limite**: 400 artigos maximo (`CONFIG.SETTINGS.maxTotalArticles`)
- **Outros**: `ainewshub_theme`, `ainewshub_category`, `ainewshub_recency`, `ainewshub_sidebar_expanded`

## Categorias

8 categorias + "Tudo", definidas em `CONFIG.CATEGORIES`:

| ID | Label |
|----|-------|
| `all` | Tudo |
| `bigtechs-negocios` | #BigTechs & Negocios |
| `futuro-trabalho-etica` | #Futuro do Trabalho, Etica & Regulacao |
| `llms` | #LLMs |
| `ia-generativa` | #IA Generativa & Criatividade |
| `dev-opensource` | #Dev & Open Source |
| `garage-projects` | #GarageProjects |
| `pesquisa-papers` | #Pesquisa & Papers |
| `debates-duvidas` | #Debates & Duvidas |

Categorizacao: keyword matching no titulo+descricao. Categoria com mais matches vence. Fallback: `defaultCategory` do feed.

## Analise de Sentimento

- **Motor**: `SentimentService` (js/sentiment.js)
- **Metodo**: contagem de palavras positivas vs negativas no titulo+descricao
- **Score**: `(positivas - negativas) / total` → valor entre -1 e +1
- **Classificacao**: `>0.2` = positive, `<-0.2` = negative, resto = neutral
- **Usado por**: StreamGraph (barometro) e AnalyticsPage (heatmap interno)
- **Limitacao**: keyword-based, sem NLP ou modelo de linguagem

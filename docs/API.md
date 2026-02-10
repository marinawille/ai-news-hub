# AI News Hub - API Interna e Modelos de Dados

> Este projeto nao possui backend. "API" aqui refere-se as interfaces publicas dos modulos JS e servicos externos consumidos.

## Servicos Externos

### CORS Proxies (round-robin)

Usados para contornar CORS ao buscar RSS feeds. Tentados em ordem:

| # | Proxy | URL Pattern |
|---|-------|------------|
| 1 | AllOrigins | `https://api.allorigins.win/raw?url={encoded_url}` |
| 2 | CorsProxy.io | `https://corsproxy.io/?{encoded_url}` |
| 3 | Cors.lol | `https://api.cors.lol/?url={encoded_url}` |

### RSS Feeds Configurados

| Fonte | URL | Categoria Default |
|-------|-----|------------------|
| OpenAI Blog | `openai.com/news/rss.xml` | bigtechs-negocios |
| TechCrunch AI | `techcrunch.com/.../feed/` | bigtechs-negocios |
| The Verge AI | `theverge.com/rss/ai-artificial-intelligence/` | bigtechs-negocios |
| MIT Technology Review | `technologyreview.com/feed/` | pesquisa-papers |
| ArXiv AI | `rss.arxiv.org/rss/cs.AI` | pesquisa-papers |
| Wired AI | `wired.com/feed/tag/ai/latest/rss` | bigtechs-negocios |
| Ars Technica | `feeds.arstechnica.com/.../technology-lab` | dev-opensource |
| Google AI Blog | `blog.google/technology/ai/rss/` | bigtechs-negocios |
| Sam Altman Blog | `blog.samaltman.com/posts.atom` | bigtechs-negocios |
| Dario Amodei | `darioamodei.substack.com/feed` | bigtechs-negocios |
| Ethan Mollick | `oneusefulthing.org/feed` | futuro-trabalho-etica |
| Karpathy YouTube | `youtube.com/feeds/videos.xml?channel_id=...` | pesquisa-papers |
| Luiza Jarovsky | `luizasnewsletter.com/feed` | futuro-trabalho-etica |

### Social Feeds (desabilitados)

`SOCIAL_ACCOUNTS` esta vazio. O sistema cascade (Bluesky → RSSHub → Nitter) existe no codigo mas CORS proxies nao conseguem acessar estas plataformas. Lista de contas salva em `fontesdeletadas`.

### Firebase (desabilitado)

| Servico | Uso |
|---------|-----|
| Firebase Auth | Google sign-in (popup com fallback redirect) |
| Firestore | Colecoes `votes`, `voteCounts`, `users` |

---

## Interfaces dos Modulos JS

### `FeedService` (js/feeds.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `fetchAllFeeds()` | - | `Promise<{ articles[], failedFeeds[] }>` | Busca todos os feeds RSS + social em paralelo |
| `fetchFeedXml(feedUrl)` | `string` | `Promise<string>` | Busca XML de um feed, tentando cada proxy |
| `fetchWithTimeout(url, timeoutMs)` | `string, number?` | `Promise<string>` | Fetch com AbortController e timeout |
| `parseFeed(xmlString, feedMeta)` | `string, object` | `Article[]` | Detecta RSS/Atom e faz parse |
| `parseRss(xmlString, feedMeta)` | `string, object` | `Article[]` | Parse RSS 2.0 |
| `parseAtom(xmlString, feedMeta)` | `string, object` | `Article[]` | Parse Atom |
| `hashId(str)` | `string` | `string` | Gera ID deterministico (prefixo `art_`) |
| `extractThumbnail(item)` | `Element` | `string\|null` | Extrai thumbnail de media:content, enclosure, img |
| `fetchSocialFeedWithCascade(account)` | `object` | `Promise<{ feed, articles }>` | Tenta Bluesky → RSSHub → Nitter |
| `fetchSocialFeeds()` | - | `Promise<{ articles[], failedFeeds[] }>` | Busca todos os SOCIAL_ACCOUNTS |
| `getProxiedUrl(feedUrl)` | `string` | `string` | URL com proxy atual (round-robin) |
| `nextProxy()` | - | `void` | Avanca para proximo proxy |

### `App` (js/app.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `init()` | - | `void` | Bootstrap da aplicacao |
| `refreshFeeds(showLoading)` | `boolean` | `void` | Busca feeds, processa, cacheia, renderiza |
| `applyFilters()` | - | `void` | Aplica filtros de categoria + recencia + busca |
| `filterByCategory(categoryId)` | `string` | `void` | Filtra por categoria |
| `filterByRecency(recencyId)` | `string` | `void` | Filtra por recencia |
| `filterBySearch(query)` | `string` | `void` | Filtra por texto |
| `loadFromCache()` | - | `{ articles, timestamp } \| null` | Carrega cache fresco |
| `loadStaleCache()` | - | `{ articles, timestamp } \| null` | Carrega cache expirado |
| `saveToCache(articles)` | `Article[]` | `void` | Salva no localStorage |
| `clearCache()` | - | `void` | Limpa cache |
| `handleVote(articleId)` | `string` | `void` | Toggle voto (requer login) |
| `categorizeArticles(articles)` | `Article[]` | `Article[]` | Atribui categoria por keyword matching |
| `deduplicateArticles(articles)` | `Article[]` | `Article[]` | Remove duplicatas por URL e titulo |
| `enrichWithRecency(articles)` | `Article[]` | `Article[]` | Adiciona campo recencyStatus |
| `sortArticles(articles)` | `Article[]` | `Article[]` | Ordena por recencia e data |
| `getRecencyStatus(publishedAt)` | `Date` | `string` | Retorna Newest/New/Past |
| `startAutoRefresh()` | - | `void` | Inicia timer de 15min |
| `stopAutoRefresh()` | - | `void` | Para timer |

### `UI` (js/ui.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `cacheElements()` | - | `void` | Cache de referencias DOM |
| `renderCards(articles, filterContext)` | `Article[], object` | `void` | Renderiza cards com lazy loading |
| `createCard(article, index)` | `Article, number` | `HTMLElement` | Cria um card de noticia |
| `showLoading()` / `hideLoading()` | - | `void` | Skeleton loading |
| `showToast(message, type)` | `string, string` | `void` | Notificacao temporaria (4s) |
| `toggleTheme()` | - | `void` | Alterna dark/light |
| `initTheme()` | - | `void` | Restaura tema do localStorage |
| `showError(message, isRetryable)` | `string, boolean` | `void` | Exibe erro com botao retry |
| `clearError()` | - | `void` | Limpa erro |
| `timeAgo(date)` | `Date` | `string` | Tempo relativo em portugues |
| `formatTimestamp(date)` | `Date` | `string` | Data formatada DD/MM/YYYY HH:MM |
| `generateTldr(description, title)` | `string, string` | `string[]` | Gera bullets TL;DR (max 3) |
| `renderCategoryTabs()` | - | `void` | Renderiza tabs de categoria |
| `renderRecencyTabs()` | - | `void` | Renderiza tabs de recencia |
| `setActiveTab(categoryId)` | `string` | `void` | Marca tab ativa |
| `setActiveRecencyTab(recencyId)` | `string` | `void` | Marca tab recencia ativa |
| `updateTimestamp(date)` | `Date` | `void` | Atualiza "Atualizado: ..." |
| `updateArticleCount(count, total)` | `number, number` | `void` | Atualiza contagem |
| `showStaleWarning(timestamp)` | `number` | `void` | Aviso de cache expirado |
| `hideStaleWarning()` | - | `void` | Esconde aviso |
| `setRefreshing(isRefreshing)` | `boolean` | `void` | Botao refresh girando |
| `escapeHtml(str)` | `string` | `string` | Escape XSS |
| `sanitizeText(text)` | `string` | `string` | Remove HTML, normaliza whitespace |
| `debounce(fn, delayMs)` | `function, number` | `function` | Cria funcao debounced |
| `getCategoryLabel(id)` | `string` | `string` | Label da categoria |
| `getCategoryIcon(id)` | `string` | `string` | Emoji da categoria |
| `getCategoryHashtag(id)` | `string` | `string` | Hashtag formatada |
| `getRecencyBadge(status)` | `string` | `{ label, cssClass }` | Badge de recencia |
| `showUserMenu(user)` | `object` | `void` | Mostra menu user logado |
| `showLoginButton()` | - | `void` | Mostra botao login |
| `updateVoteCount(articleId, count)` | `string, number` | `void` | Atualiza contagem voto no DOM |
| `setVoteActive(articleId, isActive)` | `string, boolean` | `void` | Marca voto ativo/inativo |
| `animateVote(articleId)` | `string` | `void` | Animacao pulse no voto |
| `refreshAllVoteStates()` | - | `void` | Atualiza todos os votos visiveis |

### `Auth` (js/auth.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `init()` | - | `void` | Inicia listener de auth state |
| `login()` | - | `Promise` | Google sign-in (popup + redirect fallback) |
| `logout()` | - | `Promise` | Sign out |
| `getCurrentUser()` | - | `User\|null` | Retorna usuario atual (sincrono) |
| `isLoggedIn()` | - | `boolean` | Verifica se ha usuario logado |
| `onAuthChange(callback)` | `function` | `void` | Registra callback para mudancas de auth |

### `VoteService` (js/votes.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `init()` | - | `void` | Inicializa referencia Firestore |
| `toggleVote(articleId)` | `string` | `Promise<{ voted, newCount }>` | Toggle voto com batch write |
| `loadUserVotes(userId)` | `string` | `Promise` | Carrega votos do usuario |
| `clearUserVotes()` | - | `void` | Limpa cache de votos do usuario |
| `getVoteCount(articleId)` | `string` | `number` | Contagem do cache local |
| `hasUserVoted(articleId)` | `string` | `boolean` | Usuario votou? (cache local) |
| `getPopularArticleIds(hours)` | `number` | `Promise<[{ articleId, count }]>` | Top artigos por votos |
| `loadVoteCountsForArticles(ids)` | `string[]` | `Promise` | Batch load de contagens |

### `ViewManager` (js/views.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `init()` | - | `void` | Verifica containers das 3 views |
| `showView(viewName)` | `'feed' \| 'analytics' \| 'sentiment'` | `void` | Alterna entre views |
| `getCurrentView()` | - | `string` | Retorna view ativa |

Views registadas:

| View Name | Container ID | onShow callback |
|-----------|-------------|-----------------|
| `feed` | `feed-view` | nenhum |
| `analytics` | `analytics-view` | `AnalyticsPage.render()` |
| `sentiment` | `sentiment-view` | `StreamGraph.render()` |

### `SentimentService` (js/sentiment.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `numericScore(article)` | `Article` | `number` | Score entre -1 e +1 baseado em keywords |
| `classify(article)` | `Article` | `string` | Retorna `'positive'`, `'neutral'` ou `'negative'` |

Listas internas: `_positiveWords` (~30 palavras PT/EN), `_negativeWords` (~30 palavras PT/EN).

Logica: `score = (positivas - negativas) / total`. Threshold: `>0.2` = positive, `<-0.2` = negative.

### `AnalyticsPage` (js/analytics.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `render(articles)` | `Article[]` | `void` | Renderiza todo o dashboard |
| `renderMostRead(all, last24h)` | `Article[], Article[]` | `void` | Top 5 noticias (score: votos + recencia + keywords) |
| `renderTopicCloud(all, last24h)` | `Article[], Article[]` | `void` | Nuvem de topicos (top 40, trending detection) |
| `renderRadar(articles)` | `Article[]` | `void` | Radar Chart.js com filtros de tempo |
| `renderLeaderboard()` | - | `void` | AI Leaderboard (CONFIG.AI_LEADERBOARD) |

Filtros do Radar: `3h`, `6h`, `12h`, `24h`, `7d`, `30d` - compara periodo atual vs anterior ("ghost").

Eixos do Radar:

| Eixo | Categorias incluidas |
|------|---------------------|
| Big Tech | bigtechs-negocios |
| Open Source | dev-opensource, garage-projects |
| Etica & Regulacao | futuro-trabalho-etica, debates-duvidas |
| Pesquisa & IA | pesquisa-papers, llms, ia-generativa |

Topic Cloud - Trending detection: compara frequencia ultimas 6h vs 6-24h. Growth rate >1.5x e >=2 mencoes = trending.

### `StreamGraph` (js/streamgraph.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `init()` | - | `void` | Cache elements, bind filtros/resize/theme observer |
| `render(articles)` | `Article[]` | `void` | Entry point: setup SVG + update |

Funcionalidades internas:
- **Agregacao temporal**: agrupa artigos em buckets (6h para 3d, 24h para 7d/30d)
- **D3.js stack**: `d3.stackOffsetSilhouette` com `d3.curveBasis`
- **Filtros**: 3 Dias, 7 Dias, 30 Dias, Personalizado (date range)
- **Hover**: destaca camada, tooltip com data/contagem/headline
- **Anotacoes inteligentes**: marca picos por sentimento com titulo do artigo mais recente
- **Collision avoidance**: ajusta posicao de anotacoes sobrepostas
- **Theme-aware**: MutationObserver no `data-theme`, re-renderiza em mudanca
- **Responsive**: ResizeObserver com debounce de 200ms
- **Stats cards**: totais e percentuais de positivo/neutro/negativo

Cores das camadas:

| Sentimento | Cor | Posicao |
|-----------|-----|---------|
| Positivo | `#BCCA24` | Topo |
| Neutro | `#32565E` | Meio |
| Negativo | `#E0442F` | Base |

### `SidebarService` (js/sidebar.js)

| Metodo | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `init()` | - | `void` | Cache elements, render submenu, bind events, restore state |
| `toggleExpanded()` | - | `void` | Expande/colapsa sidebar (desktop) |
| `toggleMobileOpen()` | - | `void` | Toggle mobile overlay |
| `openMobile()` / `closeMobile()` | - | `void` | Overlay mobile com backdrop |

Navegacao sidebar:

| Section | Acao |
|---------|------|
| `feed` | ViewManager → feed, resetar categoria |
| `executive-summary` | ViewManager → analytics |
| `market-sentiment` | ViewManager → sentiment |
| `categories` | Dropdown com subcategorias, filtra no feed |
| `settings` | Toggle tema dark/light |
| `profile` | Login/info do usuario |

---

## Modelos de Dados

### Article

```javascript
{
    id: string,              // Hash deterministico do URL (art_xxxxx)
    title: string,           // Titulo decodificado
    description: string,     // Texto limpo, max 200 chars
    url: string,             // Link original
    source: string,          // Nome do feed (ex: "TechCrunch AI")
    thumbnail: string|null,  // URL da imagem
    publishedAt: Date,       // Data de publicacao
    category: string,        // ID da categoria (ex: "llms")
    matchedKeywords: string[],// Keywords que matcharam
    recencyStatus: string    // "Newest" | "New" | "Past" (adicionado em runtime)
}
```

### User (Firebase Auth)

```javascript
{
    uid: string,
    displayName: string,
    email: string,
    photoURL: string
}
```

### Firestore: votes/{voteId}

```javascript
{
    articleId: string,
    userId: string,
    votedAt: Timestamp
}
```

### Firestore: voteCounts/{articleId}

```javascript
{
    total: number,
    lastUpdated: Timestamp
}
```

### CONFIG.AI_LEADERBOARD (item)

```javascript
{
    name: string,          // Ex: "Claude Opus 4.6"
    company: string,       // Ex: "Anthropic"
    reasoning: number,     // Score 0-10
    creativity: number,    // Score 0-10
    lastUpdated: string,   // ISO date (ex: "2026-02-05")
    icon: string           // Emoji
}
```

### CONFIG.SETTINGS

| Key | Default | Descricao |
|-----|---------|-----------|
| `refreshIntervalMs` | 900000 (15min) | Intervalo auto-refresh |
| `cacheTtlMs` | 900000 (15min) | TTL do cache |
| `maxArticlesPerFeed` | 30 | Max artigos por feed |
| `maxTotalArticles` | 400 | Max artigos total |
| `searchDebounceMs` | 300 | Debounce da busca |
| `fetchTimeoutMs` | 10000 | Timeout por fetch |
| `cacheKeyArticles` | `ainewshub_articles` | Key localStorage artigos |
| `cacheKeyTimestamp` | `ainewshub_timestamp` | Key localStorage timestamp |
| `cacheKeyTheme` | `ainewshub_theme` | Key localStorage tema |
| `cacheKeyCategory` | `ainewshub_category` | Key localStorage categoria ativa |
| `cacheKeyRecency` | `ainewshub_recency` | Key localStorage recencia ativa |
| `lazyBatchSize` | 12 | Cards por batch lazy load |
| `voteRateLimitMs` | 2000 | Rate limit votos |
| `votePopularHours` | 24 | Janela temporal para "popular" |
| `voteBatchLoadSize` | 20 | Batch size para load de votos |

---

## Firestore Security Rules

```
voteCounts/{articleId} → read: todos | write: autenticados
votes/{voteId}        → read: todos | create: autenticado + userId match | delete: dono | update: nunca
users/{userId}         → read: todos | write: apenas o proprio usuario
```

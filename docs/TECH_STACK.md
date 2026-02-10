# AI News Hub - Stack Tecnologica

> Este documento descreve as tecnologias **realmente usadas** no projeto, nao sugestoes futuras.

## Linguagens e Plataforma

| Tecnologia | Versao/Detalhe | Uso |
|-----------|----------------|-----|
| HTML5 | Semantico | Estrutura SPA (single-page) |
| CSS3 | Variaveis customizadas, Grid, Flexbox | Estilos, temas dark/light |
| JavaScript | ES5+ (vanilla, sem transpiling) | Toda a logica client-side |

**Nota**: O projeto NAO usa TypeScript, JSX, SASS/LESS, ou qualquer pre-processador.

## Bibliotecas Externas (via CDN)

| Biblioteca | Versao | CDN | Uso |
|-----------|--------|-----|-----|
| Firebase App | 10.12.0 | `gstatic.com/firebasejs/10.12.0/firebase-app-compat.js` | Core Firebase (compat mode) |
| Firebase Auth | 10.12.0 | `gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js` | Google sign-in |
| Firebase Firestore | 10.12.0 | `gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js` | Base de dados de votos |
| Chart.js | 4.x | `cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` | Radar chart no Analytics |
| chartjs-chart-treemap | 2.x | `cdn.jsdelivr.net/npm/chartjs-chart-treemap@2/dist/chartjs-chart-treemap.min.js` | Plugin treemap (disponivel mas nao usado atualmente) |
| D3.js | 7.x | `cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js` | Streamgraph de sentimento |

**Firebase compat mode**: Usado porque o projeto nao tem build tools. O SDK compat expoe `firebase` como global (ao contrario do modular SDK que requer imports).

## Build Tools

**Nenhum.** O projeto nao utiliza:
- Bundlers (Webpack, Vite, Rollup, Parcel)
- Transpilers (Babel, TypeScript compiler)
- Task runners (Gulp, Grunt)
- Package managers (npm, yarn) para dependencias de runtime

Todas as dependencias sao carregadas via `<script>` tags de CDN.

## Framework CSS

**Nenhum.** O projeto usa CSS puro com:
- Variaveis CSS customizadas (`--var-name`)
- Seletores `[data-theme="dark"]` e `[data-theme="light"]` para temas
- CSS Grid para layout de cards
- Flexbox para alinhamentos
- Media queries para responsividade
- Animacoes CSS (@keyframes) para transicoes

## Icones

**SVG inline** - Todos os icones sao SVG escritos diretamente no HTML. Nao usa:
- Icon fonts (FontAwesome, etc.)
- Sprite sheets
- Bibliotecas de icones (Lucide, Phosphor, Heroicons)

Emojis Unicode sao usados para categorias e leaderboard.

## Fontes

**System font stack** - `Inter, system-ui, sans-serif` definido no CSS. Nao carrega fontes externas (Google Fonts, etc.).

## Hosting

Qualquer servidor de ficheiros estaticos. Nao requer:
- Node.js
- PHP
- Server-side rendering
- Build step

Exemplos compativeis: GitHub Pages, Netlify, Vercel, Apache, Nginx, S3.

## APIs Externas Consumidas

| API | Tipo | Autenticacao | Status |
|-----|------|-------------|--------|
| RSS feeds publicos (13 fontes) | XML (RSS 2.0 / Atom) | Nenhuma | Ativo |
| CORS proxies publicos (3) | HTTP GET | Nenhuma | Ativo |
| Firebase Auth | OAuth 2.0 (Google) | API Key + OAuth | Desabilitado |
| Firestore | REST via SDK | API Key + Auth token | Desabilitado |
| Bluesky RSS | XML | Nenhuma | Desabilitado (CORS) |
| Nitter instances | XML | Nenhuma | Desabilitado (instavel) |
| RSSHub | XML | Nenhuma | Desabilitado (sem deploy) |

## Armazenamento Local

| Tecnologia | Uso |
|-----------|-----|
| `localStorage` | Cache de artigos, preferencias (tema, categoria, recencia, sidebar) |
| Nenhum IndexedDB | - |
| Nenhum SessionStorage | - |
| Nenhum Cookie | - |

## Browser APIs Utilizadas

| API | Uso |
|-----|-----|
| `fetch` | Requests HTTP para feeds RSS |
| `AbortController` | Timeout de requests |
| `DOMParser` | Parse de XML (RSS/Atom) |
| `IntersectionObserver` | Lazy loading de cards |
| `ResizeObserver` | Responsive streamgraph |
| `MutationObserver` | Detectar mudanca de tema para streamgraph |
| `localStorage` | Cache e preferencias |
| `document.hidden` | Auto-refresh apenas quando tab visivel |

## Compatibilidade

- **ES5+**: Usa `var`, `function`, `.forEach`, `Promise`, mas NAO usa `let`/`const`, arrow functions, template literals, ou `class`
- **Excecao**: `context.js` usa `const` e `export` (ES6) mas NAO e carregado
- **Browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Mobile**: Responsivo, sidebar com overlay mobile, touch-friendly

# Feed Health Report - AI News Hub

**Data:** 2026-02-10
**Total de fontes testadas:** 62
**Total ativas no config.js:** 43 (40 OK + 3 WARN)
**Removidas:** 19 (sem RSS funcional)

---

## 1. Feeds Ativos (40 OK)

| # | Nome | Categoria | Items | Status |
|---|------|-----------|-------|--------|
| 1 | OpenAI Blog | bigtech-negocios | 8 | OK |
| 2 | Google AI Blog | bigtech-negocios | 3 | OK |
| 3 | DeepMind Blog | bigtech-negocios | 6 | OK |
| 4 | NVIDIA Blog | bigtech-negocios | 1 | OK |
| 5 | Microsoft Research | pesquisa-papers | 1 | OK |
| 6 | TechCrunch AI | bigtech-negocios | 5 | OK |
| 7 | The Verge AI | bigtech-negocios | 2 | OK |
| 8 | Wired AI | bigtech-negocios | 5 | OK |
| 9 | Ars Technica AI | dev-opensource | 2 | OK |
| 10 | VentureBeat AI | bigtech-negocios | 1 | OK |
| 11 | Sifted EU (AI) | bigtech-negocios | 13 | OK |
| 12 | ArXiv AI | pesquisa-papers | 2 | OK |
| 13 | MIT Technology Review (AI) | pesquisa-papers | 1 | OK |
| 14 | BAIR (Berkeley) | pesquisa-papers | 1 | OK |
| 15 | The Gradient | pesquisa-papers | 1 | OK |
| 16 | Distill.pub | pesquisa-papers | 12 | OK |
| 17 | Sam Altman Blog | visao-lider | 2 | OK |
| 18 | Ben Thompson (Stratechery) | visao-lider | 3 | OK |
| 19 | Sebastian Raschka (Ahead of AI) | visao-lider | 1 | OK |
| 20 | Andrej Karpathy Blog | visao-lider | 1 | OK |
| 21 | Karpathy YouTube | visao-lider | 3 | OK |
| 22 | Fei-Fei Li | visao-lider | 1 | OK |
| 23 | Import AI (Jack Clark) | visao-lider | 1 | OK |
| 24 | One Useful Thing (Ethan Mollick) | visao-lider | 1 | OK |
| 25 | Gary Marcus | visao-lider | 1 | OK |
| 26 | Hugging Face Blog | dev-opensource | 15 | OK |
| 27 | Simon Willison's Weblog | dev-opensource | 1 | OK |
| 28 | LangChain Blog | dev-opensource | 1 | OK |
| 29 | Weights & Biases | dev-opensource | 6 | OK |
| 30 | Towards Data Science | dev-opensource | 4 | OK |
| 31 | KDnuggets | dev-opensource | 6 | OK |
| 32 | AWS Machine Learning | dev-opensource | 1 | OK |
| 33 | Luiza Jarovsky | futuro-trabalho-etica | 1 | OK |
| 34 | Center for AI Safety | futuro-trabalho-etica | 1 | OK |
| 35 | AlgorithmWatch | futuro-trabalho-etica | 1 | OK |
| 36 | AI Ethics & Policy | futuro-trabalho-etica | 1 | OK |
| 37 | AI Supremacy | futuro-trabalho-etica | 1 | OK |
| 38 | The Algorithmic Bridge | futuro-trabalho-etica | 1 | OK |
| 39 | Ben's Bites | bigtech-negocios | 1 | OK |
| 40 | Last Week in AI | bigtech-negocios | 1 | OK |

## 2. Feeds com Warning (3)

| Nome | Problema | Acao |
|------|----------|------|
| Dario Amodei | Feed XML valido mas 0 items (publica raramente) | **Manter** - funciona, apenas pouco conteudo |
| Analytics Vidhya | Feed XML valido mas 0 items na amostra | **Manter** - pode ter items via CORS proxy |
| Ada Lovelace Institute | Feed XML valido mas 0 items na amostra | **Manter** - publicacao trimestral |

## 3. URLs Corrigidas (6 fixes aplicados)

| Nome | URL Antiga (quebrada) | URL Nova (funcional) |
|------|----------------------|---------------------|
| The Verge AI | `.../ai-artificial-intelligence/rss/index.xml` | `.../rss/ai-artificial-intelligence/index.xml` |
| Sebastian Raschka | `sebastianraschka.com/rss.xml` | `magazine.sebastianraschka.com/feed` |
| Luiza Jarovsky | `luizajarovsky.com/feed` | `luizasnewsletter.com/feed` |
| Weights & Biases | `wandb.ai/.../feed.xml` | `wandb.ai/.../rss.xml` |
| Center for AI Safety | `safe.ai/blog/rss.xml` | `newsletter.safe.ai/feed` |
| Ben's Bites | `bensbites.co/feed` | `bensbites.com/feed` |

---

## 4. Feeds Removidos (19) - Plano de Implementacao

### Grupo A: Sem RSS Publico - Precisam de RSSHub (5)

Estes sites possuem blog ativo mas nao oferecem feed RSS nativo.
**Solucao:** Deploy de RSSHub self-hosted (Vercel free tier) para gerar feeds.

| Nome | URL do Blog | Rota RSSHub Necessaria | Prioridade |
|------|-------------|----------------------|------------|
| **Meta AI Blog** | `ai.meta.com/blog/` | `/custom/meta-ai` (scraper personalizado) | Alta |
| **Anthropic News** | `anthropic.com/news` | `/custom/anthropic` (scraper personalizado) | Alta |
| **Stanford HAI** | `hai.stanford.edu/news` | `/custom/stanford-hai` (scraper) | Media |
| **GovAI** | `governance.ai/blog` | `/custom/govai` (scraper) | Baixa |
| **Papers with Code** | `paperswithcode.com` | Verificar se ainda funciona | Baixa |

**Passos para implementar RSSHub:**
1. Fork do RSSHub: `https://github.com/DIYgod/RSSHub`
2. Deploy no Vercel (free tier): `https://docs.rsshub.app/deploy/vercel`
3. Configurar `CONFIG.RSSHUB_BASE_URL` no config.js
4. Criar rotas customizadas para Meta AI, Anthropic, Stanford HAI
5. Testar e adicionar ao FEEDS com URL tipo: `{RSSHUB_BASE_URL}/meta/ai/blog`

### Grupo B: Newsletters Somente Email (8)

Estas fontes sao newsletters que nao disponibilizam RSS. O publisher
precisa habilitar RSS na plataforma (Beehiiv/custom) ou precisamos de
um conversor email-to-RSS.

| Nome | Plataforma | Assinantes | Alternativa |
|------|-----------|------------|-------------|
| **The Rundown AI** | Beehiiv | 2M+ | Publisher pode habilitar RSS no painel Beehiiv |
| **TLDR AI** | Custom | 1.6M+ | Nenhuma (email-only) |
| **The Neuron** | Custom | 600K+ | Nenhuma (email-only) |
| **Superhuman AI** | Custom | 1M+ | Podcast RSS: `feeds.transistor.fm/superhuman-ai-decoding-the-future` |
| **AI Breakfast** | Beehiiv | ~100K | Publisher pode habilitar RSS no painel Beehiiv |
| **Mindstream** | Custom | ~200K | Nenhuma (email-only) |
| **Not A Bot** | Custom | 50K+ | Nenhuma (email-only) |
| **Andrew Ng (The Batch)** | Custom | 500K+ | Nenhuma (email-only, nenhum endpoint RSS encontrado) |

**Solucao possivel (avancada):**
- Usar servico "Kill the Newsletter!" (`https://kill-the-newsletter.com/`)
  para converter email newsletters em feeds Atom
- Workflow: Criar email no KtN → Assinar newsletter → Usar feed Atom gerado
- Desvantagem: depende de servico terceiro, pode quebrar

### Grupo C: RSS Descontinuado / URL Morta (3)

| Nome | Motivo | Alternativa |
|------|--------|-------------|
| **A16z AI** | Blog migrou, RSS descontinuado | Podcast: `feeds.simplecast.com/Hb_IuXOo` |
| **Everything Algorithmic** | Substack nao encontrado (handle incorreto ou deletado) | Nenhuma |
| **Generative AI News (GAIN)** | Substack nao encontrado (handle incorreto ou deletado) | Nenhuma |

### Grupo D: Bloqueio Anti-Bot (1)

| Nome | Erro | Alternativa |
|------|------|-------------|
| **Bill Gates (Gates Notes)** | 403 Forbidden em todas URLs | Feed existe (`gatesnotes.com/rss`) mas servidor bloqueia User-Agents automatizados. Pode funcionar via CORS proxy (que usa browser UA). Testar no app antes de descartar. |

### Grupo E: Sem RSS Nativo (2)

| Nome | Motivo | Alternativa |
|------|--------|-------------|
| **LlamaIndex Blog** | Sem RSS, 404 em todas as variantes | Medium archive: `medium.com/llamaindex-blog` (mas Medium retorna HTML) |
| **Pinecone Blog** | Sem RSS, 404 em todas as variantes | Nenhuma encontrada |

---

## 5. Resumo de Acoes Recomendadas

### Imediato (ja feito)
- [x] 43 feeds ativos no config.js
- [x] 6 URLs corrigidas
- [x] 19 feeds mortos removidos com comentarios explicativos

### Curto Prazo (proximas iteracoes)
- [ ] Testar Bill Gates feed via CORS proxy no browser (pode funcionar)
- [ ] Verificar se handles corretos existem para Everything Algorithmic e GAIN

### Medio Prazo (se quiser ampliar cobertura)
- [ ] Deploy RSSHub no Vercel para Meta AI + Anthropic + Stanford HAI
- [ ] Experimentar Kill the Newsletter para The Rundown AI + Andrew Ng

### Longo Prazo (opcional)
- [ ] Monitorar Beehiiv newsletters (Rundown, AI Breakfast) - publishers podem habilitar RSS
- [ ] Criar sistema de fallback que tenta CORS proxy antes de descartar feed

---

## 6. Distribuicao por Categoria (43 feeds ativos)

| Categoria | Feeds |
|-----------|-------|
| bigtech-negocios | 12 (OpenAI, Google, DeepMind, NVIDIA, TechCrunch, Verge, Wired, VentureBeat, Sifted, Ben's Bites, Last Week in AI) |
| pesquisa-papers | 7 (ArXiv, MIT TR, BAIR, Gradient, Distill, Microsoft Research) |
| visao-lider | 10 (Altman, Amodei, Thompson, Raschka, Karpathy x2, Fei-Fei Li, Import AI, Mollick, Marcus) |
| dev-opensource | 8 (HuggingFace, Willison, LangChain, W&B, TDS, KDnuggets, Ars Technica, AWS) |
| futuro-trabalho-etica | 6 (Jarovsky, CAIS, Ada Lovelace, AlgorithmWatch, AI Ethics, AI Supremacy, Algorithmic Bridge) |

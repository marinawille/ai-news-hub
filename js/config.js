/* ===================================================
   AI News Hub - Configuration
   =================================================== */

window.CONFIG = {

    // Firebase Configuration (preencher com credenciais do projeto)
    FIREBASE: {
        apiKey: 'AIzaSyD7Z_JiZcEMhtk54d89vO7I1JowtZn76DE8',
        authDomain: 'ai-news-hub-d3164.firebaseapp.com',
        projectId: 'ai-news-hub-d3164',
        storageBucket: 'ai-news-hub-d3164.firebasestorage.app',
        messagingSenderId: '9337277732286',
        appId: '1:9337277732286:web:1f81b3741ae7fe31083a7',
        measurementId: 'G-WXIwJWCLSNL'
    },

    // CORS Proxies (round-robin with fallback)
    CORS_PROXIES: [
        function(url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); },
        function(url) { return 'https://corsproxy.io/?' + encodeURIComponent(url); },
        function(url) { return 'https://api.cors.lol/?url=' + encodeURIComponent(url); }
    ],

    // RSS Feed Sources
    // Organized by category for readability. defaultCategory is a fallback;
    // keyword-based auto-categorization takes priority at runtime.
    FEEDS: [
        // ── Big Tech & Negocios ──────────────────────────
        {
            name: 'OpenAI Blog',
            url: 'https://openai.com/news/rss.xml',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        {
            name: 'Google AI Blog',
            url: 'https://blog.google/technology/ai/rss/',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        {
            name: 'DeepMind Blog',
            url: 'https://deepmind.google/blog/rss.xml',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        // Meta AI Blog - removido (sem RSS publico, precisa RSSHub)
        // Anthropic News - removido (sem RSS publico, precisa RSSHub)
        {
            name: 'NVIDIA Blog',
            url: 'https://blogs.nvidia.com/feed/',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        {
            name: 'Microsoft Research',
            url: 'https://www.microsoft.com/en-us/research/feed/',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        // A16z AI - removido (RSS descontinuado, migraram para Substack/podcast)

        // ── Jornalismo Tech ──────────────────────────────
        {
            name: 'TechCrunch AI',
            url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        {
            name: 'The Verge AI',
            url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        {
            name: 'Wired AI',
            url: 'https://www.wired.com/feed/tag/ai/latest/rss',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        {
            name: 'Ars Technica AI',
            url: 'https://arstechnica.com/tag/ai/feed/',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        {
            name: 'VentureBeat AI',
            url: 'https://venturebeat.com/category/ai/feed/',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        {
            name: 'Sifted EU (AI)',
            url: 'https://sifted.eu/sector/ai/feed/',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },

        // ── Pesquisa & Papers ────────────────────────────
        {
            name: 'ArXiv AI',
            url: 'https://rss.arxiv.org/rss/cs.AI',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        {
            name: 'MIT Technology Review (AI)',
            url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        {
            name: 'BAIR (Berkeley AI Research)',
            url: 'https://bair.berkeley.edu/blog/feed.xml',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        // Stanford HAI - removido (retorna HTML, sem RSS funcional)
        {
            name: 'The Gradient',
            url: 'https://thegradient.pub/rss/',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        {
            name: 'Distill.pub',
            url: 'https://distill.pub/rss.xml',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        // Papers with Code - removido (RSS morto, retorna HTML)

        // ── Visao de Lider ───────────────────────────────
        {
            name: 'Sam Altman Blog',
            url: 'https://blog.samaltman.com/posts.atom',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        {
            name: 'Dario Amodei',
            url: 'https://darioamodei.substack.com/feed',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        // Bill Gates (Gates Notes) - removido (403 Forbidden, bloqueia bots)
        {
            name: 'Ben Thompson (Stratechery)',
            url: 'https://stratechery.com/feed/',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        {
            name: 'Sebastian Raschka (Ahead of AI)',
            url: 'https://magazine.sebastianraschka.com/feed',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        {
            name: 'Andrej Karpathy Blog',
            url: 'https://karpathy.bearblog.dev/feed/',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        {
            name: 'Karpathy YouTube',
            url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        // Andrew Ng (The Batch) - removido (somente newsletter por email)
        {
            name: 'Fei-Fei Li',
            url: 'https://drfeifei.substack.com/feed',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        {
            name: 'Import AI (Jack Clark)',
            url: 'https://importai.substack.com/feed',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        {
            name: 'One Useful Thing (Ethan Mollick)',
            url: 'https://www.oneusefulthing.org/feed',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },
        {
            name: 'Gary Marcus',
            url: 'https://garymarcus.substack.com/feed',
            type: 'rss',
            defaultCategory: 'visao-lider',
            language: 'en'
        },

        // ── Dev & Open Source ────────────────────────────
        {
            name: 'Hugging Face Blog',
            url: 'https://huggingface.co/blog/feed.xml',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        {
            name: 'Simon Willison\'s Weblog',
            url: 'https://simonwillison.net/atom/entries/',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        {
            name: 'LangChain Blog',
            url: 'https://blog.langchain.dev/rss/',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        // LlamaIndex Blog - removido (sem RSS publico, 404 em todas as variantes)
        // Pinecone Blog - removido (sem RSS publico, 404 em todas as variantes)
        {
            name: 'Weights & Biases',
            url: 'https://wandb.ai/fully-connected/rss.xml',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        {
            name: 'Towards Data Science',
            url: 'https://towardsdatascience.com/feed',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        {
            name: 'KDnuggets',
            url: 'https://www.kdnuggets.com/feed',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        {
            name: 'Analytics Vidhya',
            url: 'https://www.analyticsvidhya.com/blog/feed/',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        {
            name: 'AWS Machine Learning',
            url: 'https://aws.amazon.com/blogs/machine-learning/feed/',
            type: 'rss',
            defaultCategory: 'dev-opensource',
            language: 'en'
        },
        // Generative AI News (GAIN) - removido (Substack nao encontrado)

        // ── Futuro, Trabalho & Etica ─────────────────────
        {
            name: 'Luiza Jarovsky',
            url: 'https://www.luizasnewsletter.com/feed',
            type: 'rss',
            defaultCategory: 'futuro-trabalho-etica',
            language: 'en'
        },
        {
            name: 'Center for AI Safety',
            url: 'https://newsletter.safe.ai/feed',
            type: 'rss',
            defaultCategory: 'futuro-trabalho-etica',
            language: 'en'
        },
        {
            name: 'Ada Lovelace Institute',
            url: 'https://www.adalovelaceinstitute.org/feed/',
            type: 'rss',
            defaultCategory: 'futuro-trabalho-etica',
            language: 'en'
        },
        {
            name: 'AlgorithmWatch',
            url: 'https://algorithmwatch.org/en/feed/',
            type: 'rss',
            defaultCategory: 'futuro-trabalho-etica',
            language: 'en'
        },
        // GovAI - removido (retorna HTML, sem RSS funcional)
        {
            name: 'AI Ethics & Policy',
            url: 'https://aiethics.substack.com/feed',
            type: 'rss',
            defaultCategory: 'futuro-trabalho-etica',
            language: 'en'
        },
        {
            name: 'AI Supremacy',
            url: 'https://aisupremacy.substack.com/feed',
            type: 'rss',
            defaultCategory: 'futuro-trabalho-etica',
            language: 'en'
        },
        {
            name: 'The Algorithmic Bridge',
            url: 'https://thealgorithmicbridge.substack.com/feed',
            type: 'rss',
            defaultCategory: 'futuro-trabalho-etica',
            language: 'en'
        },
        // Everything Algorithmic - removido (Substack nao encontrado)

        // ── Newsletters & Agregadores AI ─────────────────
        {
            name: 'Ben\'s Bites',
            url: 'https://www.bensbites.com/feed',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        },
        {
            name: 'Last Week in AI',
            url: 'https://www.lastweekinai.com/feed',
            type: 'rss',
            defaultCategory: 'bigtech-negocios',
            language: 'en'
        }
        // The Rundown AI - removido (beehiiv RSS nao habilitado pelo publisher)
        // TLDR AI - removido (somente newsletter por email)
        // The Neuron - removido (somente newsletter por email)
        // Superhuman AI - removido (somente newsletter por email, retorna HTML)
        // AI Breakfast - removido (beehiiv RSS nao habilitado)
        // Mindstream - removido (somente newsletter por email)
        // Not A Bot - removido (somente newsletter por email)
    ],

    // -----------------------------------------------
    // Social Media Feeds - Cascata: RSSHub -> Bluesky -> Nitter
    // O sistema tenta cada fonte em ordem. A primeira que funcionar vence.
    //
    // Para self-host RSSHub no Vercel (gratis): https://docs.rsshub.app/deploy
    // Bluesky RSS e nativo e gratuito (nao precisa de nada)
    // Nitter: instancias publicas instáveis (fallback de ultimo recurso)
    // -----------------------------------------------

    // Ordem de tentativa para feeds sociais
    SOCIAL_CASCADE_STRATEGY: ['bluesky', 'rsshub', 'nitter'],

    // URL base do RSSHub self-hosted (Vercel free tier)
    // Coloque aqui a URL do seu deploy do RSSHub.
    // Se nao tiver, o sistema pula para Bluesky/Nitter automaticamente.
    RSSHUB_BASE_URL: '',

    // Instancias Nitter para fallback (tentadas em ordem)
    NITTER_INSTANCES: [
        'https://nitter.privacydev.net',
        'https://nitter.poast.org',
        'https://nitter.woodland.cafe'
    ],

    // Contas de redes sociais com handles para cada plataforma
    // twitterHandle: usado no RSSHub e Nitter
    // blueskyHandle: usado no Bluesky RSS (null = pular Bluesky para esta conta)
    // Todas as contas sociais removidas - CORS proxies nao conseguem acessar Bluesky/Nitter/RSSHub
    // Lista completa salva em: fontesdeletadas
    SOCIAL_ACCOUNTS: [],

    // DEPRECATED - mantido para compatibilidade. Use SOCIAL_ACCOUNTS.
    TWITTER_RSS_BRIDGE: 'rsshub',
    TWITTER_RSS_CUSTOM_FN: null,
    TWITTER_ACCOUNTS: [],

    // Categories (order matters for tab display; 'all' is always first)
    // Canonical list: Pesquisa e Papers, Big Tech & Negocios, Dev & Open Source,
    // Futuro Trabalho & Etica, Visao de Lider
    CATEGORIES: [
        {
            id: 'all',
            label: 'Tudo',
            icon: '\uD83D\uDCF0',
            keywords: []
        },
        {
            id: 'pesquisa-papers',
            label: '#Pesquisa e Papers',
            icon: '\uD83D\uDD2C',
            keywords: [
                'arxiv', 'paper', 'research', 'pesquisa', 'study', 'estudo',
                'algorithm', 'algoritmo', 'benchmark', 'dataset', 'preprint',
                'conference', 'neurips', 'icml', 'iclr', 'cvpr', 'aaai',
                'acl', 'emnlp', 'breakthrough', 'novel approach',
                'state-of-the-art', 'sota', 'findings', 'experiment',
                'evaluation', 'methodology', 'transformer', 'attention mechanism',
                'embedding', 'fine-tun', 'rlhf', 'dpo', 'diffusion',
                'multimodal', 'chain-of-thought', 'reasoning'
            ]
        },
        {
            id: 'bigtech-negocios',
            label: '#Big Tech & Neg\u00f3cios',
            icon: '\uD83C\uDFE2',
            keywords: [
                'openai', 'google', 'microsoft', 'meta', 'apple', 'amazon',
                'anthropic', 'nvidia', 'samsung', 'ibm', 'oracle', 'salesforce',
                'company', 'empresa', 'business', 'neg\u00f3cio', 'funding',
                'investimento', 'investment', 'acquisition', 'aquisi\u00e7\u00e3o',
                'merger', 'ipo', 'valuation', 'revenue', 'receita', 'profit',
                'billion', 'million', 'ceo', 'hire', 'partnership',
                'parceria', 'deal', 'market', 'mercado', 'competition',
                'deepmind', 'xai', 'mistral', 'chatgpt', 'copilot',
                'gpt', 'gpt-4', 'gpt-5', 'claude', 'gemini', 'llama',
                'llm', 'language model', 'large language',
                'grok', 'perplexity', 'deepseek',
                'image', 'video', 'sora', 'dall-e', 'midjourney',
                'stable diffusion', 'runway', 'elevenlabs'
            ]
        },
        {
            id: 'dev-opensource',
            label: '#Dev & Open Source',
            icon: '\uD83D\uDCBB',
            keywords: [
                'open source', 'github', 'hugging face', 'huggingface',
                'developer', 'sdk', 'library',
                'api', 'framework', 'repository', 'repo', 'commit', 'pull request',
                'code', 'c\u00f3digo', 'programming', 'programa\u00e7\u00e3o',
                'tool', 'ferramenta', 'plugin', 'extension',
                'python', 'javascript', 'rust', 'docker', 'kubernetes',
                'deploy', 'devops', 'mlops', 'pipeline', 'model weights',
                'fine-tune', 'self-host', 'local model', 'ollama', 'vllm',
                'langchain', 'llamaindex', 'gradio', 'streamlit',
                'indie', 'side project', 'maker', 'builder', 'hackathon',
                'prototype', 'prot\u00f3tipo', 'diy', 'bootstrapped',
                'generative art', 'ai art', 'creative', 'criativ'
            ]
        },
        {
            id: 'futuro-trabalho-etica',
            label: '#Futuro, Trabalho & \u00c9tica',
            icon: '\u2696\uFE0F',
            keywords: [
                'regula\u00e7\u00e3o', 'regulation', 'regulat', 'ethics', '\u00e9tica', 'bias',
                'fairness', 'policy', 'legislation', 'lei', 'law', 'lawsuit',
                'ban', 'safety', 'seguran\u00e7a', 'alignment', 'risk', 'risco',
                'copyright', 'privacy', 'privacidade', 'gdpr', 'eu ai act',
                'govern', 'senate', 'congress', 'tribunal', 'court',
                'deepfake', 'misinformation', 'harmful', 'responsible ai',
                'trustworthy', 'accountability', 'job', 'emprego', 'trabalho',
                'career', 'carreira', 'profiss', 'automation', 'automa\u00e7\u00e3o',
                'replace', 'substituir', 'workforce', 'unemployment', 'desemprego',
                'economy', 'economia', 'impact', 'impacto', 'future of work',
                'layoff', 'upskill', 'reskill',
                'debate', 'discuss\u00e3o', 'opinion', 'opini\u00e3o',
                'controversy', 'controv\u00e9rsia'
            ]
        },
        {
            id: 'visao-lider',
            label: '#Vis\u00e3o de L\u00edder',
            icon: '\uD83C\uDF1F',
            keywords: [
                'sam altman', 'satya nadella', 'sundar pichai',
                'mark zuckerberg', 'elon musk', 'dario amodei', 'jensen huang',
                'andrej karpathy', 'andrew ng', 'fei-fei li', 'yann lecun',
                'demis hassabis', 'ilya sutskever', 'gary marcus',
                'ethan mollick', 'sebastian raschka', 'jack clark',
                'bill gates', 'ben thompson',
                'interview', 'entrevista', 'vision', 'vis\u00e3o',
                'prediction', 'previs\u00e3o', 'opinion', 'opini\u00e3o',
                'thought leader', 'keynote', 'fireside chat',
                'podcast', 'letter', 'carta', 'essay', 'ensaio',
                'manifesto', 'outlook', 'perspective', 'perspectiva'
            ]
        }
    ],

    // AI Leaderboard - Top 5 models
    AI_LEADERBOARD: [
        {
            name: 'Claude Opus 4.6',
            company: 'Anthropic',
            reasoning: 9.5,
            creativity: 9.3,
            lastUpdated: '2026-02-05',
            icon: '\uD83E\uDDE0'
        },
        {
            name: 'GPT-5',
            company: 'OpenAI',
            reasoning: 9.3,
            creativity: 9.0,
            lastUpdated: '2026-01-15',
            icon: '\uD83D\uDCAC'
        },
        {
            name: 'Gemini 2.5 Ultra',
            company: 'Google',
            reasoning: 9.2,
            creativity: 8.8,
            lastUpdated: '2026-02-07',
            icon: '\u2728'
        },
        {
            name: 'DeepSeek R2',
            company: 'DeepSeek',
            reasoning: 9.0,
            creativity: 8.5,
            lastUpdated: '2026-02-03',
            icon: '\uD83D\uDD2C'
        },
        {
            name: 'Llama 4 Maverick',
            company: 'Meta',
            reasoning: 8.7,
            creativity: 8.6,
            lastUpdated: '2026-01-20',
            icon: '\uD83E\uDD99'
        }
    ],

    // Application Settings
    SETTINGS: {
        refreshIntervalMs: 15 * 60 * 1000,  // 15 minutes
        cacheTtlMs: 15 * 60 * 1000,          // 15 minutes
        maxArticlesPerFeed: 15,
        maxTotalArticles: 400,
        searchDebounceMs: 300,
        fetchTimeoutMs: 3000,                // 3 seconds per fetch
        feedConcurrency: 10,                 // max simultaneous feed fetches
        cacheKeyArticles: 'ainewshub_articles',
        cacheKeyTimestamp: 'ainewshub_timestamp',
        cacheKeyTheme: 'ainewshub_theme',
        cacheKeyCategory: 'ainewshub_category',
        cacheKeyRecency: 'ainewshub_recency',
        lazyBatchSize: 12,

        // Vote settings
        voteRateLimitMs: 2000,
        votePopularHours: 24,
        voteBatchLoadSize: 20
    }
};

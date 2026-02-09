/* ===================================================
   AI News Hub - Configuration
   =================================================== */

window.CONFIG = {

    // CORS Proxies (round-robin with fallback)
    CORS_PROXIES: [
        function(url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); },
        function(url) { return 'https://corsproxy.io/?' + encodeURIComponent(url); },
        function(url) { return 'https://api.cors.lol/?url=' + encodeURIComponent(url); }
    ],

    // RSS Feed Sources
    FEEDS: [
        {
            name: 'OpenAI Blog',
            url: 'https://openai.com/blog/rss/',
            type: 'rss',
            defaultCategory: 'modelos-linguagem',
            language: 'en'
        },
        {
            name: 'TechCrunch AI',
            url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
            type: 'rss',
            defaultCategory: 'empresas-negocios',
            language: 'en'
        },
        {
            name: 'The Verge AI',
            url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
            type: 'rss',
            defaultCategory: 'empresas-negocios',
            language: 'en'
        },
        {
            name: 'MIT Technology Review',
            url: 'https://www.technologyreview.com/feed/',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        {
            name: 'ArXiv AI',
            url: 'https://rss.arxiv.org/rss/cs.AI',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        {
            name: 'Wired AI',
            url: 'https://www.wired.com/feed/tag/ai/latest/rss',
            type: 'rss',
            defaultCategory: 'ferramentas-produtos',
            language: 'en'
        },
        {
            name: 'Ars Technica',
            url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
            type: 'rss',
            defaultCategory: 'ferramentas-produtos',
            language: 'en'
        },
        {
            name: 'Google AI Blog',
            url: 'https://blog.google/technology/ai/rss/',
            type: 'rss',
            defaultCategory: 'pesquisa-papers',
            language: 'en'
        },
        {
            name: 'Anthropic',
            url: 'https://www.anthropic.com/rss.xml',
            type: 'rss',
            defaultCategory: 'modelos-linguagem',
            language: 'en'
        }
    ],

    // Categories (order matters for tab display; 'all' is always first)
    CATEGORIES: [
        {
            id: 'all',
            label: 'Todas as Noticias',
            icon: '\uD83D\uDCF0',
            keywords: []
        },
        {
            id: 'modelos-linguagem',
            label: 'Modelos de Linguagem',
            icon: '\uD83E\uDDE0',
            keywords: [
                'gpt', 'gpt-4', 'gpt-5', 'chatgpt', 'claude', 'gemini', 'llama',
                'mistral', 'llm', 'language model', 'modelo de linguagem',
                'large language', 'chatbot', 'copilot', 'prompt', 'token',
                'context window', 'inference', 'reasoning', 'chain-of-thought',
                'rag', 'retrieval augmented', 'embedding', 'phi-', 'qwen',
                'deepseek', 'openai o1', 'openai o3', 'grok', 'perplexity',
                'natural language', 'text generation', 'conversation', 'dialogue',
                'fine-tun', 'instruction tun', 'rlhf', 'dpo'
            ]
        },
        {
            id: 'visao-computacional',
            label: 'Visao Computacional',
            icon: '\uD83D\uDC41\uFE0F',
            keywords: [
                'image', 'imagem', 'vision', 'visao', 'visual', 'video',
                'diffusion', 'stable diffusion', 'midjourney', 'dall-e', 'dalle',
                'sora', 'imagen', 'flux', 'generate image', 'gerar imagem',
                'object detection', 'segmentation', 'recognition', 'ocr',
                'multimodal', 'text-to-image', 'image-to', 'video generation',
                'computer vision', 'convolutional', 'cnn', 'vit',
                'generative art', 'ai art', 'photorealistic',
                'runway', 'pika', 'kling', 'luma'
            ]
        },
        {
            id: 'pesquisa-papers',
            label: 'Pesquisa & Papers',
            icon: '\uD83D\uDD2C',
            keywords: [
                'arxiv', 'paper', 'research', 'pesquisa', 'study', 'estudo',
                'algorithm', 'algoritmo', 'benchmark', 'dataset', 'preprint',
                'conference', 'neurips', 'icml', 'iclr', 'cvpr', 'aaai',
                'acl', 'emnlp', 'breakthrough', 'novel approach',
                'state-of-the-art', 'sota', 'findings', 'experiment',
                'evaluation', 'methodology', 'transformer', 'attention mechanism'
            ]
        },
        {
            id: 'empresas-negocios',
            label: 'Empresas & Negocios',
            icon: '\uD83D\uDCBC',
            keywords: [
                'openai', 'google', 'microsoft', 'meta', 'apple', 'amazon',
                'anthropic', 'nvidia', 'samsung', 'ibm', 'oracle', 'salesforce',
                'company', 'empresa', 'business', 'negocio', 'funding',
                'investimento', 'investment', 'acquisition', 'aquisicao',
                'merger', 'ipo', 'valuation', 'revenue', 'receita', 'profit',
                'billion', 'million', 'ceo', 'hire', 'layoff', 'partnership',
                'parceria', 'deal', 'market', 'mercado', 'competition',
                'sam altman', 'sundar pichai', 'satya nadella',
                'mark zuckerberg', 'elon musk', 'dario amodei', 'jensen huang'
            ]
        },
        {
            id: 'ferramentas-produtos',
            label: 'Ferramentas & Produtos',
            icon: '\uD83D\uDEE0\uFE0F',
            keywords: [
                'tool', 'ferramenta', 'product', 'produto', 'launch', 'lancar',
                'release', 'lancamento', 'update', 'atualizacao', 'feature',
                'funcionalidade', 'app', 'plugin', 'extension', 'api',
                'platform', 'plataforma', 'service', 'servico', 'startup',
                'open source', 'github', 'hugging face', 'huggingface',
                'automation', 'workflow', 'no-code', 'low-code', 'saas',
                'developer', 'sdk', 'library'
            ]
        },
        {
            id: 'etica-regulacao',
            label: 'Etica & Regulacao',
            icon: '\u2696\uFE0F',
            keywords: [
                'regulacao', 'regulation', 'regulat', 'ethics', 'etica', 'bias',
                'fairness', 'policy', 'legislation', 'lei', 'law', 'lawsuit',
                'ban', 'safety', 'seguranca', 'alignment', 'risk', 'risco',
                'copyright', 'privacy', 'privacidade', 'gdpr', 'eu ai act',
                'govern', 'senate', 'congress', 'tribunal', 'court',
                'deepfake', 'misinformation', 'harmful', 'responsible ai',
                'trustworthy', 'accountability'
            ]
        },
        {
            id: 'robotica-hardware',
            label: 'Robotica & Hardware',
            icon: '\uD83E\uDD16',
            keywords: [
                'robot', 'robo', 'robotica', 'chip', 'gpu', 'tpu', 'npu',
                'nvidia', 'amd', 'intel', 'qualcomm', 'hardware', 'sensor',
                'drone', 'autonomous', 'autonomo', 'self-driving',
                'humanoid', 'boston dynamics', 'figure', 'optimus',
                'semiconductor', 'processor', 'processador', 'accelerator',
                'edge ai', 'on-device', 'blackwell', 'hopper',
                'data center', 'supercomputer', 'quantum', 'quantico'
            ]
        }
    ],

    // Application Settings
    SETTINGS: {
        refreshIntervalMs: 15 * 60 * 1000,  // 15 minutes
        cacheTtlMs: 15 * 60 * 1000,          // 15 minutes
        maxArticlesPerFeed: 30,
        maxTotalArticles: 200,
        searchDebounceMs: 300,
        fetchTimeoutMs: 10000,               // 10 seconds per fetch
        cacheKeyArticles: 'ainewshub_articles',
        cacheKeyTimestamp: 'ainewshub_timestamp',
        cacheKeyTheme: 'ainewshub_theme'
    }
};

/* ===================================================
   AI News Hub - Analytics Dashboard
   Executive summary page with Topic Cloud,
   Momentum Radar, and AI Leaderboard
   =================================================== */

window.AnalyticsPage = {

    _charts: {},
    _state: {
        radarTimeFilter: '24h',
        articles: [],
        rendered: false
    },

    // Company/topic extraction keywords
    _companyKeywords: {
        'OpenAI':     ['openai', 'chatgpt', 'gpt-4', 'gpt-5', 'gpt4', 'gpt5', 'dall-e', 'sora', 'sam altman'],
        'Google':     ['google', 'gemini', 'deepmind', 'bard', 'google ai', 'imagen'],
        'Meta':       ['meta', 'llama', 'facebook', 'instagram ai', 'meta ai', 'zuckerberg'],
        'Anthropic':  ['anthropic', 'claude', 'claude opus', 'claude sonnet', 'claude haiku'],
        'Microsoft':  ['microsoft', 'copilot', 'azure ai', 'bing ai', 'github copilot'],
        'Apple':      ['apple', 'apple intelligence', 'siri', 'apple ai'],
        'NVIDIA':     ['nvidia', 'cuda', 'gpu ai', 'jensen'],
        'Amazon':     ['amazon', 'aws', 'bedrock', 'alexa ai'],
        'Mistral':    ['mistral', 'mistral ai', 'mixtral'],
        'DeepSeek':   ['deepseek', 'deepseek r1', 'deepseek r2'],
        'xAI':        ['xai', 'grok', 'elon musk ai'],
        'Hugging Face': ['hugging face', 'huggingface', 'transformers library'],
        'Stability AI': ['stability ai', 'stable diffusion', 'stability'],
        'Cohere':     ['cohere', 'command r'],
        'Perplexity': ['perplexity']
    },

    // Sentiment keyword lists
    _positiveWords: [
        'avanço', 'breakthrough', 'inovação', 'innovation', 'lançamento', 'launch',
        'release', 'sucesso', 'success', 'melhoria', 'improvement', 'growth',
        'crescimento', 'progress', 'progresso', 'achievement', 'conquista',
        'record', 'recorde', 'milestone', 'partnership', 'parceria',
        'funding', 'investimento', 'upgrade', 'faster', 'better', 'leading',
        'state-of-the-art', 'outperform', 'surpass', 'open source', 'free',
        'powerful', 'efficient', 'impressive', 'promising', 'optimistic'
    ],

    _negativeWords: [
        'crise', 'crisis', 'regulação', 'regulation', 'ban', 'proibição',
        'falha', 'failure', 'erro', 'error', 'risco', 'risk', 'threat',
        'ameaça', 'preocupação', 'concern', 'demissão', 'layoff', 'corte',
        'cut', 'critic', 'crítica', 'controversy', 'controvérsia', 'lawsuit',
        'sued', 'fine', 'multa', 'delay', 'atraso', 'problem', 'problema',
        'warning', 'alerta', 'dangerous', 'perigoso', 'bias', 'hack',
        'breach', 'leak', 'vulnerability', 'shutdown', 'decline'
    ],

    // Stopwords for topic cloud
    _stopwords: [
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was',
        'were', 'been', 'being', 'have', 'has', 'had', 'does', 'did', 'will',
        'would', 'could', 'should', 'may', 'might', 'can', 'not', 'but',
        'its', 'you', 'your', 'our', 'their', 'than', 'then', 'also',
        'into', 'about', 'more', 'some', 'just', 'how', 'why', 'what',
        'when', 'who', 'which', 'where', 'after', 'before', 'each',
        'que', 'para', 'com', 'uma', 'por', 'dos', 'das', 'nos', 'nas',
        'sua', 'seu', 'como', 'mais', 'isso', 'esta', 'esse', 'pela',
        'pelo', 'entre', 'sobre', 'ainda', 'pode', 'deve', 'tem', 'são',
        'novo', 'nova', 'new', 'says', 'said', 'will', 'now', 'get',
        'use', 'using', 'used', 'could', 'like', 'make', 'first', 'over',
        'most', 'other', 'all', 'very', 'been', 'many', 'these', 'those'
    ],

    // ==========================================
    // Main Render
    // ==========================================

    render: function (articles) {
        if (!articles || articles.length === 0) {
            this._renderEmpty();
            return;
        }

        this._state.articles = articles;

        // Filter to last 24h for main dashboard
        var now = Date.now();
        var last24h = articles.filter(function (a) {
            return (now - a.publishedAt.getTime()) < 24 * 60 * 60 * 1000;
        });

        this.renderMostRead(articles, last24h);
        this.renderTopicCloud(articles, last24h);
        this.renderRadar(articles);
        this.renderLeaderboard();

        this._state.rendered = true;
    },

    _renderEmpty: function () {
        var container = document.getElementById('analytics-most-read');
        if (container) {
            container.innerHTML = '<div class="analytics-empty">' +
                '<p>Carregando dados para o dashboard...</p>' +
                '</div>';
        }
    },

    // ==========================================
    // Section A: Most Read News (24h)
    // ==========================================

    renderMostRead: function (allArticles, last24h) {
        var container = document.getElementById('analytics-most-read');
        if (!container) return;

        var self = this;
        var articlesToShow = last24h.length > 0 ? last24h : allArticles;

        // Try vote-based ranking first
        var voteCounts = (window.VoteService && VoteService._voteCounts) ? VoteService._voteCounts : {};
        var hasVotes = Object.keys(voteCounts).length > 0;

        // Score articles: votes + recency
        var scored = articlesToShow.map(function (a) {
            var voteScore = (voteCounts[a.id] || 0) * 100;
            var recencyMs = Date.now() - a.publishedAt.getTime();
            var recencyScore = Math.max(0, 100 - (recencyMs / (60 * 60 * 1000)));
            var keywordScore = (a.matchedKeywords ? a.matchedKeywords.length : 0) * 10;
            return {
                article: a,
                votes: voteCounts[a.id] || 0,
                score: voteScore + recencyScore + keywordScore
            };
        });

        scored.sort(function (a, b) { return b.score - a.score; });
        var top = scored.slice(0, 5);

        var html = '<div class="analytics-section-header">' +
            '<h2 class="analytics-section-title">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' +
            ' Mais Lidas (24h)</h2>' +
            '</div>';

        html += '<ol class="most-read-list">';

        for (var i = 0; i < top.length; i++) {
            var a = top[i].article;
            var title = a.title.length > 85 ? a.title.substring(0, 85) + '...' : a.title;

            html += '<li class="most-read-item">' +
                '<span class="most-read-rank">' + (i + 1) + '</span>' +
                '<a href="' + self._escapeAttr(a.url) + '" target="_blank" rel="noopener" class="most-read-title">' +
                    self._escapeHtml(title) + '</a>' +
                '<span class="most-read-source">' + self._escapeHtml(a.source) + '</span>' +
            '</li>';
        }

        html += '</ol>';
        container.innerHTML = html;
    },

    // ==========================================
    // Section B: Topic Cloud
    // ==========================================

    renderTopicCloud: function (allArticles, last24h) {
        var container = document.getElementById('analytics-topic-cloud');
        if (!container) return;

        var self = this;
        var now = Date.now();

        // Extract keywords from all articles in last 24h
        var recentArticles = last24h.length > 0 ? last24h : allArticles;
        var keywordMap = this._extractKeywords(recentArticles);

        // Detect trending (compare last 6h vs 6-24h)
        var last6h = allArticles.filter(function (a) {
            return (now - a.publishedAt.getTime()) < 6 * 60 * 60 * 1000;
        });
        var prev18h = allArticles.filter(function (a) {
            var age = now - a.publishedAt.getTime();
            return age >= 6 * 60 * 60 * 1000 && age < 24 * 60 * 60 * 1000;
        });

        var recentKw = this._extractKeywords(last6h);
        var olderKw = this._extractKeywords(prev18h);
        var trending = {};

        Object.keys(recentKw).forEach(function (kw) {
            var recent = recentKw[kw];
            var older = olderKw[kw] || 0;
            var growthRate = older > 0 ? recent / older : recent;
            if (growthRate > 1.5 && recent >= 2) {
                trending[kw] = true;
            }
        });

        // Sort by frequency, take top 40
        var sorted = Object.keys(keywordMap)
            .map(function (k) { return { word: k, count: keywordMap[k] }; })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 40);

        if (sorted.length === 0) {
            container.innerHTML = '<div class="analytics-section-header">' +
                '<h2 class="analytics-section-title">' +
                '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' +
                ' Nuvem de Topicos</h2></div>' +
                '<p class="analytics-empty">Nenhuma palavra-chave encontrada.</p>';
            return;
        }

        var maxCount = sorted[0].count;
        var minCount = sorted[sorted.length - 1].count;
        var minSize = 13;
        var maxSize = 36;

        var html = '<div class="analytics-section-header">' +
            '<h2 class="analytics-section-title">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
            ' Nuvem de Topicos</h2>' +
            '<span class="analytics-section-note">Clique para filtrar</span>' +
            '</div>';

        html += '<div class="topic-cloud">';

        for (var i = 0; i < sorted.length; i++) {
            var item = sorted[i];
            var ratio = maxCount > minCount
                ? (item.count - minCount) / (maxCount - minCount)
                : 0.5;
            var fontSize = Math.round(minSize + ratio * (maxSize - minSize));
            var opacity = 0.6 + ratio * 0.4;
            var isTrending = trending[item.word] || false;

            html += '<button class="topic-keyword' + (isTrending ? ' trending' : '') + '" ' +
                'style="font-size:' + fontSize + 'px;opacity:' + opacity.toFixed(2) + '" ' +
                'data-keyword="' + self._escapeAttr(item.word) + '" ' +
                'title="' + item.count + ' mencoes' + (isTrending ? ' - Em alta!' : '') + '">' +
                '#' + self._escapeHtml(item.word) +
                '</button>';
        }

        html += '</div>';
        container.innerHTML = html;

        // Bind click events
        container.querySelectorAll('.topic-keyword').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var keyword = btn.getAttribute('data-keyword');
                if (keyword && window.App) {
                    App.filterBySearch(keyword);
                    var searchInput = document.getElementById('search-input');
                    if (searchInput) searchInput.value = keyword;
                    if (window.ViewManager) ViewManager.showView('feed');
                }
            });
        });
    },

    _extractKeywords: function (articles) {
        var keywordMap = {};
        var self = this;

        articles.forEach(function (a) {
            // From matchedKeywords
            if (a.matchedKeywords && a.matchedKeywords.length > 0) {
                a.matchedKeywords.forEach(function (kw) {
                    var normalized = kw.toLowerCase().trim();
                    if (normalized.length >= 3) {
                        keywordMap[normalized] = (keywordMap[normalized] || 0) + 1;
                    }
                });
            }

            // From title words
            var words = (a.title || '').toLowerCase()
                .replace(/[^\w\sáàãâéèêíìîóòõôúùûçñ-]/g, ' ')
                .split(/\s+/);

            words.forEach(function (w) {
                w = w.trim();
                if (w.length >= 4 && self._stopwords.indexOf(w) === -1) {
                    keywordMap[w] = (keywordMap[w] || 0) + 1;
                }
            });
        });

        // Filter out keywords that appear only once
        var filtered = {};
        Object.keys(keywordMap).forEach(function (k) {
            if (keywordMap[k] >= 2) {
                filtered[k] = keywordMap[k];
            }
        });

        return filtered;
    },

    // ==========================================
    // Section C: Momentum Radar
    // ==========================================

    renderRadar: function (articles) {
        var container = document.getElementById('analytics-radar');
        if (!container) return;

        var self = this;

        var html = '<div class="analytics-section-header">' +
            '<h2 class="analytics-section-title">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="12 2 15.09 9.26 22 9.27 17.18 14.14 18.18 21.02 12 17.77 5.82 21.02 6.82 14.14 2 9.27 8.91 9.26 12 2" fill="none"/></svg>' +
            ' Radar de Momentum</h2></div>';

        // Time filter buttons
        var filters = [
            { id: '3h', label: '3h' },
            { id: '6h', label: '6h' },
            { id: '12h', label: '12h' },
            { id: '24h', label: '24h' },
            { id: '7d', label: '7 dias' },
            { id: '30d', label: '30 dias' }
        ];

        html += '<div class="radar-filters">';
        for (var i = 0; i < filters.length; i++) {
            var f = filters[i];
            var active = f.id === this._state.radarTimeFilter ? ' active' : '';
            html += '<button class="radar-filter-btn' + active + '" data-filter="' + f.id + '">' +
                f.label + '</button>';
        }
        html += '</div>';

        html += '<div class="radar-chart-container"><canvas id="radar-canvas"></canvas></div>';

        container.innerHTML = html;

        // Bind filter buttons
        container.querySelectorAll('.radar-filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                container.querySelectorAll('.radar-filter-btn').forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                self._state.radarTimeFilter = btn.getAttribute('data-filter');
                self._updateRadarChart(articles);
            });
        });

        // Render chart
        this._updateRadarChart(articles);
    },

    _updateRadarChart: function (articles) {
        var canvas = document.getElementById('radar-canvas');
        if (!canvas || !window.Chart) return;

        var ctx = canvas.getContext('2d');
        var now = Date.now();

        // Parse time filter (supports '3h','6h','12h','24h','7d','30d')
        var filterStr = this._state.radarTimeFilter;
        var currentMs;
        if (filterStr.indexOf('d') !== -1) {
            currentMs = parseInt(filterStr, 10) * 24 * 60 * 60 * 1000;
        } else {
            currentMs = parseInt(filterStr, 10) * 60 * 60 * 1000;
        }

        // Axis mapping (one axis per canonical category)
        var axes = {
            'Pesquisa & Papers': ['pesquisa-papers'],
            'Big Tech & Negocios': ['bigtech-negocios'],
            'Dev & Open Source': ['dev-opensource'],
            'Futuro & Etica': ['futuro-trabalho-etica'],
            'Visao de Lider': ['visao-lider']
        };

        var labels = Object.keys(axes);

        // Current period
        var currentArticles = articles.filter(function (a) {
            return (now - a.publishedAt.getTime()) < currentMs;
        });

        // Ghost period (previous equivalent period)
        var ghostArticles = articles.filter(function (a) {
            var age = now - a.publishedAt.getTime();
            return age >= currentMs && age < currentMs * 2;
        });

        var currentData = this._countByAxes(currentArticles, axes);
        var ghostData = this._countByAxes(ghostArticles, axes);

        // Get theme colors
        var style = getComputedStyle(document.documentElement);
        var textColor = style.getPropertyValue('--text-secondary').trim() || '#aaa';
        var gridColor = style.getPropertyValue('--border-color').trim() || '#333';
        var accentPrimary = style.getPropertyValue('--accent-primary').trim() || '#7c5cfc';
        var accentSecondary = style.getPropertyValue('--accent-secondary').trim() || '#00d4aa';

        if (this._charts.radar) {
            this._charts.radar.destroy();
        }

        this._charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Periodo Atual (' + this._state.radarTimeFilter + ')',
                        data: currentData,
                        fill: true,
                        backgroundColor: this._hexToRgba(accentPrimary, 0.2),
                        borderColor: accentPrimary,
                        pointBackgroundColor: accentPrimary,
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: accentPrimary,
                        borderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Periodo Anterior',
                        data: ghostData,
                        fill: false,
                        borderColor: this._hexToRgba(accentSecondary, 0.5),
                        borderDash: [6, 4],
                        pointRadius: 0,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: Math.max(1, Math.ceil(Math.max.apply(null, currentData.concat(ghostData)) / 5)),
                            color: textColor,
                            backdropColor: 'transparent',
                            font: { size: 11 }
                        },
                        grid: {
                            color: gridColor
                        },
                        angleLines: {
                            color: gridColor
                        },
                        pointLabels: {
                            color: textColor,
                            font: { size: 13, weight: '600', family: 'Inter, system-ui, sans-serif' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: { size: 12 },
                            padding: 16,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return ctx.dataset.label + ': ' + ctx.parsed.r + ' noticias';
                            }
                        }
                    }
                }
            }
        });
    },

    _countByAxes: function (articles, axes) {
        var labels = Object.keys(axes);
        return labels.map(function (label) {
            var categories = axes[label];
            return articles.filter(function (a) {
                return categories.indexOf(a.category) !== -1;
            }).length;
        });
    },

    // ==========================================
    // Section D: AI Leaderboard
    // ==========================================

    renderLeaderboard: function () {
        var container = document.getElementById('analytics-leaderboard');
        if (!container) return;

        // Reuse the same rendering logic as UI.renderLeaderboard
        var models = CONFIG.AI_LEADERBOARD || [];
        if (models.length === 0) return;

        var now = new Date();
        var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        var html = '<div class="analytics-section-header">' +
            '<h2 class="analytics-section-title">' +
            '<span class="leaderboard-header-icon-inline">\uD83C\uDFC6</span>' +
            ' AI Leaderboard</h2></div>';

        html += '<div class="analytics-leaderboard-grid">';

        for (var i = 0; i < models.length; i++) {
            var model = models[i];
            var rank = i + 1;
            var rankClass = rank <= 3 ? ' leaderboard-rank-' + rank : '';

            var updatedDate = new Date(model.lastUpdated);
            var isRecent = (now - updatedDate) < sevenDaysMs;

            var badgeHtml = isRecent
                ? '<span class="leaderboard-badge-update">\u26A1 Update</span>'
                : '';

            var reasoningWidth = (model.reasoning / 10) * 100;
            var creativityWidth = (model.creativity / 10) * 100;

            html += '<div class="analytics-leaderboard-card">' +
                '<div class="analytics-leaderboard-rank' + rankClass + '">' + rank + '</div>' +
                '<div class="analytics-leaderboard-body">' +
                    '<div class="analytics-leaderboard-name-row">' +
                        '<span class="analytics-leaderboard-icon">' + this._escapeHtml(model.icon) + '</span>' +
                        '<span class="analytics-leaderboard-name">' + this._escapeHtml(model.name) + '</span>' +
                        badgeHtml +
                    '</div>' +
                    '<div class="analytics-leaderboard-company">' + this._escapeHtml(model.company) + '</div>' +
                    '<div class="analytics-leaderboard-scores">' +
                        '<div class="leaderboard-score">' +
                            '<span class="leaderboard-score-label">Rac</span>' +
                            '<span class="leaderboard-score-value score-reasoning">' + model.reasoning.toFixed(1) + '</span>' +
                            '<div class="leaderboard-score-bar"><div class="leaderboard-score-bar-fill bar-reasoning" style="width:' + reasoningWidth + '%"></div></div>' +
                        '</div>' +
                        '<div class="leaderboard-score">' +
                            '<span class="leaderboard-score-label">Cri</span>' +
                            '<span class="leaderboard-score-value score-creativity">' + model.creativity.toFixed(1) + '</span>' +
                            '<div class="leaderboard-score-bar"><div class="leaderboard-score-bar-fill bar-creativity" style="width:' + creativityWidth + '%"></div></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    // ==========================================
    // Utility Helpers
    // ==========================================

    _timeAgo: function (date) {
        var now = Date.now();
        var diffMs = now - date.getTime();
        var diffMin = Math.floor(diffMs / 60000);
        var diffHours = Math.floor(diffMs / 3600000);
        var diffDays = Math.floor(diffMs / 86400000);

        if (diffMin < 60) return diffMin + ' min atras';
        if (diffHours < 24) return diffHours + 'h atras';
        if (diffDays === 1) return 'ontem';
        return diffDays + ' dias atras';
    },

    _escapeHtml: function (str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    _escapeAttr: function (str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    _hexToRgba: function (hex, alpha) {
        if (!hex || hex.charAt(0) !== '#') return 'rgba(124,92,252,' + alpha + ')';
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
};

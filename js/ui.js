/* ===================================================
   AI News Hub - UI Module
   Handles all DOM manipulation and rendering
   =================================================== */

window.UI = {

    _elements: {},

    _lazy: {
        articles: [],
        renderedCount: 0,
        observer: null
    },

    /**
     * Caches DOM element references for performance.
     */
    cacheElements: function() {
        this._elements = {
            newsGrid: document.getElementById('news-grid'),
            loadingSkeleton: document.getElementById('loading-skeleton'),
            errorContainer: document.getElementById('error-container'),
            staleWarning: document.getElementById('stale-warning'),
            staleTimestamp: document.getElementById('stale-timestamp'),
            emptyState: document.getElementById('empty-state'),
            emptyStateTitle: document.getElementById('empty-state-title'),
            emptyStateMessage: document.getElementById('empty-state-message'),
            emptyStateAction: document.getElementById('empty-state-action'),
            lazySentinel: document.getElementById('lazy-sentinel'),
            searchInput: document.getElementById('search-input'),
            btnRefresh: document.getElementById('btn-refresh'),
            btnTheme: document.getElementById('btn-theme'),
            lastUpdated: document.getElementById('last-updated'),
            articleCount: document.getElementById('article-count'),
            categoryNav: document.getElementById('category-nav'),
            recencyNav: document.getElementById('recency-nav'),
            toastContainer: document.getElementById('toast-container'),
            // Auth elements
            authContainer: document.getElementById('auth-container'),
            btnLogin: document.getElementById('btn-login'),
            userMenu: document.getElementById('user-menu'),
            userAvatar: document.getElementById('user-avatar'),
            userName: document.getElementById('user-name'),
            btnLogout: document.getElementById('btn-logout')
        };
    },

    /**
     * Converts a Date to a Portuguese "time ago" string.
     */
    timeAgo: function(date) {
        if (!date || isNaN(date.getTime())) return '';

        var now = new Date();
        var diffMs = now - date;
        var diffSec = Math.floor(diffMs / 1000);
        var diffMin = Math.floor(diffSec / 60);
        var diffHour = Math.floor(diffMin / 60);
        var diffDay = Math.floor(diffHour / 24);
        var diffWeek = Math.floor(diffDay / 7);

        if (diffSec < 60) return 'agora mesmo';
        if (diffMin < 60) return 'h\u00e1 ' + diffMin + (diffMin === 1 ? ' minuto' : ' minutos');
        if (diffHour < 24) return 'h\u00e1 ' + diffHour + (diffHour === 1 ? ' hora' : ' horas');
        if (diffDay < 7) return 'h\u00e1 ' + diffDay + (diffDay === 1 ? ' dia' : ' dias');
        if (diffWeek < 5) return 'h\u00e1 ' + diffWeek + (diffWeek === 1 ? ' semana' : ' semanas');

        // Format as DD/MM/YYYY
        var dd = String(date.getDate()).padStart(2, '0');
        var mm = String(date.getMonth() + 1).padStart(2, '0');
        var yyyy = date.getFullYear();
        return dd + '/' + mm + '/' + yyyy;
    },

    /**
     * Formats a Date as a readable timestamp.
     */
    formatTimestamp: function(date) {
        var dd = String(date.getDate()).padStart(2, '0');
        var mm = String(date.getMonth() + 1).padStart(2, '0');
        var yyyy = date.getFullYear();
        var hh = String(date.getHours()).padStart(2, '0');
        var min = String(date.getMinutes()).padStart(2, '0');
        return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + min;
    },

    /**
     * Gets the category label by ID.
     */
    getCategoryLabel: function(categoryId) {
        for (var i = 0; i < CONFIG.CATEGORIES.length; i++) {
            if (CONFIG.CATEGORIES[i].id === categoryId) {
                return CONFIG.CATEGORIES[i].label;
            }
        }
        return '';
    },

    /**
     * Gets the category icon by ID.
     */
    getCategoryIcon: function(categoryId) {
        for (var i = 0; i < CONFIG.CATEGORIES.length; i++) {
            if (CONFIG.CATEGORIES[i].id === categoryId) {
                return CONFIG.CATEGORIES[i].icon;
            }
        }
        return '';
    },

    /**
     * Returns the label and CSS class for a recencyStatus value.
     */
    getRecencyBadge: function(recencyStatus) {
        switch (recencyStatus) {
            case 'Newest': return { label: 'Newest', cssClass: 'recency-newest' };
            case 'New':    return { label: 'New', cssClass: 'recency-new' };
            case 'Past':   return { label: 'Past', cssClass: 'recency-past' };
            default:       return { label: '', cssClass: '' };
        }
    },

    /**
     * Returns the hashtag for a category ID (e.g. '#GarageProjects').
     */
    getCategoryHashtag: function(categoryId) {
        for (var i = 0; i < CONFIG.CATEGORIES.length; i++) {
            if (CONFIG.CATEGORIES[i].id === categoryId) {
                var label = CONFIG.CATEGORIES[i].label || '';

                // Remove leading # and accents, then collapse into hashtag words.
                label = label.replace(/^#/, '').trim();
                if (typeof label.normalize === 'function') {
                    label = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                }

                var words = label
                    .replace(/[^a-zA-Z0-9\s]+/g, ' ')
                    .split(/\s+/)
                    .filter(function(word) { return word.length > 0; })
                    .map(function(word) {
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    });

                if (words.length === 0) return '';
                return '#' + words.join('');
            }
        }
        return '';
    },

    /**
     * Sanitizes feed text, removing HTML and normalizing whitespace.
     */
    sanitizeText: function(text) {
        if (!text) return '';
        var clean = String(text)
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return clean;
    },

    /**
     * Truncates a sentence so TL;DR bullets stay short and scannable.
     */
    shortenTldrLine: function(text, maxLen) {
        var clean = this.sanitizeText(text);
        if (!clean) return '';
        if (clean.length <= maxLen) return clean;

        var truncated = clean.slice(0, maxLen);
        var lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 30) {
            truncated = truncated.slice(0, lastSpace);
        }

        return truncated + '...';
    },

    /**
     * Checks if a URL is from ArXiv.
     */
    isArxivUrl: function(url) {
        return url && url.indexOf('arxiv.org') !== -1;
    },

    /**
     * Generates up to 3 short TL;DR bullet points from a description string.
     */
    generateTldr: function(description, title) {
        var sourceText = this.sanitizeText(description);

        // Fallback to title when description is missing/too short.
        if (sourceText.length < 30) {
            sourceText = this.sanitizeText(title);
        }
        if (sourceText.length < 15) return [];

        // Split by sentence-ending punctuation
        var sentences = sourceText
            .replace(/([.!?])\s+/g, '$1|')
            .split('|')
            .map(function(s) { return s.trim(); })
            .filter(function(s) { return s.length > 15; });

        if (sentences.length === 0) {
            // Fallback: chunk text into short segments
            var words = sourceText.split(/\s+/);
            var chunk = [];
            var result = [];
            for (var i = 0; i < words.length; i++) {
                chunk.push(words[i]);
                if (chunk.length >= 8 || i === words.length - 1) {
                    var line = this.shortenTldrLine(chunk.join(' '), 90);
                    if (line.length > 15) result.push(line);
                    chunk = [];
                    if (result.length >= 3) break;
                }
            }
            return result;
        }

        var normalized = [];
        for (var j = 0; j < sentences.length && normalized.length < 3; j++) {
            var line = this.shortenTldrLine(sentences[j], 110);
            if (line.length > 15) {
                normalized.push(line);
            }
        }

        return normalized;
    },

    /**
     * Creates a single news card element.
     */
    createCard: function(article, index) {
        var card = document.createElement('div');
        card.className = 'news-card';
        card.style.animationDelay = Math.min(index * 0.05, 0.5) + 's';

        // --- Recency badge at the top ---
        var recencyBadge = this.getRecencyBadge(article.recencyStatus);
        var recencyHtml = '<span class="card-recency-top ' + recencyBadge.cssClass + '">' +
            this.escapeHtml(recencyBadge.label) + '</span>';

        // --- Thumbnail ---
        var thumbnailHtml = '';
        if (article.thumbnail) {
            thumbnailHtml =
                '<div class="card-thumbnail">' +
                    recencyHtml +
                    '<img src="' + this.escapeHtml(article.thumbnail) + '" ' +
                        'alt="" loading="lazy" ' +
                        'onerror="this.parentElement.style.display=\'none\'">' +
                '</div>';
        } else {
            var icon = this.getCategoryIcon(article.category);
            thumbnailHtml =
                '<div class="card-thumbnail-placeholder" data-category="' + article.category + '">' +
                    recencyHtml +
                    '<span class="placeholder-icon">' + icon + '</span>' +
                '</div>';
        }

        // --- Category hashtag ---
        var categoryHashtag = this.getCategoryHashtag(article.category);
        var categoryHashtagHtml = categoryHashtag
            ? '<span class="card-category-hashtag badge-' + article.category + '">' +
                this.escapeHtml(categoryHashtag) + '</span>'
            : '';

        // --- Relative time with clock icon ---
        var timeAgoStr = this.timeAgo(article.publishedAt);
        var clockIcon =
            '<svg class="card-clock-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">' +
                '<circle cx="12" cy="12" r="10"/>' +
                '<polyline points="12 6 12 12 16 14"/>' +
            '</svg>';

        // --- TL;DR bullets ---
        var tldrItems = this.generateTldr(article.description, article.title);
        var tldrHtml = '';
        if (tldrItems.length > 0) {
            tldrHtml = '<div class="card-tldr"><span class="card-tldr-label">TL;DR</span><ul>';
            for (var i = 0; i < tldrItems.length; i++) {
                tldrHtml += '<li>' + this.escapeHtml(tldrItems[i]) + '</li>';
            }
            tldrHtml += '</ul></div>';
        }

        // --- CTA: "Ler na Fonte" ---
        var isArxiv = this.isArxivUrl(article.url);
        var arxivIconHtml = isArxiv
            ? '<svg class="card-arxiv-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>' +
                '<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' +
                '<line x1="8" y1="7" x2="16" y2="7"/>' +
                '<line x1="8" y1="11" x2="14" y2="11"/>' +
              '</svg> '
            : '';
        var ctaLabel = isArxiv ? 'Ler Paper no ArXiv' : 'Ler na Fonte';
        var ctaArrow =
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
                '<polyline points="15 3 21 3 21 9"/>' +
                '<line x1="10" y1="14" x2="21" y2="3"/>' +
            '</svg>';

        card.innerHTML =
            thumbnailHtml +
            '<div class="card-body">' +
                '<div class="card-meta">' +
                    '<span class="card-source">' + this.escapeHtml(article.source) + '</span>' +
                    '<span class="card-time">' + clockIcon + ' ' + timeAgoStr + '</span>' +
                '</div>' +
                categoryHashtagHtml +
                '<h3 class="card-title">' + this.escapeHtml(article.title) + '</h3>' +
                tldrHtml +
                '<div class="card-footer">' +
                    '<a href="' + this.escapeHtml(article.url) + '" target="_blank" rel="noopener noreferrer" class="card-cta">' +
                        arxivIconHtml + this.escapeHtml(ctaLabel) + ' ' + ctaArrow +
                    '</a>' +
                '</div>' +
            '</div>';

        // Make the card title clickable as well
        var titleEl = card.querySelector('.card-title');
        if (titleEl) {
            titleEl.addEventListener('click', function() {
                window.open(article.url, '_blank', 'noopener,noreferrer');
            });
            titleEl.style.cursor = 'pointer';
        }

        return card;
    },

    /**
     * Escapes HTML special characters to prevent XSS.
     */
    escapeHtml: function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    },

    /**
     * Renders articles with lazy loading (IntersectionObserver).
     * First batch renders immediately; the rest load on scroll.
     */
    renderCards: function(articles, filterContext) {
        var grid = this._elements.newsGrid;
        var emptyState = this._elements.emptyState;
        var sentinel = this._elements.lazySentinel;
        var self = this;

        // Tear down previous lazy observer
        this._destroyLazyObserver();
        grid.innerHTML = '';

        if (!articles || articles.length === 0) {
            sentinel.style.display = 'none';
            this._showEmptyState(filterContext);
            return;
        }

        emptyState.style.display = 'none';

        // Store articles for lazy rendering
        this._lazy.articles = articles;
        this._lazy.renderedCount = 0;

        // Render initial batch
        this._renderNextBatch();

        // Setup IntersectionObserver for subsequent batches
        if (this._lazy.renderedCount < articles.length) {
            sentinel.style.display = 'flex';
            this._lazy.observer = new IntersectionObserver(function(entries) {
                if (entries[0].isIntersecting) {
                    self._renderNextBatch();
                    if (self._lazy.renderedCount >= self._lazy.articles.length) {
                        self._destroyLazyObserver();
                        sentinel.style.display = 'none';
                    }
                }
            }, { rootMargin: '200px' });
            this._lazy.observer.observe(sentinel);
        } else {
            sentinel.style.display = 'none';
        }
    },

    /**
     * Renders the next batch of cards into the grid.
     */
    _renderNextBatch: function() {
        var batchSize = CONFIG.SETTINGS.lazyBatchSize;
        var start = this._lazy.renderedCount;
        var end = Math.min(start + batchSize, this._lazy.articles.length);
        var fragment = document.createDocumentFragment();

        for (var i = start; i < end; i++) {
            fragment.appendChild(this.createCard(this._lazy.articles[i], i));
        }

        this._elements.newsGrid.appendChild(fragment);
        this._lazy.renderedCount = end;
    },

    /**
     * Disconnects and cleans up the lazy loading observer.
     */
    _destroyLazyObserver: function() {
        if (this._lazy.observer) {
            this._lazy.observer.disconnect();
            this._lazy.observer = null;
        }
    },

    /**
     * Shows a context-aware empty state based on active filters.
     */
    _showEmptyState: function(filterContext) {
        var emptyState = this._elements.emptyState;
        var titleEl = this._elements.emptyStateTitle;
        var msgEl = this._elements.emptyStateMessage;
        var actionEl = this._elements.emptyStateAction;

        emptyState.style.display = 'flex';
        actionEl.style.display = 'none';

        // Default
        var title = 'Nenhuma noticia encontrada';
        var message = '';

        if (filterContext) {
            var catLabel = filterContext.categoryLabel || '';
            var recLabel = filterContext.recencyLabel || '';
            var hasSearch = filterContext.searchQuery && filterContext.searchQuery.length > 0;
            var hasCategoryFilter = filterContext.category && filterContext.category !== 'all';
            var hasRecencyFilter = filterContext.recency && filterContext.recency !== 'all';

            if (hasSearch) {
                title = 'Nenhum resultado para "' + filterContext.searchQuery + '"';
                message = 'Tente usar termos diferentes ou remova os filtros ativos.';
            } else if (hasCategoryFilter && hasRecencyFilter) {
                title = 'Sem novidades aqui ainda';
                message = 'Ainda nao ha novidades ultra-recentes nesta categoria. Tente o filtro "New" ou "Past".';
                actionEl.textContent = '\uD83D\uDD52 Ver Todos os periodos';
                actionEl.style.display = 'inline-flex';
                actionEl.onclick = function() {
                    App.filterByRecency('all');
                };
            } else if (hasCategoryFilter) {
                title = 'Nenhuma noticia em ' + catLabel;
                message = 'Esta categoria ainda nao possui noticias. Tente outra categoria ou volte mais tarde.';
            } else if (hasRecencyFilter) {
                title = 'Sem noticias no periodo "' + recLabel + '"';
                message = 'Nao encontramos noticias neste intervalo de tempo. Experimente um filtro mais amplo.';
                actionEl.textContent = '\uD83D\uDCF0 Ver Todas as noticias';
                actionEl.style.display = 'inline-flex';
                actionEl.onclick = function() {
                    App.filterByRecency('all');
                };
            }
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
    },

    /**
     * Shows the loading skeleton.
     */
    showLoading: function() {
        this._elements.loadingSkeleton.style.display = 'grid';
        this._elements.newsGrid.style.display = 'none';
        this._elements.emptyState.style.display = 'none';
        this.clearError();
    },

    /**
     * Hides the loading skeleton.
     */
    hideLoading: function() {
        this._elements.loadingSkeleton.style.display = 'none';
        this._elements.newsGrid.style.display = 'grid';
    },

    /**
     * Displays an error message.
     */
    showError: function(message, isRetryable) {
        var container = this._elements.errorContainer;
        container.style.display = 'block';
        this._elements.newsGrid.style.display = 'none';
        this._elements.loadingSkeleton.style.display = 'none';

        var retryHtml = isRetryable ?
            '<button class="btn-retry" onclick="App.refreshFeeds(true)">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<polyline points="23 4 23 10 17 10"/>' +
                    '<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' +
                '</svg>' +
                'Tentar novamente' +
            '</button>' : '';

        container.innerHTML =
            '<div class="error-icon">' +
                '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">' +
                    '<circle cx="12" cy="12" r="10"/>' +
                    '<line x1="12" y1="8" x2="12" y2="12"/>' +
                    '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
                '</svg>' +
            '</div>' +
            '<h2 class="error-title">Erro ao carregar noticias</h2>' +
            '<p class="error-message">' + this.escapeHtml(message) + '</p>' +
            retryHtml;
    },

    /**
     * Clears the error container.
     */
    clearError: function() {
        this._elements.errorContainer.style.display = 'none';
        this._elements.errorContainer.innerHTML = '';
    },

    /**
     * Shows the stale cache warning banner.
     */
    showStaleWarning: function(timestamp) {
        this._elements.staleWarning.style.display = 'flex';
        this._elements.staleTimestamp.textContent = this.formatTimestamp(new Date(timestamp));
    },

    /**
     * Hides the stale cache warning.
     */
    hideStaleWarning: function() {
        this._elements.staleWarning.style.display = 'none';
    },

    /**
     * Updates the "last updated" timestamp display.
     */
    updateTimestamp: function(date) {
        this._elements.lastUpdated.textContent = 'Atualizado: ' + this.formatTimestamp(date);
    },

    /**
     * Updates the article count display.
     */
    updateArticleCount: function(count, total) {
        if (count === total) {
            this._elements.articleCount.textContent = count + ' noticias';
        } else {
            this._elements.articleCount.textContent = count + ' de ' + total + ' noticias';
        }
    },

    /**
     * Renders category tabs from CONFIG.CATEGORIES.
     */
    renderCategoryTabs: function() {
        var nav = this._elements.categoryNav;
        nav.innerHTML = '';

        var shortLabels = {
            'all':                   'Tudo',
            'pesquisa-papers':       'Pesquisa',
            'bigtech-negocios':      'Big Tech',
            'dev-opensource':         'Dev & OS',
            'futuro-trabalho-etica': 'Futuro & \u00c9tica',
            'visao-lider':           'Vis\u00e3o L\u00edder'
        };

        var fragment = document.createDocumentFragment();

        CONFIG.CATEGORIES.forEach(function(cat, index) {
            var btn = document.createElement('button');
            btn.className = 'category-tab' + (index === 0 ? ' active' : '');
            btn.setAttribute('data-category', cat.id);
            btn.setAttribute('aria-label', 'Filtrar por ' + cat.label);

            var iconSpan = document.createElement('span');
            iconSpan.className = 'tab-icon';
            iconSpan.textContent = cat.icon;
            iconSpan.setAttribute('aria-hidden', 'true');

            var fullSpan = document.createElement('span');
            fullSpan.className = 'tab-label-full';
            fullSpan.textContent = ' ' + cat.label;

            var shortSpan = document.createElement('span');
            shortSpan.className = 'tab-label-short';
            shortSpan.textContent = ' ' + (shortLabels[cat.id] || cat.label);

            btn.appendChild(iconSpan);
            btn.appendChild(fullSpan);
            btn.appendChild(shortSpan);

            btn.addEventListener('click', function() {
                App.filterByCategory(cat.id);
            });

            fragment.appendChild(btn);
        });

        nav.appendChild(fragment);
    },

    /**
     * Sets the active category tab visually.
     */
    setActiveTab: function(categoryId) {
        var tabs = this._elements.categoryNav.querySelectorAll('.category-tab');
        tabs.forEach(function(tab) {
            if (tab.getAttribute('data-category') === categoryId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    /**
     * Renders recency filter buttons (All, Newest, New, Past).
     */
    renderRecencyTabs: function() {
        var nav = this._elements.recencyNav;
        nav.innerHTML = '';

        var recencyOptions = [
            { id: 'all',     label: 'Todos',    icon: '\uD83D\uDD52', tooltip: 'Todas as not\u00edcias, sem filtro de tempo' },
            { id: 'Newest',  label: 'Newest',   icon: '\uD83D\uDD25', tooltip: '\u00daltimas 6 horas' },
            { id: 'New',     label: 'New',      icon: '\u2728',       tooltip: 'Entre 6 e 48 horas atr\u00e1s' },
            { id: 'Past',    label: 'Past',     icon: '\uD83D\uDCC1', tooltip: 'Mais de 48 horas atr\u00e1s' },
            { id: 'popular', label: 'Popular',  icon: '\uD83D\uDC4D', tooltip: 'Mais votadas pela comunidade' }
        ];

        var fragment = document.createDocumentFragment();

        recencyOptions.forEach(function(opt, index) {
            var btn = document.createElement('button');
            btn.className = 'recency-tab' + (index === 0 ? ' active' : '');
            btn.setAttribute('data-recency', opt.id);
            btn.textContent = opt.icon + ' ' + opt.label;
            btn.setAttribute('aria-label', 'Filtrar por ' + opt.label);
            btn.setAttribute('data-tooltip', opt.tooltip);

            btn.addEventListener('click', function() {
                App.filterByRecency(opt.id);
            });

            fragment.appendChild(btn);
        });

        nav.appendChild(fragment);
    },

    /**
     * Sets the active recency tab visually.
     */
    setActiveRecencyTab: function(recencyId) {
        var tabs = this._elements.recencyNav.querySelectorAll('.recency-tab');
        tabs.forEach(function(tab) {
            if (tab.getAttribute('data-recency') === recencyId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    /**
     * Toggles between dark and light theme.
     */
    toggleTheme: function() {
        var body = document.body;
        var currentTheme = body.getAttribute('data-theme');
        var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);

        try {
            localStorage.setItem(CONFIG.SETTINGS.cacheKeyTheme, newTheme);
        } catch (e) {
            // localStorage not available
        }
    },

    /**
     * Initializes theme from localStorage preference.
     */
    initTheme: function() {
        try {
            var saved = localStorage.getItem(CONFIG.SETTINGS.cacheKeyTheme);
            if (saved === 'light' || saved === 'dark') {
                document.body.setAttribute('data-theme', saved);
            }
        } catch (e) {
            // localStorage not available
        }
    },

    /**
     * Shows a brief toast notification.
     */
    showToast: function(message, type) {
        type = type || 'info';
        var container = this._elements.toastContainer;

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML =
            '<span class="toast-dot"></span>' +
            '<span>' + this.escapeHtml(message) + '</span>';

        container.appendChild(toast);

        // Auto-remove after animation completes
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    },

    /**
     * Sets the refresh button spinning state.
     */
    setRefreshing: function(isRefreshing) {
        var btn = this._elements.btnRefresh;
        if (isRefreshing) {
            btn.classList.add('refreshing');
            btn.disabled = true;
        } else {
            btn.classList.remove('refreshing');
            btn.disabled = false;
        }
    },


    /**
     * Creates a debounced version of a function.
     */
    debounce: function(fn, delayMs) {
        var timer;
        return function() {
            var args = arguments;
            var context = this;
            clearTimeout(timer);
            timer = setTimeout(function() {
                fn.apply(context, args);
            }, delayMs);
        };
    },

    // ==========================================
    // Auth UI
    // ==========================================

    /**
     * Shows the logged-in user menu, hides login button.
     */
    showUserMenu: function(user) {
        if (!this._elements.btnLogin || !this._elements.userMenu) return;

        this._elements.btnLogin.style.display = 'none';
        this._elements.userMenu.style.display = 'flex';

        if (user.photoURL) {
            this._elements.userAvatar.src = user.photoURL;
            this._elements.userAvatar.alt = user.displayName;
            this._elements.userAvatar.style.display = 'block';
        } else {
            this._elements.userAvatar.style.display = 'none';
        }

        this._elements.userName.textContent = user.displayName;
    },

    /**
     * Shows the login button, hides user menu.
     */
    showLoginButton: function() {
        if (!this._elements.btnLogin || !this._elements.userMenu) return;

        this._elements.btnLogin.style.display = 'inline-flex';
        this._elements.userMenu.style.display = 'none';
    },

    // ==========================================
    // Vote UI
    // ==========================================

    /**
     * Updates the vote count display for a specific article.
     */
    updateVoteCount: function(articleId, count) {
        var el = document.querySelector('[data-vote-count="' + articleId + '"]');
        if (el) {
            el.textContent = count > 0 ? count : '';
        }
    },

    /**
     * Marks a vote button as active/inactive.
     */
    setVoteActive: function(articleId, isActive) {
        var btn = document.querySelector('.btn-vote[data-article-id="' + articleId + '"]');
        if (btn) {
            if (isActive) {
                btn.classList.add('voted');
            } else {
                btn.classList.remove('voted');
            }
        }
    },

    /**
     * Triggers a pulse animation on the vote button.
     */
    animateVote: function(articleId) {
        var btn = document.querySelector('.btn-vote[data-article-id="' + articleId + '"]');
        if (btn) {
            btn.classList.add('vote-pulse');
            setTimeout(function() { btn.classList.remove('vote-pulse'); }, 300);
        }
    },

    /**
     * Refreshes all visible vote button states from VoteService cache.
     */
    refreshAllVoteStates: function() {
        var btns = document.querySelectorAll('.btn-vote');
        var self = this;

        btns.forEach(function(btn) {
            var articleId = btn.getAttribute('data-article-id');
            if (articleId) {
                var count = VoteService.getVoteCount(articleId);
                var voted = VoteService.hasUserVoted(articleId);
                self.updateVoteCount(articleId, count);
                self.setVoteActive(articleId, voted);
            }
        });
    }
};

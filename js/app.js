/* ===================================================
   AI News Hub - Application Orchestrator
   Handles init, caching, categorization, filtering,
   and auto-refresh lifecycle
   =================================================== */

window.App = {

    _state: {
        allArticles: [],
        filteredArticles: [],
        activeCategory: 'all',
        searchQuery: '',
        isLoading: false,
        refreshTimer: null
    },

    /**
     * Entry point. Called on DOMContentLoaded.
     */
    init: function() {
        var self = this;

        UI.cacheElements();
        UI.initTheme();
        UI.renderCategoryTabs();
        this.bindEvents();

        // Try cache first for instant render
        var cached = this.loadFromCache();

        if (cached) {
            this._state.allArticles = this.categorizeArticles(cached.articles);
            this._state.allArticles = this.sortArticles(this._state.allArticles);
            this.applyFilters();
            UI.updateTimestamp(new Date(cached.timestamp));
            UI.hideStaleWarning();

            // Background refresh (no loading skeleton)
            self.refreshFeeds(false);
        } else {
            // First load: show skeleton
            self.refreshFeeds(true);
        }

        this.startAutoRefresh();
    },

    // ==========================================
    // Cache Management
    // ==========================================

    /**
     * Loads articles from localStorage cache if fresh.
     * Returns { articles, timestamp } or null.
     */
    loadFromCache: function() {
        try {
            var timestampStr = localStorage.getItem(CONFIG.SETTINGS.cacheKeyTimestamp);
            if (!timestampStr) return null;

            var timestamp = parseInt(timestampStr, 10);
            var age = Date.now() - timestamp;

            if (age > CONFIG.SETTINGS.cacheTtlMs) return null;

            var articlesJson = localStorage.getItem(CONFIG.SETTINGS.cacheKeyArticles);
            if (!articlesJson) return null;

            var articles = JSON.parse(articlesJson);

            // Convert date strings back to Date objects
            articles.forEach(function(a) {
                a.publishedAt = new Date(a.publishedAt);
            });

            return { articles: articles, timestamp: timestamp };
        } catch (e) {
            // Cache corrupted, clear it
            this.clearCache();
            return null;
        }
    },

    /**
     * Loads stale cache (ignoring TTL) for fallback.
     */
    loadStaleCache: function() {
        try {
            var timestampStr = localStorage.getItem(CONFIG.SETTINGS.cacheKeyTimestamp);
            var articlesJson = localStorage.getItem(CONFIG.SETTINGS.cacheKeyArticles);
            if (!articlesJson) return null;

            var articles = JSON.parse(articlesJson);
            articles.forEach(function(a) {
                a.publishedAt = new Date(a.publishedAt);
            });

            return {
                articles: articles,
                timestamp: timestampStr ? parseInt(timestampStr, 10) : Date.now()
            };
        } catch (e) {
            return null;
        }
    },

    /**
     * Saves articles and timestamp to localStorage.
     */
    saveToCache: function(articles) {
        try {
            // Limit to max articles
            var toSave = articles.slice(0, CONFIG.SETTINGS.maxTotalArticles);
            localStorage.setItem(CONFIG.SETTINGS.cacheKeyArticles, JSON.stringify(toSave));
            localStorage.setItem(CONFIG.SETTINGS.cacheKeyTimestamp, String(Date.now()));
        } catch (e) {
            console.warn('[AI News Hub] Could not save to cache:', e.message);
        }
    },

    /**
     * Clears the cache.
     */
    clearCache: function() {
        try {
            localStorage.removeItem(CONFIG.SETTINGS.cacheKeyArticles);
            localStorage.removeItem(CONFIG.SETTINGS.cacheKeyTimestamp);
        } catch (e) {
            // Ignore
        }
    },

    // ==========================================
    // Feed Refresh Pipeline
    // ==========================================

    /**
     * Fetches all feeds, processes, caches, and renders.
     */
    refreshFeeds: function(showLoadingState) {
        var self = this;

        if (this._state.isLoading) return;
        this._state.isLoading = true;

        if (showLoadingState) {
            UI.showLoading();
        }
        UI.setRefreshing(true);

        FeedService.fetchAllFeeds().then(function(result) {
            var articles = result.articles;
            var failedFeeds = result.failedFeeds;

            if (articles.length === 0) {
                // All feeds failed - try stale cache
                var stale = self.loadStaleCache();
                if (stale && stale.articles.length > 0) {
                    self._state.allArticles = self.categorizeArticles(stale.articles);
                    self._state.allArticles = self.sortArticles(self._state.allArticles);
                    self.applyFilters();
                    UI.hideLoading();
                    UI.showStaleWarning(stale.timestamp);
                    UI.showToast('Nao foi possivel atualizar. Exibindo cache.', 'error');
                } else {
                    // Total failure, no cache
                    UI.showError(
                        'Nao foi possivel carregar as noticias. Verifique sua conexao com a internet e tente novamente.',
                        true
                    );
                }
            } else {
                // Success (possibly partial)
                articles = self.deduplicateArticles(articles);
                articles = self.categorizeArticles(articles);
                articles = self.sortArticles(articles);
                articles = articles.slice(0, CONFIG.SETTINGS.maxTotalArticles);

                self._state.allArticles = articles;
                self.saveToCache(articles);
                self.applyFilters();

                UI.hideLoading();
                UI.clearError();
                UI.hideStaleWarning();
                UI.updateTimestamp(new Date());

                if (failedFeeds.length > 0) {
                    UI.showToast(
                        failedFeeds.length + ' fonte(s) indisponivel(is): ' + failedFeeds.join(', '),
                        'info'
                    );
                } else if (!showLoadingState) {
                    // Silent background refresh success
                    UI.showToast('Noticias atualizadas!', 'success');
                }
            }

            self._state.isLoading = false;
            UI.setRefreshing(false);

        }).catch(function(err) {
            console.error('[AI News Hub] Unexpected error:', err);
            self._state.isLoading = false;
            UI.setRefreshing(false);
            UI.hideLoading();
            UI.showError('Ocorreu um erro inesperado. Tente novamente.', true);
        });
    },

    // ==========================================
    // Article Processing
    // ==========================================

    /**
     * Assigns a category to each article based on keyword matching.
     * Category with most keyword matches wins.
     */
    categorizeArticles: function(articles) {
        // Build category keyword lists (skip 'all')
        var categoryChecks = CONFIG.CATEGORIES
            .filter(function(c) { return c.id !== 'all' && c.keywords.length > 0; })
            .map(function(c) {
                return {
                    id: c.id,
                    keywords: c.keywords.map(function(k) { return k.toLowerCase(); })
                };
            });

        return articles.map(function(article) {
            var text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
            var bestMatchId = null;
            var bestMatchCount = 0;
            var bestMatchedKeywords = [];

            for (var i = 0; i < categoryChecks.length; i++) {
                var cat = categoryChecks[i];
                var matched = [];

                for (var j = 0; j < cat.keywords.length; j++) {
                    if (text.indexOf(cat.keywords[j]) !== -1) {
                        matched.push(cat.keywords[j]);
                    }
                }

                if (matched.length > bestMatchCount) {
                    bestMatchCount = matched.length;
                    bestMatchId = cat.id;
                    bestMatchedKeywords = matched;
                }
            }

            if (bestMatchId && bestMatchCount > 0) {
                article.category = bestMatchId;
                article.matchedKeywords = bestMatchedKeywords;
            }
            // else: keep feed's defaultCategory (already set in feeds.js)

            return article;
        });
    },

    /**
     * Removes duplicate articles by normalized URL.
     */
    deduplicateArticles: function(articles) {
        var seen = {};
        var unique = [];

        articles.forEach(function(article) {
            // Normalize URL: lowercase, remove trailing slash, remove query params
            var normalized = article.url.toLowerCase()
                .replace(/\/+$/, '')
                .replace(/\?.*$/, '')
                .replace(/^https?:\/\/(www\.)?/, '');

            if (!seen[normalized]) {
                seen[normalized] = true;
                unique.push(article);
            }
        });

        return unique;
    },

    /**
     * Sorts articles by publishedAt descending (newest first).
     */
    sortArticles: function(articles) {
        return articles.slice().sort(function(a, b) {
            return b.publishedAt.getTime() - a.publishedAt.getTime();
        });
    },

    // ==========================================
    // Filtering
    // ==========================================

    /**
     * Applies current category and search filters, then renders.
     */
    applyFilters: function() {
        var articles = this._state.allArticles;
        var category = this._state.activeCategory;
        var query = this._state.searchQuery.toLowerCase().trim();

        // Category filter
        if (category !== 'all') {
            articles = articles.filter(function(a) {
                return a.category === category;
            });
        }

        // Search filter
        if (query) {
            articles = articles.filter(function(a) {
                var text = ((a.title || '') + ' ' + (a.description || '') + ' ' + (a.source || '')).toLowerCase();
                return text.indexOf(query) !== -1;
            });
        }

        this._state.filteredArticles = articles;
        UI.renderCards(articles);
        UI.updateArticleCount(articles.length, this._state.allArticles.length);
    },

    /**
     * Handles category tab click.
     */
    filterByCategory: function(categoryId) {
        this._state.activeCategory = categoryId;
        UI.setActiveTab(categoryId);
        this.applyFilters();

        // Scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Handles search input.
     */
    filterBySearch: function(query) {
        this._state.searchQuery = query;
        this.applyFilters();
    },

    // ==========================================
    // Auto-Refresh
    // ==========================================

    /**
     * Starts the auto-refresh interval timer.
     */
    startAutoRefresh: function() {
        var self = this;
        this.stopAutoRefresh();

        this._state.refreshTimer = setInterval(function() {
            // Only refresh if page is visible
            if (!document.hidden) {
                self.refreshFeeds(false);
            }
        }, CONFIG.SETTINGS.refreshIntervalMs);
    },

    /**
     * Stops the auto-refresh interval timer.
     */
    stopAutoRefresh: function() {
        if (this._state.refreshTimer) {
            clearInterval(this._state.refreshTimer);
            this._state.refreshTimer = null;
        }
    },

    // ==========================================
    // Event Binding
    // ==========================================

    /**
     * Binds all event listeners.
     */
    bindEvents: function() {
        var self = this;

        // Refresh button
        UI._elements.btnRefresh.addEventListener('click', function() {
            self.refreshFeeds(true);
        });

        // Theme toggle
        UI._elements.btnTheme.addEventListener('click', function() {
            UI.toggleTheme();
        });

        // Search input (debounced)
        var debouncedSearch = UI.debounce(function(e) {
            self.filterBySearch(e.target.value);
        }, CONFIG.SETTINGS.searchDebounceMs);

        UI._elements.searchInput.addEventListener('input', debouncedSearch);

        // Clear search on Escape
        UI._elements.searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                self.filterBySearch('');
                this.blur();
            }
        });

        // Visibility API: refresh when tab becomes visible after being hidden
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // Check if cache is stale
                var cached = self.loadFromCache();
                if (!cached) {
                    self.refreshFeeds(false);
                }
            }
        });
    }
};

// Bootstrap
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

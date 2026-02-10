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
        activeRecency: 'all',
        searchQuery: '',
        isLoading: false,
        refreshTimer: null,
        currentUser: null,
        popularArticleVotes: {}
    },

    /**
     * Entry point. Called on DOMContentLoaded.
     */
    init: function() {
        var self = this;

        UI.cacheElements();
        UI.initTheme();
        UI.renderCategoryTabs();
        UI.renderRecencyTabs();
        SidebarService.init();
        if (window.ViewManager) ViewManager.init();
        if (window.StreamGraph) StreamGraph.init();
        this.bindEvents();

        // Firebase/Auth/Votes
        firebase.initializeApp(CONFIG.FIREBASE);
        Auth.init();
        VoteService.init();

        Auth.onAuthChange(function(user) {
            self._state.currentUser = user;
            if (user) {
                UI.showUserMenu(user);
                VoteService.loadUserVotes(user.uid).then(function() {
                    UI.refreshAllVoteStates();
                });
            } else {
                UI.showLoginButton();
                VoteService.clearUserVotes();
                UI.refreshAllVoteStates();
            }
        });

        // Restore saved filter preferences
        this._restoreFilterPrefs();

        // Try cache first for instant render
        var cached = this.loadFromCache();

        if (cached) {
            this._state.allArticles = this.categorizeArticles(cached.articles);
            this._state.allArticles = this.enrichWithRecency(this._state.allArticles);
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

            if (articles.length === 0) {
                // All feeds failed - try stale cache
                var stale = self.loadStaleCache();
                if (stale && stale.articles.length > 0) {
                    self._state.allArticles = self.categorizeArticles(stale.articles);
                    self._state.allArticles = self.enrichWithRecency(self._state.allArticles);
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
                var previousCount = self._state.allArticles.length;

                articles = self.deduplicateArticles(articles);
                articles = self.categorizeArticles(articles);
                articles = self.enrichWithRecency(articles);
                articles = self.sortArticles(articles);
                articles = articles.slice(0, CONFIG.SETTINGS.maxTotalArticles);

                self._state.allArticles = articles;
                self.saveToCache(articles);
                self.applyFilters();

                // Refresh analytics if visible
                if (window.ViewManager && ViewManager.getCurrentView() === 'analytics' && window.AnalyticsPage) {
                    AnalyticsPage.render(articles);
                }

                // Refresh streamgraph if visible
                if (window.ViewManager && ViewManager.getCurrentView() === 'sentiment' && window.StreamGraph) {
                    StreamGraph.render(articles);
                }

                self._loadVisibleVoteCounts();

                UI.hideLoading();
                UI.clearError();
                UI.hideStaleWarning();
                UI.updateTimestamp(new Date());

                if (!showLoadingState) {
                    // Smart toast: show how many new articles were found
                    var newCount = articles.length - previousCount;
                    if (newCount > 0) {
                        UI.showToast(newCount + ' nova(s) noticia(s) encontrada(s)!', 'success');
                    } else {
                        UI.showToast('Noticias atualizadas! Nenhuma novidade.', 'success');
                    }
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

    // Migration map: old category IDs → new canonical IDs.
    // Used to reclassify cached/Firestore articles that still carry
    // a deprecated category so they don't become orphaned.
    _categoryMigration: {
        'bigtechs-negocios': 'bigtech-negocios',
        'llms':              'bigtech-negocios',
        'ia-generativa':     'dev-opensource',
        'garage-projects':   'dev-opensource',
        'debates-duvidas':   'futuro-trabalho-etica'
    },

    /**
     * Migrates an article's category from old IDs to new canonical IDs.
     * Called before keyword-based re-categorization so that the fallback
     * defaultCategory is already valid.
     */
    migrateCategory: function(article) {
        if (article.category && this._categoryMigration[article.category]) {
            article.category = this._categoryMigration[article.category];
        }
        return article;
    },

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

        var self = this;
        return articles.map(function(article) {
            // Migrate legacy category IDs before keyword matching
            self.migrateCategory(article);

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
     * Removes duplicate articles by normalized URL and by similar title.
     */
    deduplicateArticles: function(articles) {
        var seenUrls = {};
        var seenTitles = {};
        var unique = [];

        articles.forEach(function(article) {
            // 1. Dedup by normalized URL
            var normalizedUrl = article.url.toLowerCase()
                .replace(/\/+$/, '')
                .replace(/\?.*$/, '')
                .replace(/^https?:\/\/(www\.)?/, '');

            if (seenUrls[normalizedUrl]) return;
            seenUrls[normalizedUrl] = true;

            // 2. Dedup by normalized title (catches same news from different sources)
            var normalizedTitle = article.title.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            // Skip title dedup for very short titles to avoid false positives
            if (normalizedTitle.length >= 15 && seenTitles[normalizedTitle]) return;
            if (normalizedTitle.length >= 15) seenTitles[normalizedTitle] = true;

            unique.push(article);
        });

        return unique;
    },

    /**
     * Computes recencyStatus based on publishedAt vs current time.
     * Returns 'Newest' (<6h), 'New' (6h-48h), or 'Past' (>48h).
     */
    getRecencyStatus: function(publishedAt) {
        var now = new Date();
        var diffMs = now - publishedAt;
        var diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 6) return 'Newest';
        if (diffHours < 48) return 'New';
        return 'Past';
    },

    /**
     * Adds recencyStatus computed field to each article.
     */
    enrichWithRecency: function(articles) {
        var self = this;
        return articles.map(function(article) {
            article.recencyStatus = self.getRecencyStatus(article.publishedAt);
            return article;
        });
    },

    /**
     * Sorts articles by recency group (Newest > New > Past),
     * then by publishedAt descending within each group.
     */
    sortArticles: function(articles) {
        var recencyOrder = { 'Newest': 0, 'New': 1, 'Past': 2 };

        return articles.slice().sort(function(a, b) {
            var groupA = recencyOrder[a.recencyStatus] !== undefined ? recencyOrder[a.recencyStatus] : 2;
            var groupB = recencyOrder[b.recencyStatus] !== undefined ? recencyOrder[b.recencyStatus] : 2;

            if (groupA !== groupB) return groupA - groupB;
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
        var recency = this._state.activeRecency;
        var query = this._state.searchQuery.toLowerCase().trim();

        // Category filter
        if (category !== 'all') {
            articles = articles.filter(function(a) {
                return a.category === category;
            });
        }

        // Recency filter (skip for 'popular' - it uses vote-based sorting instead)
        if (recency !== 'all' && recency !== 'popular') {
            articles = articles.filter(function(a) {
                return a.recencyStatus === recency;
            });
        }

        // Search filter
        if (query) {
            articles = articles.filter(function(a) {
                var text = ((a.title || '') + ' ' + (a.description || '') + ' ' + (a.source || '')).toLowerCase();
                return text.indexOf(query) !== -1;
            });
        }

        // Popular sort: order by votes descending, then by date
        if (recency === 'popular') {
            var voteCounts = this._state.popularArticleVotes;
            articles = articles.slice().sort(function(a, b) {
                var votesA = voteCounts[a.id] || 0;
                var votesB = voteCounts[b.id] || 0;
                if (votesA !== votesB) return votesB - votesA;
                return b.publishedAt.getTime() - a.publishedAt.getTime();
            });
        }

        // Build filter context for empty state messaging
        var filterContext = {
            category: category,
            recency: recency,
            searchQuery: this._state.searchQuery.trim(),
            categoryLabel: UI.getCategoryLabel(category),
            recencyLabel: recency
        };

        this._state.filteredArticles = articles;
        UI.renderCards(articles, filterContext);
        UI.updateArticleCount(articles.length, this._state.allArticles.length);
    },

    /**
     * Handles category tab click.
     */
    filterByCategory: function(categoryId) {
        this._state.activeCategory = categoryId;
        UI.setActiveTab(categoryId);
        this._saveFilterPrefs();
        this.applyFilters();

        if (window.SidebarService) {
            SidebarService._syncActiveCategory();
        }

        // Scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Handles recency filter click.
     */
    filterByRecency: function(recencyId) {
        var self = this;
        this._state.activeRecency = recencyId;
        UI.setActiveRecencyTab(recencyId);
        this._saveFilterPrefs();

        if (recencyId === 'popular') {
            VoteService.getPopularArticleIds(CONFIG.SETTINGS.votePopularHours).then(function(results) {
                var voteMap = {};
                results.forEach(function(r) { voteMap[r.articleId] = r.count; });
                self._state.popularArticleVotes = voteMap;
                self.applyFilters();
            }).catch(function() {
                self.applyFilters();
            });
        } else {
            this.applyFilters();
        }

        // Scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Saves filter preferences to localStorage.
     */
    _saveFilterPrefs: function() {
        try {
            localStorage.setItem(CONFIG.SETTINGS.cacheKeyCategory, this._state.activeCategory);
            localStorage.setItem(CONFIG.SETTINGS.cacheKeyRecency, this._state.activeRecency);
        } catch (e) {
            // localStorage not available
        }
    },

    /**
     * Restores filter preferences from localStorage.
     * Returns true if any preference was restored.
     */
    _restoreFilterPrefs: function() {
        try {
            var savedCat = localStorage.getItem(CONFIG.SETTINGS.cacheKeyCategory);
            var savedRec = localStorage.getItem(CONFIG.SETTINGS.cacheKeyRecency);
            var restored = false;

            // Migrate saved category preference from old IDs
            if (savedCat && this._categoryMigration[savedCat]) {
                savedCat = this._categoryMigration[savedCat];
                localStorage.setItem(CONFIG.SETTINGS.cacheKeyCategory, savedCat);
            }

            if (savedCat && this._isValidCategory(savedCat)) {
                this._state.activeCategory = savedCat;
                UI.setActiveTab(savedCat);
                restored = true;
            }

            if (savedRec && this._isValidRecency(savedRec)) {
                this._state.activeRecency = savedRec;
                UI.setActiveRecencyTab(savedRec);
                restored = true;
            }

            return restored;
        } catch (e) {
            return false;
        }
    },

    /**
     * Checks if a category ID is valid.
     */
    _isValidCategory: function(catId) {
        return CONFIG.CATEGORIES.some(function(c) { return c.id === catId; });
    },

    /**
     * Checks if a recency ID is valid.
     */
    _isValidRecency: function(recId) {
        return ['all', 'Newest', 'New', 'Past', 'popular'].indexOf(recId) !== -1;
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
    // Voting
    // ==========================================

    /**
     * Handles a vote click on an article card.
     */
    handleVote: function(articleId) {
        if (!Auth.isLoggedIn()) {
            UI.showToast('Faca login para votar nas noticias!', 'info');
            return;
        }

        VoteService.toggleVote(articleId).then(function(result) {
            UI.updateVoteCount(articleId, result.newCount);
            UI.setVoteActive(articleId, result.voted);
            UI.animateVote(articleId);
        }).catch(function(err) {
            if (err.message === 'RATE_LIMITED') {
                UI.showToast('Aguarde um momento antes de votar novamente.', 'info');
            } else {
                UI.showToast('Erro ao registrar voto. Tente novamente.', 'error');
                console.error('[AI News Hub] Vote error:', err);
            }
        });
    },

    /**
     * Loads vote counts for currently visible articles and updates UI.
     */
    _loadVisibleVoteCounts: function() {
        var articles = this._state.filteredArticles;
        if (!articles || articles.length === 0) return;

        var ids = articles.slice(0, CONFIG.SETTINGS.voteBatchLoadSize).map(function(a) {
            return a.id;
        });

        VoteService.loadVoteCountsForArticles(ids).then(function() {
            UI.refreshAllVoteStates();
        });
    },

    // ==========================================
    // Event Binding
    // ==========================================

    /**
     * Binds all event listeners.
     */
    bindEvents: function() {
        var self = this;

        // Refresh button (smart: background refresh, no skeleton if content exists)
        UI._elements.btnRefresh.addEventListener('click', function() {
            var hasContent = self._state.allArticles.length > 0;
            self.refreshFeeds(!hasContent);
        });

        // Theme toggle
        UI._elements.btnTheme.addEventListener('click', function() {
            UI.toggleTheme();
        });

        // Login button
        if (UI._elements.btnLogin) {
            UI._elements.btnLogin.addEventListener('click', function() {
                Auth.login().catch(function(err) {
                    if (err.code !== 'auth/popup-closed-by-user') {
                        UI.showToast('Erro ao fazer login. Tente novamente.', 'error');
                    }
                });
            });
        }

        // Logout button
        if (UI._elements.btnLogout) {
            UI._elements.btnLogout.addEventListener('click', function() {
                Auth.logout().then(function() {
                    UI.showToast('Voce saiu da sua conta.', 'info');
                });
            });
        }

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

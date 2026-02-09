/* ===================================================
   AI News Hub - UI Module
   Handles all DOM manipulation and rendering
   =================================================== */

window.UI = {

    _elements: {},

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
            searchInput: document.getElementById('search-input'),
            btnRefresh: document.getElementById('btn-refresh'),
            btnTheme: document.getElementById('btn-theme'),
            lastUpdated: document.getElementById('last-updated'),
            articleCount: document.getElementById('article-count'),
            categoryNav: document.getElementById('category-nav'),
            toastContainer: document.getElementById('toast-container')
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

        if (diffSec < 60) return 'agora mesmo';
        if (diffMin < 60) return 'ha ' + diffMin + (diffMin === 1 ? ' minuto' : ' minutos');
        if (diffHour < 24) return 'ha ' + diffHour + (diffHour === 1 ? ' hora' : ' horas');
        if (diffDay < 7) return 'ha ' + diffDay + (diffDay === 1 ? ' dia' : ' dias');

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
     * Creates a single news card element.
     */
    createCard: function(article, index) {
        var card = document.createElement('a');
        card.href = article.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'news-card';
        card.style.animationDelay = Math.min(index * 0.05, 0.5) + 's';

        var thumbnailHtml = '';
        if (article.thumbnail) {
            thumbnailHtml =
                '<div class="card-thumbnail">' +
                    '<img src="' + this.escapeHtml(article.thumbnail) + '" ' +
                        'alt="" loading="lazy" ' +
                        'onerror="this.parentElement.style.display=\'none\'">' +
                '</div>';
        } else {
            var icon = this.getCategoryIcon(article.category);
            thumbnailHtml =
                '<div class="card-thumbnail-placeholder" data-category="' + article.category + '">' +
                    '<span class="placeholder-icon">' + icon + '</span>' +
                '</div>';
        }

        var categoryLabel = this.getCategoryLabel(article.category);
        var badgeClass = 'card-category-badge badge-' + article.category;

        card.innerHTML =
            thumbnailHtml +
            '<div class="card-body">' +
                '<div class="card-meta">' +
                    '<span class="card-source">' + this.escapeHtml(article.source) + '</span>' +
                    '<span class="card-time">' + this.timeAgo(article.publishedAt) + '</span>' +
                '</div>' +
                '<h3 class="card-title">' + this.escapeHtml(article.title) + '</h3>' +
                '<p class="card-description">' + this.escapeHtml(article.description) + '</p>' +
                '<div class="card-footer">' +
                    '<span class="' + badgeClass + '">' + this.escapeHtml(categoryLabel) + '</span>' +
                    '<span class="card-read-more">Ler mais ' +
                        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">' +
                            '<line x1="5" y1="12" x2="19" y2="12"/>' +
                            '<polyline points="12 5 19 12 12 19"/>' +
                        '</svg>' +
                    '</span>' +
                '</div>' +
            '</div>';

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
     * Renders an array of articles as cards into the news grid.
     */
    renderCards: function(articles) {
        var grid = this._elements.newsGrid;
        var emptyState = this._elements.emptyState;

        grid.innerHTML = '';

        if (!articles || articles.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        var fragment = document.createDocumentFragment();
        var self = this;

        articles.forEach(function(article, index) {
            fragment.appendChild(self.createCard(article, index));
        });

        grid.appendChild(fragment);
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

        var fragment = document.createDocumentFragment();

        CONFIG.CATEGORIES.forEach(function(cat, index) {
            var btn = document.createElement('button');
            btn.className = 'category-tab' + (index === 0 ? ' active' : '');
            btn.setAttribute('data-category', cat.id);
            btn.textContent = cat.icon + ' ' + cat.label;
            btn.setAttribute('aria-label', 'Filtrar por ' + cat.label);

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
    }
};

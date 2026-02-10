/* ===================================================
   AI News Hub - Sidebar Navigation Module
   Handles collapsible left sidebar, categories dropdown,
   mobile overlay, and section navigation
   =================================================== */

window.SidebarService = {

    _state: {
        isExpanded: false,
        isOpen: false,
        isCategoriesOpen: false,
        isSourcesOpen: false,
        activeSection: 'feed'
    },

    _elements: {},

    _categoryColors: {
        'all':                   'var(--text-secondary)',
        'pesquisa-papers':       '#fbbf24',
        'bigtech-negocios':      '#60a5fa',
        'dev-opensource':         '#34d399',
        'futuro-trabalho-etica': '#f87171',
        'visao-lider':           '#a78bfa'
    },

    init: function () {
        this._cacheElements();
        this._renderCategorySubmenu();
        this._renderSourcesSubmenu();
        this._bindEvents();
        this._restoreState();
        this._syncActiveCategory();
    },

    _cacheElements: function () {
        this._elements = {
            sideMenu: document.getElementById('side-menu'),
            backdrop: document.getElementById('sidebar-backdrop'),
            btnToggle: document.getElementById('btn-sidebar-toggle'),
            btnCollapse: document.getElementById('btn-side-menu-collapse'),
            categoriesSubmenu: document.getElementById('side-menu-categories'),
            categoriesDropdown: document.querySelector('.side-menu-dropdown[data-section="categories"]'),
            sourcesSubmenu: document.getElementById('side-menu-sources'),
            sourcesDropdown: document.querySelector('.side-menu-dropdown[data-section="sources"]')
        };
    },

    _renderCategorySubmenu: function () {
        var container = this._elements.categoriesSubmenu;
        if (!container || !window.CONFIG) return;

        var fragment = document.createDocumentFragment();
        var self = this;

        CONFIG.CATEGORIES.forEach(function (cat) {
            var btn = document.createElement('button');
            btn.className = 'side-menu-submenu-item';
            btn.setAttribute('data-category-id', cat.id);
            if (cat.id === 'all') btn.classList.add('active');

            var dot = document.createElement('span');
            dot.className = 'side-menu-submenu-dot';
            dot.style.background = self._categoryColors[cat.id] || 'var(--text-muted)';

            var text = document.createElement('span');
            text.textContent = cat.label;

            btn.appendChild(dot);
            btn.appendChild(text);

            btn.addEventListener('click', function () {
                self._onCategoryClick(cat.id);
            });

            fragment.appendChild(btn);
        });

        container.appendChild(fragment);
    },

    _renderSourcesSubmenu: function () {
        var container = this._elements.sourcesSubmenu;
        if (!container || !window.CONFIG) return;

        var feeds = CONFIG.FEEDS || [];
        var names = [];
        for (var i = 0; i < feeds.length; i++) {
            if (feeds[i].name && names.indexOf(feeds[i].name) === -1) {
                names.push(feeds[i].name);
            }
        }
        names.sort();

        var html = '<p class="side-menu-sources-intro">Monitoramos em tempo real os <strong>60+</strong> principais lideres e veiculos globais de IA.</p>';
        html += '<ul class="side-menu-sources-list">';
        for (var j = 0; j < names.length; j++) {
            var safeName = names[j].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html += '<li class="side-menu-sources-item">' +
                '<span class="side-menu-sources-dot"></span>' +
                '<span>' + safeName + '</span>' +
                '</li>';
        }
        html += '</ul>';

        container.innerHTML = html;
    },


    _bindEvents: function () {
        var self = this;

        if (this._elements.btnToggle) {
            this._elements.btnToggle.addEventListener('click', function () {
                self.toggleMobileOpen();
            });
        }

        if (this._elements.btnCollapse) {
            this._elements.btnCollapse.addEventListener('click', function () {
                if (window.innerWidth >= 1024) {
                    self.toggleExpanded();
                } else {
                    self.closeMobile();
                }
            });
        }

        // Desktop: click sidebar header to expand when collapsed
        var sideHeader = this._elements.sideMenu.querySelector('.side-menu-header');
        if (sideHeader) {
            sideHeader.addEventListener('click', function (e) {
                if (window.innerWidth < 1024) return;
                if (self._state.isExpanded) return;
                // Don't trigger if clicking the collapse button itself
                if (e.target.closest('.btn-side-menu-collapse')) return;
                self.toggleExpanded();
            });
        }

        if (this._elements.backdrop) {
            this._elements.backdrop.addEventListener('click', function () {
                self.closeMobile();
            });
        }

        var dropdownToggles = document.querySelectorAll('.side-menu-dropdown-toggle');
        dropdownToggles.forEach(function (toggle) {
            toggle.addEventListener('click', function () {
                var item = toggle.closest('.side-menu-dropdown');
                var section = item ? item.getAttribute('data-section') : null;
                if (section === 'categories') {
                    self._toggleDropdown('categories');
                } else if (section === 'sources') {
                    self._toggleDropdown('sources');
                }
            });
        });

        var navButtons = document.querySelectorAll('.side-menu-link:not(.side-menu-dropdown-toggle)');
        navButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var item = btn.closest('.side-menu-item');
                var section = item ? item.getAttribute('data-section') : null;
                if (section) {
                    self._onSectionClick(section);
                }
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && self._state.isOpen) {
                self.closeMobile();
            }
        });

        var debouncedResize = UI.debounce(function () {
            if (window.innerWidth >= 1024 && self._state.isOpen) {
                self.closeMobile();
            }
        }, 200);
        window.addEventListener('resize', debouncedResize);
    },

    toggleExpanded: function () {
        this._state.isExpanded = !this._state.isExpanded;
        var menu = this._elements.sideMenu;

        if (this._state.isExpanded) {
            menu.classList.add('expanded');
            document.body.classList.add('sidebar-expanded');
        } else {
            menu.classList.remove('expanded');
            document.body.classList.remove('sidebar-expanded');
        }

        this._saveState();
    },

    toggleMobileOpen: function () {
        if (this._state.isOpen) {
            this.closeMobile();
        } else {
            this.openMobile();
        }
    },

    openMobile: function () {
        this._state.isOpen = true;
        this._elements.sideMenu.classList.add('open');
        this._elements.backdrop.classList.add('visible');
        this._elements.btnToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    },

    closeMobile: function () {
        this._state.isOpen = false;
        this._elements.sideMenu.classList.remove('open');
        this._elements.backdrop.classList.remove('visible');
        this._elements.btnToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    },

    _toggleDropdown: function (which) {
        var dropdown, stateKey;
        if (which === 'categories') {
            dropdown = this._elements.categoriesDropdown;
            stateKey = 'isCategoriesOpen';
        } else if (which === 'sources') {
            dropdown = this._elements.sourcesDropdown;
            stateKey = 'isSourcesOpen';
        }
        if (!dropdown) return;

        this._state[stateKey] = !this._state[stateKey];

        if (this._state[stateKey]) {
            dropdown.classList.add('open');
        } else {
            dropdown.classList.remove('open');
        }

        var toggle = dropdown.querySelector('.side-menu-dropdown-toggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', String(this._state[stateKey]));
        }

        // Auto-expand sidebar on desktop if collapsed and dropdown clicked
        if (window.innerWidth >= 1024 && !this._state.isExpanded && this._state[stateKey]) {
            this._state.isExpanded = true;
            this._elements.sideMenu.classList.add('expanded');
            document.body.classList.add('sidebar-expanded');
            this._saveState();
        }
    },

    _onCategoryClick: function (categoryId) {
        if (window.ViewManager) ViewManager.showView('feed');
        App.filterByCategory(categoryId);

        var items = this._elements.categoriesSubmenu.querySelectorAll('.side-menu-submenu-item');
        items.forEach(function (item) {
            if (item.getAttribute('data-category-id') === categoryId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        this._setActiveSection('categories');

        if (window.innerWidth < 1024) {
            this.closeMobile();
        }
    },

    _onSectionClick: function (section) {
        switch (section) {
            case 'feed':
                this._setActiveSection('feed');
                if (window.ViewManager) ViewManager.showView('feed');
                App.filterByCategory('all');
                break;

            case 'executive-summary':
                this._setActiveSection('executive-summary');
                if (window.ViewManager) ViewManager.showView('analytics');
                break;

            case 'market-sentiment':
                this._setActiveSection('market-sentiment');
                if (window.ViewManager) ViewManager.showView('sentiment');
                break;

            case 'settings':
                UI.toggleTheme();
                break;

            case 'profile':
                if (Auth.isLoggedIn()) {
                    var user = Auth.getCurrentUser();
                    UI.showToast('Logado como ' + user.displayName, 'info');
                } else {
                    Auth.login().catch(function (err) {
                        if (err.code !== 'auth/popup-closed-by-user') {
                            UI.showToast('Erro ao fazer login.', 'error');
                        }
                    });
                }
                break;
        }

        if (window.innerWidth < 1024) {
            this.closeMobile();
        }
    },

    _setActiveSection: function (section) {
        this._state.activeSection = section;
        var items = document.querySelectorAll('.side-menu-item');
        items.forEach(function (item) {
            if (item.getAttribute('data-section') === section) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    _syncActiveCategory: function () {
        if (!window.App || !App._state) return;

        var activeCategory = App._state.activeCategory;
        var items = this._elements.categoriesSubmenu.querySelectorAll('.side-menu-submenu-item');
        items.forEach(function (item) {
            if (item.getAttribute('data-category-id') === activeCategory) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (activeCategory !== 'all') {
            this._setActiveSection('categories');
        }
    },

    _saveState: function () {
        try {
            localStorage.setItem('ainewshub_sidebar_expanded', this._state.isExpanded ? '1' : '0');
        } catch (e) { /* noop */ }
    },

    _restoreState: function () {
        try {
            var saved = localStorage.getItem('ainewshub_sidebar_expanded');
            if (saved === '1' && window.innerWidth >= 1024) {
                this._state.isExpanded = true;
                this._elements.sideMenu.classList.add('expanded');
                document.body.classList.add('sidebar-expanded');
            }
        } catch (e) { /* noop */ }
    }
};

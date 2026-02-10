/* ===================================================
   AI News Hub - View Manager
   Handles switching between Feed and Analytics views
   =================================================== */

window.ViewManager = {

    _currentView: 'feed',

    _views: {
        'feed': {
            containerId: 'feed-view',
            onShow: null
        },
        'analytics': {
            containerId: 'analytics-view',
            onShow: function () {
                if (window.AnalyticsPage) {
                    AnalyticsPage.render(App._state.allArticles);
                }
            }
        },
        'sentiment': {
            containerId: 'sentiment-view',
            onShow: function () {
                if (window.StreamGraph) {
                    StreamGraph.render(App._state.allArticles);
                }
            }
        }
    },

    init: function () {
        // Verify containers exist
        var self = this;
        Object.keys(this._views).forEach(function (key) {
            var el = document.getElementById(self._views[key].containerId);
            if (!el) {
                console.warn('[ViewManager] Container not found: ' + self._views[key].containerId);
            }
        });
    },

    showView: function (viewName) {
        if (!this._views[viewName]) return;
        if (this._currentView === viewName) return;

        var self = this;

        // Hide all view containers
        Object.keys(this._views).forEach(function (key) {
            var el = document.getElementById(self._views[key].containerId);
            if (el) {
                el.style.display = 'none';
            }
        });

        // Show target view
        var targetEl = document.getElementById(this._views[viewName].containerId);
        if (targetEl) {
            targetEl.style.display = 'block';
        }

        this._currentView = viewName;

        // Show footer only on Feed view
        var footer = document.getElementById('site-footer');
        if (footer) {
            footer.style.display = (viewName === 'feed') ? '' : 'none';
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Call onShow callback
        if (this._views[viewName].onShow) {
            this._views[viewName].onShow();
        }
    },

    getCurrentView: function () {
        return this._currentView;
    }
};

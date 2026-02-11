/* ===================================================
   AI News Hub - Google Analytics Module
   Wraps Firebase Analytics (GA4) for event tracking
   =================================================== */

window.GA = {

    _analytics: null,
    _initialized: false,
    _debugMode: false,
    _scrollDepthMarks: {},
    _scrollHandler: null,
    _engagementStart: null,

    /**
     * Initializes Firebase Analytics.
     * Must be called AFTER firebase.initializeApp().
     * Add ?debug_mode=true to the URL to enable debug logging in console
     * and GA4 DebugView in Firebase Console.
     */
    init: function () {
        try {
            this._analytics = firebase.analytics();
            this._initialized = true;

            // Enable debug mode via URL parameter ?debug_mode=true
            this._debugMode = window.location.search.indexOf('debug_mode=true') !== -1;
            if (this._debugMode) {
                // Tell gtag to send events in debug mode (shows in Firebase DebugView)
                if (window.gtag) {
                    gtag('config', CONFIG.FIREBASE.measurementId, { debug_mode: true });
                }
                console.log('[GA] Debug mode ENABLED - events will appear in Firebase DebugView');
            }

            this._initScrollDepth();
            this._engagementStart = Date.now();
            console.log('[GA] Firebase Analytics initialized');
        } catch (e) {
            console.warn('[GA] Could not initialize Firebase Analytics:', e.message);
        }
    },

    /**
     * Logs a custom GA4 event. Safe to call before init (no-op).
     */
    logEvent: function (eventName, params) {
        if (!this._initialized || !this._analytics) return;
        try {
            var eventParams = params || {};
            if (this._debugMode) {
                eventParams.debug_mode = true;
                console.log('[GA] Event:', eventName, eventParams);
            }
            this._analytics.logEvent(eventName, eventParams);
        } catch (e) {
            console.warn('[GA] logEvent error:', e.message);
        }
    },

    /**
     * Sets the GA4 user ID (called on Firebase Auth login).
     */
    setUserId: function (userId) {
        if (!this._initialized || !this._analytics) return;
        try {
            this._analytics.setUserId(userId);
        } catch (_) { /* ignore */ }
    },

    /**
     * Sets a user property (e.g., preferred_theme).
     */
    setUserProperty: function (name, value) {
        if (!this._initialized || !this._analytics) return;
        try {
            this._analytics.setUserProperties({ [name]: value });
        } catch (_) { /* ignore */ }
    },

    // ==========================================
    // SPA Virtual Page Views
    // ==========================================

    logPageView: function (viewName) {
        var titles = {
            'feed': 'Feed de Notícias',
            'analytics': 'Resumo Executivo',
            'sentiment': 'Sentimento do Mercado'
        };
        this.logEvent('page_view', {
            page_title: titles[viewName] || viewName,
            page_location: window.location.href.split('#')[0] + '#' + viewName,
            page_path: '/' + viewName
        });
        this._resetScrollDepth();
        this._engagementStart = Date.now();
    },

    // ==========================================
    // Scroll Depth Tracking
    // ==========================================

    _initScrollDepth: function () {
        var self = this;
        this._scrollDepthMarks = { 25: false, 50: false, 75: false, 90: false, 100: false };

        this._scrollHandler = this._throttle(function () {
            self._checkScrollDepth();
        }, 500);

        window.addEventListener('scroll', this._scrollHandler, { passive: true });
    },

    _resetScrollDepth: function () {
        this._scrollDepthMarks = { 25: false, 50: false, 75: false, 90: false, 100: false };
    },

    _checkScrollDepth: function () {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        var winHeight = window.innerHeight;
        if (docHeight <= winHeight) return;

        var scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);
        var thresholds = [25, 50, 75, 90, 100];

        for (var i = 0; i < thresholds.length; i++) {
            var t = thresholds[i];
            if (scrollPercent >= t && !this._scrollDepthMarks[t]) {
                this._scrollDepthMarks[t] = true;
                this.logEvent('scroll_depth', {
                    percent: t,
                    view: (window.ViewManager && ViewManager.getCurrentView()) || 'feed'
                });
            }
        }
    },

    // ==========================================
    // Engagement Timing
    // ==========================================

    logViewEngagement: function (viewName) {
        if (!this._engagementStart) return;
        var duration = Math.round((Date.now() - this._engagementStart) / 1000);
        if (duration > 1) {
            this.logEvent('view_engagement', {
                view: viewName,
                duration_seconds: duration
            });
        }
    },

    // ==========================================
    // Utility
    // ==========================================

    _throttle: function (fn, wait) {
        var lastTime = 0;
        return function () {
            var now = Date.now();
            if (now - lastTime >= wait) {
                lastTime = now;
                fn.apply(this, arguments);
            }
        };
    }
};

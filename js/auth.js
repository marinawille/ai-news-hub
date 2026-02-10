/* ===================================================
   AI News Hub - Authentication Module
   Wraps Firebase Auth with Google sign-in
   =================================================== */

window.Auth = {

    _currentUser: null,
    _onAuthChangeCallbacks: [],

    /**
     * Initializes Firebase Auth and sets up auth state listener.
     * Must be called after firebase.initializeApp().
     */
    init: function() {
        var self = this;

        firebase.auth().onAuthStateChanged(function(firebaseUser) {
            self._currentUser = self._formatUser(firebaseUser);

            for (var i = 0; i < self._onAuthChangeCallbacks.length; i++) {
                try {
                    self._onAuthChangeCallbacks[i](self._currentUser);
                } catch (e) {
                    console.error('[AI News Hub] Auth callback error:', e);
                }
            }
        });
    },

    /**
     * Registers a callback for auth state changes.
     * callback(user) where user is { uid, displayName, email, photoURL } or null.
     */
    onAuthChange: function(callback) {
        if (typeof callback === 'function') {
            this._onAuthChangeCallbacks.push(callback);
        }
    },

    /**
     * Opens Google sign-in popup. Falls back to redirect if popup is blocked.
     * Returns a Promise.
     */
    login: function() {
        var provider = new firebase.auth.GoogleAuthProvider();

        return firebase.auth().signInWithPopup(provider).catch(function(err) {
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
                // Fallback to redirect for mobile or popup-blocked scenarios
                return firebase.auth().signInWithRedirect(provider);
            }
            throw err;
        });
    },

    /**
     * Signs out the current user. Returns a Promise.
     */
    logout: function() {
        return firebase.auth().signOut();
    },

    /**
     * Returns the current user object or null (synchronous).
     */
    getCurrentUser: function() {
        return this._currentUser;
    },

    /**
     * Returns true if a user is currently logged in.
     */
    isLoggedIn: function() {
        return this._currentUser !== null;
    },

    /**
     * Extracts a clean user object from the Firebase User.
     */
    _formatUser: function(firebaseUser) {
        if (!firebaseUser) return null;

        return {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Usuario',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || ''
        };
    }
};

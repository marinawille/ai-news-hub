/* ===================================================
   AI News Hub - Vote Service Module
   Manages upvotes via Firestore with local caching
   =================================================== */

window.VoteService = {

    _db: null,
    _voteCounts: {},     // { articleId: number }
    _userVotes: {},      // { articleId: { voted: true, docId: string } }
    _rateLimitMap: {},   // { articleId: timestamp }

    /**
     * Initializes Firestore reference.
     * Must be called after firebase.initializeApp().
     */
    init: function() {
        this._db = firebase.firestore();
    },

    /**
     * Loads all votes for the given user into the local cache.
     * Called on login.
     */
    loadUserVotes: function(userId) {
        var self = this;
        self._userVotes = {};

        return this._db.collection('votes')
            .where('userId', '==', userId)
            .get()
            .then(function(snapshot) {
                snapshot.forEach(function(doc) {
                    var data = doc.data();
                    self._userVotes[data.articleId] = {
                        voted: true,
                        docId: doc.id
                    };
                });
            })
            .catch(function(err) {
                console.warn('[AI News Hub] Could not load user votes:', err.message);
            });
    },

    /**
     * Clears user vote cache. Called on logout.
     */
    clearUserVotes: function() {
        this._userVotes = {};
    },

    /**
     * Returns the cached vote count for an article.
     */
    getVoteCount: function(articleId) {
        return this._voteCounts[articleId] || 0;
    },

    /**
     * Returns whether the current user has voted on an article.
     */
    hasUserVoted: function(articleId) {
        return !!(this._userVotes[articleId] && this._userVotes[articleId].voted);
    },

    /**
     * Toggles vote on an article. Returns Promise<{ voted, newCount }>.
     * Uses Firestore batch writes for atomicity.
     */
    toggleVote: function(articleId) {
        var self = this;

        if (!Auth.isLoggedIn()) {
            return Promise.reject(new Error('NOT_LOGGED_IN'));
        }

        // Rate limit check
        var now = Date.now();
        var lastVote = this._rateLimitMap[articleId] || 0;
        if (now - lastVote < CONFIG.SETTINGS.voteRateLimitMs) {
            return Promise.reject(new Error('RATE_LIMITED'));
        }
        this._rateLimitMap[articleId] = now;

        var userId = Auth.getCurrentUser().uid;
        var hasVoted = this.hasUserVoted(articleId);
        var batch = this._db.batch();
        var countRef = this._db.collection('voteCounts').doc(articleId);

        if (hasVoted) {
            // Remove vote
            var voteDocId = this._userVotes[articleId].docId;
            var voteRef = this._db.collection('votes').doc(voteDocId);
            batch.delete(voteRef);
            batch.set(countRef, {
                total: firebase.firestore.FieldValue.increment(-1),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Optimistic update
            delete self._userVotes[articleId];
            self._voteCounts[articleId] = Math.max(0, (self._voteCounts[articleId] || 1) - 1);

            return batch.commit().then(function() {
                return { voted: false, newCount: self._voteCounts[articleId] };
            }).catch(function(err) {
                // Rollback optimistic update
                self._userVotes[articleId] = { voted: true, docId: voteDocId };
                self._voteCounts[articleId] = (self._voteCounts[articleId] || 0) + 1;
                throw err;
            });

        } else {
            // Add vote
            var newVoteRef = this._db.collection('votes').doc();
            batch.set(newVoteRef, {
                articleId: articleId,
                userId: userId,
                votedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            batch.set(countRef, {
                total: firebase.firestore.FieldValue.increment(1),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Optimistic update
            self._userVotes[articleId] = { voted: true, docId: newVoteRef.id };
            self._voteCounts[articleId] = (self._voteCounts[articleId] || 0) + 1;

            return batch.commit().then(function() {
                return { voted: true, newCount: self._voteCounts[articleId] };
            }).catch(function(err) {
                // Rollback optimistic update
                delete self._userVotes[articleId];
                self._voteCounts[articleId] = Math.max(0, (self._voteCounts[articleId] || 1) - 1);
                throw err;
            });
        }
    },

    /**
     * Batch-loads vote counts for a list of article IDs.
     * Populates _voteCounts cache.
     */
    loadVoteCountsForArticles: function(articleIds) {
        var self = this;

        if (!articleIds || articleIds.length === 0) {
            return Promise.resolve();
        }

        // Firestore 'in' query supports max 30 items per batch
        var batches = [];
        for (var i = 0; i < articleIds.length; i += 30) {
            batches.push(articleIds.slice(i, i + 30));
        }

        var promises = batches.map(function(batchIds) {
            return self._db.collection('voteCounts')
                .where(firebase.firestore.FieldPath.documentId(), 'in', batchIds)
                .get()
                .then(function(snapshot) {
                    snapshot.forEach(function(doc) {
                        var data = doc.data();
                        self._voteCounts[doc.id] = data.total || 0;
                    });
                });
        });

        return Promise.all(promises).catch(function(err) {
            console.warn('[AI News Hub] Could not load vote counts:', err.message);
        });
    },

    /**
     * Queries votes from the last N hours and aggregates counts.
     * Returns Promise<[{ articleId, count }]> sorted by count desc.
     */
    getPopularArticleIds: function(hours) {
        var self = this;
        var cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        return this._db.collection('votes')
            .where('votedAt', '>=', cutoff)
            .get()
            .then(function(snapshot) {
                var counts = {};

                snapshot.forEach(function(doc) {
                    var data = doc.data();
                    if (data.articleId) {
                        counts[data.articleId] = (counts[data.articleId] || 0) + 1;
                    }
                });

                // Also update the local vote counts cache
                Object.keys(counts).forEach(function(id) {
                    if (!self._voteCounts[id] || counts[id] > self._voteCounts[id]) {
                        self._voteCounts[id] = counts[id];
                    }
                });

                var result = Object.keys(counts).map(function(id) {
                    return { articleId: id, count: counts[id] };
                });

                result.sort(function(a, b) {
                    return b.count - a.count;
                });

                return result;
            });
    }
};

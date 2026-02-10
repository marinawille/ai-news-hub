/* ===================================================
   AI News Hub - Feed Service
   Handles fetching, parsing, and normalizing RSS feeds
   =================================================== */

window.FeedService = {

    _proxyIndex: 0,

    /**
     * Returns a proxied URL using round-robin proxy selection.
     */
    getProxiedUrl: function(feedUrl) {
        var proxies = CONFIG.CORS_PROXIES;
        var proxy = proxies[this._proxyIndex % proxies.length];
        return proxy(feedUrl);
    },

    /**
     * Advances to the next proxy in round-robin order.
     */
    nextProxy: function() {
        this._proxyIndex = (this._proxyIndex + 1) % CONFIG.CORS_PROXIES.length;
    },

    /**
     * Fetches a URL with a timeout using AbortController.
     */
    fetchWithTimeout: function(url, timeoutMs) {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, timeoutMs || CONFIG.SETTINGS.fetchTimeoutMs);

        return fetch(url, { signal: controller.signal })
            .then(function(response) {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.text();
            })
            .catch(function(err) {
                clearTimeout(timeoutId);
                throw err;
            });
    },

    /**
     * Fetches a single RSS feed, trying each CORS proxy on failure.
     */
    fetchFeedXml: function(feedUrl) {
        var self = this;
        var proxies = CONFIG.CORS_PROXIES;
        var attempts = proxies.length;

        function tryProxy(attempt) {
            if (attempt >= attempts) {
                return Promise.reject(new Error('All proxies failed for ' + feedUrl));
            }

            var proxiedUrl = self.getProxiedUrl(feedUrl);
            self.nextProxy();

            return self.fetchWithTimeout(proxiedUrl).catch(function() {
                return tryProxy(attempt + 1);
            });
        }

        return tryProxy(0);
    },

    /**
     * Decodes HTML entities in a string.
     */
    decodeHtml: function(html) {
        var textarea = document.createElement('textarea');
        textarea.innerHTML = html;
        return textarea.value;
    },

    /**
     * Strips HTML tags from a string and truncates.
     */
    stripHtml: function(html, maxLength) {
        if (!html) return '';
        var text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        text = this.decodeHtml(text);
        if (maxLength && text.length > maxLength) {
            text = text.substring(0, maxLength).trim() + '...';
        }
        return text;
    },

    /**
     * Extracts thumbnail URL from an RSS item element.
     * Checks media:content, media:thumbnail, enclosure, and img tags.
     */
    extractThumbnail: function(item) {
        // 1. media:thumbnail
        var mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
        if (mediaThumbnail) {
            var url = mediaThumbnail.getAttribute('url');
            if (url) return url;
        }

        // 2. media:content with image type
        var mediaContent = item.querySelectorAll('media\\:content, content');
        for (var i = 0; i < mediaContent.length; i++) {
            var el = mediaContent[i];
            var medium = el.getAttribute('medium');
            var type = el.getAttribute('type') || '';
            var mUrl = el.getAttribute('url');
            if (mUrl && (medium === 'image' || type.indexOf('image') === 0)) {
                return mUrl;
            }
        }

        // 3. enclosure with image type
        var enclosure = item.querySelector('enclosure[type^="image"]');
        if (enclosure) {
            var eUrl = enclosure.getAttribute('url');
            if (eUrl) return eUrl;
        }

        // 4. Search for img tag in description or content:encoded
        var desc = item.querySelector('description');
        var contentEncoded = item.querySelector('content\\:encoded, encoded');
        var htmlContent = '';
        if (contentEncoded) htmlContent = contentEncoded.textContent || '';
        else if (desc) htmlContent = desc.textContent || '';

        var imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
            return imgMatch[1];
        }

        return null;
    },

    /**
     * Generates a simple hash ID from a string.
     */
    hashId: function(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'art_' + Math.abs(hash).toString(36);
    },

    /**
     * Parses an RSS 2.0 XML string into normalized article objects.
     */
    parseRss: function(xmlString, feedMeta) {
        var self = this;
        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlString, 'text/xml');

        // Check for parse errors
        var parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parse error for ' + feedMeta.name);
        }

        var items = doc.querySelectorAll('item');
        var articles = [];
        var maxItems = CONFIG.SETTINGS.maxArticlesPerFeed;

        for (var i = 0; i < items.length && i < maxItems; i++) {
            var item = items[i];

            var titleEl = item.querySelector('title');
            var linkEl = item.querySelector('link');
            var descEl = item.querySelector('description');
            var pubDateEl = item.querySelector('pubDate');
            var dcDateEl = item.querySelector('dc\\:date, date');

            var title = titleEl ? self.decodeHtml(titleEl.textContent.trim()) : '';
            var link = linkEl ? linkEl.textContent.trim() : '';
            var description = descEl ? self.stripHtml(descEl.textContent, 200) : '';
            var dateStr = pubDateEl ? pubDateEl.textContent.trim() :
                         (dcDateEl ? dcDateEl.textContent.trim() : '');
            var publishedAt = dateStr ? new Date(dateStr) : new Date();

            // Skip if invalid date
            if (isNaN(publishedAt.getTime())) {
                publishedAt = new Date();
            }

            // Skip items without title or link
            if (!title || !link) continue;

            var thumbnail = self.extractThumbnail(item);

            articles.push({
                id: self.hashId(link),
                title: title,
                description: description,
                url: link,
                source: feedMeta.name,
                thumbnail: thumbnail,
                publishedAt: publishedAt,
                category: feedMeta.defaultCategory,
                matchedKeywords: []
            });
        }

        return articles;
    },

    /**
     * Parses an Atom XML string into normalized article objects.
     */
    parseAtom: function(xmlString, feedMeta) {
        var self = this;
        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlString, 'text/xml');

        var parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parse error for ' + feedMeta.name);
        }

        var entries = doc.querySelectorAll('entry');
        var articles = [];
        var maxItems = CONFIG.SETTINGS.maxArticlesPerFeed;

        for (var i = 0; i < entries.length && i < maxItems; i++) {
            var entry = entries[i];

            var titleEl = entry.querySelector('title');
            var linkEl = entry.querySelector('link[rel="alternate"], link[href]');
            var summaryEl = entry.querySelector('summary');
            var contentEl = entry.querySelector('content');
            var publishedEl = entry.querySelector('published');
            var updatedEl = entry.querySelector('updated');

            var title = titleEl ? self.decodeHtml(titleEl.textContent.trim()) : '';
            var link = linkEl ? linkEl.getAttribute('href') : '';
            var descText = summaryEl ? summaryEl.textContent : (contentEl ? contentEl.textContent : '');
            var description = self.stripHtml(descText, 200);
            var dateStr = publishedEl ? publishedEl.textContent.trim() :
                         (updatedEl ? updatedEl.textContent.trim() : '');
            var publishedAt = dateStr ? new Date(dateStr) : new Date();

            if (isNaN(publishedAt.getTime())) {
                publishedAt = new Date();
            }

            if (!title || !link) continue;

            articles.push({
                id: self.hashId(link),
                title: title,
                description: description,
                url: link,
                source: feedMeta.name,
                thumbnail: null,
                publishedAt: publishedAt,
                category: feedMeta.defaultCategory,
                matchedKeywords: []
            });
        }

        return articles;
    },

    /**
     * Detects whether XML is RSS or Atom and parses accordingly.
     */
    parseFeed: function(xmlString, feedMeta) {
        // Detect Atom by looking for <feed> root element
        if (xmlString.indexOf('<feed') !== -1 && xmlString.indexOf('xmlns="http://www.w3.org/2005/Atom"') !== -1) {
            return this.parseAtom(xmlString, feedMeta);
        }
        return this.parseRss(xmlString, feedMeta);
    },

    // -----------------------------------------------
    // Legacy Twitter methods (kept for backward compat)
    // -----------------------------------------------

    /**
     * Builds the RSS URL for a Twitter/X account based on the configured bridge.
     * DEPRECATED: Use the cascade system (SOCIAL_ACCOUNTS) instead.
     */
    getTwitterRssUrl: function(handle) {
        var bridge = CONFIG.TWITTER_RSS_BRIDGE || 'rsshub';
        switch (bridge) {
            case 'nitter':
                return 'https://nitter.privacydev.net/' + handle + '/rss';
            case 'rssbridge':
                return 'https://rss-bridge.org/bridge01/?action=display&bridge=TwitterBridge&context=By+username&u=' + handle + '&norep=on&noretweet=on&format=Atom';
            case 'custom':
                if (typeof CONFIG.TWITTER_RSS_CUSTOM_FN === 'function') {
                    return CONFIG.TWITTER_RSS_CUSTOM_FN(handle);
                }
                console.warn('[AI News Hub] TWITTER_RSS_CUSTOM_FN not configured, falling back to rsshub');
                return 'https://rsshub.app/twitter/user/' + handle;
            case 'rsshub':
            default:
                return 'https://rsshub.app/twitter/user/' + handle;
        }
    },

    /**
     * Converts TWITTER_ACCOUNTS config into feed objects.
     * DEPRECATED: Use fetchSocialFeeds() instead.
     */
    getTwitterFeeds: function() {
        var self = this;
        var accounts = CONFIG.TWITTER_ACCOUNTS || [];
        return accounts.map(function(account) {
            return {
                name: account.name + ' (X)',
                url: self.getTwitterRssUrl(account.handle),
                type: 'rss',
                defaultCategory: account.category || 'bigtech-negocios',
                language: 'en'
            };
        });
    },

    // -----------------------------------------------
    // Social Media Cascade System (RSSHub -> Bluesky -> Nitter)
    // -----------------------------------------------

    /**
     * Builds RSS URL via self-hosted RSSHub.
     */
    getRsshubUrl: function(twitterHandle) {
        var base = (CONFIG.RSSHUB_BASE_URL || 'https://rsshub.app').replace(/\/+$/, '');
        return base + '/twitter/user/' + twitterHandle;
    },

    /**
     * Builds RSS URL for a Bluesky account (native RSS, free).
     * Returns null if handle is falsy.
     */
    getBlueskyRssUrl: function(blueskyHandle) {
        if (!blueskyHandle) return null;
        return 'https://bsky.app/profile/' + blueskyHandle + '/rss';
    },

    /**
     * Builds an array of Nitter RSS URLs (one per configured instance).
     */
    getNitterUrls: function(twitterHandle) {
        var instances = CONFIG.NITTER_INSTANCES || ['https://nitter.privacydev.net'];
        var urls = [];
        for (var i = 0; i < instances.length; i++) {
            var base = instances[i].replace(/\/+$/, '');
            urls.push(base + '/' + twitterHandle + '/rss');
        }
        return urls;
    },

    /**
     * Fetches a single social account using cascading fallback.
     * Tries each source in SOCIAL_CASCADE_STRATEGY order.
     * Within Nitter, tries each instance in order.
     * Returns Promise<{ feed, articles, error? }>
     */
    fetchSocialFeedWithCascade: function(account) {
        var self = this;
        var strategy = CONFIG.SOCIAL_CASCADE_STRATEGY || ['rsshub', 'bluesky', 'nitter'];
        var feedMeta = {
            name: account.name + ' (Social)',
            type: 'rss',
            defaultCategory: account.category || 'bigtech-negocios',
            language: 'en'
        };

        // Build ordered list of URLs to attempt
        var attempts = [];
        for (var s = 0; s < strategy.length; s++) {
            var source = strategy[s];
            if (source === 'rsshub' && account.twitterHandle) {
                attempts.push({ url: self.getRsshubUrl(account.twitterHandle), label: 'RSSHub' });
            } else if (source === 'bluesky' && account.blueskyHandle) {
                var bskyUrl = self.getBlueskyRssUrl(account.blueskyHandle);
                // Try direct fetch first (bsky.app may support CORS natively)
                attempts.push({ url: bskyUrl, label: 'Bluesky', direct: true });
                // Then try via CORS proxy as fallback
                attempts.push({ url: bskyUrl, label: 'Bluesky-proxy' });
            } else if (source === 'nitter' && account.twitterHandle) {
                var nitterUrls = self.getNitterUrls(account.twitterHandle);
                for (var n = 0; n < nitterUrls.length; n++) {
                    attempts.push({ url: nitterUrls[n], label: 'Nitter#' + (n + 1) });
                }
            }
        }

        if (attempts.length === 0) {
            return Promise.resolve({ feed: feedMeta, articles: [], error: 'No handles configured' });
        }

        function tryNext(index) {
            if (index >= attempts.length) {
                console.warn('[AI News Hub] All cascade sources failed for ' + account.name);
                return Promise.resolve({ feed: feedMeta, articles: [], error: 'All sources failed' });
            }

            var attempt = attempts[index];
            var fetchPromise = attempt.direct
                ? self.fetchWithTimeout(attempt.url)
                : self.fetchFeedXml(attempt.url);
            return fetchPromise
                .then(function(xml) {
                    var articles = self.parseFeed(xml, feedMeta);
                    if (articles.length === 0) {
                        console.info('[AI News Hub] ' + attempt.label + ' returned 0 items for ' + account.name + ', trying next...');
                        return tryNext(index + 1);
                    }
                    feedMeta.name = account.name + ' (' + attempt.label + ')';
                    for (var i = 0; i < articles.length; i++) {
                        articles[i].source = feedMeta.name;
                    }
                    console.info('[AI News Hub] Fetched ' + articles.length + ' items for ' + account.name + ' via ' + attempt.label);
                    return { feed: feedMeta, articles: articles };
                })
                .catch(function(err) {
                    console.info('[AI News Hub] ' + attempt.label + ' failed for ' + account.name + ': ' + err.message + ', trying next...');
                    return tryNext(index + 1);
                });
        }

        return tryNext(0);
    },

    /**
     * Fetches all SOCIAL_ACCOUNTS using cascade fallback.
     * Falls back to legacy TWITTER_ACCOUNTS if SOCIAL_ACCOUNTS is empty.
     * Returns Promise<{ articles, failedFeeds }>
     */
    fetchSocialFeeds: function() {
        var self = this;
        var accounts = CONFIG.SOCIAL_ACCOUNTS || [];

        // Backward compat: use legacy TWITTER_ACCOUNTS if no SOCIAL_ACCOUNTS
        if (accounts.length === 0) {
            var legacyFeeds = this.getTwitterFeeds();
            if (legacyFeeds.length === 0) {
                return Promise.resolve({ articles: [], failedFeeds: [] });
            }
            var legacyPromises = legacyFeeds.map(function(feed) {
                return self.fetchFeedXml(feed.url)
                    .then(function(xml) {
                        return { feed: feed, articles: self.parseFeed(xml, feed) };
                    })
                    .catch(function(err) {
                        return { feed: feed, articles: [], error: err.message };
                    });
            });
            return Promise.allSettled(legacyPromises).then(function(results) {
                var articles = [];
                var failed = [];
                results.forEach(function(r) {
                    if (r.status === 'fulfilled') {
                        if (r.value.error) failed.push(r.value.feed.name);
                        else articles = articles.concat(r.value.articles);
                    }
                });
                return { articles: articles, failedFeeds: failed };
            });
        }

        // Cascade: all accounts in parallel, each account tries sources sequentially
        var promises = accounts.map(function(account) {
            return self.fetchSocialFeedWithCascade(account);
        });

        return Promise.allSettled(promises).then(function(results) {
            var allArticles = [];
            var failedFeeds = [];
            results.forEach(function(result) {
                if (result.status === 'fulfilled') {
                    var data = result.value;
                    if (data.error) {
                        failedFeeds.push(data.feed.name);
                    } else {
                        allArticles = allArticles.concat(data.articles);
                    }
                } else {
                    failedFeeds.push('unknown social');
                }
            });
            return { articles: allArticles, failedFeeds: failedFeeds };
        });
    },

    /**
     * Fetches all configured feeds (RSS + social) in parallel.
     * Returns { articles: [...], failedFeeds: [...] }
     */
    fetchAllFeeds: function() {
        var self = this;
        var rssFeeds = CONFIG.FEEDS;

        // Fetch regular RSS feeds
        var rssPromises = rssFeeds.map(function(feed) {
            return self.fetchFeedXml(feed.url)
                .then(function(xml) {
                    return { feed: feed, articles: self.parseFeed(xml, feed) };
                })
                .catch(function(err) {
                    console.warn('[AI News Hub] Failed to fetch ' + feed.name + ':', err.message);
                    return { feed: feed, articles: [], error: err.message };
                });
        });

        // Fetch social feeds with cascade (runs in parallel with RSS feeds)
        var socialPromise = self.fetchSocialFeeds();

        return Promise.all([
            Promise.allSettled(rssPromises),
            socialPromise
        ]).then(function(results) {
            var rssResults = results[0];
            var socialResult = results[1];

            var allArticles = [];
            var failedFeeds = [];

            // Process RSS results
            rssResults.forEach(function(result) {
                if (result.status === 'fulfilled') {
                    var data = result.value;
                    if (data.error) {
                        failedFeeds.push(data.feed.name);
                    } else {
                        allArticles = allArticles.concat(data.articles);
                    }
                } else {
                    failedFeeds.push('unknown');
                }
            });

            // Merge social results
            allArticles = allArticles.concat(socialResult.articles);
            failedFeeds = failedFeeds.concat(socialResult.failedFeeds);

            return {
                articles: allArticles,
                failedFeeds: failedFeeds
            };
        });
    }
};

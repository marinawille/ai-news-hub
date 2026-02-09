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

    /**
     * Fetches all configured feeds in parallel.
     * Returns { articles: [...], failedFeeds: [...] }
     */
    fetchAllFeeds: function() {
        var self = this;
        var feeds = CONFIG.FEEDS;

        var promises = feeds.map(function(feed) {
            return self.fetchFeedXml(feed.url)
                .then(function(xml) {
                    return { feed: feed, articles: self.parseFeed(xml, feed) };
                })
                .catch(function(err) {
                    console.warn('[AI News Hub] Failed to fetch ' + feed.name + ':', err.message);
                    return { feed: feed, articles: [], error: err.message };
                });
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
                    failedFeeds.push('unknown');
                }
            });

            return {
                articles: allArticles,
                failedFeeds: failedFeeds
            };
        });
    }
};

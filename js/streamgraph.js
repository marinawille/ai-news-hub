/* ===================================================
   AI News Hub - Streamgraph (Sentiment Barometer)
   D3.js dynamic streamgraph with temporal filters,
   smooth transitions, hover interactions, and
   smart peak annotations.
   =================================================== */

window.StreamGraph = {

    _state: {
        activeRange: '7d',
        customStart: null,
        customEnd: null,
        articles: [],
        rendered: false,
        svg: null,
        g: null,
        width: 0,
        height: 0
    },

    _colorsDark: {
        positive: '#BCCA24',
        neutral:  '#4ECDC4',
        negative: '#E0442F'
    },

    _colorsLight: {
        positive: '#8B9A1B',
        neutral:  '#32565E',
        negative: '#C4372A'
    },

    _getColors: function () {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDark ? this._colorsDark : this._colorsLight;
    },

    _layerOrder: ['negative', 'neutral', 'positive'],

    _margin: { top: 30, right: 30, bottom: 40, left: 50 },

    _elements: {},

    _resizeTimer: null,

    _themeObserver: null,

    // ==========================================
    // Initialization
    // ==========================================

    init: function () {
        this._cacheElements();
        this._bindFilterEvents();
        this._bindResizeObserver();
        this._bindThemeObserver();
    },

    _cacheElements: function () {
        this._elements = {
            chart: document.getElementById('streamgraph-chart'),
            stats: document.getElementById('streamgraph-stats'),
            tooltip: document.getElementById('streamgraph-tooltip'),
            customRange: document.getElementById('sg-custom-range'),
            dateStart: document.getElementById('sg-date-start'),
            dateEnd: document.getElementById('sg-date-end'),
            applyCustom: document.getElementById('sg-apply-custom')
        };
    },

    _bindFilterEvents: function () {
        var self = this;
        var buttons = document.querySelectorAll('.streamgraph-filter-btn');

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var range = btn.getAttribute('data-range');

                // Update active state
                buttons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                if (range === 'custom') {
                    self._showCustomRange();
                } else {
                    self._hideCustomRange();
                    self._changeRange(range);
                }
            });
        });

        if (this._elements.applyCustom) {
            this._elements.applyCustom.addEventListener('click', function () {
                self._applyCustomRange();
            });
        }
    },

    _bindResizeObserver: function () {
        var self = this;
        if (window.ResizeObserver && this._elements.chart) {
            var ro = new ResizeObserver(function () {
                clearTimeout(self._resizeTimer);
                self._resizeTimer = setTimeout(function () {
                    if (self._state.rendered) {
                        self._setupSvg();
                        self._update(false);
                    }
                }, 200);
            });
            ro.observe(this._elements.chart);
        }
    },

    _bindThemeObserver: function () {
        var self = this;
        this._themeObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                if (m.attributeName === 'data-theme' && self._state.rendered) {
                    self._update(false);
                    self._updateLegendColors();
                }
            });
        });
        this._themeObserver.observe(document.documentElement, { attributes: true });
    },

    _updateLegendColors: function () {
        var colors = this._getColors();
        var dots = document.querySelectorAll('.streamgraph-legend-dot');
        if (dots.length >= 3) {
            dots[0].style.background = colors.positive;
            dots[1].style.background = colors.neutral;
            dots[2].style.background = colors.negative;
        }
    },

    // ==========================================
    // Render Entry Point
    // ==========================================

    render: function (articles) {
        if (!this._elements.chart) this._cacheElements();
        this._state.articles = articles || [];

        if (this._state.articles.length === 0) {
            this._renderEmpty();
            return;
        }

        this._setupSvg();
        this._update(true);
        this._state.rendered = true;
        this._updateLegendColors();
    },

    _renderEmpty: function () {
        if (!this._elements.chart) return;
        this._elements.chart.innerHTML =
            '<div class="streamgraph-empty">' +
            '<svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">' +
            '<polyline points="52 12 38 12 35 21 29 3 26 12 12 12"/>' +
            '</svg>' +
            '<p>Sem dados suficientes para o periodo selecionado</p>' +
            '</div>';
        this._state.svg = null;
        this._state.g = null;
        if (this._elements.stats) this._elements.stats.innerHTML = '';
    },

    // ==========================================
    // SVG Setup
    // ==========================================

    _setupSvg: function () {
        var container = this._elements.chart;
        if (!container) return;

        var rect = container.getBoundingClientRect();
        var w = rect.width - 32; // padding
        var h;

        if (window.innerWidth >= 1024) {
            h = 420;
        } else if (window.innerWidth >= 640) {
            h = 350;
        } else {
            h = 280;
        }

        this._state.width = w;
        this._state.height = h;

        // Clear all previous content (SVG, empty-state divs, etc.)
        container.innerHTML = '';

        this._state.svg = d3.select(container)
            .append('svg')
            .attr('width', w)
            .attr('height', h)
            .attr('viewBox', '0 0 ' + w + ' ' + h)
            .style('overflow', 'visible');

        this._state.g = this._state.svg.append('g')
            .attr('transform', 'translate(' + this._margin.left + ',' + this._margin.top + ')');
    },

    // ==========================================
    // Data Pipeline
    // ==========================================

    _getDateRange: function () {
        var now = new Date();
        var range = this._state.activeRange;

        if (range === 'custom' && this._state.customStart && this._state.customEnd) {
            return {
                start: this._state.customStart,
                end: this._state.customEnd
            };
        }

        var days = { '3d': 3, '7d': 7, '30d': 30 }[range] || 7;
        var start = new Date(now.getTime() - days * 24 * 3600000);
        return { start: start, end: now };
    },

    _getIntervalMs: function () {
        var range = this._state.activeRange;
        if (range === '3d') return 6 * 3600000;     // 6-hour buckets
        if (range === 'custom') {
            var dateRange = this._getDateRange();
            var span = dateRange.end.getTime() - dateRange.start.getTime();
            if (span <= 3 * 24 * 3600000) return 6 * 3600000;
            return 24 * 3600000;
        }
        return 24 * 3600000; // daily buckets for 7d and 30d
    },

    _getTimeFormat: function () {
        var range = this._state.activeRange;
        if (range === '3d') return '%d/%m %Hh';
        if (range === 'custom') {
            var dateRange = this._getDateRange();
            var span = dateRange.end.getTime() - dateRange.start.getTime();
            if (span <= 3 * 24 * 3600000) return '%d/%m %Hh';
            return '%d/%m';
        }
        return '%d/%m';
    },

    _aggregateByTime: function () {
        var dateRange = this._getDateRange();
        var intervalMs = this._getIntervalMs();
        var cutoff = dateRange.start.getTime();
        var endMs = dateRange.end.getTime();

        // Filter articles in range
        var filtered = this._state.articles.filter(function (a) {
            var t = a.publishedAt instanceof Date ? a.publishedAt.getTime() : new Date(a.publishedAt).getTime();
            return t >= cutoff && t <= endMs;
        });

        // Generate time buckets
        var buckets = [];
        for (var t = cutoff; t <= endMs; t += intervalMs) {
            buckets.push({
                date: new Date(t),
                positive: 0,
                neutral: 0,
                negative: 0,
                _articles: { positive: [], neutral: [], negative: [] }
            });
        }

        if (buckets.length === 0) return [];

        // Assign articles to buckets
        filtered.forEach(function (a) {
            var sentiment = SentimentService.classify(a);
            var aTime = a.publishedAt instanceof Date ? a.publishedAt.getTime() : new Date(a.publishedAt).getTime();
            var bucketIdx = Math.floor((aTime - cutoff) / intervalMs);
            bucketIdx = Math.max(0, Math.min(bucketIdx, buckets.length - 1));
            buckets[bucketIdx][sentiment]++;
            buckets[bucketIdx]._articles[sentiment].push(a);
        });

        return buckets;
    },

    // ==========================================
    // Core Update (Render/Transition)
    // ==========================================

    _update: function (animate) {
        var g = this._state.g;
        if (!g) return;

        var buckets = this._aggregateByTime();

        if (buckets.length < 2) {
            this._renderEmpty();
            return;
        }

        var m = this._margin;
        var innerWidth = this._state.width - m.left - m.right;
        var innerHeight = this._state.height - m.top - m.bottom;

        // Scales
        var x = d3.scaleTime()
            .domain(d3.extent(buckets, function (d) { return d.date; }))
            .range([0, innerWidth]);

        // Stack
        var stack = d3.stack()
            .keys(this._layerOrder)
            .offset(d3.stackOffsetSilhouette)
            .order(d3.stackOrderNone);

        var series = stack(buckets);

        var y = d3.scaleLinear()
            .domain([
                d3.min(series, function (s) { return d3.min(s, function (d) { return d[0]; }); }),
                d3.max(series, function (s) { return d3.max(s, function (d) { return d[1]; }); })
            ])
            .range([innerHeight, 0]);

        // Area generator
        var area = d3.area()
            .x(function (d) { return x(d.data.date); })
            .y0(function (d) { return y(d[0]); })
            .y1(function (d) { return y(d[1]); })
            .curve(d3.curveBasis);

        // Theme-aware styling
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var strokeColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
        var strokeWidth = isDark ? 1 : 0.5;

        var self = this;
        var duration = animate ? 800 : 400;

        // DATA JOIN
        var layers = g.selectAll('.stream-layer')
            .data(series, function (d) { return d.key; });

        // ENTER
        var enter = layers.enter()
            .append('path')
            .attr('class', 'stream-layer')
            .attr('d', area)
            .style('fill', function (d) { return self._getColors()[d.key]; })
            .style('fill-opacity', 0)
            .style('stroke', strokeColor)
            .style('stroke-width', strokeWidth + 'px');

        // Hover events on enter
        enter
            .on('mouseenter', function (event, d) { self._onLayerHover(d.key, true); })
            .on('mouseleave', function () { self._onLayerHover(null, false); })
            .on('mousemove', function (event, d) { self._onLayerMouseMove(event, d, buckets, x); });

        // ENTER transition
        enter.transition()
            .duration(duration)
            .delay(function (d, i) { return animate ? i * 100 : 0; })
            .ease(d3.easeCubicInOut)
            .style('fill-opacity', 0.85);

        // UPDATE
        layers.transition()
            .duration(duration)
            .ease(d3.easeCubicInOut)
            .attr('d', area)
            .style('stroke', strokeColor)
            .style('stroke-width', strokeWidth + 'px');

        // EXIT
        layers.exit()
            .transition()
            .duration(300)
            .style('fill-opacity', 0)
            .remove();

        // Axes
        this._renderAxis(g, x, innerHeight);
        this._renderYLabel(g, innerHeight);

        // Annotations
        this._renderAnnotations(g, buckets, x, y, series, innerWidth, innerHeight, animate);

        // Stats
        this._renderStats(buckets);
    },

    // ==========================================
    // Axis
    // ==========================================

    _renderAxis: function (g, x, innerHeight) {
        var fmt = this._getTimeFormat();

        g.selectAll('.x-axis').remove();

        var tickCount = window.innerWidth < 640 ? 4 : 8;

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + innerHeight + ')')
            .call(
                d3.axisBottom(x)
                    .ticks(tickCount)
                    .tickFormat(d3.timeFormat(fmt))
            )
            .selectAll('text')
            .style('fill', 'var(--text-muted)')
            .style('font-size', '11px');

        g.selectAll('.x-axis .domain').style('stroke', 'var(--border-color)');
        g.selectAll('.x-axis .tick line').style('stroke', 'var(--border-color)');
    },

    _renderYLabel: function (g, innerHeight) {
        g.selectAll('.y-label').remove();

        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        g.append('text')
            .attr('class', 'y-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(innerHeight / 2))
            .attr('y', -38)
            .attr('text-anchor', 'middle')
            .attr('fill', isDark ? '#b0b0c8' : '#666680')
            .attr('font-size', '11px')
            .attr('font-weight', '500')
            .text('Qtd. de noticias');
    },

    // ==========================================
    // Smart Annotations
    // ==========================================

    _renderAnnotations: function (g, buckets, x, y, series, innerWidth, innerHeight, animate) {
        g.selectAll('.annotation-group').remove();

        // Skip annotations on small screens
        if (window.innerWidth < 640) return;

        var self = this;
        var maxTitleLen = window.innerWidth < 1024 ? 35 : 50;
        var annotations = [];

        this._layerOrder.forEach(function (key, layerIdx) {
            var layer = series[layerIdx];
            var maxIdx = 0;
            var maxVal = 0;

            layer.forEach(function (d, i) {
                var height = d[1] - d[0];
                if (height > maxVal) {
                    maxVal = height;
                    maxIdx = i;
                }
            });

            if (maxVal <= 0) return;

            var bucket = buckets[maxIdx];
            var peakArticles = bucket._articles[key] || [];

            if (peakArticles.length === 0) return;

            // Pick best article (most recent)
            var best = peakArticles.sort(function (a, b) {
                return new Date(b.publishedAt) - new Date(a.publishedAt);
            })[0];

            var title = best.title || '';
            if (title.length > maxTitleLen) {
                title = title.substring(0, maxTitleLen) + '\u2026';
            }

            var px = x(bucket.date);
            var py = y((layer[maxIdx][0] + layer[maxIdx][1]) / 2);

            annotations.push({
                x: px,
                y: py,
                title: title,
                color: self._getColors()[key],
                key: key
            });
        });

        // Collision avoidance
        annotations.sort(function (a, b) { return a.y - b.y; });
        for (var i = 1; i < annotations.length; i++) {
            if (Math.abs(annotations[i].y - annotations[i - 1].y) < 32) {
                annotations[i].y = annotations[i - 1].y + 34;
            }
        }

        // Clamp within bounds
        annotations.forEach(function (a) {
            a.y = Math.max(12, Math.min(a.y, innerHeight - 12));
            // If annotation text would go off right edge, flip to left
            if (a.x > innerWidth * 0.7) {
                a._flipLeft = true;
            }
        });

        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var textColor = isDark ? '#e8e8f0' : '#1a1a2e';

        // Render
        annotations.forEach(function (ann) {
            var ag = g.append('g')
                .attr('class', 'annotation-group')
                .style('opacity', animate ? 0 : 1);

            var lineX2 = ann._flipLeft ? ann.x - 20 : ann.x + 20;
            var lineY2 = ann.y - 15;
            var textX = ann._flipLeft ? ann.x - 24 : ann.x + 24;
            var textAnchor = ann._flipLeft ? 'end' : 'start';

            ag.append('line')
                .attr('x1', ann.x)
                .attr('y1', ann.y)
                .attr('x2', lineX2)
                .attr('y2', lineY2)
                .attr('stroke', ann.color)
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '3,2');

            ag.append('circle')
                .attr('cx', ann.x)
                .attr('cy', ann.y)
                .attr('r', 4)
                .attr('fill', ann.color);

            var textEl = ag.append('text')
                .attr('x', textX)
                .attr('y', lineY2 - 3)
                .attr('text-anchor', textAnchor)
                .attr('fill', textColor)
                .attr('font-size', '11px')
                .attr('font-weight', '600')
                .text(ann.title);

            // Insert semi-transparent backdrop behind text for readability
            try {
                var bbox = textEl.node().getBBox();
                var padX = 4, padY = 2;
                ag.insert('rect', 'text')
                    .attr('x', bbox.x - padX)
                    .attr('y', bbox.y - padY)
                    .attr('width', bbox.width + padX * 2)
                    .attr('height', bbox.height + padY * 2)
                    .attr('rx', 3)
                    .attr('ry', 3)
                    .attr('fill', isDark ? 'rgba(10, 10, 15, 0.75)' : 'rgba(255, 255, 255, 0.85)')
                    .attr('stroke', isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)')
                    .attr('stroke-width', 0.5);
            } catch (e) { /* getBBox may fail if not in DOM */ }

            if (animate) {
                ag.transition()
                    .delay(900)
                    .duration(500)
                    .style('opacity', 1);
            }
        });
    },

    // ==========================================
    // Hover Interactions
    // ==========================================

    _onLayerHover: function (key, isEnter) {
        var g = this._state.g;
        if (!g) return;

        if (isEnter) {
            g.selectAll('.stream-layer')
                .transition()
                .duration(200)
                .style('fill-opacity', function (d) {
                    return d.key === key ? 1.0 : 0.35;
                });
        } else {
            g.selectAll('.stream-layer')
                .transition()
                .duration(200)
                .style('fill-opacity', 0.85);

            this._hideTooltip();
        }
    },

    _onLayerMouseMove: function (event, d, buckets, x) {
        var tooltip = this._elements.tooltip;
        if (!tooltip) return;

        var container = this._elements.chart;
        var rect = container.getBoundingClientRect();
        var mouseX = event.clientX - rect.left - this._margin.left;

        // Find closest bucket
        var closestIdx = 0;
        var closestDist = Infinity;
        buckets.forEach(function (b, i) {
            var bx = x(b.date);
            var dist = Math.abs(bx - mouseX);
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
            }
        });

        var bucket = buckets[closestIdx];
        var sentiment = d.key;
        var sentimentLabels = { positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo' };
        var count = bucket[sentiment];
        var dateStr = d3.timeFormat('%d/%m/%Y %Hh')(bucket.date);

        // Top headline
        var headlines = bucket._articles[sentiment] || [];
        var headline = headlines.length > 0 ? headlines[0].title : '';
        if (headline.length > 60) headline = headline.substring(0, 60) + '\u2026';

        tooltip.innerHTML =
            '<div class="sg-tooltip-date">' + dateStr + '</div>' +
            '<div class="sg-tooltip-sentiment" style="color:' + this._getColors()[sentiment] + '">' +
            sentimentLabels[sentiment] + ': ' + count + ' noticia(s)' +
            '</div>' +
            (headline ? '<div class="sg-tooltip-headline">' + headline + '</div>' : '');

        // Position tooltip
        var tx = event.clientX - rect.left + 12;
        var ty = event.clientY - rect.top - 10;

        // Prevent overflow right
        if (tx + 220 > rect.width) {
            tx = event.clientX - rect.left - 230;
        }

        tooltip.style.display = 'block';
        tooltip.style.left = tx + 'px';
        tooltip.style.top = ty + 'px';
    },

    _hideTooltip: function () {
        if (this._elements.tooltip) {
            this._elements.tooltip.style.display = 'none';
        }
    },

    // ==========================================
    // Filter Controls
    // ==========================================

    _changeRange: function (rangeKey) {
        this._state.activeRange = rangeKey;
        if (this._state.rendered) {
            this._setupSvg();
            this._update(true);
        }
    },

    _showCustomRange: function () {
        if (this._elements.customRange) {
            this._elements.customRange.style.display = 'flex';
        }
    },

    _hideCustomRange: function () {
        if (this._elements.customRange) {
            this._elements.customRange.style.display = 'none';
        }
    },

    _applyCustomRange: function () {
        var startVal = this._elements.dateStart ? this._elements.dateStart.value : null;
        var endVal = this._elements.dateEnd ? this._elements.dateEnd.value : null;

        if (!startVal || !endVal) {
            if (window.UI) UI.showToast('Selecione as datas de inicio e fim.', 'info');
            return;
        }

        var start = new Date(startVal);
        var end = new Date(endVal);
        end.setHours(23, 59, 59, 999);

        if (start >= end) {
            if (window.UI) UI.showToast('Data de inicio deve ser anterior a data de fim.', 'info');
            return;
        }

        this._state.activeRange = 'custom';
        this._state.customStart = start;
        this._state.customEnd = end;

        if (this._state.rendered) {
            this._update(true);
        }
    },

    // ==========================================
    // Stats Cards
    // ==========================================

    _renderStats: function (buckets) {
        var stats = this._elements.stats;
        if (!stats) return;

        var total = 0, pos = 0, neg = 0, neu = 0;
        buckets.forEach(function (b) {
            pos += b.positive;
            neg += b.negative;
            neu += b.neutral;
            total += b.positive + b.negative + b.neutral;
        });

        var pctPos = total ? Math.round(pos / total * 100) : 0;
        var pctNeu = total ? Math.round(neu / total * 100) : 0;
        var pctNeg = total ? Math.round(neg / total * 100) : 0;

        stats.innerHTML =
            '<div class="streamgraph-stat-card stat-positive">' +
                '<span class="stat-value">' + pos + '</span>' +
                '<span class="stat-label">Positivas (' + pctPos + '%)</span>' +
            '</div>' +
            '<div class="streamgraph-stat-card stat-neutral">' +
                '<span class="stat-value">' + neu + '</span>' +
                '<span class="stat-label">Neutras (' + pctNeu + '%)</span>' +
            '</div>' +
            '<div class="streamgraph-stat-card stat-negative">' +
                '<span class="stat-value">' + neg + '</span>' +
                '<span class="stat-label">Negativas (' + pctNeg + '%)</span>' +
            '</div>';
    }
};

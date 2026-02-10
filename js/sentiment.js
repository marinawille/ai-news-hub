/* ===================================================
   AI News Hub - Sentiment Service
   Reusable sentiment classification for articles.
   Used by StreamGraph and AnalyticsPage.
   =================================================== */

window.SentimentService = {

    _positiveWords: [
        'avanço', 'breakthrough', 'inovação', 'innovation', 'lançamento', 'launch',
        'release', 'sucesso', 'success', 'melhoria', 'improvement', 'growth',
        'crescimento', 'progress', 'progresso', 'achievement', 'conquista',
        'record', 'recorde', 'milestone', 'partnership', 'parceria',
        'funding', 'investimento', 'upgrade', 'faster', 'better', 'leading',
        'state-of-the-art', 'outperform', 'surpass', 'open source', 'free',
        'powerful', 'efficient', 'impressive', 'promising', 'optimistic'
    ],

    _negativeWords: [
        'crise', 'crisis', 'regulação', 'regulation', 'ban', 'proibição',
        'falha', 'failure', 'erro', 'error', 'risco', 'risk', 'threat',
        'ameaça', 'preocupação', 'concern', 'demissão', 'layoff', 'corte',
        'cut', 'critic', 'crítica', 'controversy', 'controvérsia', 'lawsuit',
        'sued', 'fine', 'multa', 'delay', 'atraso', 'problem', 'problema',
        'warning', 'alerta', 'dangerous', 'perigoso', 'bias', 'hack',
        'breach', 'leak', 'vulnerability', 'shutdown', 'decline'
    ],

    _extractText: function (article) {
        return ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
    },

    numericScore: function (article) {
        var text = this._extractText(article);
        var posCount = 0;
        var negCount = 0;

        this._positiveWords.forEach(function (w) {
            if (text.indexOf(w) !== -1) posCount++;
        });
        this._negativeWords.forEach(function (w) {
            if (text.indexOf(w) !== -1) negCount++;
        });

        var total = posCount + negCount;
        if (total === 0) return 0;
        return (posCount - negCount) / total;
    },

    classify: function (article) {
        var score = this.numericScore(article);
        if (score > 0.2) return 'positive';
        if (score < -0.2) return 'negative';
        return 'neutral';
    }
};

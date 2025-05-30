import { TextPreprocessor } from '../utils/textPreprocessor.js';
export class SimpleClassifier {
    constructor() {
        this.preprocessor = new TextPreprocessor();
        this.wordScores = new Map();
        this.labelPriors = new Map();
    }
    calculateTfIdf(word, text, allTexts) {
        // Calculate TF (Term Frequency)
        const wordCount = text.split(' ').filter(w => w === word).length;
        const tf = wordCount / text.split(' ').length;
        // Calculate IDF (Inverse Document Frequency)
        const documentsWithWord = allTexts.filter(t => t.includes(word)).length;
        const idf = Math.log(allTexts.length / (1 + documentsWithWord));
        return tf * idf;
    }
    train(data) {
        // Preprocess all texts
        this.preprocessor.fit(data.map(example => example.text));
        // Initialize counters
        const labelCounts = new Map();
        const wordLabelCounts = new Map();
        // Count occurrences
        for (const example of data) {
            // Update label count
            labelCounts.set(example.label, (labelCounts.get(example.label) || 0) + 1);
            // Get word features
            const words = new Set(this.preprocessor.tokenize(example.text));
            // Update word-label counts
            for (const word of words) {
                if (!wordLabelCounts.has(word)) {
                    wordLabelCounts.set(word, new Map());
                }
                const labelMap = wordLabelCounts.get(word);
                labelMap.set(example.label, (labelMap.get(example.label) || 0) + 1);
            }
        }
        // Calculate label priors
        const totalExamples = data.length;
        for (const [label, count] of labelCounts.entries()) {
            this.labelPriors.set(label, count / totalExamples);
        }
        // Calculate word scores using TF-IDF
        const allTexts = data.map(ex => ex.text);
        for (const [word, labelMap] of wordLabelCounts.entries()) {
            this.wordScores.set(word, new Map());
            const wordScoreMap = this.wordScores.get(word);
            for (const [label, count] of labelMap.entries()) {
                // Get all texts for this label
                const textsForLabel = data
                    .filter(ex => ex.label === label)
                    .map(ex => ex.text);
                // Calculate average TF-IDF score for this word in this label's texts
                const avgTfIdf = textsForLabel.reduce((sum, text) => sum + this.calculateTfIdf(word, text, allTexts), 0) / textsForLabel.length;
                const score = (count / (labelCounts.get(label) || 1)) * (1 + avgTfIdf);
                wordScoreMap.set(label, score);
            }
        }
    }
    calculateContextScore(text, label) {
        const settingsContext = [
            { words: ['stripe', 'payment', 'connect', 'account', 'gateway'], weight: 3.0 },
            { words: ['slack', 'webhook', 'setup', 'configure', 'integration'], weight: 2.5 },
            { words: ['api', 'key', 'token', 'credential', 'secret'], weight: 2.0 }
        ];
        const automationContext = [
            { words: ['automate', 'schedule', 'backup', 'pipeline', 'workflow'], weight: 3.0 },
            { words: ['daily', 'weekly', 'periodic', 'report', 'task'], weight: 2.5 },
            { words: ['create', 'setup', 'automation', 'monitoring', 'alert'], weight: 2.0 }
        ];
        const contexts = label === 'settings' ? settingsContext : automationContext;
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        // Calculate word frequency
        const wordFreq = new Map();
        for (const word of words) {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
        // Context-based scoring with frequency weighting
        for (const context of contexts) {
            const contextWords = words.filter(word => context.words.includes(word));
            if (contextWords.length >= 1) {
                // Calculate weighted score based on word frequency
                const freqScore = contextWords.reduce((sum, word) => sum + (wordFreq.get(word) || 0), 0);
                score += freqScore * context.weight;
                // Bonus for multiple unique words from same context
                if (new Set(contextWords).size > 1) {
                    score *= 1.5;
                }
            }
        }
        // Label-specific boosts
        if (label === 'settings') {
            // Boost settings score for key phrases
            const hasIntegration = words.some(w => w.match(/integration|connect|configure/));
            const hasService = words.some(w => w.match(/stripe|slack|webhook|api/));
            if (hasIntegration && hasService) {
                score *= 1.75;
            }
        }
        else if (label === 'automation') {
            // Boost automation score for key phrases
            const hasSchedule = words.some(w => w.match(/schedule|periodic|daily|weekly/));
            const hasAction = words.some(w => w.match(/backup|report|task|job|automate/));
            if (hasSchedule && hasAction) {
                score *= 1.75;
            }
        }
        return score;
    }
    predict(text) {
        const scores = new Map();
        // Calculate context-based scores for each label
        scores.set('settings', this.calculateContextScore(text, 'settings'));
        scores.set('automation', this.calculateContextScore(text, 'automation'));
        // Add word frequency scores
        const words = this.preprocessor.tokenize(text);
        for (const word of words) {
            const wordScoreMap = this.wordScores.get(word);
            if (wordScoreMap) {
                for (const [label, score] of wordScoreMap.entries()) {
                    const currentScore = scores.get(label) || 0;
                    scores.set(label, currentScore + Math.log(score + 0.1));
                }
            }
        }
        // Find label with highest score
        let bestLabel = Array.from(scores.entries())[0][0];
        let bestScore = scores.get(bestLabel) || 0;
        for (const [label, score] of scores.entries()) {
            if (score > bestScore) {
                bestScore = score;
                bestLabel = label;
            }
        }
        return bestLabel;
    }
}

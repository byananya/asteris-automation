import natural from 'natural';
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
export class TextPreprocessor {
    constructor() {
        this.vocabulary = new Set();
    }
    fit(texts) {
        texts.forEach(text => {
            const tokens = this.tokenize(text);
            tokens.forEach(token => this.vocabulary.add(token));
        });
    }
    transform(text) {
        const tokens = this.tokenize(text);
        return Array.from(this.vocabulary).map(word => tokens.includes(word) ? 1 : 0);
    }
    getVocabularySize() {
        return this.vocabulary.size;
    }
    tokenize(text) {
        // Convert to lowercase
        const lowercased = text.toLowerCase();
        // Tokenize
        const tokens = tokenizer.tokenize(lowercased) || [];
        // Stem words and remove stopwords
        return tokens
            .map(token => stemmer.stem(token))
            .filter(token => !this.isStopword(token));
    }
    isStopword(word) {
        const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with']);
        return stopwords.has(word);
    }
}

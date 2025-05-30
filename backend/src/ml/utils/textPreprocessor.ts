import natural from 'natural';

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

export class TextPreprocessor {
  private vocabulary: Set<string>;
  
  constructor() {
    this.vocabulary = new Set<string>();
  }

  public fit(texts: string[]): void {
    texts.forEach(text => {
      const tokens = this.tokenize(text);
      tokens.forEach(token => this.vocabulary.add(token));
    });
  }

  public transform(text: string): number[] {
    const tokens = this.tokenize(text);
    return Array.from(this.vocabulary).map(word => 
      tokens.includes(word) ? 1 : 0
    );
  }

  public getVocabularySize(): number {
    return this.vocabulary.size;
  }

  public tokenize(text: string): string[] {
    // Convert to lowercase
    const lowercased = text.toLowerCase();
    
    // Tokenize
    const tokens = tokenizer.tokenize(lowercased) || [];
    
    // Stem words and remove stopwords
    return tokens
      .map(token => stemmer.stem(token))
      .filter(token => !this.isStopword(token));
  }

  private isStopword(word: string): boolean {
    const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with']);
    return stopwords.has(word);
  }
}

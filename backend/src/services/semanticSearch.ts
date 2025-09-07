import { SemanticSearch } from '../ml/models/semanticSearch.js';
import { trainingData } from '../ml/data/trainingData.js';

class SemanticSearchService {
  private semanticSearch: SemanticSearch;
  private isInitialized: boolean = false;
  
  constructor() {
    this.semanticSearch = new SemanticSearch();
  }
  
  /**
   * Initialize the semantic search service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Load the model
      await this.semanticSearch.initialize();
      
      // Index the training data
      await this.semanticSearch.indexData(trainingData);
      
      this.isInitialized = true;
      console.log('Semantic search service initialized successfully on server startup');
    } catch (error) {
      console.error('Failed to initialize semantic search service:', error);
      throw error;
    }
  }
  
  /**
   * Search for intents based on a query
   */
  public async searchIntents(query: string, topK: number = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      const results = await this.semanticSearch.search(query, topK);
      return results;
    } catch (error) {
      console.error('Error searching intents:', error);
      throw error;
    }
  }
  
  /**
   * Generate autocomplete suggestions based on a query
   */
  public async generateSuggestions(query: string, topK: number = 3) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Search for similar intents
      const results = await this.semanticSearch.search(query, topK);
      
      // Generate additional suggestions based on the query
      const suggestions = [
        ...results.map(r => r.text),
        // Add some context-aware suggestions
        `${query} automation`,
        `configure ${query}`,
        `integrate ${query}`,
      ];
      
      // Remove duplicates and return top suggestions
      return Array.from(new Set(suggestions)).slice(0, topK);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw error;
    }
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.isInitialized) {
      this.semanticSearch.dispose();
      this.isInitialized = false;
    }
  }
}

// Create a singleton instance
export const semanticSearchService = new SemanticSearchService();

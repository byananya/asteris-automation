"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semanticSearchService = void 0;
const semanticSearch_js_1 = require("../ml/models/semanticSearch.js");
const trainingData_js_1 = require("../ml/data/trainingData.js");
class SemanticSearchService {
    constructor() {
        this.isInitialized = false;
        this.semanticSearch = new semanticSearch_js_1.SemanticSearch();
    }
    /**
     * Initialize the semantic search service
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Load the model
            await this.semanticSearch.initialize();
            // Index the training data
            await this.semanticSearch.indexData(trainingData_js_1.trainingData);
            this.isInitialized = true;
            console.log('Semantic search service initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize semantic search service:', error);
            throw error;
        }
    }
    /**
     * Search for intents based on a query
     */
    async searchIntents(query, topK = 5) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        try {
            const results = await this.semanticSearch.search(query, topK);
            return results;
        }
        catch (error) {
            console.error('Error searching intents:', error);
            throw error;
        }
    }
    /**
     * Generate autocomplete suggestions based on a query
     */
    async generateSuggestions(query, topK = 3) {
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
        }
        catch (error) {
            console.error('Error generating suggestions:', error);
            throw error;
        }
    }
    /**
     * Clean up resources
     */
    dispose() {
        if (this.isInitialized) {
            this.semanticSearch.dispose();
            this.isInitialized = false;
        }
    }
}
// Create a singleton instance
exports.semanticSearchService = new SemanticSearchService();
//# sourceMappingURL=semanticSearch.js.map
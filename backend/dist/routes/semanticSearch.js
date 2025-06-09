import express from 'express';
import { semanticSearchService } from '../services/semanticSearch.js';
const router = express.Router();
// Initialize the semantic search service when the server starts
(async () => {
    try {
        await semanticSearchService.initialize();
        console.log('Semantic search service initialized on server startup');
    }
    catch (error) {
        console.error('Failed to initialize semantic search service on startup:', error);
    }
})();
/**
 * Search for intents based on a query
 * GET /api/semantic-search?query=your+search+query&limit=5
 */
router.get('/', async (req, res) => {
    try {
        const query = req.query.query;
        const limit = parseInt(req.query.limit) || 5;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }
        const results = await semanticSearchService.searchIntents(query, limit);
        res.json({ results });
    }
    catch (error) {
        console.error('Error in semantic search endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * Generate autocomplete suggestions based on a query
 * GET /api/semantic-search/suggestions?query=your+partial+query&limit=3
 */
router.get('/suggestions', async (req, res) => {
    try {
        const query = req.query.query;
        const limit = parseInt(req.query.limit) || 3;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }
        const suggestions = await semanticSearchService.generateSuggestions(query, limit);
        res.json({ suggestions });
    }
    catch (error) {
        console.error('Error in suggestions endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;

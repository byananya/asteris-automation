import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { TrainingExample } from '../data/trainingData.js';

interface SearchResult {
  text: string;
  label: string;
  score: number;
}

export class SemanticSearch {
  private model: use.UniversalSentenceEncoder | null = null;
  private embeddings: tf.Tensor2D | null = null;
  private examples: TrainingExample[] = [];
  
  constructor() {}
  
  /**
   * Initialize the Universal Sentence Encoder model
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Loading Universal Sentence Encoder...');
      this.model = await use.load();
      console.log('Universal Sentence Encoder loaded successfully');
    } catch (error) {
      console.error('Error loading Universal Sentence Encoder:', error);
      throw error;
    }
  }
  
  /**
   * Index the training examples by creating embeddings
   */
  public async indexData(data: TrainingExample[]): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }
    
    try {
      console.log(`Indexing ${data.length} examples...`);
      this.examples = [...data];
      
      // Generate embeddings for all examples
      const texts = data.map(example => example.text);
      const embeddings = await this.model.embed(texts);
      this.embeddings = embeddings as tf.Tensor2D;
      
      console.log('Indexing completed successfully');
    } catch (error) {
      console.error('Error indexing data:', error);
      throw error;
    }
  }
  
  /**
   * Search for similar examples based on semantic similarity
   */
  public async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.model || !this.embeddings) {
      throw new Error('Model not initialized or no data indexed.');
    }
    
    try {
      // Generate embedding for the query
      const queryEmbeddingRaw = await this.model.embed([query]);
      const queryEmbedding = queryEmbeddingRaw as tf.Tensor2D;
      
      // Calculate cosine similarity between query and all examples
      const similarities = tf.tidy(() => {
        // Normalize embeddings
        const normalizedQuery = tf.div(queryEmbedding, tf.norm(queryEmbedding, 2, 1, true));
        const normalizedExamples = tf.div(this.embeddings!, tf.norm(this.embeddings!, 2, 1, true));
        
        // Calculate dot product (cosine similarity for normalized vectors)
        return normalizedQuery.matMul(normalizedExamples.transpose());
      });
      
      // Get top K results
      const values = await similarities.data();
      const scores = Array.from(values) as number[];
      
      // Create results with scores
      const results = this.examples.map((example, i) => ({
        text: example.text,
        label: example.label,
        score: scores[i]
      }));
      
      // Sort by score and take top K
      const topResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK) as SearchResult[];
      
      // Clean up tensors
      queryEmbedding.dispose();
      similarities.dispose();
      
      return topResults;
    } catch (error) {
      console.error('Error during semantic search:', error);
      throw error;
    }
  }
  
  /**
   * Generate embeddings for a batch of texts
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }
    
    try {
      const embeddings = await this.model.embed(texts);
      const embeddingArray = await embeddings.array();
      embeddings.dispose();
      
      return embeddingArray;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.embeddings) {
      this.embeddings.dispose();
      this.embeddings = null;
    }
  }
}

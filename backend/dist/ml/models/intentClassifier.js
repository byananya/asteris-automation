import * as tf from '@tensorflow/tfjs-node';
import { TextPreprocessor } from '../utils/textPreprocessor.js';
export class IntentClassifier {
    constructor() {
        this.preprocessor = new TextPreprocessor();
        this.labelMap = new Map();
        this.model = tf.sequential();
    }
    buildModel(inputSize, outputSize) {
        // Clear any existing layers
        while (this.model.layers.length > 0) {
            this.model.layers.pop();
        }
        // Add layers
        this.model.add(tf.layers.dense({
            units: 16,
            activation: 'relu',
            inputShape: [inputSize]
        }));
        this.model.add(tf.layers.dense({
            units: outputSize,
            activation: 'softmax'
        }));
        // Compile the model
        this.model.compile({
            optimizer: 'adam',
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
    }
    async train(data) {
        try {
            // Preprocess text data
            this.preprocessor.fit(data.map(example => example.text));
            // Create label mapping
            const uniqueLabels = Array.from(new Set(data.map(example => example.label)));
            uniqueLabels.forEach((label, index) => this.labelMap.set(label, index));
            // Build model architecture
            const inputSize = this.preprocessor.getVocabularySize();
            const outputSize = uniqueLabels.length;
            this.buildModel(inputSize, outputSize);
            // Prepare training data
            const X = data.map(example => this.preprocessor.transform(example.text));
            const y = data.map(example => {
                const labelIndex = this.labelMap.get(example.label) || 0;
                const oneHot = Array(outputSize).fill(0);
                oneHot[labelIndex] = 1;
                return oneHot;
            });
            // Convert to tensors and train
            const xs = tf.tensor2d(X);
            const ys = tf.tensor2d(y);
            console.log('Starting training...');
            await this.model.fit(xs, ys, {
                epochs: 50,
                batchSize: 4,
                shuffle: true,
                verbose: 1
            });
            // Clean up
            xs.dispose();
            ys.dispose();
            console.log('Training completed');
        }
        catch (error) {
            console.error('Error during training:', error);
            throw error;
        }
    }
    async predict(text) {
        const input = this.preprocessor.transform(text);
        const inputTensor = tf.tensor2d([input]);
        try {
            const prediction = this.model.predict(inputTensor);
            const labelIndex = (await prediction.argMax(1).data())[0];
            // Clean up tensors
            inputTensor.dispose();
            prediction.dispose();
            // Find label by index
            for (const [label, index] of this.labelMap.entries()) {
                if (index === labelIndex) {
                    return label;
                }
            }
            return 'automation'; // Default fallback
        }
        catch (error) {
            // Clean up tensor in case of error
            inputTensor.dispose();
            throw error;
        }
    }
    async save(path) {
        await this.model.save(`file://${path}`);
    }
    async load(path) {
        this.model = await tf.loadLayersModel(`file://${path}`);
    }
}

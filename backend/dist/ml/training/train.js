import { SimpleClassifier } from '../models/simpleClassifier.js';
import { trainingData } from '../data/trainingData.js';
async function trainModel() {
    try {
        console.log('Starting model training...');
        const classifier = new SimpleClassifier();
        console.log('Training with', trainingData.length, 'examples');
        classifier.train(trainingData);
        console.log('Training completed.');
        console.log('Testing the model...');
        const testCases = [
            // Settings test cases
            'connect stripe account',
            'add payment gateway',
            'configure webhook url',
            'update api credentials',
            'setup slack integration',
            'manage stripe settings',
            'add new api key',
            'configure payment settings',
            'update webhook endpoint',
            'setup service integration',
            // Automation test cases
            'create daily backup',
            'schedule weekly reports',
            'setup automated pipeline',
            'create monitoring dashboard',
            'automate deployment process',
            'schedule periodic tasks',
            'setup automated testing',
            'create backup workflow',
            'automate build process',
            'schedule system maintenance'
        ];
        for (const test of testCases) {
            const prediction = classifier.predict(test);
            console.log(`Input: "${test}" -> Predicted: ${prediction}`);
        }
        console.log('Training completed successfully!');
    }
    catch (error) {
        console.error('Error during training:', error);
    }
}
trainModel();

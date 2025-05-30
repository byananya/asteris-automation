import express from 'express';
import { SimpleClassifier } from '../../ml/models/simpleClassifier.js';
import { trainingData } from '../../ml/data/trainingData.js';
const router = express.Router();
const classifier = new SimpleClassifier();
// Train the classifier when the server starts
try {
    classifier.train(trainingData);
    console.log('Intent classifier trained successfully');
}
catch (error) {
    console.error('Error training intent classifier:', error);
}
router.post('/classify', (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        const intent = classifier.predict(text);
        res.json({ intent });
    }
    catch (error) {
        console.error('Error classifying intent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;

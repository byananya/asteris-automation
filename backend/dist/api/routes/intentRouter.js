"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const simpleClassifier_1 = require("../../ml/models/simpleClassifier");
const trainingData_1 = require("../../ml/data/trainingData");
const router = express_1.default.Router();
const classifier = new simpleClassifier_1.SimpleClassifier();
// Train the classifier when the server starts
try {
    classifier.train(trainingData_1.trainingData);
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
exports.default = router;
//# sourceMappingURL=intentRouter.js.map
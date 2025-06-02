import express from 'express';
import cors from 'cors';
import intentRouter from './api/routes/intentRouter.js';
import reconciliationRouter from './routes/stripe/reconciliation.js';
import semanticSearchRouter from './routes/semanticSearch.js';

const app = express();
const port = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/intent', intentRouter);
app.use('/api/stripe/reconciliation', reconciliationRouter);
app.use('/api/semantic-search', semanticSearchRouter);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

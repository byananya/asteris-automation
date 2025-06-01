import express from 'express';
import cors from 'cors';
import intentRouter from './api/routes/intentRouter.js';
import reconciliationRouter from './routes/stripe/reconciliation.js';

const app = express();
const port = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/intent', intentRouter);
app.use('/api/stripe/reconciliation', reconciliationRouter);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

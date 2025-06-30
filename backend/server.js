import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import emailSignupRouter from './src/routes/emailSignup.js';
import emailExportRouter from './src/routes/emailExport.js';
import reconciliationRouter from './dist/routes/reconciliation.routes.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/email-signup', emailSignupRouter);
app.use('/email-export', emailExportRouter);
app.use('/api/reconcile', reconciliationRouter);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Email signup endpoint: http://localhost:${PORT}/email-signup`);
  console.log(`Email export endpoint: http://localhost:${PORT}/email-export/csv?adminKey=asteris-admin-key`);
});

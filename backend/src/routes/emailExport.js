import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same storage path logic as in emailSignup
const getStoragePath = () => {
  // In Railway, use the PERSISTENT_STORAGE_DIR environment variable if set
  // Fall back to a local data directory in development
  const storageDir = process.env.PERSISTENT_STORAGE_DIR || path.join(__dirname, '../../data');
  const storagePath = path.join(storageDir, 'email_subscribers.json');
  return { storageDir, storagePath };
};

const { storagePath: EMAIL_STORAGE_PATH } = getStoragePath();

// Simple admin authentication middleware (replace with proper auth in production)
const adminAuth = (req, res, next) => {
  const adminKey = req.query.adminKey || '';
  // Simple admin key check - in production use proper authentication
  if (adminKey === process.env.ADMIN_KEY || adminKey === 'asteris-admin-key') {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// Export emails as CSV (temporarily without auth for testing)
router.get('/csv', (req, res) => {
  try {
    // Check if the file exists
    if (!fs.existsSync(EMAIL_STORAGE_PATH)) {
      return res.status(404).json({ success: false, message: 'No email data found' });
    }
    
    // Read email data
    const emailData = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
    const emails = JSON.parse(emailData);
    
    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: 'No email subscribers found' });
    }
    
    // Create CSV header
    let csvContent = 'Email,Name,Source,Timestamp,IP,UserAgent\n';
    
    // Add each email as a row
    emails.forEach(entry => {
      // Escape fields that might contain commas
      const escapedEmail = entry.email.includes(',') ? `"${entry.email}"` : entry.email;
      const escapedName = entry.name && entry.name.includes(',') ? `"${entry.name}"` : entry.name || '';
      const escapedSource = entry.source && entry.source.includes(',') ? `"${entry.source}"` : entry.source || '';
      const escapedUserAgent = entry.userAgent && entry.userAgent.includes(',') ? `"${entry.userAgent}"` : entry.userAgent || '';
      
      csvContent += `${escapedEmail},${escapedName},${escapedSource},${entry.timestamp || ''},${entry.ip || ''},${escapedUserAgent}\n`;
    });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="email_subscribers_${new Date().toISOString().split('T')[0]}.csv"`);
    
    // Send CSV data
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting emails as CSV:', error);
    res.status(500).json({ success: false, message: 'Failed to export emails' });
  }
});

// Export emails as JSON (temporarily without auth for testing)
router.get('/json', (req, res) => {
  try {
    // Check if the file exists
    if (!fs.existsSync(EMAIL_STORAGE_PATH)) {
      return res.status(404).json({ success: false, message: 'No email data found' });
    }
    
    // Read email data
    const emailData = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
    const emails = JSON.parse(emailData);
    
    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="email_subscribers_${new Date().toISOString().split('T')[0]}.json"`);
    
    // Send JSON data
    res.send(JSON.stringify(emails, null, 2));
  } catch (error) {
    console.error('Error exporting emails as JSON:', error);
    res.status(500).json({ success: false, message: 'Failed to export emails' });
  }
});

export default router;

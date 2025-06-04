import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-file storage for emails (in production, you'd use a database)
const EMAIL_STORAGE_PATH = path.join(__dirname, '../../data/email_subscribers.json');

// Ensure the data directory exists
const ensureDataDirExists = () => {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(EMAIL_STORAGE_PATH)) {
    fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify([], null, 2));
  }
};

// Get all email subscribers (protected, admin only in real implementation)
router.get('/', (req: Request, res: Response) => {
  try {
    ensureDataDirExists();
    const emailData = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
    const emails = JSON.parse(emailData);
    res.json({ success: true, count: emails.length, emails });
  } catch (error) {
    console.error('Error retrieving email subscribers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve email subscribers' });
  }
});

// Add a new email subscriber
router.post(
  '/',
  [
    // Validate email
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    // Optional name field
    body('name')
      .optional()
      .trim()
      .escape(),
    
    // Optional source field to track where the signup came from
    body('source')
      .optional()
      .trim()
      .escape(),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      ensureDataDirExists();
      
      const { email, name, source } = req.body;
      const timestamp = new Date().toISOString();
      
      // Read existing emails
      const emailData = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
      const emails = JSON.parse(emailData);
      
      // Check if email already exists
      const existingEmail = emails.find((entry: any) => entry.email === email);
      if (existingEmail) {
        return res.status(409).json({ 
          success: false, 
          message: 'This email is already subscribed' 
        });
      }
      
      // Add new email
      emails.push({
        email,
        name: name || '',
        source: source || 'popup',
        timestamp,
        ip: req.ip || 'unknown', // For analytics purposes
        userAgent: req.get('User-Agent') || 'unknown'
      });
      
      // Save updated emails
      fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(emails, null, 2));
      
      // In a real implementation, you might want to:
      // 1. Add the email to a newsletter service like Mailchimp
      // 2. Send a welcome email
      // 3. Store in a proper database
      
      res.status(201).json({ 
        success: true, 
        message: 'Email successfully added to subscribers list' 
      });
    } catch (error) {
      console.error('Error adding email subscriber:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add email to subscribers list' 
      });
    }
  }
);

export default router;

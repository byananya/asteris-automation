import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Use a persistent storage directory that works in both development and production
const getStoragePath = () => {
  // In Railway, use the PERSISTENT_STORAGE_DIR environment variable if set
  // Fall back to a local data directory in development
  const storageDir = process.env.PERSISTENT_STORAGE_DIR || path.join(__dirname, '../../data');
  const storagePath = path.join(storageDir, 'email_subscribers.json');
  return { storageDir, storagePath };
};

const { storageDir, storagePath: EMAIL_STORAGE_PATH } = getStoragePath();

// Ensure the data directory exists
const ensureDataDirExists = () => {
  try {
    if (!fs.existsSync(storageDir)) {
      console.log(`Creating storage directory: ${storageDir}`);
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    if (!fs.existsSync(EMAIL_STORAGE_PATH)) {
      console.log(`Creating new email storage file: ${EMAIL_STORAGE_PATH}`);
      fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error ensuring data directory exists:', error);
    throw error;
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
      console.log('Ensuring data directory exists...');
      ensureDataDirExists();
      
      const { email, name, source } = req.body;
      const timestamp = new Date().toISOString();
      
      console.log(`Processing subscription for email: ${email}`);
      
      // Check if file exists and is readable
      try {
        fs.accessSync(EMAIL_STORAGE_PATH, fs.constants.R_OK | fs.constants.W_OK);
      } catch (err: unknown) {
        const error = err as NodeJS.ErrnoException;
        console.error(`File access error for ${EMAIL_STORAGE_PATH}:`, error);
        // Try to create the file if it doesn't exist
        if (error.code === 'ENOENT') {
          console.log('Email storage file not found, creating a new one...');
          fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify([], null, 2));
        } else {
          throw error; // Re-throw other errors
        }
      }
      
      // Read existing emails
      console.log('Reading existing emails...');
      const emailData = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
      const emails = JSON.parse(emailData);
      
      if (!Array.isArray(emails)) {
        throw new Error('Email data is not an array');
      }
      
      // Check if email already exists
      const existingEmail = emails.find((entry: any) => entry.email === email);
      if (existingEmail) {
        console.log(`Email ${email} already exists in the list`);
        return res.status(409).json({ 
          success: false, 
          message: 'This email is already subscribed' 
        });
      }
      
      // Add new email
      const newSubscriber = {
        email,
        name: name || '',
        source: source || 'popup',
        timestamp,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      };
      
      console.log('Adding new subscriber:', newSubscriber);
      emails.push(newSubscriber);
      
      // Save updated emails
      console.log('Saving updated email list...');
      fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(emails, null, 2));
      
      // Log success
      console.log('Successfully saved email:', email);
      
      res.status(201).json({ 
        success: true, 
        message: 'Email successfully added to subscribers list' 
      });
    } catch (error: any) {
      console.error('Error in email subscription handler:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        path: EMAIL_STORAGE_PATH,
        dirExists: fs.existsSync(path.dirname(EMAIL_STORAGE_PATH)),
        fileExists: fs.existsSync(EMAIL_STORAGE_PATH),
        canWrite: (() => {
          try {
            fs.accessSync(path.dirname(EMAIL_STORAGE_PATH), fs.constants.W_OK);
            return true;
          } catch {
            return false;
          }
        })()
      });
      
      res.status(500).json({ 
        success: false, 
        message: `Failed to add email to subscribers list: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }  
  }
);

export default router;

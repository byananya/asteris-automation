import express from 'express';
import { body, validationResult } from 'express-validator';
import { ensureDataDirExists, saveEmail, getAllEmails } from '../utils/fileStorage.js';

const router = express.Router();

// Initialize data directory and files
ensureDataDirExists();

// Get all email subscribers (protected, admin only in real implementation)
router.get('/', (req, res) => {
  try {
    const emails = getAllEmails();
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
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, name, source } = req.body;
      
      // Check if email already exists
      const existingEmails = getAllEmails();
      const existingEmail = existingEmails.find((entry) => entry.email === email);
      if (existingEmail) {
        return res.status(409).json({ 
          success: false, 
          message: 'This email is already subscribed' 
        });
      }
      
      // Prepare email data
      const emailData = {
        email,
        name: name || '',
        source: source || 'modal',
        ip: req.ip || 'unknown', // For analytics purposes
        userAgent: req.get('User-Agent') || 'unknown'
      };
      
      // Save email using our utility function
      const saveResult = await saveEmail(emailData);
      
      if (saveResult) {
        // In a real implementation, you might want to:
        // 1. Add the email to a newsletter service like Mailchimp
        // 2. Send a welcome email
        
        console.log(`Email saved successfully: ${email}`);
        
        res.status(201).json({ 
          success: true, 
          message: 'Email successfully added to subscribers list' 
        });
      } else {
        throw new Error('Failed to save email');
      }
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

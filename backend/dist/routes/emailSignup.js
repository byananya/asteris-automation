"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// In CommonJS, __dirname is available by default
// Simple in-file storage for emails (in production, you'd use a database)
const EMAIL_STORAGE_PATH = path_1.default.join(__dirname, '../../data/email_subscribers.json');
// Ensure the data directory exists
const ensureDataDirExists = () => {
    const dataDir = path_1.default.join(__dirname, '../../data');
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs_1.default.existsSync(EMAIL_STORAGE_PATH)) {
        fs_1.default.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify([], null, 2));
    }
};
// Get all email subscribers (protected, admin only in real implementation)
router.get('/', (req, res) => {
    try {
        ensureDataDirExists();
        const emailData = fs_1.default.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
        const emails = JSON.parse(emailData);
        res.json({ success: true, count: emails.length, emails });
    }
    catch (error) {
        console.error('Error retrieving email subscribers:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve email subscribers' });
    }
});
// Add a new email subscriber
router.post('/', [
    // Validate email
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    // Optional name field
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .escape(),
    // Optional source field to track where the signup came from
    (0, express_validator_1.body)('source')
        .optional()
        .trim()
        .escape(),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        ensureDataDirExists();
        const { email, name, source } = req.body;
        const timestamp = new Date().toISOString();
        // Read existing emails
        const emailData = fs_1.default.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
        const emails = JSON.parse(emailData);
        // Check if email already exists
        const existingEmail = emails.find((entry) => entry.email === email);
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
        fs_1.default.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(emails, null, 2));
        // In a real implementation, you might want to:
        // 1. Add the email to a newsletter service like Mailchimp
        // 2. Send a welcome email
        // 3. Store in a proper database
        res.status(201).json({
            success: true,
            message: 'Email successfully added to subscribers list'
        });
    }
    catch (error) {
        console.error('Error adding email subscriber:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add email to subscribers list'
        });
    }
});
exports.default = router;
//# sourceMappingURL=emailSignup.js.map
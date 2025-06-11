"use strict";
const fs = require('fs');
const path = require('path');
// In CommonJS, __dirname is available by default
// Path to data directory - use backend directory as base
const DATA_DIR = path.join(__dirname, '../../data');
const EMAIL_STORAGE_PATH = path.join(DATA_DIR, 'email_subscribers.json');
/**
 * Ensures the data directory exists
 */
const ensureDataDirExists = () => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o755 });
            console.log(`Created data directory at: ${DATA_DIR}`);
        }
        if (!fs.existsSync(EMAIL_STORAGE_PATH)) {
            fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify([], null, 2), { mode: 0o644 });
            console.log(`Created email subscribers file at: ${EMAIL_STORAGE_PATH}`);
        }
    }
    catch (error) {
        console.error('Error ensuring data directory exists:', error);
        throw error;
    }
};
/**
 * Save an email to the subscribers list
 * @param {Object} emailData - The email data to save
 * @returns {Promise<boolean>} - Whether the save was successful
 */
const saveEmail = async (emailData) => {
    try {
        ensureDataDirExists();
        // Read existing emails
        let emails = [];
        try {
            const emailDataStr = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
            emails = JSON.parse(emailDataStr);
        }
        catch (err) {
            console.warn('Error reading email file, starting with empty array:', err);
            emails = [];
        }
        // Add new email with timestamp
        const newEmail = {
            ...emailData,
            timestamp: new Date().toISOString()
        };
        emails.push(newEmail);
        // Save updated emails
        fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(emails, null, 2), { mode: 0o644 });
        // Also save a backup copy in case the main file gets corrupted
        const backupPath = path.join(DATA_DIR, 'email_subscribers_backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(emails, null, 2), { mode: 0o644 });
        console.log(`Email saved successfully: ${emailData.email}`);
        return true;
    }
    catch (error) {
        console.error('Error saving email:', error);
        return false;
    }
};
/**
 * Get all emails from the subscribers list
 * @returns {Array} - Array of email objects
 */
const getAllEmails = () => {
    try {
        ensureDataDirExists();
        // Try to read from main file first
        try {
            const emailDataStr = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
            return JSON.parse(emailDataStr);
        }
        catch (mainError) {
            console.error('Error reading main email file:', mainError);
            // Try to read from backup file
            try {
                const backupPath = path.join(DATA_DIR, 'email_subscribers_backup.json');
                if (fs.existsSync(backupPath)) {
                    const backupDataStr = fs.readFileSync(backupPath, 'utf8');
                    const backupData = JSON.parse(backupDataStr);
                    // Restore main file from backup
                    fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(backupData, null, 2), { mode: 0o644 });
                    return backupData;
                }
            }
            catch (backupError) {
                console.error('Error reading backup email file:', backupError);
            }
            // If all else fails, return empty array
            return [];
        }
    }
    catch (error) {
        console.error('Error getting all emails:', error);
        return [];
    }
};
// Export all functions
module.exports = {
    ensureDataDirExists,
    saveEmail,
    getAllEmails
};
//# sourceMappingURL=fileStorage.js.map
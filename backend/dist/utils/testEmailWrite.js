#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to data directory
const DATA_DIR = path.join(__dirname, '../../data');
const EMAIL_STORAGE_PATH = path.join(DATA_DIR, 'email_subscribers.json');
console.log('Testing email write functionality');
console.log(`Email storage path: ${EMAIL_STORAGE_PATH}`);
// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
    console.log(`Creating data directory: ${DATA_DIR}`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
// Read existing emails or create new array
let emails = [];
try {
    if (fs.existsSync(EMAIL_STORAGE_PATH)) {
        const fileContent = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
        if (fileContent && fileContent.trim() !== '') {
            emails = JSON.parse(fileContent);
            console.log(`Found ${emails.length} existing emails in the file`);
        }
        else {
            console.log('Email file exists but is empty');
        }
    }
    else {
        console.log('Email file does not exist, will create it');
    }
}
catch (error) {
    console.error('Error reading email file:', error);
    console.log('Starting with empty array');
}
// Create a test email
const testEmail = {
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    source: 'test-script',
    timestamp: new Date().toISOString(),
    ip: '127.0.0.1',
    userAgent: 'Test Script'
};
// Add the test email
emails.push(testEmail);
// Write the updated emails back to the file
try {
    // Ensure we have write permissions
    fs.access(DATA_DIR, fs.constants.W_OK, (err) => {
        if (err) {
            console.error('No write permission to data directory:', err);
        }
        else {
            console.log('Have write permission to data directory');
        }
    });
    // Write the file with pretty formatting
    fs.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(emails, null, 2));
    console.log('Successfully wrote test email to file');
    console.log(`Email: ${testEmail.email}`);
    // Verify the file was written correctly
    const verifyContent = fs.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
    const verifyEmails = JSON.parse(verifyContent);
    console.log(`Verification: File now contains ${verifyEmails.length} emails`);
    // Check file permissions
    const stats = fs.statSync(EMAIL_STORAGE_PATH);
    console.log(`File permissions: ${stats.mode.toString(8)}`);
}
catch (error) {
    console.error('Error writing to email file:', error);
}

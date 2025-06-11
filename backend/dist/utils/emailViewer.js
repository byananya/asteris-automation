#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
// Get __dirname equivalent in ESM
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Path to email subscribers file
const EMAIL_STORAGE_PATH = path_1.default.join(__dirname, '../../data/email_subscribers.json');
// Ensure the file exists
if (!fs_1.default.existsSync(EMAIL_STORAGE_PATH)) {
    console.error(`Email subscribers file not found at: ${EMAIL_STORAGE_PATH}`);
    process.exit(1);
}
// Read the file
try {
    const data = fs_1.default.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
    // Check if the file is empty or has invalid JSON
    if (!data || data.trim() === '') {
        console.log('Email subscribers file is empty. No emails have been submitted yet.');
        // Initialize with empty array
        fs_1.default.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify([], null, 2));
        process.exit(0);
    }
    // Parse the JSON
    let emails;
    try {
        emails = JSON.parse(data);
        if (!Array.isArray(emails)) {
            console.error('Email subscribers file does not contain a valid array.');
            emails = [];
            fs_1.default.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(emails, null, 2));
        }
    }
    catch (parseError) {
        console.error('Error parsing email subscribers file:', parseError.message);
        console.log('Resetting file to empty array...');
        emails = [];
        fs_1.default.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(emails, null, 2));
    }
    // Display the emails
    if (emails.length === 0) {
        console.log('No email subscribers found.');
    }
    else {
        console.log(`Found ${emails.length} email subscribers:`);
        console.log('----------------------------------------');
        emails.forEach((subscriber, index) => {
            console.log(`${index + 1}. Email: ${subscriber.email}`);
            if (subscriber.name)
                console.log(`   Name: ${subscriber.name}`);
            if (subscriber.source)
                console.log(`   Source: ${subscriber.source}`);
            if (subscriber.timestamp)
                console.log(`   Date: ${new Date(subscriber.timestamp).toLocaleString()}`);
            console.log('----------------------------------------');
        });
    }
}
catch (error) {
    console.error('Error reading email subscribers file:', error.message);
    process.exit(1);
}
// Add a test email if requested
if (process.argv.includes('--add-test')) {
    const testEmail = {
        email: `test${Date.now()}@example.com`,
        name: 'Test User',
        source: 'command-line',
        timestamp: new Date().toISOString()
    };
    try {
        const data = fs_1.default.readFileSync(EMAIL_STORAGE_PATH, 'utf8');
        let emails = [];
        try {
            emails = JSON.parse(data);
            if (!Array.isArray(emails))
                emails = [];
        }
        catch (e) {
            emails = [];
        }
        emails.push(testEmail);
        fs_1.default.writeFileSync(EMAIL_STORAGE_PATH, JSON.stringify(emails, null, 2));
        console.log('\nAdded test email:');
        console.log(`Email: ${testEmail.email}`);
        console.log(`Name: ${testEmail.name}`);
        console.log(`Source: ${testEmail.source}`);
        console.log(`Date: ${new Date(testEmail.timestamp).toLocaleString()}`);
    }
    catch (error) {
        console.error('Error adding test email:', error.message);
    }
}
//# sourceMappingURL=emailViewer.js.map
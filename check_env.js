/**
 * Environment Variables Checker
 * Run this script to verify all required environment variables are set
 */

require('dotenv').config();

const requiredEnvVars = {
    // Database
    MONGO_URI: {
        required: true,
        description: 'MongoDB connection string',
        example: 'mongodb+srv://username:password@cluster.mongodb.net/dbname'
    },
    
    // JWT
    JWT_SECRET: {
        required: true,
        description: 'Secret key for JWT token signing',
        example: 'your-super-secret-jwt-key-here'
    },
    
    // Email Service
    EMAIL_USER: {
        required: true,
        description: 'Gmail address for sending emails',
        example: 'your-email@gmail.com'
    },
    
    EMAIL_PASS: {
        required: true,
        description: 'Gmail App Password (NOT your regular password)',
        example: 'abcd efgh ijkl mnop',
        note: '⚠️ Must be a Gmail App Password, not your regular Gmail password'
    },
    
    EMAIL_FROM: {
        required: false,
        description: 'From email address (defaults to EMAIL_USER if not set)',
        example: 'your-email@gmail.com'
    },
    
    // Server
    PORT: {
        required: false,
        description: 'Server port (defaults to 5000)',
        example: '5000'
    },
    
    NODE_ENV: {
        required: false,
        description: 'Environment mode (development/production)',
        example: 'production'
    }
};

console.log('🔍 Checking Environment Variables...\n');
console.log('='.repeat(60));

let allGood = true;
const missing = [];
const warnings = [];

// Check each variable
Object.keys(requiredEnvVars).forEach(key => {
    const config = requiredEnvVars[key];
    const value = process.env[key];
    
    if (!value && config.required) {
        allGood = false;
        missing.push(key);
        console.log(`❌ ${key}: MISSING (REQUIRED)`);
        console.log(`   Description: ${config.description}`);
        if (config.example) {
            console.log(`   Example: ${config.example}`);
        }
        if (config.note) {
            console.log(`   ${config.note}`);
        }
        console.log('');
    } else if (!value && !config.required) {
        console.log(`⚠️  ${key}: NOT SET (OPTIONAL)`);
        console.log(`   Description: ${config.description}`);
        if (config.default) {
            console.log(`   Will use default: ${config.default}`);
        }
        console.log('');
    } else {
        // Value exists - check if it looks valid
        let isValid = true;
        
        if (key === 'EMAIL_USER' && !value.includes('@')) {
            isValid = false;
            warnings.push(`${key} doesn't look like a valid email`);
        }
        
        if (key === 'MONGO_URI' && !value.startsWith('mongodb')) {
            isValid = false;
            warnings.push(`${key} doesn't look like a valid MongoDB URI`);
        }
        
        if (key === 'EMAIL_PASS' && value.length < 10) {
            warnings.push(`${key} seems too short - make sure it's a Gmail App Password`);
        }
        
        if (isValid) {
            // Mask sensitive values
            let displayValue = value;
            if (key.includes('PASS') || key.includes('SECRET') || key.includes('URI')) {
                if (key === 'MONGO_URI') {
                    // Show only the connection type
                    displayValue = value.includes('mongodb+srv') ? 'mongodb+srv://***' : 'mongodb://***';
                } else {
                    displayValue = '*'.repeat(Math.min(value.length, 20));
                }
            }
            console.log(`✅ ${key}: SET`);
            console.log(`   Value: ${displayValue}`);
            console.log('');
        } else {
            console.log(`⚠️  ${key}: SET BUT MAY BE INVALID`);
            console.log(`   Value: ${value.substring(0, 20)}...`);
            console.log('');
        }
    }
});

console.log('='.repeat(60));
console.log('\n📋 Summary:\n');

if (allGood && warnings.length === 0) {
    console.log('✅ All required environment variables are set correctly!');
} else {
    if (!allGood) {
        console.log(`❌ Missing ${missing.length} required variable(s): ${missing.join(', ')}`);
    }
    if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        warnings.forEach(w => console.log(`   - ${w}`));
    }
}

// Email-specific checks
console.log('\n📧 Email Configuration Tips:\n');
console.log('1. EMAIL_USER should be your Gmail address');
console.log('2. EMAIL_PASS must be a Gmail App Password (not your regular password)');
console.log('   To create an App Password:');
console.log('   - Go to Google Account > Security');
console.log('   - Enable 2-Step Verification');
console.log('   - Go to App Passwords');
console.log('   - Generate a new app password for "Mail"');
console.log('3. EMAIL_FROM is optional (defaults to EMAIL_USER)');
console.log('4. On Render, make sure these are set in Environment Variables section');

// Test email connection if all email vars are set
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('\n🔌 Testing Email Connection...\n');
    const { verifyEmailConnection } = require('./utils/emailService');
    verifyEmailConnection().then(result => {
        if (result.success) {
            console.log('✅ Email server connection successful!');
        } else {
            console.log('❌ Email server connection failed:');
            console.log(`   ${result.error}`);
            console.log('\n💡 Troubleshooting:');
            console.log('   - Check if EMAIL_PASS is a valid Gmail App Password');
            console.log('   - Ensure 2-Step Verification is enabled on your Google account');
            console.log('   - Try using port 587 instead of 465 (already configured)');
            console.log('   - Check Render logs for connection timeout errors');
        }
    }).catch(err => {
        console.log('❌ Error testing email connection:');
        console.log(`   ${err.message}`);
    });
}

console.log('\n');

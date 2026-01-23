require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('Testing email configuration...');
    console.log('User:', process.env.EMAIL_USER);
    // Hide password for security in logs, show first 3 chars
    console.log('Pass:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 3) + '***' : 'Not Set');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        console.log('Attempting to verify transporter...');
        await transporter.verify();
        console.log('Transporter verification successful!');

        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Debugger',
            text: 'If you see this, email configuration is working.',
        });
        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Email Test Failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        console.error('Full Error:', error);
    }
}

testEmail();

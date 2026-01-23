const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Generate a random 8-digit OTP
 */
const generateOTP = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};

/**
 * Send OTP email for registration or password reset
 * @param {string} email - Recipient email address
 * @param {string} otp - The OTP to send
 * @param {string} type - 'registration' or 'password_reset'
 */
const sendOTPEmail = async (email, otp, type = 'registration') => {
    const subject = type === 'registration'
        ? 'Academic Audit - Email Verification Code'
        : 'Academic Audit - Password Reset Code';

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Academic Audit</h2>
        <p>Here is your Academic Audit sudo authentication code:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h1>
        </div>
        <p>This code is valid for <strong>15 minutes</strong> and can only be used once.</p>
        <p style="color: #666;">Please don't share this code with anyone: we'll never ask for it on the phone or via email.</p>
        <br/>
        <p>Thanks,<br/>The Academic Audit Team</p>
    </div>
    `;

    const textContent = `Here is your Academic Audit sudo authentication code:

${otp}

This code is valid for 15 minutes and can only be used once.

Please don't share this code with anyone: we'll never ask for it on the phone or via email.

Thanks,
The Academic Audit Team`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email. Please try again later.');
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
};

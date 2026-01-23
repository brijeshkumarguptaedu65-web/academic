const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
// Optimized for cloud platforms like Render
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS instead of SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    // Increased timeouts for Render/cloud platforms
    connectionTimeout: 30000, // 30 seconds (increased from 10)
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 30000,     // 30 seconds
    // Pool connections for better reliability
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
    rateDelta: 1000,
    rateLimit: 5,
    debug: process.env.NODE_ENV === 'development', // enable debug in development only
    logger: process.env.NODE_ENV === 'development' // log to console in development only
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

    // Retry logic for Render/cloud platforms
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
        const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully (attempt ${attempt}):`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
            lastError = error;
            console.error(`Email send attempt ${attempt} failed:`, error.message);
            
            // Don't retry on authentication errors
            if (error.code === 'EAUTH' || error.responseCode === 535) {
                console.error('Authentication error - not retrying');
                break;
            }
            
            // Retry with exponential backoff
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed
    console.error('Email send failed after all retries:', lastError.message);
    console.error('Email error details:', {
        code: lastError.code,
        command: lastError.command,
        response: lastError.response,
        responseCode: lastError.responseCode
    });
    
    // Return error instead of throwing - let the caller decide how to handle
    return { 
        success: false, 
        error: lastError.message,
        code: lastError.code,
        responseCode: lastError.responseCode
    };
};

/**
 * Verify email transporter connection
 */
const verifyEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('✓ Email server is ready to send messages');
        return { success: true };
    } catch (error) {
        console.error('✗ Email server connection error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    verifyEmailConnection,
};

require('dotenv').config();
const { verifyEmailConnection, sendOTPEmail, generateOTP } = require('./utils/emailService');

async function testEmail() {
    console.log('=== Email Service Test ===\n');

    console.log('Environment Variables:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('\n');

    // Test connection
    console.log('1. Testing email server connection...');
    const connectionResult = await verifyEmailConnection();

    if (!connectionResult.success) {
        console.error('\n❌ Email connection failed. Please check:');
        console.error('   - EMAIL_USER and EMAIL_PASS are set in .env');
        console.error('   - You are using an App Password (not your regular Gmail password)');
        console.error('   - 2-Factor Authentication is enabled on your Gmail account');
        console.error('   - Less secure app access is enabled (if not using App Password)');
        console.error('\nError:', connectionResult.error);
        process.exit(1);
    }

    console.log('\n✓ Connection successful!\n');

    // Optionally send a test email
    const testEmail = process.argv[2];
    if (testEmail) {
        console.log(`2. Sending test OTP email to: ${testEmail}`);
        try {
            const otp = generateOTP();
            await sendOTPEmail(testEmail, otp, 'registration');
            console.log('✓ Test email sent successfully!');
            console.log('OTP sent:', otp);
        } catch (error) {
            console.error('❌ Failed to send test email:', error.message);
            process.exit(1);
        }
    } else {
        console.log('2. To send a test email, run: node testEmail.js your-email@example.com');
    }

    console.log('\n✅ All tests passed!');
    process.exit(0);
}

testEmail().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});

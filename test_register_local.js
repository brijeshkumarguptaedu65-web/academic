const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testRegistration() {
    try {
        console.log('🧪 Testing User Registration API Locally');
        console.log('==========================================\n');
        console.log('Base URL:', BASE_URL);
        console.log('');

        // First, check if server is running
        try {
            const healthCheck = await axios.get(`${BASE_URL}/`, { timeout: 3000 });
            console.log('✅ Server is running');
            console.log('Response:', healthCheck.data);
            console.log('');
        } catch (err) {
            console.error('❌ Server is not responding!');
            console.error('Make sure your server is running: npm start or node server.js');
            console.error('Error:', err.message);
            process.exit(1);
        }

        // Test registration
        const registrationData = {
            name: "Test User",
            email: "varun.singhal78@gmail.com",
            mobile: "9876543210",
            password: "123456"
        };

        console.log('📝 Registration Request:');
        console.log(JSON.stringify(registrationData, null, 2));
        console.log('');
        console.log('⏳ Sending POST request to:', `${BASE_URL}/api/user/register`);
        console.log('');

        const response = await axios.post(
            `${BASE_URL}/api/user/register`,
            registrationData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ Success!');
        console.log('HTTP Status:', response.status);
        console.log('');
        console.log('📥 Response:');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('');

        if (response.data.otp) {
            console.log('📧 OTP received (development mode):', response.data.otp);
            console.log('');
            console.log('💡 Next step: Verify OTP');
            console.log(`curl -X POST ${BASE_URL}/api/user/verify-otp \\`);
            console.log(`  -H "Content-Type: application/json" \\`);
            console.log(`  -d '{"email":"${registrationData.email}","otp":"${response.data.otp}"}'`);
        } else {
            console.log('📧 Check your email for OTP');
        }

    } catch (error) {
        console.error('\n❌ Error occurred:');
        
        if (error.response) {
            // Server responded with error status
            console.error('HTTP Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Request was made but no response received
            console.error('No response received from server');
            console.error('Make sure server is running on port 5000');
        } else {
            // Error setting up the request
            console.error('Error:', error.message);
        }
        
        if (error.stack) {
            console.error('\nStack Trace:');
            console.error(error.stack);
        }
    }
}

testRegistration();

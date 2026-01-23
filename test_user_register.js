const axios = require('axios');

const BASE_URL = 'https://academic-7mkg.onrender.com';

async function testRegistration() {
    try {
        console.log('Testing user registration...\n');
        
        const registrationData = {
            name: "lll",
            email: "varun.singhal78@gmail.com",
            mobile: "9896904632",
            password: "123456"
        };

        console.log('Request Data:', JSON.stringify(registrationData, null, 2));
        console.log('\nSending POST request to:', `${BASE_URL}/api/user/register`);

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

        console.log('\n✅ Success!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('\n❌ Error occurred:');
        
        if (error.response) {
            // Server responded with error status
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Request was made but no response received
            console.error('No response received from server');
            console.error('Request:', error.request);
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

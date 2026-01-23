const axios = require('axios');

const API_URL = 'https://academic-7mkg.onrender.com/api';
const ENDPOINT = '/admin/learning-outcomes';

const testAPI = async () => {
    try {
        console.log('=== Testing Learning Outcomes API ===\n');
        
        // Step 1: Login to get token
        console.log('[1] Logging in as admin...');
        let adminToken;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            adminToken = loginRes.data.token;
            console.log('✓ Admin logged in successfully\n');
        } catch (loginErr) {
            // Try register if login fails
            try {
                console.log('Login failed, trying to register...');
                const registerRes = await axios.post(`${API_URL}/auth/admin/register`, {
                    email: 'admin@test.com',
                    password: 'password123'
                });
                adminToken = registerRes.data.token;
                console.log('✓ Admin registered and logged in\n');
            } catch (regErr) {
                console.error('✗ Failed to login/register:', regErr.response?.data || regErr.message);
                console.log('\nPlease provide a valid admin token or credentials in the script\n');
                return;
            }
        }

        // Step 2: Make the API request with token
        console.log('[2] Making API request...');
        console.log('URL:', `${API_URL}${ENDPOINT}`);
        console.log('Query Parameters:');
        console.log('  - classId: 696f1e32570003266cdcf2ff');
        console.log('  - subjectId: 696f1e32570003266cdcf305');
        console.log('  - type: SUBJECT');
        console.log('\n');

        const response = await axios.get(`${API_URL}${ENDPOINT}`, {
            params: {
                classId: '696f1e32570003266cdcf2ff',
                subjectId: '696f1e32570003266cdcf305',
                type: 'SUBJECT'
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            timeout: 30000 // 30 seconds timeout
        });

        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Headers:', JSON.stringify(response.headers, null, 2));
        console.log('\n=== Response Body ===\n');
        
        // Pretty print the JSON response
        console.log(JSON.stringify(response.data, null, 2));
        
        // Summary
        if (Array.isArray(response.data)) {
            console.log(`\n\n=== Summary ===`);
            console.log(`Total Learning Outcomes: ${response.data.length}`);
            
            if (response.data.length > 0) {
                const withMappings = response.data.filter(o => o.mappedLearningOutcomes && o.mappedLearningOutcomes.length > 0);
                console.log(`Learning Outcomes with Mappings: ${withMappings.length}`);
                
                // Group by topic
                const byTopic = {};
                response.data.forEach(o => {
                    const topic = o.topicName || 'No Topic';
                    byTopic[topic] = (byTopic[topic] || 0) + 1;
                });
                
                console.log('\nBy Topic:');
                Object.keys(byTopic).forEach(topic => {
                    console.log(`  - ${topic}: ${byTopic[topic]} outcomes`);
                });
            }
        }

        console.log('\n✅ Request Complete!');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error occurred:\n');
        
        if (err.response) {
            // Server responded with error status
            console.error('Status:', err.response.status);
            console.error('Status Text:', err.response.statusText);
            console.error('\nResponse Data:');
            console.error(JSON.stringify(err.response.data, null, 2));
            
            if (err.response.data && err.response.data.message) {
                console.error('\nError Message:', err.response.data.message);
            }
        } else if (err.request) {
            // Request was made but no response received
            console.error('No response received from server');
            console.error('Request details:', err.request);
        } else {
            // Error setting up the request
            console.error('Error:', err.message);
        }
        
        console.error('\nFull Error:', err);
        process.exit(1);
    }
};

testAPI();

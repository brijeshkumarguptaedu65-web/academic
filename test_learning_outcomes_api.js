const axios = require('axios');

const API_URL = process.env.API_URL || 'https://academic-7mkg.onrender.com/api';
// For local testing, use: const API_URL = 'http://localhost:5000/api';

const testLearningOutcomesAPI = async () => {
    try {
        console.log('=== Testing Learning Outcomes API ===\n');

        // 1. Login as admin (or use existing token)
        console.log('[1] Logging in as admin...');
        let adminToken;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            adminToken = loginRes.data.token;
            console.log('✓ Admin logged in\n');
        } catch (e) {
            // Try register if login fails
            try {
                const registerRes = await axios.post(`${API_URL}/auth/admin/register`, {
                    email: 'admin@test.com',
                    password: 'password123'
                });
                adminToken = registerRes.data.token;
                console.log('✓ Admin registered and logged in\n');
            } catch (regErr) {
                console.error('✗ Failed to login/register:', regErr.response?.data || regErr.message);
                console.log('\nPlease provide a valid admin token in the script\n');
                return;
            }
        }

        const headers = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };

        // 2. Test GET Learning Outcomes API
        console.log('[2] Testing GET /api/admin/learning-outcomes...');
        console.log('URL: GET /api/admin/learning-outcomes?subjectId=696f1e32570003266cdcf305&type=SUBJECT\n');

        const response = await axios.get(`${API_URL}/admin/learning-outcomes`, {
            params: {
                subjectId: '696f1e32570003266cdcf305',
                type: 'SUBJECT'
            },
            headers
        });

        console.log('✓ API Response Received\n');
        console.log('=== Response Summary ===');
        console.log(`Total Learning Outcomes: ${response.data.length}\n`);

        // Display each learning outcome
        response.data.forEach((outcome, index) => {
            console.log(`\n[${index + 1}] Learning Outcome ID: ${outcome.id}`);
            console.log(`   Text: ${outcome.text}`);
            console.log(`   Type: ${outcome.type}`);
            console.log(`   Class: ${outcome.classId?.name || 'N/A'} (Level ${outcome.classId?.level || 'N/A'})`);
            console.log(`   Subject: ${outcome.subjectId?.name || 'N/A'}`);
            console.log(`   Topic: ${outcome.topicName || 'N/A'}`);
            console.log(`   Mappings Count: ${outcome.mappedLearningOutcomes?.length || 0}`);

            if (outcome.mappedLearningOutcomes && outcome.mappedLearningOutcomes.length > 0) {
                console.log(`   Mappings:`);
                outcome.mappedLearningOutcomes.forEach((mapping, mIdx) => {
                    console.log(`     [${mIdx + 1}] ${mapping.fromTag || 'N/A'} → ${mapping.toTag || 'N/A'}`);
                    console.log(`         Type: ${mapping.mappingType}, Score: ${mapping.relevanceScore}`);
                    console.log(`         Class ${mapping.learningOutcome?.classLevel || 'N/A'}: ${mapping.learningOutcome?.text || 'N/A'}`);
                });
            }
        });

        // 3. Check for errors
        console.log('\n=== Validation ===');
        const hasNullClassId = response.data.some(o => !o.classId || !o.classId.level);
        if (hasNullClassId) {
            console.log('⚠️  WARNING: Some learning outcomes have null classId');
        } else {
            console.log('✓ All learning outcomes have valid classId');
        }

        const hasMappings = response.data.some(o => o.mappedLearningOutcomes && o.mappedLearningOutcomes.length > 0);
        if (hasMappings) {
            console.log('✓ Some learning outcomes have mappings');
        } else {
            console.log('⚠️  No mappings found (may need to recalculate)');
        }

        // 4. Full JSON response (formatted)
        console.log('\n=== Full JSON Response ===');
        console.log(JSON.stringify(response.data, null, 2));

        console.log('\n✅ Test Complete!');

    } catch (err) {
        console.error('\n✗ Error:', err.response?.data || err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Response:', JSON.stringify(err.response.data, null, 2));
        }
        process.exit(1);
    }
};

// Run the test
testLearningOutcomesAPI();

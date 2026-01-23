const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'https://academic-7mkg.onrender.com/api';

async function getNumbersLearningOutcomes() {
    try {
        console.log('📚 Fetching Learning Outcomes for "Numbers" Topic\n');
        console.log('='.repeat(80));

        // Step 1: Login as admin
        console.log('\n[1] Logging in as admin...');
        let adminToken;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
                email: 'admin@test.com',
                password: 'password123'
            }, { timeout: 30000 });
            adminToken = loginRes.data.token;
            console.log('✓ Admin logged in successfully');
        } catch (e) {
            try {
                console.log('Login failed, trying to register...');
                const registerRes = await axios.post(`${API_URL}/auth/admin/register`, {
                    email: 'admin@test.com',
                    password: 'password123'
                }, { timeout: 30000 });
                adminToken = registerRes.data.token;
                console.log('✓ Admin registered and logged in');
            } catch (regErr) {
                console.error('✗ Failed to login/register:', regErr.response?.data || regErr.message);
                return;
            }
        }

        const headers = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };

        const subjectId = '696f1e32570003266cdcf305'; // Mathematics
        const type = 'SUBJECT';

        // Step 2: Get learning outcomes by topic
        console.log('\n[2] Fetching learning outcomes for "Numbers" topic...\n');

        const response = await axios.get(`${API_URL}/admin/learning-outcomes/by-topic`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        // Find Numbers topic
        const numbersTopic = response.data.topics.find(t => t.topicName === 'Numbers');

        if (!numbersTopic) {
            console.log('❌ Topic "Numbers" not found');
            return;
        }

        console.log('='.repeat(80));
        console.log('📊 NUMBERS TOPIC - LEARNING OUTCOMES');
        console.log('='.repeat(80));

        // Summary
        console.log(`\n📋 SUMMARY:\n`);
        console.log(`   Topic Name: ${numbersTopic.topicName}`);
        console.log(`   Total Learning Outcomes: ${numbersTopic.learningOutcomes.length}\n`);

        // Group by class
        const byClass = {};
        numbersTopic.learningOutcomes.forEach(lo => {
            const className = lo.classId.name;
            const classLevel = lo.classId.level;
            if (!byClass[className]) {
                byClass[className] = { level: classLevel, outcomes: [] };
            }
            byClass[className].outcomes.push(lo);
        });

        console.log('📝 LEARNING OUTCOMES BY CLASS:\n');
        Object.keys(byClass)
            .sort((a, b) => byClass[a].level - byClass[b].level)
            .forEach(className => {
                const classData = byClass[className];
                console.log(`   ${className} (Level ${classData.level}):`);
                classData.outcomes.forEach((lo, idx) => {
                    console.log(`      ${idx + 1}. ${lo.text}`);
                    if (lo.tags && lo.tags.length > 0) {
                        console.log(`         Tags: ${lo.tags.join(', ')}`);
                    }
                });
                console.log('');
            });

        // Full JSON response
        console.log('\n' + '='.repeat(80));
        console.log('📄 FULL JSON RESPONSE:\n');
        console.log(JSON.stringify(numbersTopic, null, 2));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

getNumbersLearningOutcomes();

const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'https://academic-7mkg.onrender.com/api';

async function getAdditionLearningOutcomes() {
    try {
        console.log('📚 Fetching Learning Outcomes for "Addition" Topic\n');
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
        console.log('\n[2] Fetching learning outcomes for "Addition" topic...');
        console.log(`   URL: ${API_URL}/admin/learning-outcomes/by-topic`);
        console.log(`   Params: type=${type}, subjectId=${subjectId}\n`);

        const response = await axios.get(`${API_URL}/admin/learning-outcomes/by-topic`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        // Find Addition topic
        const additionTopic = response.data.topics.find(t => t.topicName === 'Addition');

        if (!additionTopic) {
            console.log('❌ Topic "Addition" not found');
            console.log('\nAvailable topics:');
            response.data.topics.forEach(t => console.log(`   - ${t.topicName}`));
            return;
        }

        console.log('='.repeat(80));
        console.log('📊 ADDITION TOPIC - LEARNING OUTCOMES');
        console.log('='.repeat(80));
        console.log(JSON.stringify(additionTopic, null, 2));
        console.log('='.repeat(80));

        // Summary
        console.log('\n📋 SUMMARY:\n');
        console.log(`   Topic Name: ${additionTopic.topicName}`);
        console.log(`   Total Learning Outcomes: ${additionTopic.learningOutcomes.length}\n`);

        // Group by class
        const byClass = {};
        additionTopic.learningOutcomes.forEach(lo => {
            const className = lo.classId.name;
            if (!byClass[className]) {
                byClass[className] = [];
            }
            byClass[className].push(lo);
        });

        console.log('📝 LEARNING OUTCOMES BY CLASS:\n');
        Object.keys(byClass).sort().forEach(className => {
            console.log(`   ${className} (Level ${byClass[className][0].classId.level}):`);
            byClass[className].forEach((lo, idx) => {
                console.log(`      ${idx + 1}. ${lo.text}`);
                if (lo.tags && lo.tags.length > 0) {
                    console.log(`         Tags: ${lo.tags.join(', ')}`);
                }
            });
            console.log('');
        });

        // Detailed view
        console.log('\n' + '='.repeat(80));
        console.log('📄 DETAILED LEARNING OUTCOMES:\n');
        additionTopic.learningOutcomes.forEach((lo, idx) => {
            console.log(`${idx + 1}. ID: ${lo.id}`);
            console.log(`   Class: ${lo.classId.name} (Level ${lo.classId.level})`);
            console.log(`   Subject: ${lo.subjectId?.name || 'N/A'}`);
            console.log(`   Text: ${lo.text}`);
            if (lo.tags && lo.tags.length > 0) {
                console.log(`   Tags: ${lo.tags.join(', ')}`);
            }
            console.log(`   Created: ${new Date(lo.createdAt).toLocaleString()}`);
            console.log(`   Updated: ${new Date(lo.updatedAt).toLocaleString()}`);
            console.log('');
        });

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('Request made but no response received');
        }
    }
}

getAdditionLearningOutcomes();

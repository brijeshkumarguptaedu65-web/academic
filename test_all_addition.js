const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'https://academic-7mkg.onrender.com/api';

async function checkAdditionTopic() {
    try {
        console.log('🔍 Checking "Addition" Topic in Learning Outcomes\n');
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

        // Step 2: Get ALL learning outcomes (not filtered by topic)
        console.log('\n[2] Fetching ALL learning outcomes...');
        const allOutcomesRes = await axios.get(`${API_URL}/admin/learning-outcomes`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        // Step 3: Filter for Addition topic
        const additionOutcomes = allOutcomesRes.data.filter(lo => {
            const topicName = lo.topicName || '';
            return topicName.toLowerCase().includes('addition') || topicName === 'Addition';
        });

        console.log(`\n✓ Found ${additionOutcomes.length} learning outcomes with "Addition" in topic name\n`);

        if (additionOutcomes.length === 0) {
            console.log('❌ No learning outcomes found for "Addition" topic');
            console.log('\nChecking all unique topic names...');
            const allTopics = [...new Set(allOutcomesRes.data.map(lo => lo.topicName || 'No Topic'))];
            allTopics.sort().forEach(topic => {
                const count = allOutcomesRes.data.filter(lo => (lo.topicName || 'No Topic') === topic).length;
                console.log(`   - ${topic} (${count} outcomes)`);
            });
            return;
        }

        // Step 4: Get by-topic API response
        console.log('[3] Checking by-topic API...');
        const byTopicRes = await axios.get(`${API_URL}/admin/learning-outcomes/by-topic`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        const additionTopic = byTopicRes.data.topics.find(t => 
            t.topicName.toLowerCase().includes('addition') || t.topicName === 'Addition'
        );

        console.log(`\n✓ By-topic API: ${additionTopic ? `Found "${additionTopic.topicName}" with ${additionTopic.learningOutcomes.length} outcomes` : 'Not found'}\n`);

        // Step 5: Display Addition outcomes
        console.log('='.repeat(80));
        console.log('📊 ADDITION TOPIC - LEARNING OUTCOMES');
        console.log('='.repeat(80));

        // Group by class
        const byClass = {};
        additionOutcomes.forEach(lo => {
            const className = lo.classId?.name || 'Unknown';
            const classLevel = lo.classId?.level || 0;
            if (!byClass[className]) {
                byClass[className] = { level: classLevel, outcomes: [] };
            }
            byClass[className].outcomes.push(lo);
        });

        console.log(`\n📋 SUMMARY:\n`);
        console.log(`   Total Learning Outcomes: ${additionOutcomes.length}`);
        console.log(`   Classes: ${Object.keys(byClass).length}\n`);

        console.log('📝 LEARNING OUTCOMES BY CLASS:\n');
        Object.keys(byClass)
            .sort((a, b) => byClass[a].level - byClass[b].level)
            .forEach(className => {
                const classData = byClass[className];
                console.log(`   ${className} (Level ${classData.level}):`);
                classData.outcomes.forEach((lo, idx) => {
                    console.log(`      ${idx + 1}. ${lo.text}`);
                    console.log(`         ID: ${lo.id}`);
                    console.log(`         Topic: ${lo.topicName || 'No Topic'}`);
                });
                console.log('');
            });

        // Full JSON
        console.log('\n' + '='.repeat(80));
        console.log('📄 FULL JSON RESPONSE:\n');
        console.log(JSON.stringify(additionOutcomes, null, 2));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

checkAdditionTopic();

const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'https://academic-7mkg.onrender.com/api';

async function compareTopics() {
    try {
        console.log('🔍 Comparing Topics from Learning Outcomes vs Topic List API\n');
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

        // Step 2: Get topics from learning outcomes API
        console.log('\n[2] Fetching topics from Learning Outcomes API...');
        const learningOutcomesRes = await axios.get(`${API_URL}/admin/learning-outcomes/by-topic`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        const topicsFromLearningOutcomes = learningOutcomesRes.data.topics.map(t => t.topicName);
        console.log(`✓ Found ${topicsFromLearningOutcomes.length} topics from Learning Outcomes API`);
        console.log('   Topics:', topicsFromLearningOutcomes.join(', '));

        // Step 3: Get topics from Topic List API
        console.log('\n[3] Fetching topics from Topic List API...');
        const topicListRes = await axios.get(`${API_URL}/admin/curriculum/topics`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        const topicsFromTopicList = topicListRes.data.topics.map(t => t.topicName);
        console.log(`✓ Found ${topicsFromTopicList.length} topics from Topic List API`);
        console.log('   Topics:', topicsFromTopicList.join(', '));

        // Step 4: Compare
        console.log('\n[4] Comparing topics...\n');
        console.log('='.repeat(80));

        const topicsInLearningOutcomes = new Set(topicsFromLearningOutcomes);
        const topicsInTopicList = new Set(topicsFromTopicList);

        // Topics in Learning Outcomes but NOT in Topic List
        const missingInTopicList = topicsFromLearningOutcomes.filter(t => !topicsInTopicList.has(t));
        
        // Topics in Topic List but NOT in Learning Outcomes
        const missingInLearningOutcomes = topicsFromTopicList.filter(t => !topicsInLearningOutcomes.has(t));

        // Common topics
        const commonTopics = topicsFromLearningOutcomes.filter(t => topicsInTopicList.has(t));

        console.log(`\n📊 COMPARISON RESULTS:\n`);
        console.log(`   Total topics in Learning Outcomes API: ${topicsFromLearningOutcomes.length}`);
        console.log(`   Total topics in Topic List API: ${topicsFromTopicList.length}`);
        console.log(`   Common topics: ${commonTopics.length}`);
        console.log(`   Missing in Topic List API: ${missingInTopicList.length}`);
        console.log(`   Missing in Learning Outcomes API: ${missingInLearningOutcomes.length}`);

        if (missingInTopicList.length > 0) {
            console.log(`\n⚠️  TOPICS IN LEARNING OUTCOMES BUT NOT IN TOPIC LIST API:`);
            missingInTopicList.forEach(topic => {
                console.log(`   - ${topic}`);
            });
        }

        if (missingInLearningOutcomes.length > 0) {
            console.log(`\n⚠️  TOPICS IN TOPIC LIST API BUT NOT IN LEARNING OUTCOMES:`);
            missingInLearningOutcomes.forEach(topic => {
                console.log(`   - ${topic}`);
            });
        }

        if (missingInTopicList.length === 0 && missingInLearningOutcomes.length === 0) {
            console.log(`\n✅ All topics match!`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n📋 DETAILED TOPIC LIST:\n');
        console.log('Learning Outcomes API Topics:');
        topicsFromLearningOutcomes.forEach((topic, idx) => {
            console.log(`   ${idx + 1}. ${topic}`);
        });
        console.log('\nTopic List API Topics:');
        topicsFromTopicList.forEach((topic, idx) => {
            console.log(`   ${idx + 1}. ${topic}`);
        });

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

compareTopics();

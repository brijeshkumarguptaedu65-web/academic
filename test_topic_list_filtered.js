const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'https://academic-7mkg.onrender.com/api';

async function testTopicListFiltered() {
    try {
        console.log('🔍 Testing Topic List - Only Topics with Learning Outcomes\n');
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

        // Step 2: Get topic list
        console.log('\n[2] Fetching topic list...\n');
        const topicListRes = await axios.get(`${API_URL}/admin/curriculum/topics`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        // Step 3: Get learning outcomes by topic
        console.log('[3] Fetching learning outcomes by topic...\n');
        const byTopicRes = await axios.get(`${API_URL}/admin/learning-outcomes/by-topic`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        // Step 4: Compare
        const topicsFromTopicList = topicListRes.data.topics.map(t => t.topicName);
        const topicsFromByTopic = byTopicRes.data.topics.map(t => t.topicName);

        console.log('='.repeat(80));
        console.log('📊 COMPARISON RESULTS');
        console.log('='.repeat(80));
        console.log(`\nTopic List API: ${topicsFromTopicList.length} topics`);
        console.log(`By-Topic API: ${topicsFromByTopic.length} topics\n`);

        // Check if all topics in Topic List have learning outcomes
        const topicsWithoutOutcomes = topicsFromTopicList.filter(topic => 
            !topicsFromByTopic.includes(topic)
        );

        if (topicsWithoutOutcomes.length > 0) {
            console.log('⚠️  TOPICS IN TOPIC LIST BUT NO LEARNING OUTCOMES:');
            topicsWithoutOutcomes.forEach(topic => {
                console.log(`   - ${topic}`);
            });
        } else {
            console.log('✅ All topics in Topic List have learning outcomes!');
        }

        // Check if all topics with learning outcomes are in Topic List
        const missingInTopicList = topicsFromByTopic.filter(topic => 
            !topicsFromTopicList.includes(topic)
        );

        if (missingInTopicList.length > 0) {
            console.log('\n⚠️  TOPICS WITH LEARNING OUTCOMES BUT NOT IN TOPIC LIST:');
            missingInTopicList.forEach(topic => {
                console.log(`   - ${topic}`);
            });
        } else {
            console.log('\n✅ All topics with learning outcomes are in Topic List!');
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n📋 DETAILED COMPARISON:\n');
        console.log('Topics in Topic List API:');
        topicsFromTopicList.forEach((topic, idx) => {
            const hasOutcomes = topicsFromByTopic.includes(topic);
            const outcomeCount = byTopicRes.data.topics.find(t => t.topicName === topic)?.learningOutcomes?.length || 0;
            console.log(`   ${idx + 1}. ${topic} ${hasOutcomes ? '✅' : '❌'} (${outcomeCount} outcomes)`);
        });

        console.log('\nTopics in By-Topic API:');
        topicsFromByTopic.forEach((topic, idx) => {
            const inTopicList = topicsFromTopicList.includes(topic);
            const outcomeCount = byTopicRes.data.topics.find(t => t.topicName === topic)?.learningOutcomes?.length || 0;
            console.log(`   ${idx + 1}. ${topic} ${inTopicList ? '✅' : '❌'} (${outcomeCount} outcomes)`);
        });

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testTopicListFiltered();

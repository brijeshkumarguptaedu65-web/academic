const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'https://academic-7mkg.onrender.com/api';

async function getTopicList() {
    try {
        console.log('📋 Fetching Topic List API Response\n');
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
        console.log('\n[2] Fetching topic list...');
        console.log(`   URL: ${API_URL}/admin/curriculum/topics`);
        console.log(`   Params: type=${type}, subjectId=${subjectId}\n`);

        const response = await axios.get(`${API_URL}/admin/curriculum/topics`, {
            params: { type, subjectId },
            headers,
            timeout: 60000
        });

        console.log('='.repeat(80));
        console.log('📊 TOPIC LIST API RESPONSE');
        console.log('='.repeat(80));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('='.repeat(80));

        // Summary
        console.log('\n📋 SUMMARY:\n');
        console.log(`   Total Topics: ${response.data.totalTopics}`);
        console.log(`   Topics with Concept Graph: ${response.data.topics.filter(t => t.hasConceptGraph).length}`);
        console.log(`   Topics without Concept Graph: ${response.data.topics.filter(t => !t.hasConceptGraph).length}\n`);

        console.log('📝 TOPIC DETAILS:\n');
        response.data.topics.forEach((topic, idx) => {
            console.log(`   ${idx + 1}. ${topic.topicName}`);
            console.log(`      - Has Concept Graph: ${topic.hasConceptGraph ? '✅' : '❌'}`);
            if (topic.hasConceptGraph) {
                console.log(`      - Last Calculated: ${new Date(topic.lastCalculatedAt).toLocaleString()}`);
                console.log(`      - Concepts: ${topic.totalConcepts}`);
                console.log(`      - Nodes: ${topic.totalNodes}`);
                console.log(`      - Edges: ${topic.totalEdges}`);
            }
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

getTopicList();

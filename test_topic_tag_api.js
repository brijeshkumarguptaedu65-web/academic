const axios = require('axios');

const API_URL = 'https://academic-7mkg.onrender.com/api';

const testTopicTagAPI = async () => {
    try {
        console.log('=== Testing Topic Tag Mapping API ===\n');

        // Step 1: Login as admin
        console.log('[1] Logging in as admin...');
        let adminToken;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            adminToken = loginRes.data.token;
            console.log('✓ Admin logged in successfully\n');
        } catch (e) {
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
                return;
            }
        }

        const headers = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };

        // Step 2: Get learning outcomes grouped by topic
        console.log('[2] Testing GET /api/admin/learning-outcomes/by-topic...');
        console.log('URL: GET /api/admin/learning-outcomes/by-topic?type=SUBJECT&subjectId=696f1e32570003266cdcf305\n');

        const topicsResponse = await axios.get(`${API_URL}/admin/learning-outcomes/by-topic`, {
            params: {
                type: 'SUBJECT',
                subjectId: '696f1e32570003266cdcf305'
            },
            headers,
            timeout: 30000
        });

        console.log('✅ Response Status:', topicsResponse.status);
        console.log('\n=== Topics Response ===\n');
        console.log(JSON.stringify(topicsResponse.data, null, 2));

        // Step 3: Get tag mappings for the first topic (if available)
        if (topicsResponse.data.topics && topicsResponse.data.topics.length > 0) {
            const firstTopic = topicsResponse.data.topics[0];
            const topicName = firstTopic.topicName;
            
            console.log(`\n\n[3] Testing GET /api/admin/curriculum/topics/${topicName}/tag-mappings...`);
            console.log(`URL: GET /api/admin/curriculum/topics/${encodeURIComponent(topicName)}/tag-mappings?type=SUBJECT&subjectId=696f1e32570003266cdcf305\n`);
            console.log('⚠️  Note: This may take a while as it calls DeepSeek API for each tag pair...\n');

            try {
                const mappingsResponse = await axios.get(
                    `${API_URL}/admin/curriculum/topics/${encodeURIComponent(topicName)}/tag-mappings`,
                    {
                        params: {
                            type: 'SUBJECT',
                            subjectId: '696f1e32570003266cdcf305'
                        },
                        headers,
                        timeout: 120000 // 2 minutes timeout for AI processing
                    }
                );

                console.log('✅ Response Status:', mappingsResponse.status);
                console.log('\n=== Tag Mappings Response ===\n');
                console.log(JSON.stringify(mappingsResponse.data, null, 2));

                // Summary
                if (mappingsResponse.data.tagMappings) {
                    console.log(`\n\n=== Summary ===`);
                    console.log(`Topic: ${mappingsResponse.data.topicName}`);
                    console.log(`Total Learning Outcomes: ${mappingsResponse.data.totalLearningOutcomes}`);
                    console.log(`Total Tags: ${mappingsResponse.data.totalTags}`);
                    console.log(`Total Mappings (relevance >= 60%): ${mappingsResponse.data.totalMappings}`);
                    
                    if (mappingsResponse.data.tagMappings.length > 0) {
                        console.log(`\nTop 3 Mappings:`);
                        mappingsResponse.data.tagMappings.slice(0, 3).forEach((mapping, idx) => {
                            console.log(`\n  [${idx + 1}] ${mapping.fromTag.tag} → ${mapping.toTag.tag}`);
                            console.log(`      Relevance: ${(mapping.relevanceScore * 100).toFixed(1)}%`);
                            console.log(`      Relation: ${mapping.relation}`);
                            console.log(`      Reason: ${mapping.reason.substring(0, 100)}...`);
                        });
                    }
                }
            } catch (mappingErr) {
                console.error('\n❌ Error getting tag mappings:', mappingErr.response?.data || mappingErr.message);
                if (mappingErr.response) {
                    console.error('Status:', mappingErr.response.status);
                    console.error('Response:', JSON.stringify(mappingErr.response.data, null, 2));
                }
            }
        } else {
            console.log('\n⚠️  No topics found. Cannot test tag mappings endpoint.');
        }

        console.log('\n✅ Test Complete!');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error:', err.response?.data || err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Response:', JSON.stringify(err.response.data, null, 2));
        }
        process.exit(1);
    }
};

testTopicTagAPI();

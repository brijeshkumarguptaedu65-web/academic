const axios = require('axios');

const API_URL = 'https://academic-7mkg.onrender.com/api';

const testTopicMappingFlow = async () => {
    try {
        console.log('=== Testing Topic Tag Mapping Flow ===\n');

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

        // Step 2: Get all topics
        console.log('[2] Getting all topics grouped by topic name...');
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
        console.log('\n=== Topics List Response ===\n');
        console.log(`Total Topics: ${topicsResponse.data.totalTopics}`);
        console.log(`Total Learning Outcomes: ${topicsResponse.data.totalLearningOutcomes}\n`);

        // Display topics
        console.log('📚 Available Topics:');
        topicsResponse.data.topics.forEach((topic, idx) => {
            console.log(`\n  [${idx + 1}] ${topic.topicName}`);
            console.log(`      Learning Outcomes: ${topic.learningOutcomes.length}`);
            console.log(`      Classes: ${[...new Set(topic.learningOutcomes.map(lo => lo.classId.level))].sort((a, b) => a - b).join(', ')}`);
        });

        // Step 3: Select first topic and get tag mappings
        if (topicsResponse.data.topics && topicsResponse.data.topics.length > 0) {
            const selectedTopic = topicsResponse.data.topics[0];
            const topicName = selectedTopic.topicName;
            
            console.log(`\n\n[3] Clicking on topic: "${topicName}"`);
            console.log(`URL: GET /api/admin/curriculum/topics/${encodeURIComponent(topicName)}/tag-mappings?type=SUBJECT&subjectId=696f1e32570003266cdcf305\n`);
            console.log('ℹ️  Note: This endpoint reads from database (mappings are calculated in background when learning outcomes are added/updated)\n');

            try {
                const mappingsResponse = await axios.get(
                    `${API_URL}/admin/curriculum/topics/${encodeURIComponent(topicName)}/tag-mappings`,
                    {
                        params: {
                            type: 'SUBJECT',
                            subjectId: '696f1e32570003266cdcf305'
                        },
                        headers,
                        timeout: 30000 // 30 seconds timeout (reading from DB, should be fast)
                    }
                );

                console.log('✅ Response Status:', mappingsResponse.status);
                console.log('\n=== Tag Mappings Response ===\n');
                
                // Summary
                console.log(`Topic: ${mappingsResponse.data.topicName}`);
                console.log(`Total Learning Outcomes: ${mappingsResponse.data.totalLearningOutcomes}`);
                console.log(`Total Tags: ${mappingsResponse.data.totalTags}`);
                console.log(`Total Mappings (relevance >= 60%): ${mappingsResponse.data.totalMappings}\n`);

                // Display tag chains
                if (mappingsResponse.data.tagChains && mappingsResponse.data.tagChains.length > 0) {
                    console.log('🔗 Tag Progression Chains:\n');
                    mappingsResponse.data.tagChains.forEach((chain, chainIdx) => {
                        console.log(`  Chain ${chainIdx + 1}: "${chain.tag.substring(0, 60)}${chain.tag.length > 60 ? '...' : ''}"`);
                        console.log(`    Class: ${chain.className} (Level ${chain.classLevel})`);
                        console.log(`    Progressions: ${chain.progressions.length}`);
                        
                        chain.progressions.forEach((prog, progIdx) => {
                            console.log(`      [${progIdx + 1}] → "${prog.toTag.substring(0, 60)}${prog.toTag.length > 60 ? '...' : ''}"`);
                            console.log(`          Class: ${prog.toClassName} (Level ${prog.toClassLevel})`);
                            console.log(`          Relevance: ${(prog.relevanceScore * 100).toFixed(1)}%`);
                            console.log(`          Relation: ${prog.relation}`);
                            console.log(`          Reason: ${prog.reason.substring(0, 100)}...`);
                        });
                        console.log('');
                    });
                } else {
                    console.log('⚠️  No tag chains found (no mappings with relevance >= 60%)');
                }

                // Display flat mappings summary
                if (mappingsResponse.data.tagMappings && mappingsResponse.data.tagMappings.length > 0) {
                    console.log('\n📊 All Tag Mappings (Flat List):\n');
                    mappingsResponse.data.tagMappings.slice(0, 5).forEach((mapping, idx) => {
                        console.log(`  [${idx + 1}] Class ${mapping.fromTag.classLevel} → Class ${mapping.toTag.classLevel}`);
                        console.log(`      From: "${mapping.fromTag.tag.substring(0, 50)}..."`);
                        console.log(`      To: "${mapping.toTag.tag.substring(0, 50)}..."`);
                        console.log(`      Relevance: ${(mapping.relevanceScore * 100).toFixed(1)}% | Relation: ${mapping.relation}\n`);
                    });
                    if (mappingsResponse.data.tagMappings.length > 5) {
                        console.log(`  ... and ${mappingsResponse.data.tagMappings.length - 5} more mappings\n`);
                    }
                }

                // Full JSON response
                console.log('\n=== Full JSON Response ===\n');
                console.log(JSON.stringify(mappingsResponse.data, null, 2));

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

testTopicMappingFlow();

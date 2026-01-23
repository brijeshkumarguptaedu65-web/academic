const axios = require('axios');

const API_URL = 'https://academic-7mkg.onrender.com/api';

const showNumbersTopic = async () => {
    try {
        console.log('=== Learning Outcomes for "Numbers" Topic ===\n');

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

        // Step 2: Get all topics to find Numbers topic
        console.log('[2] Getting all topics...\n');
        const topicsResponse = await axios.get(`${API_URL}/admin/learning-outcomes/by-topic`, {
            params: {
                type: 'SUBJECT',
                subjectId: '696f1e32570003266cdcf305'
            },
            headers,
            timeout: 30000
        });

        // Find Numbers topic
        const numbersTopic = topicsResponse.data.topics.find(t => t.topicName === 'Numbers');
        
        if (!numbersTopic) {
            console.log('⚠️  "Numbers" topic not found');
            process.exit(0);
        }

        const outcomes = numbersTopic.learningOutcomes;

        console.log(`Total Learning Outcomes: ${outcomes.length}\n`);

        if (outcomes.length === 0) {
            console.log('⚠️  No learning outcomes found for "Numbers" topic');
            process.exit(0);
        }

        // Group by class
        const byClass = {};
        outcomes.forEach(outcome => {
            const classKey = `${outcome.classId.name} (Level ${outcome.classId.level})`;
            if (!byClass[classKey]) {
                byClass[classKey] = [];
            }
            byClass[classKey].push(outcome);
        });

        const classes = Object.keys(byClass).sort((a, b) => {
            const levelA = parseInt(a.match(/Level (\d+)/)?.[1] || '0');
            const levelB = parseInt(b.match(/Level (\d+)/)?.[1] || '0');
            return levelA - levelB;
        });

        // Display by class
        classes.forEach((className, classIdx) => {
            console.log(`${'='.repeat(80)}`);
            console.log(`📖 ${className}`);
            console.log(`${'='.repeat(80)}\n`);

            byClass[className].forEach((outcome, outcomeIdx) => {
                console.log(`  [${outcomeIdx + 1}] ID: ${outcome.id || outcome._id?.toString() || 'N/A'}`);
                console.log(`      Text: ${outcome.text}`);
                console.log(`      Type: ${outcome.type}`);
                console.log(`      Subject: ${outcome.subjectId?.name || 'N/A'}`);
                console.log(`      Topic: ${outcome.topicName || 'N/A'}`);
                
                // Extract and display individual tags (split by newline and comma)
                let tags = [];
                if (outcome.tags && Array.isArray(outcome.tags) && outcome.tags.length > 0) {
                    // If tags array exists, use it but split each tag if it contains newlines
                    outcome.tags.forEach(tag => {
                        const splitTags = tag.split(/\n/).map(t => t.trim()).filter(Boolean);
                        tags.push(...splitTags);
                    });
                } else {
                    // Split by newline first, then by comma
                    const lines = outcome.text ? outcome.text.split(/\n/).map(l => l.trim()).filter(Boolean) : [];
                    lines.forEach(line => {
                        const commaTags = line.split(',').map(t => t.trim()).filter(Boolean);
                        tags.push(...commaTags);
                    });
                }
                
                console.log(`      Tags (${tags.length}):`);
                tags.forEach((tag, tagIdx) => {
                    console.log(`        ${tagIdx + 1}. ${tag}`);
                });
                
                if (outcome.createdAt) {
                    console.log(`      Created: ${new Date(outcome.createdAt).toLocaleString()}`);
                }
                console.log('');
            });
        });

        // Summary
        console.log(`\n${'='.repeat(80)}`);
        console.log('📊 SUMMARY');
        console.log(`${'='.repeat(80)}`);
        console.log(`Topic: Numbers`);
        console.log(`Total Learning Outcomes: ${outcomes.length}`);
        console.log(`Classes: ${classes.length}`);
        console.log(`\nBreakdown by Class:`);
        classes.forEach(className => {
            console.log(`  - ${className}: ${byClass[className].length} learning outcomes`);
        });

        // Total tags count (properly split)
        const allTags = outcomes.flatMap(o => {
            if (o.tags && Array.isArray(o.tags) && o.tags.length > 0) {
                return o.tags.flatMap(tag => tag.split(/\n/).map(t => t.trim()).filter(Boolean));
            } else {
                const lines = o.text ? o.text.split(/\n/).map(l => l.trim()).filter(Boolean) : [];
                return lines.flatMap(line => line.split(',').map(t => t.trim()).filter(Boolean));
            }
        });
        console.log(`\nTotal Individual Tags: ${allTags.length}`);

        console.log('\n✅ Display Complete!');
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

showNumbersTopic();

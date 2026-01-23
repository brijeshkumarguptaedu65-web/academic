const axios = require('axios');
const fs = require('fs');

const API_URL = 'https://academic-7mkg.onrender.com/api';
const DEEPSEEK_API_KEY = "sk-19dadd20743b43b4b970c51680ff97ee";

const generateConceptGraph = async (subject = "Mathematics", topic = "Numbers") => {
    try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎯 Generating Concept-Wise Vertical Learning Graph`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Topic: ${topic}`);
        console.log(`${'='.repeat(80)}\n`);

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

        // Step 2: Get all topics to find the specified topic
        console.log(`[2] Fetching learning outcomes for "${topic}" topic...\n`);
        const topicsResponse = await axios.get(`${API_URL}/admin/learning-outcomes/by-topic`, {
            params: {
                type: 'SUBJECT',
                subjectId: '696f1e32570003266cdcf305'
            },
            headers,
            timeout: 30000
        });

        // Find the specified topic
        const targetTopic = topicsResponse.data.topics.find(t => 
            t.topicName === topic || t.topicName.toLowerCase() === topic.toLowerCase()
        );
        
        if (!targetTopic) {
            console.log(`⚠️  Topic "${topic}" not found`);
            console.log(`Available topics: ${topicsResponse.data.topics.map(t => t.topicName).join(', ')}`);
            process.exit(0);
        }

        const outcomes = targetTopic.learningOutcomes;
        console.log(`✓ Found ${outcomes.length} learning outcomes\n`);

        // Step 3: Extract tags and group by class
        console.log('[3] Extracting tags and grouping by class...\n');
        const classes = [];

        outcomes.forEach(outcome => {
            if (!outcome.classId || !outcome.classId.level) {
                return; // Skip if no valid class
            }

            // Extract tags (split by newline and comma)
            let tags = [];
            if (outcome.tags && Array.isArray(outcome.tags) && outcome.tags.length > 0) {
                outcome.tags.forEach(tag => {
                    const splitTags = tag.split(/\n/).map(t => t.trim()).filter(Boolean);
                    tags.push(...splitTags);
                });
            } else {
                const lines = outcome.text ? outcome.text.split(/\n/).map(l => l.trim()).filter(Boolean) : [];
                lines.forEach(line => {
                    const commaTags = line.split(',').map(t => t.trim()).filter(Boolean);
                    tags.push(...commaTags);
                });
            }

            // Find or create class entry
            let classEntry = classes.find(c => c.class === outcome.classId.level);
            if (!classEntry) {
                classEntry = {
                    class: outcome.classId.level,
                    subject: outcome.subjectId?.name || subject,
                    topic: outcome.topicName || topic,
                    tags: []
                };
                classes.push(classEntry);
            }

            // Add tags to class entry
            classEntry.tags.push(...tags);
        });

        // Sort classes by level
        classes.sort((a, b) => a.class - b.class);

        // Remove duplicate tags within each class
        classes.forEach(classEntry => {
            classEntry.tags = [...new Set(classEntry.tags)];
        });

        console.log(`✓ Extracted tags from ${classes.length} classes:\n`);
        classes.forEach(c => {
            console.log(`   Class ${c.class}: ${c.tags.length} tags`);
        });
        console.log('');

        // Step 4: Generate graph using DeepSeek AI
        console.log('[4] Generating concept-wise vertical learning graph using DeepSeek AI...\n');

        const prompt = `
Generate a single JSON output for a concept-wise vertical learning graph.

CRITICAL RULES:
1. Use all tags from all classes provided.
2. Group tags under concepts automatically (e.g., Place Value, Addition and Subtraction, Multiplication and Division, Fractions, Decimals, Number Properties, Money and Measurement, etc.)
3. Each concept has nodes per class with id, class, tag.
4. EDGE REQUIREMENTS (VERY IMPORTANT):
   - Create edges connecting nodes from lower class → higher class per concept (showing progression).
   - Ensure ALL nodes in higher classes (4, 5, 6, 7, 8) are properly connected from previous class nodes.
   - Maintain class continuity: Class 3 → Class 4 → Class 5 → Class 6 → Class 7 → Class 8
   - Each higher class node should have at least one edge from a lower class node in the same concept.
   - Do NOT skip classes in the progression chain.
5. FORMATTING:
   - Use consistent formatting: replace hyphens with commas where appropriate (e.g., "2, 3, 4, 5" not "2- 3- 4- 5")
   - Keep tag text clean and readable.
6. CONCEPT PURITY:
   - Keep concepts logically separated (e.g., Addition and Subtraction together, Multiplication and Division together).
   - Do not mix unrelated operations within the same concept.

Return ONLY valid JSON in this format:

{
  "subject": "<subject>",
  "topic": "<topic>",
  "graphType": "concept_wise_vertical_learning_graph",
  "conceptGraphs": [
    {
      "concept": "<concept name>",
      "nodes": [
        { "id": "unique_id", "class": <class number>, "tag": "<tag text>" }
      ],
      "edges": [
        { "from": "node_id", "to": "node_id" }
      ]
    }
  ]
}

DATA:
${JSON.stringify(classes, null, 2)}

Return ONLY valid JSON, no additional text or explanations.
`;

        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: `You are an educational AI that generates concept-wise vertical learning graphs. 

CRITICAL REQUIREMENTS:
1. ALL nodes in higher classes (4, 5, 6, 7, 8) MUST be connected from previous class nodes in the same concept.
2. Maintain class continuity: ensure edges flow from lower to higher classes without skipping.
3. Format tags consistently: use commas instead of hyphens (e.g., "2, 3, 4, 5" not "2- 3- 4- 5").
4. Keep concepts logically separated and pure.
5. Always return valid JSON only, no additional text or explanations.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 8000
            },
            {
                headers: {
                    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 180000
            }
        );

        const aiText = response.data.choices[0].message.content.trim();
        
        // Try to extract JSON from the response
        let jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }

        const graphData = JSON.parse(jsonMatch[0]);

        // Step 5: Save to file
        const filename = `learningGraph_${topic.replace(/\s+/g, '_')}.json`;
        fs.writeFileSync(filename, JSON.stringify(graphData, null, 2), "utf-8");
        console.log(`✓ Learning graph JSON saved: ${filename}\n`);

        // Step 6: Display summary
        console.log(`${'='.repeat(80)}`);
        console.log('📊 CONCEPT GRAPH SUMMARY');
        console.log(`${'='.repeat(80)}\n`);

        console.log(`Subject: ${graphData.subject || 'N/A'}`);
        console.log(`Topic: ${graphData.topic || 'N/A'}`);
        console.log(`Graph Type: ${graphData.graphType || 'N/A'}`);
        console.log(`Total Concepts: ${graphData.conceptGraphs?.length || 0}\n`);

        if (graphData.conceptGraphs && Array.isArray(graphData.conceptGraphs)) {
            graphData.conceptGraphs.forEach((conceptGraph, idx) => {
                console.log(`  [${idx + 1}] Concept: ${conceptGraph.concept}`);
                console.log(`      Nodes: ${conceptGraph.nodes?.length || 0}`);
                console.log(`      Edges: ${conceptGraph.edges?.length || 0}`);
                
                // Show class distribution
                if (conceptGraph.nodes && conceptGraph.nodes.length > 0) {
                    const classCounts = {};
                    conceptGraph.nodes.forEach(node => {
                        classCounts[node.class] = (classCounts[node.class] || 0) + 1;
                    });
                    const classDist = Object.entries(classCounts)
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .map(([cls, count]) => `Class ${cls}: ${count}`)
                        .join(', ');
                    console.log(`      Classes: ${classDist}`);
                }
                console.log('');
            });
        }

        // Display full JSON
        console.log(`${'='.repeat(80)}`);
        console.log('📄 FULL JSON RESPONSE');
        console.log(`${'='.repeat(80)}\n`);
        console.log(JSON.stringify(graphData, null, 2));

        console.log(`\n${'='.repeat(80)}`);
        console.log('✅ Complete!');
        console.log(`${'='.repeat(80)}\n`);

        return graphData;

    } catch (error) {
        console.error('\n❌ Error generating concept graph:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.message) {
            console.error('Message:', error.message);
        } else {
            console.error(error);
        }
        
        // Try to show the raw response if available
        if (error.response?.data?.choices?.[0]?.message?.content) {
            console.error('\n📄 Raw AI Response:');
            console.error(error.response.data.choices[0].message.content);
        }
        
        process.exit(1);
    }
};

// Get command line arguments or use defaults
const args = process.argv.slice(2);
const subject = args[0] || "Mathematics";
const topic = args[1] || "Numbers";

// Run the generator
generateConceptGraph(subject, topic);

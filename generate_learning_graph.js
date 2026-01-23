const axios = require('axios');

const DEEPSEEK_API_KEY = "sk-19dadd20743b43b4b970c51680ff97ee";

const generateLearningGraph = async (subject = "Mathematics", mainTopic = "Numbers") => {
    try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎯 Generating Learning Graph for "${mainTopic}" Topic`);
        console.log(`${'='.repeat(80)}\n`);

        const prompt = `
Return ONLY valid JSON.

Goal:
Auto-generate a complete learning GRAPH structure.

Rules:
- Detect concepts automatically
- Map correct topics under each concept
- Maintain concept purity (no mixing)
- No explanations

Graph JSON format:
{
  "nodes": [
    { "id": "", "label": "", "type": "" }
  ],
  "edges": [
    { "from": "", "to": "", "relation": "" }
  ]
}

Node types:
- subject
- mainTopic
- concept
- topic

Subject: ${subject}
Main Topic: ${mainTopic}
`;

        console.log('📡 Calling DeepSeek API...\n');

        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are an educational AI that generates learning graph structures. Always return valid JSON only, no additional text."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 4000
            },
            {
                headers: {
                    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 60000
            }
        );

        const aiText = response.data.choices[0].message.content.trim();
        
        // Try to extract JSON from the response (in case there's extra text)
        let jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }

        const graphData = JSON.parse(jsonMatch[0]);

        console.log('✅ Graph Generated Successfully!\n');
        console.log(`${'='.repeat(80)}`);
        console.log('📊 LEARNING GRAPH STRUCTURE');
        console.log(`${'='.repeat(80)}\n`);

        // Display nodes
        console.log(`📌 NODES (${graphData.nodes?.length || 0}):`);
        console.log(`${'-'.repeat(80)}`);
        if (graphData.nodes && Array.isArray(graphData.nodes)) {
            graphData.nodes.forEach((node, idx) => {
                console.log(`  [${idx + 1}] ID: ${node.id}`);
                console.log(`      Label: ${node.label}`);
                console.log(`      Type: ${node.type}`);
                console.log('');
            });
        } else {
            console.log('  No nodes found');
        }

        // Display edges
        console.log(`\n🔗 EDGES (${graphData.edges?.length || 0}):`);
        console.log(`${'-'.repeat(80)}`);
        if (graphData.edges && Array.isArray(graphData.edges)) {
            graphData.edges.forEach((edge, idx) => {
                console.log(`  [${idx + 1}] ${edge.from} → ${edge.to}`);
                console.log(`      Relation: ${edge.relation || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('  No edges found');
        }

        // Display full JSON
        console.log(`\n${'='.repeat(80)}`);
        console.log('📄 FULL JSON RESPONSE');
        console.log(`${'='.repeat(80)}\n`);
        console.log(JSON.stringify(graphData, null, 2));

        console.log(`\n${'='.repeat(80)}`);
        console.log('✅ Complete!');
        console.log(`${'='.repeat(80)}\n`);

        return graphData;

    } catch (error) {
        console.error('\n❌ Error generating learning graph:');
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

// Run for Numbers topic
generateLearningGraph("Mathematics", "Numbers");

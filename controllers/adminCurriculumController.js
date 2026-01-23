const LearningOutcome = require('../models/LearningOutcome');
const Chapter = require('../models/Chapter');
const CurriculumMapping = require('../models/CurriculumMapping');
const LearningOutcomeMapping = require('../models/LearningOutcomeMapping');
const ConceptGraph = require('../models/ConceptGraph');
const { Class, Subject } = require('../models/Metadata');
const axios = require('axios');

const DEEPSEEK_API_KEY = "sk-19dadd20743b43b4b970c51680ff97ee";

// Helper function to calculate and save curriculum mapping for a learning outcome
const calculateAndSaveCurriculumMapping = async (learningOutcomeId) => {
    try {
        const learningOutcome = await LearningOutcome.findById(learningOutcomeId)
            .populate('classId', 'name level')
            .populate('subjectId', 'name');

        if (!learningOutcome) {
            throw new Error('Learning outcome not found');
        }

        // Get all chapters for the class
        const chapterQuery = { classId: learningOutcome.classId._id };
        if (learningOutcome.type === 'SUBJECT' && learningOutcome.subjectId) {
            chapterQuery.subjectId = learningOutcome.subjectId._id;
        }

        const chapters = await Chapter.find(chapterQuery)
            .populate('classId', 'name level')
            .populate('subjectId', 'name')
            .sort({ createdAt: -1 });

        if (chapters.length === 0) {
            // No chapters available, save empty mapping
            await CurriculumMapping.findOneAndUpdate(
                { learningOutcomeId },
                {
                    learningOutcomeId,
                    mappedChapters: [],
                    lastCalculatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            return { mappedChapters: [] };
        }

        // Use AI to map this specific learning outcome
        const learningOutcomeTags = {
            id: learningOutcome._id.toString(),
            tags: learningOutcome.text,
            classLevel: learningOutcome.classId.level,
            type: learningOutcome.type
        };

        const chapterData = chapters.map(ch => ({
            id: ch._id.toString(),
            chapterName: ch.chapterName,
            topicName: ch.topicName,
            classLevel: ch.classId.level
        }));

        const aiPrompt = `Map this learning outcome to relevant curriculum chapters:

Learning Outcome:
- ID: ${learningOutcomeTags.id}
- Tags: "${learningOutcomeTags.tags}"
- Class: ${learningOutcomeTags.classLevel}
- Type: ${learningOutcomeTags.type}

Available Chapters:
${chapterData.map(ch => `- ID: ${ch.id}, Chapter: "${ch.chapterName}", Topic: "${ch.topicName}", Class: ${ch.classLevel}`).join('\n')}

Analyze the comma-separated tags and find the most relevant chapters. Return a JSON object:
{
  "learningOutcomeId": "${learningOutcomeTags.id}",
  "mappedChapters": [
    {
      "chapterId": "chapter ID",
      "relevanceScore": 0.0-1.0,
      "reason": "brief explanation"
    }
  ]
}

Only include mappings with relevanceScore >= 0.5. Return ONLY valid JSON, no additional text.`;

        const aiResponse = await axios.post("https://api.deepseek.com/chat/completions", {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "You are an expert educational curriculum mapper. Always respond with valid JSON only."
                },
                {
                    role: "user",
                    content: aiPrompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            }
        });

        const aiData = aiResponse.data;
        const aiContent = aiData.choices?.[0]?.message?.content;

        if (!aiContent) {
            throw new Error('Invalid response from AI service');
        }

        // Parse AI response
        let mapping;
        try {
            const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            mapping = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error('AI Response Parse Error:', aiContent);
            throw new Error('Failed to parse AI response');
        }

        // Save to database
        const curriculumMapping = await CurriculumMapping.findOneAndUpdate(
            { learningOutcomeId },
            {
                learningOutcomeId,
                mappedChapters: mapping.mappedChapters,
                lastCalculatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return curriculumMapping;
    } catch (err) {
        console.error('Error calculating curriculum mapping:', err);
        throw err;
    }
};

// Get all curriculum mappings for learning outcomes (from database)
const mapLearningOutcomesToCurriculum = async (req, res) => {
    try {
        const { classId, subjectId, type } = req.body;

        if (!classId || !type) {
            return res.status(400).json({ 
                message: 'classId and type are required' 
            });
        }

        // Validate type
        if (!['SUBJECT', 'BASIC_CALCULATION'].includes(type)) {
            return res.status(400).json({ 
                message: 'type must be SUBJECT or BASIC_CALCULATION' 
            });
        }

        // For SUBJECT type, subjectId is required
        if (type === 'SUBJECT' && !subjectId) {
            return res.status(400).json({ 
                message: 'subjectId is required for SUBJECT type' 
            });
        }

        // Get all learning outcomes for the class and type
        const query = { classId, type };
        if (type === 'SUBJECT') {
            query.subjectId = subjectId;
        }

        const learningOutcomes = await LearningOutcome.find(query)
            .populate('classId', 'name level')
            .populate('subjectId', 'name')
            .sort({ createdAt: -1 });

        if (learningOutcomes.length === 0) {
            return res.status(404).json({ 
                message: 'No learning outcomes found for the specified criteria' 
            });
        }

        // Get all curriculum mappings from database
        const learningOutcomeIds = learningOutcomes.map(lo => lo._id);
        const curriculumMappings = await CurriculumMapping.find({
            learningOutcomeId: { $in: learningOutcomeIds }
        });

        // Format response with mappings from database
        const formattedMappings = await Promise.all(
            learningOutcomes.map(async (learningOutcome) => {
                const mapping = curriculumMappings.find(
                    cm => cm.learningOutcomeId.toString() === learningOutcome._id.toString()
                );

                const mappedChapters = mapping ? await Promise.all(
                    mapping.mappedChapters.map(async (mc) => {
                        const chapter = await Chapter.findById(mc.chapterId)
                            .populate('classId', 'name level')
                            .populate('subjectId', 'name');
                        
                        return {
                            chapterId: mc.chapterId.toString(),
                            chapterName: chapter?.chapterName || 'Unknown',
                            topicName: chapter?.topicName || 'Unknown',
                            relevanceScore: mc.relevanceScore,
                            reason: mc.reason
                        };
                    })
                ) : [];

                return {
                    learningOutcome: {
                        id: learningOutcome._id.toString(),
                        text: learningOutcome.text,
                        tags: learningOutcome.text.split(',').map(t => t.trim()),
                        classLevel: learningOutcome.classId.level,
                        type: learningOutcome.type
                    },
                    mappedChapters,
                    lastCalculatedAt: mapping?.lastCalculatedAt || null
                };
            })
        );

        res.json({
            success: true,
            totalLearningOutcomes: learningOutcomes.length,
            mappings: formattedMappings
        });

    } catch (err) {
        console.error('Curriculum Mapping Error:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Get curriculum mapping for a specific learning outcome (from database)
const getLearningOutcomeCurriculumMapping = async (req, res) => {
    try {
        const { learningOutcomeId } = req.params;

        const learningOutcome = await LearningOutcome.findById(learningOutcomeId)
            .populate('classId', 'name level')
            .populate('subjectId', 'name');

        if (!learningOutcome) {
            return res.status(404).json({ 
                message: 'Learning outcome not found' 
            });
        }

        // Get mapping from database
        const curriculumMapping = await CurriculumMapping.findOne({ learningOutcomeId })
            .populate('mappedChapters.chapterId');

        if (!curriculumMapping) {
            return res.json({
                learningOutcome: {
                    id: learningOutcome._id,
                    text: learningOutcome.text,
                    tags: learningOutcome.text.split(',').map(t => t.trim()),
                    classLevel: learningOutcome.classId.level,
                    type: learningOutcome.type
                },
                mappedChapters: [],
                message: 'No curriculum mapping found. Mapping will be calculated when learning outcome is created.'
            });
        }

        // Format response with chapter details
        const mappedChapters = await Promise.all(
            curriculumMapping.mappedChapters.map(async (mc) => {
                const chapter = await Chapter.findById(mc.chapterId)
                    .populate('classId', 'name level')
                    .populate('subjectId', 'name');
                
                return {
                    chapterId: mc.chapterId.toString(),
                    chapterName: chapter?.chapterName || 'Unknown',
                    topicName: chapter?.topicName || 'Unknown',
                    relevanceScore: mc.relevanceScore,
                    reason: mc.reason
                };
            })
        );

        res.json({
            learningOutcome: {
                id: learningOutcome._id,
                text: learningOutcome.text,
                tags: learningOutcome.text.split(',').map(t => t.trim()),
                classLevel: learningOutcome.classId.level,
                type: learningOutcome.type
            },
            mappedChapters,
            lastCalculatedAt: curriculumMapping.lastCalculatedAt
        });

    } catch (err) {
        console.error('Curriculum Mapping Error:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Recalculate curriculum mapping for a learning outcome
const recalculateCurriculumMapping = async (req, res) => {
    try {
        const { learningOutcomeId } = req.params;

        const learningOutcome = await LearningOutcome.findById(learningOutcomeId);
        if (!learningOutcome) {
            return res.status(404).json({ 
                message: 'Learning outcome not found' 
            });
        }

        // Calculate and save mapping
        const curriculumMapping = await calculateAndSaveCurriculumMapping(learningOutcomeId);

        // Get full details for response
        const populatedMapping = await CurriculumMapping.findById(curriculumMapping._id);
        const learningOutcomeDetails = await LearningOutcome.findById(learningOutcomeId)
            .populate('classId', 'name level')
            .populate('subjectId', 'name');

        const mappedChapters = await Promise.all(
            populatedMapping.mappedChapters.map(async (mc) => {
                const chapter = await Chapter.findById(mc.chapterId)
                    .populate('classId', 'name level')
                    .populate('subjectId', 'name');
                
                return {
                    chapterId: mc.chapterId.toString(),
                    chapterName: chapter?.chapterName || 'Unknown',
                    topicName: chapter?.topicName || 'Unknown',
                    relevanceScore: mc.relevanceScore,
                    reason: mc.reason
                };
            })
        );

        res.json({
            success: true,
            message: 'Curriculum mapping recalculated and saved',
            learningOutcome: {
                id: learningOutcomeDetails._id,
                text: learningOutcomeDetails.text,
                tags: learningOutcomeDetails.text.split(',').map(t => t.trim()),
                classLevel: learningOutcomeDetails.classId.level,
                type: learningOutcomeDetails.type
            },
            mappedChapters,
            lastCalculatedAt: populatedMapping.lastCalculatedAt
        });

    } catch (err) {
        console.error('Recalculate Curriculum Mapping Error:', err);
        const errorMessage = err.response?.data?.error?.message || err.message || 'Unknown error';
        res.status(err.response?.status || 500).json({ 
            message: 'Failed to recalculate curriculum mapping',
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Helper function to extract tags from comma-separated text
// Handles LaTeX/KaTeX equations, fractions, polynomials, etc.
const extractTags = (text) => {
    if (!text) return [];
    
    // First, split by newlines (\n) - many learning outcomes use newlines to separate tags
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Then split each line by comma, but preserve LaTeX/KaTeX expressions
    const tags = [];
    
    lines.forEach(line => {
        // Check if line contains LaTeX
        const hasLatex = /[\\$]|\(|\)|\[|\]/.test(line);
        
        if (!hasLatex) {
            // Simple case: split by comma
            const commaTags = line.split(',').map(t => t.trim()).filter(Boolean);
            tags.push(...commaTags);
        } else {
            // Complex case: handle LaTeX expressions
            let currentTag = '';
            let inLatex = false;
            let braceCount = 0;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                // Check for LaTeX delimiters: \(, \), \[, \], $, $$
                if (char === '\\' && (line[i + 1] === '(' || line[i + 1] === '[' || line[i + 1] === '{')) {
                    inLatex = true;
                    currentTag += char;
                    continue;
                }
                
                if (char === '$' || (char === '\\' && (line[i + 1] === ')' || line[i + 1] === ']'))) {
                    inLatex = !inLatex;
                    currentTag += char;
                    continue;
                }
                
                // Track braces for LaTeX expressions
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                
                // If we're in LaTeX or inside braces, add to current tag
                if (inLatex || braceCount > 0 || char !== ',') {
                    currentTag += char;
                } else {
                    // Comma found and not in LaTeX - split here
                    if (currentTag.trim()) {
                        tags.push(currentTag.trim());
                    }
                    currentTag = '';
                    inLatex = false;
                    braceCount = 0;
                }
            }
            
            // Add the last tag from this line
            if (currentTag.trim()) {
                tags.push(currentTag.trim());
            }
        }
    });
    
    // Remove duplicates and filter empty
    return [...new Set(tags)].filter(Boolean);
};

// Helper function to normalize tags for better AI matching
const normalizeTag = (tag) => {
    return tag
        .toLowerCase()
        .replace(/\(.*?\)/g, '') // remove (1–20), (up to 99), etc.
        .replace(/[-–]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

// Helper function to get tag relevancy using DeepSeek API
const getTagRelevancy = async (tagA, tagB, classLevelA, classLevelB) => {
    try {
        const aiPrompt = `You are an education domain expert. Compare two learning outcome tags from different class levels. Map based PURELY on text meaning, ignoring class/topic labels.

Tag A (Class ${classLevelA}): "${tagA}"
Tag B (Class ${classLevelB}): "${tagB}"

IMPORTANT: Tags may contain LaTeX/KaTeX mathematical expressions including:
- Equations: $x + y = z$, \\(a = b\\), \\[x^2 + y^2 = r^2\\]
- Fractions: $\\frac{a}{b}$, $\\frac{x+1}{x-1}$, $\\frac{1}{2} + \\frac{1}{3}$
- Polynomials: $ax^2 + bx + c = 0$, $x^3 + 2x^2 - 5x + 1$, $x^4 - 3x^2 + 2 = 0$
- All LaTeX syntax: subscripts ($x_1$, $a_{ij}$), superscripts ($x^2$, $e^{-x}$), integrals ($\\int f(x)dx$), summations ($\\sum_{i=1}^{n}$), matrices, etc.
- Mathematical symbols: +, -, ×, ÷, =, <, >, ≤, ≥, ≠, ±, ∞, ∑, ∫, √, π, α, β, θ, etc.

Analyze the semantic relationship between these tags. Consider:
1. Are they the same mathematical concept at different levels? (e.g., "simple fractions" → "complex fractions")
2. Is one a prerequisite for the other? (e.g., "basic equations" → "quadratic equations")
3. Is one a progression/advancement of the other? (e.g., "linear equations" → "polynomial equations")
4. Do they involve similar skills but different complexity?
5. Look for numeric progressions (1-5 → 1-10, single-digit → two-digit, etc.)
6. Look for skill progressions (basic → advanced, simple → complex)
7. For LaTeX expressions: Compare the mathematical concepts, not just the syntax
   - $\\frac{1}{2}$ and $\\frac{1}{4}$ are related (fractions)
   - $x + 1 = 5$ and $2x + 3 = 7$ are related (linear equations)
   - $x^2 + 1 = 0$ and $x^3 + 2x = 0$ are related (polynomial equations)
   - Simple fractions → Complex fractions = PROGRESSION
   - Linear equations → Quadratic equations = PROGRESSION
   - Basic polynomials → Advanced polynomials = PROGRESSION

IMPORTANT: 
- "Table 1 to 5" should map to "Table 1 to 10" as PROGRESSION (score > 0.6)
- "adding single-digit" should map to "adding two-digit" as PROGRESSION (score > 0.6)
- "simple fractions $\\frac{a}{b}$" should map to "complex fractions $\\frac{x+1}{x-1}$" as PROGRESSION
- "linear equations $ax + b = 0$" should map to "quadratic equations $ax^2 + bx + c = 0$" as PROGRESSION
- Mathematical operations with same concept but different complexity = PROGRESSION
- Similar concepts with increasing difficulty = PROGRESSION (score > 0.6)
- Complementary skills = RELATED (score > 0.6)
- Only return if relevancyScore > 0.6
- Unrelated = NONE (don't return)

Return a JSON object:
{
  "relevancyScore": 0.0-1.0,
  "relation": "same|progression|prerequisite|related|unrelated",
  "reason": "brief explanation"
}

IMPORTANT: Only return if relevancyScore > 0.6. Return ONLY valid JSON, no additional text.`;

        const aiResponse = await axios.post("https://api.deepseek.com/chat/completions", {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "You are an education domain expert. Always respond with valid JSON only."
                },
                {
                    role: "user",
                    content: aiPrompt
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            }
        });

        const aiData = aiResponse.data;
        const aiContent = aiData.choices?.[0]?.message?.content;

        if (!aiContent) {
            return { relevancyScore: 0, relation: 'unrelated', reason: 'No AI response' };
        }

        try {
            const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error('AI Response Parse Error:', aiContent);
            return { relevancyScore: 0, relation: 'unrelated', reason: 'Parse error' };
        }
    } catch (err) {
        console.error('Error getting tag relevancy:', err.message);
        return { relevancyScore: 0, relation: 'unrelated', reason: 'API error' };
    }
};

// Helper function to calculate and save learning outcome to learning outcome mapping (TAG-WISE)
const calculateAndSaveLearningOutcomeMapping = async (learningOutcomeId) => {
    try {
        const learningOutcome = await LearningOutcome.findById(learningOutcomeId)
            .populate('classId', 'name level')
            .populate('subjectId', 'name');

        if (!learningOutcome) {
            throw new Error('Learning outcome not found');
        }

        // Extract tags from current learning outcome
        const currentTags = extractTags(learningOutcome.text);
        if (currentTags.length === 0) {
            console.log(`No tags found in learning outcome ${learningOutcomeId}`);
            await LearningOutcomeMapping.findOneAndUpdate(
                { learningOutcomeId },
                {
                    learningOutcomeId,
                    mappedLearningOutcomes: [],
                    lastCalculatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            return { mappedLearningOutcomes: [] };
        }

        // Get all other learning outcomes - map across ALL classes, types, and subjects
        // This allows comprehensive progression chains like "Table 1 to 5" → "Table 1 to 10"
        // regardless of topic or subject
        const query = {
            _id: { $ne: learningOutcomeId } // Exclude self only
        };

        // Map across all types and subjects for comprehensive tag-wise mapping
        // This ensures "Table 1 to 5" (Class 3, any topic) maps to "Table 1 to 10" (Class 4, any topic)

        const allLearningOutcomes = await LearningOutcome.find(query)
            .populate('classId', 'name level')
            .populate('subjectId', 'name')
            .sort({ 'classId.level': 1, createdAt: -1 });

        console.log(`Found ${allLearningOutcomes.length} other learning outcomes to map against for LO ${learningOutcomeId}`);

        if (allLearningOutcomes.length === 0) {
            console.log(`No other learning outcomes found for type ${learningOutcome.type}, subject ${learningOutcome.subjectId?._id || 'N/A'}`);
            await LearningOutcomeMapping.findOneAndUpdate(
                { learningOutcomeId },
                {
                    learningOutcomeId,
                    mappedLearningOutcomes: [],
                    lastCalculatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            return { mappedLearningOutcomes: [] };
        }

        // Tag-wise mapping: Compare each tag from current LO with tags from other LOs
        // Group by topic first, then map tag-wise within topics
        const tagMappings = [];
        
        // Check for null classId
        if (!learningOutcome.classId || !learningOutcome.classId.level) {
            console.error(`Learning outcome ${learningOutcomeId} has null classId`);
            await LearningOutcomeMapping.findOneAndUpdate(
                { learningOutcomeId },
                {
                    learningOutcomeId,
                    mappedLearningOutcomes: [],
                    lastCalculatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            return { mappedLearningOutcomes: [] };
        }
        
        const currentClassLevel = learningOutcome.classId.level;
        const currentTopicName = learningOutcome.topicName || '';

        for (const otherLO of allLearningOutcomes) {
            // Skip if classId is null
            if (!otherLO.classId || !otherLO.classId.level) {
                console.warn(`Skipping learning outcome ${otherLO._id} - null classId`);
                continue;
            }
            
            const otherTags = extractTags(otherLO.text);
            const otherClassLevel = otherLO.classId.level;
            const otherTopicName = otherLO.topicName || '';
            
            // Group by topic: Only map if topics match (same topic name)
            // This ensures we map within the same topic across classes
            if (currentTopicName && otherTopicName && currentTopicName !== otherTopicName) {
                continue; // Skip if topics don't match
            }

            // Compare each current tag with each other tag
            for (const currentTag of currentTags) {
                for (const otherTag of otherTags) {
                    // Get relevancy between tags
                    const relevancy = await getTagRelevancy(
                        currentTag,
                        otherTag,
                        currentClassLevel,
                        otherClassLevel
                    );

                    // Only include mappings with relevancy score > 0.6 (60%)
                    // Include PROGRESSION, RELATED, PREREQUISITE, and SAME relations
                    const shouldInclude = relevancy.relevancyScore > 0.6 && 
                                         (relevancy.relation === 'progression' || 
                                          relevancy.relation === 'related' || 
                                          relevancy.relation === 'prerequisite' || 
                                          relevancy.relation === 'same');
                    
                    if (shouldInclude) {
                        // Determine mapping type based on class level and relation
                        let mappingType = 'RELATED';
                        if (otherClassLevel < currentClassLevel) {
                            // Lower class: could be prerequisite or related
                            if (relevancy.relation === 'prerequisite' || relevancy.relation === 'same') {
                                mappingType = 'PREREQUISITE';
                            } else {
                                mappingType = 'RELATED';
                            }
                        } else if (otherClassLevel > currentClassLevel) {
                            // Higher class: could be progression or advanced
                            if (relevancy.relation === 'progression' || relevancy.relation === 'same') {
                                mappingType = 'PROGRESSION';
                            } else if (relevancy.relation === 'prerequisite') {
                                mappingType = 'ADVANCED';
                            } else {
                                mappingType = 'RELATED';
                            }
                        } else {
                            // Same class level - mark as RELATED
                            mappingType = 'RELATED';
                        }
                        
                        // Ensure RELATED is included if relevancy is high enough
                        if (relevancy.relation === 'related' && relevancy.relevancyScore > 0.6) {
                            mappingType = 'RELATED';
                        }

                        // Check if we already have a mapping for this learning outcome
                        const existingMapping = tagMappings.find(
                            tm => tm.mappedLearningOutcomeId.toString() === otherLO._id.toString()
                        );

                        if (!existingMapping) {
                            tagMappings.push({
                                mappedLearningOutcomeId: otherLO._id,
                                mappingType: mappingType,
                                relevanceScore: relevancy.relevancyScore,
                                reason: `${currentTag} → ${otherTag}: ${relevancy.reason}`,
                                fromTag: currentTag,
                                toTag: otherTag
                            });
                        } else {
                            // Update if this tag pair has higher relevancy OR is a better match type
                            const isBetterMatch = relevancy.relevancyScore > existingMapping.relevanceScore ||
                                                 (relevancy.relation === 'progression' && existingMapping.mappingType !== 'PROGRESSION') ||
                                                 (relevancy.relation === 'same' && existingMapping.mappingType !== 'PROGRESSION');
                            
                            if (isBetterMatch) {
                                existingMapping.relevanceScore = relevancy.relevancyScore;
                                existingMapping.mappingType = mappingType;
                                existingMapping.reason = `${currentTag} → ${otherTag}: ${relevancy.reason}`;
                                existingMapping.fromTag = currentTag;
                                existingMapping.toTag = otherTag;
                            }
                        }
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }

        // Sort by relevancy score (highest first)
        tagMappings.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Save to database
        const learningOutcomeMapping = await LearningOutcomeMapping.findOneAndUpdate(
            { learningOutcomeId },
            {
                learningOutcomeId,
                mappedLearningOutcomes: tagMappings,
                lastCalculatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`✓ Saved ${tagMappings.length} tag-wise mappings for learning outcome ${learningOutcomeId}`);
        return learningOutcomeMapping;
    } catch (err) {
        console.error('Error calculating learning outcome mapping:', err);
        throw err;
    }
};

// Recalculate learning outcome to learning outcome mapping
// Calculate and save topic tag mappings in background (using DeepSeek API)
const calculateAndSaveTopicTagMappings = async (topicName, type, subjectId = null) => {
    try {
        console.log(`Calculating topic tag mappings for topic: ${topicName}, type: ${type}`);

        // Get all learning outcomes for this topic
        const query = { 
            topicName: topicName,
            type: type
        };

        if (type === 'SUBJECT' && subjectId) {
            query.subjectId = subjectId;
        }

        const topicOutcomes = await LearningOutcome.find(query)
            .populate({
                path: 'classId',
                select: 'name level',
                match: { level: { $ne: null } }
            })
            .populate('subjectId', 'name')
            .sort({ 'classId.level': 1 })
            .lean();

        // Filter valid outcomes
        const validOutcomes = topicOutcomes.filter(o => o && o.classId && o.classId.level);

        if (validOutcomes.length === 0) {
            // Save empty mapping
            const TopicTagMapping = require('../models/TopicTagMapping');
            await TopicTagMapping.findOneAndUpdate(
                { topicName, type, subjectId: subjectId || null },
                {
                    topicName,
                    type,
                    subjectId: subjectId || null,
                    tagMappings: [],
                    tagChains: [],
                    totalLearningOutcomes: 0,
                    totalTags: 0,
                    totalMappings: 0,
                    lastCalculatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            return { tagMappings: [], tagChains: [] };
        }

        // Extract all tags from all outcomes in this topic
        const allTags = [];
        validOutcomes.forEach(outcome => {
            const tags = extractTags(outcome.text);
            tags.forEach(tag => {
                allTags.push({
                    tag: tag,
                    learningOutcomeId: outcome._id.toString(),
                    learningOutcomeText: outcome.text,
                    classLevel: outcome.classId.level,
                    className: outcome.classId.name
                });
            });
        });

        // Group tags by class level for progression mapping
        // Only map from lower classes to higher classes (progression chain)
        const tagMappings = [];
        const processedPairs = new Set();

        // Sort tags by class level
        allTags.sort((a, b) => a.classLevel - b.classLevel);

        console.log(`Comparing ${allTags.length} tags for topic "${topicName}"...`);

        // Compare each tag with tags from higher classes only (progression chain)
        let comparisonCount = 0;
        for (let i = 0; i < allTags.length; i++) {
            const tagA = allTags[i];
            
            // Only compare with tags from higher classes (progression)
            for (let j = i + 1; j < allTags.length; j++) {
                const tagB = allTags[j];

                // Skip if same learning outcome
                if (tagA.learningOutcomeId === tagB.learningOutcomeId) {
                    continue;
                }

                // Only map from lower class to higher class (progression)
                if (tagA.classLevel >= tagB.classLevel) {
                    continue;
                }

                // Create unique pair key to avoid duplicates
                const pairKey = `${tagA.tag}|||${tagB.tag}|||${tagA.classLevel}|||${tagB.classLevel}`;
                
                if (processedPairs.has(pairKey)) {
                    continue;
                }
                processedPairs.add(pairKey);

                comparisonCount++;
                if (comparisonCount % 10 === 0) {
                    console.log(`  Progress: ${comparisonCount} comparisons, ${tagMappings.length} mappings found...`);
                }

                try {
                    // Get relevancy using DeepSeek API
                    const relevancy = await getTagRelevancy(
                        tagA.tag,
                        tagB.tag,
                        tagA.classLevel,
                        tagB.classLevel
                    );

                    // Only include if relevance score >= 0.6 (60%) and relation is progression/prerequisite/related
                    if (relevancy.relevancyScore >= 0.6 && 
                        (relevancy.relation === 'progression' || 
                         relevancy.relation === 'prerequisite' || 
                         relevancy.relation === 'related' ||
                         relevancy.relation === 'same')) {
                        tagMappings.push({
                            fromTag: {
                                tag: tagA.tag,
                                learningOutcomeId: tagA.learningOutcomeId,
                                learningOutcomeText: tagA.learningOutcomeText,
                                classLevel: tagA.classLevel,
                                className: tagA.className
                            },
                            toTag: {
                                tag: tagB.tag,
                                learningOutcomeId: tagB.learningOutcomeId,
                                learningOutcomeText: tagB.learningOutcomeText,
                                classLevel: tagB.classLevel,
                                className: tagB.className
                            },
                            relevanceScore: relevancy.relevancyScore,
                            relation: relevancy.relation,
                            reason: relevancy.reason
                        });
                    }
                    
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (err) {
                    console.error(`Error comparing tags:`, err.message);
                    // Continue with next pair
                }
            }
        }

        console.log(`✓ Completed ${comparisonCount} comparisons, found ${tagMappings.length} mappings with relevance >= 60%`);

        // Sort by class level (ascending) then by relevance score (descending)
        tagMappings.sort((a, b) => {
            if (a.fromTag.classLevel !== b.fromTag.classLevel) {
                return a.fromTag.classLevel - b.fromTag.classLevel;
            }
            return b.relevanceScore - a.relevanceScore;
        });

        // Group mappings by tag to show chains
        const tagChains = {};
        tagMappings.forEach(mapping => {
            const tagKey = mapping.fromTag.tag;
            if (!tagChains[tagKey]) {
                tagChains[tagKey] = {
                    tag: tagKey,
                    classLevel: mapping.fromTag.classLevel,
                    className: mapping.fromTag.className,
                    learningOutcomeId: mapping.fromTag.learningOutcomeId,
                    progressions: []
                };
            }
            tagChains[tagKey].progressions.push({
                toTag: mapping.toTag.tag,
                toClassLevel: mapping.toTag.classLevel,
                toClassName: mapping.toTag.className,
                toLearningOutcomeId: mapping.toTag.learningOutcomeId,
                relevanceScore: mapping.relevanceScore,
                relation: mapping.relation,
                reason: mapping.reason
            });
        });

        // Convert chains to array and sort by class level
        const chains = Object.values(tagChains).sort((a, b) => a.classLevel - b.classLevel);

        // Save to database
        const TopicTagMapping = require('../models/TopicTagMapping');
        await TopicTagMapping.findOneAndUpdate(
            { topicName, type, subjectId: subjectId || null },
            {
                topicName,
                type,
                subjectId: subjectId || null,
                tagMappings: tagMappings,
                tagChains: chains,
                totalLearningOutcomes: validOutcomes.length,
                totalTags: allTags.length,
                totalMappings: tagMappings.length,
                lastCalculatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`✓ Saved topic tag mappings for "${topicName}" to database`);
        return { tagMappings, tagChains: chains };
    } catch (err) {
        console.error(`Error calculating topic tag mappings for "${topicName}":`, err);
        throw err;
    }
};

// Get tag-wise mappings for a specific topic from database
const getTopicTagMappings = async (req, res) => {
    try {
        const { topicName } = req.params;
        const { subjectId, type } = req.query;

        if (!topicName) {
            return res.status(400).json({ 
                message: 'topicName is required' 
            });
        }

        if (!type) {
            return res.status(400).json({ 
                message: 'type is required' 
            });
        }

        // Get mappings from database
        const TopicTagMapping = require('../models/TopicTagMapping');
        const mapping = await TopicTagMapping.findOne({
            topicName: topicName,
            type: type,
            subjectId: subjectId || null
        });

        if (!mapping) {
            return res.json({
                success: true,
                topicName: topicName,
                totalLearningOutcomes: 0,
                totalTags: 0,
                totalMappings: 0,
                tagMappings: [],
                tagChains: [],
                message: 'No mappings found. Mappings will be calculated in the background when learning outcomes are added/updated.'
            });
        }

        res.json({
            success: true,
            topicName: mapping.topicName,
            totalLearningOutcomes: mapping.totalLearningOutcomes,
            totalTags: mapping.totalTags,
            totalMappings: mapping.totalMappings,
            tagMappings: mapping.tagMappings,
            tagChains: mapping.tagChains,
            lastCalculatedAt: mapping.lastCalculatedAt
        });

    } catch (err) {
        console.error('Error in getTopicTagMappings:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

const recalculateLearningOutcomeMapping = async (req, res) => {
    try {
        const { learningOutcomeId } = req.params;

        const learningOutcome = await LearningOutcome.findById(learningOutcomeId);
        if (!learningOutcome) {
            return res.status(404).json({ 
                message: 'Learning outcome not found' 
            });
        }

        // Calculate and save mapping
        const mapping = await calculateAndSaveLearningOutcomeMapping(learningOutcomeId);

        // Get full details for response
        const populatedMapping = await LearningOutcomeMapping.findById(mapping._id);
        const learningOutcomeDetails = await LearningOutcome.findById(learningOutcomeId)
            .populate('classId', 'name level')
            .populate('subjectId', 'name');

        const mappedOutcomeIds = populatedMapping.mappedLearningOutcomes.map(m => m.mappedLearningOutcomeId);
        const mappedOutcomes = await LearningOutcome.find({
            _id: { $in: mappedOutcomeIds }
        })
        .populate('classId', 'name level')
        .populate('subjectId', 'name');

        const mappedLearningOutcomes = populatedMapping.mappedLearningOutcomes.map(mo => {
            const mappedOutcome = mappedOutcomes.find(
                o => o._id.toString() === mo.mappedLearningOutcomeId.toString()
            );
            return {
                learningOutcomeId: mo.mappedLearningOutcomeId.toString(),
                learningOutcome: mappedOutcome ? {
                    id: mappedOutcome._id.toString(),
                    text: mappedOutcome.text,
                    tags: mappedOutcome.text.split(',').map(t => t.trim()),
                    classLevel: mappedOutcome.classId.level,
                    className: mappedOutcome.classId.name,
                    topicName: mappedOutcome.topicName,
                    type: mappedOutcome.type
                } : null,
                mappingType: mo.mappingType,
                relevanceScore: mo.relevanceScore,
                reason: mo.reason,
                fromTag: mo.fromTag || null,
                toTag: mo.toTag || null
            };
        });

        res.json({
            success: true,
            message: 'Learning outcome mapping recalculated and saved',
            learningOutcome: {
                id: learningOutcomeDetails._id,
                text: learningOutcomeDetails.text,
                tags: learningOutcomeDetails.text.split(',').map(t => t.trim()),
                classLevel: learningOutcomeDetails.classId.level,
                className: learningOutcomeDetails.classId.name,
                topicName: learningOutcomeDetails.topicName,
                type: learningOutcomeDetails.type
            },
            mappedLearningOutcomes,
            lastCalculatedAt: populatedMapping.lastCalculatedAt
        });

    } catch (err) {
        console.error('Recalculate Learning Outcome Mapping Error:', err);
        const errorMessage = err.response?.data?.error?.message || err.message || 'Unknown error';
        res.status(err.response?.status || 500).json({ 
            message: 'Failed to recalculate learning outcome mapping',
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Helper function to extract tags from text
const extractTagsForConceptGraph = (text) => {
    if (!text) return [];
    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
    const tags = [];
    lines.forEach(line => {
        const commaTags = line.split(',').map(t => t.trim()).filter(Boolean);
        tags.push(...commaTags);
    });
    return tags;
};

// Generate and save concept graph for a single topic
const calculateAndSaveConceptGraph = async (topicName, type, subjectId = null, subjectName = 'Mathematics') => {
    try {
        console.log(`[Concept Graph] Calculating for topic: ${topicName}, type: ${type}`);

        // Get all learning outcomes for this topic
        const query = { 
            topicName: topicName,
            type: type
        };

        if (type === 'SUBJECT' && subjectId) {
            query.subjectId = subjectId;
        }

        const topicOutcomes = await LearningOutcome.find(query)
            .populate({
                path: 'classId',
                select: 'name level',
                match: { level: { $ne: null } }
            })
            .populate('subjectId', 'name')
            .sort({ 'classId.level': 1 })
            .lean();

        // Filter valid outcomes
        const validOutcomes = topicOutcomes.filter(o => o && o.classId && o.classId.level);

        if (validOutcomes.length === 0) {
            // Save empty graph
            await ConceptGraph.findOneAndUpdate(
                { topic: topicName, type, subjectId: subjectId || null },
                {
                    subject: subjectName,
                    topic: topicName,
                    type,
                    subjectId: subjectId || null,
                    conceptGraphs: [],
                    totalNodes: 0,
                    totalEdges: 0,
                    totalConcepts: 0,
                    lastCalculatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            return { conceptGraphs: [] };
        }

        // Extract tags and group by class
        const classes = [];
        validOutcomes.forEach(outcome => {
            const tags = extractTagsForConceptGraph(outcome.text);
            
            // Find or create class entry
            let classEntry = classes.find(c => c.class === outcome.classId.level);
            if (!classEntry) {
                classEntry = {
                    class: outcome.classId.level,
                    subject: outcome.subjectId?.name || subjectName,
                    topic: outcome.topicName || topicName,
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

        if (classes.length === 0) {
            throw new Error('No valid classes found for topic');
        }

        // Generate graph using DeepSeek AI
        const prompt = `
Generate a single JSON output for a concept-wise vertical learning graph.

CRITICAL RULES:
1. Use all tags from all classes provided.
2. Group tags under concepts automatically (e.g., Place Value, Addition and Subtraction, Multiplication and Division, Fractions, Decimals, Number Properties, Money and Measurement, etc.)
3. Each concept has nodes per class with id, class, tag.
4. EDGE REQUIREMENTS (VERY IMPORTANT):
   - Create edges connecting nodes from lower class → higher class per concept (showing progression).
   - Ensure ALL nodes in higher classes are properly connected from previous class nodes.
   - Maintain class continuity: ensure edges flow from lower to higher classes without skipping.
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
1. ALL nodes in higher classes MUST be connected from previous class nodes in the same concept.
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

        // Calculate totals
        let totalNodes = 0;
        let totalEdges = 0;
        const totalConcepts = graphData.conceptGraphs?.length || 0;

        graphData.conceptGraphs?.forEach(conceptGraph => {
            totalNodes += conceptGraph.nodes?.length || 0;
            totalEdges += conceptGraph.edges?.length || 0;
        });

        // Save to database
        const savedGraph = await ConceptGraph.findOneAndUpdate(
            { topic: topicName, type, subjectId: subjectId || null },
            {
                subject: graphData.subject || subjectName,
                topic: graphData.topic || topicName,
                type,
                subjectId: subjectId || null,
                graphType: graphData.graphType || 'concept_wise_vertical_learning_graph',
                conceptGraphs: graphData.conceptGraphs || [],
                totalNodes,
                totalEdges,
                totalConcepts,
                lastCalculatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`[Concept Graph] Saved for topic: ${topicName} (${totalConcepts} concepts, ${totalNodes} nodes, ${totalEdges} edges)`);

        return savedGraph;

    } catch (error) {
        console.error(`[Concept Graph] Error calculating for topic ${topicName}:`, error.message);
        throw error;
    }
};

// Get concept graph for a topic from database
const getConceptGraph = async (req, res) => {
    try {
        const { topicName } = req.params;
        const { type, subjectId } = req.query;

        if (!topicName) {
            return res.status(400).json({ message: 'topicName is required' });
        }

        if (!type) {
            return res.status(400).json({ message: 'type is required' });
        }

        const query = { topic: topicName, type };
        if (type === 'SUBJECT' && subjectId) {
            query.subjectId = subjectId;
        } else if (type === 'SUBJECT') {
            query.subjectId = subjectId || null;
        }

        const conceptGraph = await ConceptGraph.findOne(query).lean();

        if (!conceptGraph) {
            return res.status(404).json({ 
                message: `Concept graph not found for topic: ${topicName}. Please sync first.` 
            });
        }

        res.json({
            success: true,
            conceptGraph: {
                subject: conceptGraph.subject,
                topic: conceptGraph.topic,
                type: conceptGraph.type,
                graphType: conceptGraph.graphType,
                conceptGraphs: conceptGraph.conceptGraphs,
                totalNodes: conceptGraph.totalNodes,
                totalEdges: conceptGraph.totalEdges,
                totalConcepts: conceptGraph.totalConcepts,
                lastCalculatedAt: conceptGraph.lastCalculatedAt
            }
        });

    } catch (err) {
        console.error('Error in getConceptGraph:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Get topic list (from learning outcomes - only topics with learning outcomes)
const getTopicList = async (req, res) => {
    try {
        const { type, subjectId } = req.query;

        if (!type) {
            return res.status(400).json({ message: 'type is required' });
        }

        const query = { type };
        if (type === 'SUBJECT' && subjectId) {
            query.subjectId = subjectId;
        }

        // Get all learning outcomes to extract topics (including null/undefined topicName)
        const outcomes = await LearningOutcome.find(query)
            .populate({
                path: 'classId',
                select: 'name level',
                match: { level: { $ne: null } }
            })
            .select('topicName')
            .lean();

        // Filter valid outcomes (with valid classId) and extract unique topics
        // Use same logic as getLearningOutcomesByTopic: null/undefined topicName becomes 'No Topic'
        const validOutcomes = outcomes.filter(o => {
            try {
                if (!o || !o.classId || !o.classId.level) {
                    return false;
                }
                return true;
            } catch (err) {
                return false;
            }
        });

        // Extract unique topics (normalize null/undefined to 'No Topic')
        // Count learning outcomes per topic to ensure we only show topics with outcomes
        const topicMap = new Map();
        validOutcomes.forEach(outcome => {
            const topic = outcome.topicName || 'No Topic';
            if (!topicMap.has(topic)) {
                topicMap.set(topic, 0);
            }
            topicMap.set(topic, topicMap.get(topic) + 1);
        });

        // Only include topics that have at least one learning outcome
        const topics = Array.from(topicMap.keys()).filter(topic => topicMap.get(topic) > 0);

        // Get concept graph status for each topic
        const topicsWithStatus = await Promise.all(
            topics.map(async (topicName) => {
                const graphQuery = { topic: topicName, type };
                if (type === 'SUBJECT' && subjectId) {
                    graphQuery.subjectId = subjectId;
                } else if (type === 'SUBJECT') {
                    graphQuery.subjectId = subjectId || null;
                }

                const conceptGraph = await ConceptGraph.findOne(graphQuery).lean();
                
                return {
                    topicName,
                    hasConceptGraph: !!conceptGraph,
                    lastCalculatedAt: conceptGraph?.lastCalculatedAt || null,
                    totalConcepts: conceptGraph?.totalConcepts || 0,
                    totalNodes: conceptGraph?.totalNodes || 0,
                    totalEdges: conceptGraph?.totalEdges || 0,
                    learningOutcomeCount: topicMap.get(topicName) || 0
                };
            })
        );

        // Sort topics (put 'No Topic' at the end, same as getLearningOutcomesByTopic)
        const sortedTopics = topicsWithStatus.sort((a, b) => {
            if (a.topicName === 'No Topic') return 1;
            if (b.topicName === 'No Topic') return -1;
            return a.topicName.localeCompare(b.topicName);
        });

        res.json({
            success: true,
            totalTopics: sortedTopics.length,
            topics: sortedTopics
        });

    } catch (err) {
        console.error('Error in getTopicList:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Sync all concept graphs (background process)
const syncAllConceptGraphs = async (req, res) => {
    try {
        const { type, subjectId } = req.query;

        if (!type) {
            return res.status(400).json({ message: 'type is required' });
        }

        // Start background process
        res.json({
            success: true,
            message: 'Concept graph sync started in background. This may take several minutes.',
            status: 'processing'
        });

        // Run in background
        (async () => {
            try {
                const query = { type };
                if (type === 'SUBJECT' && subjectId) {
                    query.subjectId = subjectId;
                }

                // Get all distinct topics
                const topics = await LearningOutcome.distinct('topicName', query);
                
                console.log(`[Concept Graph Sync] Starting sync for ${topics.length} topics...`);

                let successCount = 0;
                let errorCount = 0;
                const errors = [];

                for (const topicName of topics) {
                    try {
                        // Get subject name from first learning outcome
                        const sampleOutcome = await LearningOutcome.findOne({ 
                            topicName, 
                            type,
                            ...(type === 'SUBJECT' && subjectId ? { subjectId } : {})
                        }).populate('subjectId', 'name').lean();

                        const subjectName = sampleOutcome?.subjectId?.name || 'Mathematics';
                        const outcomeSubjectId = sampleOutcome?.subjectId?._id || subjectId;

                        await calculateAndSaveConceptGraph(topicName, type, outcomeSubjectId, subjectName);
                        successCount++;
                        console.log(`[Concept Graph Sync] ✓ ${topicName} (${successCount}/${topics.length})`);
                    } catch (error) {
                        errorCount++;
                        errors.push({ topic: topicName, error: error.message });
                        console.error(`[Concept Graph Sync] ✗ ${topicName}: ${error.message}`);
                    }
                }

                console.log(`[Concept Graph Sync] Complete! Success: ${successCount}, Errors: ${errorCount}`);
                if (errors.length > 0) {
                    console.error('[Concept Graph Sync] Errors:', errors);
                }

            } catch (error) {
                console.error('[Concept Graph Sync] Fatal error:', error);
            }
        })();

    } catch (err) {
        console.error('Error in syncAllConceptGraphs:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

module.exports = {
    mapLearningOutcomesToCurriculum,
    getLearningOutcomeCurriculumMapping,
    recalculateCurriculumMapping,
    calculateAndSaveCurriculumMapping, // Export for use in other controllers
    calculateAndSaveLearningOutcomeMapping, // Export for learning outcome to learning outcome mapping
    recalculateLearningOutcomeMapping,
    getTopicTagMappings,
    calculateAndSaveTopicTagMappings, // Export for background calculation
    calculateAndSaveConceptGraph, // Export for concept graph calculation
    getConceptGraph,
    getTopicList,
    syncAllConceptGraphs
};

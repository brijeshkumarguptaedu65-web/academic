const LearningOutcome = require('../models/LearningOutcome');
const Chapter = require('../models/Chapter');
const CurriculumMapping = require('../models/CurriculumMapping');
const LearningOutcomeMapping = require('../models/LearningOutcomeMapping');
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
const extractTags = (text) => {
    if (!text) return [];
    return text
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
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
        const aiPrompt = `You are an education domain expert. Compare two learning outcome tags from different class levels.

Tag A (Class ${classLevelA}): "${tagA}"
Tag B (Class ${classLevelB}): "${tagB}"

Analyze the semantic relationship between these tags. Consider:
- Are they the same concept at different levels?
- Is one a prerequisite for the other?
- Is one a progression/advancement of the other?
- What is the relevancy score (0.0 to 1.0)?

Return a JSON object:
{
  "relevancyScore": 0.0-1.0,
  "relation": "same|progression|prerequisite|related|unrelated",
  "reason": "brief explanation"
}

Return ONLY valid JSON, no additional text.`;

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

        // Get all other learning outcomes of the same type
        const query = {
            type: learningOutcome.type,
            _id: { $ne: learningOutcomeId } // Exclude self
        };

        // For SUBJECT type, also match by subject
        if (learningOutcome.type === 'SUBJECT' && learningOutcome.subjectId) {
            query.subjectId = learningOutcome.subjectId._id;
        }

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
        const tagMappings = [];
        const currentClassLevel = learningOutcome.classId.level;

        for (const otherLO of allLearningOutcomes) {
            const otherTags = extractTags(otherLO.text);
            const otherClassLevel = otherLO.classId.level;

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

                    // Only include mappings with relevancy >= 0.4
                    if (relevancy.relevancyScore >= 0.4) {
                        // Determine mapping type based on class level and relation
                        let mappingType = 'RELATED';
                        if (otherClassLevel < currentClassLevel) {
                            mappingType = relevancy.relation === 'prerequisite' ? 'PREREQUISITE' : 'RELATED';
                        } else if (otherClassLevel > currentClassLevel) {
                            mappingType = relevancy.relation === 'progression' ? 'PROGRESSION' : 
                                         relevancy.relation === 'prerequisite' ? 'ADVANCED' : 'RELATED';
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
                            // Update if this tag pair has higher relevancy
                            if (relevancy.relevancyScore > existingMapping.relevanceScore) {
                                existingMapping.relevanceScore = relevancy.relevancyScore;
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

module.exports = {
    mapLearningOutcomesToCurriculum,
    getLearningOutcomeCurriculumMapping,
    recalculateCurriculumMapping,
    calculateAndSaveCurriculumMapping, // Export for use in other controllers
    calculateAndSaveLearningOutcomeMapping, // Export for learning outcome to learning outcome mapping
    recalculateLearningOutcomeMapping
};

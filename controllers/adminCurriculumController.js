const LearningOutcome = require('../models/LearningOutcome');
const Chapter = require('../models/Chapter');
const CurriculumMapping = require('../models/CurriculumMapping');
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

module.exports = {
    mapLearningOutcomesToCurriculum,
    getLearningOutcomeCurriculumMapping,
    recalculateCurriculumMapping,
    calculateAndSaveCurriculumMapping // Export for use in other controllers
};

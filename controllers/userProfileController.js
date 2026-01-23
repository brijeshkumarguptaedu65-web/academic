const User = require('../models/User');
const { Class, Subject } = require('../models/Metadata');
const LearningOutcome = require('../models/LearningOutcome');
const ConceptGraph = require('../models/ConceptGraph');

// Helper function to extract tags from text (split by newline and comma)
const extractTags = (text) => {
    if (!text) return [];
    
    // First, split by newlines (\n) - many learning outcomes use newlines to separate tags
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Then split each line by comma
    const tags = [];
    lines.forEach(line => {
        const commaTags = line.split(',').map(t => t.trim()).filter(Boolean);
        tags.push(...commaTags);
    });
    
    return tags;
};

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId)
            .select('-password -otp -otpExpiry -otpType')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Format response
        const profile = {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            grade: user.grade || null,
            avatar: user.avatar || null,
            passedBasicCalculationClass: user.passedBasicCalculationClass || null,
            passedClasses: {
                BASIC_CALCULATION: user.passedClasses?.BASIC_CALCULATION || null,
                ADVANCED_ALGEBRA: user.passedClasses?.ADVANCED_ALGEBRA || null,
                THERMODYNAMICS: user.passedClasses?.THERMODYNAMICS || null
            },
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

/**
 * @desc    Get topics for a class
 * @route   GET /api/user/classes/:classLevel/topics
 * @access  Private
 */
const getTopicsForClass = async (req, res) => {
    try {
        const classLevel = parseInt(req.params.classLevel);

        if (isNaN(classLevel) || classLevel < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class level'
            });
        }

        // Find class
        const classData = await Class.findOne({ level: classLevel });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: `Class ${classLevel} not found`
            });
        }

        // Find Mathematics subject
        const mathematicsSubject = await Subject.findOne({ name: 'Mathematics' });
        if (!mathematicsSubject) {
            return res.status(404).json({
                success: false,
                message: 'Mathematics subject not found'
            });
        }

        // Get learning outcomes for this class with type SUBJECT and Mathematics subjectId
        const learningOutcomes = await LearningOutcome.find({
            classId: classData._id,
            type: 'SUBJECT',
            subjectId: mathematicsSubject._id
        }).populate('classId', 'name level')
          .populate('subjectId', 'name')
          .lean();

        // Get unique topics
        const topicMap = new Map();
        learningOutcomes.forEach(lo => {
            const topicName = lo.topicName || 'No Topic';
            if (!topicMap.has(topicName)) {
                topicMap.set(topicName, {
                    topicName,
                    learningOutcomes: [],
                    concepts: new Set()
                });
            }
            topicMap.get(topicName).learningOutcomes.push({
                _id: lo._id,
                text: lo.text,
                type: lo.type
            });
        });

        // Get concept graphs for all topics with SUBJECT type and Mathematics subjectId
        const topics = Array.from(topicMap.keys());
        const conceptGraphs = await ConceptGraph.find({
            topic: { $in: topics },
            type: 'SUBJECT',
            subjectId: mathematicsSubject._id
        }).lean();

        // Create a map: topic -> concept graph
        const conceptGraphMap = new Map();
        conceptGraphs.forEach(cg => {
            conceptGraphMap.set(cg.topic, cg);
        });

        // Create a map: tag -> concept name (for each topic)
        // Use normalized tag for matching (lowercase, trimmed)
        const tagConceptMap = new Map(); // key: "topic|normalizedTag", value: concept name
        
        conceptGraphs.forEach(cg => {
            cg.conceptGraphs.forEach(conceptGraph => {
                const conceptName = conceptGraph.concept;
                conceptGraph.nodes.forEach(node => {
                    const normalizedTag = node.tag.toLowerCase().trim();
                    const key = `${cg.topic}|${normalizedTag}`;
                    tagConceptMap.set(key, conceptName);
                });
            });
        });

        // Format response with tags and concepts for each learning outcome
        const topicsArray = Array.from(topicMap.values()).map(topic => {
            // Process learning outcomes with tags and concepts
            const learningOutcomesWithTags = topic.learningOutcomes.map(lo => {
                // Extract tags from text
                const tags = extractTags(lo.text);
                
                // Map each tag to its concept (try exact match first, then normalized match)
                const tagsWithConcepts = tags.map(tag => {
                    // Try exact match first
                    let key = `${topic.topicName}|${tag}`;
                    let concept = tagConceptMap.get(key);
                    
                    // If no exact match, try normalized match
                    if (!concept) {
                        const normalizedTag = tag.toLowerCase().trim();
                        key = `${topic.topicName}|${normalizedTag}`;
                        concept = tagConceptMap.get(key);
                    }
                    
                    // If still no match, try partial match (check if tag contains or is contained in any concept graph tag)
                    if (!concept && topic.topicName) {
                        const cg = conceptGraphMap.get(topic.topicName);
                        if (cg) {
                            for (const conceptGraph of cg.conceptGraphs) {
                                for (const node of conceptGraph.nodes) {
                                    const nodeTag = node.tag.toLowerCase().trim();
                                    const currentTag = tag.toLowerCase().trim();
                                    // Check if tags are similar (one contains the other or vice versa)
                                    if (nodeTag.includes(currentTag) || currentTag.includes(nodeTag)) {
                                        concept = conceptGraph.concept;
                                        break;
                                    }
                                }
                                if (concept) break;
                            }
                        }
                    }
                    
                    return {
                        tag: tag,
                        concept: concept || null
                    };
                });

                // Get unique concepts for this learning outcome
                const concepts = [...new Set(tagsWithConcepts.map(t => t.concept).filter(Boolean))];

                return {
                    _id: lo._id,
                    text: lo.text,
                    type: lo.type,
                    tags: tagsWithConcepts, // Tags with their concept
                    concepts: concepts, // Unique concept names
                };
            });

            // Get all unique concepts for this topic
            const allConcepts = new Set();
            learningOutcomesWithTags.forEach(lo => {
                lo.concepts.forEach(c => allConcepts.add(c));
            });

            // Count total tags
            let totalTags = 0;
            learningOutcomesWithTags.forEach(lo => {
                totalTags += lo.tags.length;
            });

            return {
                topicName: topic.topicName,
                description: `Learning outcomes for ${topic.topicName} in Class ${classLevel}`,
                concepts: Array.from(allConcepts).sort(),
                totalTags,
                learningOutcomes: learningOutcomesWithTags
            };
        });

        res.json({
            success: true,
            classLevel,
            className: classData.name,
            topics: topicsArray,
            totalTopics: topicsArray.length
        });
    } catch (error) {
        console.error('Get topics for class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching topics',
            error: error.message
        });
    }
};

/**
 * @desc    Get tags with concepts for a specific topic of a class
 * @route   GET /api/user/classes/:classLevel/topics/:topicName
 * @access  Private
 */
const getTopicTagsWithConcepts = async (req, res) => {
    try {
        const classLevel = parseInt(req.params.classLevel);
        const topicName = req.params.topicName;

        if (isNaN(classLevel) || classLevel < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class level'
            });
        }

        if (!topicName) {
            return res.status(400).json({
                success: false,
                message: 'Topic name is required'
            });
        }

        // Find class
        const classData = await Class.findOne({ level: classLevel });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: `Class ${classLevel} not found`
            });
        }

        // Find Mathematics subject
        const mathematicsSubject = await Subject.findOne({ name: 'Mathematics' });
        if (!mathematicsSubject) {
            return res.status(404).json({
                success: false,
                message: 'Mathematics subject not found'
            });
        }

        // Normalize topic name (handle "No Topic" case)
        const normalizedTopicName = topicName === 'No Topic' ? null : topicName;

        // Get learning outcomes for this class and topic with type SUBJECT and Mathematics subjectId
        const query = {
            classId: classData._id,
            type: 'SUBJECT',
            subjectId: mathematicsSubject._id
        };
        
        // Handle null topicName
        if (normalizedTopicName === null) {
            query.$or = [
                { topicName: null },
                { topicName: { $exists: false } }
            ];
        } else {
            query.topicName = normalizedTopicName;
        }

        const learningOutcomes = await LearningOutcome.find(query)
            .populate('classId', 'name level')
            .populate('subjectId', 'name')
            .lean();

        if (learningOutcomes.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No learning outcomes found for topic "${topicName}" in Class ${classLevel}`
            });
        }

        // Fetch concept graph for this topic (use normalized topic name) with SUBJECT type and Mathematics subjectId
        const conceptGraphTopic = normalizedTopicName || 'No Topic';
        const conceptGraph = await ConceptGraph.findOne({
            topic: conceptGraphTopic,
            type: 'SUBJECT',
            subjectId: mathematicsSubject._id
        }).lean();

        // Create a map: tag -> concept name
        const tagConceptMap = new Map();
        
        if (conceptGraph) {
            conceptGraph.conceptGraphs.forEach(conceptGraphItem => {
                const conceptName = conceptGraphItem.concept;
                conceptGraphItem.nodes.forEach(node => {
                    const normalizedTag = node.tag.toLowerCase().trim();
                    const key = `${conceptGraphTopic}|${normalizedTag}`;
                    tagConceptMap.set(key, conceptName);
                });
            });
        }

        // Transform learning outcomes with tags and concepts
        const learningOutcomesWithTagsAndConcepts = learningOutcomes.map(lo => {
            // Extract tags from text
            const tags = extractTags(lo.text);
            
            // Map each tag to its concept (try exact match first, then normalized match)
            const tagsWithConcepts = tags.map(tag => {
                // Use normalized topic name for mapping
                const topicForMapping = conceptGraphTopic;
                
                // Try exact match first
                let key = `${topicForMapping}|${tag}`;
                let concept = tagConceptMap.get(key);
                
                // If no exact match, try normalized match
                if (!concept) {
                    const normalizedTag = tag.toLowerCase().trim();
                    key = `${topicForMapping}|${normalizedTag}`;
                    concept = tagConceptMap.get(key);
                }
                
                // If still no match, try partial match (check if tag contains or is contained in any concept graph tag)
                if (!concept && conceptGraph) {
                    for (const conceptGraphItem of conceptGraph.conceptGraphs) {
                        for (const node of conceptGraphItem.nodes) {
                            const nodeTag = node.tag.toLowerCase().trim();
                            const currentTag = tag.toLowerCase().trim();
                            // Check if tags are similar (one contains the other or vice versa)
                            if (nodeTag.includes(currentTag) || currentTag.includes(nodeTag)) {
                                concept = conceptGraphItem.concept;
                                break;
                            }
                        }
                        if (concept) break;
                    }
                }
                
                return {
                    tag: tag,
                    concept: concept || null
                };
            });

            // Get unique concepts for this learning outcome
            const concepts = [...new Set(tagsWithConcepts.map(t => t.concept).filter(Boolean))];

            return {
                _id: lo._id,
                text: lo.text,
                type: lo.type,
                topicName: lo.topicName,
                instruction: lo.instruction,
                contents: lo.contents,
                classId: lo.classId,
                tags: tagsWithConcepts, // Tags with their concept
                concepts: concepts, // Unique concept names
            };
        });

        // Get all unique concepts for this topic
        const allConcepts = new Set();
        learningOutcomesWithTagsAndConcepts.forEach(lo => {
            lo.concepts.forEach(c => allConcepts.add(c));
        });

        // Count total tags
        let totalTags = 0;
        learningOutcomesWithTagsAndConcepts.forEach(lo => {
            totalTags += lo.tags.length;
        });

        // Use the actual topic name from learning outcomes or the provided one
        const displayTopicName = learningOutcomesWithTagsAndConcepts.length > 0 
            ? (learningOutcomesWithTagsAndConcepts[0].topicName || 'No Topic')
            : topicName;

        res.json({
            success: true,
            classLevel,
            className: classData.name,
            topicName: displayTopicName,
            description: `Learning outcomes for ${displayTopicName} in Class ${classLevel}`,
            concepts: Array.from(allConcepts).sort(),
            totalTags,
            count: learningOutcomesWithTagsAndConcepts.length,
            learningOutcomes: learningOutcomesWithTagsAndConcepts,
        });
    } catch (error) {
        console.error('Get topic tags with concepts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching topic tags with concepts',
            error: error.message
        });
    }
};

module.exports = {
    getUserProfile,
    getTopicsForClass,
    getTopicTagsWithConcepts
};

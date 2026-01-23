const User = require('../models/User');
const { Class } = require('../models/Metadata');
const LearningOutcome = require('../models/LearningOutcome');
const ConceptGraph = require('../models/ConceptGraph');

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

        // Get learning outcomes for this class with type BASIC_CALCULATION
        const learningOutcomes = await LearningOutcome.find({
            classId: classData._id,
            type: 'BASIC_CALCULATION'
        }).populate('classId', 'name level').lean();

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

        // Get concept graphs for all topics
        const topics = Array.from(topicMap.keys());
        const conceptGraphs = await ConceptGraph.find({
            topic: { $in: topics },
            type: 'BASIC_CALCULATION',
            subjectId: null
        }).lean();

        // Map concepts to topics
        conceptGraphs.forEach(cg => {
            const topicData = topicMap.get(cg.topic);
            if (topicData) {
                cg.conceptGraphs.forEach(conceptGraph => {
                    topicData.concepts.add(conceptGraph.concept);
                });
            }
        });

        // Format response
        const topicsArray = Array.from(topicMap.values()).map(topic => {
            // Extract tags from learning outcomes to count total tags
            let totalTags = 0;
            topic.learningOutcomes.forEach(lo => {
                const tags = lo.text.split(/[\n,]+/).filter(t => t.trim().length > 0);
                totalTags += tags.length;
            });

            return {
                topicName: topic.topicName,
                description: `Learning outcomes for ${topic.topicName} in Class ${classLevel}`,
                concepts: Array.from(topic.concepts).sort(),
                totalTags,
                learningOutcomes: topic.learningOutcomes
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

module.exports = {
    getUserProfile,
    getTopicsForClass
};

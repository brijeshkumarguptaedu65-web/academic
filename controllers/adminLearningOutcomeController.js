const LearningOutcome = require('../models/LearningOutcome');
const { calculateAndSaveCurriculumMapping, calculateAndSaveLearningOutcomeMapping } = require('./adminCurriculumController');

// Helper function to recalculate mappings for learning outcomes that might be affected by a new/updated learning outcome
const recalculateAffectedMappings = async (newOrUpdatedOutcome) => {
    try {
        // Find all learning outcomes of the same type and subject that might map to this one
        const query = {
            type: newOrUpdatedOutcome.type,
            _id: { $ne: newOrUpdatedOutcome._id }
        };

        if (newOrUpdatedOutcome.type === 'SUBJECT' && newOrUpdatedOutcome.subjectId) {
            query.subjectId = newOrUpdatedOutcome.subjectId._id;
        }

        const affectedOutcomes = await LearningOutcome.find(query)
            .select('_id')
            .limit(50); // Limit to avoid too many recalculations

        console.log(`Recalculating mappings for ${affectedOutcomes.length} potentially affected learning outcomes...`);

        // Recalculate mappings for affected outcomes (in background, don't wait)
        affectedOutcomes.forEach(affected => {
            calculateAndSaveLearningOutcomeMapping(affected._id).catch(err => {
                console.error(`Error recalculating mapping for affected LO ${affected._id}:`, err);
            });
        });

        return { recalculated: affectedOutcomes.length };
    } catch (err) {
        console.error('Error in recalculateAffectedMappings:', err);
        return { recalculated: 0 };
    }
};

// --- Learning Outcome Management ---
const getLearningOutcomes = async (req, res) => {
    try {
        const { classId, subjectId, type } = req.query;
        const LearningOutcomeRemedial = require('../models/LearningOutcomeRemedial');

        if (!type) {
            return res.status(400).json({ 
                message: 'type is required' 
            });
        }

        // Validate type
        if (!['SUBJECT', 'BASIC_CALCULATION'].includes(type)) {
            return res.status(400).json({ 
                message: 'type must be SUBJECT or BASIC_CALCULATION' 
            });
        }

        const query = { 
            type 
        };

        // classId is optional - filter by class if provided
        if (classId) {
            query.classId = classId;
        }

        // For SUBJECT type, subjectId is optional - filter by subject if provided
        if (type === 'SUBJECT' && subjectId) {
            query.subjectId = subjectId;
        }
        // For BASIC_CALCULATION, subjectId is ignored even if provided

        // Fetch outcomes with populate
        let outcomes = await LearningOutcome.find(query)
            .populate({
                path: 'classId',
                select: 'name level',
                match: { level: { $ne: null } } // Only populate if level is not null
            })
            .populate('subjectId', 'name')
            .lean(); // Use lean() to get plain objects
        
        // Sort after populate to avoid issues with null classId
        outcomes = outcomes.sort((a, b) => {
            // Sort by class level if both exist
            const levelA = a.classId?.level ?? 0;
            const levelB = b.classId?.level ?? 0;
            if (levelA !== levelB) {
                return levelA - levelB;
            }
            // Then by createdAt
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        
        // Filter out outcomes with null classId - be very strict
        const validOutcomes = outcomes.filter(o => {
            try {
                if (!o) {
                    return false;
                }
                if (!o.classId) {
                    console.warn(`Skipping outcome ${o._id} - null classId`);
                    return false;
                }
                // Safely check level - use optional chaining
                const level = o.classId?.level;
                if (level === null || level === undefined) {
                    console.warn(`Skipping outcome ${o._id} - classId.level is null/undefined`);
                    return false;
                }
                return true;
            } catch (err) {
                console.warn(`Error filtering outcome ${o?._id}:`, err.message);
                return false;
            }
        });
        
        console.log(`Filtered ${outcomes.length} outcomes to ${validOutcomes.length} valid outcomes`);

        // Return only learning outcomes without mappings
        const formattedOutcomes = validOutcomes.map((outcome) => {
            try {
                // Since we used .lean(), outcome is already a plain object
                const obj = { ...outcome };
                obj.id = obj._id.toString();
                obj.contents = obj.contents || [];
                
                // Ensure classId and subjectId are properly formatted with null checks
                // Double-check classId exists (should already be filtered, but be safe)
                if (!obj.classId) {
                    console.warn(`Skipping outcome ${obj.id} - null classId`);
                    return null;
                }
                
                // Safely access classId.level using optional chaining
                // Allow level 0 as valid
                const classLevel = obj.classId?.level;
                if (classLevel === null || classLevel === undefined) {
                    console.warn(`Skipping outcome ${obj.id} - classId.level is null/undefined`);
                    return null;
                }
                
                // Format classId object safely
                if (typeof obj.classId === 'object' && obj.classId !== null) {
                    obj.classId = {
                        _id: obj.classId._id || obj.classId,
                        name: obj.classId.name || `Class ${classLevel}`,
                        level: classLevel
                    };
                } else {
                    console.warn(`Skipping outcome ${obj.id} - classId is not an object`);
                    return null;
                }
                
                if (obj.subjectId && typeof obj.subjectId === 'object') {
                    obj.subjectId = {
                        _id: obj.subjectId._id || obj.subjectId,
                        name: obj.subjectId.name || 'Unknown'
                    };
                } else if (!obj.subjectId) {
                    obj.subjectId = {
                        _id: null,
                        name: 'Unknown'
                    };
                }
                
                // Get remedials
                const LearningOutcomeRemedial = require('../models/LearningOutcomeRemedial');
                // Note: We're not fetching remedials here to avoid async issues, but you can add it if needed
                obj.remedials = [];
                
                // Don't include mappings - return only the learning outcome
                // obj.mappedLearningOutcomes = []; // Removed - not needed
                
                return obj;
            } catch (err) {
                console.error(`Error processing outcome ${outcome?._id}:`, err.message);
                return null; // Return null to filter out later
            }
        }).filter(o => o !== null); // Remove null entries

        res.json(formattedOutcomes);
    } catch (err) {
        console.error('Error in getLearningOutcomes:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

const createLearningOutcome = async (req, res) => {
    try {
        const { text, type, classId, subjectId, topicName, instruction } = req.body;

        if (!text || !type || !classId) {
            return res.status(400).json({ 
                message: 'text, type, and classId are required' 
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

        const outcome = await LearningOutcome.create({
            text,
            type,
            classId,
            subjectId: type === 'SUBJECT' ? subjectId : undefined,
            topicName,
            instruction
        });

        const populated = await LearningOutcome.findById(outcome._id)
            .populate('classId', 'name level')
            .populate('subjectId', 'name');

        // Calculate and save curriculum mapping in background (don't wait for it)
        calculateAndSaveCurriculumMapping(outcome._id).catch(err => {
            console.error('Error calculating curriculum mapping for new learning outcome:', err);
            // Don't fail the request if mapping calculation fails
        });

        // Calculate and save learning outcome to learning outcome mapping in background
        calculateAndSaveLearningOutcomeMapping(outcome._id)
            .then(result => {
                console.log(`✓ Learning outcome mapping calculated for ${outcome._id}:`, 
                    result.mappedLearningOutcomes?.length || 0, 'mappings');
                
                // Also recalculate mappings for other learning outcomes that might now map to this new one
                // This ensures bidirectional mappings are updated
                return recalculateAffectedMappings(outcome);
            })
            .catch(err => {
                console.error('Error calculating learning outcome mapping for new learning outcome:', err);
                // Don't fail the request if mapping calculation fails
            });

        // Calculate and save topic tag mappings in background
        const { calculateAndSaveTopicTagMappings } = require('./adminCurriculumController');
        if (outcome.topicName) {
            calculateAndSaveTopicTagMappings(
                outcome.topicName,
                outcome.type,
                outcome.subjectId ? outcome.subjectId._id || outcome.subjectId : null
            ).catch(err => {
                console.error(`Error calculating topic tag mappings for topic "${outcome.topicName}":`, err);
                // Don't fail the request if topic mapping calculation fails
            });
        }

        const obj = populated.toObject();
        obj.id = obj._id;
        res.status(201).json(obj);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateLearningOutcome = async (req, res) => {
    try {
        const { text, topicName, instruction } = req.body;
        const updateData = {};

        if (text !== undefined) updateData.text = text;
        if (topicName !== undefined) updateData.topicName = topicName;
        if (instruction !== undefined) updateData.instruction = instruction;

        const outcome = await LearningOutcome.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('classId', 'name level')
         .populate('subjectId', 'name');

        if (!outcome) {
            return res.status(404).json({ message: 'Learning outcome not found' });
        }

        // If text or topicName was updated, recalculate mappings in background
        if (text !== undefined || topicName !== undefined) {
            calculateAndSaveCurriculumMapping(outcome._id).catch(err => {
                console.error('Error recalculating curriculum mapping after update:', err);
            });
            calculateAndSaveLearningOutcomeMapping(outcome._id)
                .then(() => {
                    // Recalculate affected mappings
                    return recalculateAffectedMappings(outcome);
                })
                .catch(err => {
                    console.error('Error recalculating learning outcome mapping after update:', err);
                });

            // Recalculate topic tag mappings if topicName or text changed
            if (outcome.topicName) {
                const { calculateAndSaveTopicTagMappings } = require('./adminCurriculumController');
                calculateAndSaveTopicTagMappings(
                    outcome.topicName,
                    outcome.type,
                    outcome.subjectId ? outcome.subjectId._id || outcome.subjectId : null
                ).catch(err => {
                    console.error(`Error recalculating topic tag mappings for topic "${outcome.topicName}":`, err);
                });
            }
        }

        const obj = outcome.toObject();
        obj.id = obj._id;
        res.json(obj);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteLearningOutcome = async (req, res) => {
    try {
        const outcome = await LearningOutcome.findById(req.params.id);
        if (!outcome) {
            return res.status(404).json({ message: 'Learning outcome not found' });
        }

        // Get IDs of learning outcomes that were mapped to this one (before deletion)
        const LearningOutcomeMapping = require('../models/LearningOutcomeMapping');
        const affectedMappings = await LearningOutcomeMapping.find({
            'mappedLearningOutcomes.mappedLearningOutcomeId': req.params.id
        });

        // Delete the learning outcome
        await LearningOutcome.findByIdAndDelete(req.params.id);

        // Delete associated mappings
        const CurriculumMapping = require('../models/CurriculumMapping');
        await CurriculumMapping.deleteOne({ learningOutcomeId: req.params.id });
        await LearningOutcomeMapping.deleteOne({ learningOutcomeId: req.params.id });
        
        // Remove references to this outcome from other mappings
        await LearningOutcomeMapping.updateMany(
            {},
            { $pull: { mappedLearningOutcomes: { mappedLearningOutcomeId: req.params.id } } }
        );

        // Recalculate mappings for affected learning outcomes (in background)
        if (affectedMappings.length > 0) {
            const affectedIds = affectedMappings.map(m => m.learningOutcomeId);
            const { calculateAndSaveLearningOutcomeMapping } = require('./adminCurriculumController');
            
            affectedIds.forEach(id => {
                calculateAndSaveLearningOutcomeMapping(id).catch(err => {
                    console.error(`Error recalculating mapping for affected LO ${id}:`, err);
                });
            });
        }

        // Recalculate topic tag mappings for the deleted outcome's topic
        if (outcome.topicName) {
            const { calculateAndSaveTopicTagMappings } = require('./adminCurriculumController');
            calculateAndSaveTopicTagMappings(
                outcome.topicName,
                outcome.type,
                outcome.subjectId ? outcome.subjectId._id || outcome.subjectId : null
            ).catch(err => {
                console.error(`Error recalculating topic tag mappings for topic "${outcome.topicName}":`, err);
            });
        }

        // Delete topic tag mappings if no learning outcomes remain for this topic
        const TopicTagMapping = require('../models/TopicTagMapping');
        const remainingOutcomes = await LearningOutcome.countDocuments({
            topicName: outcome.topicName,
            type: outcome.type,
            subjectId: outcome.subjectId
        });
        
        if (remainingOutcomes === 0) {
            await TopicTagMapping.deleteOne({
                topicName: outcome.topicName,
                type: outcome.type,
                subjectId: outcome.subjectId || null
            });
        }

        res.json({ message: 'Learning outcome removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get learning outcomes grouped by topic
const getLearningOutcomesByTopic = async (req, res) => {
    try {
        const { subjectId, type } = req.query;

        if (!type) {
            return res.status(400).json({ 
                message: 'type is required' 
            });
        }

        // Validate type
        if (!['SUBJECT', 'BASIC_CALCULATION'].includes(type)) {
            return res.status(400).json({ 
                message: 'type must be SUBJECT or BASIC_CALCULATION' 
            });
        }

        const query = { type };

        // For SUBJECT type, subjectId is optional
        if (type === 'SUBJECT' && subjectId) {
            query.subjectId = subjectId;
        }

        const outcomes = await LearningOutcome.find(query)
            .populate({
                path: 'classId',
                select: 'name level',
                match: { level: { $ne: null } }
            })
            .populate('subjectId', 'name')
            .sort({ 'classId.level': 1, topicName: 1, createdAt: 1 })
            .lean();

        // Filter out outcomes with null classId
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

        // Group by topic
        const groupedByTopic = {};

        validOutcomes.forEach(outcome => {
            const topic = outcome.topicName || 'No Topic';
            
            if (!groupedByTopic[topic]) {
                groupedByTopic[topic] = {
                    topicName: topic,
                    learningOutcomes: []
                };
            }

            groupedByTopic[topic].learningOutcomes.push({
                id: outcome._id.toString(),
                text: outcome.text,
                tags: outcome.text ? outcome.text.split(',').map(t => t.trim()) : [],
                classId: {
                    _id: outcome.classId._id.toString(),
                    name: outcome.classId.name,
                    level: outcome.classId.level
                },
                subjectId: outcome.subjectId ? {
                    _id: outcome.subjectId._id.toString(),
                    name: outcome.subjectId.name
                } : null,
                type: outcome.type,
                createdAt: outcome.createdAt,
                updatedAt: outcome.updatedAt
            });
        });

        // Convert to array and sort
        const topics = Object.values(groupedByTopic).sort((a, b) => {
            if (a.topicName === 'No Topic') return 1;
            if (b.topicName === 'No Topic') return -1;
            return a.topicName.localeCompare(b.topicName);
        });

        // Sort learning outcomes within each topic by class level
        topics.forEach(topic => {
            topic.learningOutcomes.sort((a, b) => a.classId.level - b.classId.level);
        });

        res.json({
            success: true,
            totalTopics: topics.length,
            totalLearningOutcomes: validOutcomes.length,
            topics: topics
        });

    } catch (err) {
        console.error('Error in getLearningOutcomesByTopic:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

module.exports = {
    getLearningOutcomes,
    createLearningOutcome,
    updateLearningOutcome,
    deleteLearningOutcome,
    getLearningOutcomesByTopic
};

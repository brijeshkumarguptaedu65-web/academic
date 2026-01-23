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

        const outcomes = await LearningOutcome.find(query)
            .populate('classId', 'name level')
            .populate('subjectId', 'name')
            .sort({ createdAt: -1 })
            .lean(); // Use lean() to get plain objects
        
        // Filter out outcomes with null classId
        const validOutcomes = outcomes.filter(o => o.classId && o.classId.level);

        // Get all learning outcome IDs for mapping lookup
        const outcomeIds = validOutcomes.map(o => o._id);
        const LearningOutcomeMapping = require('../models/LearningOutcomeMapping');
        const mappings = await LearningOutcomeMapping.find({
            learningOutcomeId: { $in: outcomeIds }
        });

        // Add remedials and mappings to each outcome
        const outcomesWithRemedials = await Promise.all(
            validOutcomes.map(async (outcome) => {
                const obj = outcome.toObject();
                obj.id = obj._id;
                obj.contents = obj.contents || [];
                
                // Get remedials
                const remedial = await LearningOutcomeRemedial.findOne({ 
                    learningOutcomeId: outcome._id 
                });
                obj.remedials = remedial ? remedial.items : [];
                
                // Get learning outcome mappings
                const mapping = mappings.find(
                    m => m.learningOutcomeId.toString() === outcome._id.toString()
                );
                
                if (mapping && mapping.mappedLearningOutcomes.length > 0) {
                    // Populate mapped learning outcomes
                    const mappedOutcomeIds = mapping.mappedLearningOutcomes.map(m => m.mappedLearningOutcomeId);
                    const mappedOutcomes = await LearningOutcome.find({
                        _id: { $in: mappedOutcomeIds }
                    })
                    .populate('classId', 'name level')
                    .populate('subjectId', 'name');

                    obj.mappedLearningOutcomes = mapping.mappedLearningOutcomes.map(mo => {
                        const mappedOutcome = mappedOutcomes.find(
                            o => o._id.toString() === mo.mappedLearningOutcomeId.toString()
                        );
                        
                        // Check for null classId
                        if (!mappedOutcome || !mappedOutcome.classId || !mappedOutcome.classId.level) {
                            console.warn(`Skipping mapping - null classId for outcome ${mo.mappedLearningOutcomeId}`);
                            return null;
                        }
                        
                        return {
                            learningOutcomeId: mo.mappedLearningOutcomeId.toString(),
                            learningOutcome: {
                                id: mappedOutcome._id.toString(),
                                text: mappedOutcome.text,
                                tags: mappedOutcome.text.split(',').map(t => t.trim()),
                                classLevel: mappedOutcome.classId.level,
                                className: mappedOutcome.classId.name || `Class ${mappedOutcome.classId.level}`,
                                topicName: mappedOutcome.topicName,
                                type: mappedOutcome.type
                            },
                            mappingType: mo.mappingType,
                            relevanceScore: mo.relevanceScore,
                            reason: mo.reason,
                            fromTag: mo.fromTag || null, // Tag from current learning outcome
                            toTag: mo.toTag || null // Tag from mapped learning outcome
                        };
                    }).filter(m => m !== null); // Remove null entries
                } else {
                    obj.mappedLearningOutcomes = [];
                }
                
                return obj;
            })
        );

        res.json(outcomesWithRemedials);
    } catch (err) {
        res.status(500).json({ message: err.message });
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

        res.json({ message: 'Learning outcome removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getLearningOutcomes,
    createLearningOutcome,
    updateLearningOutcome,
    deleteLearningOutcome
};

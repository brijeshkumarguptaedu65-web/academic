const LearningOutcome = require('../models/LearningOutcome');
const { calculateAndSaveCurriculumMapping, calculateAndSaveLearningOutcomeMapping } = require('./adminCurriculumController');

// --- Learning Outcome Management ---
const getLearningOutcomes = async (req, res) => {
    try {
        const { classId, subjectId, type } = req.query;
        const LearningOutcomeRemedial = require('../models/LearningOutcomeRemedial');

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

        const query = { 
            classId, 
            type 
        };

        // For SUBJECT type, subjectId is required
        if (type === 'SUBJECT') {
            if (!subjectId) {
                return res.status(400).json({ 
                    message: 'subjectId is required for SUBJECT type' 
                });
            }
            query.subjectId = subjectId;
        }
        // For BASIC_CALCULATION, subjectId is ignored even if provided

        const outcomes = await LearningOutcome.find(query)
            .populate('classId', 'name level')
            .populate('subjectId', 'name')
            .sort({ createdAt: -1 });

        // Get all learning outcome IDs for mapping lookup
        const outcomeIds = outcomes.map(o => o._id);
        const LearningOutcomeMapping = require('../models/LearningOutcomeMapping');
        const mappings = await LearningOutcomeMapping.find({
            learningOutcomeId: { $in: outcomeIds }
        });

        // Add remedials and mappings to each outcome
        const outcomesWithRemedials = await Promise.all(
            outcomes.map(async (outcome) => {
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
                            reason: mo.reason
                        };
                    });
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
        calculateAndSaveLearningOutcomeMapping(outcome._id).catch(err => {
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

        // If text was updated, recalculate mappings in background
        if (text !== undefined) {
            calculateAndSaveCurriculumMapping(outcome._id).catch(err => {
                console.error('Error recalculating curriculum mapping after update:', err);
                // Don't fail the request if mapping calculation fails
            });
            calculateAndSaveLearningOutcomeMapping(outcome._id).catch(err => {
                console.error('Error recalculating learning outcome mapping after update:', err);
                // Don't fail the request if mapping calculation fails
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
        const outcome = await LearningOutcome.findByIdAndDelete(req.params.id);
        if (!outcome) {
            return res.status(404).json({ message: 'Learning outcome not found' });
        }

        // Also delete associated mappings
        const CurriculumMapping = require('../models/CurriculumMapping');
        const LearningOutcomeMapping = require('../models/LearningOutcomeMapping');
        await CurriculumMapping.deleteOne({ learningOutcomeId: req.params.id });
        await LearningOutcomeMapping.deleteOne({ learningOutcomeId: req.params.id });
        
        // Also delete mappings where this outcome is referenced
        await LearningOutcomeMapping.updateMany(
            {},
            { $pull: { mappedLearningOutcomes: { mappedLearningOutcomeId: req.params.id } } }
        );

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

const LearningOutcome = require('../models/LearningOutcome');

// --- Learning Outcome Management ---
const getLearningOutcomes = async (req, res) => {
    try {
        const { classId, subjectId, type } = req.query;

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

        // Format response
        const formattedOutcomes = outcomes.map(outcome => {
            const obj = outcome.toObject();
            obj.id = obj._id;
            return obj;
        });

        res.json(formattedOutcomes);
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

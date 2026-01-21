const Instruction = require('../models/Instruction');

// --- Instruction Management ---
const getInstructions = async (req, res) => {
    try {
        const { classId, subjectId } = req.query;

        if (!classId || !subjectId) {
            return res.status(400).json({ 
                message: 'classId and subjectId are required' 
            });
        }

        const instruction = await Instruction.findOne({ classId, subjectId })
            .populate('classId', 'name level')
            .populate('subjectId', 'name');

        if (!instruction) {
            return res.json({ instructions: '' });
        }

        res.json({ instructions: instruction.instructions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const saveInstructions = async (req, res) => {
    try {
        const { classId, subjectId, instructions } = req.body;

        if (!classId || !subjectId || !instructions) {
            return res.status(400).json({ 
                message: 'classId, subjectId, and instructions are required' 
            });
        }

        // Upsert: create if doesn't exist, update if exists
        const instruction = await Instruction.findOneAndUpdate(
            { classId, subjectId },
            { instructions },
            { new: true, upsert: true }
        ).populate('classId', 'name level')
         .populate('subjectId', 'name');

        res.json({ 
            message: 'Instructions saved successfully',
            instructions: instruction.instructions 
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    getInstructions,
    saveInstructions
};

const Test = require('../models/Test');

// --- Test Management ---
const getTests = async (req, res) => {
    try {
        const tests = await Test.find({}).populate('subjectId', 'name');
        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createTest = async (req, res) => {
    try {
        const {
            title,
            classIds,
            subjectId,
            totalQuestions,
            instructions,
            passingPercentage,
            difficulty,
            bloomsTaxonomy,
            status
        } = req.body;

        const test = await Test.create({
            title,
            classIds,
            subjectId,
            totalQuestions,
            instructions,
            passingPercentage,
            difficulty,
            bloomsTaxonomy,
            status: status || 'DRAFT'
        });

        res.status(201).json(test);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateTest = async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('subjectId', 'name');

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        res.json(test);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteTest = async (req, res) => {
    try {
        const test = await Test.findByIdAndDelete(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json({ message: 'Test removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getTests,
    createTest,
    updateTest,
    deleteTest
};

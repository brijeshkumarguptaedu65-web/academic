const User = require('../models/User');
const TestResult = require('../models/TestResult');
const { Class } = require('../models/Metadata');

// 4.1 Dashboard
const getDashboardStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });

        // Avg Entry Test Score
        const entryResults = await TestResult.find({ testType: 'ENTRY' });
        const avgEntryScore = entryResults.length > 0
            ? entryResults.reduce((acc, curr) => acc + curr.percentage, 0) / entryResults.length
            : 0;

        // Class Distribution
        // Group students by class
        // Since 'class' in User is just a Number, we can aggregate
        const classDist = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: "$class", count: { $sum: 1 } } }
        ]);

        res.json({
            totalStudents,
            avgEntryScore: avgEntryScore.toFixed(2),
            classDistribution: classDist
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// 4.2 Student Monitoring
const getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

const getStudentPerformance = async (req, res) => {
    try {
        const { id } = req.params;
        const results = await TestResult.find({ studentId: id }).populate('chapterId', 'chapterName');
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getDashboardStats, getStudents, getStudentPerformance };

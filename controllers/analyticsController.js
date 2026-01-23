const User = require('../models/User');
const TestResult = require('../models/TestResult');
const QuizAttempt = require('../models/QuizAttempt');
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
        // Get users with role 'user' (registered through user API) or 'student'
        const students = await User.find({ 
            role: { $in: ['user', 'student'] } 
        })
        .select('-password -otp -otpExpiry -otpType')
        .sort({ createdAt: -1 })
        .lean();
        
        // Format response with additional info
        const formattedStudents = students.map(user => ({
            _id: user._id,
            id: user._id,
            name: user.name || user.username || 'Unknown',
            email: user.email || null,
            mobile: user.mobile || null,
            role: user.role,
            grade: user.grade || null,
            class: user.class || null,
            level: user.class || null,
            avatar: user.avatar || null,
            isVerified: user.isVerified || false,
            passedBasicCalculationClass: user.passedBasicCalculationClass || null,
            passedClasses: user.passedClasses || {},
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        
        res.json({
            success: true,
            count: formattedStudents.length,
            data: formattedStudents
        });
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching students',
            error: err.message 
        });
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

// Get user's quiz history (for admin panel)
const getUserQuizHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, skip = 0, classLevel, quizType, passed } = req.query;

        // Verify user exists
        const user = await User.findById(id).select('name email mobile role');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build query
        const query = { userId: id };
        if (classLevel) query.classLevel = parseInt(classLevel);
        if (quizType) query.quizType = quizType;
        if (passed !== undefined) query.passed = passed === 'true';

        // Fetch quiz attempts
        const attempts = await QuizAttempt.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        const total = await QuizAttempt.countDocuments(query);

        // Calculate summary statistics
        const totalAttempts = await QuizAttempt.countDocuments({ userId: id });
        const totalPassed = await QuizAttempt.countDocuments({ userId: id, passed: true });
        const totalFailed = totalAttempts - totalPassed;
        
        const allAttempts = await QuizAttempt.find({ userId: id }).lean();
        const averageScore = allAttempts.length > 0
            ? allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length
            : 0;

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            summary: {
                totalAttempts,
                totalPassed,
                totalFailed,
                averageScore: Math.round(averageScore * 10) / 10
            },
            data: {
                attempts,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (err) {
        console.error('Get user quiz history error:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching user quiz history',
            error: err.message
        });
    }
}

module.exports = { 
    getDashboardStats, 
    getStudents, 
    getStudentPerformance,
    getUserQuizHistory 
};

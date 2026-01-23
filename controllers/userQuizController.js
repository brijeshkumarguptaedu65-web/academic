const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const { Class } = require('../models/Metadata');
const LearningOutcome = require('../models/LearningOutcome');
const ConceptGraph = require('../models/ConceptGraph');

/**
 * @desc    Submit quiz results
 * @route   POST /api/user/quiz/submit
 * @access  Private
 */
const submitQuiz = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            classLevel,
            quizType,
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            score,
            percentage,
            timeSpent,
            passed,
            overall,
            topicWise,
            conceptWise,
            questions,
            wrongConcepts,
            wrongTopics,
            remedialRecommendations
        } = req.body;

        // Validate required fields
        if (!classLevel || !quizType || !totalQuestions || score === undefined || percentage === undefined || passed === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: classLevel, quizType, totalQuestions, score, percentage, passed'
            });
        }

        // Process questions array - ensure selectedOption is set
        const processedQuestions = (questions || []).map(q => {
            const question = { ...q };
            
            // Derive selectedOption from selectedAnswer and options if not provided
            if (!question.selectedOption && question.selectedAnswer !== undefined && question.options && Array.isArray(question.options)) {
                const selectedIndex = question.selectedAnswer;
                if (selectedIndex >= 0 && selectedIndex < question.options.length) {
                    question.selectedOption = question.options[selectedIndex];
                } else {
                    question.selectedOption = ''; // Default to empty string if index is invalid
                }
            }
            
            // Derive correctOption from correctAnswer and options if not provided
            if (!question.correctOption && question.correctAnswer !== undefined && question.options && Array.isArray(question.options)) {
                const correctIndex = question.correctAnswer;
                if (correctIndex >= 0 && correctIndex < question.options.length) {
                    question.correctOption = question.options[correctIndex];
                } else {
                    question.correctOption = ''; // Default to empty string if index is invalid
                }
            }
            
            // Ensure selectedOption and correctOption are strings (required by schema)
            if (!question.selectedOption) question.selectedOption = '';
            if (!question.correctOption) question.correctOption = '';
            
            return question;
        });

        // Create quiz attempt
        const quizAttempt = await QuizAttempt.create({
            userId,
            classLevel,
            quizType,
            totalQuestions,
            correctAnswers: correctAnswers || 0,
            incorrectAnswers: incorrectAnswers || 0,
            score,
            percentage,
            timeSpent: timeSpent || 0,
            passed,
            overall: overall || {
                score,
                total: totalQuestions,
                correct: correctAnswers || 0,
                percentage
            },
            topicWise: topicWise || {},
            conceptWise: conceptWise || {},
            questions: processedQuestions,
            wrongConcepts: wrongConcepts || [],
            wrongTopics: wrongTopics || [],
            remedialRecommendations: remedialRecommendations || []
        });

        // Update user profile if passed
        let profileUpdated = false;
        let passedClassLevel = null;

        if (passed && quizType === 'BASIC_CALCULATION') {
            const user = await User.findById(userId);
            if (user) {
                const currentPassedClass = user.passedBasicCalculationClass || 0;
                
                // Only update if new class level is higher than existing
                if (classLevel > currentPassedClass) {
                    user.passedBasicCalculationClass = classLevel;
                    if (!user.passedClasses) {
                        user.passedClasses = {};
                    }
                    user.passedClasses.BASIC_CALCULATION = classLevel;
                    await user.save();
                    profileUpdated = true;
                    passedClassLevel = classLevel;
                } else {
                    // Still update passedClasses if needed
                    if (!user.passedClasses) {
                        user.passedClasses = {};
                    }
                    if (!user.passedClasses.BASIC_CALCULATION || classLevel > user.passedClasses.BASIC_CALCULATION) {
                        user.passedClasses.BASIC_CALCULATION = classLevel;
                        await user.save();
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Quiz results saved successfully',
            data: {
                attemptId: quizAttempt._id,
                classLevel,
                score,
                percentage,
                passed,
                profileUpdated,
                passedClassLevel,
                totalQuestions,
                correctAnswers: correctAnswers || 0,
                incorrectAnswers: incorrectAnswers || 0,
                timestamp: quizAttempt.createdAt
            }
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving quiz results',
            error: error.message
        });
    }
};

/**
 * @desc    Get user quiz history
 * @route   GET /api/user/quiz/history
 * @access  Private
 */
const getQuizHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { classLevel, quizType, passed, limit = 10, skip = 0 } = req.query;

        // Build query
        const query = { userId };
        if (classLevel) query.classLevel = parseInt(classLevel);
        if (quizType) query.quizType = quizType;
        if (passed !== undefined) query.passed = passed === 'true';

        // Fetch attempts
        const attempts = await QuizAttempt.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .select('-questions') // Exclude questions for list view
            .lean();

        // Attempts are already in the correct format (Mixed type stores as objects)
        const formattedAttempts = attempts;

        const total = await QuizAttempt.countDocuments(query);

        res.json({
            success: true,
            data: {
                attempts: formattedAttempts,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('Get quiz history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quiz history',
            error: error.message
        });
    }
};

/**
 * @desc    Get detailed quiz attempt
 * @route   GET /api/user/quiz/attempt/:attemptId
 * @access  Private
 */
const getQuizAttempt = async (req, res) => {
    try {
        const userId = req.user._id;
        const { attemptId } = req.params;

        const attempt = await QuizAttempt.findOne({
            _id: attemptId,
            userId
        }).lean();

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Quiz attempt not found'
            });
        }

        // Attempt is already in the correct format (Mixed type stores as objects)
        const formatted = attempt;

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('Get quiz attempt error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quiz attempt',
            error: error.message
        });
    }
};

/**
 * @desc    Get user progress summary
 * @route   GET /api/user/progress
 * @access  Private
 */
const getUserProgress = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user profile
        const user = await User.findById(userId).select('passedBasicCalculationClass passedClasses');

        // Get all attempts
        const allAttempts = await QuizAttempt.find({ userId }).lean();

        // Calculate statistics
        const totalAttempts = allAttempts.length;
        const totalPassed = allAttempts.filter(a => a.passed).length;
        const totalFailed = totalAttempts - totalPassed;

        // Calculate average score
        const averageScore = totalAttempts > 0
            ? allAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts
            : 0;

        // Group by class level
        const classPerformance = {};
        allAttempts.forEach(attempt => {
            const level = attempt.classLevel.toString();
            if (!classPerformance[level]) {
                classPerformance[level] = {
                    attempts: 0,
                    passed: 0,
                    scores: []
                };
            }
            classPerformance[level].attempts++;
            if (attempt.passed) {
                classPerformance[level].passed++;
            }
            classPerformance[level].scores.push(attempt.percentage);
        });

        // Calculate averages and best scores for each class
        Object.keys(classPerformance).forEach(level => {
            const perf = classPerformance[level];
            perf.averageScore = perf.scores.length > 0
                ? perf.scores.reduce((sum, s) => sum + s, 0) / perf.scores.length
                : 0;
            perf.bestScore = perf.scores.length > 0
                ? Math.max(...perf.scores)
                : 0;
            delete perf.scores;
        });

        // Calculate topic mastery (average percentage across all attempts)
        const topicMastery = {};
        allAttempts.forEach(attempt => {
            const topicWise = attempt.topicWise || {};

            Object.keys(topicWise).forEach(topic => {
                if (!topicMastery[topic]) {
                    topicMastery[topic] = { total: 0, sum: 0 };
                }
                topicMastery[topic].total++;
                topicMastery[topic].sum += topicWise[topic].percentage || 0;
            });
        });

        // Calculate average mastery for each topic
        Object.keys(topicMastery).forEach(topic => {
            const mastery = topicMastery[topic];
            topicMastery[topic] = mastery.total > 0
                ? mastery.sum / mastery.total
                : 0;
        });

        // Calculate concept mastery
        const conceptMastery = {};
        allAttempts.forEach(attempt => {
            const conceptWise = attempt.conceptWise || {};

            Object.keys(conceptWise).forEach(concept => {
                if (!conceptMastery[concept]) {
                    conceptMastery[concept] = { total: 0, sum: 0 };
                }
                conceptMastery[concept].total++;
                conceptMastery[concept].sum += conceptWise[concept].percentage || 0;
            });
        });

        // Calculate average mastery for each concept
        Object.keys(conceptMastery).forEach(concept => {
            const mastery = conceptMastery[concept];
            conceptMastery[concept] = mastery.total > 0
                ? mastery.sum / mastery.total
                : 0;
        });

        res.json({
            success: true,
            data: {
                passedBasicCalculationClass: user?.passedBasicCalculationClass || null,
                totalAttempts,
                totalPassed,
                totalFailed,
                averageScore: Math.round(averageScore * 10) / 10,
                classPerformance,
                topicMastery,
                conceptMastery
            }
        });
    } catch (error) {
        console.error('Get user progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user progress',
            error: error.message
        });
    }
};

module.exports = {
    submitQuiz,
    getQuizHistory,
    getQuizAttempt,
    getUserProgress
};

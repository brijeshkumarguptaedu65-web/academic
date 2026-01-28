const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    forgotPassword,
    resetPassword,
    getClassList,
    getBasicCalculationLearningOutcomes,
    getConceptsWithTags,
} = require('../controllers/userAuthController');
const {
    submitQuiz,
    getQuizHistory,
    getQuizAttempt,
    getUserProgress
} = require('../controllers/userQuizController');
const {
    getUserProfile,
    getTopicsForClass,
    getTopicTagsWithConcepts
} = require('../controllers/userProfileController');
const {
    getQuestionsByTagAndClass,
    getRandomQuestionsByTopic,
    getQuestionsByClassAndType
} = require('../controllers/adminQuestionController');

// Public routes - Registration flow
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Public routes - Login
router.post('/login', loginUser);

// Public routes - Password reset flow
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Public routes - Class and Learning Outcomes
router.get('/classes', getClassList);
router.get('/learning-outcomes/basic-calculation/:classLevel', getBasicCalculationLearningOutcomes);
router.get('/concepts-with-tags/:classLevel', getConceptsWithTags);

// Protected routes - Profile Management
router.get('/profile', protect, getUserProfile);
router.get('/classes/:classLevel/topics/:topicName', protect, getTopicTagsWithConcepts); // Must be before the general topics route
router.get('/classes/:classLevel/topics', protect, getTopicsForClass);

// Protected routes - Quiz Management
router.post('/quiz/submit', protect, submitQuiz);
router.get('/quiz/history', protect, getQuizHistory);
router.get('/quiz/attempt/:attemptId', protect, getQuizAttempt);
router.get('/progress', protect, getUserProgress);

// Protected routes - Question Retrieval
router.get('/questions/by-tag-class', protect, getQuestionsByTagAndClass); // Get questions by tag and class
router.get('/questions/random-by-topic', protect, getRandomQuestionsByTopic); // Get random questions by topic (equal distribution across tags)
router.get('/questions/by-class-type', protect, getQuestionsByClassAndType); // Get questions by class and type (equal distribution across topics and tags)

module.exports = router;

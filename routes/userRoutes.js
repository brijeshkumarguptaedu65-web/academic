const express = require('express');
const router = express.Router();
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

// Registration flow
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Login
router.post('/login', loginUser);

// Password reset flow
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Class and Learning Outcomes
router.get('/classes', getClassList);
router.get('/learning-outcomes/basic-calculation/:classLevel', getBasicCalculationLearningOutcomes);
router.get('/concepts-with-tags/:classLevel', getConceptsWithTags);

module.exports = router;

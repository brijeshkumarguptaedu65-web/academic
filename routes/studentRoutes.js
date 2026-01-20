const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Student needs auth too

const {
    getEntryTestInstructions,
    getEntryTestQuestions,
    submitEntryTest,
    getStudentClasses,
    getStudentSubjects,
    getStudentChapters,
    generateQuiz,
    submitQuiz,
    getStudentRemedial
} = require('../controllers/studentController');

router.use(protect); // Protect all student routes

// 3.1 Entry Test
router.get('/test/entry/instructions', getEntryTestInstructions);
router.get('/test/entry/questions', getEntryTestQuestions);
router.post('/test/entry/submit', submitEntryTest);

// 3.2 Navigation
router.get('/classes', getStudentClasses);
router.get('/classes/:classId/subjects', getStudentSubjects);
router.get('/subjects/:subjectId/chapters', getStudentChapters);

// 3.3 Quiz
router.post('/quiz/generate', generateQuiz);
router.post('/quiz/submit', submitQuiz);

// 3.4 Remedial
router.get('/chapters/:chapterId/remedial', getStudentRemedial);

module.exports = router;

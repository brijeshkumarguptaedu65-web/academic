const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
    getBasicTestConfig,
    updateBasicTestConfig,
    getClasses,
    createClass,
    updateClass,
    deleteClass,
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    getTopicChainPreview
} = require('../controllers/adminConfigController');

const {
    getChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    addChapterContent,
    deleteChapterContent,
    getRemedials,
    addRemedial,
    deleteRemedialItem
} = require('../controllers/adminChapterController');

const {
    getTests,
    createTest,
    updateTest,
    deleteTest
} = require('../controllers/adminTestController');

// All routes protected + admin only
router.use(protect, admin);

// 2.1 Basic Test
router.get('/config/basic-test', getBasicTestConfig);
router.put('/config/basic-test', updateBasicTestConfig);

// 2.2 Classes
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// 2.3 Subjects
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// 2.4 Topics
router.get('/topics', getTopics);
router.post('/topics', createTopic);
router.put('/topics/:id', updateTopic);
router.delete('/topics/:id', deleteTopic);
router.get('/topics/:id/chain-preview', getTopicChainPreview);

// 2.5 Chapters
router.get('/chapters', getChapters);
router.post('/chapters', createChapter);
router.put('/chapters/:id', updateChapter);
router.delete('/chapters/:id', deleteChapter);

// 2.5.1 Chapter Content
router.post('/chapters/:chapterId/content', upload.single('file'), addChapterContent);
router.delete('/chapters/:chapterId/content/:contentId', deleteChapterContent);

// 2.6 Remedials
router.get('/chapters/:chapterId/remedial', getRemedials);
router.post('/chapters/:chapterId/remedial', addRemedial);
router.delete('/chapters/:chapterId/remedial/:remedialId', deleteRemedialItem);
router.delete('/remedials/:remedialId', deleteRemedialItem); // Alternative endpoint

// 2.7 Tests
router.get('/tests', getTests);
router.post('/tests', createTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);

module.exports = router;

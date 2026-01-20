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
    deleteClass,
    getSubjects,
    createSubject,
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
    uploadChapterPdf,
    getRemedials,
    addRemedial,
    deleteRemedialItem
} = require('../controllers/adminChapterController');

// All routes protected + admin only
router.use(protect, admin);

// 2.1 Basic Test
router.get('/config/basic-test', getBasicTestConfig);
router.put('/config/basic-test', updateBasicTestConfig);

// 2.2 Classes
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.delete('/classes/:id', deleteClass);

// 2.3 Subjects
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);

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
router.post('/chapters/:id/upload-pdf', upload.single('file'), uploadChapterPdf);

// 2.6 Remedials
router.get('/chapters/:chapterId/remedials', getRemedials);
router.post('/chapters/:chapterId/remedials', addRemedial);
router.delete('/remedials/:remedialId', deleteRemedialItem);

module.exports = router;

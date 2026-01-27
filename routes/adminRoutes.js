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

const {
    getLearningOutcomes,
    createLearningOutcome,
    updateLearningOutcome,
    deleteLearningOutcome,
    getLearningOutcomesByTopic
} = require('../controllers/adminLearningOutcomeController');

const {
    getInstructions,
    saveInstructions
} = require('../controllers/adminInstructionController');

const {
    addLearningOutcomeContent,
    deleteLearningOutcomeContent,
    getLearningOutcomeContent,
    getLearningOutcomeRemedials,
    addLearningOutcomeRemedial,
    deleteLearningOutcomeRemedialItem
} = require('../controllers/adminLearningOutcomeContentController');

const {
    mapLearningOutcomesToCurriculum,
    getLearningOutcomeCurriculumMapping,
    recalculateCurriculumMapping,
    recalculateLearningOutcomeMapping,
    getTopicTagMappings,
    getConceptGraph,
    getTopicList,
    syncAllConceptGraphs,
    syncAllTopicTagMappings
} = require('../controllers/adminCurriculumController');

const {
    generateQuestions,
    getAllQuestions,
    approveQuestion,
    rejectQuestion,
    bulkApproveQuestions,
    bulkRejectQuestions
} = require('../controllers/adminQuestionController');

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
// Support both file upload (multipart/form-data) and manual entry (application/json)
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

// 2.8 Learning Outcomes
router.get('/learning-outcomes', getLearningOutcomes);
router.get('/learning-outcomes/by-topic', getLearningOutcomesByTopic);
router.post('/learning-outcomes', createLearningOutcome);
router.put('/learning-outcomes/:id', updateLearningOutcome);
router.delete('/learning-outcomes/:id', deleteLearningOutcome);

// 2.8.1 Learning Outcome Content
router.get('/learning-outcomes/:learningOutcomeId/content', getLearningOutcomeContent);
router.post('/learning-outcomes/:learningOutcomeId/content', upload.single('file'), addLearningOutcomeContent);
router.delete('/learning-outcomes/:learningOutcomeId/content/:contentId', deleteLearningOutcomeContent);

// 2.8.2 Learning Outcome Remedials
router.get('/learning-outcomes/:learningOutcomeId/remedial', getLearningOutcomeRemedials);
router.post('/learning-outcomes/:learningOutcomeId/remedial', addLearningOutcomeRemedial);
router.delete('/learning-outcomes/:learningOutcomeId/remedial/:remedialId', deleteLearningOutcomeRemedialItem);
router.delete('/learning-outcome-remedials/:remedialId', deleteLearningOutcomeRemedialItem); // Alternative endpoint

// 2.9 Instructions
router.get('/instructions', getInstructions);
router.post('/instructions', saveInstructions);

// 2.10 Curriculum Mapping (AI-powered, stored in DB)
router.post('/curriculum/map-learning-outcomes', mapLearningOutcomesToCurriculum);
router.get('/curriculum/learning-outcomes/:learningOutcomeId/mapping', getLearningOutcomeCurriculumMapping);
router.post('/curriculum/learning-outcomes/:learningOutcomeId/recalculate', recalculateCurriculumMapping);

// 2.10.1 Learning Outcome to Learning Outcome Mapping
router.post('/curriculum/learning-outcomes/:learningOutcomeId/recalculate-mapping', recalculateLearningOutcomeMapping);

// 2.10.2 Topic Tag Mappings (AI-powered)
router.get('/curriculum/topics/:topicName/tag-mappings', getTopicTagMappings);

// 2.10.3 Concept Graph (AI-powered, stored in DB)
router.get('/curriculum/topics', getTopicList); // Get topic list with concept graph status
router.get('/curriculum/topics/:topicName/concept-graph', getConceptGraph); // Get concept graph for a topic
router.post('/curriculum/sync-concept-graphs', syncAllConceptGraphs); // Sync all concept graphs

// 2.10.4 Topic Tag Mappings Sync (AI-powered, stored in DB)
router.post('/curriculum/sync-topic-tag-mappings', syncAllTopicTagMappings); // Sync all topic tag mappings

// 2.11 Question Management (AI-powered generation with admin approval)
router.post('/questions/generate', generateQuestions); // Generate questions for a tag
router.get('/questions', getAllQuestions); // Get all questions with filters
router.put('/questions/:questionId/approve', approveQuestion); // Approve a single question
router.put('/questions/:questionId/reject', rejectQuestion); // Reject a single question
router.put('/questions/bulk-approve', bulkApproveQuestions); // Bulk approve questions
router.put('/questions/bulk-reject', bulkRejectQuestions); // Bulk reject questions

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

const {
    getDashboardStats,
    getStudents,
    getStudentPerformance
} = require('../controllers/analyticsController');

const {
    getPlans,
    createPlan,
    subscribe,
    getRevenue
} = require('../controllers/subscriptionController');

// Admin Analytics
router.get('/admin/stats/dashboard', protect, admin, getDashboardStats);
router.get('/admin/students', protect, admin, getStudents);
router.get('/admin/students/:id/performance', protect, admin, getStudentPerformance);
router.get('/admin/revenue', protect, admin, getRevenue);

// Plans & Subscription
router.get('/plans', getPlans); // Public
router.post('/admin/plans', protect, admin, createPlan);
router.post('/subscription/subscribe', protect, subscribe);

module.exports = router;

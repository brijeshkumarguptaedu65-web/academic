const express = require('express');
const router = express.Router();
const { authAdmin, registerAdmin, authStudent } = require('../controllers/authController');

router.post('/admin/login', authAdmin);
router.post('/admin/register', registerAdmin);
router.post('/student/login', authStudent);

module.exports = router;

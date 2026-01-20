const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth Admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
const authAdmin = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized as admin' });
        }
        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register Admin (Helper for setup)
// @route   POST /api/auth/admin/register
// @access  Public
const registerAdmin = async (req, res) => {
    const { email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        email,
        password: hashedPassword,
        role: 'admin',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth Student & get token
// @route   POST /api/auth/student/login
// @access  Public
const authStudent = async (req, res) => {
    const { username, class: classLevel } = req.body;

    // Simple auth: Find or Create
    let user = await User.findOne({ username, role: 'student' });

    if (!user) {
        user = await User.create({
            username,
            class: classLevel,
            role: 'student'
        });
    }

    res.json({
        token: generateToken(user._id),
        studentId: user._id,
    });
};

module.exports = { authAdmin, registerAdmin, authStudent };

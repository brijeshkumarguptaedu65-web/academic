const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// OTP expiry time: 15 minutes
const OTP_EXPIRY_MINUTES = 15;

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Helper to find user by email or mobile
const findUserByIdentifier = async (identifier) => {
    // Check if identifier is email or mobile
    const isEmail = identifier.includes('@');
    if (isEmail) {
        return await User.findOne({ email: identifier, role: 'user' });
    } else {
        return await User.findOne({ mobile: identifier, role: 'user' });
    }
};

/**
 * @desc    Register a new user
 * @route   POST /api/user/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        // Validate required fields
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                message: 'Please provide all required fields: name, email, mobile, password'
            });
        }

        // Check if user already exists with email
        const emailExists = await User.findOne({ email, role: 'user' });
        if (emailExists && emailExists.isVerified) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if user already exists with mobile
        const mobileExists = await User.findOne({ mobile, role: 'user' });
        if (mobileExists && mobileExists.isVerified) {
            return res.status(400).json({ message: 'User with this mobile number already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        let user;

        // If unverified user exists, update it
        if (emailExists && !emailExists.isVerified) {
            user = await User.findByIdAndUpdate(emailExists._id, {
                name,
                mobile,
                password: hashedPassword,
                otp,
                otpExpiry,
                otpType: 'registration',
            }, { new: true });
        } else {
            // Create new user
            user = await User.create({
                name,
                email,
                mobile,
                password: hashedPassword,
                role: 'user',
                isVerified: false,
                otp,
                otpExpiry,
                otpType: 'registration',
            });
        }

        // Send OTP email
        await sendOTPEmail(email, otp, 'registration');

        res.status(201).json({
            message: 'OTP sent to your email. Please verify to complete registration.',
            userId: user._id,
            email: user.email,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

/**
 * @desc    Verify OTP for registration
 * @route   POST /api/user/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Please provide email and OTP' });
        }

        const user = await User.findOne({
            email,
            role: 'user',
            otpType: 'registration'
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified' });
        }

        // Check OTP expiry
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Mark user as verified and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpType = undefined;
        await user.save();

        res.json({
            message: 'Email verified successfully. Registration complete!',
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error during OTP verification', error: error.message });
    }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/user/resend-otp
 * @access  Public
 */
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide email' });
        }

        const user = await User.findOne({ email, role: 'user' });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified && user.otpType !== 'password_reset') {
            return res.status(400).json({ message: 'User is already verified' });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        const otpType = user.otpType || 'registration';
        await sendOTPEmail(email, otp, otpType);

        res.json({
            message: 'OTP has been resent to your email.',
            email: user.email,
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server error while resending OTP', error: error.message });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/user/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Please provide email/mobile and password' });
        }

        const user = await findUserByIdentifier(identifier);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                message: 'Please verify your email first',
                needsVerification: true,
                email: user.email
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

/**
 * @desc    Forgot password - send OTP
 * @route   POST /api/user/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({ message: 'Please provide email or mobile number' });
        }

        const user = await findUserByIdentifier(identifier);

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email/mobile' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email first' });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.otpType = 'password_reset';
        await user.save();

        // Send OTP email
        await sendOTPEmail(user.email, otp, 'password_reset');

        res.json({
            message: 'Password reset OTP has been sent to your email.',
            email: user.email,
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during forgot password', error: error.message });
    }
};

/**
 * @desc    Reset password with OTP
 * @route   POST /api/user/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
        }

        const user = await User.findOne({
            email,
            role: 'user',
            otpType: 'password_reset'
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found or no password reset requested' });
        }

        // Check OTP expiry
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpType = undefined;
        await user.save();

        res.json({
            message: 'Password has been reset successfully. You can now login with your new password.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset', error: error.message });
    }
};

const { Class } = require('../models/Metadata');
const LearningOutcome = require('../models/LearningOutcome');

/**
 * @desc    Get list of all classes
 * @route   GET /api/user/classes
 * @access  Public
 */
const getClassList = async (req, res) => {
    try {
        const classes = await Class.find().sort({ level: 1 });
        res.json({
            success: true,
            count: classes.length,
            classes: classes.map(c => ({
                _id: c._id,
                name: c.name,
                level: c.level,
            })),
        });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ message: 'Server error fetching classes', error: error.message });
    }
};

/**
 * @desc    Get basic calculation learning outcomes for previous class
 * @route   GET /api/user/learning-outcomes/basic-calculation/:classLevel
 * @access  Public
 * @param   classLevel - The selected class level (will fetch for classLevel - 1)
 */
const getBasicCalculationLearningOutcomes = async (req, res) => {
    try {
        const selectedClassLevel = parseInt(req.params.classLevel);

        if (isNaN(selectedClassLevel) || selectedClassLevel < 2) {
            return res.status(400).json({
                message: 'Invalid class level. Must be 2 or higher to fetch previous class outcomes.'
            });
        }

        const previousClassLevel = selectedClassLevel - 1;

        // Find the class with previous level
        const previousClass = await Class.findOne({ level: previousClassLevel });

        if (!previousClass) {
            return res.status(404).json({
                message: `No class found for level ${previousClassLevel}`
            });
        }

        // Fetch learning outcomes of type BASIC_CALCULATION for the previous class
        const learningOutcomes = await LearningOutcome.find({
            classId: previousClass._id,
            type: 'BASIC_CALCULATION',
        }).populate('classId', 'name level');

        res.json({
            success: true,
            selectedClass: selectedClassLevel,
            fetchedFromClass: {
                level: previousClass.level,
                name: previousClass.name,
                _id: previousClass._id,
            },
            count: learningOutcomes.length,
            learningOutcomes: learningOutcomes.map(lo => ({
                _id: lo._id,
                text: lo.text,
                type: lo.type,
                topicName: lo.topicName,
                instruction: lo.instruction,
                contents: lo.contents,
                classId: lo.classId,
            })),
        });
    } catch (error) {
        console.error('Get basic calculation learning outcomes error:', error);
        res.status(500).json({ message: 'Server error fetching learning outcomes', error: error.message });
    }
};

const LearningOutcomeMapping = require('../models/LearningOutcomeMapping');

/**
 * @desc    Get previous class concepts with tags (from learning outcome mappings)
 * @route   GET /api/user/concepts-with-tags/:classLevel
 * @access  Public
 * @param   classLevel - The selected class level (will fetch for classLevel - 1)
 */
const getConceptsWithTags = async (req, res) => {
    try {
        const selectedClassLevel = parseInt(req.params.classLevel);

        if (isNaN(selectedClassLevel) || selectedClassLevel < 2) {
            return res.status(400).json({
                message: 'Invalid class level. Must be 2 or higher to fetch previous class concepts.'
            });
        }

        const previousClassLevel = selectedClassLevel - 1;

        // Find the class with previous level
        const previousClass = await Class.findOne({ level: previousClassLevel });

        if (!previousClass) {
            return res.status(404).json({
                message: `No class found for level ${previousClassLevel}`
            });
        }

        // Fetch learning outcomes of type BASIC_CALCULATION for the previous class
        const learningOutcomes = await LearningOutcome.find({
            classId: previousClass._id,
            type: 'BASIC_CALCULATION',
        });

        // Get learning outcome mappings for these outcomes
        const loIds = learningOutcomes.map(lo => lo._id);
        const mappings = await LearningOutcomeMapping.find({
            learningOutcomeId: { $in: loIds }
        }).populate('learningOutcomeId', 'text topicName type');

        // Transform into concepts with tags
        const conceptsWithTags = mappings.map(mapping => {
            const lo = mapping.learningOutcomeId;
            return {
                learningOutcomeId: lo._id,
                topicName: lo.topicName,
                text: lo.text,
                type: lo.type,
                tags: mapping.mappedLearningOutcomes
                    .filter(m => m.fromTag && m.toTag)
                    .map(m => ({
                        fromTag: m.fromTag,
                        toTag: m.toTag,
                        mappingType: m.mappingType,
                        relevanceScore: m.relevanceScore,
                        reason: m.reason,
                        mappedLearningOutcomeId: m.mappedLearningOutcomeId,
                    })),
                totalMappings: mapping.mappedLearningOutcomes.length
            };
        }).filter(c => c.tags.length > 0);

        res.json({
            success: true,
            selectedClass: selectedClassLevel,
            fetchedFromClass: {
                level: previousClass.level,
                name: previousClass.name,
                _id: previousClass._id,
            },
            totalConcepts: conceptsWithTags.length,
            concepts: conceptsWithTags
        });
    } catch (error) {
        console.error('Get concepts with tags error:', error);
        res.status(500).json({ message: 'Server error fetching concepts with tags', error: error.message });
    }
};

module.exports = {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    forgotPassword,
    resetPassword,
    getClassList,
    getBasicCalculationLearningOutcomes,
    getConceptsWithTags,
};

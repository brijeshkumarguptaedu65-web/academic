const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Common fields
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    role: { type: String, enum: ['admin', 'student', 'user'], required: true },

    // Admin-specific
    // (uses email, password, role='admin')

    // Student-specific
    username: { type: String, sparse: true },
    class: { type: Number },

    // Frontend User-specific
    name: { type: String },
    mobile: { type: String, unique: true, sparse: true },
    isVerified: { type: Boolean, default: false },

    // OTP fields (for verification & password reset)
    otp: { type: String },
    otpExpiry: { type: Date },
    otpType: { type: String, enum: ['registration', 'password_reset'] },

}, { timestamps: true });

// Index for faster lookups
userSchema.index({ email: 1, mobile: 1 });

module.exports = mongoose.model('User', userSchema);

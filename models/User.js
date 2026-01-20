const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true }, // For Admin
    password: { type: String }, // For Admin
    username: { type: String, sparse: true }, // For Student
    class: { type: Number }, // For Student
    role: { type: String, enum: ['admin', 'student'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

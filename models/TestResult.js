const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testType: { type: String, enum: ['ENTRY', 'QUIZ'], required: true },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number },
    result: { type: String, enum: ['PASS', 'FAIL', 'BORDERLINE'] },
    // specific to Quiz
    quizId: { type: String },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    answers: { type: Array }, // Store answers if needed
}, { timestamps: true });

module.exports = mongoose.model('TestResult', testResultSchema);

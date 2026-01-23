const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    classLevel: {
        type: Number,
        required: true
    },
    quizType: {
        type: String,
        enum: ['BASIC_CALCULATION', 'ADVANCED_ALGEBRA', 'THERMODYNAMICS'],
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    correctAnswers: {
        type: Number,
        required: true
    },
    incorrectAnswers: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    timeSpent: {
        type: Number, // in seconds
        required: true
    },
    passed: {
        type: Boolean,
        required: true
    },
    overall: {
        score: { type: Number, required: true },
        total: { type: Number, required: true },
        correct: { type: Number, required: true },
        percentage: { type: Number, required: true }
    },
    topicWise: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    conceptWise: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    questions: [{
        questionId: { type: Number, required: true },
        question: { type: String, required: true },
        options: [{ type: String }],
        selectedAnswer: { type: Number, required: true }, // 0-based index
        selectedOption: { type: String, required: true },
        correctAnswer: { type: Number, required: true }, // 0-based index
        correctOption: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        topicName: { type: String },
        concept: { type: String },
        tag: { type: String },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard']
        },
        timeSpent: { type: Number }, // seconds spent on this question
        latex: { type: Boolean, default: false }
    }],
    wrongConcepts: [{
        concept: { type: String, required: true },
        wrongCount: { type: Number, required: true },
        totalQuestions: { type: Number, required: true },
        percentage: { type: Number, required: true },
        questions: [{ type: Number }] // Question IDs that were wrong
    }],
    wrongTopics: [{
        topic: { type: String, required: true },
        wrongCount: { type: Number, required: true },
        totalQuestions: { type: Number, required: true },
        percentage: { type: Number, required: true },
        questions: [{ type: Number }] // Question IDs that were wrong
    }],
    remedialRecommendations: [{ type: String }]
}, { timestamps: true });

// Indexes for faster queries
quizAttemptSchema.index({ userId: 1, createdAt: -1 });
quizAttemptSchema.index({ userId: 1, classLevel: 1 });
quizAttemptSchema.index({ userId: 1, quizType: 1 });
quizAttemptSchema.index({ userId: 1, passed: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);

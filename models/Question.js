const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    // Question content
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    finalAnswer: {
        type: String,
        required: true
    },
    
    // Metadata
    classLevel: {
        type: Number,
        required: true
    },
    topicName: {
        type: String,
        required: true
    },
    concept: {
        type: String
    },
    tag: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    latex: {
        type: Boolean,
        default: false
    },
    
    // Approval status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    },
    
    // Generation metadata
    generatedAt: {
        type: Date,
        default: Date.now
    },
    generationBatch: {
        type: String // To track which batch this question was generated in
    },
    
    // Type information
    type: {
        type: String,
        enum: ['SUBJECT', 'BASIC_CALCULATION'],
        default: 'SUBJECT'
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        default: null
    }
}, { timestamps: true });

// Indexes for efficient querying
questionSchema.index({ tag: 1, classLevel: 1 });
questionSchema.index({ topicName: 1, classLevel: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ classLevel: 1, status: 1 });
questionSchema.index({ question: 1 }); // For duplicate detection
questionSchema.index({ type: 1, subjectId: 1 });

// Compound index for unique question detection
questionSchema.index({ question: 1, classLevel: 1, tag: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Question', questionSchema);

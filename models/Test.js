const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: { type: String, required: true },
    classIds: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    }, // Can be array of class IDs or "ALL"
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    totalQuestions: { type: Number, required: true },
    instructions: { type: String },
    passingPercentage: { type: Number, required: true },
    difficulty: {
        easy: { type: Number, required: true },
        medium: { type: Number, required: true },
        hard: { type: Number, required: true }
    },
    bloomsTaxonomy: [{
        type: String,
        enum: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']
    }],
    status: {
        type: String,
        enum: ['DRAFT', 'PUBLISHED'],
        default: 'DRAFT'
    }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);

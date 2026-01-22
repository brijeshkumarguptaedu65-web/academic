const mongoose = require('mongoose');

const curriculumMappingSchema = new mongoose.Schema({
    learningOutcomeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningOutcome',
        required: true,
        unique: true
    },
    mappedChapters: [{
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chapter',
            required: true
        },
        relevanceScore: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },
        reason: {
            type: String,
            required: true
        }
    }],
    lastCalculatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster lookups
curriculumMappingSchema.index({ learningOutcomeId: 1 });

module.exports = mongoose.model('CurriculumMapping', curriculumMappingSchema);

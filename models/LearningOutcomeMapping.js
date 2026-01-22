const mongoose = require('mongoose');

const learningOutcomeMappingSchema = new mongoose.Schema({
    learningOutcomeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningOutcome',
        required: true
    },
    mappedLearningOutcomes: [{
        mappedLearningOutcomeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LearningOutcome',
            required: true
        },
        mappingType: {
            type: String,
            enum: ['PREREQUISITE', 'PROGRESSION', 'RELATED', 'ADVANCED'],
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
        },
        fromTag: {
            type: String,
            required: false // Tag from current learning outcome
        },
        toTag: {
            type: String,
            required: false // Tag from mapped learning outcome
        }
    }],
    lastCalculatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster lookups
learningOutcomeMappingSchema.index({ learningOutcomeId: 1 });

module.exports = mongoose.model('LearningOutcomeMapping', learningOutcomeMappingSchema);

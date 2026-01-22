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

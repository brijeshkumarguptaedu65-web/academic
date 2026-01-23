const mongoose = require('mongoose');

const topicTagMappingSchema = new mongoose.Schema({
    topicName: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['SUBJECT', 'BASIC_CALCULATION'],
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: false // Only for SUBJECT type
    },
    tagMappings: [{
        fromTag: {
            tag: { type: String, required: true },
            learningOutcomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningOutcome', required: true },
            learningOutcomeText: { type: String, required: true },
            classLevel: { type: Number, required: true },
            className: { type: String, required: true }
        },
        toTag: {
            tag: { type: String, required: true },
            learningOutcomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningOutcome', required: true },
            learningOutcomeText: { type: String, required: true },
            classLevel: { type: Number, required: true },
            className: { type: String, required: true }
        },
        relevanceScore: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },
        relation: {
            type: String,
            enum: ['same', 'progression', 'prerequisite', 'related', 'unrelated'],
            required: true
        },
        reason: {
            type: String,
            required: true
        }
    }],
    tagChains: [{
        tag: { type: String, required: true },
        classLevel: { type: Number, required: true },
        className: { type: String, required: true },
        learningOutcomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningOutcome', required: true },
        progressions: [{
            toTag: { type: String, required: true },
            toClassLevel: { type: Number, required: true },
            toClassName: { type: String, required: true },
            toLearningOutcomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningOutcome', required: true },
            relevanceScore: { type: Number, required: true, min: 0, max: 1 },
            relation: { type: String, enum: ['same', 'progression', 'prerequisite', 'related', 'unrelated'], required: true },
            reason: { type: String, required: true }
        }]
    }],
    totalLearningOutcomes: { type: Number, default: 0 },
    totalTags: { type: Number, default: 0 },
    totalMappings: { type: Number, default: 0 },
    lastCalculatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster lookups
topicTagMappingSchema.index({ topicName: 1, type: 1, subjectId: 1 });

module.exports = mongoose.model('TopicTagMapping', topicTagMappingSchema);

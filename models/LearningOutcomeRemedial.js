const mongoose = require('mongoose');

const learningOutcomeRemedialSchema = new mongoose.Schema({
    learningOutcomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningOutcome', required: true },
    items: [{
        type: { type: String, enum: ['VIDEO', 'PDF', 'LINK'], required: true },
        title: { type: String, required: true },
        content: { type: String, required: true } // URL or content string
    }]
}, { timestamps: true });

module.exports = mongoose.model('LearningOutcomeRemedial', learningOutcomeRemedialSchema);

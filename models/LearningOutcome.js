const mongoose = require('mongoose');

const learningOutcomeSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['SUBJECT', 'BASIC_CALCULATION'], 
        required: true 
    },
    classId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true 
    },
    subjectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject',
        required: function() {
            return this.type === 'SUBJECT';
        }
    },
    topicName: { type: String }, // Used for curriculum mapping
    instruction: { type: String }, // Additional guidance
    contents: [{
        type: { type: String, enum: ['PDF', 'GBP_PDF', 'TEXT'], required: true },
        title: { type: String, required: true },
        url: { type: String }, // For PDF and GBP_PDF (file URL)
        text: { type: String }, // For TEXT type or extracted PDF content
    }]
}, { timestamps: true });

module.exports = mongoose.model('LearningOutcome', learningOutcomeSchema);

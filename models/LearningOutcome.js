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
    instruction: { type: String } // Additional guidance
}, { timestamps: true });

module.exports = mongoose.model('LearningOutcome', learningOutcomeSchema);

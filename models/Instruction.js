const mongoose = require('mongoose');

const instructionSchema = new mongoose.Schema({
    classId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true 
    },
    subjectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject', 
        required: true 
    },
    instructions: { type: String, required: true }
}, { timestamps: true });

// Ensure unique combination of classId and subjectId
instructionSchema.index({ classId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('Instruction', instructionSchema);

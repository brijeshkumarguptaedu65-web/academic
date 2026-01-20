const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    chapterName: { type: String, required: true },
    topicName: { type: String, required: true }, // Linking field for logic
    instructions: {
        totalQuestions: Number,
        timeLimitMinutes: Number,
        passingMarks: Number,
        difficultySplit: {
            easy: Number,
            medium: Number,
            hard: Number
        }
    },
    pdfUrl: { type: String }, // URL to uploaded PDF
    contents: [{
        type: { type: String, enum: ['PDF', 'GBP_PDF', 'TEXT'], required: true },
        title: { type: String, required: true },
        url: { type: String }, // For PDF and GBP_PDF (file URL)
        text: { type: String }, // For TEXT type or extracted PDF content
    }]
}, { timestamps: true });

module.exports = mongoose.model('Chapter', chapterSchema);

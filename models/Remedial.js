const mongoose = require('mongoose');

const remedialSchema = new mongoose.Schema({
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    items: [{
        type: { type: String, enum: ['VIDEO', 'PDF', 'LINK'], required: true },
        title: { type: String, required: true },
        content: { type: String, required: true } // URL or content string
    }]
}, { timestamps: true });

module.exports = mongoose.model('Remedial', remedialSchema);

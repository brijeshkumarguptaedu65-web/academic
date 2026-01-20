const mongoose = require('mongoose');

const remedialSchema = new mongoose.Schema({
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    items: [{
        type: { type: String, enum: ['video', 'pdf'], required: true },
        contentUrl: { type: String, required: true },
        description: { type: String }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Remedial', remedialSchema);

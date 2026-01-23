const mongoose = require('mongoose');

const conceptGraphSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    type: { type: String, enum: ['SUBJECT', 'BASIC_CALCULATION'], required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    graphType: { type: String, default: 'concept_wise_vertical_learning_graph' },
    conceptGraphs: [{
        concept: { type: String, required: true },
        nodes: [{
            id: { type: String, required: true },
            class: { type: Number, required: true },
            tag: { type: String, required: true }
        }],
        edges: [{
            from: { type: String, required: true },
            to: { type: String, required: true }
        }]
    }],
    totalNodes: { type: Number, default: 0 },
    totalEdges: { type: Number, default: 0 },
    totalConcepts: { type: Number, default: 0 },
    lastCalculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast lookups
conceptGraphSchema.index({ topic: 1, type: 1, subjectId: 1 }, { unique: true });
conceptGraphSchema.index({ subject: 1, topic: 1 });

module.exports = mongoose.model('ConceptGraph', conceptGraphSchema);

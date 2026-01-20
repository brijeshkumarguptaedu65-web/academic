const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'basic-test'
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Store JSON object
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);

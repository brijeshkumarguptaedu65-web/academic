const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    level: { type: Number, required: true, unique: true },
});

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
});

const topicSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
});

const Class = mongoose.model('Class', classSchema);
const Subject = mongoose.model('Subject', subjectSchema);
const Topic = mongoose.model('Topic', topicSchema);

module.exports = { Class, Subject, Topic };

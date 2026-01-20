const Chapter = require('../models/Chapter');
const Remedial = require('../models/Remedial');

// --- 2.5 Chapter Management ---
const getChapters = async (req, res) => {
    try {
        const { classId, subjectId } = req.query;
        const query = {};
        if (classId) query.classId = classId;
        if (subjectId) query.subjectId = subjectId;

        const chapters = await Chapter.find(query).populate('classId', 'name level').populate('subjectId', 'name');
        res.json(chapters);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createChapter = async (req, res) => {
    try {
        const { classId, subjectId, chapterName, topicName, instructions } = req.body;
        const chapter = await Chapter.create({
            classId,
            subjectId,
            chapterName,
            topicName,
            instructions
        });
        res.status(201).json(chapter);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(chapter);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const uploadChapterPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        // In a real app, upload to S3/Cloudinary and get URL.
        // Here we are using memory storage or basic setup, but for "Upload PDF logic" 
        // usually we'd parse it or store it.
        // The prompt says "Upload reference PDFs (NCERT/Goyal) for AI parsing."
        // We will just simulate storing the URL (or mock it since we don't have S3 setup).
        // If using diskStorage we could return local path.
        // Assuming we might have AI parsing logic later, but for now just saving reference.

        // For MVP, enable disk storage or just mock the URL return
        // Since we used memoryStorage in prompt, we have the buffer.

        // Simulating a stored URL:
        const fakeUrl = `https://storage.example.com/${req.file.originalname}`;

        const chapter = await Chapter.findByIdAndUpdate(req.params.id, { pdfUrl: fakeUrl }, { new: true });

        res.json({ message: 'PDF uploaded successfully', pdfUrl: fakeUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- 2.6 Remedial Management ---
const getRemedials = async (req, res) => {
    try {
        const remedials = await Remedial.findOne({ chapterId: req.params.chapterId });
        res.json(remedials ? remedials.items : []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

const addRemedial = async (req, res) => {
    try {
        const { items } = req.body; // array of items
        const chapterId = req.params.chapterId;

        let remedial = await Remedial.findOne({ chapterId });
        if (remedial) {
            remedial.items.push(...items);
            await remedial.save();
        } else {
            remedial = await Remedial.create({ chapterId, items });
        }
        res.json(remedial.items);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const deleteRemedialItem = async (req, res) => {
    try {
        const { remedialId } = req.params;
        // Finding the parent document that contains this item
        const remedialDoc = await Remedial.findOne({ "items._id": remedialId });

        if (remedialDoc) {
            remedialDoc.items = remedialDoc.items.filter(item => item._id.toString() !== remedialId);
            await remedialDoc.save();
            res.json({ message: "Remedial item removed" });
        } else {
            res.status(404).json({ message: "Item not found" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


module.exports = {
    getChapters,
    createChapter,
    updateChapter,
    uploadChapterPdf,
    getRemedials,
    addRemedial,
    deleteRemedialItem
};

const Chapter = require('../models/Chapter');
const Remedial = require('../models/Remedial');

// --- 2.5 Chapter Management ---
const getChapters = async (req, res) => {
    try {
        const { classId, subjectId } = req.query;
        const query = {};
        if (classId) query.classId = classId;
        if (subjectId) query.subjectId = subjectId;

        const chapters = await Chapter.find(query)
            .populate('classId', 'name level')
            .populate('subjectId', 'name');

        // Add remedials to each chapter
        const chaptersWithRemedials = await Promise.all(
            chapters.map(async (chapter) => {
                const chapterObj = chapter.toObject();
                const remedial = await Remedial.findOne({ chapterId: chapter._id });
                chapterObj.remedials = remedial ? remedial.items : [];
                chapterObj.contents = chapterObj.contents || [];
                // Add id field for compatibility
                chapterObj.id = chapterObj._id;
                // Add classLevel and subject fields for compatibility
                if (chapterObj.classId && typeof chapterObj.classId === 'object') {
                    chapterObj.classLevel = chapterObj.classId.level;
                }
                if (chapterObj.subjectId && typeof chapterObj.subjectId === 'object') {
                    chapterObj.subject = chapterObj.subjectId.name;
                }
                // Add name field as alias for chapterName
                chapterObj.name = chapterObj.chapterName;
                return chapterObj;
            })
        );

        res.json(chaptersWithRemedials);
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
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }
        res.json(chapter);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndDelete(req.params.id);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }
        res.json({ message: 'Chapter removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addChapterContent = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const { type, title, text } = req.body;
        
        if (!type || !title) {
            return res.status(400).json({ message: 'type and title are required' });
        }

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Validate type
        if (!['PDF', 'GBP_PDF', 'TEXT'].includes(type)) {
            return res.status(400).json({ message: 'type must be PDF, GBP_PDF, or TEXT' });
        }

        // For PDF types, require file upload
        if ((type === 'PDF' || type === 'GBP_PDF') && !req.file) {
            return res.status(400).json({ message: 'file is required for PDF types' });
        }

        // For TEXT type, require text content
        if (type === 'TEXT' && !text) {
            return res.status(400).json({ message: 'text is required for TEXT type' });
        }

        let url = null;
        if (req.file) {
            // In production, upload to S3/Cloudinary and get URL
            // For now, simulate URL
            url = `https://storage.example.com/${req.file.originalname}`;
        }

        const contentItem = {
            type,
            title,
            url: url || req.body.url,
            text: type === 'TEXT' ? text : undefined
        };

        chapter.contents.push(contentItem);
        await chapter.save();

        const addedContent = chapter.contents[chapter.contents.length - 1];
        res.status(201).json(addedContent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteChapterContent = async (req, res) => {
    try {
        const { chapterId, contentId } = req.params;
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        chapter.contents = chapter.contents.filter(
            content => content._id.toString() !== contentId
        );
        await chapter.save();

        res.json({ message: 'Content removed' });
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
        const { type, title, content } = req.body;
        const chapterId = req.params.chapterId;

        if (!type || !title || !content) {
            return res.status(400).json({ message: 'type, title, and content are required' });
        }

        let remedial = await Remedial.findOne({ chapterId });
        const newItem = { type, title, content };
        
        if (remedial) {
            remedial.items.push(newItem);
            await remedial.save();
        } else {
            remedial = await Remedial.create({ chapterId, items: [newItem] });
        }
        
        const addedItem = remedial.items[remedial.items.length - 1];
        res.status(201).json(addedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const deleteRemedialItem = async (req, res) => {
    try {
        const { chapterId, remedialId } = req.params;
        
        // First try to find by chapterId and remedialId
        let remedialDoc = await Remedial.findOne({ chapterId, "items._id": remedialId });
        
        // If not found, try finding by remedialId only (alternative endpoint)
        if (!remedialDoc) {
            remedialDoc = await Remedial.findOne({ "items._id": remedialId });
        }

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
    deleteChapter,
    addChapterContent,
    deleteChapterContent,
    getRemedials,
    addRemedial,
    deleteRemedialItem
};

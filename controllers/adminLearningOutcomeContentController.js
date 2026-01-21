const LearningOutcome = require('../models/LearningOutcome');
const LearningOutcomeRemedial = require('../models/LearningOutcomeRemedial');
const pdfParse = require('pdf-parse');

// --- Learning Outcome Content Management ---
const addLearningOutcomeContent = async (req, res) => {
    try {
        const { learningOutcomeId } = req.params;
        const { type, title, text, url: manualUrl } = req.body;
        
        if (!type || !title) {
            return res.status(400).json({ message: 'type and title are required' });
        }

        const learningOutcome = await LearningOutcome.findById(learningOutcomeId);
        if (!learningOutcome) {
            return res.status(404).json({ message: 'Learning outcome not found' });
        }

        // Validate type
        if (!['PDF', 'GBP_PDF', 'TEXT'].includes(type)) {
            return res.status(400).json({ message: 'type must be PDF, GBP_PDF, or TEXT' });
        }

        // For TEXT type, require text content
        if (type === 'TEXT' && !text) {
            return res.status(400).json({ message: 'text is required for TEXT type' });
        }

        // For PDF types: allow either file upload OR manual URL entry
        if ((type === 'PDF' || type === 'GBP_PDF') && !req.file && !manualUrl) {
            return res.status(400).json({ 
                message: 'For PDF types, either file upload or URL is required' 
            });
        }

        let url = null;
        let extractedText = null;
        let finalText = null;

        // Handle file upload (if provided)
        if (req.file) {
            // In production, upload to S3/Cloudinary and get URL
            // For now, simulate URL
            url = `https://storage.example.com/${req.file.originalname}`;

            // Extract text content from PDF
            if (type === 'PDF' || type === 'GBP_PDF') {
                try {
                    const pdfData = await pdfParse(req.file.buffer);
                    extractedText = pdfData.text;
                    console.log(`Extracted ${extractedText.length} characters from PDF: ${req.file.originalname}`);
                } catch (pdfError) {
                    console.error('Error parsing PDF:', pdfError);
                    // Continue even if PDF parsing fails - we still save the URL
                    extractedText = null;
                }
            }
        } else {
            // Manual entry: use provided URL
            url = manualUrl;
        }

        // Determine final text content:
        // 1. For TEXT type: use provided text
        // 2. For PDF types: use extracted text (if file uploaded) OR manually provided text (if manual entry)
        if (type === 'TEXT') {
            finalText = text;
        } else {
            // PDF/GBP_PDF: prefer extracted text, fallback to manually provided text
            finalText = extractedText || text || undefined;
        }

        const contentItem = {
            type,
            title,
            url: url || undefined,
            text: finalText
        };

        learningOutcome.contents.push(contentItem);
        await learningOutcome.save();

        const addedContent = learningOutcome.contents[learningOutcome.contents.length - 1];
        res.status(201).json({
            ...addedContent.toObject(),
            extractedTextLength: extractedText ? extractedText.length : undefined,
            isManualEntry: !req.file && !!manualUrl
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteLearningOutcomeContent = async (req, res) => {
    try {
        const { learningOutcomeId, contentId } = req.params;
        const learningOutcome = await LearningOutcome.findById(learningOutcomeId);
        if (!learningOutcome) {
            return res.status(404).json({ message: 'Learning outcome not found' });
        }

        learningOutcome.contents = learningOutcome.contents.filter(
            content => content._id.toString() !== contentId
        );
        await learningOutcome.save();

        res.json({ message: 'Content removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getLearningOutcomeContent = async (req, res) => {
    try {
        const { learningOutcomeId } = req.params;
        const learningOutcome = await LearningOutcome.findById(learningOutcomeId)
            .populate('classId', 'name level')
            .populate('subjectId', 'name');
        
        if (!learningOutcome) {
            return res.status(404).json({ message: 'Learning outcome not found' });
        }

        res.json({
            learningOutcome: {
                id: learningOutcome._id,
                text: learningOutcome.text,
                type: learningOutcome.type,
                topicName: learningOutcome.topicName
            },
            contents: learningOutcome.contents || []
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Learning Outcome Remedial Management ---
const getLearningOutcomeRemedials = async (req, res) => {
    try {
        const remedials = await LearningOutcomeRemedial.findOne({ 
            learningOutcomeId: req.params.learningOutcomeId 
        });
        res.json(remedials ? remedials.items : []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addLearningOutcomeRemedial = async (req, res) => {
    try {
        const { type, title, content } = req.body;
        const learningOutcomeId = req.params.learningOutcomeId;

        if (!type || !title || !content) {
            return res.status(400).json({ message: 'type, title, and content are required' });
        }

        // Validate type
        if (!['VIDEO', 'PDF', 'LINK'].includes(type)) {
            return res.status(400).json({ message: 'type must be VIDEO, PDF, or LINK' });
        }

        let remedial = await LearningOutcomeRemedial.findOne({ learningOutcomeId });
        const newItem = { type, title, content };
        
        if (remedial) {
            remedial.items.push(newItem);
            await remedial.save();
        } else {
            remedial = await LearningOutcomeRemedial.create({ learningOutcomeId, items: [newItem] });
        }
        
        const addedItem = remedial.items[remedial.items.length - 1];
        res.status(201).json(addedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteLearningOutcomeRemedialItem = async (req, res) => {
    try {
        const { learningOutcomeId, remedialId } = req.params;
        
        // First try to find by learningOutcomeId and remedialId
        let remedialDoc = await LearningOutcomeRemedial.findOne({ 
            learningOutcomeId, 
            "items._id": remedialId 
        });
        
        // If not found, try finding by remedialId only (alternative endpoint)
        if (!remedialDoc) {
            remedialDoc = await LearningOutcomeRemedial.findOne({ "items._id": remedialId });
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
};

module.exports = {
    addLearningOutcomeContent,
    deleteLearningOutcomeContent,
    getLearningOutcomeContent,
    getLearningOutcomeRemedials,
    addLearningOutcomeRemedial,
    deleteLearningOutcomeRemedialItem
};

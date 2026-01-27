const Question = require('../models/Question');
const LearningOutcome = require('../models/LearningOutcome');
const { Class, Subject } = require('../models/Metadata');

// Helper function to sanitize JSON from LLM
function sanitizeJsonFromLLM(raw) {
    let text = raw.trim();
    if (text.startsWith("json\n") || text.startsWith("json ")) {
        text = text.replace(/^json[\s\n]+/, '');
    }
    if (text.startsWith("```")) {
        const firstNewline = text.indexOf("\n");
        if (firstNewline !== -1) {
            text = text.slice(firstNewline + 1);
        }
        const lastFence = text.lastIndexOf("```");
        if (lastFence !== -1) {
            text = text.slice(0, lastFence);
        }
        text = text.trim();
    }
    text = text.replace(/```[\s]*$/g, '').trim();
    return text;
}

// Call Azure OpenAI API
async function callAzureOpenAI(messages, azureConfig, temperature = 0.3, maxTokens = 2000) {
    const axios = require('axios');
    if (!azureConfig || !azureConfig.endpoint || !azureConfig.apiKey || !azureConfig.deployment) {
        throw new Error('Azure OpenAI configuration is required (endpoint, apiKey, deployment)');
    }
    const apiVersion = azureConfig.apiVersion || '2024-02-01';
    try {
        const response = await axios.post(
            `${azureConfig.endpoint}/openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${apiVersion}`,
            { messages, temperature, max_tokens: maxTokens },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': azureConfig.apiKey
                },
                timeout: 60000
            }
        );
        return response.data.choices[0].message.content?.trim() || "";
    } catch (error) {
        console.error('Azure OpenAI API error:', error.response?.data || error.message);
        throw new Error(`Azure OpenAI API error: ${error.message}`);
    }
}

// Normalize number strings for comparison
function normalizeNumber(str) {
    if (!str) return '';
    // Remove LaTeX markers, dollar signs, spaces
    let normalized = String(str).trim()
        .replace(/^\$+|\$+$/g, '')
        .replace(/\\+/g, '')
        .replace(/\s+/g, '')
        .toLowerCase();
    // Remove trailing zeros and decimal point if whole number
    if (normalized.includes('.')) {
        normalized = normalized.replace(/\.?0+$/, '');
    }
    // Remove commas (thousand separators)
    normalized = normalized.replace(/,/g, '');
    return normalized;
}

// Verify mathematical answer - STRICT verification
function verifyMathematicalAnswer(question) {
    if (!question.finalAnswer) {
        return { isValid: false, error: 'Missing finalAnswer field' };
    }
    const correctIndex = question.correctAnswer;
    if (typeof correctIndex !== 'number' || isNaN(correctIndex) || 
        correctIndex < 0 || correctIndex >= question.options.length) {
        return { isValid: false, error: `Invalid correctAnswer index: ${correctIndex}` };
    }
    if (!Array.isArray(question.options) || question.options.length !== 4) {
        return { isValid: false, error: 'Must have exactly 4 options' };
    }
    // Check for duplicate options
    const normalizedOptions = question.options.map(opt => normalizeNumber(opt));
    const uniqueOptions = new Set(normalizedOptions);
    if (uniqueOptions.size !== normalizedOptions.length) {
        return { isValid: false, error: 'Duplicate options found in question' };
    }
    const finalAnswer = normalizeNumber(question.finalAnswer);
    const correctOption = normalizeNumber(question.options[correctIndex]);
    // STRICT matching - must be exact match (after normalization)
    if (finalAnswer !== correctOption) {
        return {
            isValid: false,
            error: `Answer mismatch: finalAnswer="${finalAnswer}" vs option[${correctIndex}]="${correctOption}"`
        };
    }
    return { isValid: true };
}

// Batch verification function
async function verifyAndCorrectQuestionsBatch(questions, azureConfig) {
    try {
        const verificationPrompt = `You are a STRICT mathematics verification expert. Verify these ${questions.length} MCQ questions.

CRITICAL RULES - FOLLOW EXACTLY:
1. For EACH question, solve it step-by-step and calculate the EXACT CORRECT answer
2. Normalize your calculated answer (remove spaces, commas, trailing zeros, LaTeX markers)
3. Check if your calculated answer EXISTS EXACTLY in the options array (after normalization)
4. If calculated answer is NOT in options → question is INVALID (reject it, set isCorrect: false)
5. If calculated answer IS in options → verify correctAnswer index points to it EXACTLY
6. If correctAnswer index is WRONG → you MUST provide a FULL corrected question with ALL 4 options and correct correctAnswer index
7. ALL options must be UNIQUE - if duplicates exist, mark as INVALID
8. finalAnswer MUST match options[correctAnswer] EXACTLY (after normalization)

IMPORTANT:
- Compare answers after normalization (remove spaces, commas, trailing zeros, $ signs)
- Example: "1,234" = "1234" = "1234.0" = "1234.00" (all same)
- Example: "1/2" = "0.5" = ".5" (all same)
- Be STRICT - if answer doesn't match exactly, reject the question

Return ONLY a JSON object:
{
  "results": [
    {
      "index": 0,
      "isCorrect": true/false,
      "calculatedAnswer": "the exact normalized answer you calculated",
      "correctedQuestion": { 
        "id": number,
        "question": string,
        "options": [string, string, string, string],  // ALL 4 options, NO duplicates
        "correctAnswer": number,  // Index where calculated answer is located
        "finalAnswer": string,    // Must match options[correctAnswer] exactly
        "difficulty": string,
        "topicName": string,
        "concept": string,
        "tag": string,
        "latex": boolean
      },
      "reason": "why invalid (if isCorrect: false)"
    }
  ]
}
Questions to verify:
${JSON.stringify(questions, null, 2)}`;
        const response = await callAzureOpenAI(
            [
                {
                    role: "system",
                    content: "You are a strict mathematics verification expert. You MUST: (1) Solve each problem step-by-step, (2) Calculate the EXACT correct answer, (3) Normalize the answer (remove spaces, commas, trailing zeros), (4) Verify the normalized correct answer EXISTS EXACTLY in the options array, (5) If correct answer is missing from options → mark as INVALID (isCorrect: false), (6) If correct answer exists but at wrong index → provide FULL corrected question with all 4 unique options and correct correctAnswer index, (7) Ensure finalAnswer matches options[correctAnswer] exactly after normalization. NEVER accept a question where the mathematically correct answer is not in the options. Return only valid JSON."
                },
                { role: "user", content: verificationPrompt }
            ],
            azureConfig, 0.1, 8000
        );
        const cleaned = sanitizeJsonFromLLM(response);
        const parsed = JSON.parse(cleaned);
        const valid = [];
        const corrected = [];
        const invalid = [];
        if (parsed.results && Array.isArray(parsed.results)) {
            parsed.results.forEach((result, idx) => {
                const originalQuestion = questions[result.index !== undefined ? result.index : idx];
                if (result.isCorrect === true) {
                    const clientCheck = verifyMathematicalAnswer(originalQuestion);
                    if (clientCheck.isValid) {
                        valid.push(originalQuestion);
                    } else {
                        invalid.push({ question: originalQuestion, reason: `Client verification failed: ${clientCheck.error}` });
                    }
                } else if (result.correctedQuestion) {
                    const correctedVerification = verifyMathematicalAnswer(result.correctedQuestion);
                    if (correctedVerification.isValid) {
                        corrected.push(result.correctedQuestion);
                    } else {
                        invalid.push({ question: originalQuestion, reason: `Correction also invalid: ${correctedVerification.error}` });
                    }
                } else {
                    const reason = result.reason || 
                                (result.calculatedAnswer ? `Correct answer "${result.calculatedAnswer}" not in options` : 'Verification failed');
                    invalid.push({ question: originalQuestion, reason });
                }
            });
        } else {
            questions.forEach(q => {
                const verification = verifyMathematicalAnswer(q);
                if (verification.isValid) {
                    valid.push(q);
                } else {
                    invalid.push({ question: q, reason: verification.error });
                }
            });
        }
        return { valid, corrected, invalid };
    } catch (error) {
        console.warn(`AI batch verification failed, using client-side check:`, error.message);
        const valid = [];
        const invalid = [];
        questions.forEach(q => {
            const verification = verifyMathematicalAnswer(q);
            if (verification.isValid) {
                valid.push(q);
            } else {
                invalid.push({ question: q, reason: verification.error });
            }
        });
        return { valid, corrected: [], invalid };
    }
}

const generateQuestions = async (req, res) => {
    try {
        const { tag, classLevel, topicName, concept, type = 'SUBJECT', subjectId = null, azureConfig } = req.body;
        if (!tag || !classLevel || !topicName) {
            return res.status(400).json({ success: false, message: 'tag, classLevel, and topicName are required' });
        }
        if (!azureConfig || !azureConfig.endpoint || !azureConfig.apiKey || !azureConfig.deployment) {
            return res.status(400).json({ success: false, message: 'Azure OpenAI configuration is required. Please provide: endpoint, apiKey, and deployment' });
        }
        const classData = await Class.findOne({ level: classLevel });
        if (!classData) {
            return res.status(404).json({ success: false, message: `Class ${classLevel} not found` });
        }
        // Get ALL existing questions for this tag+class+topic to prevent duplicates
        const existingQuestions = await Question.find({ 
            tag, 
            classLevel, 
            topicName 
        }).select('question').lean();
        // Normalize existing questions for better duplicate detection
        const existingQuestionTexts = existingQuestions.map(q => {
            const normalized = q.question.toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.,!?;:]/g, '')
                .trim();
            return normalized;
        });
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const prompt = `Generate exactly 10 MCQ questions for Class ${classLevel} mathematics.
TAG: "${tag}"
TOPIC: "${topicName}"
${concept ? `CONCEPT: "${concept}"` : 'CONCEPT: Not specified'}
CLASS LEVEL: ${classLevel}
For EACH question:
1. CREATE THE PROBLEM - Write a clear mathematical question
2. SOLVE THE PROBLEM - Calculate the EXACT correct answer
3. CREATE 4 OPTIONS - Place correct answer + 3 plausible wrong answers
4. SHUFFLE OPTIONS - Randomize order (do NOT always put correct answer first)
5. FIND CORRECT INDEX - Set correctAnswer to the index of correct option
6. VERIFY - Ensure options[correctAnswer] matches your calculated answer
CRITICAL REQUIREMENTS:
1. Each question MUST be UNIQUE (no duplicates)
2. All 4 options MUST be UNIQUE (no duplicate options within a question)
3. The correct answer MUST exist in the options array
4. Distribute correct answers across positions 0, 1, 2, 3 (not all at position 0)
5. Mix difficulty levels: ~3 easy, ~4 medium, ~3 hard
6. Use LaTeX for mathematical expressions when needed
EXISTING QUESTIONS TO AVOID:
${existingQuestionTexts.length > 0 ? existingQuestionTexts.slice(0, 5).map((q, i) => `${i + 1}. ${q.substring(0, 100)}...`).join('\n') : 'None - this is the first batch'}
JSON FORMAT:
{
  "questions": [
    {
      "id": number,
      "question": string,
      "options": [string, string, string, string],
      "correctAnswer": number (0-3),
      "finalAnswer": string,
      "difficulty": "easy" | "medium" | "hard",
      "topicName": "${topicName}",
      "concept": "${concept || 'N/A'}",
      "tag": "${tag}",
      "latex": boolean
    }
  ]
}
Return ONLY the JSON - no explanations, no preamble.`;
        const content = await callAzureOpenAI(
            [
                { role: "system", content: "You are an expert mathematics educator. You MUST solve each problem step-by-step before creating the question. CRITICAL: (1) Calculate correct answer first, (2) Place it in options array, (3) Shuffle options randomly, (4) Set correctAnswer to the index of correct option, (5) Ensure finalAnswer matches options[correctAnswer] exactly. Return ONLY valid JSON." },
                { role: "user", content: prompt }
            ],
            azureConfig, 0.5, 8000
        );
        if (!content || content.trim().length === 0) {
            throw new Error('Empty response from AI');
        }
        const cleaned = sanitizeJsonFromLLM(content);
        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            const questionsArrayMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
            if (questionsArrayMatch) {
                const questionMatches = questionsArrayMatch[1].match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || [];
                const extractedQuestions = questionMatches.map(q => {
                    try { return JSON.parse(q); } catch (e) { return null; }
                }).filter(q => q !== null);
                if (extractedQuestions.length > 0) {
                    parsed = { questions: extractedQuestions };
                } else {
                    throw new Error(`Could not parse JSON: ${parseErr.message}`);
                }
            } else {
                throw new Error(`JSON parse error: ${parseErr.message}`);
            }
        }
        const questionsArray = parsed.questions || [];
        if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
            return res.status(400).json({ success: false, message: 'No questions generated by AI' });
        }
        // Filter and validate questions
        const structuredQuestions = questionsArray.filter((q, idx) => {
            // Basic structure validation
            if (!q || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
                console.log(`Question ${idx}: Invalid structure`);
                return false;
            }
            // Check for duplicate options (normalized)
            const normalizedOptions = q.options.map(opt => normalizeNumber(String(opt)));
            const uniqueOptions = new Set(normalizedOptions);
            if (uniqueOptions.size !== normalizedOptions.length) {
                console.log(`Question ${idx}: Duplicate options detected`);
                return false;
            }
            // Normalize question text for duplicate detection
            const questionText = String(q.question)
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.,!?;:]/g, '')
                .trim();
            // Check against existing questions
            if (existingQuestionTexts.includes(questionText)) {
                console.log(`Question ${idx}: Duplicate question detected`);
                return false;
            }
            // Validate correctAnswer index
            if (typeof q.correctAnswer !== 'number' || 
                q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
                console.log(`Question ${idx}: Invalid correctAnswer index`);
                return false;
            }
            // Validate finalAnswer exists
            if (!q.finalAnswer) {
                console.log(`Question ${idx}: Missing finalAnswer`);
                return false;
            }
            return true;
        });
        if (structuredQuestions.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid questions after filtering' });
        }
        // Verify answers using AI + client-side validation
        const verificationResult = await verifyAndCorrectQuestionsBatch(structuredQuestions, azureConfig);
        const questionsToSave = [];
        
        // Process valid questions - double-check each one
        verificationResult.valid.forEach((q) => {
            // Re-verify answer before saving
            const answerCheck = verifyMathematicalAnswer(q);
            if (!answerCheck.isValid) {
                console.log(`Valid question failed re-verification: ${answerCheck.error}`);
                return; // Skip this question
            }
            const questionData = {
                question: String(q.question),
                options: q.options.map(opt => String(opt)),
                correctAnswer: parseInt(q.correctAnswer),
                finalAnswer: String(q.finalAnswer || q.options[q.correctAnswer]),
                difficulty: q.difficulty || 'medium',
                classLevel: parseInt(classLevel),
                topicName: String(topicName),
                concept: concept || undefined,
                tag: String(tag),
                latex: q.latex || false,
                status: 'pending',
                generationBatch: batchId,
                type: type,
                subjectId: subjectId || null
            };
            const latexPattern = /\\frac|\\sqrt|\\times|\\div|\\pm|\\cdot|\$.*?\$/;
            if (latexPattern.test(questionData.question) || questionData.options.some(opt => latexPattern.test(String(opt)))) {
                questionData.latex = true;
            }
            questionsToSave.push(questionData);
        });
        // Process corrected questions - verify each correction
        verificationResult.corrected.forEach((q) => {
            // Verify the corrected answer
            const answerCheck = verifyMathematicalAnswer(q);
            if (!answerCheck.isValid) {
                console.log(`Corrected question failed verification: ${answerCheck.error}`);
                return; // Skip this question
            }
            
            const questionData = {
                question: String(q.question),
                options: q.options.map(opt => String(opt)),
                correctAnswer: parseInt(q.correctAnswer),
                finalAnswer: String(q.finalAnswer || q.options[q.correctAnswer]),
                difficulty: q.difficulty || 'medium',
                classLevel: parseInt(classLevel),
                topicName: String(topicName),
                concept: concept || undefined,
                tag: String(tag),
                latex: q.latex || false,
                status: 'pending',
                generationBatch: batchId,
                type: type,
                subjectId: subjectId || null
            };
            const latexPattern = /\\frac|\\sqrt|\\times|\\div|\\pm|\\cdot|\$.*?\$/;
            if (latexPattern.test(questionData.question) || questionData.options.some(opt => latexPattern.test(String(opt)))) {
                questionData.latex = true;
            }
            questionsToSave.push(questionData);
        });
        // Final duplicate check - check DB before saving each question
        const finalQuestions = [];
        for (const q of questionsToSave) {
            // Normalize question for comparison
            const normalizedQuestion = q.question
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.,!?;:]/g, '')
                .trim();
            
            // Check for exact duplicate (case-insensitive, normalized)
            const existing = await Question.findOne({
                $or: [
                    // Exact match (case-insensitive)
                    { 
                        question: { $regex: new RegExp(`^${q.question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                        classLevel: q.classLevel,
                        tag: q.tag
                    },
                    // Normalized match
                    {
                        question: { 
                            $regex: new RegExp(`^${normalizedQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
                        },
                        classLevel: q.classLevel,
                        tag: q.tag
                    }
                ]
            });
            
            if (!existing) {
                // Double-check answer correctness before adding
                const answerCheck = verifyMathematicalAnswer(q);
                if (answerCheck.isValid) {
                    finalQuestions.push(q);
                } else {
                    console.log(`Skipping question due to answer verification failure: ${answerCheck.error}`);
                }
            } else {
                console.log(`Skipping duplicate question: "${q.question.substring(0, 50)}..."`);
            }
        }
        if (finalQuestions.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'All generated questions are duplicates or failed validation' 
            });
        }
        
        // Insert questions with duplicate error handling
        let savedQuestions = [];
        try {
            savedQuestions = await Question.insertMany(finalQuestions, { ordered: false });
        } catch (insertError) {
            // Handle duplicate key errors (from unique index)
            if (insertError.code === 11000 || insertError.name === 'BulkWriteError' || insertError.writeErrors) {
                // Extract successfully inserted questions from writeErrors
                const writeErrors = insertError.writeErrors || [];
                const errorIndexes = new Set(writeErrors.map(err => err.index));
                
                // Filter out questions that failed (duplicates)
                const successfullyInserted = finalQuestions.filter((q, idx) => !errorIndexes.has(idx));
                
                if (successfullyInserted.length === 0) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'All questions are duplicates (unique constraint violation)' 
                    });
                }
                
                // Fetch the successfully inserted questions from DB
                const questionTexts = successfullyInserted.map(q => q.question);
                savedQuestions = await Question.find({
                    question: { $in: questionTexts },
                    classLevel: classLevel,
                    tag: tag
                }).limit(successfullyInserted.length);
                
                console.log(`Inserted ${savedQuestions.length} out of ${finalQuestions.length} questions (${finalQuestions.length - savedQuestions.length} were duplicates)`);
            } else {
                throw insertError;
            }
        }
        res.status(201).json({
            success: true,
            message: `Generated ${savedQuestions.length} questions`,
            data: {
                batchId,
                totalGenerated: questionsArray.length,
                valid: verificationResult.valid.length,
                corrected: verificationResult.corrected.length,
                invalid: verificationResult.invalid.length,
                saved: savedQuestions.length,
                questions: savedQuestions.map(q => ({
                    _id: q._id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    difficulty: q.difficulty,
                    status: q.status
                }))
            }
        });
    } catch (error) {
        console.error('Generate questions error:', error);
        res.status(500).json({ success: false, message: 'Error generating questions', error: error.message });
    }
};

const getAllQuestions = async (req, res) => {
    try {
        const { tag, classLevel, topicName, status, type, subjectId, limit = 50, skip = 0 } = req.query;
        const query = {};
        if (tag) query.tag = tag;
        if (classLevel) query.classLevel = parseInt(classLevel);
        if (topicName) query.topicName = topicName;
        if (status) query.status = status;
        if (type) query.type = type;
        if (subjectId) query.subjectId = subjectId;
        const questions = await Question.find(query)
            .populate('approvedBy', 'name email')
            .populate('rejectedBy', 'name email')
            .populate('subjectId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();
        const total = await Question.countDocuments(query);
        res.json({ success: true, data: { questions, total, limit: parseInt(limit), skip: parseInt(skip) } });
    } catch (error) {
        console.error('Get all questions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching questions', error: error.message });
    }
};

const approveQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const adminId = req.user._id;
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }
        if (question.status === 'approved') {
            return res.status(400).json({ success: false, message: 'Question is already approved' });
        }
        if (question.status === 'rejected') {
            question.rejectedBy = undefined;
            question.rejectedAt = undefined;
            question.rejectionReason = undefined;
        }
        question.status = 'approved';
        question.approvedBy = adminId;
        question.approvedAt = new Date();
        await question.save();
        res.json({ success: true, message: 'Question approved successfully', data: question });
    } catch (error) {
        console.error('Approve question error:', error);
        res.status(500).json({ success: false, message: 'Error approving question', error: error.message });
    }
};

const rejectQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { reason } = req.body;
        const adminId = req.user._id;
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }
        if (question.status === 'rejected') {
            return res.status(400).json({ success: false, message: 'Question is already rejected' });
        }
        question.status = 'rejected';
        question.rejectedBy = adminId;
        question.rejectedAt = new Date();
        question.rejectionReason = reason || 'No reason provided';
        await question.save();
        res.json({ success: true, message: 'Question rejected successfully', data: question });
    } catch (error) {
        console.error('Reject question error:', error);
        res.status(500).json({ success: false, message: 'Error rejecting question', error: error.message });
    }
};

const bulkApproveQuestions = async (req, res) => {
    try {
        const { questionIds } = req.body;
        const adminId = req.user._id;
        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ success: false, message: 'questionIds array is required' });
        }
        const result = await Question.updateMany(
            { _id: { $in: questionIds } },
            { status: 'approved', approvedBy: adminId, approvedAt: new Date() }
        );
        res.json({ success: true, message: `Approved ${result.modifiedCount} questions`, data: { approved: result.modifiedCount, total: questionIds.length } });
    } catch (error) {
        console.error('Bulk approve questions error:', error);
        res.status(500).json({ success: false, message: 'Error bulk approving questions', error: error.message });
    }
};

const bulkRejectQuestions = async (req, res) => {
    try {
        const { questionIds, reason } = req.body;
        const adminId = req.user._id;
        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ success: false, message: 'questionIds array is required' });
        }
        const result = await Question.updateMany(
            { _id: { $in: questionIds } },
            { status: 'rejected', rejectedBy: adminId, rejectedAt: new Date(), rejectionReason: reason || 'No reason provided' }
        );
        res.json({ success: true, message: `Rejected ${result.modifiedCount} questions`, data: { rejected: result.modifiedCount, total: questionIds.length } });
    } catch (error) {
        console.error('Bulk reject questions error:', error);
        res.status(500).json({ success: false, message: 'Error bulk rejecting questions', error: error.message });
    }
};

const deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }
        await Question.findByIdAndDelete(questionId);
        res.json({ success: true, message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ success: false, message: 'Error deleting question', error: error.message });
    }
};

const bulkDeleteQuestions = async (req, res) => {
    try {
        const { questionIds } = req.body;
        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ success: false, message: 'questionIds array is required' });
        }
        const result = await Question.deleteMany({ _id: { $in: questionIds } });
        res.json({ 
            success: true, 
            message: `Deleted ${result.deletedCount} questions`, 
            data: { deleted: result.deletedCount, total: questionIds.length } 
        });
    } catch (error) {
        console.error('Bulk delete questions error:', error);
        res.status(500).json({ success: false, message: 'Error bulk deleting questions', error: error.message });
    }
};

const deleteAllQuestionsByFilter = async (req, res) => {
    try {
        const { tag, classLevel, topicName, status, type, subjectId } = req.body;
        const query = {};
        if (tag) query.tag = tag;
        if (classLevel) query.classLevel = parseInt(classLevel);
        if (topicName) query.topicName = topicName;
        if (status) query.status = status;
        if (type) query.type = type;
        if (subjectId) query.subjectId = subjectId;
        
        // Prevent accidental deletion of all questions
        if (Object.keys(query).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one filter parameter is required to prevent accidental deletion of all questions' 
            });
        }
        
        const count = await Question.countDocuments(query);
        if (count === 0) {
            return res.status(404).json({ success: false, message: 'No questions found matching the criteria' });
        }
        
        const result = await Question.deleteMany(query);
        res.json({ 
            success: true, 
            message: `Deleted ${result.deletedCount} questions`, 
            data: { deleted: result.deletedCount, filters: query } 
        });
    } catch (error) {
        console.error('Delete questions by filter error:', error);
        res.status(500).json({ success: false, message: 'Error deleting questions', error: error.message });
    }
};

module.exports = {
    generateQuestions,
    getAllQuestions,
    approveQuestion,
    rejectQuestion,
    bulkApproveQuestions,
    bulkRejectQuestions,
    deleteQuestion,
    bulkDeleteQuestions,
    deleteAllQuestionsByFilter
};

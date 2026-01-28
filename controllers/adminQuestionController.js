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

// ============================================================================
// COMPREHENSIVE MATH VALIDATION ENGINE
// ============================================================================

// STEP 1: Normalize numbers safely (handles commas, LaTeX, spaces)
function normalizeNumber(value) {
    if (!value) return null;
    const cleaned = String(value)
        .replace(/,/g, '')        // remove commas (CRITICAL FIX)
        .replace(/\$/g, '')       // remove LaTeX $
        .replace(/\\/g, '')        // remove escapes
        .replace(/\s+/g, '')      // remove spaces
        .trim();
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
}

// STEP 2: GCD and LCM functions
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}

function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
}

function gcdMultiple(nums) {
    return nums.reduce((acc, n) => gcd(acc, n));
}

function lcmMultiple(nums) {
    return nums.reduce((acc, n) => lcm(acc, n));
}

// STEP 3: Fraction utilities
function reduceFraction(n, d) {
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
}

function parseFraction(input) {
    if (!input) return null;
    const cleaned = String(input)
        .replace(/\$/g, '')
        .replace(/,/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    // Mixed number: "1 11/18"
    const mixedMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
        const whole = Number(mixedMatch[1]);
        const n = Number(mixedMatch[2]);
        const d = Number(mixedMatch[3]);
        return reduceFraction(whole * d + n, d);
    }
    // Simple fraction: "29/18"
    const fracMatch = cleaned.match(/^(\d+)\/(\d+)$/);
    if (fracMatch) {
        return reduceFraction(Number(fracMatch[1]), Number(fracMatch[2]));
    }
    // Decimal or whole number
    const num = Number(cleaned);
    if (!isNaN(num)) {
        const precision = 1e6;
        return reduceFraction(Math.round(num * precision), precision);
    }
    return null;
}

function fractionsEqual(a, b) {
    return a.n === b.n && a.d === b.d;
}

// STEP 4: Detect estimation/rounding questions
function detectEstimationRule(questionText) {
    const q = questionText.toLowerCase();
    if (q.includes('nearest ten thousand')) return 'nearest_10000';
    if (q.includes('nearest thousand')) return 'nearest_1000';
    if (q.includes('nearest hundred')) return 'nearest_100';
    if (q.includes('nearest ten')) return 'nearest_10';
    if (q.includes('estimate')) return 'nearest_1000'; // fallback default
    return null;
}

function roundByRule(value, rule) {
    switch (rule) {
        case 'nearest_10': return Math.round(value / 10) * 10;
        case 'nearest_100': return Math.round(value / 100) * 100;
        case 'nearest_1000': return Math.round(value / 1000) * 1000;
        case 'nearest_10000': return Math.round(value / 10000) * 10000;
        default: return value;
    }
}

function extractNumbers(text) {
    const matches = text.match(/[\d,]+/g) || [];
    return matches
        .map(v => normalizeNumber(v))
        .filter(v => v !== null);
}

// STEP 5: Estimation verification
function verifyEstimationQuestion(question) {
    const rule = detectEstimationRule(question.question);
    if (!rule) return { isValid: true }; // not an estimation question
    const numbers = extractNumbers(question.question);
    if (numbers.length < 2) {
        return { isValid: false, error: 'Could not extract numbers for estimation' };
    }
    const rounded = numbers.map(n => roundByRule(n, rule));
    const estimatedSum = rounded.reduce((a, b) => a + b, 0);
    const optionValues = question.options.map(normalizeNumber);
    const correctIndex = optionValues.findIndex(v => v === estimatedSum);
    if (correctIndex === -1) {
        return {
            isValid: false,
            error: `Estimated answer ${estimatedSum} not found in options`
        };
    }
    // Fix incorrect correctAnswer index if needed
    if (question.correctAnswer !== correctIndex) {
        question.correctAnswer = correctIndex;
        question.finalAnswer = question.options[correctIndex];
    }
    return { isValid: true, correctAnswer: estimatedSum };
}

// STEP 6: Fraction verification
function verifyFractionQuestion(question) {
    const expected = parseFraction(question.finalAnswer);
    if (!expected) return { isValid: true }; // not a fraction question
    const optionFractions = question.options.map(parseFraction);
    const correctIndex = optionFractions.findIndex(
        f => f && fractionsEqual(f, expected)
    );
    if (correctIndex === -1) {
        return {
            isValid: false,
            error: 'Correct fraction value not found in options'
        };
    }
    // Fix incorrect correctAnswer index
    if (question.correctAnswer !== correctIndex) {
        question.correctAnswer = correctIndex;
        question.finalAnswer = question.options[correctIndex];
    }
    return { isValid: true };
}

// STEP 7: Detect math rule from question text
function detectRule(text) {
    const t = text.toLowerCase();
    if (t.includes('lcm')) return 'LCM';
    if (t.includes('hcf') || t.includes('gcd')) return 'HCF';
    if (t.includes('%') || t.includes('percent')) return 'PERCENTAGE';
    if (t.includes('ratio')) return 'RATIO';
    if (t.includes('average')) return 'AVERAGE';
    if (t.includes('profit') || t.includes('loss')) return 'PROFIT_LOSS';
    if (t.includes('speed') || t.includes('distance') || t.includes('time')) return 'TSD';
    if (t.match(/x\s*[+=-]/)) return 'ALGEBRA';
    if (t.includes('convert')) return 'UNIT';
    if (detectEstimationRule(text)) return 'ESTIMATION';
    if (parseFraction(text)) return 'FRACTION';
    return 'UNKNOWN';
}

// STEP 8: LCM/HCF validator
function validateLCMHCF(question) {
    const nums = extractNumbers(question.question);
    if (nums.length < 2) return { isValid: true }; // not an LCM/HCF question
    const isLCM = question.question.toLowerCase().includes('lcm');
    const expected = isLCM ? lcmMultiple(nums) : gcdMultiple(nums);
    const optionValues = question.options.map(normalizeNumber);
    const correctIndex = optionValues.findIndex(v => v === expected);
    if (correctIndex === -1) {
        return { isValid: false, error: `Correct ${isLCM ? 'LCM' : 'HCF'} not in options` };
    }
    question.correctAnswer = correctIndex;
    question.finalAnswer = question.options[correctIndex];
    return { isValid: true };
}

// STEP 9: Percentage validator
function calculatePercentage(base, percent) {
    return +(base * percent / 100).toFixed(2);
}

function validatePercentage(question) {
    const nums = extractNumbers(question.question);
    if (nums.length < 2) return { isValid: true };
    const expected = calculatePercentage(nums[0], nums[1]);
    const optionValues = question.options.map(normalizeNumber);
    const correctIndex = optionValues.findIndex(
        v => v !== null && Math.abs(v - expected) < 0.01
    );
    if (correctIndex === -1) return { isValid: false, error: 'Correct percentage not in options' };
    question.correctAnswer = correctIndex;
    question.finalAnswer = question.options[correctIndex];
    return { isValid: true };
}

// STEP 10: Average validator
function validateAverage(question) {
    const nums = extractNumbers(question.question);
    if (nums.length < 2) return { isValid: true };
    const expected = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
    const optionValues = question.options.map(normalizeNumber);
    const correctIndex = optionValues.findIndex(
        v => v !== null && Math.abs(v - expected) < 0.01
    );
    if (correctIndex === -1) return { isValid: false, error: 'Correct average not in options' };
    question.correctAnswer = correctIndex;
    question.finalAnswer = question.options[correctIndex];
    return { isValid: true };
}

// STEP 11: Math Rule Registry
const MathRuleRegistry = {
    LCM: validateLCMHCF,
    HCF: validateLCMHCF,
    FRACTION: verifyFractionQuestion,
    PERCENTAGE: validatePercentage,
    AVERAGE: validateAverage,
    ESTIMATION: verifyEstimationQuestion,
};

// STEP 12: Main validation dispatcher
function validateQuestionByRule(question) {
    const rule = detectRule(question.question);
    const handler = MathRuleRegistry[rule];
    if (handler) {
        return handler(question);
    }
    return { isValid: true }; // fallback - let other checks handle it
}

// Mathematical verification function (client-side check) - ENHANCED
function verifyMathematicalAnswer(question) {
    if (!question.finalAnswer) {
        return { isValid: false, error: 'Missing finalAnswer field' };
    }

    const correctIndex = question.correctAnswer;
    
    if (typeof correctIndex !== 'number' || isNaN(correctIndex) || 
        correctIndex < 0 || correctIndex >= question.options.length) {
        return { 
            isValid: false, 
            error: `Invalid correctAnswer index: ${correctIndex}` 
        };
    }

    // FIRST: Try rule-based validation (estimation, fractions, LCM/HCF, etc.)
    const ruleValidation = validateQuestionByRule(question);
    if (!ruleValidation.isValid) {
        return ruleValidation; // Return specific error from rule validator
    }

    // SECOND: Standard string matching with comma normalization
    const finalAnswer = String(question.finalAnswer).trim();
    const selectedOption = String(question.options[correctIndex]).trim();
    
    // CRITICAL FIX: Normalize commas, LaTeX, spaces
    const cleanFinal = finalAnswer
        .replace(/,/g, '')        // remove commas (CRITICAL)
        .replace(/^\$+|\$+$/g, '')
        .replace(/\\+/g, '')
        .replace(/\s+/g, '')
        .trim();
        
    const cleanSelected = selectedOption
        .replace(/,/g, '')        // remove commas (CRITICAL)
        .replace(/^\$+|\$+$/g, '')
        .replace(/\\+/g, '')
        .replace(/\s+/g, '')
        .trim();
    
    // For fraction questions, use fraction comparison
    const finalFrac = parseFraction(finalAnswer);
    const selectedFrac = parseFraction(selectedOption);
    
    if (finalFrac && selectedFrac) {
        if (fractionsEqual(finalFrac, selectedFrac)) {
            return { isValid: true };
        }
    }
    
    // For numeric questions, compare normalized numbers
    const finalNum = normalizeNumber(finalAnswer);
    const selectedNum = normalizeNumber(selectedOption);
    
    if (finalNum !== null && selectedNum !== null) {
        if (Math.abs(finalNum - selectedNum) < 0.001) {
            return { isValid: true };
        }
    }
    
    // Fallback: String matching
    const isMatch = cleanSelected.includes(cleanFinal) || 
                    cleanFinal.includes(cleanSelected) ||
                    cleanSelected === cleanFinal;
    
    if (!isMatch) {
        return {
            isValid: false,
            error: `Answer mismatch: finalAnswer="${cleanFinal}" vs option[${correctIndex}]="${cleanSelected}"`
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

// Helper function to check for duplicate options within a question
function hasDuplicateOptions(question) {
    if (!question.options || !Array.isArray(question.options)) return true;
    const options = question.options.map(opt => String(opt).trim().toLowerCase());
    const uniqueOptions = new Set(options);
    return uniqueOptions.size !== options.length;
}

// Helper function to automatically fix duplicate options
function fixDuplicateOptions(question) {
    if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
        return null; // Cannot fix invalid structure
    }

    const originalOptions = [...question.options];
    const fixedOptions = [];
    const seen = new Set();
    const correctAnswerIndex = question.correctAnswer || 0;
    const correctAnswer = originalOptions[correctAnswerIndex];

    // Keep the correct answer at its position
    for (let i = 0; i < 4; i++) {
        const opt = String(originalOptions[i]).trim();
        const optLower = opt.toLowerCase();

        if (i === correctAnswerIndex) {
            // Always keep the correct answer
            fixedOptions.push(opt);
            seen.add(optLower);
        } else if (!seen.has(optLower)) {
            // Unique option - keep it
            fixedOptions.push(opt);
            seen.add(optLower);
        } else {
            // Duplicate found - generate a unique alternative
            let newOption = null;
            let attempts = 0;
            const maxAttempts = 20;

            // Try to parse as number and generate nearby unique value
            const numMatch = opt.match(/[\d.]+/);
            if (numMatch) {
                const num = parseFloat(numMatch[0]);
                if (!isNaN(num)) {
                    // Generate nearby numbers that aren't duplicates
                    for (let offset = 1; offset <= 10 && attempts < maxAttempts; offset++) {
                        const candidates = [
                            num + offset,
                            num - offset,
                            num * (1 + offset * 0.1),
                            num / (1 + offset * 0.1)
                        ];

                        for (const candidate of candidates) {
                            const candidateStr = String(Math.round(candidate * 100) / 100);
                            const candidateLower = candidateStr.toLowerCase();
                            
                            if (!seen.has(candidateLower) && candidateStr !== correctAnswer.toLowerCase()) {
                                // Replace number in original option with new number
                                newOption = opt.replace(/[\d.]+/, candidateStr);
                                if (!seen.has(newOption.toLowerCase())) {
                                    break;
                                }
                            }
                        }
                        if (newOption) break;
                    }
                }
            }

            // If still no unique option, try simple variations
            if (!newOption) {
                for (let suffix = 1; suffix <= 100 && attempts < maxAttempts; suffix++) {
                    const candidate = `${opt} (alt${suffix})`;
                    if (!seen.has(candidate.toLowerCase())) {
                        newOption = candidate;
                        break;
                    }
                    attempts++;
                }
            }

            // If still no unique option, use a placeholder
            if (!newOption) {
                newOption = `Option ${i + 1}`;
                let counter = 1;
                while (seen.has(newOption.toLowerCase()) && counter < 100) {
                    newOption = `Option ${i + 1}-${counter}`;
                    counter++;
                }
            }

            fixedOptions.push(newOption);
            seen.add(newOption.toLowerCase());
            console.log(`🔧 Fixed duplicate option ${i}: "${opt}" → "${newOption}"`);
        }
    }

    return {
        ...question,
        options: fixedOptions
    };
}

// Helper function to check for duplicate questions (same question text)
function isDuplicateQuestion(newQuestion, existingQuestions) {
    const newQuestionText = String(newQuestion.question).trim().toLowerCase();
    return existingQuestions.some(existing => 
        String(existing.question).trim().toLowerCase() === newQuestionText
    );
}

// Convert currency symbols: $ → Rs (for Indian context)
function convertCurrency(text, isLatex) {
    if (isLatex) {
        // For LaTeX, only convert currency patterns, preserve LaTeX $ delimiters
        // Pattern: $12.45 → Rs 12.45 (currency)
        // Pattern: $\frac{3}{4}$ → stays as $\frac{3}{4}$ (LaTeX)
        return text.replace(/\$(\d+\.?\d*)/g, 'Rs $1').replace(/\$\s+(\d+\.?\d*)/g, 'Rs $1');
    }
    // For non-LaTeX, convert all $ symbols to Rs
    return text.replace(/\$(\d+\.?\d*)/g, 'Rs $1').replace(/\$\s+(\d+\.?\d*)/g, 'Rs $1').replace(/\$/g, 'Rs ');
}

// Enhanced LaTeX handling - fix corrupted fraction patterns
function wrapLatexExpressions(text) {
    // CRITICAL FIX: Fix corrupted fraction patterns
    let fixed = text;
    
    // First, normalize all whitespace (spaces, newlines, tabs) to single spaces
    fixed = fixed.replace(/\s+/g, ' ');
    
    // Pattern 1: Fix "num den den num" pattern (e.g., "5 8 8 5" → "\frac{5}{8}")
    let prevFixed = '';
    while (prevFixed !== fixed) {
        prevFixed = fixed;
        // Match "num den den num" pattern and replace with \frac{num}{den}
        fixed = fixed.replace(/(\d+)\s+(\d+)\s+\2\s+\1/g, '\\frac{$1}{$2}');
    }
    
    // Pattern 2: Fix patterns like "3 4" before operators
    fixed = fixed.replace(/(\d+)\s+(\d+)\s*(\\times|\\div|\\pm|\\cdot|\+|\-|=)/g, '\\frac{$1}{$2} $3');
    
    // Pattern 3: Fix patterns after operators
    fixed = fixed.replace(/([+\-×÷=\\times\\div\\pm\\cdot])\s*(\d+)\s+(\d+)(?=\s|$|[+\-×÷=\\times\\div\\pm\\cdot])/g, '$1 \\frac{$2}{$3}');
    
    // Don't wrap if already wrapped
    if (fixed.includes('$') || fixed.includes('\\(')) {
        return fixed;
    }
    // Find all LaTeX expressions and wrap them
    return fixed.replace(/(\\frac\{[^}]+\}\{[^}]+\}|\\sqrt\{[^}]+\}|\\[a-zA-Z]+\{[^}]*\})/g, '$$$1$$');
}

// Generate shuffled position pattern for balanced answer distribution
function generateShuffledPositions(totalQuestions) {
    const positions = [];
    const perPosition = Math.floor(totalQuestions / 4);
    const remainder = totalQuestions % 4;
    
    // Create balanced buckets
    for (let pos = 0; pos < 4; pos++) {
        const count = perPosition + (pos < remainder ? 1 : 0);
        for (let i = 0; i < count; i++) {
            positions.push(pos);
        }
    }
    
    // Fisher-Yates shuffle to randomize order
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    return positions;
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
        
        // Get ALL existing questions for this tag (regardless of classLevel or topicName)
        // This prevents generating duplicate questions even if they were generated for different classes/topics
        const existingQuestions = await Question.find({ 
            tag: tag  // Only filter by tag - check ALL questions with this tag
        }).select('question classLevel topicName').lean();
        
        console.log(`\n📊 Found ${existingQuestions.length} existing questions for tag: "${tag}"`);
        
        // Normalize existing questions for better duplicate detection
        const existingQuestionTexts = new Set(); // Use Set for faster lookup
        const existingQuestionDetails = []; // Keep details for prompt
        
        existingQuestions.forEach(q => {
            const normalized = q.question.toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.,!?;:]/g, '')
                .trim();
            existingQuestionTexts.add(normalized);
            existingQuestionDetails.push({
                text: q.question.substring(0, 100),
                classLevel: q.classLevel,
                topicName: q.topicName
            });
        });
        
        console.log(`   - Unique normalized questions: ${existingQuestionTexts.size}`);
        if (existingQuestionDetails.length > 0) {
            console.log(`   - Sample existing questions:`);
            existingQuestionDetails.slice(0, 3).forEach((q, i) => {
                console.log(`     ${i + 1}. [Class ${q.classLevel}, ${q.topicName}] ${q.text}...`);
            });
        }
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate shuffled position pattern for balanced distribution
        const TOTAL_QUESTIONS = 10;
        const globalPositionPattern = generateShuffledPositions(TOTAL_QUESTIONS);
        const positionAssignments = globalPositionPattern.map((pos, idx) => 
            `Question ${idx + 1}: Place correct answer at position ${pos} (index ${pos})`
        ).join('\n');
        
        const prompt = [
            `Generate exactly ${TOTAL_QUESTIONS} MCQ questions for Class ${classLevel} mathematics.`,
            '',
            `TAG: "${tag}"`,
            `TOPIC: "${topicName}"`,
            `${concept ? `CONCEPT: "${concept}"` : 'CONCEPT: Not specified'}`,
            `CLASS LEVEL: ${classLevel}`,
            '',
            '═══════════════════════════════════════════════════════════════',
            'MANDATORY QUESTION CREATION PROTOCOL - FOLLOW EXACTLY:',
            '═══════════════════════════════════════════════════════════════',
            '',
            'For EACH question, you MUST complete these steps IN ORDER:',
            '',
            '【STEP 1】 CREATE THE PROBLEM',
            '   - Write a clear mathematical question',
            '',
            '【STEP 2】 SOLVE THE PROBLEM YOURSELF',
            '   - Show your work step-by-step (internally)',
            '   - Calculate the EXACT correct answer',
            '   - Write down this answer (this becomes finalAnswer)',
            '',
            '【STEP 3】 CREATE 4 OPTIONS',
            '   - First option: Place your correct answer',
            '   - Other 3 options: Create plausible wrong answers',
            '   - CRITICAL: All 4 options MUST be UNIQUE (no duplicates)',
            '   - Shuffle these 4 options randomly (DO NOT always put correct answer first)',
            '',
            '【STEP 4】 FIND THE CORRECT INDEX',
            '   - After shuffling, find which position (0, 1, 2, or 3) has your correct answer',
            '   - Set correctAnswer to this index',
            '',
            '【STEP 5】 VERIFY',
            '   - Double-check: options[correctAnswer] === finalAnswer',
            '   - If not matching, STOP and fix the error',
            '',
            '═══════════════════════════════════════════════════════════════',
            '🎯 MANDATORY POSITION ASSIGNMENTS - FOLLOW EXACTLY:',
            '═══════════════════════════════════════════════════════════════',
            '',
            positionAssignments,
            '',
            'For each question:',
            '1. Solve the problem and get the correct answer',
            '2. Create 3 DISTINCT wrong answers (all different from correct answer AND from each other)',
            '3. Place correct answer at the ASSIGNED position above',
            '4. Fill other positions with wrong answers',
            '5. Set correctAnswer to the assigned position number',
            '',
            '⚠️ DO NOT put all answers at position 0',
            '⚠️ FOLLOW the position assignments exactly',
            '',
            '═══════════════════════════════════════════════════════════════',
            '🚫🚫🚫 CRITICAL: NO DUPLICATE OPTIONS - MANDATORY REQUIREMENT 🚫🚫🚫',
            '═══════════════════════════════════════════════════════════════',
            '',
            '⚠️⚠️⚠️ ABSOLUTELY FORBIDDEN - ZERO TOLERANCE FOR DUPLICATES ⚠️⚠️⚠️',
            '',
            'Each question MUST have 4 COMPLETELY UNIQUE options. The system will AUTOMATICALLY REJECT and SKIP any question with duplicate options.',
            '',
            'STRICT RULES - NO EXCEPTIONS:',
            '   ❌ NO two options can be identical strings: "10" and "10" = REJECTED',
            '   ❌ NO two options can have the same numeric value: "5" and "5.0" = REJECTED',
            '   ❌ NO two options can be equivalent fractions: "1/2" and "0.5" = REJECTED',
            '   ❌ NO two options can differ only by currency: "$5" and "5" = REJECTED',
            '   ❌ NO two options can differ only by spaces: "5" and " 5 " = REJECTED',
            '',
            '✅✅✅ CORRECT Examples (ALL ACCEPTED):',
            '   Question 1: options: ["10", "11", "12", "15"] → All unique → ACCEPTED ✅',
            '   Question 2: options: ["5", "6", "7", "8"] → All unique → ACCEPTED ✅',
            '   Question 3: options: ["1/2", "2/3", "3/4", "1"] → All unique → ACCEPTED ✅',
            '',
            '═══════════════════════════════════════════════════════════════',
            'CURRENCY RULES (CRITICAL FOR INDIA):',
            '═══════════════════════════════════════════════════════════════',
            '',
            '  - ALWAYS use "Rs" for Indian Rupees, NEVER use "$" or "dollar"',
            '  - Example: "Rs 12.45" is CORRECT',
            '  - Example: "$12.45" is WRONG - use "Rs 12.45" instead',
            '  - For all money/cost/price questions, use "Rs" prefix',
            '',
            '═══════════════════════════════════════════════════════════════',
            'LaTeX Rules:',
            '═══════════════════════════════════════════════════════════════',
            '',
            '  - Fractions: $\\\\frac{numerator}{denominator}$',
            '  - NEVER use commas: "$7,10$" is WRONG',
            '  - NEVER write fractions as separate numbers: "$3 4 4 3$" is WRONG',
            '  - ALWAYS use proper LaTeX: "$\\\\frac{3}{4}$"',
            '  - CRITICAL: Keep \\\\frac{}{} together - do NOT split into separate numbers',
            '  - Example: "$\\\\frac{3}{4} \\\\times 8 = 6$" is CORRECT',
            '  - Example: "$3 4 4 3 \\\\times 8 = 6$" is WRONG - use \\\\frac{3}{4} instead',
            '  - NOTE: $ symbols in LaTeX (like $\\\\frac{3}{4}$) are for math, NOT currency',
            '  - For currency, use "Rs" NOT "$"',
            '',
            '═══════════════════════════════════════════════════════════════',
            'EXISTING QUESTIONS TO AVOID (CRITICAL - NO DUPLICATES):',
            '═══════════════════════════════════════════════════════════════',
            '',
            existingQuestionDetails.length > 0 
                ? [
                    `⚠️ IMPORTANT: You have ${existingQuestionDetails.length} existing questions for this tag "${tag}".`,
                    '⚠️ DO NOT create questions similar to these. Create COMPLETELY NEW and UNIQUE questions.',
                    '',
                    'Sample existing questions (avoid similar ones):',
                    ...existingQuestionDetails.slice(0, 10).map((q, i) => 
                        `${i + 1}. [Class ${q.classLevel}, ${q.topicName}] ${q.text}...`
                    ),
                    '',
                    'CRITICAL: Even if a question was generated for a different class or topic,',
                    '         if it covers the same tag, DO NOT create a similar question.',
                    '         Each question must be UNIQUE and DIFFERENT from all existing ones.'
                ].join('\n')
                : `None - this is the first batch for tag "${tag}"`,
            '',
            '═══════════════════════════════════════════════════════════════',
            'JSON FORMAT:',
            '═══════════════════════════════════════════════════════════════',
            '',
            '{ "questions": [',
            '  {',
            '    "id": number,',
            '    "question": string,',
            '    "options": [string, string, string, string],',
            '    "correctAnswer": number,',
            '    "finalAnswer": string,',
            '    "difficulty": "easy" | "medium" | "hard",',
            `    "topicName": "${topicName}",`,
            `    "concept": "${concept || 'N/A'}",`,
            `    "tag": "${tag}",`,
            '    "latex": boolean',
            '  }',
            '] }',
            '',
            'QUALITY CHECKLIST - VERIFY BEFORE SUBMITTING:',
            '□ All questions generated',
            '□ Each question has finalAnswer field',
            '□ Each finalAnswer matches options[correctAnswer]',
            '□ Answer positions distributed: ~2-3 per position (0,1,2,3)',
            '□ No position has 0 answers',
            '□ No position has >5 answers',
            '□ All mathematics verified and correct',
            '□ Difficulty mix: ~3 easy, ~4 medium, ~3 hard',
            '□ ALL 4 options are UNIQUE (no duplicates)',
            '□ Currency uses "Rs" not "$"',
            '',
            'Return ONLY the JSON - no explanations, no preamble.'
        ].join('\n');
        const content = await callAzureOpenAI(
            [
                { 
                    role: "system", 
                    content: `You are an expert mathematics educator. You MUST solve each problem step-by-step before creating the question. CRITICAL REQUIREMENTS: (1) Calculate the correct answer first, (2) Create 3 DISTINCT wrong answers (all different from correct answer AND from each other), (3) Verify all 4 options are UNIQUE (no duplicates whatsoever), (4) Place correct answer at the ASSIGNED position (see position assignments in prompt), (5) Set correctAnswer to that position's index, (6) Ensure finalAnswer matches options[correctAnswer] exactly. MANDATORY: Follow the position assignments exactly - do NOT put all answers at position 0. ABSOLUTELY FORBIDDEN: Duplicate options within a question. CRITICAL: Check the "EXISTING QUESTIONS TO AVOID" section in the prompt - DO NOT create questions similar to those. Even if a question was generated for a different class or topic, if it covers the same tag, create a COMPLETELY DIFFERENT question. Use 'Rs' for currency, not '$'. Return ONLY valid JSON.` 
                },
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
        // STEP 1: Filter out invalid structure and duplicate options (within the batch)
        console.log(`\n🔍 Step 1: Filtering invalid structure and duplicate options...`);
        const structuredQuestions = questionsArray.filter((q, idx) => {
            if (!q || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
                console.log(`❌ Q${idx + 1}: Invalid structure - skipped`);
                return false;
            }
            
            // Check for duplicate options within the question
            if (hasDuplicateOptions(q)) {
                console.log(`⚠️ Q${idx + 1}: Has duplicate options - attempting to fix...`);
                const fixed = fixDuplicateOptions(q);
                if (fixed && !hasDuplicateOptions(fixed)) {
                    console.log(`✅ Q${idx + 1}: Duplicate options fixed successfully`);
                    // Replace the question with fixed version
                    questionsArray[idx] = fixed;
                    q = fixed;
                } else {
                    console.log(`❌ Q${idx + 1}: Could not fix duplicate options - skipped`);
                    return false;
                }
            }
            
            return true;
        });
        
        console.log(`✅ Step 1 Complete: ${structuredQuestions.length}/${questionsArray.length} questions passed structure check`);
        
        // STEP 2: Remove duplicate question text (within the batch)
        console.log(`\n🔍 Step 2: Removing duplicate question text...`);
        const uniqueQuestions = [];
        const seenQuestions = new Set();
        
        structuredQuestions.forEach((q) => {
            const questionText = q.question?.toLowerCase().trim();
            if (questionText && !seenQuestions.has(questionText)) {
                seenQuestions.add(questionText);
                uniqueQuestions.push(q);
            } else {
                console.log(`❌ Duplicate question text removed: "${q.question?.substring(0, 50)}..."`);
            }
        });
        
        // Also check against existing questions in DB (all questions with same tag)
        const finalUniqueQuestions = uniqueQuestions.filter((q) => {
            const questionText = String(q.question)
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.,!?;:]/g, '')
                .trim();
            if (existingQuestionTexts.has(questionText)) {
                console.log(`❌ Duplicate with existing question in DB: "${q.question?.substring(0, 50)}..."`);
                // Find which existing question it matches
                const matchingQuestion = existingQuestionDetails.find(existing => {
                    const existingNormalized = existing.text.toLowerCase()
                        .replace(/\s+/g, ' ')
                        .replace(/[.,!?;:]/g, '')
                        .trim();
                    return existingNormalized === questionText;
                });
                if (matchingQuestion) {
                    console.log(`   → Matches existing: [Class ${matchingQuestion.classLevel}, ${matchingQuestion.topicName}]`);
                }
                return false;
            }
            return true;
        });
        
        console.log(`✅ Step 2 Complete: ${finalUniqueQuestions.length}/${structuredQuestions.length} unique questions`);
        
        if (finalUniqueQuestions.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid questions after filtering duplicates' });
        }
        // STEP 3: Verify ALL questions together with AI
        console.log(`\n🔍 Step 3: Verifying all ${finalUniqueQuestions.length} questions with AI...`);
        const verificationResult = await verifyAndCorrectQuestionsBatch(finalUniqueQuestions, azureConfig);
        
        console.log(`📊 Step 3 Complete - Verification Results:`);
        console.log(`   ✅ Valid: ${verificationResult.valid.length}`);
        console.log(`   🔧 Corrected: ${verificationResult.corrected.length}`);
        console.log(`   ❌ Invalid: ${verificationResult.invalid.length}`);
        
        // STEP 4: Process valid questions with strict verification
        console.log(`\n🔍 Step 4: Applying strict verification and conditions...`);
        const questionsToSave = [];
        
        verificationResult.valid.forEach((q) => {
            try {
                let correctAnswer = q.correctAnswer;
                if (typeof correctAnswer === 'string') correctAnswer = Number(correctAnswer);
                
                if (typeof correctAnswer !== 'number' || isNaN(correctAnswer) || 
                    correctAnswer < 0 || correctAnswer >= 4) {
                    console.log(`❌ Invalid correctAnswer index: ${correctAnswer}`);
                    return;
                }

                // Check for duplicate options again (safety check)
                if (hasDuplicateOptions(q)) {
                    console.log(`❌ Question has duplicate options after verification - skipped`);
                    return;
                }

                // FIRST: Apply rule-based validation (estimation, fractions, LCM/HCF, etc.)
                const ruleValidation = validateQuestionByRule(q);
                if (!ruleValidation.isValid) {
                    console.error(`\n❌❌❌ CRITICAL ERROR - Question REJECTED ❌❌❌`);
                    console.error(`   Question: ${q.question?.substring(0, 100)}...`);
                    console.error(`   Rule Validation Error: ${ruleValidation.error}`);
                    console.error(`   Options: ${JSON.stringify(q.options)}`);
                    console.error(`   This question is INVALID and will be REJECTED.\n`);
                    return; // Skip this question - it's invalid
                }
                
                // CRITICAL: Final verification - ensure correctAnswer index actually points to correct option
                if (q.finalAnswer) {
                    const finalAnswer = String(q.finalAnswer).trim();
                    const markedOption = String(q.options[correctAnswer]).trim();
                    
                    // CRITICAL FIX: Normalize commas, LaTeX, spaces
                    const cleanFinal = finalAnswer
                        .replace(/,/g, '')        // remove commas (CRITICAL)
                        .replace(/^\$+|\$+$/g, '')
                        .replace(/\\+/g, '')
                        .replace(/\s+/g, '')
                        .trim();
                        
                    const cleanMarked = markedOption
                        .replace(/,/g, '')        // remove commas (CRITICAL)
                        .replace(/^\$+|\$+$/g, '')
                        .replace(/\\+/g, '')
                        .replace(/\s+/g, '')
                        .trim();
                    
                    // Check fraction equivalence first
                    const finalFrac = parseFraction(finalAnswer);
                    const markedFrac = parseFraction(markedOption);
                    let isMatch = false;
                    
                    if (finalFrac && markedFrac) {
                        isMatch = fractionsEqual(finalFrac, markedFrac);
                    } else {
                        // Check numeric equivalence
                        const finalNum = normalizeNumber(finalAnswer);
                        const markedNum = normalizeNumber(markedOption);
                        
                        if (finalNum !== null && markedNum !== null) {
                            isMatch = Math.abs(finalNum - markedNum) < 0.001;
                        } else {
                            // Fallback: String matching
                            isMatch = cleanMarked.includes(cleanFinal) || 
                                      cleanFinal.includes(cleanMarked) ||
                                      cleanMarked === cleanFinal;
                        }
                    }
                    
                    if (!isMatch) {
                        // Try to find the correct option index by checking ALL options
                        let correctIndex = -1;
                        let bestMatch = '';
                        
                        const finalFrac = parseFraction(finalAnswer);
                        
                        q.options.forEach((opt, idx) => {
                            if (correctIndex >= 0) return; // Already found
                            
                            // Check fraction equivalence first
                            if (finalFrac) {
                                const optFrac = parseFraction(opt);
                                if (optFrac && fractionsEqual(finalFrac, optFrac)) {
                                    correctIndex = idx;
                                    bestMatch = opt;
                                    return;
                                }
                            }
                            
                            // Check numeric equivalence
                            const finalNum = normalizeNumber(finalAnswer);
                            const optNum = normalizeNumber(opt);
                            
                            if (finalNum !== null && optNum !== null) {
                                if (Math.abs(finalNum - optNum) < 0.001) {
                                    correctIndex = idx;
                                    bestMatch = opt;
                                    return;
                                }
                            }
                            
                            // Fallback: String matching
                            const cleanOpt = String(opt)
                                .replace(/,/g, '')        // remove commas (CRITICAL)
                                .replace(/^\$+|\$+$/g, '')
                                .replace(/\\+/g, '')
                                .replace(/\s+/g, '')
                                .trim();
                            const optMatch = cleanOpt.includes(cleanFinal) || cleanFinal.includes(cleanOpt) || cleanOpt === cleanFinal;
                            
                            if (optMatch && correctIndex === -1) {
                                correctIndex = idx;
                                bestMatch = opt;
                            }
                        });
                        
                        if (correctIndex >= 0) {
                            console.log(`⚠️ Q${questionsToSave.length + 1}: correctAnswer index mismatch. Marked: ${correctAnswer}="${cleanMarked}", Should be: ${correctIndex}="${bestMatch}". Fixing...`);
                            q.correctAnswer = correctIndex;
                            q.finalAnswer = q.options[correctIndex];
                            correctAnswer = correctIndex;
                        } else {
                            // CRITICAL: None of the options contain the correct answer
                            console.error(`\n❌❌❌ CRITICAL ERROR - Question REJECTED ❌❌❌`);
                            console.error(`   Question: ${q.question?.substring(0, 100)}...`);
                            console.error(`   finalAnswer="${cleanFinal}"`);
                            console.error(`   Options: ${JSON.stringify(q.options)}`);
                            console.error(`   NONE of the options contain the correct answer!`);
                            console.error(`   This question is INVALID and will be REJECTED.\n`);
                            return; // Skip this question - it's invalid
                        }
                    }
                }
                
                // ADDITIONAL SAFETY CHECK: Verify the marked option is actually reasonable
                const markedOpt = String(q.options[correctAnswer]).trim();
                if (!markedOpt || markedOpt.length === 0) {
                    console.error(`❌ Q${questionsToSave.length + 1}: Marked option is empty - REJECTED`);
                    return;
                }

                // Convert currency symbols: $ → Rs (for Indian context)
                const isLatex = q.latex || false;
                const convertedQuestion = convertCurrency(String(q.question), isLatex);
                const convertedOptions = q.options.map(opt => convertCurrency(String(opt), isLatex));

                // Enhanced LaTeX detection and fixing
                const latexPattern = /\\frac|\\sqrt|\\times|\\div|\\pm|\\cdot|\\pi|\\theta|\\alpha|\\beta|\\gamma|\\delta|\\sum|\\int|\\lim|\\infty|\$.*?\$|\\?\(.*?\\?\)/;
                const hasLatexInQuestion = latexPattern.test(convertedQuestion);
                const hasLatexInOptions = convertedOptions.some(opt => latexPattern.test(String(opt)));
                
                let finalQuestion = convertedQuestion;
                let finalOptions = convertedOptions;
                let finalLatex = isLatex || hasLatexInQuestion || hasLatexInOptions;
                
                if (finalLatex) {
                    // Auto-wrap LaTeX expressions that aren't wrapped
                    finalQuestion = wrapLatexExpressions(convertedQuestion);
                    finalOptions = convertedOptions.map(opt => wrapLatexExpressions(String(opt)));
                }
                
                const questionData = {
                    question: finalQuestion,
                    options: finalOptions,
                    correctAnswer: correctAnswer,
                    finalAnswer: String(q.finalAnswer || q.options[correctAnswer]),
                    difficulty: q.difficulty || 'medium',
                    classLevel: parseInt(classLevel),
                    topicName: String(topicName),
                    concept: concept || undefined,
                    tag: String(tag),
                    latex: finalLatex,
                    status: 'pending',
                    generationBatch: batchId,
                    type: type,
                    subjectId: subjectId || null
                };
                
                questionsToSave.push(questionData);
                console.log(`✅ ACCEPTED (${questionsToSave.length}/${TOTAL_QUESTIONS})`);
            } catch (error) {
                console.log(`❌ Error processing valid question: ${error.message}`);
            }
        });
        // Process corrected questions with strict verification
        verificationResult.corrected.forEach((q) => {
            try {
                let correctAnswer = q.correctAnswer;
                if (typeof correctAnswer === 'string') correctAnswer = Number(correctAnswer);
                
                if (typeof correctAnswer !== 'number' || isNaN(correctAnswer) || 
                    correctAnswer < 0 || correctAnswer >= 4) {
                    console.log(`❌ Corrected question has invalid correctAnswer index: ${correctAnswer}`);
                    return;
                }

                // Check for duplicate options
                if (hasDuplicateOptions(q)) {
                    console.log(`❌ Corrected question has duplicate options - skipped`);
                    return;
                }

                // FIRST: Apply rule-based validation
                const ruleValidation = validateQuestionByRule(q);
                if (!ruleValidation.isValid) {
                    console.error(`\n❌❌❌ CRITICAL ERROR - Corrected Question REJECTED ❌❌❌`);
                    console.error(`   Question: ${q.question?.substring(0, 100)}...`);
                    console.error(`   Rule Validation Error: ${ruleValidation.error}`);
                    console.error(`   Options: ${JSON.stringify(q.options)}`);
                    console.error(`   This corrected question is INVALID and will be REJECTED.\n`);
                    return; // Skip this question
                }
                
                // CRITICAL: Final verification - ensure corrected correctAnswer index actually points to correct option
                if (q.finalAnswer) {
                    const finalAnswer = String(q.finalAnswer).trim();
                    const cleanFinal = finalAnswer
                        .replace(/,/g, '')        // remove commas (CRITICAL)
                        .replace(/^\$+|\$+$/g, '')
                        .replace(/\\+/g, '')
                        .replace(/\s+/g, '')
                        .trim();
                    
                    // Search ALL options to see if the answer exists anywhere
                    let answerFoundInOptions = false;
                    let answerIndex = -1;
                    
                    const finalFrac = parseFraction(finalAnswer);
                    
                    q.options.forEach((opt, idx) => {
                        if (answerFoundInOptions) return; // Already found
                        
                        // Check fraction equivalence first
                        if (finalFrac) {
                            const optFrac = parseFraction(opt);
                            if (optFrac && fractionsEqual(finalFrac, optFrac)) {
                                answerFoundInOptions = true;
                                answerIndex = idx;
                                return;
                            }
                        }
                        
                        // Check numeric equivalence
                        const finalNum = normalizeNumber(finalAnswer);
                        const optNum = normalizeNumber(opt);
                        
                        if (finalNum !== null && optNum !== null) {
                            if (Math.abs(finalNum - optNum) < 0.001) {
                                answerFoundInOptions = true;
                                answerIndex = idx;
                                return;
                            }
                        }
                        
                        // Fallback: String matching
                        const cleanOpt = String(opt)
                            .replace(/,/g, '')        // remove commas (CRITICAL)
                            .replace(/^\$+|\$+$/g, '')
                            .replace(/\\+/g, '')
                            .replace(/\s+/g, '')
                            .trim();
                        const isMatch = cleanOpt.includes(cleanFinal) || 
                                      cleanFinal.includes(cleanOpt) || 
                                      cleanOpt === cleanFinal ||
                                      cleanOpt.toLowerCase() === cleanFinal.toLowerCase();
                        
                        if (isMatch && !answerFoundInOptions) {
                            answerFoundInOptions = true;
                            answerIndex = idx;
                        }
                    });
                    
                    // If answer doesn't exist in ANY option, REJECT immediately
                    if (!answerFoundInOptions) {
                        console.error(`\n❌❌❌ CRITICAL: Corrected Question REJECTED - Correct answer NOT in any option ❌❌❌`);
                        console.error(`   Question: "${q.question?.substring(0, 80)}..."`);
                        console.error(`   finalAnswer: "${cleanFinal}"`);
                        console.error(`   Options:`);
                        q.options.forEach((opt, idx) => {
                            console.error(`     [${idx}] "${opt}"`);
                        });
                        console.error(`   NONE of the corrected options contain the correct answer!`);
                        console.error(`   This corrected question is INVALID and will be REJECTED.\n`);
                        return; // REJECT - answer not in any option
                    }
                    
                    // Answer exists in options - verify correctAnswer index points to it
                    const markedOption = String(q.options[correctAnswer]).trim();
                    const cleanMarked = markedOption
                        .replace(/,/g, '')        // remove commas (CRITICAL)
                        .replace(/^\$+|\$+$/g, '')
                        .replace(/\\+/g, '')
                        .replace(/\s+/g, '')
                        .trim();
                    
                    // Check fraction equivalence
                    const markedFrac = parseFraction(markedOption);
                    const finalFracCheck = parseFraction(finalAnswer);
                    let isMatch = false;
                    
                    if (finalFracCheck && markedFrac) {
                        isMatch = fractionsEqual(finalFracCheck, markedFrac);
                    } else {
                        // Check numeric equivalence
                        const markedNum = normalizeNumber(markedOption);
                        const finalNumCheck = normalizeNumber(finalAnswer);
                        
                        if (finalNumCheck !== null && markedNum !== null) {
                            isMatch = Math.abs(finalNumCheck - markedNum) < 0.001;
                        } else {
                            // Fallback: String matching
                            isMatch = cleanMarked.includes(cleanFinal) || 
                                      cleanFinal.includes(cleanMarked) ||
                                      cleanMarked === cleanFinal ||
                                      cleanMarked.toLowerCase() === cleanFinal.toLowerCase();
                        }
                    }
                    
                    if (!isMatch) {
                        // Answer exists but at wrong index - fix it
                        console.log(`⚠️ Q${questionsToSave.length + 1}: Corrected question index wrong. Marked: ${correctAnswer}="${cleanMarked}", Should be: ${answerIndex}="${q.options[answerIndex]}". Fixing...`);
                        correctAnswer = answerIndex;
                        q.correctAnswer = answerIndex;
                        q.finalAnswer = q.options[answerIndex];
                    }
                } else {
                    console.warn(`⚠️ Q${questionsToSave.length + 1}: No finalAnswer in corrected question - REJECTED`);
                    return;
                }
                
                // ADDITIONAL SAFETY CHECK: Verify the marked option is actually reasonable
                const markedOpt = String(q.options[correctAnswer]).trim();
                if (!markedOpt || markedOpt.length === 0) {
                    console.error(`❌ Q${questionsToSave.length + 1}: Marked option is empty in corrected question - REJECTED`);
                    return;
                }

                // Convert currency symbols: $ → Rs (for Indian context)
                const isLatex = q.latex || false;
                const convertedQuestion = convertCurrency(String(q.question), isLatex);
                const convertedOptions = q.options.map(opt => convertCurrency(String(opt), isLatex));

                // Enhanced LaTeX detection and fixing
                const latexPattern = /\\frac|\\sqrt|\\times|\\div|\\pm|\\cdot|\\pi|\\theta|\\alpha|\\beta|\\gamma|\\delta|\\sum|\\int|\\lim|\\infty|\$.*?\$|\\?\(.*?\\?\)/;
                const hasLatexInQuestion = latexPattern.test(convertedQuestion);
                const hasLatexInOptions = convertedOptions.some(opt => latexPattern.test(String(opt)));
                
                let finalQuestion = convertedQuestion;
                let finalOptions = convertedOptions;
                let finalLatex = isLatex || hasLatexInQuestion || hasLatexInOptions;
                
                if (finalLatex) {
                    // Auto-wrap LaTeX expressions that aren't wrapped
                    finalQuestion = wrapLatexExpressions(convertedQuestion);
                    finalOptions = convertedOptions.map(opt => wrapLatexExpressions(String(opt)));
                }
                
                const questionData = {
                    question: finalQuestion,
                    options: finalOptions,
                    correctAnswer: correctAnswer,
                    finalAnswer: String(q.finalAnswer || q.options[correctAnswer]),
                    difficulty: q.difficulty || 'medium',
                    classLevel: parseInt(classLevel),
                    topicName: String(topicName),
                    concept: concept || undefined,
                    tag: String(tag),
                    latex: finalLatex,
                    status: 'pending',
                    generationBatch: batchId,
                    type: type,
                    subjectId: subjectId || null
                };
                
                questionsToSave.push(questionData);
                console.log(`🔧 CORRECTED & ACCEPTED (${questionsToSave.length}/${TOTAL_QUESTIONS})`);
            } catch (error) {
                console.log(`❌ Error processing corrected question: ${error.message}`);
            }
        });
        
        console.log(`\n✅ Step 4 Complete: Accepted ${questionsToSave.length} questions (Total: ${questionsToSave.length})`);
        // Final duplicate check - check DB before saving each question
        // Check against ALL questions with the same tag (regardless of classLevel or topicName)
        console.log(`\n🔍 Final duplicate check: Checking ${questionsToSave.length} questions against DB...`);
        const finalQuestions = [];
        for (const q of questionsToSave) {
            // Normalize question for comparison
            const normalizedQuestion = q.question
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.,!?;:]/g, '')
                .trim();
            
            // First check: Use the Set we already built (fast lookup)
            if (existingQuestionTexts.has(normalizedQuestion)) {
                console.log(`❌ Final check: Duplicate with existing question in DB: "${q.question.substring(0, 50)}..."`);
                // Find which existing question it matches
                const matchingQuestion = existingQuestionDetails.find(existing => {
                    const existingNormalized = existing.text.toLowerCase()
                        .replace(/\s+/g, ' ')
                        .replace(/[.,!?;:]/g, '')
                        .trim();
                    return existingNormalized === normalizedQuestion;
                });
                if (matchingQuestion) {
                    console.log(`   → Matches existing: [Class ${matchingQuestion.classLevel}, ${matchingQuestion.topicName}]`);
                }
                continue; // Skip this question
            }
            
            // Second check: Double-check with DB query (for any edge cases)
            // Check for exact duplicate with same tag (regardless of classLevel or topicName)
            const existing = await Question.findOne({
                tag: q.tag,  // Only filter by tag - check ALL questions with this tag
                $or: [
                    // Exact match (case-insensitive)
                    { 
                        question: { $regex: new RegExp(`^${q.question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                    },
                    // Normalized match
                    {
                        question: { 
                            $regex: new RegExp(`^${normalizedQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
                        }
                    }
                ]
            });
            
            if (!existing) {
                // Double-check answer correctness before adding
                const answerCheck = verifyMathematicalAnswer(q);
                if (answerCheck.isValid) {
                    finalQuestions.push(q);
                    // Add to Set to prevent duplicates within this batch
                    existingQuestionTexts.add(normalizedQuestion);
                } else {
                    console.log(`❌ Skipping question due to answer verification failure: ${answerCheck.error}`);
                }
            } else {
                console.log(`❌ Final DB check: Duplicate found: "${q.question.substring(0, 50)}..." (Class ${existing.classLevel}, ${existing.topicName})`);
            }
        }
        
        console.log(`✅ Final check complete: ${finalQuestions.length}/${questionsToSave.length} questions passed duplicate check`);
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
        const { tag, classLevel, topicName, status, type, subjectId, deleteAll } = req.body;
        
        // Special flag to delete all questions (requires explicit confirmation)
        if (deleteAll === true || deleteAll === 'true') {
            const totalCount = await Question.countDocuments();
            if (totalCount === 0) {
                return res.json({ 
                    success: true, 
                    message: 'No questions to delete', 
                    data: { deleted: 0, total: 0 } 
                });
            }
            
            const pendingCount = await Question.countDocuments({ status: 'pending' });
            const approvedCount = await Question.countDocuments({ status: 'approved' });
            const rejectedCount = await Question.countDocuments({ status: 'rejected' });
            
            const result = await Question.deleteMany({});
            
            return res.json({ 
                success: true, 
                message: `Deleted all ${result.deletedCount} questions`, 
                data: { 
                    deleted: result.deletedCount, 
                    total: totalCount,
                    breakdown: {
                        pending: pendingCount,
                        approved: approvedCount,
                        rejected: rejectedCount
                    }
                } 
            });
        }
        
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
                message: 'At least one filter parameter is required to prevent accidental deletion of all questions. Use deleteAll: true to delete all questions.' 
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

// Delete ALL questions (requires explicit confirmation)
const deleteAllQuestions = async (req, res) => {
    try {
        const { confirm } = req.body;
        
        // Require explicit confirmation
        if (confirm !== true && confirm !== 'true') {
            return res.status(400).json({ 
                success: false, 
                message: 'This will delete ALL questions. Set confirm: true in request body to proceed.' 
            });
        }
        
        const totalCount = await Question.countDocuments();
        
        if (totalCount === 0) {
            return res.json({ 
                success: true, 
                message: 'No questions to delete', 
                data: { deleted: 0, total: 0 } 
            });
        }
        
        // Show breakdown before deletion
        const pendingCount = await Question.countDocuments({ status: 'pending' });
        const approvedCount = await Question.countDocuments({ status: 'approved' });
        const rejectedCount = await Question.countDocuments({ status: 'rejected' });
        
        const result = await Question.deleteMany({});
        
        res.json({ 
            success: true, 
            message: `Deleted all ${result.deletedCount} questions`, 
            data: { 
                deleted: result.deletedCount, 
                total: totalCount,
                breakdown: {
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount
                }
            } 
        });
    } catch (error) {
        console.error('Delete all questions error:', error);
        res.status(500).json({ success: false, message: 'Error deleting all questions', error: error.message });
    }
};

// ============================================================================
// QUESTION RETRIEVAL APIs (Shared by User and Admin)
// ============================================================================

// API 1: Get questions by tag and class
const getQuestionsByTagAndClass = async (req, res) => {
    try {
        const { tag, classLevel } = req.query;
        
        if (!tag || !classLevel) {
            return res.status(400).json({ 
                success: false, 
                message: 'tag and classLevel are required' 
            });
        }
        
        const query = {
            tag: tag,
            classLevel: parseInt(classLevel),
            status: 'approved' // Only return approved questions
        };
        
        const questions = await Question.find(query)
            .select('-approvedBy -rejectedBy -rejectedAt -rejectionReason -generationBatch')
            .sort({ createdAt: -1 })
            .lean();
        
        res.json({
            success: true,
            data: {
                questions,
                count: questions.length,
                tag,
                classLevel: parseInt(classLevel)
            }
        });
    } catch (error) {
        console.error('Get questions by tag and class error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching questions', 
            error: error.message 
        });
    }
};

// API 2: Get random questions by class, topic, type, and number (equal distribution across tags)
const getRandomQuestionsByTopic = async (req, res) => {
    try {
        const { classLevel, topicName, type, numberOfQuestions } = req.query;
        
        if (!classLevel || !topicName || !type || !numberOfQuestions) {
            return res.status(400).json({ 
                success: false, 
                message: 'classLevel, topicName, type, and numberOfQuestions are required' 
            });
        }
        
        const numQuestions = parseInt(numberOfQuestions);
        if (isNaN(numQuestions) || numQuestions <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'numberOfQuestions must be a positive number' 
            });
        }
        
        // Build base query
        const baseQuery = {
            classLevel: parseInt(classLevel),
            topicName: topicName,
            type: type,
            status: 'approved'
        };
        
        // Get all unique tags for this topic, class, and type
        const tags = await Question.distinct('tag', baseQuery);
        
        if (tags.length === 0) {
            return res.json({
                success: true,
                data: {
                    questions: [],
                    count: 0,
                    message: `No approved questions found for Class ${classLevel}, Topic: ${topicName}, Type: ${type}`
                }
            });
        }
        
        // Calculate questions per tag (equal distribution)
        const questionsPerTag = Math.floor(numQuestions / tags.length);
        const remainder = numQuestions % tags.length;
        
        const selectedQuestions = [];
        const tagStats = {};
        
        // Get questions from each tag
        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];
            const countForThisTag = questionsPerTag + (i < remainder ? 1 : 0);
            
            // Get all questions for this tag
            const tagQuestions = await Question.find({
                ...baseQuery,
                tag: tag
            }).select('-approvedBy -rejectedBy -rejectedAt -rejectionReason -generationBatch').lean();
            
            // Randomly select questions from this tag
            const shuffled = tagQuestions.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, countForThisTag);
            
            selectedQuestions.push(...selected);
            tagStats[tag] = {
                available: tagQuestions.length,
                selected: selected.length,
                requested: countForThisTag
            };
        }
        
        // Shuffle final questions to randomize order
        const finalQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
        
        res.json({
            success: true,
            data: {
                questions: finalQuestions,
                count: finalQuestions.length,
                requested: numQuestions,
                classLevel: parseInt(classLevel),
                topicName: topicName,
                type: type,
                tagDistribution: tagStats,
                totalTags: tags.length
            }
        });
    } catch (error) {
        console.error('Get random questions by topic error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching questions', 
            error: error.message 
        });
    }
};

// API 3: Get questions by class, type, and number (equal distribution across topics, then tags)
const getQuestionsByClassAndType = async (req, res) => {
    try {
        const { classLevel, type, numberOfQuestions } = req.query;
        
        if (!classLevel || !type || !numberOfQuestions) {
            return res.status(400).json({ 
                success: false, 
                message: 'classLevel, type, and numberOfQuestions are required' 
            });
        }
        
        const numQuestions = parseInt(numberOfQuestions);
        if (isNaN(numQuestions) || numQuestions <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'numberOfQuestions must be a positive number' 
            });
        }
        
        // Build base query
        const baseQuery = {
            classLevel: parseInt(classLevel),
            type: type,
            status: 'approved'
        };
        
        // Get all unique topics for this class and type
        const topics = await Question.distinct('topicName', baseQuery);
        
        if (topics.length === 0) {
            return res.json({
                success: true,
                data: {
                    questions: [],
                    count: 0,
                    message: `No approved questions found for Class ${classLevel}, Type: ${type}`
                }
            });
        }
        
        // Calculate questions per topic (equal distribution)
        const questionsPerTopic = Math.floor(numQuestions / topics.length);
        const remainder = numQuestions % topics.length;
        
        const selectedQuestions = [];
        const topicStats = {};
        
        // Get questions from each topic
        for (let i = 0; i < topics.length; i++) {
            const topicName = topics[i];
            const countForThisTopic = questionsPerTopic + (i < remainder ? 1 : 0);
            
            // Get all unique tags for this topic
            const tags = await Question.distinct('tag', {
                ...baseQuery,
                topicName: topicName
            });
            
            if (tags.length === 0) continue;
            
            // Calculate questions per tag within this topic
            const questionsPerTag = Math.floor(countForThisTopic / tags.length);
            const tagRemainder = countForThisTopic % tags.length;
            
            const topicQuestions = [];
            const tagStatsForTopic = {};
            
            // Get questions from each tag in this topic
            for (let j = 0; j < tags.length; j++) {
                const tag = tags[j];
                const countForThisTag = questionsPerTag + (j < tagRemainder ? 1 : 0);
                
                // Get all questions for this tag
                const tagQuestions = await Question.find({
                    ...baseQuery,
                    topicName: topicName,
                    tag: tag
                }).select('-approvedBy -rejectedBy -rejectedAt -rejectionReason -generationBatch').lean();
                
                // Randomly select questions from this tag
                const shuffled = tagQuestions.sort(() => Math.random() - 0.5);
                const selected = shuffled.slice(0, countForThisTag);
                
                topicQuestions.push(...selected);
                tagStatsForTopic[tag] = {
                    available: tagQuestions.length,
                    selected: selected.length,
                    requested: countForThisTag
                };
            }
            
            selectedQuestions.push(...topicQuestions);
            topicStats[topicName] = {
                questionsSelected: topicQuestions.length,
                requested: countForThisTopic,
                tags: tagStatsForTopic,
                totalTags: tags.length
            };
        }
        
        // Shuffle final questions to randomize order
        const finalQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
        
        res.json({
            success: true,
            data: {
                questions: finalQuestions,
                count: finalQuestions.length,
                requested: numQuestions,
                classLevel: parseInt(classLevel),
                type: type,
                topicDistribution: topicStats,
                totalTopics: topics.length
            }
        });
    } catch (error) {
        console.error('Get questions by class and type error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching questions', 
            error: error.message 
        });
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
    deleteAllQuestionsByFilter,
    deleteAllQuestions,
    getQuestionsByTagAndClass,
    getRandomQuestionsByTopic,
    getQuestionsByClassAndType
};

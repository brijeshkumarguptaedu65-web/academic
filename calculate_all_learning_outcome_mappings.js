const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const LearningOutcome = require('./models/LearningOutcome');
const { calculateAndSaveLearningOutcomeMapping } = require('./controllers/adminCurriculumController');

const calculateAllMappings = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        console.log('\n=== Calculating Learning Outcome Mappings ===\n');

        // Get all learning outcomes
        const learningOutcomes = await LearningOutcome.find({})
            .populate('classId', 'name level')
            .populate('subjectId', 'name')
            .sort({ 'classId.level': 1, createdAt: -1 });

        console.log(`Found ${learningOutcomes.length} learning outcomes\n`);

        if (learningOutcomes.length === 0) {
            console.log('No learning outcomes found. Nothing to calculate.');
            process.exit(0);
        }

        let successCount = 0;
        let errorCount = 0;
        let totalMappings = 0;

        // Calculate mappings for each learning outcome
        for (let i = 0; i < learningOutcomes.length; i++) {
            const outcome = learningOutcomes[i];
            try {
                console.log(`[${i + 1}/${learningOutcomes.length}] Calculating mapping for: ${outcome.text.substring(0, 50)}... (Class ${outcome.classId.level})`);
                
                const mapping = await calculateAndSaveLearningOutcomeMapping(outcome._id);
                const mappingCount = mapping.mappedLearningOutcomes?.length || 0;
                totalMappings += mappingCount;
                
                if (mappingCount > 0) {
                    console.log(`  ✓ Found ${mappingCount} mappings`);
                } else {
                    console.log(`  ⊘ No mappings found (may need other learning outcomes in different classes)`);
                }
                
                successCount++;
                
                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error(`  ✗ Error: ${err.message}`);
                errorCount++;
            }
        }

        console.log('\n=== Summary ===');
        console.log(`Total Learning Outcomes: ${learningOutcomes.length}`);
        console.log(`Successfully Calculated: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Total Mappings Created: ${totalMappings}`);

        console.log('\n✅ Calculation Complete!');
        process.exit(0);

    } catch (err) {
        console.error('Error calculating mappings:', err);
        process.exit(1);
    }
};

// Run the script
calculateAllMappings();

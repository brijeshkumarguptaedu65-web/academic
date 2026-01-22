const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const LearningOutcome = require('./models/LearningOutcome');
const CurriculumMapping = require('./models/CurriculumMapping');
const LearningOutcomeMapping = require('./models/LearningOutcomeMapping');
const LearningOutcomeRemedial = require('./models/LearningOutcomeRemedial');

const removeAllLearningOutcomes = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        console.log('\n=== Removing All Learning Outcome Data ===\n');

        // 1. Get count of learning outcomes
        const learningOutcomeCount = await LearningOutcome.countDocuments();
        console.log(`Found ${learningOutcomeCount} learning outcomes`);

        // 2. Get all learning outcome IDs
        const learningOutcomeIds = await LearningOutcome.find({}).select('_id');
        const ids = learningOutcomeIds.map(lo => lo._id);

        if (ids.length === 0) {
            console.log('No learning outcomes found. Nothing to delete.');
            process.exit(0);
        }

        // 3. Delete curriculum mappings
        const curriculumMappingCount = await CurriculumMapping.countDocuments({
            learningOutcomeId: { $in: ids }
        });
        console.log(`Found ${curriculumMappingCount} curriculum mappings`);
        
        if (curriculumMappingCount > 0) {
            const curriculumResult = await CurriculumMapping.deleteMany({
                learningOutcomeId: { $in: ids }
            });
            console.log(`✓ Deleted ${curriculumResult.deletedCount} curriculum mappings`);
        }

        // 4. Delete learning outcome to learning outcome mappings
        const learningOutcomeMappingCount = await LearningOutcomeMapping.countDocuments({
            learningOutcomeId: { $in: ids }
        });
        console.log(`Found ${learningOutcomeMappingCount} learning outcome mappings`);
        
        if (learningOutcomeMappingCount > 0) {
            const mappingResult = await LearningOutcomeMapping.deleteMany({
                learningOutcomeId: { $in: ids }
            });
            console.log(`✓ Deleted ${mappingResult.deletedCount} learning outcome mappings`);
        }

        // Also delete mappings where these outcomes are referenced
        const referencedMappingCount = await LearningOutcomeMapping.countDocuments({
            'mappedLearningOutcomes.mappedLearningOutcomeId': { $in: ids }
        });
        if (referencedMappingCount > 0) {
            await LearningOutcomeMapping.updateMany(
                {},
                { $pull: { mappedLearningOutcomes: { mappedLearningOutcomeId: { $in: ids } } } }
            );
            console.log(`✓ Removed references from ${referencedMappingCount} learning outcome mappings`);
        }

        // 5. Delete learning outcome remedials
        const remedialCount = await LearningOutcomeRemedial.countDocuments({
            learningOutcomeId: { $in: ids }
        });
        console.log(`Found ${remedialCount} learning outcome remedials`);
        
        if (remedialCount > 0) {
            const remedialResult = await LearningOutcomeRemedial.deleteMany({
                learningOutcomeId: { $in: ids }
            });
            console.log(`✓ Deleted ${remedialResult.deletedCount} learning outcome remedials`);
        }

        // 6. Delete all learning outcomes
        const learningOutcomeResult = await LearningOutcome.deleteMany({});
        console.log(`✓ Deleted ${learningOutcomeResult.deletedCount} learning outcomes`);

        console.log('\n=== Summary ===');
        console.log(`Learning Outcomes Deleted: ${learningOutcomeResult.deletedCount}`);
        console.log(`Curriculum Mappings Deleted: ${curriculumMappingCount}`);
        console.log(`Learning Outcome Mappings Deleted: ${learningOutcomeMappingCount}`);
        console.log(`Remedials Deleted: ${remedialCount}`);
        console.log(`Total Records Deleted: ${learningOutcomeResult.deletedCount + curriculumMappingCount + learningOutcomeMappingCount + remedialCount}`);

        console.log('\n✅ All learning outcome data removed successfully!');
        process.exit(0);

    } catch (err) {
        console.error('Error removing learning outcomes:', err);
        process.exit(1);
    }
};

// Run the script
removeAllLearningOutcomes();

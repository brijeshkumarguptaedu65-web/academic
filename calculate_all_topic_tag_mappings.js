const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const LearningOutcome = require('./models/LearningOutcome');
const { calculateAndSaveTopicTagMappings } = require('./controllers/adminCurriculumController');

const calculateAllTopicTagMappings = async () => {
    try {
        await connectDB();
        console.log('Connected to database\n');

        console.log('=== Calculating Topic Tag Mappings for All Topics ===\n');

        // Get all unique topics with their type and subjectId
        const topics = await LearningOutcome.aggregate([
            {
                $match: {
                    topicName: { $exists: true, $ne: null, $ne: '' }
                }
            },
            {
                $group: {
                    _id: {
                        topicName: '$topicName',
                        type: '$type',
                        subjectId: '$subjectId'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.topicName': 1 }
            }
        ]);

        console.log(`Found ${topics.length} unique topics to process\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            const topicName = topic._id.topicName;
            const type = topic._id.type;
            const subjectId = topic._id.subjectId;

            console.log(`\n[${i + 1}/${topics.length}] Processing: "${topicName}"`);
            console.log(`   Type: ${type}, SubjectId: ${subjectId || 'N/A'}, Learning Outcomes: ${topic.count}`);

            try {
                await calculateAndSaveTopicTagMappings(topicName, type, subjectId);
                successCount++;
                console.log(`   ✓ Success`);
            } catch (err) {
                errorCount++;
                console.error(`   ✗ Error:`, err.message);
            }
        }

        console.log(`\n\n=== Summary ===`);
        console.log(`Total Topics: ${topics.length}`);
        console.log(`Successfully Calculated: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log('\n✅ Calculation Complete!');
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

calculateAllTopicTagMappings();

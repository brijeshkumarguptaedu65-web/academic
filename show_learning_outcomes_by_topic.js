const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import all required models
const LearningOutcome = require('./models/LearningOutcome');
const { Class, Subject } = require('./models/Metadata'); // This registers the models

const showLearningOutcomesByTopic = async () => {
    try {
        // Check if MONGO_URI is set
        if (!process.env.MONGO_URI) {
            console.error('Error: MONGO_URI is not set in environment variables.');
            console.error('Please set MONGO_URI in your .env file or environment.');
            process.exit(1);
        }
        
        await connectDB();
        console.log('Connected to database\n');

        console.log('=== Learning Outcomes Grouped by Topic ===\n');

        // Get all learning outcomes
        const outcomes = await LearningOutcome.find({})
            .populate('classId', 'name level')
            .populate('subjectId', 'name')
            .sort({ 'classId.level': 1, topicName: 1, createdAt: 1 })
            .lean();

        // Filter out outcomes with null classId
        const validOutcomes = outcomes.filter(o => {
            if (!o || !o.classId || o.classId.level === null || o.classId.level === undefined) {
                console.warn(`⚠️  Skipping outcome ${o?._id} - invalid classId`);
                return false;
            }
            return true;
        });

        console.log(`Total Learning Outcomes: ${validOutcomes.length}\n`);

        // Group by topic
        const groupedByTopic = {};

        validOutcomes.forEach(outcome => {
            const topic = outcome.topicName || 'No Topic';
            const classLevel = outcome.classId?.level || 'Unknown';
            const className = outcome.classId?.name || `Class ${classLevel}`;
            const subjectName = outcome.subjectId?.name || 'Unknown Subject';

            if (!groupedByTopic[topic]) {
                groupedByTopic[topic] = [];
            }

            groupedByTopic[topic].push({
                id: outcome._id.toString(),
                text: outcome.text,
                classLevel: classLevel,
                className: className,
                subjectName: subjectName,
                type: outcome.type,
                tags: outcome.text ? outcome.text.split(',').map(t => t.trim()) : []
            });
        });

        // Display grouped by topic
        const topics = Object.keys(groupedByTopic).sort();

        topics.forEach((topic, topicIdx) => {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`📚 TOPIC ${topicIdx + 1}: ${topic}`);
            console.log(`${'='.repeat(80)}`);

            const topicOutcomes = groupedByTopic[topic];

            // Group by class within topic
            const byClass = {};
            topicOutcomes.forEach(outcome => {
                const classKey = `${outcome.className} (Level ${outcome.classLevel})`;
                if (!byClass[classKey]) {
                    byClass[classKey] = [];
                }
                byClass[classKey].push(outcome);
            });

            const classes = Object.keys(byClass).sort((a, b) => {
                const levelA = parseInt(a.match(/Level (\d+)/)?.[1] || '0');
                const levelB = parseInt(b.match(/Level (\d+)/)?.[1] || '0');
                return levelA - levelB;
            });

            classes.forEach((className, classIdx) => {
                console.log(`\n  📖 ${className}`);
                console.log(`  ${'-'.repeat(76)}`);

                byClass[className].forEach((outcome, outcomeIdx) => {
                    console.log(`\n    [${outcomeIdx + 1}] ID: ${outcome.id}`);
                    console.log(`        Text: ${outcome.text}`);
                    console.log(`        Type: ${outcome.type}`);
                    console.log(`        Subject: ${outcome.subjectName}`);
                    console.log(`        Tags (${outcome.tags.length}):`);
                    outcome.tags.forEach((tag, tagIdx) => {
                        console.log(`          ${tagIdx + 1}. ${tag}`);
                    });
                });
            });

            console.log(`\n  Total in this topic: ${topicOutcomes.length} learning outcomes`);
        });

        // Summary
        console.log(`\n\n${'='.repeat(80)}`);
        console.log('📊 SUMMARY');
        console.log(`${'='.repeat(80)}`);
        console.log(`Total Topics: ${topics.length}`);
        console.log(`Total Learning Outcomes: ${validOutcomes.length}`);
        console.log(`Skipped (null classId): ${outcomes.length - validOutcomes.length}`);

        topics.forEach(topic => {
            console.log(`  - ${topic}: ${groupedByTopic[topic].length} outcomes`);
        });

        console.log('\n✅ Display Complete!');
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

showLearningOutcomesByTopic();

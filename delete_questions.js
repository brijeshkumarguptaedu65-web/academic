/**
 * Script to delete questions from the database
 * Usage: node delete_questions.js [options]
 * 
 * Options:
 *   --all              Delete all questions
 *   --status=<status>  Delete questions by status (pending, approved, rejected)
 *   --tag=<tag>        Delete questions by tag
 *   --class=<level>     Delete questions by class level
 *   --topic=<topic>    Delete questions by topic name
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
};

const deleteQuestions = async () => {
    await connectDB();
    
    const args = process.argv.slice(2);
    const query = {};
    
    // Parse command line arguments
    args.forEach(arg => {
        if (arg === '--all') {
            // Will delete all questions
        } else if (arg.startsWith('--status=')) {
            query.status = arg.split('=')[1];
        } else if (arg.startsWith('--tag=')) {
            query.tag = arg.split('=')[1];
        } else if (arg.startsWith('--class=')) {
            query.classLevel = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--topic=')) {
            query.topicName = arg.split('=')[1];
        }
    });
    
    // Safety check: prevent accidental deletion of all questions
    if (Object.keys(query).length === 0 && !args.includes('--all')) {
        console.log('❌ Error: No filter specified. Use --all to delete all questions, or specify filters.');
        console.log('\nUsage examples:');
        console.log('  node delete_questions.js --status=pending');
        console.log('  node delete_questions.js --tag="Adds two- and three-digit numbers" --class=3');
        console.log('  node delete_questions.js --all');
        process.exit(1);
    }
    
    // Count questions to be deleted
    const count = await Question.countDocuments(query);
    console.log(`\n📊 Found ${count} question(s) matching criteria:`, query);
    
    if (count === 0) {
        console.log('✅ No questions to delete.');
        await mongoose.connection.close();
        process.exit(0);
    }
    
    // Show sample questions
    const sampleQuestions = await Question.find(query).limit(5).select('question tag classLevel status');
    console.log('\n📝 Sample questions to be deleted:');
    sampleQuestions.forEach((q, idx) => {
        console.log(`   ${idx + 1}. [${q.status}] Class ${q.classLevel} - ${q.tag.substring(0, 50)}...`);
    });
    
    if (count > 5) {
        console.log(`   ... and ${count - 5} more`);
    }
    
    // Confirm deletion
    console.log(`\n⚠️  WARNING: This will delete ${count} question(s).`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete questions
    console.log('\n🗑️  Deleting questions...');
    const result = await Question.deleteMany(query);
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} question(s)!`);
    
    await mongoose.connection.close();
    process.exit(0);
};

// Run the script
deleteQuestions().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

/**
 * Simple script to delete ALL questions from MongoDB
 * Usage: node delete_all_questions_simple.js "mongodb://your-connection-string"
 * Or: MONGO_URI="mongodb://..." node delete_all_questions_simple.js
 */

const mongoose = require('mongoose');
const Question = require('./models/Question');

// Get MongoDB URI from command line argument or environment variable
const mongoUri = process.argv[2] || process.env.MONGO_URI;

if (!mongoUri) {
    console.error('❌ Error: MongoDB URI is required');
    console.error('\nUsage:');
    console.error('   node delete_all_questions_simple.js "mongodb://your-connection-string"');
    console.error('   OR');
    console.error('   MONGO_URI="mongodb://..." node delete_all_questions_simple.js');
    process.exit(1);
}

const deleteAllQuestions = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected\n');
        
        // Count total questions
        const totalCount = await Question.countDocuments();
        console.log(`📊 Total questions in database: ${totalCount}`);
        
        if (totalCount === 0) {
            console.log('✅ No questions to delete.');
            await mongoose.connection.close();
            process.exit(0);
        }
        
        // Show breakdown by status
        const pendingCount = await Question.countDocuments({ status: 'pending' });
        const approvedCount = await Question.countDocuments({ status: 'approved' });
        const rejectedCount = await Question.countDocuments({ status: 'rejected' });
        
        console.log('\n📋 Breakdown by status:');
        console.log(`   - Pending: ${pendingCount}`);
        console.log(`   - Approved: ${approvedCount}`);
        console.log(`   - Rejected: ${rejectedCount}`);
        
        // Show sample questions
        const sampleQuestions = await Question.find().limit(3).select('question tag classLevel status');
        if (sampleQuestions.length > 0) {
            console.log('\n📝 Sample questions:');
            sampleQuestions.forEach((q, idx) => {
                console.log(`   ${idx + 1}. [${q.status}] Class ${q.classLevel} - ${q.tag.substring(0, 40)}...`);
            });
        }
        
        // Warning
        console.log(`\n⚠️  WARNING: This will delete ALL ${totalCount} question(s)!`);
        console.log('⚠️  This action cannot be undone!');
        console.log('\n⏳ Starting deletion in 3 seconds... Press Ctrl+C to cancel\n');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Delete all questions
        console.log('🗑️  Deleting all questions...');
        const result = await Question.deleteMany({});
        
        console.log(`\n✅ Successfully deleted ${result.deletedCount} question(s)!`);
        
        // Verify deletion
        const remainingCount = await Question.countDocuments();
        console.log(`✅ Verification: ${remainingCount} questions remaining in database`);
        
        await mongoose.connection.close();
        console.log('\n✅ Done! Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.message.includes('authentication')) {
            console.error('   Check your MongoDB connection string credentials');
        }
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Run the script
deleteAllQuestions();

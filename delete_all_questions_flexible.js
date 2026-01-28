/**
 * Flexible script to delete ALL questions from the database
 * Usage options:
 *   1. node delete_all_questions_flexible.js
 *      (uses MONGO_URI from .env file)
 *   2. node delete_all_questions_flexible.js "mongodb://your-connection-string"
 *      (uses provided connection string)
 *   3. MONGO_URI="mongodb://..." node delete_all_questions_flexible.js
 *      (uses environment variable)
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Question = require('./models/Question');

// Load environment variables
dotenv.config();

// Get MongoDB URI from command line argument, environment variable, or .env file
const mongoUri = process.argv[2] || process.env.MONGO_URI;

if (!mongoUri) {
    console.error('❌ Error: MongoDB URI is required');
    console.error('\nUsage options:');
    console.error('   1. node delete_all_questions_flexible.js "mongodb://your-connection-string"');
    console.error('   2. MONGO_URI="mongodb://..." node delete_all_questions_flexible.js');
    console.error('   3. Ensure MONGO_URI is set in your .env file');
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
        const sampleQuestions = await Question.find().limit(5).select('question tag classLevel status');
        if (sampleQuestions.length > 0) {
            console.log('\n📝 Sample questions:');
            sampleQuestions.forEach((q, idx) => {
                console.log(`   ${idx + 1}. [${q.status}] Class ${q.classLevel} - ${q.tag?.substring(0, 50) || 'No tag'}...`);
            });
        }
        
        if (totalCount > 5) {
            console.log(`   ... and ${totalCount - 5} more`);
        }
        
        // Warning
        console.log(`\n⚠️  WARNING: This will delete ALL ${totalCount} question(s) from the database!`);
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
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.error('   Check your MongoDB connection string URL');
        }
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

// Run the script
deleteAllQuestions();

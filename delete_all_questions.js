/**
 * Script to delete ALL questions from the database
 * WARNING: This will delete ALL questions regardless of status
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Question = require('./models/Question');
const connectDB = require('./config/db');

// Load environment variables (same as server.js)
dotenv.config();

const deleteAllQuestions = async () => {
    try {
        await connectDB();
    } catch (err) {
        console.error(`❌ Connection Error: ${err.message}`);
        process.exit(1);
    }
    
    try {
        // Count total questions
        const totalCount = await Question.countDocuments();
        console.log(`\n📊 Total questions in database: ${totalCount}`);
        
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
        console.log('\n📝 Sample questions:');
        sampleQuestions.forEach((q, idx) => {
            console.log(`   ${idx + 1}. [${q.status}] Class ${q.classLevel} - ${q.tag.substring(0, 50)}...`);
        });
        
        if (totalCount > 5) {
            console.log(`   ... and ${totalCount - 5} more`);
        }
        
        // Warning
        console.log(`\n⚠️  WARNING: This will delete ALL ${totalCount} question(s) from the database!`);
        console.log('⚠️  This action cannot be undone!');
        console.log('\n⏳ Waiting 5 seconds... Press Ctrl+C to cancel');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Delete all questions
        console.log('\n🗑️  Deleting all questions...');
        const result = await Question.deleteMany({});
        
        console.log(`\n✅ Successfully deleted ${result.deletedCount} question(s)!`);
        
        // Verify deletion
        const remainingCount = await Question.countDocuments();
        console.log(`\n✅ Verification: ${remainingCount} questions remaining in database`);
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error deleting questions:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Run the script
deleteAllQuestions();

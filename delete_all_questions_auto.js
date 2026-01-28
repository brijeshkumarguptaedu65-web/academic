/**
 * Auto-delete all questions script
 * Tries multiple methods to delete all questions
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Question = require('./models/Question');
const axios = require('axios');

dotenv.config();

const deleteViaDatabase = async (mongoUri) => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected\n');
        
        const totalCount = await Question.countDocuments();
        console.log(`📊 Total questions in database: ${totalCount}`);
        
        if (totalCount === 0) {
            console.log('✅ No questions to delete.');
            await mongoose.connection.close();
            return { success: true, deleted: 0 };
        }
        
        // Show breakdown
        const pendingCount = await Question.countDocuments({ status: 'pending' });
        const approvedCount = await Question.countDocuments({ status: 'approved' });
        const rejectedCount = await Question.countDocuments({ status: 'rejected' });
        
        console.log('\n📋 Breakdown by status:');
        console.log(`   - Pending: ${pendingCount}`);
        console.log(`   - Approved: ${approvedCount}`);
        console.log(`   - Rejected: ${rejectedCount}`);
        
        console.log(`\n🗑️  Deleting all ${totalCount} questions...`);
        const result = await Question.deleteMany({});
        
        console.log(`\n✅ Successfully deleted ${result.deletedCount} question(s)!`);
        
        const remainingCount = await Question.countDocuments();
        console.log(`✅ Verification: ${remainingCount} questions remaining`);
        
        await mongoose.connection.close();
        return { success: true, deleted: result.deletedCount };
    } catch (error) {
        console.error('❌ Database deletion error:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        return { success: false, error: error.message };
    }
};

const deleteViaAPI = async (apiUrl, token) => {
    try {
        console.log(`🌐 Attempting API deletion at ${apiUrl}...`);
        const response = await axios.delete(`${apiUrl}/api/admin/questions/delete-all`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: { confirm: true },
            timeout: 30000
        });
        
        if (response.data.success) {
            console.log(`✅ API deletion successful: ${response.data.message}`);
            console.log(`   Deleted: ${response.data.data.deleted} questions`);
            return { success: true, deleted: response.data.data.deleted };
        }
        return { success: false, error: 'API returned unsuccessful response' };
    } catch (error) {
        if (error.response) {
            console.error(`❌ API error: ${error.response.status} - ${error.response.data?.message || error.message}`);
        } else {
            console.error(`❌ API error: ${error.message}`);
        }
        return { success: false, error: error.message };
    }
};

const main = async () => {
    console.log('🚀 Starting automatic question deletion...\n');
    
    // Method 1: Try database connection with MONGO_URI from env
    const mongoUri = process.env.MONGO_URI || process.argv[2];
    
    if (mongoUri) {
        console.log('📝 Method 1: Using database connection...');
        const result = await deleteViaDatabase(mongoUri);
        if (result.success) {
            console.log('\n✅ Deletion completed successfully via database!');
            process.exit(0);
        }
        console.log('\n⚠️  Database method failed, trying API method...\n');
    } else {
        console.log('⚠️  MONGO_URI not found, trying API method...\n');
    }
    
    // Method 2: Try API endpoint (if server is running)
    const apiUrl = process.env.API_URL || 'https://academic-7mkg.onrender.com';
    const adminToken = process.env.ADMIN_TOKEN || process.argv[3];
    
    if (adminToken) {
        console.log('📝 Method 2: Using API endpoint...');
        const result = await deleteViaAPI(apiUrl, adminToken);
        if (result.success) {
            console.log('\n✅ Deletion completed successfully via API!');
            process.exit(0);
        }
    } else {
        console.log('⚠️  ADMIN_TOKEN not found, skipping API method');
    }
    
    // If both methods failed
    console.log('\n❌ All methods failed. Please provide:');
    console.log('   1. MongoDB URI: node delete_all_questions_auto.js "mongodb://..."');
    console.log('   2. Or Admin Token: node delete_all_questions_auto.js "" "your-admin-token"');
    console.log('   3. Or both: node delete_all_questions_auto.js "mongodb://..." "admin-token"');
    process.exit(1);
};

main();

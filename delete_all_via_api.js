/**
 * Delete all questions via API endpoint
 * Usage: node delete_all_via_api.js [admin-token] [api-url]
 */

const axios = require('axios');

const main = async () => {
    const adminToken = process.argv[2] || process.env.ADMIN_TOKEN;
    const apiUrl = process.argv[3] || process.env.API_URL || 'https://academic-7mkg.onrender.com';
    
    if (!adminToken) {
        console.error('❌ Error: Admin token is required');
        console.error('\nUsage:');
        console.error('   node delete_all_via_api.js "your-admin-token"');
        console.error('   OR');
        console.error('   ADMIN_TOKEN="your-token" node delete_all_via_api.js');
        console.error('\nAlternative: Use delete-by-filter endpoint with deleteAll flag:');
        console.error(`   curl -X DELETE ${apiUrl}/api/admin/questions/delete-by-filter \\`);
        console.error('     -H "Authorization: Bearer YOUR_TOKEN" \\');
        console.error('     -H "Content-Type: application/json" \\');
        console.error('     -d \'{"deleteAll": true}\'');
        process.exit(1);
    }
    
    try {
        console.log(`🌐 Connecting to API: ${apiUrl}`);
        console.log('🗑️  Deleting all questions...\n');
        
        // Try the delete-all endpoint first
        try {
            const response = await axios.delete(`${apiUrl}/api/admin/questions/delete-all`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                data: { confirm: true },
                timeout: 30000
            });
            
            if (response.data.success) {
                console.log('✅ Success!');
                console.log(`   ${response.data.message}`);
                console.log(`   Deleted: ${response.data.data.deleted} questions`);
                if (response.data.data.breakdown) {
                    console.log(`   Breakdown:`);
                    console.log(`     - Pending: ${response.data.data.breakdown.pending}`);
                    console.log(`     - Approved: ${response.data.data.breakdown.approved}`);
                    console.log(`     - Rejected: ${response.data.data.breakdown.rejected}`);
                }
                process.exit(0);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // Endpoint doesn't exist, try delete-by-filter with deleteAll flag
                console.log('⚠️  delete-all endpoint not found, trying delete-by-filter with deleteAll flag...\n');
                
                const response = await axios.delete(`${apiUrl}/api/admin/questions/delete-by-filter`, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    },
                    data: { deleteAll: true },
                    timeout: 30000
                });
                
                if (response.data.success) {
                    console.log('✅ Success!');
                    console.log(`   ${response.data.message}`);
                    console.log(`   Deleted: ${response.data.data.deleted} questions`);
                    if (response.data.data.breakdown) {
                        console.log(`   Breakdown:`);
                        console.log(`     - Pending: ${response.data.data.breakdown.pending}`);
                        console.log(`     - Approved: ${response.data.data.breakdown.approved}`);
                        console.log(`     - Rejected: ${response.data.data.breakdown.rejected}`);
                    }
                    process.exit(0);
                }
            } else {
                throw error;
            }
        }
    } catch (error) {
        if (error.response) {
            console.error(`❌ API Error: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.message || error.message}`);
            if (error.response.status === 401) {
                console.error('\n💡 Tip: Your admin token might be invalid or expired');
            }
        } else if (error.request) {
            console.error('❌ Network Error: Could not reach the API server');
            console.error(`   URL: ${apiUrl}`);
            console.error('\n💡 Tip: Make sure the server is running and accessible');
        } else {
            console.error(`❌ Error: ${error.message}`);
        }
        process.exit(1);
    }
};

main();

#!/bin/bash

# Test User Registration API Locally
# Make sure your server is running on port 5000 (or update PORT below)

BASE_URL="http://localhost:5000"
PORT=${PORT:-5000}

echo "🧪 Testing User Registration API Locally"
echo "========================================"
echo "Base URL: $BASE_URL"
echo ""

# Test data
REGISTER_DATA='{
  "name": "Test User",
  "email": "testuser@example.com",
  "mobile": "9876543210",
  "password": "Test@123"
}'

echo "📝 Registration Request:"
echo "$REGISTER_DATA" | jq '.' 2>/dev/null || echo "$REGISTER_DATA"
echo ""
echo "⏳ Sending POST request to: $BASE_URL/api/user/register"
echo ""

# Send registration request
RESPONSE=$(curl -s -w "\n\nHTTP_STATUS:%{http_code}" \
  -X POST "$BASE_URL/api/user/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

# Extract HTTP status and body
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📥 Response:"
echo "HTTP Status: $HTTP_STATUS"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check if successful
if [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ Registration successful!"
    echo ""
    echo "📧 Next steps:"
    echo "1. Check your email for OTP (or check server logs if email failed)"
    echo "2. Use the OTP to verify: curl -X POST $BASE_URL/api/user/verify-otp -H 'Content-Type: application/json' -d '{\"email\":\"testuser@example.com\",\"otp\":\"YOUR_OTP\"}'"
else
    echo "❌ Registration failed!"
    echo ""
    echo "💡 Troubleshooting:"
    echo "1. Make sure server is running: npm start or node server.js"
    echo "2. Check .env file has all required variables"
    echo "3. Check server logs for errors"
fi

#!/bin/bash

# Test Registration API on Render
BASE_URL="https://academic-7mkg.onrender.com"

echo "🧪 Testing Registration API on Render"
echo "======================================"
echo "Base URL: $BASE_URL"
echo ""

# Test registration
curl -X POST "$BASE_URL/api/user/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "varun.singhal78@gmail.com",
    "mobile": "9896904632",
    "password": "123456"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "Done!"

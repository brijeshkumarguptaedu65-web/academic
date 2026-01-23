#!/bin/bash

# Simple curl test for local registration
BASE_URL="http://localhost:5000"

echo "Testing Registration API Locally"
echo "=================================="
echo ""

curl -X POST "$BASE_URL/api/user/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "mobile": "9876543210",
    "password": "123456"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "Done!"

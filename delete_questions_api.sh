#!/bin/bash

# Script to delete questions via API
# Usage: ./delete_questions_api.sh [options]
#
# Options:
#   --token=<token>     Admin JWT token (required)
#   --status=<status>   Delete by status (pending, approved, rejected)
#   --tag=<tag>         Delete by tag
#   --class=<level>     Delete by class level
#   --topic=<topic>     Delete by topic name
#   --url=<url>         API base URL (default: https://academic-7mkg.onrender.com)

API_URL="${API_URL:-https://academic-7mkg.onrender.com}"
TOKEN=""
STATUS=""
TAG=""
CLASS=""
TOPIC=""

# Parse arguments
for arg in "$@"; do
    case $arg in
        --token=*)
            TOKEN="${arg#*=}"
            ;;
        --status=*)
            STATUS="${arg#*=}"
            ;;
        --tag=*)
            TAG="${arg#*=}"
            ;;
        --class=*)
            CLASS="${arg#*=}"
            ;;
        --topic=*)
            TOPIC="${arg#*=}"
            ;;
        --url=*)
            API_URL="${arg#*=}"
            ;;
        *)
            echo "Unknown option: $arg"
            exit 1
            ;;
    esac
done

# Check if token is provided
if [ -z "$TOKEN" ]; then
    echo "❌ Error: Admin token is required"
    echo "Usage: ./delete_questions_api.sh --token=YOUR_TOKEN [--status=pending] [--tag=...] [--class=3] [--topic=...]"
    exit 1
fi

# Build JSON body
BODY="{"
FIRST=true

if [ -n "$STATUS" ]; then
    BODY="$BODY\"status\": \"$STATUS\""
    FIRST=false
fi

if [ -n "$TAG" ]; then
    if [ "$FIRST" = false ]; then
        BODY="$BODY, "
    fi
    BODY="$BODY\"tag\": \"$TAG\""
    FIRST=false
fi

if [ -n "$CLASS" ]; then
    if [ "$FIRST" = false ]; then
        BODY="$BODY, "
    fi
    BODY="$BODY\"classLevel\": $CLASS"
    FIRST=false
fi

if [ -n "$TOPIC" ]; then
    if [ "$FIRST" = false ]; then
        BODY="$BODY, "
    fi
    BODY="$BODY\"topicName\": \"$TOPIC\""
    FIRST=false
fi

BODY="$BODY}"

# Check if at least one filter is provided
if [ "$FIRST" = true ]; then
    echo "❌ Error: At least one filter is required (--status, --tag, --class, or --topic)"
    echo "Example: ./delete_questions_api.sh --token=YOUR_TOKEN --status=pending"
    exit 1
fi

echo "🗑️  Deleting questions with filters:"
echo "   $BODY"
echo ""

# Make API call
RESPONSE=$(curl -s -X DELETE \
    "${API_URL}/api/admin/questions/delete-by-filter" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$BODY")

# Pretty print response
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

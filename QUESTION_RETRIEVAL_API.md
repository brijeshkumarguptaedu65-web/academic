# Question Retrieval API Documentation

This document describes the APIs for retrieving questions from the database. These APIs are available for both **User** and **Admin** roles.

**Base URLs:**
- User API: `/api/user/questions`
- Admin API: `/api/admin/questions`

**Authentication:** All endpoints require authentication (Bearer token in Authorization header)

---

## Table of Contents

1. [Get Questions by Tag and Class](#1-get-questions-by-tag-and-class)
2. [Get Random Questions by Topic](#2-get-random-questions-by-topic)
3. [Get Questions by Class and Type](#3-get-questions-by-class-and-type)

---

## 1. Get Questions by Tag and Class

Retrieves all approved questions for a specific tag and class level.

### Endpoint

**User:** `GET /api/user/questions/by-tag-class`  
**Admin:** `GET /api/admin/questions/by-tag-class`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tag` | string | Yes | The tag name to filter questions |
| `classLevel` | number | Yes | The class level (e.g., 1, 2, 3, etc.) |

### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "question_id",
        "question": "What is 5 + 3?",
        "options": ["7", "8", "9", "10"],
        "correctAnswer": 1,
        "finalAnswer": "8",
        "classLevel": 1,
        "topicName": "Addition",
        "concept": "Basic Addition",
        "tag": "Adds two single-digit numbers",
        "difficulty": "easy",
        "latex": false,
        "status": "approved",
        "type": "BASIC_CALCULATION",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1,
    "tag": "Adds two single-digit numbers",
    "classLevel": 1
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "tag and classLevel are required"
}
```

### Example Request

```bash
# User API
curl -X GET "https://academic-7mkg.onrender.com/api/user/questions/by-tag-class?tag=Adds%20two%20single-digit%20numbers&classLevel=1" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"

# Admin API
curl -X GET "https://academic-7mkg.onrender.com/api/admin/questions/by-tag-class?tag=Adds%20two%20single-digit%20numbers&classLevel=1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Notes

- Only returns **approved** questions
- Questions are sorted by creation date (newest first)
- Returns all questions matching the tag and class, regardless of topic

---

## 2. Get Random Questions by Topic

Retrieves a specified number of random questions for a given class, topic, and type. Questions are distributed **equally across all tags** - no tag is skipped.

### Endpoint

**User:** `GET /api/user/questions/random-by-topic`  
**Admin:** `GET /api/admin/questions/random-by-topic`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classLevel` | number | Yes | The class level (e.g., 1, 2, 3, etc.) |
| `topicName` | string | Yes | The topic name (e.g., "Addition", "Subtraction", "Mensuration") |
| `type` | string | Yes | Question type: `"BASIC_CALCULATION"` or `"SUBJECT"` |
| `numberOfQuestions` | number | Yes | Total number of questions to retrieve |

### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "question_id_1",
        "question": "What is 5 + 3?",
        "options": ["7", "8", "9", "10"],
        "correctAnswer": 1,
        "finalAnswer": "8",
        "classLevel": 1,
        "topicName": "Addition",
        "tag": "Adds two single-digit numbers",
        "difficulty": "easy",
        "latex": false
      },
      {
        "_id": "question_id_2",
        "question": "What is 12 + 8?",
        "options": ["18", "20", "22", "24"],
        "correctAnswer": 1,
        "finalAnswer": "20",
        "classLevel": 1,
        "topicName": "Addition",
        "tag": "Adds two double-digit numbers",
        "difficulty": "medium",
        "latex": false
      }
    ],
    "count": 2,
    "requested": 10,
    "classLevel": 1,
    "topicName": "Addition",
    "type": "BASIC_CALCULATION",
    "tagDistribution": {
      "Adds two single-digit numbers": {
        "available": 15,
        "selected": 3,
        "requested": 3
      },
      "Adds two double-digit numbers": {
        "available": 12,
        "selected": 3,
        "requested": 3
      },
      "Solves word problems involving addition": {
        "available": 8,
        "selected": 2,
        "requested": 2
      },
      "Estimates sums": {
        "available": 5,
        "selected": 2,
        "requested": 2
      }
    },
    "totalTags": 4
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "classLevel, topicName, type, and numberOfQuestions are required"
}
```

**No Questions Found (200 OK):**
```json
{
  "success": true,
  "data": {
    "questions": [],
    "count": 0,
    "message": "No approved questions found for Class 1, Topic: Addition, Type: BASIC_CALCULATION"
  }
}
```

### Example Request

```bash
# User API - Get 30 random questions for Class 1, Addition topic, BASIC_CALCULATION type
curl -X GET "https://academic-7mkg.onrender.com/api/user/questions/random-by-topic?classLevel=1&topicName=Addition&type=BASIC_CALCULATION&numberOfQuestions=30" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"

# Admin API - Get 20 random questions for Class 5, Mensuration topic, SUBJECT type
curl -X GET "https://academic-7mkg.onrender.com/api/admin/questions/random-by-topic?classLevel=5&topicName=Mensuration&type=SUBJECT&numberOfQuestions=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Algorithm

1. **Find all unique tags** for the given class, topic, and type
2. **Calculate questions per tag**: `Math.floor(numberOfQuestions / totalTags)`
3. **Distribute remainder**: Extra questions are distributed to the first `remainder` tags
4. **Random selection**: For each tag, randomly select the required number of questions
5. **Final shuffle**: Shuffle all selected questions to randomize order

### Notes

- Only returns **approved** questions
- **No tag is skipped** - all tags get at least one question if available
- If a tag has fewer questions than requested, all available questions from that tag are returned
- Questions are randomly selected and shuffled for variety
- The `tagDistribution` object shows how many questions were selected from each tag

---

## 3. Get Questions by Class and Type

Retrieves a specified number of questions for a given class and type. Questions are distributed **equally across all topics**, and within each topic, **equally across all tags**.

### Endpoint

**User:** `GET /api/user/questions/by-class-type`  
**Admin:** `GET /api/admin/questions/by-class-type`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classLevel` | number | Yes | The class level (e.g., 1, 2, 3, etc.) |
| `type` | string | Yes | Question type: `"BASIC_CALCULATION"` or `"SUBJECT"` |
| `numberOfQuestions` | number | Yes | Total number of questions to retrieve |

### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "question_id_1",
        "question": "What is 5 + 3?",
        "options": ["7", "8", "9", "10"],
        "correctAnswer": 1,
        "finalAnswer": "8",
        "classLevel": 1,
        "topicName": "Addition",
        "tag": "Adds two single-digit numbers",
        "difficulty": "easy",
        "latex": false
      },
      {
        "_id": "question_id_2",
        "question": "What is 10 - 4?",
        "options": ["5", "6", "7", "8"],
        "correctAnswer": 1,
        "finalAnswer": "6",
        "classLevel": 1,
        "topicName": "Subtraction",
        "tag": "Subtracts two single-digit numbers",
        "difficulty": "easy",
        "latex": false
      }
    ],
    "count": 2,
    "requested": 30,
    "classLevel": 1,
    "type": "BASIC_CALCULATION",
    "topicDistribution": {
      "Addition": {
        "questionsSelected": 10,
        "requested": 10,
        "tags": {
          "Adds two single-digit numbers": {
            "available": 15,
            "selected": 5,
            "requested": 5
          },
          "Adds two double-digit numbers": {
            "available": 12,
            "selected": 5,
            "requested": 5
          }
        },
        "totalTags": 2
      },
      "Subtraction": {
        "questionsSelected": 10,
        "requested": 10,
        "tags": {
          "Subtracts two single-digit numbers": {
            "available": 10,
            "selected": 5,
            "requested": 5
          },
          "Subtracts two double-digit numbers": {
            "available": 8,
            "selected": 5,
            "requested": 5
          }
        },
        "totalTags": 2
      },
      "Multiplication": {
        "questionsSelected": 10,
        "requested": 10,
        "tags": {
          "Multiplies single-digit numbers": {
            "available": 12,
            "selected": 5,
            "requested": 5
          },
          "Multiplies double-digit numbers": {
            "available": 10,
            "selected": 5,
            "requested": 5
          }
        },
        "totalTags": 2
      }
    },
    "totalTopics": 3
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "classLevel, type, and numberOfQuestions are required"
}
```

**No Questions Found (200 OK):**
```json
{
  "success": true,
  "data": {
    "questions": [],
    "count": 0,
    "message": "No approved questions found for Class 1, Type: BASIC_CALCULATION"
  }
}
```

### Example Request

```bash
# User API - Get 30 questions for Class 1, BASIC_CALCULATION type
curl -X GET "https://academic-7mkg.onrender.com/api/user/questions/by-class-type?classLevel=1&type=BASIC_CALCULATION&numberOfQuestions=30" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"

# Admin API - Get 45 questions for Class 5, SUBJECT type
curl -X GET "https://academic-7mkg.onrender.com/api/admin/questions/by-class-type?classLevel=5&type=SUBJECT&numberOfQuestions=45" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Algorithm

1. **Find all unique topics** for the given class and type
2. **Calculate questions per topic**: `Math.floor(numberOfQuestions / totalTopics)`
3. **Distribute remainder**: Extra questions are distributed to the first `remainder` topics
4. **For each topic**:
   - Find all unique tags for that topic
   - Calculate questions per tag: `Math.floor(questionsForTopic / totalTags)`
   - Distribute remainder within the topic
   - Randomly select questions from each tag
5. **Final shuffle**: Shuffle all selected questions to randomize order

### Notes

- Only returns **approved** questions
- **Equal distribution across topics** - each topic gets approximately the same number of questions
- **Equal distribution across tags within each topic** - each tag gets approximately the same number of questions
- If a topic/tag has fewer questions than requested, all available questions are returned
- Questions are randomly selected and shuffled for variety
- The `topicDistribution` object shows detailed breakdown by topic and tag

---

## Common Response Fields

### Question Object Structure

```typescript
interface Question {
  _id: string;                    // MongoDB ObjectId
  question: string;                // Question text
  options: string[];               // Array of 4 options
  correctAnswer: number;           // Index of correct answer (0-3)
  finalAnswer: string;             // The correct answer text
  classLevel: number;              // Class level (1-12)
  topicName: string;               // Topic name (e.g., "Addition")
  concept?: string;                // Concept name (optional)
  tag: string;                     // Learning outcome tag
  difficulty: 'easy' | 'medium' | 'hard';
  latex: boolean;                  // Whether question contains LaTeX
  status: 'pending' | 'approved' | 'rejected';
  type: 'SUBJECT' | 'BASIC_CALCULATION';
  subjectId?: string;              // Subject ObjectId (for SUBJECT type)
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}
```

---

## Error Handling

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error fetching questions",
  "error": "Detailed error message"
}
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Example: Get random questions for a quiz
async function getQuizQuestions(classLevel: number, topicName: string, type: string, count: number) {
  const response = await fetch(
    `https://academic-7mkg.onrender.com/api/user/questions/random-by-topic?classLevel=${classLevel}&topicName=${topicName}&type=${type}&numberOfQuestions=${count}`,
    {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    console.log(`Retrieved ${data.data.count} questions`);
    console.log(`Tag distribution:`, data.data.tagDistribution);
    return data.data.questions;
  } else {
    console.error('Error:', data.message);
    return [];
  }
}

// Usage
const questions = await getQuizQuestions(1, 'Addition', 'BASIC_CALCULATION', 30);
```

### Python

```python
import requests

def get_questions_by_class_type(class_level, question_type, number_of_questions, token):
    url = "https://academic-7mkg.onrender.com/api/user/questions/by-class-type"
    params = {
        "classLevel": class_level,
        "type": question_type,
        "numberOfQuestions": number_of_questions
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, params=params, headers=headers)
    data = response.json()
    
    if data["success"]:
        return data["data"]["questions"]
    else:
        print(f"Error: {data['message']}")
        return []

# Usage
questions = get_questions_by_class_type(1, "BASIC_CALCULATION", 30, user_token)
```

---

## Best Practices

1. **Always check `success` field** before using the data
2. **Handle empty results** - APIs return empty arrays when no questions are found
3. **Check `count` vs `requested`** - The actual count may be less than requested if not enough questions are available
4. **Use `tagDistribution` or `topicDistribution`** to understand question distribution
5. **Cache results** when appropriate to reduce API calls
6. **Handle errors gracefully** - Show user-friendly error messages

---

## Rate Limiting

Currently, there are no rate limits on these endpoints. However, please use them responsibly and consider caching results when appropriate.

---

## Support

For issues or questions, please contact the development team or refer to the main API documentation.

# Curriculum Mapping API Documentation

**Base URL:** `https://academic-7mkg.onrender.com`

**Authentication:** All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Overview

The Curriculum Mapping API uses AI (DeepSeek) to automatically map learning outcomes to curriculum chapters based on comma-separated tags. Mappings are calculated when learning outcomes are created/updated and stored in the database for fast retrieval.

**Key Features:**
- ✅ Automatic mapping calculation on learning outcome creation/update
- ✅ Mappings stored in database (no API calls needed for retrieval)
- ✅ AI-powered semantic matching based on comma-separated tags
- ✅ Relevance scores (0.0-1.0) for each mapping
- ✅ Manual recalculation endpoint available

---

## API Endpoints

### 1. Get Curriculum Mappings for All Learning Outcomes

**Endpoint:** `POST /api/admin/curriculum/map-learning-outcomes`

**Description:** Retrieves curriculum mappings for all learning outcomes matching the criteria. Returns mappings from the database (no AI calculation).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "classId": "class_id_here",
  "subjectId": "subject_id_here",  // Required for SUBJECT type
  "type": "SUBJECT"  // or "BASIC_CALCULATION"
}
```

**Parameters:**
- `classId` (string, required): Class ID
- `subjectId` (string, required for SUBJECT type): Subject ID
- `type` (string, required): Either `"SUBJECT"` or `"BASIC_CALCULATION"`

**Response:**
```json
{
  "success": true,
  "totalLearningOutcomes": 5,
  "mappings": [
    {
      "learningOutcome": {
        "id": "learning_outcome_id",
        "text": "Addition up to 20, sum of 1 digit",
        "tags": ["Addition up to 20", "sum of 1 digit"],
        "classLevel": 2,
        "type": "BASIC_CALCULATION"
      },
      "mappedChapters": [
        {
          "chapterId": "chapter_id_1",
          "chapterName": "Addition Basics",
          "topicName": "Arithmetic",
          "relevanceScore": 0.85,
          "reason": "High relevance: tags match chapter topic and class level"
        },
        {
          "chapterId": "chapter_id_2",
          "chapterName": "Number Operations",
          "topicName": "Arithmetic",
          "relevanceScore": 0.72,
          "reason": "Moderate relevance: related to addition operations"
        }
      ],
      "lastCalculatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Example:**
```javascript
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/curriculum/map-learning-outcomes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    classId: 'class_id_123',
    subjectId: 'subject_id_456',
    type: 'SUBJECT'
  })
});

const data = await response.json();
console.log('Mappings:', data.mappings);
```

**Error Responses:**
- `400`: Missing required parameters
- `404`: No learning outcomes found
- `500`: Server error

---

### 2. Get Curriculum Mapping for Specific Learning Outcome

**Endpoint:** `GET /api/admin/curriculum/learning-outcomes/:learningOutcomeId/mapping`

**Description:** Retrieves curriculum mapping for a specific learning outcome from the database.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `learningOutcomeId` (string, required): Learning Outcome ID

**Response:**
```json
{
  "learningOutcome": {
    "id": "learning_outcome_id",
    "text": "Addition up to 20, sum of 1 digit",
    "tags": ["Addition up to 20", "sum of 1 digit"],
    "classLevel": 2,
    "type": "BASIC_CALCULATION"
  },
  "mappedChapters": [
    {
      "chapterId": "chapter_id_1",
      "chapterName": "Addition Basics",
      "topicName": "Arithmetic",
      "relevanceScore": 0.85,
      "reason": "High relevance: tags match chapter topic and class level"
    }
  ],
  "lastCalculatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```javascript
const learningOutcomeId = "outcome_id_123";
const response = await fetch(
  `https://academic-7mkg.onrender.com/api/admin/curriculum/learning-outcomes/${learningOutcomeId}/mapping`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log('Mapped Chapters:', data.mappedChapters);
```

**Error Responses:**
- `404`: Learning outcome not found
- `500`: Server error

**Note:** If no mapping exists, returns empty `mappedChapters` array with a message.

---

### 3. Recalculate Curriculum Mapping

**Endpoint:** `POST /api/admin/curriculum/learning-outcomes/:learningOutcomeId/recalculate`

**Description:** Manually triggers recalculation of curriculum mapping for a learning outcome using AI. Useful when:
- Chapters are added/updated after learning outcomes were created
- You want to refresh mappings with latest curriculum data
- Initial calculation failed

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `learningOutcomeId` (string, required): Learning Outcome ID

**Response:**
```json
{
  "success": true,
  "message": "Curriculum mapping recalculated and saved",
  "learningOutcome": {
    "id": "learning_outcome_id",
    "text": "Addition up to 20, sum of 1 digit",
    "tags": ["Addition up to 20", "sum of 1 digit"],
    "classLevel": 2,
    "type": "BASIC_CALCULATION"
  },
  "mappedChapters": [
    {
      "chapterId": "chapter_id_1",
      "chapterName": "Addition Basics",
      "topicName": "Arithmetic",
      "relevanceScore": 0.85,
      "reason": "High relevance: tags match chapter topic and class level"
    }
  ],
  "lastCalculatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```javascript
const learningOutcomeId = "outcome_id_123";
const response = await fetch(
  `https://academic-7mkg.onrender.com/api/admin/curriculum/learning-outcomes/${learningOutcomeId}/recalculate`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log('Recalculated mappings:', data.mappedChapters);
```

**Error Responses:**
- `404`: Learning outcome not found
- `500`: AI service error or server error

---

## Automatic Mapping Calculation

### When Learning Outcomes are Created

When you create a learning outcome using `POST /api/admin/learning-outcomes`, the system automatically:
1. Saves the learning outcome
2. Calculates curriculum mapping using AI (in background)
3. Saves mapping to database
4. Returns learning outcome immediately (mapping happens async)

**Example:**
```javascript
// Create learning outcome with comma-separated tags
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/learning-outcomes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "Addition up to 20, sum of 1 digit",  // Comma-separated tags
    type: "BASIC_CALCULATION",
    classId: "class_id_123"
  })
});

// Mapping is calculated automatically in background
// You can retrieve it using GET endpoint after a few seconds
```

### When Learning Outcomes are Updated

When you update a learning outcome's `text` field using `PUT /api/admin/learning-outcomes/:id`, the system automatically:
1. Updates the learning outcome
2. Recalculates curriculum mapping (if text changed)
3. Updates mapping in database

---

## Understanding Mappings

### Relevance Score

Each mapped chapter has a `relevanceScore` between 0.0 and 1.0:
- **0.9 - 1.0**: Very high relevance (strong match)
- **0.7 - 0.9**: High relevance (good match)
- **0.5 - 0.7**: Moderate relevance (acceptable match)
- **< 0.5**: Not included in mappings (filtered out)

### Mapping Criteria

The AI considers:
1. **Semantic similarity** between comma-separated tags and chapter/topic names
2. **Class level alignment** (matching class levels preferred)
3. **Subject alignment** (for SUBJECT type learning outcomes)

### Example Tags and Mappings

**Class 2 Learning Outcome:**
- Tags: `"Addition up to 20, sum of 1 digit"`
- Mapped to: "Addition Basics" chapter (relevance: 0.85)

**Class 3 Learning Outcome:**
- Tags: `"Addition up to 50"`
- Mapped to: "Advanced Addition" chapter (relevance: 0.82)

---

## Complete API Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/curriculum/map-learning-outcomes` | Get all mappings for learning outcomes |
| GET | `/api/admin/curriculum/learning-outcomes/:id/mapping` | Get mapping for specific outcome |
| POST | `/api/admin/curriculum/learning-outcomes/:id/recalculate` | Recalculate mapping manually |

---

## Integration Flow

### Recommended Workflow

1. **Create Learning Outcomes** with comma-separated tags:
   ```json
   {
     "text": "Addition up to 20, sum of 1 digit",
     "type": "BASIC_CALCULATION",
     "classId": "class_id"
   }
   ```

2. **Wait a few seconds** for automatic mapping calculation

3. **Retrieve Mappings** from database:
   ```javascript
   GET /api/admin/curriculum/learning-outcomes/:id/mapping
   ```

4. **Recalculate if needed** (e.g., after adding new chapters):
   ```javascript
   POST /api/admin/curriculum/learning-outcomes/:id/recalculate
   ```

---

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad request (missing/invalid parameters)
- `401`: Unauthorized (invalid/missing token)
- `404`: Resource not found
- `500`: Server error

Error response format:
```json
{
  "message": "Error description",
  "error": "Detailed error message (if available)"
}
```

---

## Notes

- Mappings are calculated **automatically** when learning outcomes are created/updated
- Mappings are stored in **database** for fast retrieval (no AI calls on GET requests)
- Use **recalculate endpoint** only when needed (e.g., after curriculum changes)
- Comma-separated tags in learning outcome `text` field are used for AI matching
- Only mappings with relevance score ≥ 0.5 are stored and returned

---

## Base URL

All endpoints use the base URL: **`https://academic-7mkg.onrender.com`**

Example full URLs:
- `https://academic-7mkg.onrender.com/api/admin/curriculum/map-learning-outcomes`
- `https://academic-7mkg.onrender.com/api/admin/curriculum/learning-outcomes/:id/mapping`
- `https://academic-7mkg.onrender.com/api/admin/curriculum/learning-outcomes/:id/recalculate`

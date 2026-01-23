# Topic Tag Mapping API Documentation

## Overview

This API provides endpoints to:
1. Get all learning outcomes grouped by topic
2. Get tag-wise mappings for a specific topic using DeepSeek AI API (with relevance score >= 60%)

---

## 1. Get Learning Outcomes Grouped by Topic

### Endpoint
```
GET /api/admin/learning-outcomes/by-topic
```

### Description
Returns all learning outcomes grouped by topic. Each topic contains a list of learning outcomes sorted by class level.

### Authentication
- **Required**: Yes
- **Type**: Bearer Token (Admin only)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Type of learning outcome: `SUBJECT` or `BASIC_CALCULATION` |
| `subjectId` | string | No | Filter by subject ID (only for `SUBJECT` type) |

### Request Example

```bash
curl -X GET "https://academic-7mkg.onrender.com/api/admin/learning-outcomes/by-topic?type=SUBJECT&subjectId=696f1e32570003266cdcf305" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Response Format

```json
{
  "success": true,
  "totalTopics": 3,
  "totalLearningOutcomes": 10,
  "topics": [
    {
      "topicName": "Addition",
      "learningOutcomes": [
        {
          "id": "6971d1424f0073675925cadf",
          "text": "Understanding addition (1–10), adding single-digit numbers (1–20), solving simple addition word problems",
          "tags": [
            "Understanding addition (1–10)",
            "adding single-digit numbers (1–20)",
            "solving simple addition word problems"
          ],
          "classId": {
            "_id": "696f1f53219928cc7c5cb84c",
            "name": "Class 2",
            "level": 2
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-22T07:26:58.476Z",
          "updatedAt": "2026-01-22T07:26:58.476Z"
        },
        {
          "id": "6971d19b4f0073675925cb01",
          "text": "adding two-digit numbers with carry (up to 99), adding three or more numbers",
          "tags": [
            "adding two-digit numbers with carry (up to 99)",
            "adding three or more numbers"
          ],
          "classId": {
            "_id": "696f1e32570003266cdcf2ff",
            "name": "Class 3",
            "level": 3
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-22T07:28:27.674Z",
          "updatedAt": "2026-01-22T07:28:27.674Z"
        }
      ]
    },
    {
      "topicName": "Subtraction",
      "learningOutcomes": [
        {
          "id": "6971e75bb6d3c35f5fc38a54",
          "text": "subtract single-digit numbers, subtract two-digit numbers",
          "tags": [
            "subtract single-digit numbers",
            "subtract two-digit numbers"
          ],
          "classId": {
            "_id": "696f1e32570003266cdcf2ff",
            "name": "Class 3",
            "level": 3
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-22T09:01:15.670Z",
          "updatedAt": "2026-01-22T09:01:15.670Z"
        }
      ]
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `totalTopics` | number | Total number of unique topics |
| `totalLearningOutcomes` | number | Total number of learning outcomes |
| `topics` | array | Array of topic objects |
| `topics[].topicName` | string | Name of the topic |
| `topics[].learningOutcomes` | array | Array of learning outcomes in this topic |
| `topics[].learningOutcomes[].id` | string | Learning outcome ID |
| `topics[].learningOutcomes[].text` | string | Full text of the learning outcome |
| `topics[].learningOutcomes[].tags` | array | Array of tags (comma-separated) |
| `topics[].learningOutcomes[].classId` | object | Class information |
| `topics[].learningOutcomes[].subjectId` | object | Subject information |
| `topics[].learningOutcomes[].type` | string | Type: `SUBJECT` or `BASIC_CALCULATION` |

### Error Responses

**400 Bad Request**
```json
{
  "message": "type is required"
}
```

**401 Unauthorized**
```json
{
  "message": "Not authorized, no token"
}
```

**500 Internal Server Error**
```json
{
  "message": "Error message"
}
```

---

## 2. Get Tag-Wise Mappings for a Topic

### Endpoint
```
GET /api/admin/curriculum/topics/:topicName/tag-mappings
```

### Description
Returns tag-wise mappings for a specific topic using DeepSeek AI API. Only returns mappings with relevance score >= 60% (0.6). Compares all tags within the topic and identifies relationships (progression, prerequisite, related, etc.).

### Authentication
- **Required**: Yes
- **Type**: Bearer Token (Admin only)

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topicName` | string | Yes | Name of the topic (URL encoded) |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Type of learning outcome: `SUBJECT` or `BASIC_CALCULATION` |
| `subjectId` | string | No | Filter by subject ID (only for `SUBJECT` type) |

### Request Example

```bash
curl -X GET "https://academic-7mkg.onrender.com/api/admin/curriculum/topics/Addition/tag-mappings?type=SUBJECT&subjectId=696f1e32570003266cdcf305" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Response Format

```json
{
  "success": true,
  "topicName": "Addition",
  "totalLearningOutcomes": 2,
  "totalTags": 5,
  "totalMappings": 3,
  "tagMappings": [
    {
      "fromTag": {
        "tag": "Understanding addition (1–10)",
        "learningOutcomeId": "6971d1424f0073675925cadf",
        "learningOutcomeText": "Understanding addition (1–10), adding single-digit numbers (1–20), solving simple addition word problems",
        "classLevel": 2,
        "className": "Class 2"
      },
      "toTag": {
        "tag": "adding two-digit numbers with carry (up to 99)",
        "learningOutcomeId": "6971d19b4f0073675925cb01",
        "learningOutcomeText": "adding two-digit numbers with carry (up to 99), adding three or more numbers",
        "classLevel": 3,
        "className": "Class 3"
      },
      "relevanceScore": 0.85,
      "relation": "progression",
      "reason": "Tag A covers foundational addition within 1-10, which is a direct prerequisite for Tag B, which extends the concept to two-digit numbers with carrying, representing a clear skill progression in arithmetic."
    },
    {
      "fromTag": {
        "tag": "adding single-digit numbers (1–20)",
        "learningOutcomeId": "6971d1424f0073675925cadf",
        "learningOutcomeText": "Understanding addition (1–10), adding single-digit numbers (1–20), solving simple addition word problems",
        "classLevel": 2,
        "className": "Class 2"
      },
      "toTag": {
        "tag": "adding two-digit numbers with carry (up to 99)",
        "learningOutcomeId": "6971d19b4f0073675925cb01",
        "learningOutcomeText": "adding two-digit numbers with carry (up to 99), adding three or more numbers",
        "classLevel": 3,
        "className": "Class 3"
      },
      "relevanceScore": 0.78,
      "relation": "progression",
      "reason": "Single-digit addition (1-20) is a foundational skill that directly progresses to two-digit addition with carrying, representing a natural skill advancement."
    },
    {
      "fromTag": {
        "tag": "adding single-digit numbers (1–20)",
        "learningOutcomeId": "6971d1424f0073675925cadf",
        "learningOutcomeText": "Understanding addition (1–10), adding single-digit numbers (1–20), solving simple addition word problems",
        "classLevel": 2,
        "className": "Class 2"
      },
      "toTag": {
        "tag": "adding three or more numbers",
        "learningOutcomeId": "6971d19b4f0073675925cb01",
        "learningOutcomeText": "adding two-digit numbers with carry (up to 99), adding three or more numbers",
        "classLevel": 3,
        "className": "Class 3"
      },
      "relevanceScore": 0.65,
      "relation": "progression",
      "reason": "Adding single-digit numbers is a prerequisite skill for adding three or more numbers, representing a progression in complexity."
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `topicName` | string | Name of the topic |
| `totalLearningOutcomes` | number | Total number of learning outcomes in this topic |
| `totalTags` | number | Total number of tags extracted from all learning outcomes |
| `totalMappings` | number | Total number of tag mappings found (relevance >= 60%) |
| `tagMappings` | array | Array of tag mapping objects |
| `tagMappings[].fromTag` | object | Source tag information |
| `tagMappings[].fromTag.tag` | string | The tag text |
| `tagMappings[].fromTag.learningOutcomeId` | string | ID of the learning outcome containing this tag |
| `tagMappings[].fromTag.learningOutcomeText` | string | Full text of the learning outcome |
| `tagMappings[].fromTag.classLevel` | number | Class level (e.g., 2, 3, 4) |
| `tagMappings[].fromTag.className` | string | Class name (e.g., "Class 2") |
| `tagMappings[].toTag` | object | Target tag information (same structure as fromTag) |
| `tagMappings[].relevanceScore` | number | Relevance score (0.0 to 1.0, only >= 0.6) |
| `tagMappings[].relation` | string | Type of relation: `same`, `progression`, `prerequisite`, `related`, `unrelated` |
| `tagMappings[].reason` | string | Brief explanation of the relationship |

### Relation Types

| Relation | Description |
|----------|-------------|
| `same` | Tags represent the same concept |
| `progression` | Tag B is an advancement/progression of Tag A |
| `prerequisite` | Tag A is a prerequisite for Tag B |
| `related` | Tags are related/complementary but not directly sequential |
| `unrelated` | Tags are not related (not returned, as score < 60%) |

### Notes

1. **Relevance Score Threshold**: Only mappings with `relevanceScore >= 0.6` (60%) are returned
2. **Tag Extraction**: Tags are extracted from comma-separated text, preserving LaTeX/KaTeX expressions
3. **AI Processing**: Uses DeepSeek AI API to analyze semantic relationships between tags
4. **Sorting**: Mappings are sorted by relevance score (descending)
5. **Performance**: This endpoint may take longer to respond as it makes multiple AI API calls

### Error Responses

**400 Bad Request**
```json
{
  "message": "topicName is required"
}
```

**401 Unauthorized**
```json
{
  "message": "Not authorized, no token"
}
```

**404 Not Found**
```json
{
  "success": true,
  "topicName": "NonExistentTopic",
  "totalLearningOutcomes": 0,
  "tagMappings": []
}
```

**500 Internal Server Error**
```json
{
  "message": "Error message"
}
```

---

## Usage Flow

1. **Get Topics**: First, call `GET /api/admin/learning-outcomes/by-topic` to see all available topics
2. **Select Topic**: User clicks on a topic from the list
3. **Get Mappings**: Call `GET /api/admin/curriculum/topics/:topicName/tag-mappings` to get tag-wise mappings for that topic
4. **Display Results**: Show the mappings with relevance scores and relationships

---

## Example Frontend Implementation

```javascript
// Step 1: Get all topics
const getTopics = async () => {
  const response = await fetch(
    'https://academic-7mkg.onrender.com/api/admin/learning-outcomes/by-topic?type=SUBJECT&subjectId=696f1e32570003266cdcf305',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.topics;
};

// Step 2: Get tag mappings for a specific topic
const getTopicMappings = async (topicName) => {
  const encodedTopicName = encodeURIComponent(topicName);
  const response = await fetch(
    `https://academic-7mkg.onrender.com/api/admin/curriculum/topics/${encodedTopicName}/tag-mappings?type=SUBJECT&subjectId=696f1e32570003266cdcf305`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.tagMappings;
};

// Usage
const topics = await getTopics();
// User clicks on "Addition" topic
const mappings = await getTopicMappings('Addition');
console.log(`Found ${mappings.length} tag mappings with relevance >= 60%`);
```

---

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/learning-outcomes/by-topic` | GET | Get all learning outcomes grouped by topic |
| `/api/admin/curriculum/topics/:topicName/tag-mappings` | GET | Get tag-wise mappings for a topic (AI-powered) |

---

## Support for LaTeX/KaTeX

The API fully supports LaTeX/KaTeX mathematical expressions in tags:
- Equations: `$x + y = z$`, `\(a = b\)`, `\[x^2 + y^2 = r^2\]`
- Fractions: `$\frac{a}{b}$`, `$\frac{x+1}{x-1}$`
- Polynomials: `$ax^2 + bx + c = 0$`
- All LaTeX syntax is preserved and analyzed semantically by the AI

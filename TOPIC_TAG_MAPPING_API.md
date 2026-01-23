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
  "totalTopics": 14,
  "totalLearningOutcomes": 57,
  "topics": [
    {
      "topicName": "Algebraic Expressions, Identities and Factorisation",
      "learningOutcomes": [
        {
          "id": "69733c5b285ad1330ea3315a",
          "text": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
          "tags": [
            "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle."
          ],
          "classId": {
            "_id": "696f1f59219928cc7c5cb8f3",
            "name": "Class 6",
            "level": 6
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-23T09:16:11.172Z",
          "updatedAt": "2026-01-23T09:16:11.172Z"
        },
        {
          "id": "69733c6d285ad1330ea33275",
          "text": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
          "tags": [
            "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions."
          ],
          "classId": {
            "_id": "696f1f5a219928cc7c5cb914",
            "name": "Class 7",
            "level": 7
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-23T09:16:29.503Z",
          "updatedAt": "2026-01-23T09:16:29.503Z"
        },
        {
          "id": "69733c7c285ad1330ea333b8",
          "text": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
          "tags": [
            "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems."
          ],
          "classId": {
            "_id": "696f1f5c219928cc7c5cb93e",
            "name": "Class 8",
            "level": 8
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-23T09:16:44.929Z",
          "updatedAt": "2026-01-23T09:16:44.929Z"
        }
      ]
    },
    {
      "topicName": "Data Handling",
      "learningOutcomes": [
        {
          "id": "69733a9e285ad1330ea315d7",
          "text": "Records data using tally marks.\nRepresents data pictorially using pictographs.\nDraws simple conclusions from pictorial data.",
          "tags": [
            "Records data using tally marks.\nRepresents data pictorially using pictographs.\nDraws simple conclusions from pictorial data."
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
          "createdAt": "2026-01-23T09:08:46.220Z",
          "updatedAt": "2026-01-23T09:08:46.220Z"
        },
        {
          "id": "69733af3285ad1330ea31dcc",
          "text": "Represents collected information in tables.\nRepresents data using bar graphs.\nDraws simple inferences from tables and bar graphs.",
          "tags": [
            "Represents collected information in tables.\nRepresents data using bar graphs.\nDraws simple inferences from tables and bar graphs."
          ],
          "classId": {
            "_id": "696f1e32570003266cdcf302",
            "name": "Class 4",
            "level": 4
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-23T09:10:11.060Z",
          "updatedAt": "2026-01-23T09:10:11.060Z"
        }
      ]
    }
  ]
}
```

### Actual API Response Example

**Request:**
```bash
GET /api/admin/learning-outcomes/by-topic?type=SUBJECT&subjectId=696f1e32570003266cdcf305
```

**Response (200 OK):**
```json
{
  "success": true,
  "totalTopics": 14,
  "totalLearningOutcomes": 57,
  "topics": [
    {
      "topicName": "Algebraic Expressions, Identities and Factorisation",
      "learningOutcomes": [
        {
          "id": "69733c5b285ad1330ea3315a",
          "text": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
          "tags": [
            "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle."
          ],
          "classId": {
            "_id": "696f1f59219928cc7c5cb8f3",
            "name": "Class 6",
            "level": 6
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-23T09:16:11.172Z",
          "updatedAt": "2026-01-23T09:16:11.172Z"
        },
        {
          "id": "69733c6d285ad1330ea33275",
          "text": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
          "tags": [
            "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions."
          ],
          "classId": {
            "_id": "696f1f5a219928cc7c5cb914",
            "name": "Class 7",
            "level": 7
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-23T09:16:29.503Z",
          "updatedAt": "2026-01-23T09:16:29.503Z"
        },
        {
          "id": "69733c7c285ad1330ea333b8",
          "text": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
          "tags": [
            "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems."
          ],
          "classId": {
            "_id": "696f1f5c219928cc7c5cb93e",
            "name": "Class 8",
            "level": 8
          },
          "subjectId": {
            "_id": "696f1e32570003266cdcf305",
            "name": "Mathematics"
          },
          "type": "SUBJECT",
          "createdAt": "2026-01-23T09:16:44.929Z",
          "updatedAt": "2026-01-23T09:16:44.929Z"
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
Returns tag-wise mappings for a specific topic using DeepSeek AI API. Only returns mappings with relevance score >= 60% (0.6). 

**Key Features:**
- Splits learning outcome text into individual tags (by comma and newline)
- Maps tags from lower classes to higher classes only (progression chain: Class 2 → Class 3 → Class 4 → Class 6, etc.)
- Groups mappings by tag to show progression chains
- Uses DeepSeek API to analyze semantic relationships between individual tags

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
  "topicName": "Algebraic Expressions, Identities and Factorisation",
  "totalLearningOutcomes": 3,
  "totalTags": 3,
  "totalMappings": 3,
  "tagMappings": [
    {
      "fromTag": {
        "tag": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
        "learningOutcomeId": "69733c5b285ad1330ea3315a",
        "learningOutcomeText": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
        "classLevel": 6,
        "className": "Class 6"
      },
      "toTag": {
        "tag": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
        "learningOutcomeId": "69733c6d285ad1330ea33275",
        "learningOutcomeText": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
        "classLevel": 7,
        "className": "Class 7"
      },
      "relevanceScore": 0.85,
      "relation": "progression",
      "reason": "Tag A focuses on foundational understanding of variables and creating basic algebraic expressions from real-world situations. Tag B builds on this foundation by requiring manipulation and simplification of algebraic expressions through addition, subtraction, and combining like terms, representing a clear progression from conceptual understanding to operational fluency."
    },
    {
      "fromTag": {
        "tag": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
        "learningOutcomeId": "69733c5b285ad1330ea3315a",
        "learningOutcomeText": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
        "classLevel": 6,
        "className": "Class 6"
      },
      "toTag": {
        "tag": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
        "learningOutcomeId": "69733c7c285ad1330ea333b8",
        "learningOutcomeText": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
        "classLevel": 8,
        "className": "Class 8"
      },
      "relevanceScore": 0.85,
      "relation": "progression",
      "reason": "Tag A introduces foundational algebraic concepts (variables, expressions, basic modeling), while Tag B builds upon these with advanced operations (multiplication, expansion, identities, factorization) and problem-solving applications, representing a clear progression from basic algebraic understanding to more complex algebraic manipulation."
    },
    {
      "fromTag": {
        "tag": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
        "learningOutcomeId": "69733c6d285ad1330ea33275",
        "learningOutcomeText": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
        "classLevel": 7,
        "className": "Class 7"
      },
      "toTag": {
        "tag": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
        "learningOutcomeId": "69733c7c285ad1330ea333b8",
        "learningOutcomeText": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
        "classLevel": 8,
        "className": "Class 8"
      },
      "relevanceScore": 0.85,
      "relation": "progression",
      "reason": "Tag A focuses on basic algebraic operations (addition, subtraction, simplification) with like terms and simple expressions, while Tag B progresses to more advanced operations (multiplication, expansion, factorization) and applies algebraic identities to solve problems. Both deal with algebraic expressions but at different complexity levels - from fundamental operations to more sophisticated manipulation and application."
    }
  ]
}
```

### Actual API Response Example

**Request:**
```bash
GET /api/admin/curriculum/topics/Algebraic%20Expressions%2C%20Identities%20and%20Factorisation/tag-mappings?type=SUBJECT&subjectId=696f1e32570003266cdcf305
```

**Response (200 OK):**
```json
{
  "success": true,
  "topicName": "Algebraic Expressions, Identities and Factorisation",
  "totalLearningOutcomes": 3,
  "totalTags": 3,
  "totalMappings": 3,
  "tagMappings": [
    {
      "fromTag": {
        "tag": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
        "learningOutcomeId": "69733c5b285ad1330ea3315a",
        "learningOutcomeText": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
        "classLevel": 6,
        "className": "Class 6"
      },
      "toTag": {
        "tag": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
        "learningOutcomeId": "69733c6d285ad1330ea33275",
        "learningOutcomeText": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
        "classLevel": 7,
        "className": "Class 7"
      },
      "relevanceScore": 0.85,
      "relation": "progression",
      "reason": "Tag A focuses on foundational understanding of variables and creating basic algebraic expressions from real-world situations. Tag B builds on this foundation by requiring manipulation and simplification of algebraic expressions through addition, subtraction, and combining like terms, representing a clear progression from conceptual understanding to operational fluency."
    },
    {
      "fromTag": {
        "tag": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
        "learningOutcomeId": "69733c5b285ad1330ea3315a",
        "learningOutcomeText": "Uses variables to represent unknown quantities.\nUses variables with different operations to generalise given situations.\nWrites algebraic expressions for simple real-life situations such as finding the perimeter of a rectangle.",
        "classLevel": 6,
        "className": "Class 6"
      },
      "toTag": {
        "tag": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
        "learningOutcomeId": "69733c7c285ad1330ea333b8",
        "learningOutcomeText": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
        "classLevel": 8,
        "className": "Class 8"
      },
      "relevanceScore": 0.85,
      "relation": "progression",
      "reason": "Tag A introduces foundational algebraic concepts (variables, expressions, basic modeling), while Tag B builds upon these with advanced operations (multiplication, expansion, identities, factorization) and problem-solving applications, representing a clear progression from basic algebraic understanding to more complex algebraic manipulation."
    },
    {
      "fromTag": {
        "tag": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
        "learningOutcomeId": "69733c6d285ad1330ea33275",
        "learningOutcomeText": "Adds algebraic expressions involving like terms.\nSubtracts algebraic expressions involving like terms.\nSimplifies algebraic expressions using appropriate operations.\nRepresents simple situations using algebraic expressions.",
        "classLevel": 7,
        "className": "Class 7"
      },
      "toTag": {
        "tag": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
        "learningOutcomeId": "69733c7c285ad1330ea333b8",
        "learningOutcomeText": "Multiplies algebraic expressions.\nExpands algebraic expressions such as (2x − 5)(3x + 7).\nUses algebraic identities to simplify expressions.\nApplies algebraic identities to solve problems in daily life situations.\nFactorises algebraic expressions using suitable methods.\nUses factorisation to solve simple algebraic problems.",
        "classLevel": 8,
        "className": "Class 8"
      },
      "relevanceScore": 0.85,
      "relation": "progression",
      "reason": "Tag A focuses on basic algebraic operations (addition, subtraction, simplification) with like terms and simple expressions, while Tag B progresses to more advanced operations (multiplication, expansion, factorization) and applies algebraic identities to solve problems. Both deal with algebraic expressions but at different complexity levels - from fundamental operations to more sophisticated manipulation and application."
    }
  ]
}
```

**Response Summary:**
- **Topic:** Algebraic Expressions, Identities and Factorisation
- **Total Learning Outcomes:** 3 (Class 6, 7, and 8)
- **Total Tags:** Individual tags split from learning outcomes by comma and newline (e.g., "Adds algebraic expressions involving like terms" is one tag, "Subtracts algebraic expressions involving like terms" is another)
- **Total Mappings Found:** Multiple mappings (all with relevance score >= 60%)
- **Progression Chain:** Shows how each tag progresses from lower classes to higher classes (Class 6 → Class 7 → Class 8)
- **Example Chain:** 
  - "Uses variables to represent unknown quantities" (Class 6) 
    → "Adds algebraic expressions involving like terms" (Class 7) 
    → "Multiplies algebraic expressions" (Class 8)

**Response Structure:**
- `tagMappings`: Flat array of all tag-to-tag mappings (from lower class to higher class only)
- `tagChains`: Grouped by source tag, showing all progressions from that tag to higher classes

**Example Tag Chain Structure:**
```json
{
  "tagChains": [
    {
      "tag": "Adds algebraic expressions involving like terms.",
      "classLevel": 7,
      "className": "Class 7",
      "learningOutcomeId": "69733c6d285ad1330ea33275",
      "progressions": [
        {
          "toTag": "Multiplies algebraic expressions.",
          "toClassLevel": 8,
          "toClassName": "Class 8",
          "toLearningOutcomeId": "69733c7c285ad1330ea333b8",
          "relevanceScore": 0.85,
          "relation": "progression",
          "reason": "Tag A focuses on basic algebraic operations..."
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
| `tagChains` | array | Tag chains grouped by source tag showing progression paths |
| `tagChains[].tag` | string | The source tag text |
| `tagChains[].classLevel` | number | Class level of the source tag |
| `tagChains[].className` | string | Class name of the source tag |
| `tagChains[].learningOutcomeId` | string | Learning outcome ID containing this tag |
| `tagChains[].progressions` | array | Array of progressions from this tag to higher classes |
| `tagChains[].progressions[].toTag` | string | Target tag text |
| `tagChains[].progressions[].toClassLevel` | number | Target class level |
| `tagChains[].progressions[].toClassName` | string | Target class name |
| `tagChains[].progressions[].relevanceScore` | number | Relevance score (>= 0.6) |
| `tagChains[].progressions[].relation` | string | Relation type |
| `tagChains[].progressions[].reason` | string | Explanation |

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
2. **Tag Extraction**: Tags are extracted by splitting on both commas (`,`) and newlines (`\n`), preserving LaTeX/KaTeX expressions
3. **Progression Chain**: Only maps from lower classes to higher classes (e.g., Class 2 → Class 3 → Class 4 → Class 6)
4. **Individual Tag Mapping**: Each tag is mapped individually, not the entire learning outcome text
5. **AI Processing**: Uses DeepSeek AI API to analyze semantic relationships between individual tags
6. **Tag Chains**: Response includes both flat `tagMappings` array and grouped `tagChains` showing progression paths
7. **Sorting**: Mappings are sorted by class level (ascending) then by relevance score (descending)
8. **Performance**: This endpoint may take longer to respond as it makes multiple AI API calls (one per tag pair)

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

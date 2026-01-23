# Concept Graph API Documentation

## Overview

The Concept Graph API provides endpoints to generate, store, and retrieve concept-wise vertical learning graphs for topics. These graphs show how learning outcomes progress across different class levels, organized by concepts.

**Key Features:**
- AI-powered concept graph generation using DeepSeek API
- Graphs stored in database for fast retrieval
- Background sync process for all topics
- Topic list with concept graph status

---

## Base URL

```
https://academic-7mkg.onrender.com/api/admin
```

All endpoints require authentication (Bearer token) and admin privileges.

---

## Endpoints

### 1. Get Topic List

Get a list of all topics with their concept graph status.

**Endpoint:** `GET /curriculum/topics`

**Query Parameters:**
- `type` (required): `SUBJECT` or `BASIC_CALCULATION`
- `subjectId` (optional): Subject ID (required for SUBJECT type if filtering by subject)

**Example Request:**
```bash
GET /api/admin/curriculum/topics?type=SUBJECT&subjectId=696f1e32570003266cdcf305
```

**Response:**
```json
{
  "success": true,
  "totalTopics": 5,
  "topics": [
    {
      "topicName": "Numbers",
      "hasConceptGraph": true,
      "lastCalculatedAt": "2026-01-23T10:30:00.000Z",
      "totalConcepts": 7,
      "totalNodes": 75,
      "totalEdges": 58
    },
    {
      "topicName": "Algebra",
      "hasConceptGraph": false,
      "lastCalculatedAt": null,
      "totalConcepts": 0,
      "totalNodes": 0,
      "totalEdges": 0
    }
  ]
}
```

**Response Fields:**
- `success`: Boolean indicating success
- `totalTopics`: Total number of topics
- `topics`: Array of topic objects with:
  - `topicName`: Name of the topic
  - `hasConceptGraph`: Whether a concept graph exists for this topic
  - `lastCalculatedAt`: Timestamp of last calculation (null if not calculated)
  - `totalConcepts`: Number of concepts in the graph
  - `totalNodes`: Total number of nodes
  - `totalEdges`: Total number of edges

---

### 2. Get Concept Graph for a Topic

Retrieve the concept graph for a specific topic from the database.

**Endpoint:** `GET /curriculum/topics/:topicName/concept-graph`

**URL Parameters:**
- `topicName` (required): Name of the topic

**Query Parameters:**
- `type` (required): `SUBJECT` or `BASIC_CALCULATION`
- `subjectId` (optional): Subject ID (required for SUBJECT type if filtering by subject)

**Example Request:**
```bash
GET /api/admin/curriculum/topics/Numbers/concept-graph?type=SUBJECT&subjectId=696f1e32570003266cdcf305
```

**Response:**
```json
{
  "success": true,
  "conceptGraph": {
    "subject": "Mathematics",
    "topic": "Numbers",
    "type": "SUBJECT",
    "graphType": "concept_wise_vertical_learning_graph",
    "conceptGraphs": [
      {
        "concept": "Place Value",
        "nodes": [
          {
            "id": "pv_3_1",
            "class": 3,
            "tag": "Reads and writes three-digit numbers up to 999 using place value."
          },
          {
            "id": "pv_3_2",
            "class": 3,
            "tag": "Compares and orders numbers up to 999 based on their place value."
          },
          {
            "id": "pv_5_1",
            "class": 5,
            "tag": "Reads and writes large numbers (greater than 1000) used in daily life situations."
          },
          {
            "id": "pv_5_2",
            "class": 5,
            "tag": "Uses place value understanding to perform addition, subtraction, multiplication and division on numbers greater than 1000."
          }
        ],
        "edges": [
          {
            "from": "pv_3_1",
            "to": "pv_5_1"
          },
          {
            "from": "pv_3_2",
            "to": "pv_5_1"
          },
          {
            "from": "pv_5_1",
            "to": "pv_5_2"
          }
        ]
      },
      {
        "concept": "Addition and Subtraction",
        "nodes": [
          {
            "id": "as_3_1",
            "class": 3,
            "tag": "Adds three-digit numbers with and without regrouping where the sum does not exceed 999."
          }
        ],
        "edges": []
      }
    ],
    "totalNodes": 75,
    "totalEdges": 58,
    "totalConcepts": 7,
    "lastCalculatedAt": "2026-01-23T10:30:00.000Z"
  }
}
```

**Response Fields:**
- `success`: Boolean indicating success
- `conceptGraph`: Object containing:
  - `subject`: Subject name
  - `topic`: Topic name
  - `type`: Type (SUBJECT or BASIC_CALCULATION)
  - `graphType`: Type of graph (always "concept_wise_vertical_learning_graph")
  - `conceptGraphs`: Array of concept objects, each containing:
    - `concept`: Name of the concept
    - `nodes`: Array of node objects with:
      - `id`: Unique node identifier
      - `class`: Class level (number)
      - `tag`: Learning outcome tag text
    - `edges`: Array of edge objects with:
      - `from`: Source node ID
      - `to`: Target node ID
  - `totalNodes`: Total number of nodes across all concepts
  - `totalEdges`: Total number of edges across all concepts
  - `totalConcepts`: Number of concepts
  - `lastCalculatedAt`: Timestamp of last calculation

**Error Response (404):**
```json
{
  "message": "Concept graph not found for topic: Numbers. Please sync first."
}
```

---

### 3. Sync All Concept Graphs

Start a background process to generate and save concept graphs for all topics.

**Endpoint:** `POST /curriculum/sync-concept-graphs`

**Query Parameters:**
- `type` (required): `SUBJECT` or `BASIC_CALCULATION`
- `subjectId` (optional): Subject ID (required for SUBJECT type if filtering by subject)

**Example Request:**
```bash
POST /api/admin/curriculum/sync-concept-graphs?type=SUBJECT&subjectId=696f1e32570003266cdcf305
```

**Response:**
```json
{
  "success": true,
  "message": "Concept graph sync started in background. This may take several minutes.",
  "status": "processing"
}
```

**Note:** This endpoint returns immediately and processes in the background. The sync process:
- Fetches all topics for the given type/subject
- Generates concept graphs using DeepSeek AI for each topic
- Saves graphs to the database
- Logs progress to the server console

**Processing Time:** The sync process may take several minutes depending on the number of topics and tags. Each topic requires AI API calls which can take 30-180 seconds per topic.

---

## Graph Structure

### Concept Graph Format

A concept graph organizes learning outcomes into concepts, showing vertical progression across class levels:

```json
{
  "concept": "Place Value",
  "nodes": [
    { "id": "pv_3_1", "class": 3, "tag": "..." },
    { "id": "pv_5_1", "class": 5, "tag": "..." }
  ],
  "edges": [
    { "from": "pv_3_1", "to": "pv_5_1" }
  ]
}
```

**Key Characteristics:**
- **Nodes**: Represent individual learning outcome tags at specific class levels
- **Edges**: Show progression from lower class to higher class within the same concept
- **Concepts**: Group related learning outcomes (e.g., "Place Value", "Addition and Subtraction")
- **Class Continuity**: Edges maintain sequential progression (Class 3 → 4 → 5 → 6 → 7 → 8)

---

## Frontend Integration

### Workflow

1. **Get Topic List:**
   ```javascript
   const response = await fetch('/api/admin/curriculum/topics?type=SUBJECT&subjectId=...', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   const { topics } = await response.json();
   ```

2. **Display Topics:**
   - Show list of topics with concept graph status
   - Indicate which topics have graphs (green checkmark) vs. need sync (sync icon)

3. **On Topic Click:**
   ```javascript
   const response = await fetch(`/api/admin/curriculum/topics/${topicName}/concept-graph?type=SUBJECT&subjectId=...`, {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   const { conceptGraph } = await response.json();
   ```

4. **Render Graph:**
   - Use a graph visualization library (e.g., D3.js, vis.js, Cytoscape.js)
   - Display nodes by class level (vertically or horizontally)
   - Show edges connecting related nodes
   - Group nodes by concept

5. **Sync All Graphs:**
   ```javascript
   const response = await fetch('/api/admin/curriculum/sync-concept-graphs?type=SUBJECT&subjectId=...', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` }
   });
   // Show loading indicator - sync runs in background
   ```

---

## Example: Numbers Topic Concept Graph

**Concepts:**
1. Place Value (4 nodes, 3 edges)
2. Addition and Subtraction (12 nodes, 11 edges)
3. Multiplication and Division (17 nodes, 16 edges)
4. Fractions (14 nodes, 13 edges)
5. Decimals (8 nodes, 7 edges)
6. Number Properties (3 nodes, 2 edges)
7. Money and Measurement (7 nodes, 6 edges)

**Total:** 65 nodes, 58 edges across 7 concepts

---

## Error Handling

### Common Errors

**400 Bad Request:**
- Missing required parameter `type`
- Invalid `type` value

**404 Not Found:**
- Concept graph not found for topic (sync required)

**500 Internal Server Error:**
- AI API failure
- Database error
- Invalid data format

---

## Notes

- Concept graphs are generated using DeepSeek AI and may take time
- Graphs are stored in the database for fast retrieval
- Sync process runs in background - check server logs for progress
- Each topic's graph is independent and can be synced individually
- Graphs are automatically updated when learning outcomes change (future enhancement)

---

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/curriculum/topics` | GET | Get topic list with graph status |
| `/curriculum/topics/:topicName/concept-graph` | GET | Get concept graph for a topic |
| `/curriculum/sync-concept-graphs` | POST | Sync all concept graphs (background) |

---

## Testing

### Test Script Example

```javascript
const axios = require('axios');

const API_URL = 'https://academic-7mkg.onrender.com/api';
const token = 'YOUR_TOKEN';

// 1. Get topic list
const topicsRes = await axios.get(`${API_URL}/admin/curriculum/topics`, {
  params: { type: 'SUBJECT', subjectId: '696f1e32570003266cdcf305' },
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log('Topics:', topicsRes.data.topics);

// 2. Get concept graph for Numbers
const graphRes = await axios.get(`${API_URL}/admin/curriculum/topics/Numbers/concept-graph`, {
  params: { type: 'SUBJECT', subjectId: '696f1e32570003266cdcf305' },
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log('Concept Graph:', graphRes.data.conceptGraph);

// 3. Sync all graphs
const syncRes = await axios.post(`${API_URL}/admin/curriculum/sync-concept-graphs`, {}, {
  params: { type: 'SUBJECT', subjectId: '696f1e32570003266cdcf305' },
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log('Sync started:', syncRes.data.message);
```

---

**Last Updated:** January 23, 2026

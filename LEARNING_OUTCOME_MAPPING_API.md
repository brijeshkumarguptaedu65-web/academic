# Learning Outcome Tag-Wise Mapping API Documentation

**Base URL:** `https://academic-7mkg.onrender.com`

**Authentication:** All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📋 Overview

The system now uses **tag-wise mapping** (comma-separated tags) instead of topic-wise mapping. When learning outcomes are created/updated/deleted, tag-wise mappings are automatically calculated using DeepSeek AI and saved to the database. The API fetches mappings from the database (no AI calls on GET requests).

---

## 🔄 What Changed

### Before:
- Mappings were calculated topic-wise
- `classId` was required in GET requests
- Mappings were calculated on-demand

### After:
- ✅ **Tag-wise mapping**: Each comma-separated tag is mapped individually
- ✅ `classId` is now **optional** in GET requests
- ✅ Mappings are **automatically calculated** on create/update/delete
- ✅ Mappings are **saved to database** for fast retrieval
- ✅ API responses include `fromTag` and `toTag` fields

---

## 📡 API Endpoints

### 1. Get Learning Outcomes (with Mappings)

**Endpoint:** `GET /api/admin/learning-outcomes`

**Description:** Returns learning outcomes with their tag-wise mappings from the database.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (string, **required**): `"SUBJECT"` or `"BASIC_CALCULATION"`
- `classId` (string, **optional**): Filter by class ID
- `subjectId` (string, **optional**): Filter by subject ID (for SUBJECT type)

**Example URLs:**
```
GET /api/admin/learning-outcomes?type=SUBJECT
GET /api/admin/learning-outcomes?type=SUBJECT&subjectId=696f1e32570003266cdcf305
GET /api/admin/learning-outcomes?type=SUBJECT&classId=696f1f53219928cc7c5cb84c&subjectId=696f1e32570003266cdcf305
GET /api/admin/learning-outcomes?type=BASIC_CALCULATION
```

**Response:**
```json
[
  {
    "_id": "6971d1424f0073675925cadf",
    "id": "6971d1424f0073675925cadf",
    "text": "Understanding addition (1–10), adding single-digit numbers (1–20), solving simple addition word problems",
    "type": "SUBJECT",
    "classId": {
      "_id": "696f1f53219928cc7c5cb84c",
      "name": "Class 2",
      "level": 2
    },
    "subjectId": {
      "_id": "696f1e32570003266cdcf305",
      "name": "Mathematics"
    },
    "topicName": "Addition",
    "contents": [],
    "remedials": [],
    "mappedLearningOutcomes": [
      {
        "learningOutcomeId": "6971d19b4f0073675925cb01",
        "learningOutcome": {
          "id": "6971d19b4f0073675925cb01",
          "text": "adding two-digit numbers with carry (up to 99), adding three or more numbers",
          "tags": [
            "adding two-digit numbers with carry (up to 99)",
            "adding three or more numbers"
          ],
          "classLevel": 3,
          "className": "Class 3",
          "topicName": "Addition",
          "type": "SUBJECT"
        },
        "mappingType": "PROGRESSION",
        "relevanceScore": 0.81,
        "reason": "adding single-digit numbers (1–20) → adding three or more numbers: Both involve addition of multiple numbers; Class 3 extends quantity and complexity.",
        "fromTag": "adding single-digit numbers (1–20)",
        "toTag": "adding three or more numbers"
      }
    ],
    "createdAt": "2026-01-22T07:26:58.476Z",
    "updatedAt": "2026-01-22T07:26:58.476Z"
  }
]
```

**Key Fields:**
- `mappedLearningOutcomes[]`: Array of tag-wise mappings
  - `fromTag`: Tag from current learning outcome
  - `toTag`: Tag from mapped learning outcome
  - `mappingType`: `PREREQUISITE`, `PROGRESSION`, `RELATED`, or `ADVANCED`
  - `relevanceScore`: 0.0 to 1.0
  - `reason`: Explanation of the mapping

---

### 2. Create Learning Outcome

**Endpoint:** `POST /api/admin/learning-outcomes`

**Description:** Creates a new learning outcome. Tag-wise mappings are automatically calculated in the background.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Understanding addition (1–10), adding single-digit numbers (1–20), solving simple addition word problems",
  "type": "SUBJECT",
  "classId": "696f1f53219928cc7c5cb84c",
  "subjectId": "696f1e32570003266cdcf305",
  "topicName": "Addition",
  "instruction": "Optional instruction text"
}
```

**Parameters:**
- `text` (string, **required**): Comma-separated tags (e.g., "tag1, tag2, tag3")
- `type` (string, **required**): `"SUBJECT"` or `"BASIC_CALCULATION"`
- `classId` (string, **required**): Class ID
- `subjectId` (string, **required for SUBJECT type**): Subject ID
- `topicName` (string, **optional**): Topic name
- `instruction` (string, **optional**): Additional instruction

**Response:**
```json
{
  "_id": "6971d1424f0073675925cadf",
  "id": "6971d1424f0073675925cadf",
  "text": "Understanding addition (1–10), adding single-digit numbers (1–20), solving simple addition word problems",
  "type": "SUBJECT",
  "classId": {
    "_id": "696f1f53219928cc7c5cb84c",
    "name": "Class 2",
    "level": 2
  },
  "subjectId": {
    "_id": "696f1e32570003266cdcf305",
    "name": "Mathematics"
  },
  "topicName": "Addition",
  "createdAt": "2026-01-22T07:26:58.476Z",
  "updatedAt": "2026-01-22T07:26:58.476Z"
}
```

**Note:** Mappings are calculated in the background. Wait a few seconds before fetching to see mappings.

---

### 3. Update Learning Outcome

**Endpoint:** `PUT /api/admin/learning-outcomes/:id`

**Description:** Updates a learning outcome. If `text` or `topicName` is changed, mappings are automatically recalculated.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string, **required**): Learning Outcome ID

**Request Body (all fields optional):**
```json
{
  "text": "Updated text with tags, comma separated",
  "topicName": "Updated Topic",
  "instruction": "Updated instruction"
}
```

**Response:**
```json
{
  "_id": "6971d1424f0073675925cadf",
  "id": "6971d1424f0073675925cadf",
  "text": "Updated text with tags, comma separated",
  "type": "SUBJECT",
  "classId": {
    "_id": "696f1f53219928cc7c5cb84c",
    "name": "Class 2",
    "level": 2
  },
  "subjectId": {
    "_id": "696f1e32570003266cdcf305",
    "name": "Mathematics"
  },
  "topicName": "Updated Topic",
  "updatedAt": "2026-01-22T08:00:00.000Z"
}
```

**Note:** If `text` or `topicName` is updated, mappings are recalculated in the background.

---

### 4. Delete Learning Outcome

**Endpoint:** `DELETE /api/admin/learning-outcomes/:id`

**Description:** Deletes a learning outcome and its mappings. Also recalculates mappings for affected learning outcomes.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, **required**): Learning Outcome ID

**Response:**
```json
{
  "message": "Learning outcome removed"
}
```

---

### 5. Recalculate Learning Outcome Mapping (Manual)

**Endpoint:** `POST /api/admin/curriculum/learning-outcomes/:learningOutcomeId/recalculate-mapping`

**Description:** Manually triggers recalculation of tag-wise mappings for a specific learning outcome.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `learningOutcomeId` (string, **required**): Learning Outcome ID

**Response:**
```json
{
  "success": true,
  "message": "Learning outcome mapping recalculated and saved",
  "learningOutcome": {
    "id": "6971d1424f0073675925cadf",
    "text": "Understanding addition (1–10), adding single-digit numbers (1–20), solving simple addition word problems",
    "tags": [
      "Understanding addition (1–10)",
      "adding single-digit numbers (1–20)",
      "solving simple addition word problems"
    ],
    "classLevel": 2,
    "className": "Class 2",
    "topicName": "Addition",
    "type": "SUBJECT"
  },
  "mappedLearningOutcomes": [
    {
      "learningOutcomeId": "6971d19b4f0073675925cb01",
      "learningOutcome": {
        "id": "6971d19b4f0073675925cb01",
        "text": "adding two-digit numbers with carry (up to 99), adding three or more numbers",
        "tags": [
          "adding two-digit numbers with carry (up to 99)",
          "adding three or more numbers"
        ],
        "classLevel": 3,
        "className": "Class 3",
        "topicName": "Addition",
        "type": "SUBJECT"
      },
      "mappingType": "PROGRESSION",
      "relevanceScore": 0.81,
      "reason": "adding single-digit numbers (1–20) → adding three or more numbers: Both involve addition of multiple numbers; Class 3 extends quantity and complexity.",
      "fromTag": "adding single-digit numbers (1–20)",
      "toTag": "adding three or more numbers"
    }
  ],
  "lastCalculatedAt": "2026-01-22T08:00:00.000Z"
}
```

---

## 🔧 Frontend Reimplementation Guide

### ⚠️ APIs That Need Frontend Updates

#### 1. **GET Learning Outcomes API** ⚠️ **MUST UPDATE**

**What Changed:**
- `classId` is now **optional** (was required before)
- Response now includes `mappedLearningOutcomes[]` with tag-wise mappings
- New fields: `fromTag`, `toTag` in each mapping

**Old Frontend Code:**
```javascript
// ❌ OLD - classId was required
const response = await fetch(
  `/api/admin/learning-outcomes?classId=${classId}&subjectId=${subjectId}&type=${type}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

**New Frontend Code:**
```javascript
// ✅ NEW - classId is optional
const params = new URLSearchParams({ type });
if (classId) params.append('classId', classId);
if (subjectId) params.append('subjectId', subjectId);

const response = await fetch(
  `/api/admin/learning-outcomes?${params}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const learningOutcomes = await response.json();

// Access mappings
learningOutcomes.forEach(lo => {
  console.log('Learning Outcome:', lo.text);
  console.log('Mappings:', lo.mappedLearningOutcomes);
  
  lo.mappedLearningOutcomes.forEach(mapping => {
    console.log(`  ${mapping.fromTag} → ${mapping.toTag}`);
    console.log(`  Type: ${mapping.mappingType}, Score: ${mapping.relevanceScore}`);
  });
});
```

**UI Display Example:**
```jsx
{learningOutcome.mappedLearningOutcomes.map((mapping, idx) => (
  <div key={idx} className="mapping-item">
    <div className="tag-mapping">
      <span className="from-tag">{mapping.fromTag}</span>
      <span>→</span>
      <span className="to-tag">{mapping.toTag}</span>
    </div>
    <div className="mapping-info">
      <span className="type">{mapping.mappingType}</span>
      <span className="score">Score: {mapping.relevanceScore.toFixed(2)}</span>
    </div>
    <div className="reason">{mapping.reason}</div>
    <div className="mapped-lo">
      Class {mapping.learningOutcome.classLevel}: {mapping.learningOutcome.text}
    </div>
  </div>
))}
```

---

#### 2. **Create Learning Outcome API** ✅ **No Changes Needed**

The API signature hasn't changed, but note:
- Mappings are calculated automatically in background
- Wait 2-3 seconds after creation before fetching to see mappings

**Frontend Code:**
```javascript
// ✅ Same as before
const response = await fetch('/api/admin/learning-outcomes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "tag1, tag2, tag3", // Comma-separated tags
    type: "SUBJECT",
    classId: "class_id",
    subjectId: "subject_id",
    topicName: "Topic Name"
  })
});

const newOutcome = await response.json();

// Wait a bit for mappings to calculate, then fetch again
setTimeout(async () => {
  const updated = await fetchLearningOutcomes();
  // Now updated will have mappings
}, 3000);
```

---

#### 3. **Update Learning Outcome API** ✅ **No Changes Needed**

Same API, but note:
- If `text` or `topicName` changes, mappings are recalculated automatically

**Frontend Code:**
```javascript
// ✅ Same as before
const response = await fetch(`/api/admin/learning-outcomes/${id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "updated tags, comma separated",
    topicName: "Updated Topic"
  })
});
```

---

#### 4. **Delete Learning Outcome API** ✅ **No Changes Needed**

Same API, no changes needed.

---

#### 5. **Recalculate Mapping API** ⭐ **NEW - Optional**

Use this if you need to manually trigger recalculation.

**Frontend Code:**
```javascript
// ⭐ NEW - Optional manual recalculation
const recalculateMapping = async (learningOutcomeId) => {
  const response = await fetch(
    `/api/admin/curriculum/learning-outcomes/${learningOutcomeId}/recalculate-mapping`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const result = await response.json();
  console.log('Recalculated mappings:', result.mappedLearningOutcomes);
};
```

---

## 📊 Complete API Summary

| Method | Endpoint | Status | Frontend Action |
|--------|----------|--------|-----------------|
| GET | `/api/admin/learning-outcomes` | ⚠️ **CHANGED** | **MUST UPDATE** - classId optional, new mapping fields |
| POST | `/api/admin/learning-outcomes` | ✅ Same | No changes (but wait for mappings) |
| PUT | `/api/admin/learning-outcomes/:id` | ✅ Same | No changes |
| DELETE | `/api/admin/learning-outcomes/:id` | ✅ Same | No changes |
| POST | `/api/admin/curriculum/learning-outcomes/:id/recalculate-mapping` | ⭐ **NEW** | Optional - for manual recalculation |

---

## 🎯 Key Points for Frontend

1. **classId is Optional**: You can now fetch all learning outcomes of a type without filtering by class
2. **Mappings in Response**: Every learning outcome now includes `mappedLearningOutcomes[]` array
3. **Tag Information**: Each mapping shows `fromTag` and `toTag` for tag-wise relationships
4. **Automatic Calculation**: Mappings are calculated automatically, no need to call recalculation API unless needed
5. **Wait for Mappings**: After creating/updating, wait 2-3 seconds before fetching to see new mappings

---

## 🔍 Example: Complete Frontend Flow

```javascript
// 1. Fetch all learning outcomes (no classId filter)
const fetchAllLearningOutcomes = async (type, subjectId) => {
  const params = new URLSearchParams({ type });
  if (subjectId) params.append('subjectId', subjectId);
  
  const response = await fetch(
    `/api/admin/learning-outcomes?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  return await response.json();
};

// 2. Create new learning outcome
const createLearningOutcome = async (data) => {
  const response = await fetch('/api/admin/learning-outcomes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  const newOutcome = await response.json();
  
  // Wait for mappings to calculate
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Fetch again to get mappings
  const updated = await fetchAllLearningOutcomes(data.type, data.subjectId);
  return updated.find(lo => lo.id === newOutcome.id);
};

// 3. Display mappings in UI
const displayMappings = (learningOutcome) => {
  if (!learningOutcome.mappedLearningOutcomes?.length) {
    return <div>No mappings found</div>;
  }
  
  return (
    <div className="mappings">
      <h3>Tag-wise Mappings</h3>
      {learningOutcome.mappedLearningOutcomes.map((mapping, idx) => (
        <div key={idx} className="mapping-card">
          <div className="tag-pair">
            <span className="from">{mapping.fromTag}</span>
            <span>→</span>
            <span className="to">{mapping.toTag}</span>
          </div>
          <div className="details">
            <span className="type">{mapping.mappingType}</span>
            <span className="score">{mapping.relevanceScore.toFixed(2)}</span>
          </div>
          <div className="reason">{mapping.reason}</div>
          <div className="mapped-class">
            Class {mapping.learningOutcome.classLevel}: {mapping.learningOutcome.text}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🚀 Migration Checklist

- [ ] Update GET learning outcomes API call (remove classId requirement)
- [ ] Update UI to display `mappedLearningOutcomes[]` array
- [ ] Display `fromTag` and `toTag` in mapping cards
- [ ] Show `mappingType` and `relevanceScore` in UI
- [ ] Add loading state while mappings are calculated (2-3 seconds after create/update)
- [ ] (Optional) Add manual recalculation button using new endpoint

---

## 📝 Notes

- Mappings are calculated **automatically** - no manual trigger needed
- Mappings are stored in **database** - fast retrieval, no AI calls on GET
- Tag-wise mapping means each comma-separated tag is mapped individually
- One learning outcome can map to multiple other learning outcomes
- Mappings include class progression information (prerequisite → progression)

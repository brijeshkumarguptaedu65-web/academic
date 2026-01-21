# Complete API Documentation for Frontend Implementation

**Base URL:** `https://academic-7mkg.onrender.com`

**Authentication:** Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Table of Contents

1. [Authentication APIs](#1-authentication-apis)
2. [Dashboard & Analytics APIs](#2-dashboard--analytics-apis)
3. [Class Management APIs](#3-class-management-apis)
4. [Subject Management APIs](#4-subject-management-apis)
5. [Chapter Management APIs](#5-chapter-management-apis)
6. [Chapter Content APIs](#6-chapter-content-apis)
7. [Remedial Content APIs](#7-remedial-content-apis)
8. [Learning Outcomes APIs](#8-learning-outcomes-apis)
9. [Instruction Management APIs](#9-instruction-management-apis)
10. [Test Management APIs](#10-test-management-apis)
11. [Basic Test Config APIs](#11-basic-test-config-apis)
12. [Topic Management APIs](#12-topic-management-apis)
13. [Plans & Subscription APIs](#13-plans--subscription-apis)
14. [Student-Facing APIs](#14-student-facing-apis)

---

## 1. Authentication APIs

### 1.1 Admin Login

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/auth/admin/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@university.edu",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "admin@university.edu",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email or password format
- `401 Unauthorized`: Invalid credentials

**Example (JavaScript/Fetch):**
```javascript
const response = await fetch('https://academic-7mkg.onrender.com/api/auth/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@university.edu',
    password: 'password123'
  })
});

const data = await response.json();
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data));
```

---

### 1.2 Admin Register

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/auth/admin/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@university.edu",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "admin@university.edu",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.3 Student Login

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/auth/student/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "student123",
  "class": 12
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "student123",
  "class": 12,
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Dashboard & Analytics APIs

### 2.1 Get Dashboard Statistics

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/stats/dashboard`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "totalStudents": 1240,
  "activeStudents": 942,
  "totalRevenue": 50000,
  "testsTaken": 3500
}
```

**Example:**
```javascript
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/stats/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
```

---

### 2.2 Get All Students

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/students`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:** None

**Response (200 OK):**
```json
[
  {
    "id": "student_id_1",
    "name": "John Doe",
    "grade": "12th Grade",
    "level": 12,
    "lastScore": 85,
    "status": "Active",
    "avatar": "avatar_url_or_id"
  }
]
```

---

### 2.3 Get Student Performance

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/students/:studentId/performance`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `studentId` (string, required): Student ID

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "studentId": "student_id_1",
  "performance": {
    "averageScore": 85,
    "testsCompleted": 15,
    "chaptersCompleted": 8
  }
}
```

**Example:**
```javascript
const studentId = "student_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/students/${studentId}/performance`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

### 2.4 Get Revenue Stats

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/revenue`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "totalRevenue": 50000,
  "monthlyRevenue": 5000,
  "subscriptions": 200
}
```

---

## 3. Class Management APIs

### 3.1 Get All Classes

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/classes`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:** None

**Response (200 OK):**
```json
[
  {
    "_id": "class_id_1",
    "id": "class_id_1",
    "name": "Class 5",
    "level": 5
  }
]
```

---

### 3.2 Create Class

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/classes`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Class 5",
  "level": 5
}
```

**Required Fields:**
- `name` (string, required): Class name
- `level` (number, required): Class level (must be unique)

**Response (201 Created):**
```json
{
  "_id": "class_id_1",
  "name": "Class 5",
  "level": 5,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```javascript
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/classes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Class 5',
    level: 5
  })
});
```

---

### 3.3 Update Class

**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/classes/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string, required): Class ID

**Request Body:**
```json
{
  "name": "Class 5 Updated",
  "level": 5
}
```

**Fields (all optional):**
- `name` (string): Class name
- `level` (number): Class level

**Response (200 OK):**
```json
{
  "_id": "class_id_1",
  "name": "Class 5 Updated",
  "level": 5,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```javascript
const classId = "class_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/classes/${classId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Class 5 Updated',
    level: 5
  })
});
```

---

### 3.4 Delete Class

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/classes/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): Class ID

**Response (200 OK):**
```json
{
  "message": "Class removed"
}
```

**Example:**
```javascript
const classId = "class_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/classes/${classId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## 4. Subject Management APIs

### 4.1 Get All Subjects

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/subjects`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:** None

**Response (200 OK):**
```json
[
  {
    "_id": "subject_id_1",
    "id": "subject_id_1",
    "name": "Mathematics",
    "classId": "class_id_1"
  }
]
```

---

### 4.2 Create Subject

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/subjects`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Mathematics",
  "classId": "class_id_1"
}
```

**Required Fields:**
- `name` (string, required): Subject name

**Optional Fields:**
- `classId` (string): Class ID (optional)

**Response (201 Created):**
```json
{
  "_id": "subject_id_1",
  "name": "Mathematics",
  "classId": "class_id_1",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4.3 Update Subject

**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/subjects/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string, required): Subject ID

**Request Body:**
```json
{
  "name": "Mathematics Updated",
  "classId": "class_id_1"
}
```

**Fields (all optional):**
- `name` (string): Subject name
- `classId` (string): Class ID

**Response (200 OK):**
```json
{
  "_id": "subject_id_1",
  "name": "Mathematics Updated",
  "classId": "class_id_1"
}
```

---

### 4.4 Delete Subject

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/subjects/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): Subject ID

**Response (200 OK):**
```json
{
  "message": "Subject removed"
}
```

---

## 5. Chapter Management APIs

### 5.1 Get All Chapters

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/chapters`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `classId` (string, optional): Filter by class ID
- `subjectId` (string, optional): Filter by subject ID

**Response (200 OK):**
```json
[
  {
    "_id": "chapter_id_1",
    "id": "chapter_id_1",
    "classId": {
      "_id": "class_id_1",
      "name": "Class 5",
      "level": 5
    },
    "classLevel": 5,
    "subjectId": {
      "_id": "subject_id_1",
      "name": "Mathematics"
    },
    "subject": "Mathematics",
    "name": "Shapes 101",
    "chapterName": "Shapes 101",
    "topicName": "Geometry",
    "contents": [
      {
        "_id": "content_id_1",
        "type": "PDF",
        "title": "Chapter PDF",
        "url": "https://example.com/file.pdf",
        "text": "Extracted PDF text content..."
      }
    ],
    "remedials": [
      {
        "_id": "remedial_id_1",
        "type": "VIDEO",
        "title": "Video Tutorial",
        "content": "https://youtube.com/watch?v=..."
      }
    ]
  }
]
```

**Example:**
```javascript
// Get all chapters
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/chapters', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Get chapters filtered by class and subject
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/chapters?classId=class_id_1&subjectId=subject_id_1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

### 5.2 Create Chapter

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/chapters`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "classId": "class_id_1",
  "subjectId": "subject_id_1",
  "chapterName": "Shapes 101",
  "topicName": "Geometry",
  "instructions": {
    "timeLimitMinutes": 60,
    "totalQuestions": 20,
    "passingMarks": 10,
    "difficultySplit": {
      "easy": 8,
      "medium": 8,
      "hard": 4
    }
  }
}
```

**Required Fields:**
- `classId` (string, required): Class ID
- `subjectId` (string, required): Subject ID
- `chapterName` (string, required): Chapter name
- `topicName` (string, required): Topic name (used for curriculum mapping)

**Optional Fields:**
- `instructions` (object): Chapter instructions
  - `timeLimitMinutes` (number): Time limit in minutes
  - `totalQuestions` (number): Total questions
  - `passingMarks` (number): Passing marks
  - `difficultySplit` (object): Difficulty distribution
    - `easy` (number): Easy questions count
    - `medium` (number): Medium questions count
    - `hard` (number): Hard questions count

**Response (201 Created):**
```json
{
  "_id": "chapter_id_1",
  "classId": "class_id_1",
  "subjectId": "subject_id_1",
  "chapterName": "Shapes 101",
  "topicName": "Geometry",
  "instructions": {
    "timeLimitMinutes": 60,
    "totalQuestions": 20
  },
  "contents": [],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5.3 Update Chapter

**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/chapters/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string, required): Chapter ID

**Request Body (all fields optional):**
```json
{
  "classId": "class_id_1",
  "subjectId": "subject_id_1",
  "chapterName": "Shapes 101 Updated",
  "topicName": "Geometry",
  "instructions": {
    "timeLimitMinutes": 60,
    "totalQuestions": 20
  }
}
```

**Response (200 OK):**
```json
{
  "_id": "chapter_id_1",
  "classId": "class_id_1",
  "subjectId": "subject_id_1",
  "chapterName": "Shapes 101 Updated",
  "topicName": "Geometry",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5.4 Delete Chapter

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/chapters/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): Chapter ID

**Response (200 OK):**
```json
{
  "message": "Chapter removed"
}
```

---

## 6. Chapter Content APIs

### 6.1 Add Chapter Content

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/content`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data (for file upload) OR application/json (for manual entry)
```

**URL Parameters:**
- `chapterId` (string, required): Chapter ID

**Method 1: File Upload (with automatic PDF extraction)**

**Request Body (FormData):**
- `type` (string, required): `"PDF"` | `"GBP_PDF"` | `"TEXT"`
- `title` (string, required): Content title
- `file` (File, required if type is `PDF` or `GBP_PDF`): File upload
- `text` (string, required if type is `TEXT`): Text content

**Example (PDF with file upload):**
```javascript
const formData = new FormData();
formData.append('type', 'PDF');
formData.append('title', 'Chapter PDF');
formData.append('file', fileObject); // File from input

const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/chapters/${chapterId}/content`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
    // Don't set Content-Type header - browser will set it with boundary
  },
  body: formData
});
```

**Method 2: Manual Entry (without file upload)**

**Request Body (JSON):**
```json
{
  "type": "PDF",
  "title": "Chapter PDF",
  "url": "https://example.com/chapter.pdf",
  "text": "Optional: Manually entered text content"
}
```

**Example (Manual entry):**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/chapters/${chapterId}/content`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'PDF',
    title: 'Chapter PDF',
    url: 'https://example.com/chapter.pdf',
    text: 'Optional manually entered text'
  })
});
```

**Response (201 Created):**
```json
{
  "_id": "content_id_1",
  "type": "PDF",
  "title": "Chapter PDF",
  "url": "https://storage.example.com/file.pdf",
  "text": "Extracted PDF text content...",
  "extractedTextLength": 5000,
  "isManualEntry": false
}
```

**Notes:**
- For PDF types: Either `file` (upload) OR `url` (manual) is required
- When a PDF file is uploaded, text content is automatically extracted and saved
- For manual PDF entry, you can optionally provide `text` field
- For TEXT type: `text` field is always required

---

### 6.2 Delete Chapter Content

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/content/:contentId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `chapterId` (string, required): Chapter ID
- `contentId` (string, required): Content ID

**Response (200 OK):**
```json
{
  "message": "Content removed"
}
```

**Example:**
```javascript
const chapterId = "chapter_id_1";
const contentId = "content_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/chapters/${chapterId}/content/${contentId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## 7. Remedial Content APIs

### 7.1 Get Remedials for Chapter

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/remedial`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `chapterId` (string, required): Chapter ID

**Query Parameters:** None

**Response (200 OK):**
```json
[
  {
    "_id": "remedial_id_1",
    "type": "VIDEO",
    "title": "Video Tutorial",
    "content": "https://youtube.com/watch?v=..."
  }
]
```

---

### 7.2 Add Remedial Content

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/remedial`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `chapterId` (string, required): Chapter ID

**Request Body:**
```json
{
  "type": "VIDEO",
  "title": "Video Tutorial",
  "content": "https://youtube.com/watch?v=..."
}
```

**Required Fields:**
- `type` (string, required): `"VIDEO"` | `"PDF"` | `"LINK"`
- `title` (string, required): Remedial title
- `content` (string, required): URL or content string

**Response (201 Created):**
```json
{
  "_id": "remedial_id_1",
  "type": "VIDEO",
  "title": "Video Tutorial",
  "content": "https://youtube.com/watch?v=..."
}
```

**Example:**
```javascript
const chapterId = "chapter_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/chapters/${chapterId}/remedial`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'VIDEO',
    title: 'Video Tutorial',
    content: 'https://youtube.com/watch?v=...'
  })
});
```

**Note:** For batch uploads, call this endpoint multiple times (frontend queues items and processes sequentially).

---

### 7.3 Delete Remedial Content

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/remedial/:remedialId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `chapterId` (string, required): Chapter ID
- `remedialId` (string, required): Remedial ID

**Response (200 OK):**
```json
{
  "message": "Remedial item removed"
}
```

---

### 7.4 Delete Remedial Item (Alternative Endpoint)

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/remedials/:remedialId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `remedialId` (string, required): Remedial ID

**Response (200 OK):**
```json
{
  "message": "Remedial item removed"
}
```

---

## 8. Learning Outcomes APIs

### 8.1 Get Learning Outcomes

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/learning-outcomes`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `classId` (string, required): Class ID
- `subjectId` (string, optional): Subject ID (required for SUBJECT type)
- `type` (string, required): `"SUBJECT"` | `"BASIC_CALCULATION"`

**Example Request:**
```
GET /api/admin/learning-outcomes?classId=class_id_1&subjectId=subject_id_1&type=SUBJECT
```

**Response (200 OK):**
```json
[
  {
    "id": "outcome_id_1",
    "_id": "outcome_id_1",
    "text": "Students will be able to solve basic geometry problems",
    "type": "SUBJECT",
    "classId": {
      "_id": "class_id_1",
      "name": "Class 5",
      "level": 5
    },
    "subjectId": {
      "_id": "subject_id_1",
      "name": "Mathematics"
    },
    "topicName": "Geometry",
    "instruction": "Focus on shapes and angles",
    "contents": [
      {
        "_id": "content_id_1",
        "type": "PDF",
        "title": "Geometry PDF",
        "url": "https://storage.example.com/file.pdf",
        "text": "Extracted PDF text content..."
      }
    ],
    "remedials": [
      {
        "_id": "remedial_id_1",
        "type": "VIDEO",
        "title": "Video Tutorial",
        "content": "https://youtube.com/watch?v=..."
      }
    ]
  }
]
```

**Example:**
```javascript
// Get Subject Outcomes
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/learning-outcomes?classId=class_id_1&subjectId=subject_id_1&type=SUBJECT', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Get Basic Calculation Outcomes
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/learning-outcomes?classId=class_id_1&type=BASIC_CALCULATION', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

### 8.2 Create Learning Outcome

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Students will be able to solve basic geometry problems",
  "type": "SUBJECT",
  "classId": "class_id_1",
  "subjectId": "subject_id_1",
  "topicName": "Geometry",
  "instruction": "Focus on shapes and angles"
}
```

**Required Fields:**
- `text` (string, required): Learning outcome text
- `type` (string, required): `"SUBJECT"` | `"BASIC_CALCULATION"`
- `classId` (string, required): Class ID

**Conditional Fields:**
- `subjectId` (string, required if type is `SUBJECT`): Subject ID (ignored for BASIC_CALCULATION)

**Optional Fields:**
- `topicName` (string): Topic name (used for curriculum mapping)
- `instruction` (string): Additional guidance

**Response (201 Created):**
```json
{
  "id": "outcome_id_1",
  "_id": "outcome_id_1",
  "text": "Students will be able to solve basic geometry problems",
  "type": "SUBJECT",
  "classId": {
    "_id": "class_id_1",
    "name": "Class 5",
    "level": 5
  },
  "subjectId": {
    "_id": "subject_id_1",
    "name": "Mathematics"
  },
  "topicName": "Geometry",
  "instruction": "Focus on shapes and angles"
}
```

**Example:**
```javascript
// Create Subject Outcome
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/learning-outcomes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Students will be able to solve basic geometry problems',
    type: 'SUBJECT',
    classId: 'class_id_1',
    subjectId: 'subject_id_1',
    topicName: 'Geometry',
    instruction: 'Focus on shapes and angles'
  })
});

// Create Basic Calculation Outcome
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/learning-outcomes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Students will solve addition problems within 30 seconds',
    type: 'BASIC_CALCULATION',
    classId: 'class_id_1'
  })
});
```

---

### 8.3 Update Learning Outcome

**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string, required): Learning Outcome ID

**Request Body (all fields optional):**
```json
{
  "text": "Updated learning outcome text",
  "topicName": "Updated Topic",
  "instruction": "Updated instruction"
}
```

**Note:** Cannot change `type`, `classId`, or `subjectId` after creation. Delete and recreate if needed.

**Response (200 OK):**
```json
{
  "id": "outcome_id_1",
  "_id": "outcome_id_1",
  "text": "Updated learning outcome text",
  "type": "SUBJECT",
  "classId": {
    "_id": "class_id_1",
    "name": "Class 5",
    "level": 5
  },
  "subjectId": {
    "_id": "subject_id_1",
    "name": "Mathematics"
  },
  "topicName": "Updated Topic",
  "instruction": "Updated instruction"
}
```

---

### 8.4 Delete Learning Outcome

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): Learning Outcome ID

**Response (200 OK):**
```json
{
  "message": "Learning outcome removed"
}
```

---

### 8.5 Get Learning Outcome Content

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/content`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `learningOutcomeId` (string, required): Learning Outcome ID

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "learningOutcome": {
    "id": "outcome_id_1",
    "text": "Students will be able to solve basic geometry problems",
    "type": "SUBJECT",
    "topicName": "Geometry"
  },
  "contents": [
    {
      "_id": "content_id_1",
      "type": "PDF",
      "title": "Geometry PDF",
      "url": "https://storage.example.com/file.pdf",
      "text": "Extracted PDF text content..."
    },
    {
      "_id": "content_id_2",
      "type": "TEXT",
      "title": "Text Content",
      "text": "Full text content here..."
    }
  ]
}
```

**Example:**
```javascript
const learningOutcomeId = "outcome_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
console.log('Contents:', data.contents);
console.log('Extracted text from first PDF:', data.contents[0]?.text);
```

---

### 8.6 Add Learning Outcome Content

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/content`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data (for file upload) OR application/json (for manual entry)
```

**URL Parameters:**
- `learningOutcomeId` (string, required): Learning Outcome ID

**Two Methods Available:**

#### Method 1: File Upload (with automatic PDF extraction)
**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
- `type` (string, required): `"PDF"` | `"GBP_PDF"` | `"TEXT"`
- `title` (string, required): Content title
- `file` (File, required if type is `PDF` or `GBP_PDF`): File upload
- `text` (string, required if type is `TEXT`): Text content

**Example (PDF with file upload - text will be auto-extracted):**
```javascript
const formData = new FormData();
formData.append('type', 'PDF');
formData.append('title', 'Learning Outcome PDF');
formData.append('file', fileObject);

const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
    // Don't set Content-Type header - browser will set it with boundary
  },
  body: formData
});
```

**Example (TEXT with file upload):**
```javascript
const formData = new FormData();
formData.append('type', 'TEXT');
formData.append('title', 'Text Content');
formData.append('text', 'Full text content here...');

const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: formData
});
```

#### Method 2: Manual Entry (without file upload)
**Content-Type:** `application/json`

**Request Body (JSON):**
- `type` (string, required): `"PDF"` | `"GBP_PDF"` | `"TEXT"`
- `title` (string, required): Content title
- `url` (string, required for PDF/GBP_PDF if no file): URL to the PDF file
- `text` (string, required for TEXT type OR optional for PDF types): Text content

**Example (PDF with manual URL entry):**
```json
{
  "type": "PDF",
  "title": "Learning Outcome PDF",
  "url": "https://example.com/outcome.pdf",
  "text": "Optional: Manually entered text content"
}
```

**Example (TEXT manual entry):**
```json
{
  "type": "TEXT",
  "title": "Text Content",
  "text": "Full text content here..."
}
```

**Response (201 Created):**
```json
{
  "_id": "content_id_1",
  "type": "PDF",
  "title": "Learning Outcome PDF",
  "url": "https://storage.example.com/file.pdf",
  "text": "Extracted PDF text content...",
  "extractedTextLength": 5000,
  "isManualEntry": false
}
```

**Notes:**
- For PDF types: Either `file` (upload) OR `url` (manual) is required
- When a PDF file is uploaded, text content is automatically extracted and saved
- For manual PDF entry, you can optionally provide `text` field with manually entered content
- For TEXT type: `text` field is always required
- You can add multiple content items (PDF and TEXT) to the same learning outcome

---

### 8.7 Delete Learning Outcome Content

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/content/:contentId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `learningOutcomeId` (string, required): Learning Outcome ID
- `contentId` (string, required): Content ID

**Response (200 OK):**
```json
{
  "message": "Content removed"
}
```

**Example:**
```javascript
const learningOutcomeId = "outcome_id_1";
const contentId = "content_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content/${contentId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

### 8.8 Get Remedials for Learning Outcome

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/remedial`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `learningOutcomeId` (string, required): Learning Outcome ID

**Query Parameters:** None

**Response (200 OK):**
```json
[
  {
    "_id": "remedial_id_1",
    "type": "VIDEO",
    "title": "Video Tutorial",
    "content": "https://youtube.com/watch?v=..."
  },
  {
    "_id": "remedial_id_2",
    "type": "PDF",
    "title": "Practice PDF",
    "content": "https://example.com/practice.pdf"
  },
  {
    "_id": "remedial_id_3",
    "type": "LINK",
    "title": "Reference Link",
    "content": "https://example.com/reference"
  }
]
```

**Example:**
```javascript
const learningOutcomeId = "outcome_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const remedials = await response.json();
```

---

### 8.9 Add Remedial Content to Learning Outcome

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/remedial`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `learningOutcomeId` (string, required): Learning Outcome ID

**Request Body:**
```json
{
  "type": "VIDEO",
  "title": "Video Tutorial",
  "content": "https://youtube.com/watch?v=..."
}
```

**Required Fields:**
- `type` (string, required): `"VIDEO"` | `"PDF"` | `"LINK"`
- `title` (string, required): Remedial title
- `content` (string, required): URL or content string

**Type Values:**
- `"VIDEO"` - Video content (YouTube URL, etc.)
- `"PDF"` - PDF document URL
- `"LINK"` - External link URL

**Response (201 Created):**
```json
{
  "_id": "remedial_id_1",
  "type": "VIDEO",
  "title": "Video Tutorial",
  "content": "https://youtube.com/watch?v=..."
}
```

**Example:**
```javascript
const learningOutcomeId = "outcome_id_1";

// Add YouTube video
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'VIDEO',
    title: 'Video Tutorial',
    content: 'https://youtube.com/watch?v=...'
  })
});

// Add PDF document
const response2 = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'PDF',
    title: 'Practice PDF',
    content: 'https://example.com/practice.pdf'
  })
});

// Add reference link
const response3 = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'LINK',
    title: 'Reference Link',
    content: 'https://example.com/reference'
  })
});
```

**Note:** For batch uploads, call this endpoint multiple times (frontend queues items and processes sequentially).

---

### 8.10 Delete Remedial Content from Learning Outcome

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/remedial/:remedialId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `learningOutcomeId` (string, required): Learning Outcome ID
- `remedialId` (string, required): Remedial ID

**Response (200 OK):**
```json
{
  "message": "Remedial item removed"
}
```

**Example:**
```javascript
const learningOutcomeId = "outcome_id_1";
const remedialId = "remedial_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial/${remedialId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

### 8.11 Delete Remedial Item (Alternative Endpoint)

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/learning-outcome-remedials/:remedialId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `remedialId` (string, required): Remedial ID

**Response (200 OK):**
```json
{
  "message": "Remedial item removed"
}
```

**Note:** This is an alternative endpoint for deleting remedials without specifying the learning outcome ID.

**Example:**
```javascript
const remedialId = "remedial_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcome-remedials/${remedialId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## 9. Instruction Management APIs

### 9.1 Get Instructions

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/instructions`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `classId` (string, required): Class ID
- `subjectId` (string, required): Subject ID

**Example Request:**
```
GET /api/admin/instructions?classId=class_id_1&subjectId=subject_id_1
```

**Response (200 OK):**
```json
{
  "instructions": "Detailed instructions for students taking tests in this subject..."
}
```

**Note:** Returns empty string if instructions don't exist for the class-subject combination.

**Example:**
```javascript
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/instructions?classId=class_id_1&subjectId=subject_id_1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
console.log(data.instructions);
```

---

### 9.2 Save/Update Instructions

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/instructions`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "classId": "class_id_1",
  "subjectId": "subject_id_1",
  "instructions": "Detailed instructions for students taking tests in this subject. Include test duration, rules, and expectations..."
}
```

**Required Fields:**
- `classId` (string, required): Class ID
- `subjectId` (string, required): Subject ID
- `instructions` (string, required): Instruction text

**Response (200 OK):**
```json
{
  "message": "Instructions saved successfully",
  "instructions": "Detailed instructions for students..."
}
```

**Note:** Creates instructions if they don't exist, updates if they do (upsert).

**Example:**
```javascript
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/instructions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    classId: 'class_id_1',
    subjectId: 'subject_id_1',
    instructions: 'Detailed instructions for students...'
  })
});
```

---

## 10. Test Management APIs

### 10.1 Get All Tests

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/tests`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:** None

**Response (200 OK):**
```json
[
  {
    "_id": "test_id_1",
    "id": "test_id_1",
    "title": "Mid-Term Assessment",
    "classIds": ["class_id_1", "class_id_2"],
    "subjectId": {
      "_id": "subject_id_1",
      "name": "Mathematics"
    },
    "totalQuestions": 20,
    "instructions": "Test instructions...",
    "passingPercentage": 60,
    "difficulty": {
      "easy": 8,
      "medium": 8,
      "hard": 4
    },
    "bloomsTaxonomy": ["REMEMBER", "UNDERSTAND", "APPLY"],
    "status": "DRAFT",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 10.2 Create Test

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/tests`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Mid-Term Assessment",
  "classIds": ["class_id_1", "class_id_2"],
  "subjectId": "subject_id_1",
  "totalQuestions": 20,
  "instructions": "Test instructions for students...",
  "passingPercentage": 60,
  "difficulty": {
    "easy": 8,
    "medium": 8,
    "hard": 4
  },
  "bloomsTaxonomy": ["REMEMBER", "UNDERSTAND", "APPLY", "BASIC_CALCULATION"],
  "status": "DRAFT"
}
```

**Required Fields:**
- `title` (string, required): Test title
- `classIds` (array or string, required): Array of class IDs or `"ALL"`
- `subjectId` (string, required): Subject ID
- `totalQuestions` (number, required): Total number of questions
- `passingPercentage` (number, required): Passing percentage (0-100)
- `difficulty` (object, required): Difficulty distribution
  - `easy` (number, required): Easy questions count
  - `medium` (number, required): Medium questions count
  - `hard` (number, required): Hard questions count
- `bloomsTaxonomy` (array, required): Array of Bloom's taxonomy levels
- `status` (string, optional): `"DRAFT"` | `"PUBLISHED"` (default: "DRAFT")

**Optional Fields:**
- `instructions` (string): Test instructions (can be auto-populated from Instruction Management)

**BloomsTaxonomy Values:**
- `"REMEMBER"`
- `"UNDERSTAND"`
- `"APPLY"`
- `"BASIC_CALCULATION"` (NEW)
- `"ANALYZE"`
- `"EVALUATE"`
- `"CREATE"`

**Response (201 Created):**
```json
{
  "_id": "test_id_1",
  "title": "Mid-Term Assessment",
  "classIds": ["class_id_1", "class_id_2"],
  "subjectId": "subject_id_1",
  "totalQuestions": 20,
  "instructions": "Test instructions for students...",
  "passingPercentage": 60,
  "difficulty": {
    "easy": 8,
    "medium": 8,
    "hard": 4
  },
  "bloomsTaxonomy": ["REMEMBER", "UNDERSTAND", "APPLY", "BASIC_CALCULATION"],
  "status": "DRAFT"
}
```

**Example:**
```javascript
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/tests', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Mid-Term Assessment',
    classIds: ['class_id_1', 'class_id_2'],
    subjectId: 'subject_id_1',
    totalQuestions: 20,
    instructions: 'Test instructions for students...',
    passingPercentage: 60,
    difficulty: {
      easy: 8,
      medium: 8,
      hard: 4
    },
    bloomsTaxonomy: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'BASIC_CALCULATION'],
    status: 'DRAFT'
  })
});
```

---

### 10.3 Update Test

**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/tests/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string, required): Test ID

**Request Body:** (Same structure as Create Test, all fields optional)

**Response (200 OK):**
```json
{
  "_id": "test_id_1",
  "title": "Mid-Term Assessment Updated",
  "classIds": ["class_id_1"],
  "subjectId": "subject_id_1",
  "totalQuestions": 25,
  "status": "PUBLISHED",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 10.4 Delete Test

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/tests/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): Test ID

**Response (200 OK):**
```json
{
  "message": "Test removed"
}
```

---

## 11. Basic Test Config APIs

### 11.1 Get Basic Test Config

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/config/basic-test`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `classId` (string, optional): Class ID (for class-specific config, omit for global config)

**Example Requests:**
```
GET /api/admin/config/basic-test                    // Global config
GET /api/admin/config/basic-test?classId=class_id_1 // Class-specific config
```

**Response (200 OK):**
```json
{
  "totalQuestions": 25,
  "difficultyDistribution": {
    "easy": 15,
    "medium": 8,
    "hard": 2
  },
  "passingPercentage": 70,
  "repeatThreshold": 3,
  "classId": "class_id_1",
  "instructionType": "Practice"
}
```

**Note:** If config doesn't exist, returns default structure with empty `classId` and `instructionType`.

**Example:**
```javascript
// Get global config
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/config/basic-test', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Get class-specific config
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/config/basic-test?classId=class_id_1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

### 11.2 Update Basic Test Config

**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/config/basic-test`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "totalQuestions": 25,
  "difficultyDistribution": {
    "easy": 15,
    "medium": 8,
    "hard": 2
  },
  "passingPercentage": 70,
  "repeatThreshold": 3,
  "classId": "class_id_1",
  "instructionType": "Practice"
}
```

**Required Fields:**
- `totalQuestions` (number, required): Total number of questions
- `difficultyDistribution` (object, required): Difficulty distribution
  - `easy` (number, required): Easy questions count
  - `medium` (number, required): Medium questions count
  - `hard` (number, required): Hard questions count
- `passingPercentage` (number, required): Passing percentage (0-100)
- `repeatThreshold` (number, required): Repeat threshold

**Optional Fields:**
- `classId` (string): Class ID (empty string for global config)
- `instructionType` (string): Custom label (e.g., "Practice", "Activity", "Speed Drill", "Homework")

**Validation:**
- `easy + medium + hard` must equal `totalQuestions`

**Response (200 OK):**
```json
{
  "totalQuestions": 25,
  "difficultyDistribution": {
    "easy": 15,
    "medium": 8,
    "hard": 2
  },
  "passingPercentage": 70,
  "repeatThreshold": 3,
  "classId": "class_id_1",
  "instructionType": "Practice"
}
```

**Example:**
```javascript
// Update global config
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/config/basic-test', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    totalQuestions: 25,
    difficultyDistribution: {
      easy: 15,
      medium: 8,
      hard: 2
    },
    passingPercentage: 70,
    repeatThreshold: 3,
    classId: '', // Empty for global
    instructionType: 'Practice'
  })
});

// Update class-specific config
const response = await fetch('https://academic-7mkg.onrender.com/api/admin/config/basic-test', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    totalQuestions: 25,
    difficultyDistribution: {
      easy: 15,
      medium: 8,
      hard: 2
    },
    passingPercentage: 70,
    repeatThreshold: 3,
    classId: 'class_id_1', // Class-specific
    instructionType: 'Speed Drill'
  })
});
```

---

## 12. Topic Management APIs

### 12.1 Get All Topics

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/topics`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:** None

**Response (200 OK):**
```json
[
  {
    "_id": "topic_id_1",
    "name": "Geometry"
  }
]
```

---

### 12.2 Create Topic

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/topics`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Geometry"
}
```

**Required Fields:**
- `name` (string, required): Topic name

**Response (201 Created):**
```json
{
  "_id": "topic_id_1",
  "name": "Geometry"
}
```

---

### 12.3 Update Topic

**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/topics/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string, required): Topic ID

**Request Body:**
```json
{
  "name": "Geometry Updated"
}
```

**Response (200 OK):**
```json
{
  "_id": "topic_id_1",
  "name": "Geometry Updated"
}
```

---

### 12.4 Delete Topic

**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/topics/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): Topic ID

**Response (200 OK):**
```json
{
  "message": "Topic removed"
}
```

---

### 12.5 Get Topic Chain Preview

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/topics/:id/chain-preview`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): Topic ID

**Response (200 OK):**
```json
{
  "topic": "Geometry",
  "chain": [
    {
      "classLevel": 5,
      "chapterName": "Shapes and Angles",
      "status": "LINKED"
    },
    {
      "classLevel": 4,
      "chapterName": "The Way the World Looks",
      "status": "LINKED"
    },
    {
      "classLevel": 3,
      "chapterName": null,
      "status": "MISSING_LINK"
    }
  ]
}
```

---

## 13. Plans & Subscription APIs

### 13.1 Get All Plans

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/plans`

**Headers:** (Public endpoint, no auth required)

**Query Parameters:** None

**Response (200 OK):**
```json
[
  {
    "_id": "plan_id_1",
    "name": "Basic Plan",
    "price": 99.99,
    "durationDays": 30,
    "description": "Basic subscription plan"
  }
]
```

---

### 13.2 Create Plan

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/plans`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Premium Plan",
  "price": 199.99,
  "durationDays": 90,
  "description": "Premium subscription plan"
}
```

**Response (201 Created):**
```json
{
  "_id": "plan_id_1",
  "name": "Premium Plan",
  "price": 199.99,
  "durationDays": 90,
  "description": "Premium subscription plan"
}
```

---

### 13.3 Subscribe to Plan

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/subscription/subscribe`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "plan_id_1"
}
```

**Response (200 OK):**
```json
{
  "message": "Subscription successful",
  "subscriptionId": "sub_id_1"
}
```

---

## 14. Student-Facing APIs

### 14.1 Get Student Classes

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/classes`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "_id": "class_id_1",
    "name": "Class 5",
    "level": 5
  }
]
```

---

### 14.2 Get Subjects for Class

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/classes/:classId/subjects`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `classId` (string, required): Class ID

**Response (200 OK):**
```json
[
  {
    "_id": "subject_id_1",
    "name": "Mathematics"
  }
]
```

---

### 14.3 Get Chapters for Subject

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/subjects/:subjectId/chapters`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `subjectId` (string, required): Subject ID

**Response (200 OK):**
```json
[
  {
    "_id": "chapter_id_1",
    "chapterName": "Shapes 101",
    "topicName": "Geometry"
  }
]
```

---

### 14.4 Get Entry Test Instructions

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/test/entry/instructions`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "instructions": "Entry test instructions..."
}
```

---

### 14.5 Get Entry Test Questions

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/test/entry/questions`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4"
    }
  ]
}
```

---

### 14.6 Submit Entry Test

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/student/test/entry/submit`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q1",
      "selectedOption": "option_a"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "score": 85,
  "totalMarks": 100,
  "percentage": 85,
  "result": "PASS"
}
```

---

### 14.7 Generate Quiz

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/student/quiz/generate`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "chapterId": "chapter_id_1"
}
```

**Response (200 OK):**
```json
{
  "quizId": "quiz_id_1",
  "questions": [
    {
      "id": "q1",
      "question": "Question text...",
      "options": ["A", "B", "C", "D"]
    }
  ]
}
```

---

### 14.8 Submit Quiz

**Endpoint:** `POST https://academic-7mkg.onrender.com/api/student/quiz/submit`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quizId": "quiz_id_1",
  "answers": {
    "question_1": "answer_a",
    "question_2": "answer_b"
  },
  "chapterId": "chapter_id_1"
}
```

**Response (200 OK):**
```json
{
  "score": 18,
  "totalMarks": 20,
  "percentage": 90,
  "result": "PASS"
}
```

---

### 14.9 Get Remedial Content

**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/chapters/:chapterId/remedial`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `chapterId` (string, required): Chapter ID

**Response (200 OK):**
```json
[
  {
    "_id": "remedial_id_1",
    "type": "VIDEO",
    "title": "Video Tutorial",
    "content": "https://youtube.com/watch?v=..."
  }
]
```

---

## Error Handling

All endpoints may return standard HTTP error responses:

### Error Response Format:
```json
{
  "message": "Error description",
  "error": "Error details"
}
```

### Common Error Codes:

- **400 Bad Request:** Invalid request parameters or validation failed
  ```json
  {
    "message": "type and title are required"
  }
  ```

- **401 Unauthorized:** Missing or invalid token
  ```json
  {
    "message": "Not authorized, token failed"
  }
  ```

- **403 Forbidden:** Insufficient permissions
  ```json
  {
    "message": "Not authorized as an admin"
  }
  ```

- **404 Not Found:** Resource not found
  ```json
  {
    "message": "Chapter not found"
  }
  ```

- **500 Internal Server Error:** Server error
  ```json
  {
    "message": "Server Error"
  }
  ```

---

## Implementation Notes

1. **Authentication:** All admin endpoints require a Bearer token obtained from `/api/auth/admin/login`
2. **Content-Type:** 
   - Use `application/json` for JSON requests
   - Use `multipart/form-data` for file uploads (don't set Content-Type header manually - browser will set it with boundary)
3. **Filtering:** Most list endpoints return all items; filtering is done client-side
4. **Batch Operations:** For remedial content, queue items client-side and call the API multiple times
5. **URL Encoding:** Ensure URL parameters are properly encoded
6. **File Uploads:** PDF files are uploaded via FormData; URLs are generated server-side

---

## Quick Reference: Common Patterns

### Authentication Header Pattern:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

### JSON Request Pattern:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
},
body: JSON.stringify(data)
```

### FormData Request Pattern:
```javascript
const formData = new FormData();
formData.append('field', value);
// Don't set Content-Type header - browser will set it

headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
},
body: formData
```

### Query Parameters Pattern:
```javascript
const params = new URLSearchParams({
  classId: 'class_id_1',
  subjectId: 'subject_id_1',
  type: 'SUBJECT'
});
const url = `https://academic-7mkg.onrender.com/api/admin/learning-outcomes?${params}`;
```

---

## Base URL Summary

All endpoints use the base URL: **`https://academic-7mkg.onrender.com`**

Example: 
- Full URL for admin login: `https://academic-7mkg.onrender.com/api/auth/admin/login`
- Full URL for dashboard stats: `https://academic-7mkg.onrender.com/api/admin/stats/dashboard`

# Academic Audit System API Documentation

**Base URL:** `https://academic-7mkg.onrender.com`

**Authentication:** Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```
Token is obtained from login endpoints and stored in `localStorage.getItem('token')`.

---

## Table of Contents

1. [Authentication APIs](#1-authentication-apis)
2. [Dashboard & Analytics APIs](#2-dashboard--analytics-apis)
3. [Class & Subject Management APIs](#3-class--subject-management-apis)
4. [Topic Management APIs](#4-topic-management-apis)
5. [Chapter Management APIs](#5-chapter-management-apis)
6. [Chapter Content APIs](#6-chapter-content-apis)
7. [Remedial Content APIs](#7-remedial-content-apis)
8. [Test Management APIs](#8-test-management-apis)
9. [Configuration APIs](#9-configuration-apis)
10. [Plans & Subscription APIs](#10-plans--subscription-apis)
11. [Student-Facing APIs](#11-student-facing-apis)

---

## 1. Authentication APIs

### Admin Login
**Endpoint:** `POST https://academic-7mkg.onrender.com/api/auth/admin/login`

**Request Body:**
```json
{
  "email": "admin@university.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "_id": "string",
  "email": "admin@university.edu",
  "role": "admin",
  "token": "jwt_token_string"
}
```

### Admin Register
**Endpoint:** `POST https://academic-7mkg.onrender.com/api/auth/admin/register`

**Request Body:**
```json
{
  "email": "admin@university.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "_id": "string",
  "email": "admin@university.edu",
  "role": "admin",
  "token": "jwt_token_string"
}
```

### Student Login
**Endpoint:** `POST https://academic-7mkg.onrender.com/api/auth/student/login`

**Request Body:**
```json
{
  "username": "student123",
  "class": 12
}
```

---

## 2. Dashboard & Analytics APIs

### Get Dashboard Statistics
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/stats/dashboard`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalStudents": 1240,
  "activeStudents": 942,
  "totalRevenue": 50000,
  "testsTaken": 3500
}
```

### Get All Students
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/students`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
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

### Get Student Performance
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/students/:studentId/performance`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `studentId` (string): Student ID

**Response:** Student performance data

### Get Revenue Stats
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/revenue`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Revenue statistics

---

## 3. Class & Subject Management APIs

### Get All Classes
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/classes`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
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

### Create Class
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

**Response:** Created class object

### Update Class
**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/classes/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string): Class ID

**Request Body:**
```json
{
  "name": "Class 5 Updated",
  "level": 5
}
```

**Response:** Updated class object

### Delete Class
**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/classes/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string): Class ID

**Response:**
```json
{
  "message": "Class removed"
}
```

### Get All Subjects
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/subjects`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
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

### Create Subject
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

**Response:** Created subject object

### Update Subject
**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/subjects/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string): Subject ID

**Request Body:**
```json
{
  "name": "Mathematics Updated",
  "classId": "class_id_1"
}
```

**Response:** Updated subject object

### Delete Subject
**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/subjects/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string): Subject ID

**Response:**
```json
{
  "message": "Subject removed"
}
```

---

## 4. Topic Management APIs

### Get All Topics
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/topics`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "topic_id_1",
    "name": "Geometry"
  }
]
```

### Create Topic
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

**Response:** Created topic object

### Update Topic
**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/topics/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string): Topic ID

**Request Body:**
```json
{
  "name": "Geometry Updated"
}
```

**Response:** Updated topic object

### Delete Topic
**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/topics/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string): Topic ID

**Response:**
```json
{
  "message": "Topic removed"
}
```

### Get Topic Chain Preview
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/topics/:id/chain-preview`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string): Topic ID

**Response:** Topic chain preview data

---

## 5. Chapter Management APIs

### Get All Chapters
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/chapters`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `classId` (string, optional): Filter by class ID
- `subjectId` (string, optional): Filter by subject ID

**Response:**
```json
[
  {
    "_id": "chapter_id_1",
    "id": "chapter_id_1",
    "classId": "class_id_1",
    "classLevel": 5,
    "subjectId": "subject_id_1",
    "subject": "Mathematics",
    "name": "Shapes 101",
    "chapterName": "Shapes 101",
    "topicName": "Geometry",
    "contents": [
      {
        "id": "content_id_1",
        "type": "PDF",
        "title": "Chapter PDF",
        "url": "https://example.com/file.pdf"
      }
    ],
    "remedials": [
      {
        "id": "remedial_id_1",
        "type": "VIDEO",
        "title": "Video Tutorial",
        "content": "https://youtube.com/watch?v=..."
      }
    ]
  }
]
```

### Create Chapter
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
    "totalQuestions": 20
  }
}
```

**Response:** Created chapter object

**Note:** The `topicName` field is critical for fallback chain mapping. Chapters with the same `topicName` form a conceptual chain ordered by class level.

### Update Chapter
**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/chapters/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string): Chapter ID

**Request Body:** (Partial update, all fields optional)
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

**Response:** Updated chapter object

**Important Notes:**
- Changing `classId` moves the chapter to a different position in the same fallback chain
- Changing `topicName` moves the chapter to a completely different fallback chain
- Changing `subjectId` updates subject association but doesn't change fallback chain membership

### Delete Chapter
**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/chapters/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string): Chapter ID

**Response:**
```json
{
  "message": "Chapter removed"
}
```

---

## 6. Chapter Content APIs

### Add Chapter Content
**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/content`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**URL Parameters:**
- `chapterId` (string): Chapter ID

**Request Body (FormData):**
- `type` (string, required): `"PDF"` | `"GBP_PDF"` | `"TEXT"`
- `title` (string, required): Content title
- `file` (File, required if type is `PDF` or `GBP_PDF`): File upload
- `text` (string, required if type is `TEXT`): Text content

**Example (PDF):**
```javascript
const formData = new FormData();
formData.append('type', 'PDF');
formData.append('title', 'Chapter PDF');
formData.append('file', fileObject);
```

**Example (TEXT):**
```javascript
const formData = new FormData();
formData.append('type', 'TEXT');
formData.append('title', 'Text Content');
formData.append('text', 'Full text content here...');
```

**Response:** Created content object

### Delete Chapter Content
**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/content/:contentId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `chapterId` (string): Chapter ID
- `contentId` (string): Content ID

**Response:**
```json
{
  "message": "Content removed"
}
```

---

## 7. Remedial Content APIs

### Get Remedials for Chapter
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/remedial`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `chapterId` (string): Chapter ID

**Response:**
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

### Add Remedial Content
**Endpoint:** `POST https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/remedial`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `chapterId` (string): Chapter ID

**Request Body:**
```json
{
  "type": "VIDEO",
  "title": "Video Tutorial",
  "content": "https://youtube.com/watch?v=..."
}
```

**Type Values:**
- `"VIDEO"` - Video content (YouTube URL, etc.)
- `"PDF"` - PDF document
- `"LINK"` - External link

**Response:** Created remedial object

**Note:** For batch uploads, call this endpoint multiple times (frontend queues items and processes sequentially).

### Delete Remedial Content
**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/chapters/:chapterId/remedial/:remedialId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `chapterId` (string): Chapter ID
- `remedialId` (string): Remedial ID

**Response:**
```json
{
  "message": "Remedial item removed"
}
```

### Delete Remedial Item (Alternative Endpoint)
**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/remedials/:remedialId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `remedialId` (string): Remedial ID

**Response:**
```json
{
  "message": "Remedial item removed"
}
```

**Note:** This is an alternative endpoint for deleting remedials without specifying the chapter ID.

---

## 8. Test Management APIs

### Get All Tests
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/tests`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "test_id_1",
    "id": "test_id_1",
    "title": "Mid-Term Assessment",
    "classIds": ["class_id_1", "class_id_2"],
    "subjectId": "subject_id_1",
    "totalQuestions": 20,
    "instructions": "Test instructions...",
    "passingPercentage": 60,
    "difficulty": {
      "easy": 40,
      "medium": 40,
      "hard": 20
    },
    "bloomsTaxonomy": ["REMEMBER", "UNDERSTAND", "APPLY"],
    "status": "DRAFT"
  }
]
```

### Create Test
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
    "easy": 40,
    "medium": 40,
    "hard": 20
  },
  "bloomsTaxonomy": ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"],
  "status": "DRAFT"
}
```

**BloomsTaxonomy Values:**
- `"REMEMBER"`
- `"UNDERSTAND"`
- `"APPLY"`
- `"ANALYZE"`
- `"EVALUATE"`
- `"CREATE"`

**Status Values:**
- `"DRAFT"` - Test is in draft mode
- `"PUBLISHED"` - Test is published and available

**Response:** Created test object

### Update Test
**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/tests/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (string): Test ID

**Request Body:** (Same structure as Create Test, all fields optional)

**Response:** Updated test object

### Delete Test
**Endpoint:** `DELETE https://academic-7mkg.onrender.com/api/admin/tests/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string): Test ID

**Response:**
```json
{
  "message": "Test removed"
}
```

---

## 9. Configuration APIs

### Get Basic Test Config
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/admin/config/basic-test`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalQuestions": 20,
  "difficultyDistribution": {
    "easy": 30,
    "medium": 50,
    "hard": 20
  },
  "passingPercentage": 60,
  "repeatThreshold": 3
}
```

### Update Basic Test Config
**Endpoint:** `PUT https://academic-7mkg.onrender.com/api/admin/config/basic-test`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "totalQuestions": 20,
  "difficultyDistribution": {
    "easy": 30,
    "medium": 50,
    "hard": 20
  },
  "passingPercentage": 60,
  "repeatThreshold": 3
}
```

**Response:** Updated config object

---

## 10. Plans & Subscription APIs

### Get All Plans
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/plans`

**Headers:** (Public endpoint, no auth required)

**Response:**
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

### Create Plan
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

**Response:** Created plan object

### Subscribe to Plan
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

**Response:** Subscription confirmation

---

## 11. Student-Facing APIs

### Get Student Classes
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/classes`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** List of classes available to student

### Get Subjects for Class
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/classes/:classId/subjects`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `classId` (string): Class ID

**Response:** List of subjects for the class

### Get Chapters for Subject
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/subjects/:subjectId/chapters`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `subjectId` (string): Subject ID

**Response:** List of chapters for the subject

### Get Entry Test Instructions
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/test/entry/instructions`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Entry test instructions

### Get Entry Test Questions
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/test/entry/questions`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Entry test questions

### Submit Entry Test
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

**Response:** Test result

### Generate Quiz
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

**Response:** Generated quiz object

### Submit Quiz
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

**Response:** Quiz result

### Get Remedial Content
**Endpoint:** `GET https://academic-7mkg.onrender.com/api/student/chapters/:chapterId/remedial`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `chapterId` (string): Chapter ID

**Response:** Remedial content for the chapter

---

## Error Handling

All endpoints may return standard HTTP error responses:

- **400 Bad Request:** Invalid request parameters
- **401 Unauthorized:** Missing or invalid token
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server error

**Error Response Format:**
```json
{
  "message": "Error description",
  "error": "Error details"
}
```

---

## Quick Reference: Endpoints by Category

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/admin/register` - Admin registration
- `POST /api/auth/student/login` - Student login

### Dashboard & Analytics
- `GET /api/admin/stats/dashboard` - Dashboard statistics
- `GET /api/admin/students` - Get all students
- `GET /api/admin/students/:id/performance` - Student performance
- `GET /api/admin/revenue` - Revenue stats

### Class & Subject Management
- `GET /api/admin/classes` - Get all classes
- `POST /api/admin/classes` - Create class
- `PUT /api/admin/classes/:id` - Update class
- `DELETE /api/admin/classes/:id` - Delete class
- `GET /api/admin/subjects` - Get all subjects
- `POST /api/admin/subjects` - Create subject
- `PUT /api/admin/subjects/:id` - Update subject
- `DELETE /api/admin/subjects/:id` - Delete subject

### Topic Management
- `GET /api/admin/topics` - Get all topics
- `POST /api/admin/topics` - Create topic
- `PUT /api/admin/topics/:id` - Update topic
- `DELETE /api/admin/topics/:id` - Delete topic
- `GET /api/admin/topics/:id/chain-preview` - Topic chain preview

### Chapter Management
- `GET /api/admin/chapters` - Get all chapters
- `POST /api/admin/chapters` - Create chapter
- `PUT /api/admin/chapters/:id` - Update chapter
- `DELETE /api/admin/chapters/:id` - Delete chapter

### Chapter Content
- `POST /api/admin/chapters/:chapterId/content` - Add chapter content
- `DELETE /api/admin/chapters/:chapterId/content/:contentId` - Delete chapter content

### Remedial Content
- `GET /api/admin/chapters/:chapterId/remedial` - Get remedials
- `POST /api/admin/chapters/:chapterId/remedial` - Add remedial
- `DELETE /api/admin/chapters/:chapterId/remedial/:remedialId` - Delete remedial
- `DELETE /api/admin/remedials/:remedialId` - Delete remedial (alternative)

### Test Management
- `GET /api/admin/tests` - Get all tests
- `POST /api/admin/tests` - Create test
- `PUT /api/admin/tests/:id` - Update test
- `DELETE /api/admin/tests/:id` - Delete test

### Configuration
- `GET /api/admin/config/basic-test` - Get basic test config
- `PUT /api/admin/config/basic-test` - Update basic test config

### Plans & Subscription
- `GET /api/plans` - Get all plans
- `POST /api/admin/plans` - Create plan
- `POST /api/subscription/subscribe` - Subscribe to plan

### Student APIs
- `GET /api/student/classes` - Get student classes
- `GET /api/student/classes/:classId/subjects` - Get subjects for class
- `GET /api/student/subjects/:subjectId/chapters` - Get chapters for subject
- `GET /api/student/test/entry/instructions` - Get entry test instructions
- `GET /api/student/test/entry/questions` - Get entry test questions
- `POST /api/student/test/entry/submit` - Submit entry test
- `POST /api/student/quiz/generate` - Generate quiz
- `POST /api/student/quiz/submit` - Submit quiz
- `GET /api/student/chapters/:chapterId/remedial` - Get remedial content

---

## Implementation Notes

1. **Authentication:** All admin endpoints require a Bearer token obtained from `/api/auth/admin/login`
2. **Content-Type:** Use `application/json` for JSON requests, `multipart/form-data` for file uploads
3. **Filtering:** Most list endpoints return all items; filtering is done client-side
4. **Batch Operations:** For remedial content, queue items client-side and call the API multiple times
5. **Chapter Mapping:** Chapters with the same `topicName` form fallback chains ordered by class level
6. **File Uploads:** PDF files are uploaded via FormData; URLs are generated server-side

---

## Base URL Summary

All endpoints use the base URL: **`https://academic-7mkg.onrender.com`**

Example: 
- Full URL for admin login: `https://academic-7mkg.onrender.com/api/auth/admin/login`
- Full URL for dashboard stats: `https://academic-7mkg.onrender.com/api/admin/stats/dashboard`

# User App API Documentation

## Base URL
**Production:** `https://academic-7mkg.onrender.com`  
**Local Development:** `http://localhost:5000` (or your configured PORT)

---

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Examples](#requestresponse-examples)
4. [Error Handling](#error-handling)
5. [Testing Guide](#testing-guide)
6. [Quiz Submission & Results](#7-quiz-submission--results)
7. [Profile Management](#8-profile-management)

---

## Authentication Flow

### Registration Flow
1. **Register** → User provides name, email, mobile, password
2. **OTP Generated** → Backend generates 8-digit OTP and returns it in response (valid for 15 minutes)
3. **Frontend Displays OTP** → User sees OTP on screen
4. **Verify OTP** → User enters OTP to complete registration
5. **Login** → User can now login with email/mobile + password

### Password Reset Flow
1. **Forgot Password** → User requests password reset
2. **OTP Generated** → Backend generates 8-digit OTP and returns it in response (valid for 15 minutes)
3. **Frontend Displays OTP** → User sees OTP on screen
4. **Reset Password** → User verifies OTP and sets new password
5. **Login** → User can login with new password

**Note**: OTP is returned directly in the API response. No email service is required.

---

## API Endpoints

### Base Path: `/api/user`

### 1. Registration

#### POST `/api/user/register`
Register a new user. Generates OTP and returns it in the response for frontend verification.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "mobile": "9876543210",
  "password": "Secure@123"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful. Please verify OTP to complete registration.",
  "userId": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "otp": "12345678",
  "expiresIn": 900
}
```

**Response Fields:**
- `otp` - 8-digit OTP code (display to user for verification)
- `expiresIn` - OTP expiry time in seconds (900 = 15 minutes)

**Error Responses:**
- `400` - Missing required fields
- `400` - User already exists (verified)
- `500` - Server error

---

### 2. Verify OTP

#### POST `/api/user/verify-otp`
Verify OTP to complete registration.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "12345678"
}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully. Registration complete!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "mobile": "9876543210",
    "role": "user"
  }
}
```

**Error Responses:**
- `400` - Missing email or OTP
- `400` - User already verified
- `400` - OTP expired
- `400` - Invalid OTP
- `404` - User not found
- `500` - Server error

---

### 3. Resend OTP

#### POST `/api/user/resend-otp`
Generate a new OTP and return it in the response.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "New OTP generated. Please verify to complete registration.",
  "email": "john.doe@example.com",
  "otp": "87654321",
  "expiresIn": 900
}
```

**Response Fields:**
- `otp` - New 8-digit OTP code (display to user for verification)
- `expiresIn` - OTP expiry time in seconds (900 = 15 minutes)

**Error Responses:**
- `400` - Missing email
- `400` - User already verified
- `404` - User not found
- `500` - Server error

---

### 4. Login

#### POST `/api/user/login`
Login with email/mobile and password.

**Request Body:**
```json
{
  "identifier": "john.doe@example.com",
  "password": "Secure@123"
}
```

**OR:**
```json
{
  "identifier": "9876543210",
  "password": "Secure@123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "mobile": "9876543210",
    "role": "user"
  }
}
```

**Error Responses:**
- `400` - Missing identifier or password
- `401` - Invalid credentials
- `401` - User not verified (with `needsVerification: true`)
- `500` - Server error

**Unverified User Response:**
```json
{
  "message": "Please verify your email first",
  "needsVerification": true,
  "email": "john.doe@example.com"
}
```

---

### 5. Forgot Password

#### POST `/api/user/forgot-password`
Generate password reset OTP and return it in the response.

**Request Body:**
```json
{
  "identifier": "john.doe@example.com"
}
```

**OR:**
```json
{
  "identifier": "9876543210"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset OTP generated. Please verify to reset password.",
  "email": "john.doe@example.com",
  "otp": "12345678",
  "expiresIn": 900
}
```

**Response Fields:**
- `otp` - 8-digit OTP code (display to user for verification)
- `expiresIn` - OTP expiry time in seconds (900 = 15 minutes)

**Error Responses:**
- `400` - Missing identifier
- `400` - User not verified
- `404` - User not found
- `500` - Server error

---

### 6. Reset Password

#### POST `/api/user/reset-password`
Reset password with OTP verification.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "12345678",
  "newPassword": "NewSecure@123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**
- `400` - Missing email, OTP, or new password
- `400` - OTP expired
- `400` - Invalid OTP
- `404` - User not found or no password reset requested
- `500` - Server error

---

### 7. Get Classes

#### GET `/api/user/classes`
Get list of all available classes.

**Response (200 OK):**
```json
{
  "success": true,
  "count": 12,
  "classes": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Class 1",
      "level": 1
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Class 2",
      "level": 2
    }
  ]
}
```

**Error Responses:**
- `500` - Server error

---

### 8. Get Basic Calculation Learning Outcomes

#### GET `/api/user/learning-outcomes/basic-calculation/:classLevel`
Get BASIC_CALCULATION learning outcomes for the previous class (classLevel - 1), including tags and concepts (mappings).

**URL Parameters:**
- `classLevel` (number) - The selected class level (must be 2 or higher)

**Example:** `GET /api/user/learning-outcomes/basic-calculation/5`

**Response (200 OK):**
```json
{
  "success": true,
  "selectedClass": 5,
  "fetchedFromClass": {
    "level": 4,
    "name": "Class 4",
    "_id": "507f1f77bcf86cd799439014"
  },
  "count": 4,
  "learningOutcomes": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "text": "Adds numbers beyond 1000 using place value understanding.\nAdds four- and five-digit numbers with and without regrouping.\nEstimates sums of large numbers and verifies the results using standard algorithms.",
      "type": "BASIC_CALCULATION",
      "topicName": "Addition",
      "instruction": "Practice addition with regrouping",
      "contents": [],
      "classId": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Class 4",
        "level": 4
      },
      "tags": [
        {
          "tag": "Adds numbers beyond 1000 using place value understanding.",
          "concept": "Place Value Addition"
        },
        {
          "tag": "Adds four- and five-digit numbers with and without regrouping.",
          "concept": "Multi-digit Addition"
        },
        {
          "tag": "Estimates sums of large numbers and verifies the results using standard algorithms.",
          "concept": "Estimation & Verification"
        }
      ],
      "concepts": [
        "Place Value Addition",
        "Multi-digit Addition",
        "Estimation & Verification"
      ]
    }
  ]
}
```

**Response Fields:**
- `tags` - Array of tag objects, each containing:
  - `tag` - The individual tag text (extracted from the `text` field, split by newline and comma)
  - `concept` - The concept name this tag belongs to (from ConceptGraph, or null if not mapped)
- `concepts` - Array of unique concept names that the tags belong to

**Error Responses:**
- `400` - Invalid class level (must be 2 or higher)
- `404` - Previous class not found
- `500` - Server error

---

### 9. Get Concepts with Tags

#### GET `/api/user/concepts-with-tags/:classLevel`
Get previous class concepts with mapped tags (fromTag → toTag progressions).

**URL Parameters:**
- `classLevel` (number) - The selected class level (must be 2 or higher)

**Example:** `GET /api/user/concepts-with-tags/5`

**Response (200 OK):**
```json
{
  "success": true,
  "selectedClass": 5,
  "fetchedFromClass": {
    "level": 4,
    "name": "Class 4",
    "_id": "507f1f77bcf86cd799439014"
  },
  "totalConcepts": 8,
  "concepts": [
    {
      "learningOutcomeId": "507f1f77bcf86cd799439020",
      "topicName": "Addition",
      "text": "Adds two-digit numbers with regrouping",
      "type": "BASIC_CALCULATION",
      "tags": [
        {
          "fromTag": "Adds two-digit numbers",
          "toTag": "Adds three-digit numbers",
          "mappingType": "progression",
          "relevanceScore": 0.85,
          "reason": "Natural progression from two-digit to three-digit addition",
          "mappedLearningOutcomeId": "507f1f77bcf86cd799439021"
        }
      ],
      "totalMappings": 3
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid class level (must be 2 or higher)
- `404` - Previous class not found
- `500` - Server error

---

## Request/Response Examples

### Complete Registration Flow

#### Step 1: Register
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "mobile": "9876543210",
    "password": "Test@123"
  }'
```

**Response:**
```json
{
  "message": "Registration successful. Please verify OTP to complete registration.",
  "userId": "507f1f77bcf86cd799439011",
  "email": "testuser@example.com",
  "otp": "12345678",
  "expiresIn": 900
}
```

**Note**: The OTP is returned in the response. Display it to the user on the frontend.

#### Step 2: Verify OTP
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "12345678"
  }'
```

**Response:**
```json
{
  "message": "Email verified successfully. Registration complete!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "testuser@example.com",
    "mobile": "9876543210",
    "role": "user"
  }
}
```

#### Step 3: Login
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser@example.com",
    "password": "Test@123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "testuser@example.com",
    "mobile": "9876543210",
    "role": "user"
  }
}
```

---

### Password Reset Flow

#### Step 1: Request Password Reset
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser@example.com"
  }'
```

**Response:**
```json
{
  "message": "Password reset OTP generated. Please verify to reset password.",
  "email": "testuser@example.com",
  "otp": "12345678",
  "expiresIn": 900
}
```

**Note**: The OTP is returned in the response. Display it to the user on the frontend.

#### Step 2: Reset Password
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "87654321",
    "newPassword": "NewSecure@123"
  }'
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

---

### Get Learning Outcomes

```bash
curl -X GET https://academic-7mkg.onrender.com/api/user/learning-outcomes/basic-calculation/5
```

**Response:**
```json
{
  "success": true,
  "selectedClass": 5,
  "fetchedFromClass": {
    "level": 4,
    "name": "Class 4",
    "_id": "507f1f77bcf86cd799439014"
  },
  "count": 15,
  "learningOutcomes": [...]
}
```

---

### Get Concepts with Tags

```bash
curl -X GET https://academic-7mkg.onrender.com/api/user/concepts-with-tags/5
```

**Response:**
```json
{
  "success": true,
  "selectedClass": 5,
  "fetchedFromClass": {
    "level": 4,
    "name": "Class 4",
    "_id": "507f1f77bcf86cd799439014"
  },
  "totalConcepts": 8,
  "concepts": [...]
}
```

---

## Error Handling

All endpoints return consistent error responses:

### Standard Error Format
```json
{
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, invalid input)
- `401` - Unauthorized (invalid credentials, unverified user)
- `404` - Not Found (user, class, or resource not found)
- `500` - Internal Server Error

### Common Error Messages
- `"Please provide all required fields: name, email, mobile, password"`
- `"User with this email already exists"`
- `"Invalid credentials"`
- `"Please verify your email first"`
- `"OTP has expired. Please request a new one."`
- `"Invalid OTP"`
- `"User not found"`

---

## Testing Guide

### Prerequisites
1. Ensure JWT_SECRET is set in `.env`
2. Ensure MONGO_URI is set in `.env`
3. **No email service required** - OTP is returned in API response

### Test Registration Flow
1. **Register** → Get OTP from response
2. **Display OTP** → Show OTP to user on frontend
3. **Verify OTP** → User enters OTP, get JWT token
4. **Login** → Verify token works

### Test Password Reset Flow
1. **Forgot Password** → Get OTP from response
2. **Display OTP** → Show OTP to user on frontend
3. **Reset Password** → User enters OTP and new password
4. **Login with New Password** → Verify login works

### Test Learning Outcomes
1. **Get Classes** → Verify class list
2. **Get Learning Outcomes** → Verify previous class outcomes
3. **Get Concepts with Tags** → Verify tag mappings

---

## OTP Service

### OTP Generation
- **8-digit random code** generated on backend
- **Returned in API response** (no email required)
- **Valid for 15 minutes** (900 seconds)

### OTP Flow
1. **Backend generates OTP** when user registers/resets password
2. **OTP returned in response** - Frontend displays it to user
3. **User enters OTP** - Frontend sends to verify endpoint
4. **Backend verifies OTP** - Completes registration/password reset

### OTP Types
- `registration` - For email verification during registration
- `password_reset` - For password reset requests

### OTP Expiry
- OTPs expire after **15 minutes** (900 seconds)
- Users can request a new OTP using `/resend-otp`
- Expired OTPs cannot be used for verification

---

## Authentication Token

### Token Usage
After successful login or registration verification, a JWT token is returned. This token should be included in subsequent authenticated requests:

```
Authorization: Bearer <token>
```

### Token Expiry
- Tokens expire after **30 days**
- Users need to login again after expiry

---

## Frontend Integration Guide

### Registration Flow Implementation

```javascript
// Step 1: Register user
const registerResponse = await fetch('https://academic-7mkg.onrender.com/api/user/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    mobile: '9876543210',
    password: 'Secure@123'
  })
});

const registerData = await registerResponse.json();

// Step 2: Display OTP to user
console.log('OTP:', registerData.otp);
// Show OTP on screen: "Your verification code is: 12345678"

// Step 3: User enters OTP, verify it
const verifyResponse = await fetch('https://academic-7mkg.onrender.com/api/user/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    otp: registerData.otp // or user-entered OTP
  })
});

const verifyData = await verifyResponse.json();

// Step 4: Save token and redirect
localStorage.setItem('token', verifyData.token);
// Redirect to dashboard
```

### Password Reset Flow Implementation

```javascript
// Step 1: Request password reset
const forgotResponse = await fetch('https://academic-7mkg.onrender.com/api/user/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'john@example.com'
  })
});

const forgotData = await forgotResponse.json();

// Step 2: Display OTP to user
console.log('OTP:', forgotData.otp);
// Show OTP on screen

// Step 3: User enters OTP and new password
const resetResponse = await fetch('https://academic-7mkg.onrender.com/api/user/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    otp: forgotData.otp,
    newPassword: 'NewSecure@123'
  })
});
```

---

## 7. Quiz Submission & Results

### 7.1 Submit Quiz Results

#### POST `/api/user/quiz/submit`
Stores complete quiz attempt data including all question responses, topic-wise and concept-wise performance. Updates user profile if they pass.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "classLevel": 3,
  "quizType": "BASIC_CALCULATION",
  "totalQuestions": 30,
  "correctAnswers": 18,
  "incorrectAnswers": 12,
  "score": 18,
  "percentage": 60.0,
  "timeSpent": 3600,
  "passed": true,
  "overall": {
    "score": 18,
    "total": 30,
    "correct": 18,
    "percentage": 60.0
  },
  "topicWise": {
    "Addition": {
      "score": 5,
      "total": 8,
      "correct": 5,
      "percentage": 62.5
    },
    "Subtraction": {
      "score": 4,
      "total": 7,
      "correct": 4,
      "percentage": 57.1
    }
  },
  "conceptWise": {
    "Whole Number Addition": {
      "score": 3,
      "total": 5,
      "correct": 3,
      "percentage": 60.0
    }
  },
  "questions": [
    {
      "questionId": 1,
      "question": "What is the sum of 234 and 567?",
      "options": ["801", "791", "821", "831"],
      "selectedAnswer": 1,
      "selectedOption": "791",
      "correctAnswer": 1,
      "correctOption": "791",
      "isCorrect": true,
      "topicName": "Addition",
      "concept": "Whole Number Addition",
      "tag": "Adds two- and three-digit numbers with and without regrouping.",
      "difficulty": "medium",
      "timeSpent": 45,
      "latex": false
    }
  ],
  "wrongConcepts": [
    {
      "concept": "Estimation and Verification",
      "wrongCount": 2,
      "totalQuestions": 4,
      "percentage": 50.0
    }
  ],
  "wrongTopics": [
    {
      "topic": "Subtraction",
      "wrongCount": 3,
      "totalQuestions": 7,
      "percentage": 57.1
    }
  ],
  "remedialRecommendations": [
    "Overall performance is below 60%. Focus on reviewing fundamental concepts.",
    "Review Subtraction concepts - scored 57.1%"
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quiz results saved successfully",
  "data": {
    "attemptId": "507f1f77bcf86cd799439011",
    "classLevel": 3,
    "score": 18,
    "percentage": 60.0,
    "passed": true,
    "profileUpdated": true,
    "passedClassLevel": 3,
    "totalQuestions": 30,
    "correctAnswers": 18,
    "incorrectAnswers": 12,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Business Logic:**
- If `passed: true` (percentage >= 60%) AND `quizType: "BASIC_CALCULATION"`:
  - Updates `user.passedBasicCalculationClass = classLevel`
  - Only updates if the new class level is higher than existing one
  - Example: If user already passed Class 4, won't update to Class 3

---

### 7.2 Get User Quiz History

#### GET `/api/user/quiz/history`
Retrieves all quiz attempts for the authenticated user with detailed information.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `classLevel` (number, optional): Filter by class level
- `quizType` (string, optional): Filter by quiz type (e.g., "BASIC_CALCULATION")
- `passed` (boolean, optional): Filter by pass/fail status
- `limit` (number, optional): Number of results to return (default: 10)
- `skip` (number, optional): Number of results to skip (default: 0)

**Example Request:**
```
GET /api/user/quiz/history?classLevel=3&passed=true&limit=5
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attempts": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439012",
        "classLevel": 3,
        "quizType": "BASIC_CALCULATION",
        "score": 18,
        "percentage": 60.0,
        "totalQuestions": 30,
        "correctAnswers": 18,
        "incorrectAnswers": 12,
        "passed": true,
        "timeSpent": 3600,
        "topicWise": {
          "Addition": {
            "correct": 5,
            "total": 8,
            "percentage": 62.5
          }
        },
        "conceptWise": {
          "Whole Number Addition": {
            "correct": 3,
            "total": 5,
            "percentage": 60.0
          }
        },
        "wrongConcepts": [
          {
            "concept": "Estimation and Verification",
            "wrongCount": 2,
            "totalQuestions": 4
          }
        ],
        "wrongTopics": [
          {
            "topic": "Subtraction",
            "wrongCount": 3,
            "totalQuestions": 7
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 15,
    "limit": 5,
    "skip": 0
  }
}
```

**Note:** Questions array is excluded from history list for performance. Use the detailed attempt endpoint to get full question data.

---

### 7.3 Get Detailed Quiz Attempt

#### GET `/api/user/quiz/attempt/:attemptId`
Retrieves complete details of a specific quiz attempt including all questions and answers.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `attemptId` (string, required): The quiz attempt ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "classLevel": 3,
    "quizType": "BASIC_CALCULATION",
    "totalQuestions": 30,
    "correctAnswers": 18,
    "incorrectAnswers": 12,
    "score": 18,
    "percentage": 60.0,
    "timeSpent": 3600,
    "passed": true,
    "overall": {
      "score": 18,
      "total": 30,
      "correct": 18,
      "percentage": 60.0
    },
    "topicWise": {
      "Addition": {
        "score": 5,
        "total": 8,
        "correct": 5,
        "percentage": 62.5
      },
      "Subtraction": {
        "score": 4,
        "total": 7,
        "correct": 4,
        "percentage": 57.1
      }
    },
    "conceptWise": {
      "Whole Number Addition": {
        "score": 3,
        "total": 5,
        "correct": 3,
        "percentage": 60.0
      }
    },
    "questions": [
      {
        "questionId": 1,
        "question": "What is the sum of 234 and 567?",
        "options": ["801", "791", "821", "831"],
        "selectedAnswer": 1,
        "selectedOption": "791",
        "correctAnswer": 1,
        "correctOption": "791",
        "isCorrect": true,
        "topicName": "Addition",
        "concept": "Whole Number Addition",
        "tag": "Adds two- and three-digit numbers with and without regrouping.",
        "difficulty": "medium",
        "timeSpent": 45,
        "latex": false
      },
      {
        "questionId": 2,
        "question": "Subtract 456 from 789",
        "options": ["333", "323", "343", "353"],
        "selectedAnswer": 0,
        "selectedOption": "333",
        "correctAnswer": 1,
        "correctOption": "323",
        "isCorrect": false,
        "topicName": "Subtraction",
        "concept": "Whole Number Subtraction",
        "tag": "Subtracts two- and three-digit numbers with and without regrouping.",
        "difficulty": "medium",
        "timeSpent": 60,
        "latex": false
      }
    ],
    "wrongConcepts": [
      {
        "concept": "Estimation and Verification",
        "wrongCount": 2,
        "totalQuestions": 4,
        "percentage": 50.0,
        "questions": [5, 12]
      }
    ],
    "wrongTopics": [
      {
        "topic": "Subtraction",
        "wrongCount": 3,
        "totalQuestions": 7,
        "percentage": 57.1,
        "questions": [2, 8, 15]
      }
    ],
    "remedialRecommendations": [
      "Overall performance is below 60%. Focus on reviewing fundamental concepts.",
      "Review Subtraction concepts - scored 57.1%"
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7.4 Get User Progress Summary

#### GET `/api/user/progress`
Retrieves overall progress summary including passed classes and performance statistics.

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "passedBasicCalculationClass": 3,
    "totalAttempts": 15,
    "totalPassed": 8,
    "totalFailed": 7,
    "averageScore": 65.5,
    "classPerformance": {
      "3": {
        "attempts": 5,
        "passed": 3,
        "averageScore": 68.0,
        "bestScore": 85.0
      },
      "4": {
        "attempts": 10,
        "passed": 5,
        "averageScore": 63.0,
        "bestScore": 75.0
      }
    },
    "topicMastery": {
      "Addition": 72.5,
      "Subtraction": 65.0,
      "Multiplication": 68.0,
      "Division": 62.5
    },
    "conceptMastery": {
      "Whole Number Addition": 75.0,
      "Estimation and Verification": 60.0
    }
  }
}
```

**Response Fields:**
- `passedBasicCalculationClass`: Highest class level passed
- `totalAttempts`: Total number of quiz attempts
- `totalPassed`: Number of passed attempts
- `totalFailed`: Number of failed attempts
- `averageScore`: Average percentage across all attempts
- `classPerformance`: Performance breakdown by class level
- `topicMastery`: Average mastery percentage per topic
- `conceptMastery`: Average mastery percentage per concept

---

## 8. Profile Management

### 8.1 Get User Profile

#### GET `/api/user/profile`
Retrieves user profile including passed class levels.

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "role": "user",
    "grade": "Grade 4",
    "avatar": "https://example.com/avatar.jpg",
    "passedBasicCalculationClass": 3,
    "passedClasses": {
      "BASIC_CALCULATION": 3,
      "ADVANCED_ALGEBRA": null,
      "THERMODYNAMICS": null
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response Fields:**
- `passedBasicCalculationClass`: Highest passed class level for BASIC_CALCULATION
- `passedClasses`: Object containing passed class levels for each quiz type

---

### 8.2 Get Topics for a Class

#### GET `/api/user/classes/:classLevel/topics`
Retrieves all topics available for a specific class level.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `classLevel` (number, required): The class level (e.g., 3, 4, 5)

**Example Request:**
```
GET /api/user/classes/3/topics
```

**Response (200 OK):**
```json
{
  "success": true,
  "classLevel": 3,
  "className": "Class 3",
  "topics": [
    {
      "topicName": "Addition",
      "description": "Learning outcomes for Addition in Class 3",
      "concepts": [
        "Whole Number Addition",
        "Estimation and Verification",
        "Addition Strategies and Reasoning"
      ],
      "totalTags": 6,
      "learningOutcomes": [
        {
          "_id": "69731ca6ca1872c253a98db8",
          "text": "Adds two- and three-digit numbers with and without regrouping...",
          "type": "BASIC_CALCULATION"
        }
      ]
    },
    {
      "topicName": "Subtraction",
      "description": "Learning outcomes for Subtraction in Class 3",
      "concepts": [
        "Whole Number Subtraction",
        "Estimation and Verification",
        "Problem Solving and Application",
        "Strategies and Explanation"
      ],
      "totalTags": 6,
      "learningOutcomes": [
        {
          "_id": "69731d50ca1872c253a98e75",
          "text": "Subtracts two- and three-digit numbers with and without regrouping...",
          "type": "BASIC_CALCULATION"
        }
      ]
    },
    {
      "topicName": "Multiplication",
      "description": "Learning outcomes for Multiplication in Class 3",
      "concepts": [
        "Multiplication Foundations",
        "Whole Number Multiplication",
        "Problem Solving Applications"
      ],
      "totalTags": 6,
      "learningOutcomes": [
        {
          "_id": "69731de7ca1872c253a98f44",
          "text": "Understands multiplication as repeated addition and equal grouping...",
          "type": "BASIC_CALCULATION"
        }
      ]
    },
    {
      "topicName": "Division",
      "description": "Learning outcomes for Division in Class 3",
      "concepts": [
        "Division Fundamentals",
        "Division Algorithms and Procedures",
        "Verification and Estimation",
        "Problem Solving and Applications"
      ],
      "totalTags": 6,
      "learningOutcomes": [
        {
          "_id": "69731e6aca1872c253a99190",
          "text": "Understands division as equal sharing and equal grouping...",
          "type": "BASIC_CALCULATION"
        }
      ]
    }
  ],
  "totalTopics": 4
}
```

**Response Fields:**
- `classLevel`: The requested class level
- `className`: Name of the class
- `topics`: Array of topics with their concepts and learning outcomes
  - `topicName`: Name of the topic
  - `description`: Description of the topic
  - `concepts`: Array of concept names from ConceptGraph
  - `totalTags`: Total number of tags across all learning outcomes
  - `learningOutcomes`: Array of learning outcomes for this topic

---

## Notes

1. **Email/Mobile Login**: Users can login with either email or mobile number using the `identifier` field.

2. **OTP Verification**: All OTPs are 8-digit codes valid for 15 minutes. OTP is returned in API response, not sent via email.

3. **No Email Service Required**: The system returns OTP directly in the API response. Frontend should display it to the user.

4. **Previous Class Logic**: 
   - For class level 5, learning outcomes are fetched from class level 4
   - Minimum class level is 2 (to fetch from class 1)

5. **BASIC_CALCULATION Type**: Learning outcomes endpoints specifically fetch `BASIC_CALCULATION` type outcomes.

6. **Tag Mappings**: The concepts-with-tags endpoint returns tag progressions (fromTag → toTag) from learning outcome mappings.

7. **Quiz Submission**: When submitting quiz results, the system automatically updates the user's `passedBasicCalculationClass` if they pass (percentage >= 60%) and the new class level is higher than the existing one.

8. **Profile Updates**: User profile is automatically updated when they pass a quiz. The `passedBasicCalculationClass` field stores the highest class level passed.

9. **Progress Tracking**: The progress endpoint calculates statistics across all quiz attempts, including topic and concept mastery percentages.

---

## Support

For issues or questions, contact the development team or refer to the main API documentation.

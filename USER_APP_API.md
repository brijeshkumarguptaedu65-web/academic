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
Get BASIC_CALCULATION learning outcomes for the previous class (classLevel - 1).

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
  "count": 15,
  "learningOutcomes": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "text": "Adds two-digit numbers with regrouping",
      "type": "BASIC_CALCULATION",
      "topicName": "Addition",
      "instruction": "Practice addition with regrouping",
      "contents": [],
      "classId": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Class 4",
        "level": 4
      }
    }
  ]
}
```

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

## Notes

1. **Email/Mobile Login**: Users can login with either email or mobile number using the `identifier` field.

2. **OTP Verification**: All OTPs are 8-digit codes valid for 15 minutes. OTP is returned in API response, not sent via email.

3. **No Email Service Required**: The system returns OTP directly in the API response. Frontend should display it to the user.

4. **Previous Class Logic**: 
   - For class level 5, learning outcomes are fetched from class level 4
   - Minimum class level is 2 (to fetch from class 1)

5. **BASIC_CALCULATION Type**: Learning outcomes endpoints specifically fetch `BASIC_CALCULATION` type outcomes.

6. **Tag Mappings**: The concepts-with-tags endpoint returns tag progressions (fromTag → toTag) from learning outcome mappings.

---

## Support

For issues or questions, contact the development team or refer to the main API documentation.

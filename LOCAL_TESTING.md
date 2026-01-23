# Local Testing Guide

## Quick Start

### 1. Start Your Server

```bash
npm start
# or
node server.js
```

The server should start on port 5000 (or the PORT specified in your .env).

---

## Test Registration with cURL

### Basic Registration Test

```bash
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "varun.singhal78@gmail.com",
    "mobile": "9896904632",
    "password": "123456"
  }'
```

### Pretty Print Response (if you have jq installed)

```bash
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "varun.singhal78@gmail.com",
    "mobile": "9896904632",
    "password": "123456"
  }' | jq '.'
```

### With Verbose Output

```bash
curl -v -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "varun.singhal78@gmail.com",
    "mobile": "9896904632",
    "password": "123456"
  }'
```

---

## Expected Response

### Success (201 Created)

```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "userId": "507f1f77bcf86cd799439011",
  "email": "varun.singhal78@gmail.com"
}
```

### If Email Fails (but registration succeeds)

```json
{
  "message": "Registration successful, but email delivery failed. Please contact support.",
  "userId": "507f1f77bcf86cd799439011",
  "email": "varun.singhal78@gmail.com",
  "otp": "12345678",
  "emailError": "Connection timeout",
  "warning": "Email service unavailable. Please use resend-otp endpoint or contact support."
}
```

**Note**: In development mode (`NODE_ENV=development`), if email fails, the OTP will be included in the response for testing.

---

## Test Verify OTP

After registration, verify the OTP:

```bash
curl -X POST http://localhost:5000/api/user/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "varun.singhal78@gmail.com",
    "otp": "12345678"
  }'
```

---

## Test Login

```bash
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "varun.singhal78@gmail.com",
    "password": "123456"
  }'
```

---

## Test Other Endpoints

### Get Classes

```bash
curl http://localhost:5000/api/user/classes
```

### Get Basic Calculation Learning Outcomes

```bash
curl http://localhost:5000/api/user/learning-outcomes/basic-calculation/5
```

### Get Concepts with Tags

```bash
curl http://localhost:5000/api/user/concepts-with-tags/5
```

---

## Using the Test Script

You can also use the Node.js test script:

```bash
node test_register_local.js
```

This will:
1. Check if server is running
2. Test registration
3. Show the response
4. Provide next steps

---

## Troubleshooting

### Server Not Running

If you get connection errors:
```bash
# Check if server is running
lsof -i :5000

# Start the server
npm start
```

### Port Already in Use

If port 5000 is busy:
```bash
# Kill the process
kill -9 $(lsof -ti:5000)

# Or use a different port
PORT=5001 node server.js
```

### Environment Variables

Make sure your `.env` file has:
- `MONGO_URI`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`

---

## Quick Test Commands

Copy and paste these into your terminal:

```bash
# 1. Register
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","mobile":"9876543210","password":"123456"}'

# 2. Verify OTP (replace with actual OTP)
curl -X POST http://localhost:5000/api/user/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"12345678"}'

# 3. Login
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"123456"}'
```

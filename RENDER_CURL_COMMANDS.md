# Render API Testing - cURL Commands

## Base URL
```
https://academic-7mkg.onrender.com
```

---

## 1. Registration API

### Basic Registration
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "varun.singhal78@gmail.com",
    "mobile": "9896904632",
    "password": "123456"
  }'
```

### One-line Version
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"varun.singhal78@gmail.com","mobile":"9896904632","password":"123456"}'
```

### With Pretty Output (if jq installed)
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"varun.singhal78@gmail.com","mobile":"9896904632","password":"123456"}' | jq '.'
```

### With Verbose Output (see full request/response)
```bash
curl -v -X POST https://academic-7mkg.onrender.com/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"varun.singhal78@gmail.com","mobile":"9896904632","password":"123456"}'
```

---

## 2. Verify OTP

```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "varun.singhal78@gmail.com",
    "otp": "12345678"
  }'
```

### One-line Version
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/verify-otp -H "Content-Type: application/json" -d '{"email":"varun.singhal78@gmail.com","otp":"12345678"}'
```

---

## 3. Resend OTP

```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "varun.singhal78@gmail.com"
  }'
```

---

## 4. Login

```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "varun.singhal78@gmail.com",
    "password": "123456"
  }'
```

### Login with Mobile
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9896904632",
    "password": "123456"
  }'
```

---

## 5. Forgot Password

```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "varun.singhal78@gmail.com"
  }'
```

---

## 6. Reset Password

```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "varun.singhal78@gmail.com",
    "otp": "12345678",
    "newPassword": "NewPassword123"
  }'
```

---

## 7. Get Classes

```bash
curl https://academic-7mkg.onrender.com/api/user/classes
```

---

## 8. Get Basic Calculation Learning Outcomes

```bash
curl https://academic-7mkg.onrender.com/api/user/learning-outcomes/basic-calculation/5
```

---

## 9. Get Concepts with Tags

```bash
curl https://academic-7mkg.onrender.com/api/user/concepts-with-tags/5
```

---

## Quick Test Script

Save this as `test_render.sh`:

```bash
#!/bin/bash

BASE_URL="https://academic-7mkg.onrender.com"

echo "Testing Registration..."
curl -X POST "$BASE_URL/api/user/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"varun.singhal78@gmail.com","mobile":"9896904632","password":"123456"}' \
  | jq '.'

echo -e "\n\nTesting Login..."
curl -X POST "$BASE_URL/api/user/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"varun.singhal78@gmail.com","password":"123456"}' \
  | jq '.'

echo -e "\n\nTesting Get Classes..."
curl "$BASE_URL/api/user/classes" | jq '.'
```

Make it executable:
```bash
chmod +x test_render.sh
./test_render.sh
```

---

## Expected Responses

### Registration Success
```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "userId": "69738faf8df403d2973ee259",
  "email": "varun.singhal78@gmail.com"
}
```

### Registration Success (Email Failed)
```json
{
  "message": "Registration successful, but email delivery failed. Please contact support.",
  "userId": "69738faf8df403d2973ee259",
  "email": "varun.singhal78@gmail.com",
  "warning": "Email service unavailable. Please use resend-otp endpoint or contact support."
}
```

### Login Success
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "69738faf8df403d2973ee259",
    "name": "Test User",
    "email": "varun.singhal78@gmail.com",
    "mobile": "9896904632",
    "role": "user"
  }
}
```

---

## Troubleshooting

### SSL Certificate Error
If you get SSL errors, use `-k` flag:
```bash
curl -k -X POST https://academic-7mkg.onrender.com/api/user/register ...
```

### Connection Timeout
- Check if Render service is running
- Check Render logs for errors
- Verify environment variables are set

### 500 Internal Server Error
- Check Render logs
- Verify MongoDB connection
- Check environment variables (MONGO_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS)

---

## Copy-Paste Ready Commands

### Registration
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"varun.singhal78@gmail.com","mobile":"9896904632","password":"123456"}'
```

### Verify OTP (replace OTP)
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/verify-otp -H "Content-Type: application/json" -d '{"email":"varun.singhal78@gmail.com","otp":"12345678"}'
```

### Login
```bash
curl -X POST https://academic-7mkg.onrender.com/api/user/login -H "Content-Type: application/json" -d '{"identifier":"varun.singhal78@gmail.com","password":"123456"}'
```

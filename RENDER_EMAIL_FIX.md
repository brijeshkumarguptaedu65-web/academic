# Render Email Service Fix Guide

## Problem
Email works locally but fails on Render with connection timeout errors.

## Solution Applied

### 1. Updated Email Configuration
- ✅ Increased timeouts from 10s to 30s
- ✅ Added connection pooling
- ✅ Added retry logic (3 attempts with exponential backoff)
- ✅ Better error handling

### 2. Changes Made
The email service now:
- Retries up to 3 times if connection fails
- Uses longer timeouts (30 seconds) for cloud platforms
- Pools connections for better reliability
- Handles authentication errors separately (no retry)

---

## Common Issues on Render

### Issue 1: Gmail Blocking Render IPs
**Symptom**: Connection timeout even with correct credentials

**Solutions**:
1. **Use Gmail App Password** (you're already doing this ✅)
2. **Enable "Less Secure App Access"** - Actually, this is deprecated. Use App Password instead.
3. **Check Gmail Security Settings**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Make sure 2-Step Verification is enabled
   - Verify App Password is correct (16 characters, no spaces needed in code)

### Issue 2: Network Restrictions
**Symptom**: ETIMEDOUT errors

**Solutions**:
1. The code now uses port 587 (STARTTLS) which is more compatible
2. Timeouts increased to 30 seconds
3. Retry logic added (3 attempts)

### Issue 3: Environment Variables Not Set
**Symptom**: Authentication errors

**Check on Render**:
1. Go to your Render service dashboard
2. Click **Environment** tab
3. Verify these are set:
   - `EMAIL_USER` - Your Gmail address
   - `EMAIL_PASS` - Gmail App Password (16 chars)
   - `EMAIL_FROM` - (Optional) From address

---

## Testing on Render

### 1. Check Render Logs
After deploying, check logs for:
```
Email sent successfully (attempt 1): <message-id>
```

Or errors like:
```
Email send attempt 1 failed: Connection timeout
Retrying in 2000ms...
```

### 2. Test Registration Endpoint
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

### 3. Expected Response

**If email succeeds:**
```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "userId": "...",
  "email": "varun.singhal78@gmail.com"
}
```

**If email fails (but registration succeeds):**
```json
{
  "message": "Registration successful, but email delivery failed. Please contact support.",
  "userId": "...",
  "email": "varun.singhal78@gmail.com",
  "warning": "Email service unavailable. Please use resend-otp endpoint or contact support."
}
```

---

## Alternative Solutions

If Gmail still doesn't work on Render, consider:

### Option 1: Use SendGrid (Recommended for Production)
1. Sign up at [SendGrid](https://sendgrid.com)
2. Get API key
3. Update email service to use SendGrid

### Option 2: Use Mailgun
1. Sign up at [Mailgun](https://www.mailgun.com)
2. Get API credentials
3. Update email service to use Mailgun

### Option 3: Use AWS SES
1. Set up AWS SES
2. Get SMTP credentials
3. Update email service to use SES SMTP

---

## Current Status

✅ **Registration works even if email fails** - User is created, OTP is saved
✅ **Retry logic** - Automatically retries 3 times
✅ **Better timeouts** - 30 seconds instead of 10
✅ **Connection pooling** - More reliable connections

---

## Next Steps

1. **Deploy the updated code to Render**
2. **Check Render logs** for email send attempts
3. **Test registration** on Render
4. **If still failing**, check:
   - Gmail App Password is correct
   - Environment variables are set on Render
   - Render logs for specific error messages

---

## Debugging Commands

### Check if email service is working:
```bash
# On Render, check logs for:
# "Email sent successfully" or "Email send attempt X failed"
```

### Verify environment variables:
```bash
# On Render dashboard, check Environment tab
# Should have: EMAIL_USER, EMAIL_PASS
```

### Test email connection:
The code now logs detailed error information. Check Render logs for:
- Connection timeout errors
- Authentication errors
- Retry attempts

---

## Quick Fix Checklist

- [ ] Deploy updated code to Render
- [ ] Verify `EMAIL_USER` is set on Render
- [ ] Verify `EMAIL_PASS` is a valid Gmail App Password (16 chars)
- [ ] Restart Render service after setting env vars
- [ ] Test registration endpoint
- [ ] Check Render logs for email send status
- [ ] If still failing, consider alternative email service

---

## Contact

If email still doesn't work after these fixes, the registration will still succeed, and users can:
1. Use the `/resend-otp` endpoint
2. Contact support for manual verification
3. The OTP is saved in the database and can be retrieved

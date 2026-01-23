# Environment Variables Setup Guide

## Required Environment Variables for Render

Make sure all these are set in your Render dashboard under **Environment Variables**:

### 1. Database Configuration

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```
- **Required**: ✅ Yes
- **Description**: Your MongoDB Atlas connection string
- **Example**: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/academic-audit?retryWrites=true&w=majority`

---

### 2. JWT Secret

```
JWT_SECRET=your-super-secret-jwt-key-here
```
- **Required**: ✅ Yes
- **Description**: Secret key for signing JWT tokens
- **Example**: `my-super-secret-jwt-key-12345-abcdef`
- **Note**: Use a long, random string. Generate one with: `openssl rand -base64 32`

---

### 3. Email Configuration

#### EMAIL_USER
```
EMAIL_USER=your-email@gmail.com
```
- **Required**: ✅ Yes
- **Description**: Your Gmail address for sending OTP emails
- **Example**: `academic.audit@gmail.com`

#### EMAIL_PASS
```
EMAIL_PASS=abcd efgh ijkl mnop
```
- **Required**: ✅ Yes
- **Description**: Gmail App Password (NOT your regular Gmail password)
- **Example**: `abcd efgh ijkl mnop` (16 characters, may have spaces)
- **⚠️ IMPORTANT**: 
  - This MUST be a Gmail App Password, not your regular password
  - To create one:
    1. Go to [Google Account Security](https://myaccount.google.com/security)
    2. Enable **2-Step Verification** (if not already enabled)
    3. Go to **App Passwords** section
    4. Select **Mail** and **Other (Custom name)** → Enter "Academic Audit"
    5. Copy the 16-character password (spaces are okay, they'll be ignored)

#### EMAIL_FROM (Optional)
```
EMAIL_FROM=your-email@gmail.com
```
- **Required**: ❌ No (defaults to EMAIL_USER if not set)
- **Description**: From email address
- **Example**: `academic.audit@gmail.com`

---

### 4. Server Configuration (Optional)

#### PORT
```
PORT=5000
```
- **Required**: ❌ No (defaults to 5000)
- **Description**: Server port
- **Note**: Render usually sets this automatically

#### NODE_ENV
```
NODE_ENV=production
```
- **Required**: ❌ No
- **Description**: Environment mode
- **Options**: `development` or `production`
- **Note**: Set to `production` on Render

---

## How to Set Environment Variables on Render

1. Go to your Render dashboard
2. Select your service (academic-audit-backend)
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable one by one:
   - **Key**: `MONGO_URI`
   - **Value**: Your MongoDB connection string
   - Click **Save Changes**
6. Repeat for all required variables

---

## Quick Checklist

Before deploying, ensure you have:

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Random secret key for JWT
- [ ] `EMAIL_USER` - Your Gmail address
- [ ] `EMAIL_PASS` - Gmail App Password (16 characters)
- [ ] `EMAIL_FROM` - (Optional) From email address
- [ ] `PORT` - (Optional) Server port
- [ ] `NODE_ENV` - (Optional) Set to `production`

---

## Common Issues

### Issue: Email Connection Timeout
**Solution**: 
- Make sure `EMAIL_PASS` is a Gmail App Password, not your regular password
- Ensure 2-Step Verification is enabled on your Google account
- The code now uses port 587 (STARTTLS) which is more compatible with Render

### Issue: "Cannot connect to MongoDB"
**Solution**:
- Check your `MONGO_URI` is correct
- Ensure your MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs) or Render's IPs
- Verify your MongoDB username and password are correct

### Issue: "JWT_SECRET is not defined"
**Solution**:
- Make sure `JWT_SECRET` is set in Render environment variables
- After adding, restart your Render service

---

## Testing Your Environment Variables

After setting all variables on Render:

1. **Restart your Render service** (important!)
2. Check Render logs for any environment variable errors
3. Test the registration endpoint:
   ```bash
   curl -X POST https://academic-7mkg.onrender.com/api/user/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "mobile": "9876543210",
       "password": "Test@123"
     }'
   ```

---

## Security Notes

1. **Never commit `.env` files to Git** - They're already in `.gitignore`
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Gmail App Passwords** - More secure than using your main password
4. **MongoDB URI** - Keep it secret, it contains credentials

---

## Need Help?

If you're still having issues:

1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Make sure you restarted the service after adding variables
4. Test email connection separately using the `check_env.js` script (locally)

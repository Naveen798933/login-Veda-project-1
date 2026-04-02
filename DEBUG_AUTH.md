# Authentication Debugging Guide

## Issue: Login/Registration Failing

If you're experiencing failures with login or registration, follow this debugging guide step by step.

### Step 1: Check Browser Console (F12)

1. Open your browser (Chrome/Firefox/Safari)
2. Navigate to `http://localhost:5175`
3. Press `F12` to open Developer Tools
4. Go to the **Console** tab
5. Look for any red error messages

**Common errors to look for:**
- `CORS` errors
- `Network` errors  
- `TypeError` messages
- API response errors

---

### Step 2: Check Network Requests (F12 → Network Tab)

1. Go to **Network** tab in Developer Tools
2. Enter login/registration details and click submit
3. Look for requests to `localhost:5000/api/auth/`
4. Click on the request and check:
   - **Status Code**: Should be 201 (register) or 200 (login)
   - **Request Headers**: Should include `Content-Type: application/json`
   - **Response**: Should have `user` and `accessToken` fields

---

### Step 3: Verify API Endpoint (From Browser Console)

Paste this code in browser console to test the API:

```javascript
// Test Registration
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = "TestPass123!";

fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    email: testEmail,
    password: testPassword
  }),
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('✅ Registration Success:', data))
.catch(err => console.error('❌ Registration Failed:', err));

// Test Login (after 2 seconds)
setTimeout(() => {
  fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    }),
    credentials: 'include'
  })
  .then(res => res.json())
  .then(data => console.log('✅ Login Success:', data))
  .catch(err => console.error('❌ Login Failed:', err));
}, 2000);
```

---

### Step 4: Check Backend Logs

Check the terminal where the backend server is running:

```
# Look for:
📝 Registration attempt for: [email]
✅ Registration successful: [email]
✅ Login successful: [email]

# Or error messages:
❌ Registration Error: [error message]
```

---

### Step 5: Verify System Status

Run this command in PowerShell to verify all services:

```powershell
# Check Backend Health
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET | ConvertTo-Json

# Check Frontend is Running  
(Invoke-WebRequest -Uri "http://localhost:5175" -TimeoutSec 2).StatusCode

# Check if Ports are Open
netstat -ano | Select-String "5000|5175" | Where-Object { $_ -match "LISTEN" }
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **CORS Error** | Frontend port doesn't match backend config | Check backend `.env` has `CLIENT_URL=http://localhost:5175` |
| **Connection Refused** | Backend not running | Run `npm run dev` in `apps/server` folder |
| **Form Won't Submit** | Missing form inputs | Fill all fields: First Name, Last Name, Email, Password |
| **Error on login** | Account doesn't exist | Use same email that was registered |
| **"User already exists"** | Email already registered | Use different email address |
| **Blank error message** | API didn't respond | Check browser network tab for 500 errors |

---

## What Should Happen

### Registration Flow:
1. ✅ Form validation passes
2. ✅ Click "Create Account"  
3. ✅ Network request sent to `/api/auth/register`
4. ✅ Server responds with user object and access token
5. ✅ Token stored in browser localStorage
6. ✅ Redirected to Dashboard (`/`)

### Login Flow:
1. ✅ Enter email and password
2. ✅ Click "Sign In"
3. ✅ Network request sent to `/api/auth/login`
4. ✅ Server responds with user object and access token
5. ✅ Token stored in browser localStorage
6. ✅ Redirected to Dashboard (`/`)

---

## Still Having Issues?

Please provide:
1. **Error message** shown in browser or console
2. **Network response status code** (check Network tab)
3. **Full error details** from browser console
4. **Backend logs** (copy-paste from server terminal)

This will help diagnose the exact issue.

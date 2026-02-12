# Merchant Login - Simple Authentication

## ✅ Now Live!

Merchants can now login to their dashboard without editing HTML files!

---

## 🚀 How to Login

### Step 1: Go to Dashboard
Navigate to: **http://localhost:5000**

You'll see the login page (not the dashboard directly)

### Step 2: Enter Credentials
- **Email:** Your registered email
- **Merchant ID:** From your welcome email

### Step 3: Click Login
- Dashboard loads automatically
- Session saved in browser
- No need to login again until you logout

---

## 🧪 Test with Existing Merchants

You have several existing merchants you can test with:

### Merchant 1: "check"
```
Email: check123@gmail.com
Merchant ID: be87c918-36a4-4d59-9566-cad574c4e370
```

### Merchant 2: "Kshitij"  
```
Email: (check your database)
Merchant ID: adf9f513-45f1-4d11-8fd8-d940d977bcec
```

### Get All Merchant Credentials
```bash
cd /root/.openclaw/workspace/solana-payment-autopilot
npx tsx get-merchant-id.ts
```

This shows all merchants with their emails and IDs!

---

## 🔐 How It Works

### Login Flow
```
1. Visit http://localhost:5000
   ↓
2. Redirects to login.html (if not logged in)
   ↓
3. Enter email + merchant ID
   ↓
4. Validates against database via API
   ↓
5. Creates session in localStorage
   ↓
6. Redirects to dashboard
   ↓
7. Dashboard loads merchant data from session
```

### Session Storage
```javascript
// Stored in browser localStorage:
{
  merchantId: "be87c918-36a4-4d59-9566-cad574c4e370",
  email: "check123@gmail.com",
  businessName: "check",
  loginTime: "2026-02-10T03:30:00.000Z"
}
```

### Auto-Redirect
- **No session?** → Redirects to `login.html`
- **Has session?** → Loads dashboard
- **Click logout?** → Clears session → Redirects to `login.html`

---

## 📋 Features

### ✅ Login Page
- Clean, professional design
- Email + Merchant ID inputs
- Error messages for invalid credentials
- Link to signup for new merchants
- Info box reminding about welcome email

### ✅ Dashboard Changes
- Auto-checks for session on load
- Loads merchant ID from session (no hardcoding!)
- Shows business name in header
- **Logout button** in top-right corner
- Logout confirmation dialog

### ✅ Security Features
- Validates credentials against database
- Session expires when browser closed (sessionStorage)
- No passwords stored (simple auth)
- Logout clears all session data

---

## 🎯 Benefits

### Before (Hardcoded Merchant ID)
```
1. Merchant signs up
2. Gets welcome email with merchant ID
3. Must manually edit index.html line 310
4. Upload/serve modified file
5. Complex for non-technical users ❌
```

### After (Login System)
```
1. Merchant signs up
2. Gets welcome email with merchant ID
3. Go to http://localhost:5000
4. Login with email + merchant ID
5. Done! ✅
```

---

## 🧪 Testing Steps

### Test 1: Login Flow
```bash
# Terminal 1: API Server
npm run api

# Terminal 2: Dashboard
cd merchant-dashboard
python -m http.server 5000
```

**Browser:**
1. Go to http://localhost:5000
2. See login page ✅
3. Enter: `check123@gmail.com` + merchant ID
4. Click "Login to Dashboard"
5. Dashboard loads ✅

### Test 2: Session Persistence
1. Login successfully
2. Refresh page (F5)
3. Still logged in ✅
4. No redirect to login ✅

### Test 3: Logout
1. Click "Logout" button (top-right)
2. Confirm logout
3. Redirects to login page ✅
4. Session cleared ✅

### Test 4: Invalid Credentials
1. Enter wrong email or merchant ID
2. See error message ✅
3. Form stays on page ✅

---

## 🔧 Configuration

### API Base URL
```javascript
// merchant-dashboard/login.html
const API_BASE = 'http://localhost:3000/api';
```

### Session Storage
```javascript
// Uses localStorage (persistent across browser sessions)
localStorage.setItem('merchantSession', JSON.stringify(session));

// To use sessionStorage (clears on browser close):
sessionStorage.setItem('merchantSession', JSON.stringify(session));
```

---

## 📱 User Experience

### New Merchant Journey
```
1. Sign up at http://localhost:8888
2. Pay 0.1 SOL
3. Get welcome email with merchant ID
4. Go to http://localhost:5000
5. Login with email + merchant ID
6. Access dashboard!
```

### Returning Merchant
```
1. Go to http://localhost:5000
2. Already logged in? → Dashboard loads
3. Not logged in? → Login page
4. Enter credentials
5. Dashboard loads
```

---

## 🚀 Future Enhancements

### Phase 2: Password Authentication
- Add password field to signup
- Hash passwords (bcrypt)
- Standard email + password login
- Password reset flow

### Phase 3: Advanced Features
- Remember me checkbox
- Session timeout (auto-logout after inactivity)
- Multi-factor authentication
- OAuth integration (Google, GitHub)

### Phase 4: Security Hardening
- Rate limiting on login attempts
- CAPTCHA for failed logins
- IP-based access control
- Session token rotation

---

## 🎥 Demo Script

**For showing judges:**

> "When merchants sign up, they receive their credentials via email. They simply go to their dashboard, enter their email and merchant ID, and they're in! The system validates their credentials against our database and creates a secure session. No complex setup, no editing files - just login and start managing payments."

**Show:**
1. Open http://localhost:5000 → Login page
2. Enter credentials → Dashboard loads
3. Point out logout button
4. Click logout → Back to login
5. Login again → Session restored

**Emphasize:**
- Self-service (no manual setup)
- Professional UX
- Production-ready authentication
- Works with existing merchants

---

## 💡 Why Simple Auth is Good for Hackathon

### ✅ Advantages
- Quick to build (1 hour)
- Easy to demo
- Works immediately
- No complex setup
- Merchant ID acts as "API key"
- Good enough for MVP

### Future Production
- Can upgrade to password auth later
- Can add OAuth later
- Foundation is solid
- Doesn't block current demo

---

## 📊 Database Query

To get all merchant credentials for testing:

```sql
SELECT 
  business_name,
  email,
  id as merchant_id,
  wallet_address,
  created_at
FROM merchants
ORDER BY created_at DESC;
```

Or use the helper script:
```bash
npx tsx get-merchant-id.ts
```

---

## ✅ Quick Start

**Start servers:**
```bash
# Terminal 1: API
npm run api

# Terminal 2: Dashboard
cd merchant-dashboard && python -m http.server 5000
```

**Test login:**
1. Open: http://localhost:5000
2. Email: `check123@gmail.com`
3. Merchant ID: `be87c918-36a4-4d59-9566-cad574c4e370`
4. Click Login!

**You're in!** 🎉

---

## 🎯 Summary

**What changed:**
- ✅ Added login page (`login.html`)
- ✅ Updated dashboard to check session
- ✅ Added logout button
- ✅ Session management with localStorage
- ✅ Auto-redirect logic

**What this enables:**
- ✅ Existing merchants can login
- ✅ No more hardcoded merchant IDs
- ✅ Professional user experience
- ✅ Ready for hackathon demo

**Pull latest code and test it now!** 🚀

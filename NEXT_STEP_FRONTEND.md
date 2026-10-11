# Next Step: Deploy Frontend

## ✅ API Status
API is live and working!
```
https://lms-11oct.onrender.com/api/debug
→ {"status":"ok", "users":2, ...}
```

---

## 🚀 Deploy Frontend (5 Minutes)

### Step 1: Create New Static Site Service

In Render Dashboard:
1. Click **"New +"**
2. Select **"Static Site"**
3. Connect GitHub: `athrexai-bit/lms-11oct`

### Step 2: Configure

Fill in these fields:

```
Name:                  lms-11oct-frontend
Branch:                main
Build Command:         echo "Static files ready"
Publish Directory:     .
Plan:                  Free
```

Click **"Create Static Site"**

⏳ Wait 2-3 minutes for deployment

### Step 3: Get Frontend URL

After deployment, you'll see:
```
Available at: https://lms-11oct-frontend.onrender.com
```

---

## 📝 Update JavaScript Files

Now update the API URL in your code. Change these files:

**File 1: `lms.html`**
- Find: `const API_BASE = ...`
- Replace with: `const API_BASE = 'https://lms-11oct.onrender.com';`

**File 2: `lms.js`**
- Find: `const API_BASE = ...`
- Replace with: `const API_BASE = 'https://lms-11oct.onrender.com';`

**File 3: `admin-lms.js`**
- Find: `const API_BASE = ...`
- Replace with: `const API_BASE = 'https://lms-11oct.onrender.com';`

---

## 📤 Push Changes

```bash
git add lms.html lms.js admin-lms.js
git commit -m "Update API URLs to production"
git push origin main
```

Render will auto-redeploy frontend ✅

---

## 🧪 Test It

1. Visit: `https://lms-11oct-frontend.onrender.com`
2. You should see login page
3. Login with:
   - Email: `user@athrexai.com`
   - Password: `user123`
4. Dashboard should load ✅

---

## ✨ Features to Test

- [ ] Login works
- [ ] Dashboard shows courses
- [ ] Discussion forum loads
- [ ] Videos play
- [ ] Admin panel accessible
- [ ] Certificates tab visible
- [ ] No console errors

---

## 📊 Your URLs

After everything is done:

| Service | URL |
|---------|-----|
| API | `https://lms-11oct.onrender.com` |
| Frontend | `https://lms-11oct-frontend.onrender.com` |
| API Debug | `https://lms-11oct.onrender.com/api/debug` |

---

**Ready? Do it step by step!** 🚀

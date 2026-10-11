# Render Deployment Fix - Module Not Found Error

## Issue
```
ModuleNotFoundError: No module named 'app'
```

## Root Cause
Render is using the default start command `gunicorn app:app` instead of the command in our `Procfile`.

## Solution

### For Existing Service (if already created)

1. Go to https://dashboard.render.com
2. Select the `arthrex-lms-api` service
3. Click **Settings**
4. Scroll to **Build & Deploy** section
5. Find **Start Command**
6. **Replace** the current command with:
   ```
   cd api && gunicorn -w 4 -b 0.0.0.0:$PORT index:app --timeout 120
   ```
7. Click **Save Changes**
8. Wait for automatic redeploy

### If Redeploying Fresh

1. Delete the failed service (optional)
2. Create new Web Service
3. Connect GitHub repo
4. Configure as follows:

**Build & Deploy Settings:**
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `cd api && gunicorn -w 4 -b 0.0.0.0:$PORT index:app --timeout 120`
- **Runtime:** Python 3
- **Auto-deploy:** Yes

**Environment Variables:**
```
FLASK_ENV=production
PORT=10000
CORS_ORIGINS=*
```

5. Click **Create Web Service**
6. Wait for deploy (should succeed now)

## Why This Happens

Render has a default start command if none is specified. Our `Procfile` is correct, but Render's dashboard needs to be explicitly told to use it via the **Start Command** field.

## Verification

After fixing, you should see:
1. Build succeeds ✅
2. Service starts (green status) ✅
3. No gunicorn errors ✅
4. API responds: `curl https://arthrex-lms-api.onrender.com/api/debug`

## Quick Reference

| Setting | Value |
|---------|-------|
| Build Command | `pip install -r requirements.txt` |
| Start Command | `cd api && gunicorn -w 4 -b 0.0.0.0:$PORT index:app --timeout 120` |
| Environment | Python 3 |
| Runtime | Free (or Starter) |

---

**After Fix:** Proceed with frontend deployment and testing.

# Quick Fix: Render Deployment Error

## 🔴 Error You Got
```
ModuleNotFoundError: No module named 'app'
```

## ✅ How to Fix (3 Steps)

### Step 1: Go to Render Dashboard
- https://dashboard.render.com
- Click on your `arthrex-lms-api` service

### Step 2: Update Start Command
1. Click **Settings** (or scroll down)
2. Find section: **Build & Deploy**
3. Find field: **Start Command**
4. Replace whatever is there with this exact command:
   ```
   cd api && gunicorn -w 4 -b 0.0.0.0:$PORT index:app --timeout 120
   ```
5. Click **Save Changes**

### Step 3: Wait for Redeploy
- Render will automatically redeploy
- Should take 2-3 minutes
- Check if service goes green ✅

## ⏱️ Expected Outcome

**Before Fix:**
```
❌ ModuleNotFoundError: No module named 'app'
❌ Service status: Red/Crashed
```

**After Fix:**
```
✅ Service deployed successfully
✅ Service status: Green/Running
✅ API responding to requests
```

## 🧪 Test It Works

Once service is green, run this command:

```bash
curl https://arthrex-lms-api.onrender.com/api/debug
```

You should get:
```json
{
  "db": "/var/tmp/arthrex.db",
  "status": "ok",
  "users": 2,
  "enrollments": 0
}
```

If you see that, **deployment is successful!** ✅

## 🆘 Still Not Working?

Check these things:

1. **Environment Variables Set?**
   - `FLASK_ENV=production`
   - `PORT=10000`
   - `CORS_ORIGINS=*`

2. **Start Command Exactly?**
   - `cd api && gunicorn -w 4 -b 0.0.0.0:$PORT index:app --timeout 120`
   - No typos?
   - Copy-paste from this guide!

3. **Service Logs?**
   - Click **Logs** in Render
   - Look for any error messages
   - Share error message if confused

## 📚 Reference

| What | Where |
|------|-------|
| Full Guide | `RENDER_DEPLOYMENT.md` |
| API Docs | `API_DOCUMENTATION.md` |
| Render Docs | https://render.com/docs |

---

**Next Step:** Once API is running, deploy frontend!

# Arthrex LMS - Render Deployment Guide

## Overview
Complete guide to deploy the Arthrex LMS (Frontend + API Backend) to Render.com

## Architecture

```
┌──────────────────────────────┐
│   Render.com Dashboard       │
└──────────────┬───────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────────┐      ┌────▼───────┐
│  Web       │      │  Static    │
│  Service   │      │  Site      │
│  (API)     │      │(Frontend)  │
│ Python     │      │ HTML/CSS/JS│
│ Flask      │      │            │
└───┬────────┘      └────┬───────┘
    │                    │
    │         ┌──────────┘
    │         │
    └─────┬───┘
          │
      ┌───▼──────┐
      │  SQLite  │
      │ Database │
      └──────────┘
```

## Prerequisites
- Render.com account (free tier available)
- GitHub repository with code pushed
- GitHub token for authentication

---

## Step 1: Deploy Backend API Service

### 1.1 Create Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

### 1.2 Configure Service

**Basic Settings:**
- **Name:** `arthrex-lms-api`
- **Environment:** Python 3
- **Region:** Choose closest to your users
- **Branch:** main

**Build & Deploy:**
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `cd api && gunicorn -w 4 -b 0.0.0.0:$PORT index:app --timeout 120`

**Plan:** 
- Free (for testing)
- Or Starter Plan ($7/month for production)

### 1.3 Add Environment Variables

In the service settings, add:

```
FLASK_ENV=production
PORT=10000
CORS_ORIGINS=*
```

### 1.4 Deploy

Click **"Create Web Service"**

⏳ Wait 3-5 minutes for deployment

✅ Once deployed, note your API URL:
```
https://arthrex-lms-api.onrender.com
```

Test it:
```bash
curl https://arthrex-lms-api.onrender.com/api/debug
```

---

## Step 2: Deploy Frontend Static Site

### 2.1 Create Static Site

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository (same repo)

### 2.2 Configure

**Settings:**
- **Name:** `arthrex-lms-frontend`
- **Branch:** main
- **Build Command:** `echo "Static files ready"`
- **Publish Directory:** `.` (root directory)

### 2.3 Deploy

Click **"Create Static Site"**

⏳ Wait 2-3 minutes

✅ Note your Frontend URL:
```
https://arthrex-lms-frontend.onrender.com
```

---

## Step 3: Configure API URLs in Frontend

The frontend needs to know the API URL. Update these files:

### 3.1 Update `lms.html`

Find this line:
```javascript
const API_BASE = 'http://127.0.0.1:5001';
```

Change to:
```javascript
const API_BASE = 'https://arthrex-lms-api.onrender.com';
```

### 3.2 Update `lms.js`

Same change at the top:
```javascript
const API_BASE = 'https://arthrex-lms-api.onrender.com';
```

### 3.3 Update `admin-lms.js`

Same change:
```javascript
const API_BASE = 'https://arthrex-lms-api.onrender.com';
```

### 3.4 Commit and Push

```bash
git add lms.html lms.js admin-lms.js
git commit -m "Update API URLs for production deployment"
git push origin main
```

Render will auto-redeploy the frontend with new URLs ✅

---

## Step 4: Test Everything

### 4.1 Test API

```bash
curl https://arthrex-lms-api.onrender.com/api/debug
```

Should return:
```json
{
  "db": "/var/tmp/arthrex.db",
  "enrollments": 0,
  "status": "ok",
  "users": 2
}
```

### 4.2 Test Frontend

Visit: `https://arthrex-lms-frontend.onrender.com`

Should see:
- ✅ Arthrexai logo
- ✅ Login form
- ✅ Course cards loading

### 4.3 Test Login

Use demo credentials:
```
Email: user@athrexai.com
Password: user123
```

Should show:
- ✅ Student dashboard
- ✅ Enrolled courses
- ✅ Discussion forum
- ✅ Certificates tab

### 4.4 Test Features

- 💬 Post in discussion forum
- 📚 Browse courses
- 🏆 Complete course to get certificate
- ▶️ Play lesson videos
- 📝 Submit assignments

---

## Step 5: Enable Auto-Deploy (Optional)

For automatic redeployment on code changes:

1. Go to API service settings
2. Enable **"Auto-Deploy"** from main branch
3. Go to Frontend service settings
4. Enable **"Auto-Deploy"** from main branch

Now every `git push origin main` triggers automatic redeployment ✅

---

## Production Checklist

- [ ] API service deployed and responding
- [ ] Frontend loads without errors
- [ ] Login works with demo credentials
- [ ] Discussion forum functional
- [ ] Certificates generate on course completion
- [ ] Videos play (YouTube/Vimeo/MP4)
- [ ] Admin panel accessible
- [ ] Database persisting data
- [ ] Auto-deploy enabled
- [ ] SSL certificate enabled (automatic)

---

## Free Tier Limitations

⚠️ Important to know:

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Monthly Hours | 750 hours | Unlimited |
| Data Retention | Lost after 24h inactivity | Persistent |
| Cold Starts | 5-10 seconds | Instant |
| RAM | 512MB | 1GB+ |
| Auto-Sleep | Yes | No |
| Cost | $0/month | $7-25+/month |

**Recommendation for Production:**
- Upgrade to Starter Plan ($7/month)
- Use PostgreSQL instead of SQLite
- Enable monitoring and backups

---

## Upgrade to PostgreSQL

For production with persistent data:

### Option 1: Use Render PostgreSQL

1. In Render Dashboard: **"New +"** → **"PostgreSQL"**
2. Configure and note connection string
3. Update API environment variable: `DATABASE_URL=postgres://...`
4. Redeploy API

### Option 2: Use External Database

- Supabase (PostgreSQL in the cloud)
- AWS RDS
- Digital Ocean Database

---

## Troubleshooting

### API won't start

Check logs in Render dashboard:

1. Go to API service
2. Click **"Logs"**
3. Look for error messages
4. Common issues:
   - Missing dependencies in `requirements.txt`
   - Wrong `Start Command`
   - Python version mismatch

### Frontend shows blank page

1. Check browser console (F12)
2. Look for 404 errors
3. Verify API URL is correct in JavaScript
4. Check Render static site logs

### CORS errors in console

1. Update API environment variable:
   ```
   CORS_ORIGINS=https://arthrex-lms-frontend.onrender.com
   ```
2. Redeploy API
3. Clear browser cache

### Database errors

- Free tier SQLite is not persistent
- Data lost after 24h inactivity
- Upgrade to PostgreSQL for production

---

## URLs After Deployment

| Service | URL |
|---------|-----|
| Frontend (Main) | `https://arthrex-lms-frontend.onrender.com` |
| LMS Dashboard | `https://arthrex-lms-frontend.onrender.com/lms.html` |
| Admin Panel | `https://arthrex-lms-frontend.onrender.com/admin-lms.html` |
| Certificates | `https://arthrex-lms-frontend.onrender.com/certificate.html` |
| API Base | `https://arthrex-lms-api.onrender.com` |
| API Debug | `https://arthrex-lms-api.onrender.com/api/debug` |

---

## Monitoring

In Render Dashboard:

1. **Service Metrics:**
   - CPU usage
   - Memory usage
   - Request count
   - Response times

2. **View Logs:**
   - Build logs
   - Deploy logs
   - Runtime logs

3. **Set Alerts (Paid plan):**
   - High CPU usage
   - Service crashes
   - Build failures

---

## Maintenance

### Weekly
- Check API logs for errors
- Verify database size
- Monitor deployment status

### Monthly
- Review performance metrics
- Check failed requests
- Update dependencies

### Quarterly
- Backup database
- Review security settings
- Plan upgrades if needed

---

## Support & Documentation

- **Render Docs:** https://render.com/docs
- **GitHub Issues:** Report bugs in repository
- **API Docs:** See `API_DOCUMENTATION.md`

---

## Deployment History

| Date | Action | Status |
|------|--------|--------|
| Oct 11, 2026 | Initial deployment | ✅ Live |
| | | |

---

**Status:** ✅ Production Ready  
**Last Updated:** October 11, 2026  
**Version:** 1.0.0


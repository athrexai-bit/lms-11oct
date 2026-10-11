# Arthrex LMS - Render Deployment Guide

## Overview
This guide explains how to deploy the Arthrex LMS to Render.com for production hosting.

## Prerequisites
- Render.com account (https://render.com)
- GitHub repository pushed with latest code
- Git token for authentication

## Deployment Steps

### Step 1: Create API Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `athrexai-bit/lms-11oct`
4. Configure the service:
   - **Name:** `arthrex-lms-api`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `cd api && gunicorn -w 4 -b 0.0.0.0:$PORT index:app`
   - **Plan:** Free (or Starter for production)

5. Add Environment Variables:
   ```
   FLASK_ENV=production
   PORT=10000
   CORS_ORIGINS=*
   ```

6. Click **"Create Web Service"**
7. Wait for deployment to complete (3-5 minutes)
8. Note the API URL: `https://arthrex-lms-api.onrender.com`

### Step 2: Create Static Site for Frontend on Render

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository again
3. Configure:
   - **Name:** `arthrex-lms-frontend`
   - **Build Command:** `echo "Static files ready"`
   - **Publish Directory:** `.` (current directory)
   - **Plan:** Free

4. Add Redirects for SPA (in render.yaml or settings):
   ```yaml
   routes:
     - path: /
       destination: /index.html
     - path: /lms.html
       destination: /lms.html
     - path: /admin-lms.html
       destination: /admin-lms.html
     - path: /certificate.html
       destination: /certificate.html
   ```

5. Click **"Create Static Site"**
6. Note the Frontend URL: `https://arthrex-lms-frontend.onrender.com`

### Step 3: Update Frontend Configuration

Update the frontend API endpoints to use the Render API URL:

**In lms.html and lms.js:**
```javascript
const API_BASE = 'https://arthrex-lms-api.onrender.com';
```

**In admin-lms.js:**
```javascript
const API_BASE = 'https://arthrex-lms-api.onrender.com';
```

### Step 4: Test the Deployment

1. **Test API:**
   ```bash
   curl https://arthrex-lms-api.onrender.com/api/debug
   ```
   Expected response:
   ```json
   {
     "db": "/var/tmp/arthrex.db",
     "enrollments": 0,
     "status": "ok",
     "users": 2
   }
   ```

2. **Test Frontend:**
   - Visit: `https://arthrex-lms-frontend.onrender.com`
   - Should see login screen

3. **Test Login:**
   - Email: `user@athrexai.com`
   - Password: `user123`

4. **Test Features:**
   - ✅ Browse courses
   - ✅ View discussion forum
   - ✅ Submit assignments
   - ✅ Take quizzes
   - ✅ Generate certificates

### Step 5: Enable Auto-Deploy

1. Go to your Render service settings
2. Enable **"Auto-Deploy"** from the main branch
3. Now every time you push to GitHub, Render will automatically redeploy

## Database Persistence

**Important:** Free tier Render services reset the database on each deployment. For production:

1. Upgrade to **Paid Plan** or
2. Use **Render PostgreSQL** database
3. Update `DATABASE_URL` environment variable

For now, data will be preserved during uptime but lost on redeploys (every 24 hours on free tier).

## Environment Variables

Add these to your Render service:

```
FLASK_ENV=production
CORS_ORIGINS=https://arthrex-lms-frontend.onrender.com
PORT=10000
ADMIN_EMAIL=admin@athrexai.com
ADMIN_PASSWORD=admin123
```

## Troubleshooting

### Service won't start
- Check build logs in Render dashboard
- Verify `Procfile` is in root directory
- Ensure `requirements.txt` has all dependencies

### CORS errors in console
- Update `CORS_ORIGINS` environment variable
- Include the frontend domain

### Database issues
- Check `/var/tmp/arthrex.db` exists
- Free tier doesn't persist data between deploys
- Switch to PostgreSQL for production

### API not responding
- Check service logs in Render dashboard
- Verify PORT environment variable is set to 10000

## Production Checklist

- [ ] API deployed and responding
- [ ] Frontend loads without errors
- [ ] Login works with demo credentials
- [ ] Discussion forum functional
- [ ] Certificates generate on course completion
- [ ] Custom domain configured (optional)
- [ ] SSL certificate auto-enabled
- [ ] Monitoring alerts set up (optional)
- [ ] Regular backups configured (if not free tier)

## URLs After Deployment

- **Frontend:** `https://arthrex-lms-frontend.onrender.com`
- **API:** `https://arthrex-lms-api.onrender.com/api/debug`
- **LMS:** `https://arthrex-lms-frontend.onrender.com/lms.html`
- **Admin:** `https://arthrex-lms-frontend.onrender.com/admin-lms.html`

## Support

For issues, check:
1. Render dashboard logs
2. Browser console errors
3. Network tab for API requests
4. GitHub deployment status

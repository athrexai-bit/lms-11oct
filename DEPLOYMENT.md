# Arthrex LMS - Deployment Instructions

## Quick Start for Render

### 1. One-Click Deployment (Recommended)

Use the Render Deploy Button (coming soon):

```
[Deploy to Render Button]
```

### 2. Manual Deployment

#### Prerequisites
- GitHub account
- Render account (free tier available)
- Git installed locally

#### Steps

**A. Push code to GitHub**
```bash
git push origin main
```

**B. Deploy API Service**
1. Visit: https://dashboard.render.com
2. New → Web Service
3. Select your GitHub repository
4. Configuration:
   ```
   Build Command: pip install -r requirements.txt
   Start Command: cd api && gunicorn -w 4 -b 0.0.0.0:$PORT index:app
   Environment: Python 3
   ```
5. Deploy

**C. Deploy Frontend**
1. New → Static Site
2. Select your GitHub repository
3. Configuration:
   ```
   Build Command: echo "Static files ready"
   Publish Directory: .
   ```
4. Deploy

**D. Update API URLs**
After deployment, update these files with your Render URLs:
- `lms.html` - Update API_BASE URL
- `lms.js` - Update API_BASE URL
- `admin-lms.js` - Update API_BASE URL

## Features Deployed

✅ **Certificate Generation**
- Auto-generates certificates on 100% course completion
- Beautiful certificate design with verification links
- Certificate gallery in student dashboard

✅ **Video Player Integration**
- YouTube, Vimeo, and MP4 support
- Auto-saves watch progress
- Timestamped bookmarks
- Resume watching from where you left off

✅ **Discussion Forum**
- Q&A threads per course
- Upvote/downvote system
- Mark answers as accepted
- Stack Overflow-style interface

✅ **Course Management**
- Admin panel for creating courses
- Dynamic module/topic management
- Assignment, quiz, and project creation
- Rich lesson content

✅ **Student Features**
- Student dashboard with enrolled courses
- Progress tracking
- Certificate earning
- Discussion participation
- Quiz taking
- Assignment submission

## Test Accounts

```
Student:
- Email: user@athrexai.com
- Password: user123

Admin:
- Email: admin@athrexai.com
- Password: admin123
```

## Local Development

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Start API (port 5001)
cd api && python3 index.py

# In another terminal, start frontend (port 8080)
python3 -m http.server 8080

# Access at: http://localhost:8080
```

### API Endpoints

```
GET  /api/debug                    - Check API status
POST /api/auth/login              - User login
POST /api/auth/signup             - User registration

GET  /api/lms                     - Get all courses
PUT  /api/lms/<course_id>         - Save course
GET  /api/discussion/threads      - Get discussion threads
POST /api/discussion/threads      - Create thread
POST /api/discussion/replies      - Add reply

GET  /api/certificates           - Get user certificates
POST /api/certificates           - Create certificate
```

## Render Free Tier Limitations

⚠️ Important:
- 50 hours/month compute time
- Database resets every 24 hours of inactivity
- Cold starts (5-10 second delays)
- Limited to 512MB RAM

## Upgrade to Production

For production use, consider:

1. **Paid Render Plan**
   - Always-on services
   - Persistent databases
   - Better performance

2. **PostgreSQL Database**
   - Replace SQLite
   - Better for scaling
   - Persistent data

3. **Custom Domain**
   - Add your own domain
   - SSL included

4. **CDN**
   - Faster static file delivery
   - Global availability

## Architecture

```
┌─────────────────────────┐
│   Render Dashboard      │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼──────┐   ┌────▼──────┐
│   API    │   │ Frontend   │
│ (Flask)  │   │ (Static)   │
└───┬──────┘   └────┬───────┘
    │                │
    └────┬───────────┘
         │
    ┌────▼──────┐
    │  SQLite   │
    │ Database  │
    └───────────┘
```

## Monitoring

Track deployment status in Render dashboard:
- Service health
- CPU/Memory usage
- Build logs
- Deploy logs

## Support

For issues:
1. Check Render dashboard logs
2. Review API response in browser console
3. Verify environment variables
4. Check CORS settings

## Next Steps

1. ✅ Deploy to Render
2. ✅ Test all features
3. ✅ Add custom domain
4. ✅ Set up monitoring
5. ✅ Upgrade to paid plan for production

---

**Current Status:** Ready for deployment  
**Last Updated:** October 11, 2026  
**Version:** 1.0.0

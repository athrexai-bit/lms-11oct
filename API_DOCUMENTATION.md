# Arthrex LMS - Backend API Documentation

## Base URL
- **Development:** `http://127.0.0.1:5001`
- **Production:** `https://arthrex-lms-api.onrender.com`

---

## Authentication Endpoints

### Login
**POST** `/api/auth/login`

Request:
```json
{
  "email": "user@athrexai.com",
  "password": "user123"
}
```

Response:
```json
{
  "success": true,
  "name": "User",
  "email": "user@athrexai.com",
  "role": "user"
}
```

### Signup
**POST** `/api/auth/signup`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "country": "India",
  "phone": "+91-9876543210"
}
```

Response:
```json
{
  "success": true,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

---

## User Management (Admin)

### Get All Signups
**GET** `/api/signups`

Response:
```json
[
  {
    "id": 1,
    "name": "User",
    "email": "user@athrexai.com",
    "role": "user",
    "country": "India",
    "phone": "+91-9876543210",
    "created_at": "08 Oct 2026 15:00"
  }
]
```

### Delete User Signup
**DELETE** `/api/signups/<user_id>`

Response:
```json
{
  "success": true
}
```

---

## Enrollment Management

### Get Enrollments
**GET** `/api/enrollments?email=user@athrexai.com`

Response:
```json
[
  {
    "id": 1,
    "name": "User",
    "email": "user@athrexai.com",
    "phone": "+91-9876543210",
    "course": "Agentic AI Professional",
    "course_id": "agentic-ai-pro",
    "status": "approved",
    "utr": "123456789012",
    "payment_method": "UPI",
    "date": "08 Oct 2026 15:00"
  }
]
```

### Create Enrollment
**POST** `/api/enrollments`

Request:
```json
{
  "name": "User",
  "email": "user@athrexai.com",
  "phone": "+91-9876543210",
  "course": "Agentic AI Professional",
  "courseId": "agentic-ai-pro",
  "status": "pending",
  "utr": "123456789012",
  "paymentMethod": "UPI"
}
```

Response:
```json
{
  "success": true,
  "enrollment": { ... }
}
```

### Update Enrollment Status
**PATCH** `/api/enrollments/<enrollment_id>`

Request:
```json
{
  "status": "approved"
}
```

Valid statuses: `pending`, `approved`, `rejected`, `pending_utr`

### Delete Enrollment
**DELETE** `/api/enrollments/<enrollment_id>`

Response:
```json
{
  "success": true
}
```

---

## LMS Course Management

### Get All Courses
**GET** `/api/lms`

Response:
```json
{
  "course_id_1": {
    "name": "Agentic AI Professional",
    "category": "agentic",
    "duration": "4 months",
    "topics": [...],
    "assignments": [...],
    "quizzes": [...],
    "projects": [...],
    "resources": [...]
  }
}
```

### Save/Update Course
**PUT** `/api/lms/<course_id>`

Request:
```json
{
  "name": "Agentic AI Professional",
  "category": "agentic",
  "duration": "4 months",
  "topics": [
    {
      "id": "topic_1",
      "title": "Module 1: Foundations",
      "order": 1,
      "lessons": [...]
    }
  ],
  "assignments": [],
  "quizzes": [],
  "projects": [],
  "resources": []
}
```

Response:
```json
{
  "success": true
}
```

### Delete Course
**DELETE** `/api/lms/<course_id>`

Response:
```json
{
  "success": true
}
```

---

## Certificate Management

### Create Certificate
**POST** `/api/certificates`

Request:
```json
{
  "email": "user@athrexai.com",
  "name": "User",
  "courseId": "agentic-ai-pro",
  "courseName": "Agentic AI Professional",
  "instructor": "Dr. Priya Sharma"
}
```

Response:
```json
{
  "success": true,
  "certificate": {
    "id": "uuid",
    "certificate_id": "ATH-ABC123DEF456",
    "user_email": "user@athrexai.com",
    "user_name": "User",
    "course_id": "agentic-ai-pro",
    "course_name": "Agentic AI Professional",
    "instructor": "Dr. Priya Sharma",
    "issued_at": "08 Oct 2026 15:00"
  }
}
```

### Get User Certificates
**GET** `/api/certificates?email=user@athrexai.com`

Response:
```json
[
  {
    "certificate_id": "ATH-ABC123DEF456",
    "user_name": "User",
    "course_name": "Agentic AI Professional",
    "issued_at": "08 Oct 2026 15:00"
  }
]
```

### Get Specific Certificate
**GET** `/api/certificates/<certificate_id>`

Response:
```json
{
  "certificate_id": "ATH-ABC123DEF456",
  "user_name": "User",
  "course_name": "Agentic AI Professional",
  "issued_at": "08 Oct 2026 15:00"
}
```

### Verify Certificate (Public)
**GET** `/api/certificates/verify/<certificate_id>`

Response:
```json
{
  "valid": true,
  "certificate": {
    "certificate_id": "ATH-ABC123DEF456",
    "user_name": "User",
    "course_name": "Agentic AI Professional",
    "issued_at": "08 Oct 2026 15:00"
  }
}
```

---

## Discussion Forum

### Get Discussion Threads
**GET** `/api/discussion/threads?course_id=agentic-ai-pro&lesson_id=optional`

Response:
```json
[
  {
    "id": 1,
    "course_id": "agentic-ai-pro",
    "user_email": "user@athrexai.com",
    "user_name": "User",
    "title": "How do I get started?",
    "content": "I am new to this course...",
    "votes": 2,
    "is_answered": 0,
    "created_at": "08 Oct 2026 15:00"
  }
]
```

### Create Discussion Thread
**POST** `/api/discussion/threads`

Request:
```json
{
  "course_id": "agentic-ai-pro",
  "lesson_id": "optional",
  "user_email": "user@athrexai.com",
  "user_name": "User",
  "title": "How do I get started?",
  "content": "I am new to this course..."
}
```

### Get Thread with Replies
**GET** `/api/discussion/threads/<thread_id>`

Response:
```json
{
  "id": 1,
  "title": "How do I get started?",
  "content": "...",
  "replies": [
    {
      "id": 1,
      "thread_id": 1,
      "user_name": "Mentor",
      "content": "Here's how to get started...",
      "votes": 5,
      "is_answer": 1,
      "created_at": "08 Oct 2026 15:30"
    }
  ]
}
```

### Add Reply to Thread
**POST** `/api/discussion/replies`

Request:
```json
{
  "thread_id": 1,
  "user_email": "user@athrexai.com",
  "user_name": "User",
  "content": "Thanks for the help!"
}
```

### Vote on Thread/Reply
**POST** `/api/discussion/vote`

Request:
```json
{
  "item_type": "thread",  // or "reply"
  "item_id": 1,
  "user_email": "user@athrexai.com",
  "vote_type": 1  // 1 for upvote, -1 for downvote
}
```

### Mark Reply as Accepted Answer
**POST** `/api/discussion/answer`

Request:
```json
{
  "thread_id": 1,
  "reply_id": 1
}
```

---

## Utility Endpoints

### Health Check
**GET** `/api/debug`

Response:
```json
{
  "db": "/path/to/arthrex.db",
  "users": 2,
  "enrollments": 0,
  "status": "ok"
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  country TEXT,
  phone TEXT,
  created_at TEXT
)
```

### Enrollments Table
```sql
CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  phone TEXT,
  course TEXT,
  course_id TEXT,
  status TEXT DEFAULT 'pending',
  utr TEXT,
  payment_method TEXT,
  date TEXT
)
```

### Certificates Table
```sql
CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  instructor TEXT,
  issued_at TEXT NOT NULL,
  certificate_id TEXT UNIQUE
)
```

### Discussion Threads Table
```sql
CREATE TABLE discussion_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL,
  lesson_id TEXT,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  is_answered INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
)
```

### Discussion Replies Table
```sql
CREATE TABLE discussion_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  is_answer INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
)
```

---

## Error Responses

### Invalid Request
```json
{
  "error": "Invalid email or password"
}
```
Status: 401

### Not Found
```json
{
  "error": "Enrollment not found"
}
```
Status: 404

### Server Error
```json
{
  "error": "Internal server error"
}
```
Status: 500

---

## Rate Limiting

- No rate limiting on free tier
- Recommended: Max 100 requests/minute per IP for production

---

## CORS

- Allowed Origins: `*` (configurable via `CORS_ORIGINS` env var)
- Allowed Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Allowed Headers: `Content-Type, Authorization`

---

## Testing

### Using cURL
```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@athrexai.com","password":"user123"}'

# Get certificates
curl http://localhost:5001/api/certificates?email=user@athrexai.com
```

### Using Postman
1. Import the collection from API documentation
2. Set environment variable: `BASE_URL=http://localhost:5001`
3. Test each endpoint

---

## Deployment Notes

- Database: SQLite (file-based, not persistent on Render free tier)
- For production, migrate to PostgreSQL
- API responses are JSON-only
- All timestamps in format: `DD MMM YYYY HH:MM`

---

**Last Updated:** October 11, 2026  
**API Version:** 1.0.0  
**Status:** Production Ready

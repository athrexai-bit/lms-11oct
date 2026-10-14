"""
Athrexai — Flask API with SQLite
Database: arthrex.db (auto-created in api/ folder)
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, json, os
from datetime import datetime
import uuid
import hashlib
from dotenv import load_dotenv
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))

# Database path
DB_PATH = os.getenv('DATABASE_URL', os.path.join(os.path.dirname(__file__), 'arthrex.db'))
if DB_PATH.startswith('sqlite:///'):
    DB_PATH = DB_PATH.replace('sqlite:///', '')

# ── DB init ───────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT NOT NULL,
            email   TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role    TEXT NOT NULL DEFAULT 'user',
            country TEXT DEFAULT '',
            phone   TEXT DEFAULT '',
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS enrollments (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            name      TEXT,
            email     TEXT,
            phone     TEXT,
            course    TEXT,
            course_id TEXT,
            status    TEXT DEFAULT 'pending',
            utr       TEXT DEFAULT '',
            payment_method TEXT DEFAULT '',
            date      TEXT
        );

        CREATE TABLE IF NOT EXISTS masterclasses (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT,
            instructor TEXT,
            date       TEXT,
            time       TEXT,
            link       TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS liveclasses (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT,
            instructor TEXT,
            date       TEXT,
            time       TEXT,
            link       TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS lms (
            course_id TEXT PRIMARY KEY,
            data      TEXT
        );

        CREATE TABLE IF NOT EXISTS certificates (
            id           TEXT PRIMARY KEY,
            user_email   TEXT NOT NULL,
            user_name    TEXT NOT NULL,
            course_id    TEXT NOT NULL,
            course_name  TEXT NOT NULL,
            instructor   TEXT,
            issued_at    TEXT NOT NULL,
            certificate_id TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS discussion_threads (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id    TEXT NOT NULL,
            lesson_id    TEXT,
            user_email   TEXT NOT NULL,
            user_name    TEXT NOT NULL,
            title        TEXT NOT NULL,
            content      TEXT NOT NULL,
            votes        INTEGER DEFAULT 0,
            is_answered  INTEGER DEFAULT 0,
            created_at   TEXT NOT NULL,
            updated_at   TEXT
        );

        CREATE TABLE IF NOT EXISTS discussion_replies (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id    INTEGER NOT NULL,
            user_email   TEXT NOT NULL,
            user_name    TEXT NOT NULL,
            content      TEXT NOT NULL,
            votes        INTEGER DEFAULT 0,
            is_answer    INTEGER DEFAULT 0,
            created_at   TEXT NOT NULL,
            FOREIGN KEY (thread_id) REFERENCES discussion_threads(id)
        );

        CREATE TABLE IF NOT EXISTS discussion_votes (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            item_type    TEXT NOT NULL,
            item_id      INTEGER NOT NULL,
            user_email   TEXT NOT NULL,
            vote_type    INTEGER NOT NULL,
            UNIQUE(item_type, item_id, user_email)
        );

        CREATE TABLE IF NOT EXISTS progress (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            student_email TEXT NOT NULL,
            course_id     TEXT NOT NULL,
            lesson_id     TEXT NOT NULL,
            percentage    INTEGER DEFAULT 0,
            updated_at    TEXT,
            UNIQUE(student_email, course_id, lesson_id)
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id   TEXT NOT NULL,
            type      TEXT DEFAULT 'general',
            message   TEXT NOT NULL,
            data      TEXT DEFAULT '{}',
            read      INTEGER DEFAULT 0,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            student_email TEXT NOT NULL,
            session_id    TEXT NOT NULL,
            course_id     TEXT DEFAULT '',
            status        TEXT DEFAULT 'present',
            marked_at     TEXT,
            UNIQUE(student_email, session_id)
        );

        CREATE TABLE IF NOT EXISTS grades (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            student_email TEXT NOT NULL,
            course_id     TEXT DEFAULT '',
            assignment_id TEXT NOT NULL,
            grade         INTEGER DEFAULT 0,
            feedback      TEXT DEFAULT '',
            graded_at     TEXT,
            UNIQUE(student_email, assignment_id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_email    TEXT NOT NULL,
            receiver_email  TEXT NOT NULL,
            subject         TEXT NOT NULL,
            content         TEXT NOT NULL,
            read            INTEGER DEFAULT 0,
            created_at      TEXT
        );

        CREATE TABLE IF NOT EXISTS videos (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id     TEXT NOT NULL,
            lesson_id     TEXT,
            title         TEXT NOT NULL,
            description   TEXT DEFAULT '',
            file_path     TEXT NOT NULL,
            file_type     TEXT DEFAULT 'video/mp4',
            file_size     INTEGER,
            duration      INTEGER DEFAULT 0,
            views         INTEGER DEFAULT 0,
            storage_type  TEXT DEFAULT 'local',
            url           TEXT DEFAULT '',
            uploaded_at   TEXT
        );

        CREATE TABLE IF NOT EXISTS payments (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id    TEXT UNIQUE,
            email         TEXT DEFAULT '',
            course_id     TEXT NOT NULL,
            amount        REAL NOT NULL,
            currency      TEXT DEFAULT 'USD',
            status        TEXT DEFAULT 'pending',
            transaction_id TEXT DEFAULT '',
            created_at    TEXT
        );

        CREATE TABLE IF NOT EXISTS two_factor (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            email    TEXT UNIQUE NOT NULL,
            secret   TEXT NOT NULL,
            enabled  INTEGER DEFAULT 0,
            backup_codes TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS calendar_events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id   TEXT NOT NULL,
            title       TEXT NOT NULL,
            start_date  TEXT NOT NULL,
            end_date    TEXT NOT NULL,
            description TEXT DEFAULT '',
            created_at  TEXT
        );
    ''')
    # Seed default users if empty
    c.execute('SELECT COUNT(*) FROM users')
    if c.fetchone()[0] == 0:
        c.executemany(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (?,?,?,?,?)',
            [
                ('Admin', 'admin@athrexai.com', 'admin123', 'admin', now()),
                ('User',  'user@athrexai.com',  'user123',  'user',  now()),
            ]
        )
    conn.commit()
    conn.close()

def now():
    return datetime.now().strftime('%d %b %Y %H:%M')

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json or {}
    email    = d.get('email', '').strip().lower()
    password = d.get('password', '')
    conn = get_db()
    user = row_to_dict(conn.execute(
        'SELECT * FROM users WHERE email=? AND password=?', (email, password)
    ).fetchone())
    conn.close()
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    return jsonify({'success': True, 'name': user['name'], 'email': user['email'], 'role': user['role']})

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    d = request.json or {}
    name     = d.get('name', '').strip()
    email    = d.get('email', '').strip().lower()
    password = d.get('password', '')
    country  = d.get('country', '')
    phone    = d.get('phone', '')
    if not name or not email or not password:
        return jsonify({'error': 'All fields required'}), 400
    conn = get_db()
    existing = conn.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Email already registered'}), 409
    conn.execute(
        'INSERT INTO users (name,email,password,role,country,phone,created_at) VALUES (?,?,?,?,?,?,?)',
        (name, email, password, 'user', country, phone, now())
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'name': name, 'email': email, 'role': 'user'})

# ── SIGNUPS (admin) ───────────────────────────────────────────────────────────
@app.route('/api/signups', methods=['GET'])
def get_signups():
    conn = get_db()
    rows = rows_to_list(conn.execute(
        "SELECT id,name,email,role,country,phone,created_at FROM users WHERE role='user'"
    ).fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/signups/<int:uid>', methods=['DELETE'])
def delete_signup(uid):
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=? AND role='user'", (uid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── ENROLLMENTS ───────────────────────────────────────────────────────────────
@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    email = (request.args.get('email') or '').strip().lower()
    conn = get_db()
    if email:
        rows = rows_to_list(conn.execute(
            'SELECT * FROM enrollments WHERE LOWER(email)=?', (email,)
        ).fetchall())
    else:
        rows = rows_to_list(conn.execute('SELECT * FROM enrollments').fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/enrollments', methods=['POST'])
def add_enrollment():
    d = request.json or {}
    email     = (d.get('email') or '').strip()
    course_id = str(d.get('courseId') or d.get('course_id') or '')
    status    = d.get('status', 'pending')
    utr       = d.get('utr', '')
    payment   = d.get('paymentMethod', '')

    conn = get_db()
    # Check duplicate
    if email and course_id:
        existing = conn.execute(
            "SELECT * FROM enrollments WHERE LOWER(email)=? AND course_id=? AND status IN ('pending','approved','pending_utr')",
            (email.lower(), course_id)
        ).fetchone()
        if existing:
            conn.close()
            return jsonify({'success': True, 'enrollment': row_to_dict(existing), 'duplicate': True})

    conn.execute(
        'INSERT INTO enrollments (name,email,phone,course,course_id,status,utr,payment_method,date) VALUES (?,?,?,?,?,?,?,?,?)',
        (d.get('name',''), email, d.get('phone',''), d.get('course',''), course_id, status, utr, payment, now())
    )
    conn.commit()
    eid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    row = row_to_dict(conn.execute('SELECT * FROM enrollments WHERE id=?', (eid,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'enrollment': row})

@app.route('/api/enrollments/<int:eid>', methods=['PATCH'])
def update_enrollment(eid):
    d = request.json or {}
    status = (d.get('status') or '').strip().lower()
    if status not in ('pending', 'approved', 'rejected', 'pending_utr'):
        return jsonify({'error': 'Invalid status'}), 400
    conn = get_db()
    conn.execute('UPDATE enrollments SET status=? WHERE id=?', (status, eid))
    conn.commit()
    row = row_to_dict(conn.execute('SELECT * FROM enrollments WHERE id=?', (eid,)).fetchone())
    conn.close()
    if not row:
        return jsonify({'error': 'Enrollment not found'}), 404
    return jsonify({'success': True, 'enrollment': row})

@app.route('/api/enrollments/<int:eid>', methods=['DELETE'])
def delete_enrollment(eid):
    conn = get_db()
    conn.execute('DELETE FROM enrollments WHERE id=?', (eid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── MASTERCLASSES ─────────────────────────────────────────────────────────────
@app.route('/api/masterclasses', methods=['GET'])
def get_masterclasses():
    conn = get_db()
    rows = rows_to_list(conn.execute('SELECT * FROM masterclasses').fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/masterclasses', methods=['POST'])
def add_masterclass():
    d = request.json or {}
    conn = get_db()
    conn.execute(
        'INSERT INTO masterclasses (title,instructor,date,time,link,created_at) VALUES (?,?,?,?,?,?)',
        (d.get('title',''), d.get('instructor',''), d.get('date',''), d.get('time',''), d.get('link',''), now())
    )
    conn.commit()
    mid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    conn.close()
    return jsonify({'success': True, 'id': mid})

@app.route('/api/masterclasses/<int:mid>', methods=['DELETE'])
def delete_masterclass(mid):
    conn = get_db()
    conn.execute('DELETE FROM masterclasses WHERE id=?', (mid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── LIVE CLASSES ──────────────────────────────────────────────────────────────
@app.route('/api/liveclasses', methods=['GET'])
def get_liveclasses():
    conn = get_db()
    rows = rows_to_list(conn.execute('SELECT * FROM liveclasses').fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/liveclasses', methods=['POST'])
def add_liveclass():
    d = request.json or {}
    conn = get_db()
    conn.execute(
        'INSERT INTO liveclasses (title,instructor,date,time,link,created_at) VALUES (?,?,?,?,?,?)',
        (d.get('title',''), d.get('instructor',''), d.get('date',''), d.get('time',''), d.get('link',''), now())
    )
    conn.commit()
    lid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    conn.close()
    return jsonify({'success': True, 'id': lid})

@app.route('/api/liveclasses/<int:lid>', methods=['DELETE'])
def delete_liveclass(lid):
    conn = get_db()
    conn.execute('DELETE FROM liveclasses WHERE id=?', (lid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── LMS ───────────────────────────────────────────────────────────────────────
@app.route('/api/lms', methods=['GET'])
def get_lms():
    conn = get_db()
    rows = conn.execute('SELECT course_id, data FROM lms').fetchall()
    conn.close()
    result = {}
    for r in rows:
        try:
            result[r['course_id']] = json.loads(r['data'])
        except:
            pass
    return jsonify(result)

@app.route('/api/lms/<course_id>', methods=['PUT'])
def save_lms(course_id):
    data = request.json or {}
    conn = get_db()
    conn.execute(
        'INSERT INTO lms (course_id, data) VALUES (?,?) ON CONFLICT(course_id) DO UPDATE SET data=excluded.data',
        (course_id, json.dumps(data))
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/lms/<course_id>', methods=['DELETE'])
def delete_lms(course_id):
    conn = get_db()
    conn.execute('DELETE FROM lms WHERE course_id=?', (course_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── CERTIFICATES ──────────────────────────────────────────────────────────────
import uuid
import hashlib

@app.route('/api/certificates', methods=['POST'])
def create_certificate():
    """Generate a certificate for course completion"""
    d = request.json or {}
    user_email = (d.get('email') or '').strip().lower()
    user_name  = (d.get('name') or '').strip()
    course_id  = (d.get('courseId') or '').strip()
    course_name = (d.get('courseName') or '').strip()
    instructor = (d.get('instructor') or '').strip()
    
    if not user_email or not course_id or not course_name:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Generate unique certificate ID
    cert_hash = hashlib.sha256(f"{user_email}{course_id}{datetime.now().isoformat()}".encode()).hexdigest()[:12].upper()
    certificate_id = f"ATH-{cert_hash}"
    
    conn = get_db()
    
    # Check if certificate already exists
    existing = conn.execute(
        'SELECT * FROM certificates WHERE user_email=? AND course_id=?',
        (user_email, course_id)
    ).fetchone()
    
    if existing:
        conn.close()
        return jsonify({'success': True, 'certificate': row_to_dict(existing), 'existing': True})
    
    # Create new certificate
    issued_at = now()
    conn.execute(
        'INSERT INTO certificates (id, user_email, user_name, course_id, course_name, instructor, issued_at, certificate_id) VALUES (?,?,?,?,?,?,?,?)',
        (str(uuid.uuid4()), user_email, user_name, course_id, course_name, instructor, issued_at, certificate_id)
    )
    conn.commit()
    
    cert = row_to_dict(conn.execute(
        'SELECT * FROM certificates WHERE certificate_id=?', (certificate_id,)
    ).fetchone())
    conn.close()
    
    return jsonify({'success': True, 'certificate': cert})

@app.route('/api/certificates', methods=['GET'])
def get_certificates():
    """Get all certificates for a user"""
    email = (request.args.get('email') or '').strip().lower()
    conn = get_db()
    if email:
        rows = rows_to_list(conn.execute(
            'SELECT * FROM certificates WHERE user_email=? ORDER BY issued_at DESC', (email,)
        ).fetchall())
    else:
        rows = rows_to_list(conn.execute('SELECT * FROM certificates ORDER BY issued_at DESC').fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/certificates/<certificate_id>', methods=['GET'])
def get_certificate(certificate_id):
    """Get a specific certificate by ID"""
    conn = get_db()
    cert = row_to_dict(conn.execute(
        'SELECT * FROM certificates WHERE certificate_id=?', (certificate_id,)
    ).fetchone())
    conn.close()
    if not cert:
        return jsonify({'error': 'Certificate not found'}), 404
    return jsonify(cert)

@app.route('/api/certificates/verify/<certificate_id>', methods=['GET'])
def verify_certificate(certificate_id):
    """Public verification endpoint"""
    conn = get_db()
    cert = row_to_dict(conn.execute(
        'SELECT certificate_id, user_name, course_name, instructor, issued_at FROM certificates WHERE certificate_id=?',
        (certificate_id,)
    ).fetchone())
    conn.close()
    if not cert:
        return jsonify({'valid': False, 'error': 'Certificate not found'}), 404
    return jsonify({'valid': True, 'certificate': cert})

# ── DISCUSSION FORUM ──────────────────────────────────────────────────────────
@app.route('/api/discussion/threads', methods=['GET'])
def get_threads():
    """Get all threads for a course"""
    course_id = (request.args.get('course_id') or '').strip()
    lesson_id = (request.args.get('lesson_id') or '').strip()
    
    conn = get_db()
    query = 'SELECT * FROM discussion_threads'
    params = []
    
    if course_id:
        query += ' WHERE course_id = ?'
        params.append(course_id)
        if lesson_id:
            query += ' AND lesson_id = ?'
            params.append(lesson_id)
    
    query += ' ORDER BY created_at DESC'
    
    rows = rows_to_list(conn.execute(query, params).fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/discussion/threads', methods=['POST'])
def create_thread():
    """Create a new discussion thread"""
    d = request.json or {}
    course_id = (d.get('course_id') or '').strip()
    lesson_id = (d.get('lesson_id') or '').strip()
    user_email = (d.get('user_email') or '').strip()
    user_name = (d.get('user_name') or '').strip()
    title = (d.get('title') or '').strip()
    content = (d.get('content') or '').strip()
    
    if not course_id or not user_email or not title or not content:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    conn.execute(
        'INSERT INTO discussion_threads (course_id, lesson_id, user_email, user_name, title, content, created_at) VALUES (?,?,?,?,?,?,?)',
        (course_id, lesson_id, user_email, user_name, title, content, now())
    )
    conn.commit()
    tid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    thread = row_to_dict(conn.execute('SELECT * FROM discussion_threads WHERE id=?', (tid,)).fetchone())
    conn.close()
    
    return jsonify({'success': True, 'thread': thread})

@app.route('/api/discussion/threads/<int:thread_id>', methods=['GET'])
def get_thread(thread_id):
    """Get a specific thread with all replies"""
    conn = get_db()
    thread = row_to_dict(conn.execute('SELECT * FROM discussion_threads WHERE id=?', (thread_id,)).fetchone())
    if not thread:
        conn.close()
        return jsonify({'error': 'Thread not found'}), 404
    
    replies = rows_to_list(conn.execute(
        'SELECT * FROM discussion_replies WHERE thread_id=? ORDER BY created_at ASC', (thread_id,)
    ).fetchall())
    conn.close()
    
    thread['replies'] = replies
    return jsonify(thread)

@app.route('/api/discussion/threads/<int:thread_id>', methods=['DELETE'])
def delete_thread(thread_id):
    """Delete a thread"""
    conn = get_db()
    conn.execute('DELETE FROM discussion_replies WHERE thread_id=?', (thread_id,))
    conn.execute('DELETE FROM discussion_threads WHERE id=?', (thread_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/discussion/replies', methods=['POST'])
def create_reply():
    """Add a reply to a thread"""
    d = request.json or {}
    thread_id = d.get('thread_id')
    user_email = (d.get('user_email') or '').strip()
    user_name = (d.get('user_name') or '').strip()
    content = (d.get('content') or '').strip()
    
    if not thread_id or not user_email or not content:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    conn.execute(
        'INSERT INTO discussion_replies (thread_id, user_email, user_name, content, created_at) VALUES (?,?,?,?,?)',
        (thread_id, user_email, user_name, content, now())
    )
    conn.commit()
    rid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    reply = row_to_dict(conn.execute('SELECT * FROM discussion_replies WHERE id=?', (rid,)).fetchone())
    conn.close()
    
    return jsonify({'success': True, 'reply': reply})

@app.route('/api/discussion/replies/<int:reply_id>', methods=['DELETE'])
def delete_reply(reply_id):
    """Delete a reply"""
    conn = get_db()
    conn.execute('DELETE FROM discussion_replies WHERE id=?', (reply_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/discussion/vote', methods=['POST'])
def cast_vote():
    """Vote on a thread or reply"""
    d = request.json or {}
    item_type = (d.get('item_type') or '').strip()  # 'thread' or 'reply'
    item_id = d.get('item_id')
    user_email = (d.get('user_email') or '').strip()
    vote_type = d.get('vote_type', 1)  # 1 = upvote, -1 = downvote
    
    if item_type not in ('thread', 'reply') or not item_id or not user_email:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    
    # Check if already voted
    existing = conn.execute(
        'SELECT * FROM discussion_votes WHERE item_type=? AND item_id=? AND user_email=?',
        (item_type, item_id, user_email)
    ).fetchone()
    
    if existing:
        # Remove existing vote
        conn.execute('DELETE FROM discussion_votes WHERE id=?', (existing['id'],))
        table = 'discussion_threads' if item_type == 'thread' else 'discussion_replies'
        conn.execute(f'UPDATE {table} SET votes = votes - ? WHERE id=?', (existing['vote_type'], item_id))
    
    if not existing or existing['vote_type'] != vote_type:
        # Add new vote
        conn.execute(
            'INSERT INTO discussion_votes (item_type, item_id, user_email, vote_type) VALUES (?,?,?,?)',
            (item_type, item_id, user_email, vote_type)
        )
        table = 'discussion_threads' if item_type == 'thread' else 'discussion_replies'
        conn.execute(f'UPDATE {table} SET votes = votes + ? WHERE id=?', (vote_type, item_id))
    
    conn.commit()
    
    # Get updated vote count
    table = 'discussion_threads' if item_type == 'thread' else 'discussion_replies'
    new_votes = conn.execute(f'SELECT votes FROM {table} WHERE id=?', (item_id,)).fetchone()[0]
    conn.close()
    
    return jsonify({'success': True, 'votes': new_votes})

@app.route('/api/discussion/answer', methods=['POST'])
def mark_as_answer():
    """Mark a reply as the accepted answer"""
    d = request.json or {}
    thread_id = d.get('thread_id')
    reply_id = d.get('reply_id')
    
    conn = get_db()
    
    # Clear previous answer
    conn.execute('UPDATE discussion_replies SET is_answer = 0 WHERE thread_id=?', (thread_id,))
    
    # Mark new answer
    conn.execute('UPDATE discussion_replies SET is_answer = 1 WHERE id=?', (reply_id,))
    
    # Mark thread as answered
    conn.execute('UPDATE discussion_threads SET is_answered = 1 WHERE id=?', (thread_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# ── PROGRESS TRACKING ────────────────────────────────────────────────────────
@app.route('/api/progress', methods=['POST'])
def save_progress():
    """Save student progress on a lesson"""
    d = request.json or {}
    email = (d.get('studentEmail') or '').strip().lower()
    course_id = d.get('courseId', '')
    lesson_id = d.get('lessonId', '')
    percentage = d.get('percentage', 0)
    
    if not email or not course_id or not lesson_id:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    conn.execute(
        'INSERT INTO progress (student_email, course_id, lesson_id, percentage, updated_at) VALUES (?,?,?,?,?) '
        'ON CONFLICT(student_email, course_id, lesson_id) DO UPDATE SET percentage=excluded.percentage, updated_at=excluded.updated_at',
        (email, course_id, lesson_id, percentage, now())
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/progress', methods=['GET'])
def get_progress():
    """Get progress for a student in a course"""
    email = (request.args.get('email') or '').strip().lower()
    course_id = request.args.get('course', '')
    
    conn = get_db()
    query = 'SELECT * FROM progress WHERE student_email=?'
    params = [email]
    
    if course_id:
        query += ' AND course_id=?'
        params.append(course_id)
    
    rows = rows_to_list(conn.execute(query, params).fetchall())
    conn.close()
    return jsonify(rows)

# ── NOTIFICATIONS ────────────────────────────────────────────────────────────
@app.route('/api/notifications', methods=['POST'])
def create_notification():
    """Create a notification for a user"""
    d = request.json or {}
    user_id = (d.get('userId') or '').strip().lower()
    notif_type = d.get('type', 'general')
    message = d.get('message', '')
    data = d.get('data', {})
    read = d.get('read', False)
    
    if not user_id or not message:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    conn.execute(
        'INSERT INTO notifications (user_id, type, message, data, read, created_at) VALUES (?,?,?,?,?,?)',
        (user_id, notif_type, message, json.dumps(data), read, now())
    )
    conn.commit()
    nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    row = row_to_dict(conn.execute('SELECT * FROM notifications WHERE id=?', (nid,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'notification': row})

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get notifications for a user"""
    user_id = (request.args.get('user') or '').strip().lower()
    
    conn = get_db()
    rows = rows_to_list(conn.execute(
        'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC', (user_id,)
    ).fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/notifications/<int:nid>', methods=['PATCH'])
def update_notification(nid):
    """Mark notification as read"""
    d = request.json or {}
    read = d.get('read', True)
    
    conn = get_db()
    conn.execute('UPDATE notifications SET read=? WHERE id=?', (read, nid))
    conn.commit()
    row = row_to_dict(conn.execute('SELECT * FROM notifications WHERE id=?', (nid,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'notification': row})

# ── EMAIL NOTIFICATIONS ──────────────────────────────────────────────────────
@app.route('/api/email-notification', methods=['POST'])
def send_email_notification():
    """Send email notification (mock implementation)"""
    d = request.json or {}
    email = d.get('email', '')
    subject = d.get('subject', '')
    message = d.get('message', '')
    
    if not email or not subject or not message:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Mock email sending - in production use SendGrid, Mailgun, etc.
    print(f"📧 EMAIL: To={email}, Subject={subject}")
    print(f"   Message: {message}\n")
    
    return jsonify({'success': True, 'message': 'Email queued for sending'})

# ── ATTENDANCE ───────────────────────────────────────────────────────────────
@app.route('/api/attendance', methods=['POST'])
def mark_attendance():
    """Mark attendance for a student"""
    d = request.json or {}
    email = (d.get('studentEmail') or '').strip().lower()
    session_id = d.get('sessionId', '')
    course_id = d.get('courseId', '')
    status = d.get('status', 'present')  # present, absent, late
    
    if not email or not session_id:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    conn.execute(
        'INSERT INTO attendance (student_email, session_id, course_id, status, marked_at) VALUES (?,?,?,?,?) '
        'ON CONFLICT(student_email, session_id) DO UPDATE SET status=excluded.status, marked_at=excluded.marked_at',
        (email, session_id, course_id, status, now())
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    """Get attendance for a student"""
    email = (request.args.get('email') or '').strip().lower()
    course_id = request.args.get('course', '')
    
    conn = get_db()
    query = 'SELECT * FROM attendance WHERE student_email=?'
    params = [email]
    
    if course_id:
        query += ' AND course_id=?'
        params.append(course_id)
    
    rows = rows_to_list(conn.execute(query, params).fetchall())
    conn.close()
    return jsonify(rows)

# ── GRADES ───────────────────────────────────────────────────────────────────
@app.route('/api/grades', methods=['POST'])
def save_grade():
    """Save a grade for a student"""
    d = request.json or {}
    email = (d.get('studentEmail') or '').strip().lower()
    course_id = d.get('courseId', '')
    assignment_id = d.get('assignmentId', '')
    grade = d.get('grade', 0)
    feedback = d.get('feedback', '')
    
    if not email or not assignment_id:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    conn.execute(
        'INSERT INTO grades (student_email, course_id, assignment_id, grade, feedback, graded_at) VALUES (?,?,?,?,?,?) '
        'ON CONFLICT(student_email, assignment_id) DO UPDATE SET grade=excluded.grade, feedback=excluded.feedback, graded_at=excluded.graded_at',
        (email, course_id, assignment_id, grade, feedback, now())
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/grades', methods=['GET'])
def get_grades():
    """Get grades for a student"""
    email = (request.args.get('email') or '').strip().lower()
    course_id = request.args.get('course', '')
    
    conn = get_db()
    query = 'SELECT * FROM grades WHERE student_email=?'
    params = [email]
    
    if course_id:
        query += ' AND course_id=?'
        params.append(course_id)
    
    rows = rows_to_list(conn.execute(query, params).fetchall())
    conn.close()
    return jsonify(rows)

# ── MESSAGES ─────────────────────────────────────────────────────────────────
@app.route('/api/messages', methods=['POST'])
def send_message():
    """Send a message between users"""
    d = request.json or {}
    sender_email = (d.get('senderEmail') or '').strip().lower()
    receiver_email = (d.get('receiverEmail') or '').strip().lower()
    subject = d.get('subject', '')
    content = d.get('content', '')
    
    if not sender_email or not receiver_email or not subject or not content:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    conn.execute(
        'INSERT INTO messages (sender_email, receiver_email, subject, content, read, created_at) VALUES (?,?,?,?,?,?)',
        (sender_email, receiver_email, subject, content, 0, now())
    )
    conn.commit()
    mid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    row = row_to_dict(conn.execute('SELECT * FROM messages WHERE id=?', (mid,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'message': row})

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get messages for a user"""
    user_email = (request.args.get('user') or '').strip().lower()
    
    conn = get_db()
    rows = rows_to_list(conn.execute(
        'SELECT * FROM messages WHERE receiver_email=? ORDER BY created_at DESC', (user_email,)
    ).fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/messages/<int:mid>', methods=['PATCH'])
def update_message(mid):
    """Mark message as read"""
    d = request.json or {}
    read = d.get('read', True)
    
    conn = get_db()
    conn.execute('UPDATE messages SET read=? WHERE id=?', (read, mid))
    conn.commit()
    row = row_to_dict(conn.execute('SELECT * FROM messages WHERE id=?', (mid,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'message': row})

# ── VIDEOS ───────────────────────────────────────────────────────────────────
@app.route('/api/videos', methods=['POST'])
def upload_video():
    """Upload video file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    course_id = request.form.get('courseId', '')
    lesson_id = request.form.get('lessonId', '')
    title = request.form.get('title', file.filename)
    description = request.form.get('description', '')
    
    # Save file (in production, use cloud storage like S3)
    filename = f"{uuid.uuid4()}_{file.filename}"
    file.save(f"/tmp/{filename}")
    
    conn = get_db()
    conn.execute(
        'INSERT INTO videos (course_id, lesson_id, title, description, file_path, file_type, file_size, uploaded_at) VALUES (?,?,?,?,?,?,?,?)',
        (course_id, lesson_id, title, description, filename, file.content_type, len(file.read()), now())
    )
    conn.commit()
    vid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    row = row_to_dict(conn.execute('SELECT * FROM videos WHERE id=?', (vid,)).fetchone())
    conn.close()
    
    return jsonify({'success': True, 'video': row})

@app.route('/api/videos', methods=['GET'])
def get_videos():
    """Get videos for course/lesson"""
    course_id = request.args.get('course', '')
    lesson_id = request.args.get('lesson', '')
    
    conn = get_db()
    query = 'SELECT * FROM videos'
    params = []
    
    if course_id:
        query += ' WHERE course_id=?'
        params.append(course_id)
        if lesson_id:
            query += ' AND lesson_id=?'
            params.append(lesson_id)
    
    rows = rows_to_list(conn.execute(query, params).fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/videos/<int:vid>', methods=['DELETE'])
def delete_video(vid):
    """Delete video"""
    conn = get_db()
    conn.execute('DELETE FROM videos WHERE id=?', (vid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/videos/<int:vid>/view', methods=['POST'])
def record_video_view(vid):
    """Record video view"""
    conn = get_db()
    conn.execute('UPDATE videos SET views = views + 1 WHERE id=?', (vid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── PAYMENTS ──────────────────────────────────────────────────────────────────
@app.route('/api/payments/initialize', methods=['POST'])
def initialize_payment():
    """Initialize payment with Stripe/Razorpay"""
    d = request.json or {}
    course_id = d.get('courseId', '')
    amount = d.get('amount', 0)
    currency = d.get('currency', 'USD')
    
    if not course_id or not amount:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # In production, call Stripe or Razorpay API
    payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    
    conn = get_db()
    conn.execute(
        'INSERT INTO payments (payment_id, course_id, amount, currency, status, created_at) VALUES (?,?,?,?,?,?)',
        (payment_id, course_id, amount, currency, 'pending', now())
    )
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'payment_id': payment_id,
        'amount': amount,
        'currency': currency,
        'status': 'pending'
    })

@app.route('/api/payments', methods=['GET'])
def get_payments():
    """Get payment history"""
    email = (request.args.get('email') or '').strip().lower()
    
    conn = get_db()
    rows = rows_to_list(conn.execute(
        'SELECT * FROM payments WHERE email=? ORDER BY created_at DESC', (email,)
    ).fetchall())
    conn.close()
    return jsonify(rows)

# ── TWO-FACTOR AUTH ───────────────────────────────────────────────────────────
@app.route('/api/2fa/enable', methods=['POST'])
def enable_2fa():
    """Enable 2FA for user"""
    d = request.json or {}
    email = (d.get('email') or '').strip().lower()
    
    # Generate secret (in production, use pyotp library)
    secret = f"secret_{uuid.uuid4().hex[:10]}"
    
    conn = get_db()
    conn.execute('INSERT OR REPLACE INTO two_factor (email, secret, enabled) VALUES (?,?,?)',
                 (email, secret, 1))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'secret': secret})

@app.route('/api/2fa/verify', methods=['POST'])
def verify_2fa():
    """Verify 2FA code"""
    d = request.json or {}
    email = (d.get('email') or '').strip().lower()
    code = d.get('code', '')
    
    # In production, verify against pyotp
    if len(code) == 6 and code.isdigit():
        return jsonify({'success': True, 'verified': True})
    
    return jsonify({'success': False, 'verified': False})

# ── CALENDAR INTEGRATION ──────────────────────────────────────────────────────
@app.route('/api/calendar/events', methods=['POST'])
def create_calendar_event():
    """Create calendar event"""
    d = request.json or {}
    course_id = d.get('courseId', '')
    title = d.get('title', '')
    start_date = d.get('startDate', '')
    end_date = d.get('endDate', '')
    description = d.get('description', '')
    
    conn = get_db()
    conn.execute(
        'INSERT INTO calendar_events (course_id, title, start_date, end_date, description, created_at) VALUES (?,?,?,?,?,?)',
        (course_id, title, start_date, end_date, description, now())
    )
    conn.commit()
    eid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    row = row_to_dict(conn.execute('SELECT * FROM calendar_events WHERE id=?', (eid,)).fetchone())
    conn.close()
    
    return jsonify({'success': True, 'event': row})

@app.route('/api/calendar/events', methods=['GET'])
def get_calendar_events():
    """Get calendar events"""
    email = (request.args.get('email') or '').strip().lower()
    
    conn = get_db()
    rows = rows_to_list(conn.execute(
        'SELECT * FROM calendar_events ORDER BY start_date ASC'
    ).fetchall())
    conn.close()
    return jsonify(rows)

# ── DEBUG ─────────────────────────────────────────────────────────────────────
@app.route('/api/debug', methods=['GET'])
def debug():
    conn = get_db()
    users = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    enrs  = conn.execute('SELECT COUNT(*) FROM enrollments').fetchone()[0]
    conn.close()
    return jsonify({
        'db': DB_PATH,
        'users': users,
        'enrollments': enrs,
        'status': 'ok'
    })

# ── Run ───────────────────────────────────────────────────────────────────────
init_db()
handler = app

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

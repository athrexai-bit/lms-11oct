"""
Athrexai — Backend Server
Flask + SQLite database
Production: gunicorn server:app
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3, os, json
from datetime import datetime
from uuid import uuid4

app = Flask(__name__, static_folder='.')
CORS(app, origins="*")
app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024
LMS_UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads', 'lms')


@app.errorhandler(413)
def upload_too_large(_error):
    return jsonify({'error': 'Files must be 25 MB or smaller.'}), 413

# Use /tmp for SQLite on Render (writable directory)
DB_PATH = os.environ.get('DB_PATH', '/tmp/arthrex.db')

# ─────────────────────────────────────────────
#  DATABASE INIT
# ─────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Users / Signups
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        name      TEXT NOT NULL,
        email     TEXT UNIQUE NOT NULL,
        password  TEXT NOT NULL,
        country   TEXT,
        phone     TEXT,
        role      TEXT DEFAULT 'user',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )''')

    # Enrollments
    c.execute('''CREATE TABLE IF NOT EXISTS enrollments (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT,
        email      TEXT,
        phone      TEXT,
        course     TEXT,
        course_id  TEXT,
        status     TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )''')

    # LMS Courses
    c.execute('''CREATE TABLE IF NOT EXISTS lms_courses (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        category   TEXT,
        duration   TEXT,
        data       TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS attendance_sessions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id  TEXT NOT NULL,
        title      TEXT NOT NULL,
        session_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS attendance_records (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id     INTEGER NOT NULL,
        enrollment_id  INTEGER NOT NULL,
        status         TEXT NOT NULL DEFAULT 'absent',
        note           TEXT DEFAULT '',
        updated_at     TEXT DEFAULT (datetime('now','localtime')),
        UNIQUE(session_id, enrollment_id),
        FOREIGN KEY(session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY(enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
    )''')

    # Masterclasses
    c.execute('''CREATE TABLE IF NOT EXISTS masterclasses (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        title          TEXT,
        tag            TEXT,
        instructor     TEXT,
        instructor_bio TEXT,
        description    TEXT,
        schedule       TEXT,
        duration       TEXT,
        link           TEXT,
        rating         REAL DEFAULT 4.9,
        thumb          TEXT,
        learn_points   TEXT,
        for_whom       TEXT,
        faqs           TEXT,
        video_url      TEXT,
        created_at     TEXT DEFAULT (datetime('now','localtime'))
    )''')

    # Masterclass Registrations
    c.execute('''CREATE TABLE IF NOT EXISTS mc_registrations (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        mc_id        TEXT,
        mc_title     TEXT,
        name         TEXT,
        email        TEXT,
        phone        TEXT,
        country      TEXT,
        state        TEXT,
        profession   TEXT,
        registered_at TEXT DEFAULT (datetime('now','localtime'))
    )''')

    # Live Classes
    c.execute('''CREATE TABLE IF NOT EXISTS live_classes (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT,
        tag         TEXT,
        instructor  TEXT,
        description TEXT,
        date        TEXT,
        start_time  TEXT,
        end_time    TEXT,
        duration    TEXT,
        join_link   TEXT,
        thumb       TEXT,
        created_at  TEXT DEFAULT (datetime('now','localtime'))
    )''')

    # Seed admin user
    c.execute("INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)",
              ('Admin', 'admin@athrexai.com', 'admin123', 'admin'))
    c.execute("INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)",
              ('User', 'user@athrexai.com', 'user123', 'user'))

    conn.commit()
    conn.close()
    print("✅ Database initialized: arthrex.db")

# ─────────────────────────────────────────────
#  SERVE FRONTEND
#  Marketing site (main.html) is the public homepage.
#  LMS dashboard lives at /dashboard (legacy index.html).
# ─────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'main.html')

@app.route('/index.html')
def marketing_index():
    """Deep-links like /index.html?course=1"""
    return send_from_directory('.', 'main.html')

@app.route('/dashboard')
@app.route('/app')
def dashboard():
    return send_from_directory('.', 'index.html')

@app.route('/masterclass-detail')
def masterclass_detail():
    return send_from_directory('.', 'masterclass-detail.html')

@app.route('/admin')
def admin():
    return send_from_directory('.', 'admin.html')

@app.route('/admin-lms')
def admin_lms():
    return send_from_directory('.', 'admin-lms.html')

@app.route('/lms')
def lms():
    return send_from_directory('.', 'lms.html')

@app.route('/curriculum')
def curriculum():
    return send_from_directory('.', 'curriculum.html')

@app.route('/website')
def website():
    return send_from_directory('.', 'website.html')

@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join('.', path)
    if os.path.isfile(file_path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'main.html')

# ─────────────────────────────────────────────
#  AUTH ROUTES
# ─────────────────────────────────────────────
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    d = request.json
    name, email, password = d.get('name','').strip(), d.get('email','').strip().lower(), d.get('password','')
    country, phone = d.get('country',''), d.get('phone','')
    if not name or not email or not password:
        return jsonify({'error': 'All fields required'}), 400
    try:
        conn = get_db()
        conn.execute("INSERT INTO users (name,email,password,country,phone) VALUES (?,?,?,?,?)",
                     (name, email, password, country, phone))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'name': name, 'email': email, 'role': 'user'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 409

@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json
    email, password = d.get('email','').strip().lower(), d.get('password','')
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password)).fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    return jsonify({'success': True, 'name': user['name'], 'email': user['email'], 'role': user['role']})

# ─────────────────────────────────────────────
#  SIGNUPS (admin view)
# ─────────────────────────────────────────────
@app.route('/api/signups', methods=['GET'])
def get_signups():
    conn = get_db()
    rows = conn.execute("SELECT id,name,email,country,phone,role,created_at FROM users WHERE role='user' ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/signups/<int:uid>', methods=['DELETE'])
def delete_signup(uid):
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=? AND role='user'", (uid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ─────────────────────────────────────────────
#  ENROLLMENTS
# ─────────────────────────────────────────────
@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    """Status values: pending | approved | rejected"""
    conn = get_db()
    email = (request.args.get('email') or '').strip().lower()
    if email:
        rows = conn.execute(
            "SELECT * FROM enrollments WHERE lower(email)=? ORDER BY id DESC",
            (email,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM enrollments ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/enrollments', methods=['POST'])
def add_enrollment():
    """Creates enrollment. Demo users are auto-approved; others stay pending until admin approval."""
    d = request.json or {}
    email = (d.get('email') or '').strip()
    course_id = str(d.get('courseId') or d.get('course_id') or '')
    is_demo = email.lower() == 'demo@athrexai.com'
    status = 'approved' if is_demo else 'pending'
    conn = get_db()
    # Avoid duplicate pending/approved rows for same user+course
    if email and course_id:
        existing = conn.execute(
            "SELECT * FROM enrollments WHERE lower(email)=? AND course_id=? "
            "AND status IN ('pending','approved') ORDER BY id DESC LIMIT 1",
            (email.lower(), course_id)
        ).fetchone()
        if existing:
            # Upgrade demo pending rows to approved
            if is_demo and (existing['status'] or '').lower() == 'pending':
                conn.execute("UPDATE enrollments SET status='approved' WHERE id=?", (existing['id'],))
                conn.commit()
                row = conn.execute("SELECT * FROM enrollments WHERE id=?", (existing['id'],)).fetchone()
                conn.close()
                return jsonify({'success': True, 'enrollment': dict(row) if row else None, 'duplicate': True})
            conn.close()
            return jsonify({'success': True, 'enrollment': dict(existing), 'duplicate': True})
    cur = conn.execute(
        "INSERT INTO enrollments (name,email,phone,course,course_id,status) VALUES (?,?,?,?,?,?)",
        (d.get('name'), email, d.get('phone'), d.get('course'), course_id, status)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM enrollments WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'enrollment': dict(row) if row else None})

@app.route('/api/enrollments/<int:eid>', methods=['PATCH'])
def update_enrollment(eid):
    d = request.json or {}
    status = (d.get('status') or '').strip().lower()
    if status not in ('pending', 'approved', 'rejected'):
        return jsonify({'error': 'status must be pending, approved, or rejected'}), 400
    conn = get_db()
    conn.execute("UPDATE enrollments SET status=? WHERE id=?", (status, eid))
    conn.commit()
    row = conn.execute("SELECT * FROM enrollments WHERE id=?", (eid,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Enrollment not found'}), 404
    return jsonify({'success': True, 'enrollment': dict(row)})

@app.route('/api/enrollments/<int:eid>', methods=['DELETE'])
def delete_enrollment(eid):
    conn = get_db()
    conn.execute("DELETE FROM enrollments WHERE id=?", (eid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ─────────────────────────────────────────────
#  LMS COURSES
# ─────────────────────────────────────────────
@app.route('/api/lms', methods=['GET'])
def get_lms():
    conn = get_db()
    rows = conn.execute("SELECT * FROM lms_courses").fetchall()
    conn.close()
    result = {}
    for r in rows:
        result[r['id']] = {
            'name': r['name'],
            'category': r['category'],
            'duration': r['duration'],
            **json.loads(r['data'] or '{}')
        }
    return jsonify(result)


@app.route('/api/lms/uploads', methods=['POST'])
def upload_lms_file():
    upload = request.files.get('file')
    if not upload or not upload.filename:
        return jsonify({'error': 'Choose a file to upload.'}), 400

    allowed_extensions = {
        '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.csv',
        '.zip', '.ipynb', '.py', '.js', '.html', '.txt', '.png', '.jpg',
        '.jpeg', '.webp', '.mp4', '.webm'
    }
    extension = os.path.splitext(upload.filename)[1].lower()
    if extension not in allowed_extensions:
        return jsonify({'error': 'This file type is not supported.'}), 400

    safe_name = secure_filename(upload.filename)
    stored_name = f'{uuid4().hex}_{safe_name}'
    os.makedirs(LMS_UPLOAD_FOLDER, exist_ok=True)
    upload.save(os.path.join(LMS_UPLOAD_FOLDER, stored_name))
    return jsonify({'name': upload.filename, 'url': f'/api/lms/uploads/{stored_name}'}), 201


@app.route('/api/lms/uploads/<filename>', methods=['GET'])
def get_lms_upload(filename):
    if secure_filename(filename) != filename:
        return jsonify({'error': 'File not found.'}), 404
    return send_from_directory(LMS_UPLOAD_FOLDER, filename, as_attachment=False)

@app.route('/api/lms/<course_id>', methods=['PUT'])
def save_lms_course(course_id):
    d = request.json
    name = d.get('name', '')
    category = d.get('category', '')
    duration = d.get('duration', '')
    data_json = json.dumps({k: v for k, v in d.items() if k not in ('name','category','duration')})
    conn = get_db()
    conn.execute('''INSERT INTO lms_courses (id,name,category,duration,data)
                    VALUES (?,?,?,?,?)
                    ON CONFLICT(id) DO UPDATE SET name=?,category=?,duration=?,data=?''',
                 (course_id, name, category, duration, data_json,
                  name, category, duration, data_json))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/lms/<course_id>', methods=['DELETE'])
def delete_lms_course(course_id):
    conn = get_db()
    conn.execute("DELETE FROM lms_courses WHERE id=?", (course_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/lms/<course_id>/attendance', methods=['GET'])
def get_course_attendance(course_id):
    conn = get_db()
    course = conn.execute("SELECT name FROM lms_courses WHERE id=?", (course_id,)).fetchone()
    course_name = course['name'] if course else ''
    sessions = conn.execute(
        "SELECT id, course_id, title, session_at, created_at FROM attendance_sessions "
        "WHERE course_id=? ORDER BY session_at DESC, id DESC", (course_id,)
    ).fetchall()
    result = []
    for session in sessions:
        learners = conn.execute(
            "SELECT e.id AS enrollment_id, e.name, e.email, e.phone, "
            "COALESCE(a.status, 'unmarked') AS status, COALESCE(a.note, '') AS note "
            "FROM enrollments e LEFT JOIN attendance_records a "
            "ON a.enrollment_id=e.id AND a.session_id=? "
            "WHERE lower(COALESCE(e.status,''))='approved' "
            "AND (e.course_id=? OR (e.course_id='' AND lower(COALESCE(e.course,''))=lower(?))) "
            "ORDER BY lower(e.name), lower(e.email)",
            (session['id'], course_id, course_name)
        ).fetchall()
        result.append({**dict(session), 'learners': [dict(learner) for learner in learners]})
    conn.close()
    return jsonify(result)


@app.route('/api/lms/<course_id>/attendance/sessions', methods=['POST'])
def create_attendance_session(course_id):
    data = request.json or {}
    title = (data.get('title') or '').strip()
    session_at = (data.get('session_at') or '').strip()
    if not title or not session_at:
        return jsonify({'error': 'Session title and date/time are required.'}), 400

    conn = get_db()
    course = conn.execute("SELECT id FROM lms_courses WHERE id=?", (course_id,)).fetchone()
    if not course:
        conn.close()
        return jsonify({'error': 'Course not found.'}), 404
    cursor = conn.execute(
        "INSERT INTO attendance_sessions (course_id, title, session_at) VALUES (?,?,?)",
        (course_id, title, session_at)
    )
    conn.commit()
    session = conn.execute("SELECT * FROM attendance_sessions WHERE id=?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'session': dict(session)}), 201


@app.route('/api/lms/attendance/sessions/<int:session_id>', methods=['DELETE'])
def delete_attendance_session(session_id):
    conn = get_db()
    conn.execute("DELETE FROM attendance_records WHERE session_id=?", (session_id,))
    cursor = conn.execute("DELETE FROM attendance_sessions WHERE id=?", (session_id,))
    conn.commit()
    conn.close()
    if not cursor.rowcount:
        return jsonify({'error': 'Session not found.'}), 404
    return jsonify({'success': True})


@app.route('/api/lms/attendance/sessions/<int:session_id>/learners/<int:enrollment_id>', methods=['PUT'])
def save_attendance_record(session_id, enrollment_id):
    data = request.json or {}
    status = (data.get('status') or '').strip().lower()
    if status not in ('present', 'late', 'absent', 'excused'):
        return jsonify({'error': 'Status must be present, late, absent, or excused.'}), 400

    conn = get_db()
    row = conn.execute(
        "SELECT s.id FROM attendance_sessions s "
        "JOIN enrollments e ON e.id=? "
        "JOIN lms_courses c ON c.id=s.course_id "
        "WHERE s.id=? AND lower(COALESCE(e.status,''))='approved' "
        "AND (e.course_id=s.course_id OR (e.course_id='' AND lower(COALESCE(e.course,''))=lower(c.name)))",
        (enrollment_id, session_id)
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Session or approved course enrollment not found.'}), 404
    conn.execute(
        "INSERT INTO attendance_records (session_id, enrollment_id, status, note, updated_at) "
        "VALUES (?,?,?,?,datetime('now','localtime')) "
        "ON CONFLICT(session_id,enrollment_id) DO UPDATE SET "
        "status=excluded.status, note=excluded.note, updated_at=excluded.updated_at",
        (session_id, enrollment_id, status, (data.get('note') or '').strip())
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'status': status})

# ─────────────────────────────────────────────
#  MASTERCLASSES
# ─────────────────────────────────────────────
@app.route('/api/masterclasses', methods=['GET'])
def get_masterclasses():
    conn = get_db()
    rows = conn.execute("SELECT * FROM masterclasses ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/masterclasses', methods=['POST'])
def add_masterclass():
    d = request.json
    conn = get_db()
    conn.execute('''INSERT INTO masterclasses
        (title,tag,instructor,instructor_bio,description,schedule,duration,link,rating,thumb,learn_points,for_whom,faqs,video_url)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
        (d.get('title'), d.get('tag'), d.get('instructor'), d.get('instructor_bio'),
         d.get('description'), d.get('schedule'), d.get('duration'), d.get('link'),
         d.get('rating', 4.9), d.get('thumb'), d.get('learn_points'),
         d.get('for_whom'), d.get('faqs'), d.get('videoUrl')))
    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'id': new_id})

@app.route('/api/masterclasses/<int:mid>', methods=['DELETE'])
def delete_masterclass(mid):
    conn = get_db()
    conn.execute("DELETE FROM masterclasses WHERE id=?", (mid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── MASTERCLASS REGISTRATIONS ─────────────────────────────────────────────────
@app.route('/api/mc-registrations', methods=['POST'])
def add_mc_registration():
    d = request.json
    conn = get_db()
    conn.execute('''INSERT INTO mc_registrations (mc_id,mc_title,name,email,phone,country,state,profession)
                    VALUES (?,?,?,?,?,?,?,?)''',
                 (d.get('mc_id'), d.get('mc_title'), d.get('name'), d.get('email'),
                  d.get('phone'), d.get('country'), d.get('state'), d.get('profession')))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/mc-registrations/<mc_id>', methods=['GET'])
def get_mc_registrations(mc_id):
    conn = get_db()
    rows = conn.execute("SELECT * FROM mc_registrations WHERE mc_id=? ORDER BY id DESC", (mc_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

# ─────────────────────────────────────────────
#  LIVE CLASSES
# ─────────────────────────────────────────────
@app.route('/api/liveclasses', methods=['GET'])
def get_liveclasses():
    conn = get_db()
    rows = conn.execute("SELECT * FROM live_classes ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/liveclasses', methods=['POST'])
def add_liveclass():
    d = request.json
    conn = get_db()
    conn.execute('''INSERT INTO live_classes (title,tag,instructor,description,date,start_time,end_time,duration,join_link,thumb)
                    VALUES (?,?,?,?,?,?,?,?,?,?)''',
                 (d.get('title'), d.get('tag'), d.get('instructor'), d.get('description'),
                  d.get('date'), d.get('startTime'), d.get('endTime'), d.get('duration'),
                  d.get('joinLink'), d.get('thumb')))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/liveclasses/<int:lid>', methods=['DELETE'])
def delete_liveclass(lid):
    conn = get_db()
    conn.execute("DELETE FROM live_classes WHERE id=?", (lid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ─────────────────────────────────────────────
#  RUN
# ─────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("🚀 Athrexai Server running at http://localhost:8000")
    app.run(debug=True, port=8000)

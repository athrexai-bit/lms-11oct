"""
Arthrex AI — Backend Server
Flask + SQLite database
Production: gunicorn server:app
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, os, json
from datetime import datetime

app = Flask(__name__, static_folder='.')
CORS(app, origins="*")

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

    # Masterclasses
    c.execute('''CREATE TABLE IF NOT EXISTS masterclasses (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT,
        tag        TEXT,
        instructor TEXT,
        description TEXT,
        date       TEXT,
        duration   TEXT,
        thumb      TEXT,
        video_url  TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime'))
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
              ('Admin', 'admin@arthrex.ai', 'admin123', 'admin'))
    c.execute("INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)",
              ('User', 'user@arthrex.ai', 'user123', 'user'))

    conn.commit()
    conn.close()
    print("✅ Database initialized: arthrex.db")

# ─────────────────────────────────────────────
#  SERVE FRONTEND
# ─────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join('.', path)
    if os.path.isfile(file_path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

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
    conn = get_db()
    rows = conn.execute("SELECT * FROM enrollments ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/enrollments', methods=['POST'])
def add_enrollment():
    d = request.json
    conn = get_db()
    conn.execute("INSERT INTO enrollments (name,email,phone,course,course_id,status) VALUES (?,?,?,?,?,?)",
                 (d.get('name'), d.get('email'), d.get('phone'), d.get('course'), d.get('courseId',''), 'pending'))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/enrollments/<int:eid>', methods=['PATCH'])
def update_enrollment(eid):
    d = request.json
    conn = get_db()
    conn.execute("UPDATE enrollments SET status=? WHERE id=?", (d.get('status'), eid))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

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
    conn.execute('''INSERT INTO masterclasses (title,tag,instructor,description,date,duration,thumb,video_url)
                    VALUES (?,?,?,?,?,?,?,?)''',
                 (d.get('title'), d.get('tag'), d.get('instructor'), d.get('description'),
                  d.get('date'), d.get('duration'), d.get('thumb'), d.get('videoUrl')))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/masterclasses/<int:mid>', methods=['DELETE'])
def delete_masterclass(mid):
    conn = get_db()
    conn.execute("DELETE FROM masterclasses WHERE id=?", (mid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

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
    print("🚀 Arthrex AI Server running at http://localhost:8000")
    app.run(debug=True, port=8000)

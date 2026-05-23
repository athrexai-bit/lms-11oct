"""
Arthrex AI — Vercel Serverless API
Storage: Upstash Redis (free tier) via REST API
Set env vars in Vercel dashboard:
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os, urllib.request, urllib.error
from datetime import datetime

app = Flask(__name__)
CORS(app, origins="*")

# ── Upstash Redis REST helpers ────────────────────────────────────────────────
UPSTASH_URL   = os.environ.get('UPSTASH_REDIS_REST_URL', '')
UPSTASH_TOKEN = os.environ.get('UPSTASH_REDIS_REST_TOKEN', '')

def redis_get(key):
    """Get a JSON value from Upstash Redis."""
    if not UPSTASH_URL:
        return None
    try:
        req = urllib.request.Request(
            f"{UPSTASH_URL}/get/{key}",
            headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read())
            val = data.get('result')
            return json.loads(val) if val else None
    except Exception as e:
        print(f"Redis GET error: {e}")
        return None

def redis_set(key, value):
    """Set a JSON value in Upstash Redis."""
    if not UPSTASH_URL:
        return False
    try:
        body = json.dumps(value).encode()
        req = urllib.request.Request(
            f"{UPSTASH_URL}/set/{key}",
            data=body,
            method='POST',
            headers={
                "Authorization": f"Bearer {UPSTASH_TOKEN}",
                "Content-Type": "application/json"
            }
        )
        urllib.request.urlopen(req, timeout=5)
        return True
    except Exception as e:
        print(f"Redis SET error: {e}")
        return False

# ── Default seed data ─────────────────────────────────────────────────────────
DEFAULT_USERS = [
    {'id': 1, 'name': 'Admin', 'email': 'admin@arthrex.ai', 'password': 'admin123', 'role': 'admin', 'created_at': '2026-01-01'},
    {'id': 2, 'name': 'User',  'email': 'user@arthrex.ai',  'password': 'user123',  'role': 'user',  'created_at': '2026-01-01'},
]

def get_store(key, default=None):
    """Get from Redis, fallback to default."""
    val = redis_get(f"arthrex:{key}")
    if val is None:
        if default is None:
            default = DEFAULT_USERS if key == 'users' else []
        return default
    return val

def set_store(key, value):
    """Save to Redis."""
    redis_set(f"arthrex:{key}", value)

def next_id(items):
    return max((i.get('id', 0) for i in items), default=0) + 1

def now():
    return datetime.now().strftime('%d %b %Y %H:%M')

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json or {}
    email    = d.get('email', '').strip().lower()
    password = d.get('password', '')
    users = get_store('users')
    user = next((u for u in users if u['email'] == email and u['password'] == password), None)
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
    users = get_store('users')
    if any(u['email'] == email for u in users):
        return jsonify({'error': 'Email already registered'}), 409
    user = {
        'id': next_id(users), 'name': name, 'email': email,
        'password': password, 'country': country, 'phone': phone,
        'role': 'user', 'created_at': now()
    }
    users.append(user)
    set_store('users', users)
    return jsonify({'success': True, 'name': name, 'email': email, 'role': 'user'})

# ── SIGNUPS (admin) ───────────────────────────────────────────────────────────
@app.route('/api/signups', methods=['GET'])
def get_signups():
    users = get_store('users')
    return jsonify([{k: v for k, v in u.items() if k != 'password'}
                    for u in users if u.get('role') == 'user'])

@app.route('/api/signups/<int:uid>', methods=['DELETE'])
def delete_signup(uid):
    users = get_store('users')
    users = [u for u in users if not (u['id'] == uid and u['role'] == 'user')]
    set_store('users', users)
    return jsonify({'success': True})

# ── ENROLLMENTS ───────────────────────────────────────────────────────────────
@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    return jsonify(get_store('enrollments', []))

@app.route('/api/enrollments', methods=['POST'])
def add_enrollment():
    d = request.json or {}
    items = get_store('enrollments', [])
    e = {
        'id': next_id(items), 'name': d.get('name'), 'email': d.get('email'),
        'phone': d.get('phone'), 'course': d.get('course'),
        'course_id': d.get('courseId', ''), 'status': 'pending', 'date': now()
    }
    items.append(e)
    set_store('enrollments', items)
    return jsonify({'success': True})

@app.route('/api/enrollments/<int:eid>', methods=['PATCH'])
def update_enrollment(eid):
    d = request.json or {}
    items = get_store('enrollments', [])
    for e in items:
        if e['id'] == eid:
            e['status'] = d.get('status', e['status'])
    set_store('enrollments', items)
    return jsonify({'success': True})

@app.route('/api/enrollments/<int:eid>', methods=['DELETE'])
def delete_enrollment(eid):
    items = [e for e in get_store('enrollments', []) if e['id'] != eid]
    set_store('enrollments', items)
    return jsonify({'success': True})

# ── MASTERCLASSES ─────────────────────────────────────────────────────────────
@app.route('/api/masterclasses', methods=['GET'])
def get_masterclasses():
    return jsonify(get_store('masterclasses', []))

@app.route('/api/masterclasses', methods=['POST'])
def add_masterclass():
    d = request.json or {}
    items = get_store('masterclasses', [])
    m = {'id': next_id(items), 'created_at': now(), **d}
    items.append(m)
    set_store('masterclasses', items)
    return jsonify({'success': True, 'id': m['id']})

@app.route('/api/masterclasses/<int:mid>', methods=['DELETE'])
def delete_masterclass(mid):
    items = [m for m in get_store('masterclasses', []) if m['id'] != mid]
    set_store('masterclasses', items)
    return jsonify({'success': True})

# ── LIVE CLASSES ──────────────────────────────────────────────────────────────
@app.route('/api/liveclasses', methods=['GET'])
def get_liveclasses():
    return jsonify(get_store('liveclasses', []))

@app.route('/api/liveclasses', methods=['POST'])
def add_liveclass():
    d = request.json or {}
    items = get_store('liveclasses', [])
    lc = {'id': next_id(items), 'created_at': now(), **d}
    items.append(lc)
    set_store('liveclasses', items)
    return jsonify({'success': True, 'id': lc['id']})

@app.route('/api/liveclasses/<int:lid>', methods=['DELETE'])
def delete_liveclass(lid):
    items = [l for l in get_store('liveclasses', []) if l['id'] != lid]
    set_store('liveclasses', items)
    return jsonify({'success': True})

# ── LMS ───────────────────────────────────────────────────────────────────────
@app.route('/api/lms', methods=['GET'])
def get_lms():
    return jsonify(get_store('lms', {}))

@app.route('/api/lms/<course_id>', methods=['PUT'])
def save_lms(course_id):
    lms = get_store('lms', {})
    lms[course_id] = request.json or {}
    set_store('lms', lms)
    return jsonify({'success': True})

@app.route('/api/lms/<course_id>', methods=['DELETE'])
def delete_lms(course_id):
    lms = get_store('lms', {})
    lms.pop(course_id, None)
    set_store('lms', lms)
    return jsonify({'success': True})

# ── Vercel handler ────────────────────────────────────────────────────────────
handler = app

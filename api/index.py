"""
Athrexai — Vercel Serverless API
Storage: Upstash Redis (free tier) via REST API
Set env vars in Vercel dashboard:
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os, urllib.request, urllib.error, urllib.parse
from datetime import datetime

app = Flask(__name__)
CORS(app, origins="*")

# ── Upstash Redis REST helpers ────────────────────────────────────────────────
UPSTASH_URL   = os.environ.get('UPSTASH_REDIS_REST_URL', '')
UPSTASH_TOKEN = os.environ.get('UPSTASH_REDIS_REST_TOKEN', '')

def redis_get(key):
    """Get a JSON value from Upstash Redis."""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        return None
    try:
        url = f"{UPSTASH_URL}/get/{urllib.parse.quote(key, safe='')}"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"}
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode())
            val = data.get('result')
            if val is None:
                return None
            return json.loads(val)
    except Exception as e:
        print(f"Redis GET error for {key}: {e}")
        return None

def redis_set(key, value):
    """Set a JSON value in Upstash Redis."""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        return False
    try:
        serialized = json.dumps(value, ensure_ascii=False)
        # Use pipeline/set command via REST
        url = f"{UPSTASH_URL}/set/{urllib.parse.quote(key, safe='')}"
        body = serialized.encode('utf-8')
        req = urllib.request.Request(
            url,
            data=body,
            method='POST',
            headers={
                "Authorization": f"Bearer {UPSTASH_TOKEN}",
                "Content-Type": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            result = json.loads(res.read().decode())
            return result.get('result') == 'OK'
    except Exception as e:
        print(f"Redis SET error for {key}: {e}")
        return False

# ── Default seed data ─────────────────────────────────────────────────────────
DEFAULT_USERS = [
    {'id': 1, 'name': 'Admin', 'email': 'admin@athrexai.com', 'password': 'admin123', 'role': 'admin', 'created_at': '2026-01-01'},
    {'id': 2, 'name': 'User',  'email': 'user@athrexai.com',  'password': 'user123',  'role': 'user',  'created_at': '2026-01-01'},
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

# ── ENROLLMENTS (status: pending | approved | rejected) ───────────────────────
@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    items = get_store('enrollments', [])
    email = (request.args.get('email') or '').strip().lower()
    if email:
        items = [e for e in items if (e.get('email') or '').lower() == email]
    return jsonify(items)

@app.route('/api/enrollments', methods=['POST'])
def add_enrollment():
    d = request.json or {}
    items = get_store('enrollments', [])
    email = (d.get('email') or '').strip()
    course_id = str(d.get('courseId') or d.get('course_id') or '')
    if email and course_id:
        for e in items:
            if (e.get('email') or '').lower() == email.lower() and str(e.get('course_id') or e.get('courseId') or '') == course_id:
                if e.get('status') in ('pending', 'approved'):
                    return jsonify({'success': True, 'enrollment': e, 'duplicate': True})
    e = {
        'id': next_id(items), 'name': d.get('name'), 'email': email,
        'phone': d.get('phone'), 'course': d.get('course'),
        'course_id': course_id, 'status': 'pending', 'date': now()
    }
    items.append(e)
    set_store('enrollments', items)
    return jsonify({'success': True, 'enrollment': e})

@app.route('/api/enrollments/<int:eid>', methods=['PATCH'])
def update_enrollment(eid):
    d = request.json or {}
    status = (d.get('status') or '').strip().lower()
    if status not in ('pending', 'approved', 'rejected'):
        return jsonify({'error': 'status must be pending, approved, or rejected'}), 400
    items = get_store('enrollments', [])
    found = None
    for e in items:
        if e['id'] == eid:
            e['status'] = status
            found = e
    if not found:
        return jsonify({'error': 'Enrollment not found'}), 404
    set_store('enrollments', items)
    return jsonify({'success': True, 'enrollment': found})

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
@app.route('/api/debug', methods=['GET'])
def debug():
    has_url = bool(UPSTASH_URL)
    has_token = bool(UPSTASH_TOKEN)
    test_set = redis_set('arthrex:debug_test', {'ok': True})
    test_get = redis_get('arthrex:debug_test')
    return jsonify({
        'has_url': has_url,
        'has_token': has_token,
        'url_prefix': UPSTASH_URL[:30] if UPSTASH_URL else None,
        'redis_set': test_set,
        'redis_get': test_get
    })

handler = app

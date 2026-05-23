"""
Arthrex AI — Vercel Serverless API
Uses Vercel KV (or in-memory fallback) for data storage
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os

app = Flask(__name__)
CORS(app, origins="*")

# ── In-memory store (resets on cold start — use Vercel KV for persistence) ──
_store = {
    'users': [
        {'id': 1, 'name': 'Admin', 'email': 'admin@arthrex.ai', 'password': 'admin123', 'role': 'admin', 'created_at': '2026-01-01'},
        {'id': 2, 'name': 'User',  'email': 'user@arthrex.ai',  'password': 'user123',  'role': 'user',  'created_at': '2026-01-01'},
    ],
    'enrollments': [],
    'masterclasses': [],
    'live_classes': [],
    'lms': {}
}

def _next_id(collection):
    items = _store.get(collection, [])
    return max((i.get('id', 0) for i in items), default=0) + 1

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json or {}
    email = d.get('email','').strip().lower()
    password = d.get('password','')
    user = next((u for u in _store['users'] if u['email'] == email and u['password'] == password), None)
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    return jsonify({'success': True, 'name': user['name'], 'email': user['email'], 'role': user['role']})

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    d = request.json or {}
    name, email, password = d.get('name','').strip(), d.get('email','').strip().lower(), d.get('password','')
    country, phone = d.get('country',''), d.get('phone','')
    if not name or not email or not password:
        return jsonify({'error': 'All fields required'}), 400
    if any(u['email'] == email for u in _store['users']):
        return jsonify({'error': 'Email already registered'}), 409
    user = {'id': _next_id('users'), 'name': name, 'email': email, 'password': password,
            'country': country, 'phone': phone, 'role': 'user', 'created_at': '2026-01-01'}
    _store['users'].append(user)
    return jsonify({'success': True, 'name': name, 'email': email, 'role': 'user'})

# ── SIGNUPS ───────────────────────────────────────────────────────────────────
@app.route('/api/signups', methods=['GET'])
def get_signups():
    users = [u for u in _store['users'] if u.get('role') == 'user']
    return jsonify([{k:v for k,v in u.items() if k != 'password'} for u in users])

@app.route('/api/signups/<int:uid>', methods=['DELETE'])
def delete_signup(uid):
    _store['users'] = [u for u in _store['users'] if not (u['id'] == uid and u['role'] == 'user')]
    return jsonify({'success': True})

# ── ENROLLMENTS ───────────────────────────────────────────────────────────────
@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    return jsonify(_store['enrollments'])

@app.route('/api/enrollments', methods=['POST'])
def add_enrollment():
    d = request.json or {}
    e = {'id': _next_id('enrollments'), 'name': d.get('name'), 'email': d.get('email'),
         'phone': d.get('phone'), 'course': d.get('course'), 'course_id': d.get('courseId',''),
         'status': 'pending', 'date': '2026-01-01'}
    _store['enrollments'].append(e)
    return jsonify({'success': True})

@app.route('/api/enrollments/<int:eid>', methods=['PATCH'])
def update_enrollment(eid):
    d = request.json or {}
    for e in _store['enrollments']:
        if e['id'] == eid:
            e['status'] = d.get('status', e['status'])
    return jsonify({'success': True})

@app.route('/api/enrollments/<int:eid>', methods=['DELETE'])
def delete_enrollment(eid):
    _store['enrollments'] = [e for e in _store['enrollments'] if e['id'] != eid]
    return jsonify({'success': True})

# ── MASTERCLASSES ─────────────────────────────────────────────────────────────
@app.route('/api/masterclasses', methods=['GET'])
def get_masterclasses():
    return jsonify(_store['masterclasses'])

@app.route('/api/masterclasses', methods=['POST'])
def add_masterclass():
    d = request.json or {}
    m = {'id': _next_id('masterclasses'), **d}
    _store['masterclasses'].append(m)
    return jsonify({'success': True, 'id': m['id']})

@app.route('/api/masterclasses/<int:mid>', methods=['DELETE'])
def delete_masterclass(mid):
    _store['masterclasses'] = [m for m in _store['masterclasses'] if m['id'] != mid]
    return jsonify({'success': True})

# ── LIVE CLASSES ──────────────────────────────────────────────────────────────
@app.route('/api/liveclasses', methods=['GET'])
def get_liveclasses():
    return jsonify(_store['live_classes'])

@app.route('/api/liveclasses', methods=['POST'])
def add_liveclass():
    d = request.json or {}
    lc = {'id': _next_id('live_classes'), **d}
    _store['live_classes'].append(lc)
    return jsonify({'success': True, 'id': lc['id']})

@app.route('/api/liveclasses/<int:lid>', methods=['DELETE'])
def delete_liveclass(lid):
    _store['live_classes'] = [l for l in _store['live_classes'] if l['id'] != lid]
    return jsonify({'success': True})

# ── LMS ───────────────────────────────────────────────────────────────────────
@app.route('/api/lms', methods=['GET'])
def get_lms():
    return jsonify(_store['lms'])

@app.route('/api/lms/<course_id>', methods=['PUT'])
def save_lms(course_id):
    _store['lms'][course_id] = request.json or {}
    return jsonify({'success': True})

@app.route('/api/lms/<course_id>', methods=['DELETE'])
def delete_lms(course_id):
    _store['lms'].pop(course_id, None)
    return jsonify({'success': True})

# ── Handler for Vercel ────────────────────────────────────────────────────────
handler = app

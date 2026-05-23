/**
 * Arthrex AI — API Helper
 * Connects frontend to Flask + SQLite backend at http://localhost:5000
 * Falls back to localStorage if server is not running
 */

// Backend URL — auto-detect environment
const API_BASE = '/api';

async function apiCall(method, endpoint, body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return { ok: true, data };
  } catch (err) {
    console.warn('API unavailable, using localStorage fallback:', err.message);
    return { ok: false, error: err.message };
  }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function apiSignup(name, email, password, country, phone) {
  const res = await apiCall('POST', '/auth/signup', { name, email, password, country, phone });
  if (res.ok) {
    // Also save to localStorage as backup
    const signups = JSON.parse(localStorage.getItem('aai_signups') || '[]');
    signups.push({ id: Date.now(), name, email, password, country, phone: country + ' ' + phone,
      date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
      time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) });
    localStorage.setItem('aai_signups', JSON.stringify(signups));
  }
  return res;
}

async function apiLogin(email, password) {
  const res = await apiCall('POST', '/auth/login', { email, password });
  return res;
}

// ── SIGNUPS (admin) ───────────────────────────────────────────────────────────
async function apiGetSignups() {
  const res = await apiCall('GET', '/signups');
  if (res.ok) return res.data;
  // fallback to localStorage
  return JSON.parse(localStorage.getItem('aai_signups') || '[]');
}

async function apiDeleteSignup(id) {
  const res = await apiCall('DELETE', `/signups/${id}`);
  if (!res.ok) {
    // fallback
    const list = JSON.parse(localStorage.getItem('aai_signups') || '[]').filter(s => s.id !== id);
    localStorage.setItem('aai_signups', JSON.stringify(list));
  }
  return res;
}

// ── ENROLLMENTS ───────────────────────────────────────────────────────────────
async function apiGetEnrollments() {
  const res = await apiCall('GET', '/enrollments');
  if (res.ok) return res.data;
  return JSON.parse(localStorage.getItem('lf_enrollments') || '[]');
}

async function apiAddEnrollment(data) {
  const res = await apiCall('POST', '/enrollments', data);
  if (!res.ok) {
    const list = JSON.parse(localStorage.getItem('lf_enrollments') || '[]');
    list.push({ ...data, id: Date.now(), status: 'pending', date: new Date().toLocaleDateString() });
    localStorage.setItem('lf_enrollments', JSON.stringify(list));
  }
  return res;
}

async function apiUpdateEnrollment(id, status) {
  const res = await apiCall('PATCH', `/enrollments/${id}`, { status });
  if (!res.ok) {
    const list = JSON.parse(localStorage.getItem('lf_enrollments') || '[]');
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) { list[idx].status = status; localStorage.setItem('lf_enrollments', JSON.stringify(list)); }
  }
  return res;
}

// ── LMS ───────────────────────────────────────────────────────────────────────
async function apiGetLMS() {
  const res = await apiCall('GET', '/lms');
  if (res.ok) return res.data;
  return JSON.parse(localStorage.getItem('lf_lms') || '{}');
}

async function apiSaveLMSCourse(id, data) {
  const res = await apiCall('PUT', `/lms/${id}`, data);
  if (!res.ok) {
    const lms = JSON.parse(localStorage.getItem('lf_lms') || '{}');
    lms[id] = data;
    localStorage.setItem('lf_lms', JSON.stringify(lms));
  }
  return res;
}

async function apiDeleteLMSCourse(id) {
  const res = await apiCall('DELETE', `/lms/${id}`);
  if (!res.ok) {
    const lms = JSON.parse(localStorage.getItem('lf_lms') || '{}');
    delete lms[id];
    localStorage.setItem('lf_lms', JSON.stringify(lms));
  }
  return res;
}

// ── MASTERCLASSES ─────────────────────────────────────────────────────────────
async function apiGetMasterclasses() {
  const res = await apiCall('GET', '/masterclasses');
  if (res.ok) return res.data;
  return JSON.parse(localStorage.getItem('lf_masterclasses') || '[]');
}

async function apiAddMasterclass(data) {
  const res = await apiCall('POST', '/masterclasses', data);
  if (!res.ok) {
    const list = JSON.parse(localStorage.getItem('lf_masterclasses') || '[]');
    list.push({ ...data, id: Date.now() });
    localStorage.setItem('lf_masterclasses', JSON.stringify(list));
  }
  return res;
}

async function apiDeleteMasterclass(id) {
  const res = await apiCall('DELETE', `/masterclasses/${id}`);
  if (!res.ok) {
    const list = JSON.parse(localStorage.getItem('lf_masterclasses') || '[]').filter(m => m.id !== id);
    localStorage.setItem('lf_masterclasses', JSON.stringify(list));
  }
  return res;
}

// ── LIVE CLASSES ──────────────────────────────────────────────────────────────
async function apiGetLiveClasses() {
  const res = await apiCall('GET', '/liveclasses');
  if (res.ok) return res.data;
  return JSON.parse(localStorage.getItem('lf_liveclasses') || '[]');
}

async function apiAddLiveClass(data) {
  const res = await apiCall('POST', '/liveclasses', data);
  if (!res.ok) {
    const list = JSON.parse(localStorage.getItem('lf_liveclasses') || '[]');
    list.push({ ...data, id: Date.now() });
    localStorage.setItem('lf_liveclasses', JSON.stringify(list));
  }
  return res;
}

async function apiDeleteLiveClass(id) {
  const res = await apiCall('DELETE', `/liveclasses/${id}`);
  if (!res.ok) {
    const list = JSON.parse(localStorage.getItem('lf_liveclasses') || '[]').filter(l => l.id !== id);
    localStorage.setItem('lf_liveclasses', JSON.stringify(list));
  }
  return res;
}

console.log('✅ Arthrex AI API helper loaded. Backend: ' + API_BASE);

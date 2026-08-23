function normalizeEnrollment(e) {
  return {
    id: e.id,
    name: e.name || '',
    email: e.email || '',
    phone: e.phone || '—',
    course: e.course || '',
    courseId: e.courseId || e.course_id || '',
    status: (e.status || 'pending').toLowerCase(),
    date: e.date || e.created_at || ''
  };
}

function getEnrollmentsLocal() {
  return JSON.parse(localStorage.getItem('lf_enrollments') || '[]').map(normalizeEnrollment);
}
function saveEnrollments(list) {
  localStorage.setItem('lf_enrollments', JSON.stringify(list));
}

async function loadEnrollments() {
  try {
    if (typeof apiGetEnrollments === 'function') {
      const raw = await apiGetEnrollments();
      if (Array.isArray(raw)) {
        const list = raw.map(normalizeEnrollment);
        saveEnrollments(list);
        return list;
      }
    }
  } catch (err) {
    console.warn('Enrollment API unavailable, using localStorage', err);
  }
  return getEnrollmentsLocal();
}

async function renderAll() {
  const all = await loadEnrollments();
  const pending  = all.filter(e => e.status === 'pending');
  const approved = all.filter(e => e.status === 'approved');
  const rejected = all.filter(e => e.status === 'rejected');

  document.getElementById('pendingCount').textContent  = pending.length;
  document.getElementById('approvedCount').textContent = approved.length;
  document.getElementById('rejectedCount').textContent = rejected.length;

  renderList('pendingList',  pending,  true);
  renderList('approvedList', approved, false);
  renderList('rejectedList', rejected, false);
}

function renderList(containerId, list, showActions) {
  const el = document.getElementById(containerId);
  if (!list.length) { el.innerHTML = '<div class="empty-state">No records found.</div>'; return; }

  el.innerHTML = `
    <div class="table-head">
      <span>Name</span><span>Email</span><span>Phone</span><span>Course</span><span>Date</span><span>Status</span><span>Actions</span>
    </div>
    ${list.map(e => `
      <div class="table-row">
        <span>${e.name}</span>
        <span>${e.email}</span>
        <span>${e.phone}</span>
        <span class="course-cell">${e.course}</span>
        <span>${e.date}</span>
        <span class="status-pill status-${e.status}">${e.status}</span>
        <span class="action-btns">
          ${showActions ? `
            <button class="btn-approve" onclick="updateStatus(${e.id}, 'approved')">✅ Approve</button>
            <button class="btn-reject"  onclick="updateStatus(${e.id}, 'rejected')">❌ Reject</button>
          ` : ''}
          ${e.status === 'approved' ? `
            <button class="btn-edit-lms" onclick="editCourse('${e.courseId || ''}','${encodeURIComponent(e.course)}')">✏️ Edit LMS</button>
            <button class="btn-view-lms" onclick="window.open('lms.html?course=${encodeURIComponent(e.course)}&user=${encodeURIComponent(e.name)}&cid=${e.courseId||''}','_blank')">👁 View LMS</button>
          ` : ''}
        </span>
      </div>`).join('')}
  `;
}

async function updateStatus(id, status) {
  const list = getEnrollmentsLocal();
  const idx = list.findIndex(e => e.id === id);
  if (idx === -1) return;

  if (typeof apiUpdateEnrollment === 'function') {
    await apiUpdateEnrollment(id, status);
  }

  list[idx].status = status;
  if (status === 'approved') {
    const e = list[idx];
    // Prefer explicit courseId from marketing enrollment; else resolve by title
    if (e.courseId && String(e.courseId).match(/^\d+$/)) {
      // already a marketing course id — keep it
    } else if (!e.courseId) {
      const courseId = ensureCourseExists(e.course);
      list[idx].courseId = courseId;
    } else {
      list[idx].courseId = ensureCourseExists(e.course) || e.courseId;
    }
  }
  saveEnrollments(list);
  await renderAll();
}

// Auto-create / resolve course in LMS — prefer marketing catalog ids (1–8)
function ensureCourseExists(courseName) {
  const lms = JSON.parse(localStorage.getItem('lf_lms') || '{}');
  const existing = Object.entries(lms).find(([, c]) => c.name.toLowerCase() === courseName.toLowerCase());
  if (existing) return existing[0];

  // Map known marketing titles → stable course ids (same as main site COURSES)
  if (typeof findMarketingCourseByTitle === 'function') {
    const m = findMarketingCourseByTitle(courseName);
    if (m) {
      if (!lms[m.id]) {
        lms[m.id] = {
          id: m.id,
          name: m.title,
          category: m.category,
          duration: m.duration || 'Self-paced',
          topics: [], assignments: [], quizzes: [], projects: [], resources: []
        };
        localStorage.setItem('lf_lms', JSON.stringify(lms));
      }
      return m.id;
    }
  }

  const id = 'course_' + Date.now();
  lms[id] = {
    name: courseName,
    category: detectCategory(courseName),
    duration: 'Self-paced',
    topics: [], assignments: [], quizzes: [], projects: [], resources: []
  };
  localStorage.setItem('lf_lms', JSON.stringify(lms));
  return id;
}

function detectCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('agentic') || n.includes('agent')) return 'Agentic AI';
  if (n.includes('generative') || n.includes('genai') || n.includes('llm') || n.includes('gpt') || n.includes('rag') || n.includes('mcp') || n.includes('prompt')) return 'Generative AI';
  if (n.includes('data') || n.includes('excel') || n.includes('analytics') || n.includes('machine learning') || n.includes('deep learning') || n.includes('nlp')) return 'Data Science';
  if (n.includes('python') || n.includes('sql') || n.includes('nosql') || n.includes('database') || n.includes('programming')) return 'Programming';
  if (n.includes('domain') || n.includes('healthcare') || n.includes('finance') || n.includes('banking') || n.includes('retail') || n.includes('telecom') || n.includes('robotics') || n.includes('automation')) return 'Industry AI';
  return 'Generative AI';
}

function editCourse(courseId, encodedName) {
  const name = decodeURIComponent(encodedName);
  const lms = JSON.parse(localStorage.getItem('lf_lms') || '{}');
  // Find course by id or name
  let id = courseId;
  if (!id || !lms[id]) {
    const found = Object.entries(lms).find(([, c]) => c.name.toLowerCase() === name.toLowerCase());
    id = found ? found[0] : ensureCourseExists(name);
  }
  localStorage.setItem('lf_active_course', id);
  window.open('admin-lms.html', '_blank');
}

// Panel switching
document.querySelectorAll('.admin-nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    const panel = item.getAttribute('data-panel');
    document.getElementById('panel-' + panel).classList.add('active');

    // Reload data when switching panels
    if (panel === 'masterclasses') renderMasterclasses();
    if (panel === 'liveclasses') renderLiveClasses();
    if (panel === 'signups') renderSignups();
    if (panel === 'enrollments' || panel === 'approved' || panel === 'rejected') renderAll();
  });
});

renderAll();

// ===== MASTERCLASSES ADMIN =====
async function getMasterclasses() {
  try {
    const res = await fetch('/api/masterclasses');
    if (res.ok) {
      const data = await res.json();
      // Always sync localStorage with the authoritative API data
      localStorage.setItem('lf_masterclasses', JSON.stringify(data));
      return data;
    }
  } catch(e) {}
  // Fallback to localStorage if API is unreachable
  return JSON.parse(localStorage.getItem('lf_masterclasses') || '[]');
}
async function saveMasterclasses(list) {
  localStorage.setItem('lf_masterclasses', JSON.stringify(list));
}
function getMcRegistrations() {
  return JSON.parse(localStorage.getItem('lf_mc_registrations_detail') || '{}');
}

// Merge registrations from both sources
function getRegsForMc(mcId) {
  // From masterclasses.js registration flow
  const detail = JSON.parse(localStorage.getItem('lf_mc_registrations') || '{}');
  const byMc   = JSON.parse(localStorage.getItem('lf_mc_registrations_detail') || '{}');
  const regs = [];
  // lf_mc_registrations stores {mcId: {name,email,phone,registeredAt}}
  if (detail[mcId]) regs.push(detail[mcId]);
  // lf_mc_registrations_detail stores {mcId: [{...},...]}
  if (byMc[mcId]) regs.push(...byMc[mcId]);
  return regs;
}

document.getElementById('btnAddMasterclass').addEventListener('click', () => {
  document.getElementById('mcForm').style.display = 'block';
  document.getElementById('mcTitle').value = '';
  document.getElementById('mcTag').value = '';
  document.getElementById('mcDesc').value = '';
  document.getElementById('mcDuration').value = '';
  document.getElementById('mcInstructor').value = '';
  document.getElementById('mcInstructorBio').value = '';
  document.getElementById('mcSchedule').value = '';
  document.getElementById('mcLink').value = '';
  document.getElementById('mcThumb').value = '';
  document.getElementById('mcRating').value = '4.9';
  document.getElementById('mcLearnPoints').value = '';
  document.getElementById('mcForWhom').value = '';
  document.getElementById('mcForm').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btnSaveMc').addEventListener('click', async () => {
  const title = document.getElementById('mcTitle').value.trim();
  const schedule = document.getElementById('mcSchedule').value;
  if (!title) return alert('Title is required.');
  if (!schedule) return alert('Schedule date & time is required.');

  const mc = {
    title,
    tag: document.getElementById('mcTag').value.trim() || 'AI & ML',
    description: document.getElementById('mcDesc').value.trim(),
    duration: document.getElementById('mcDuration').value.trim() || '2 hrs',
    instructor: document.getElementById('mcInstructor').value.trim(),
    instructor_bio: document.getElementById('mcInstructorBio').value.trim(),
    schedule, link: document.getElementById('mcLink').value.trim(),
    thumb: document.getElementById('mcThumb').value.trim(),
    rating: parseFloat(document.getElementById('mcRating').value) || 4.9,
    learn_points: JSON.stringify(
      document.getElementById('mcLearnPoints').value.trim()
        .split('\n').map(s => s.trim()).filter(Boolean)
    ),
    for_whom: JSON.stringify(
      document.getElementById('mcForWhom').value.trim()
        .split('\n').map(s => s.trim()).filter(Boolean)
    ),
    createdAt: new Date().toISOString()
  };

  // Save to API and sync localStorage with the server response (which has the real id)
  let savedMc = null;
  try {
    const res = await fetch('/api/masterclasses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mc)
    });
    if (res.ok) {
      const result = await res.json();
      // Fetch the updated list from API so localStorage stays in sync
      const listRes = await fetch('/api/masterclasses');
      if (listRes.ok) {
        const updatedList = await listRes.json();
        localStorage.setItem('lf_masterclasses', JSON.stringify(updatedList));
        savedMc = updatedList.find(m => m.id === result.id) || updatedList[updatedList.length - 1];
      }
    }
  } catch(e) {}

  // Fallback: save to localStorage with a numeric timestamp id if API failed
  if (!savedMc) {
    const list = JSON.parse(localStorage.getItem('lf_masterclasses') || '[]');
    savedMc = { ...mc, id: Date.now() };
    list.push(savedMc);
    localStorage.setItem('lf_masterclasses', JSON.stringify(list));
  }

  document.getElementById('mcForm').style.display = 'none';
  renderMasterclasses();
});

async function deleteMasterclass(id) {
  if (!confirm('Delete this masterclass?')) return;
  // Delete from API
  try {
    await fetch(`/api/masterclasses/${id}`, { method: 'DELETE' });
    // Re-sync localStorage from API after deletion
    const listRes = await fetch('/api/masterclasses');
    if (listRes.ok) {
      const updatedList = await listRes.json();
      localStorage.setItem('lf_masterclasses', JSON.stringify(updatedList));
      document.getElementById('mcRegPanel').style.display = 'none';
      renderMasterclasses();
      return;
    }
  } catch(e) {}
  // Fallback: remove from localStorage only
  const list = JSON.parse(localStorage.getItem('lf_masterclasses') || '[]').filter(m => String(m.id) !== String(id));
  localStorage.setItem('lf_masterclasses', JSON.stringify(list));
  document.getElementById('mcRegPanel').style.display = 'none';
  renderMasterclasses();
}

// ── Analytics overview bar ────────────────────────────────────────────────────
async function renderMcAnalytics() {
  const list = await getMasterclasses();
  const totalRegs = list.reduce((s, m) => s + getRegsForMc(m.id).length, 0);
  const live = list.filter(m => { const d = new Date(m.schedule)-new Date(); return d<=0&&d>-10800000; }).length;
  const upcoming = list.filter(m => new Date(m.schedule) > new Date()).length;
  document.getElementById('mcAnalyticsBar').innerHTML = `
    <div class="mc-stat-bar">
      <div class="mc-stat-item"><strong>${list.length}</strong><span>Total Masterclasses</span></div>
      <div class="mc-stat-item live"><strong>${live}</strong><span>Live Now</span></div>
      <div class="mc-stat-item"><strong>${upcoming}</strong><span>Upcoming</span></div>
      <div class="mc-stat-item green"><strong>${totalRegs}</strong><span>Total Registrations</span></div>
    </div>`;
}

// ── Masterclass list ──────────────────────────────────────────────────────────
async function renderMasterclasses() {
  renderMcAnalytics();
  const list = await getMasterclasses();
  const el = document.getElementById('mcList');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No masterclasses yet. Create one!</div>';
    return;
  }
  el.innerHTML = list.map(m => {
    const schedDate = new Date(m.schedule);
    const diff = schedDate - new Date();
    const regs = getRegsForMc(m.id);
    let statusHtml = '';
    if (diff <= 0 && diff > -10800000) statusHtml = '<span class="mc-status-live">🔴 LIVE NOW</span>';
    else if (diff > 0) {
      const days=Math.floor(diff/86400000), hrs=Math.floor((diff%86400000)/3600000), mins=Math.floor((diff%3600000)/60000);
      statusHtml = `<span class="mc-status-upcoming">⏰ In ${days>0?days+'d ':''}${hrs}h ${mins}m</span>`;
    } else statusHtml = '<span class="mc-status-ended">✅ Ended</span>';

    return `
      <div class="mc-admin-card">
        <div class="mc-admin-info">
          <div class="mc-admin-top">
            <span class="mc-admin-tag">${m.tag}</span>
            ${statusHtml}
            <span class="mc-reg-chip" onclick="openMcRegistrations('${m.id}')">👥 ${regs.length} Registrations</span>
          </div>
          <h3>${m.title}</h3>
          <p>${m.description || ''}</p>
          <div class="mc-admin-meta">
            <span>📅 ${schedDate.toLocaleString()}</span>
            <span>⏱ ${m.duration}</span>
            <span>👨‍🏫 ${m.instructor || 'TBD'}</span>
            <span>⭐ ${m.rating}</span>
          </div>
        </div>
        <div class="mc-admin-actions">
          <button class="btn-view-regs" onclick="openMcRegistrations('${m.id}')">📋 View Registrations</button>
          ${m.link ? `<a href="${m.link}" target="_blank" class="btn-mc-link">🔗 Join Link</a>` : ''}
          <button class="btn-del" onclick="deleteMasterclass('${m.id}')">🗑 Delete</button>
        </div>
      </div>`;
  }).join('');
}

// ── Open registrations panel ──────────────────────────────────────────────────
async function openMcRegistrations(mcId) {
  const list = await getMasterclasses();
  const mc = list.find(m => m.id === mcId);
  const regs = getRegsForMc(mcId);
  const panel = document.getElementById('mcRegPanel');

  document.getElementById('mcRegPanelTitle').textContent = mc?.title || 'Registrations';
  document.getElementById('mcRegPanelCount').textContent = `${regs.length} registered`;
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });

  // Store current mcId for export
  panel.dataset.mcid = mcId;

  // Render chart
  renderMcRegChart(regs);

  // Stat boxes
  document.getElementById('mcStatBoxes').innerHTML = `
    <div class="mc-mini-stat"><strong>${regs.length}</strong><span>Total</span></div>
    <div class="mc-mini-stat green"><strong>${regs.filter(r=>r.registeredAt&&new Date(r.registeredAt)>new Date(Date.now()-86400000)).length}</strong><span>Last 24h</span></div>
    <div class="mc-mini-stat"><strong>${regs.filter(r=>r.phone&&r.phone!=='N/A').length}</strong><span>With Phone</span></div>`;

  // Table
  const tbody = document.getElementById('mcRegTableBody');
  if (!regs.length) {
    tbody.innerHTML = '<div class="empty-state">No registrations yet.</div>';
    return;
  }
  tbody.innerHTML = regs.map((r, i) => `
    <div class="mc-reg-row">
      <span>${r.name || '—'}</span>
      <span>${r.email || '—'}</span>
      <span>${r.phone || '—'}</span>
      <span>${r.registeredAt ? new Date(r.registeredAt).toLocaleString() : '—'}</span>
    </div>`).join('');
}

// ── Registration chart (SVG bar chart by day) ─────────────────────────────────
function renderMcRegChart(regs) {
  const svg = document.getElementById('mcRegChart');
  const labelsEl = document.getElementById('mcChartXLabels');

  if (!regs.length) {
    svg.innerHTML = '<text x="250" y="55" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="12" font-family="Inter">No registrations yet</text>';
    labelsEl.innerHTML = '';
    return;
  }

  // Group by day (last 7 days)
  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-IN', {day:'2-digit',month:'short'});
    days[key] = 0;
  }
  regs.forEach(r => {
    if (!r.registeredAt) return;
    const key = new Date(r.registeredAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short'});
    if (days[key] !== undefined) days[key]++;
  });

  const labels = Object.keys(days);
  const values = Object.values(days);
  const maxVal = Math.max(...values, 1);
  const W = 500, H = 100, pad = 20;
  const barW = (W - pad * 2) / labels.length - 6;

  svg.innerHTML = labels.map((label, i) => {
    const barH = ((values[i] / maxVal) * (H - pad - 20)) || 2;
    const x = pad + i * ((W - pad * 2) / labels.length);
    const y = H - pad - barH;
    const color = values[i] > 0 ? '#7c3aed' : 'rgba(255,255,255,0.08)';
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${color}" opacity="0.85"/>
      ${values[i] > 0 ? `<text x="${x + barW/2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.7)" font-family="Inter">${values[i]}</text>` : ''}`;
  }).join('');

  labelsEl.innerHTML = labels.map(l => `<span>${l}</span>`).join('');
}

// ── Export to Excel (CSV) ─────────────────────────────────────────────────────
document.getElementById('btnExportExcel').addEventListener('click', async () => {
  const mcId = document.getElementById('mcRegPanel').dataset.mcid;
  const list = await getMasterclasses();
  const mc = list.find(m => String(m.id) === String(mcId));
  const regs = getRegsForMc(mcId);

  if (!regs.length) return alert('No registrations to export.');

  const headers = ['Name', 'Email', 'Phone', 'Registered At', 'Masterclass', 'Scheduled'];
  const rows = regs.map(r => [
    r.name || '',
    r.email || '',
    r.phone || '',
    r.registeredAt ? new Date(r.registeredAt).toLocaleString() : '',
    mc?.title || '',
    mc?.schedule ? new Date(mc.schedule).toLocaleString() : ''
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(mc?.title || 'masterclass').replace(/\s+/g,'_')}_registrations.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// Auto-refresh every minute
setInterval(() => {
  if (document.getElementById('panel-masterclasses').classList.contains('active')) {
    renderMasterclasses();
  }
}, 60000);

// ===== LIVE CLASSES ADMIN =====
function getLiveClasses() {
  return JSON.parse(localStorage.getItem('lf_liveclasses') || '[]');
}
function saveLiveClasses(list) {
  localStorage.setItem('lf_liveclasses', JSON.stringify(list));
}

document.getElementById('btnAddLiveClass').addEventListener('click', () => {
  document.getElementById('lcForm').style.display = 'block';
  ['lcTitle','lcTag','lcDesc','lcDuration','lcInstructor','lcLink','lcThumb'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('lcDate').value = '';
  document.getElementById('lcStartTime').value = '';
  document.getElementById('lcEndTime').value = '';
  document.getElementById('lcForm').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btnSaveLc').addEventListener('click', () => {
  const title     = document.getElementById('lcTitle').value.trim();
  const date      = document.getElementById('lcDate').value;
  const startTime = document.getElementById('lcStartTime').value;
  const endTime   = document.getElementById('lcEndTime').value;

  if (!title)     return alert('Title is required.');
  if (!date)      return alert('Please select a date.');
  if (!startTime) return alert('Please set a start time.');

  // Combine date + startTime into ISO-compatible datetime string
  const schedule = `${date}T${startTime}`;

  // Auto-calculate duration from start/end if not manually set
  let duration = document.getElementById('lcDuration').value.trim();
  if (!duration && endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMins > 0) {
      const hrs  = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      duration = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hr${hrs > 1 ? 's' : ''}`) : `${mins} mins`;
    }
  }
  if (!duration) duration = '2 hrs';

  const list = getLiveClasses();
  list.push({
    id: 'lc_' + Date.now(), title,
    tag:        document.getElementById('lcTag').value.trim() || 'AI & ML',
    description:document.getElementById('lcDesc').value.trim(),
    duration,
    instructor: document.getElementById('lcInstructor').value.trim(),
    schedule,
    startTime,
    endTime:    endTime || '',
    link:       document.getElementById('lcLink').value.trim(),
    thumb:      document.getElementById('lcThumb').value.trim(),
    createdAt:  new Date().toISOString()
  });
  saveLiveClasses(list);
  document.getElementById('lcForm').style.display = 'none';
  renderLiveClasses();
});

function deleteLiveClass(id) {
  if (!confirm('Delete this live class?')) return;
  saveLiveClasses(getLiveClasses().filter(l => l.id !== id));
  renderLiveClasses();
}

function getLcStatus(scheduleStr) {
  const diff = new Date(scheduleStr) - new Date();
  if (diff <= 0 && diff > -10800000) return 'live';
  if (diff > 0) return 'upcoming';
  return 'ended';
}

function renderLiveClasses() {
  const list = getLiveClasses();
  const el = document.getElementById('lcList');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No live classes yet. Add one!</div>';
    return;
  }
  el.innerHTML = list.map(lc => {
    const schedDate = new Date(lc.schedule);
    const diff = schedDate - new Date();
    const status = getLcStatus(lc.schedule);
    let statusHtml = '';
    if (status === 'live') statusHtml = '<span class="mc-status-live">🔴 LIVE NOW</span>';
    else if (status === 'upcoming') {
      const days=Math.floor(diff/86400000), hrs=Math.floor((diff%86400000)/3600000), mins=Math.floor((diff%3600000)/60000);
      statusHtml = `<span class="mc-status-upcoming">⏰ In ${days>0?days+'d ':''}${hrs}h ${mins}m</span>`;
    } else statusHtml = '<span class="mc-status-ended">✅ Ended</span>';

    return `
      <div class="mc-admin-card">
        <div class="mc-admin-info">
          <div class="mc-admin-top">
            <span class="mc-admin-tag">${lc.tag}</span>
            ${statusHtml}
          </div>
          <h3>${lc.title}</h3>
          <p>${lc.description || ''}</p>
          <div class="mc-admin-meta">
            <span>📅 ${schedDate.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
            <span>🕐 ${schedDate.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}${lc.endTime ? ` → ${lc.endTime}` : ''}</span>
            <span>⏱ ${lc.duration}</span>
            <span>👨‍🏫 ${lc.instructor || 'TBD'}</span>
            ${lc.thumb ? `<span>🖼 Thumbnail set</span>` : ''}
          </div>
        </div>
        <div class="mc-admin-actions">
          ${lc.link ? `<a href="${lc.link}" target="_blank" class="btn-mc-link">🔗 Join Link</a>` : ''}
          <button class="btn-del" onclick="deleteLiveClass('${lc.id}')">🗑 Delete</button>
        </div>
      </div>`;
  }).join('');
}

// Auto-refresh every minute
setInterval(() => {
  if (document.getElementById('panel-liveclasses').classList.contains('active')) {
    renderLiveClasses();
  }
}, 60000);

// ===== INIT =====
renderMasterclasses();
renderLiveClasses();


// =====================================================
//  SIGN UP DASHBOARD
// =====================================================

function getSignups() {
  return JSON.parse(localStorage.getItem('aai_signups') || '[]');
}

function renderSignups(filter = '') {
  const all = getSignups();
  const filtered = filter
    ? all.filter(s =>
        s.name.toLowerCase().includes(filter) ||
        s.email.toLowerCase().includes(filter) ||
        (s.phone || '').toLowerCase().includes(filter)
      )
    : all;

  document.getElementById('signupsCount').textContent = all.length;
  const el = document.getElementById('signupsList');

  if (!filtered.length) {
    el.innerHTML = '<div class="empty-state">No sign ups found.</div>';
    return;
  }

  el.innerHTML = `
    <div class="table-head">
      <span>#</span>
      <span>Name</span>
      <span>Email</span>
      <span>Phone</span>
      <span>Date</span>
      <span>Time</span>
      <span>Actions</span>
    </div>
    ${filtered.map((s, i) => `
      <div class="table-row">
        <span>${i + 1}</span>
        <span><strong style="color:#e2e8f0">${s.name}</strong></span>
        <span>${s.email}</span>
        <span>${s.phone || '—'}</span>
        <span>${s.date || '—'}</span>
        <span>${s.time || '—'}</span>
        <span class="action-btns">
          <button class="btn-reject" onclick="deleteSignup(${s.id})">🗑 Delete</button>
        </span>
      </div>`).join('')}
  `;
}

function deleteSignup(id) {
  if (!confirm('Delete this sign up?')) return;
  const list = getSignups().filter(s => s.id !== id);
  localStorage.setItem('aai_signups', JSON.stringify(list));
  renderSignups();
}

function clearSignups() {
  if (!confirm('Clear ALL sign ups? This cannot be undone.')) return;
  localStorage.removeItem('aai_signups');
  renderSignups();
}

function exportSignups() {
  const all = getSignups();
  if (!all.length) { alert('No sign ups to export.'); return; }
  const header = ['#', 'Name', 'Email', 'Phone', 'Date', 'Time'];
  const rows = all.map((s, i) => [i + 1, s.name, s.email, s.phone || '', s.date || '', s.time || '']);
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'athrexai-signups.csv';
  a.click();
}

// Search filter
const signupSearchEl = document.getElementById('signupSearch');
if (signupSearchEl) {
  signupSearchEl.addEventListener('input', e => renderSignups(e.target.value.trim().toLowerCase()));
}

// Render on load if panel is active
document.addEventListener('DOMContentLoaded', () => {
  const activePanel = document.querySelector('.admin-panel.active');
  if (activePanel && activePanel.id === 'panel-signups') renderSignups();
});

// Hook into panel switching to render signups when tab is clicked
document.querySelectorAll('.admin-nav-item[data-panel="signups"]').forEach(el => {
  el.addEventListener('click', () => renderSignups());
});

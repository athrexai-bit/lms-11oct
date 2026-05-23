// ===== FREE MASTERCLASSES — Dynamic Frontend Renderer =====
const MC_STORAGE_KEY = 'lf_masterclasses';

async function getMasterclasses() {
  // Try API first
  try {
    const res = await fetch('/api/masterclasses');
    if (res.ok) {
      const data = await res.json();
      // Sync to localStorage as cache
      localStorage.setItem(MC_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch(e) {}
  // Fallback to localStorage
  return JSON.parse(localStorage.getItem(MC_STORAGE_KEY) || '[]');
}

// ── Status helpers ────────────────────────────────────────────────────────────
function getMcStatus(scheduleStr) {
  const sched = new Date(scheduleStr);
  const now = new Date();
  const diff = sched - now;
  if (diff <= 0 && diff > -10800000) return 'live';   // live for 3 hrs after start
  if (diff > 0) return 'upcoming';
  return 'ended';
}

function getCountdown(scheduleStr) {
  const diff = new Date(scheduleStr) - new Date();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  if (hrs > 0)  return `${hrs}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

function starRating(r) {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

// ── Render all dynamic masterclass cards ─────────────────────────────────────
async function renderDynamicMasterclasses() {
  const container = document.getElementById('dynamicMasterclasses');
  if (!container) return;

  const list = (await getMasterclasses()).filter(m => getMcStatus(m.schedule) !== 'ended');
  if (!list.length) { container.innerHTML = ''; return; }

  container.innerHTML = list.map(m => {
    const status = getMcStatus(m.schedule);
    const countdown = getCountdown(m.schedule);
    const schedDate = new Date(m.schedule);

    return `
      <div class="master-card mc-dynamic-card" data-mcid="${m.id}">
        <div class="card-thumb mc-thumb" style="background:linear-gradient(135deg,#7c3aed,#2563eb)">
          <div class="mc-thumb-overlay"></div>
          ${status === 'live'
            ? `<span class="mc-live-badge">🔴 LIVE NOW</span>`
            : `<span class="mc-upcoming-badge">⏰ Upcoming</span>`}
          <div class="mc-countdown-wrap" id="mccountdown-${m.id}">
            ${status === 'live'
              ? `<span class="mc-live-text">Join Now</span>`
              : countdown ? `<span class="mc-countdown">${countdown}</span>` : ''}
          </div>
          <div class="mc-thumb-title">${m.title}</div>
        </div>
        <div class="card-body">
          <span class="tag free-tag">FREE</span>
          <h3>${m.title}</h3>
          <p>${m.description || 'Join this free live masterclass.'}</p>
          <div class="card-meta">
            <span>⏱ ${m.duration}</span>
            <span>⭐ ${m.rating}</span>
            ${m.instructor ? `<span>👨‍🏫 ${m.instructor}</span>` : ''}
          </div>
          <div class="mc-schedule-row">
            <span class="mc-date">📅 ${schedDate.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
            <span class="mc-time">🕐 ${schedDate.toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}</span>
          </div>
          ${status === 'live'
            ? `<a href="#" class="btn-enroll mc-join-btn" onclick="openMcRegModal('${m.id}','${m.title.replace(/'/g,"\\'")}','${m.link || ''}');return false;">🔴 Join Live Now</a>`
            : `<a href="#" class="btn-enroll" onclick="enrollMasterclass('${m.id}','${m.title.replace(/'/g,"\\'")}');return false;">Register Now</a>`}
        </div>
      </div>`;
  }).join('');
}

// ── Registration modal logic ──────────────────────────────────────────────────
let _activeMcId = null;
let _activeMcLink = null;

function openMcRegModal(mcId, title, link) {
  _activeMcId = mcId;
  _activeMcLink = link;

  // Check if already registered
  const regs = JSON.parse(localStorage.getItem('lf_mc_registrations') || '{}');
  if (regs[mcId]) {
    // Already registered — go straight to link
    if (link) window.open(link, '_blank');
    else alert('Join link not available yet. Please check back shortly.');
    return;
  }

  document.getElementById('mcRegTitle').textContent = title;
  document.getElementById('mcRegName').value = '';
  document.getElementById('mcRegEmail').value = '';
  document.getElementById('mcRegPhone').value = '';
  document.getElementById('mcRegCountry').value = '';
  document.getElementById('mcRegError').style.display = 'none';
  document.getElementById('mcRegModal').classList.add('active');
}

document.getElementById('closeMcRegModal').addEventListener('click', () => {
  document.getElementById('mcRegModal').classList.remove('active');
});
document.getElementById('mcRegModal').addEventListener('click', e => {
  if (e.target === document.getElementById('mcRegModal'))
    document.getElementById('mcRegModal').classList.remove('active');
});

document.getElementById('btnMcRegSubmit').addEventListener('click', async () => {
  const name    = document.getElementById('mcRegName').value.trim();
  const email   = document.getElementById('mcRegEmail').value.trim();
  const phone   = document.getElementById('mcRegPhone').value.trim();
  const country = document.getElementById('mcRegCountry').value.trim();
  const errEl   = document.getElementById('mcRegError');

  if (!name || !email) {
    errEl.textContent = 'Name and email are required.';
    errEl.style.display = 'block';
    return;
  }

  // Save registration — both flat and per-masterclass
  const regs = JSON.parse(localStorage.getItem('lf_mc_registrations') || '{}');
  regs[_activeMcId] = { name, email, phone, country, registeredAt: new Date().toISOString() };
  localStorage.setItem('lf_mc_registrations', JSON.stringify(regs));

  // Per-masterclass detail list (for admin analytics)
  const detail = JSON.parse(localStorage.getItem('lf_mc_registrations_detail') || '{}');
  if (!detail[_activeMcId]) detail[_activeMcId] = [];
  // Avoid duplicate email
  if (!detail[_activeMcId].find(r => r.email === email)) {
    detail[_activeMcId].push({ name, email, phone, country, registeredAt: new Date().toISOString() });
  }
  localStorage.setItem('lf_mc_registrations_detail', JSON.stringify(detail));

  // Also save to enrollments for admin visibility
  const enrollments = JSON.parse(localStorage.getItem('lf_enrollments') || '[]');
  const list = await getMasterclasses();
  const mc = list.find(m => m.id === _activeMcId);
  enrollments.push({
    id: Date.now(),
    name, email, phone, country,
    course: mc?.title || 'Masterclass',
    status: 'approved',
    date: new Date().toLocaleDateString('en-IN')
  });
  localStorage.setItem('lf_enrollments', JSON.stringify(enrollments));

  document.getElementById('mcRegModal').classList.remove('active');

  // Redirect to join link
  if (_activeMcLink) {
    window.open(_activeMcLink, '_blank');
  } else {
    alert('✅ Registered! The join link will be shared by the instructor shortly.');
  }
});

async function enrollMasterclass(id, title) {
  const list = await getMasterclasses();
  const mc = list.find(m => m.id === id);
  openMcRegModal(id, title, mc?.link || '');
}

// ── Tick: update countdowns every second ─────────────────────────────────────
const _prevStatus = {};
async function tickCountdowns() {
  const list = await getMasterclasses();
  let needsRerender = false;

  list.forEach(m => {
    const status = getMcStatus(m.schedule);
    if (_prevStatus[m.id] !== undefined && _prevStatus[m.id] !== status) {
      needsRerender = true;
    }
    _prevStatus[m.id] = status;

    const el = document.getElementById(`mccountdown-${m.id}`);
    if (!el) return;
    const countdown = getCountdown(m.schedule);
    if (status === 'live') {
      el.innerHTML = `<span class="mc-live-text">Join Now</span>`;
    } else if (countdown) {
      el.innerHTML = `<span class="mc-countdown">${countdown}</span>`;
    }
  });

  if (needsRerender) renderDynamicMasterclasses();
}

// ── Init ──────────────────────────────────────────────────────────────────────
renderDynamicMasterclasses();

getMasterclasses().then(list => {
  list.forEach(m => { _prevStatus[m.id] = getMcStatus(m.schedule); });
});

setInterval(tickCountdowns, 1000);

// Re-render if admin updates masterclasses in another tab
window.addEventListener('storage', e => {
  if (e.key === MC_STORAGE_KEY) renderDynamicMasterclasses();
});

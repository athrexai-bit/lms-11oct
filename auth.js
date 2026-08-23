// ===== ATHREXAI — AUTH & ACCESS CONTROL =====

// Demo credentials
const DEMO_USERS = {
  'user@athrexai.com':  { password: 'user123',  role: 'user',  name: 'User' },
  'admin@athrexai.com': { password: 'admin123', role: 'admin', name: 'Admin' },
};

let selectedRole = 'user'; // role chosen in login modal

// ── Session helpers ───────────────────────────────────────────────────────────
function getSession() {
  return JSON.parse(localStorage.getItem('aai_session') || 'null');
}
function saveSession(data) {
  localStorage.setItem('aai_session', JSON.stringify(data));
}
function clearSession() {
  localStorage.removeItem('aai_session');
}
function isAdmin() {
  const s = getSession();
  return s && s.role === 'admin';
}
function isLoggedIn() {
  return !!getSession();
}

// ── Role selector in modal ────────────────────────────────────────────────────
function selectRole(role) {
  selectedRole = role;
  const roleUser = document.getElementById('roleUser');
  const roleAdmin = document.getElementById('roleAdmin');
  if (roleUser) roleUser.classList.toggle('active', role === 'user');
  if (roleAdmin) roleAdmin.classList.toggle('active', role === 'admin');
}

// ── Open / close login modal ──────────────────────────────────────────────────
document.getElementById('btnLogin').addEventListener('click', openLoginModal);
document.getElementById('closeLoginModal').addEventListener('click', closeLoginModal);
document.getElementById('loginModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('loginModal')) closeLoginModal();
});

function openLoginModal() {
  document.getElementById('authError').style.display = 'none';
  document.getElementById('signupError').style.display = 'none';
  document.getElementById('auth_email').value = '';
  document.getElementById('auth_password').value = '';
  selectRole('user');
  switchAuthTab('signup');
  document.getElementById('loginModal').classList.add('active');
}
function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active');
}

// ── Submit login ──────────────────────────────────────────────────────────────
document.getElementById('btnAuthSubmit').addEventListener('click', async () => {
  const email    = document.getElementById('auth_email').value.trim().toLowerCase();
  const password = document.getElementById('auth_password').value;
  const errEl    = document.getElementById('authError');

  if (!email || !password) {
    errEl.textContent = '❌ Please enter email and password.';
    errEl.style.display = 'block'; return;
  }

  // Try API login first
  if (typeof apiLogin !== 'undefined') {
    const res = await apiLogin(email, password);
    if (res.ok) {
      saveSession({ email, role: res.data.role, name: res.data.name });
      closeLoginModal();
      applyAccessControl();
      return;
    }
    // If server is unavailable, fall back to local demo credentials / signups.
    const isServerUnavailable = res.error && /unavailable|failed to fetch|networkerror/i.test(res.error);
    if (res.error && !isServerUnavailable) {
      errEl.textContent = '❌ ' + res.error;
      errEl.style.display = 'block'; return;
    }
    if (isServerUnavailable) {
      console.warn('Backend unavailable, falling back to demo/offline login.');
    }
  }

  // localStorage fallback — check demo users
  const demoMatch = DEMO_USERS[email];
  if (demoMatch && demoMatch.password === password) {
    saveSession({ email, role: demoMatch.role, name: demoMatch.name });
    closeLoginModal();
    applyAccessControl();
    return;
  }

  // Check registered users in localStorage
  const signups = JSON.parse(localStorage.getItem('aai_signups') || '[]');
  const regUser = signups.find(s => s.email === email && s.password === password);
  if (regUser) {
    saveSession({ email, role: 'user', name: regUser.name });
    closeLoginModal();
    applyAccessControl();
    return;
  }

  errEl.textContent = '❌ Invalid email or password. If the backend is offline, use admin@athrexai.com / admin123 or start the server at localhost:8000.';
  errEl.style.display = 'block';
});

// ── Logout ────────────────────────────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', () => {
  clearSession();
  applyAccessControl();
});

// ── Apply access control to the whole page ───────────────────────────────────
function applyAccessControl() {
  const session = getSession();
  const loggedIn = !!session;
  const admin    = loggedIn && session.role === 'admin';

  // Topbar
  document.getElementById('btnLogin').style.display   = loggedIn ? 'none'  : 'flex';
  document.getElementById('userAvatar').style.display = loggedIn ? 'flex'  : 'none';
  document.getElementById('btnLogout').style.display  = loggedIn ? 'flex'  : 'none';

  if (loggedIn) {
    const initials = session.name.slice(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userAvatar').title = `${session.name} (${session.role})`;
    // Add role badge colour
    document.getElementById('userAvatar').className =
      'user-avatar' + (admin ? ' avatar-admin' : ' avatar-user');
  }

  // Admin Panel nav item — only visible to admins
  const adminNavLink = document.querySelector('.admin-link');
  if (adminNavLink) adminNavLink.style.display = admin ? 'flex' : 'none';

  // ⚙️ Manage in LMS Admin button
  const manageBtn = document.querySelector('.btn-manage-courses');
  if (manageBtn) manageBtn.style.display = admin ? 'inline-flex' : 'none';

  // Admin-only link in empty courses state
  const emptyAdminLink = document.getElementById('emptyAdminLink');
  if (emptyAdminLink) emptyAdminLink.style.display = admin ? 'inline-flex' : 'none';

  // ✏️ Edit buttons on My Courses cards (rendered dynamically — handled in dashboard-courses.js)
  document.querySelectorAll('.btn-edit-course').forEach(btn => {
    btn.style.display = admin ? 'inline-flex' : 'none';
  });

  // Hide/show enroll buttons based on login state
  // (users must be logged in to enroll — optional UX choice)
  // document.querySelectorAll('.btn-enroll').forEach(btn => {
  //   btn.style.display = loggedIn ? 'inline-flex' : 'inline-flex'; // keep visible for now
  // });
}

// ── Patch dashboard-courses to respect admin flag ────────────────────────────
// Called after dynamic course cards are rendered
window.onCoursesRendered = function() {
  document.querySelectorAll('.btn-edit-course').forEach(btn => {
    btn.style.display = isAdmin() ? 'inline-flex' : 'none';
  });
};

// ── Init on page load ─────────────────────────────────────────────────────────
applyAccessControl();


// ── Tab switcher (Signup / Login) ─────────────────────────────────────────────
function switchAuthTab(tab) {
  const isSignup = tab === 'signup';

  document.getElementById('tabSignup').classList[isSignup ? 'add' : 'remove']('active');
  document.getElementById('tabLogin').classList[isSignup ? 'remove' : 'add']('active');

  const sf = document.getElementById('formSignup');
  const lf = document.getElementById('formLogin');

  sf.style.cssText = isSignup ? 'display:flex;flex-direction:column;gap:14px' : 'display:none';
  lf.style.cssText = isSignup ? 'display:none' : 'display:flex;flex-direction:column;gap:14px';

  document.getElementById('signupError').style.display = 'none';
  document.getElementById('authError').style.display   = 'none';
}

// ── Signup submit ─────────────────────────────────────────────────────────────
document.getElementById('btnSignupSubmit').addEventListener('click', async () => {
  const name     = document.getElementById('signup_name').value.trim();
  const email    = document.getElementById('signup_email').value.trim().toLowerCase();
  const country  = document.getElementById('signup_country').value;
  const phone    = document.getElementById('signup_phone').value.trim();
  const password = document.getElementById('signup_password').value;
  const errEl    = document.getElementById('signupError');

  if (!name || !email || !phone || !password) {
    errEl.textContent = '❌ Please fill in all fields.';
    errEl.style.display = 'block'; return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = '❌ Please enter a valid email address.';
    errEl.style.display = 'block'; return;
  }
  if (!/^\d{6,15}$/.test(phone)) {
    errEl.textContent = '❌ Please enter a valid phone number.';
    errEl.style.display = 'block'; return;
  }
  if (password.length < 6) {
    errEl.textContent = '❌ Password must be at least 6 characters.';
    errEl.style.display = 'block'; return;
  }

  errEl.style.display = 'none';

  // Try API first, fallback to localStorage
  if (typeof apiSignup !== 'undefined') {
    const res = await apiSignup(name, email, password, country, phone);
    if (!res.ok) {
      errEl.textContent = '❌ ' + (res.error || 'Registration failed.');
      errEl.style.display = 'block'; return;
    }
  } else {
    // localStorage fallback
    const signups = JSON.parse(localStorage.getItem('aai_signups') || '[]');
    if (signups.find(s => s.email === email)) {
      errEl.textContent = '❌ This email is already registered. Please sign in.';
      errEl.style.display = 'block'; return;
    }
    signups.push({ id: Date.now(), name, email, password, country,
      phone: country + ' ' + phone,
      date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
      time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) });
    localStorage.setItem('aai_signups', JSON.stringify(signups));
  }

  saveSession({ email, role: 'user', name });
  closeLoginModal();
  applyAccessControl();
});

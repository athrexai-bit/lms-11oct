// Enroll modal — professional programs redirect to main site detail.
// Soft/demo enroll that skips approval is not used for marketing courses.

const modal = document.getElementById('enrollModal');
const closeModal = document.getElementById('closeModal');
const modalCourseName = document.getElementById('modalCourseName');
const modalSuccess = document.getElementById('modalSuccess');

let currentCourse = '';
let currentCourseId = '';

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-enroll');
  if (!btn) return;
  if (btn.closest('.mc-dynamic-card')) return;
  if (btn.getAttribute('onclick')) return;
  // Real main-site hrefs navigate normally
  if (btn.getAttribute('href') && !btn.getAttribute('href').startsWith('#')) return;

  const card = btn.closest('.master-card, .course-card, .live-card');
  const title = card ? card.querySelector('h3')?.textContent?.trim() : '';
  const mainId = card?.getAttribute('data-main-course') || '';

  if (typeof openMainSiteCourse === 'function') {
    if (mainId && openMainSiteCourse(mainId)) {
      e.preventDefault();
      return;
    }
    if (title && openMainSiteCourse(title)) {
      e.preventDefault();
      return;
    }
  }

  // Non-catalog cards → main site course browse (no soft-enroll bypass)
  e.preventDefault();
  window.location.href = (typeof MAIN_SITE_ORIGIN !== 'undefined' ? MAIN_SITE_ORIGIN : location.origin) + '/index.html?view=courses';
});

closeModal?.addEventListener('click', () => modal?.classList.remove('active'));
modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.getAttribute('data-tab');
    document.querySelectorAll('.modal-form').forEach(f => f.style.display = 'none');
    document.getElementById(target + 'Form').style.display = 'flex';
  });
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const courseTitle = document.getElementById('reg_course').value || currentCourse;
  const matched = typeof findMarketingCourseByTitle === 'function'
    ? findMarketingCourseByTitle(courseTitle)
    : null;
  const enrollment = {
    name: document.getElementById('reg_name').value,
    email: document.getElementById('reg_email').value,
    phone: document.getElementById('reg_phone').value,
    country: document.getElementById('reg_country').value,
    course: courseTitle,
    courseId: matched?.id || currentCourseId || '',
    status: 'pending',
    date: new Date().toLocaleDateString('en-IN')
  };
  await saveEnrollment(enrollment);
  showSuccess();
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login_email').value;
  const enrollments = getEnrollments();
  const user = enrollments.find(en => en.email === email && (!currentCourse || en.course === currentCourse));
  if (user) {
    if (user.status === 'approved') {
      const matched = typeof findMarketingCourseByTitle === 'function'
        ? findMarketingCourseByTitle(user.course)
        : null;
      const cid = user.courseId || matched?.id || '';
      if (cid && typeof mainSiteCourseUrl === 'function') {
        window.location.href = mainSiteCourseUrl(cid);
      } else {
        window.location.href = `lms.html?course=${encodeURIComponent(user.course)}&user=${encodeURIComponent(user.name)}&cid=${encodeURIComponent(cid)}`;
      }
    } else if (user.status === 'pending') {
      alert('⏳ Your enrollment is pending admin approval.');
    } else {
      alert('❌ Your enrollment was rejected. Please request access again from the course page.');
    }
  } else {
    const matched = typeof findMarketingCourseByTitle === 'function'
      ? findMarketingCourseByTitle(currentCourse)
      : null;
    const enrollment = {
      name: email.split('@')[0],
      email,
      phone: 'N/A',
      course: currentCourse,
      courseId: matched?.id || currentCourseId || '',
      status: 'pending',
      date: new Date().toLocaleDateString('en-IN')
    };
    await saveEnrollment(enrollment);
    showSuccess();
  }
});

async function saveEnrollment(enrollment) {
  if (typeof apiAddEnrollment === 'function') {
    await apiAddEnrollment(enrollment);
    return;
  }
  const list = getEnrollments();
  list.push({ ...enrollment, id: Date.now(), status: 'pending' });
  localStorage.setItem('lf_enrollments', JSON.stringify(list));
}

function getEnrollments() {
  return JSON.parse(localStorage.getItem('lf_enrollments') || '[]');
}

function showSuccess() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'none';
  modalSuccess.style.display = 'block';
  modalSuccess.innerHTML = `
    <div style="text-align:center;padding:24px">
      <div style="font-size:40px;margin-bottom:12px">⏳</div>
      <h3 style="margin:0 0 8px">Enrollment Submitted</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.5;margin:0 0 16px">
        Status is <strong>pending</strong>. Start Learning unlocks after an admin approves your enrollment.
      </p>
      <button type="button" class="btn-enroll" onclick="document.getElementById('enrollModal').classList.remove('active')">Got it</button>
    </div>`;
}

// My Courses — progress for seeded LMS courses; open learning via main-site path
const gradients = [
  'linear-gradient(135deg,#0b5fff,#2563eb)',
  'linear-gradient(135deg,#1e40af,#3b82f6)',
  'linear-gradient(135deg,#0739a8,#0b5fff)',
  'linear-gradient(135deg,#1e3a5f,#2563eb)',
  'linear-gradient(135deg,#2563eb,#60a5fa)',
  'linear-gradient(135deg,#0ea5e9,#2563eb)',
];

const categoryIcons = {
  'Generative AI': '✨', 'Agentic AI': '🤖', 'Data Science': '🔬',
  'Data Analytics': '📊', 'AI & Machine Learning': '🧠',
  'DevOps & AWS': '☁️', 'Software Development': '🛠',
  'Domain AI': '🏭', 'LLM': '🧠', 'RAG': '🔗', 'MCP': '🔌', 'default': '📚'
};

function loadDashboardCourses() {
  const lmsData = JSON.parse(localStorage.getItem('lf_lms') || '{}');
  const courses = Object.entries(lmsData);

  const grid = document.getElementById('myCoursesGrid');
  const empty = document.getElementById('myCoursesEmpty');
  const countBadge = document.getElementById('myCoursesCount');
  if (!grid) return;

  if (!courses.length) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    if (countBadge) countBadge.style.display = 'none';
    updateWelcomeStats(0, 0, 0);
    return;
  }

  if (empty) empty.style.display = 'none';
  if (countBadge) {
    countBadge.style.display = 'inline-block';
    countBadge.textContent = courses.length;
  }

  let totalPct = 0, completed = 0;
  courses.forEach(([id, course]) => {
    const totalLessons = (course.topics || []).reduce((s, t) => s + (t.lessons || []).length, 0);
    const progress = JSON.parse(localStorage.getItem(`lf_progress_${id}`) || '[]');
    const pct = totalLessons ? Math.round((progress.length / totalLessons) * 100) : 0;
    totalPct += pct;
    if (pct === 100) completed++;
  });
  const avgPct = courses.length ? Math.round(totalPct / courses.length) : 0;
  updateWelcomeStats(courses.length, completed, avgPct);

  grid.innerHTML = courses.map(([id, course], idx) => {
    const icon = categoryIcons[course.category] || categoryIcons.default;
    const gradient = gradients[idx % gradients.length];
    const totalLessons = (course.topics || []).reduce((s, t) => s + (t.lessons || []).length, 0);
    const totalTopics = (course.topics || []).length;
    const progress = JSON.parse(localStorage.getItem(`lf_progress_${id}`) || '[]');
    const pct = totalLessons ? Math.round((progress.length / totalLessons) * 100) : 0;
    const marketing = typeof findMarketingCourseById === 'function' ? findMarketingCourseById(id) : null;
    const detailUrl = typeof mainSiteCourseUrl === 'function'
      ? mainSiteCourseUrl(id)
      : ((typeof MAIN_SITE_ORIGIN !== 'undefined' ? MAIN_SITE_ORIGIN : location.origin) + `/index.html?course=${encodeURIComponent(id)}`);

    return `
      <div class="master-card dashboard-course-card" data-main-course="${id}">
        <div class="card-thumb" style="background:${gradient}">${icon}</div>
        <div class="card-body">
          <span class="tag">${course.category || 'Course'}</span>
          <h3>${course.name}</h3>
          <p>${totalTopics} modules · ${totalLessons} lessons · ${course.duration || 'Self-paced'}</p>
          <div class="progress-bar" style="margin:10px 0 4px">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <p class="progress-label">${pct}% complete</p>
          <div class="job-ready-banner">
            <span class="job-ready-icon">💼</span>
            <div>
              <strong>Job Ready</strong>
              <span>Industry-aligned curriculum · Certificate included</span>
            </div>
          </div>
          <div class="dashboard-course-actions">
            <a href="${detailUrl}" class="btn-enroll">${pct > 0 ? '▶ Continue on Program Page' : 'View Program · Enroll / Learn'}</a>
            <a href="admin-lms" class="btn-edit-course" onclick="localStorage.setItem('lf_active_course','${id}')">✏️ Edit</a>
          </div>
        </div>
      </div>`;
  }).join('');

  if (typeof window.onCoursesRendered === 'function') window.onCoursesRendered();
}

loadDashboardCourses();

function updateWelcomeStats(enrolled, completed, avgPct) {
  const e = document.getElementById('statEnrolled');
  const c = document.getElementById('statCompleted');
  const p = document.getElementById('statProgress');
  if (e) e.textContent = enrolled;
  if (c) c.textContent = completed;
  if (p) p.textContent = avgPct + '%';
}

document.querySelector('.nav-item[data-section="home"]')?.addEventListener('click', loadDashboardCourses);

window.addEventListener('storage', (e) => {
  if (e.key === 'lf_lms') loadDashboardCourses();
});

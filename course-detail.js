// ===== COURSE DETAIL =====
// All professional programs open the main website course detail page
// (index.html?course={id}) — same enroll → pending → approve → LMS path.
// The old Udemy-lite modal is disabled to avoid inconsistent CTAs / broken APIs.

document.addEventListener('click', e => {
  const enrollBtn = e.target.closest('.btn-enroll');
  const h3 = e.target.closest('.master-card h3, .course-card h3, .live-card h3');
  const card = e.target.closest('.master-card, .course-card, .live-card');

  // Explicit main-site links already have href — let them navigate
  if (enrollBtn && enrollBtn.getAttribute('href') && !enrollBtn.getAttribute('href').startsWith('#')) {
    return;
  }

  if (enrollBtn && card && !enrollBtn.closest('.mc-dynamic-card') && !enrollBtn.getAttribute('onclick')) {
    e.preventDefault();
    e.stopPropagation();
    const title = card.querySelector('h3')?.textContent?.trim() || '';
    const mainId = card.getAttribute('data-main-course');
    if (mainId && typeof openMainSiteCourse === 'function' && openMainSiteCourse(mainId)) return;
    if (typeof openMainSiteCourse === 'function' && openMainSiteCourse(title)) return;
    window.location.href = (typeof MAIN_SITE_ORIGIN !== 'undefined' ? MAIN_SITE_ORIGIN : location.origin) + '/index.html?view=courses';
    return;
  }

  if (!h3) return;
  e.preventDefault();
  const title = h3.textContent.trim();
  const host = h3.closest('.master-card, .course-card, .live-card');
  const mainId = host?.getAttribute('data-main-course');
  if (mainId && typeof openMainSiteCourse === 'function' && openMainSiteCourse(mainId)) return;
  if (typeof openMainSiteCourse === 'function' && openMainSiteCourse(title)) return;
  window.location.href = (typeof MAIN_SITE_ORIGIN !== 'undefined' ? MAIN_SITE_ORIGIN : 'http://127.0.0.1:8080') + '/index.html?view=courses';
});

// Close handlers kept so leftover markup does not throw if modal is still in DOM
document.getElementById('closeCourseDetail')?.addEventListener('click', () => {
  document.getElementById('courseDetailModal')?.classList.remove('active');
});
document.getElementById('courseDetailModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('courseDetailModal'))
    document.getElementById('courseDetailModal')?.classList.remove('active');
});

/** @deprecated Old modal path — always redirect to main site */
function openCourseDetail(card, title) {
  const mainId = card?.getAttribute?.('data-main-course');
  if (mainId && openMainSiteCourse(mainId)) return;
  if (openMainSiteCourse(title)) return;
  window.location.href = (typeof MAIN_SITE_ORIGIN !== 'undefined' ? MAIN_SITE_ORIGIN : 'http://127.0.0.1:8080') + '/index.html?view=courses';
}

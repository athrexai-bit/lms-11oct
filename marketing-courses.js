// Canonical catalog — mirrors marketing site COURSES (index.html).
// All enroll / detail / learn flows go through the main site detail page.
const MARKETING_COURSES = [
  { id: '1', title: 'Agentic AI Professional', category: 'Agentic AI', price: 44999, duration: '4 Months', rating: 4.9, enrolled: '12K', badge: 'Flagship', icon: '🚀', desc: 'The most practical Agentic AI program for working professionals — LangChain, LangGraph, CrewAI, AutoGen & MCP.' },
  { id: '2', title: 'Generative AI with Agents', category: 'Generative AI', price: 39999, duration: '4 Months', rating: 4.8, enrolled: '9.8K', badge: 'New', icon: '✨', desc: 'Build full-stack GenAI apps with agents, RAG pipelines and fine-tuned LLMs.' },
  { id: '3', title: 'Enterprise AI Architect', category: 'Agentic AI', price: 49999, duration: '4 Months', rating: 4.9, enrolled: '7.2K', badge: 'Architecture', icon: '🏗️', desc: 'Design, build, secure and govern production-grade AI systems on AWS, Azure and Google Cloud.' },
  { id: '4', title: 'AI & Machine Learning Mastery', category: 'AI & Machine Learning', price: 29999, duration: '4 Months', rating: 4.8, enrolled: '18K', badge: 'Bestseller', icon: '🧠', desc: 'From Python basics to production ML — supervised, deep learning, NLP and computer vision.' },
  { id: '5', title: 'Power BI & SQL for Data Analysts', category: 'Data Analytics', price: 21999, duration: '3 Months', rating: 4.8, enrolled: '14K', badge: 'Bestseller', icon: '📊', desc: 'Job-ready dashboards, advanced SQL and DAX with real business datasets.' },
  { id: '6', title: 'AI with DevOps & AWS', category: 'DevOps & AWS', price: 39999, duration: '4 Months', rating: 4.7, enrolled: '8.5K', badge: 'New', icon: '☁️', desc: 'MLOps pipelines, Docker/Kubernetes and reliable AI deployment on AWS.' },
  { id: '7', title: 'Data Science with Python', category: 'Data Science', price: 34999, duration: '4 Months', rating: 4.8, enrolled: '22K', badge: 'Bestseller', icon: '🔬', desc: 'Statistics, EDA, ML and storytelling with 12+ hands-on Python projects.' },
  { id: '8', title: 'Full Stack Software Development', category: 'Software Development', price: 39999, duration: '5 Months', rating: 4.7, enrolled: '25K', badge: 'Hot', icon: '🛠', desc: 'React + Node.js + MongoDB — build and deploy real full-stack projects.' },
];

const MAIN_SITE_ORIGIN = (() => {
  const host = location.hostname;
  // Local split: LMS :8000 → marketing :8080. Production: same origin.
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${location.protocol}//${host}:8080`;
  }
  return location.origin;
})();

function mainSiteCourseUrl(id) {
  return `${MAIN_SITE_ORIGIN}/index.html?course=${encodeURIComponent(id)}`;
}

function findMarketingCourseByTitle(title) {
  if (!title) return null;
  const t = title.toLowerCase().trim();
  return MARKETING_COURSES.find(c => c.title.toLowerCase() === t) || null;
}

function findMarketingCourseById(id) {
  return MARKETING_COURSES.find(c => String(c.id) === String(id)) || null;
}

function openMainSiteCourse(titleOrId) {
  const byId = findMarketingCourseById(titleOrId);
  if (byId) {
    window.location.href = mainSiteCourseUrl(byId.id);
    return true;
  }
  const byTitle = findMarketingCourseByTitle(titleOrId);
  if (byTitle) {
    window.location.href = mainSiteCourseUrl(byTitle.id);
    return true;
  }
  return false;
}

function marketingCourseCardHtml(c) {
  const price = '₹' + Number(c.price).toLocaleString('en-IN');
  return `
    <div class="master-card pro-card" data-price="${c.price}" data-main-course="${c.id}">
      <div class="card-thumb" style="background:linear-gradient(135deg,#0b5fff,#2563eb)">${c.icon || '📚'}</div>
      <div class="card-body">
        <span class="tag">Professional</span>
        <div class="pro-badge">${c.badge || c.category}</div>
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
        <div class="card-meta"><span>📅 ${c.duration}</span><span>⭐ ${c.rating}</span><span>👥 ${c.enrolled} enrolled</span></div>
        <a href="${mainSiteCourseUrl(c.id)}" class="btn-enroll">💰 ${price} · View Program</a>
      </div>
    </div>`;
}

function renderMarketingProgramsGrid(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="subsection-header" style="grid-column:1/-1">
      <span class="subsection-icon">🏅</span>
      <h3>Professional Programs — 3 to 6 Month Courses</h3>
    </div>
    ${MARKETING_COURSES.map(marketingCourseCardHtml).join('')}`;
}

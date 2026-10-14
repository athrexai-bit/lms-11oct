const params = new URLSearchParams(window.location.search);
const courseName = params.get('course') || '';
const userName   = params.get('user')   || 'Learner';
const urlCourseId = params.get('cid')  || '';

document.getElementById('topCourseTitle').textContent = courseName;
document.getElementById('userInitials').textContent = userName.slice(0,2).toUpperCase();

let courseData = null;
let courseId = urlCourseId || null;
const completed = new Set();
let currentLesson = { topicIdx: 0, lessonIdx: 0 };
let activeQuiz = null;
let quizTimer = null;

function demoCourseData() {
  return {
    name: courseName,
    topics: [
      { id: 't1', title: 'Module 1: Foundations', order: 1, lessons: [
        { id: 'l1', title: 'Course Introduction', type: 'Video', duration: 15, content: 'Welcome to the course! In this lesson we cover the course structure and what you will learn.', video: '' },
        { id: 'l2', title: 'Core Concepts Overview', type: 'Reading', duration: 20, content: 'This lesson covers the fundamental concepts you need to understand before diving deeper.', video: '' },
      ]},
      { id: 't2', title: 'Module 2: Hands-on Practice', order: 2, lessons: [
        { id: 'l3', title: 'Your First Project Setup', type: 'Lab', duration: 45, content: 'Set up your development environment and run your first project.', video: '' },
        { id: 'l4', title: 'Live Coding Session', type: 'Live Session', duration: 60, content: 'Join the live session to code along with the instructor.', video: '' },
      ]},
    ],
    assignments: [{ id: 'a1', title: 'Assignment 1: Fundamentals', description: 'Complete the foundational exercises and submit your work.', due: 7, marks: 100 }],
    quizzes: [{ id: 'q1', title: 'Module 1 Quiz', time: 15, questions: [
      { question: 'What is the primary goal of this course?', options: ['Learn basics', 'Build projects', 'Get certified', 'All of the above'], answer: 'D' },
      { question: 'Which tool will we use most?', options: ['Python', 'JavaScript', 'Java', 'C++'], answer: 'A' },
    ]}],
    projects: [{ id: 'p1', title: 'Capstone Project', description: 'Build a complete end-to-end project applying everything you have learned.', difficulty: 'Advanced', stack: 'Python, AI APIs', days: 14 }],
    resources: [{ id: 'r1', title: 'Course Handbook', type: 'PDF', url: '#' }]
  };
}

function pickFromLocalStore() {
  const lmsData = JSON.parse(localStorage.getItem('lf_lms') || '{}');
  if (urlCourseId && lmsData[urlCourseId]) {
    courseId = urlCourseId;
    return lmsData[urlCourseId];
  }
  let found = null;
  Object.entries(lmsData).forEach(([id, c]) => {
    if (!c || !c.name) return;
    if (c.name.toLowerCase() === courseName.toLowerCase() ||
        (courseName && courseName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]))) {
      found = c; courseId = id;
    }
  });
  return found;
}

async function loadCourseData() {
  // Always try API first, then localStorage
  let data = null;
  if (urlCourseId) {
    try {
      console.log('🔍 Fetching course from API:', urlCourseId);
      const res = await fetch('http://127.0.0.1:5001/api/lms');
      if (res.ok) {
        const all = await res.json();
        console.log('📚 Available courses in DB:', Object.keys(all));
        if (all[urlCourseId]) {
          data = all[urlCourseId];
          courseId = urlCourseId;
          console.log('✅ Loaded course from API:', {
            name: data.name,
            topics: data.topics?.length,
            firstLesson: data.topics?.[0]?.lessons?.[0]?.title
          });
          // Mirror into localStorage on LMS origin for progress tools
          const store = JSON.parse(localStorage.getItem('lf_lms') || '{}');
          store[urlCourseId] = data;
          localStorage.setItem('lf_lms', JSON.stringify(store));
        } else {
          console.warn('⚠️ Course not found in API, trying localStorage');
          data = pickFromLocalStore();
        }
      }
    } catch (e) {
      console.error('❌ Could not fetch LMS API', e);
      data = pickFromLocalStore();
    }
  } else {
    data = pickFromLocalStore();
  }
  
  courseData = data || demoCourseData();
  if (!courseId) courseId = urlCourseId || 'demo';
  
  console.log('📖 Final course data:', {
    source: data ? 'API/localStorage' : 'demo',
    name: courseData.name,
    topics: courseData.topics?.length,
    totalLessons: courseData.topics?.reduce((sum, t) => sum + (t.lessons?.length || 0), 0)
  });

  const saved = JSON.parse(localStorage.getItem(`lf_progress_${courseId}`) || '[]');
  saved.forEach(id => completed.add(id));

  renderModuleTree();
  updateProgress();
  if (courseData.topics && courseData.topics[0] && courseData.topics[0].lessons.length) {
    loadLesson(0, 0);
  }
}

loadCourseData();

// ===== SIDEBAR NAV =====
document.querySelectorAll('.lms-nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.lms-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.lms-view').forEach(v => v.classList.remove('active'));
    item.classList.add('active');
    const view = item.getAttribute('data-view');
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('moduleTree').style.display = view === 'lessons' ? 'block' : 'none';
    if (view === 'assignments') renderAssignments();
    if (view === 'quizzes') renderQuizzes();
    if (view === 'projects') renderProjects();
    if (view === 'resources') renderResources();
    if (view === 'discussion') renderDiscussion();
  });
});

// ===== MODULE TREE =====
function renderModuleTree() {
  const el = document.getElementById('moduleTree');
  if (!courseData || !courseData.topics) {
    el.innerHTML = '<div class="empty-lms">Loading course…</div>';
    return;
  }
  const topics = courseData.topics || [];
  el.innerHTML = topics.sort((a,b) => a.order - b.order).map((t, ti) => `
    <div class="tree-module">
      <div class="tree-module-title" onclick="toggleTree(${ti})">
        <span>${t.title}</span><span id="tree-arrow-${ti}">▼</span>
      </div>
      <div class="tree-lessons" id="tree-lessons-${ti}">
        ${t.lessons.map((l, li) => `
          <div class="tree-lesson ${ti===0&&li===0?'active':''} ${completed.has(l.id)?'done':''}"
               id="tl-${ti}-${li}" onclick="loadLesson(${ti},${li})">
            <span>${completed.has(l.id) ? '✅' : lessonDot(l.type)}</span>
            <span>${l.title}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function toggleTree(ti) {
  const el = document.getElementById(`tree-lessons-${ti}`);
  const arrow = document.getElementById(`tree-arrow-${ti}`);
  el.classList.toggle('collapsed');
  arrow.textContent = el.classList.contains('collapsed') ? '▶' : '▼';
}

function lessonDot(type) {
  return { Video: '▶', Reading: '📖', 'Live Session': '🔴', Lab: '🧪' }[type] || '○';
}

// ===== VIDEO PLAYER =====
let currentVideoPlayer = null;
let videoWatchProgress = {};
let videoBookmarks = {};

function initVideoPlayer(lessonId, videoUrl) {
  if (!videoUrl) return null;
  
  const container = document.getElementById(`video-container-${lessonId}`);
  if (!container) return null;
  
  const videoData = parseVideoUrl(videoUrl);
  if (!videoData) return null;
  
  // Load saved progress
  const savedProgress = JSON.parse(localStorage.getItem(`lf_video_progress_${courseId}_${lessonId}`) || '{}');
  const savedBookmarks = JSON.parse(localStorage.getItem(`lf_video_bookmarks_${courseId}_${lessonId}`) || '[]');
  videoWatchProgress[lessonId] = savedProgress;
  videoBookmarks[lessonId] = savedBookmarks;
  
  if (videoData.type === 'youtube') {
    return renderYouTubePlayer(container, lessonId, videoData, savedProgress);
  } else if (videoData.type === 'vimeo') {
    return renderVimeoPlayer(container, lessonId, videoData, savedProgress);
  } else {
    return renderHTML5Player(container, lessonId, videoUrl, savedProgress);
  }
}

function parseVideoUrl(url) {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: 'youtube', id: ytMatch[1] };
  }
  
  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] };
  }
  
  // Direct video file
  if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return { type: 'html5', url: url };
  }
  
  return null;
}

function renderYouTubePlayer(container, lessonId, videoData, savedProgress) {
  const resumePercent = savedProgress.percent || 0;
  const showResume = resumePercent > 5 && resumePercent < 95;
  
  container.innerHTML = `
    <div class="video-player-container">
      <div class="video-wrapper">
        <iframe 
          id="yt-player-${lessonId}"
          src="https://www.youtube.com/embed/${videoData.id}?enablejsapi=1&rel=0&modestbranding=1${savedProgress.time ? '&start=' + Math.floor(savedProgress.time) : ''}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
      ${showResume ? `
        <div class="resume-overlay" id="resume-overlay-${lessonId}">
          <h3>Continue watching?</h3>
          <p class="resume-progress">You watched ${Math.round(resumePercent)}% of this video</p>
          <button class="btn-resume" onclick="dismissResumeOverlay('${lessonId}')">▶ Resume</button>
          <button class="btn-start-over" onclick="restartVideo('${lessonId}')">Start Over</button>
        </div>
      ` : ''}
      <div class="video-bookmarks" id="bookmarks-${lessonId}">
        <div class="video-bookmarks-header">
          <h4>📌 Bookmarks</h4>
          <button class="btn-add-bookmark" onclick="addBookmark('${lessonId}')">+ Add Bookmark</button>
        </div>
        <div class="bookmark-list" id="bookmark-list-${lessonId}">
          ${renderBookmarks(lessonId)}
        </div>
      </div>
    </div>
  `;
  
  return { type: 'youtube', lessonId };
}

function renderVimeoPlayer(container, lessonId, videoData, savedProgress) {
  const resumePercent = savedProgress.percent || 0;
  const showResume = resumePercent > 5 && resumePercent < 95;
  
  container.innerHTML = `
    <div class="video-player-container">
      <div class="video-wrapper">
        <iframe 
          id="vimeo-player-${lessonId}"
          src="https://player.vimeo.com/video/${videoData.id}?dnt=1${savedProgress.time ? '#t=' + Math.floor(savedProgress.time) : ''}"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
      ${showResume ? `
        <div class="resume-overlay" id="resume-overlay-${lessonId}">
          <h3>Continue watching?</h3>
          <p class="resume-progress">You watched ${Math.round(resumePercent)}% of this video</p>
          <button class="btn-resume" onclick="dismissResumeOverlay('${lessonId}')">▶ Resume</button>
          <button class="btn-start-over" onclick="restartVideo('${lessonId}')">Start Over</button>
        </div>
      ` : ''}
      <div class="video-bookmarks">
        <div class="video-bookmarks-header">
          <h4>📌 Bookmarks</h4>
          <button class="btn-add-bookmark" onclick="addBookmark('${lessonId}')">+ Add Bookmark</button>
        </div>
        <div class="bookmark-list" id="bookmark-list-${lessonId}">
          ${renderBookmarks(lessonId)}
        </div>
      </div>
    </div>
  `;
  
  return { type: 'vimeo', lessonId };
}

function renderHTML5Player(container, lessonId, videoUrl, savedProgress) {
  const resumePercent = savedProgress.percent || 0;
  const showResume = resumePercent > 5 && resumePercent < 95;
  
  container.innerHTML = `
    <div class="video-player-container" id="html5-container-${lessonId}">
      <div class="video-wrapper">
        <video 
          id="html5-player-${lessonId}"
          src="${videoUrl}"
          controls
          playsinline
          style="background:#000"
          ontimeupdate="trackVideoProgress('${lessonId}', this)"
          onloadedmetadata="if(${savedProgress.time}) this.currentTime = ${savedProgress.time}">
          Your browser does not support the video tag.
        </video>
      </div>
      ${showResume ? `
        <div class="resume-overlay" id="resume-overlay-${lessonId}">
          <h3>Continue watching?</h3>
          <p class="resume-progress">You watched ${Math.round(resumePercent)}% of this video</p>
          <button class="btn-resume" onclick="dismissResumeOverlay('${lessonId}')">▶ Resume</button>
          <button class="btn-start-over" onclick="restartVideo('${lessonId}')">Start Over</button>
        </div>
      ` : ''}
      <div class="video-bookmarks">
        <div class="video-bookmarks-header">
          <h4>📌 Bookmarks</h4>
          <button class="btn-add-bookmark" onclick="addBookmark('${lessonId}')">+ Add Bookmark</button>
        </div>
        <div class="bookmark-list" id="bookmark-list-${lessonId}">
          ${renderBookmarks(lessonId)}
        </div>
      </div>
    </div>
  `;
  
  return { type: 'html5', lessonId };
}

function renderBookmarks(lessonId) {
  const bookmarks = videoBookmarks[lessonId] || [];
  if (!bookmarks.length) {
    return '<p style="font-size:0.8rem;color:#64748b;text-align:center;padding:8px">No bookmarks yet. Add one during playback.</p>';
  }
  
  return bookmarks.map((bm, i) => `
    <div class="bookmark-item" onclick="jumpToBookmark('${lessonId}', ${bm.time})">
      <span class="bookmark-time">${formatTime(bm.time)}</span>
      <span class="bookmark-label">${bm.label || 'Bookmark ' + (i + 1)}</span>
      <button class="bookmark-delete" onclick="event.stopPropagation(); deleteBookmark('${lessonId}', ${i})">🗑</button>
    </div>
  `).join('');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function trackVideoProgress(lessonId, videoEl) {
  const progress = {
    time: videoEl.currentTime,
    duration: videoEl.duration || 0,
    percent: videoEl.duration ? (videoEl.currentTime / videoEl.duration) * 100 : 0
  };
  videoWatchProgress[lessonId] = progress;
  
  // Save to localStorage periodically
  localStorage.setItem(`lf_video_progress_${courseId}_${lessonId}`, JSON.stringify(progress));
}

function dismissResumeOverlay(lessonId) {
  const overlay = document.getElementById(`resume-overlay-${lessonId}`);
  if (overlay) overlay.style.display = 'none';
}

function restartVideo(lessonId) {
  localStorage.removeItem(`lf_video_progress_${courseId}_${lessonId}`);
  const overlay = document.getElementById(`resume-overlay-${lessonId}`);
  if (overlay) overlay.style.display = 'none';
  
  const video = document.getElementById(`html5-player-${lessonId}`);
  if (video) {
    video.currentTime = 0;
    video.play();
  }
}

function addBookmark(lessonId) {
  const video = document.getElementById(`html5-player-${lessonId}`);
  if (!video) {
    alert('Bookmarks are available during video playback.');
    return;
  }
  
  const currentTime = video.currentTime;
  const label = prompt('Enter bookmark label:', `Bookmark at ${formatTime(currentTime)}`);
  if (!label) return;
  
  const bookmarks = videoBookmarks[lessonId] || [];
  bookmarks.push({ time: currentTime, label: label });
  videoBookmarks[lessonId] = bookmarks;
  
  localStorage.setItem(`lf_video_bookmarks_${courseId}_${lessonId}`, JSON.stringify(bookmarks));
  
  const list = document.getElementById(`bookmark-list-${lessonId}`);
  if (list) list.innerHTML = renderBookmarks(lessonId);
}

function deleteBookmark(lessonId, index) {
  const bookmarks = videoBookmarks[lessonId] || [];
  bookmarks.splice(index, 1);
  videoBookmarks[lessonId] = bookmarks;
  
  localStorage.setItem(`lf_video_bookmarks_${courseId}_${lessonId}`, JSON.stringify(bookmarks));
  
  const list = document.getElementById(`bookmark-list-${lessonId}`);
  if (list) list.innerHTML = renderBookmarks(lessonId);
}

function jumpToBookmark(lessonId, time) {
  const video = document.getElementById(`html5-player-${lessonId}`);
  if (video) {
    video.currentTime = time;
    video.play();
  }
  
  // For YouTube/Vimeo, reload with timestamp
  // (simplified - would need YouTube IFrame API for full control)
}

// ===== DISCUSSION FORUM =====
let discussionThreads = [];
let currentThreadView = null;
const API_BASE = 'http://127.0.0.1:5001';

async function renderDiscussion() {
  const el = document.getElementById('discussionContent');
  if (!courseId) {
    el.innerHTML = '<div class="discussion-empty"><p>Select a course to view discussions.</p></div>';
    return;
  }
  
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  
  try {
    const res = await fetch(`${API_BASE}/api/discussion/threads?course_id=${encodeURIComponent(courseId)}`);
    discussionThreads = await res.json();
  } catch (e) {
    console.warn('Could not load discussions:', e);
  }
  
  if (currentThreadView) {
    renderThreadDetail(currentThreadView);
    return;
  }
  
  if (!discussionThreads.length) {
    el.innerHTML = `
      <div class="discussion-container">
        <div class="discussion-header">
          <h2>💬 Discussion Forum</h2>
          <button class="btn-new-thread" onclick="showNewThreadModal()">+ Ask a Question</button>
        </div>
        <div class="discussion-empty">
          <div class="discussion-empty-icon">💬</div>
          <h3>No discussions yet</h3>
          <p>Be the first to ask a question or start a discussion!</p>
        </div>
      </div>
    `;
    return;
  }
  
  el.innerHTML = `
    <div class="discussion-container">
      <div class="discussion-header">
        <h2>💬 Discussion Forum</h2>
        <button class="btn-new-thread" onclick="showNewThreadModal()">+ Ask a Question</button>
      </div>
      <div class="thread-list">
        ${discussionThreads.map(t => renderThreadCard(t)).join('')}
      </div>
    </div>
  `;
}

function renderThreadCard(thread) {
  const preview = thread.content.substring(0, 150) + (thread.content.length > 150 ? '...' : '');
  const initials = thread.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return `
    <div class="thread-card" onclick="viewThread(${thread.id})">
      <div class="thread-card-header">
        <div class="thread-votes">
          <button class="vote-btn" onclick="event.stopPropagation(); voteThread(${thread.id}, 1)">▲</button>
          <span class="vote-count">${thread.votes || 0}</span>
          <button class="vote-btn" onclick="event.stopPropagation(); voteThread(${thread.id}, -1)">▼</button>
        </div>
        <div class="thread-meta">
          <h3 class="thread-title">${escapeHtml(thread.title)}</h3>
          <p class="thread-preview">${escapeHtml(preview)}</p>
          <div class="thread-footer">
            <div class="thread-author">
              <div class="thread-avatar">${initials}</div>
              <span>${thread.user_name}</span>
            </div>
            <span>${thread.created_at}</span>
            <span class="thread-badge ${thread.is_answered ? 'badge-answered' : 'badge-open'}">
              ${thread.is_answered ? '✓ Answered' : 'Open'}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function viewThread(threadId) {
  try {
    const res = await fetch(`${API_BASE}/api/discussion/threads/${threadId}`);
    currentThreadView = await res.json();
    renderThreadDetail(currentThreadView);
  } catch (e) {
    console.error('Failed to load thread:', e);
  }
}

function renderThreadDetail(thread) {
  const el = document.getElementById('discussionContent');
  const initials = thread.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  
  el.innerHTML = `
    <div class="discussion-container">
      <button class="btn-back-threads" onclick="backToThreadList()">← Back to Discussions</button>
      
      <div class="thread-detail">
        <div class="thread-detail-header">
          <h1 class="thread-detail-title">${escapeHtml(thread.title)}</h1>
          <div class="thread-detail-content">${escapeHtml(thread.content)}</div>
          <div class="thread-detail-meta">
            <div class="thread-author">
              <div class="thread-avatar">${initials}</div>
              <span>${thread.user_name}</span>
            </div>
            <span>${thread.created_at}</span>
            <button class="vote-btn" onclick="voteThread(${thread.id}, 1)">▲</button>
            <span class="vote-count">${thread.votes || 0}</span>
            <button class="vote-btn" onclick="voteThread(${thread.id}, -1)">▼</button>
          </div>
        </div>
        
        <div class="replies-section">
          <div class="replies-header">${thread.replies?.length || 0} Replies</div>
          ${(thread.replies || []).map(r => renderReply(r, thread, user)).join('')}
        </div>
        
        <div style="padding: 20px 24px;">
          <div class="reply-form">
            <div class="reply-form-header">Write a Reply</div>
            <textarea class="reply-textarea" id="replyContent" placeholder="Share your thoughts..."></textarea>
            <div class="reply-form-actions">
              <button class="btn-start" onclick="submitReply(${thread.id})">Post Reply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderReply(reply, thread, currentUser) {
  const initials = reply.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isOwner = currentUser.email === thread.user_email;
  
  return `
    <div class="reply-card ${reply.is_answer ? 'is-answer' : ''}">
      ${reply.is_answer ? '<div class="answer-badge">✓ Accepted Answer</div>' : ''}
      <div class="reply-header">
        <div class="reply-avatar">${initials}</div>
        <span class="reply-author">${reply.user_name}</span>
        <span class="reply-time">${reply.created_at}</span>
      </div>
      <div class="reply-content">${escapeHtml(reply.content)}</div>
      <div class="reply-actions">
        <button class="reply-action-btn" onclick="voteReply(${reply.id}, 1)">▲ ${reply.votes || 0}</button>
        <button class="reply-action-btn" onclick="voteReply(${reply.id}, -1)">▼</button>
        ${isOwner && !thread.is_answered ? `<button class="reply-action-btn" onclick="markAsAnswer(${thread.id}, ${reply.id})" style="color: #059669;">✓ Accept as Answer</button>` : ''}
      </div>
    </div>
  `;
}

function backToThreadList() {
  currentThreadView = null;
  renderDiscussion();
}

function showNewThreadModal() {
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  if (!user.email) {
    alert('Please log in to create a discussion.');
    return;
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'newThreadModal';
  modal.className = 'thread-modal active';
  modal.innerHTML = `
    <div class="thread-modal-backdrop" onclick="closeNewThreadModal()"></div>
    <div class="thread-modal-box">
      <div class="thread-modal-header">
        <h3>Ask a Question</h3>
        <button class="thread-modal-close" onclick="closeNewThreadModal()">&times;</button>
      </div>
      <div class="thread-form-field">
        <label>Title</label>
        <input type="text" class="thread-form-input" id="threadTitle" placeholder="What's your question?"/>
      </div>
      <div class="thread-form-field">
        <label>Details</label>
        <textarea class="thread-form-input thread-form-textarea" id="threadContent" placeholder="Provide more context, what you've tried, etc."></textarea>
      </div>
      <div class="reply-form-actions">
        <button class="btn-start" onclick="createThread()">Post Question</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeNewThreadModal() {
  const modal = document.getElementById('newThreadModal');
  if (modal) modal.remove();
}

async function createThread() {
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  const title = document.getElementById('threadTitle').value.trim();
  const content = document.getElementById('threadContent').value.trim();
  
  if (!title || !content) {
    alert('Please fill in both title and content.');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/discussion/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        user_email: user.email,
        user_name: user.name,
        title: title,
        content: content
      })
    });
    
    if (res.ok) {
      closeNewThreadModal();
      renderDiscussion();
    }
  } catch (e) {
    console.error('Failed to create thread:', e);
  }
}

async function submitReply(threadId) {
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  const content = document.getElementById('replyContent').value.trim();
  
  if (!content) {
    alert('Please write a reply.');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/discussion/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id: threadId,
        user_email: user.email,
        user_name: user.name,
        content: content
      })
    });
    
    if (res.ok) {
      viewThread(threadId);
    }
  } catch (e) {
    console.error('Failed to submit reply:', e);
  }
}

async function voteThread(threadId, voteType) {
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  if (!user.email) return;
  
  try {
    await fetch(`${API_BASE}/api/discussion/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_type: 'thread',
        item_id: threadId,
        user_email: user.email,
        vote_type: voteType
      })
    });
    renderDiscussion();
  } catch (e) {
    console.error('Vote failed:', e);
  }
}

async function voteReply(replyId, voteType) {
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  if (!user.email) return;
  
  try {
    await fetch(`${API_BASE}/api/discussion/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_type: 'reply',
        item_id: replyId,
        user_email: user.email,
        vote_type: voteType
      })
    });
    if (currentThreadView) viewThread(currentThreadView.id);
  } catch (e) {
    console.error('Vote failed:', e);
  }
}

async function markAsAnswer(threadId, replyId) {
  try {
    await fetch(`${API_BASE}/api/discussion/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id: threadId,
        reply_id: replyId
      })
    });
    viewThread(threadId);
  } catch (e) {
    console.error('Mark as answer failed:', e);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== LOAD LESSON =====
function loadLesson(ti, li) {
  console.log('🎯 loadLesson CALLED:', { ti, li });
  
  currentLesson = { topicIdx: ti, lessonIdx: li };
  const topic = courseData.topics[ti];
  const lesson = topic.lessons[li];
  
  console.log('📄 Loading lesson:', {
    topicIndex: ti,
    lessonIndex: li,
    topicTitle: topic.title,
    lessonTitle: lesson.title,
    hasContent: !!lesson.content,
    contentLength: lesson.content?.length || 0,
    hasVideo: !!lesson.video,
    videoId: lesson.video
  });

  document.querySelectorAll('.tree-lesson').forEach(el => el.classList.remove('active'));
  document.getElementById(`tl-${ti}-${li}`)?.classList.add('active');

  document.getElementById('lessonBreadcrumb').textContent = `${topic.title} › Lesson ${li + 1}`;
  document.getElementById('lessonTitle').textContent = lesson.title;
  document.getElementById('videoLabel').textContent = lesson.video ? '▶ Click to play' : `▶ ${lesson.title}`;
  
  const lessonBody = document.getElementById('lessonBody');
  const htmlContent = buildLessonBlog(lesson, topic, li, ti);
  
  console.log('🎨 Setting innerHTML:', {
    lessonBodyExists: !!lessonBody,
    htmlContentLength: htmlContent.length,
    htmlPreview: htmlContent.substring(0, 200)
  });
  
  lessonBody.innerHTML = htmlContent;
  
  console.log('✅ innerHTML set successfully');
  
  updateProgress();

  // Render mermaid diagrams if any
  setTimeout(() => {
    const diagrams = document.querySelectorAll('#lessonBody .mermaid');
    if (diagrams.length && typeof mermaid !== 'undefined') {
      mermaid.init(undefined, diagrams);
    }
    
    // Initialize video player if present
    if (lesson.video) {
      console.log('🎬 Initializing video player for:', lesson.video);
      currentVideoPlayer = initVideoPlayer(lesson.id, lesson.video);
    } else {
      console.log('⚠️ No video ID found for this lesson');
    }
  }, 100);
}

function buildLessonBlog(lesson, topic, li, ti) {
  const typeIcon = { Video: '▶', Reading: '📖', 'Live Session': '🔴', Lab: '🧪' };
  const typeColor = { Video: '#ef4444', Reading: '#3b82f6', 'Live Session': '#f59e0b', Lab: '#10b981' };
  const icon = typeIcon[lesson.type] || '📄';
  const color = typeColor[lesson.type] || '#7c3aed';
  const content = lesson.content || '';

  return `
    <div class="lesson-blog">

      <!-- Meta row -->
      <div class="lb-meta">
        <span class="lb-type-badge" style="background:${color}22;color:${color};border-color:${color}44">
          ${icon} ${lesson.type}
        </span>
        <span class="lb-dur">⏱ ${lesson.duration} min</span>
        <span class="lb-module">${topic.title}</span>
      </div>

      <!-- Intro card -->
      <div class="lb-intro-card">
        <div class="lb-intro-icon">${icon}</div>
        <div>
          <h2 class="lb-intro-title">${lesson.title}</h2>
          <p class="lb-intro-sub">Lesson ${li + 1} of ${topic.lessons.length} · ${lesson.type} · ${lesson.duration} min</p>
        </div>
      </div>

      <!-- Rich content -->
      ${content ? `
      <div class="lb-section">
        <div class="lb-section-label">📖 Lesson Content</div>
        <div class="lb-rich-content">${content}</div>
      </div>` : `
      <div class="lb-section">
        <div class="lb-section-label">📖 Lesson Content</div>
        <div class="lb-empty-content">No content yet. Edit this lesson in the admin panel to add content.</div>
      </div>`}

      <!-- Video link if present -->
      ${lesson.video ? `
      <div class="lb-section">
        <div class="lb-section-label">🎬 Video Lesson</div>
        <div id="video-container-${lesson.id}"></div>
      </div>` : ''}

      <!-- Notes area -->
      <div class="lb-section lb-notes-section">
        <div class="lb-section-label">📝 Your Notes</div>
        <textarea class="lb-notes-input" placeholder="Take notes here..."
          onchange="saveNote('${lesson.id}', this.value)">${getNoteForLesson(lesson.id)}</textarea>
      </div>

      <!-- Module Materials -->
      ${(topic.materials && topic.materials.length) ? `
      <div class="lb-section">
        <div class="lb-section-label">📎 Module Materials</div>
        <div class="lb-materials-list">
          ${topic.materials.map(m => `
            <div class="lb-material-item">
              <span class="lb-material-icon">📎</span>
              <span class="lb-material-title">${m.title}</span>
              <span class="lb-material-type">${m.type}</span>
              ${m.url ? `<a href="${m.url}" target="_blank" class="lb-material-link">🔗 Open</a>` : ''}
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Module Quiz -->
      ${(topic.topicQuizzes && topic.topicQuizzes.length) ? `
      <div class="lb-section">
        <div class="lb-section-label">🧠 Module Quiz</div>
        <div class="lb-quiz-block" id="lbquiz-${topic.id}">
          ${topic.topicQuizzes.map((q, qi) => `
            <div class="lb-quiz-question">
              <p class="lb-quiz-q-text"><strong>Q${qi+1}.</strong> ${q.question}</p>
              <div class="lb-quiz-options">
                ${q.options.map((opt, oi) => `
                  <label class="lb-quiz-option">
                    <input type="radio" name="lbq-${topic.id}-${qi}" value="${['A','B','C','D'][oi]}"
                      onchange="checkLbAnswer(this,'${topic.id}',${qi},'${q.answer}')"/>
                    <span>${['A','B','C','D'][oi]}) ${opt}</span>
                  </label>`).join('')}
              </div>
              <div class="lb-quiz-feedback" id="lbfb-${topic.id}-${qi}"></div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Complete button -->
      <div class="lb-complete-row">
        <button class="btn-complete ${completed.has(lesson.id) ? 'done-btn' : ''}"
          onclick="markDone('${lesson.id}',${ti},${li})">
          ${completed.has(lesson.id) ? '✅ Completed' : '○ Mark as Complete'}
        </button>
        ${completed.has(lesson.id) ? '<span class="lb-done-msg">Great work! Move to the next lesson.</span>' : ''}
      </div>

    </div>`;
}

function getNoteForLesson(lid) {
  return localStorage.getItem(`lf_note_${courseId}_${lid}`) || '';
}
function saveNote(lid, val) {
  localStorage.setItem(`lf_note_${courseId}_${lid}`, val);
}

function checkLbAnswer(input, topicId, qi, correct) {
  const fb = document.getElementById(`lbfb-${topicId}-${qi}`);
  if (input.value === correct) {
    fb.innerHTML = '<span style="color:#10b981;font-weight:700">✅ Correct!</span>';
  } else {
    fb.innerHTML = `<span style="color:#f87171;font-weight:700">❌ Incorrect. Correct answer: ${correct}</span>`;
  }
  // Disable all options for this question
  document.querySelectorAll(`input[name="lbq-${topicId}-${qi}"]`).forEach(r => r.disabled = true);
}

function markDone(lid, ti, li) {
  completed.add(lid);
  localStorage.setItem(`lf_progress_${courseId}`, JSON.stringify([...completed]));
  renderModuleTree();
  loadLesson(ti, li);
  updateProgress();
}

function updateProgress() {
  const total = courseData.topics.reduce((s, t) => s + t.lessons.length, 0);
  const pct = total ? Math.round((completed.size / total) * 100) : 0;
  document.getElementById('topProgress').style.width = pct + '%';
  document.getElementById('topProgressLabel').textContent = pct + '%';
  
  // Check for course completion and generate certificate
  if (pct === 100 && courseData.name) {
    generateCertificate();
  }
}

async function generateCertificate() {
  // Prevent duplicate generation
  if (localStorage.getItem(`lf_cert_${courseId}`)) return;
  
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  if (!user.email) return;
  
  try {
    const res = await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        courseId: courseId,
        courseName: courseData.name,
        instructor: courseData.instructor || 'Athrexai'
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(`lf_cert_${courseId}`, JSON.stringify(data.certificate));
      
      // Show celebration
      showCertificateCelebration(data.certificate);
    }
  } catch (e) {
    console.warn('Certificate generation failed:', e);
  }
}

function showCertificateCelebration(cert) {
  // Create celebration overlay
  const overlay = document.createElement('div');
  overlay.id = 'certCelebration';
  overlay.innerHTML = `
    <div class="cert-celebration-backdrop"></div>
    <div class="cert-celebration-modal">
      <div class="cert-confetti">🎉🏆🎉</div>
      <h2>Congratulations!</h2>
      <p>You've completed <strong>${courseData.name}</strong>!</p>
      <div class="cert-preview">
        <div class="cert-badge">🏆</div>
        <div class="cert-info">
          <div class="cert-id">Certificate ID: <strong>${cert.certificate_id}</strong></div>
          <div class="cert-date">Issued: ${cert.issued_at}</div>
        </div>
      </div>
      <div class="cert-actions">
        <button onclick="viewCertificate('${cert.certificate_id}')" class="btn-cert-view">📜 View Certificate</button>
        <button onclick="closeCelebration()" class="btn-cert-close">Continue Learning</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function viewCertificate(certId) {
  window.open(`certificate.html?id=${certId}`, '_blank');
}

function closeCelebration() {
  const el = document.getElementById('certCelebration');
  if (el) el.remove();
}

// Prev / Next
document.getElementById('nextBtn').addEventListener('click', () => {
  let { topicIdx: ti, lessonIdx: li } = currentLesson;
  li++;
  if (li >= courseData.topics[ti].lessons.length) { ti++; li = 0; }
  if (ti < courseData.topics.length) loadLesson(ti, li);
});
document.getElementById('prevBtn').addEventListener('click', () => {
  let { topicIdx: ti, lessonIdx: li } = currentLesson;
  li--;
  if (li < 0) { ti--; if (ti >= 0) li = courseData.topics[ti].lessons.length - 1; }
  if (ti >= 0) loadLesson(ti, li);
});

// ===== ASSIGNMENTS =====
function getSubmissions() {
  return JSON.parse(localStorage.getItem(`lf_submissions_${courseId}`) || '{}');
}
function saveSubmission(id, payload) {
  const all = getSubmissions();
  all[id] = payload;
  localStorage.setItem(`lf_submissions_${courseId}`, JSON.stringify(all));
}

function renderAssignments() {
  const el = document.getElementById('assignmentsContent');
  const items = courseData.assignments || [];
  if (!items.length) { el.innerHTML = '<div class="empty-lms">No assignments yet.</div>'; return; }
  const subs = getSubmissions();
  el.innerHTML = items.map(a => {
    const sub = subs[a.id];
    return `
    <div class="lms-card" id="assign-card-${a.id}">
      <div class="lms-card-top">
        <span class="lms-badge assign-b">📝 Assignment</span>
        ${sub ? '<span class="lms-badge" style="background:#dcfce7;color:#166534;margin-left:8px">✅ Submitted</span>' : ''}
        <h3>${a.title}</h3>
        <p>${a.description}</p>
      </div>
      <div class="lms-card-meta">
        <span>⏰ Due in ${a.due} days</span>
        <span>🏆 ${a.marks} marks</span>
        <button class="btn-start" onclick="toggleAssignForm('${a.id}')">${sub ? '✏️ Edit submission' : '📤 Submit work'}</button>
      </div>
      <div id="assign-form-${a.id}" style="display:none;padding:16px;border-top:1px solid #e2e8f0;margin-top:8px">
        <label style="display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:6px">Your response / notes</label>
        <textarea id="assign-text-${a.id}" rows="4" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:13px;resize:vertical;box-sizing:border-box" placeholder="Describe what you built, key findings, or paste notes...">${sub?.text || ''}</textarea>
        <label style="display:block;font-size:12px;font-weight:700;color:#475569;margin:12px 0 6px">Work link (Drive / GitHub / Notion)</label>
        <input id="assign-link-${a.id}" type="url" value="${sub?.link || ''}" placeholder="https://..." style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:13px;box-sizing:border-box"/>
        <div style="display:flex;gap:10px;margin-top:14px;align-items:center">
          <button class="btn-start" onclick="submitAssignment('${a.id}')">Save submission</button>
          ${sub ? `<span style="font-size:12px;color:#64748b">Last saved ${new Date(sub.at).toLocaleString()}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleAssignForm(id) {
  const form = document.getElementById(`assign-form-${id}`);
  if (!form) return;
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function submitAssignment(id) {
  const text = (document.getElementById(`assign-text-${id}`)?.value || '').trim();
  const link = (document.getElementById(`assign-link-${id}`)?.value || '').trim();
  if (!text && !link) {
    alert('Add notes or a work link before submitting.');
    return;
  }
  saveSubmission(id, { text, link, at: Date.now() });
  renderAssignments();
  alert('✅ Assignment submitted! Your mentor can review this from the LMS.');
}

// ===== QUIZZES =====
function renderQuizzes() {
  const el = document.getElementById('quizzesContent');
  const items = courseData.quizzes || [];
  if (!items.length) { el.innerHTML = '<div class="empty-lms">No quizzes yet.</div>'; return; }
  el.innerHTML = items.map(q => `
    <div class="lms-card">
      <div class="lms-card-top">
        <span class="lms-badge quiz-b">🧠 Quiz</span>
        <h3>${q.title}</h3>
        <p>${q.questions.length} questions · ⏱ ${q.time} mins</p>
      </div>
      <div class="lms-card-meta">
        <button class="btn-start" onclick="startQuiz('${q.id}')">▶ Start Quiz</button>
      </div>
    </div>`).join('');
}

function startQuiz(qid) {
  activeQuiz = courseData.quizzes.find(q => q.id === qid);
  if (!activeQuiz) return;
  document.getElementById('quizModalTitle').textContent = activeQuiz.title;
  document.getElementById('quizResult').style.display = 'none';
  document.getElementById('submitQuizBtn').style.display = 'block';

  document.getElementById('quizQuestionsRender').innerHTML = activeQuiz.questions.map((q, i) => `
    <div class="quiz-q-block">
      <p class="quiz-q-text">Q${i+1}. ${q.question}</p>
      <div class="quiz-options">
        ${['A','B','C','D'].map((opt, oi) => `
          <label class="quiz-option">
            <input type="radio" name="q${i}" value="${opt}"/>
            <span>${opt}. ${q.options[oi] || ''}</span>
          </label>`).join('')}
      </div>
    </div>`).join('');

  // Timer
  let secs = (activeQuiz.time || 30) * 60;
  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    secs--;
    const m = Math.floor(secs / 60), s = secs % 60;
    document.getElementById('quizTimer').textContent = `⏱ ${m}:${s.toString().padStart(2,'0')} remaining`;
    if (secs <= 0) { clearInterval(quizTimer); gradeQuiz(); }
  }, 1000);

  document.getElementById('quizModal').classList.add('active');
}

document.getElementById('submitQuizBtn').addEventListener('click', () => { clearInterval(quizTimer); gradeQuiz(); });
document.getElementById('closeQuizModal').addEventListener('click', () => { clearInterval(quizTimer); document.getElementById('quizModal').classList.remove('active'); });

function gradeQuiz() {
  let score = 0;
  activeQuiz.questions.forEach((q, i) => {
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    if (sel && sel.value === q.answer) score++;
  });
  const pct = Math.round((score / activeQuiz.questions.length) * 100);
  document.getElementById('submitQuizBtn').style.display = 'none';
  document.getElementById('quizResult').style.display = 'block';
  document.getElementById('quizResult').innerHTML = `
    <div class="quiz-result ${pct >= 60 ? 'pass' : 'fail'}">
      <div class="result-score">${pct}%</div>
      <h3>${pct >= 60 ? '🎉 Passed!' : '😔 Try Again'}</h3>
      <p>You scored ${score} out of ${activeQuiz.questions.length} questions.</p>
    </div>`;
}

// ===== PROJECTS =====
function renderProjects() {
  const el = document.getElementById('projectsContent');
  const items = courseData.projects || [];
  if (!items.length) { el.innerHTML = '<div class="empty-lms">No projects yet.</div>'; return; }
  el.innerHTML = items.map(p => `
    <div class="lms-card">
      <div class="lms-card-top">
        <span class="lms-badge project-b">🚀 Project</span>
        <span class="diff-badge diff-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <p class="stack-info">🛠 ${p.stack}</p>
      </div>
      <div class="lms-card-meta">
        <span>📅 ${p.days} days</span>
        <button class="btn-start" onclick="submitProject('${p.id}')">📤 Submit Project</button>
      </div>
    </div>`).join('');
}

function submitProject(id) {
  alert('📤 Project submission — paste your GitHub link or upload files here.\n(Connect to backend to enable submissions)');
}

// ===== RESOURCES =====
function renderResources() {
  const el = document.getElementById('resourcesContent');
  const items = courseData.resources || [];
  if (!items.length) { el.innerHTML = '<div class="empty-lms">No resources yet.</div>'; return; }
  const icons = { PDF: '📄', Video: '▶', Link: '🔗', GitHub: '🐙', Notebook: '📓' };
  el.innerHTML = items.map(r => `
    <div class="lms-card">
      <div class="lms-card-top">
        <span class="lms-badge resource-b">${icons[r.type] || '📎'} ${r.type}</span>
        <h3>${r.title}</h3>
        ${r.url && r.url !== '#' ? `<a href="${r.url}" target="_blank" class="resource-link">🔗 Open Resource</a>` : ''}
      </div>
    </div>`).join('');
}

// ===== INIT (async load in loadCourseData) =====

// Edit Course button — opens admin-lms with this course selected
document.getElementById('editCourseBtn').addEventListener('click', (e) => {
  e.preventDefault();
  if (courseId) localStorage.setItem('lf_active_course', courseId);
  window.open('admin-lms.html', '_blank');
});

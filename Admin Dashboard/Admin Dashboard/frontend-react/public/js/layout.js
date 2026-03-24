// =============================================
//  LAYOUT.JS — Inject Sidebar + Topbar HTML
// =============================================

function renderLayout(opts) {
  const { pageTitle, activePage, allowedRoles } = opts || {};

  const user = guardPage(allowedRoles || null);
  if (!user) return null;

  // ---- Inject Sidebar ----
  const sidebarEl = document.getElementById('sidebar-root');
  if (sidebarEl) sidebarEl.innerHTML = buildSidebar();

  // ---- Inject Topbar ----
  const topbarEl = document.getElementById('topbar-root');
  if (topbarEl) topbarEl.innerHTML = buildTopbar(pageTitle || 'Dashboard');

  // ---- Wire up user info ----
  populateSidebar(user);
  populateTopbar(user);
  setActiveNav(activePage || '');
  const dashboardLink = document.querySelector('.nav-item[data-page="dashboard"]');
  if (dashboardLink) dashboardLink.setAttribute('href', getRoleHome(user.role));

  // ---- Page transitions + nav animation ----
  initPageTransition();
  bindNavTransitions();


  // ---- Logout button ----
  document.querySelectorAll('.logout-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      if (confirm('Log out?')) logout();
    })
  );

  // ---- Mobile sidebar ----
  initMobileSidebar();
  initNotificationDropdown();
  initProfileDropdown(user);

  return user;
}

function buildSidebar() {
  return `
  <div class="sidebar-brand">
    <div class="brand-icon">🏫</div>
    <div class="brand-text">
      <h2>SmartSchool</h2>
      <span>Management System</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-section-label" data-roles="all">Overview</div>

    <a href="dashboard.html" class="nav-item" data-page="dashboard" data-roles="all">
      <span class="nav-icon">📊</span>
      <span class="nav-text">Dashboard</span>
    </a>

    <div class="nav-section-label" data-roles="super_admin,admin,teacher">Academics</div>

    <a href="students.html" class="nav-item" data-page="students" data-roles="super_admin,admin,teacher">
      <span class="nav-icon">👨‍🎓</span>
      <span class="nav-text">Students</span>
    </a>
    <a href="teachers.html" class="nav-item" data-page="teachers" data-roles="super_admin,admin">
      <span class="nav-icon">👩‍🏫</span>
      <span class="nav-text">Teachers</span>
    </a>
    <a href="attendance.html" class="nav-item" data-page="attendance" data-roles="super_admin,admin,teacher">
      <span class="nav-icon">🗓</span>
      <span class="nav-text">Attendance</span>
    </a>
    <a href="exams.html" class="nav-item" data-page="exams" data-roles="super_admin,admin,teacher,student,parent">
      <span class="nav-icon">📝</span>
      <span class="nav-text">Exams & Results</span>
    </a>
    <a href="timetable.html" class="nav-item" data-page="timetable" data-roles="super_admin,admin,teacher">
      <span class="nav-icon">📅</span>
      <span class="nav-text">Time Table</span>
    </a>

    <div class="nav-section-label" data-roles="super_admin,admin,accountant">Finance</div>

    <a href="fees.html" class="nav-item" data-page="fees" data-roles="super_admin,admin,accountant,parent">
      <span class="nav-icon">💰</span>
      <span class="nav-text">Fee Management</span>
    </a>

    <div class="nav-section-label" data-roles="super_admin,admin">Administration</div>

    <a href="parents.html" class="nav-item" data-page="parents" data-roles="super_admin,admin">
      <span class="nav-icon">👪</span>
      <span class="nav-text">Parents</span>
    </a>
    <a href="notices.html" class="nav-item" data-page="notices" data-roles="all">
      <span class="nav-icon">📢</span>
      <span class="nav-text">Notice Board</span>
      <span class="nav-badge hidden" id="noticeNavBadge">0</span>
    </a>
  </nav>

  <div class="sidebar-footer">
    <div class="sidebar-user">
      <div class="avatar" id="sidebar-avatar">A</div>
      <div class="user-info">
        <div class="name" id="sidebar-name">Loading...</div>
        <div class="role" id="sidebar-role">—</div>
      </div>
    </div>
  </div>`;
}

function buildTopbar(title) {
  return `
  <button class="icon-btn" id="menu-toggle" title="Menu">☰</button>
  <div class="topbar-title">${title} <span id="topbar-role"></span></div>
  <div class="topbar-actions">
    <div class="notif-wrap" id="notifWrap">
      <button class="icon-btn" id="notifBtn" title="Notifications">
        🔔<span class="notif-badge hidden" id="notifBadge">0</span>
      </button>
      <div class="notif-dropdown" id="notifDropdown" aria-hidden="true">
        <div class="notif-head">Notifications</div>
        <div class="notif-list" id="notifList"></div>
        <a href="notices.html" class="notif-footer">View all</a>
      </div>
    </div>
    <div class="profile-wrap" id="profileWrap">
      <button class="topbar-avatar" id="profileBtn" title="Profile">A</button>
      <div class="profile-dropdown" id="profileDropdown" aria-hidden="true">
        <div class="profile-info">
          <div class="profile-name" id="profileName">Admin User</div>
          <div class="profile-email" id="profileEmail">admin@school.com</div>
          <div class="profile-role" id="profileRole">Role: Admin</div>
        </div>
        <div class="profile-divider"></div>
        <button class="profile-item" id="profileSettings">⚙️ Settings</button>
        <button class="profile-item danger" id="profileLogout">🚪 Logout</button>
      </div>
    </div>
  </div>`;
}

// =============================================
//  PAGE TRANSITION + NAV ANIMATION
// =============================================
function initPageTransition() {
  const main = document.querySelector('.main-content');
  if (!main) return;
  main.classList.add('page-enter');
  requestAnimationFrame(() => {
    main.classList.add('page-enter-active');
  });
}

function bindNavTransitions() {
  const links = document.querySelectorAll('.sidebar .nav-item');
  if (!links.length) return;

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.classList.contains('active')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button && e.button !== 0) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      const main = document.querySelector('.main-content');
      if (!main || document.body.classList.contains('nav-transitioning')) return;

      e.preventDefault();
      document.body.classList.add('nav-transitioning');
      main.classList.add('page-exit');

      setTimeout(() => {
        window.location.href = href;
      }, 400);
    });
  });
}

// =============================================
//  NOTIFICATION DROPDOWN  (Session-only, no localStorage)
// =============================================
let _dismissedNoticeIds = new Set();   // session-only; resets on refresh

function updateBadgeElement(el, count, isBell) {
  if (!el) return;
  if (count <= 0) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  const capped = Math.min(count, 99);
  el.dataset.rollTarget = String(capped);
  el.dataset.rollSuffix = count > 99 ? '+' : '';
  el.dataset.rollDuration = isBell ? '700' : '600';
  rollCounter(el, String(capped));
}

function getVisibleNotices() {
  const all = Array.isArray(window.NOTICES) ? window.NOTICES : [];
  return all.filter(n => !_dismissedNoticeIds.has(n.id));
}

function refreshNotificationBadges() {
  const visible = getVisibleNotices();
  updateBadgeElement(document.getElementById('notifBadge'), visible.length, true);
  updateBadgeElement(document.getElementById('noticeNavBadge'), visible.length, false);
  // update header count chip
  const countEl = document.querySelector('.notif-head .notif-count');
  if (countEl) countEl.textContent = visible.length ? visible.length + ' new' : '';
  return visible;
}

function renderNotifList(list) {
  const visible = getVisibleNotices();
  const fmtDate = (typeof formatDate === 'function') ? formatDate : (d) => (d || '');

  if (!visible.length) {
    list.innerHTML = '<div class="notif-empty">🎉 No new notifications</div>';
    return;
  }

  list.innerHTML = visible.slice(0, 5).map(n => `
    <div class="notif-item ${n.urgent ? 'urgent' : ''}" data-id="${n.id}">
      <div class="notif-title">${n.title}</div>
      <div class="notif-desc">${n.body.length > 80 ? n.body.substring(0, 80) + '…' : n.body}</div>
      <div class="notif-date">${fmtDate(n.date)}</div>
      <div class="notif-actions">
        <button class="notif-act-btn read-btn" data-action="read" title="Mark as Read">✔ Read</button>
        <button class="notif-act-btn ignore-btn" data-action="ignore" title="Ignore">✕ Ignore</button>
      </div>
    </div>
  `).join('');
}

function initNotificationDropdown() {
  const wrap = document.getElementById('notifWrap');
  const btn = document.getElementById('notifBtn');
  const dropdown = document.getElementById('notifDropdown');
  const list = document.getElementById('notifList');
  if (!wrap || !btn || !dropdown || !list) return;
  dropdown.setAttribute('inert', '');

  // inject header count chip
  const head = dropdown.querySelector('.notif-head');
  if (head && !head.querySelector('.notif-count')) {
    head.innerHTML = 'Notifications <span class="notif-count"></span>';
  }

  // initial render
  renderNotifList(list);
  refreshNotificationBadges();

  function close() {
    dropdown.classList.remove('open');
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.setAttribute('inert', '');
    if (dropdown.contains(document.activeElement)) btn.focus();
  }
  function toggle() {
    const isOpen = dropdown.classList.contains('open');
    if (isOpen) close();
    else {
      renderNotifList(list);           // refresh each open
      dropdown.classList.add('open');
      dropdown.setAttribute('aria-hidden', 'false');
      dropdown.removeAttribute('inert');
      const firstBtn = dropdown.querySelector('.notif-act-btn, a.notif-footer');
      if (firstBtn) firstBtn.focus();
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  // Handle Mark as Read / Ignore
  list.addEventListener('click', (e) => {
    const actBtn = e.target.closest('.notif-act-btn');
    if (!actBtn) return;
    const item = actBtn.closest('.notif-item');
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;

    // animate out
    item.style.transition = 'opacity 200ms ease, max-height 200ms ease';
    item.style.opacity = '0';
    item.style.maxHeight = item.scrollHeight + 'px';
    requestAnimationFrame(() => { item.style.maxHeight = '0'; item.style.overflow = 'hidden'; });

    setTimeout(() => {
      _dismissedNoticeIds.add(id);
      item.remove();
      refreshNotificationBadges();
      if (!list.querySelectorAll('.notif-item').length) {
        list.innerHTML = '<div class="notif-empty">🎉 No new notifications</div>';
      }
    }, 210);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) close();
  });

  // Close dropdown when View All is clicked
  const viewAllLink = dropdown.querySelector('.notif-footer');
  if (viewAllLink) {
    viewAllLink.addEventListener('click', () => close());
  }
}

// =============================================
//  PROFILE DROPDOWN
// =============================================
function initProfileDropdown(user) {
  const wrap = document.getElementById('profileWrap');
  const btn = document.getElementById('profileBtn');
  const dropdown = document.getElementById('profileDropdown');
  if (!wrap || !btn || !dropdown) return;
  dropdown.setAttribute('inert', '');

  const name = document.getElementById('profileName');
  const email = document.getElementById('profileEmail');
  const role = document.getElementById('profileRole');

  if (user) {
    const initials = (user.name || 'User').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();
    btn.textContent = initials || 'U';
    if (name) name.textContent = user.name || 'User';
    if (email) email.textContent = user.email || '—';
    if (role) role.textContent = `Role: ${user.role || 'User'}`;
  }

  const settingsBtn = document.getElementById('profileSettings');
  const logoutBtn = document.getElementById('profileLogout');

  if (settingsBtn) settingsBtn.addEventListener('click', () => {
    close();
    if (typeof showSection === 'function') {
      showSection('settings');
    } else {
      // fallback: find and click the section toggle manually
      const settingsSec = document.getElementById('settings-section');
      if (settingsSec) {
        document.querySelectorAll('.section-panel').forEach(s => s.classList.add('hidden'));
        settingsSec.classList.remove('hidden');
      }
    }
  });
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (confirm('Log out?')) logout();
  });

  function close() {
    dropdown.classList.remove('open');
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.setAttribute('inert', '');
    if (dropdown.contains(document.activeElement)) btn.focus();
  }
  function toggle() {
    const isOpen = dropdown.classList.contains('open');
    if (isOpen) close();
    else {
      dropdown.classList.add('open');
      dropdown.setAttribute('aria-hidden', 'false');
      dropdown.removeAttribute('inert');
      const firstItem = dropdown.querySelector('button, a, [href], [tabindex]:not([tabindex="-1"])');
      if (firstItem) firstItem.focus();
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) close();
  });
}

// =============================================
//  ROLLING COUNTERS
// =============================================
function initRollingCounters(root) {
  const scope = root || document;
  const nodes = scope.querySelectorAll('[data-roll-target]');
  nodes.forEach(el => {
    const target = el.dataset.rollTarget;
    if (!target) return;
    rollCounter(el, target);
  });
}

function initShortCounters(root) {
  const scope = root || document;
  const nodes = scope.querySelectorAll('[data-short-target]');
  nodes.forEach(el => {
    const target = el.dataset.shortTarget;
    if (target === undefined || target === null || target === '') return;
    rollShortNumber(el, Number(target));
  });
}

function rollCounter(el, target) {
  const next = String(target);
  if (el.dataset.rollCurrent === next && el.dataset.rollReady === '1') return;

  const suffix = el.dataset.rollSuffix || '';
  const prefix = el.dataset.rollPrefix || '';
  const loops = parseInt(el.dataset.rollLoops || '2', 10);
  const duration = parseInt(el.dataset.rollDuration || '1000', 10);

  const targetDigits = next.replace(/\D/g, '') || '0';
  const finalDigits = targetDigits;

  el.dataset.rollCurrent = next;
  el.dataset.rollReady = '1';

  const wrap = document.createElement('span');
  wrap.className = 'roll-counter';

  if (prefix) {
    const pre = document.createElement('span');
    pre.className = 'roll-affix';
    pre.textContent = prefix;
    wrap.appendChild(pre);
  }

  finalDigits.split('').forEach((digit) => {
    const d = document.createElement('span');
    d.className = 'roll-digit';

    const strip = document.createElement('span');
    strip.className = 'roll-strip';
    strip.style.transition = `transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;

    const repeats = loops + 2;
    for (let r = 0; r < repeats; r++) {
      for (let n = 0; n <= 9; n++) {
        const num = document.createElement('span');
        num.className = 'roll-num';
        num.textContent = n;
        strip.appendChild(num);
      }
    }

    strip.style.transform = 'translateY(0)';

    d.appendChild(strip);
    wrap.appendChild(d);

    const targetIndex = (loops * 10) + parseInt(digit, 10);
    requestAnimationFrame(() => {
      strip.style.transform = `translateY(calc(-1em * ${targetIndex}))`;
    });
  });

  if (suffix) {
    const suf = document.createElement('span');
    suf.className = 'roll-affix';
    suf.textContent = suffix;
    wrap.appendChild(suf);
  }

  el.textContent = '';
  el.appendChild(wrap);
}

function rollShortNumber(el, value) {
  const style = el.dataset.shortStyle || 'indian';
  const prefix = el.dataset.shortPrefix || '';
  const { numberStr, suffix } = formatShortNumber(value, style);

  const next = `${numberStr}${suffix}`;
  if (el.dataset.shortCurrent === next && el.dataset.shortReady === '1') return;
  el.dataset.shortCurrent = next;
  el.dataset.shortReady = '1';

  const duration = parseInt(el.dataset.shortDuration || '1000', 10);
  const loops = parseInt(el.dataset.shortLoops || '2', 10);

  const wrap = document.createElement('span');
  wrap.className = 'roll-counter';

  if (prefix) {
    const pre = document.createElement('span');
    pre.className = 'roll-affix';
    pre.textContent = prefix;
    wrap.appendChild(pre);
  }

  numberStr.split('').forEach((ch) => {
    if (ch === '.') {
      const dot = document.createElement('span');
      dot.className = 'roll-dot';
      dot.textContent = '.';
      wrap.appendChild(dot);
      return;
    }

    const d = document.createElement('span');
    d.className = 'roll-digit';

    const strip = document.createElement('span');
    strip.className = 'roll-strip';
    strip.style.transition = `transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;

    const repeats = loops + 2;
    for (let r = 0; r < repeats; r++) {
      for (let n = 0; n <= 9; n++) {
        const num = document.createElement('span');
        num.className = 'roll-num';
        num.textContent = n;
        strip.appendChild(num);
      }
    }

    strip.style.transform = 'translateY(0)';
    d.appendChild(strip);
    wrap.appendChild(d);

    const targetIndex = (loops * 10) + parseInt(ch, 10);
    requestAnimationFrame(() => {
      strip.style.transform = `translateY(calc(-1em * ${targetIndex}))`;
    });
  });

  if (suffix) {
    const suf = document.createElement('span');
    suf.className = 'roll-affix';
    suf.textContent = suffix;
    wrap.appendChild(suf);
  }

  el.textContent = '';
  el.appendChild(wrap);
}

function formatShortNumber(value, style) {
  const v = Number(value) || 0;
  let divisor = 1;
  let suffix = '';

  if (style === 'indian') {
    if (v >= 1e7) { divisor = 1e7; suffix = 'Cr'; }
    else if (v >= 1e5) { divisor = 1e5; suffix = 'L'; }
    else if (v >= 1e3) { divisor = 1e3; suffix = 'K'; }
  } else {
    if (v >= 1e6) { divisor = 1e6; suffix = 'M'; }
    else if (v >= 1e3) { divisor = 1e3; suffix = 'K'; }
  }

  const num = v / divisor;
  let numberStr = num.toFixed(num < 100 && num % 1 !== 0 ? 1 : 0);
  if (numberStr.endsWith('.0')) numberStr = numberStr.slice(0, -2);

  return { numberStr, suffix };
}

window.initAdminPage = function() {
  const user = renderLayout({
    pageTitle: 'Admin Panel',
    activePage: 'dashboard',
    allowedRoles: ['super_admin','admin']
  });
  if (!user) throw new Error('Not authenticated');

  const ACTIVE_SECTION_KEY = 'ssms_active_section';

  function getLocalDateISO(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const FIXED_STUDENTS_PER_CLASS = 105;

  function getFeeApplicableStructure() {
    if (typeof FEE_STRUCTURE === 'undefined' || !Array.isArray(FEE_STRUCTURE)) return [];
    return FEE_STRUCTURE
      .filter((fee) => {
        const cls = parseInt(fee?.class, 10);
        return cls >= 1 && cls <= 6;
      })
      .sort((a, b) => parseInt(a.class, 10) - parseInt(b.class, 10));
  }

  function getClassPaidAmount(fees, classNo) {
    return (Array.isArray(fees) ? fees : []).reduce((sum, fee) => {
      const feeClass = parseInt(String(fee?.cls || '').match(/\d+/)?.[0], 10);
      if (feeClass !== classNo) return sum;
      return sum + Math.max(Number(fee?.paid) || 0, 0);
    }, 0);
  }

  function getPendingFeeMetrics(fees) {
    const classRows = getFeeApplicableStructure().map((structure) => {
      const classNo = parseInt(structure.class, 10);
      const totalStudents = FIXED_STUDENTS_PER_CLASS;
      const totalAmount = Math.max(Number(structure.total) || 0, 0) * totalStudents;
      const collectedAmount = Math.min(getClassPaidAmount(fees, classNo), totalAmount);
      const pendingAmount = Math.max(totalAmount - collectedAmount, 0);
      const paidStudents = Math.min(Math.floor(collectedAmount / Math.max(Number(structure.total) || 1, 1)), totalStudents);
      const percentage = totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0;
      return {
        class: classNo,
        totalStudents,
        totalAmount,
        collectedAmount,
        pendingAmount,
        paid_count: paidStudents,
        percentage
      };
    });

    return classRows.reduce((acc, row) => {
      acc.totalExpected += row.totalAmount;
      acc.totalCollected += row.collectedAmount;
      acc.totalPending += row.pendingAmount;
      acc.classes.push(row);
      return acc;
    }, { totalExpected: 0, totalCollected: 0, totalPending: 0, classes: [] });
  }

  // Reset roll counters so animation can replay each time
  const resetRollers = (scope) => {
    (scope || document).querySelectorAll('[data-roll-target],[data-short-target]').forEach(el => {
      delete el.dataset.rollReady;
      delete el.dataset.rollCurrent;
      delete el.dataset.shortReady;
      delete el.dataset.shortCurrent;
      const counter = el.querySelector('.roll-counter');
      if (counter) counter.remove();
    });
  };

  function updateVisitorInquiryBadge(count) {
    const badge = document.getElementById('visitorInquiryNavBadge');
    if (!badge) return;
    const value = Math.max(0, Number(count) || 0);
    if (value > 0) {
      badge.textContent = String(value);
      badge.classList.remove('hidden');
    } else {
      badge.textContent = '0';
      badge.classList.add('hidden');
    }
  }

  // Section-specific enter hooks (animations, etc.)
  const sectionEnterHooks = {};

  // Card flip on 3-second hover — attach to all .flip-card elements in a container
  function attachFlipListeners(container) {
    container.querySelectorAll('.flip-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card._flipTimer = setTimeout(() => card.classList.add('flipped'), 3000);
      });
      card.addEventListener('mouseleave', () => {
        clearTimeout(card._flipTimer);
        card.classList.remove('flipped');
      });
    });
  }

  // Auto-apply stat-card color variants based on icon hue
  (function tintStatCards() {
    const map = {
      blue: 'info',
      cyan: 'info',
      green: 'success',
      purple: 'primary',
      orange: 'warning',
      red: 'danger'
    };
    document.querySelectorAll('.stat-card').forEach(card => {
      if (['primary','success','warning','danger','info'].some(cls => card.classList.contains(cls))) return;
      const icon = card.querySelector('.stat-icon');
      if (!icon) return;
      const match = Object.keys(map).find(k => icon.classList.contains(k));
      if (match) card.classList.add(map[match]);
    });
  })();

  const sections = {
    dashboard: document.getElementById('dashboard-section'),
    students: document.getElementById('students-section'),
    teachers: document.getElementById('teachers-section'),
    attendance: document.getElementById('attendance-section'),
    exams: document.getElementById('exams-section'),
    fees: document.getElementById('fees-section'),
    notices: document.getElementById('notices-section'),
    visitorInquiries: document.getElementById('visitorInquiries-section'),
    timetable: document.getElementById('timetable-section'),
    settings: document.getElementById('settings-section')
  };


  function showSection(key, opts) {
    const target = sections[key];
    if (!target) return;
    Object.entries(sections).forEach(([name, el]) => {
      if (el) el.classList.toggle('hidden', name !== key);
    });
    setActiveNav(key);

    if (!opts || !opts.skipPersist) localStorage.setItem(ACTIVE_SECTION_KEY, key);

    // Restart rolling counters for the newly visible section
    resetRollers(target);
    initRollingCounters(target);
    initShortCounters(target);

    // Section-specific enter animations
    if (sectionEnterHooks[key]) sectionEnterHooks[key](target);
  }

  // Make sidebar links SPA toggles
  document.querySelectorAll('.nav-item[data-page]').forEach(link => {
    link.setAttribute('href', '#');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(link.dataset.page);
    });
  });

  // "View all" inside notification dropdown should open Notices section (SPA) instead of navigating
  const notifFooter = document.querySelector('.notif-footer');
  if (notifFooter) {
    notifFooter.setAttribute('href', '#');
    notifFooter.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = document.getElementById('notifDropdown');
      if (dropdown) {
        dropdown.classList.remove('open');
        dropdown.setAttribute('aria-hidden', 'true');
      }
      showSection('notices');
    });
  }

  // Register section enter animations
  // (dashboard heatmap self-animates; no bar animation hook needed)

  // Section initializers will be appended below.

  /* ---------- DASHBOARD ---------- */
  async function refreshDashboardFeeStats() {
    const scope = sections.dashboard;
    if (!scope) return;
    const fees = await loadFees();
    const metrics = getPendingFeeMetrics(fees);

    const feeStat = scope.querySelector('#stat-fees');
    if (feeStat) feeStat.dataset.shortTarget = metrics.totalPending;

    const revenueStat = scope.querySelector('#stat-revenue');
    if (revenueStat) revenueStat.dataset.shortTarget = metrics.totalCollected;

    initShortCounters(scope);
  }

  async function initDashboardSection() {
    const scope = sections.dashboard;
    const dashStats = await loadDashboardStats();
    const dashNotices = typeof NOTICES !== 'undefined' ? NOTICES : await loadNotices();
    const dashExams = await loadExams();

    scope.querySelector('#stat-students').dataset.rollTarget = dashStats.totalStudents;
    scope.querySelector('#stat-teachers').dataset.rollTarget = dashStats.totalTeachers;
    scope.querySelector('#stat-classes').dataset.rollTarget  = dashStats.totalClasses;
    scope.querySelector('#stat-att').dataset.rollTarget      = Math.round(dashStats.attendancePercent);
    scope.querySelector('#stat-exams').dataset.rollTarget    = dashStats.upcomingExams;
    scope.querySelector('#stat-fees').dataset.shortTarget    = dashStats.pendingFees;
    const statAdmissions = scope.querySelector('#stat-admissions');
    if (statAdmissions) statAdmissions.dataset.rollTarget = dashStats.newAdmissions;
    const statRevenue = scope.querySelector('#stat-revenue');
    if (statRevenue) statRevenue.dataset.shortTarget = dashStats.totalRevenue;
    initRollingCounters(scope);
    initShortCounters(scope);
    await refreshDashboardFeeStats();


        // ── Today's Attendance (Live) ───────────────────────────────
    (async function buildTodayAttendance() {
      const card = scope.querySelector('#todayAttCard');
      if (!card) return;

      async function fetchTodayAtt() {
        try {
          const res = await fetch('/api/dashboard/today-attendance?person_type=student', {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('ssms_token') }
          });
          if (res.ok) return await res.json();
        } catch (_) {}
        return null;
      }

      function formatAttendanceDate(dateStr) {
        if (!dateStr) return '';
        return formatDate(dateStr);
      }

      function formatAttendanceTime(dateTimeStr) {
        if (!dateTimeStr) return '';
        const dt = new Date(String(dateTimeStr).replace(' ', 'T'));
        if (Number.isNaN(dt.getTime())) return dateTimeStr;
        return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      function renderToday(d) {
        if (!d) return;
        const t = d.students;

        scope.querySelector('#todayT_present').textContent  = t.present;
        scope.querySelector('#todayT_absent').textContent   = t.absent;
        scope.querySelector('#todayT_leave').textContent    = t.leave;
        scope.querySelector('#todayT_unmarked').textContent = Math.max(0, t.total - t.marked);
        scope.querySelector('#todayT_marked').textContent   = t.marked;
        scope.querySelector('#todayT_total').textContent    = t.total;
        scope.querySelector('#todayT_pct').textContent      = t.percent + '%';
        scope.querySelector('#todayT_bar').style.width      = t.percent + '%';

        const updEl = scope.querySelector('#todayAttUpdated');
        if (d.isFallback && d.effectiveDate) {
          const parts = ['Showing latest recorded attendance for ' + formatAttendanceDate(d.effectiveDate)];
          if (d.lastUpdated) parts.push('Updated: ' + formatAttendanceTime(d.lastUpdated));
          updEl.textContent = parts.join(' | ');
        } else if (d.lastUpdated) {
          updEl.textContent = 'Updated: ' + formatAttendanceTime(d.lastUpdated);
        } else {
          updEl.textContent = 'No attendance marked yet today';
        }
      }

      async function refreshTodayAttendance() {
        const data = await fetchTodayAtt();
        renderToday(data);
      }

      await refreshTodayAttendance();
      window.addEventListener('ssms:attendance-saved', refreshTodayAttendance);

      // Auto-refresh every 60 seconds
      setInterval(refreshTodayAttendance, 60000);
    })();

    (async function buildDashHeatmap() {
      const container  = scope.querySelector('#dashHeatmap');
      const statsEl    = scope.querySelector('#dashHeatmapStats');
      const legendEl   = scope.querySelector('#dashHeatmapLegend');
      const card       = scope.querySelector('#dashHeatmapCard');
      if (!container) return;

      const cache = {};
      const holidaysCache = {};
      const vacationsCache = {};

      function buildFallbackHeatmap(records, type) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const ay1 = currentMonth >= 7 ? now.getFullYear() : now.getFullYear() - 1;
        const ay2 = ay1 + 1;
        const fromDate = `${ay1}-07-01`;
        const toDate = `${ay2}-06-30`;
        const grouped = new Map();

        (Array.isArray(records) ? records : []).forEach((record) => {
          const date = String(record?.date || '').trim();
          if (!date || date < fromDate || date > toDate) return;
          if (!grouped.has(date)) grouped.set(date, { date, total: 0, present: 0, absent: 0, leave_count: 0 });
          const row = grouped.get(date);
          row.total += 1;
          if (record.status === 'P') row.present += 1;
          else if (record.status === 'A') row.absent += 1;
          else if (record.status === 'L') row.leave_count += 1;
        });

        return {
          data: Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date)),
          academicYear: `${ay1}-${String(ay2).slice(-2)}`,
          type
        };
      }
      
      async function fetchData(type) {
        if (cache[type]) return cache[type];
        let heatmap = null;
        try {
          if (typeof loadDashboardAttendanceHeatmap === 'function') {
            heatmap = await loadDashboardAttendanceHeatmap(type);
          }
        } catch (_) {}

        if (!Array.isArray(heatmap?.data) || !heatmap.data.length) {
          try {
            const attendance = typeof loadAttendance === 'function'
              ? await loadAttendance({ person_type: type, page: 1, limit: 20000 })
              : { data: [] };
            heatmap = typeof buildDashboardAttendanceHeatmapFromRecords === 'function'
              ? buildDashboardAttendanceHeatmapFromRecords(attendance.data || [], type)
              : buildFallbackHeatmap(attendance.data || [], type);
          } catch (_) {}
        }

        cache[type] = Array.isArray(heatmap?.data) ? heatmap.data : [];
        const _yl = scope.querySelector('#dashHmYearLabel');
        if (_yl && heatmap?.academicYear) _yl.textContent = heatmap.academicYear;
        if (cache[type].length) return cache[type];
        return [];
      }
      
      async function fetchHolidays(year) {
        if (holidaysCache[year]) return holidaysCache[year];
        try {
          const res = await fetch(`/api/holidays/${year}`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('ssms_token') }
          });
          if (res.ok) {
            const json = await res.json();
            const set = new Set(json.holidays || []);
            const titles = {};
            (json.details || []).forEach(h => { titles[h.holiday_date] = h.title; });
            holidaysCache[year] = { set, titles };
            return holidaysCache[year];
          }
        } catch (_) {}
        return { set: new Set(), titles: {} };
      }

      async function fetchVacations(year) {
        if (vacationsCache[year]) return vacationsCache[year];
        try {
          const res = await fetch(`/api/vacations/${year}`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('ssms_token') }
          });
          if (res.ok) {
            const json = await res.json();
            const periods = json.vacations || [];
            vacationsCache[year] = { periods };
            return vacationsCache[year];
          }
        } catch (_) {}
        return { periods: [] };
      }

      function isInVacation(dateStr, vacationPeriods) {
        for (const period of vacationPeriods) {
          if (dateStr >= period.start_date && dateStr <= period.end_date) {
            return { inVacation: true, title: period.title };
          }
        }
        return { inVacation: false };
      }

      function level(pct) {
        if (pct == null || pct === 0) return 0;
        if (pct >= 95) return 5;
        if (pct >= 85) return 4;
        if (pct >= 75) return 3;
        if (pct >= 60) return 2;
        return 1;
      }
      function hmColor(pct) {
        if (pct >= 95) return '#16a34a';
        if (pct >= 85) return '#22c55e';
        if (pct >= 75) return '#facc15';
        if (pct >= 60) return '#f97316';
        return '#ef4444';
      }

      function statusLabel(pct) {
        if (pct >= 95) return 'Excellent';
        if (pct >= 85) return 'Good';
        if (pct >= 75) return 'Average';
        if (pct >= 60) return 'Low';
        return 'Poor';
      }

      function render(data, typeLabel, holidays, vacations) {
        if (!data || !data.length) {
          container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:24px 0;">No attendance data available.</p>';
          if (statsEl) statsEl.innerHTML = '';
          if (legendEl) legendEl.innerHTML = '';
          return;
        }

        const holidaySet = holidays ? holidays.set : new Set();
        const holidayTitles = holidays ? holidays.titles : {};
        const vacationPeriods = vacations ? vacations.periods : [];

        const lookup = {};
        let totPresent = 0, totRecords = 0, bestDay = null, worstDay = null;
        data.forEach(r => {
          const pct = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
          lookup[r.date] = { ...r, pct };
          totPresent += r.present; totRecords += r.total;
          if (r.total > 0) {
            if (!bestDay  || pct > bestDay.pct)  bestDay  = { date: r.date, pct };
            if (!worstDay || pct < worstDay.pct) worstDay = { date: r.date, pct };
          }
        });

        const allDates = Object.keys(lookup).sort();
        // Academic year: July startYear to June endYear
        const _ref = allDates[0] || new Date().toISOString().split('T')[0];
        const _fy  = parseInt(_ref.slice(0, 4)), _fm = parseInt(_ref.slice(5, 7));
        const startYear   = _fm >= 7 ? _fy : _fy - 1;
        const endYear     = startYear + 1;
        const acYearLabel = startYear + '-' + String(endYear).slice(-2);
        const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const DAYS_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const CELL = 13, GAP = 2;

        const yearStart = new Date(Date.UTC(startYear, 6, 1));   // 1 Jul
        const yearEnd   = new Date(Date.UTC(endYear,   5, 30));  // 30 Jun
        const padDow    = yearStart.getUTCDay();
        const mondayPad = padDow === 0 ? 6 : padDow - 1;
        const gridStart = new Date(yearStart);
        gridStart.setUTCDate(yearStart.getUTCDate() - mondayPad);

        const weeks = [];
        const cur = new Date(gridStart);
        while (cur <= yearEnd) {
          const wk = [];
          for (let d = 0; d < 7; d++) {
            const ds  = cur.toISOString().split('T')[0];
            const inY = ds >= startYear + '-07-01' && ds <= endYear + '-06-30';
            const dow = cur.getUTCDay();
            const isSunday = dow === 0;
            const vacCheck = isInVacation(ds, vacationPeriods);
            const isVacation = vacCheck.inVacation;
            const vacTitle = vacCheck.title || '';
            const isHoliday = holidaySet.has(ds);
            const holTitle  = holidayTitles[ds] || '';
            wk.push({ ds, inY, isSunday, isVacation, vacTitle, isHoliday, holTitle, stats: inY ? (lookup[ds] || null) : null });
            cur.setUTCDate(cur.getUTCDate() + 1);
          }
          weeks.push(wk);
        }

        const monthPos = [];
        weeks.forEach((wk, wi) => {
          const first = wk.find(c => c.inY);
          if (first) {
            const m = parseInt(first.ds.slice(5, 7)) - 1;
            if (!monthPos.length || monthPos[monthPos.length - 1].m !== m)
              monthPos.push({ m, wi });
          }
        });

        // Academic year months in order: Jul..Dec of startYear, Jan..Jun of endYear
        const AY_MONTHS = [
          {yr: startYear, mi: 6}, {yr: startYear, mi: 7},  {yr: startYear, mi: 8},
          {yr: startYear, mi: 9}, {yr: startYear, mi: 10}, {yr: startYear, mi: 11},
          {yr: endYear,   mi: 0}, {yr: endYear,   mi: 1},  {yr: endYear,   mi: 2},
          {yr: endYear,   mi: 3}, {yr: endYear,   mi: 4},  {yr: endYear,   mi: 5}
        ];
        const monthlyStats = AY_MONTHS.map(({yr, mi}) => {
          const prefix = yr + '-' + String(mi + 1).padStart(2, '0');
          const days = data.filter(r => r.date.startsWith(prefix));
          const mT = days.reduce((s, r) => s + r.total, 0);
          const mP = days.reduce((s, r) => s + r.present, 0);
          return { short: MONTHS_SHORT[mi], full: MONTHS_FULL[mi], pct: mT > 0 ? Math.round((mP / mT) * 100) : null };
        });

        const totalW = weeks.length * (CELL + GAP);
        const TODAY = new Date().toISOString().split('T')[0];

        let html = `<div class="hm-github-wrap">`;
        html += `<div class="hm-days-col">`;
        html += `<div style="height:18px;"></div>`;
        DAYS_SHORT.forEach(d => {
          html += `<div class="hm-day-label" style="height:${CELL}px;line-height:${CELL}px;margin-bottom:${GAP}px;">${d}</div>`;
        });
        html += `</div>`;

        html += `<div class="hm-grid-section">`;
        html += `<div style="position:relative;height:18px;width:${totalW}px;">`;
        monthPos.forEach(mp => {
          html += `<span class="hm-month-label" style="position:absolute;left:${mp.wi * (CELL + GAP)}px;">${MONTHS_SHORT[mp.m]}</span>`;
        });
        html += `</div>`;

        html += `<div style="display:flex;gap:${GAP}px;">`;
        weeks.forEach(wk => {
          html += `<div style="display:flex;flex-direction:column;gap:${GAP}px;">`;
          wk.forEach(cell => {
            if (!cell.inY) {
              html += `<div style="width:${CELL}px;height:${CELL}px;"></div>`;
            } else if (cell.isVacation) {
              // ✅ PRIORITY 1: Vacation (Mon–Sat) — sky blue
              html += `<div class="hm-cell hm-vacation" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: ${cell.vacTitle} 🏖️"></div>`;
            } else if (cell.isHoliday) {
              // ✅ PRIORITY 2: Festival/manual holiday (Mon–Sat) — pink
              html += `<div class="hm-cell hm-holiday" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: ${cell.holTitle || cell.vacTitle || 'Holiday'} ♥"></div>`;
            } else if (cell.isSunday) {
              // ✅ PRIORITY 3: Sunday — always indigo, even during vacation week
              html += `<div class="hm-cell hm-sun" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: Sunday"></div>`;
            } else if (cell.ds > TODAY) {
              // ✅ PRIORITY 4a: Future date — always No Record
              html += `<div class="hm-cell hm-lv0" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: No record (future)"></div>`;
            } else if (!cell.stats) {
              // ✅ PRIORITY 4: No attendance data
              const todayClass = cell.ds === TODAY ? ' hm-today' : '';
              html += `<div class="hm-cell hm-lv0${todayClass}" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: No record"></div>`;
            } else {
              // ✅ PRIORITY 5: Regular working day with attendance
              const s = cell.stats;
              const todayClass = cell.ds === TODAY ? ' hm-today' : '';
              const sLbl = statusLabel(s.pct);
              html += `<div class="hm-cell hm-lv${level(s.pct)}${todayClass}" style="width:${CELL}px;height:${CELL}px;" title="📅 ${cell.ds}&#10;👥 Present: ${s.present} / ${s.total}&#10;📊 Attendance: ${s.pct}%&#10;⭐ Status: ${sLbl}"></div>`;
            }
          });
          html += `</div>`;
        });
        html += `</div>`;

        html += `</div></div>`;
        container.innerHTML = html;

        // Stats row
        const avgPct   = totRecords > 0 ? Math.round((totPresent / totRecords) * 100) : 0;
        const workDays = data.filter(r => r.total > 0).length;
        const fmtDate  = ds => { const [, m, d] = ds.split('-'); return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]}`; };
        const validMs  = monthlyStats.filter(m => m.pct !== null);
        const bestMon  = validMs.length ? validMs.reduce((b, m) => m.pct > b.pct ? m : b) : null;
        const worstMon = validMs.length ? validMs.reduce((w, m) => m.pct < w.pct ? m : w) : null;
        const improvePct = (validMs.length >= 2) ? (validMs[validMs.length - 1].pct - validMs[0].pct) : null;
        if (statsEl) statsEl.innerHTML = `
          <div class="hm-stat"><span class="hm-stat-val">${workDays}</span><span class="hm-stat-lbl">Working Days</span></div>
          <div class="hm-stat"><span class="hm-stat-val">${avgPct}%</span><span class="hm-stat-lbl">Avg Attendance</span></div>
          <div class="hm-stat hm-stat-best"><span class="hm-stat-val">${bestDay ? bestDay.pct + '%' : '—'}</span><span class="hm-stat-lbl">Best Day${bestDay ? ' <small style="font-size:0.6rem;color:#64748b;">' + fmtDate(bestDay.date) + '</small>' : ''}</span></div>
          <div class="hm-stat hm-stat-worst"><span class="hm-stat-val">${worstDay ? worstDay.pct + '%' : '—'}</span><span class="hm-stat-lbl">Worst Day${worstDay ? ' <small style="font-size:0.6rem;color:#64748b;">' + fmtDate(worstDay.date) + '</small>' : ''}</span></div>
          <div class="hm-stat hm-stat-best"><span class="hm-stat-val">${bestMon ? bestMon.pct + '%' : '—'}</span><span class="hm-stat-lbl">🔥 Best Month${bestMon ? ' <small style="font-size:0.6rem;color:#64748b;">' + bestMon.short + '</small>' : ''}</span></div>
          <div class="hm-stat hm-stat-worst"><span class="hm-stat-val">${worstMon ? worstMon.pct + '%' : '—'}</span><span class="hm-stat-lbl">⚠️ Worst Month${worstMon ? ' <small style="font-size:0.6rem;color:#64748b;">' + worstMon.short + '</small>' : ''}</span></div>
          ${improvePct !== null ? `<div class="hm-stat"><span class="hm-stat-val" style="color:${improvePct >= 0 ? '#16a34a' : '#ef4444'}">${improvePct >= 0 ? '+' : ''}${improvePct}%</span><span class="hm-stat-lbl">📈 Trend</span></div>` : ''}`;

        // Legend
        const lvLabels = ['No record','<60%','60–74%','75–84%','85–94%','95–100%'];
        const lvColors = ['#e5e7eb','#ef4444','#f97316','#facc15','#22c55e','#16a34a'];
        if (legendEl) {
          legendEl.innerHTML = `<div class="hm-legend-row">
            <span class="hm-leg-txt">Less</span>
            ${lvColors.map((c, i) => `<div class="hm-cell" style="width:11px;height:11px;background:${c};" title="${lvLabels[i]}"></div>`).join('')}
            <span class="hm-leg-txt">More</span>
            <span class="hm-leg-sep">|</span>
            <span style="display:inline-flex;align-items:center;gap:3px;"><div style="width:9px;height:9px;border-radius:2px;background:#93c5fd;border:1px solid #60a5fa;"></div><span class="hm-leg-txt">Vacation</span></span>
            <span style="display:inline-flex;align-items:center;gap:3px;"><div style="width:9px;height:9px;border-radius:2px;background:#fca5a5;border:1px dashed #ef4444;"></div><span class="hm-leg-txt">Holiday</span></span>
            <span style="display:inline-flex;align-items:center;gap:3px;"><div style="width:9px;height:9px;border-radius:2px;background:#c7d2fe;border:1px solid #a5b4fc;"></div><span class="hm-leg-txt">Sunday</span></span>
            <span class="hm-leg-sep">|</span>
            ${lvLabels.map((l, i) => `<span style="display:inline-flex;align-items:center;gap:3px;"><div style="width:9px;height:9px;border-radius:2px;background:${lvColors[i]};"></div><span class="hm-leg-txt">${l}</span></span>`).join(' ')}
          </div>`;
        }
      }

      function setActiveTypeButton(type) {
        if (!card) return;
        card.querySelectorAll('.dash-hm-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.type === type);
        });
      }

      // Initial load
      let currentType = 'student';
      container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:24px 0;">Loading...</p>';
      let initData = await fetchData(currentType);
      if (!initData.length) {
        const teacherData = await fetchData('teacher');
        if (teacherData.length) {
          currentType = 'teacher';
          initData = teacherData;
        }
      }
      setActiveTypeButton(currentType);
      // Fetch holidays + vacations for both parts of the academic year
      const _n = new Date(), _cm = _n.getMonth() + 1;
      const _ays = _cm >= 7 ? _n.getFullYear() : _n.getFullYear() - 1;
      const _aye = _ays + 1;
      const [_h1, _h2, _v1, _v2] = await Promise.all([
        fetchHolidays(_ays), fetchHolidays(_aye),
        fetchVacations(_ays), fetchVacations(_aye)
      ]);
      const initHolidays  = { set: new Set([..._h1.set, ..._h2.set]), titles: { ..._h1.titles, ..._h2.titles } };
      const initVacations = { periods: [..._v1.periods, ..._v2.periods] };
      const initLabel = currentType === 'teacher' ? 'Teacher' : 'Student';
      render(initData, initLabel, initHolidays, initVacations);

      // Toggle buttons
      if (card) {
        card.querySelectorAll('.dash-hm-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            currentType = btn.dataset.type;
            setActiveTypeButton(currentType);
            const label = currentType === 'teacher' ? 'Teacher' : 'Student';
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:24px 0;">Loading...</p>';
            const d = await fetchData(currentType);
            render(d, label, initHolidays, initVacations);
          });
        });
      }
    })();

    (async function buildBulletChart() {
      const wrap = scope.querySelector('#bulletChart');
      if (!wrap) return;

      // Gather fee summary for fee KPI
      let feePaid = 0, feeTotal = 1;
      try {
        const fs = await loadFeeSummary();
        feePaid  = (fs.paid || 0);
        feeTotal = (fs.paid || 0) + (fs.partial || 0) + (fs.pending || 0) || 1;
      } catch(e) {}

      // Gather marks average for academic KPI
      let acadPct = 0;
      try {
        const md = await loadClassMarksProgress();
        acadPct = md.overall || 0;
      } catch(e) {}

      const metrics = [
        {
          label: 'Attendance',
          icon: '📅',
          actual: Math.round(dashStats.attendancePercent || 0),
          target: 90,
          unit: '%',
          color: '#6366f1'
        },
        {
          label: 'Active Students',
          icon: '🎓',
          actual: dashStats.totalStudents > 0
            ? Math.round((dashStats.activeStudents / dashStats.totalStudents) * 100)
            : 0,
          target: 95,
          unit: '%',
          color: '#0ea5e9'
        },
        {
          label: 'Fee Paid',
          icon: '💳',
          actual: Math.round((feePaid / feeTotal) * 100),
          target: 80,
          unit: '%',
          color: '#10b981'
        },
        {
          label: 'Academic Avg',
          icon: '📊',
          actual: Math.round(acadPct),
          target: 85,
          unit: '%',
          color: '#f59e0b'
        }
      ];

      wrap.innerHTML = metrics.map(m => {
        const pct    = Math.min(m.actual, 100);
        const tgtPct = Math.min(m.target, 100);
        const isGood = pct >= m.target;
        const barColor = isGood ? m.color : '#f97316';
        return `
          <div style="margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:0.82rem;font-weight:600;color:#334155;">${m.icon} ${m.label}</span>
              <span style="font-size:0.8rem;font-weight:700;color:${barColor};">${m.actual}${m.unit}
                <span style="font-size:0.7rem;color:#94a3b8;font-weight:400;"> / target ${m.target}${m.unit}</span>
              </span>
            </div>
            <div style="position:relative;height:22px;border-radius:6px;overflow:visible;background:transparent;">
              <!-- range bands -->
              <div style="position:absolute;inset:0;display:flex;border-radius:6px;overflow:hidden;">
                <div style="flex:0 0 50%;background:rgba(239,68,68,0.12);"></div>
                <div style="flex:0 0 30%;background:rgba(234,179,8,0.14);"></div>
                <div style="flex:0 0 20%;background:rgba(34,197,94,0.14);"></div>
              </div>
              <!-- actual bar -->
              <div style="position:absolute;top:3px;left:0;height:16px;border-radius:4px;
                          width:${pct}%;background:${barColor};transition:width 0.9s cubic-bezier(.4,0,.2,1);opacity:0.9;"
                   class="bullet-bar"></div>
              <!-- target marker -->
              <div style="position:absolute;top:0;left:${tgtPct}%;width:2px;height:22px;
                          background:#1e293b;border-radius:2px;transform:translateX(-50%);"
                   title="Target: ${m.target}${m.unit}"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#94a3b8;margin-top:3px;">
              <span>0%</span><span>50%</span><span>80%</span><span>100%</span>
            </div>
          </div>`;
      }).join('');

      // Animate bars from 0 → actual
      requestAnimationFrame(() => {
        wrap.querySelectorAll('.bullet-bar').forEach((bar, i) => {
          bar.style.width = '0%';
          setTimeout(() => { bar.style.width = Math.min(metrics[i].actual, 100) + '%'; }, 120 + i * 80);
        });
      });
    })();

    (function buildNotices() {
      const el = scope.querySelector('#noticeList');
      el.innerHTML = dashNotices.slice(0, 5).map(n => `
        <div class="notice-item">
          <div class="notice-title">${n.title}</div>
          <div class="notice-desc">${n.body.substring(0, 80)}…</div>
          <div class="notice-meta-row">
            <span class="notice-date">${formatDate(n.date)}</span>
          </div>
        </div>`).join('');
    })();

    (function buildExams() {
      const tbody = scope.querySelector('#examTable');
      tbody.innerHTML = dashExams.slice(0, 5).map(ex => `
        <tr>
          <td class="td-name">${ex.name}</td>
          <td>Class ${ex.class}</td>
          <td>${ex.subject}</td>
          <td>${formatDate(ex.date)}</td>
          <td><span class="badge ${statusBadge(ex.status)}">${ex.status}</span></td>
        </tr>`).join('');
    })();

    (async function buildFeeStatus() {
      const feeSummary = await loadFeeSummary();
      const paid    = feeSummary.paid    || 0;
      const partial = feeSummary.partial || 0;
      const pending = feeSummary.pending || 0;
      scope.querySelector('#feeStatusGrid').innerHTML = `
        <div style="text-align:center;padding:16px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
          <div style="font-size:1.5rem;font-weight:700;color:#059669;">${paid}</div>
          <div style="font-size:0.75rem;color:#065f46;font-weight:600;">Paid</div>
        </div>
        <div style="text-align:center;padding:16px;background:#fef3c7;border-radius:10px;border:1px solid #fde68a;">
          <div style="font-size:1.5rem;font-weight:700;color:#d97706;">${partial}</div>
          <div style="font-size:0.75rem;color:#92400e;font-weight:600;">Partial</div>
        </div>
        <div style="text-align:center;padding:16px;background:#fef2f2;border-radius:10px;border:1px solid #fca5a5;">
          <div style="font-size:1.5rem;font-weight:700;color:#dc2626;">${pending}</div>
          <div style="font-size:0.75rem;color:#991b1b;font-weight:600;">Pending</div>
        </div>`;

      const feeMetrics = getPendingFeeMetrics(await loadFees());
      const feeApplicableClasses = feeMetrics.classes;
      const colors = ['purple','blue','green','orange','red','teal'];
      scope.querySelector('#classWiseFee').innerHTML = feeApplicableClasses.length ? feeApplicableClasses.map((c,i) => {
        const paidCount = c.paid_count || 0;
        const totalStudents = c.totalStudents || 0;
        const collectedAmt = c.collectedAmount || 0;
        const totalAmt = c.totalAmount || 0;
        return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px;">
            <span style="font-weight:600;">Class ${c.class}</span>
            <span style="color:#64748b;" title="${paidCount} of ${totalStudents} students paid · ₹${collectedAmt.toLocaleString()} / ₹${totalAmt.toLocaleString()}">${c.percentage}% collected</span>
          </div>
          <div class="progress-bar" title="${paidCount} students paid, ${totalStudents - paidCount} pending">
            <div class="progress-fill ${colors[i % colors.length]}" style="width:${c.percentage}%;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#94a3b8;margin-top:2px;">
            <span>${paidCount} / ${totalStudents} students</span>
            <span>₹${collectedAmt.toLocaleString()} / ₹${totalAmt.toLocaleString()}</span>
          </div>
        </div>`;
      }).join('') : '<div style="padding:12px 0;color:#94a3b8;font-size:0.82rem;">No fee records available.</div>';
    })();

    (async function buildMarksDonut() {
      let marksData = { overall: 0, target: 85, hasData: false, classes: [] };
      try {
        const res = await fetch('/api/dashboard/class-marks-progress', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('ssms_token') }
        });
        if (res.ok) marksData = await res.json();
      } catch (e) { /* use default */ }

      const current = Math.round(marksData.overall);
      const target  = Math.round(marksData.target);

      function perfColor(pct) {
        if (pct >= 85) return '#22c55e';
        if (pct >= 75) return '#4f8ef7';
        if (pct >= 60) return '#f59e0b';
        return '#ef4444';
      }

      // --- Donut animation ---
      const donut      = scope.querySelector('#marksDonut');
      const valueEl    = scope.querySelector('#marksDonutValue');
      const targetLeg  = scope.querySelector('#marksTargetLeg');
      const currentLeg = scope.querySelector('#marksCurrentLeg');

      const ringCurrent = donut.querySelector('.marks-ring-current');
      const ringTarget  = donut.querySelector('.marks-ring-target');
      const rCurrent = parseFloat(ringCurrent.getAttribute('r'));
      const rTarget  = parseFloat(ringTarget.getAttribute('r'));
      const cCurrent = 2 * Math.PI * rCurrent;
      const cTarget  = 2 * Math.PI * rTarget;

      const mainColor = perfColor(current);
      ringCurrent.style.stroke = mainColor;
      ringTarget.style.stroke  = '#7c9cff';
      valueEl.style.color      = mainColor;

      ringCurrent.style.strokeDasharray  = `${cCurrent}`;
      ringCurrent.style.strokeDashoffset = `${cCurrent}`;
      ringTarget.style.strokeDasharray   = `${cTarget}`;
      ringTarget.style.strokeDashoffset  = `${cTarget}`;

      const startT   = performance.now();
      const ease     = t => 1 - Math.pow(1 - t, 3);
      function tick(now) {
        const t = Math.min(1, (now - startT) / 1100);
        const e = ease(t);
        ringCurrent.style.strokeDashoffset = `${cCurrent * (1 - e * current / 100)}`;
        ringTarget.style.strokeDashoffset  = `${cTarget  * (1 - e * target  / 100)}`;
        valueEl.textContent    = `${Math.round(e * current)}%`;
        currentLeg.textContent = `${Math.round(e * current)}%`;
        targetLeg.textContent  = `${target}%`;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);

      // --- Class-wise bars ---
      const classBarsEl = scope.querySelector('#marksClassBars');
      if (marksData.hasData && marksData.classes.length) {
        classBarsEl.innerHTML = marksData.classes.map(c => {
          const pct = Math.round(c.percentage);
          const col = perfColor(pct);
          const tip = `${c.total_students} students · High: ${Math.round(c.highest)}% · Low: ${Math.round(c.lowest)}%`;
          return `
          <div class="mcb-row" title="${tip}">
            <span class="mcb-label">Std ${c.class_no}</span>
            <div class="mcb-track">
              <div class="mcb-fill" style="width:0%;background:${col}" data-pct="${pct}"></div>
            </div>
            <span class="mcb-pct" style="color:${col}">${pct}%</span>
          </div>`;
        }).join('');
        requestAnimationFrame(() => {
          classBarsEl.querySelectorAll('.mcb-fill').forEach((bar, i) => {
            bar.style.transition = `width 0.85s ${i * 60}ms cubic-bezier(0.34,1.4,0.64,1)`;
            bar.style.width = bar.dataset.pct + '%';
          });
        });
      } else {
        classBarsEl.innerHTML = '<div class="mcb-empty">No results data yet. Add results to see class-wise performance.</div>';
      }

      // --- View All modal ---
      const overlay    = document.getElementById('marksDetailOverlay');
      const modalClose = document.getElementById('marksModalClose');
      const modalContent = document.getElementById('marksModalContent');
      const viewMarksBtn = scope.querySelector('#viewMarksBtn') || document.getElementById('viewMarksBtn');

      function openMarksModal() {
        if (!overlay) return;
        if (marksData.hasData && marksData.classes.length) {
          modalContent.innerHTML = `
          <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
            <thead>
              <tr style="background:var(--bg-soft,#f8fafc);">
                <th style="padding:8px 10px;text-align:left;font-weight:600;border-bottom:1px solid var(--border,#e2e8f0);">Class</th>
                <th style="padding:8px 10px;text-align:left;font-weight:600;border-bottom:1px solid var(--border,#e2e8f0);">Performance</th>
                <th style="padding:8px 6px;text-align:center;font-weight:600;border-bottom:1px solid var(--border,#e2e8f0);">Avg %</th>
                <th style="padding:8px 6px;text-align:center;font-weight:600;border-bottom:1px solid var(--border,#e2e8f0);">Students</th>
                <th style="padding:8px 6px;text-align:center;font-weight:600;border-bottom:1px solid var(--border,#e2e8f0);">Highest</th>
                <th style="padding:8px 6px;text-align:center;font-weight:600;border-bottom:1px solid var(--border,#e2e8f0);">Lowest</th>
              </tr>
            </thead>
            <tbody>
              ${marksData.classes.map(c => {
                const pct = Math.round(c.percentage);
                const col = perfColor(pct);
                const grade = pct>=85?'Excellent':pct>=75?'Good':pct>=60?'Average':'Needs Improvement';
                return `<tr style="border-bottom:1px solid var(--border,#f1f5f9);">
                  <td style="padding:9px 10px;font-weight:600;">Std ${c.class_no}</td>
                  <td style="padding:9px 10px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div style="flex:1;height:6px;background:#e8edf5;border-radius:999px;overflow:hidden;">
                        <div style="height:100%;width:${pct}%;background:${col};border-radius:999px;"></div>
                      </div>
                      <span style="font-size:0.7rem;color:${col};font-weight:600;white-space:nowrap;">${grade}</span>
                    </div>
                  </td>
                  <td style="padding:9px 6px;text-align:center;font-weight:700;color:${col};">${pct}%</td>
                  <td style="padding:9px 6px;text-align:center;color:#64748b;">${c.total_students}</td>
                  <td style="padding:9px 6px;text-align:center;color:#22c55e;font-weight:600;">${Math.round(c.highest)}%</td>
                  <td style="padding:9px 6px;text-align:center;color:#ef4444;font-weight:600;">${Math.round(c.lowest)}%</td>
                </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background:var(--bg-soft,#f8fafc);">
                <td colspan="2" style="padding:9px 10px;font-weight:700;">School Average</td>
                <td style="padding:9px 6px;text-align:center;font-weight:800;color:${perfColor(current)};">${current}%</td>
                <td colspan="3"></td>
              </tr>
            </tfoot>
          </table>`;
        } else {
          modalContent.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem;text-align:center;padding:2rem;">No results data available yet.<br>Add student results to see class-wise performance.</p>';
        }
        overlay.classList.remove('hidden');
      }

      if (viewMarksBtn) viewMarksBtn.addEventListener('click', openMarksModal);
      if (modalClose)   modalClose.addEventListener('click', () => overlay.classList.add('hidden'));
      if (overlay)      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
    })();

    // ── Attendance Activity Heatmap ───────────────────────────────────
    (async function buildHeatmap() {
      const card = scope.querySelector('#heatmapCard');
      const container = scope.querySelector('#activityHeatmap');
      const statsEl   = scope.querySelector('#heatmapStats');
      const legendEl  = scope.querySelector('#heatmapLegend');
      if (!card || !container) return;

      const cache = {};
      let holidaysCache2 = null;
      let vacationsCache2 = null;

      async function fetchData(type) {
        if (cache[type]) return cache[type];
        try {
          const heatmap = typeof loadDashboardAttendanceHeatmap === 'function'
            ? await loadDashboardAttendanceHeatmap(type)
            : { data: [] };
          cache[type] = Array.isArray(heatmap?.data) ? heatmap.data : [];
          const _yl = scope.querySelector('#dashHmYearLabel');
          if (_yl && heatmap?.academicYear) _yl.textContent = heatmap.academicYear;
          if (cache[type].length) return cache[type];
        } catch (_) {}
        return [];
      }
      
      async function fetchHolidays2(year) {
        if (holidaysCache2) return holidaysCache2;
        try {
          const res = await fetch(`/api/holidays/${year}`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('ssms_token') }
          });
          if (res.ok) {
            const json = await res.json();
            const set = new Set(json.holidays || []);
            const titles = {};
            (json.details || []).forEach(h => { titles[h.holiday_date] = h.title; });
            holidaysCache2 = { set, titles };
            return holidaysCache2;
          }
        } catch (_) {}
        return { set: new Set(), titles: {} };
      }

      async function fetchVacations2(year) {
        if (vacationsCache2) return vacationsCache2;
        try {
          const res = await fetch(`/api/vacations/${year}`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('ssms_token') }
          });
          if (res.ok) {
            const json = await res.json();
            const periods = json.vacations || [];
            vacationsCache2 = { periods };
            return vacationsCache2;
          }
        } catch (_) {}
        return { periods: [] };
      }

      function isInVacation2(dateStr, vacationPeriods) {
        for (const period of vacationPeriods) {
          if (dateStr >= period.start_date && dateStr <= period.end_date) {
            return { inVacation: true, title: period.title };
          }
        }
        return { inVacation: false };
      }

      function level(pct) {
        if (pct == null || pct === 0) return 0;
        if (pct >= 95) return 5;
        if (pct >= 85) return 4;
        if (pct >= 75) return 3;
        if (pct >= 60) return 2;
        return 1;
      }

      function hmColor(pct) {
        if (pct >= 95) return '#16a34a';
        if (pct >= 85) return '#22c55e';
        if (pct >= 75) return '#facc15';
        if (pct >= 60) return '#f97316';
        return '#ef4444';
      }

      // track current type label for chart title
      let currentTypeLabel = 'Student';

      function render(data, holidays2, vacations2) {
        if (!data || !data.length) {
          container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:24px 0;">No attendance data available.</p>';
          statsEl.innerHTML = ''; legendEl.innerHTML = ''; return;
        }

        const holidaySet2 = holidays2 ? holidays2.set : new Set();
        const holidayTitles2 = holidays2 ? holidays2.titles : {};
        const vacationPeriods = vacations2 ? vacations2.periods : [];

        // Build date → stats lookup
        const lookup = {};
        let totPresent = 0, totRecords = 0, bestDay = null, worstDay = null;
        data.forEach(r => {
          const pct = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
          lookup[r.date] = { ...r, pct };
          totPresent += r.present; totRecords += r.total;
          if (r.total > 0) {
            if (!bestDay  || pct > bestDay.pct)  bestDay  = { date: r.date, pct };
            if (!worstDay || pct < worstDay.pct) worstDay = { date: r.date, pct };
          }
        });

        const allDates = Object.keys(lookup).sort();
        const year = allDates[0] ? parseInt(allDates[0].slice(0, 4)) : new Date().getFullYear();
        const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const DAYS_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const CELL = 13, GAP = 2;

        // Pad grid start back to the Monday on/before Jan 1
        const yearStart = new Date(Date.UTC(year, 0, 1));
        const yearEnd   = new Date(Date.UTC(year, 11, 31));
        const padDow    = yearStart.getUTCDay();
        const mondayPad = padDow === 0 ? 6 : padDow - 1;
        const gridStart = new Date(yearStart);
        gridStart.setUTCDate(yearStart.getUTCDate() - mondayPad);

        // Build 53-week array (Mon→Sun columns)
        const weeks = [];
        const cur = new Date(gridStart);
        while (cur <= yearEnd) {
          const wk = [];
          for (let d = 0; d < 7; d++) {
            const ds  = cur.toISOString().split('T')[0];
            const inY = cur.getUTCFullYear() === year;
            const dow = cur.getUTCDay();
            const isSunday = dow === 0;
            const isHoliday = holidaySet2.has(ds);
            const holTitle  = holidayTitles2[ds] || '';
            const vacCheck = isInVacation2(ds, vacationPeriods);
            const isVacation = vacCheck.inVacation;
            const vacTitle = vacCheck.title || '';
            wk.push({ ds, inY, isSunday, isHoliday, holTitle, isVacation, vacTitle, stats: inY ? (lookup[ds] || null) : null });
            cur.setUTCDate(cur.getUTCDate() + 1);
          }
          weeks.push(wk);
        }

        // Month label positions (leftmost week col that contains a day from that month)
        const monthPos = [];
        weeks.forEach((wk, wi) => {
          const first = wk.find(c => c.inY);
          if (first) {
            const m = parseInt(first.ds.slice(5, 7)) - 1;
            if (!monthPos.length || monthPos[monthPos.length - 1].m !== m)
              monthPos.push({ m, wi });
          }
        });

        // Monthly stats for bar chart
        const monthlyStats = Array.from({ length: 12 }, (_, mi) => {
          const prefix = `${year}-${String(mi + 1).padStart(2, '0')}`;
          const days = data.filter(r => r.date.startsWith(prefix));
          const mT = days.reduce((s, r) => s + r.total, 0);
          const mP = days.reduce((s, r) => s + r.present, 0);
          return { short: MONTHS_SHORT[mi], full: MONTHS_FULL[mi], pct: mT > 0 ? Math.round((mP / mT) * 100) : null };
        });

        const totalW = weeks.length * (CELL + GAP);
        const CHART_H = 52;

        // ── Outer wrapper (day-labels col + right section) ──
        let html = `<div class="hm-github-wrap">`;

        // Left: day-of-week label column
        html += `<div class="hm-days-col">`;
        html += `<div style="height:20px;"></div>`; // spacer aligns with month-label row
        DAYS_SHORT.forEach(d => {
          html += `<div class="hm-day-label" style="height:${CELL}px;line-height:${CELL}px;margin-bottom:${GAP}px;">${d}</div>`;
        });
        html += `</div>`;

        // Right: month labels + week grid + bar chart
        html += `<div class="hm-grid-section">`;

        // Month labels row
        html += `<div style="position:relative;height:20px;width:${totalW}px;">`;
        monthPos.forEach(mp => {
          html += `<span class="hm-month-label" style="position:absolute;left:${mp.wi * (CELL + GAP)}px;">${MONTHS_SHORT[mp.m]}</span>`;
        });
        html += `</div>`;

        // GitHub-style week grid (53 cols × 7 rows)
        html += `<div style="display:flex;gap:${GAP}px;">`;
        weeks.forEach(wk => {
          html += `<div style="display:flex;flex-direction:column;gap:${GAP}px;">`;
          wk.forEach(cell => {
            if (!cell.inY) {
              html += `<div style="width:${CELL}px;height:${CELL}px;"></div>`;
            } else if (cell.isVacation) {
              html += `<div class="hm-cell hm-holiday" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: ${cell.vacTitle || 'Vacation'} \uD83C\uDFD6\uFE0F"></div>`;
            } else if (cell.isHoliday) {
              html += `<div class="hm-cell hm-holiday" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: ${cell.holTitle || 'Holiday'} \u2665"></div>`;
            } else if (cell.isSunday) {
              html += `<div class="hm-cell hm-sun" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: Sunday"></div>`;
            } else if (!cell.stats) {
              html += `<div class="hm-cell hm-lv0" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}: No record"></div>`;
            } else {
              const s = cell.stats;
              html += `<div class="hm-cell hm-lv${level(s.pct)}" style="width:${CELL}px;height:${CELL}px;" title="${cell.ds}&#10;Attendance: ${s.pct}%&#10;Present: ${s.present} / ${s.total}&#10;Absent: ${s.absent}  |  Leave: ${s.leave_count}"></div>`;
            }
          });
          html += `</div>`;
        });
        html += `</div>`;

        // Monthly average bar chart — bars aligned exactly under each month's columns
        html += `<div class="hm-chart-title">${currentTypeLabel} Monthly Average Attendance — ${year}</div>`;
        html += `<div style="position:relative;height:${CHART_H + 22}px;width:${totalW}px;">`;
        // Subtle reference lines at 50% and 100%
        [50, 100].forEach(refPct => {
          const yRef = CHART_H - Math.round((refPct / 100) * CHART_H);
          html += `<div style="position:absolute;top:${yRef}px;left:0;right:0;height:1px;background:#e2e8f0;z-index:0;"></div>`;
          html += `<span style="position:absolute;top:${yRef - 6}px;right:2px;font-size:0.48rem;color:#cbd5e1;font-weight:600;">${refPct}%</span>`;
        });
        monthPos.forEach((mp, idx) => {
          const nextWi = idx < monthPos.length - 1 ? monthPos[idx + 1].wi : weeks.length;
          const slotW  = (nextWi - mp.wi) * (CELL + GAP) - GAP;
          const ms     = monthlyStats[mp.m];
          const barH   = ms.pct !== null ? Math.max(3, Math.round((ms.pct / 100) * CHART_H)) : 0;
          const col    = ms.pct !== null ? hmColor(ms.pct) : '#e2e8f0';
          const xLeft  = mp.wi * (CELL + GAP);
          // Bar + value label
          html += `<div style="position:absolute;left:${xLeft}px;bottom:18px;width:${slotW}px;height:${CHART_H}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;z-index:1;">`;
          if (ms.pct !== null) html += `<span style="font-size:0.48rem;font-weight:700;color:${col};line-height:1;margin-bottom:2px;">${ms.pct}%</span>`;
          html += `<div style="width:calc(100% - 4px);height:${barH}px;background:${col};border-radius:3px 3px 0 0;" title="${ms.full}: ${ms.pct !== null ? ms.pct + '%' : 'No data'}"></div>`;
          html += `</div>`;
          // Month name label below bar
          html += `<span style="position:absolute;left:${xLeft}px;bottom:2px;width:${slotW}px;text-align:center;font-size:0.52rem;color:#94a3b8;font-weight:600;">${MONTHS_SHORT[mp.m]}</span>`;
        });
        html += `</div>`;

        html += `</div></div>`; // close hm-grid-section + hm-github-wrap

        container.innerHTML = html;

        // Stats bar
        const avgPct   = totRecords > 0 ? Math.round((totPresent / totRecords) * 100) : 0;
        const workDays = data.filter(r => r.total > 0).length;
        const fmtDate  = ds => { const [, m, d] = ds.split('-'); return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]}`; };
        statsEl.innerHTML = `
          <div class="hm-stat">
            <span class="hm-stat-val">${workDays}</span>
            <span class="hm-stat-lbl">Working Days</span>
          </div>
          <div class="hm-stat">
            <span class="hm-stat-val">${avgPct}%</span>
            <span class="hm-stat-lbl">Avg Attendance</span>
          </div>
          <div class="hm-stat hm-stat-best">
            <span class="hm-stat-val">${bestDay ? bestDay.pct + '%' : '—'}</span>
            <span class="hm-stat-lbl">Best Day${bestDay ? '<br><small style="font-size:0.6rem;font-weight:500;color:#64748b;">' + fmtDate(bestDay.date) + '</small>' : ''}</span>
          </div>
          <div class="hm-stat hm-stat-worst">
            <span class="hm-stat-val">${worstDay ? worstDay.pct + '%' : '—'}</span>
            <span class="hm-stat-lbl">Worst Day${worstDay ? '<br><small style="font-size:0.6rem;font-weight:500;color:#64748b;">' + fmtDate(worstDay.date) + '</small>' : ''}</span>
          </div>`;

        // Legend
        const lvLabels = ['No record', '<60%', '60–74%', '75–84%', '85–94%', '95–100%'];
        legendEl.innerHTML =
          `<span class="hm-leg-txt">Less</span>` +
          [0,1,2,3,4,5].map(l => `<div class="hm-cell hm-lv${l}" style="width:13px;height:13px;" title="${lvLabels[l]}"></div>`).join('') +
          `<span class="hm-leg-txt">More</span>` +
          `<span class="hm-leg-sep">|</span>` +
          `<div class="hm-cell hm-holiday" style="width:13px;height:13px;"></div><span class="hm-leg-txt">Holiday</span>` +
          `<div class="hm-cell hm-sun" style="width:13px;height:13px;"></div><span class="hm-leg-txt">Sunday</span>`;
      }

      // Type toggle
      let actHolidays = null;
      let actVacations = null;
      const typeBtns = card.querySelectorAll('.hm-type-btn');
      typeBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
          typeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentTypeLabel = btn.dataset.type === 'teacher' ? 'Teacher' : 'Student';
          render(await fetchData(btn.dataset.type), actHolidays, actVacations);
        });
      });

      actHolidays = await fetchHolidays2(new Date().getFullYear());
      actVacations = await fetchVacations2(new Date().getFullYear());
      render(await fetchData('student'), actHolidays, actVacations);
    })();

    const viewNoticesBtn = document.getElementById('viewNoticesBtn');
    const viewExamsBtn = document.getElementById('viewExamsBtn');
    const viewFeesBtn = document.getElementById('viewFeesBtn');
    if (viewNoticesBtn) viewNoticesBtn.addEventListener('click', () => showSection('notices'));
    if (viewExamsBtn) viewExamsBtn.addEventListener('click', () => showSection('exams'));
    if (viewFeesBtn) viewFeesBtn.addEventListener('click', () => showSection('fees'));

    // ── Download Report dropdown ──────────────────────────────────────
    (function initReportDropdown() {
      const btn     = document.getElementById('reportDropBtn');
      const menu    = document.getElementById('reportMenu');
      const token   = () => localStorage.getItem('ssms_token');

      if (!btn || !menu) return;

      // Toggle menu
      btn.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      document.addEventListener('click', () => menu.classList.remove('open'));
      menu.addEventListener('click', e => e.stopPropagation());

      // Reflect selected year in menu item subtitles
      const yearSel = document.getElementById('academicYear');
      function updateMenuYearLabels() {
        const yr = yearSel ? yearSel.value : '';
        menu.querySelectorAll('.report-menu-item .rmi-text small').forEach(small => {
          small.dataset.baseText = small.dataset.baseText || small.textContent;
          small.textContent = small.dataset.baseText + (yr ? ' – ' + yr : '');
        });
      }
      if (yearSel) {
        yearSel.addEventListener('change', updateMenuYearLabels);
        updateMenuYearLabels();
      }

      // Handle each report item
      menu.querySelectorAll('.report-menu-item').forEach(item => {
        item.addEventListener('click', async () => {
          const report = item.dataset.report;
          const fmt    = item.dataset.format || 'html';
          const year   = yearSel ? yearSel.value : '';
          menu.classList.remove('open');

          // Show toast
          showToast('Preparing report\u2026 Please wait.', 'info');
          item.disabled = true;
          const orig = item.innerHTML;
          item.innerHTML = item.innerHTML + ' <span style="font-size:0.7em;opacity:0.7;">&#9203;</span>';

          try {
            const url = `/api/reports/${report}?format=${fmt}${year ? '&year=' + encodeURIComponent(year) : ''}`;
            const res = await fetch(url, {
              headers: { Authorization: 'Bearer ' + token() }
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              showToast(err.error || 'Failed to generate report', 'error');
              return;
            }

            const blob = await res.blob();
            const cd   = res.headers.get('content-disposition') || '';
            const fnMatch = cd.match(/filename="?([^"]+)"?/);
            const filename = fnMatch ? fnMatch[1] : `Report_${report}.${fmt}`;

            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);

            showToast(`\u2705 ${filename} downloaded!`, 'success');
          } catch(err) {
            showToast('Network error. Please try again.', 'error');
          } finally {
            item.disabled = false;
            item.innerHTML = orig;
          }
        });
      });

      // Mini toast helper (reuse existing if available, else inline)
      function showToast(msg, type) {
        if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
        let t = document.getElementById('_rpt_toast');
        if (!t) {
          t = document.createElement('div');
          t.id = '_rpt_toast';
          t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:0.82rem;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.15);transition:opacity .3s;max-width:300px;';
          document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.background = type==='success'?'#22c55e':type==='error'?'#ef4444':'#4f46e5';
        t.style.color = '#fff';
        t.style.opacity = '1';
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.style.opacity='0'; }, 3500);
      }
    })();
    // ─────────────────────────────────────────────────────────────────

    // Clickable stat cards — navigate to matching section with ripple
    sections.dashboard.querySelectorAll('.stat-card[data-section]').forEach(card => {
      card.addEventListener('click', (e) => {
        const target = card.dataset.section;
        if (!target) return;
        // Ripple effect
        const rect = card.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'stat-ripple';
        ripple.style.left = (e.clientX - rect.left - 16) + 'px';
        ripple.style.top  = (e.clientY - rect.top  - 16) + 'px';
        card.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
        // Navigate after brief delay for visual feedback
        setTimeout(() => showSection(target), 180);
      });
    });
  }

  /* ---------- STUDENTS ---------- */
  async function initStudentsSection() {
    const section = sections.students;
    let editId = null;
    const PAGE_SIZE = 10;
    let currentPage = 1;
    let totalRecords = 0;
    let totalPages = 1;
    let students = [];  // current page data from server
    let cardViewActive = false;

    const els = {
      total: section.querySelector('#st-total'),
      active: section.querySelector('#st-active'),
      inactive: section.querySelector('#st-inactive'),
      feePending: section.querySelector('#st-feepending'),
      search: section.querySelector('#s-searchInput'),
      classFilter: section.querySelector('#s-classFilter'),
      divisionFilter: section.querySelector('#s-divisionFilter'),
      statusFilter: section.querySelector('#s-statusFilter'),
      clear: section.querySelector('#s-clearFilters'),
      table: section.querySelector('#studentTable'),
      tableView: section.querySelector('#s-tableView'),
      cardView: section.querySelector('#s-cardView'),
      tableViewBtn: section.querySelector('#s-tableViewBtn'),
      cardViewBtn: section.querySelector('#s-cardViewBtn'),
      pageInfo: section.querySelector('#s-pageInfo'),
      prev: section.querySelector('#s-prevBtn'),
      next: section.querySelector('#s-nextBtn'),
      pageNums: section.querySelector('#s-pageNums'),
      addBtn: section.querySelector('#addStudentBtn'),
      modal: section.querySelector('#studentModal'),
      modalTitle: section.querySelector('#s-modalTitle'),
      closeModal: section.querySelector('#s-closeModal'),
      cancelModal: section.querySelector('#s-cancelModal'),
      saveBtn: section.querySelector('#s-saveStudent'),
      viewModal: section.querySelector('#viewModal'),
      viewBody: section.querySelector('#s-viewBody'),
      closeView: section.querySelector('#s-closeView'),
      closeViewBtn: section.querySelector('#s-closeViewBtn')
    };

    function classNumberFromValue(value) {
      const match = String(value || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    }

    function isFeeApplicableClass(value) {
      const cls = classNumberFromValue(value);
      return cls !== null && cls >= 1 && cls <= 6;
    }

    const STUDENT_SECTION_CAPACITY = 40;
    const classInputEl = section.querySelector('#f-class');
    const sectionInputEl = section.querySelector('#f-section');
    const phoneInputEl = section.querySelector('#f-phone');
    const sectionCapacityHintEl = section.querySelector('#studentSectionCapacityHint');

    function normalizeParentPhoneValue(value = '') {
      return String(value || '').replace(/\D/g, '').slice(0, 10);
    }

    function deriveParentAccessKey(value = '') {
      const normalizedPhone = normalizeParentPhoneValue(value);
      return normalizedPhone.length === 10 ? normalizedPhone.slice(-4) : '';
    }

    function syncParentPhoneField() {
      if (!phoneInputEl) return;
      const normalizedPhone = normalizeParentPhoneValue(phoneInputEl.value);
      if (phoneInputEl.value !== normalizedPhone) phoneInputEl.value = normalizedPhone;
    }

    function extractGeneratedSequence(value = '') {
      const match = String(value || '').match(/(\d+)(?!.*\d)/);
      return match ? parseInt(match[1], 10) : null;
    }

    function getStudentSequenceRange(classValue, sectionValue) {
      const classNo = parseInt(classValue, 10);
      const sectionList = ['A', 'B', 'C'];
      const normalizedSection = String(sectionValue || '').trim().toUpperCase();
      if (!Number.isInteger(classNo) || classNo < 1 || classNo > 6 || !sectionList.includes(normalizedSection)) return null;

      const sectionIndex = sectionList.indexOf(normalizedSection);
      const blockIndex = ((classNo - 1) * sectionList.length) + sectionIndex;
      const start = (blockIndex * STUDENT_SECTION_CAPACITY) + 1;
      return { start, end: start + STUDENT_SECTION_CAPACITY - 1 };
    }

    function buildGeneratedStudentPreview(sequence, year = new Date().getFullYear()) {
      return {
        admission: `ADM-${year}-${String(sequence).padStart(3, '0')}`,
        gr_number: `GR-${String(sequence).padStart(3, '0')}`,
        student_id: `STU${year}${String(sequence).padStart(4, '0')}`,
        student_password: `Stu@${String(sequence).padStart(3, '0')}`
      };
    }

    async function syncGeneratedStudentPreview() {
      const admissionEl = section.querySelector('#f-admission');
      const grEl = section.querySelector('#f-gr_number');
      const studentIdEl = section.querySelector('#f-student_id');
      const studentPasswordEl = section.querySelector('#f-student_password');
      if (!admissionEl || !grEl || !studentIdEl || !studentPasswordEl || editId) return;

      const classValue = classInputEl?.value || '';
      const sectionValue = sectionInputEl?.value || '';
      const range = getStudentSequenceRange(classValue, sectionValue);
      if (!range) {
        admissionEl.value = '';
        grEl.value = '';
        studentIdEl.value = '';
        studentPasswordEl.value = '';
        return;
      }

      const response = await loadStudents({
        class: classValue,
        section: sectionValue,
        page: 1,
        limit: STUDENT_SECTION_CAPACITY
      });
      const usedSequences = new Set();
      (response?.data || []).forEach((student) => {
        [
          extractGeneratedSequence(student.gr_number),
          extractGeneratedSequence(student.admission),
          extractGeneratedSequence(student.student_id)
        ].forEach((sequence) => {
          if (Number.isInteger(sequence) && sequence >= range.start && sequence <= range.end) {
            usedSequences.add(sequence);
          }
        });
      });

      let nextSequence = null;
      for (let sequence = range.start; sequence <= range.end; sequence += 1) {
        if (!usedSequences.has(sequence)) {
          nextSequence = sequence;
          break;
        }
      }

      if (!nextSequence) {
        admissionEl.value = '';
        grEl.value = '';
        studentIdEl.value = '';
        studentPasswordEl.value = '';
        return;
      }

      const generated = buildGeneratedStudentPreview(nextSequence);
      admissionEl.value = generated.admission;
      grEl.value = generated.gr_number;
      studentIdEl.value = generated.student_id;
      studentPasswordEl.value = generated.student_password;
    }

    async function getStudentSectionUsage(classValue, sectionValue) {
      if (!classValue || !sectionValue) return null;

      const response = await loadStudents({
        class: classValue,
        section: sectionValue,
        page: 1,
        limit: STUDENT_SECTION_CAPACITY
      });
      let used = Number(response?.totalRecords || (response?.data || []).length || 0);

      if (editId) {
        const editingStudent = students.find((student) => String(student.id) === String(editId));
        const sameClass = String(editingStudent?.class || '') === String(classValue);
        const sameSection = String(editingStudent?.section || '').toUpperCase() === String(sectionValue).toUpperCase();
        if (sameClass && sameSection) used = Math.max(used - 1, 0);
      }

      return {
        used,
        remaining: Math.max(STUDENT_SECTION_CAPACITY - used, 0)
      };
    }

    async function syncStudentSectionCapacityHint() {
      if (!sectionCapacityHintEl) return;

      const classValue = classInputEl?.value || '';
      const sectionValue = sectionInputEl?.value || '';
      if (!classValue || !sectionValue) {
        sectionCapacityHintEl.textContent = 'Each section has 40 GR slots: 35 students plus 5 buffer seats.';
        sectionCapacityHintEl.style.color = '#64748b';
        return;
      }

      const usage = await getStudentSectionUsage(classValue, sectionValue);
      if (!usage) {
        sectionCapacityHintEl.textContent = '';
        return;
      }

      if (usage.remaining <= 0) {
        sectionCapacityHintEl.textContent = `Class ${classValue}-${sectionValue} is full. All 40 GR slots are already used. Please choose another section.`;
        sectionCapacityHintEl.style.color = '#dc2626';
        return;
      }

      sectionCapacityHintEl.textContent = `Class ${classValue}-${sectionValue}: ${usage.used}/40 slots used, ${usage.remaining} slots left.`;
      sectionCapacityHintEl.style.color = usage.remaining <= 5 ? '#d97706' : '#059669';
    }

    function syncStudentFeeControls() {
      const feeGroup = section.querySelector('#studentFeeGroup');
      const feeSelect = section.querySelector('#f-fees');
      if (!feeGroup || !feeSelect) return;
      const classValue = section.querySelector('#f-class')?.value || '';
      const enabled = isFeeApplicableClass(classValue);
      feeGroup.classList.toggle('hidden', !enabled);
      if (!enabled) feeSelect.value = 'Paid';
      else if (!feeSelect.value) feeSelect.value = 'Pending';
    }

    function studentFeeBadge(student) {
      if (!isFeeApplicableClass(student.class)) {
        return '<span class="badge badge-gray bg-secondary">-</span>';
      }
      return `<span class="badge ${feeStatusBadge(student.fees)}">${student.fees}</span>`;
    }

    // Determine if current user is admin/super_admin (credentials visible)
    const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    async function updateStats() {
      const counts = await loadStudentCounts();
      if (counts) {
        els.total.dataset.rollTarget = counts.total;
        els.active.dataset.rollTarget = counts.active;
        els.inactive.dataset.rollTarget = counts.inactive;
        els.feePending.dataset.rollTarget = counts.feePending;
      } else {
        els.total.dataset.rollTarget = totalRecords;
        els.active.dataset.rollTarget = 0;
        els.inactive.dataset.rollTarget = 0;
        els.feePending.dataset.rollTarget = 0;
      }
      initRollingCounters(section);
    }

    async function fetchStudents() {
      if (!els.classFilter.value) {
        students = [];
        totalRecords = 0;
        totalPages = 1;
        currentPage = 1;
        return;
      }
      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
        search: els.search.value.trim() || undefined,
        class: els.classFilter.value || undefined,
        section: els.divisionFilter.value || undefined,
        status: els.statusFilter.value || undefined
      };
      const res = await loadStudents(params);
      students = res.data || [];
      totalRecords = res.totalRecords || 0;
      totalPages = res.totalPages || 1;
      currentPage = res.currentPage || 1;
    }

    function renderTable() {
      const start = (currentPage - 1) * PAGE_SIZE;
      if (!students.length) {
        const message = els.classFilter.value ? 'No students found.' : 'Select a class to view students.';
        els.table.innerHTML = `<tr><td colspan="11" class="text-center" style="padding:40px;color:#94a3b8;">${message}</td></tr>`;
        return;
      }
      els.table.innerHTML = students.map((s, i) => {
        const spid = `spwd-${s.id}`;
        return `
        <tr>
          <td style="color:#94a3b8;">${start + i + 1}</td>
          <td style="font-family:monospace;font-size:0.8rem;">${s.gr_number || '—'}</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar-sm" style="background:${avatarColor(s.name)};">${s.name.charAt(0)}</div>
              <div>
                <div class="td-name">${s.name}</div>
                <div class="td-meta">${s.gender}  -  ${s.dob || ''}</div>
              </div>
            </div>
          </td>
          <td style="font-family:monospace;font-size:0.8rem;">${s.admission}</td>
          <td><span class="badge badge-info">${s.class}${s.section}</span></td>
          <td>
            <div class="td-name">${s.parent}</div>
            <div class="td-meta">${s.phone}</div>
          </td>
          <td style="font-family:monospace;font-size:0.78rem;">${isAdmin ? (s.student_id || '—') : '\u2022\u2022\u2022\u2022\u2022\u2022'}</td>
          <td style="font-family:monospace;font-size:0.78rem;white-space:nowrap;">
            ${isAdmin ? `<span id="${spid}" style="font-family:monospace;">\u2022\u2022\u2022\u2022\u2022\u2022</span>
            <button class="btn btn-ghost btn-sm btn-icon" style="padding:2px 4px;font-size:0.75rem;" title="Show/Hide" onclick="toggleStudentPwd('${spid}','${(s.student_password||'').replace(/'/g,"\\'")}')">👁</button>` : '\u2022\u2022\u2022\u2022\u2022\u2022'}
          </td>
          <td>${studentFeeBadge(s)}</td>
          <td><span class="badge ${statusBadge(s.status)}">${s.status}</span></td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-info btn-sm btn-icon" title="View" onclick="viewStudent(${s.id})">👁</button>
              <button class="btn btn-primary btn-sm btn-icon" title="Edit" onclick="editStudent(${s.id})">✏️</button>
              <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteStudent(${s.id})">🗑️</button>
            </div>
          </td>
        </tr>`;
      }).join('');
    }

    // Password eye toggle for student table
    window.toggleStudentPwd = (spanId, realPwd) => {
      const span = document.getElementById(spanId);
      if (!span) return;
      const btn = span.nextElementSibling;
      if (span.dataset.visible === '1') {
        span.textContent = '••••••';
        span.dataset.visible = '0';
        if (btn) btn.textContent = '👁';
      } else {
        span.textContent = realPwd || '—';
        span.dataset.visible = '1';
        if (btn) btn.textContent = '👁';
      }
    };

    function renderCardView() {
      if (!students.length) {
        const message = els.classFilter.value ? 'No students found.' : 'Select a class to view students.';
        els.cardView.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8;">${message}</div>`;
        return;
      }
      els.cardView.innerHTML = students.map(s => {
        const cardPwdId = `scard-pwd-${s.id}`;
        return `
        <div class="flip-card">
          <div class="flip-card-inner">
            <div class="flip-card-front student-card">
              <div class="student-card-header">
                <div class="avatar-sm" style="background:${avatarColor(s.name)};width:48px;height:48px;font-size:1.2rem;">${s.name.charAt(0)}</div>
                <div>
                  <div class="td-name" style="font-size:1rem;">${s.name}</div>
                  <div class="td-meta">${s.gender}  -  ${s.class}${s.section}</div>
                </div>
                <span class="badge ${statusBadge(s.status)}" style="margin-left:auto;">${s.status}</span>
              </div>
              <div class="student-card-body">
                <div class="student-card-row"><span>GR No</span><strong>${s.gr_number || '—'}</strong></div>
                <div class="student-card-row"><span>Admission</span><strong>${s.admission}</strong></div>
                ${isAdmin ? `<div class="student-card-row"><span>Student ID</span><strong style="font-family:monospace;">${s.student_id || '—'}</strong></div>` : ''}
                ${isAdmin ? `<div class="student-card-row"><span>Password</span><span style="display:flex;align-items:center;gap:6px;"><strong id="${cardPwdId}" style="font-family:monospace;">\u2022\u2022\u2022\u2022\u2022\u2022</strong><button class="btn btn-ghost btn-sm btn-icon" style="padding:1px 4px;font-size:0.72rem;" onclick="toggleStudentPwd('${cardPwdId}','${(s.student_password||'').replace(/'/g,"\\'")}')">👁</button></span></div>` : ''}
                <div class="student-card-row"><span>Parent</span><strong>${s.parent}</strong></div>
                <div class="student-card-row"><span>Phone</span><strong>${s.phone}</strong></div>
              </div>
              <div class="student-card-actions">
                <button class="btn btn-info btn-sm" onclick="viewStudent(${s.id})">👁 View</button>
                <button class="btn btn-primary btn-sm" onclick="editStudent(${s.id})">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">🗑️ Delete</button>
              </div>
            </div>
            <div class="flip-card-back">
              <div class="id-card">
                <div class="id-card-header">
                  <div class="school-name">🏫 SSMS School</div>
                  <div class="card-type">STUDENT ID CARD</div>
                </div>
                <div class="id-card-avatar" style="background:${avatarColor(s.name)};">${s.name.charAt(0)}</div>
                <div class="id-card-name">${s.name}</div>
                <div class="id-card-body">
                  <div class="id-card-row"><span class="id-label">Student ID</span><span class="id-value">${s.student_id || '—'}</span></div>
                  <div class="id-card-row"><span class="id-label">GR No</span><span class="id-value">${s.gr_number || '—'}</span></div>
                  <div class="id-card-row"><span class="id-label">Admission</span><span class="id-value">${s.admission}</span></div>
                  <div class="id-card-row"><span class="id-label">Class</span><span class="id-value">${s.class}-${s.section}</span></div>
                  <div class="id-card-row"><span class="id-label">Parent</span><span class="id-value">${s.parent}</span></div>
                  <div class="id-card-row"><span class="id-label">Phone</span><span class="id-value">${s.phone}</span></div>
                </div>
                <div class="id-card-footer">SSMS Admin Dashboard  -  ${new Date().getFullYear()}</div>
              </div>
            </div>
          </div>
        </div>`;
      }).join('');
      attachFlipListeners(els.cardView);
    }

    function renderView() {
      if (cardViewActive) {
        renderCardView();
      } else {
        renderTable();
      }
    }

    function renderPagination() {
      const start = (currentPage - 1) * PAGE_SIZE + 1;
      const end   = Math.min(currentPage * PAGE_SIZE, totalRecords);
      els.pageInfo.textContent = totalRecords ? `Showing ${start}-${end} of ${totalRecords} students` : 'No results';
      els.prev.disabled = currentPage <= 1;
      els.next.disabled = currentPage >= totalPages;
      els.pageNums.innerHTML = totalRecords
        ? `<button class="page-btn active" onclick="goStudentPage(${currentPage})">${currentPage}</button>`
        : '';
    }
    window.goStudentPage = async (p) => { currentPage = p; await fetchStudents(); renderView(); renderPagination(); };

    async function applyFilters() {
      currentPage = 1;
      await fetchStudents();
      renderView(); renderPagination();
    }

    // Debounce search input
    let searchTimer;
    els.search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilters, 300);
    });
    els.classFilter.addEventListener('change', applyFilters);
    els.divisionFilter.addEventListener('change', applyFilters);
    els.statusFilter.addEventListener('change', applyFilters);
    els.clear.addEventListener('click', () => {
      els.search.value = '';
      els.classFilter.value = '';
      els.divisionFilter.value = '';
      els.statusFilter.value = '';
      applyFilters();
    });
    els.prev.addEventListener('click', () => { if (currentPage > 1) window.goStudentPage(currentPage - 1); });
    els.next.addEventListener('click', () => { if (currentPage < totalPages) window.goStudentPage(currentPage + 1); });

    // View toggle
    if (els.tableViewBtn) els.tableViewBtn.addEventListener('click', () => {
      cardViewActive = false;
      els.tableView.classList.remove('hidden');
      els.cardView.classList.add('hidden');
      els.tableViewBtn.classList.add('active');
      els.cardViewBtn.classList.remove('active');
      renderTable();
    });
    if (els.cardViewBtn) els.cardViewBtn.addEventListener('click', () => {
      cardViewActive = true;
      els.tableView.classList.add('hidden');
      els.cardView.classList.remove('hidden');
      els.cardViewBtn.classList.add('active');
      els.tableViewBtn.classList.remove('active');
      renderCardView();
    });

    function openModal() { els.modal.classList.remove('hidden'); }
    function closeModalFn() { els.modal.classList.add('hidden'); editId = null; clearForm(); }
    function setGeneratedStudentFieldsMode(mode = 'add') {
      const isEditMode = mode === 'edit';
      ['f-admission','f-gr_number','f-student_id','f-student_password'].forEach(fid => {
        const el = section.querySelector('#' + fid);
        if (!el) return;
        const group = el.closest('.form-group');
        if (group) group.style.display = '';
        el.removeAttribute('readonly');
        if (isEditMode) {
          el.setAttribute('readonly', true);
        } else {
          el.setAttribute('readonly', true);
          if (fid === 'f-admission') el.placeholder = 'Auto-filled after class and section';
          if (fid === 'f-gr_number') el.placeholder = 'Auto-filled after class and section';
          if (fid === 'f-student_id') el.placeholder = 'Auto-filled after class and section';
          if (fid === 'f-student_password') el.placeholder = 'Auto-filled after class and section';
        }
      });
    }
    function clearForm() {
      ['f-name','f-admission','f-class','f-section','f-parent','f-phone','f-dob','f-address','f-gr_number','f-student_id','f-student_password'].forEach(id => {
        const el = section.querySelector('#' + id);
        if (el) el.value = '';
      });
      section.querySelector('#f-gender').value = 'Male';
      const bgEl = section.querySelector('#f-blood_group');
      if (bgEl) bgEl.value = '';
      section.querySelector('#f-status').value = 'Active';
      const feeSelect = section.querySelector('#f-fees');
      if (feeSelect) feeSelect.value = 'Pending';
      syncStudentFeeControls();
      syncParentPhoneField();
      syncStudentSectionCapacityHint();
      syncGeneratedStudentPreview();
    }

    els.addBtn.addEventListener('click', () => {
      editId = null;
      els.modalTitle.textContent = 'New Admission';
      clearForm();
      setGeneratedStudentFieldsMode('add');
      openModal();
    });
    els.closeModal.addEventListener('click', closeModalFn);
    els.cancelModal.addEventListener('click', closeModalFn);
    classInputEl?.addEventListener('change', () => {
      syncStudentFeeControls();
      syncStudentSectionCapacityHint();
      syncGeneratedStudentPreview();
    });
    sectionInputEl?.addEventListener('change', () => {
      syncStudentSectionCapacityHint();
      syncGeneratedStudentPreview();
    });
    phoneInputEl?.addEventListener('input', syncParentPhoneField);
    phoneInputEl?.addEventListener('blur', syncParentPhoneField);

    els.saveBtn.addEventListener('click', async () => {
      const name = section.querySelector('#f-name').value.trim();
      if (!name) { alert('Name is required.'); return; }
      const selectedClass = classInputEl?.value || '';
      const selectedSection = sectionInputEl?.value || '';
      if (!selectedClass) { alert('Class is required.'); return; }
      if (!selectedSection) { alert('Section is required.'); return; }

      const normalizedPhone = normalizeParentPhoneValue(phoneInputEl?.value || '');
      if (phoneInputEl) phoneInputEl.value = normalizedPhone;
      syncParentPhoneField();
      if (normalizedPhone.length !== 10) {
        alert('Parent mobile number must be exactly 10 digits.');
        phoneInputEl?.focus();
        return;
      }

      const sectionUsage = await getStudentSectionUsage(selectedClass, selectedSection);
      if (sectionUsage && sectionUsage.remaining <= 0) {
        await syncStudentSectionCapacityHint();
        alert(`Class ${selectedClass}-${selectedSection} is full. All 40 GR slots are already used. Please choose another section.`);
        sectionInputEl?.focus();
        return;
      }

      const entry = {
        name, admission: section.querySelector('#f-admission').value.trim(),
        class: selectedClass,
        section: selectedSection,
        parent: section.querySelector('#f-parent').value.trim(),
        phone: normalizedPhone,
        dob: section.querySelector('#f-dob').value,
        gender: section.querySelector('#f-gender').value,
        blood_group: section.querySelector('#f-blood_group')?.value || '',
        address: section.querySelector('#f-address').value.trim(),
        status: section.querySelector('#f-status').value,
        fees: isFeeApplicableClass(section.querySelector('#f-class').value)
          ? section.querySelector('#f-fees').value
          : 'Paid',
        gr_number: section.querySelector('#f-gr_number').value.trim(),
        student_id: section.querySelector('#f-student_id').value.trim(),
        student_password: section.querySelector('#f-student_password').value.trim(),
      };
      let createdStudent = null;
      if (editId) {
        const updatedStudent = await apiUpdateStudent(editId, entry);
        if (!updatedStudent || updatedStudent.error) {
          alert(updatedStudent?.error || 'Failed to update student.');
          return;
        }
      } else {
        createdStudent = await apiCreateStudent(entry);
        if (!createdStudent || createdStudent.error) {
          alert(createdStudent?.error || 'Failed to create student.');
          return;
        }
      }
      closeModalFn();
      await fetchStudents();
      renderView(); renderPagination(); updateStats();
    });

    window.editStudent = (id) => {
      const s = students.find(s => s.id === id);
      if (!s) return;
      editId = id;
      els.modalTitle.textContent = 'Edit Student';
      setGeneratedStudentFieldsMode('edit');
      section.querySelector('#f-name').value      = s.name;
      section.querySelector('#f-admission').value = s.admission;
      section.querySelector('#f-class').value     = s.class;
      section.querySelector('#f-section').value   = s.section;
      section.querySelector('#f-parent').value    = s.parent;
      section.querySelector('#f-phone').value     = s.phone;
      section.querySelector('#f-dob').value       = s.dob || '';
      section.querySelector('#f-gender').value    = s.gender || 'Male';
      const bgEl = section.querySelector('#f-blood_group');
      if (bgEl) bgEl.value = s.blood_group || '';
      section.querySelector('#f-address').value   = s.address || '';
      section.querySelector('#f-status').value    = s.status;
      const feeSelect = section.querySelector('#f-fees');
      if (feeSelect) feeSelect.value = s.fees || 'Pending';
      section.querySelector('#f-gr_number').value = s.gr_number || '';
      section.querySelector('#f-student_id').value = s.student_id || '';
      section.querySelector('#f-student_password').value = s.student_password || '';
      syncStudentFeeControls();
      syncParentPhoneField();
      syncStudentSectionCapacityHint();
      syncGeneratedStudentPreview();
      openModal();
    };

    window.deleteStudent = async (id) => {
      await apiDeleteStudent(id);
      await fetchStudents();
      renderView(); renderPagination(); updateStats();
    };

    window.viewStudent = async (id) => {
      // Fetch full record (includes LEFT JOIN parent data)
      let s;
      try {
        s = await api.get('/students/' + id);
      } catch (_) {
        s = students.find(st => st.id === id);
      }
      if (!s) return;
      const cls = parseInt(String(s.class || '').match(/\d+/)?.[0] || '0', 10);
      const isSupportedClass = cls >= 1 && cls <= 6;
      const resolvedParentAccessKey = s.parent_access_key || deriveParentAccessKey(s.phone) || 'N/A';

      let accessKeyRow = '';
      if (isSupportedClass) {
        accessKeyRow = infoRow('🔐 Parent Access Key',
          `<span style="font-family:monospace;font-weight:700;font-size:1.1rem;letter-spacing:.12em;color:#4f46e5;">${resolvedParentAccessKey}</span>`);
        if (s.parent_id) {
          accessKeyRow +=
            infoRow('🪪 Parent ID', `<span style="font-family:monospace;font-weight:700;color:#0891b2;">${s.parent_id}</span>`) +
            (s.linked_parent_name ? infoRow('👨 Father\'s Name', s.linked_parent_name) : '') +
            (s.linked_mother_name ? infoRow('👩 Mother\'s Name', s.linked_mother_name) : '') +
            (s.linked_parent_phone ? infoRow('📞 Parent Phone', s.linked_parent_phone) : '') +
            (s.linked_parent_occupation ? infoRow('💼 Occupation', s.linked_parent_occupation) : '');
        }
      }
      els.viewBody.innerHTML = `
        <div style="text-align:center;padding:10px 0 18px;">
          <div style="width:64px;height:64px;border-radius:50%;background:${avatarColor(s.name)};
            display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:700;
            color:#fff;margin:0 auto 14px;">${s.name.charAt(0)}</div>
          <div style="font-size:1.1rem;font-weight:700;">${s.name}</div>
          <div style="font-size:0.82rem;color:#64748b;">Class ${s.class}${s.section} &nbsp;|&nbsp; ${s.admission}</div>
        </div>
        <table class="view-details-table">
          ${infoRow('📋 GR No', s.gr_number || '—')}
          ${isAdmin ? infoRow('🆔 Student ID', s.student_id || '—') : ''}
          ${isAdmin ? `<tr><td class="vdt-label">🔑 Password</td><td class="vdt-value"><div style="display:flex;align-items:center;gap:8px;"><span id="sv-pwd-${s.id}" style="font-family:monospace;letter-spacing:1px;" data-pwd="${(s.student_password||'').replace(/"/g,'&quot;')}" data-visible="0">••••••</span><button class="btn btn-ghost btn-sm btn-icon" style="padding:2px 4px;font-size:0.75rem;" onclick="(function(btn){var sp=btn.previousElementSibling;if(sp.dataset.visible==='1'){sp.textContent='••••••';sp.dataset.visible='0';btn.textContent='👁';}else{sp.textContent=sp.dataset.pwd;sp.dataset.visible='1';btn.textContent='🙈';}})(this)">👁</button></div></td></tr>` : ''}
          ${infoRow('👨\u200d👩\u200d👦 Parent', s.parent)}
          ${infoRow('📞 Phone', s.phone)}
          ${infoRow('🎂 DOB', s.dob || '—')}
          ${infoRow('⚧ Gender', s.gender)}
          ${s.blood_group ? infoRow('🩸 Blood Group', s.blood_group) : ''}
          ${infoRow('🏠 Address', s.address || '—')}
          ${infoRow('✅ Status', `<span class="badge ${statusBadge(s.status)}">${s.status}</span>`)}
          ${accessKeyRow}
        </table>`;
      els.viewModal.classList.remove('hidden');
    };
    function infoRow(label, value) {
      return `<tr><td class="vdt-label">${label}</td><td class="vdt-value">${value}</td></tr>`;
    }
    els.closeView.addEventListener('click', () => els.viewModal.classList.add('hidden'));
    els.closeViewBtn.addEventListener('click', () => els.viewModal.classList.add('hidden'));

    // Expose live refresh so other sections (e.g. fees) can trigger a re-draw
    window._refreshStudentFees = async () => {
      await fetchStudents();
      renderView();
      renderPagination();
      updateStats();
    };

    // Initial load
    await fetchStudents();
    renderView(); renderPagination(); updateStats();
  }

  /* ---------- TEACHERS ---------- */
  async function initTeachersSection() {
    const section = sections.teachers;
    let teachers = [];
    let editId    = null;
    const PAGE_SIZE = 10;
    let currentPage = 1;
    let totalPages  = 1;
    let totalRecords = 0;
    let cardViewActive = false;
    const isAdmin = ['admin','super_admin'].includes(localStorage.getItem('userRole'));

    function escapeHtml(value = '') {
      return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]);
    }

    function normalizeDivision(value) {
      return String(value || '').trim().toUpperCase();
    }

    function getTeacherDivision(t) {
      return normalizeDivision(t?.division || String(t?.class || '').match(/([A-Za-z])$/)?.[1] || '');
    }

    function getTeacherClassNumber(t) {
      const match = String(t?.class || '').match(/\d+/);
      return match ? String(parseInt(match[0], 10)) : String(t?.class || '').trim();
    }

    function getTeacherClassLabel(t) {
      const classNumber = getTeacherClassNumber(t);
      const division = getTeacherDivision(t);
      if (!classNumber && !division) return '—';
      return division ? `${classNumber}-${division}` : classNumber;
    }

    function normalizeTeacherClassFilterValue(t) {
      const rawClass = String(t?.class || '').trim();
      const rawDivision = String(t?.division || '').trim().toUpperCase();
      const classDigits = rawClass.match(/\d+/)?.[0] || '';
      const classLetters = rawClass.match(/[A-Za-z]+$/)?.[0]?.toUpperCase() || '';
      const combined = `${classDigits}${classLetters}`;
      const hyphenCombined = classDigits && classLetters ? `${classDigits}-${classLetters}` : '';
      return {
        rawClass,
        rawDivision,
        classDigits,
        classLetters,
        combined,
        hyphenCombined,
      };
    }

    function applyLocalTeacherFilters(list) {
      const search = els.search.value.trim().toLowerCase();
      const classValue = els.classFilter.value.trim();
      const divisionValue = els.divisionFilter.value.trim().toUpperCase();
      const statusValue = els.status.value.trim().toLowerCase();

      return (list || []).filter((t) => {
        const normalized = normalizeTeacherClassFilterValue(t);
        const matchesSearch = !search || [
          t?.name,
          t?.subject,
          t?.emp,
          t?.teacher_id,
          t?.email,
          t?.class,
          t?.division,
          getTeacherClassLabel(t),
        ].some((value) => String(value || '').toLowerCase().includes(search));

        const matchesClass = !classValue || [
          normalized.classDigits,
          normalized.combined,
          normalized.hyphenCombined,
          normalized.rawClass.replace(/\s+/g, ''),
        ].some((value) => String(value || '').replace(/\s+/g, '').toUpperCase() === classValue.replace(/\s+/g, '').toUpperCase()
          || String(value || '').toLowerCase().includes(`class ${classValue.toLowerCase()}`));

        const matchesDivision = !divisionValue || [
          normalized.rawDivision,
          normalized.classLetters,
          normalized.hyphenCombined.split('-')[1] || '',
          normalized.rawClass.match(/[A-Za-z]+$/)?.[0] || '',
        ].some((value) => String(value || '').trim().toUpperCase() === divisionValue);

        const matchesStatus = !statusValue || String(t?.status || '').trim().toLowerCase() === statusValue;

        return matchesSearch && matchesClass && matchesDivision && matchesStatus;
      });
    }

    function teacherProfileStats(t) {
      return [
        { label: 'Teacher Name', value: t?.name || '—', tone: 'indigo' },
        { label: 'Subject', value: t?.subject || '—', tone: 'purple' },
        { label: 'Class', value: getTeacherClassNumber(t), tone: 'green' },
        { label: 'Division', value: getTeacherDivision(t) || '—', tone: 'blue' },
      ];
    }

    const els = {
      total: section.querySelector('#t-total'),
      active: section.querySelector('#t-active'),
      salary: section.querySelector('#t-salary'),
      subjects: section.querySelector('#t-subjects'),
      search: section.querySelector('#t-searchInput'),
      classFilter: section.querySelector('#t-classFilter'),
      divisionFilter: section.querySelector('#t-divisionFilter'),
      status: section.querySelector('#t-statusFilter'),
      clear: section.querySelector('#t-clearFilters'),
      table: section.querySelector('#teacherTable'),
      tableView: section.querySelector('#t-tableView'),
      cardView: section.querySelector('#t-cardView'),
      tableViewBtn: section.querySelector('#t-tableViewBtn'),
      cardViewBtn: section.querySelector('#t-cardViewBtn'),
      pageInfo: section.querySelector('#t-pageInfo'),
      prev: section.querySelector('#t-prevBtn'),
      next: section.querySelector('#t-nextBtn'),
      pageNums: section.querySelector('#t-pageNums'),
      addBtn: section.querySelector('#addTeacherBtn'),
      modal: section.querySelector('#teacherModal'),
      modalTitle: section.querySelector('#t-modalTitle'),
      closeModal: section.querySelector('#t-closeModal'),
      cancelModal: section.querySelector('#t-cancelModal'),
      saveBtn: section.querySelector('#t-saveTeacher'),
      viewModal: section.querySelector('#teacherViewModal'),
      viewBody: section.querySelector('#t-viewBody'),
      closeView: section.querySelector('#t-closeView'),
      closeViewBtn: section.querySelector('#t-closeViewBtn'),
    };

    async function fetchTeachers() {
      const search = els.search.value.trim();
      const classValue = els.classFilter.value;
      const divisionValue = els.divisionFilter.value;
      const status = els.status.value;
      const hasFilters = Boolean(search || classValue || divisionValue || status);
      const params = { page: currentPage, limit: hasFilters ? 1000 : PAGE_SIZE };
      if (search) params.search = search;
      if (classValue) params.class = classValue;
      if (divisionValue) params.division = divisionValue;
      if (status) params.status = status;
      try {
        const res = await loadTeachers(params);
        const rawTeachers = res.data || [];
        const filteredTeachers = applyLocalTeacherFilters(rawTeachers);
        teachers = filteredTeachers;
        totalRecords = filteredTeachers.length;
        totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
      } catch (e) { console.error('fetchTeachers', e); teachers = []; totalPages = 1; totalRecords = 0; }
    }

    async function updateStats() {
      try {
        const c = await loadTeacherCounts();
        els.total.dataset.rollTarget = c.total || 0;
        els.active.dataset.rollTarget = c.active || 0;
        els.subjects.dataset.rollTarget = c.subjects || 0;
        els.salary.dataset.shortTarget = c.avgSalary || 0;
        initRollingCounters(section);
        initShortCounters(section);
      } catch (e) { console.error('teacherCounts', e); }
    }

    function renderTable() {
      const start = (currentPage - 1) * PAGE_SIZE;
      if (!teachers.length) {
        els.table.innerHTML = `<tr><td colspan="10" class="text-center" style="padding:40px;color:#94a3b8;">No teachers found.</td></tr>`;
        return;
      }
      els.table.innerHTML = teachers.map((t, i) => {
        const tid = `tpwd-${t.id}`;
        return `
        <tr>
          <td style="color:#94a3b8;">${start + i + 1}</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar-sm" style="background:${avatarColor(t.name)};">${t.name.charAt(0)}</div>
              <div>
                <div class="td-name">${escapeHtml(t.name)}</div>
                <div class="td-meta">${escapeHtml(t.email)}</div>
              </div>
            </div>
          </td>
          <td style="font-family:monospace;font-size:0.8rem;">${escapeHtml(t.emp)}</td>
          <td><span class="badge badge-purple">${escapeHtml(t.subject)}</span></td>
          <td style="font-size:0.82rem;">${escapeHtml(getTeacherClassLabel(t))}</td>
          <td style="font-family:monospace;font-size:0.8rem;">${isAdmin ? (t.teacher_id || '—') : '\u2022\u2022\u2022\u2022\u2022\u2022'}</td>
          <td style="font-family:monospace;font-size:0.8rem;white-space:nowrap;">
            ${isAdmin ? `<span id="${tid}" style="font-family:monospace;">\u2022\u2022\u2022\u2022\u2022\u2022</span>
            <button class="btn btn-ghost btn-sm btn-icon" style="padding:2px 4px;font-size:0.75rem;" title="Show/Hide" onclick="toggleTeacherPwd('${tid}','${(t.teacher_password||'').replace(/'/g,"\\'")}')">👁</button>` : '\u2022\u2022\u2022\u2022\u2022\u2022'}
          </td>
          <td style="font-weight:700;">\u20B9${(t.salary || 0).toLocaleString('en-IN')}</td>
          <td><span class="badge ${statusBadge(t.status)}">${t.status}</span></td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-info btn-sm btn-icon" title="View" onclick="viewTeacher(${t.id})">👁</button>
              <button class="btn btn-primary btn-sm btn-icon" title="Edit" onclick="editTeacher(${t.id})">✏️</button>
              <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteTeacher(${t.id})">🗑️</button>
            </div>
          </td>
        </tr>`;
      }).join('');
    }

    // Password eye toggle for table
    window.toggleTeacherPwd = (spanId, realPwd) => {
      const span = document.getElementById(spanId);
      if (!span) return;
      if (span.dataset.visible === '1') {
        span.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
        span.dataset.visible = '0';
      } else {
        span.textContent = realPwd || '—';
        span.dataset.visible = '1';
      }
    };

    function renderCardView() {
      if (!teachers.length) {
        els.cardView.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8;">No teachers found.</div>`;
        return;
      }
      els.cardView.innerHTML = teachers.map(t => {
        const cardPwdId = `tcard-pwd-${t.id}`;
        return `
        <div class="flip-card">
          <div class="flip-card-inner">
            <div class="flip-card-front student-card">
              <div class="student-card-header">
              <div class="avatar-sm" style="background:${avatarColor(t.name)};width:48px;height:48px;font-size:1.2rem;">${t.name.charAt(0)}</div>
              <div>
                <div class="td-name" style="font-size:1rem;">${t.name}</div>
                <div class="td-meta">${t.email}</div>
              </div>
                <span class="badge ${statusBadge(t.status)}" style="margin-left:auto;">${t.status}</span>
              </div>
              <div class="student-card-body">
                <div class="student-card-row"><span>Emp ID</span><strong style="font-family:monospace;">${t.emp}</strong></div>
                <div class="student-card-row"><span>Subject</span><span class="badge badge-purple">${t.subject}</span></div>
                <div class="student-card-row"><span>Class</span><strong>${getTeacherClassNumber(t)}</strong></div>
                <div class="student-card-row"><span>Division</span><strong>${getTeacherDivision(t) || '—'}</strong></div>
                ${isAdmin ? `<div class="student-card-row"><span>Teacher ID</span><strong style="font-family:monospace;">${t.teacher_id || '—'}</strong></div>` : ''}
                ${isAdmin ? `<div class="student-card-row"><span>Password</span><span style="display:flex;align-items:center;gap:6px;"><strong id="${cardPwdId}" style="font-family:monospace;">\u2022\u2022\u2022\u2022\u2022\u2022</strong><button class="btn btn-ghost btn-sm btn-icon" style="padding:1px 4px;font-size:0.72rem;" onclick="toggleTeacherPwd('${cardPwdId}','${(t.teacher_password||'').replace(/'/g,"\\'")}')">👁</button></span></div>` : ''}
                <div class="student-card-row"><span>Salary</span><strong>\u20B9${(t.salary || 0).toLocaleString('en-IN')}</strong></div>
              </div>
              <div class="student-card-actions">
                <button class="btn btn-info btn-sm" onclick="viewTeacher(${t.id})">👁 View</button>
                <button class="btn btn-primary btn-sm" onclick="editTeacher(${t.id})">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTeacher(${t.id})">🗑️ Delete</button>
              </div>
            </div>
            <div class="flip-card-back">
              <div class="id-card">
                <div class="id-card-header">
                  <div class="school-name">🏫 SSMS School</div>
                  <div class="card-type">TEACHER ID CARD</div>
                </div>
                <div class="id-card-avatar" style="background:${avatarColor(t.name)};">${t.name.charAt(0)}</div>
                <div class="id-card-name">${t.name}</div>
                <div class="id-card-body">
                  <div class="id-card-row"><span class="id-label">Teacher ID</span><span class="id-value">${t.teacher_id || '—'}</span></div>
                  <div class="id-card-row"><span class="id-label">EMP ID</span><span class="id-value">${t.emp}</span></div>
                  <div class="id-card-row"><span class="id-label">Subject</span><span class="id-value">${t.subject}</span></div>
                  <div class="id-card-row"><span class="id-label">Class</span><span class="id-value">${getTeacherClassNumber(t)}</span></div>
                  <div class="id-card-row"><span class="id-label">Division</span><span class="id-value">${getTeacherDivision(t) || '—'}</span></div>
                  <div class="id-card-row"><span class="id-label">Email</span><span class="id-value">${t.email}</span></div>
                  <div class="id-card-row"><span class="id-label">Phone</span><span class="id-value">${t.phone}</span></div>
                  <div class="id-card-row"><span class="id-label">Qualification</span><span class="id-value">${t.qualification}</span></div>
                </div>
                <div class="id-card-footer">SSMS Admin Dashboard  -  ${new Date().getFullYear()}</div>
              </div>
            </div>
          </div>
        </div>`;
      }).join('');
      attachFlipListeners(els.cardView);
    }

    function renderView() {
      if (cardViewActive) { renderCardView(); } else { renderTable(); }
    }

    function renderPagination() {
      const start = (currentPage - 1) * PAGE_SIZE + 1;
      const end   = Math.min(currentPage * PAGE_SIZE, totalRecords);
      els.pageInfo.textContent = totalRecords ? `Showing ${start}-${end} of ${totalRecords} teachers` : 'No results';
      els.prev.disabled = currentPage === 1;
      els.next.disabled = currentPage >= totalPages;
      let nums = '';
      for (let p = 1; p <= totalPages; p++)
        nums += `<button class="page-btn ${p===currentPage?'active':''}" onclick="goTeacherPage(${p})">${p}</button>`;
      els.pageNums.innerHTML = nums;
    }

    window.goTeacherPage = async (p) => { currentPage = p; await fetchTeachers(); renderView(); renderPagination(); };

    async function applyFilters() {
      currentPage = 1;
      await fetchTeachers();
      renderView(); renderPagination();
    }

    // Debounced search
    let searchTimer;
    els.search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilters, 300);
    });
    els.classFilter.addEventListener('change', applyFilters);
    els.divisionFilter.addEventListener('change', applyFilters);
    els.status.addEventListener('change', applyFilters);
    els.clear.addEventListener('click', () => {
      els.search.value = '';
      els.classFilter.value = '';
      els.divisionFilter.value = '';
      els.status.value = '';
      applyFilters();
    });
    els.prev.addEventListener('click', () => { if (currentPage > 1) goTeacherPage(currentPage - 1); });
    els.next.addEventListener('click', () => { if (currentPage < totalPages) goTeacherPage(currentPage + 1); });

    // View toggle
    els.tableViewBtn.addEventListener('click', () => {
      cardViewActive = false;
      els.tableView.classList.remove('hidden');
      els.cardView.classList.add('hidden');
      els.tableViewBtn.classList.add('active');
      els.cardViewBtn.classList.remove('active');
      renderTable();
    });
    els.cardViewBtn.addEventListener('click', () => {
      cardViewActive = true;
      els.tableView.classList.add('hidden');
      els.cardView.classList.remove('hidden');
      els.cardViewBtn.classList.add('active');
      els.tableViewBtn.classList.remove('active');
      renderCardView();
    });

    function openModal()  { els.modal.classList.remove('hidden'); }
    function closeModalFn() { els.modal.classList.add('hidden'); editId = null; clearForm(); }
    function clearForm() {
      ['t-f-name','t-f-emp','t-f-teacherid','t-f-teacherpass','t-f-subject','t-f-class','t-f-division','t-f-email','t-f-phone','t-f-qual','t-f-salary','t-f-join'].forEach(id =>
        section.querySelector('#' + id).value = '');
      section.querySelector('#t-f-status').value = 'Active';
    }

    els.addBtn.addEventListener('click', () => {
      editId = null; els.modalTitle.textContent = 'New Join';
      clearForm();
      // Hide auto-generated fields when adding new
      ['t-f-emp','t-f-teacherid','t-f-teacherpass'].forEach(fid => {
        const el = section.querySelector('#' + fid);
        if (el) el.closest('.form-group').style.display = 'none';
      });
      openModal();
    });
    els.closeModal.addEventListener('click', closeModalFn);
    els.cancelModal.addEventListener('click', closeModalFn);

    els.saveBtn.addEventListener('click', async () => {
      const name = section.querySelector('#t-f-name').value.trim();
      if (!name) { alert('Name is required.'); return; }
      const entry = {
        name,
        emp: section.querySelector('#t-f-emp').value.trim(),
        subject: section.querySelector('#t-f-subject').value.trim(),
        class: section.querySelector('#t-f-class').value.trim(),
        division: section.querySelector('#t-f-division').value.trim(),
        email: section.querySelector('#t-f-email').value.trim(),
        phone: section.querySelector('#t-f-phone').value.trim(),
        qualification: section.querySelector('#t-f-qual').value.trim(),
        salary: parseInt(section.querySelector('#t-f-salary').value) || 0,
        join: section.querySelector('#t-f-join').value,
        status: section.querySelector('#t-f-status').value,
        teacher_id: section.querySelector('#t-f-teacherid').value.trim(),
        teacher_password: section.querySelector('#t-f-teacherpass').value.trim(),
      };
      if (editId) {
        await apiUpdateTeacher(editId, entry);
      } else {
        await apiCreateTeacher(entry);
      }
      closeModalFn();
      await fetchTeachers();
      renderView(); renderPagination(); updateStats();
    });

    window.editTeacher = (id) => {
      const t = teachers.find(t => t.id === id);
      if (!t) return;
      editId = id;
      els.modalTitle.textContent = 'Edit Teacher';
      // Show auto-gen fields in edit mode (read-only)
      ['t-f-emp','t-f-teacherid','t-f-teacherpass'].forEach(fid => {
        const el = section.querySelector('#' + fid);
        if (el) { el.closest('.form-group').style.display = ''; el.setAttribute('readonly', true); }
      });
      section.querySelector('#t-f-name').value    = t.name;
      section.querySelector('#t-f-emp').value     = t.emp;
      section.querySelector('#t-f-teacherid').value = t.teacher_id || '';
      section.querySelector('#t-f-teacherpass').value = t.teacher_password || '';
      section.querySelector('#t-f-subject').value = t.subject;
      section.querySelector('#t-f-class').value   = t.class;
      section.querySelector('#t-f-division').value = t.division || getTeacherDivision(t);
      section.querySelector('#t-f-email').value   = t.email;
      section.querySelector('#t-f-phone').value   = t.phone;
      section.querySelector('#t-f-qual').value    = t.qualification;
      section.querySelector('#t-f-salary').value  = t.salary;
      section.querySelector('#t-f-join').value    = t.join;
      section.querySelector('#t-f-status').value  = t.status;
      openModal();
    };

    window.deleteTeacher = async (id) => {
      if (!confirm('Delete this teacher record?')) return;
      await apiDeleteTeacher(id);
      await fetchTeachers();
      renderView(); renderPagination(); updateStats();
    };

    window.viewTeacher = (id) => {
      const t = teachers.find(t => t.id === id);
      if (!t) return;
      const classLabel = getTeacherClassLabel(t);
      const division = getTeacherDivision(t) || '—';
      const stats = teacherProfileStats(t);
      const initials = String(t.name || 'T').charAt(0).toUpperCase();
      const teacherPwdId = `tv-pwd-${t.id}`;
      els.viewBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:18px;">
          <div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:18px;border-radius:20px;background:linear-gradient(135deg,#eef2ff 0%,#f8fafc 55%,#ecfeff 100%);border:1px solid #dbeafe;">
            <div style="display:flex;align-items:center;gap:16px;min-width:0;">
              <div style="width:72px;height:72px;border-radius:22px;background:${avatarColor(t.name)};display:flex;align-items:center;justify-content:center;font-size:1.75rem;font-weight:800;color:#fff;box-shadow:0 12px 30px rgba(79,70,229,.25);">${escapeHtml(initials)}</div>
              <div style="min-width:0;">
                <div style="font-size:1.2rem;font-weight:800;color:#0f172a;line-height:1.2;">${escapeHtml(t.name)}</div>
                <div style="margin-top:4px;font-size:0.86rem;color:#64748b;">${escapeHtml(t.subject)} · ${escapeHtml(classLabel)}</div>
                <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;">
                  <span class="badge badge-purple">Teacher</span>
                  <span class="badge badge-success">Class ${escapeHtml(getTeacherClassNumber(t))}</span>
                  <span class="badge badge-info">Division ${escapeHtml(division)}</span>
                  <span class="badge badge-warning">${escapeHtml(t.status || 'Active')}</span>
                </div>
              </div>
            </div>
            <div style="display:grid;gap:8px;min-width:180px;">
              <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:700;">Teacher ID</div>
              <div style="font-family:monospace;font-size:0.98rem;font-weight:700;color:#1e293b;">${escapeHtml(t.teacher_id || '—')}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
            ${stats.map((item) => `
              <div style="padding:14px 15px;border-radius:16px;border:1px solid #e5e7eb;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.04);">
                <div style="font-size:0.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin-bottom:6px;">${escapeHtml(item.label)}</div>
                <div style="font-size:0.98rem;font-weight:700;color:${item.tone === 'indigo' ? '#4338ca' : item.tone === 'purple' ? '#7c3aed' : item.tone === 'green' ? '#047857' : '#2563eb'};">${escapeHtml(item.value)}</div>
              </div>
            `).join('')}
          </div>

          <table class="view-details-table">
            ${tInfoRow('📧 Email', escapeHtml(t.email || '—'))}
            ${tInfoRow('📞 Phone', escapeHtml(t.phone || '—'))}
            ${tInfoRow('🎓 Qualification', escapeHtml(t.qualification || '—'))}
            ${tInfoRow('📚 Subject', escapeHtml(t.subject || '—'))}
            ${tInfoRow('🏫 Class', escapeHtml(getTeacherClassNumber(t) || '—'))}
            ${tInfoRow('🔹 Division', escapeHtml(division))}
            ${tInfoRow('💰 Salary', '\u20B9' + (t.salary || 0).toLocaleString('en-IN'))}
            ${tInfoRow('📅 Joined', escapeHtml(t.join || '—'))}
            ${isAdmin ? tInfoRow('🆔 Teacher ID', escapeHtml(t.teacher_id || '—')) : ''}
            ${isAdmin ? `<tr><td class="vdt-label">🔑 Password</td><td class="vdt-value"><div style="display:flex;align-items:center;gap:8px;"><span id="${teacherPwdId}" style="font-family:monospace;letter-spacing:1px;" data-pwd="${escapeHtml(t.teacher_password || '')}" data-visible="0">••••••</span><button class="btn btn-ghost btn-sm btn-icon" style="padding:2px 4px;font-size:0.75rem;" onclick="(function(btn){var sp=btn.previousElementSibling;if(sp.dataset.visible==='1'){sp.textContent='••••••';sp.dataset.visible='0';btn.textContent='👁';}else{sp.textContent=sp.dataset.pwd;sp.dataset.visible='1';btn.textContent='🙈';}})(this)">👁</button></div></td></tr>` : ''}
          </table>
        </div>`;
      els.viewModal.classList.remove('hidden');
    };
    function tInfoRow(label, value) {
      return `<tr><td class="vdt-label">${label}</td><td class="vdt-value">${value}</td></tr>`;
    }
    els.closeView.addEventListener('click', () => els.viewModal.classList.add('hidden'));
    els.closeViewBtn.addEventListener('click', () => els.viewModal.classList.add('hidden'));

    // Initial load
    await fetchTeachers();
    renderView(); renderPagination(); updateStats();
  }

  /* ---------- ATTENDANCE ---------- */
  async function initAttendanceSection() {
    const section = sections.attendance;
    const attDate = section.querySelector('#attDate');
    attDate.value = getLocalDateISO();

    // State
    let personType = 'student';   // 'student' or 'teacher'
    let people = [];               // loaded students/teachers
    let attRecords = [];           // working copy with status
    let currentPage = 1;
    const PAGE_SIZE = 10;

    // DOM refs
    const toggleStudent = section.querySelector('#toggleStudent');
    const toggleTeacher = section.querySelector('#toggleTeacher');
    const attClassGroup = section.querySelector('#attClassGroup');
    const attClass      = section.querySelector('#attClass');
    const attSectionGroup = section.querySelector('#attSectionGroup');
    const attSection      = section.querySelector('#attSection');
    const attTable      = section.querySelector('#attTable');
    const dateAlert     = section.querySelector('#attDateAlert');
    const attColExtra   = section.querySelector('#attColExtra');
    const pagination    = section.querySelector('#attPagination');
    const pageInfo      = section.querySelector('#attPageInfo');

    // ─── iOS-style sliding pill toggle setup ───
    const attToggleWrap = section.querySelector('.att-person-toggle');
    const sliderPill = document.createElement('div');
    sliderPill.className = 'att-toggle-slider';
    sliderPill.style.pointerEvents = 'none';
    attToggleWrap.insertBefore(sliderPill, attToggleWrap.firstChild);
    function moveSlider(activeBtn) {
      sliderPill.style.width = activeBtn.offsetWidth + 'px';
      sliderPill.style.transform = 'translateX(' + (activeBtn.offsetLeft - 5) + 'px)';
    }

    function resolvePersonTypeFromUi() {
      return toggleTeacher.classList.contains('active') ? 'teacher' : 'student';
    }

    function extractLastNumber(value) {
      const match = String(value || '').match(/(\d+)(?!.*\d)/);
      return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
    }

    // â”€â”€â”€ Toggle Student / Teacher â”€â”€â”€
    function setPersonType(type) {
      personType = type;
      toggleStudent.classList.toggle('active', type === 'student');
      toggleTeacher.classList.toggle('active', type === 'teacher');
      moveSlider(type === 'student' ? toggleStudent : toggleTeacher);
      attClassGroup.style.display = type === 'student' ? '' : 'none';
      if (attSectionGroup) attSectionGroup.style.display = type === 'student' ? '' : 'none';
      attColExtra.textContent = type === 'student' ? 'Class' : 'Subject';
      people = [];
      attRecords = [];
      currentPage = 1;
      attTable.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:32px;">Click "Load" to fetch records</td></tr>';
      pagination.style.display = 'none';
      updateSummaryUI(0, 0, 0, 0);
      loadAndRenderReport();
    }
    toggleStudent.addEventListener('click', () => setPersonType('student'));
    toggleTeacher.addEventListener('click', () => setPersonType('teacher'));
    // Reposition slider whenever attendance section becomes visible
    sectionEnterHooks.attendance = () => {
      const activeBtn = personType === 'teacher' ? toggleTeacher : toggleStudent;
      moveSlider(activeBtn);
    };

    // â”€â”€â”€ Date validation â”€â”€â”€
    async function validateDate() {
      const date = attDate.value;
      if (!date) { dateAlert.style.display = 'none'; return true; }
      const check = await checkAttendanceDate(date);
      if (!check.valid) {
        dateAlert.style.display = 'block';
        dateAlert.textContent = '⚠ ' + check.errors.join(' | ');
        return false;
      }
      dateAlert.style.display = 'none';
      return true;
    }
    attDate.addEventListener('change', validateDate);

    // â”€â”€â”€ Load People â”€â”€â”€
    async function loadPeople() {
      try {
        const uiType = resolvePersonTypeFromUi();
        if (uiType !== personType) {
          personType = uiType;
          attClassGroup.style.display = uiType === 'student' ? '' : 'none';
          if (attSectionGroup) attSectionGroup.style.display = uiType === 'student' ? '' : 'none';
          attColExtra.textContent = uiType === 'student' ? 'Class' : 'Subject';
        }
        const cls = personType === 'student' ? attClass.value : '';
        const sectionValue = personType === 'student' ? (attSection ? attSection.value : '') : '';
        const selectedDate = attDate.value || getLocalDateISO();

        let detail = { records: [] };
        try {
          detail = await loadAttendanceDayDetail(selectedDate, personType, cls, sectionValue);
        } catch (detailError) {
          console.warn('Attendance day detail unavailable, continuing without prefill', detailError);
        }

        const statusLookup = (detail.records || []).reduce((lookup, record) => {
          lookup[String(record.person_id || '')] = attendanceStatusCode(record.status_code || record.status);
          return lookup;
        }, {});

        let loadedPeople = [];
        if (personType === 'student') {
          try {
            const studentResponse = await loadStudents({
              page: 1,
              limit: 500,
              class: cls,
              section: sectionValue,
              status: 'Active'
            });
            loadedPeople = Array.isArray(studentResponse?.data) ? studentResponse.data : [];
          } catch (studentError) {
            console.warn('Student roster API unavailable, falling back to attendance people', studentError);
          }
        }

        if (!loadedPeople.length) {
          try {
            loadedPeople = await loadAttendancePeople(personType, cls, sectionValue);
          } catch (peopleError) {
            console.warn('Attendance people API unavailable, using empty roster', peopleError);
            loadedPeople = [];
          }
        }

        people = Array.isArray(loadedPeople)
          ? loadedPeople.slice().sort((a, b) => {
            if (personType !== 'student') return String(a.name || '').localeCompare(String(b.name || ''));
            const left = extractLastNumber(a.roll || a.gr_number || a.student_id || '');
            const right = extractLastNumber(b.roll || b.gr_number || b.student_id || '');
            if (left !== right) return left - right;
            return String(a.name || '').localeCompare(String(b.name || ''));
          })
          : [];

        attRecords = people.map(p => ({
          person_id: personType === 'student'
            ? String(p.student_id || p.studentId || p.id || '').trim()
            : String(p.teacher_id || p.teacherId || p.id || '').trim(),
          roll: String(p.roll || p.gr_number || p.grNo || p.student_id || p.studentId || '').trim(),
          name: p.name || '',
          class: String(p.class || p.standard || '').trim(),
          section: String(p.section || p.division || '').trim(),
          extra: personType === 'student'
            ? ('Class ' + (p.class || p.standard || '') + '-' + (p.section || p.division || ''))
            : (p.subject || ''),
          status: statusLookup[String(personType === 'student' ? (p.student_id || p.studentId || p.id || '') : (p.teacher_id || p.teacherId || p.id || ''))] || 'P'
        }));
        currentPage = 1;
        renderTable();
        updateSummaryFromRecords();
      } catch (error) {
        console.error('Failed to load attendance people:', error);
        people = [];
        attRecords = [];
        renderTable();
        updateSummaryFromRecords();
        showErrorPopup('Unable to load attendance records. Please check the class and division.');
      }
    }
    section.querySelector('#loadPeopleBtn').addEventListener('click', loadPeople);

    // â”€â”€â”€ Summary UI â”€â”€â”€
    function updateSummaryUI(total, present, absent, rate) {
      section.querySelector('#att-total').dataset.rollTarget   = total;
      section.querySelector('#att-present').dataset.rollTarget = present;
      section.querySelector('#att-absent').dataset.rollTarget  = absent;
      section.querySelector('#att-rate').dataset.rollTarget    = rate;
      initRollingCounters(section);
    }
    function updateSummaryFromRecords() {
      const P = attRecords.filter(r => r.status === 'P').length;
      const A = attRecords.filter(r => r.status === 'A').length;
      const total = attRecords.length;
      const rate = total > 0 ? Math.round((P / total) * 100) : 0;
      updateSummaryUI(total, P, A, rate);
    }

    // â”€â”€â”€ Render Table (paginated) â”€â”€â”€
    function renderTable() {
      if (!attRecords.length) {
        attTable.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:32px;">No records loaded</td></tr>';
        pagination.style.display = 'none';
        return;
      }
      const totalPages = Math.ceil(attRecords.length / PAGE_SIZE);
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = Math.min(start + PAGE_SIZE, attRecords.length);
      const pageRecords = attRecords.slice(start, end);

      attTable.innerHTML = pageRecords.map((r, idx) => {
        const rowNumber = idx + 1;
        const globalIdx = start + idx;
        return `<tr>
          <td style="font-weight:700;color:#94a3b8;">${rowNumber}</td>
          <td>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-weight:700;font-size:0.82rem;color:#0f172a;">${r.roll || '—'}</span>
              <span style="font-weight:600;font-size:0.72rem;color:#3b82f6;">${r.person_id || '—'}</span>
            </div>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar-sm" style="background:${avatarColor(r.name)};">${r.name.charAt(0)}</div>
              <span class="td-name">${r.name}</span>
            </div>
          </td>
          <td style="font-size:0.78rem;color:#64748b;">${r.extra}</td>
          <td>
            <div style="display:flex;gap:8px;">
              <button class="att-btn ${r.status === 'P' ? 'present' : ''}" title="Present" onclick="window._setAttStatus(${globalIdx},'P')">P</button>
              <button class="att-btn ${r.status === 'A' ? 'absent' : ''}"  title="Absent"  onclick="window._setAttStatus(${globalIdx},'A')">A</button>
              <button class="att-btn ${r.status === 'L' ? 'leave' : ''}"   title="Leave"   onclick="window._setAttStatus(${globalIdx},'L')">L</button>
            </div>
          </td>
        </tr>`;
      }).join('');

      // Pagination controls
      if (totalPages > 1) {
        pagination.style.display = 'flex';
        pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${attRecords.length} records)`;
        section.querySelector('#attPrevPage').disabled = currentPage <= 1;
        section.querySelector('#attNextPage').disabled = currentPage >= totalPages;
      } else {
        pagination.style.display = attRecords.length > 0 ? 'flex' : 'none';
        pageInfo.textContent = `${attRecords.length} records`;
        section.querySelector('#attPrevPage').disabled = true;
        section.querySelector('#attNextPage').disabled = true;
      }
    }

    // Global button handlers
    window._setAttStatus = (idx, status) => {
      attRecords[idx].status = status;
      renderTable();
      updateSummaryFromRecords();
    };

    // Pagination buttons
    section.querySelector('#attPrevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
    section.querySelector('#attNextPage').addEventListener('click', () => {
      const totalPages = Math.ceil(attRecords.length / PAGE_SIZE);
      if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    // Mark All
    section.querySelector('#markAllPresentBtn').addEventListener('click', () => {
      attRecords.forEach(r => r.status = 'P');
      renderTable(); updateSummaryFromRecords();
    });
    section.querySelector('#markAllAbsentBtn').addEventListener('click', () => {
      attRecords.forEach(r => r.status = 'A');
      renderTable(); updateSummaryFromRecords();
    });

    // â”€â”€â”€ Show Popup â”€â”€â”€
    function showSuccessPopup(msg) {
      section.closest('body').querySelector('#attSuccessMsg').textContent = msg;
      section.closest('body').querySelector('#attSuccessPopup').style.display = 'flex';
      setTimeout(() => {
        const popup = document.getElementById('attSuccessPopup');
        if (popup) popup.style.display = 'none';
      }, 3000);
    }
    function showErrorPopup(msg) {
      section.closest('body').querySelector('#attErrorMsg').textContent = msg;
      section.closest('body').querySelector('#attErrorPopup').style.display = 'flex';
    }

    // â”€â”€â”€ Save Attendance â”€â”€â”€
    section.querySelector('#saveAttBtn').addEventListener('click', async () => {
      if (!attRecords.length) return showErrorPopup('No records to save. Load people first.');
      const date = attDate.value;
      if (!date) return showErrorPopup('Please select a date.');
      if (personType === 'student' && !attClass.value) return showErrorPopup('Please select a class before saving student attendance.');

      const valid = await validateDate();
      if (!valid) return showErrorPopup(dateAlert.textContent);

      const records = attRecords.map(r => ({
        person_id: r.person_id,
        status: r.status,
        class: personType === 'student' ? (r.class || attClass.value || '') : null,
        section: personType === 'student' ? (r.section || (attSection ? attSection.value : '') || null) : null,
        subject: null
      }));

      const result = await saveAttendanceBulk({
        records, date, person_type: personType, class: attClass.value || null, section: attSection ? (attSection.value || null) : null
      });

      if (result && result.success) {
        const msg = `✅ ${result.total} records saved for ${date}\n📋 New: ${result.new} | Updated: ${result.updated}`;
        showSuccessPopup(msg);
        window.dispatchEvent(new CustomEvent('ssms:attendance-saved', { detail: { date, personType } }));
        // Auto-refresh heatmap if the saved date falls in the currently displayed month
        const savedDate = new Date(date);
        if (savedDate.getFullYear() === parseInt(reportYearSel.value) &&
            (savedDate.getMonth() + 1) === parseInt(reportMonthSel.value)) {
          loadAndRenderReport();
        }
      } else {
        showErrorPopup(result?.error || 'Failed to save attendance.');
      }
    });

    /* ---------- Monthly Report ---------- */
    const reportMonthSel = section.querySelector('#reportMonth');
    const reportYearSel  = section.querySelector('#reportYear');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const now = new Date();
    reportMonthSel.value = now.getMonth() + 1;
    reportYearSel.value  = now.getFullYear();

    /* ── Vacation API helpers ── */
    async function apiGetVacations(year) {
      try {
        const token = localStorage.getItem('ssms_token');
        const res = await fetch(`/api/vacations/${year}`, { headers: { Authorization: 'Bearer ' + token } });
        if (res.ok) { const j = await res.json(); return j.vacations || []; }
      } catch (_) {}
      return typeof getMockAttendanceVacations === 'function' ? getMockAttendanceVacations(year) : [];
    }
    async function apiAddVacation(title, start_date, end_date, description) {
      const year = parseInt(start_date.slice(0, 4));
      const token = localStorage.getItem('ssms_token');
      const res = await fetch('/api/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ title, start_date, end_date, year, type: 'vacation', description })
      });
      return res.ok ? await res.json() : null;
    }
    async function apiDeleteVacation(id) {
      const token = localStorage.getItem('ssms_token');
      const res = await fetch(`/api/vacations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      return res.ok;
    }

    /* ── Vacation set for the current month (used in heatmap) ── */
    let currentVacationPeriods = [];
    function isInVacationPeriod(dateStr) {
      for (const v of currentVacationPeriods) {
        if (dateStr >= v.start_date && dateStr <= v.end_date) return v.title;
      }
      return null;
    }

    async function loadAndRenderReport() {
      const year  = parseInt(reportYearSel.value);
      const month = parseInt(reportMonthSel.value);

      // Fetch vacations for the month's year(s) — refresh each load
      currentVacationPeriods = await apiGetVacations(year);
      // Also pull previous year if month=Jan (edge case)
      if (month === 1) {
        const prev = await apiGetVacations(year - 1);
        currentVacationPeriods = [...prev, ...currentVacationPeriods];
      }

      const report = await loadMonthlyReport(year, month, personType);
      if (!report) return;

      section.querySelector('#reportTitle').textContent = `Attendance Heatmap — ${monthNames[month - 1]} ${year} (${personType === 'student' ? 'Students' : 'Teachers'})`;

      // 2×2 stat cards (right panel)
      section.querySelector('#monthlyStats').innerHTML = `
        <div class="att-stat-card" style="background:linear-gradient(135deg,#bbf7d0,#4ade80);">
          <div class="att-stat-val" style="color:#065f46;"><span data-roll-target="${report.overallPercent}" data-roll-suffix="%">0</span></div>
          <div class="att-stat-lbl" style="color:#065f46;">Overall ${monthNames[month - 1]}</div>
        </div>
        <div class="att-stat-card" style="background:linear-gradient(135deg,#bfdbfe,#60a5fa);">
          <div class="att-stat-val" style="color:#1e3a8a;"><span data-roll-target="${report.totalWorkingDays}">0</span></div>
          <div class="att-stat-lbl" style="color:#1e3a8a;">Working Days</div>
        </div>
        <div class="att-stat-card" style="background:linear-gradient(135deg,#fde68a,#facc15);">
          <div class="att-stat-val" style="color:#713f12;"><span data-roll-target="${report.fullAttendance}">0</span></div>
          <div class="att-stat-lbl" style="color:#713f12;">100% Attendance</div>
        </div>
        <div class="att-stat-card" style="background:linear-gradient(135deg,#fecaca,#ef4444);">
          <div class="att-stat-val" style="color:#fff;"><span data-roll-target="${report.below75}">0</span></div>
          <div class="att-stat-lbl" style="color:#fff;">Below 75%</div>
        </div>`;

      // Heatmap (calendar grid: weeks as columns Mon–Sun)
      const heatmap = section.querySelector('#heatmap');
      heatmap.innerHTML = '';

      const dayLookup = {};
      report.days.forEach(d => { dayLookup[d.day] = d; });

      const daysInMonth = new Date(year, month, 0).getDate();
      function toMonRow(jsDay) { return jsDay === 0 ? 6 : jsDay - 1; }

      const weeks = [];
      let currentWeek = new Array(7).fill(null);
      for (let day = 1; day <= daysInMonth; day++) {
        const dt  = new Date(year, month - 1, day);
        const row = toMonRow(dt.getDay());
        currentWeek[row] = day;
        if (row === 6 || day === daysInMonth) { weeks.push(currentWeek); currentWeek = new Array(7).fill(null); }
      }

      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let html = '<div class="hm-month-col">';
      html += '<div class="hm-day-labels">';
      dayLabels.forEach(n => { html += `<div class="hm-day-label-cell">${n}</div>`; });
      html += '</div><div class="hm-weeks-wrap">';

      weeks.forEach(week => {
        html += '<div class="hm-week-col">';
        week.forEach((day, rowIdx) => {
          if (day === null) { html += '<div class="heat-day lv-empty"></div>'; return; }
          const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const d = dayLookup[day];
          const isSunday = (rowIdx === 6);
          const vacTitle = isInVacationPeriod(dateStr);

          let cls = 'lv0', title = `Day ${day}: No data`, clickDate = null;

          if (vacTitle && !isSunday) {
            // ✅ PRIORITY 1: Vacation (Mon–Sat) — sky blue
            cls = 'lv-vacation'; title = `Day ${day}: ${vacTitle} 🏖️`;
          } else if (d && d.isHoliday && !isSunday) {
            // ✅ PRIORITY 2: Festival/manual holiday (Mon–Sat) — pink
            cls = 'lv-holiday'; title = `Day ${day}: ${d.holidayTitle || 'Holiday'} ♥`;
          } else if (isSunday) {
            // ✅ PRIORITY 3: Sunday — always grey dashed, even during vacation
            cls = 'lv-sun'; title = `Day ${day}: Sunday`;
          } else if (!d || d.percent === null) {
            cls = 'lv0'; title = `Day ${day}: No data`;
          } else if (d.percent >= 95) {
            cls = 'lv5'; title = `Day ${day}: ${d.percent}%`;
          } else if (d.percent >= 85) {
            cls = 'lv4'; title = `Day ${day}: ${d.percent}%`;
          } else if (d.percent >= 75) {
            cls = 'lv3'; title = `Day ${day}: ${d.percent}%`;
          } else if (d.percent >= 60) {
            cls = 'lv2'; title = `Day ${day}: ${d.percent}%`;
          } else {
            cls = 'lv1'; title = `Day ${day}: ${d.percent}%`;
          }

          if (!isSunday && d && d.date && d.percent !== null) clickDate = d.date;
          html += `<div class="heat-day ${cls}" title="${title}"${clickDate ? ` data-date="${clickDate}"` : ''}>${day}</div>`;
        });
        html += '</div>';
      });
      html += '</div></div>';
      heatmap.innerHTML = html;

      heatmap.querySelectorAll('.heat-day[data-date]').forEach(el => {
        el.addEventListener('click', () => openDayDetail(el.dataset.date));
      });

      // ── Populate middle panel: vacation tags + holiday tags ──
      const mm = String(month).padStart(2, '0');
      const monthStart = `${year}-${mm}-01`;
      const monthEnd   = `${year}-${mm}-${String(daysInMonth).padStart(2,'0')}`;
      const vacThisMonth = currentVacationPeriods.filter(v => v.start_date <= monthEnd && v.end_date >= monthStart);

      const vacTagsEl = section.querySelector('#vacationTags');
      const holTagsEl = section.querySelector('#holidayTags');

      if (vacThisMonth.length) {
        vacTagsEl.innerHTML = vacThisMonth.map(v => {
          const s = parseInt(v.start_date.split('-')[2]);
          const e = parseInt(v.end_date.split('-')[2]);
          return `<span class="att-vh-tag att-vh-tag-vacation"><span class="att-vh-tag-date">${s}–${e}</span>${v.title}</span>`;
        }).join('');
      } else {
        vacTagsEl.innerHTML = '<em class="att-vh-empty">No vacations this month</em>';
      }

      const festHols = (report.holidays || []).filter(h => h.source !== 'vacation');
      if (festHols.length) {
        holTagsEl.innerHTML = festHols.map(h => {
          const dayNum = parseInt(h.holiday_date.split('-')[2]);
          return `<span class="att-vh-tag att-vh-tag-holiday"><span class="att-vh-tag-date">${dayNum}</span>${h.title}</span>`;
        }).join('');
      } else {
        holTagsEl.innerHTML = '<em class="att-vh-empty">No holidays this month</em>';
      }

      initRollingCounters(section);
    }

    async function openDayDetail(date) {
      const overlay = document.getElementById('dayDetailOverlay');
      const titleEl = document.getElementById('dayDetailTitle');
      const statsEl = document.getElementById('dayDetailStats');
      const bodyEl  = document.getElementById('dayDetailBody');
      titleEl.textContent = 'Loading\u2026';
      statsEl.innerHTML   = '';
      bodyEl.innerHTML    = '<tr><td colspan="3" style="padding:20px;text-align:center;color:#94a3b8;">Loading\u2026</td></tr>';
      overlay.style.display = 'flex';
      try {
        const data = await loadAttendanceDayDetail(date, personType);
        const d = new Date(date + 'T00:00:00');
        const weekday = Number.isNaN(d.getTime())
          ? ''
          : d.toLocaleDateString('en-GB', { weekday: 'short' });
        const label = `${weekday}${weekday ? ', ' : ''}${formatDate(date)}`;
        titleEl.textContent = `${personType === 'student' ? '\uD83C\uDF93' : '\uD83D\uDC69\u200D\uD83C\uDFEB'} ${label} \u2014 Attendance`;
        statsEl.innerHTML = `
          <span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;">\u2705 Present: ${data.present}</span>
          <span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;">\u274C Absent: ${data.absent}</span>
          <span style="background:#fef9c3;color:#713f12;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;">\uD83C\uDFD6\uFE0F Leave: ${data.leave}</span>
          <span style="background:#e0e7ff;color:#3730a3;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;">\uD83D\uDCCA ${data.percent}%</span>
        `;
        if (!data.records || !data.records.length) {
          bodyEl.innerHTML = '<tr><td colspan="3" style="padding:20px;text-align:center;color:#94a3b8;">No records for this day.</td></tr>';
          return;
        }
        bodyEl.innerHTML = data.records.map(r => {
          const normalizedStatus = attendanceStatusLabel(attendanceStatusCode(r.status_code || r.status));
          const statusBg  = normalizedStatus === 'Present' ? '#dcfce7' : normalizedStatus === 'Absent' ? '#fee2e2' : '#fef9c3';
          const statusClr = normalizedStatus === 'Present' ? '#166534' : normalizedStatus === 'Absent' ? '#991b1b' : '#713f12';
          const meta = personType === 'student' ? `${r.class ? 'Cls ' + r.class : ''}${r.section ? '-' + r.section : ''}` : (r.subject || '\u2014');
          return `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 8px;">${r.name || '\u2014'}</td>
            <td style="padding:5px 8px;color:#64748b;font-size:0.73rem;">${r.roll || '\u2014'} / ${meta}</td>
            <td style="padding:5px 8px;text-align:center;">
              <span style="background:${statusBg};color:${statusClr};padding:2px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;">${normalizedStatus}</span>
            </td>
          </tr>`;
        }).join('');
      } catch (err) {
        console.warn('openDayDetail error:', err);
        bodyEl.innerHTML = '<tr><td colspan="3" style="padding:20px;text-align:center;color:#ef4444;">Failed to load detail.</td></tr>';
      }
    }

    section.querySelector('#loadReportBtn').addEventListener('click', loadAndRenderReport);

    // ◀ / ▶ month navigation
    section.querySelector('#prevMonthBtn').addEventListener('click', () => {
      let m = parseInt(reportMonthSel.value) - 1;
      let y = parseInt(reportYearSel.value);
      if (m < 1) { m = 12; y--; }
      reportMonthSel.value = m;
      reportYearSel.value  = y;
      loadAndRenderReport();
    });
    section.querySelector('#nextMonthBtn').addEventListener('click', () => {
      let m = parseInt(reportMonthSel.value) + 1;
      let y = parseInt(reportYearSel.value);
      if (m > 12) { m = 1; y++; }
      reportMonthSel.value = m;
      reportYearSel.value  = y;
      loadAndRenderReport();
    });

    const syncGoogleBtn = section.querySelector('#syncGoogleBtn');
    if (syncGoogleBtn) {
      syncGoogleBtn.addEventListener('click', async () => {
        const year = parseInt(reportYearSel.value);
        const res = await syncGoogleHolidays(year);
        if (res.success) {
          showSuccessPopup(`â˜ï¸ Synced ${res.synced} holidays from Google Calendar for ${year}`);
          try { await loadAndRenderReport(); } catch(err) { console.error('Refresh failed:', err); }
        } else {
          showErrorPopup('Google Calendar sync failed. Make sure GOOGLE_CALENDAR_API_KEY is set in .env.');
        }
      });
    }

    // Add Holiday Modal handlers
    const holidayModal = document.getElementById('addHolidayModal');
    const holidayForm = document.getElementById('holidayForm');
    
    section.querySelector('#addHolidayBtn').addEventListener('click', () => {
      holidayModal.classList.remove('hidden');
      document.getElementById('holidayDate').value = '';
      document.getElementById('holidayTitle').value = '';
    });

    document.getElementById('holidayModalClose').addEventListener('click', () => {
      holidayModal.classList.add('hidden');
    });

    document.getElementById('holidayCancelBtn').addEventListener('click', () => {
      holidayModal.classList.add('hidden');
    });

    holidayForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const date = document.getElementById('holidayDate').value;
      const title = document.getElementById('holidayTitle').value;
      
      if (!date || !title) return;

      const res = await addHoliday(date, title);
      if (res && res.success) {
        showSuccessPopup(`🎉 Added holiday: ${title} on ${date}`);
        holidayModal.classList.add('hidden');
        try { await loadAndRenderReport(); } catch(err) { console.error('Refresh failed:', err); }
      } else {
        showErrorPopup('Failed to add holiday. Please try again.');
      }
    });

    // ── Add Vacation Modal ──
    const vacationModal = document.getElementById('addVacationModal');
    const vacationForm  = document.getElementById('vacationForm');

    function openAddVacationModal() {
      document.getElementById('vacationTitle').value = '';
      document.getElementById('vacationStart').value = '';
      document.getElementById('vacationEnd').value   = '';
      document.getElementById('vacationDesc').value  = '';
      vacationModal.classList.remove('hidden');
    }

    section.querySelector('#addVacationBtn').addEventListener('click', openAddVacationModal);
    document.getElementById('vacationModalClose').addEventListener('click',  () => vacationModal.classList.add('hidden'));
    document.getElementById('vacationCancelBtn').addEventListener('click',   () => vacationModal.classList.add('hidden'));

    vacationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('vacationTitle').value.trim();
      const start = document.getElementById('vacationStart').value;
      const end   = document.getElementById('vacationEnd').value;
      const desc  = document.getElementById('vacationDesc').value.trim();
      if (!title || !start || !end) return;
      if (end < start) { showErrorPopup('End date must be on or after start date.'); return; }
      const res = await apiAddVacation(title, start, end, desc);
      if (res && (res.id || res.success)) {
        showSuccessPopup(`🏖️ Vacation added: ${title} (${start} → ${end})`);
        vacationModal.classList.add('hidden');
        try { await loadAndRenderReport(); } catch(err) { console.error('Refresh failed:', err); }
      } else {
        showErrorPopup('Failed to add vacation. Please try again.');
      }
    });

    // ── Manage Vacations Modal ──
    const manageModal = document.getElementById('manageVacationsModal');

    async function openManageVacations() {
      manageModal.classList.remove('hidden');
      await refreshVacationList();
    }

    async function refreshVacationList() {
      const year = parseInt(reportYearSel.value);
      const list = document.getElementById('vacationsList');
      list.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:16px;">Loading…</p>';
      const vacs = await apiGetVacations(year);
      if (!vacs.length) {
        list.innerHTML = `<p style="color:#94a3b8;text-align:center;padding:16px;">No vacation periods for ${year}.</p>`;
        return;
      }
      list.innerHTML = vacs.map(v => `
        <div class="manage-vacation-item" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;background:#f8fafc;">
          <div>
            <div style="font-weight:700;color:#0f172a;">${v.title}</div>
            <div style="font-size:0.75rem;color:#64748b;">${v.start_date} → ${v.end_date}</div>
            ${v.description ? `<div style="font-size:0.72rem;color:#94a3b8;">${v.description}</div>` : ''}
          </div>
          <button class="btn btn-danger btn-sm" data-vacid="${v.id}" data-vacname="${String(v.title).replace(/"/g, '&quot;')}" style="white-space:nowrap;">🗑️ Delete</button>
        </div>`).join('');

      list.querySelectorAll('[data-vacid]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.vacid;
          const name = btn.dataset.vacname || 'this vacation';
          if (!confirm(`Delete vacation "${name}"?`)) return;
          const ok = await apiDeleteVacation(id);
          if (ok) {
            showSuccessPopup(`Vacation "${name}" deleted.`);
            await refreshVacationList();
            try { await loadAndRenderReport(); } catch(err) { console.error('Refresh failed:', err); }
          } else {
            showErrorPopup('Failed to delete vacation.');
          }
        });
      });
    }

    section.querySelector('#manageVacationsBtn').addEventListener('click', openManageVacations);
    document.getElementById('manageVacationsClose').addEventListener('click', () => manageModal.classList.add('hidden'));
    document.getElementById('manageAddVacBtn').addEventListener('click', () => {
      manageModal.classList.add('hidden');
      openAddVacationModal();
    });

    // Export CSV
    section.querySelector('#exportAttBtn').addEventListener('click', () => {
      const year  = parseInt(reportYearSel.value);
      const month = parseInt(reportMonthSel.value);
      const token = localStorage.getItem('ssms_token');
      const url = `http://localhost:5000/api/attendance/export?year=${year}&month=${month}&person_type=${personType}&token=${token}`;
      window.open(url, '_blank');
    });

    // Initial render
    await loadAndRenderReport();
    initRollingCounters(section);
  }

  /* ---------- EXAMS ---------- */
  async function initExamsSection() {
    const section = sections.exams;
    let exams   = await loadExams();
    let results = [];   // loaded dynamically

    section.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        section.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        ['exams','marks','results'].forEach(t => {
          section.querySelector('#tab-' + t).classList.toggle('hidden', t !== tab);
        });
        if (tab === 'results') renderResultCards();
      });
    });

    function updateExamStats() {
      const scheduled = exams.filter(e => e.status === 'Scheduled').length;
      const completed = exams.filter(e => e.status === 'Completed').length;
      const upcoming  = exams.filter(e => e.status === 'Upcoming').length;
      section.querySelector('#ex-scheduled').dataset.rollTarget = scheduled;
      section.querySelector('#ex-completed').dataset.rollTarget = completed;
      section.querySelector('#ex-upcoming').dataset.rollTarget  = upcoming;
      initRollingCounters(section);
    }

    function renderExamTable(filter) {
      const tbody = section.querySelector('#examTableFull');
      const list  = filter ? exams.filter(e => e.class === filter) : exams;
      tbody.innerHTML = list.map((ex, i) => `
        <tr>
          <td style="color:#94a3b8;">${i+1}</td>
          <td class="td-name">${ex.name}</td>
          <td>Class ${ex.class}</td>
          <td>${ex.subject}</td>
          <td>${formatDate(ex.date)}</td>
          <td>${ex.duration}</td>
          <td style="font-weight:700;">${ex.maxMarks}</td>
          <td><span class="badge ${statusBadge(ex.status)}">${ex.status}</span></td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-primary btn-sm btn-icon" title="Edit" onclick="window._editExam('${ex.id}')">✏️</button>
              <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteExam('${ex.id}')">🗑️</button>
            </div>
          </td>
        </tr>`).join('');
    }
    window.deleteExam = async (id) => {
      if (!confirm('Delete exam?')) return;
      await apiDeleteExam(id);
      exams = exams.filter(e => e.id !== id);
      renderExamTable(); updateExamStats();
    };

    section.querySelector('#classExamFilter').addEventListener('change', function() { renderExamTable(this.value); });

    /* -------- MARKS ENTRY TAB -------- */
    // Subject colour palette — mirrors timetable.js SUBJECT_COLORS
    const ALL_SUBJ_COLORS = {
      'Mathematics':    { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
      'Science':        { bg: '#dcfce7', text: '#166534', border: '#86efac' },
      'English':        { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
      'Social Science': { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
      'Hindi':          { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
      'Gujarati':       { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
      'Sanskrit':       { bg: '#fae8ff', text: '#86198f', border: '#e879f9' },
      'Computer':       { bg: '#cffafe', text: '#155e75', border: '#67e8f9' },
      'EVS':            { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
      'Drawing':        { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      'PT':             { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
      'Moral Science':  { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
      'GK':             { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    };
    // Subject lists matching timetable.js SUBJECTS_BY_STD
    const SUBJECTS_BY_STD = {
      primary: ['English','Mathematics','EVS','Gujarati','Hindi','Drawing','PT','Moral Science','GK'],
      upper:   ['Mathematics','Science','Social Science','English','Hindi','Gujarati','Sanskrit','Computer','PT','Drawing'],
    };
    function getSubjectsForClass(cls) {
      const n = parseInt(cls) || 0;
      const names = n <= 5 ? SUBJECTS_BY_STD.primary : SUBJECTS_BY_STD.upper;
      return names.map(name => ({ name, ...(ALL_SUBJ_COLORS[name] || { bg:'#f1f5f9', text:'#334155', border:'#cbd5e1' }) }));
    }
    let currentCls      = '';
    let currentSection  = '';
    let currentExam     = 'midterm';
    let currentSubjects = [];
    let marksData       = [];

    const marksClassSel   = section.querySelector('#marksClassSel');
    const marksSectionSel = section.querySelector('#marksSectionSel');
    const marksExamSel    = section.querySelector('#marksExamSel');
    const marksWrap       = section.querySelector('#marksTableWrap');
    const marksTitle      = section.querySelector('#marksEntryTitle');

    function calcGrade(pct) {
      if (pct >= 90) return 'A+'; if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+'; if (pct >= 60) return 'B';
      if (pct >= 50) return 'C';  return 'D';
    }

    function renderMarksTable() {
      if (!marksData.length) {
        marksWrap.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;">No students found for this class / section.</div>';
        return;
      }
      const maxTotal = currentSubjects.length * 100;
      // Coloured subject column headers
      const subjHeaders = currentSubjects.map(s =>
        `<th style="background:${s.bg};color:${s.text};border-bottom:2px solid ${s.border};white-space:nowrap;min-width:72px;">
          ${s.name}<br><small style="font-weight:400;opacity:0.75;">/100</small>
        </th>`
      ).join('');

      marksWrap.innerHTML = `<div style="overflow-x:auto;"><table>
        <thead>
          <tr>
            <th style="width:42px;">#</th>
            <th>Student Name</th>
            <th style="width:72px;">Section</th>
            ${subjHeaders}
            <th>Total</th><th>%</th><th>Grade</th>
          </tr>
        </thead>
        <tbody>${marksData.map((r, i) => {
          const subjectInputs = currentSubjects.map(s =>
            `<td style="background:${s.bg}20;">
               <input type="number" class="form-control"
                 style="width:68px;padding:4px 6px;background:${s.bg};color:${s.text};border:1.5px solid ${s.border};font-weight:600;"
                 value="${r.marks[s.name] || 0}" min="0" max="100"
                 oninput="window._recalcMark(${i},'${s.name.replace(/'/g, "\\'").replace(/ /g, '_SPACE_')}',this.value)" />
             </td>`
          ).join('');
          return `
          <tr id="mrow-${i}">
            <td style="color:#94a3b8;">${r.roll || (i+1)}</td>
            <td class="td-name">${r.student}</td>
            <td><span class="badge" style="background:#f1f5f9;color:#475569;font-weight:600;">${r.section || '—'}</span></td>
            ${subjectInputs}
            <td style="font-weight:700;" id="m-total-${i}">${r.total}/${maxTotal}</td>
            <td id="m-pct-${i}" style="font-weight:700;">${r.percent}%</td>
            <td><span class="badge ${gradeColor(r.grade)}" id="m-grade-${i}">${r.grade}</span></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table></div>`;
    }

    window._recalcMark = (i, rawName, val) => {
      const subjectName = rawName.replace(/_SPACE_/g, ' ');
      if (!marksData[i]) return;
      marksData[i].marks[subjectName] = Math.min(100, Math.max(0, parseInt(val) || 0));
      const maxTotal = currentSubjects.length * 100;
      const total    = currentSubjects.reduce((sum, s) => sum + (marksData[i].marks[s.name] || 0), 0);
      const pct      = parseFloat((total / maxTotal * 100).toFixed(1));
      const grade    = calcGrade(pct);
      marksData[i].total   = total;
      marksData[i].percent = String(pct);
      marksData[i].grade   = grade;
      const tot   = section.querySelector('#m-total-' + i); if (tot)   tot.textContent   = total + '/' + maxTotal;
      const pctEl = section.querySelector('#m-pct-'   + i); if (pctEl) pctEl.textContent = pct + '%';
      const gEl   = section.querySelector('#m-grade-' + i);
      if (gEl) { gEl.textContent = grade; gEl.className = 'badge ' + gradeColor(grade); }
    };

    async function loadMarks() {
      currentCls     = marksClassSel.value;
      currentSection = marksSectionSel.value;
      currentExam    = marksExamSel.value;
      if (!currentCls) { marksWrap.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444;">Please select a class.</div>'; return; }

      // Determine subjects for this standard (primary 1-5 vs upper 6-10)
      currentSubjects = getSubjectsForClass(currentCls);

      marksWrap.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;">Loading…</div>';

      try {
        // Step 1 — load students (authoritative unique list) filtered by class + optional section
        // students API accepts combined "5A" for class+section
        const clsParam = currentCls + (currentSection ? currentSection : '');
        const stuRes   = await api.get(`/students?class=${encodeURIComponent(clsParam)}&limit=100`);
        const students = (stuRes.data || []).filter(s => s.status === 'Active');

        if (!students.length) {
          marksWrap.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;">No active students found for this class / section.</div>';
          marksData = [];
          return;
        }

        // Step 2 — load saved marks from new flexible marks table
        const mRes   = await api.get(`/marks?class=${currentCls}&exam_type=${encodeURIComponent(currentExam)}`);
        const savedMap = new Map();
        (mRes.data || []).forEach(r => savedMap.set(r.student.toLowerCase().trim(), r.marks || {}));

        // Step 3 — merge: one row per student, no duplicates
        const maxTotal = currentSubjects.length * 100;
        marksData = students.map(s => {
          const saved  = savedMap.get(s.name.toLowerCase().trim()) || {};
          const total  = currentSubjects.reduce((sum, subj) => sum + (saved[subj.name] || 0), 0);
          const pct    = parseFloat((total / maxTotal * 100).toFixed(1));
          return {
            student: s.name,
            roll:    s.gr_number || '',
            class:   currentCls,
            section: s.section || '',
            marks:   { ...saved },
            total,
            percent: String(pct),
            grade:   calcGrade(pct)
          };
        });
      } catch (err) {
        console.warn('loadMarks error:', err);
        marksData = [];
        marksWrap.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444;">⚠️ Failed to load student data. Please try again.</div>';
        return;
      }

      const examLabel = currentExam === 'midterm' ? 'Mid-Term' : 'Annual';
      const secLabel  = currentSection ? ` · Sec ${currentSection}` : '';
      marksTitle.textContent = `📝 Class ${currentCls}${secLabel} — ${examLabel} Marks`;
      renderMarksTable();
    }

    section.querySelector('#loadMarksBtn').addEventListener('click', loadMarks);

    section.querySelector('#saveMarksBtn').addEventListener('click', async () => {
      if (!currentCls) { alert('Please select a class and click Load first.'); return; }
      if (!marksData.length) { alert('No marks to save.'); return; }

      const btn = section.querySelector('#saveMarksBtn');
      btn.disabled = true; btn.textContent = '⏳ Saving…';

      try {
        const payload = {
          class:     String(currentCls),
          exam_type: currentExam,
          students:  marksData.map(r => ({ student: r.student, roll: r.roll, marks: r.marks }))
        };
        const result = await api.post('/marks/bulk', payload);
        btn.disabled = false; btn.textContent = '💾 Save Marks';

        if (result && result.success) {
          const flash = Object.assign(document.createElement('div'), {
            className: 'alert alert-success',
            style: 'margin-top:8px;',
            textContent: `✅ ${result.count} subject marks saved for Class ${currentCls} (${currentExam}).`
          });
          marksWrap.after(flash);
          setTimeout(() => flash.remove(), 3000);
          results = await loadAllResults();
          renderResultCards();
        } else {
          alert(result?.error || 'Failed to save marks.');
        }
      } catch (e) {
        btn.disabled = false; btn.textContent = '💾 Save Marks';
        alert('Failed to save marks. Please try again.');
      }
    });

    /* -------- RESULT CARDS TAB -------- */
    async function loadAllResults() {
      const cls      = section.querySelector('#resultClassFilter').value;
      const examType = section.querySelector('#resultExamFilter').value;
      const secF     = section.querySelector('#resultSectionFilter').value;
      const params   = [];
      if (cls)      params.push(`class=${cls}`);
      if (examType) params.push(`exam_type=${examType}`);
      if (secF)     params.push(`section=${secF}`);
      try {
        const res = await api.get('/marks' + (params.length ? '?' + params.join('&') : ''));
        return res.data || [];
      } catch (_) { return []; }
    }

    function renderResultCards() {
      const search   = (section.querySelector('#resultSearch').value  || '').toLowerCase();
      const gradeF   = section.querySelector('#gradeFilter').value;
      const list = results.filter(r =>
        (!search  || r.student.toLowerCase().includes(search)) &&
        (!gradeF  || r.grade === gradeF)
      );
      section.querySelector('#resultCards').innerHTML = list.length ? list.map(r => {
        const subjNames = parseInt(r.class) <= 5 ? SUBJECTS_BY_STD.primary : SUBJECTS_BY_STD.upper;
        const examBadge = r.exam_type === 'midterm'
          ? '<span class="badge badge-purple" style="font-size:0.65rem;">Mid-Term</span>'
          : '<span class="badge badge-success" style="font-size:0.65rem;">Annual</span>';
        const cols     = Math.min(subjNames.length, 5);
        const pillsHtml = subjNames.map(name => subjectPill(name, (r.marks || {})[name] || 0, ALL_SUBJ_COLORS[name])).join('');
        return `
        <div class="card">
          <div style="padding:20px 22px 0;display:flex;align-items:center;gap:14px;">
            <div style="width:52px;height:52px;border-radius:50%;background:${avatarColor(r.student)};
              display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:#fff;font-weight:700;">
              ${r.student.charAt(0)}
            </div>
            <div>
              <div style="font-size:1rem;font-weight:700;">${r.student}</div>
              <div style="font-size:0.78rem;color:#64748b;">Class ${r.class || '—'} ${r.section ? '· Sec ' + r.section : ''} &nbsp;|&nbsp; Roll: ${r.roll || '—'}</div>
              <div style="margin-top:3px;">${examBadge}</div>
            </div>
            <div style="margin-left:auto;text-align:center;">
              <div class="badge ${gradeColor(r.grade)}" style="font-size:1rem;padding:6px 16px;">${r.grade}</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;margin-bottom:14px;">
              ${pillsHtml}
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="font-size:0.82rem;color:#64748b;">Total: <strong>${r.total}/${r.maxTotal}</strong></div>
              <div style="font-size:0.82rem;color:#64748b;"><strong>${r.percent}%</strong></div>
              <div><span class="badge ${r.percent >= 50 ? 'badge-success' : 'badge-danger'}">${r.percent >= 50 ? 'PASS' : 'FAIL'}</span></div>
            </div>
            <div class="progress-bar" style="margin-top:10px;">
              <div class="progress-fill purple" style="width:${r.percent}%;"></div>
            </div>
          </div>
        </div>`;
      }).join('') : '<div style="padding:40px;text-align:center;color:#94a3b8;grid-column:1/-1;">No results found.</div>';
    }
    function subjectPill(name, marks, colors) {
      const valColor = marks >= 80 ? '#059669' : marks >= 60 ? '#4f46e5' : marks >= 50 ? '#d97706' : '#dc2626';
      const bg     = colors ? colors.bg     : '#f8fafc';
      const border = colors ? colors.border : '#e2e8f0';
      const short  = name.replace('Social Science','SSt').replace('Moral Science','Mor.Sci').replace('Mathematics','Math');
      return `<div style="text-align:center;padding:7px 4px;background:${bg};border-radius:8px;border:1px solid ${border};">
        <div style="font-size:1rem;font-weight:700;color:${valColor};">${marks}</div>
        <div style="font-size:0.6rem;color:#64748b;white-space:nowrap;">${short}</div>
      </div>`;
    }

    async function applyResultFilters() {
      results = await loadAllResults();
      renderResultCards();
    }

    section.querySelector('#resultSearch').addEventListener('input', renderResultCards);
    section.querySelector('#gradeFilter').addEventListener('change', renderResultCards);
    section.querySelector('#resultClassFilter').addEventListener('change', applyResultFilters);
    section.querySelector('#resultExamFilter').addEventListener('change', applyResultFilters);
    section.querySelector('#resultSectionFilter').addEventListener('change', applyResultFilters);

    let editExamId = null;

    function populateExamSubjects(cls, selectedSubject) {
      const sel = section.querySelector('#ex-subject');
      sel.innerHTML = '';
      if (!cls) {
        sel.innerHTML = '<option value="">Select class first</option>';
        return;
      }
      sel.innerHTML = '<option value="">Select subject</option>';
      const subjects = getSubjectsForClass(cls);
      subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        if (selectedSubject && s.name === selectedSubject) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    section.querySelector('#ex-class').addEventListener('change', function() {
      populateExamSubjects(this.value, '');
    });

    function openExamModal(exam) {
      editExamId = exam ? exam.id : null;
      const modal = section.querySelector('#examModal');
      modal.querySelector('.modal-title').textContent = exam ? 'Edit Exam' : 'Create New Exam';
      section.querySelector('#saveExam').textContent  = exam ? '💾 Save Changes' : '💾 Create Exam';
      section.querySelector('#ex-name').value     = exam ? exam.name     : '';
      section.querySelector('#ex-class').value    = exam ? exam.class    : '';
      populateExamSubjects(exam ? exam.class : '', exam ? exam.subject : '');
      section.querySelector('#ex-marks').value    = exam ? String(exam.maxMarks || exam.max_marks || 100) : '100';
      section.querySelector('#ex-date').value     = exam ? exam.date     : '';
      section.querySelector('#ex-duration').value = exam ? exam.duration : '';
      modal.classList.remove('hidden');
    }

    function closeExamModal() {
      section.querySelector('#examModal').classList.add('hidden');
      editExamId = null;
    }

    window._editExam = (id) => {
      const exam = exams.find(e => e.id === id);
      if (exam) openExamModal(exam);
    };

    section.querySelector('#addExamBtn').addEventListener('click', () => openExamModal(null));
    section.querySelector('#closeExamModal').addEventListener('click', closeExamModal);
    section.querySelector('#cancelExamModal').addEventListener('click', closeExamModal);
    section.querySelector('#saveExam').addEventListener('click', async () => {
      const name = section.querySelector('#ex-name').value;
      if (!name) { alert('Please select an exam type.'); return; }
      const maxMarks = parseInt(section.querySelector('#ex-marks').value) || 100;
      const duration = section.querySelector('#ex-duration').value;
      if (!duration) { alert('Please select a duration.'); return; }
      const cls = section.querySelector('#ex-class').value;
      const subject = section.querySelector('#ex-subject').value;
      if (!cls) { alert('Please select a class.'); return; }
      if (!subject) { alert('Please select a subject.'); return; }
      const payload = {
        name,
        class:    cls,
        subject:  subject,
        max_marks: maxMarks,
        maxMarks,
        date:     section.querySelector('#ex-date').value,
        duration: duration,
        status:   'Scheduled'
      };

      if (editExamId) {
        // Update existing exam
        const existing = exams.find(e => e.id === editExamId);
        if (existing) payload.status = existing.status; // preserve current status
        await apiUpdateExam(editExamId, payload);
        const idx = exams.findIndex(e => e.id === editExamId);
        if (idx !== -1) exams[idx] = { ...exams[idx], ...payload };
      } else {
        // Create new exam
        payload.id = 'EXM' + Date.now();
        const res = await apiCreateExam(payload);
        if (res && res.id) payload.id = res.id;
        exams.unshift(payload);
      }

      closeExamModal();
      renderExamTable(); updateExamStats();
    });

    // Load initial results for result cards tab
    results = await loadAllResults();
    updateExamStats(); renderExamTable(); renderResultCards();
  }

  /* ---------- FEES ---------- */
  async function initFeesSection() {
    const section = sections.fees;
    let fees = await loadFees();
    let filtered = [];
    const PAGE_SIZE = 7;
    let currentPage = 1;

    const els = {
      collected: section.querySelector('#fee-collected'),
      pending: section.querySelector('#fee-pending'),
      partial: section.querySelector('#fee-partial'),
      rate: section.querySelector('#fee-rate'),
      search: section.querySelector('#f-searchInput'),
      classFilter: section.querySelector('#f-classFilter'),
      divisionFilter: section.querySelector('#f-divisionFilter'),
      status: section.querySelector('#f-statusFilter'),
      table: section.querySelector('#feeTable'),
      pageInfo: section.querySelector('#f-pageInfo'),
      prev: section.querySelector('#f-prevBtn'),
      next: section.querySelector('#f-nextBtn'),
      pageNums: section.querySelector('#f-pageNums')
    };

    function parseClassNumber(clsValue) {
      const match = String(clsValue || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    }

    function parseDivision(clsValue) {
      const parts = String(clsValue || '').split('-');
      return String(parts[1] || '').trim().toUpperCase();
    }

    function populateClassOptions() {
      if (!els.classFilter) return;
      const classes = [1, 2, 3, 4, 5, 6];
      const currentClass = String(els.classFilter.value || '').trim();

      els.classFilter.innerHTML = `
        <option value="">Select Class</option>
        ${classes.map((cls) => `<option value="${cls}">${cls}</option>`).join('')}
      `;
      if (!currentClass || classes.includes(parseInt(currentClass, 10))) {
        els.classFilter.value = currentClass;
      }
    }

    function populateDivisionOptions(selectedClass = '') {
      if (!els.divisionFilter) return;
      const divisions = ['A', 'B', 'C'];

      const currentDivision = String(els.divisionFilter.value || '').trim().toUpperCase();
      const nextValue = divisions.includes(currentDivision) ? currentDivision : '';

      els.divisionFilter.innerHTML = `
        <option value="">Select Division</option>
        ${divisions.map((division) => `<option value="${division}">${division}</option>`).join('')}
      `;
      els.divisionFilter.value = nextValue;
    }

    function displayFeeAmount(clsValue, amount) {
      return formatMoney(amount || 0);
    }

    function hasRequiredFeeFilters() {
      const cls = String(els.classFilter?.value || '').trim();
      const division = String(els.divisionFilter?.value || '').trim().toUpperCase();
      return Boolean(cls && division);
    }

    function getNormalizedFeeEntry(entry, fallbackAmount = 0) {
      if (!entry) return null;
      const amount = Math.max((parseInt(fallbackAmount, 10) || parseInt(entry.amount, 10) || 0), 0);
      const paid = Math.min(Math.max(parseInt(entry.paid, 10) || 0, 0), amount);
      const due = Math.max(0, amount - paid);
      const status = due === 0 ? 'Paid' : paid === 0 ? 'Pending' : 'Partial';
      return {
        ...entry,
        amount,
        paid,
        due,
        status
      };
    }

    function getCurrentFeeMonthLabel() {
      return new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    }

    function buildSyntheticFeeEntry(student, cls, division) {
      const feeTotal = getFeeStructureTotal(parseInt(cls, 10));
      return {
        id: `FEE-STUDENT-${student.id}-${cls}${division}`,
        student: student.name,
        cls: `${cls}-${division}`,
        amount: feeTotal,
        paid: 0,
        due: feeTotal,
        month: getCurrentFeeMonthLabel(),
        date: '-',
        status: 'Pending',
        parent_name: student.parent,
        parent_phone: student.phone,
        student_id: student.student_id,
        isSynthetic: true
      };
    }

    function buildFeeRecordLookup(rows, cls, division) {
      const relevantRows = rows.filter((fee) => {
        const feeClass = String(parseClassNumber(fee.cls) || '');
        const feeDivision = parseDivision(fee.cls);
        return feeClass === String(cls) && feeDivision === String(division).toUpperCase();
      });

      const byStudentId = new Map();
      const byName = new Map();

      relevantRows.forEach((fee) => {
        if (fee.student_id) byStudentId.set(String(fee.student_id).trim().toLowerCase(), fee);
        byName.set(String(fee.student || '').trim().toLowerCase(), fee);
      });

      return { byStudentId, byName };
    }

    async function buildFeeRowsFromStudents(cls, division) {
      const response = await loadStudents({
        class: cls,
        section: division,
        limit: 500
      });
      const students = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
      const lookup = buildFeeRecordLookup(fees, cls, division);

      return students.map((student) => {
        const studentIdKey = String(student.student_id || '').trim().toLowerCase();
        const studentNameKey = String(student.name || '').trim().toLowerCase();
        const matchedFee = lookup.byStudentId.get(studentIdKey) || lookup.byName.get(studentNameKey);
        if (matchedFee) {
          return getNormalizedFeeEntry({
            ...matchedFee,
            student: student.name,
            cls: `${cls}-${division}`,
            parent_name: matchedFee.parent_name || student.parent,
            parent_phone: matchedFee.parent_phone || student.phone,
            student_id: matchedFee.student_id || student.student_id
          }, getFeeStructureTotal(parseInt(cls, 10)));
        }
        return buildSyntheticFeeEntry(student, cls, division);
      });
    }

    function updateStats() {
      const feeMetrics   = getPendingFeeMetrics(fees);
      const totalPaid    = feeMetrics.totalCollected;
      const totalDue     = feeMetrics.totalPending;
      const partialAmt   = fees.filter(f => f.status === 'Partial').reduce((s,f) => s + f.paid, 0);
      const total        = feeMetrics.totalExpected;
      const rate         = Math.round((totalPaid / total) * 100);
      els.collected.dataset.shortTarget = totalPaid;
      els.pending.dataset.shortTarget   = totalDue;
      els.partial.dataset.shortTarget   = partialAmt;
      els.rate.dataset.rollTarget       = isNaN(rate) ? 0 : rate;
      initRollingCounters(section);
      initShortCounters(section);
    }

    function renderTable() {
      const start = (currentPage - 1) * PAGE_SIZE;
      const slice = filtered.slice(start, start + PAGE_SIZE);
      if (!hasRequiredFeeFilters()) {
        els.table.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:#94a3b8;">Select class and division to view payment records.</td></tr>`;
        return;
      }
      if (!filtered.length) { els.table.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:#94a3b8;">No records found.</td></tr>`; return; }
      els.table.innerHTML = slice.map((f, i) => `
        <tr>
          <td style="color:#94a3b8;">${start + i + 1}</td>
          <td class="td-name">${f.student}</td>
          <td>${f.cls}</td>
          <td style="font-weight:600;">${displayFeeAmount(f.cls, f.amount)}</td>
          <td style="color:#059669;font-weight:700;">${displayFeeAmount(f.cls, f.paid)}</td>
          <td style="color:${f.due > 0 ? '#dc2626' : '#94a3b8'};font-weight:700;">${f.due > 0 ? formatMoney(f.due) : '—'}</td>
          <td><span class="badge badge-gray">${f.month}</span></td>
          <td style="font-size:0.8rem;">${formatDate(f.date)}</td>
          <td><span class="badge ${feeStatusBadge(f.status)}">${f.status}</span></td>
          <td>
            <div class="flex gap-2">
              ${(f.status === 'Paid' || f.status === 'Partial') ? `<button class="btn btn-outline btn-sm" onclick="showReceipt('${f.id}')">🧾 Receipt</button>` : ''}
            </div>
          </td>
        </tr>`).join('');
    }

    function renderPagination() {
      const total = filtered.length;
      if (!hasRequiredFeeFilters()) {
        els.pageInfo.textContent = '';
        els.prev.disabled = true;
        els.next.disabled = true;
        els.pageNums.innerHTML = '';
        return;
      }
      const pages = Math.ceil(total / PAGE_SIZE);
      els.pageInfo.textContent = total ? `Showing ${Math.min((currentPage-1)*PAGE_SIZE+1, total)}-${Math.min(currentPage*PAGE_SIZE, total)} of ${total}` : '';
      els.prev.disabled = currentPage === 1;
      els.next.disabled = currentPage >= pages;
      els.pageNums.innerHTML = total
        ? `<button class="page-btn active" onclick="goFeePage(${currentPage})">${currentPage}</button>`
        : '';
    }
    window.goFeePage = (p) => { currentPage = p; renderTable(); renderPagination(); };

    async function refreshFees() {
      fees = await loadFees();
      updateStats();
    }

    async function applyFilters() {
      const s = els.search.value.toLowerCase();
      const cls = String(els.classFilter?.value || '').trim();
      const division = String(els.divisionFilter?.value || '').trim().toUpperCase();
      const st = els.status.value;
      if (!hasRequiredFeeFilters()) {
        filtered = [];
        currentPage = 1;
        renderTable();
        renderPagination();
        return;
      }
      await refreshFees();
      const feeRows = await buildFeeRowsFromStudents(cls, division);
      filtered = feeRows.filter((f) => {
        const searchHaystack = [
          f.student,
          f.student_id,
          f.parent_name,
          f.parent_phone,
          f.cls
        ].join(' ').toLowerCase();
        const searchMatch = !s || searchHaystack.includes(s);
        const statusMatch = !st || f.status === st;
        return searchMatch && statusMatch;
      });
      currentPage = 1; renderTable(); renderPagination();
    }

    populateClassOptions();
    populateDivisionOptions();
    if (els.classFilter) els.classFilter.value = '';
    if (els.divisionFilter) els.divisionFilter.value = '';
    if (els.status) els.status.value = '';
    els.search.addEventListener('input', () => { applyFilters(); });
    els.classFilter?.addEventListener('change', () => {
      populateDivisionOptions(els.classFilter.value);
      applyFilters();
    });
    els.divisionFilter?.addEventListener('change', () => { applyFilters(); });
    els.status.addEventListener('change', () => { applyFilters(); });
    els.prev.addEventListener('click', () => { if(currentPage>1) goFeePage(currentPage-1); });
    els.next.addEventListener('click', () => { if(currentPage < Math.ceil(filtered.length/PAGE_SIZE)) goFeePage(currentPage+1); });

    window.markFeePaid = async (id) => {
      const f = fees.find(f => f.id === id);
      if (!f || f.status === 'Paid') return;
      if (!confirm(`Mark ₹${f.amount} fee for ${f.student} as Paid?`)) return;
      const today = new Date().toISOString().slice(0, 10);
      const updated = { ...f, paid: f.amount, due: 0, status: 'Paid', date: today };
      await apiUpdateFee(id, updated);
      populateClassOptions();
      populateDivisionOptions(els.classFilter?.value);
      await applyFilters();
      refreshDashboardFeeStats();
    };

    // Receipt modal wiring
    const receiptModal    = section.querySelector('#receiptModal');
    const receiptBody     = section.querySelector('#receiptBody');
    let _currentReceiptData = null;
    receiptModal?.querySelector('.modal-close')?.addEventListener('click', () => receiptModal.classList.add('hidden'));
    section.querySelector('#receiptCloseBtn')?.addEventListener('click', () => receiptModal.classList.add('hidden'));
    section.querySelector('#receiptPrintBtn')?.addEventListener('click', () => { if (_currentReceiptData) printFeeReceipt(_currentReceiptData); });
    section.querySelector('#receiptDownloadBtn')?.addEventListener('click', () => { if (_currentReceiptData) downloadFeeReceipt(_currentReceiptData); });

    window.showReceipt = async (id) => {
      receiptBody.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">Loading…</div>';
      receiptModal.classList.remove('hidden');
      const fresh = await apiFetchFeeReceipt(id);
      const f = fresh || fees.find(f => f.id === id);
      if (!f) { receiptBody.innerHTML = '<p style="color:red;padding:20px;">Receipt not found.</p>'; return; }
      _currentReceiptData = f;
      const parentLine = f.parent_name
        ? `${receiptRow('Parent / Guardian', f.parent_name)}${receiptRow('Parent Phone', f.parent_phone || '—')}`
        : '';
      const issuedLine = f.receipt_at
        ? receiptRow('Receipt Issued', String(f.receipt_at).slice(0,16).replace('T',' '))
        : '';
      receiptBody.innerHTML = `
        <div style="text-align:center;border-bottom:2px dashed #e2e8f0;padding-bottom:16px;margin-bottom:16px;">
          <div style="font-size:1.8rem;"><i class="fa-solid fa-school"></i></div>
          <div style="font-size:1.1rem;font-weight:700;">Smart School Management</div>
          <div style="font-size:0.75rem;color:#94a3b8;">Official Fee Receipt</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          ${receiptRow('Receipt No', f.id)}
          ${receiptRow('Date', formatDate(f.date))}
          ${receiptRow('Student Name', f.student)}
          ${receiptRow('Class', f.cls)}
          ${parentLine}
          ${receiptRow('Month', f.month)}
          ${receiptRow('Total Fee', displayFeeAmount(f.cls, f.amount))}
          ${receiptRow('Amount Paid', displayFeeAmount(f.cls, f.paid))}
          ${receiptRow('Balance Due', f.due > 0 ? formatMoney(f.due) : '—')}
          ${issuedLine}
        </div>
        <div style="text-align:center;padding:12px;background:${f.status==='Paid'?'#f0fdf4':'#fef3c7'};border-radius:8px;">
          <span class="badge ${feeStatusBadge(f.status)}" style="font-size:0.9rem;padding:6px 20px;">${f.status}</span>
        </div>`;
    };
    function receiptRow(k,v) { return `<div style="padding:8px;background:#f8fafc;border-radius:6px;"><div style="font-size:0.7rem;color:#94a3b8;">${k}</div><div style="font-weight:700;font-size:0.87rem;">${v}</div></div>`; }

    // ---- Fee Modal helpers ----
    const addFeeModal    = section.querySelector('#addFeeModal');
    const fpClassSel     = section.querySelector('#fp-class');
    const fpStudentInput = section.querySelector('#fp-student');
    const fpSuggestions  = section.querySelector('#fp-suggestions');
    const fpBalanceInfo  = section.querySelector('#fp-balance-info');
    const fpInfoTotal    = section.querySelector('#fp-info-total');
    const fpInfoPaid     = section.querySelector('#fp-info-paid');
    const fpInfoDue      = section.querySelector('#fp-info-due');
    const fpInfoLastWrap = section.querySelector('#fp-info-last-wrap');
    const fpInfoLast     = section.querySelector('#fp-info-last');
    const fpPaid         = section.querySelector('#fp-paid');
    const fpMonth        = section.querySelector('#fp-month');
    const fpDate         = section.querySelector('#fp-date');
    const fpUseToday     = section.querySelector('#fp-use-today');

    let fpStudentList = [];
    let fpSelectedStudentRecord = null;

    function getTodayStr() { return new Date().toISOString().slice(0, 10); }
    function getCurrentMonthStr() {
      return new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    }
    function getFeeStructureTotal(classNo) {
      if (typeof FEE_STRUCTURE !== 'undefined') {
        const rec = FEE_STRUCTURE.find(f => f.class === classNo);
        if (rec) return rec.total;
      }
      return 800;
    }

    function openFeeModal() {
      fpClassSel.value       = '';
      fpStudentInput.value   = '';
      fpStudentInput.placeholder = 'Select class first…';
      fpStudentInput.style.cursor = 'default';
      closeStudentDropdown();
      fpBalanceInfo.style.display = 'none';
        setFeeInputsDisabled(false);
      fpPaid.value           = '';
      fpMonth.value          = getCurrentMonthStr();
      fpDate.value           = getTodayStr();
      fpDate.disabled        = true;
      fpUseToday.checked     = true;
      fpStudentList          = [];
      fpSelectedStudentRecord = null;
      addFeeModal.classList.remove('hidden');
    }

    function closeFeeModal() { addFeeModal.classList.add('hidden'); }

    // "Use today's date" toggle
    fpUseToday.addEventListener('change', () => {
      if (fpUseToday.checked) { fpDate.value = getTodayStr(); fpDate.disabled = true; }
      else fpDate.disabled = false;
    });

    // Class change → fetch student list for autocomplete
    fpClassSel.addEventListener('change', async () => {
      fpStudentInput.value = '';
      closeStudentDropdown();
      fpBalanceInfo.style.display = 'none';
      setFeeInputsDisabled(false);
      fpStudentList = []; fpSelectedStudentRecord = null;
      const clsVal = fpClassSel.value;
      if (!clsVal) {
        fpStudentInput.placeholder = 'Select class first…';
        fpStudentInput.style.cursor = 'default';
        return;
      }
      fpStudentInput.placeholder = 'Loading students…';
      const [classNum, secVal] = clsVal.split('-');
      try {
        const res = await loadStudents({
          class: classNum,
          section: secVal || undefined,
          limit: 300,
          status: 'Active'
        });
        fpStudentList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (!fpStudentList.length && typeof getMockStudents === 'function') {
          fpStudentList = getMockStudents().filter((student) =>
            String(student.class || '') === String(classNum) &&
            (!secVal || String(student.section || '').toUpperCase() === String(secVal).toUpperCase()) &&
            String(student.status || '').toLowerCase() === 'active'
          );
        }
      } catch (_) { fpStudentList = []; }
      fpStudentInput.placeholder = fpStudentList.length ? `▼ ${fpStudentList.length} students — click to choose` : 'No students found';
      fpStudentInput.style.cursor = fpStudentList.length ? 'pointer' : 'default';
      if (fpStudentList.length) {
        openStudentDropdown();
      }
    });

    const fpStudentSearch = section.querySelector('#fp-student-search');
    const fpSuggList      = section.querySelector('#fp-sugg-list');
    const fpStudentArrow  = section.querySelector('#fp-student-arrow');
    let fpDropdownOpen = false;

    function renderSuggList(q) {
      const list = q
        ? fpStudentList.filter(s => s.name.toLowerCase().includes(q))
        : fpStudentList;
      if (!list.length) {
        fpSuggList.innerHTML = '<div style="padding:10px 14px;color:#94a3b8;font-size:0.8rem;">No students found</div>';
        return;
      }
      fpSuggList.innerHTML = list.map(s =>
        `<div class="fp-sugg-item" data-name="${s.name}" style="padding:9px 16px;cursor:pointer;font-size:0.83rem;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;transition:background .12s;">
          <span style="font-size:1rem;">👤</span>
          <span style="flex:1;font-weight:500;">${s.name}</span>
          <span style="color:#94a3b8;font-size:0.72rem;">${s.section ? 'Sec ' + s.section : ''}</span>
        </div>`
      ).join('');
      fpSuggList.querySelectorAll('.fp-sugg-item').forEach(el => {
        el.addEventListener('mousedown', e => { e.preventDefault(); selectFeeStudent(el.dataset.name); });
        el.addEventListener('mouseenter', () => el.style.background = '#f8fafc');
        el.addEventListener('mouseleave', () => el.style.background = '');
      });
    }

    function openStudentDropdown() {
      if (!fpStudentList.length) return;
      fpStudentSearch.value = '';
      renderSuggList('');
      fpSuggestions.style.display = 'block';
      fpStudentArrow.style.transform = 'translateY(-50%) rotate(180deg)';
      fpDropdownOpen = true;
      setTimeout(() => fpStudentSearch.focus(), 50);
    }

    function closeStudentDropdown() {
      fpSuggestions.style.display = 'none';
      fpStudentArrow.style.transform = 'translateY(-50%) rotate(0deg)';
      fpDropdownOpen = false;
    }

    // Click on field toggles dropdown
    fpStudentInput.addEventListener('click', () => {
      if (fpDropdownOpen) closeStudentDropdown();
      else openStudentDropdown();
    });

    // Filter as user types in the search box inside dropdown
    fpStudentSearch.addEventListener('input', () => {
      renderSuggList(fpStudentSearch.value.toLowerCase().trim());
    });

    // Close when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (fpDropdownOpen && !fpSuggestions.contains(e.target) && e.target !== fpStudentInput) {
        closeStudentDropdown();
      }
    });

    const saveFeeBtn     = section.querySelector('#saveFee');

    function setFeeInputsDisabled(disabled) {
      fpPaid.disabled    = disabled;
      fpMonth.disabled   = disabled;
      fpDate.disabled    = disabled || fpUseToday.checked;
      fpUseToday.disabled = disabled;
      saveFeeBtn.disabled = disabled;
      saveFeeBtn.style.opacity = disabled ? '0.45' : '';
    }

    function selectFeeStudent(name) {
      fpStudentInput.value = name;
      closeStudentDropdown();
      const clsVal  = fpClassSel.value;
      const classNo = parseInt((clsVal || '').split('-')[0]);
      const feeTotal = getFeeStructureTotal(classNo);

      // Check for fully-paid record first
      const paidRec = fees.find(f =>
        f.student.toLowerCase() === name.toLowerCase() &&
        parseClassNumber(f.cls) === classNo &&
        f.status === 'Paid'
      );
      if (paidRec) {
        const safePaidRec = getNormalizedFeeEntry(paidRec, feeTotal);
        fpSelectedStudentRecord = null;
        fpBalanceInfo.style.display = '';
        fpInfoTotal.textContent = '₹' + safePaidRec.amount;
        fpInfoPaid.textContent  = '₹' + safePaidRec.paid;
        fpInfoDue.textContent   = '₹0';
        fpInfoLast.textContent  = '₹' + safePaidRec.paid + (safePaidRec.date ? ' on ' + safePaidRec.date : '');
        fpInfoLastWrap.style.display = '';
        setFeeInputsDisabled(true);
        fpPaid.value = '';
        fpPaid.max = 0;
        return;
      }

      // Hide already-paid notice, re-enable inputs
      setFeeInputsDisabled(false);

      // Find existing Pending/Partial record for this student+class
      const existingRec = fees.find(f =>
        f.student.toLowerCase() === name.toLowerCase() &&
        parseClassNumber(f.cls) === classNo &&
        f.status !== 'Paid'
      );
      if (existingRec) {
        const safeExistingRec = getNormalizedFeeEntry(existingRec, feeTotal);
        fpSelectedStudentRecord = safeExistingRec;
        fpInfoTotal.textContent  = '₹' + safeExistingRec.amount;
        fpInfoPaid.textContent   = '₹' + safeExistingRec.paid;
        fpInfoDue.textContent    = '₹' + safeExistingRec.due;
        if (safeExistingRec.paid > 0) {
          fpInfoLast.textContent     = '₹' + safeExistingRec.paid + (safeExistingRec.date ? ' on ' + safeExistingRec.date : '');
          fpInfoLastWrap.style.display = '';
        } else {
          fpInfoLastWrap.style.display = 'none';
        }
        fpPaid.max = safeExistingRec.due;
      } else {
        fpSelectedStudentRecord = null;
        fpInfoTotal.textContent = '₹' + feeTotal;
        fpInfoPaid.textContent  = '₹0';
        fpInfoDue.textContent   = '₹' + feeTotal;
        fpInfoLastWrap.style.display = 'none';
        fpPaid.max = feeTotal;
      }
      fpBalanceInfo.style.display = '';
      fpPaid.focus();
    }

    // Toast helpers
    function showFeeToast(entry, paidNow) {
      const toast = document.getElementById('feePaymentToast');
      const msg   = document.getElementById('feeToastMsg');
      if (!toast) return;
      msg.textContent = `${entry.student} — ₹${paidNow} recorded · Status: ${entry.status}`;
      toast.style.opacity = '1';
      toast.style.display = 'block';
      document.getElementById('feeToastPrint').onclick    = () => printFeeReceipt(entry);
      document.getElementById('feeToastDownload').onclick = () => downloadFeeReceipt(entry);
      clearTimeout(window._feeToastTimer);
      window._feeToastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; toast.style.opacity = '1'; }, 550);
      }, 8000);
    }

    function buildReceiptHtml(f) {
      const parentRows = f.parent_name
        ? `<div class="row"><span class="lbl">Parent / Guardian</span><span class="val">${f.parent_name}</span></div>
<div class="row"><span class="lbl">Parent Phone</span><span class="val">${f.parent_phone || '—'}</span></div>`
        : '';
      const issuedRow = f.receipt_at
        ? `<div class="row"><span class="lbl">Receipt Issued</span><span class="val">${String(f.receipt_at).slice(0,16).replace('T',' ')}</span></div>`
        : '';
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fee Receipt — ${f.student}</title>
<style>*{box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:30px;max-width:420px;margin:0 auto;background:#fff;color:#1e293b;}
.header{text-align:center;border-bottom:2px dashed #e2e8f0;padding-bottom:16px;margin-bottom:18px;}
.school{font-size:1.25rem;font-weight:700;}.sub{font-size:0.75rem;color:#94a3b8;margin-top:2px;}
.row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:0.84rem;}
.lbl{color:#64748b;}.val{font-weight:700;}
.status-box{text-align:center;padding:10px;margin-top:18px;border-radius:8px;font-weight:700;font-size:1rem;
background:${f.status==='Paid'?'#dcfce7':'#fef3c7'};color:${f.status==='Paid'?'#065f46':'#92400e'};}
@media print{body{padding:10px;}}</style></head><body>
<div class="header"><div class="school">🏫 SmartSchool Management</div><div class="sub">Official Fee Receipt</div></div>
<div class="row"><span class="lbl">Receipt No</span><span class="val">${f.id}</span></div>
<div class="row"><span class="lbl">Student Name</span><span class="val">${f.student}</span></div>
<div class="row"><span class="lbl">Class</span><span class="val">${f.cls}</span></div>
${parentRows}
<div class="row"><span class="lbl">Month</span><span class="val">${f.month}</span></div>
<div class="row"><span class="lbl">Payment Date</span><span class="val">${f.date || '—'}</span></div>
<div class="row"><span class="lbl">Total Fee</span><span class="val">₹${f.amount}</span></div>
<div class="row"><span class="lbl">Amount Paid</span><span class="val">₹${f.paid}</span></div>
<div class="row"><span class="lbl">Balance Due</span><span class="val">₹${f.due}</span></div>
${issuedRow}
<div class="status-box">${f.status}</div>
</body></html>`;
    }

    async function printFeeReceipt(f) {
      const fresh = (f.parent_name !== undefined) ? f : (await apiFetchFeeReceipt(f.id) || f);
      const win = window.open('', '_blank', 'width=480,height=700');
      if (!win) return;
      win.document.write(buildReceiptHtml(fresh));
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    }

    async function downloadFeeReceipt(f) {
      const fresh = (f.parent_name !== undefined) ? f : (await apiFetchFeeReceipt(f.id) || f);
      const blob = new Blob([buildReceiptHtml(fresh)], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Receipt_${fresh.student.replace(/\s+/g,'_')}_${fresh.id}.html`;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    section.querySelector('#addFeeBtn').addEventListener('click', openFeeModal);
    section.querySelector('#closeAddFee').addEventListener('click', closeFeeModal);
    section.querySelector('#cancelAddFee').addEventListener('click', closeFeeModal);
    section.querySelector('#saveFee').addEventListener('click', async () => {
      const student   = fpStudentInput.value.trim();
      const clsVal    = fpClassSel.value.trim();
      const paidNow   = parseInt(fpPaid.value) || 0;
      const monthVal  = fpMonth.value.trim();
      const dateVal   = fpDate.value;

      if (!clsVal)    { alert('Please select a class.'); return; }
      if (!student)   { alert('Please enter or select a student name.'); return; }
      if (paidNow<= 0){ alert('Please enter the amount being paid.'); return; }

      const classNo  = parseInt(clsVal.split('-')[0]);
      const feeTotal = getFeeStructureTotal(classNo);
      const remainingDue = fpSelectedStudentRecord
        ? Math.max(parseInt(fpSelectedStudentRecord.due, 10) || 0, 0)
        : Math.max(feeTotal, 0);

      if (paidNow > remainingDue) {
        alert(`Payment cannot exceed balance due of ₹${remainingDue}.`);
        fpPaid.focus();
        return;
      }

      let savedEntry;
      if (fpSelectedStudentRecord) {
        // Update existing Pending/Partial record
        const rec     = fpSelectedStudentRecord;
        const newPaid = rec.paid + paidNow;
        const newDue  = Math.max(0, rec.amount - newPaid);
        const newStatus  = newDue === 0 ? 'Paid' : 'Partial';
        const updated    = { ...rec, paid: newPaid, due: newDue, status: newStatus, date: dateVal };
        const res = await apiUpdateFee(rec.id, updated);
        if (!res || res.error) { alert(res?.error || 'Failed to update fee. Please try again.'); return; }
        const idx = fees.findIndex(f => f.id === rec.id);
        if (idx !== -1) fees[idx] = updated;
        savedEntry = updated;
      } else {
        // Create new record
        const due    = feeTotal - paidNow;
        const status = due <= 0 ? 'Paid' : paidNow === 0 ? 'Pending' : 'Partial';
        const entry  = {
          id: 'FEE' + Date.now(),
          student, cls: clsVal,
          amount: feeTotal, paid: paidNow, due: Math.max(0, due),
          month: monthVal, date: dateVal, status
        };
        const res = await apiCreateFee(entry);
        if (!res || res.error) { alert(res?.error || 'Failed to save payment. Please try again.'); return; }
        if (res.id) entry.id = res.id;
        fees.unshift(entry);
        savedEntry = entry;
      }

      closeFeeModal();
      await applyFilters();
      showFeeToast(savedEntry, paidNow);
      refreshDashboardFeeStats();
      // Live-sync student section fee badge
      if (typeof window._refreshStudentFees === 'function') window._refreshStudentFees();
    });

    // Render individual fee structure cards
    (function buildFeeStructureCards() {
      const grid = section.querySelector('#feeStructureGrid');
      if (!grid || typeof FEE_STRUCTURE === 'undefined') return;
      grid.innerHTML = FEE_STRUCTURE.map(f => {
        const totalText = formatMoney(f.total);
        const tuitionText = formatMoney(f.tuition);
        const sportsText = formatMoney(f.sports);
        const miscText = formatMoney(f.misc);
        const labText = formatMoney(f.lab);
        const labRow = f.lab > 0 ? `<div class="fee-row"><span>Lab Fee</span><span>${labText}</span></div>` : '';
        return `
        <div class="fee-card class-${f.class}">
          <div class="fee-card-header">
            <span class="fee-card-icon"><i class="fa-solid fa-graduation-cap"></i></span>
            Class ${f.class}
          </div>
          <div class="fee-card-total">${totalText}</div>
          <div class="fee-card-details">
            <div class="fee-row"><span>Tuition Fee</span><span>${tuitionText}</span></div>
            ${labRow}
            <div class="fee-row"><span>Sports Fee</span><span>${sportsText}</span></div>
            <div class="fee-row"><span>Miscellaneous</span><span>${miscText}</span></div>
          </div>
        </div>`;
      }).join('');
    })();

    updateStats();
    await applyFilters();
  }

  /* ---------- NOTICES ---------- */
  async function initNoticesSection() {
    const section = sections.notices;
    let notices = await loadNotices();
    let activeTab    = 'All';
    let searchFilter = '';
    let urgentFilter = '';
    let editNoticeId = null;

    function getFiltered() {
      return notices.filter(n =>
        (activeTab === 'All' || n.target === activeTab) &&
        (!searchFilter || n.title.toLowerCase().includes(searchFilter) || n.body.toLowerCase().includes(searchFilter)) &&
        (urgentFilter === '' || String(n.urgent) === urgentFilter)
      );
    }

    function updateStats() {
      const total = notices.length;
      const urgent = notices.filter(n => n.urgent).length;
      const general = notices.filter(n => !n.urgent).length;
      const allRoles = notices.filter(n => n.target === 'All').length;
      section.querySelector('#n-total').dataset.rollTarget   = total;
      section.querySelector('#n-urgent').dataset.rollTarget  = urgent;
      section.querySelector('#n-general').dataset.rollTarget = general;
      section.querySelector('#n-all').dataset.rollTarget     = allRoles;
      initRollingCounters(section);
      window.NOTICES = notices;
      refreshNotificationBadges();
    }

    function renderNotices() {
      const list = getFiltered();
      const el   = section.querySelector('#noticesList');
      if (!list.length) {
        el.innerHTML = `<div style="text-align:center;padding:50px;color:#94a3b8;">No notices found.</div>`;
        return;
      }
      el.innerHTML = list.map(n => `
        <div class="notice-card ${n.urgent ? 'urgent' : 'general'}">
          <div class="notice-meta">
            <span class="badge ${n.urgent ? 'badge-danger' : 'badge-info'}">${n.urgent ? '🚨 Urgent' : '📢 Info'}</span>
            <span class="badge badge-purple">${n.target}</span>
            <span>📅 ${formatDate(n.date)}</span>
            <span>👤 ${n.author}</span>
            <div style="margin-left:auto;display:flex;gap:6px;">
              <button class="btn btn-primary btn-sm btn-icon" title="Edit" onclick="editNotice('${n.id}')">✏️</button>
              <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteNotice('${n.id}')">🗑️</button>
            </div>
          </div>
          <div class="notice-title">${n.title}</div>
          <div class="notice-body">${n.body}</div>
        </div>`).join('');
    }

    section.querySelectorAll('.notice-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        section.querySelectorAll('.notice-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.target;
        renderNotices();
      });
    });
    section.querySelector('#noticeSearch').addEventListener('input', function() {
      searchFilter = this.value.toLowerCase(); renderNotices();
    });
    section.querySelector('#urgentFilter').addEventListener('change', function() {
      urgentFilter = this.value; renderNotices();
    });

    window.deleteNotice = async (id) => {
      if (!confirm('Delete this notice?')) return;
      await apiDeleteNotice(id);
      notices = notices.filter(n => n.id !== id);
      renderNotices(); updateStats();
    };

    window.editNotice = (id) => {
      const n = notices.find(n => n.id === id);
      if (!n) return;
      editNoticeId = id;
      section.querySelector('#noticeModalTitle').textContent = 'Edit Notice';
      section.querySelector('#n-title').value  = n.title;
      section.querySelector('#n-body').value   = n.body;
      section.querySelector('#n-target').value = n.target;
      section.querySelector('#n-urgent').value = String(n.urgent);
      section.querySelector('#noticeModal').classList.remove('hidden');
    };

    section.querySelector('#addNoticeBtn').addEventListener('click', () => {
      editNoticeId = null;
      section.querySelector('#noticeModalTitle').textContent = 'Post New Notice';
      ['n-title','n-body'].forEach(id => section.querySelector('#' + id).value = '');
      section.querySelector('#n-target').value = 'All';
      section.querySelector('#n-urgent').value = 'false';
      section.querySelector('#noticeModal').classList.remove('hidden');
    });
    section.querySelector('#closeNoticeModal').addEventListener('click', () => section.querySelector('#noticeModal').classList.add('hidden'));
    section.querySelector('#cancelNoticeModal').addEventListener('click', () => section.querySelector('#noticeModal').classList.add('hidden'));

    section.querySelector('#saveNotice').addEventListener('click', async () => {
      const title = section.querySelector('#n-title').value.trim();
      const body  = section.querySelector('#n-body').value.trim();
      if (!title || !body) { alert('Title and body are required.'); return; }
      const entry = {
        id: editNoticeId || 'NOT' + Date.now(),
        title, body,
        target: section.querySelector('#n-target').value,
        urgent: section.querySelector('#n-urgent').value === 'true',
        date: new Date().toISOString().split('T')[0],
        author: 'Admin'
      };
      if (editNoticeId) {
        await apiUpdateNotice(editNoticeId, entry);
        const idx = notices.findIndex(n => n.id === editNoticeId);
        if (idx > -1) notices[idx] = entry;
      } else {
        const res = await apiCreateNotice(entry);
        if (res && res.id) entry.id = res.id;
        notices.unshift(entry);
      }
      section.querySelector('#noticeModal').classList.add('hidden');
      editNoticeId = null;
      renderNotices(); updateStats();
    });

    updateStats(); renderNotices();
  }

  /* ---------- VISITOR INQUIRIES ---------- */
  async function initVisitorInquiriesSection() {
    const section = sections.visitorInquiries;
    if (!section) return;

    let payload = await loadVisitorInquiries();
    let inquiries = Array.isArray(payload?.inquiries) ? payload.inquiries : [];
    let searchFilter = '';
    let statusFilter = 'all';
    let typeFilter = 'all';
    let selectedInquiry = null;

    function escapeHtml(value = '') {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function notify(message, type = 'info') {
      if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
      }
      alert(message);
    }

    function formatInquiryTime(value) {
      if (!value) return '—';
      const dt = new Date(String(value).replace(' ', 'T'));
      if (Number.isNaN(dt.getTime())) return String(value);
      return dt.toLocaleString();
    }

    function refreshBadge() {
      const newCount = inquiries.filter((item) => String(item.status || 'new') === 'new').length;
      updateVisitorInquiryBadge(newCount);
    }

    function getFiltered() {
      const q = searchFilter.trim().toLowerCase();
      return inquiries.filter((item) => {
        const status = String(item.status || 'new').toLowerCase();
        const type = String(item.inquiry_type || '').trim();
        const haystack = [
          item.full_name,
          item.email,
          item.phone,
          item.inquiry_type,
          item.message,
          item.status
        ].join(' ').toLowerCase();
        return (
          (!q || haystack.includes(q)) &&
          (statusFilter === 'all' || status === statusFilter) &&
          (typeFilter === 'all' || type === typeFilter)
        );
      });
    }

    function renderStats() {
      const total = inquiries.length;
      const newCount = inquiries.filter((item) => String(item.status || 'new') === 'new').length;
      const responded = inquiries.filter((item) => String(item.status || '').toLowerCase() === 'responded').length;
      const open = Math.max(0, total - responded);

      section.querySelector('#vi-total').dataset.rollTarget = total;
      section.querySelector('#vi-new').dataset.rollTarget = newCount;
      section.querySelector('#vi-responded').dataset.rollTarget = responded;
      section.querySelector('#vi-open').dataset.rollTarget = open;
      initRollingCounters(section);
      refreshBadge();
    }

    function openModal(inquiry) {
      if (!inquiry) return;
      selectedInquiry = inquiry;
      section.querySelector('#viDetailName').textContent = inquiry.full_name || '—';
      section.querySelector('#viDetailEmail').textContent = inquiry.email || '—';
      section.querySelector('#viDetailPhone').textContent = inquiry.phone || '—';
      section.querySelector('#viDetailType').textContent = inquiry.inquiry_type || '—';
      section.querySelector('#viDetailCreated').textContent = formatInquiryTime(inquiry.created_at);
      section.querySelector('#viDetailMessage').textContent = inquiry.message || '—';
      section.querySelector('#viResponseText').value = inquiry.response || '';
      section.querySelector('#visitorInquiryModal').classList.remove('hidden');
    }

    window.openVisitorInquiry = (id) => {
      const inquiry = inquiries.find((item) => String(item.id) === String(id));
      openModal(inquiry);
    };

    function renderTable() {
      const rows = getFiltered();
      const tbody = section.querySelector('#visitorInquiriesTable');
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:28px;color:#94a3b8;">No inquiries found.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map((item) => {
        const status = String(item.status || 'new').toLowerCase();
        const statusClass = status === 'responded' ? 'badge-success' : 'badge-warning';
        const statusText = status === 'responded' ? 'Responded' : 'New';
        const preview = String(item.message || '').slice(0, 84);
        const actionLabel = status === 'responded' ? 'View' : 'Respond';
        return `
          <tr>
            <td>
              <div style="font-weight:700;color:#0f172a;">${escapeHtml(item.full_name || '—')}</div>
              <div style="font-size:0.72rem;color:#94a3b8;">Inquiry #${escapeHtml(item.id)}</div>
            </td>
            <td>
              <div>${escapeHtml(item.email || '—')}</div>
              <div style="font-size:0.78rem;color:#64748b;">${escapeHtml(item.phone || '—')}</div>
            </td>
            <td><span class="badge badge-info">${escapeHtml(item.inquiry_type || '—')}</span></td>
            <td style="max-width:280px;color:#475569;font-size:0.82rem;line-height:1.45;">${escapeHtml(preview)}${item.message && item.message.length > 84 ? '…' : ''}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td style="font-size:0.82rem;color:#64748b;">${escapeHtml(formatInquiryTime(item.created_at))}</td>
            <td>
              <button class="btn btn-primary btn-sm" type="button" onclick="openVisitorInquiry('${String(item.id).replace(/'/g, '&#39;')}')">${actionLabel}</button>
            </td>
          </tr>`;
      }).join('');
    }

    async function reloadInquiries() {
      payload = await loadVisitorInquiries();
      inquiries = Array.isArray(payload?.inquiries) ? payload.inquiries : [];
      renderStats();
      renderTable();
    }

    section.querySelector('#viSearch').addEventListener('input', function() {
      searchFilter = this.value || '';
      renderTable();
    });
    section.querySelector('#viStatusFilter').addEventListener('change', function() {
      statusFilter = this.value || 'all';
      renderTable();
    });
    section.querySelector('#viTypeFilter').addEventListener('change', function() {
      typeFilter = this.value || 'all';
      renderTable();
    });
    section.querySelector('#refreshVisitorInquiriesBtn').addEventListener('click', reloadInquiries);
    section.querySelector('#closeVisitorInquiryModal').addEventListener('click', () => {
      section.querySelector('#visitorInquiryModal').classList.add('hidden');
      selectedInquiry = null;
    });
    section.querySelector('#cancelVisitorInquiryModal').addEventListener('click', () => {
      section.querySelector('#visitorInquiryModal').classList.add('hidden');
      selectedInquiry = null;
    });
    section.querySelector('#visitorInquiryModal').addEventListener('click', (e) => {
      if (e.target && e.target.id === 'visitorInquiryModal') {
        section.querySelector('#visitorInquiryModal').classList.add('hidden');
        selectedInquiry = null;
      }
    });
    section.querySelector('#sendVisitorInquiryResponse').addEventListener('click', async () => {
      if (!selectedInquiry) return;
      const responseText = section.querySelector('#viResponseText').value.trim();
      if (!responseText) {
        notify('Please write a response first.', 'error');
        return;
      }
      const result = await apiRespondVisitorInquiry(selectedInquiry.id, responseText);
      if (result && result.error) {
        notify(result.error, 'error');
        return;
      }
      const idx = inquiries.findIndex((item) => String(item.id) === String(selectedInquiry.id));
      if (idx > -1) {
        inquiries[idx] = {
          ...inquiries[idx],
          status: 'responded',
          response: responseText,
          responded_at: new Date().toISOString()
        };
      }
      section.querySelector('#visitorInquiryModal').classList.add('hidden');
      selectedInquiry = null;
      renderStats();
      renderTable();
      notify('Inquiry response sent successfully.', 'success');
    });

    renderStats();
    renderTable();
  }

  // Init all sections once (async sections run concurrently)
  Promise.all([
    initDashboardSection(),
    initStudentsSection(),
    initTeachersSection(),
    initAttendanceSection(),
    initExamsSection(),
    initFeesSection(),
    initNoticesSection(),
    initVisitorInquiriesSection(),
  ]).catch(err => console.error('Section init error:', err));
  initTimetableSection();
  initSettingsSection();

  const initialSection = (() => {
    const saved = localStorage.getItem(ACTIVE_SECTION_KEY);
    return saved && sections[saved] ? saved : 'dashboard';
  })();
  showSection(initialSection, { skipPersist: true });

  /* ---------- TIMETABLE ---------- */
  function initTimetableSection() {
    const scope = sections.timetable;
    if (!scope) return;

    const stdSel   = scope.querySelector('#ttStdSelect');
    const secSel   = scope.querySelector('#ttSecSelect');
    const teacherSel = scope.querySelector('#ttTeacherSelect');
    const badgeStd = scope.querySelector('#ttBadgeStd');
    const badgeSec = scope.querySelector('#ttBadgeSec');
    const badgeTeacher = scope.querySelector('#ttBadgeTeacher');
    const legendEl = scope.querySelector('#ttLegend');
    const thead    = scope.querySelector('#ttHead');
    const tbody    = scope.querySelector('#ttBody');
    const printBtn = scope.querySelector('#ttPrintBtn');
    const exportBtn= scope.querySelector('#ttExportBtn');
    const changeBtn = scope.querySelector('#ttChangeBtn');
    const changeMenu = scope.querySelector('#ttChangeMenu');
    const viewClassBtn = scope.querySelector('#ttViewClassBtn');
    const viewTeacherBtn = scope.querySelector('#ttViewTeacherBtn');
    const classFilters = scope.querySelector('#ttClassFilters');
    const teacherFilters = scope.querySelector('#ttTeacherFilters');
    const uploadBtn = scope.querySelector('#ttUploadBtn');
    const editModeBtn = scope.querySelector('#ttEditModeBtn');
    const uploadModal = scope.querySelector('#ttUploadModal');
    const uploadClose = scope.querySelector('#ttUploadClose');
    const uploadCancel = scope.querySelector('#ttUploadCancel');
    const uploadSave = scope.querySelector('#ttUploadSave');
    const uploadStd = scope.querySelector('#ttUploadStd');
    const uploadSec = scope.querySelector('#ttUploadSec');
    const uploadFile = scope.querySelector('#ttUploadFile');
    const downloadLayoutBtn = scope.querySelector('#ttDownloadLayoutBtn');
    const uploadMsg = scope.querySelector('#ttUploadMsg');

    // Edit mode elements
    const editBanner = scope.querySelector('#ttEditBanner');
    const editSaveAll = scope.querySelector('#ttEditSaveAll');
    const editCancelBtn = scope.querySelector('#ttEditCancel');
    const cellPopup = document.querySelector('#ttCellPopup');
    const popupTitle = document.querySelector('#ttPopupTitle');
    const popupSubject = document.querySelector('#ttPopupSubject');
    const popupTeacher = document.querySelector('#ttPopupTeacher');
    const popupSave = document.querySelector('#ttPopupSave');
    const popupCancel = document.querySelector('#ttPopupCancel');
    const popupTeacherAuto = document.querySelector('#ttPopupTeacherAuto');
    const popupTeacherName = document.querySelector('#ttPopupTeacherName');
    const popupOverrideBtn = document.querySelector('#ttPopupOverrideBtn');
    const popupConflict = document.querySelector('#ttPopupConflict');
    const popupConflictMsg = document.querySelector('#ttPopupConflictMsg');

    let currentSchedule = {};
    let currentDays = Array.isArray(TT_DAYS) ? TT_DAYS : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let currentSlotsWeekday = Array.isArray(TT_SLOTS_WEEKDAY) ? TT_SLOTS_WEEKDAY : [];
    let currentSlotsSaturday = Array.isArray(TT_SLOTS_SATURDAY) ? TT_SLOTS_SATURDAY : [];
    let currentSubjectColors = typeof SUBJECT_COLORS !== 'undefined' ? SUBJECT_COLORS : {};
    let currentSubjectPool = [];
    let viewMode = 'class';
    let teacherList = [];

    // Edit mode state
    let editMode = false;
    let pendingChanges = {}; // key: "day|num" -> { subject, teacher, overrideLecture1 }
    let editingCell = null;  // { day, num }

    async function loadTeacherList() {
      if (!teacherSel) return;
      try {
        const res = await api.get('/timetable/teachers');
        const list = Array.isArray(res?.data) ? res.data : [];
        if (list.length === 0) {
          teacherList = [];
          teacherSel.innerHTML = '<option value="">No timetable teachers available</option>';
          return;
        }
        const nameSet = new Set(list.map((name) => String(name || '').trim()).filter(Boolean));
        teacherList = list.map((name) => ({ name }));
        teacherSel.innerHTML = '<option value="">Select teacher</option>';
        list.forEach((name) => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          teacherSel.appendChild(opt);
        });

        try {
          const detailRes = await api.get('/teachers?limit=200');
          const detailList = detailRes?.data || [];
          if (Array.isArray(detailList) && detailList.length) {
            teacherList = detailList.filter((t) => nameSet.has(String(t?.name || '').trim()));
          }
        } catch (_) {
          // Keep name-only list if detailed data is unavailable.
        }
      } catch (_) {
        teacherList = [];
        teacherSel.innerHTML = '<option value="">Unable to load timetable teachers</option>';
      }

      if (!teacherSel.value && teacherSel.options.length > 1) {
        teacherSel.selectedIndex = 1;
      }
    }

    function normalizeTeacherName(value) {
      return String(value || '').trim().toLowerCase();
    }

    function normalizeSection(value) {
      return String(value || '').trim().toUpperCase();
    }

    function getClassTeacherName(std, section) {
      const classNumber = String(std || '').trim();
      const division = normalizeSection(section || '');
      if (!classNumber || !division) return '';

      const exact = teacherList.find((t) =>
        String(t?.class || '').trim() === classNumber &&
        normalizeSection(t?.division || '') === division
      );
      if (exact?.name) return exact.name;

      const compact = teacherList.find((t) =>
        String(t?.class || '').trim().toUpperCase() === `${classNumber}${division}`
      );
      return compact?.name || '';
    }

    function getTeacherSubject(name) {
      const teacher = teacherList.find((t) => String(t?.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase());
      return teacher?.subject || '';
    }

    function buildTeacherScheduleSkeleton() {
      const schedule = {};
      currentDays.forEach((day) => {
        const slots = day === 'Saturday' ? currentSlotsSaturday : currentSlotsWeekday;
        schedule[day] = (slots || []).map((slot) => ({ ...slot, entries: [] }));
      });
      return schedule;
    }

    async function buildTeacherScheduleFromClasses(teacherName) {
      const schedule = buildTeacherScheduleSkeleton();
      const teacherKey = normalizeTeacherName(teacherName);
      const classSet = new Set();
      let lectureCount = 0;

      const standards = [1, 2, 3, 4, 5, 6];
      const sections = ['A', 'B', 'C'];
      const targets = standards.flatMap((std) => sections.map((section) => ({ std, section })));

      const results = await Promise.all(targets.map(async ({ std, section }) => {
        try {
          const payload = await loadTimetable(std, section);
          return { std, section, schedule: payload?.schedule || {} };
        } catch {
          return { std, section, schedule: {} };
        }
      }));

      results.forEach(({ std, section, schedule: classSchedule }) => {
        const classLabel = `${std}${section}`;
        currentDays.forEach((day) => {
          const slots = Array.isArray(classSchedule?.[day]) ? classSchedule[day] : [];
          const targetSlots = schedule[day] || [];
          slots.forEach((slot) => {
            if (!slot?.subject || !slot?.teacher) return;
            if (normalizeTeacherName(slot.teacher) !== teacherKey) return;
            const target = targetSlots.find((entry) => entry.num === slot.num);
            if (!target) return;
            if (Array.isArray(target.entries) && target.entries.length > 0) {
              target.hasConflict = true;
              return;
            }
            target.entries.push({
              subject: slot.subject,
              teacher: slot.teacher,
              classLabel,
              std,
              section
            });
            classSet.add(classLabel);
            lectureCount += 1;
          });
        });
      });

      return {
        schedule,
        lectureCount,
        matchedClasses: Array.from(classSet)
      };
    }

    async function setViewMode(mode) {
      viewMode = mode === 'teacher' ? 'teacher' : 'class';
      if (viewClassBtn) viewClassBtn.classList.toggle('btn-primary', viewMode === 'class');
      if (viewClassBtn) viewClassBtn.classList.toggle('btn-ghost', viewMode !== 'class');
      if (viewTeacherBtn) viewTeacherBtn.classList.toggle('btn-primary', viewMode === 'teacher');
      if (viewTeacherBtn) viewTeacherBtn.classList.toggle('btn-ghost', viewMode !== 'teacher');
      if (classFilters) classFilters.style.display = viewMode === 'class' ? 'flex' : 'none';
      if (teacherFilters) teacherFilters.style.display = viewMode === 'teacher' ? 'flex' : 'none';
      if (badgeTeacher) badgeTeacher.style.display = viewMode === 'teacher' ? 'inline-flex' : 'none';
      if (badgeStd) badgeStd.style.display = viewMode === 'class' ? 'inline-flex' : 'none';
      if (badgeSec) badgeSec.style.display = viewMode === 'class' ? 'inline-flex' : 'none';
      if (changeBtn) changeBtn.disabled = viewMode === 'teacher';
      if (changeBtn) changeBtn.style.opacity = viewMode === 'teacher' ? '0.6' : '1';
      if (editMode && viewMode === 'teacher') exitEditMode();
      if (viewMode === 'teacher') {
        await loadTeacherList();
      }
      render();
    }

    if (viewClassBtn) viewClassBtn.addEventListener('click', () => setViewMode('class'));
    if (viewTeacherBtn) viewTeacherBtn.addEventListener('click', () => setViewMode('teacher'));

    /* ---------- Change Timetable dropdown ---------- */
    if (changeBtn) changeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      changeMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      if (changeMenu && !changeMenu.classList.contains('hidden')) changeMenu.classList.add('hidden');
    });

    /* ---------- Edit Mode ---------- */
    function enterEditMode() {
      editMode = true;
      pendingChanges = {};
      if (editBanner) { editBanner.classList.remove('hidden'); editBanner.style.display = 'flex'; }
      if (changeMenu) changeMenu.classList.add('hidden');
      render();
    }

    function exitEditMode() {
      editMode = false;
      pendingChanges = {};
      editingCell = null;
      if (editBanner) { editBanner.classList.add('hidden'); editBanner.style.display = 'none'; }
      closeCellPopup();
      render();
    }

    if (editModeBtn) editModeBtn.addEventListener('click', enterEditMode);
    if (editCancelBtn) editCancelBtn.addEventListener('click', exitEditMode);

    if (editSaveAll) editSaveAll.addEventListener('click', async () => {
      const keys = Object.keys(pendingChanges);
      if (!keys.length) { exitEditMode(); return; }

      const std = parseInt(stdSel.value, 10);
      const sec = secSel.value;
      const changes = keys.map(k => {
        const [day, num] = k.split('|');
        return {
          day,
          lecture_num: parseInt(num, 10),
          subject: pendingChanges[k].subject,
          teacher: pendingChanges[k].teacher,
          overrideLecture1: Boolean(pendingChanges[k].overrideLecture1)
        };
      });

      editSaveAll.disabled = true;
      editSaveAll.textContent = 'Saving...';
      const result = await saveTimetableBulkCells({ std, section: sec, changes });
      editSaveAll.disabled = false;
      editSaveAll.textContent = '💾 Save All Changes';

      if (result && result.success) {
        exitEditMode();
        await render();
      } else {
        alert(result?.error || 'Failed to save changes.');
      }
    });

    /* ---------- Cell popup ---------- */
    // Cache for API-loaded subjects/teachers to avoid redundant requests
    let cachedSubjects = {}; // key: standard → [{id, name}]
    let cachedTeachers = {}; // key: "subjectId|standard" → [{id, name}]

    async function fetchSubjectsForStd(standard) {
      if (cachedSubjects[standard]) return cachedSubjects[standard];
      try {
        const data = await api.get(`/timetable/subjects?standard=${standard}`);
        cachedSubjects[standard] = Array.isArray(data) ? data : [];
      } catch (_) {
        cachedSubjects[standard] = [];
      }
      return cachedSubjects[standard];
    }

    function getLectureOneSubjects(subjects) {
      const allowed = new Set(['Mathematics', 'Gujarati', 'Hindi', 'Sanskrit', 'Science', 'Moral Science', 'Social Science']);
      return (Array.isArray(subjects) ? subjects : []).filter((subject) => allowed.has(String(subject?.name || '').trim()));
    }

    async function fetchTeachersForSubject(subjectId, standard) {
      const key = `${subjectId}|${standard}`;
      if (cachedTeachers[key]) return cachedTeachers[key];
      try {
        const data = await api.get(`/timetable/teachers-for-subject?subject_id=${subjectId}&standard=${standard}`);
        cachedTeachers[key] = Array.isArray(data) ? data : [];
      } catch (_) {
        cachedTeachers[key] = [];
      }
      return cachedTeachers[key];
    }

    let teacherOverrideMode = false;

    function showAutoTeacher(name) {
      teacherOverrideMode = false;
      popupTeacherName.textContent = name || '—';
      popupTeacherAuto.style.display = 'flex';
      popupTeacher.style.display = 'none';
      if (popupOverrideBtn) popupOverrideBtn.style.display = name ? 'inline' : 'none';
      // Set hidden value on the select so save can read it
      popupTeacher.innerHTML = `<option value="${name}" selected>${name}</option>`;
    }

    function showTeacherDropdown() {
      teacherOverrideMode = true;
      popupTeacherAuto.style.display = 'none';
      popupTeacher.style.display = 'block';
      if (popupOverrideBtn) popupOverrideBtn.style.display = 'none';
    }

    function teacherNameMatchesSubject(teacherName, subjectName) {
      const normalizedTeacher = String(teacherName || '').trim().toLowerCase();
      const normalizedSubject = String(subjectName || '').trim().toLowerCase();
      if (!normalizedTeacher || !normalizedSubject) return false;

      const teacherRecord = Array.isArray(teachers)
        ? teachers.find((teacher) => String(teacher?.name || '').trim().toLowerCase() === normalizedTeacher)
        : null;

      if (teacherRecord?.subject) {
        return String(teacherRecord.subject).trim().toLowerCase() === normalizedSubject;
      }

      return normalizedTeacher.includes(normalizedSubject);
    }

    async function syncTeacherDropdownForSubject(subjectName, standard, currentTeacher = '') {
      const subject = String(subjectName || '').trim();
      const std = parseInt(standard, 10);
      let matchedTeachers = [];
      const selectedOption = popupSubject && popupSubject.options
        ? Array.from(popupSubject.options).find((option) => String(option.textContent || '').trim() === subject || String(option.value || '').trim() === subject)
        : null;
      const subjectId = selectedOption?.dataset?.id ? parseInt(selectedOption.dataset.id, 10) : null;

      if (Number.isInteger(std) && Number.isInteger(subjectId)) {
        try {
          const data = await fetchTeachersForSubject(subjectId, std);
          if (Array.isArray(data) && data.length) {
            matchedTeachers = data.map((teacher) => ({ name: teacher.name }));
          }
        } catch (_) {
          matchedTeachers = [];
        }
      }

      if (!matchedTeachers.length) {
        popupTeacher.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'No timetable teachers found for this subject';
        popupTeacher.appendChild(placeholder);
        popupTeacher.value = '';
        popupTeacher.style.display = 'block';
        popupTeacherAuto.style.display = 'none';
        if (popupOverrideBtn) popupOverrideBtn.style.display = 'none';
        hideConflictWarning();
        return '';
      }

      popupTeacher.innerHTML = '';

      if (matchedTeachers.length > 0) {
        matchedTeachers.forEach((teacher) => {
          const option = document.createElement('option');
          option.value = teacher.name;
          option.textContent = teacher.name;
          if (teacher.name === currentTeacher) option.selected = true;
          popupTeacher.appendChild(option);
        });

        const selectedName = currentTeacher && matchedTeachers.some((teacher) => teacher.name === currentTeacher)
          ? currentTeacher
          : matchedTeachers[0].name;

        popupTeacher.value = selectedName;
        popupTeacher.style.display = 'block';
        popupTeacherAuto.style.display = 'none';
        if (popupOverrideBtn) popupOverrideBtn.style.display = 'none';
        hideConflictWarning();
        return selectedName;
      }
    }

    // Override button → show full dropdown
    if (popupOverrideBtn) popupOverrideBtn.addEventListener('click', () => showTeacherDropdown());

    // When subject dropdown changes → auto-fill teacher
    popupSubject.addEventListener('change', async () => {
      const selectedOpt = popupSubject.options[popupSubject.selectedIndex];
      const subjectName = selectedOpt ? selectedOpt.textContent : '';
      const selectedTeacher = await syncTeacherDropdownForSubject(subjectName, stdSel.value, '');
      if (selectedTeacher && editingCell) {
        const result = await checkTeacherConflict(selectedTeacher, editingCell.day, editingCell.num);
        if (result && result.conflict) showConflictWarning(result.message);
      }
    });

    async function openCellPopup(day, num, cellEl) {
      editingCell = { day, num };
      const key = `${day}|${num}`;
      const current = pendingChanges[key] || getCellData(day, num);
      const std = parseInt(stdSel.value, 10);
      const sec = secSel.value;

      if (num === 1 && !current.teacher) {
        const classTeacherName = getClassTeacherName(std, sec);
        if (classTeacherName) {
          current.teacher = classTeacherName;
          if (!current.subject) {
            current.subject = getTeacherSubject(classTeacherName);
          }
        }
      }

      popupTitle.textContent = `${day} — Lecture ${num}`;
      popupSubject.innerHTML = '<option value="">Loading subjects...</option>';
      popupTeacherName.textContent = current.teacher || 'No teacher assigned';
      popupTeacherAuto.style.display = 'flex';
      popupTeacher.style.display = 'none';
      popupTeacherAuto.style.background = current.teacher ? '#f0fdf4' : '#fef2f2';
      popupTeacherAuto.style.borderColor = current.teacher ? '#86efac' : '#fca5a5';
      popupTeacherName.style.color = current.teacher ? '#166534' : '#991b1b';
      popupTeacher.innerHTML = `<option value="${current.teacher || ''}" selected>${current.teacher || 'No teacher assigned'}</option>`;

      const rect = cellEl.getBoundingClientRect();
      cellPopup.style.top = Math.min(rect.bottom + 6, window.innerHeight - 260) + 'px';
      cellPopup.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
      cellPopup.classList.remove('hidden');
      cellPopup.style.display = 'block';

      // Load subjects from API
      let subjects = [];
      try {
        subjects = await fetchSubjectsForStd(std);
      } catch (_) {
        subjects = [];
      }
      if (num === 1) {
        subjects = getLectureOneSubjects(subjects);
      }
      popupSubject.innerHTML = subjects.length
        ? subjects.map(s => `<option value="${s.name}" data-id="${s.id}" ${s.name === current.subject ? 'selected' : ''}>${s.name}</option>`).join('')
        : '<option value="">No subjects available</option>';

      // Populate teacher list for the currently selected subject
      const selSubject = subjects.find(s => s.name === current.subject) || subjects[0];
      if (selSubject) {
        const selectedTeacher = await syncTeacherDropdownForSubject(selSubject.name, std, current.teacher || '');
        if (selectedTeacher && editingCell) {
          const result = await checkTeacherConflict(selectedTeacher, editingCell.day, editingCell.num);
          if (result && result.conflict) showConflictWarning(result.message);
        }
      } else {
        popupTeacher.innerHTML = '<option value="">No subjects available</option>';
        popupTeacher.style.display = 'block';
        popupTeacherAuto.style.display = 'none';
        popupTeacherName.textContent = 'No subjects available';
      }
    }

    function closeCellPopup() {
      if (cellPopup) { cellPopup.classList.add('hidden'); cellPopup.style.display = 'none'; }
      hideConflictWarning();
      editingCell = null;
    }

    if (popupCancel) popupCancel.addEventListener('click', closeCellPopup);

    async function checkTeacherConflict(teacher, day, num) {
      if (!teacher || !day || !num) return null;
      const std = parseInt(stdSel.value, 10);
      const sec = secSel.value;
      try {
        const data = await api.get(`/timetable/check-conflict?teacher=${encodeURIComponent(teacher)}&day=${encodeURIComponent(day)}&lecture_num=${num}&exclude_std=${std}&exclude_section=${sec}`);
        return data;
      } catch (_) { return null; }
    }

    function showConflictWarning(msg) {
      if (popupConflict) { popupConflict.style.display = 'block'; popupConflictMsg.textContent = msg; }
    }
    function hideConflictWarning() {
      if (popupConflict) popupConflict.style.display = 'none';
    }

    // Check conflict when teacher dropdown changes in override mode
    popupTeacher.addEventListener('change', async () => {
      if (!editingCell) return;
      hideConflictWarning();
      const result = await checkTeacherConflict(popupTeacher.value, editingCell.day, editingCell.num);
      if (result && result.conflict) showConflictWarning(result.message);
    });

    if (popupSave) popupSave.addEventListener('click', async () => {
      if (!editingCell) return;
      const subject = popupSubject.value;
      const teacher = popupTeacher.value;
      if (!subject || !teacher) { alert('Please select both subject and teacher.'); return; }

      const std = parseInt(stdSel.value, 10);
      const sec = secSel.value;
      const classTeacherName = editingCell.num === 1 ? getClassTeacherName(std, sec) : '';
      let overrideLecture1 = false;
      if (editingCell.num === 1 && classTeacherName && classTeacherName !== teacher) {
        const ok = confirm(`Lecture 1 should be class teacher (${classTeacherName}). Override?`);
        if (!ok) return;
        overrideLecture1 = true;
      }

      // Check for conflict before saving
      const result = await checkTeacherConflict(teacher, editingCell.day, editingCell.num);
      if (result && result.conflict) {
        showConflictWarning(result.message || 'This teacher is already assigned to another class at this time.');
        return;
      }

      const key = `${editingCell.day}|${editingCell.num}`;
      pendingChanges[key] = { subject, teacher, overrideLecture1 };
      closeCellPopup();
      render();
    });

    // Close popup if click outside
    document.addEventListener('click', (e) => {
      if (cellPopup && !cellPopup.classList.contains('hidden') && !cellPopup.contains(e.target) && !e.target.closest('.tt-cell-editable')) {
        closeCellPopup();
      }
    });

    function getCellData(day, num) {
      const cell = currentSchedule[day]?.find(s => s.num === num);
      return { subject: cell?.subject || '', teacher: cell?.teacher || '' };
    }

    async function render() {
      if (viewMode === 'teacher') {
        await renderTeacherTimetable();
        return;
      }

      const std = parseInt(stdSel.value, 10);
      const sec = secSel.value;
      badgeStd.textContent = 'Std ' + std;
      badgeSec.textContent = 'Section ' + sec;

      const payload = await loadTimetable(std, sec);
      currentSchedule = payload?.schedule || (typeof generateTimetable === 'function' ? generateTimetable(std, sec) : {});
      currentDays = payload?.days || currentDays;
      currentSlotsWeekday = payload?.slotsWeekday || currentSlotsWeekday;
      currentSlotsSaturday = payload?.slotsSaturday || currentSlotsSaturday;
      currentSubjectColors = payload?.subjectColors || currentSubjectColors;
      currentSubjectPool = Array.isArray(payload?.subjectPool) ? payload.subjectPool : [];

      legendEl.innerHTML = currentSubjectPool.map(subj => {
        const c = currentSubjectColors[subj] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
        return `<span class="tt-legend-item" style="background:${c.bg};color:${c.text};border-color:${c.border}">
          <span class="tt-legend-dot" style="background:${c.text}"></span>${subj}
        </span>`;
      }).join('');

      thead.innerHTML = `<tr>
        <th>Time</th>
        ${currentDays.map(d => `<th>${d}</th>`).join('')}
      </tr>`;

      tbody.innerHTML = '';
      buildUnifiedTable(currentSchedule, tbody);
    }

    async function renderTeacherTimetable() {
      const teacherName = teacherSel ? teacherSel.value : '';
      badgeTeacher.textContent = teacherName || 'Teacher';
      legendEl.innerHTML = '';

      if (!teacherName) {
        thead.innerHTML = `<tr><th>Time</th>${currentDays.map(d => `<th>${d}</th>`).join('')}</tr>`;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:30px;">Select a teacher to view timetable.</td></tr>';
        return;
      }

      try {
        const payload = await api.get(`/timetable/teacher?teacher=${encodeURIComponent(teacherName)}`);
        currentSchedule = payload?.schedule || {};
        currentDays = payload?.days || currentDays;
        currentSlotsWeekday = payload?.slotsWeekday || currentSlotsWeekday;
        currentSlotsSaturday = payload?.slotsSaturday || currentSlotsSaturday;
      } catch {
        const fallback = await buildTeacherScheduleFromClasses(teacherName);
        currentSchedule = fallback.schedule;
      }

      thead.innerHTML = `<tr>
        <th>Time</th>
        ${currentDays.map(d => `<th>${d}</th>`).join('')}
      </tr>`;

      tbody.innerHTML = '';
      const hasAny = Object.values(currentSchedule || {}).some((slots) =>
        Array.isArray(slots) && slots.some((slot) => Array.isArray(slot?.entries) && slot.entries.length > 0)
      );
      if (!hasAny) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:30px;">No lectures found for this teacher.</td></tr>';
        return;
      }
      buildTeacherTable(currentSchedule, tbody);
    }

    function buildUnifiedTable(schedule, tbody) {
      const unified = [
        { type: 'lecture', num: 1 },
        { type: 'lecture', num: 2 },
        { type: 'lecture', num: 3 },
        { type: 'sat-break' },
        { type: 'lecture', num: 4 },
        { type: 'week-break' },
        { type: 'lecture', num: 5 },
        { type: 'lecture', num: 6 },
        { type: 'lecture', num: 7 },
        { type: 'lecture', num: 8 },
      ];

      function getSlot(day, num) {
        const slots = day === 'Saturday' ? currentSlotsSaturday : currentSlotsWeekday;
        return slots.find(s => s.num === num);
      }
      function getLecture(day, num) {
        // Check pending changes first
        const key = `${day}|${num}`;
        if (pendingChanges[key]) return { num, subject: pendingChanges[key].subject, teacher: pendingChanges[key].teacher };
        return schedule[day]?.find(s => s.num === num);
      }

      let html = '';

      unified.forEach(entry => {
        if (entry.type === 'week-break') {
          const wSlot = currentSlotsWeekday.find(s => s.isBreak);
          html += `<tr class="tt-break-row">
            <td class="tt-time-col">
              <span class="tt-time-num">Break ☕</span>
              <span class="tt-time-range">${wSlot ? wSlot.time : ''}</span>
            </td>
            ${currentDays.map(day => {
              if (day === 'Saturday') return '<td>-</td>';
              return `<td><span class="tt-break-label">Break ☕ - 20 min</span></td>`;
            }).join('')}
          </tr>`;
          return;
        }

        if (entry.type === 'sat-break') {
          const sSlot = currentSlotsSaturday.find(s => s.isBreak);
          html += `<tr class="tt-break-row">
            <td class="tt-time-col">
              <span class="tt-time-num">Break ☕</span>
              <span class="tt-time-range">${sSlot ? sSlot.time : ''}</span>
            </td>
            ${currentDays.map(day => {
              if (day === 'Saturday') return `<td><span class="tt-break-label">Break ☕ - 20 min</span></td>`;
              return '<td>-</td>';
            }).join('')}
          </tr>`;
          return;
        }

        const num = entry.num;
        const wSlot = getSlot('Monday', num);
        if (!wSlot) return;

        html += `<tr>
          <td class="tt-time-col">
            <span class="tt-time-num">Lecture ${num}</span>
            <span class="tt-time-range">${wSlot.time}</span>
          </td>
          ${currentDays.map(day => {
            const cell = getLecture(day, num);
            if (!cell || !cell.subject) return editMode ? `<td><div class="tt-cell tt-cell-editable tt-cell-empty" data-day="${day}" data-num="${num}" style="cursor:pointer;border:2px dashed #cbd5e1;background:#f8fafc;min-width:7rem;min-height:3rem;display:inline-flex;align-items:center;justify-content:center;border-radius:0.5rem;"><span style="color:#94a3b8;font-size:0.75rem;">+ Add</span></div></td>` : '<td>-</td>';
            const c = currentSubjectColors[cell.subject] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
            const isPending = pendingChanges[`${day}|${num}`];
            const editableClass = editMode ? ' tt-cell-editable' : '';
            const editableStyle = editMode ? 'cursor:pointer;' : '';
            const pendingBadge = isPending ? '<span style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#f59e0b;border-radius:50%;border:2px solid #fff;"></span>' : '';
            return `<td>
              <div class="tt-cell${editableClass}" style="background:${c.bg};color:${c.text};border:1px solid ${c.border};${editableStyle}position:relative;" data-day="${day}" data-num="${num}">
                ${pendingBadge}
                <span class="tt-subj">${cell.subject}</span>
                <span class="tt-teacher">${cell.teacher}</span>
              </div>
            </td>`;
          }).join('')}
        </tr>`;
      });

      tbody.innerHTML = html;
    }

    function buildTeacherTable(schedule, tbody) {
      const unified = [
        { type: 'lecture', num: 1 },
        { type: 'lecture', num: 2 },
        { type: 'lecture', num: 3 },
        { type: 'sat-break' },
        { type: 'lecture', num: 4 },
        { type: 'week-break' },
        { type: 'lecture', num: 5 },
        { type: 'lecture', num: 6 },
        { type: 'lecture', num: 7 },
        { type: 'lecture', num: 8 },
      ];

      function getSlot(day, num) {
        const slots = day === 'Saturday' ? currentSlotsSaturday : currentSlotsWeekday;
        return slots.find(s => s.num === num);
      }

      let html = '';
      unified.forEach(entry => {
        if (entry.type === 'week-break') {
          const wSlot = currentSlotsWeekday.find(s => s.isBreak);
          html += `<tr class="tt-break-row">
            <td class="tt-time-col">
              <span class="tt-time-num">Break ☕</span>
              <span class="tt-time-range">${wSlot ? wSlot.time : ''}</span>
            </td>
            ${currentDays.map(day => day === 'Saturday'
              ? '<td>-</td>'
              : `<td><span class="tt-break-label">Break ☕ - 20 min</span></td>`
            ).join('')}
          </tr>`;
          return;
        }

        if (entry.type === 'sat-break') {
          const sSlot = currentSlotsSaturday.find(s => s.isBreak);
          html += `<tr class="tt-break-row">
            <td class="tt-time-col">
              <span class="tt-time-num">Break ☕</span>
              <span class="tt-time-range">${sSlot ? sSlot.time : ''}</span>
            </td>
            ${currentDays.map(day => day === 'Saturday'
              ? `<td><span class="tt-break-label">Break ☕ - 20 min</span></td>`
              : '<td>-</td>'
            ).join('')}
          </tr>`;
          return;
        }

        const num = entry.num;
        const wSlot = getSlot('Monday', num);
        if (!wSlot) return;

        html += `<tr>
          <td class="tt-time-col">
            <span class="tt-time-num">Lecture ${num}</span>
            <span class="tt-time-range">${wSlot.time}</span>
          </td>
          ${currentDays.map(day => {
            const slot = schedule[day]?.find(s => s.num === num);
            const entries = Array.isArray(slot?.entries) ? slot.entries : [];
            if (!entries.length) return '<td>-</td>';
            const entry = entries[0];
            const conflictBadge = slot?.hasConflict || entries.length > 1
              ? '<span style="display:inline-block;margin-top:4px;font-size:0.65rem;color:#b45309;">Conflict</span>'
              : '';
            const cellHtml = (() => {
              const c = currentSubjectColors[entry.subject] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
              return `<div class="tt-cell" style="background:${c.bg};color:${c.text};border:1px solid ${c.border};">
                <span class="tt-subj">${entry.subject}</span>
                <span class="tt-teacher">${entry.classLabel || ''}</span>
                ${conflictBadge}
              </div>`;
            })();
            return `<td>${cellHtml}</td>`;
          }).join('')}
        </tr>`;
      });

      tbody.innerHTML = html;
    }

    if (tbody && !tbody.dataset.ttClickBound) {
      tbody.dataset.ttClickBound = '1';
      tbody.addEventListener('click', (e) => {
        const el = e.target.closest('.tt-cell-editable');
        if (!el || !editMode) return;
        e.stopPropagation();
        const day = el.getAttribute('data-day');
        const num = parseInt(el.getAttribute('data-num'), 10);
        openCellPopup(day, num, el);
      });
    }

    if (scope && !scope.dataset.ttDocClickBound) {
      scope.dataset.ttDocClickBound = '1';
      document.addEventListener('click', (e) => {
        const el = e.target.closest && e.target.closest('.tt-cell-editable');
        if (!el || !editMode) return;
        const day = el.getAttribute('data-day');
        const num = parseInt(el.getAttribute('data-num'), 10);
        if (!day || !Number.isInteger(num)) return;
        openCellPopup(day, num, el);
      }, true);
    }

    stdSel.addEventListener('change', () => { cachedSubjects = {}; cachedTeachers = {}; if (editMode) exitEditMode(); render(); });
    secSel.addEventListener('change', () => { if (editMode) exitEditMode(); render(); });
    if (teacherSel) teacherSel.addEventListener('change', () => render());

    if (printBtn) printBtn.addEventListener('click', () => window.print());

    if (exportBtn) exportBtn.addEventListener('click', () => {
      if (viewMode === 'teacher') {
        const teacherName = teacherSel ? teacherSel.value : '';
        if (!teacherName) return;
        let csv = 'Time,' + currentDays.join(',') + '\n';
        const unified = [1,2,3,'SB',4,'WB',5,6,7,8];
        unified.forEach(entry => {
          if (entry === 'WB') {
            csv += 'Break (Mon-Fri),' + currentDays.map(d => d === 'Saturday' ? '' : 'Break 20min').join(',') + '\n';
            return;
          }
          if (entry === 'SB') {
            csv += 'Break (Saturday),' + currentDays.map(d => d === 'Saturday' ? 'Break 20min' : '').join(',') + '\n';
            return;
          }
          const wSlot = currentSlotsWeekday.find(s => s.num === entry);
          const timeStr = wSlot ? wSlot.time : '';
          csv += `"Lecture ${entry} (${timeStr})",`;
          csv += currentDays.map(day => {
            const slot = currentSchedule[day]?.find(s => s.num === entry);
            const entries = Array.isArray(slot?.entries) ? slot.entries : [];
            if (!entries.length) return '';
            return `"${entries.map(e => `${e.subject} (${e.classLabel})`).join(' | ')}"`;
          }).join(',');
          csv += '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Teacher_Timetable_${teacherName.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        return;
      }

      const std = stdSel.value;
      const sec = secSel.value;
      const schedule = currentSchedule && Object.keys(currentSchedule).length
        ? currentSchedule
        : (typeof generateTimetable === 'function' ? generateTimetable(parseInt(std, 10), sec) : {});

      let csv = 'Time,' + currentDays.join(',') + '\n';
      const unified = [1,2,3,'SB',4,'WB',5,6,7,8];

      unified.forEach(entry => {
        if (entry === 'WB') {
          csv += 'Break (Mon-Fri),' + currentDays.map(d => d === 'Saturday' ? '' : 'Break 20min').join(',') + '\n';
          return;
        }
        if (entry === 'SB') {
          csv += 'Break (Saturday),' + currentDays.map(d => d === 'Saturday' ? 'Break 20min' : '').join(',') + '\n';
          return;
        }
        const wSlot = currentSlotsWeekday.find(s => s.num === entry);
        const timeStr = wSlot ? wSlot.time : '';
        csv += `"Lecture ${entry} (${timeStr})",`;
        csv += currentDays.map(day => {
          const cell = schedule[day]?.find(s => s.num === entry);
          return cell?.subject ? `"${cell.subject} - ${cell.teacher}"` : '';
        }).join(',');
        csv += '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Timetable_Std${std}_Sec${sec}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    function openUploadModal() {
      if (!uploadModal) return;
      uploadStd.value = stdSel.value;
      uploadSec.value = secSel.value;
      uploadFile.value = '';
      if (uploadMsg) uploadMsg.style.display = 'none';
      uploadModal.classList.remove('hidden');
    }

    function closeUploadModal() {
      if (!uploadModal) return;
      uploadModal.classList.add('hidden');
    }

    if (uploadBtn) uploadBtn.addEventListener('click', openUploadModal);
    if (uploadClose) uploadClose.addEventListener('click', closeUploadModal);
    if (uploadCancel) uploadCancel.addEventListener('click', closeUploadModal);

    function setUploadMsg(text, type = 'info') {
      if (!uploadMsg) return;
      const palette = {
        success: { bg: '#ecfdf5', color: '#065f46', border: '#10b981' },
        error: { bg: '#fef2f2', color: '#991b1b', border: '#ef4444' },
        info: { bg: '#eff6ff', color: '#1e3a8a', border: '#3b82f6' },
      };
      const p = palette[type] || palette.info;
      uploadMsg.textContent = text;
      uploadMsg.style.display = 'block';
      uploadMsg.style.background = p.bg;
      uploadMsg.style.color = p.color;
      uploadMsg.style.border = `1px solid ${p.border}`;
    }

    if (downloadLayoutBtn) downloadLayoutBtn.addEventListener('click', async () => {
      const std = parseInt(uploadStd.value, 10);
      const section = uploadSec.value;
      const response = await loadTimetableLayout(std, section);
      if (!response || response.error || !response.layout) {
        setUploadMsg(response?.error || 'Failed to download layout.', 'error');
        return;
      }
      const pretty = JSON.stringify(response.layout, null, 2);
      const blob = new Blob([pretty], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Timetable_Layout_Std${std}_Sec${section}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setUploadMsg('Layout JSON downloaded.', 'success');
    });

    if (uploadSave) uploadSave.addEventListener('click', async () => {
      const file = uploadFile?.files?.[0];
      if (!file) {
        setUploadMsg('Please select a JSON file first.', 'error');
        return;
      }

      let parsedJson;
      try {
        const raw = await file.text();
        parsedJson = JSON.parse(raw);
      } catch (_e) {
        setUploadMsg('Invalid JSON file.', 'error');
        return;
      }

      const std = parseInt(uploadStd.value, 10);
      const section = uploadSec.value;
      const result = await importTimetableJson({ std, section, schedule: parsedJson });
      if (!result || result.error || result.success === false) {
        setUploadMsg(result?.error || 'Failed to upload timetable.', 'error');
        return;
      }

      stdSel.value = String(std);
      secSel.value = section;
      setUploadMsg(`Time table uploaded successfully (${result.count || 0} rows).`, 'success');
      await render();
    });

    render();
    loadTeacherList();
    setViewMode('class');
  }
// Initialize timetable on enter
  sectionEnterHooks.timetable = () => {};

  /* ---------- SETTINGS ---------- */
  function initSettingsSection() {
    const scope = sections.settings;
    if (!scope) return;

    // Fill profile info from logged-in user
    const nameEl = scope.querySelector('#set-name');
    const emailEl = scope.querySelector('#set-email');
    const idEl = scope.querySelector('#set-id');
    const avatarEl = scope.querySelector('#set-avatar');
    const nameDisplay = scope.querySelector('#set-name-display');
    const nameDisplay2 = scope.querySelector('#set-name-display2');
    const roleDisplay = scope.querySelector('#set-role-display');
    const roleDisplay2 = scope.querySelector('#set-role-display2');
    const userName = user.name || 'Admin';
    const roleName = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrator';
    if (nameEl) nameEl.textContent = userName;
    if (emailEl) emailEl.textContent = user.email || '—';
    if (idEl) idEl.textContent = user.email ? user.email.split('@')[0].toUpperCase() : 'ADMIN001';
    if (avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
    if (nameDisplay) nameDisplay.textContent = userName;
    if (nameDisplay2) nameDisplay2.textContent = userName;
    if (roleDisplay) roleDisplay.textContent = roleName;
    if (roleDisplay2) roleDisplay2.textContent = roleName;

    // Edit profile toggle
    const editBtn = scope.querySelector('#editProfileBtn');
    const editForm = scope.querySelector('#profileEditForm');
    const saveBtn = scope.querySelector('#saveProfileBtn');
    if (editBtn && editForm) {
      const editName = scope.querySelector('#set-edit-name');
      const editEmail = scope.querySelector('#set-edit-email');
      editBtn.addEventListener('click', () => {
        const showing = !editForm.classList.contains('hidden');
        if (showing) {
          editForm.classList.add('hidden');
          editBtn.textContent = '\u270f\ufe0f Edit Profile';
          if (editName) editName.value = nameEl ? nameEl.textContent : '';
          if (editEmail) editEmail.value = emailEl ? emailEl.textContent : '';
          editForm.classList.remove('hidden');
          editBtn.textContent = '✕ Cancel';
        }
      });
      if (saveBtn) saveBtn.addEventListener('click', () => {
        if (editName && nameEl) nameEl.textContent = editName.value || nameEl.textContent;
        if (editEmail && emailEl) emailEl.textContent = editEmail.value || emailEl.textContent;
        if (editName && nameDisplay) nameDisplay.textContent = editName.value || nameDisplay.textContent;
        if (editName && nameDisplay2) nameDisplay2.textContent = editName.value || nameDisplay2.textContent;
        if (editName && avatarEl) avatarEl.textContent = (editName.value || 'A').charAt(0).toUpperCase();
        editForm.classList.add('hidden');
        editBtn.textContent = '✏️ Edit Profile';
        showFlash(saveBtn, '✅ Saved!');
      });
    }

    // Password update
    const pwdBtn = scope.querySelector('#updatePwdBtn');
    const pwdSuccess = scope.querySelector('#pwdSuccess');
    if (pwdBtn) pwdBtn.addEventListener('click', () => {
      if (pwdSuccess) {
        pwdSuccess.classList.remove('hidden');
        setTimeout(() => pwdSuccess.classList.add('hidden'), 3000);
      }
    });
  }

  // Animate settings progress bars when section becomes visible
  sectionEnterHooks.settings = (scope) => {
    const bars = scope.querySelectorAll('.settings-bar');
    // 1. Instantly snap to 0 with no transition
    bars.forEach(bar => {
      bar.style.transition = 'none';
      bar.style.width = '0%';
    });
    // 2. Force layout flush, then animate to target width
    // setTimeout(0) guarantees the 0% paint is committed before transition starts
    setTimeout(() => {
      bars.forEach(bar => {
        bar.style.transition = 'width 0.6s cubic-bezier(0.4,0,0.2,1)';
        bar.style.width = (bar.dataset.target || 0) + '%';
      });
    }, 30);
  };

  function showFlash(anchorEl, msg) {
    const flash = document.createElement('span');
    flash.className = 'settings-flash';
    flash.textContent = msg;
    anchorEl.insertAdjacentElement('afterend', flash);
    setTimeout(() => flash.remove(), 2500);
  }
}; // end initAdminPage

// Reusable bar + number sync animation for Monthly Attendance
function animateAttendanceBars(scope) {
  const root = scope || document;
  const bars = root.querySelectorAll('[data-att-bar]');
  const labels = root.querySelectorAll('[data-att-label]');
  if (!bars.length || !labels.length) return;

  // Restart bar grow animation
  bars.forEach(bar => {
    const delay = parseInt(bar.dataset.delay || '0', 10);
    bar.style.animation = 'none';
    // force reflow
    void bar.offsetHeight;
    bar.style.animation = `barGrow 800ms ease-out forwards ${delay}ms`;
  });

  // Sync number count-up with the same delay/duration
  labels.forEach(label => {
    const target = parseInt(label.dataset.target || label.dataset.value || '0', 10);
    const delay = parseInt(label.dataset.delay || '0', 10);
    const duration = 800;
    const startTime = performance.now() + delay;
    label.textContent = '0%';
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      if (now < startTime) return requestAnimationFrame(tick);
      const t = Math.min(1, (now - startTime) / duration);
      const eased = ease(t);
      label.textContent = `${Math.round(target * eased)}%`;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    });
}





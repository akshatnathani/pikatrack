'use strict';

// ── CONSTANTS ────────────────────────────────────────────────
const TYPE_ICON  = {'Development':'🐙','Training Ground':'💻','Entertainment':'▶️','AI Assistant':'🤖','Social':'🐦','General':'🌐','Networking':'💼','Research':'📚','Productivity':'📝'};
const TYPE_PI    = {'Development':'pi-dev','Training Ground':'pi-train','Entertainment':'pi-ent','AI Assistant':'pi-ai','Social':'pi-social','General':'pi-gen','Networking':'pi-net','Research':'pi-res','Productivity':'pi-prod'};
const TYPE_PT    = {'Development':'pt-dev','Training Ground':'pt-train','Entertainment':'pt-ent','AI Assistant':'pt-ai','Social':'pt-social','General':'pt-gen','Networking':'pt-net','Research':'pt-res','Productivity':'pt-prod'};
const ROUTE_COL  = {'Development':'#60a5fa','Training Ground':'#4ade80','Entertainment':'#f87171','AI Assistant':'#c084fc','Social':'#94a3b8','General':'#6b7280','Networking':'#38bdf8','Research':'#fb923c','Productivity':'#2dd4bf'};
const DOMAIN_ICON = {'github.com':'🐙','leetcode.com':'💻','youtube.com':'▶️','chatgpt.com':'🤖','claude.ai':'⚡','stackoverflow.com':'📚','notion.so':'📝','docs.google.com':'📄','twitter.com':'🐦','x.com':'🐦','reddit.com':'🤿','linkedin.com':'💼','medium.com':'📰'};

const GYM_BADGES = [
  {name:'Arrays',icon:'📊',need:5},{name:'Strings',icon:'🔤',need:10},
  {name:'Binary Search',icon:'🔍',need:15},{name:'Sliding Window',icon:'🪟',need:20},
  {name:'Linked List',icon:'🔗',need:25},{name:'Trees',icon:'🌳',need:35},
  {name:'Graphs',icon:'🕸️',need:50},{name:'Dynamic Prog.',icon:'🧠',need:65},{name:'Champion',icon:'🏆',need:100},
];

// ── HELPERS ──────────────────────────────────────────────────
const fmtMs = ms => { const m=Math.round(ms/60000); return m<60 ? m+'m' : Math.floor(m/60)+'h '+(m%60)+'m'; };
const fmtMinutes = minutes => Math.round(Number(minutes) || 0) + 'm';
const todayStr = () => new Date().toDateString();
const ts = sessions => (sessions||[]).filter(s=>s.date===todayStr());
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function getDomainIcon(domain) {
  for (const k of Object.keys(DOMAIN_ICON)) if (domain.includes(k)) return DOMAIN_ICON[k];
  return '🌐';
}

function calcScore(t, todaySess, data) {
  // 1. Focus Time (40%) - Target 4 hours (240 mins)
  const todayMs = todaySess.reduce((a,s)=>a+s.durationMs,0);
  const todayMins = todayMs / 60000;
  const focusScore = Math.min(100, (todayMins / 240) * 100);

  // 2. LeetCode Progress (25%) - Target 2 problems solved today
  const lcScore = Math.min(100, (t.leetcodeTodaySolved || 0) * 50);

  // 3. GitHub Contributions (20%) - Target 3 commits today
  const ghContributions = (t.githubTodayCommits || 0);
  const ghScore = Math.min(100, ghContributions * 33.3);

  // 4. Educational Video Ratio (10%)
  const vids = (data?.videos || []).filter(v => v.date === todayStr());
  let eduScore = 100; // Default if no videos watched
  if (vids.length > 0) {
    const eduCount = vids.filter(v => v.educational).length;
    eduScore = (eduCount / vids.length) * 100;
  }

  // 5. Streak (5%) - Target 10 days
  const streakScore = Math.min(100, (t.streak || 0) * 10);

  // Combine
  const finalScore = Math.round(
    (focusScore * 0.40) +
    (lcScore * 0.25) +
    (ghScore * 0.20) +
    (eduScore * 0.10) +
    (streakScore * 0.05)
  );

  return Math.min(100, Math.max(0, finalScore));
}

function getNextAction(t, todaySess, data) {
  const focusMins = Math.round(todaySess.reduce((a, s) => a + s.durationMs, 0) / 60000);
  const vids = (data?.videos || []).filter(v => v.date === todayStr());
  const eduCount = vids.filter(v => v.educational).length;
  const entCount = vids.length - eduCount;
  if (focusMins < 25) return 'Start a 25m focus block';
  if ((t.leetcodeTodaySolved || 0) < 1) return 'Solve one coding problem';
  if ((t.githubTodayCommits || 0) < 1) return 'Ship one small commit';
  if (entCount > eduCount && entCount > 0) return 'Swap next video for learning';
  return 'Protect the streak';
}

function renderFocusDeck(data) {
  const t = data.trainer || {};
  const todaySess = ts(data.sessions);
  const focusMs = todaySess.reduce((a, s) => a + s.durationMs, 0);
  const focusMins = Math.round(focusMs / 60000);
  const focusGoalMins = 240;
  const progress = Math.min(100, Math.round((focusMins / focusGoalMins) * 100));
  const active = todaySess.find(s => s.inProgress);
  const deckMins = document.getElementById('deck-focus-mins');
  const deckProgress = document.getElementById('deck-focus-progress');
  const currentSite = document.getElementById('deck-current-site');
  const nextAction = document.getElementById('deck-next-action');
  const questFocus = document.getElementById('quest-focus');
  const questCode = document.getElementById('quest-code');
  const questBalance = document.getElementById('quest-balance');

  if (deckMins) deckMins.textContent = fmtMs(focusMs);
  if (deckProgress) deckProgress.style.width = progress + '%';
  if (currentSite) currentSite.textContent = t.trackingPaused ? 'Paused' : (active ? active.domain : 'Ready');
  if (nextAction) nextAction.textContent = t.trackingPaused ? 'Resume tracking when ready' : getNextAction(t, todaySess, data);
  if (questFocus) {
    questFocus.textContent = `Focus ${Math.min(25, focusMins)}/25m`;
    questFocus.classList.toggle('done', focusMins >= 25);
  }
  if (questCode) {
    const codeCount = Math.max(t.leetcodeTodaySolved || 0, t.githubTodayCommits || 0);
    questCode.textContent = `Code ${Math.min(1, codeCount)}/1`;
    questCode.classList.toggle('done', codeCount >= 1);
  }
  if (questBalance) {
    const vids = (data.videos || []).filter(v => v.date === todayStr());
    const entCount = vids.filter(v => !v.educational).length;
    questBalance.textContent = entCount > 2 ? 'Balance media' : 'Balance ready';
    questBalance.classList.toggle('warn', entCount > 2);
  }
}

// Evolution based on TODAY's focus hours
function getEvo(todayFocusMs) {
  const h = (todayFocusMs||0)/3600000;
  if (h >= 10) return 'raichu';
  if (h >= 3)  return 'pikachu';
  return 'pichu';
}

function empty(icon, title, sub) {
  return `<div class="empty"><div class="ei">${icon}</div><div class="et">${title}</div><div class="es">${sub}</div></div>`;
}

// ── TABS ─────────────────────────────────────────────────────
function showTab(id) {
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const targetSec = document.getElementById(id);
  const targetNav = document.querySelector('[data-tab="'+id+'"]');
  if (targetSec) targetSec.classList.add('active');
  if (targetNav) targetNav.classList.add('active');
}

// ── RENDER HEADER (always-visible) ──────────────────────────
function renderHeader(data) {
  const t = data.trainer||{};
  const todaySess = ts(data.sessions);
  const todayMs = todaySess.reduce((a,s)=>a+s.durationMs,0);
  const xp = t.todayXP||0;
  const pct = Math.min(100, Math.round(xp/500*100));

  // Update trainer name elements dynamically
  const name = t.trainerName || 'Trainer';
  const subtitleEl = document.querySelector('.header-subtitle');
  if (subtitleEl) subtitleEl.textContent = 'Trainer ' + name;
  const metaTitleEl = document.querySelector('.trainer-meta-title');
  if (metaTitleEl) metaTitleEl.textContent = 'Trainer ' + name;
  const versionEl = document.querySelector('.version');
  if (versionEl) versionEl.textContent = 'Trainer ' + name + ' · v2.1';

  // Update trainer header & card elements
  document.getElementById('xp-num').textContent = xp+' / 500';
  document.getElementById('xp-bar').style.width = pct+'%';
  document.getElementById('ss-score').textContent = calcScore(t,todaySess,data);
  document.getElementById('ss-streak').textContent = t.streak||0;
  document.getElementById('ss-time').textContent = fmtMs(todayMs);
  document.getElementById('ss-leet').textContent = t.leetcodeSolved||0;

  // Update new grid widget elements
  document.getElementById('ss-leet-today').textContent = t.leetcodeTodaySolved||0;
  document.getElementById('ss-gh-today').textContent = t.githubTodayCommits||0;
  document.getElementById('ss-xp-earned').textContent = xp;

  const vids = (data.videos||[]).filter(v=>v.date===todayStr());
  document.getElementById('ss-vids-watched').textContent = vids.length;

  const batt = (data.battles||[]).filter(b=>b.date===todayStr());
  const wins = batt.filter(b=>b.won).length;
  document.getElementById('ss-battles-won').textContent = wins;

  const evo = getEvo(t.todayFocusMs||0);
  const evoNames = {pichu:'Pichu',pikachu:'Pikachu',raichu:'Raichu'};
  document.getElementById('t-level').textContent = 'Level '+(t.level||1)+' · '+evoNames[evo];

  // Update evo strip
  ['pichu','pikachu','raichu'].forEach(id => {
    const el = document.getElementById('en-'+id);
    if (el) {
      el.classList.remove('active','dim');
      const checkEl = el.querySelector('.evo-check');
      if (id===evo) {
        el.classList.add('active');
        if (checkEl) checkEl.style.display='block';
      } else {
        el.classList.add('dim');
        if (checkEl) checkEl.style.display='none';
      }
    }
  });
}

function getProductivityCategory(type) {
  const map = {
    'Development': 'Development',
    'Training Ground': 'Learning',
    'Research': 'Learning',
    'Entertainment': 'Entertainment',
    'Social': 'Social',
    'Networking': 'Social',
    'AI Assistant': 'AI Tools',
    'Productivity': 'General',
    'General': 'General'
  };
  return map[type] || 'General';
}

// ── RENDER CAUGHT ────────────────────────────────────────────
function renderCaught(data) {
  const todaySess = ts(data.sessions);
  const map = {};
  todaySess.forEach(s=>{
    if (!map[s.domain]) map[s.domain]={domain:s.domain,type:s.type,totalMs:0,xp:0};
    map[s.domain].totalMs+=s.durationMs; map[s.domain].xp+=s.xp;
  });
  const list = Object.values(map).sort((a,b)=>b.totalMs-a.totalMs);
  const cl = document.getElementById('caught-list');

  if (!list.length) {
    cl.innerHTML = empty('🎣','No sites caught yet','Browse for 90+ seconds to start logging!');
  } else {
    const xpCls = t => t==='Entertainment'||t==='Social'?'xp-lo':t==='Development'||t==='Training Ground'?'xp-hi':'xp-md';
    cl.innerHTML = list.map(s=>{
      const domainSess = todaySess.filter(sess => sess.domain === s.domain);
      const sessionCount = domainSess.length;
      
      // Formatting corrections for synced achievements
      const avgDurationStr = s.totalMs > 0 ? fmtMs(s.totalMs / sessionCount) : 'Profile Sync';
      const xpRateStr = s.totalMs > 0 ? (s.xp / (s.totalMs / 60000)).toFixed(1) + ' XP/m' : 'Direct XP';

      return `
      <div class="caught-wrapper">
        <div class="poke-card">
          <div class="poke-card-left">
            <div class="poke-icon ${TYPE_PI[s.type]||'pi-gen'}">${getDomainIcon(s.domain)}</div>
            <div class="poke-info">
              <div class="poke-name">${esc(s.domain)}</div>
              <span class="poke-type ${TYPE_PT[s.type]||'pt-gen'}">${s.type}</span>
            </div>
          </div>
          <div class="poke-card-right">
            <div class="poke-time">${s.totalMs > 0 ? fmtMs(s.totalMs) : '0m'}</div>
            <div class="poke-xp ${xpCls(s.type)}">+${s.xp} XP</div>
          </div>
        </div>
        <div class="poke-details">
          <div class="pd-grid">
            <div class="pd-item"><span class="pd-label">Sessions</span><span class="pd-val">${sessionCount}</span></div>
            <div class="pd-item"><span class="pd-label">Avg Session</span><span class="pd-val">${avgDurationStr}</span></div>
            <div class="pd-item"><span class="pd-label">XP Rate</span><span class="pd-val">${xpRateStr}</span></div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // Render Category Donut Chart Breakdown
  const catTotals = {
    'Development': 0,
    'Learning': 0,
    'Entertainment': 0,
    'Social': 0,
    'AI Tools': 0,
    'General': 0
  };
  todaySess.forEach(s => {
    const cat = getProductivityCategory(s.type);
    catTotals[cat] = (catTotals[cat] || 0) + s.durationMs;
  });
  const totalTime = Object.values(catTotals).reduce((a, b) => a + b, 0);
  const donutChart = document.getElementById('usage-donut-chart');
  const donutLegend = document.getElementById('usage-legend');
  const donutTotal = document.getElementById('donut-total-time');

  const GROUP_COL = {
    'Development': '#60a5fa',
    'Learning': '#4ade80',
    'Entertainment': '#f87171',
    'Social': '#94a3b8',
    'AI Tools': '#c084fc',
    'General': '#6b7280'
  };

  if (totalTime > 0) {
    donutTotal.textContent = fmtMs(totalTime);
    let accumulatedPercent = 0;
    const gradientStops = [];
    const legendItems = [];
    const sortedCats = Object.entries(catTotals)
      .filter(([_, ms]) => ms > 0)
      .sort((a,b)=>b[1]-a[1]);
    
    sortedCats.forEach(([cat, ms]) => {
      const pct = (ms / totalTime) * 100;
      const start = accumulatedPercent;
      const end = accumulatedPercent + pct;
      const col = GROUP_COL[cat] || '#6b7280';
      gradientStops.push(`${col} ${start.toFixed(1)}% ${end.toFixed(1)}%`);
      accumulatedPercent = end;

      legendItems.push(`
        <div class="legend-item" style="display: flex; align-items: center; gap: 6px; font-size: 10px;">
          <span class="legend-dot" style="background-color: ${col}; width: 7px; height: 7px; border-radius: 50%; display: inline-block;"></span>
          <span class="legend-name" title="${cat}" style="color: var(--muted); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75px;">${cat}</span>
          <span style="color: var(--dim); margin-left: auto; font-size: 9px; font-weight: 600;">${fmtMs(ms)}</span>
          <span class="legend-pct" style="color: var(--text); font-weight: 700; margin-left: 4px;">${Math.round(pct)}%</span>
        </div>
      `);
    });
    
    donutChart.style.background = `conic-gradient(${gradientStops.join(', ')})`;
    donutLegend.innerHTML = legendItems.join('');
  } else {
    donutTotal.textContent = '0m';
    donutChart.style.background = 'var(--surface2)';
    donutLegend.innerHTML = '<div style="grid-column: span 2; font-size: 10px; color: var(--dim); text-align: center; width: 100%;">No activity logged today.</div>';
  }

  // Media log / YouTube items with clickable redirects
  const vids = (data.videos||[]).filter(v=>v.date===todayStr());
  const ytWrap = document.getElementById('yt-wrap');
  if (vids.length) {
    ytWrap.style.display='block';
    document.getElementById('yt-list').innerHTML = vids.map(v=>`
      <a href="${esc(v.url || 'https://youtube.com')}" target="_blank" class="yt-item-link">
        <div class="yt-item">
          <div class="yt-th">▶️</div>
          <div class="yt-info">
            <div class="yt-title">${esc(v.title)}</div>
            <div class="yt-meta">${v.durationMins||'?'}m watched · ${esc(v.channel || 'Unknown Channel')}</div>
          </div>
          <span class="yt-tag ${v.educational?'tag-e':'tag-n'}">${v.educational?'Edu':'Ent'}</span>
        </div>
      </a>`).join('');
    
    const eduCount = vids.filter(v=>v.educational).length;
    const entCount = vids.length - eduCount;
    const ep = Math.round(eduCount/vids.length*100);
    const totalWatchMins = vids.reduce((sum, v) => sum + (v.durationMins || 0), 0);

    document.getElementById('sp-edu').style.width=ep+'%';
    document.getElementById('sp-ent').style.width=(100-ep)+'%';
    document.getElementById('sp-el').textContent='Educational '+ep+'%';
    document.getElementById('sp-nl').textContent='Entertainment '+(100-ep)+'%';

    document.getElementById('yt-edu-count').textContent = `Edu: ${eduCount} video${eduCount !== 1 ? 's' : ''}`;
    document.getElementById('yt-ent-count').textContent = `Ent: ${entCount} video${entCount !== 1 ? 's' : ''}`;
    document.getElementById('yt-watch-time').textContent = `Watch Time: ${totalWatchMins}m`;
  } else { ytWrap.style.display='none'; }
}

// ── RENDER ROUTE ─────────────────────────────────────────────
function renderRoute(data) {
  const todaySess = ts(data.sessions);
  const rl = document.getElementById('route-list');
  if (!todaySess.length) { rl.innerHTML = empty('🗺️','No route yet','Your journey map fills up as you browse.'); return; }
  
  // Group today's sessions by domain
  const groups = {};
  todaySess.forEach(s => {
    const domain = s.domain;
    if (!groups[domain]) {
      groups[domain] = {
        domain: domain,
        type: s.type,
        firstVisitTime: s.startTime,
        durationMs: 0,
        xp: 0,
        inProgress: false
      };
    }
    groups[domain].durationMs += s.durationMs;
    groups[domain].xp += s.xp || 0;
    if (s.startTime < groups[domain].firstVisitTime) {
      groups[domain].firstVisitTime = s.startTime;
    }
    if (s.inProgress) {
      groups[domain].inProgress = true;
    }
  });

  // Sort chronologically by first visit time
  const groupedList = Object.values(groups).sort((a, b) => a.firstVisitTime - b.firstVisitTime);

  rl.innerHTML = groupedList.map(g => {
    const d = new Date(g.firstVisitTime);
    const t = d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    const c = ROUTE_COL[g.type]||'#6b7280';
    
    // Format duration string: if active in-progress session, append "and counting"
    let durStr = fmtMs(g.durationMs);
    if (g.inProgress) {
      const mins = Math.round(g.durationMs / 60000);
      const displayMins = mins < 1 ? '1m' : mins + 'm';
      durStr = `${displayMins} and counting`;
    }
    
    const pulseStyle = g.inProgress ? ' animation: pulse 1.5s infinite alternate;' : '';
    const activeClass = g.inProgress ? 'active-stop' : '';

    return `<div class="route-stop ${activeClass}">
      <span class="rt-time">${t}</span>
      <div class="rt-dot-anchor">
        <div class="rt-dot" style="color:${c};background-color:${c};${pulseStyle}"></div>
      </div>
      <span class="rt-site" title="${esc(g.domain)}">${esc(g.domain)}</span>
      <span class="rt-dur" style="${g.inProgress ? 'color: var(--accent); font-weight: 700;' : ''}">${durStr}</span>
      <span class="rt-xp">${g.xp > 0 ? '+' + g.xp + ' XP' : '0 XP'}</span>
    </div>`;
  }).join('');
}

// ── RENDER BATTLES ───────────────────────────────────────────
function renderBattles(data) {
  const tb = (data.battles||[]).filter(b=>b.date===todayStr()).sort((a,b)=>b.timestamp-a.timestamp);
  const bl = document.getElementById('battles-list');
  if (!tb.length) { bl.innerHTML = empty('⚔️','No battles yet','Work 2+ minutes on coding or learning sites to trigger a battle!'); return; }
  bl.innerHTML = tb.map((b,i)=>`
    <div class="battle-row ${b.won?'won':'fled'}">
      <span class="b-icon">${getDomainIcon(b.domain)}</span>
      <span class="b-site" title="${esc(b.domain)}">${esc(b.domain)}</span>
      <span class="b-badge ${b.won?'bw':'bf'}">${b.won?'Victory':'Fled'}</span>
      <span class="b-dur">${fmtMs(b.durationMs)}</span>
      <span class="b-xp ${b.won?'bxw':'bxf'}">${b.won?'+'+b.xp+' XP':'0 XP'}</span>
    </div>`).join('');
}

// ── RENDER GYM ───────────────────────────────────────────────
function renderGym(data) {
  const t = data.trainer || {};
  const solved = t.leetcodeSolved||0;
  document.getElementById('gym-grid').innerHTML = GYM_BADGES.map(b=>{
    const won = solved>=b.need;
    return `<div class="gym-b ${won?'won':'locked'}">
      <div class="gb-ico">${won?b.icon:'🔒'}</div>
      <div class="gb-nm">${b.name}</div>
      <div class="gb-st">${won?'Earned':b.need+' solves'}</div>
    </div>`;
  }).join('');

  // Render LeetCode Problems Visited Today
  const lp = document.getElementById('lc-problems');
  if (lp) {
    if (t.leetcodeProblems && Object.keys(t.leetcodeProblems).length > 0) {
      const sortedProblems = Object.entries(t.leetcodeProblems)
        .sort((a, b) => b[1].lastVisited - a[1].lastVisited);
      lp.innerHTML = `<div style="display: flex; flex-direction: column; gap: 6px;">
        ${sortedProblems.map(([slug, info]) => {
          const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          return `
          <div style="display: flex; justify-content: space-between; font-size: 10.5px; align-items: center;">
            <a href="https://leetcode.com/problems/${esc(slug)}" target="_blank" style="color: #4ade80; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px;">
              <span>💻</span> <span>${esc(title)}</span>
            </a>
            <span style="color: var(--muted); font-size: 9.5px;">${fmtMs(info.seconds * 1000)} active</span>
          </div>`;
        }).join('')}
      </div>`;
    } else {
      lp.innerHTML = `<div style="font-size: 9.5px; color: var(--dim); text-align: center;">No problems visited today yet.</div>`;
    }
  }

  // Render GitHub Region and Top Repositories
  const commits = t.githubCommits||0;
  const gr = document.getElementById('gh-region');
  if (!commits) {
    gr.innerHTML = empty('🐙','Visit GitHub','Navigate to github.com to map your region.');
  } else {
    let reposHTML = '';
    if (t.githubRepos && Object.keys(t.githubRepos).length > 0) {
      const sortedRepos = Object.entries(t.githubRepos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      reposHTML = `<div class="gh-repos-list" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 9px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;">Top Repositories Today</div>
        ${sortedRepos.map(([repo, secs]) => `
          <div style="display: flex; justify-content: space-between; font-size: 10.5px;">
            <span style="color: var(--text); font-weight: 600;">${esc(repo)}</span>
            <span style="color: var(--muted);">${fmtMs(secs * 1000)}</span>
          </div>
        `).join('')}
      </div>`;
    }

    gr.innerHTML = `<div class="gh-row">
      <div class="ghr-ico">🐙</div>
      <div class="gh-details">
        <div class="ghr-name">GitHub Region</div>
        <div class="ghr-sub">${commits} total commit${commits!==1?'s':''} · ${t.githubTodayCommits||0} today</div>
      </div>
      <div class="ghr-xp">+${(t.githubTodayCommits||0)*30} XP today</div>
    </div>
    ${reposHTML}`;
  }
}

// ── RENDER OAK ───────────────────────────────────────────────
function renderOak(data) {
  const t = data.trainer||{};
  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  document.getElementById('oak-date').textContent = 'Trainer ' + (t.trainerName || 'Trainer') + ' · '+today;

  const todaySess = ts(data.sessions);
  const todayMs = todaySess.reduce((a,s)=>a+s.durationMs,0);
  const rows = [
    ['Active today',     fmtMs(todayMs)],
    ['XP earned',        (t.todayXP||0)+' XP'],
    ['LC solved (all)',  (t.leetcodeSolved||0)+' problems'],
    ['LC today',         (t.leetcodeTodaySolved||0)+' problems'],
    ['GitHub commits',   (t.githubTodayCommits||0)+' today'],
    ['ChatGPT messages',  (t.chatgptTodayCount||0)+' messages'],
    ['Focus streak',     (t.streak||0)+' days 🔥'],
    ['Educational Watch', fmtMinutes(t.educationalVideoMinutes)],
    ['Entertainment Watch', fmtMinutes(t.entertainmentVideoMinutes)]
  ];
  document.getElementById('oak-stats').innerHTML = rows.map(([k,v])=>`
    <div class="oak-stat"><span class="oak-k">${k}</span><span class="oak-v">${v}</span></div>`).join('');
}

async function generateOak() {
  const key = document.getElementById('api-key').value.trim();
  if (!key) {
    document.getElementById('oak-result').innerHTML = `<div class="oak-result oak-err">Add an Anthropic API key in Settings first, then Professor Oak can write your report.</div>`;
    return;
  }
  document.getElementById('oak-btn').disabled=true;
  document.getElementById('oak-loading').style.display='block';
  document.getElementById('oak-result').innerHTML='';

  chrome.runtime.sendMessage({type:'GET_DATA'}, async data=>{
    const t=data.trainer||{};
    const todaySess=ts(data.sessions);
    const tMs=todaySess.reduce((a,s)=>a+s.durationMs,0);
    const sMap={};
    todaySess.forEach(s=>{ sMap[s.domain]=(sMap[s.domain]||0)+s.durationMs; });
    const siteSumm=Object.entries(sMap).map(([d,ms])=>`${d}: ${Math.round(ms/60000)}min`).join(', ')||'none';
    const vids=(data.videos||[]).filter(v=>v.date===todayStr());
    const batt=(data.battles||[]).filter(b=>b.date===todayStr());

    const prompt = `You are Professor Oak from Pokémon giving trainer ${t.trainerName || 'Trainer'} their daily productivity analysis. Be warm, sharp and use light Pokémon metaphors.

Data:
- Active time: ${Math.round(tMs/60000)} minutes
- Sites: ${siteSumm}
- LeetCode solved total: ${t.leetcodeSolved||0}, today: ${t.leetcodeTodaySolved||0}
- GitHub commits today: ${t.githubTodayCommits||0}
- YouTube: ${vids.length} videos (${vids.filter(v=>v.educational).length} educational)
- Focus battles: ${batt.filter(b=>b.won).length} wins / ${batt.length} total
- XP today: ${t.todayXP||0}, Streak: ${t.streak||0} days

Write 4-5 sentences: (1) biggest win today, (2) one weakness or pattern to fix, (3) one concrete action for tomorrow. End with a brief Pokémon-themed encouragement.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:350,messages:[{role:'user',content:prompt}]})
      });
      const json=await res.json();
      if (json.error) throw new Error(json.error.message);
      document.getElementById('oak-result').innerHTML=`<div class="oak-result">${esc(json.content?.[0]?.text||'No response.')}</div>`;
    } catch(e) {
      document.getElementById('oak-result').innerHTML=`<div class="oak-result oak-err">Error: ${esc(e.message)}</div>`;
    }
    document.getElementById('oak-btn').disabled=false;
    document.getElementById('oak-loading').style.display='none';
  });
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  document.getElementById('oak-btn').addEventListener('click', generateOak);

  // Settings Modal toggling
  const settingsModal = document.getElementById('settings-modal');
  const settingsBtn = document.getElementById('settings-btn');
  const closeSettings = document.getElementById('close-settings');
  const ki = document.getElementById('api-key');

  if (settingsBtn && settingsModal && closeSettings) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('visible');
    });
    closeSettings.addEventListener('click', () => {
      settingsModal.classList.remove('visible');
    });
    settingsModal.addEventListener('click', e => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('visible');
      }
    });
  }

  // Anthropic API Key listener
  if (ki) {
    chrome.storage.local.get('oakKey', d => { if(d.oakKey) ki.value = d.oakKey; });
    ki.addEventListener('change', () => chrome.storage.local.set({ oakKey: ki.value }));
  }

  // Settings handles
  const nameInput = document.getElementById('trainer-name');
  const partnerInput = document.getElementById('partner-pokemon');
  const lcInput = document.getElementById('leetcode-username');
  const ghInput = document.getElementById('github-username');
  const cfInput = document.getElementById('codeforces-handle');
  const ccInput = document.getElementById('codechef-handle');
  const hrInput = document.getElementById('hackerrank-username');
  const trackingPausedInput = document.getElementById('tracking-paused');
  const syncBtn = document.getElementById('sync-now-btn');
  const syncStatus = document.getElementById('sync-status');
  const syncHeaderBtn = document.getElementById('sync-header-btn');
  const exportBtn = document.getElementById('export-data-btn');
  const exportStatus = document.getElementById('export-status');

  // Load handles and populate inputs
  chrome.runtime.sendMessage({type: 'GET_DATA'}, data => {
    if (data && data.trainer) {
      const t = data.trainer;
      if (nameInput && t.trainerName) nameInput.value = t.trainerName;
      if (partnerInput) partnerInput.value = t.partnerPokemon || 'pikachu';
      if (lcInput && t.leetcodeUsername) lcInput.value = t.leetcodeUsername;
      if (ghInput && t.githubUsername) ghInput.value = t.githubUsername;
      if (cfInput && t.codeforcesHandle) cfInput.value = t.codeforcesHandle;
      if (ccInput && t.codechefHandle) ccInput.value = t.codechefHandle;
      if (hrInput && t.hackerrankUsername) hrInput.value = t.hackerrankUsername;
      if (trackingPausedInput) trackingPausedInput.checked = Boolean(t.trackingPaused);
    }
  });

  // Save changes on inputs
  const saveFields = () => {
    const fields = {
      trainerName: nameInput ? nameInput.value.trim() : 'Trainer',
      partnerPokemon: partnerInput ? partnerInput.value : 'pikachu',
      leetcodeUsername: lcInput ? lcInput.value.trim() : '',
      githubUsername: ghInput ? ghInput.value.trim() : '',
      codeforcesHandle: cfInput ? cfInput.value.trim() : '',
      codechefHandle: ccInput ? ccInput.value.trim() : '',
      hackerrankUsername: hrInput ? hrInput.value.trim() : '',
      trackingPaused: trackingPausedInput ? trackingPausedInput.checked : false,
      onboarded: true
    };
    chrome.runtime.sendMessage({type: 'UPDATE_PROFILE', fields}, () => {
      // Refresh popup stats
      chrome.runtime.sendMessage({type: 'GET_DATA'}, refreshData => {
        if (refreshData) {
          renderHeader(refreshData);
          renderFocusDeck(refreshData);
          renderCaught(refreshData);
          renderRoute(refreshData);
          renderBattles(refreshData);
          renderGym(refreshData);
          renderOak(refreshData);
        }
      });
    });
  };

  [nameInput, partnerInput, lcInput, ghInput, cfInput, ccInput, hrInput, trackingPausedInput].forEach(inp => {
    if (inp) inp.addEventListener('change', saveFields);
  });

  // Sync handler action
  const triggerSync = (indicatorBtn) => {
    if (indicatorBtn) indicatorBtn.classList.add('spinning');
    if (syncStatus) {
      syncStatus.style.display = 'block';
      syncStatus.textContent = 'Syncing... 🔄';
      syncStatus.style.color = 'var(--muted)';
    }
    chrome.runtime.sendMessage({type: 'SYNC_ACCOUNTS'}, res => {
      if (indicatorBtn) indicatorBtn.classList.remove('spinning');
      if (res && res.success) {
        if (syncStatus) {
          const warnings = res.syncErrors || [];
          if (warnings.length) {
            syncStatus.textContent = 'Sync finished with warnings: ' + warnings.join(' | ');
            syncStatus.style.color = '#f59e0b';
          } else if (res.cachedProviders?.length) {
            syncStatus.textContent = 'Sync used recent data for ' + res.cachedProviders.join(', ') + '.';
            syncStatus.style.color = 'var(--muted)';
          } else {
            syncStatus.textContent = 'Sync Complete! ' + (res.xpEarned > 0 ? `+${res.xpEarned} XP!` : 'Up to date.');
            syncStatus.style.color = '#10b981';
          }
        }
        chrome.runtime.sendMessage({type: 'GET_DATA'}, refreshData => {
          if (refreshData) {
            renderHeader(refreshData);
            renderFocusDeck(refreshData);
            renderCaught(refreshData);
            renderRoute(refreshData);
            renderBattles(refreshData);
            renderGym(refreshData);
            renderOak(refreshData);
          }
        });
      } else {
        if (syncStatus) {
          syncStatus.textContent = 'Sync Failed: ' + (res?.error || 'Unknown error');
          syncStatus.style.color = 'var(--red-txt)';
        }
      }
      setTimeout(() => {
        if (syncStatus) syncStatus.style.display = 'none';
      }, res?.syncErrors?.length ? 10000 : 5000);
    });
  };

  // Bind reload/sync triggers
  if (syncBtn) {
    syncBtn.addEventListener('click', () => triggerSync(syncBtn));
  }
  if (syncHeaderBtn) {
    syncHeaderBtn.addEventListener('click', () => triggerSync(syncHeaderBtn));
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportBtn.disabled = true;
      if (exportStatus) {
        exportStatus.style.display = 'block';
        exportStatus.style.color = 'var(--muted)';
        exportStatus.textContent = 'Preparing export...';
      }
      chrome.runtime.sendMessage({type: 'EXPORT_DATA'}, res => {
        exportBtn.disabled = false;
        if (!res?.success) {
          if (exportStatus) {
            exportStatus.style.color = 'var(--red-txt)';
            exportStatus.textContent = 'Export failed: ' + (res?.error || 'Unknown error');
          }
          return;
        }

        const payload = {
          exportedAt: res.exportedAt,
          schemaVersion: res.schemaVersion,
          trainer: res.trainer,
          sessions: res.sessions || [],
          videos: res.videos || [],
          battles: res.battles || [],
          site_stats: res.site_stats || []
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pikadex-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        if (exportStatus) {
          exportStatus.style.color = '#10b981';
          exportStatus.textContent = `Exported ${payload.sessions.length} sessions, ${payload.videos.length} videos, ${payload.battles.length} battles.`;
          setTimeout(() => { exportStatus.style.display = 'none'; }, 6000);
        }
      });
    });
  }

  // Click handler for caught list to expand/collapse details
  const caughtList = document.getElementById('caught-list');
  if (caughtList) {
    caughtList.addEventListener('click', e => {
      const card = e.target.closest('.poke-card');
      if (card) {
        card.classList.toggle('expanded');
        const details = card.nextElementSibling;
        if (details && details.classList.contains('poke-details')) {
          details.classList.toggle('visible');
        }
      }
    });
  }

  chrome.runtime.sendMessage({type:'GET_DATA'}, data=>{
    if (!data) { console.warn('PikaDex: no data from background'); return; }
    
    const t = data.trainer || {};
    const shell = document.querySelector('.shell');
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    
    if (!t.onboarded) {
      if (shell) shell.style.display = 'none';
      if (onboardingOverlay) onboardingOverlay.style.display = 'flex';
      return;
    } else {
      if (shell) shell.style.display = '';
      if (onboardingOverlay) onboardingOverlay.style.display = 'none';
    }

    renderHeader(data);
    renderFocusDeck(data);
    renderCaught(data);
    renderRoute(data);
    renderBattles(data);
    renderGym(data);
    renderOak(data);

    // Auto-refresh stats list every 5 seconds to support live "and counting" clock updates
    setInterval(() => {
      chrome.runtime.sendMessage({type:'GET_DATA'}, refreshData => {
        if (refreshData && refreshData.trainer && refreshData.trainer.onboarded) {
          renderHeader(refreshData);
          renderFocusDeck(refreshData);
          renderCaught(refreshData);
          renderRoute(refreshData);
          renderBattles(refreshData);
          renderGym(refreshData);
        }
      });
    }, 5000);
  });

  const btnOpenOnboarding = document.getElementById('btn-open-onboarding');
  if (btnOpenOnboarding) {
    btnOpenOnboarding.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    });
  }
});

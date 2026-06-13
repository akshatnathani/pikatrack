const DB_NAME = 'pikadex_v3';
let db = null;

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});

function openDB() {
  return new Promise((res, rej) => {
    if (db) return res(db);
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      ['sessions','videos','battles'].forEach(s => {
        if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, {keyPath:'id',autoIncrement:true});
      });
      if (!d.objectStoreNames.contains('trainer')) d.createObjectStore('trainer', {keyPath:'key'});
      if (!d.objectStoreNames.contains('site_stats')) d.createObjectStore('site_stats', {keyPath:'domain'});
    };
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror = () => rej(req.error);
  });
}

function dbGet(store, key) {
  return openDB().then(d => new Promise((res, rej) => {
    const req = d.transaction(store,'readonly').objectStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  }));
}
function dbPut(store, data) {
  return openDB().then(d => new Promise((res, rej) => {
    const req = d.transaction(store,'readwrite').objectStore(store).put(data);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  }));
}
function dbAdd(store, data) {
  return openDB().then(d => new Promise((res, rej) => {
    const req = d.transaction(store,'readwrite').objectStore(store).add(data);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  }));
}
function dbGetAll(store) {
  return openDB().then(d => new Promise((res, rej) => {
    const req = d.transaction(store,'readonly').objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  }));
}

// Always returns a valid trainer profile, creating one if needed
async function getOrCreateTrainer() {
  let t = await dbGet('trainer','profile');
  if (!t) {
    t = {
      key:'profile', totalXP:0, todayXP:0, level:1,
      lastDate:'', streak:0, totalFocusMs:0, todayFocusMs:0,
      leetcodeSolved:0, leetcodeTodaySolved:0,
      githubCommits:0, githubTodayCommits:0,
      lastEvoStage:'pichu',
      trainerName: 'Trainer',
      onboarded: false,
      
      // New profile fields
      leetcodeUsername: '',
      githubUsername: '',
      codeforcesHandle: '',
      codechefHandle: '',
      hackerrankUsername: '',
      
      lastLeetCodeSolved: 0,
      lastGitHubCommits: 0,
      lastGitHubPRs: 0,
      lastGitHubIssues: 0,
      
      educationalVideoMinutes: 0,
      entertainmentVideoMinutes: 0,
      lastSyncTime: 0
    };
    await dbPut('trainer', t);
  }

  // Backwards compatibility upgrade
  let updated = false;
  const defaults = {
    trainerName: 'Trainer',
    onboarded: true,
    leetcodeUsername: '',
    githubUsername: '',
    codeforcesHandle: '',
    codechefHandle: '',
    hackerrankUsername: '',
    lastLeetCodeSolved: 0,
    lastGitHubCommits: 0,
    lastGitHubPRs: 0,
    lastGitHubIssues: 0,
    educationalVideoMinutes: 0,
    entertainmentVideoMinutes: 0,
    lastSyncTime: 0,
    categorySeconds: {
      'Development': 0,
      'Learning': 0,
      'Entertainment': 0,
      'Social': 0,
      'AI Tools': 0,
      'General': 0
    },
    githubRepos: {},
    leetcodeProblems: {},
    chatgptTodayCount: 0,
    chatgptTotalCount: 0
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (t[k] === undefined) {
      t[k] = JSON.parse(JSON.stringify(v));
      updated = true;
    }
  }
  if (updated) {
    await dbPut('trainer', t);
  }

  // Reset today fields if new day
  const today = new Date().toDateString();
  if (t.lastDate !== today) {
    t.todayXP = 0;
    t.todayFocusMs = 0;
    t.leetcodeTodaySolved = 0;
    t.githubTodayCommits = 0;
    t.chatgptTodayCount = 0;
    t.githubRepos = {};
    t.leetcodeProblems = {};
    t.categorySeconds = {
      'Development': 0,
      'Learning': 0,
      'Entertainment': 0,
      'Social': 0,
      'AI Tools': 0,
      'General': 0
    };
    t.lastDate = today;
    await dbPut('trainer', t);
  }
  return t;
}

const SITE_CONFIG = {
  'github.com':        {type:'Development',    xpPerMin:2.5, icon:'🐙'},
  'leetcode.com':      {type:'Training Ground', xpPerMin:3.5, icon:'💻'},
  'youtube.com':       {type:'Entertainment',   xpPerMin:0.3, icon:'▶️'},
  'chatgpt.com':       {type:'AI Assistant',    xpPerMin:1.8, icon:'🤖'},
  'claude.ai':         {type:'AI Assistant',    xpPerMin:1.8, icon:'⚡'},
  'stackoverflow.com': {type:'Research',        xpPerMin:1.8, icon:'📚'},
  'notion.so':         {type:'Productivity',    xpPerMin:1.2, icon:'📝'},
  'docs.google.com':   {type:'Productivity',    xpPerMin:1.0, icon:'📄'},
  'medium.com':        {type:'Research',        xpPerMin:1.0, icon:'📰'},
  'twitter.com':       {type:'Social',          xpPerMin:0.2, icon:'🐦'},
  'x.com':             {type:'Social',          xpPerMin:0.2, icon:'🐦'},
  'reddit.com':        {type:'Social',          xpPerMin:0.2, icon:'🤿'},
  'linkedin.com':      {type:'Networking',      xpPerMin:0.8, icon:'💼'},
};

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.',''); } catch { return null; }
}
function getSiteInfo(domain) {
  for (const k of Object.keys(SITE_CONFIG)) {
    if (domain.includes(k)) return {...SITE_CONFIG[k], domain};
  }
  return {type:'General', xpPerMin:0.5, icon:'🌐', domain};
}

// Evolution based on TODAY's focus hours
// Pichu: default, Pikachu: 3h+, Raichu: 10h+
function getEvoStage(todayFocusMs) {
  const h = todayFocusMs / 3600000;
  if (h >= 10) return 'raichu';
  if (h >= 3)  return 'pikachu';
  return 'pichu';
}

// --- Active Time Engine Variables and Helpers ---
let lastFocusedWindowId = null;

// Initialize lastFocusedWindowId
chrome.windows.getLastFocused({ populate: false }, window => {
  if (window) lastFocusedWindowId = window.id;
});

// Close stale sessions at startup
chrome.runtime.onStartup.addListener(async () => {
  await closeCurrentSession();
  await closeCurrentVideo();
});

const EDU_KEYWORDS = ['tutorial', 'course', 'learn', 'explained', 'how to', 'guide', 'lecture', 'coding', 'programming', 'react', 'flutter', 'javascript', 'typescript', 'python', 'java', 'c++', 'leetcode', 'system design', 'machine learning', 'data science', 'ai', 'neural', 'database', 'backend', 'frontend', 'devops', 'aws', 'cloud', 'interview', 'algorithm', 'development', 'engineering', 'mathematics', 'science', 'physics', 'history', 'documentary', 'crash course', 'fundamentals', 'introduction', 'deep dive', 'computer science'];
function isEdu(title) {
  if (!title) return false;
  const t = title.toLowerCase();
  return EDU_KEYWORDS.some(k => t.includes(k));
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

async function closeCurrentSession() {
  const data = await chrome.storage.local.get(['currentSession']);
  if (data.currentSession) {
    const sess = data.currentSession;
    const durationMs = sess.accumulatedSeconds * 1000;
    
    // Only log if we accumulated at least 5 seconds
    if (durationMs >= 5000) {
      const info = getSiteInfo(sess.domain);
      const mins = durationMs / 60000;
      const xp = Math.round(mins * info.xpPerMin);
      const date = new Date().toDateString();

      // Log session
      await dbAdd('sessions', {
        domain: sess.domain,
        type: info.type,
        startTime: sess.startTime,
        endTime: sess.lastHeartbeatTime,
        durationMs,
        xp,
        date
      });

      // Update trainer focus time & XP
      const t = await getOrCreateTrainer();
      t.totalXP += xp;
      t.todayXP += xp;
      t.totalFocusMs = (t.totalFocusMs || 0) + durationMs;
      t.todayFocusMs = (t.todayFocusMs || 0) + durationMs;
      t.level = Math.floor(t.totalXP / 500) + 1;

      // Handle evolution
      const newEvo = getEvoStage(t.todayFocusMs);
      if (newEvo !== (t.lastEvoStage || 'pichu')) {
        t.lastEvoStage = newEvo;
        chrome.tabs.query({ active: true }, tabs => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              type: 'PIKA_EVOLVE',
              stage: newEvo,
              text: newEvo === 'pikachu' ? '3 hours! ⚡ Evolved to Pikachu!' : '10 hours!! ⚡⚡ RAICHU FORM!'
            }).catch(() => {});
          });
        });
      }
      await dbPut('trainer', t);

      // Log battle if >= 2 minutes (120,000ms)
      if (durationMs >= 120000) {
        let won = true;
        let battleXp = xp;

        if (info.type === 'Social') {
          won = false;
          battleXp = 0;
        } else if (info.type === 'Entertainment') {
          const vids = await dbGetAll('videos');
          const sessionVids = vids.filter(v => v.timestamp >= sess.startTime && v.timestamp <= sess.lastHeartbeatTime);
          const hasEdu = sessionVids.some(v => v.educational);
          if (hasEdu) {
            won = true;
          } else {
            won = false;
            battleXp = Math.round(xp * 0.2);
          }
        }
        await dbAdd('battles', {
          domain: sess.domain,
          durationMs,
          won,
          xp: battleXp,
          date,
          timestamp: Date.now()
        });
      }
    }
    await chrome.storage.local.remove(['currentSession']);
  }
}

async function closeCurrentVideo() {
  const data = await chrome.storage.local.get(['currentVideo']);
  if (data.currentVideo) {
    const v = data.currentVideo;
    if (v.watchSeconds >= 5) {
      const date = new Date().toDateString();
      const durationMins = Math.round(v.watchSeconds / 60);

      // Log YouTube watch record
      await dbAdd('videos', {
        video_id: v.video_id,
        title: v.title,
        channel: v.channel,
        startedAt: v.startedAt,
        endedAt: v.lastHeartbeatTime,
        watchSeconds: v.watchSeconds,
        educational: v.educational,
        date,
        // Keep existing fields for backward compatibility
        durationMins: durationMins || 1,
        url: 'https://www.youtube.com/watch?v=' + v.video_id,
        category: v.educational ? 'Educational' : 'Entertainment',
        timestamp: v.startedAt
      });

      // Award XP
      const t = await getOrCreateTrainer();
      const xp = v.educational ? 15 : 5;
      t.totalXP += xp;
      t.todayXP += xp;
      if (v.educational) {
        t.educationalVideoMinutes = (t.educationalVideoMinutes || 0) + (durationMins || 1);
      } else {
        t.entertainmentVideoMinutes = (t.entertainmentVideoMinutes || 0) + (durationMins || 1);
      }
      t.level = Math.floor(t.totalXP / 500) + 1;
      await dbPut('trainer', t);
    }
    await chrome.storage.local.remove(['currentVideo']);
  }
}

async function updateSiteStats(domain, seconds) {
  let stats = await dbGet('site_stats', domain);
  const today = new Date().toDateString();
  if (!stats) {
    stats = {
      domain,
      todaySeconds: seconds,
      totalSeconds: seconds,
      lastVisit: Date.now()
    };
  } else {
    const lastVisitDate = new Date(stats.lastVisit).toDateString();
    if (lastVisitDate !== today) {
      stats.todaySeconds = seconds;
    } else {
      stats.todaySeconds += seconds;
    }
    stats.totalSeconds += seconds;
    stats.lastVisit = Date.now();
  }
  await dbPut('site_stats', stats);
}

async function updateCategorySeconds(category, seconds) {
  const t = await getOrCreateTrainer();
  t.categorySeconds = t.categorySeconds || {
    'Development': 0,
    'Learning': 0,
    'Entertainment': 0,
    'Social': 0,
    'AI Tools': 0,
    'General': 0
  };
  t.categorySeconds[category] = (t.categorySeconds[category] || 0) + seconds;
  await dbPut('trainer', t);
}

async function updateGitHubRepoStats(repo, seconds) {
  const t = await getOrCreateTrainer();
  t.githubRepos = t.githubRepos || {};
  t.githubRepos[repo] = (t.githubRepos[repo] || 0) + seconds;
  await dbPut('trainer', t);
}

async function updateLeetCodeProblemStats(problem, seconds) {
  const t = await getOrCreateTrainer();
  t.leetcodeProblems = t.leetcodeProblems || {};
  if (!t.leetcodeProblems[problem]) {
    t.leetcodeProblems[problem] = { seconds: 0, lastVisited: Date.now() };
  }
  t.leetcodeProblems[problem].seconds += seconds;
  t.leetcodeProblems[problem].lastVisited = Date.now();
  await dbPut('trainer', t);
}

async function handleHeartbeat(msg, sender) {
  if (!sender.tab || !sender.tab.active || sender.tab.windowId !== lastFocusedWindowId) {
    return;
  }

  const isValid = msg.visible && msg.userActive;
  const storage = await chrome.storage.local.get(['currentSession', 'currentVideo']);
  let sess = storage.currentSession;
  let vid = storage.currentVideo;
  const now = Date.now();

  if (isValid) {
    // 1. Process Site Session
    if (sess) {
      const isSameDomain = (sess.domain === msg.domain);
      const isSuspended = (now - sess.lastHeartbeatTime > 15000); // > 15s gap

      if (isSameDomain && !isSuspended) {
        sess.lastHeartbeatTime = now;
        sess.accumulatedSeconds += 5;
      } else {
        await closeCurrentSession();
        sess = {
          domain: msg.domain,
          startTime: now,
          lastHeartbeatTime: now,
          accumulatedSeconds: 5
        };
      }
    } else {
      sess = {
        domain: msg.domain,
        startTime: now,
        lastHeartbeatTime: now,
        accumulatedSeconds: 5
      };
    }

    // Save/Update site_stats in IndexedDB
    await updateSiteStats(msg.domain, 5);

    // Update productivity category seconds in trainer profile
    const info = getSiteInfo(msg.domain);
    const category = getProductivityCategory(info.type);
    await updateCategorySeconds(category, 5);

    // Update GitHub repository stats in trainer profile
    if (msg.domain === 'github.com' && msg.githubRepo) {
      await updateGitHubRepoStats(msg.githubRepo, 5);
    }

    // Update LeetCode problem stats in trainer profile
    if (msg.domain === 'leetcode.com' && msg.leetcodeProblem) {
      await updateLeetCodeProblemStats(msg.leetcodeProblem, 5);
    }

    // 2. Process YouTube video watch session
    if (msg.domain.includes('youtube.com') && msg.youtube && msg.youtube.videoId) {
      const yt = msg.youtube;
      const isVideoPlaying = yt.isPlaying;

      if (isVideoPlaying) {
        if (vid) {
          const isSameVideo = (vid.video_id === yt.videoId);
          const isVidSuspended = (now - vid.lastHeartbeatTime > 15000);

          if (isSameVideo && !isVidSuspended) {
            vid.lastHeartbeatTime = now;
            vid.watchSeconds += 5;
            
            // Dynamic self-healing: update title, educational status, and channel if they were empty initially
            if (!vid.title && yt.title) {
              vid.title = yt.title;
              vid.educational = isEdu(yt.title);
            }
            if (!vid.channel && yt.channel) {
              vid.channel = yt.channel;
            }
          } else {
            await closeCurrentVideo();
            const educational = isEdu(yt.title);
            vid = {
              video_id: yt.videoId,
              title: yt.title,
              channel: yt.channel,
              startedAt: now,
              lastHeartbeatTime: now,
              watchSeconds: 5,
              educational
            };
          }
        } else {
          const educational = isEdu(yt.title);
          vid = {
            video_id: yt.videoId,
            title: yt.title,
            channel: yt.channel,
            startedAt: now,
            lastHeartbeatTime: now,
            watchSeconds: 5,
            educational
          };
        }
      } else {
        if (vid && vid.video_id === yt.videoId) {
          vid.lastHeartbeatTime = now;
        }
      }
    } else {
      if (vid) {
        await closeCurrentVideo();
        vid = null;
      }
    }
  } else {
    // Invalid (idle or visible is false)
    if (sess) {
      await closeCurrentSession();
      sess = null;
    }
    if (vid) {
      await closeCurrentVideo();
      vid = null;
    }
  }

  // Persist updated states to storage
  const toSet = {};
  if (sess) {
    toSet.currentSession = sess;
  } else {
    await chrome.storage.local.remove(['currentSession']);
  }
  if (vid) {
    toSet.currentVideo = vid;
  } else {
    await chrome.storage.local.remove(['currentVideo']);
  }
  
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }
}

// Proactive listeners to end sessions immediately on tab/window changes
chrome.tabs.onActivated.addListener(async ({tabId}) => {
  await closeCurrentSession();
  await closeCurrentVideo();
});
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status==='complete' && tab.active) {
    await closeCurrentSession();
    await closeCurrentVideo();
  }
});
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await closeCurrentSession();
  await closeCurrentVideo();
});
chrome.windows.onFocusChanged.addListener(async (wid) => {
  lastFocusedWindowId = wid;
  await closeCurrentSession();
  await closeCurrentVideo();
});

// ── SYNC SYSTEM API INTEGRATIONS ─────────────────────────────
async function fetchLeetCodeStats(username) {
  try {
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
        recentSubmissionList(username: $username, limit: 20) {
          timestamp
          statusDisplay
          titleSlug
        }
      }
    `;
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username } })
    });
    if (!res.ok) throw new Error('LeetCode GraphQL error');
    const json = await res.json();
    const stats = json?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
    const submissions = json?.data?.recentSubmissionList || [];

    // Calculate solved today (local timezone check)
    const startOfTodaySec = new Date().setHours(0,0,0,0) / 1000;
    const solvedTodaySlugs = new Set();
    submissions.forEach(sub => {
      if (sub.statusDisplay === 'Accepted' && parseInt(sub.timestamp) >= startOfTodaySec) {
        solvedTodaySlugs.add(sub.titleSlug);
      }
    });
    const solvedToday = solvedTodaySlugs.size;

    if (stats) {
      const all = stats.find(s => s.difficulty === 'All')?.count || 0;
      const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
      const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
      const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
      return { all, easy, medium, hard, solvedToday };
    }
  } catch (err) {
    console.warn('LeetCode GraphQL failed, trying fallback API:', err);
  }

  // Heroku Fallback
  const fallbackRes = await fetch(`https://leetcode-api-v2.herokuapp.com/api/userProfile/${username}`);
  if (!fallbackRes.ok) throw new Error('LeetCode profile fallback API failed');
  const fallbackData = await fallbackRes.json();
  const stats = fallbackData.matchedUser?.submitStatsGlobal?.acSubmissionNum;
  if (!stats) throw new Error('Invalid fallback response structure');
  
  const submissions = fallbackData.recentSubmissions || [];
  const startOfTodaySec = new Date().setHours(0,0,0,0) / 1000;
  const solvedTodaySlugs = new Set();
  submissions.forEach(sub => {
    let ts = parseInt(sub.timestamp);
    if (isNaN(ts)) ts = new Date(sub.timestamp).getTime() / 1000;
    if (sub.statusDisplay === 'Accepted' && ts >= startOfTodaySec) {
      solvedTodaySlugs.add(sub.titleSlug || sub.title);
    }
  });
  const solvedToday = solvedTodaySlugs.size;

  const all = stats.find(s => s.difficulty === 'All')?.count || 0;
  const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
  const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
  const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
  return { all, easy, medium, hard, solvedToday };
}

async function fetchGitHubStats(username) {
  let commits = 0;
  let prs = 0;
  let issues = 0;
  let repos = 0;
  
  let commitsToday = 0;
  let prsToday = 0;
  let issuesToday = 0;

  const todayISO = new Date().toISOString().split('T')[0];

  // 1. Commits Total & Today
  try {
    const commitRes = await fetch(`https://api.github.com/search/commits?q=author:${username}&sort=author-date&order=desc&per_page=100`, {
      headers: { 'Accept': 'application/vnd.github.cloak-preview+json' }
    });
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      commits = commitData.total_count || 0;
      
      const items = commitData.items || [];
      commitsToday = items.filter(item => {
        const dateStr = item.commit?.author?.date;
        return dateStr && dateStr.startsWith(todayISO);
      }).length;
    }
  } catch (e) {
    console.error('Error fetching GitHub commits:', e);
  }

  // 2. PRs Total & Today
  try {
    const prRes = await fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr&sort=created&order=desc&per_page=100`);
    if (prRes.ok) {
      const prData = await prRes.json();
      prs = prData.total_count || 0;
      
      const items = prData.items || [];
      prsToday = items.filter(item => {
        const dateStr = item.created_at;
        return dateStr && dateStr.startsWith(todayISO);
      }).length;
    }
  } catch (e) {
    console.error('Error fetching GitHub PRs:', e);
  }

  // 3. Issues Total & Today
  try {
    const issueRes = await fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue&sort=created&order=desc&per_page=100`);
    if (issueRes.ok) {
      const issueData = await issueRes.json();
      issues = issueData.total_count || 0;
      
      const items = issueData.items || [];
      issuesToday = items.filter(item => {
        const dateStr = item.created_at;
        return dateStr && dateStr.startsWith(todayISO);
      }).length;
    }
  } catch (e) {
    console.error('Error fetching GitHub issues:', e);
  }

  // 4. Public Repos
  try {
    const repoRes = await fetch(`https://api.github.com/users/${username}`);
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      repos = repoData.public_repos || 0;
    }
  } catch (e) {
    console.error('Error fetching GitHub user info:', e);
  }

  return { commits, prs, issues, repos, commitsToday, prsToday, issuesToday };
}

async function syncAccounts() {
  const t = await getOrCreateTrainer();
  let xpEarned = 0;
  let logEvents = [];
  const date = new Date().toDateString();

  // 1. Sync LeetCode
  if (t.leetcodeUsername) {
    try {
      const stats = await fetchLeetCodeStats(t.leetcodeUsername);
      const prevSolved = t.lastLeetCodeSolved || t.leetcodeSolved || 0;
      
      // Set baseline if first sync
      if (prevSolved === 0 && (t.lastLeetCodeSolved === undefined || t.lastLeetCodeSolved === 0)) {
        t.lastLeetCodeSolved = stats.all;
        t.leetcodeSolved = stats.all;
        t.leetcodeTodaySolved = stats.solvedToday;

        // Award XP for today's solves on first connection
        if (stats.solvedToday > 0) {
          const xp = stats.solvedToday * 50;
          t.totalXP += xp;
          t.todayXP += xp;
          for (let i = 0; i < stats.solvedToday; i++) {
            await dbAdd('sessions', {domain: 'leetcode.com', type: 'Training Ground', startTime: Date.now(), endTime: Date.now(), durationMs: 0, xp: 50, date});
            await dbAdd('battles', {domain: 'leetcode.com', durationMs: 0, won: true, xp: 50, date, timestamp: Date.now()});
          }
          xpEarned += xp;
          logEvents.push(`Connected LeetCode: +${stats.solvedToday} Solves Today (+${xp} XP)`);
        }
      } else {
        // Sync today count directly from LeetCode
        t.leetcodeTodaySolved = stats.solvedToday;

        if (stats.all > prevSolved) {
          const diff = stats.all - prevSolved;
          const xp = diff * 50;
          t.totalXP += xp;
          t.todayXP += xp;
          t.leetcodeSolved = stats.all;

          // Log events in history
          for (let i = 0; i < diff; i++) {
            await dbAdd('sessions', {domain: 'leetcode.com', type: 'Training Ground', startTime: Date.now(), endTime: Date.now(), durationMs: 0, xp: 50, date});
            await dbAdd('battles', {domain: 'leetcode.com', durationMs: 0, won: true, xp: 50, date, timestamp: Date.now()});
          }
          xpEarned += xp;
          logEvents.push(`+${diff} LeetCode Solves (+${xp} XP)`);
        }
      }
      t.lastLeetCodeSolved = stats.all;
    } catch (e) {
      console.error('Error syncing LeetCode:', e);
    }
  }

  // 2. Sync GitHub
  if (t.githubUsername) {
    try {
      const stats = await fetchGitHubStats(t.githubUsername);
      const prevCommits = t.lastGitHubCommits || t.githubCommits || 0;
      const prevPRs = t.lastGitHubPRs || 0;
      const prevIssues = t.lastGitHubIssues || 0;

      // Commits
      if (prevCommits === 0 && (t.lastGitHubCommits === undefined || t.lastGitHubCommits === 0)) {
        t.lastGitHubCommits = stats.commits;
        t.githubCommits = stats.commits;
        t.githubTodayCommits = stats.commitsToday;

        // Award XP for today's commits on first connection
        if (stats.commitsToday > 0) {
          const xp = stats.commitsToday * 30;
          t.totalXP += xp;
          t.todayXP += xp;
          for (let i = 0; i < stats.commitsToday; i++) {
            await dbAdd('sessions', {domain: 'github.com', type: 'Development', startTime: Date.now(), endTime: Date.now(), durationMs: 0, xp: 30, date});
            await dbAdd('battles', {domain: 'github.com', durationMs: 0, won: true, xp: 30, date, timestamp: Date.now()});
          }
          xpEarned += xp;
          logEvents.push(`Connected GitHub: +${stats.commitsToday} Commits Today (+${xp} XP)`);
        }
      } else {
        // Sync today commits directly
        t.githubTodayCommits = stats.commitsToday;

        if (stats.commits > prevCommits) {
          const diff = stats.commits - prevCommits;
          const xp = diff * 30;
          t.totalXP += xp;
          t.todayXP += xp;
          t.githubCommits = stats.commits;

          for (let i = 0; i < diff; i++) {
            await dbAdd('sessions', {domain: 'github.com', type: 'Development', startTime: Date.now(), endTime: Date.now(), durationMs: 0, xp: 30, date});
            await dbAdd('battles', {domain: 'github.com', durationMs: 0, won: true, xp: 30, date, timestamp: Date.now()});
          }
          xpEarned += xp;
          logEvents.push(`+${diff} GitHub Commits (+${xp} XP)`);
        }
      }

      // PRs (subsequent / first sync)
      if (prevPRs === 0 && t.lastGitHubPRs === 0) {
        t.lastGitHubPRs = stats.prs;
        // Award XP for today's PRs on first sync
        if (stats.prsToday > 0) {
          const xp = stats.prsToday * 50;
          t.totalXP += xp;
          t.todayXP += xp;
          for (let i = 0; i < stats.prsToday; i++) {
            await dbAdd('sessions', {domain: 'github.com', type: 'Development', startTime: Date.now(), endTime: Date.now(), durationMs: 0, xp: 50, date});
            await dbAdd('battles', {domain: 'github.com', durationMs: 0, won: true, xp: 50, date, timestamp: Date.now()});
          }
          xpEarned += xp;
          logEvents.push(`Connected GitHub: +${stats.prsToday} PRs Today (+${xp} XP)`);
        }
      } else if (stats.prs > prevPRs) {
        const diff = stats.prs - prevPRs;
        const xp = diff * 50;
        t.totalXP += xp;
        t.todayXP += xp;

        for (let i = 0; i < diff; i++) {
          await dbAdd('sessions', {domain: 'github.com', type: 'Development', startTime: Date.now(), endTime: Date.now(), durationMs: 0, xp: 50, date});
          await dbAdd('battles', {domain: 'github.com', durationMs: 0, won: true, xp: 50, date, timestamp: Date.now()});
        }
        xpEarned += xp;
        logEvents.push(`+${diff} GitHub PRs (+${xp} XP)`);
      }

      // Issues (subsequent / first sync)
      if (prevIssues === 0 && t.lastGitHubIssues === 0) {
        t.lastGitHubIssues = stats.issues;
        // Award XP for today's issues on first sync
        if (stats.issuesToday > 0) {
          const xp = stats.issuesToday * 20;
          t.totalXP += xp;
          t.todayXP += xp;
          for (let i = 0; i < stats.issuesToday; i++) {
            await dbAdd('sessions', {domain: 'github.com', type: 'Development', startTime: Date.now(), endTime: Date.now(), durationMs: 0, xp: 20, date});
            await dbAdd('battles', {domain: 'github.com', durationMs: 0, won: true, xp: 20, date, timestamp: Date.now()});
          }
          xpEarned += xp;
          logEvents.push(`Connected GitHub: +${stats.issuesToday} Issues Today (+${xp} XP)`);
        }
      } else if (stats.issues > prevIssues) {
        const diff = stats.issues - prevIssues;
        const xp = diff * 20;
        t.totalXP += xp;
        t.todayXP += xp;

        for (let i = 0; i < diff; i++) {
          await dbAdd('sessions', {domain: 'github.com', type: 'Development', startTime: Date.now(), endTime: Date.now(), durationMs: 0, xp: 20, date});
          await dbAdd('battles', {domain: 'github.com', durationMs: 0, won: true, xp: 20, date, timestamp: Date.now()});
        }
        xpEarned += xp;
        logEvents.push(`+${diff} GitHub Issues (+${xp} XP)`);
      }

      t.lastGitHubCommits = stats.commits;
      t.lastGitHubPRs = stats.prs;
      t.lastGitHubIssues = stats.issues;
    } catch (e) {
      console.error('Error syncing GitHub:', e);
    }
  }

  t.level = Math.floor(t.totalXP/500)+1;
  t.lastSyncTime = Date.now();
  await dbPut('trainer', t);

  return { success: true, xpEarned, logEvents, lastSyncTime: t.lastSyncTime };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type==='GET_DATA') {
    Promise.all([getOrCreateTrainer(), dbGetAll('sessions'), dbGetAll('videos'), dbGetAll('battles'), dbGetAll('site_stats')])
      .then(async ([trainer,sessions,videos,battles,site_stats]) => {
        // Fetch current active session and video from storage
        const storage = await chrome.storage.local.get(['currentSession', 'currentVideo']);
        
        let liveXp = 0;
        if (storage.currentSession) {
          const sess = storage.currentSession;
          const durationMs = sess.accumulatedSeconds * 1000;
          const info = getSiteInfo(sess.domain);
          const mins = durationMs / 60000;
          const xp = Math.round(mins * info.xpPerMin);
          liveXp += xp;
          
          sessions.push({
            domain: sess.domain,
            type: info.type,
            startTime: sess.startTime,
            endTime: sess.lastHeartbeatTime,
            durationMs,
            xp,
            date: new Date().toDateString(),
            inProgress: true
          });
        }

        if (storage.currentVideo) {
          const v = storage.currentVideo;
          if (v.watchSeconds >= 5) {
            const durationMins = Math.round(v.watchSeconds / 60);
            const xp = v.educational ? 15 : 5;
            liveXp += xp;
            
            videos.push({
              video_id: v.video_id,
              title: v.title,
              channel: v.channel,
              startedAt: v.startedAt,
              endedAt: v.lastHeartbeatTime,
              watchSeconds: v.watchSeconds,
              educational: v.educational,
              date: new Date().toDateString(),
              durationMins: durationMins || 1,
              url: 'https://www.youtube.com/watch?v=' + v.video_id,
              category: v.educational ? 'Educational' : 'Entertainment',
              timestamp: v.startedAt,
              inProgress: true
            });
          }
        }

        // Clone trainer to avoid mutating cached database profile directly
        const clonedTrainer = JSON.parse(JSON.stringify(trainer));
        clonedTrainer.todayXP = (clonedTrainer.todayXP || 0) + liveXp;
        clonedTrainer.totalXP = (clonedTrainer.totalXP || 0) + liveXp;
        clonedTrainer.level = Math.floor(clonedTrainer.totalXP/500)+1;

        sendResponse({trainer: clonedTrainer, sessions, videos, battles, site_stats});
      });
    return true;
  }

  if (msg.type==='UPDATE_PROFILE') {
    getOrCreateTrainer().then(async t => {
      Object.assign(t, msg.fields);
      await dbPut('trainer', t);
      sendResponse({ok:true});
    });
    return true;
  }

  if (msg.type==='SYNC_ACCOUNTS') {
    syncAccounts()
      .then(res => sendResponse(res))
      .catch(err => sendResponse({success:false, error:err.message}));
    return true;
  }

  if (msg.type==='LEETCODE_SOLVED') {
    sendResponse({ok:true});
    return true;
  }

  if (msg.type==='GITHUB_COMMIT') {
    sendResponse({ok:true});
    return true;
  }

  if (msg.type==='VIDEO_WATCHED') {
    // Left for backward compatibility, though handled via HEARTBEAT
    sendResponse({ok:true});
    return true;
  }

  if (msg.type==='CHATGPT_MESSAGE_SENT') {
    getOrCreateTrainer().then(async t => {
      t.chatgptTodayCount = (t.chatgptTodayCount || 0) + 1;
      t.chatgptTotalCount = (t.chatgptTotalCount || 0) + 1;
      await dbPut('trainer', t);
      sendResponse({ok:true});
    });
    return true;
  }

  if (msg.type==='HEARTBEAT') {
    handleHeartbeat(msg, sender).then(() => {
      sendResponse({ok:true});
    });
    return true;
  }

  if (msg.type==='PING') { sendResponse({ok:true}); return true; }
});

// Midnight reset
function nextMidnight() { const d=new Date(); d.setHours(24,0,0,0); return d.getTime(); }
chrome.alarms.create('midnight', {when:nextMidnight(), periodInMinutes:1440});
chrome.alarms.create('sync_profiles', {periodInMinutes:20});

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name==='midnight') {
    const t = await getOrCreateTrainer();
    t.streak = (t.todayXP||0) >= 100 ? (t.streak||0)+1 : 0;
    t.todayXP = 0;
    t.todayFocusMs = 0;
    t.leetcodeTodaySolved = 0;
    t.githubTodayCommits = 0;
    t.chatgptTodayCount = 0;
    t.githubRepos = {};
    t.leetcodeProblems = {};
    t.categorySeconds = {
      'Development': 0,
      'Learning': 0,
      'Entertainment': 0,
      'Social': 0,
      'AI Tools': 0,
      'General': 0
    };
    t.lastEvoStage = 'pichu'; // Reset daily
    t.lastDate = new Date().toDateString();
    await dbPut('trainer', t);
  } else if (alarm.name === 'sync_profiles') {
    await syncAccounts();
  }
});

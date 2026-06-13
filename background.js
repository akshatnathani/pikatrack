const DB_NAME = 'pikadex_v3';
const DB_VERSION = 3;
const POPUP_RECORD_LIMIT = 350;
const SYNC_CACHE_TTL_MS = 5 * 60 * 1000;
let db = null;

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});

function openDB() {
  return new Promise((res, rej) => {
    if (db) return res(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      const tx = e.target.transaction;
      const ensureStore = (name, options) => (
        d.objectStoreNames.contains(name)
          ? tx.objectStore(name)
          : d.createObjectStore(name, options)
      );
      const ensureIndex = (store, name, keyPath) => {
        if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, { unique: false });
      };

      const sessions = ensureStore('sessions', {keyPath:'id',autoIncrement:true});
      const videos = ensureStore('videos', {keyPath:'id',autoIncrement:true});
      const battles = ensureStore('battles', {keyPath:'id',autoIncrement:true});
      ensureStore('trainer', {keyPath:'key'});
      const siteStats = ensureStore('site_stats', {keyPath:'domain'});

      [sessions, videos, battles].forEach(store => {
        ensureIndex(store, 'date', 'date');
        ensureIndex(store, 'domain', 'domain');
        ensureIndex(store, 'timestamp', 'timestamp');
      });
      ensureIndex(videos, 'video_id', 'video_id');
      ensureIndex(siteStats, 'lastVisit', 'lastVisit');
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

function getRecordTime(item = {}) {
  return Number(item.timestamp || item.endTime || item.startedAt || item.startTime || item.lastVisit || 0);
}

function limitForPopup(records = [], limit = POPUP_RECORD_LIMIT) {
  const today = new Date().toDateString();
  const todayRecords = records.filter(item => item.date === today);
  const olderRecords = records
    .filter(item => item.date !== today)
    .sort((a, b) => getRecordTime(b) - getRecordTime(a))
    .slice(0, Math.max(0, limit - todayRecords.length));
  return [...todayRecords, ...olderRecords].sort((a, b) => getRecordTime(a) - getRecordTime(b));
}

function limitSiteStatsForPopup(records = [], limit = POPUP_RECORD_LIMIT) {
  return [...records]
    .sort((a, b) => getRecordTime(b) - getRecordTime(a))
    .slice(0, limit);
}

async function getFullDataPayload() {
  const [trainer, sessions, videos, battles, site_stats] = await Promise.all([
    getOrCreateTrainer(),
    dbGetAll('sessions'),
    dbGetAll('videos'),
    dbGetAll('battles'),
    dbGetAll('site_stats')
  ]);
  return { trainer, sessions, videos, battles, site_stats };
}

function resetDailyTrainerFields(t, today) {
  if (t.lastDate && t.lastDate !== today) {
    t.streak = (t.todayXP || 0) >= 100 ? (t.streak || 0) + 1 : 0;
  }
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
  t.lastEvoStage = 'pichu';
  t.lastDate = today;
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
      partnerPokemon: 'pikachu',
      trackingPaused: false,
      
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
    partnerPokemon: 'pikachu',
    trackingPaused: false,
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
    resetDailyTrainerFields(t, today);
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
const HEARTBEAT_SECONDS = 5;
const HEARTBEAT_SUSPEND_MS = 15000;
const MAX_COUNTED_HEARTBEAT_SECONDS = HEARTBEAT_SUSPEND_MS / 1000;
let trackingQueue = Promise.resolve();

function runTrackingTask(task) {
  const next = trackingQueue.catch(() => {}).then(task);
  trackingQueue = next.catch(error => {
    console.warn('PikaDex: tracking task failed:', describeSyncError(error));
  });
  return next;
}

function getHeartbeatSeconds(previousTime, now) {
  if (!previousTime) return HEARTBEAT_SECONDS;
  const elapsed = Math.round((now - previousTime) / 1000);
  if (!Number.isFinite(elapsed) || elapsed <= 0) return HEARTBEAT_SECONDS;
  return Math.min(elapsed, MAX_COUNTED_HEARTBEAT_SECONDS);
}

function getInitialHeartbeatSeconds(msg, now) {
  if (msg.youtube?.isPlaying) return HEARTBEAT_SECONDS;
  if (!msg.lastActivityAt) return HEARTBEAT_SECONDS;
  const activeForSeconds = Math.round((now - msg.lastActivityAt) / 1000);
  if (!Number.isFinite(activeForSeconds) || activeForSeconds <= 0) return 1;
  return Math.min(HEARTBEAT_SECONDS, activeForSeconds);
}

function createSessionFromHeartbeat(msg, sender, now, seconds = HEARTBEAT_SECONDS) {
  return {
    domain: msg.domain,
    url: msg.url,
    tabId: sender.tab?.id,
    windowId: sender.tab?.windowId,
    startTime: now - (seconds * 1000),
    lastHeartbeatTime: now,
    accumulatedSeconds: seconds
  };
}

// Initialize lastFocusedWindowId
chrome.windows.getLastFocused({ populate: false }, window => {
  if (window) lastFocusedWindowId = window.id;
});

// Close stale sessions at startup
chrome.runtime.onStartup.addListener(async () => {
  await runTrackingTask(async () => {
    await closeCurrentSession();
    await closeCurrentVideo();
  });
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

function cleanString(value, maxLength = 80) {
  return String(value || '').trim().slice(0, maxLength);
}

function sanitizeProfileFields(fields = {}) {
  const allowed = {
    trainerName: value => cleanString(value, 40) || 'Trainer',
    leetcodeUsername: value => cleanString(value, 64),
    githubUsername: value => cleanString(value, 39),
    codeforcesHandle: value => cleanString(value, 64),
    codechefHandle: value => cleanString(value, 64),
    hackerrankUsername: value => cleanString(value, 64),
    partnerPokemon: value => cleanString(value, 24) === 'pikachu' ? 'pikachu' : 'pikachu',
    trackingPaused: value => Boolean(value),
    onboarded: value => Boolean(value)
  };
  return Object.entries(fields).reduce((out, [key, value]) => {
    if (allowed[key]) out[key] = allowed[key](value);
    return out;
  }, {});
}

function resetLeetCodeSyncState(t) {
  t.leetcodeSolved = 0;
  t.leetcodeTodaySolved = 0;
  t.lastLeetCodeSolved = 0;
  t.leetcodeProblems = {};
}

function resetGitHubSyncState(t) {
  t.githubCommits = 0;
  t.githubTodayCommits = 0;
  t.lastGitHubCommits = 0;
  t.lastGitHubPRs = 0;
  t.lastGitHubIssues = 0;
  t.githubRepos = {};
}

async function updateHeartbeatTrainerStats({ category, githubRepo, leetcodeProblem }, seconds) {
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

  if (githubRepo) {
    t.githubRepos = t.githubRepos || {};
    t.githubRepos[githubRepo] = (t.githubRepos[githubRepo] || 0) + seconds;
  }

  if (leetcodeProblem) {
    t.leetcodeProblems = t.leetcodeProblems || {};
    if (!t.leetcodeProblems[leetcodeProblem]) {
      t.leetcodeProblems[leetcodeProblem] = { seconds: 0, lastVisited: Date.now() };
    }
    t.leetcodeProblems[leetcodeProblem].seconds += seconds;
    t.leetcodeProblems[leetcodeProblem].lastVisited = Date.now();
  }

  await dbPut('trainer', t);
}

async function closeCurrentSession() {
  const data = await chrome.storage.local.get(['currentSession']);
  if (data.currentSession) {
    const sess = data.currentSession;
    const durationMs = Math.round((sess.accumulatedSeconds || 0) * 1000);
    
    // Only log if we accumulated at least 5 seconds
    if (durationMs >= 5000) {
      const info = getSiteInfo(sess.domain);
      const mins = durationMs / 60000;
      const xp = Math.round(mins * info.xpPerMin);
      const date = new Date().toDateString();

      // Log session
      await dbAdd('sessions', {
        domain: sess.domain,
        url: sess.url || '',
        tabId: sess.tabId,
        windowId: sess.windowId,
        type: info.type,
        startTime: sess.startTime,
        endTime: sess.lastHeartbeatTime,
        durationMs,
        xp,
        date,
        timestamp: sess.lastHeartbeatTime
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
              text: newEvo === 'pikachu' ? '3 hours of focus. Pikachu powered up!' : '10 hours of focus. Pikachu is fully charged!'
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
      const url = v.isShorts
        ? 'https://www.youtube.com/shorts/' + v.video_id
        : 'https://www.youtube.com/watch?v=' + v.video_id;

      const videos = await dbGetAll('videos');
      const existing = videos.find(item => item.video_id === v.video_id && item.date === date);
      const isNewVideoLog = !existing;
      const isEducational = Boolean(existing?.educational || v.educational);
      const record = {
        ...(existing || {}),
        domain: 'youtube.com',
        video_id: v.video_id,
        title: v.title || existing?.title || 'Untitled video',
        channel: v.channel || existing?.channel || 'Unknown Channel',
        startedAt: existing?.startedAt || v.startedAt,
        endedAt: v.lastHeartbeatTime,
        watchSeconds: (existing?.watchSeconds || 0) + v.watchSeconds,
        educational: isEducational,
        date,
        url,
        category: isEducational ? 'Educational' : 'Entertainment',
        timestamp: existing?.timestamp || v.startedAt
      };
      record.durationMins = Math.max(1, Math.round(record.watchSeconds / 60));

      if (existing) {
        await dbPut('videos', record);
      } else {
        await dbAdd('videos', record);
      }

      // Award XP
      const t = await getOrCreateTrainer();
      const xp = isNewVideoLog ? (isEducational ? 15 : 5) : 0;
      if (xp) {
        t.totalXP += xp;
        t.todayXP += xp;
      }
      const watchedMinutes = v.watchSeconds / 60;
      if (isEducational) {
        t.educationalVideoMinutes = (t.educationalVideoMinutes || 0) + watchedMinutes;
      } else {
        t.entertainmentVideoMinutes = (t.entertainmentVideoMinutes || 0) + watchedMinutes;
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

  const profile = await getOrCreateTrainer();
  if (profile.trackingPaused) {
    await closeCurrentSession();
    await closeCurrentVideo();
    return;
  }

  const isValid = msg.visible && msg.userActive;
  const storage = await chrome.storage.local.get(['currentSession', 'currentVideo']);
  let sess = storage.currentSession;
  let vid = storage.currentVideo;
  const now = Date.now();
  let heartbeatSeconds = HEARTBEAT_SECONDS;

  if (isValid) {
    // 1. Process Site Session
    if (sess) {
      const isSameDomain = (sess.domain === msg.domain);
      const isSameTab = (sess.tabId === sender.tab.id && sess.windowId === sender.tab.windowId);
      const isSuspended = (now - sess.lastHeartbeatTime > HEARTBEAT_SUSPEND_MS);

      if (isSameDomain && isSameTab && !isSuspended) {
        heartbeatSeconds = getHeartbeatSeconds(sess.lastHeartbeatTime, now);
        sess.lastHeartbeatTime = now;
        sess.accumulatedSeconds = (sess.accumulatedSeconds || 0) + heartbeatSeconds;
        sess.url = msg.url;
      } else {
        await closeCurrentSession();
        heartbeatSeconds = getInitialHeartbeatSeconds(msg, now);
        sess = createSessionFromHeartbeat(msg, sender, now, heartbeatSeconds);
      }
    } else {
      heartbeatSeconds = getInitialHeartbeatSeconds(msg, now);
      sess = createSessionFromHeartbeat(msg, sender, now, heartbeatSeconds);
    }

    // Save/Update site_stats in IndexedDB
    await updateSiteStats(msg.domain, heartbeatSeconds);

    // Update productivity category seconds in trainer profile
    const info = getSiteInfo(msg.domain);
    const category = getProductivityCategory(info.type);
    await updateHeartbeatTrainerStats({
      category,
      githubRepo: msg.domain === 'github.com' ? msg.githubRepo : null,
      leetcodeProblem: msg.domain === 'leetcode.com' ? msg.leetcodeProblem : null
    }, heartbeatSeconds);

    // 2. Process YouTube video watch session
    if (msg.domain.includes('youtube.com') && msg.youtube && msg.youtube.videoId) {
      const yt = msg.youtube;
      const isVideoPlaying = yt.isPlaying;

      if (isVideoPlaying) {
        if (vid) {
          const isSameVideo = (vid.video_id === yt.videoId);
          const isVidSuspended = (now - vid.lastHeartbeatTime > HEARTBEAT_SUSPEND_MS);

          if (isSameVideo && !isVidSuspended) {
            vid.lastHeartbeatTime = now;
            vid.watchSeconds += heartbeatSeconds;
            
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
              startedAt: now - (heartbeatSeconds * 1000),
              lastHeartbeatTime: now,
              watchSeconds: heartbeatSeconds,
              educational,
              isShorts: Boolean(yt.isShorts)
            };
          }
        } else {
          const educational = isEdu(yt.title);
          vid = {
            video_id: yt.videoId,
            title: yt.title,
            channel: yt.channel,
            startedAt: now - (heartbeatSeconds * 1000),
            lastHeartbeatTime: now,
            watchSeconds: heartbeatSeconds,
            educational,
            isShorts: Boolean(yt.isShorts)
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
  await runTrackingTask(async () => {
    await closeCurrentSession();
    await closeCurrentVideo();
  });
});
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status==='complete' && tab.active) {
    await runTrackingTask(async () => {
      await closeCurrentSession();
      await closeCurrentVideo();
    });
  }
});
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await runTrackingTask(async () => {
    await closeCurrentSession();
    await closeCurrentVideo();
  });
});
chrome.windows.onFocusChanged.addListener(async (wid) => {
  lastFocusedWindowId = wid;
  await runTrackingTask(async () => {
    await closeCurrentSession();
    await closeCurrentVideo();
  });
});

// ── SYNC SYSTEM API INTEGRATIONS ─────────────────────────────
function describeSyncError(error) {
  if (!error) return 'Unknown sync error';
  if (error.name === 'AbortError') return 'Request timed out';
  return error.message || String(error);
}

async function fetchJsonWithTimeout(url, options = {}, label = 'Request', timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`${label} returned HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (error instanceof TypeError) {
      throw new Error(`${label} could not connect. Check network access or API availability.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCachedAccountStats(provider, username, fetcher) {
  const safeName = cleanString(username, 80).toLowerCase();
  const key = `syncCache:${provider}:${safeName}`;
  const cached = (await chrome.storage.local.get(key))[key];
  const now = Date.now();
  if (cached?.data && now - cached.at < SYNC_CACHE_TTL_MS) {
    return { ...cached.data, fromCache: true };
  }

  const data = await fetcher();
  await chrome.storage.local.set({ [key]: { at: now, data } });
  return { ...data, fromCache: false };
}

async function fetchLeetCodeStats(username) {
  const safeUsername = encodeURIComponent(username);
  const failures = [];
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
    const json = await fetchJsonWithTimeout('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username } })
    }, 'LeetCode GraphQL');
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
    throw new Error('LeetCode GraphQL response did not include profile stats');
  } catch (err) {
    failures.push(describeSyncError(err));
    console.warn('PikaDex: LeetCode GraphQL sync skipped:', describeSyncError(err));
  }

  // Heroku Fallback
  try {
    const fallbackData = await fetchJsonWithTimeout(`https://leetcode-api-v2.herokuapp.com/api/userProfile/${safeUsername}`, {}, 'LeetCode fallback API');
    const stats = fallbackData.matchedUser?.submitStatsGlobal?.acSubmissionNum;
    if (!stats) throw new Error('LeetCode fallback response did not include profile stats');
    
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
  } catch (err) {
    failures.push(describeSyncError(err));
    throw new Error(`LeetCode sync unavailable: ${failures.join(' | ')}`);
  }
}

async function fetchGitHubStats(username) {
  const safeUserQuery = encodeURIComponent(`author:${username}`);
  const safePrQuery = encodeURIComponent(`author:${username} type:pr`);
  const safeIssueQuery = encodeURIComponent(`author:${username} type:issue`);
  const safeUsername = encodeURIComponent(username);
  const failures = [];
  let successes = 0;
  let commits = null;
  let prs = null;
  let issues = null;
  let repos = null;
  
  let commitsToday = null;
  let prsToday = null;
  let issuesToday = null;

  const todayDate = new Date().toDateString();
  const isLocalToday = dateStr => {
    const parsed = new Date(dateStr);
    return !Number.isNaN(parsed.getTime()) && parsed.toDateString() === todayDate;
  };

  // 1. Commits Total & Today
  try {
    const commitData = await fetchJsonWithTimeout(`https://api.github.com/search/commits?q=${safeUserQuery}&sort=author-date&order=desc&per_page=100`, {
      headers: { 'Accept': 'application/vnd.github.cloak-preview+json' }
    }, 'GitHub commits');
    successes++;
    commits = commitData.total_count || 0;
    
    const items = commitData.items || [];
    commitsToday = items.filter(item => {
      const dateStr = item.commit?.author?.date;
      return dateStr && isLocalToday(dateStr);
    }).length;
  } catch (e) {
    failures.push('commits: ' + describeSyncError(e));
    console.warn('PikaDex: GitHub commits sync skipped:', describeSyncError(e));
  }

  // 2. PRs Total & Today
  try {
    const prData = await fetchJsonWithTimeout(`https://api.github.com/search/issues?q=${safePrQuery}&sort=created&order=desc&per_page=100`, {}, 'GitHub pull requests');
    successes++;
    prs = prData.total_count || 0;
    
    const items = prData.items || [];
    prsToday = items.filter(item => {
      const dateStr = item.created_at;
      return dateStr && isLocalToday(dateStr);
    }).length;
  } catch (e) {
    failures.push('pull requests: ' + describeSyncError(e));
    console.warn('PikaDex: GitHub PR sync skipped:', describeSyncError(e));
  }

  // 3. Issues Total & Today
  try {
    const issueData = await fetchJsonWithTimeout(`https://api.github.com/search/issues?q=${safeIssueQuery}&sort=created&order=desc&per_page=100`, {}, 'GitHub issues');
    successes++;
    issues = issueData.total_count || 0;
    
    const items = issueData.items || [];
    issuesToday = items.filter(item => {
      const dateStr = item.created_at;
      return dateStr && isLocalToday(dateStr);
    }).length;
  } catch (e) {
    failures.push('issues: ' + describeSyncError(e));
    console.warn('PikaDex: GitHub issue sync skipped:', describeSyncError(e));
  }

  // 4. Public Repos
  try {
    const repoData = await fetchJsonWithTimeout(`https://api.github.com/users/${safeUsername}`, {}, 'GitHub user profile');
    successes++;
    repos = repoData.public_repos || 0;
  } catch (e) {
    failures.push('profile: ' + describeSyncError(e));
    console.warn('PikaDex: GitHub profile sync skipped:', describeSyncError(e));
  }

  if (!successes) {
    throw new Error(`GitHub sync unavailable: ${failures.join(' | ')}`);
  }

  return { commits, prs, issues, repos, commitsToday, prsToday, issuesToday };
}

async function syncAccounts() {
  const t = await getOrCreateTrainer();
  let xpEarned = 0;
  let logEvents = [];
  let syncErrors = [];
  let cachedProviders = [];
  const date = new Date().toDateString();

  // 1. Sync LeetCode
  if (t.leetcodeUsername) {
    try {
      const stats = await fetchCachedAccountStats('leetcode', t.leetcodeUsername, () => fetchLeetCodeStats(t.leetcodeUsername));
      if (stats.fromCache) cachedProviders.push('LeetCode');
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
      syncErrors.push('LeetCode: ' + describeSyncError(e));
      console.warn('PikaDex: LeetCode account sync skipped:', describeSyncError(e));
    }
  }

  // 2. Sync GitHub
  if (t.githubUsername) {
    try {
      const stats = await fetchCachedAccountStats('github', t.githubUsername, () => fetchGitHubStats(t.githubUsername));
      if (stats.fromCache) cachedProviders.push('GitHub');
      const prevCommits = t.lastGitHubCommits || t.githubCommits || 0;
      const prevPRs = t.lastGitHubPRs || 0;
      const prevIssues = t.lastGitHubIssues || 0;

      // Commits
      if (stats.commits !== null && stats.commitsToday !== null) {
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
      }

      // PRs (subsequent / first sync)
      if (stats.prs !== null && stats.prsToday !== null) {
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
      }

      // Issues (subsequent / first sync)
      if (stats.issues !== null && stats.issuesToday !== null) {
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
      }

      if (stats.commits !== null) t.lastGitHubCommits = stats.commits;
      if (stats.prs !== null) t.lastGitHubPRs = stats.prs;
      if (stats.issues !== null) t.lastGitHubIssues = stats.issues;
    } catch (e) {
      syncErrors.push('GitHub: ' + describeSyncError(e));
      console.warn('PikaDex: GitHub account sync skipped:', describeSyncError(e));
    }
  }

  t.level = Math.floor(t.totalXP/500)+1;
  t.lastSyncTime = Date.now();
  await dbPut('trainer', t);

  return { success: true, xpEarned, logEvents, syncErrors, cachedProviders, lastSyncTime: t.lastSyncTime };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type==='GET_DATA') {
    trackingQueue.catch(() => {})
      .then(() => getFullDataPayload())
      .then(({trainer,sessions,videos,battles,site_stats}) => {
        sessions = limitForPopup(sessions);
        videos = limitForPopup(videos);
        battles = limitForPopup(battles);
        site_stats = limitSiteStatsForPopup(site_stats);
        return {trainer,sessions,videos,battles,site_stats};
      })
      .then(async ({trainer,sessions,videos,battles,site_stats}) => {
        // Fetch current active session and video from storage
        const storage = await chrome.storage.local.get(['currentSession', 'currentVideo']);
        
        let liveXp = 0;
        let liveFocusMs = 0;
        if (storage.currentSession) {
          const sess = storage.currentSession;
          const durationMs = Math.round((sess.accumulatedSeconds || 0) * 1000);
          const info = getSiteInfo(sess.domain);
          const mins = durationMs / 60000;
          const xp = Math.round(mins * info.xpPerMin);
          liveXp += xp;
          liveFocusMs += durationMs;
          
          sessions.push({
            domain: sess.domain,
            url: sess.url || '',
            tabId: sess.tabId,
            windowId: sess.windowId,
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
            const alreadyLoggedToday = videos.some(item => item.video_id === v.video_id && item.date === new Date().toDateString());
            const xp = alreadyLoggedToday ? 0 : (v.educational ? 15 : 5);
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
              url: v.isShorts
                ? 'https://www.youtube.com/shorts/' + v.video_id
                : 'https://www.youtube.com/watch?v=' + v.video_id,
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
        clonedTrainer.todayFocusMs = (clonedTrainer.todayFocusMs || 0) + liveFocusMs;
        clonedTrainer.totalFocusMs = (clonedTrainer.totalFocusMs || 0) + liveFocusMs;
        clonedTrainer.level = Math.floor(clonedTrainer.totalXP/500)+1;

        sendResponse({trainer: clonedTrainer, sessions, videos, battles, site_stats});
      })
      .catch(error => sendResponse({error: describeSyncError(error)}));
    return true;
  }

  if (msg.type==='EXPORT_DATA') {
    trackingQueue.catch(() => {})
      .then(() => getFullDataPayload())
      .then(payload => sendResponse({
        success: true,
        exportedAt: new Date().toISOString(),
        schemaVersion: DB_VERSION,
        ...payload
      }))
      .catch(error => sendResponse({success:false, error: describeSyncError(error)}));
    return true;
  }

  if (msg.type==='UPDATE_PROFILE') {
    getOrCreateTrainer().then(async t => {
      const fields = sanitizeProfileFields(msg.fields);
      const hasOwn = Object.prototype.hasOwnProperty;
      const leetcodeChanged = hasOwn.call(fields, 'leetcodeUsername') && fields.leetcodeUsername !== (t.leetcodeUsername || '');
      const githubChanged = hasOwn.call(fields, 'githubUsername') && fields.githubUsername !== (t.githubUsername || '');
      const trackingPausedChanged = hasOwn.call(fields, 'trackingPaused') && fields.trackingPaused !== Boolean(t.trackingPaused);

      Object.assign(t, fields);
      if (leetcodeChanged) resetLeetCodeSyncState(t);
      if (githubChanged) resetGitHubSyncState(t);
      if (leetcodeChanged || githubChanged) t.lastSyncTime = 0;
      await dbPut('trainer', t);
      if (trackingPausedChanged && t.trackingPaused) {
        await runTrackingTask(async () => {
          await closeCurrentSession();
          await closeCurrentVideo();
        });
      }
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
    runTrackingTask(() => handleHeartbeat(msg, sender))
      .then(() => sendResponse({ok:true}))
      .catch(error => sendResponse({ok:false, error: describeSyncError(error)}));
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
    await runTrackingTask(async () => {
      await closeCurrentSession();
      await closeCurrentVideo();
    });
    let t = await dbGet('trainer', 'profile');
    if (!t) t = await getOrCreateTrainer();
    resetDailyTrainerFields(t, new Date().toDateString());
    await dbPut('trainer', t);
  } else if (alarm.name === 'sync_profiles') {
    try {
      await syncAccounts();
    } catch (error) {
      console.warn('PikaDex: scheduled profile sync skipped:', describeSyncError(error));
    }
  }
});

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
const fmtMs = ms => {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  if (totalSeconds < 60) return totalSeconds + 's';
  const m = Math.floor(totalSeconds / 60);
  return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
};
const fmtMinutes = minutes => Math.round(Number(minutes) || 0) + 'm';
const todayStr = () => new Date().toDateString();
const ts = sessions => (sessions||[]).filter(s=>s.date===todayStr());
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const num = value => Number(value) || 0;
const RECOVERY_COST_MS = 23 * 60 * 1000;
const FLOW_MIN_SESSION_MS = 5000;
const FLOW_DAY_GOAL_MS = 25 * 60 * 1000;
const POPUP_LIVE_REFRESH_MS = 2000;

function hasExtensionRuntime() {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.sendMessage);
}

function getPreviewData() {
  return {
    trainer: {
      trainerName: 'Trainer',
      onboarded: true,
      partnerPokemon: 'pikachu',
      level: 1,
      todayXP: 0,
      totalXP: 0,
      todayFocusMs: 0,
      totalFocusMs: 0,
      leetcodeSolved: 0,
      leetcodeTodaySolved: 0,
      githubTodayCommits: 0,
      githubTodayContributions: 0,
      trackingPaused: false,
      flowGuardEnabled: true
    },
    sessions: [],
    videos: [],
    battles: [],
    site_stats: []
  };
}

function sendRuntimeMessage(message, callback) {
  if (hasExtensionRuntime()) {
    chrome.runtime.sendMessage(message, callback);
    return;
  }
  if (message.type === 'GET_DATA') callback?.(getPreviewData());
  else if (message.type === 'UPDATE_PROFILE') callback?.({ ok: true });
  else if (message.type === 'EXPORT_DATA') callback?.({ success: true, exportedAt: new Date().toISOString(), schemaVersion: 'preview', ...getPreviewData() });
  else callback?.({ success: false, error: 'Extension APIs are unavailable in static preview.' });
}

function getDomainIcon(domain) {
  for (const k of Object.keys(DOMAIN_ICON)) if (domain.includes(k)) return DOMAIN_ICON[k];
  return '🌐';
}

function getDisplayStreak(t = {}) {
  return t.leetcodeUsername ? num(t.leetcodeStreak) : num(t.streak);
}

function getGitHubTodayCount(t = {}) {
  return Math.max(num(t.githubTodayCommits), num(t.githubTodayContributions));
}

function calcScore(t, todaySess, data) {
  const flow = getFlowMetrics(data);
  const protectedFlowScore = Math.min(100, (flow.longestFlowMs / (90 * 60 * 1000)) * 100);
  const consistencyScore = Math.min(100, (flow.consistency.completeDays / 5) * 100);
  const recoveryScore = Math.max(0, 100 - (flow.recoveryTriggers * 18));
  const lcScore = Math.min(100, (t.leetcodeTodaySolved || 0) * 50);
  const ghContributions = getGitHubTodayCount(t);
  const ghScore = Math.min(100, ghContributions * 50);

  const finalScore = Math.round(
    (protectedFlowScore * 0.30) +
    (consistencyScore * 0.20) +
    (recoveryScore * 0.20) +
    (lcScore * 0.15) +
    (ghScore * 0.15)
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
  if (getGitHubTodayCount(t) < 1) return 'Ship one small commit';
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
    const codeCount = Math.max(num(t.leetcodeTodaySolved), getGitHubTodayCount(t));
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
  return getCompanionChain('pikachu')[getEvoIndex(todayFocusMs)];
}

function getEvoIndex(todayFocusMs) {
  const h = (todayFocusMs || 0) / 3600000;
  if (h >= 10) return 2;
  if (h >= 3) return 1;
  return 0;
}

function empty(icon, title, sub) {
  return `<div class="empty"><div class="ei">${icon}</div><div class="et">${title}</div><div class="es">${sub}</div></div>`;
}

const PIXEL_GRIDS = {
  pichu: [
    "sds........sds..",
    "sdds......sdds..",
    ".sddys...sddys..",
    "..sddyysdyydd...",
    "...syyyyyyyys...",
    "..syyweyyweyyys.",
    "..syyeyyyyeyyys.",
    "..syycyyyycyyys.",
    "...syyyyyyyys...",
    "....syyyyyys....",
    "....syyyyyys....",
    "...syybyybyyys..",
    "..syybyyyybyyys.",
    "..syyyyyyyyyys..",
    "...syybyybyys...",
    "....ss.ss.ss...."
  ],
  pikachu: [
    "....s......s....",
    "...sds....sds...",
    "..sddds..sddds..",
    "..syyysssyyys...",
    ".syyyyyyyyyyys..",
    ".syyweyyyyweyyys",
    ".syyeyyyyyeyyyys",
    ".sycyyyyyycyyys.",
    ".syyyyyyyyyyyys.",
    "..syyyyyyyyyys..",
    "...syyyyyyyyys..",
    "..syyybyyybyyys.",
    ".syybyyyyybyyyys",
    ".syyyyyyyyyyyys.",
    "..syybyyybyyys..",
    "...ss.sss.ss...."
  ],
  raichu: [
    ".....s.....s....",
    "....sds...sds...",
    "...sddds.sddds..",
    "..syyyysssyyyys.",
    ".syyyyyyyyyyyys.",
    ".syweyyyyyweyyys",
    ".syeyyyyyyyeyyys",
    ".sycyyyyyycyyys.",
    ".syyyyyyyyyyyys.",
    "..syyyyyyyyyys..",
    "...syyyyyyyyys..",
    "..syyybyyybyyys.",
    ".syybyyyyybyyyys",
    ".syyyyyyyyyyysd.",
    "..syybyyybyyysds",
    "...ss.sss.ss.ss."
  ],
  bulbasaur: [
    "................",
    ".....ssss.......",
    "....sllls.......",
    "...sllllls......",
    "...sllldls......",
    "..sgggggggs.....",
    ".sggwegweggs....",
    ".sggegggeggs....",
    ".sgggcggcggs....",
    "..sgggggggs.....",
    "...sggbggs......",
    "..sggbbbggs.....",
    ".sgggggggggs....",
    ".sggsggggsgs....",
    "..ss....ss......",
    "................"
  ],
  charmander: [
    "............s...",
    "...........sfs..",
    "..........sfys..",
    "....ssss..sys...",
    "...soooossys....",
    "..soowooos......",
    "..sooeeooos.....",
    "..soocoooos.....",
    "...sooooos......",
    "...soobbos......",
    "..soobbbos......",
    ".soooooooos.....",
    ".sooosoooos.....",
    "..ss...ss.......",
    "................",
    "................"
  ],
  squirtle: [
    "................",
    "....ssss........",
    "...suuuus.......",
    "..suuwuuus......",
    "..suueuuus......",
    "..suucuuus......",
    "...suuuuss......",
    "..skkkkkkus.....",
    ".skkbbbbbks.....",
    ".skkbbbbbkks....",
    ".sukkkkkkuus....",
    "..suuuuuuus.....",
    "..suuussuus.....",
    "...ss...ss......",
    "................",
    "................"
  ],
  eevee: [
    "s..............s",
    "ss............ss",
    "sns..........sns",
    ".snss......ssns.",
    "..snnssssssnns..",
    ".snnnnnnnnnnnns.",
    ".snnwennnnwenns.",
    ".snneennnneenns.",
    ".snnnncbbcannns.",
    "..snnnbbbbnnns..",
    "...sbbbbbbbss...",
    "..snnnnnnnnnns..",
    ".snnnsnnnnsnnns.",
    "..ss......ss....",
    "................",
    "................"
  ],
  ivysaur: [
    "......sps.......",
    ".....sppps......",
    "....splllps.....",
    "...slllllls.....",
    "..sgggggggs.....",
    ".sggwegwegss....",
    ".sggegggegss....",
    ".sgggcggcggs....",
    "..sgggggggs.....",
    "...sggbggs......",
    "..sggbbbggs.....",
    ".sgggggggggs....",
    ".sggsggggsgs....",
    "..ss....ss......",
    "................",
    "................"
  ],
  venusaur: [
    "....spppppps....",
    "...spllllllps...",
    "..spllpppllps...",
    "..slllllllls....",
    ".sgggggggggs....",
    ".sggwegwegss....",
    ".sggegggegss....",
    ".sgggcggcggs....",
    ".sgggggggggs....",
    "..sgggbgggs.....",
    ".sgggbbbbggs....",
    "sgggggggggggs...",
    "sggsggggggsgs...",
    ".ss........ss...",
    "................",
    "................"
  ],
  charmeleon: [
    "............s...",
    "...........sfys.",
    "..........sfyys.",
    "....ssss..sys...",
    "...srrrsssys....",
    "..srrwrrrs......",
    "..srreerrrs.....",
    "..srrcrrrrs.....",
    "...srrrrrs......",
    "...srrbbbs......",
    "..srrbbbbss.....",
    ".srrrrrrrrs.....",
    ".srrrsrrrs......",
    "..ss...ss.......",
    "................",
    "................"
  ],
  charizard: [
    "...s......s.....",
    "..srs....srs....",
    ".srrs..srrrs....",
    ".srrrrssrrrrs...",
    "..srrrrrrrrs....",
    "..srrwrrrwrs....",
    "..srreerrers....",
    "...srrcrrrs.....",
    "...srrrrrs..s...",
    "..srrbbbrrssfs..",
    ".srrrrrrrrsyys..",
    ".srrrsrrrs.sys..",
    "..ss...ss..s....",
    "................",
    "................",
    "................"
  ],
  wartortle: [
    "...s........s...",
    "..sws....sws....",
    "...suuuus.......",
    "..suuwuuus......",
    "..suueuuus......",
    "..suucuuus......",
    "...suuuuss......",
    "..skkkkkkus.....",
    ".skkbbbbbks.....",
    ".skkbbbbbkks....",
    ".sukkkkkkuus....",
    "..suuuuuuus.....",
    "..suuussuus..s..",
    "...ss...ss..ss..",
    "................",
    "................"
  ],
  blastoise: [
    "..m........m....",
    ".sms..ssss..sms.",
    "..suuuuuus......",
    ".suuwuuuwus.....",
    ".suueuuueus.....",
    ".suucuuucus.....",
    "..suuuuuuss.....",
    ".skkkkkkkkus....",
    "skkbbbbbbbks....",
    "skkbbbbbbbkk....",
    "sukkkkkkkkuus...",
    ".suuuuuuuuus....",
    ".suuusssuuus....",
    "..ss.....ss.....",
    "................",
    "................"
  ]
};

PIXEL_GRIDS.espeon = PIXEL_GRIDS.eevee;
PIXEL_GRIDS.umbreon = PIXEL_GRIDS.eevee;

const PIXEL_PALETTES = {
  pichu: {
    y: '#ffe675', b: '#fff4b8', c: '#ff8a93', d: '#382a1a', s: '#382a1a', e: '#382a1a', w: '#ffffff'
  },
  pikachu: {
    y: '#ffcc00', b: '#ffe57f', c: '#ff3b50', d: '#1a1200', s: '#1a1200', e: '#1a1200', w: '#ffffff'
  },
  raichu: {
    y: '#ff9900', b: '#ffe3a0', c: '#ffcc44', d: '#3d1400', s: '#3d1400', e: '#3d1400', w: '#ffffff'
  },
  bulbasaur: {
    g: '#62c9a2', b: '#a8edd8', l: '#4da65b', c: '#ec6f7f', d: '#2f6d3d', s: '#173c2d', e: '#173c2d', w: '#ffffff'
  },
  charmander: {
    o: '#f28a2e', b: '#ffd68a', c: '#f6a35b', f: '#ff4338', y: '#ffd447', s: '#4b220f', e: '#4b220f', w: '#ffffff'
  },
  squirtle: {
    u: '#65b8e8', b: '#ffe1a6', k: '#8a6b45', c: '#ff9aa8', s: '#17324a', e: '#17324a', w: '#ffffff'
  },
  eevee: {
    n: '#9a633a', b: '#f4dfb3', c: '#d98b7c', a: '#6f4428', s: '#3a2416', e: '#3a2416', w: '#ffffff'
  },
  ivysaur: {
    g: '#4fb88f', b: '#c1f0dc', l: '#3f8f50', p: '#d774c7', c: '#ec6f7f', d: '#2f6d3d', s: '#153827', e: '#153827', w: '#ffffff'
  },
  venusaur: {
    g: '#3f9f78', b: '#d8f5e8', l: '#2f7d40', p: '#e86aa3', c: '#ec6f7f', d: '#275d37', s: '#102f22', e: '#102f22', w: '#ffffff'
  },
  charmeleon: {
    r: '#dc4b2f', b: '#ffd08a', c: '#f08055', f: '#ff3528', y: '#ffd447', s: '#471b10', e: '#471b10', w: '#ffffff'
  },
  charizard: {
    r: '#d95d24', b: '#ffe1a6', c: '#f08a42', f: '#ff3528', y: '#ffd447', s: '#3b170d', e: '#3b170d', w: '#ffffff'
  },
  wartortle: {
    u: '#5da7de', b: '#fff0c2', k: '#7b6347', c: '#ff9aa8', s: '#142e44', e: '#142e44', w: '#ffffff'
  },
  blastoise: {
    u: '#3e8ac2', b: '#f2d398', k: '#6b5438', c: '#ff9aa8', m: '#5b6673', s: '#10283d', e: '#10283d', w: '#ffffff'
  },
  espeon: {
    n: '#b58adf', b: '#ead7ff', c: '#e78fb8', a: '#7d58a7', s: '#332047', e: '#332047', w: '#ffffff', m: '#d946ef'
  },
  umbreon: {
    n: '#2a2f3a', b: '#f4d35e', c: '#f59e0b', a: '#111827', s: '#0b1020', e: '#0b1020', w: '#ffffff'
  }
};

const EYE_COLS = {
  pichu: [5, 6, 9, 10],
  pikachu: [4, 5, 10, 11],
  raichu: [3, 4, 10, 11],
  bulbasaur: [4, 5, 8, 9],
  charmander: [4, 5, 6],
  squirtle: [4, 5],
  eevee: [4, 5, 10, 11],
  ivysaur: [4, 5, 8, 9],
  venusaur: [4, 5, 8, 9],
  charmeleon: [4, 5, 6],
  charizard: [4, 5, 8, 9],
  wartortle: [4, 5],
  blastoise: [4, 5, 8, 9],
  espeon: [4, 5, 10, 11],
  umbreon: [4, 5, 10, 11]
};

const COMPANION_NAMES = {
  pichu: 'Pichu',
  pikachu: 'Pikachu',
  raichu: 'Raichu',
  bulbasaur: 'Bulbasaur',
  ivysaur: 'Ivysaur',
  venusaur: 'Venusaur',
  charmander: 'Charmander',
  charmeleon: 'Charmeleon',
  charizard: 'Charizard',
  squirtle: 'Squirtle',
  wartortle: 'Wartortle',
  blastoise: 'Blastoise',
  eevee: 'Eevee',
  espeon: 'Espeon',
  umbreon: 'Umbreon'
};

const COMPANION_CHAINS = {
  pikachu: ['pichu', 'pikachu', 'raichu'],
  bulbasaur: ['bulbasaur', 'ivysaur', 'venusaur'],
  charmander: ['charmander', 'charmeleon', 'charizard'],
  squirtle: ['squirtle', 'wartortle', 'blastoise'],
  eevee: ['eevee', 'espeon', 'umbreon']
};

function getCompanionChain(partner = 'pikachu') {
  return COMPANION_CHAINS[partner] || COMPANION_CHAINS.pikachu;
}

function getCompanionForm(t = {}) {
  const partner = t.partnerPokemon || 'pikachu';
  const chain = getCompanionChain(partner);
  return chain[getEvoIndex(t.todayFocusMs || 0)] || chain[0];
}

function getEyeMaskColor(palette = {}) {
  return palette.y || palette.b || palette.g || palette.o || palette.u || palette.n || '#ffffff';
}

function drawPixelMascot(canvas, form, blinkOpen = true) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const scale = W / 16;
  const palette = PIXEL_PALETTES[form] || PIXEL_PALETTES.pikachu;
  const grid = PIXEL_GRIDS[form] || PIXEL_GRIDS.pikachu;
  
  ctx.clearRect(0, 0, W, H);
  
  for (let r = 0; r < 16; r++) {
    const rowStr = grid[r];
    for (let c = 0; c < 16; c++) {
      const char = rowStr[c];
      if (char === '.') continue;
      
      let color = palette[char];
      if (!color) continue;
      
      if (!blinkOpen) {
        if (char === 'e' || char === 'w') {
          color = getEyeMaskColor(palette);
        }
        const cols = EYE_COLS[form] || EYE_COLS.pikachu;
        if (r === 6 && cols.includes(c)) {
          color = palette.s;
        }
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(c * scale, r * scale, scale, scale);
    }
  }
}

let _mascotBlinkOpen = true;
let _mascotAnimHandle = null;
let _renderedCompanionForm = null;
let _mascotEvolutionTimer = null;

function startMascotAnimation(form) {
  if (_mascotAnimHandle) clearTimeout(_mascotAnimHandle);
  
  const drawAll = () => {
    const canvas = document.getElementById('mascot-canvas');
    const obCanvas = document.getElementById('ob-mascot-canvas');
    if (canvas) drawPixelMascot(canvas, form, _mascotBlinkOpen);
    if (obCanvas) drawPixelMascot(obCanvas, form, _mascotBlinkOpen);
  };

  const scheduleBlink = () => {
    _mascotAnimHandle = setTimeout(() => {
      _mascotBlinkOpen = false;
      drawAll();
      setTimeout(() => {
        _mascotBlinkOpen = true;
        drawAll();
        scheduleBlink();
      }, 140);
    }, 2800 + Math.random() * 2200);
  };

  drawAll();
  scheduleBlink();
}

function renderPartnerLegacy(form) {
  startMascotAnimation(form);
  
  const evoNames = { pichu: 'Pichu Stage', pikachu: 'Pikachu Stage', raichu: 'Raichu Stage ⚡' };
  const metaEvo = document.getElementById('trainer-meta-evo');
  if (metaEvo) metaEvo.textContent = COMPANION_NAMES[form] || 'Companion';
  
  const stage = document.getElementById('mascot-stage');
  if (stage) {
    stage.classList.remove('form-pichu', 'form-pikachu', 'form-raichu', 'form-bulbasaur', 'form-charmander', 'form-squirtle', 'form-eevee');
    stage.classList.add('form-' + form);
  }
}

// ── TABS ─────────────────────────────────────────────────────
function renderPartner(form, options = {}) {
  const normalizedForm = PIXEL_GRIDS[form] ? form : 'pikachu';
  const shouldAnimate = Boolean(options.animate && _renderedCompanionForm && _renderedCompanionForm !== normalizedForm);
  _renderedCompanionForm = normalizedForm;
  startMascotAnimation(normalizedForm);

  const metaEvo = document.getElementById('trainer-meta-evo');
  if (metaEvo) metaEvo.textContent = COMPANION_NAMES[normalizedForm] || 'Companion';

  const stage = document.getElementById('mascot-stage');
  if (stage) {
    stage.classList.remove(
      'form-pichu', 'form-pikachu', 'form-raichu',
      'form-bulbasaur', 'form-ivysaur', 'form-venusaur',
      'form-charmander', 'form-charmeleon', 'form-charizard',
      'form-squirtle', 'form-wartortle', 'form-blastoise',
      'form-eevee', 'form-espeon', 'form-umbreon',
      'evolving'
    );
    stage.classList.add('form-' + normalizedForm);
    if (shouldAnimate) {
      void stage.offsetWidth;
      stage.classList.add('evolving');
      clearTimeout(_mascotEvolutionTimer);
      _mascotEvolutionTimer = setTimeout(() => {
        stage.classList.remove('evolving');
      }, 1400);
    }
  }
}

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
  const githubTodayCommits = num(t.githubTodayCommits);
  const githubTodayDisplay = getGitHubTodayCount(t);
  const flowMetrics = getFlowMetrics(data);

  // Update trainer name elements dynamically
  const name = t.trainerName || 'Trainer';
  const headerTrainerEl = document.getElementById('header-trainer-name');
  if (headerTrainerEl) headerTrainerEl.textContent = name;
  const metaTrainerEl = document.getElementById('trainer-meta-name');
  if (metaTrainerEl) metaTrainerEl.textContent = name;

  // Update trainer header & card elements
  document.getElementById('xp-num').textContent = xp+' / 500';
  document.getElementById('xp-bar').style.width = pct+'%';
  document.getElementById('ss-score').textContent = calcScore(t,todaySess,data);
  document.getElementById('ss-streak').textContent = `${flowMetrics.consistency.completeDays}/7`;
  const streakValEl = document.getElementById('streak-val');
  if (streakValEl) streakValEl.textContent = `${flowMetrics.consistency.completeDays}/7`;
  const streakLabelEl = document.getElementById('streak-label');
  if (streakLabelEl) streakLabelEl.textContent = '7-day rhythm';
  const statStreakLabelEl = document.getElementById('ss-streak-label');
  if (statStreakLabelEl) statStreakLabelEl.textContent = 'Rhythm';
  document.getElementById('ss-time').textContent = fmtMs(todayMs);
  document.getElementById('ss-leet').textContent = t.leetcodeSolved||0;

  // Update new grid widget elements
  document.getElementById('ss-leet-today').textContent = t.leetcodeTodaySolved||0;
  document.getElementById('ss-gh-today').textContent = githubTodayDisplay;
  const ghLabelEl = document.getElementById('ss-gh-label');
  if (ghLabelEl) ghLabelEl.textContent = githubTodayCommits > 0 ? 'Commits' : 'GH Today';
  document.getElementById('ss-xp-earned').textContent = xp;

  const vids = (data.videos||[]).filter(v=>v.date===todayStr());
  document.getElementById('ss-vids-watched').textContent = vids.length;

  const batt = (data.battles||[]).filter(b=>b.date===todayStr());
  const wins = batt.filter(b=>b.won).length;
  document.getElementById('ss-battles-won').textContent = wins;

  const evoIndex = getEvoIndex(t.todayFocusMs || 0);
  const chain = getCompanionChain(t.partnerPokemon || 'pikachu');
  const companion = getCompanionForm(t);
  const levelEl = document.getElementById('t-level');
  if (levelEl) levelEl.textContent = 'Level '+(t.level||1)+' - '+(COMPANION_NAMES[companion] || 'Companion');
  renderPartner(companion, { animate: true });

  // Update evo strip
  ['en-pichu','en-pikachu','en-raichu'].forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active','dim');
      const form = chain[index] || chain[0];
      const nameEl = el.querySelector('.evo-stage-name');
      const reqEl = el.querySelector('.evo-stage-req');
      const checkEl = el.querySelector('.evo-check');
      if (nameEl) nameEl.textContent = COMPANION_NAMES[form] || 'Companion';
      if (reqEl) reqEl.textContent = index === 0 ? 'Default' : index === 1 ? '3h focus' : '10h focus';
      if (index === evoIndex) {
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

function getSessionEnd(s = {}) {
  return num(s.endTime || s.timestamp || s.startTime);
}

function getSessionStart(s = {}) {
  return num(s.startTime || s.timestamp || s.endTime);
}

function getUrlPath(url = '') {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return String(url || '').toLowerCase();
  }
}

function getGithubTarget(url = '', fallback = 'GitHub') {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && !['notifications', 'settings', 'pulls', 'issues', 'search', 'trending', 'explore'].includes(parts[0])) {
      return `${parts[0]}/${parts[1]}`;
    }
  } catch {}
  return fallback;
}

function videoLooksEducational(session, data) {
  const url = String(session.url || '');
  const match = (data.videos || []).find(v => {
    if (!v.url || !url) return false;
    return v.url === url || url.includes(v.video_id || '___missing_video_id___');
  });
  if (match) return Boolean(match.educational);
  const text = `${session.url || ''} ${session.title || ''}`.toLowerCase();
  return ['tutorial', 'course', 'learn', 'coding', 'programming', 'lecture', 'explained', 'system design'].some(word => text.includes(word));
}

function classifyDevActivity(session = {}, data = {}) {
  const domain = String(session.domain || '').replace(/^www\./, '');
  const path = getUrlPath(session.url || '');
  const type = session.type || '';

  if (domain.includes('leetcode.com')) {
    if (path.includes('/discuss')) return { label: 'LeetCode discuss', kind: 'neutral', detail: 'discussion tab' };
    if (path.includes('/problems/')) return { label: 'LeetCode problem', kind: 'flow', detail: 'problem solving' };
    return { label: 'LeetCode', kind: 'flow', detail: 'training' };
  }

  if (domain === 'github.com') {
    const target = getGithubTarget(session.url, 'GitHub');
    if (path.startsWith('/notifications')) return { label: 'GitHub notifications', kind: 'interruption', detail: 'notification queue' };
    if (path.includes('/pull/') || path.includes('/pulls')) return { label: `${target} PR review`, kind: 'flow', detail: 'pull request' };
    if (path.includes('/commit') || path.includes('/commits')) return { label: `${target} commits`, kind: 'flow', detail: 'commit history' };
    if (path.includes('/issues')) return { label: `${target} issues`, kind: 'flow', detail: 'issue work' };
    if (path.startsWith('/trending') || path.startsWith('/explore') || path.startsWith('/topics') || path.startsWith('/search')) {
      return { label: 'GitHub browsing', kind: 'neutral', detail: 'repo discovery' };
    }
    return { label: target, kind: 'flow', detail: 'repo work' };
  }

  if (domain.includes('youtube.com')) {
    if (path.startsWith('/shorts')) return { label: 'YouTube Shorts', kind: 'interruption', detail: 'short-form video' };
    return videoLooksEducational(session, data)
      ? { label: 'YouTube learning', kind: 'flow', detail: 'tutorial video' }
      : { label: 'YouTube', kind: 'interruption', detail: 'video break' };
  }

  if (domain.includes('stackoverflow.com') || domain.includes('developer.mozilla.org') || domain.includes('docs.') || domain.includes('readthedocs') || domain.includes('devdocs.io')) {
    return { label: domain, kind: 'flow', detail: 'research' };
  }

  if (domain.includes('chatgpt.com') || domain.includes('claude.ai')) {
    return { label: domain, kind: 'flow', detail: 'AI-assisted work' };
  }

  if (type === 'Social' || type === 'Entertainment') return { label: domain || type, kind: 'interruption', detail: type.toLowerCase() };
  if (['Development', 'Training Ground', 'Research', 'Productivity', 'AI Assistant'].includes(type)) {
    return { label: domain || type, kind: 'flow', detail: type.toLowerCase() };
  }
  return { label: domain || 'Unknown', kind: 'neutral', detail: 'uncategorized' };
}

function buildFlowBlocks(data = {}) {
  const sessions = ts(data.sessions)
    .filter(s => num(s.durationMs) >= FLOW_MIN_SESSION_MS)
    .sort((a, b) => getSessionStart(a) - getSessionStart(b));
  const blocks = [];

  sessions.forEach(session => {
    const activity = classifyDevActivity(session, data);
    const start = getSessionStart(session);
    const end = getSessionEnd(session);
    const last = blocks[blocks.length - 1];
    const canMerge = last
      && last.label === activity.label
      && last.kind === activity.kind
      && start - last.endTime <= 2 * 60 * 1000;

    if (canMerge) {
      last.endTime = Math.max(last.endTime, end);
      last.durationMs += num(session.durationMs);
      last.sessions += 1;
      last.inProgress = Boolean(last.inProgress || session.inProgress);
    } else {
      blocks.push({
        label: activity.label,
        kind: activity.kind,
        detail: activity.detail,
        startTime: start,
        endTime: end,
        durationMs: num(session.durationMs),
        sessions: 1,
        inProgress: Boolean(session.inProgress)
      });
    }
  });

  return blocks;
}

function computeConsistency(data = {}) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toDateString());
  }

  const dayTotals = Object.fromEntries(dates.map(date => [date, 0]));
  (data.sessions || []).forEach(session => {
    if (!(session.date in dayTotals) || num(session.durationMs) < FLOW_MIN_SESSION_MS) return;
    if (classifyDevActivity(session, data).kind === 'flow') {
      dayTotals[session.date] += num(session.durationMs);
    }
  });

  const completeDays = Object.values(dayTotals).filter(ms => ms >= FLOW_DAY_GOAL_MS).length;
  return { completeDays, dayTotals };
}

function computeFlowMetrics(data = {}) {
  const blocks = buildFlowBlocks(data);
  const flowBlocks = blocks.filter(block => block.kind === 'flow');
  const switches = Math.max(0, blocks.length - 1);
  const interruptionBlocks = blocks.filter(block => block.kind !== 'flow');
  const recoveryTriggers = blocks.filter((block, index) => index > 0 && block.kind !== 'flow' && blocks[index - 1].kind === 'flow').length;
  const flowBeforeSwitch = blocks
    .filter((block, index) => block.kind === 'flow' && blocks[index + 1])
    .map(block => block.durationMs);
  const avgBeforeSwitch = flowBeforeSwitch.length
    ? flowBeforeSwitch.reduce((sum, ms) => sum + ms, 0) / flowBeforeSwitch.length
    : (flowBlocks.length ? flowBlocks.reduce((sum, block) => sum + block.durationMs, 0) / flowBlocks.length : 0);
  const longestFlowMs = flowBlocks.reduce((max, block) => Math.max(max, block.durationMs), 0);
  const interrupters = {};
  interruptionBlocks.forEach(block => {
    if (!interrupters[block.label]) interrupters[block.label] = { count: 0, durationMs: 0 };
    interrupters[block.label].count += 1;
    interrupters[block.label].durationMs += block.durationMs;
  });
  const topInterrupter = Object.entries(interrupters)
    .sort((a, b) => (b[1].count - a[1].count) || (b[1].durationMs - a[1].durationMs))[0];
  const consistency = computeConsistency(data);

  return {
    blocks,
    switches,
    recoveryTriggers,
    recoveryMs: recoveryTriggers * RECOVERY_COST_MS,
    avgBeforeSwitch,
    longestFlowMs,
    topInterrupter: topInterrupter ? topInterrupter[0] : 'None',
    consistency
  };
}

const flowMetricsCache = new WeakMap();

function getFlowMetrics(data = {}) {
  if (!data || typeof data !== 'object') return computeFlowMetrics(data);
  if (!flowMetricsCache.has(data)) {
    flowMetricsCache.set(data, computeFlowMetrics(data));
  }
  return flowMetricsCache.get(data);
}

function buildFlowSummary(metrics) {
  if (!metrics.blocks.length) return 'No uninterrupted developer flow yet.';
  if (!metrics.recoveryTriggers) return 'No flow-breaking interruptions detected today.';
  return `${metrics.recoveryTriggers} flow break${metrics.recoveryTriggers !== 1 ? 's' : ''} detected. Protect the next block from ${metrics.topInterrupter}.`;
}

function renderFlowAutopsy(data) {
  const metrics = getFlowMetrics(data);
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('flow-longest', fmtMs(metrics.longestFlowMs));
  setText('flow-summary', buildFlowSummary(metrics));
  setText('flow-consistency', `${metrics.consistency.completeDays}/7`);
  setText('flow-average', fmtMs(metrics.avgBeforeSwitch));
  setText('flow-switches', metrics.switches);
  setText('flow-recovery', fmtMs(metrics.recoveryMs));
  setText('flow-interrupter', metrics.topInterrupter);

  const sequence = document.getElementById('flow-sequence');
  if (sequence) {
    const blocks = metrics.blocks.slice(-8);
    sequence.innerHTML = blocks.length ? blocks.map(block => {
      const cls = block.kind === 'flow' ? 'flow-good' : block.kind === 'interruption' ? 'flow-warn' : 'flow-neutral';
      const live = block.inProgress ? ' live' : '';
      return `<div class="flow-chip ${cls}" title="${esc(block.detail)}">
        <span class="flow-chip-name">${esc(block.label)}</span>
        <span class="flow-chip-meta">${fmtMs(block.durationMs)}${live}</span>
      </div>`;
    }).join('') : '<div class="flow-chip flow-neutral"><span class="flow-chip-name">No activity</span><span class="flow-chip-meta">Start a flow block</span></div>';
  }

  return metrics;
}

function buildPrivacyDebugPayload(data, metrics) {
  const current = (ts(data.sessions).find(s => s.inProgress) || null);
  return {
    generatedAt: new Date().toISOString(),
    storage: 'Local IndexedDB + chrome.storage.local',
    network: {
      accountSync: 'GitHub and LeetCode public profile APIs only when configured',
      classification: 'on-device URL and session pattern rules'
    },
    currentSession: current ? {
      domain: current.domain,
      url: current.url,
      type: current.type,
      durationMs: current.durationMs,
      activity: classifyDevActivity(current, data)
    } : null,
    trainer: {
      trainerName: data.trainer?.trainerName || '',
      partnerPokemon: data.trainer?.partnerPokemon || 'pikachu',
      githubUsername: data.trainer?.githubUsername || '',
      leetcodeUsername: data.trainer?.leetcodeUsername || '',
      trackingPaused: Boolean(data.trainer?.trackingPaused),
      flowGuardEnabled: data.trainer?.flowGuardEnabled !== false
    },
    flow: {
      longestFlowMs: metrics.longestFlowMs,
      switches: metrics.switches,
      recoveryTriggers: metrics.recoveryTriggers,
      estimatedRecoveryMs: metrics.recoveryMs,
      consistency: metrics.consistency.completeDays + '/7'
    },
    todaySessions: ts(data.sessions).map(session => ({
      domain: session.domain,
      url: session.url,
      type: session.type,
      durationMs: session.durationMs,
      inProgress: Boolean(session.inProgress),
      activity: classifyDevActivity(session, data)
    }))
  };
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
        lastVisitTime: getSessionEnd(s),
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
    groups[domain].lastVisitTime = Math.max(groups[domain].lastVisitTime || 0, getSessionEnd(s));
    if (s.inProgress) {
      groups[domain].inProgress = true;
    }
  });

  // Sort chronologically by first visit time
  const groupedList = Object.values(groups).sort((a, b) => a.firstVisitTime - b.firstVisitTime);

  rl.innerHTML = groupedList.map(g => {
    const d = new Date(g.firstVisitTime);
    const t = d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    const endDate = new Date(g.lastVisitTime || g.firstVisitTime);
    const endText = endDate.getHours().toString().padStart(2,'0')+':'+endDate.getMinutes().toString().padStart(2,'0');
    const timeText = endText !== t ? `${t}-${endText}` : t;
    const c = ROUTE_COL[g.type]||'#6b7280';
    
    // Format duration string: if active in-progress session, append "and counting"
    let durStr = fmtMs(g.durationMs);
    if (g.inProgress) {
      durStr = `${fmtMs(g.durationMs)} live`;
    }
    
    const pulseStyle = g.inProgress ? ' animation: pulse 1.5s infinite alternate;' : '';
    const activeClass = g.inProgress ? 'active-stop' : '';

    return `<div class="route-stop ${activeClass}">
      <span class="rt-time">${timeText}</span>
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
  const lcSummary = document.getElementById('lc-summary');
  if (lcSummary) {
    const lcStreak = num(t.leetcodeStreak);
    const activeDays = num(t.leetcodeTotalActiveDays);
    const todaySolved = num(t.leetcodeTodaySolved);
    const lastActive = t.leetcodeLastActiveDate ? `Last active ${esc(t.leetcodeLastActiveDate)}` : 'Sync LeetCode to update streak';
    if (!t.leetcodeUsername && !solved && !lcStreak) {
      lcSummary.innerHTML = empty('💻', 'Sync LeetCode', 'Add your LeetCode username and press Sync to track streaks.');
    } else {
      lcSummary.innerHTML = `<div class="gh-row">
        <div class="ghr-ico">💻</div>
        <div class="gh-details">
          <div class="ghr-name">LeetCode Streak</div>
          <div class="ghr-sub">${lcStreak} day streak · ${todaySolved} solved today · ${activeDays} active day${activeDays!==1?'s':''} this year</div>
          <div class="ghr-sub">${lastActive}</div>
        </div>
        <div class="ghr-xp">+${todaySolved*50} XP today</div>
      </div>`;
    }
  }

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
  const commits = num(t.githubCommits);
  const todayCommits = num(t.githubTodayCommits);
  const todayContributions = num(t.githubTodayContributions);
  const contributionStreak = num(t.githubContributionStreak);
  const contributionTotal = num(t.githubContributions);
  const gr = document.getElementById('gh-region');
  if (!commits && !todayCommits && !todayContributions && !contributionStreak && !contributionTotal) {
    gr.innerHTML = empty('🐙','Sync GitHub','Add your GitHub username and press Sync to map your region.');
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
        <div class="ghr-sub">${todayCommits} commit${todayCommits!==1?'s':''} today · ${todayContributions} contribution${todayContributions!==1?'s':''} today · ${contributionStreak} day streak</div>
        <div class="ghr-sub">${commits} public commit${commits!==1?'s':''} indexed · ${contributionTotal} contributions this year</div>
      </div>
      <div class="ghr-xp">+${todayCommits*30} XP today</div>
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
  const displayStreak = getDisplayStreak(t);
  const flow = getFlowMetrics(data);
  const rows = [
    ['Active today',     fmtMs(todayMs)],
    ['Longest flow',     fmtMs(flow.longestFlowMs)],
    ['Switches',         String(flow.switches)],
    ['Recovery cost',    fmtMs(flow.recoveryMs)],
    ['7-day consistency', flow.consistency.completeDays + '/7 days'],
    ['XP earned',        (t.todayXP||0)+' XP'],
    ['LC solved (all)',  (t.leetcodeSolved||0)+' problems'],
    ['LC today',         (t.leetcodeTodaySolved||0)+' problems'],
    ['GitHub commits',   num(t.githubTodayCommits)+' today'],
    ['GitHub contribs',  num(t.githubTodayContributions)+' today'],
    ['ChatGPT messages',  (t.chatgptTodayCount||0)+' messages'],
    ['LeetCode streak',  displayStreak+' days 🔥'],
    ['GitHub streak',    num(t.githubContributionStreak)+' days'],
    ['Educational Watch', fmtMinutes(t.educationalVideoMinutes)],
    ['Entertainment Watch', fmtMinutes(t.entertainmentVideoMinutes)]
  ];
  document.getElementById('oak-stats').innerHTML = rows.map(([k,v])=>`
    <div class="oak-stat"><span class="oak-k">${k}</span><span class="oak-v">${v}</span></div>`).join('');
}

let latestPopupData = null;
let latestFlowMetrics = null;

function renderDashboard(data, options = {}) {
  latestPopupData = data;
  renderHeader(data);
  latestFlowMetrics = renderFlowAutopsy(data);
  renderFocusDeck(data);
  renderCaught(data);
  renderRoute(data);
  renderBattles(data);
  renderGym(data);
  if (options.includeOak !== false) renderOak(data);

  const privacyDebugOutput = document.getElementById('privacy-debug-output');
  if (privacyDebugOutput && !privacyDebugOutput.classList.contains('hidden')) {
    privacyDebugOutput.textContent = JSON.stringify(buildPrivacyDebugPayload(latestPopupData, latestFlowMetrics), null, 2);
  }
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

  sendRuntimeMessage({type:'GET_DATA'}, async data=>{
    const t=data.trainer||{};
    const todaySess=ts(data.sessions);
    const tMs=todaySess.reduce((a,s)=>a+s.durationMs,0);
    const sMap={};
    todaySess.forEach(s=>{ sMap[s.domain]=(sMap[s.domain]||0)+s.durationMs; });
    const siteSumm=Object.entries(sMap).map(([d,ms])=>`${d}: ${Math.round(ms/60000)}min`).join(', ')||'none';
    const vids=(data.videos||[]).filter(v=>v.date===todayStr());
    const batt=(data.battles||[]).filter(b=>b.date===todayStr());
    const flow = getFlowMetrics(data);

    const prompt = `You are Professor Oak from Pokemon giving trainer ${t.trainerName || 'Trainer'} a developer flow-state autopsy. Be warm, sharp, and privacy-respecting. Do not judge the person; identify what fragmented their flow and suggest one protective action.

Data:
- Active time: ${Math.round(tMs/60000)} minutes
- Sites: ${siteSumm}
- Longest uninterrupted developer flow: ${Math.round(flow.longestFlowMs/60000)} minutes
- Average flow before a switch: ${Math.round(flow.avgBeforeSwitch/60000)} minutes
- Context switches: ${flow.switches}
- Estimated recovery cost: ${Math.round(flow.recoveryMs/60000)} minutes
- Top interrupter: ${flow.topInterrupter}
- Rolling 7-day consistency: ${flow.consistency.completeDays}/7 days
- LeetCode solved total: ${t.leetcodeSolved||0}, today: ${t.leetcodeTodaySolved||0}
- LeetCode streak: ${getDisplayStreak(t)} days
- GitHub commits today: ${num(t.githubTodayCommits)}
- GitHub contributions today: ${num(t.githubTodayContributions)}
- GitHub streak: ${num(t.githubContributionStreak)} days
- YouTube: ${vids.length} videos (${vids.filter(v=>v.educational).length} educational)
- Focus battles: ${batt.filter(b=>b.won).length} wins / ${batt.length} total
- XP today: ${t.todayXP||0}

Write 4-5 sentences: (1) biggest protected-flow win today, (2) the main interruption pattern, (3) the recovery-time cost in plain language, (4) one concrete action for tomorrow. End with brief Pokemon-themed encouragement.`;

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
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get('oakKey', d => { if(d.oakKey) ki.value = d.oakKey; });
      ki.addEventListener('change', () => chrome.storage.local.set({ oakKey: ki.value }));
    }
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
  const flowGuardInput = document.getElementById('flow-guard-enabled');
  const syncBtn = document.getElementById('sync-now-btn');
  const syncStatus = document.getElementById('sync-status');
  const syncHeaderBtn = document.getElementById('sync-header-btn');
  const exportBtn = document.getElementById('export-data-btn');
  const exportStatus = document.getElementById('export-status');

  if (partnerInput) {
    partnerInput.disabled = false;
    partnerInput.title = 'Choose your companion.';
    partnerInput.innerHTML = [
      ['pikachu', 'Pikachu family'],
      ['bulbasaur', 'Bulbasaur family'],
      ['charmander', 'Charmander family'],
      ['squirtle', 'Squirtle family'],
      ['eevee', 'Eevee family']
    ].map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  }

  // Load handles and populate inputs
  sendRuntimeMessage({type: 'GET_DATA', refreshLive: true}, data => {
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
      if (flowGuardInput) flowGuardInput.checked = t.flowGuardEnabled !== false;
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
      flowGuardEnabled: flowGuardInput ? flowGuardInput.checked : true,
      onboarded: true
    };
    sendRuntimeMessage({type: 'UPDATE_PROFILE', fields}, () => {
      // Refresh popup stats
      sendRuntimeMessage({type: 'GET_DATA', refreshLive: true}, refreshData => {
        if (refreshData) {
          renderDashboard(refreshData);
        }
      });
    });
  };

  [nameInput, partnerInput, lcInput, ghInput, cfInput, ccInput, hrInput, trackingPausedInput, flowGuardInput].forEach(inp => {
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
    sendRuntimeMessage({type: 'SYNC_ACCOUNTS', force: true}, res => {
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
        sendRuntimeMessage({type: 'GET_DATA', refreshLive: true}, refreshData => {
          if (refreshData) {
            renderDashboard(refreshData);
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
      sendRuntimeMessage({type: 'EXPORT_DATA'}, res => {
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

  const privacyDebugBtn = document.getElementById('privacy-debug-btn');
  const privacyDebugOutput = document.getElementById('privacy-debug-output');
  if (privacyDebugBtn && privacyDebugOutput) {
    privacyDebugBtn.addEventListener('click', () => {
      if (!latestPopupData || !latestFlowMetrics) return;
      const isHidden = privacyDebugOutput.classList.contains('hidden');
      if (isHidden) {
        privacyDebugOutput.textContent = JSON.stringify(buildPrivacyDebugPayload(latestPopupData, latestFlowMetrics), null, 2);
        privacyDebugOutput.classList.remove('hidden');
        privacyDebugBtn.textContent = 'Hide local data';
      } else {
        privacyDebugOutput.classList.add('hidden');
        privacyDebugBtn.textContent = 'Inspect local data';
      }
    });
  }

  function initOnboarding(form) {
    const obCanvas = document.getElementById('ob-mascot-canvas');
    if (obCanvas) {
      drawPixelMascot(obCanvas, form, true);
      startMascotAnimation(form);
    }
    const container = document.getElementById('ob-particles');
    if (container) {
      container.innerHTML = '';
      const emojis = ['⚡', '⭐', '✨', '🔥', '💫'];
      for (let i = 0; i < 15; i++) {
        const el = document.createElement('div');
        el.className = 'ob-particle';
        el.textContent = emojis[i % emojis.length];
        el.style.left = `${Math.random() * 90}%`;
        el.style.top = `${15 + Math.random() * 75}%`;
        el.style.fontSize = `${12 + Math.random() * 12}px`;
        el.style.setProperty('--dur', `${3 + Math.random() * 3}s`);
        el.style.setProperty('--delay', `${Math.random() * 4}s`);
        container.appendChild(el);
      }
    }
  }

  sendRuntimeMessage({type:'GET_DATA', refreshLive: true}, data=>{
    if (!data) { console.warn('PikaDex: no data from background'); return; }
    
    const t = data.trainer || {};
    const shell = document.querySelector('.shell');
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    
    if (!t.onboarded) {
      if (shell) shell.style.display = 'none';
      if (onboardingOverlay) onboardingOverlay.style.display = 'flex';
      initOnboarding(t.partnerPokemon || 'pikachu');
      return;
    } else {
      if (shell) shell.style.display = '';
      if (onboardingOverlay) onboardingOverlay.style.display = 'none';
    }

    renderDashboard(data);

    // Keep popup stats close to live without stacking overlapping reads.
    let liveRefreshInFlight = false;
    setInterval(() => {
      if (liveRefreshInFlight) return;
      liveRefreshInFlight = true;
      const refreshTimeout = setTimeout(() => {
        liveRefreshInFlight = false;
      }, POPUP_LIVE_REFRESH_MS * 3);
      sendRuntimeMessage({type:'GET_DATA', refreshLive: true}, refreshData => {
        clearTimeout(refreshTimeout);
        liveRefreshInFlight = false;
        if (refreshData && refreshData.trainer && refreshData.trainer.onboarded) {
          renderDashboard(refreshData, { includeOak: false });
        }
      });
    }, POPUP_LIVE_REFRESH_MS);
  });

  const btnOpenOnboarding = document.getElementById('btn-open-onboarding');
  if (btnOpenOnboarding) {
    btnOpenOnboarding.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime?.getURL) {
        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
      } else {
        window.location.href = 'welcome.html';
      }
    });
  }
});

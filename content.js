(function(){
  if (document.getElementById('pikadex-root')) return;
  if (location.protocol === 'chrome-extension:') return;

  // ── SVG SPRITES ──────────────────────────────────────────────
  const PIKA_PICHU = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="54" height="54">
    <polygon points="30,42 22,14 40,32" fill="#FFE57A" stroke="#c8a000" stroke-width="1.5"/>
    <polygon points="70,42 78,14 60,32" fill="#FFE57A" stroke="#c8a000" stroke-width="1.5"/>
    <ellipse cx="50" cy="56" rx="24" ry="22" fill="#FFE57A"/>
    <circle cx="39" cy="50" r="5" fill="#fff"/><circle cx="61" cy="50" r="5" fill="#fff"/>
    <circle cx="40.5" cy="51" r="3" fill="#1a1a1a"/><circle cx="62.5" cy="51" r="3" fill="#1a1a1a"/>
    <circle cx="41.5" cy="49.5" r="1" fill="#fff"/><circle cx="63.5" cy="49.5" r="1" fill="#fff"/>
    <ellipse cx="35" cy="61" rx="6" ry="4" fill="#FFB3B3" opacity="0.8"/>
    <ellipse cx="65" cy="61" rx="6" ry="4" fill="#FFB3B3" opacity="0.8"/>
    <path d="M44 63 Q50 67 56 63" stroke="#c8a000" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="74" rx="13" ry="6" fill="#c8a000"/>
    <ellipse cx="28" cy="65" rx="6" ry="8" fill="#FFE57A" stroke="#c8a000" stroke-width="1"/>
    <ellipse cx="72" cy="65" rx="6" ry="8" fill="#FFE57A" stroke="#c8a000" stroke-width="1"/>
    <text x="62" y="26" font-size="11" fill="#bbb" font-family="sans-serif" font-weight="bold" opacity="0.7">z</text>
    <text x="70" y="17" font-size="14" fill="#999" font-family="sans-serif" font-weight="bold" opacity="0.7">z</text>
  </svg>`;

  const PIKA_PIKACHU = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="54" height="54">
    <polygon points="28,38 18,10 38,28" fill="#FFD700" stroke="#c8a000" stroke-width="1.5"/>
    <polygon points="72,38 82,10 62,28" fill="#FFD700" stroke="#c8a000" stroke-width="1.5"/>
    <rect x="24" y="10" width="8" height="15" rx="4" fill="#222" transform="rotate(-15,28,18)"/>
    <rect x="68" y="10" width="8" height="15" rx="4" fill="#222" transform="rotate(15,72,18)"/>
    <ellipse cx="50" cy="53" rx="26" ry="24" fill="#FFD700"/>
    <circle cx="38" cy="47" r="6" fill="#fff"/>
    <circle cx="62" cy="47" r="6" fill="#fff"/>
    <circle cx="39.5" cy="48" r="3.5" fill="#1a1a1a"/>
    <circle cx="63.5" cy="48" r="3.5" fill="#1a1a1a"/>
    <circle cx="40.5" cy="46.5" r="1.2" fill="#fff"/>
    <circle cx="64.5" cy="46.5" r="1.2" fill="#fff"/>
    <ellipse cx="36" cy="59" rx="7" ry="4.5" fill="#FF6B6B" opacity="0.75"/>
    <ellipse cx="64" cy="59" rx="7" ry="4.5" fill="#FF6B6B" opacity="0.75"/>
    <path d="M44 61 Q50 66 56 61" stroke="#c8a000" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="74" rx="16" ry="7" fill="#c8a000"/>
    <ellipse cx="27" cy="63" rx="7" ry="8.5" fill="#FFD700" stroke="#c8a000" stroke-width="1"/>
    <ellipse cx="73" cy="63" rx="7" ry="8.5" fill="#FFD700" stroke="#c8a000" stroke-width="1"/>
    <path d="M60 71 L82 56 L74 55 L84 42 L68 47" fill="#FFD700" stroke="#c8a000" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;

  const PIKA_RAICHU = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="54" height="54">
    <ellipse cx="28" cy="22" rx="7" ry="18" fill="#c8a000" transform="rotate(-20,28,22)"/>
    <ellipse cx="72" cy="22" rx="7" ry="18" fill="#c8a000" transform="rotate(20,72,22)"/>
    <ellipse cx="28" cy="22" rx="4" ry="13" fill="#FF8C00" transform="rotate(-20,28,22)"/>
    <ellipse cx="72" cy="22" rx="4" ry="13" fill="#FF8C00" transform="rotate(20,72,22)"/>
    <ellipse cx="50" cy="55" rx="28" ry="26" fill="#c8a000"/>
    <ellipse cx="50" cy="62" rx="22" ry="16" fill="#f4a460"/>
    <circle cx="38" cy="48" r="7" fill="#fff"/>
    <circle cx="62" cy="48" r="7" fill="#fff"/>
    <circle cx="39.5" cy="49" r="4.2" fill="#1a1a1a"/>
    <circle cx="63.5" cy="49" r="4.2" fill="#1a1a1a"/>
    <circle cx="41" cy="47.5" r="1.5" fill="#fff"/>
    <circle cx="65" cy="47.5" r="1.5" fill="#fff"/>
    <ellipse cx="34" cy="61" rx="8" ry="5" fill="#FF6B6B" opacity="0.8"/>
    <ellipse cx="66" cy="61" rx="8" ry="5" fill="#FF6B6B" opacity="0.8"/>
    <path d="M43 64 Q50 70 57 64" stroke="#8B6914" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M60 78 Q70 60 80 55 Q72 54 82 42 Q68 47 65 70Z" fill="#c8a000" stroke="#8B6914" stroke-width="1.2"/>
    <circle cx="24" cy="68" r="5" fill="#c8a000" stroke="#8B6914" stroke-width="1"/>
    <circle cx="76" cy="68" r="5" fill="#c8a000" stroke="#8B6914" stroke-width="1"/>
  </svg>`;

  const PIKA_SLEEP = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="54" height="54">
    <polygon points="28,38 18,10 38,28" fill="#FFD700" stroke="#c8a000" stroke-width="1.5"/>
    <polygon points="72,38 82,10 62,28" fill="#FFD700" stroke="#c8a000" stroke-width="1.5"/>
    <ellipse cx="50" cy="53" rx="26" ry="24" fill="#FFD700"/>
    <path d="M33 48 Q38 45 43 48" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M57 48 Q62 45 67 48" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="36" cy="59" rx="7" ry="4.5" fill="#FF6B6B" opacity="0.5"/>
    <ellipse cx="64" cy="59" rx="7" ry="4.5" fill="#FF6B6B" opacity="0.5"/>
    <path d="M44 63 Q50 66 56 63" stroke="#c8a000" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="74" rx="16" ry="7" fill="#c8a000"/>
    <text x="68" y="32" font-size="11" fill="#9090c0" font-family="sans-serif" font-weight="bold">z</text>
    <text x="76" y="21" font-size="15" fill="#7070a0" font-family="sans-serif" font-weight="bold">z</text>
    <text x="85" y="11" font-size="19" fill="#5050a0" font-family="sans-serif" font-weight="bold">z</text>
  </svg>`;

  // ── STYLES ────────────────────────────────────────────────────
  const css = `
#pikadex-root{position:fixed;bottom:18px;right:18px;z-index:2147483647;font-family:-apple-system,sans-serif;user-select:none}
#pikadex-root *{box-sizing:border-box}
#pika-widget{display:flex;flex-direction:column;align-items:center;cursor:pointer;position:relative}
#pika-wrap{width:70px;height:70px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff9d6,#FFD700);border:3px solid #c8a000;display:flex;align-items:center;justify-content:center;animation:pFloat 3s ease-in-out infinite;box-shadow:0 4px 16px rgba(200,160,0,.4);position:relative;overflow:visible}
#pika-status{width:12px;height:12px;border-radius:50%;background:#4CAF50;border:2px solid #fff;position:absolute;bottom:1px;right:1px;z-index:2}
#pika-label{margin-top:5px;font-size:9px;font-weight:700;color:#854F0B;letter-spacing:.05em;text-transform:uppercase;background:#FAEEDA;padding:2px 8px;border-radius:999px;border:1.5px solid #EF9F27;white-space:nowrap}
#pika-bubble{position:absolute;bottom:78px;right:0;background:#fff;border:2px solid #FFD700;border-radius:14px 14px 2px 14px;padding:8px 12px;font-size:11.5px;color:#222;max-width:200px;line-height:1.5;display:none;box-shadow:0 3px 12px rgba(0,0,0,.15);z-index:10}
#pika-bubble::after{content:'';position:absolute;bottom:-9px;right:14px;border:5px solid transparent;border-top-color:#FFD700}
#pika-xp{position:absolute;bottom:80px;right:4px;font-size:12px;font-weight:800;color:#fff;background:#2d7a2d;padding:3px 10px;border-radius:999px;white-space:nowrap;display:none;pointer-events:none}

/* ANIMATIONS */
@keyframes pFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-7px) rotate(1.5deg)}}
@keyframes pWave{0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(-22deg) translateY(-4px)}75%{transform:rotate(22deg) translateY(-4px)}}
@keyframes pCelebrate{0%{transform:scale(1) rotate(0)}20%{transform:scale(1.35) rotate(-8deg)}40%{transform:scale(1.3) rotate(8deg)}60%{transform:scale(1.25) rotate(-5deg)}80%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0)}}
@keyframes pWarn{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}60%{transform:translateX(7px)}}
@keyframes pSleep{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-3px) rotate(2deg)}}
@keyframes pRun{0%{transform:translateX(110px) scaleX(-1);opacity:0}70%{opacity:1}100%{transform:translateX(0) scaleX(1);opacity:1}}
@keyframes xpPop{0%{opacity:1;transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.1)}100%{opacity:0;transform:translateY(-36px) scale(.9)}}

/* EVOLUTION FLASH */
@keyframes evoFlash{0%,100%{filter:brightness(1)}25%{filter:brightness(3) saturate(3)}50%{filter:brightness(1.5) hue-rotate(60deg)}75%{filter:brightness(2.5) saturate(2)}}
@keyframes evoPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.6)}}
@keyframes evoRing{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.5)}}
#evo-ring{position:absolute;inset:-8px;border-radius:50%;border:3px solid #FFD700;pointer-events:none;display:none}
`;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.id = 'pikadex-root';
  root.innerHTML = `
    <div id="pika-widget">
      <div style="position:relative">
        <div id="pika-xp"></div>
        <div id="pika-bubble"></div>
        <div id="evo-ring"></div>
        <div id="pika-wrap">
          <div id="pika-inner"></div>
          <div id="pika-status"></div>
        </div>
      </div>
      <div id="pika-label">⚡ PikaDex</div>
    </div>`;
  document.body.appendChild(root);

  const wrap    = document.getElementById('pika-wrap');
  const inner   = document.getElementById('pika-inner');
  const bubble  = document.getElementById('pika-bubble');
  const xpEl    = document.getElementById('pika-xp');
  const statusDot = document.getElementById('pika-status');
  const label   = document.getElementById('pika-label');
  const evoRing = document.getElementById('evo-ring');

  let state = 'idle';
  let currentStage = 'pikachu'; // pichu | pikachu | raichu
  let idleBack = null;
  let lastActivity = Date.now();
  let bubbleTimer = null;

  const SPRITES = {pichu: PIKA_PICHU, pikachu: PIKA_PIKACHU, raichu: PIKA_RAICHU, sleep: PIKA_SLEEP};

  function setSprite(stage) {
    inner.innerHTML = SPRITES[stage] || SPRITES.pikachu;
  }

  function setStage(stage, animate=false) {
    currentStage = stage;
    if (animate) {
      playEvoAnimation(stage);
    } else {
      setSprite(stage);
      const colors = {pichu:{bg:'radial-gradient(circle at 35% 35%,#fffde0,#FFE57A)',border:'#c8a000'},pikachu:{bg:'radial-gradient(circle at 35% 35%,#fff9d6,#FFD700)',border:'#c8a000'},raichu:{bg:'radial-gradient(circle at 35% 35%,#ffe8a0,#c8a000)',border:'#8B6914'}};
      const c = colors[stage]||colors.pikachu;
      wrap.style.background = c.bg;
      wrap.style.borderColor = c.border;
    }
  }

  function playEvoAnimation(newStage) {
    wrap.style.animation = 'evoFlash 0.4s ease-in-out 5, evoPulse 0.4s ease-in-out 5';
    evoRing.style.display = 'block';
    evoRing.style.animation = 'evoRing 0.6s ease-out 4';
    showBubble(newStage==='pikachu' ? '✨ Evolved to Pikachu! 3h focus! ⚡' : '⚡⚡ RAICHU! 10h BEAST MODE!!', 5000);
    setTimeout(() => {
      setSprite(newStage);
      wrap.style.animation = 'pFloat 3s ease-in-out infinite';
      evoRing.style.display = 'none';
      evoRing.style.animation = '';
    }, 2000);
  }

  function setState(newState, msg, dur=3500) {
    state = newState;
    clearTimeout(idleBack);
    const cfgs = {
      idle:      {anim:'pFloat 3s ease-in-out infinite',     dot:'#4CAF50', lbl:'⚡ PikaDex'},
      wave:      {anim:'pWave 0.55s ease-in-out 3',         dot:'#4CAF50', lbl:'⚡ PikaDex'},
      celebrate: {anim:'pCelebrate 0.45s ease-in-out 4',   dot:'#FFD700', lbl:'⚡ PikaDex'},
      warn:      {anim:'pWarn 0.25s ease-in-out 5',         dot:'#FF5722', lbl:'⚠️ Focus!'},
      sleep:     {anim:'pSleep 3.5s ease-in-out infinite',  dot:'#9090c0', lbl:'💤 Sleeping'},
    };
    const cfg = cfgs[newState]||cfgs.idle;
    wrap.style.animation = cfg.anim;
    statusDot.style.background = cfg.dot;
    label.textContent = cfg.lbl;
    if (newState==='sleep') {
      setSprite('sleep');
      wrap.style.background = 'radial-gradient(circle at 35% 35%,#e8e8ff,#c8c8f0)';
      wrap.style.borderColor = '#8080c0';
    } else if (state !== 'sleep') {
      setSprite(currentStage);
      const stageColors = {pichu:{bg:'radial-gradient(circle at 35% 35%,#fffde0,#FFE57A)',border:'#c8a000'},pikachu:{bg:'radial-gradient(circle at 35% 35%,#fff9d6,#FFD700)',border:'#c8a000'},raichu:{bg:'radial-gradient(circle at 35% 35%,#ffe8a0,#c8a000)',border:'#8B6914'}};
      const sc = stageColors[currentStage]||stageColors.pikachu;
      wrap.style.background = sc.bg;
      wrap.style.borderColor = sc.border;
    }
    if (msg) showBubble(msg, dur);
    if (newState!=='idle'&&newState!=='sleep') {
      idleBack = setTimeout(()=>setState('idle'), dur);
    }
  }

  function showBubble(msg, dur=3500) {
    clearTimeout(bubbleTimer);
    bubble.textContent = msg;
    bubble.style.display = 'block';
    bubbleTimer = setTimeout(()=>{ bubble.style.display='none'; }, dur);
  }

  function showXP(amount) {
    xpEl.textContent = '+'+amount+' XP!';
    xpEl.style.display = 'block';
    xpEl.style.animation = 'none';
    void xpEl.offsetWidth;
    xpEl.style.animation = 'xpPop 1.5s ease-out forwards';
    setTimeout(()=>{ xpEl.style.display='none'; }, 1600);
  }

  // Initial entrance
  wrap.style.animation = 'pRun 0.7s ease-out';
  setSprite('pikachu');
  chrome.runtime.sendMessage({type: 'GET_DATA'}, res => {
    const name = res?.trainer?.trainerName || 'Trainer';
    setState('wave', `Hey Trainer ${name}! Let's catch some XP! ⚡`);
  });

  // Interactions
  const MSGS = [
    'Keep going, you got this! ⚡','Every commit makes you stronger!',
    'Stay focused, Trainer!','Pikachu believes in you! ⚡',
    'One more solve! You\'re so close!','Grind mode ON! ⚡',
    'You\'re building something great!','Don\'t stop now — keep leveling up!'
  ];
  document.getElementById('pika-widget').addEventListener('click', ()=>{
    if (state==='sleep') setState('wave','Back to work, Trainer! ⚡');
    else setState('wave', MSGS[Math.floor(Math.random()*MSGS.length)]);
  });

  // Hide on double right-click
  let rClicks=0, rTimer;
  document.getElementById('pika-widget').addEventListener('contextmenu', e=>{
    e.preventDefault(); rClicks++;
    clearTimeout(rTimer); rTimer=setTimeout(()=>rClicks=0, 800);
    if (rClicks>=2) { root.style.display='none'; rClicks=0; setTimeout(()=>{ root.style.display='block'; setState('wave','I\'m back! 👋'); }, 30*60*1000); }
  });

  // Activity tracking for PikaDex companion widget
  document.addEventListener('mousemove',()=>{ lastActivity=Date.now(); if(state==='sleep') setState('idle'); },{passive:true});
  document.addEventListener('keydown',  ()=>{ lastActivity=Date.now(); if(state==='sleep') setState('idle'); },{passive:true});
  setInterval(()=>{
    if (Date.now()-lastActivity > 10*60*1000 && state!=='sleep') setState('sleep','Zzz... come back soon! 💤');
  }, 60000);

  // --- Central Heartbeat Engine ---
  let lastActivityTimestamp = Date.now();
  ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => {
      lastActivityTimestamp = Date.now();
    }, { passive: true });
  });

  // ChatGPT Chat Tracker
  if (window.location.hostname.includes('chatgpt.com')) {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target;
        if (target && (target.id === 'prompt-textarea' || target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true')) {
          const text = target.value || target.textContent || '';
          if (text.trim().length > 0) {
            chrome.runtime.sendMessage({ type: 'CHATGPT_MESSAGE_SENT' });
          }
        }
      }
    });

    window.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-testid="send-button"], button');
      if (button) {
        const isSend = button.getAttribute('data-testid') === 'send-button' || 
                       button.querySelector('svg') ||
                       button.innerHTML.includes('arrow') ||
                       button.className.includes('send');
        if (isSend) {
          const ta = document.getElementById('prompt-textarea') || document.querySelector('textarea');
          if (ta && (ta.value || ta.textContent || '').trim().length > 0) {
            chrome.runtime.sendMessage({ type: 'CHATGPT_MESSAGE_SENT' });
          }
        }
      }
    });
  }

  // YouTube Info Scraper
  function getYouTubeInfo() {
    const isWatch = window.location.pathname.startsWith('/watch');
    const isShorts = window.location.pathname.startsWith('/shorts');
    if (!window.location.hostname.includes('youtube.com') || (!isWatch && !isShorts)) {
      return null;
    }
    
    // Select the active video element that is playing if multiple exist
    const videos = Array.from(document.querySelectorAll('video'));
    const video = videos.find(v => !v.paused && !v.ended && v.readyState > 2) || videos[0];
    const isPlaying = video && !video.paused && !video.ended && video.readyState > 2;

    const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.style-scope.ytd-video-primary-info-renderer, ytd-watch-metadata h1, h2.title.ytd-reel-player-header-renderer');
    const title = titleEl?.textContent?.trim() || '';

    const channelEl = document.querySelector('#upload-info #channel-name a, yt-formatted-string.ytd-channel-name a, #text.ytd-channel-name, ytd-video-owner-renderer #channel-name a, ytd-reel-player-header-renderer #channel-name a');
    const channel = channelEl?.textContent?.trim() || '';

    let videoId = '';
    if (isWatch) {
      videoId = new URLSearchParams(window.location.search).get('v') || '';
    } else if (isShorts) {
      const parts = window.location.pathname.split('/');
      videoId = parts[parts.indexOf('shorts') + 1] || '';
    }

    return {
      videoId,
      title,
      channel,
      isPlaying,
      isShorts
    };
  }

  // GitHub Repo Scraper
  function getGitHubRepo() {
    if (window.location.hostname !== 'github.com') return null;
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const reserved = ['settings', 'notifications', 'search', 'trending', 'explore', 'marketplace', 'organizations', 'sponsors', 'site', 'security', 'contact', 'about', 'features', 'readme', 'pulls', 'issues', 'new', 'organizations', 'account'];
      if (!reserved.includes(parts[0])) {
        return parts[0] + '/' + parts[1];
      }
    }
    return null;
  }

  // LeetCode Problem Scraper
  function getLeetCodeProblem() {
    if (!window.location.hostname.includes('leetcode.com')) return null;
    const match = window.location.pathname.match(/\/problems\/([^\/]+)/);
    return match ? match[1] : null;
  }

  // Every 5 seconds, check conditions and send heartbeat
  setInterval(() => {
    const isVisible = document.visibilityState === 'visible';
    const ytInfo = getYouTubeInfo();

    // If YouTube video is actively playing, keep user activity alive
    if (ytInfo && ytInfo.isPlaying) {
      lastActivityTimestamp = Date.now();
    }

    const isUserActive = (Date.now() - lastActivityTimestamp) <= 60000;

    chrome.runtime.sendMessage({
      type: 'HEARTBEAT',
      domain: window.location.hostname.replace('www.', ''),
      url: window.location.href,
      visible: isVisible,
      userActive: isUserActive,
      youtube: ytInfo,
      githubRepo: getGitHubRepo(),
      leetcodeProblem: getLeetCodeProblem()
    });
  }, 5000);

  // Message listener
  try {
    chrome.runtime.onMessage.addListener(msg => {
      if (!msg?.type) return;
      if (msg.type==='PIKA_CELEBRATE') { setState('celebrate', msg.text||'Amazing! ⚡', 4000); if(msg.xp) showXP(msg.xp); }
      if (msg.type==='PIKA_WARN')      setState('warn', msg.text||'Focus!', 3000);
      if (msg.type==='PIKA_XP')        showXP(msg.xp||0);
      if (msg.type==='PIKA_WAVE')      setState('wave', msg.text||'Hey!', 3000);
      if (msg.type==='PIKA_EVOLVE')    { setStage(msg.stage, true); setState('celebrate', msg.text, 5000); }
    });
  } catch(e) {}
})();

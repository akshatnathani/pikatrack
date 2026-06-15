(function(){
  if (document.getElementById('pikadex-root')) return;
  if (location.protocol === 'chrome-extension:') return;

  // ── PIXEL GRIDS & PALETTES ───────────────────────────────────
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
    ]
  };

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
    }
  };

  const EYE_COLS = {
    pichu: [5, 6, 9, 10],
    pikachu: [4, 5, 10, 11],
    raichu: [3, 4, 10, 11],
    bulbasaur: [4, 5, 8, 9],
    charmander: [4, 5, 6],
    squirtle: [4, 5],
    eevee: [4, 5, 10, 11]
  };

  const STAGE_NAMES = {
    pichu: 'Pichu',
    pikachu: 'Pikachu',
    raichu: 'Raichu',
    bulbasaur: 'Bulbasaur',
    charmander: 'Charmander',
    squirtle: 'Squirtle',
    eevee: 'Eevee'
  };

  function getEvoStage(todayFocusMs) {
    const h = (todayFocusMs || 0) / 3600000;
    if (h >= 10) return 'raichu';
    if (h >= 3)  return 'pikachu';
    return 'pichu';
  }

  function getCompanionForm(t = {}) {
    const partner = t.partnerPokemon || 'pikachu';
    return partner === 'pikachu' ? getEvoStage(t.todayFocusMs || 0) : partner;
  }

  function drawPixelMascot(canvas, form, eyeState = 'open') {
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
        
        if (eyeState === 'blink') {
          if (char === 'e' || char === 'w') {
            color = palette.y;
          }
          const cols = EYE_COLS[form] || EYE_COLS.pikachu;
          if (r === 6 && cols.includes(c)) {
            color = palette.s;
          }
        } else if (eyeState === 'happy') {
          if (char === 'e' || char === 'w') {
            color = palette.y;
          }
          if (form === 'pichu') {
            if ((r === 5 && (c === 5 || c === 10)) || (r === 6 && (c === 4 || c === 6 || c === 9 || c === 11))) {
              color = palette.s;
            }
          } else if (form === 'pikachu') {
            if ((r === 5 && (c === 4 || c === 11)) || (r === 6 && (c === 3 || c === 5 || c === 10 || c === 12))) {
              color = palette.s;
            }
          } else if (form === 'raichu') {
            if ((r === 5 && (c === 3 || c === 11)) || (r === 6 && (c === 2 || c === 4 || c === 10 || c === 12))) {
              color = palette.s;
            }
          }
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }
  }

  const css = `
#pikadex-root{position:fixed;bottom:18px;right:18px;z-index:2147483647;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;user-select:none;pointer-events:none}
#pikadex-root *{box-sizing:border-box}
#pika-widget{display:grid;grid-template-columns:86px minmax(92px,154px);align-items:end;gap:8px;cursor:pointer;position:relative;pointer-events:auto;transform-origin:bottom right;filter:drop-shadow(0 12px 18px rgba(0,0,0,.26))}
#pika-stage{position:relative;width:86px;height:106px;display:flex;align-items:flex-end;justify-content:center}
#pika-wrap{width:86px;height:106px;background:transparent;border:0;display:flex;align-items:flex-end;justify-content:center;animation:pFloat 3.6s ease-in-out infinite;box-shadow:none;position:relative;overflow:visible;will-change:transform}
#pika-wrap::after{content:'';position:absolute;left:18px;right:13px;bottom:3px;height:10px;border-radius:999px;background:radial-gradient(ellipse at center,rgba(31,25,16,.34),rgba(31,25,16,0) 70%);filter:blur(.5px);z-index:0}
#pika-inner{width:104px;height:114px;display:flex;align-items:flex-end;justify-content:center;position:relative;z-index:1}
#pika-canvas{display:block;width:80px;height:80px;image-rendering:pixelated;image-rendering:crisp-edges;transform:translateY(5px);filter:drop-shadow(0 6px 8px rgba(26,23,20,.18))}
#pika-canvas.is-charged{filter:drop-shadow(0 0 8px rgba(244,180,0,.45)) drop-shadow(0 6px 8px rgba(26,23,20,.18))}
#pika-canvas.is-sleeping{filter:drop-shadow(0 6px 8px rgba(26,23,20,.12)) saturate(.9)}
#pika-status{width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid rgba(255,255,255,.96);position:absolute;bottom:15px;right:8px;z-index:3;box-shadow:0 4px 10px rgba(0,0,0,.26)}
#pika-card{margin-bottom:14px;padding:8px 10px 9px;background:rgba(255,255,255,.9);border:1px solid rgba(31,41,51,.12);border-radius:14px;box-shadow:0 10px 24px rgba(15,23,42,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:transform .18s ease,opacity .18s ease,box-shadow .18s ease;opacity:.93}
#pika-widget:hover #pika-card{transform:translateY(-2px);opacity:1;box-shadow:0 14px 30px rgba(15,23,42,.22)}
#pika-label{display:block;margin-bottom:2px;font-size:8px;line-height:1;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#9a6b16;white-space:nowrap}
#pika-activity{display:block;font-size:11px;line-height:1.25;font-weight:800;color:#1f2933;max-width:136px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pika-bubble{position:absolute;bottom:92px;right:12px;background:rgba(255,255,255,.96);border:1px solid rgba(244,180,0,.55);border-radius:16px 16px 3px 16px;padding:9px 12px;font-size:11.5px;font-weight:700;color:#1f2933;max-width:214px;line-height:1.45;display:none;box-shadow:0 14px 34px rgba(15,23,42,.22);z-index:10;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
#pika-bubble::after{content:'';position:absolute;bottom:-7px;right:20px;width:12px;height:12px;background:rgba(255,255,255,.96);border-right:1px solid rgba(244,180,0,.55);border-bottom:1px solid rgba(244,180,0,.55);transform:rotate(45deg)}
#pika-xp{position:absolute;bottom:92px;right:4px;font-size:12px;font-weight:900;color:#0f2f1d;background:#c8f7d5;border:1px solid rgba(34,197,94,.35);padding:4px 10px;border-radius:999px;white-space:nowrap;display:none;pointer-events:none;box-shadow:0 8px 20px rgba(15,23,42,.18)}

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
#evo-ring{position:absolute;inset:8px 0 0 0;border-radius:42% 46% 45% 48%;border:2px solid rgba(255,215,0,.78);pointer-events:none;display:none;z-index:4}
@media (max-width:640px){
  #pikadex-root{right:12px;bottom:14px}
  #pika-widget{grid-template-columns:76px;gap:0;justify-items:center}
  #pika-stage{width:76px;height:96px}
  #pika-wrap{width:76px;height:96px}
  #pika-inner{width:94px;height:104px}
  #pika-canvas{width:64px;height:64px}
  #pika-card{max-width:118px;margin-top:-4px;margin-bottom:0;padding:6px 8px}
  #pika-label{font-size:7px}
  #pika-activity{font-size:10px;max-width:100px}
}
`;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.id = 'pikadex-root';
  root.innerHTML = `
    <div id="pika-widget">
      <div id="pika-stage">
        <div id="pika-xp"></div>
        <div id="pika-bubble"></div>
        <div id="evo-ring"></div>
        <div id="pika-wrap">
          <div id="pika-inner"><canvas id="pika-canvas" width="256" height="256"></canvas></div>
          <div id="pika-status"></div>
        </div>
      </div>
      <div id="pika-card">
        <div id="pika-label">Focus buddy</div>
        <div id="pika-activity">Watching page</div>
      </div>
    </div>`;
  document.body.appendChild(root);

  const wrap    = document.getElementById('pika-wrap');
  const inner   = document.getElementById('pika-inner');
  const bubble  = document.getElementById('pika-bubble');
  const xpEl    = document.getElementById('pika-xp');
  const statusDot = document.getElementById('pika-status');
  const label   = document.getElementById('pika-label');
  const activityEl = document.getElementById('pika-activity');
  const evoRing = document.getElementById('evo-ring');

  let state = 'idle';
  let currentStage = 'pikachu'; // pichu | pikachu | raichu
  let currentPartner = 'pikachu';
  let idleBack = null;
  let lastActivity = Date.now();
  let bubbleTimer = null;

  let _blinkState = 'open';
  let _blinkTimer = null;
  let _blinkCount = 0;

  function drawCompanion() {
    const canvas = document.getElementById('pika-canvas');
    if (!canvas) return;
    
    let activeForm = currentStage;
    let eyeState = _blinkState;
    
    if (state === 'sleep') {
      eyeState = 'blink';
      canvas.className = 'is-sleeping';
    } else if (state === 'celebrate') {
      eyeState = 'happy';
      canvas.className = (activeForm === 'raichu') ? 'is-charged' : '';
    } else {
      canvas.className = (activeForm === 'raichu') ? 'is-charged' : '';
    }
    
    drawPixelMascot(canvas, activeForm, eyeState);
  }

  function startBlinkingLoop() {
    if (_blinkTimer) clearTimeout(_blinkTimer);
    const nextBlink = () => {
      _blinkTimer = setTimeout(() => {
        if (state !== 'sleep' && state !== 'celebrate') {
          _blinkState = 'blink';
          drawCompanion();
          setTimeout(() => {
            _blinkState = 'open';
            drawCompanion();
            nextBlink();
          }, 150);
        } else {
          nextBlink();
        }
      }, 3000 + Math.random() * 3000);
    };
    nextBlink();
  }

  let extensionInvalidated = false;
  let heartbeatInterval = null;
  let sleepCheckInterval = null;
  const HEARTBEAT_INTERVAL_MS = 2000;

  function isExtensionValid() {
    if (extensionInvalidated) return false;
    try {
      return typeof chrome !== 'undefined' && !!chrome.runtime.id;
    } catch (error) {
      extensionInvalidated = true;
      stopExtensionWork();
      return false;
    }
  }

  function stopExtensionWork() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    if (sleepCheckInterval) clearInterval(sleepCheckInterval);
    sleepCheckInterval = null;
  }

  function safeSendMessage(message, callback) {
    if (!isExtensionValid()) return;
    try {
      chrome.runtime.sendMessage(message, response => {
        try {
          if (chrome.runtime.lastError) return;
          if (callback) callback(response);
        } catch (error) {
          extensionInvalidated = true;
          stopExtensionWork();
        }
      });
    } catch (error) {
      extensionInvalidated = true;
      stopExtensionWork();
    }
  }

  function setSprite(stage) {
    drawCompanion();
  }

  function setStage(stage, animate=false) {
    currentStage = stage;
    if (animate) {
      playEvoAnimation(stage);
    } else {
      setSprite(stage);
      wrap.style.background = 'transparent';
      wrap.style.borderColor = 'transparent';
    }
  }

  function playEvoAnimation(newStage) {
    wrap.style.animation = 'evoFlash 0.4s ease-in-out 5, evoPulse 0.4s ease-in-out 5';
    evoRing.style.display = 'block';
    evoRing.style.animation = 'evoRing 0.6s ease-out 4';
    const dispName = STAGE_NAMES[newStage] || 'Pikachu';
    showBubble(newStage === 'pikachu' ? 'Pikachu powered up after 3h focus!' : 'Pikachu hit 10h focus mode!', 5000);
    setTimeout(() => {
      setSprite(newStage);
      wrap.style.animation = 'pFloat 3.6s ease-in-out infinite';
      evoRing.style.display = 'none';
      evoRing.style.animation = '';
    }, 2000);
  }

  function setState(newState, msg, dur=3500) {
    state = newState;
    clearTimeout(idleBack);
    const currentName = STAGE_NAMES[currentStage] || 'Pikachu';
    const cfgs = {
      idle:      {anim:'pFloat 3.6s ease-in-out infinite',  dot:'#4CAF50', lbl:currentName, animDur:0},
      wave:      {anim:'pWave 0.55s ease-in-out 3',         dot:'#4CAF50', lbl:currentName, animDur:1650},
      celebrate: {anim:'pCelebrate 0.45s ease-in-out 4',   dot:'#FFD700', lbl:currentName, animDur:1800},
      warn:      {anim:'pWarn 0.25s ease-in-out 5',         dot:'#FF5722', lbl:'Focus buddy', animDur:1250},
      sleep:     {anim:'pSleep 3.5s ease-in-out infinite',  dot:'#9090c0', lbl:currentName + ' resting', animDur:0},
    };
    const cfg = cfgs[newState]||cfgs.idle;
    wrap.style.animation = cfg.anim;
    statusDot.style.background = cfg.dot;
    label.textContent = cfg.lbl;
    if (newState==='sleep') {
      setSprite('sleep');
      if (activityEl) activityEl.textContent = 'Taking a tiny nap';
      wrap.style.background = 'transparent';
      wrap.style.borderColor = 'transparent';
    } else if (state !== 'sleep') {
      setSprite(currentStage);
      wrap.style.background = 'transparent';
      wrap.style.borderColor = 'transparent';
    }
    if (msg) showBubble(msg, dur);
    if (newState!=='idle'&&newState!=='sleep') {
      idleBack = setTimeout(()=>setState('idle'), cfg.animDur);
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
  startBlinkingLoop();
  safeSendMessage({type: 'GET_DATA'}, res => {
    const t = res?.trainer || {};
    const name = t.trainerName || 'Trainer';
    currentPartner = t.partnerPokemon || 'pikachu';
    const initCompanion = getCompanionForm(t);
    setStage(initCompanion, false);
    setState('idle', `Hey Trainer ${name}! Let's catch some XP! ⚡`);
  });

  // Interactions
  const MSGS = [
    'Keep going, you got this! ⚡','Every commit makes you stronger!',
    'Stay focused, Trainer!','Pikachu believes in you! ⚡',
    'One more solve! You\'re so close!','Grind mode ON! ⚡',
    'You\'re building something great!','Don\'t stop now — keep leveling up!'
  ];
  document.getElementById('pika-widget').addEventListener('click', ()=>{
    if (state==='sleep') setState('idle','Back to work, Trainer! ⚡');
    else setState('idle', MSGS[Math.floor(Math.random()*MSGS.length)]);
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
  sleepCheckInterval = setInterval(()=>{
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
    let lastChatSubmit = { text: '', at: 0 };
    const trackChatSubmit = (text) => {
      const clean = String(text || '').trim();
      const now = Date.now();
      if (!clean || (clean === lastChatSubmit.text && now - lastChatSubmit.at < 2500)) return;
      lastChatSubmit = { text: clean, at: now };
      safeSendMessage({ type: 'CHATGPT_MESSAGE_SENT' });
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target;
        if (target && (target.id === 'prompt-textarea' || target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true')) {
          trackChatSubmit(target.value || target.textContent || '');
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
          if (ta) trackChatSubmit(ta.value || ta.textContent || '');
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

  function formatProblemSlug(slug) {
    return String(slug || '')
      .split('-')
      .filter(Boolean)
      .slice(0, 3)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function updateActivityLabel({ ytInfo, githubRepo, leetcodeProblem, isUserActive }) {
    if (!activityEl) return;
    if (!isUserActive) {
      activityEl.textContent = 'Waiting with you';
      return;
    }
    if (ytInfo?.isPlaying) {
      activityEl.textContent = ytInfo.isShorts ? 'Watching Shorts' : 'Watching YouTube';
      return;
    }
    if (leetcodeProblem) {
      activityEl.textContent = 'Solving ' + formatProblemSlug(leetcodeProblem);
      return;
    }
    if (githubRepo) {
      activityEl.textContent = 'Working on ' + githubRepo;
      return;
    }
    if (window.location.hostname.includes('chatgpt.com')) {
      activityEl.textContent = 'Prompting ChatGPT';
      return;
    }
    const domain = window.location.hostname.replace(/^www\./, '');
    activityEl.textContent = domain ? 'On ' + domain : 'Keeping watch';
  }

  function sendHeartbeat() {
    if (!isExtensionValid()) return;
    const isVisible = document.visibilityState === 'visible';
    const ytInfo = getYouTubeInfo();
    const githubRepo = getGitHubRepo();
    const leetcodeProblem = getLeetCodeProblem();

    // If YouTube video is actively playing, keep user activity alive
    if (ytInfo && ytInfo.isPlaying) {
      lastActivityTimestamp = Date.now();
    }

    const isUserActive = (Date.now() - lastActivityTimestamp) <= 60000;
    updateActivityLabel({ ytInfo, githubRepo, leetcodeProblem, isUserActive });

    safeSendMessage({
      type: 'HEARTBEAT',
      domain: window.location.hostname.replace('www.', ''),
      url: window.location.href,
      visible: isVisible,
      userActive: isUserActive,
      lastActivityAt: lastActivityTimestamp,
      youtube: ytInfo,
      githubRepo,
      leetcodeProblem
    });
  }

  // Keep active time close to real-time without waiting for the first interval tick.
  sendHeartbeat();
  heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  window.addEventListener('focus', sendHeartbeat, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sendHeartbeat();
  }, { passive: true });

  // Message listener
  if (isExtensionValid()) {
    try {
      chrome.runtime.onMessage.addListener(msg => {
        if (!isExtensionValid() || !msg?.type) return;
        if (msg.type==='PIKA_CELEBRATE') { setState('celebrate', msg.text||'Amazing! ⚡', 4000); if(msg.xp) showXP(msg.xp); }
        if (msg.type==='PIKA_WARN')      setState('warn', msg.text||'Focus!', 3000);
        if (msg.type==='PIKA_XP')        showXP(msg.xp||0);
        if (msg.type==='PIKA_WAVE')      setState('idle', msg.text||'Hey!', 3000);
        if (msg.type==='PIKA_EVOLVE' && currentPartner === 'pikachu') { setStage(msg.stage, true); setState('celebrate', msg.text, 5000); }
      });
    } catch (error) {
      extensionInvalidated = true;
      stopExtensionWork();
    }
  }
})();

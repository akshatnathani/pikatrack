'use strict';

const PIXEL_GRIDS = {
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
  ]
};

const PIXEL_PALETTES = {
  pikachu: {
    y: '#ffcc00', b: '#ffe57f', c: '#ff3b50', d: '#1a1200', s: '#1a1200', e: '#1a1200', w: '#ffffff'
  }
};

const EYE_COLS = [4, 5, 10, 11];

function drawWelcomeMascot(canvas, blinkOpen = true) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const scale = W / 16;
  const palette = PIXEL_PALETTES.pikachu;
  const grid = PIXEL_GRIDS.pikachu;
  
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
          color = palette.y;
        }
        if (r === 6 && EYE_COLS.includes(c)) {
          color = palette.s;
        }
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(c * scale, r * scale, scale, scale);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('welcome-mascot-canvas');
  const form = document.getElementById('setup-form');
  const formView = document.getElementById('form-view');
  const successView = document.getElementById('success-view');
  const displayName = document.getElementById('trainer-display-name');
  
  // Step Navigation Elements
  const step1 = document.getElementById('step-1-content');
  const step2 = document.getElementById('step-2-content');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnSave = document.getElementById('btn-save');
  
  const dot1 = document.getElementById('dot-1');
  const dot2 = document.getElementById('dot-2');
  const dot3 = document.getElementById('dot-3');
  const subtitle = document.getElementById('welcome-subtitle');

  // Draw Mascot & Start Blink Loop
  if (canvas) {
    let blinkOpen = true;
    setInterval(() => {
      blinkOpen = false;
      drawWelcomeMascot(canvas, false);
      setTimeout(() => {
        blinkOpen = true;
        drawWelcomeMascot(canvas, true);
      }, 150);
    }, 3000);
    drawWelcomeMascot(canvas, true);
  }

  // Generate background floating particles
  const container = document.getElementById('ob-particles');
  if (container) {
    container.innerHTML = '';
    const emojis = ['\\u26A1', '\\u2B50', '\\u2728', '\\u{1F525}', '\\u{1F4AB}'];
    for (let i = 0; i < 20; i++) {
      const el = document.createElement('div');
      el.className = 'ob-particle';
      el.textContent = emojis[i % emojis.length];
      el.style.left = `${Math.random() * 95}%`;
      el.style.top = `${10 + Math.random() * 80}%`;
      el.style.fontSize = `${12 + Math.random() * 14}px`;
      el.style.setProperty('--dur', `${4 + Math.random() * 4}s`);
      el.style.setProperty('--delay', `${Math.random() * 5}s`);
      container.appendChild(el);
    }
  }

  // Step 1 -> Step 2
  btnNext.addEventListener('click', () => {
    const trainerNameInput = document.getElementById('trainer-name');
    if (!trainerNameInput.value.trim()) {
      trainerNameInput.reportValidity();
      return;
    }
    step1.classList.remove('active');
    step2.classList.add('active');
    dot1.classList.remove('active');
    dot1.classList.add('complete');
    dot2.classList.add('active');
    if (subtitle) {
      subtitle.textContent = 'Connect your developer accounts (optional)';
    }
  });

  // Step 2 -> Step 1 (Back)
  btnPrev.addEventListener('click', () => {
    step2.classList.remove('active');
    step1.classList.add('active');
    dot2.classList.remove('active');
    dot1.classList.remove('complete');
    dot1.classList.add('active');
    if (subtitle) {
      subtitle.textContent = 'Set up your Pokemon Productivity Companion';
    }
  });

  // Form submit (Step 2 -> Step 3)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    btnSave.disabled = true;
    btnSave.textContent = 'Configuring...';

    const fields = {
      trainerName: document.getElementById('trainer-name').value.trim() || 'Red',
      leetcodeUsername: document.getElementById('leetcode-username').value.trim(),
      githubUsername: document.getElementById('github-username').value.trim(),
      codeforcesHandle: document.getElementById('codeforces-handle').value.trim(),
      codechefHandle: document.getElementById('codechef-handle').value.trim(),
      hackerrankUsername: document.getElementById('hackerrank-username').value.trim(),
      onboarded: true
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'UPDATE_PROFILE', fields }, () => {
        chrome.runtime.sendMessage({ type: 'SYNC_ACCOUNTS' }, () => {
          displayName.textContent = fields.trainerName;
          formView.style.display = 'none';
          successView.style.display = 'block';
          
          dot2.classList.remove('active');
          dot2.classList.add('complete');
          dot3.classList.add('active');
        });
      });
    } else {
      console.warn("PikaDex: Not in extension context, simulating registration completion.");
      displayName.textContent = fields.trainerName;
      formView.style.display = 'none';
      successView.style.display = 'block';
      
      dot2.classList.remove('active');
      dot2.classList.add('complete');
      dot3.classList.add('active');
    }
  });
});

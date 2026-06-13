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

  const PIXEL_PIKACHU = `<svg class="pixel-partner" viewBox="0 0 16 16" width="54" height="54" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-label="Pixel Pikachu">
    <rect width="16" height="16" fill="none"/>
    <rect x="3" y="0" width="2" height="4" fill="#33251a"/>
    <rect x="11" y="0" width="2" height="4" fill="#33251a"/>
    <rect x="4" y="2" width="1" height="3" fill="#ffd84a"/>
    <rect x="11" y="2" width="1" height="3" fill="#ffd84a"/>
    <rect x="4" y="4" width="8" height="1" fill="#c89018"/>
    <rect x="3" y="5" width="10" height="6" fill="#ffd84a"/>
    <rect x="4" y="11" width="8" height="2" fill="#f4c431"/>
    <rect x="2" y="7" width="2" height="3" fill="#ffd84a"/>
    <rect x="12" y="7" width="2" height="3" fill="#ffd84a"/>
    <rect x="5" y="7" width="2" height="2" fill="#1f1f1f"/>
    <rect x="10" y="7" width="2" height="2" fill="#1f1f1f"/>
    <rect x="6" y="7" width="1" height="1" fill="#ffffff"/>
    <rect x="11" y="7" width="1" height="1" fill="#ffffff"/>
    <rect x="3" y="9" width="2" height="1" fill="#ff6868"/>
    <rect x="12" y="9" width="2" height="1" fill="#ff6868"/>
    <rect x="7" y="9" width="2" height="1" fill="#7a4b18"/>
    <rect x="6" y="10" width="1" height="1" fill="#7a4b18"/>
    <rect x="9" y="10" width="1" height="1" fill="#7a4b18"/>
    <rect x="13" y="5" width="2" height="1" fill="#c89018"/>
    <rect x="14" y="4" width="1" height="1" fill="#ffd84a"/>
    <rect x="14" y="3" width="2" height="1" fill="#c89018"/>
    <rect x="5" y="13" width="2" height="2" fill="#c89018"/>
    <rect x="9" y="13" width="2" height="2" fill="#c89018"/>
    <rect x="4" y="15" width="3" height="1" fill="#7a4b18"/>
    <rect x="9" y="15" width="3" height="1" fill="#7a4b18"/>
  </svg>`;

  const PIXEL_PIKACHU_SLEEP = `<svg class="pixel-partner is-sleeping" viewBox="0 0 16 16" width="54" height="54" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-label="Sleepy pixel Pikachu">
    <rect width="16" height="16" fill="none"/>
    <rect x="3" y="0" width="2" height="4" fill="#6f6f9e"/>
    <rect x="11" y="0" width="2" height="4" fill="#6f6f9e"/>
    <rect x="4" y="2" width="1" height="3" fill="#f0dc78"/>
    <rect x="11" y="2" width="1" height="3" fill="#f0dc78"/>
    <rect x="3" y="5" width="10" height="6" fill="#f0dc78"/>
    <rect x="4" y="11" width="8" height="2" fill="#d8bf54"/>
    <rect x="5" y="8" width="2" height="1" fill="#4b3b2a"/>
    <rect x="10" y="8" width="2" height="1" fill="#4b3b2a"/>
    <rect x="3" y="9" width="2" height="1" fill="#f59aa0"/>
    <rect x="12" y="9" width="2" height="1" fill="#f59aa0"/>
    <rect x="7" y="10" width="2" height="1" fill="#7a4b18"/>
    <rect x="13" y="3" width="1" height="1" fill="#7c86c8"/>
    <rect x="14" y="2" width="1" height="1" fill="#7c86c8"/>
    <rect x="15" y="1" width="1" height="1" fill="#7c86c8"/>
    <rect x="5" y="13" width="2" height="2" fill="#ad9042"/>
    <rect x="9" y="13" width="2" height="2" fill="#ad9042"/>
  </svg>`;

  const PARTNER_DEX = {
    pikachu: {
      name: 'Pikachu',
      sprites: {
        pichu: `<svg class="sitting-partner" viewBox="0 0 120 120" width="82" height="82" xmlns="http://www.w3.org/2000/svg" aria-label="Sitting Pikachu">
          <path d="M30 32 L18 6 L43 25 Z" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M90 32 L102 6 L77 25 Z" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M23 10 L18 6 L27 26 Z" fill="#2c211b"/>
          <path d="M97 10 L102 6 L93 26 Z" fill="#2c211b"/>
          <ellipse cx="60" cy="55" rx="38" ry="34" fill="#ffd94a" stroke="#7a5520" stroke-width="3"/>
          <ellipse cx="60" cy="82" rx="34" ry="25" fill="#f8c83e" stroke="#7a5520" stroke-width="3"/>
          <ellipse cx="39" cy="58" rx="8" ry="7" fill="#1e1713"/>
          <ellipse cx="81" cy="58" rx="8" ry="7" fill="#1e1713"/>
          <circle cx="42" cy="55" r="2.5" fill="#fff7d6"/>
          <circle cx="84" cy="55" r="2.5" fill="#fff7d6"/>
          <ellipse cx="31" cy="70" rx="9" ry="6" fill="#ff6f75"/>
          <ellipse cx="89" cy="70" rx="9" ry="6" fill="#ff6f75"/>
          <path d="M56 67 L60 71 L64 67" stroke="#7a5520" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M52 75 Q60 81 68 75" stroke="#7a5520" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M30 87 Q16 91 18 104 Q36 105 43 93" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M90 87 Q104 91 102 104 Q84 105 77 93" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M42 101 Q31 112 47 114 Q58 113 56 102" fill="#d59a28" stroke="#7a5520" stroke-width="3"/>
          <path d="M78 101 Q89 112 73 114 Q62 113 64 102" fill="#d59a28" stroke="#7a5520" stroke-width="3"/>
          <path d="M88 82 L111 69 L100 67 L113 53 L94 60" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="60" cy="115" rx="37" ry="5" fill="rgba(30,23,19,.22)"/>
        </svg>`,
        pikachu: `<svg class="sitting-partner" viewBox="0 0 120 120" width="82" height="82" xmlns="http://www.w3.org/2000/svg" aria-label="Sitting Pikachu">
          <path d="M30 32 L18 6 L43 25 Z" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M90 32 L102 6 L77 25 Z" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M23 10 L18 6 L27 26 Z" fill="#2c211b"/>
          <path d="M97 10 L102 6 L93 26 Z" fill="#2c211b"/>
          <ellipse cx="60" cy="55" rx="38" ry="34" fill="#ffd94a" stroke="#7a5520" stroke-width="3"/>
          <ellipse cx="60" cy="82" rx="34" ry="25" fill="#f8c83e" stroke="#7a5520" stroke-width="3"/>
          <ellipse cx="39" cy="58" rx="8" ry="7" fill="#1e1713"/>
          <ellipse cx="81" cy="58" rx="8" ry="7" fill="#1e1713"/>
          <circle cx="42" cy="55" r="2.5" fill="#fff7d6"/>
          <circle cx="84" cy="55" r="2.5" fill="#fff7d6"/>
          <ellipse cx="31" cy="70" rx="9" ry="6" fill="#ff6f75"/>
          <ellipse cx="89" cy="70" rx="9" ry="6" fill="#ff6f75"/>
          <path d="M56 67 L60 71 L64 67" stroke="#7a5520" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M52 75 Q60 81 68 75" stroke="#7a5520" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M30 87 Q16 91 18 104 Q36 105 43 93" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M90 87 Q104 91 102 104 Q84 105 77 93" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M42 101 Q31 112 47 114 Q58 113 56 102" fill="#d59a28" stroke="#7a5520" stroke-width="3"/>
          <path d="M78 101 Q89 112 73 114 Q62 113 64 102" fill="#d59a28" stroke="#7a5520" stroke-width="3"/>
          <path d="M88 82 L111 69 L100 67 L113 53 L94 60" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="60" cy="115" rx="37" ry="5" fill="rgba(30,23,19,.22)"/>
        </svg>`,
        raichu: `<svg class="sitting-partner is-charged" viewBox="0 0 120 120" width="82" height="82" xmlns="http://www.w3.org/2000/svg" aria-label="Charged sitting Pikachu">
          <path d="M30 32 L18 6 L43 25 Z" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M90 32 L102 6 L77 25 Z" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M23 10 L18 6 L27 26 Z" fill="#2c211b"/>
          <path d="M97 10 L102 6 L93 26 Z" fill="#2c211b"/>
          <ellipse cx="60" cy="55" rx="38" ry="34" fill="#ffd94a" stroke="#7a5520" stroke-width="3"/>
          <ellipse cx="60" cy="82" rx="34" ry="25" fill="#f8c83e" stroke="#7a5520" stroke-width="3"/>
          <ellipse cx="39" cy="58" rx="8" ry="7" fill="#1e1713"/>
          <ellipse cx="81" cy="58" rx="8" ry="7" fill="#1e1713"/>
          <circle cx="42" cy="55" r="2.5" fill="#fff7d6"/>
          <circle cx="84" cy="55" r="2.5" fill="#fff7d6"/>
          <ellipse cx="31" cy="70" rx="9" ry="6" fill="#ff6f75"/>
          <ellipse cx="89" cy="70" rx="9" ry="6" fill="#ff6f75"/>
          <path d="M56 67 L60 71 L64 67" stroke="#7a5520" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M52 75 Q60 81 68 75" stroke="#7a5520" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M30 87 Q16 91 18 104 Q36 105 43 93" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M90 87 Q104 91 102 104 Q84 105 77 93" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M42 101 Q31 112 47 114 Q58 113 56 102" fill="#d59a28" stroke="#7a5520" stroke-width="3"/>
          <path d="M78 101 Q89 112 73 114 Q62 113 64 102" fill="#d59a28" stroke="#7a5520" stroke-width="3"/>
          <path d="M88 82 L111 69 L100 67 L113 53 L94 60" fill="#ffd94a" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M15 55 L23 48 L20 58 L29 54" fill="none" stroke="#f5b700" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M101 37 L110 29 L106 41 L116 36" fill="none" stroke="#f5b700" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="60" cy="115" rx="37" ry="5" fill="rgba(30,23,19,.22)"/>
        </svg>`,
        sleep: `<svg class="sitting-partner is-sleeping" viewBox="0 0 120 120" width="82" height="82" xmlns="http://www.w3.org/2000/svg" aria-label="Sleepy sitting Pikachu">
          <path d="M30 32 L18 6 L43 25 Z" fill="#f4d56b" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M90 32 L102 6 L77 25 Z" fill="#f4d56b" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M23 10 L18 6 L27 26 Z" fill="#2c211b"/>
          <path d="M97 10 L102 6 L93 26 Z" fill="#2c211b"/>
          <ellipse cx="60" cy="55" rx="38" ry="34" fill="#f4d56b" stroke="#7a5520" stroke-width="3"/>
          <ellipse cx="60" cy="82" rx="34" ry="25" fill="#e9bd45" stroke="#7a5520" stroke-width="3"/>
          <path d="M32 58 Q39 52 46 58" stroke="#1e1713" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M74 58 Q81 52 88 58" stroke="#1e1713" stroke-width="4" fill="none" stroke-linecap="round"/>
          <ellipse cx="31" cy="70" rx="9" ry="6" fill="#f59aa0"/>
          <ellipse cx="89" cy="70" rx="9" ry="6" fill="#f59aa0"/>
          <path d="M54 72 Q60 76 66 72" stroke="#7a5520" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M30 87 Q16 91 18 104 Q36 105 43 93" fill="#f4d56b" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M90 87 Q104 91 102 104 Q84 105 77 93" fill="#f4d56b" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <path d="M42 101 Q31 112 47 114 Q58 113 56 102" fill="#c8912b" stroke="#7a5520" stroke-width="3"/>
          <path d="M78 101 Q89 112 73 114 Q62 113 64 102" fill="#c8912b" stroke="#7a5520" stroke-width="3"/>
          <path d="M88 82 L111 69 L100 67 L113 53 L94 60" fill="#f4d56b" stroke="#7a5520" stroke-width="3" stroke-linejoin="round"/>
          <text x="86" y="27" font-size="17" font-family="Arial, sans-serif" font-weight="700" fill="#6b7cc8">z</text>
          <text x="99" y="15" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#5263aa">z</text>
          <ellipse cx="60" cy="115" rx="37" ry="5" fill="rgba(30,23,19,.22)"/>
        </svg>`
      }
    }
  };

  // ── STYLES ────────────────────────────────────────────────────
  function pikaBuddySprite({ id = 'idle', charged = false, sleep = false, tiny = false } = {}) {
    const bodyTop = sleep ? '#f8d65c' : '#ffd83f';
    const bodyBottom = sleep ? '#e7b947' : '#f2b928';
    const cheek = sleep ? '#ee8f8f' : '#ff6d6d';
    const eyeMarkup = sleep
      ? `<path d="M41 61 Q48 55 55 61" stroke="#211914" stroke-width="4" fill="none" stroke-linecap="round"/>
         <path d="M73 61 Q80 55 87 61" stroke="#211914" stroke-width="4" fill="none" stroke-linecap="round"/>
         <text x="90" y="31" font-size="16" font-family="Arial, sans-serif" font-weight="800" fill="#5b6fb7">z</text>
         <text x="103" y="18" font-size="22" font-family="Arial, sans-serif" font-weight="800" fill="#465aa6">z</text>`
      : `<ellipse cx="47" cy="60" rx="7" ry="8" fill="#211914"/>
         <ellipse cx="81" cy="60" rx="7" ry="8" fill="#211914"/>
         <circle cx="50" cy="57" r="2.6" fill="#fff9d8"/>
         <circle cx="84" cy="57" r="2.6" fill="#fff9d8"/>`;

    return `<svg class="pika-buddy-svg${charged ? ' is-charged' : ''}${sleep ? ' is-sleeping' : ''}${tiny ? ' is-tiny' : ''}" viewBox="0 0 128 132" xmlns="http://www.w3.org/2000/svg" aria-label="${sleep ? 'Sleepy' : 'Sitting'} Pikachu">
      <defs>
        <linearGradient id="pika-body-${id}" x1="34" y1="24" x2="90" y2="118" gradientUnits="userSpaceOnUse">
          <stop stop-color="${bodyTop}"/>
          <stop offset="1" stop-color="${bodyBottom}"/>
        </linearGradient>
        <linearGradient id="pika-ear-${id}" x1="26" y1="4" x2="48" y2="39" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffe263"/>
          <stop offset="1" stop-color="#f0bd24"/>
        </linearGradient>
        <radialGradient id="pika-face-${id}" cx="48%" cy="38%" r="62%">
          <stop stop-color="#fff0a8"/>
          <stop offset=".42" stop-color="${bodyTop}"/>
          <stop offset="1" stop-color="${bodyBottom}"/>
        </radialGradient>
      </defs>
      <ellipse cx="63" cy="123" rx="35" ry="6" fill="rgba(21,16,10,.24)"/>
      <path d="M86 88 L121 68 L106 66 L124 49 L98 57 L106 41 L85 67" fill="url(#pika-body-${id})" stroke="#7c5722" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 40 L21 5 L52 30 Z" fill="url(#pika-ear-${id})" stroke="#7c5722" stroke-width="4" stroke-linejoin="round"/>
      <path d="M25 11 L21 5 L31 32 Z" fill="#211914"/>
      <path d="M90 40 L105 5 L74 30 Z" fill="url(#pika-ear-${id})" stroke="#7c5722" stroke-width="4" stroke-linejoin="round"/>
      <path d="M101 11 L105 5 L94 32 Z" fill="#211914"/>
      <path d="M35 66 C33 40 48 25 64 25 C82 25 96 41 93 66 C105 82 99 114 65 116 C31 116 22 84 35 66 Z" fill="url(#pika-face-${id})" stroke="#7c5722" stroke-width="4" stroke-linejoin="round"/>
      <path d="M36 86 C23 88 19 102 30 107 C43 111 50 98 48 88" fill="#ffd83f" stroke="#7c5722" stroke-width="4" stroke-linejoin="round"/>
      <path d="M90 86 C105 88 109 102 98 107 C85 111 78 98 80 88" fill="#ffd83f" stroke="#7c5722" stroke-width="4" stroke-linejoin="round"/>
      ${eyeMarkup}
      <ellipse cx="34" cy="73" rx="9" ry="8" fill="${cheek}"/>
      <ellipse cx="94" cy="73" rx="9" ry="8" fill="${cheek}"/>
      <path d="M59 70 L64 74 L69 70" stroke="#7c5722" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M53 80 Q64 88 75 80" stroke="#7c5722" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M45 106 C33 116 45 124 61 116 C61 108 56 104 45 106 Z" fill="#c98d24" stroke="#7c5722" stroke-width="4" stroke-linejoin="round"/>
      <path d="M83 106 C95 116 83 124 67 116 C67 108 72 104 83 106 Z" fill="#c98d24" stroke="#7c5722" stroke-width="4" stroke-linejoin="round"/>
      ${charged ? '<path d="M17 61 L28 51 L24 66 L37 60" fill="none" stroke="#f5b700" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 38 L113 27 L108 44 L122 36" fill="none" stroke="#f5b700" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    </svg>`;
  }

  const PIKA_BUDDY_SPRITES = {
    pichu: pikaBuddySprite({ id: 'pichu', tiny: true }),
    pikachu: pikaBuddySprite({ id: 'pikachu' }),
    raichu: pikaBuddySprite({ id: 'raichu', charged: true }),
    sleep: pikaBuddySprite({ id: 'sleep', sleep: true })
  };

  const css = `
#pikadex-root{position:fixed;bottom:18px;right:18px;z-index:2147483647;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;user-select:none;pointer-events:none}
#pikadex-root *{box-sizing:border-box}
#pika-widget{display:grid;grid-template-columns:86px minmax(92px,154px);align-items:end;gap:8px;cursor:pointer;position:relative;pointer-events:auto;transform-origin:bottom right;filter:drop-shadow(0 12px 18px rgba(0,0,0,.26))}
#pika-stage{position:relative;width:86px;height:106px;display:flex;align-items:flex-end;justify-content:center}
#pika-wrap{width:86px;height:106px;background:transparent;border:0;display:flex;align-items:flex-end;justify-content:center;animation:pFloat 3.6s ease-in-out infinite;box-shadow:none;position:relative;overflow:visible}
#pika-wrap::after{content:'';position:absolute;left:18px;right:13px;bottom:3px;height:10px;border-radius:999px;background:radial-gradient(ellipse at center,rgba(31,25,16,.34),rgba(31,25,16,0) 70%);filter:blur(.5px);z-index:0}
#pika-inner{width:104px;height:114px;display:flex;align-items:flex-end;justify-content:center;position:relative;z-index:1}
.pika-buddy-svg{display:block;width:102px;height:112px;transform:translateY(5px);filter:drop-shadow(0 7px 8px rgba(0,0,0,.22))}
.pika-buddy-svg.is-tiny{width:94px;height:104px}
.pika-buddy-svg.is-charged{filter:drop-shadow(0 0 9px rgba(245,183,0,.48)) drop-shadow(0 7px 8px rgba(0,0,0,.22))}
.pika-buddy-svg.is-sleeping{filter:drop-shadow(0 7px 8px rgba(0,0,0,.18)) saturate(.94)}
.sitting-partner,.pixel-partner{display:block}
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
  .pika-buddy-svg{width:92px;height:102px}
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
          <div id="pika-inner"></div>
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
  let idleBack = null;
  let lastActivity = Date.now();
  let bubbleTimer = null;

  const activePartner = PARTNER_DEX.pikachu;
  const SPRITES = PIKA_BUDDY_SPRITES;

  let extensionInvalidated = false;
  let heartbeatInterval = null;
  let sleepCheckInterval = null;

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
    inner.innerHTML = SPRITES[stage] || SPRITES.pikachu;
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
    showBubble(newStage === 'pikachu' ? 'Pikachu powered up after 3h focus!' : 'Pikachu hit 10h focus mode!', 5000);
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
      idle:      {anim:'pFloat 3s ease-in-out infinite',     dot:'#4CAF50', lbl:activePartner.name},
      wave:      {anim:'pWave 0.55s ease-in-out 3',         dot:'#4CAF50', lbl:activePartner.name},
      celebrate: {anim:'pCelebrate 0.45s ease-in-out 4',   dot:'#FFD700', lbl:activePartner.name},
      warn:      {anim:'pWarn 0.25s ease-in-out 5',         dot:'#FF5722', lbl:'Focus buddy'},
      sleep:     {anim:'pSleep 3.5s ease-in-out infinite',  dot:'#9090c0', lbl:'Pikachu resting'},
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
  safeSendMessage({type: 'GET_DATA'}, res => {
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

  // Every 5 seconds, check conditions and send heartbeat
  heartbeatInterval = setInterval(() => {
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
  }, 5000);

  // Message listener
  if (isExtensionValid()) {
    try {
      chrome.runtime.onMessage.addListener(msg => {
        if (!isExtensionValid() || !msg?.type) return;
        if (msg.type==='PIKA_CELEBRATE') { setState('celebrate', msg.text||'Amazing! ⚡', 4000); if(msg.xp) showXP(msg.xp); }
        if (msg.type==='PIKA_WARN')      setState('warn', msg.text||'Focus!', 3000);
        if (msg.type==='PIKA_XP')        showXP(msg.xp||0);
        if (msg.type==='PIKA_WAVE')      setState('wave', msg.text||'Hey!', 3000);
        if (msg.type==='PIKA_EVOLVE')    { setStage(msg.stage, true); setState('celebrate', msg.text, 5000); }
      });
    } catch (error) {
      extensionInvalidated = true;
      stopExtensionWork();
    }
  }
})();

# PikaDex

PikaDex is a browser extension that turns web-based work into a playful productivity dashboard. It tracks active focus time, coding progress, learning activity, media habits, and daily XP so developers and students can see where their attention went and what to improve next.

The product is built around a calmer companion experience: a lightweight dashboard, a static partner portrait that evolves with daily focus, and clear data views for focus, coding, media, routes, battles, and AI summaries.

## What It Does

- Tracks active browser engagement with heartbeat-based focus checks.
- Categorizes sites into productivity groups such as Development, Training Ground, Research, Entertainment, Social, AI Assistant, Networking, and General.
- Awards XP, streaks, levels, battles, and partner evolution based on meaningful activity.
- Syncs coding profile data from LeetCode and GitHub.
- Tracks YouTube learning versus entertainment habits.
- Provides an optional Professor Oak report powered by an Anthropic API key stored locally.
- Supports onboarding, profile setup, account sync, local export, and pause-tracking controls.

## Product Surfaces

### Popup Dashboard

The popup is the main product surface. It includes:

- Focus score, XP, streak, and quick daily stats.
- A partner portrait that changes between Pichu, Pikachu, and Raichu based on daily focus time.
- Caught Today activity cards with XP and session details.
- Usage breakdown chart and media summary.
- Route timeline for today's browsing path.
- Focus battles for productive versus distracting sessions.
- LeetCode gym badges and GitHub region summaries.
- Professor Oak's daily AI report.

### Onboarding

The welcome page guides users through:

1. Trainer name setup.
2. Optional developer profile connections.
3. Completion and extension pinning guidance.

### Companion Overlay

The content script can show the companion on regular web pages for XP feedback, warnings, celebrations, and evolution moments.

## Architecture

```text
manifest.json        Chrome MV3 extension manifest
manifest.firefox.json Firefox add-on manifest used by the build script
build-firefox.ps1    Creates dist/firefox and a Firefox add-on zip
background.js        Background runtime, IndexedDB, sync, scoring, export, and message handling
content.js           Page heartbeat tracking and companion overlay
popup.html           Popup dashboard markup
popup.css            Popup dashboard styles
popup.js             Popup rendering, settings, dashboard tabs, and Oak report UI
welcome.html         Onboarding markup
welcome.css          Onboarding styles
welcome.js           Onboarding flow and setup submission
scrapers/            Site-specific helper scripts for GitHub, LeetCode, and YouTube
icons/               Extension icons
```

## Browser Support

### Chrome / Chromium

Load the project root as an unpacked extension:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select the PikaDex project folder.

Chrome uses `manifest.json`, which is the Manifest V3 service worker target.

### Firefox

Build the Firefox add-on package first:

```powershell
powershell -ExecutionPolicy Bypass -File .\build-firefox.ps1
```

The script creates:

- `dist/firefox/manifest.json` for temporary local testing.
- `dist/pikadex-firefox.zip` for add-on distribution or AMO submission.

To test locally:

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose Load Temporary Add-on.
3. Select `dist/firefox/manifest.json`.

Firefox uses `manifest.firefox.json` as the source manifest. The build script copies it to `dist/firefox/manifest.json` because Firefox add-ons expect the manifest to be named `manifest.json` inside the packaged add-on.

## Data Model

PikaDex stores data locally in IndexedDB under `pikadex_v3`.

### `trainer`

Stores profile and aggregate state:

- `trainerName`
- `onboarded`
- `totalXP`, `todayXP`, `level`, `streak`
- platform handles for LeetCode, GitHub, Codeforces, CodeChef, and HackerRank
- coding and media counters
- LeetCode solved count, active days, and streak
- GitHub public commit counts, contribution counts, and contribution streak
- `trackingPaused`
- GitHub repo activity and LeetCode problem activity

### `sessions`

Stores finished focus sessions:

- `domain`
- `type`
- `startTime`, `endTime`
- `durationMs`
- `xp`
- `date`

### `videos`

Stores YouTube watch logs:

- `video_id`
- `title`
- `channel`
- `url`
- `educational`
- `category`
- `watchSeconds`
- `date`

### `battles`

Stores focus battle outcomes:

- `domain`
- `durationMs`
- `won`
- `xp`
- `date`

### `site_stats`

Stores cumulative site-level activity:

- `domain`
- `todaySeconds`
- `totalSeconds`
- `lastVisit`

## Runtime Messages

| Message | Purpose |
| --- | --- |
| `GET_DATA` | Returns trainer, sessions, videos, battles, site stats, and live activity. |
| `UPDATE_PROFILE` | Saves onboarding/settings profile fields. |
| `SYNC_ACCOUNTS` | Syncs coding accounts and awards new XP. |
| `EXPORT_DATA` | Exports local data as JSON. |
| `HEARTBEAT` | Records active page engagement from content scripts. |
| `CHATGPT_MESSAGE_SENT` | Tracks ChatGPT prompt activity. |
| `PING` | Health check between scripts. |

## External Integrations

### LeetCode

Uses LeetCode GraphQL plus a fallback profile endpoint to calculate total solved problems and daily progress.

### GitHub

Uses public GitHub endpoints for commits, pull requests, issues, repository metadata, public events, and the public contribution calendar. Private contribution data can only appear if GitHub exposes it publicly on the profile.

### Anthropic

Professor Oak reports use Anthropic's Messages API only when the user adds an API key and clicks the report button. The key is stored locally and is only sent for report generation.

## Privacy Notes

PikaDex is designed as a local-first productivity companion:

- Activity data is stored in local browser storage / IndexedDB.
- Tracking can be paused from settings.
- Data can be exported from the popup.
- AI reporting is optional and requires a user-provided API key.
- Profile handles and API keys are stored locally.

## Development Checks

Run syntax checks with:

```bash
node --check popup.js
node --check welcome.js
node --check background.js
node --check content.js
node --check scrapers/github.js
node --check scrapers/leetcode.js
node --check scrapers/youtube.js
```

## Current UI Direction

The current UI favors a cleaner product dashboard over a noisy game HUD:

- Popup and onboarding styles are split into dedicated CSS files.
- The partner mascot is a static portrait instead of a busy animated sticker.
- Dashboard rows, chips, charts, and settings controls use more consistent spacing and color treatment.
- Onboarding and popup surfaces share a calmer visual language.

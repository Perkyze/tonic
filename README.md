# Tonic — your daily dose of music theory

A daily music theory game for the browser. No build step, no dependencies, no server-side code.

## Play it

- **Quickest:** double-click `index.html`.
- **Local server** (same as a real deployment):

  ```
  powershell -ExecutionPolicy Bypass -File serve.ps1
  ```

  then open http://localhost:8137

## Put it online

It is a plain static site. Upload the folder (`index.html`, `css/`, `js/`) to any static host —
GitHub Pages, Netlify, Cloudflare Pages, Vercel — and it works as is. Once it is served over
http(s), the Share button adds the site's link to the copied result.

## How the game works

- **Daily Set** — 8 questions, the same for everyone on a given day and level (seeded by the date),
  mixing four kinds of round: 👂 Ear (hear it), 👁️ Eye (read it), 🧠 Brain (work it out),
  🎹 Build (tap it on the keyboard). Speed and answer streaks multiply the points.
- **Deep Cut encore** — one open question with many right answers. Three picks; the more obscure
  the pick, the more it scores (5–100). Obscurity comes from a built-in ranking in `js/deepcut.js`,
  not from other players' answers.
- **Smart Practice / Train a skill** — ten questions weighted toward what you get wrong.
- **Survival** — three lives, a timer, rising difficulty.
- XP and levels, a daily streak, six skill tracks, 20 achievements. Progress lives in the
  browser's localStorage (per device).

## Where things are

| File | What it does |
| --- | --- |
| `js/theory.js` | Notes, intervals, chords, scales, keys — with correct spelling |
| `js/questions.js` | The 22 question generators, the daily set, practice and survival selection |
| `js/deepcut.js` | Deep Cut prompts and the obscurity ranking |
| `js/audio.js` | Web Audio synth and sound effects (no audio files) |
| `js/render.js` | SVG piano and staff |
| `js/store.js` | Saved progress, levels, streak, achievements |
| `js/app.js` | Screens and game flow |
| `test.html` | Open in a browser to fuzz-test every generator |

To add a question type, add one `def(...)` block in `js/questions.js`; it is picked up by the
daily set, practice and survival automatically.

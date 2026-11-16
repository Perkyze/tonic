# Tonic — your daily dose of music theory

A browser game that teaches music theory from zero: short lessons, a daily set of questions,
and practice modes for piano and guitar. No build step, no dependencies, no server-side code.

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

## How it works

The app has four tabs along the bottom: **Today** (the Daily Set, your week and your next lesson),
**Learn** (the lesson path), **Practice** (skills, games and the finder) and **Profile**
(level, achievements, settings).

- **Learn** — twelve short lessons for complete beginners (note names, steps, the major scale,
  intervals, major and minor chords, reading the staff, guitar strings and first chords, keys,
  chord families, the pentatonic scale). Each lesson is a few cards to read, look at and listen
  to, then five questions on exactly that topic, with no timer.
- **Daily Set** — 8 questions, the same for everyone on a given day and level (seeded by the date),
  mixing four kinds of round: 👂 Ear (hear it), 👁️ Eye (read it), 🧠 Brain (work it out),
  🎹 Build (tap it on a keyboard or fretboard). Speed and answer streaks multiply the points.
- **Deep Cut encore** — one open question with many right answers. Three picks; the more obscure
  the pick, the more it scores (5–100). Obscurity comes from a built-in ranking in `js/deepcut.js`,
  not from other players' answers.
- **Smart Practice / Train a skill** — ten questions weighted toward what you get wrong, followed
  by a second-chance round on the ones you missed.
- **Chord & Scale Finder** — pick any root and type to see it on piano and guitar and hear it.
- **Survival** — three lives, a timer, rising difficulty.
- **Help while you play** — every question has a hint (it costs the speed bonus), and every answer,
  right or wrong, opens an explanation with the notes shown and played.
- XP and levels, a daily streak, seven skill tracks, 24 achievements. Progress lives in the
  browser's localStorage (per device).

## Where things are

| File | What it does |
| --- | --- |
| `js/theory.js` | Notes, intervals, chords, scales, keys — with correct spelling |
| `js/guitar.js` | Tuning, open chord shapes, fretboard maths |
| `js/questions.js` | The 29 question generators, hints, the daily set, practice and survival selection |
| `js/lessons.js` | The Learn path: lesson cards and each lesson's quiz |
| `js/deepcut.js` | Deep Cut prompts and the obscurity ranking |
| `js/audio.js` | Web Audio synth (piano and plucked-string voices) and sound effects — no audio files |
| `js/render.js` | SVG piano, staff, guitar chord boxes and fretboard |
| `js/store.js` | Saved progress, levels, streak, achievements |
| `js/app.js` | Screens and game flow |
| `test.html` | Open in a browser to fuzz-test every generator, lesson quiz and guitar shape |

To add a question type, add one `def(...)` block (and a hint) in `js/questions.js`; it is picked up
by the daily set, practice and survival automatically. To add a lesson, add an entry to `LESSONS`
in `js/lessons.js`.

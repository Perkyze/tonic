# Learn roadmap — UI inspiration

Design references for replacing the island map on Tonic's **Learn** tab. Collected from
[Mobbin](https://mobbin.com) (iOS screens) and a few web sources, then grouped into six
directions that fit Tonic's dark-indigo, chunky-button style.

Whatever the direction, the data stays the same: 8 chapters × 3 lessons, 3 stars per lesson,
a trophy per chapter, and the existing unlock rules (level head start, finish a chapter to open
the next, never relock).

State colours used in the sketches: **done** = mint/teal, **up next** = yellow, **locked** = grey outline.

---

## 1 · Stepping stones

A single column of chunky round lesson buttons that winds left and right. A coloured chapter
banner sticks to the top while you scroll, the current button gets a "Start" tooltip and a bottom
popover with a big Start button, and a chest or trophy node closes each chapter.

- **Why:** the most familiar learning-map pattern; strongest game feel.
- **Watch out:** looks closest to Duolingo.

References:
- [Duolingo — section/unit path](https://mobbin.com/screens/3cc1779f-ef61-4e0a-8b00-adecbd24aa6d?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Duolingo — music course path](https://mobbin.com/screens/9251dfeb-42a5-4594-99c2-55219ba8d612?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Duolingo ABC — path with locked nodes](https://mobbin.com/screens/9123d1c3-06ee-4c00-b861-00d8a8d9947c?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) · [another state](https://mobbin.com/screens/ccb08382-204e-499f-822e-3e32dcb47960?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Brilliant — level path with Start card](https://mobbin.com/screens/ab126790-340c-40d6-a92c-bbeaeb272bea?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) · [level review / jump here](https://mobbin.com/screens/fd4efbd9-32d7-4abb-b129-dd5d335245ad?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Liven — chapter path with locks](https://mobbin.com/screens/d98bf80c-9d46-45c6-833d-d0baef1b2e1d?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) · [plan intro](https://mobbin.com/screens/1aa3b784-2b8d-4263-b412-0d342add307f?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Speak — unit path with inline lesson card](https://mobbin.com/screens/fc62de5d-2ba0-4e15-8d32-dd439ccaba35?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Ahead — illustrated journey with numbered stops](https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)

## 2 · Step sequencer

Square pads on a dotted grid joined by right-angle lines — reads like a drum machine or step
sequencer. A pill header shows the chapter and a % ring; the current pad shows a progress ring
("1/2"), lightning pads mark practice steps.

- **Why:** matches Tonic's chunky buttons and dark theme; a subtle music nod.
- **Watch out:** less "journey" feeling than a winding path.

References:
- [Mimo — grid path, dark](https://mobbin.com/screens/e466340b-80ce-4a91-b557-14d55afcf4c9?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Mimo — grid path, locked state](https://mobbin.com/screens/27a887e2-e968-4117-997f-4ce126f12fef?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)

## 3 · Timeline cards

A dashed rail down the left with a dot per lesson and a card beside it: icon, title, minutes,
stars, and a "Start" badge on the current one. Chapters are headings on the rail; each ends with
a locked chapter test.

- **Why:** clearest and most readable; scales to many lessons; easy to scan stars.
- **Watch out:** least game-like.

References:
- [Uxcel Go — level list with Start badge and level test](https://mobbin.com/screens/dba87d9e-9955-49be-be73-686477e601ee?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Moonly — rail with illustrated lesson cards](https://mobbin.com/screens/9cbc697c-ca50-4378-ac14-646d05f8feb9?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Bloom — day-by-day rail](https://mobbin.com/screens/a0fdac30-b299-4cea-9cbc-56148bf0956f?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) · [locked days](https://mobbin.com/screens/93dbba75-a74c-438d-beff-b8fd86c86675?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Alan — sessions with countdown unlock](https://mobbin.com/screens/6c47d7b0-f8a0-479b-9ea6-6b2f89693d0d?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Tiimo — lesson list with completion ticks](https://mobbin.com/screens/4a3fa710-da4c-4017-8994-b269c1c65c61?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [MasterClass — expandable curriculum](https://mobbin.com/screens/72dcf33e-58e8-486f-a178-583a2d411f67?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Udemy — curriculum sections](https://mobbin.com/screens/045c215d-6e08-432c-9bb6-3ddd4495fc69?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Tolan — numbered locked levels](https://mobbin.com/screens/272e601b-1aef-4387-8496-5f77fa2ed942?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)

## 4 · The staff (original)

The roadmap *is* a musical staff. Each lesson is a note head that climbs higher as you progress;
each chapter is a bar, separated by bar lines and labelled above ("Bar 2 · Chords"). Done notes
are filled, the next one glows yellow, locked ones are hollow. Scroll sideways through the bars,
or stack one staff line per chapter vertically on phones.

- **Why:** no app in the research does this — the most distinctive, music-native option.
- **Watch out:** needs care to stay legible and tappable on small screens.

References: none directly; inspired by the staff visuals already in Tonic's lessons.

## 5 · Record shelf

Each chapter is an album cover (vinyl theme: Vol. 1, Vol. 2…) on a horizontal shelf; locked
albums are greyed. Tapping an album shows its tracklist — the three lessons as tracks with stars.
Ties in with the 💿 Deep Cut branding.

- **Why:** strong personality; fits a music brand.
- **Watch out:** the overall "path" is less visible than a map.

References:
- [GoHenry — learn grid by level](https://mobbin.com/screens/501e252e-9b4f-4dee-9cf8-2d9404ddff2c?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [adidas Running — training-plan carousel](https://mobbin.com/screens/be9ae7a0-bb29-4e0b-adb4-b132a6784982?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Speak — challenge cards](https://mobbin.com/screens/3ce6b82a-6209-478a-852a-f0f72d8e6479?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Venmo — learn-as-you-go cards](https://mobbin.com/screens/7ef51f65-28e4-45d0-9a9c-d079840a8107?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)

## 6 · Constellation tree

A shallow skill tree on a dark sky: a shared trunk of basics, then branches by topic (ear,
reading, guitar) that you can take in any order, rejoining at a final trophy. Guitar becomes an
optional branch.

- **Why:** gives learners a choice of route; the guitar track fits naturally as a branch.
- **Watch out:** changes the unlock rules; keep it shallow (see the Skill Tree Platform note below).

References:
- [Life Reset — dark node path, completed](https://mobbin.com/screens/0d8849b9-6253-472b-9067-2b5f40c648b8?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) · [locked](https://mobbin.com/screens/cb3e87ef-1183-486f-bd20-2f465417d486?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Noom — illustrated course map](https://mobbin.com/screens/3ef3dce1-8f8e-416b-b8c2-5d52d177fe26?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) · [locked end](https://mobbin.com/screens/978f8167-b853-4085-838a-9d6cf9c837f2?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)
- [Paired — journey with reward badge](https://mobbin.com/screens/754bd0d0-b9aa-4cb5-af06-daf17f8476bf?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)

---

## Takeaways from the web

- The Duolingo-style "tree" is really a winding path: one node per lesson, each with a clear
  state (locked, available, current, done). Encode state with shape and icon, not colour alone. —
  [vp0.com](https://vp0.com/blogs/duolingo-learning-tree-gamification-ui)
- Use a linear path when order matters; a skill tree when learners can choose their route. If you
  gate with prerequisites, keep the chain simple, direct and shallow. —
  [Growth Engineering](https://www.growthengineering.co.uk/learning-pathways/),
  [Skill Tree Platform](https://skilltreeplatform.dev/dashboard/user-guide/learning-path.html),
  [DEV](https://dev.to/manishgiri1/gamification-that-actually-works-a-developers-guide-to-building-engaging-learning-systems-3841)
- Show the whole map up front and progress against goals, not time spent. —
  [Growth Engineering](https://www.growthengineering.co.uk/?p=79949)
- Music apps: Melodics uses a guided path through its courses plus weekly goals; Yousician's path
  runs from Basics to Level 9 and lets you jump ahead. —
  [Melodics](https://melodics.com/support-articles/support-navigating-learning),
  [Pianist's Compass](https://pianistscompass.com/?p=15355)

## Shortlist

- **Most distinctive:** 4 · The staff
- **Safest fit with the current look:** 2 · Step sequencer
- **Strongest game feel:** 1 · Stepping stones (but closest to Duolingo)
- Ideas can be mixed, e.g. timeline cards (3) under a sequencer-style chapter header (2).

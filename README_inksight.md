# InkSight

**Replay intelligence for Disney Lorcana.**

InkSight is a personal web app built to analyze Disney Lorcana replays and turn raw game logs into readable performance insights: mulligan decisions, ink economy, lore race, key cards, matchup history and deck progression.

👉 Live app: https://inksight-omega.vercel.app/

---

## What InkSight does

InkSight helps competitive Lorcana players understand **why a game was won or lost**, not just what the final score was.

The app can import replay files, parse the actions turn by turn, and generate a dashboard focused on practical decisions:

- score evolution and lore race;
- actions per turn: inked cards, played cards, quests and challenges;
- ink economy and unused ink;
- mulligan impact;
- cards seen during the game;
- cards most often inked;
- main lore engines;
- saved match history;
- deck-level statistics;
- contextual “coach” commentary for quick match reads.

The goal is to make post-game review faster, clearer and more useful between testing sessions or tournament rounds.

---

## Current features

### Replay analysis

- Import `.replay`, `.replay.gz` and `.match-replay.zip` files.
- Support for single games and BO3 structures.
- Local-first parsing: the replay is analyzed directly in the browser.
- Summary view with result, score, starting player, opponent and matchup.
- Statistics view with graphs and card rankings.
- Card views with visual references when card images are available.
- Match journal with readable action timeline.

### Performance dashboard

- Saved match history.
- Deck filters and bicolor filters.
- Global deck statistics.
- Card-level insights:
  - lore generated;
  - cards played;
  - cards inked;
  - winrate when played;
  - mulligan signals.
- BO1 / BO3 and result filters.

### Coach commentary

InkSight includes a match-read system that can generate short, sarcastic and TCG-flavored summaries.

The app can work with:

- a local fallback database of prewritten comments;
- an optional Vercel API route connected to Groq for dynamic commentary.

---

## Tech stack

- **Vite**
- **Vanilla JavaScript**
- **Chart.js**
- **Supabase**
- **Vercel API Routes**
- **Groq API** for optional AI commentary
- **pako** for `.gz` replay handling
- **JSZip** for zipped replay archives

---

## Project structure

```txt
.
├── api/
│   └── getCoachCommentary.js
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── lorcana-cards-import-ready.json
├── src/
│   ├── main.js
│   ├── style.css
│   └── supabase.js
├── index.html
├── package.json
└── README.md
```

---

## Local setup

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---


## Deployment

The project is deployed on Vercel from the GitHub repository.

Recommended build settings:

```txt
Framework preset: Vite
Build command: npm run build
Output directory: dist
```

The production website is:

https://inksight-omega.vercel.app/

---

## Roadmap

Planned or explored improvements:

- Duel.ink API auto-sync;
- larger coach commentary database;
- opening explorer / sequence tree;
- dead-weight card detection;
- matchup-specific card performance;
- opponent deck reconstruction;
- deeper mobile performance optimization;
- clearer onboarding for new users.

---

## Notes

InkSight is a personal fan project for replay analysis and competitive testing.

It is not affiliated with Disney, Ravensburger, Disney Lorcana, Duel.ink, Supabase, Vercel or Groq.

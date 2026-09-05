# SchoolWork

A personal schoolwork manager and Quizlet-style study platform. Track classes and
assignments, upload PDF notes, and let AI turn them into flashcards and quiz
questions you can study by concept, by unit, or all together for an exam.

## Setup

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To enable AI-generated flashcards/quiz questions, add an Anthropic API key to
`.env`:

```
ANTHROPIC_API_KEY="sk-ant-..."
```

Get one at [console.anthropic.com](https://console.anthropic.com/). Without a
key, everything else works (classes, assignments, PDF upload/text extraction) —
you'll just see a clear error if you click "Generate flashcards".

`ANTHROPIC_MODEL` in `.env` defaults to `claude-opus-5` (best quality). Switch
it to `claude-sonnet-5` or `claude-haiku-4-5` for cheaper/faster generation.

## How it works

- **Classes** hold **units**, which hold **concepts** (auto-tagged by the AI
  when it generates cards) and uploaded **materials** (PDFs).
- Uploading a PDF extracts its text immediately. Click "Generate flashcards" to
  send that text to Claude, which returns flashcards and multiple-choice quiz
  questions tagged by concept.
- **Study** a class by picking one concept, a whole unit, or several units at
  once (e.g. for exam review), in flashcard mode (flip cards, Leitner-style
  spaced repetition) or quiz mode (multiple choice with scoring).
- Assignments are simple due-date tracking per class, shown on the dashboard.

## Data & storage

- SQLite database at `prisma/dev.db` (gitignored).
- Uploaded PDFs stored locally under `storage/uploads/` (gitignored).
- Everything is local — there's no login system; this is meant for single-user,
  local use (`npm run dev`).

## Notes

- Canvas LMS integration was intentionally left out of this version — Canvas's
  OAuth requires an institution-registered developer key, which most students
  can't set up themselves. The `Material.source`/schema leaves room to add a
  Canvas personal-access-token sync later without changing the data model.
- `pdf-parse` is pinned to `1.1.1` and imported via its internal
  `lib/pdf-parse.js` path (see `lib/pdf.ts`) — the package's `index.js` entry
  point runs a debug self-test on load that breaks under bundlers.

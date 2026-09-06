# SchoolWork

A personal schoolwork manager and Quizlet-style study platform. Track classes and
assignments, upload PDF notes, and let AI turn them into flashcards and quiz
questions you can study by concept, by unit, or all together for an exam.

## Deploy your own copy (get a URL)

1. Click: **[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnicbrandmv-design%2FSchoolWorkManager%2Ftree%2Fclaude%2Fschoolwork-study-platform-llgofr&env=ANTHROPIC_API_KEY,ANTHROPIC_MODEL&envDescription=Anthropic%20API%20key%20for%20AI%20flashcard%20generation&envLink=https%3A%2F%2Fconsole.anthropic.com%2F&project-name=schoolwork&repository-name=schoolwork)**
   — sign in with the GitHub account that owns this repo if asked, paste your
   Anthropic API key ([get one here](https://console.anthropic.com/)) when
   prompted, and click Deploy.
2. **The first deploy will fail** — that's expected, there's no database yet.
   In the new Vercel project, go to **Storage → Create Database → Postgres**
   (Neon) and accept the defaults; this automatically adds `DATABASE_URL` to
   your project.
3. Also in **Storage**, click **Create → Blob** and accept the defaults; this
   adds `BLOB_READ_WRITE_TOKEN`, which is what lets uploaded PDFs persist on
   Vercel (there's no writable local disk on serverless hosting).
4. Go to **Deployments** and click **Redeploy** on the latest one. This time it
   applies the database schema and builds successfully — you'll get a
   `https://your-project.vercel.app` URL.

From then on, any push to the `claude/schoolwork-study-platform-llgofr` branch
(or whichever branch you set as the project's production branch) redeploys
automatically.

## Local development

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and ANTHROPIC_API_KEY
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You need a Postgres
database for local dev too — either run one yourself (e.g.
`docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`) or point
`DATABASE_URL` at the same database Vercel provisioned for your deployment.

To enable AI-generated flashcards/quiz questions, set `ANTHROPIC_API_KEY` in
`.env`. Without it, everything else works (classes, assignments, PDF
upload/text extraction) — you'll just see a clear error if you click "Generate
flashcards". `ANTHROPIC_MODEL` defaults to `claude-opus-5` (best quality);
switch to `claude-sonnet-5` or `claude-haiku-4-5` for cheaper/faster
generation.

Locally, `BLOB_READ_WRITE_TOKEN` can stay unset — uploads fall back to local
disk under `storage/uploads/`.

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

- Postgres database (local Postgres in dev, Vercel Postgres/Neon in production).
- Uploaded PDFs: local disk in dev, Vercel Blob storage in production (see
  `lib/storage.ts`).
- There's no login system — this is meant for single-user use. Whoever has the
  URL can see and edit everything, so don't share the deployed URL publicly.

## Notes

- Canvas LMS integration was intentionally left out of this version — Canvas's
  OAuth requires an institution-registered developer key, which most students
  can't set up themselves. The `Material.source` field leaves room to add a
  Canvas personal-access-token sync later without changing the data model.
- `pdf-parse` is pinned to `1.1.1` and imported via its internal
  `lib/pdf-parse.js` path (see `lib/pdf.ts`) — the package's `index.js` entry
  point runs a debug self-test on load that breaks under bundlers.

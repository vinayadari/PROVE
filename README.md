# PROVE — Next.js + TypeScript

PROVE is an evidence-based talent intelligence platform.

This version migrates the existing client UI and demo Express APIs into a single Next.js App Router + TypeScript application.

## Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS v4
- shadcn/Radix UI components already present in the source
- Zod
- Next.js Route Handlers
- Demo in-memory data (ported from the existing Express server)

## Structure

- `app/` — Next.js routes, pages and API route handlers
- `components/` — migrated UI components
- `lib/` — shared/client utilities and server demo data
- `public/` — existing public assets
- `legacy/` — original Vite `App.tsx` and `main.tsx` kept only for reference

## API routes

- `GET /api/health`
- `GET/POST /api/waitlist`
- `GET /api/candidates`
- `GET /api/candidates/:id`
- `GET /api/intelligence/benchmarks`
- `POST /api/intelligence/analyze`

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Typecheck

```bash
npm run typecheck
```

## Notes

The existing demo data is intentionally preserved for the UI. The next production phase should replace the in-memory stores with PostgreSQL + Drizzle and move heavy evidence collection into background workers.

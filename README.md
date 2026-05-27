# Resume Builder — ATS editor platform

Architecture aligned with your system map, using **NextAuth** (not Clerk) and **no Stripe** for now.

## Monorepo layout

| Path | Role |
|------|------|
| `my-app/` | Next.js app — Tiptap editor, PDF preview, ATS sidebar, API routes |
| `backend/` | FastAPI — spaCy sections + sklearn TF-IDF scoring |
| `worker/` | BullMQ worker — LaTeX → PDF via Tectonic, uploads to R2 |
| `data/keyword-corpus/` | O*NET / job-board keyword data (placeholder) |

## Stack

- **Frontend:** Next.js, Tiptap, Zustand, `@react-pdf/renderer` (ready to wire)
- **Auth:** NextAuth v5 + Prisma adapter
- **DB:** Supabase Postgres via Prisma
- **Files:** Cloudflare R2 (S3 API)
- **Cache / queue:** Upstash Redis + BullMQ
- **Scoring:** FastAPI + spaCy + scikit-learn

## Quick start

### 1. Next.js (`my-app`)

```bash
cd my-app
pnpm install
copy env.example .env.local
# Set DATABASE_URL, AUTH_SECRET, DEV_AUTH_EMAIL (local), etc.
pnpm db:push
pnpm dev
```

Sign in: http://localhost:3000/auth/signin

### 2. Scorer API (`backend`)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000
```

Set `SCORER_API_URL=http://localhost:8000` in `my-app/.env.local`.

### 3. PDF worker (`worker`)

```bash
cd worker
pnpm install
copy env.example .env
pnpm dev
```

Requires Redis (`REDIS_URL`), R2 credentials, and [Tectonic](https://tectonic-typesetting.github.io/) on PATH.

## API routes (Next.js)

- `GET/POST /api/resumes` — list / create
- `GET/PATCH/DELETE /api/resumes/[id]` — CRUD
- `POST /api/resumes/[id]/score` — proxy to FastAPI, persist score
- `POST /api/resumes/[id]/export` — enqueue PDF job

## What’s not included yet

- Stripe / subscriptions
- Clerk (replaced by NextAuth)
- Full `@react-pdf/renderer` preview wiring (package installed)
- O*NET corpus ingestion (folder stub only)

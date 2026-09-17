# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

"De La Jefecita" is a private business-operations webapp (production, inventory,
costs, sales) for a small salsa-making business. The public landing page lives at
`/` and does not mention or link to the private portal. The portal lives at
`/portal` and only lets in emails listed in the `socios` (partners) table.

## Commands

```bash
npm run dev          # start dev server
npm run build         # production build
npm run lint          # eslint
npm run db:generate   # generate a drizzle migration from lib/db/schema.ts
npm run db:push       # push schema.ts directly to the Supabase DB (no migration file)
npm run db:studio     # drizzle-kit studio GUI
npm run db:seed       # seed 1 socio + 3 productos + 2 ubicaciones (edit lib/db/seed.ts placeholders first)
```

There is no test suite configured. `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `DATABASE_URL` (pooler connection string,
port 6543) — see `.env.example`.

## Architecture

- **Auth**: Supabase Auth with Google as the only provider. `middleware.ts`
  refreshes the Supabase session on every request and redirects unauthenticated
  users hitting `/portal/*` to `/portal/login` (login and the OAuth callback
  route are excluded). Session/cookie logic lives directly inline in
  `middleware.ts`, not imported from another file.
- **Authorization**: being logged into Google is not enough — `lib/auth.ts`'s
  `requireSocio()` additionally checks that the user's email exists and is
  `activo` in the `socios` table (Postgres, via Drizzle), and signs the user
  out + redirects otherwise. Call `requireSocio()` at the top of every
  Server Component/page under `/portal`.
- **Two Supabase clients**: `lib/supabase/server.ts` (Server Components/actions,
  reads/writes cookies via `next/headers`) and `lib/supabase/client.ts`
  (browser). Use whichever matches where the code runs.
- **Database**: Drizzle ORM against Postgres (Supabase). Schema is the single
  source of truth in `lib/db/schema.ts`; run `db:push` (dev) or
  `db:generate` (versioned migration, output in `drizzle/`) after editing it.
  `lib/db/index.ts` exports the `db` client.
- **Module pattern**: each business module lives under
  `app/portal/(protected)/<modulo>/` and follows the layout used by `lotes/`
  (the only fully implemented module — use it as the reference):
  - `page.tsx` — list view
  - `nuevo/page.tsx`, `[id]/page.tsx` — create/edit
  - `actions.ts` — `"use server"` mutations (create/update/delete), each
    starting with `requireSocio()` and validating input with a shared Zod
    schema before touching the DB
  - `queries.ts` — read-only DB queries used by the pages
  - Modules not yet built (`insumos`, `costos`, `ventas`, `eventos`,
    `utilidades`) are disabled "Próximamente" placeholder entries in the
    sidebar (`app/portal/(protected)/layout.tsx`) — enable a module there once
    its `page.tsx` exists.
- **UI**: shadcn/ui components in `components/ui/` (generated, treat as
  library code) plus a few hand-written shared components at
  `components/` root (e.g. `estado-caducidad-badge.tsx`, `proximamente.tsx`).
  Path alias `@/*` maps to the repo root.
- Adding a new `producto` (salsa) or `socio` is a DB row insert (via
  `db:studio` or SQL), not a code change or redeploy.

# Pamina Rich — English & Literature

A WA English & Literature ATAR platform that delivers Pamina Rich's twenty years of
tutoring methodology at scale to students in Years 7–12 — a curriculum mapping tool,
content library, embedded/standalone metalanguage, and a CMS, mapped to the SCASA
curriculum. Platform name is a placeholder pending real branding.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080 via artifact.toml)
- `pnpm --filter @workspace/tutoring-platform run dev` — run the frontend (port 24689 via artifact.toml)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed representative sample content (texts, content types, sample documents, metalanguage terms)
- `pnpm --filter @workspace/scripts run grant-admin -- <email>` — grant CMS admin access to a user who has already logged in once
- Required env: `DATABASE_URL` — Postgres connection string; `REPL_ID` — used by Replit Auth OIDC

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, Replit Auth (OIDC) for sessions
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod v4, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) → React Query hooks + Zod schemas
- Frontend: React + Vite, wouter routing, shadcn/ui, Tailwind
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema, one file per table: `auth.ts` (users/sessions, from the replit-auth skill), `profiles.ts`, `admins.ts`, `texts.ts`, `contentTypes.ts`, `documents.ts` (+ `documentTexts` join), `documentVersions.ts`, `metalanguageTerms.ts`, `progress.ts`
- `lib/api-spec/openapi.yaml` — source of truth for the API contract; run codegen after every change
- `artifacts/api-server/src/routes/` — one router per domain; `admin/` subfolder is CMS-only, gated by `requireAdmin` middleware (`src/lib/adminAuth.ts`)
- `artifacts/api-server/src/lib/documents.ts` — shared document-shaping/publish/version logic used by both the public and admin document routes
- `artifacts/tutoring-platform/src/components/DocumentRenderer.tsx` — parses the CMS's shortcoded markdown (`[[Title]]`, `:::term`, `:::model`) into the WA title convention + embedded metalanguage boxes; `renderInlineText` from this file must be used anywhere a title string is displayed, not just inside document bodies
- `artifacts/tutoring-platform/src/pages/admin/` — the CMS (document list + editor with shortcode toolbar and version history)
- `scripts/src/seed.ts` — representative sample content (not Pamina's real library)
- `scripts/src/grant-admin.ts` — the only way to grant CMS access today; no self-serve admin UI

## Architecture decisions

- **Foundation-first scope.** This build deliberately covers accounts, content library, curriculum mapping tool, metalanguage (embedded + dictionary), and CMS only. The Comparative Novel Study tool, full Cultural Context Library hub navigation, video delivery, AI feedback engine, and Google Drive pipeline are NOT built — see the July 2026 platform spec in `Assets/` for the full feature list and the "Revised Specification v3" outline (Commercial Model, Data/Privacy/Safeguarding, Legal, Non-Functional Requirements, Testing, Delivery Plan) for what's still an open decision, not yet implemented.
- **Shortcoded markdown, not a rich text editor.** Document bodies are plain text with `[[Text Title]]` / `:::term ... :::` / `:::model ... :::` shortcodes, parsed by `DocumentRenderer`. This is what makes routine content updates possible without developer involvement, per the spec's CMS requirement — but it means any UI that shows a raw title string must route it through `renderInlineText`.
- **Admin role via table membership, not a role enum.** `platform_admins` is a flat allow-list of user IDs. There's no self-serve promotion flow; grant access via `grant-admin` script after the person's first login.
- **Publish always snapshots a version.** `publishDocument()` in `lib/documents.ts` is the only path that writes to `documentVersions` — both `POST /admin/documents` (when created with `status: published`) and `PATCH` (when it changes status to published) route through it, so version history can't silently gap.
- **Sample content, not real content.** The seed script exists to prove every content type/template/CMS flow end-to-end. It is not Pamina's actual library.

## Product

Students log in, set a year level/course profile, and land on a curriculum mapping
wizard that filters the content library to what matches their year/course/task/text.
Documents render with embedded metalanguage (blue curriculum-term boxes, green
model-sentence boxes) and the WA text-title convention; a Metalanguage Dictionary
sheet is reachable from any page without navigating away. Admins (Pamina) get a CMS
to create/edit/publish documents with version history.

## Gotchas

- The `zod` catalog pin was bumped from `^3.25.76` to `^4.4.3` — Orval's generated code (this orval/`@orval/zod` version) emits zod-v4-style top-level calls (`zod.email()`, `zod.url()`) for `format: email`/`format: uri` fields, which don't exist on bare `zod`'s v3 API. `zod/v4` imports (used directly in `lib/db` schema files) still resolve fine under v4.
- Generated React Query hooks: when passing `enabled`, you MUST also pass `queryKey` explicitly (e.g. `{ query: { enabled, queryKey: getGetNoteQueryKey(id) } }`) or it fails to typecheck — the generated `UseQueryOptions` type doesn't make `queryKey` optional even though the runtime does.
- The api-server's `dev` script is build-then-run, not a watcher — after editing server source, kill and relaunch it (`PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run dev`) to pick up changes; it won't hot-reload.
- No live-login testing was done in this session (Replit OIDC can't be driven headlessly) — the login → onboarding → admin CMS path is implemented and typechecked but only verified by code review, not by driving a real session. Unauthenticated pages (landing, library, document view, dictionary, curriculum map, 404, admin redirect-when-anonymous) were verified with a headless browser and had zero console errors.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `Assets/platform_specification_v3 (1).docx` for the full platform spec and the "Revised Specification v3" outline shared mid-build for what's out of scope / still needs real decisions (pricing, legal, AI provider choice, safeguarding, parental consent)

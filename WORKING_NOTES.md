# Working Notes — WarPigs Loot Manager

Purpose: Persistent, high‑level notes to retain context as chat context expires. I will update this file as we make changes.

## Current State / Decisions

- App: Vite + React + TypeScript, Tailwind UI, shadcn‑style primitives (Button, Input, Table, Card, Tooltip).
- Branding: "WarPigs Loot Manager" with dark theme and sticky top bar.
- Auth:
  - Gated app: unauthenticated → AuthPage; authenticated but not approved → PendingPage; approved → app.
  - Logout hardened: tries `global` sign out, ignores `session_not_found`, then always performs `local` sign out and clears client state.
- Items Page UX:
  - Hero replaced with a 3‑step guide (Find → Request → Receive).
  - Live search filters items as you type.
  - Single‑column toggle: selecting an item shows a full‑width Item Manager; back button returns to list.
  - Mobile layout: card list on small screens; desktop keeps table.
  - Requested Qty shows a Tooltip listing unfulfilled requests in priority order (oldest first).
  - Leaders can inline‑edit item quantity directly in the list; auto‑saves (400ms debounce) and on blur.
  - Quick-assign next to each request in Item Manager; leaders assign to a member with a tiny qty field + Assign button.
  - Right sidebar shows Recent Assignments and, beneath it, Latest Requests (most recent first, limited to 8).
  - Number inputs sized for two digits, centered text, native steppers kept; padding adjusted so steppers sit at the right edge.
- Data flow:
  - Assigning creates an `assignments` row, decrements `items.quantity` (on‑hand), then decrements the source `request` by the assigned amount, deleting it when it reaches 0.
  - Requests list shows only unfulfilled demand; Summary tallies from assignments (unchanged).

## Roles & Permissions

- Roles: `member`, `item_manager`, `leader`.
- Item Manager: may add items and update item quantities (cannot delete items).
- Leader: all item manager permissions plus delete and admin controls.
- Enforcement:
  - UI: forms and inline edits are gated by `canManageItems` (leader or item manager).
  - DB: RLS policies allow item managers to insert/update items; delete remains leader‑only.

## Environment / Deploy

- Vercel (static): build `npm run build`, output `dist/`.
- Required env (all scopes): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Schema Snapshot

- `items(id, name, quantity, date_iso, created_at)` — quantity reflects on‑hand stock.
- `requests(id, item_id, member_name, quantity, requester_id, created_at)` — unfulfilled demand only (decrement/delete on assign).
- `assignments(id, item_id, assignee_id, assignee_name, quantity, assigned_by, created_at)` — history of delivered loot.
- No `request_id` link on assignments yet (see TODOs).
- `settings(id=1, requests_enabled boolean)` — global toggle for request creation.

## Open TODOs / Follow‑ups

- Optional: Add `request_id uuid references requests(id)` to assignments for auditability and link quick‑assign to the exact request.
- Optional: Postgres RPC to atomically (assign + decrement request + decrement item) to avoid race conditions.
- UI polish: row selection highlight; optional toast on quick‑assign; refine header icons (ensure emoji render correctly in production).
- Branding: favicon / app icon update for "WP".
- Tests: unit tests for store logic (decrementRequest, addAssignment side‑effects) and tooltip rendering.
- Docs: README update for env setup and basic flows (leader vs member).

## Migrations

- We now track DB changes in `supabase/migrations/` with dated files.
- Latest: `2025-09-12_item_manager_role.sql` — adds Item Manager role, helper, and item insert/update policies.
- Apply missing migrations in Supabase SQL; snippets are idempotent and safe to re‑run.

## Known Notes / Caveats

- Tooltip is portal‑based and auto‑flips above when there’s no space below; sorted by `createdAt` ascending.
- Inline qty edit uses optimistic debounce; failed updates revert and alert.
- If header emojis don’t render correctly on Vercel, switch to small SVGs.

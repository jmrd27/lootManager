# Repository Guidelines

This repository hosts a small Vite + React app for organizing Lineage 2 raid boss drops and splitting loot among members. Keep changes focused, incremental, and easy to review.

## Project Structure & Module Organization
- `src/` — App source code (React components, hooks, types).
  - `src/features/loot/` — Item entry, requests, and split logic.
  - `src/components/` — Reusable UI (forms, tables, modals).
  - `src/lib/` — Utilities (date, storage, ids) and API clients.
- `public/` — Static assets and `index.html`.
- `tests/` — Unit/integration tests (Vitest + React Testing Library).
- `scripts/` — Local helper scripts (optional).

## Build, Test, and Development Commands
- `npm install` — Install dependencies.
- `npm run dev` — Start Vite dev server at `http://localhost:5173`.
- `npm run build` — Production build to `dist/`.
- `npm run preview` — Preview the production build locally.
- `npm run test` — Run Vitest in watch/CI mode.
- `npm run lint` — Lint with ESLint; auto-fix where safe.

## Coding Style & Naming Conventions
- Formatting: Prettier (2-space indent, semicolons, single quotes where configured).
- Linting: ESLint with React hooks and import rules.
- Language: TypeScript preferred (`.tsx`/`.ts`) for core logic; `.jsx` allowed for quick UI.
- Components: PascalCase (`MemberRequestsTable.tsx`).
- Hooks/utilities: camelCase (`useLootStore.ts`, `formatDate.ts`).
- Files/folders: group by feature (`src/features/loot/`), avoid deep nesting.

## Testing Guidelines
- Framework: Vitest + React Testing Library.
- File naming: colocate as `*.test.ts(x)` next to code or under `tests/` mirroring paths.
- Coverage: Aim for 80%+ on `src/features/loot/` logic (split calc, request merging).
- Typical command: `npm run test -- --coverage` in CI.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Keep commits small and focused; include rationale in body when non-obvious.
- PRs must include: concise description, screenshots/GIFs for UI, steps to validate, and linked issue (e.g., `Closes #12`).
- Ensure `npm run lint` and `npm run test` pass before requesting review.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local` for local overrides; document required keys in `README`.
- Validate user input on forms (quantities, dates). Sanitize any user-rendered strings.
- Prefer stable IDs over array indexes when tracking requests.

## Agent-Specific Notes
- When modifying files, follow feature-first layout under `src/features/loot/`.
- Do not alter unrelated code or tooling without an issue/discussion.
- Never commit or push changes without explicit user approval. Always pause and ask before any `git commit` or `git push`.
 - Maintain `WORKING_NOTES.md` as a living summary of goals, decisions, and open TODOs. Update it alongside substantive changes.
 - Track DB changes as dated SQL snippets under `supabase/migrations/` (idempotent, re-runnable). Prefer adding migrations over editing existing applied SQL.

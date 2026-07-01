# Code Quality Standards (project canonical)

This file captures the high-signal code-quality rules required for this repository. It is intentionally concise — use AGENTS.md and .opencode/context/project-intelligence/technical-domain.md for fuller background.

Principles
- Clarity over cleverness. Keep functions small, well-named, and focused.
- Type-safety first. Prefer explicit types and avoid `any` except in narrow adapter layers.
- Small, incremental edits. One logical change per commit where possible.

TypeScript
- Keep `strict: true` semantics. Prefer `unknown` over `any` at boundaries; validate with Zod where appropriate.
- Annotate exported function parameters and return types when unclear.
- Avoid `as` casts except for known interop boundaries (PocketBase typegen double-cast pattern allowed).

Svelte / Framework
- Follow Svelte 5 runes conventions ($state, $effect, $derived). Do not create components inside other components.
- Keep server-only code in `src/lib/server/` and never import it client-side.
- Use `{@const}` for complex template expressions to avoid emitting TS-only syntax into runtime.

Linting & Formatting
- Primary checks (run locally before commits):
  - `pnpm fix` (project shortcut for automatic fixes)
  - `pnpm check` (typecheck + paraglide message generation + other project checks)
  - `pnpm svelte-check` (Svelte compiler/type checks)
- Do not bypass these checks with `--no-verify` or other skip flags when committing.

Tests & Verification
- TDD-first when adding features: write failing unit tests, implement, then refactor.
- Run these checks locally before commits/pushes:
  1. `pnpm dlx ultracite fix` (optional auto-fix)
  2. `pnpm lint --fix`
  3. `pnpm check` (typecheck + paraglide generation)
  4. `pnpm test:unit`
- If `pnpm check` fails due to paraglide import errors, run `pnpm build` then re-run the check.

Commits & PRs
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`.
- Keep commit scope small and message imperative. Example: `fix(menu): move language switch into sheet`.
- Create topic branches using git-flow naming: `feature/`, `bugfix/`, `hotfix/`.
- Do not push or merge without passing local checks above.

Security & Secrets
- Never commit secrets or credentials. Use environment files and CI secrets.
- For PocketBase queries, always use parameterized filters (`api.filter(expr, params)`), not string interpolation.

Accessibility
- Follow WCAG AA: semantic HTML, proper heading hierarchy, alt text, keyboard focus management for interactive controls.

CI Gatekeeping
- CI must run `pnpm build` → `pnpm test:unit` → E2E. If checks fail on CI, do NOT merge until failures are resolved.

Automation
- Use pre-commit hooks (husky) where configured; do not disable them.

Exceptions
- Document any deliberate deviation from these rules in the PR description and add a code-review note explaining the trade-off.

Reference
- AGENTS.md — project-wide policies
- .opencode/context/project-intelligence/technical-domain.md — language-specific patterns

This file is authoritative for local agent workflows. Update it if you introduce new repository-level tooling or change lint/test gating.

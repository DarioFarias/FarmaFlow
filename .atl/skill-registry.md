# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review. | branch-pr | C:\Users\XbFam\.gemini\antigravity\skills\branch-pr\SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | C:\Users\XbFam\.gemini\antigravity\skills\issue-creation\SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". | judgment-day | C:\Users\XbFam\.gemini\antigravity\skills\judgment-day\SKILL.md |
| When writing Go tests, using teatest, or adding test coverage. | go-testing | C:\Users\XbFam\.gemini\antigravity\skills\go-testing\SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | C:\Users\XbFam\.gemini\antigravity\skills\skill-creator\SKILL.md |
| When working on Next.js features, routes, or architecture. | next-best-practices | c:\Users\XbFam\OneDrive\Documentos\Dario\Dev\FarmaFlow\.agents\skills\next-best-practices\SKILL.md |
| When optimizing caching, using PPR, or Next.js 16+ cache features. | next-cache-components | c:\Users\XbFam\OneDrive\Documentos\Dario\Dev\FarmaFlow\.agents\skills\next-cache-components\SKILL.md |
| When upgrading Next.js versions. | next-upgrade | c:\Users\XbFam\OneDrive\Documentos\Dario\Dev\FarmaFlow\.agents\skills\next-upgrade\SKILL.md |
| When refactoring components, building libraries, or designing component APIs. | vercel-composition-patterns | c:\Users\XbFam\OneDrive\Documentos\Dario\Dev\FarmaFlow\.agents\skills\vercel-composition-patterns\SKILL.md |
| When writing or refactoring React/Next.js code for performance. | vercel-react-best-practices | c:\Users\XbFam\OneDrive\Documentos\Dario\Dev\FarmaFlow\.agents\skills\vercel-react-best-practices\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### next-best-practices
- Follow App Router conventions (layout.tsx, page.tsx, error.tsx, loading.tsx).
- Keep React Server Component (RSC) boundaries clear; use client components only for interactivity.
- Use async APIs (cookies, headers, params) as per Next.js 14/15+ requirements.
- Standardize metadata with `export const metadata` or `generateMetadata`.
- Prefer Server Actions for data mutations and React Server Components for fetching.
- Optimize assets using `next/image` and `next/font`.

### next-cache-components
- Enable `cacheComponents: true` in config for Next.js 16+ PPR features.
- Use `'use cache'` directive for granular caching of async functions/components.
- Manage cache lifetime using `cacheLife()` with built-in profiles (minutes, hours) or custom config.
- Tag cached content with `cacheTag()` and invalidate via `updateTag()` (immediate) or `revalidateTag()` (background).
- Do NOT access `cookies()` or `searchParams` directly inside `'use cache'`; pass them as arguments to keep them as cache keys.

### vercel-composition-patterns
- Avoid boolean prop proliferation; use component composition and `children`.
- Implement Compound Components pattern to share state via Context.
- Decouple state management logic from UI; Provider should be the single source of truth.
- Lift state into Provider components for sibling access.
- React 19: Use `use()` instead of `useContext()`, and skip `forwardRef` (ref is a regular prop).

### vercel-react-best-practices
- Eliminate data waterfalls: Use `Promise.all()` for independent fetches or Suspense for streaming.
- Bundle size: Avoid barrel imports; use `next/dynamic` for heavy client components.
- Server-side: Use `React.cache()` for per-request deduplication; hoist static I/O.
- Performance: Use functional setState for stable callbacks; check cheap sync conditions before awaiting.
- Code style: Return early (early exit); use Map/Set for O(1) lookups.

### judgment-day
- Launch two independent blind judge sub-agents in parallel for review.
- Classification: `WARNING (real)` vs `WARNING (theoretical)`. Fix only real ones.
- APPROVED requires 0 confirmed CRITICALs and 0 confirmed real WARNINGs after re-judgment.
- Synthesize verdicts into a confirmed/suspect/contradiction table before acting.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| node_modules/.bin/next | node_modules/.bin/next | Main framework executable |
| package.json | package.json | Dependency and script manifest |

Read the convention files listed above for project-specific patterns and rules.

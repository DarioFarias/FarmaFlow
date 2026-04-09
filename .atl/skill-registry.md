# FarmaFlow Skill Registry

## Project Standards (Compact Rules)

### Next.js & React
- Use Server Components by default.
- Use 'use client' only for interactive components.
- Follow Clean Architecture: keep business logic in `src/lib` and `src/models`, not in components.
- Use Zod for all data validation (API and Forms).

### Styling
- Use Vanilla CSS or TailwindCSS utilities (existing project uses Tailwind).
- Follow atomic design or component-based structure in `src/components`.

### Testing
- Write tests in `*.test.ts` or `*.test.tsx`.
- Follow Strict TDD: feature -> specs -> tests -> implementation.

## User Skills
| Skill | Trigger | Path |
|-------|---------|------|
| next-best-practices | next.js, react, rsc | .agents/skills/next-best-practices/SKILL.md |
| branch-pr | pr, github, review | .gemini/antigravity/skills/branch-pr/SKILL.md |
| go-testing | go, bubbletea | .gemini/antigravity/skills/go-testing/SKILL.md |
| issue-creation | issue, github | .gemini/antigravity/skills/issue-creation/SKILL.md |
| judgment-day | review, adversarial | .gemini/antigravity/skills/judgment-day/SKILL.md |
| sdd-* | sdd, spec, change | .gemini/antigravity/skills/sdd-*/SKILL.md |

## Project Instructions
No project-specific AGENTS.md found.

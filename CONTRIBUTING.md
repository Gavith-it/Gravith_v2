# Contributing

## Setup

- Node 20, npm ci
- Run lint, typecheck, build

## Scripts

- lint, typecheck, test, e2e, analyze, format

## PR Checklist

- [ ] Lint/typecheck pass
- [ ] Tests updated
- [ ] Lighthouse A11y ≥ 95
- [ ] Screenshots for UI changes
- [ ] Docs updated

## shadcn Rules

- Add primitives with `npx shadcn@latest add`
- Never copy primitives outside ui/

## Docs Conventions

- All documentation lives under `docs/` organized by topic
- Architecture: `docs/architecture/*`
- Specs: `docs/specs/*`
- Guides: `docs/guides/*`
- Processes: `docs/processes/*`
- Testing: `docs/testing/*`
- Performance: `docs/performance/*`
- Accessibility: `docs/accessibility/*`
- Use relative links within `docs/`; avoid bare URLs
- One topic per file; H1 title in sentence case

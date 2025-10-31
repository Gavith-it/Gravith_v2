# Coding Standards

## TypeScript

- "strict": true, noImplicitReturns, noUncheckedIndexedAccess.
- Prefer `type` for props.

## Imports

- Absolute via `@/*`.
- Enforce import sorting and no unused imports.

## Components

- PascalCase components, camelCase hooks.
- Pages thin; push logic to hooks/composites.
- Do not modify shadcn primitives.

## Tests

- Vitest + RTL for unit.
- Playwright for E2E.

## Git

- Conventional Commits.
- PR must pass lint, typecheck, test, e2e, lighthouse (A11y ≥ 95).

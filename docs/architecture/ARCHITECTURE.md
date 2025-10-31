# Architecture

## Stack

Next.js 15.5.4, React 19.1, TS 5, Tailwind v4, shadcn/ui, Recharts, RHF+Zod.

## Structure

- `src/app/**`: routes
- `src/components/ui/**`: shadcn primitives only
- `src/components/common/**`: shared composites
- `src/components/forms/**`: business forms
- `src/components/layout/**`: scaffolds
- `src/lib/hooks/**`: global hooks
- `src/lib/**`: utils
- `src/assets/**`: images

## Rendering

- Server Components default.
- Client Components only for interaction.

## Theming

- Tailwind + CSS variables.
- Dark mode via `next-themes`.

## Cross-Cutting

- A11y-first.
- Bundle analyzer snapshots in `perf/bundles/`.

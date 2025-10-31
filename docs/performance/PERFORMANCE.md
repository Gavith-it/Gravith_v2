# Performance

## Budgets

- Main route JS < 230KB gzip.
- Dynamic chunk < 180KB.
- LCP < 2.5s.

## Practices

- Dynamic import charts/forms.
- Virtualize tables > 100 rows.
- Use next/image.
- Memoize pure comps.
- Cache/revalidate rules per route.

## Process

- `npm run analyze` → store JSON in perf/bundles/.

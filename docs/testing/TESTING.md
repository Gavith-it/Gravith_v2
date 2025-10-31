# Testing

## Unit (Vitest + RTL)

- Hooks: `useDialogState`, `useTableState`.
- Composites: `DataTable`, `FormDialog`.
- For portals, assert by role.

## E2E (Playwright)

- Smoke: /login, /signup, /dashboard, /sites, /materials.
- Prefer roles/labels.

## Coverage

- Global ≥ 70%, critical ≥ 85%.

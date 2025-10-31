# UI Guidelines (shadcn/ui)

- Primitives only in `src/components/ui/**`.
- Build composites in `common/` or `layout/`.
- Use Tailwind tokens; no inline hex.
- Scaffold pages with `PageHeader` + `SectionCard`.
- Tables = `DataTable`; Forms = `FormDialog`.
- Icon-only controls need `aria-label`.
- Verify light/dark, WCAG AA contrast.

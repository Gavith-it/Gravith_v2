# Gavith Build — Product Requirements Document (PRD)

## 1. Executive Summary

**Vision.** A modern, multi-tenant construction management platform that centralizes sites, materials, progress, vendors, vehicles, finances, and reporting.  
**Mission.** Reduce operational waste and decision latency with live visibility, consistent workflows, and robust auditability.

## 2. Market & Users

- **Primary orgs:** Indian SMB–midmarket construction firms (50–500+ employees), multi-project.
- **Personas:** Admin, Project Manager, Site Supervisor, Materials Manager, Finance Manager, Executive.

## 3. Multi-Tenancy

- SaaS **organization-scoped tenancy** (Org → Projects/Sites → Records).
- Logical isolation by `orgId`; middleware enforces.
- Invite-based onboarding, role assignment at org scope.
- Tenant-scoped exports, audit logs.

## 4. Core Modules

- **Dashboard**: KPIs and activity.
- **Sites**: CRUD, milestones, supervisors.
- **Materials**: Master data, stock, procurement.
- **Work Progress**: Daily logs, % complete.
- **Vendors**: CRUD, contracts, ratings.
- **Vehicles**: Fleet usage, fuel, maintenance.
- **Payments/Finance**: Expenses, contracts, records.
- **Scheduling**: Activities, milestones, dependencies.
- **Organization**: Tenant profile, setup.
- **Auth**: Login/signup, middleware protection.

## 5. Roles

Admin, Project Manager, Site Supervisor, Materials Manager, Finance Manager, Executive.

> All tenant-scoped.

## 6. Non-Functional Requirements

- WCAG AA compliance, Lighthouse A11y ≥ 95.
- Page load < 3s, primary route JS < 230KB gzip.
- Tenant isolation enforced everywhere.
- Graceful errors (`error.tsx`, `not-found.tsx`).

## 7. Success Metrics

- Time-to-task < 90s for creating a site.
- 0 critical a11y issues.
- ≥ 80% monthly active usage.

## 8. Release Plan

- **v0.1.0:** Frontend only with mocks, multi-tenant guards.
- **v0.2.0:** API contracts wired.
- **v1.0.0:** Production with real auth, audits, reports.

## 9. Risks

- Perf with large datasets → virtualized tables.
- Role complexity → keep simple RBAC v0.
- Divergence from shadcn → enforce rules in `UI_GUIDELINES.md`.

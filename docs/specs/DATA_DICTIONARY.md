# Data Dictionary (v0)

## Core

- Org: { id, name, logoUrl? }
- User: { id, email, name, role, orgId }
- Site: { id, orgId, name, status, startDate, endDate, address?, managerId? }
- Material: { id, orgId, sku, name, uom, unitPrice?, category? }
- Vendor: { id, orgId, name, contact?, rating? }
- Vehicle: { id, orgId, regNo, type, lastServiceAt?, odometer? }
- Expense: { id, orgId, siteId?, category, amount, date, note?, vendorId? }
- Payment: { id, orgId, contractId?, amount, date, method, reference? }
- ProgressLog: { id, orgId, siteId, date, workType, qty, units, notes? }

## Audit Fields

All entities include:

- createdAt
- createdBy
- updatedAt
- updatedBy

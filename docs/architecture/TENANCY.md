# Tenancy & Auth — Gavith Build

## Model

- Multi-tenant SaaS: every entity has `orgId`.
- One user → one org in v0; future: multi-org.

## Guards

- Middleware attaches `orgId` to request.
- Client never constructs cross-org URLs.
- Server components validate session + `orgId`.

## Roles

Admin, PM, Supervisor, Materials, Finance, Executive.

## Data

All CRUD APIs require `orgId`.  
Exports include org name + audit metadata.

## Onboarding

- Admin creates org, invites via email.
- Optional org logo + name.

## Future

SSO/SAML, custom domains, cross-org contractors.

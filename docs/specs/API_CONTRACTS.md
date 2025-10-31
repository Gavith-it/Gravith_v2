# API Contracts (Frontend ↔ Backend)

## Auth

- POST /api/auth/login { email, password } → { user, org }
- POST /api/auth/logout

## Sites

- GET /api/sites?cursor&limit
- POST /api/sites
- PATCH /api/sites/:id
- DELETE /api/sites/:id

## Materials

- GET /api/materials?search
- POST /api/materials
- PATCH /api/materials/:id
- DELETE /api/materials/:id

## Response Shape

type ApiResult<T> =
| { ok: true; data: T }
| { ok: false; error: { code: string; message: string } };

# Cache Configuration Guide

Quick reference for which routes to cache and which to exclude.

---

## ❌ NEVER CACHE (Always Fresh)

### Auth Routes
```typescript
// File: src/app/api/auth/profile/route.ts
export async function GET() {
  const response = NextResponse.json({ profile });
  // ❌ NO CACHE - Always return fresh user data
  return response;
}
```

**Routes:**
- `/api/auth/profile` - User profile (changes on login/logout)
- `/api/auth/signup` - Signup (POST, can't cache anyway)
- `/api/auth/login` - Login (handled by Supabase client)

### Form Submission Routes (POST/PUT/DELETE)
**Note:** These can't be cached anyway (browsers don't cache POST/PUT/DELETE), but make sure they don't have cache headers.

```typescript
// File: src/app/api/materials/route.ts (POST)
export async function POST(request: Request) {
  const response = NextResponse.json({ material });
  // ❌ NO CACHE HEADERS - Form submissions must be fresh
  return response;
}
```

**Routes:**
- `/api/materials` (POST) - Create material
- `/api/materials/[id]` (PUT, DELETE) - Update/delete material
- `/api/sites` (POST) - Create site
- `/api/vehicles` (POST) - Create vehicle
- `/api/purchases` (POST) - Create purchase
- `/api/receipts` (POST) - Create receipt
- `/api/work-progress` (POST) - Create work entry
- `/api/scheduling/activities` (POST) - Create activity
- `/api/scheduling/milestones` (POST) - Create milestone
- `/api/expenses` (POST) - Create expense
- `/api/payments` (POST) - Create payment
- `/api/vendors` (POST) - Create vendor
- `/api/organization/invite` (POST) - Send invite
- **All POST/PUT/DELETE routes**

---

## ✅ SAFE TO CACHE (List/Read-only Data)

### Materials List
```typescript
// File: src/app/api/materials/route.ts (GET)
export async function GET(request: Request) {
  // ... fetch materials ...
  
  const response = NextResponse.json({ materials });
  
  // ✅ SAFE: Cache for 60 seconds
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  );
  
  return response;
}
```

**Routes:**
- `/api/materials` (GET) - Materials list ✅ Cache 60s
- `/api/vehicles` (GET) - Vehicles list ✅ Cache 60s
- `/api/vendors` (GET) - Vendors list ✅ Cache 60s
- `/api/sites` (GET) - Sites list ⚠️ Cache 30s (if sites don't change often)
- `/api/dashboard/overview` (GET) - Dashboard stats ✅ Cache 30s
- `/api/reports/overview` (GET) - Report data ✅ Cache 60s

---

## ⚠️ CONDITIONAL CACHING (Depends on Use Case)

### Sites List
```typescript
// File: src/app/api/sites/route.ts (GET)
export async function GET(request: Request) {
  // ... fetch sites ...
  
  const response = NextResponse.json({ sites });
  
  // ⚠️ OPTION 1: Cache if sites don't change often
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=30, stale-while-revalidate=60'
  );
  
  // ⚠️ OPTION 2: No cache if sites are added frequently
  // (Don't add cache headers)
  
  return response;
}
```

**Decision:**
- ✅ **Cache if:** Sites are added rarely (once a month)
- ❌ **Don't cache if:** Sites are added frequently (daily/weekly)

---

## 📝 Implementation Template

### Template for Cached GET Route
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    // ... your fetch logic ...
    
    const response = NextResponse.json({ data });
    
    // ✅ Add cache headers for safe routes
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    );
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Template for Non-Cached GET Route (Auth/User Data)
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    // ... your fetch logic ...
    
    const response = NextResponse.json({ data });
    
    // ❌ NO CACHE HEADERS - Always return fresh data
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Template for POST Route (Form Submission)
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // ... your create/update logic ...
    
    const response = NextResponse.json({ success: true });
    
    // ❌ NO CACHE HEADERS - POST requests can't be cached anyway
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

---

## 🎯 Quick Decision Tree

```
Is it a GET request?
├─ NO → Don't add cache (POST/PUT/DELETE can't be cached)
│
└─ YES → Is it auth/user data?
    ├─ YES → Don't cache (always fresh)
    │
    └─ NO → Is it a list/read-only data?
        ├─ YES → Cache for 60 seconds ✅
        │
        └─ NO → Don't cache (or cache for shorter time)
```

---

## ✅ Final Checklist

Before deploying, verify:

- [ ] ✅ `/api/auth/profile` - NO cache headers
- [ ] ✅ `/api/materials` (GET) - HAS cache headers (60s)
- [ ] ✅ `/api/materials` (POST) - NO cache headers
- [ ] ✅ `/api/vehicles` (GET) - HAS cache headers (60s)
- [ ] ✅ `/api/vehicles` (POST) - NO cache headers
- [ ] ✅ All POST/PUT/DELETE routes - NO cache headers
- [ ] ✅ All auth routes - NO cache headers

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Caching User Profile
```typescript
// ❌ WRONG - Don't cache user profile!
export async function GET() {
  const response = NextResponse.json({ profile });
  response.headers.set('Cache-Control', 'public, s-maxage=60'); // ❌
  return response;
}
```

### ❌ Mistake 2: Caching Form Dropdowns That Change Often
```typescript
// ❌ WRONG - If sites are added daily, don't cache!
export async function GET() {
  const response = NextResponse.json({ sites });
  response.headers.set('Cache-Control', 'public, s-maxage=3600'); // ❌ Too long!
  return response;
}
```

### ✅ Correct: Cache Lists, Not User Data
```typescript
// ✅ CORRECT - Cache materials list (changes infrequently)
export async function GET() {
  const response = NextResponse.json({ materials });
  response.headers.set('Cache-Control', 'public, s-maxage=60'); // ✅
  return response;
}

// ✅ CORRECT - Don't cache user profile
export async function GET() {
  const response = NextResponse.json({ profile });
  // No cache headers ✅
  return response;
}
```

---

## 📊 Cache Duration Recommendations

| Route Type | Cache Duration | Reason |
|-----------|---------------|---------|
| Materials List | 60 seconds | Changes infrequently |
| Vehicles List | 60 seconds | Changes infrequently |
| Vendors List | 60 seconds | Changes infrequently |
| Sites List | 30 seconds | May change more often |
| Dashboard Stats | 30 seconds | Needs to be relatively fresh |
| User Profile | 0 (no cache) | Must always be fresh |
| Auth Routes | 0 (no cache) | Security sensitive |
| Form Submissions | 0 (no cache) | Can't cache POST anyway |

---

**Remember:** When in doubt, **don't cache**. It's better to have slightly slower responses than stale data! 🎯


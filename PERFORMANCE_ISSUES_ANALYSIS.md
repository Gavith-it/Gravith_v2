# Performance Issues Analysis

## 🔍 Issues Identified

### Issue 1: Components Always Show Loading on Mount

**Problem**: Every time you navigate to a page (dashboard, sites, materials, etc.), the component remounts and:

- Sets `isLoading = true` immediately
- Fetches data from API (even if server has cache)
- Shows "Loading data..." message
- Only shows content after fetch completes

**Root Cause**:

- Components use `useState(true)` for loading state
- `useEffect(() => {...}, [])` runs on every mount
- No client-side data persistence between navigations
- Components unmount when navigating away, losing all state

**Example from Dashboard.tsx**:

```typescript
const [isLoading, setIsLoading] = useState(true); // Always starts as loading

useEffect(() => {
  const loadDashboard = async () => {
    setIsLoading(true); // Shows loading even if data was cached
    const response = await fetch('/api/dashboard/overview');
    // ... fetch data
    setIsLoading(false);
  };
  loadDashboard();
}, []); // Runs every time component mounts
```

### Issue 2: Data Re-fetches Even After Visiting

**Problem**: After visiting all pages once, when you go back to dashboard (or any page):

- Component remounts
- State is reset to empty
- Fetches data again (even though server cache exists)
- Shows loading state again

**Root Cause**:

- React components unmount when navigating away
- State is lost (not persisted)
- No client-side cache to show data immediately
- Server cache helps, but client still shows loading while fetching

### Issue 3: Slow Page Navigation

**Problem**: When clicking/switching between pages:

- There's a noticeable delay before page appears
- Page feels unresponsive during navigation

**Root Cause**:

- `router.push()` doesn't prefetch pages
- Next.js waits for page component to load
- Component mounts → fetches data → shows content
- No optimistic navigation or prefetching

---

## 💡 Solutions

### Solution 1: Implement Client-Side Caching (SWR or React Query)

**Why**:

- Persist data across navigations
- Show cached data immediately
- Revalidate in background
- No loading state for cached data

**Implementation Options**:

#### Option A: SWR (Recommended - Lightweight)

```typescript
import useSWR from 'swr';

// In Dashboard component
const { data, error, isLoading } = useSWR('/api/dashboard/overview', fetcher, {
  revalidateOnFocus: false, // Don't refetch on window focus
  revalidateOnReconnect: true, // Refetch when internet reconnects
  dedupingInterval: 60000, // Dedupe requests within 60s
  keepPreviousData: true, // Show previous data while loading new
});
```

**Benefits**:

- ✅ Shows cached data immediately (no loading state)
- ✅ Revalidates in background
- ✅ Automatic request deduplication
- ✅ Built-in error handling
- ✅ Small bundle size (~5KB)

#### Option B: React Query (More Features)

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['dashboard'],
  queryFn: () => fetch('/api/dashboard/overview').then((r) => r.json()),
  staleTime: 30000, // Consider data fresh for 30s
  cacheTime: 300000, // Keep in cache for 5min
});
```

**Benefits**:

- ✅ More features (mutations, infinite queries, etc.)
- ✅ Better devtools
- ✅ Larger bundle size (~15KB)

### Solution 2: Optimize Loading States

**Current**:

```typescript
const [isLoading, setIsLoading] = useState(true); // Always shows loading
```

**Optimized**:

```typescript
// With SWR
const { data, isLoading } = useSWR('/api/dashboard/overview', fetcher);
// data is undefined only on first load, not on subsequent navigations
// isLoading is false if data is cached
```

### Solution 3: Add Next.js Prefetching

**Current**:

```typescript
router.push('/sites'); // Waits for page to load
```

**Optimized**:

```typescript
import Link from 'next/link';

// Prefetch on hover
<Link href="/sites" prefetch={true}>
  Sites
</Link>

// Or programmatically
router.prefetch('/sites'); // Prefetch before navigation
router.push('/sites'); // Instant navigation
```

### Solution 4: Show Cached Data While Revalidating

**Current**: Shows loading spinner while fetching

**Optimized**: Show cached data immediately, update when new data arrives

```typescript
const { data, isLoading, isValidating } = useSWR('/api/dashboard/overview', fetcher);

// Show cached data immediately
if (data) {
  return <DashboardContent data={data} />;
}

// Only show loading on first load (no cache)
if (isLoading) {
  return <LoadingSpinner />;
}
```

---

## 📊 Expected Performance Improvements

### Before:

- Dashboard load: 500ms+ (shows loading)
- Navigate to Sites: 300ms delay + 500ms load
- Navigate back to Dashboard: 500ms+ (shows loading again)
- **Total navigation time**: ~1.3s per page switch

### After (with SWR):

- Dashboard load (first time): 500ms (shows loading)
- Navigate to Sites: 50ms (prefetched) + 500ms load
- Navigate back to Dashboard: **0ms** (cached, no loading)
- **Total navigation time**: ~50ms for cached pages

**Improvement**: **26x faster** for cached pages

---

## 🎯 Recommended Implementation Plan

### Phase 1: Add SWR (High Impact, Low Effort)

1. Install SWR: `npm install swr`
2. Create SWR fetcher utility
3. Replace `useEffect` + `fetch` with `useSWR` in:
   - Dashboard
   - Sites
   - Materials
   - Vehicles
   - Reports
   - All other pages

### Phase 2: Add Prefetching (Medium Impact, Low Effort)

1. Replace `router.push()` with `Link` components where possible
2. Add `router.prefetch()` on sidebar hover
3. Prefetch on route change start

### Phase 3: Optimize Loading States (Low Impact, Low Effort)

1. Show cached data immediately
2. Only show loading on first load
3. Show subtle "updating" indicator during revalidation

---

## 🔧 Implementation Details

### SWR Setup

**1. Create fetcher utility** (`src/lib/swr.ts`):

```typescript
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};
```

**2. Update Dashboard component**:

```typescript
import useSWR from 'swr';
import { fetcher } from '@/lib/swr';

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: dashboardData = emptyDashboardData, error, isLoading } = useSWR<DashboardData>(
    '/api/dashboard/overview',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // Show cached data immediately, no loading state if cached
  if (error) {
    return <ErrorState error={error} />;
  }

  // Only show loading on first load (when data is undefined)
  if (!dashboardData || isLoading) {
    return <LoadingState />;
  }

  return <DashboardContent data={dashboardData} />;
}
```

**3. Update other components similarly**

---

## ✅ Benefits Summary

1. **Instant Navigation**: Cached pages load instantly (0ms)
2. **No Loading States**: Cached data shows immediately
3. **Background Updates**: Data revalidates without blocking UI
4. **Better UX**: Users see content immediately, updates happen seamlessly
5. **Reduced Server Load**: Request deduplication prevents duplicate calls

---

## 📝 Next Steps

1. Review this analysis
2. Approve implementation approach
3. Implement SWR across all pages
4. Add prefetching for faster navigation
5. Test and verify improvements

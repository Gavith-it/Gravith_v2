# Session Expiration & Auto-Logout Implementation

## ✅ Problem Solved

**Issue**: User logs in, doesn't logout, and after a few days opens the application again. The app redirects to dashboard without login, but shows no user profile because the session expired.

**Solution**: Implemented automatic session expiration and logout with redirect to landing page.

---

## 🔧 Implementation Details

### 1. **Session Expiration Time**

- **Duration**: 24 hours (1 day)
- **Configurable**: Set in `SESSION_EXPIRY_TIME` constant
- **Location**: `src/lib/auth-context.tsx`

### 2. **Session Validation**

- **Periodic Check**: Every 5 minutes (configurable via `SESSION_CHECK_INTERVAL`)
- **On Window Focus**: Checks when user returns to the tab
- **On Visibility Change**: Checks when tab becomes visible
- **On App Load**: Validates session on initialization

### 3. **Auto-Logout Features**

- ✅ Automatically logs out when session expires (24 hours)
- ✅ Automatically logs out when Supabase session is invalid
- ✅ Clears session timestamp from localStorage
- ✅ Redirects to landing page (`/`) when not authenticated

### 4. **Session Tracking**

- Stores session start time in `localStorage` when user logs in
- Updates timestamp on token refresh
- Clears timestamp on logout

---

## 📋 Code Changes

### `src/lib/auth-context.tsx`

**Added**:

1. Session expiration constants:

   ```typescript
   const SESSION_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
   const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
   ```

2. `checkSessionExpiry()` function:
   - Checks if session is older than 24 hours
   - Validates with Supabase
   - Auto-logout if expired or invalid

3. Periodic session validation:
   - Interval check every 5 minutes
   - Window focus event listener
   - Visibility change event listener

4. Session timestamp tracking:
   - Stores `session_start_time` in localStorage on login
   - Updates on token refresh
   - Clears on logout

### `src/components/AppShell.tsx`

**Added**:

1. Protected pages list
2. Redirect logic for unauthenticated users
3. `useEffect` to redirect to landing page when not logged in

---

## 🔄 How It Works

### Login Flow:

1. User logs in successfully
2. Session start time stored in `localStorage`
3. User profile loaded and displayed

### During Active Session:

1. Every 5 minutes: Check if session expired
2. On window focus: Validate session
3. On tab visibility: Validate session
4. If valid: Continue using app
5. If expired: Auto-logout and redirect

### After 24 Hours:

1. User opens application
2. `checkSessionExpiry()` runs
3. Detects session is > 24 hours old
4. Calls `logout()` automatically
5. Redirects to landing page (`/`)
6. User must login again

### Session Invalid (Supabase):

1. User opens application
2. `checkSessionExpiry()` validates with Supabase
3. Supabase returns invalid/expired session
4. Calls `logout()` automatically
5. Redirects to landing page (`/`)

---

## 🎯 Benefits

1. **Security**: Prevents stale sessions from being used
2. **User Experience**: Automatic logout prevents confusion
3. **Data Protection**: Ensures only authenticated users access protected pages
4. **Clean State**: Redirects to landing page when not authenticated

---

## ⚙️ Configuration

### Change Session Duration:

```typescript
// In src/lib/auth-context.tsx
const SESSION_EXPIRY_TIME = 24 * 60 * 60 * 1000; // Change to desired duration
```

### Change Check Interval:

```typescript
// In src/lib/auth-context.tsx
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Change to desired interval
```

---

## ✅ Testing

To test session expiration:

1. **Login** to the application
2. **Manually set** session timestamp to past:
   ```javascript
   // In browser console
   localStorage.setItem('session_start_time', (Date.now() - 25 * 60 * 60 * 1000).toString());
   ```
3. **Refresh** the page or wait for next check interval
4. **Should automatically logout** and redirect to landing page

---

## 📝 Notes

- Session expiration is **24 hours** by default
- Session validation happens **every 5 minutes** while app is active
- Session is also checked on **window focus** and **tab visibility**
- All protected pages redirect to landing page if not authenticated
- Session timestamp is stored in `localStorage` (client-side)

---

## 🚀 Status

**✅ IMPLEMENTED AND WORKING**

- ✅ Automatic session expiration (24 hours)
- ✅ Periodic session validation (every 5 minutes)
- ✅ Auto-logout on session expiry
- ✅ Redirect to landing page when not authenticated
- ✅ Session tracking with localStorage
- ✅ Window focus/visibility checks

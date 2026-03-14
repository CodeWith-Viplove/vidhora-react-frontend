# Protected Routes Implementation

## Overview
This application now uses token-based authentication with protected routes to secure internal pages and prevent unauthorized access.

## Authentication Flow

### Token Storage
- **authToken**: JWT token stored in `sessionStorage.getItem('authToken')`
- **userInfo**: User details stored in `sessionStorage.getItem('userInfo')`

### Route Protection

#### 1. ProtectedRoute Component (`src/Components/ProtectedRoute.jsx`)
- Protects routes that require authentication (e.g., `/app/*`)
- Checks for both `authToken` and `userInfo` in sessionStorage
- If not authenticated → Redirects to `/login`
- If authenticated → Renders the protected content
- Saves attempted location and redirects back after login

#### 2. PublicRoute Component (`src/Components/PublicRoute.jsx`)
- Handles public pages (e.g., `/` landing page, `/login`)
- Has a `restricted` prop for pages like login
- If `restricted={true}` and user is authenticated → Redirects to `/app/dashboard`
- If `restricted={false}` → Always accessible (landing page)

## Route Configuration

### Public Routes (No Authentication Required)
```jsx
// Landing Page - Always accessible
<Route path="/" element={
  <PublicRoute>
    <LandingPage />
  </PublicRoute>
} />
```

### Restricted Public Routes (Redirect if Authenticated)
```jsx
// Login Page - Redirects to dashboard if already logged in
<Route path="/login" element={
  <PublicRoute restricted={true}>
    <LoginPage />
  </PublicRoute>
} />
```

### Protected Routes (Authentication Required)
```jsx
// App Routes - Requires valid token
<Route path="/app/*" element={
  <ProtectedRoute>
    <MainApp />
  </ProtectedRoute>
} />
```

## User Flows

### 1. Unauthenticated User Accessing Protected Route
```
User navigates to /app/dashboard
→ ProtectedRoute checks sessionStorage
→ No token found
→ Redirects to /login (with location state)
→ After login → Redirects back to /app/dashboard
```

### 2. Authenticated User Accessing Login Page
```
User navigates to /login
→ PublicRoute (restricted) checks sessionStorage
→ Token found
→ Redirects to /app/dashboard
→ Prevents seeing login page when already logged in
```

### 3. Authenticated User Accessing Protected Route
```
User navigates to /app/law-simplifier
→ ProtectedRoute checks sessionStorage
→ Token found
→ Renders MainApp component
→ Shows Law Simplifier page
```

### 4. User Logs Out
```
User clicks logout
→ AuthContext.logout() called
→ Clears sessionStorage (authToken, userInfo, user_id)
→ Navigates to /login
→ Next protected route access → Redirects to login
```

## Security Features

1. **Token Validation**: Checks for both token and user info
2. **Session-based**: Uses sessionStorage (clears on browser close)
3. **Redirect Protection**: Authenticated users can't access login page
4. **Location Memory**: Saves attempted location for post-login redirect
5. **Logout Cleanup**: Properly clears all authentication data

## Testing Checklist

### Manual Testing Steps:

1. **Test Protected Route Without Login**
   - Clear sessionStorage
   - Navigate to http://localhost:5174/app/dashboard
   - Should redirect to /login

2. **Test Login Redirect**
   - Login successfully
   - Should redirect to /app/dashboard
   - Check sessionStorage has authToken and userInfo

3. **Test Login Page When Authenticated**
   - While logged in, navigate to /login
   - Should redirect to /app/dashboard

4. **Test Page Refresh on Protected Route**
   - Navigate to /app/law-simplifier
   - Refresh the page
   - Should stay on /app/law-simplifier (token persists)

5. **Test Logout**
   - Click logout from dashboard
   - Should redirect to /login
   - sessionStorage should be cleared
   - Try accessing /app/* → Should redirect to /login

6. **Test Landing Page Access**
   - Navigate to / (landing page)
   - Should be accessible both logged in and logged out

## Files Modified/Created

### Created:
- `src/Components/ProtectedRoute.jsx` - Protected route wrapper
- `src/Components/PublicRoute.jsx` - Public route wrapper
- `PROTECTED_ROUTES.md` - This documentation

### Modified:
- `src/App.jsx` - Added route protection wrappers
- `src/Pages/MainApp/MainApp.jsx` - URL-based routing (previous update)

## Environment Dependencies

- `react-router-dom` v6+ (useNavigate, useLocation, Navigate)
- sessionStorage API (browser built-in)
- JWT tokens from backend API

## Notes

- Tokens are stored in **sessionStorage** (not localStorage) for better security
- Each tab/window has its own session
- Closing browser clears the session automatically
- For production, consider adding token expiration checks
- Consider implementing refresh token mechanism for better UX

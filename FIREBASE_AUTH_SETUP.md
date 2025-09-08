# Firebase Authentication Setup Guide

## Overview
The system now uses Firebase Authentication with JWT token verification to protect customer pages.

## How It Works

1. **Login Flow**: Users login with email/password via Firebase Auth
2. **Token Generation**: Firebase generates ID tokens for authenticated users
3. **Middleware Protection**: Middleware verifies tokens before allowing access to `/customer/*` routes
4. **Automatic Redirects**: Unauthenticated users are redirected to login page
5. **Session Management**: Valid tokens are stored in HTTP-only cookies

## Authentication Flow

### 1. User Access
- User tries to access `/customer` page
- Middleware checks for valid Firebase token
- If no token → redirect to `/login`
- If valid token → allow access

### 2. Login Process
- User enters email/password on login page
- Firebase authenticates credentials
- On success → redirect to `/customer`
- On failure → show error message

### 3. Token Management
- Firebase ID tokens are automatically generated
- Tokens are added to URL for middleware verification
- Valid tokens are stored in HTTP-only cookies
- Tokens are refreshed automatically by Firebase

## Files Created/Updated

### Core Authentication
- `src/contexts/AuthContext.tsx` - Authentication context and provider
- `src/app/login/page.tsx` - Login page with Firebase authentication
- `src/lib/firebase-token.ts` - Firebase token management utilities

### API & Middleware
- `src/app/api/verify-token/route.ts` - Firebase token verification API
- `middleware.ts` - Route protection middleware
- `src/app/unauthorized/page.tsx` - Unauthorized access page

### Updated Pages
- `src/app/customer/page.tsx` - Customer search with authentication
- `src/app/layout.tsx` - Root layout with AuthProvider

## Environment Variables

Make sure your `.env.local` has Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Firebase Console Setup

1. **Enable Authentication**:
   - Go to Firebase Console → Authentication
   - Enable "Email/Password" sign-in method

2. **Create Test Users**:
   - Go to Authentication → Users
   - Add users manually or use the sign-up flow

## Testing the System

### 1. Test Login Flow
1. Navigate to `/customer` (should redirect to `/login`)
2. Enter valid Firebase credentials
3. Should redirect to `/customer` after successful login

### 2. Test Token Verification
1. Login successfully
2. Check browser network tab for token in URL
3. Verify middleware allows access to customer pages

### 3. Test Logout
1. Click logout button on customer page
2. Should redirect to login page
3. Try accessing `/customer` again (should redirect to login)

## Security Features

- **Server-side Verification**: Tokens verified via API route
- **HTTP-Only Cookies**: Secure token storage
- **Automatic Expiration**: Firebase handles token expiration
- **Route Protection**: Middleware protects all customer routes
- **Error Handling**: Proper error messages and redirects

## User Experience

- **Seamless Login**: Clean, professional login interface
- **Auto-redirect**: Authenticated users skip login
- **Session Persistence**: Users stay logged in during browser session
- **Logout Functionality**: Easy logout with proper cleanup

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Check Firebase config path
2. **Login redirects to unauthorized**: Check Firebase project configuration
3. **Tokens not working**: Verify Firebase Authentication is enabled
4. **Middleware not working**: Check middleware matcher configuration

### Debug Steps

1. Check browser console for errors
2. Verify Firebase project settings
3. Test API route directly: `/api/verify-token?token=YOUR_TOKEN`
4. Check network tab for token in requests

## Next Steps

1. **Set up Firebase project** with Authentication enabled
2. **Create test users** in Firebase Console
3. **Test the complete flow** from login to customer access
4. **Customize login page** styling if needed
5. **Add user roles** if required for different access levels

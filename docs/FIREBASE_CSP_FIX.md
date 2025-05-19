# Firebase Content Security Policy (CSP) Fix

## Problem

When deploying to Vercel or a custom domain, Firebase connections were being blocked by Content Security Policy (CSP) errors. The errors in the browser console included:

```
Refused to connect to 'https://firebase.googleapis.com/v1alpha/projects/-/apps/1:155434252666:web:fa5051f4cb33f3a784bec3/webConfig' because it violates the following Content Security Policy directive: "connect-src 'self' *.vercel.app".

Refused to connect to 'https://firebaseinstallations.googleapis.com/v1/projects/ticktokshop-5f1e9/installations' because it violates the following Content Security Policy directive: "connect-src 'self' *.vercel.app".

Refused to load the script 'https://www.googletagmanager.com/gtag/js?l=dataLayer&id=G-5BRMHTMXHR' because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.app".

Fetch API cannot load https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8. Refused to connect because it violates the document's Content Security Policy.
```

## Solution

The solution was to update the Content Security Policy (CSP) in `security-headers.js` to allow connections to all necessary Firebase domains.

### Updated Content Security Policy

```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.app *.googleapis.com *.googletagmanager.com *.google-analytics.com *.gstatic.com tiktokshophub.co www.tiktokshophub.co; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' data: blob: *.googleapis.com *.gstatic.com tiktokshophub.co www.tiktokshophub.co; font-src 'self' *.gstatic.com; connect-src 'self' *.vercel.app *.firebaseio.com *.googleapis.com *.firebase.googleapis.com *.firebaseinstallations.googleapis.com *.identitytoolkit.googleapis.com *.firebasestorage.googleapis.com *.google-analytics.com *.appspot.com wss://*.firebaseio.com tiktokshophub.co www.tiktokshophub.co tiktok-6upktrfhg-asfundyarkhans-projects.vercel.app tiktok-git-main-asfundyarkhans-projects.vercel.app tiktok-ten-lilac.vercel.app; frame-src 'self' *.firebaseapp.com *.web.app ticktokshop-5f1e9.firebaseapp.com ticktokshop-5f1e9.web.app tiktokshophub.co www.tiktokshophub.co tiktok-6upktrfhg-asfundyarkhans-projects.vercel.app tiktok-git-main-asfundyarkhans-projects.vercel.app tiktok-ten-lilac.vercel.app",
}
```

### Firebase Domains Added

The following domains were added to the CSP:

#### In the `connect-src` directive:
- `*.firebaseio.com` - For Realtime Database connections
- `*.googleapis.com` - For Google APIs
- `*.firebase.googleapis.com` - For Firebase API calls
- `*.firebaseinstallations.googleapis.com` - For Firebase Installations
- `*.identitytoolkit.googleapis.com` - For Firebase Authentication
- `*.firebasestorage.googleapis.com` - For Firebase Storage
- `*.google-analytics.com` - For Google Analytics
- `*.appspot.com` - For Firebase Storage and Hosting
- `wss://*.firebaseio.com` - For WebSocket connections to Firebase
- Custom domains: `tiktokshophub.co`, `www.tiktokshophub.co`, and Vercel preview URLs

#### In the `script-src` directive:
- `*.googleapis.com` - For Google APIs scripts
- `*.googletagmanager.com` - For Google Analytics
- `*.google-analytics.com` - For Google Analytics
- `*.gstatic.com` - For Google Static Content
- Custom domains: `tiktokshophub.co`, `www.tiktokshophub.co`

#### In the `frame-src` directive:
- `*.firebaseapp.com` - For Firebase Authentication
- `*.web.app` - For Firebase Hosting
- Custom domains: `tiktokshophub.co`, `www.tiktokshophub.co`, and Vercel preview URLs

#### In the `img-src` directive:
- `*.googleapis.com` - For Google APIs images
- `*.gstatic.com` - For Google Static Content
- Custom domains: `tiktokshophub.co`, `www.tiktokshophub.co`

## Testing the Fix

After deploying the updated CSP, you should test:

1. **Firebase Authentication**: Try logging in and registering
2. **Firebase Firestore**: Check if database operations work
3. **Firebase Analytics**: Verify analytics events are sent correctly

## Common CSP Issues with Firebase

When working with Firebase in production, you might need to adjust your CSP for:

### 1. Firebase Authentication

Authentication requires access to `identitytoolkit.googleapis.com` for sign-in, sign-up, and other auth operations.

### 2. Firebase Firestore/RTDB

Database operations require access to `firebaseio.com` and related domains.

### 3. Firebase Storage

If you're using Firebase Storage, ensure `firebasestorage.googleapis.com` is included.

### 4. Firebase Analytics

Analytics requires access to `googletagmanager.com` for script loading and `google-analytics.com` for data collection.

## Vercel-Specific Considerations

When deploying to Vercel:

1. **Preview Deployments**: The CSP applies to all environments (production, preview, development)
2. **Custom Domains**: When using custom domains, the same CSP will apply

## Security Considerations

While this CSP configuration enables Firebase to work properly, it's still relatively restrictive by:

- Limiting general connections to your domain and Firebase domains only
- Only allowing scripts from trusted sources
- Enforcing other security headers like HSTS, X-Frame-Options, etc.

For additional security, consider implementing nonces for inline scripts if your application structure permits.

## Further Resources

- [Content Security Policy (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Firebase Hosting and Security](https://firebase.google.com/docs/hosting/full-config#security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

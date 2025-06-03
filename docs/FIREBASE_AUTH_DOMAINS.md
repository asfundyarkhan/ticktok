# Firebase Authentication Domain Configuration

## Overview

This document explains how to properly configure both Firebase Authentication domains and Content Security Policy (CSP) headers for the TikTok Shop application.

## Authorized Domains in Firebase

The following domains have been authorized in Firebase Authentication:

- localhost (for local development)
- ticktokshop-5f1e9.firebaseapp.com
- ticktokshop-5f1e9.web.app
- tiktokshop.international
- www.tiktokshop.international
- tiktok-6upktrfhg-asfundyarkhans-projects.vercel.app
- tiktok-git-main-asfundyarkhans-projects.vercel.app
- tiktok-ten-lilac.vercel.app

These domains must be listed in the Firebase Authentication console under "Authentication" > "Settings" > "Authorized domains".

## Content Security Policy Configuration

The Content Security Policy has been configured in `security-headers.js` to include all necessary domains for Firebase services. Here's a breakdown of the domains included:

### Script Sources (script-src)

- `'self'` (the origin itself)
- `'unsafe-inline'` and `'unsafe-eval'` (required for some Firebase operations)
- `*.vercel.app` (for Vercel deployments)
- `*.googleapis.com` (Google APIs, Firebase scripts)
- `*.googletagmanager.com` (Google Analytics)
- `*.google-analytics.com` (Google Analytics)
- `*.gstatic.com` (Google Static assets)
- `tiktokshop.international` and `www.tiktokshop.international` (main domain)

### Connect Sources (connect-src)

- `'self'` (the origin itself)
- `*.vercel.app` (for Vercel deployments)
- `*.firebaseio.com` (Firebase Realtime Database)
- `*.googleapis.com` (various Google/Firebase APIs)
- `*.firebase.googleapis.com` (Firebase APIs)
- `*.firebaseinstallations.googleapis.com` (Firebase Installations)
- `*.identitytoolkit.googleapis.com` (Firebase Authentication)
- `*.firebasestorage.googleapis.com` (Firebase Storage)
- `*.google-analytics.com` (Google Analytics)
- `*.appspot.com` (Firebase hosting)
- `wss://*.firebaseio.com` (WebSockets for Firebase Realtime Database)
- All custom authorized domains

### Frame Sources (frame-src)

- `'self'` (the origin itself)
- `*.firebaseapp.com` (Firebase hosting)
- `*.web.app` (Firebase hosting)
- All custom authorized domains

## Verifying CSP Headers

After deploying, you can verify that your CSP headers are correctly configured using the `verify-csp.js` script in the `scripts` directory:

```bash
# Install axios if not already installed
npm install axios --save-dev

# Run the verification script
node scripts/verify-csp.js
```

## Common Issues and Troubleshooting

### Authentication Failures

If Firebase Authentication isn't working, check your browser console for CSP errors. You may need to add additional domains to the CSP header.

### Storage Access Problems

For Firebase Storage operations, ensure that both `*.firebasestorage.googleapis.com` and `*.appspot.com` are included in your connect-src directive.

### Google Analytics Not Working

If Google Analytics isn't recording events, ensure `*.google-analytics.com` is included in both script-src and connect-src directives.

## Adding New Domains

When adding new domains for deployment:

1. Add the domain to Firebase Authentication console
2. Update the CSP headers in `security-headers.js`
3. Redeploy your application
4. Verify with the `verify-csp.js` script

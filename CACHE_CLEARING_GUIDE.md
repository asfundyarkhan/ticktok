# Cache Clearing Documentation

## Overview

This document provides instructions for clearing all types of cache in the Ticktok application, both server-side and client-side.

## Server-Side Cache Clearing

### Automated Script (Recommended)

Run the PowerShell script to clear all server-side caches:

```powershell
.\clear-all-cache.ps1
```

### Manual Commands

If you prefer to run commands manually:

```powershell
# 1. Clear Next.js build cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 2. Clear npm cache
npm cache clean --force
npm cache verify

# 3. Clear node_modules cache
Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue

# 4. Clear TypeScript cache
Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue

# 5. Clear ESLint cache
Remove-Item -Force ".eslintcache" -ErrorAction SilentlyContinue

# 6. Fresh build
npm run build
```

## Client-Side Cache Clearing

### Option 1: Browser Developer Tools

1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear storage** and select all options
4. Click **Clear site data**
5. Hard refresh the page (Ctrl+Shift+R)

### Option 2: Automated JavaScript Script

1. Open your browser's developer console (F12 → Console tab)
2. Copy and paste the contents of `clear-client-cache.js`
3. Press Enter to execute
4. The script will automatically reload the page

### Option 3: Manual Browser Cache Clear

1. **Chrome/Edge**: Ctrl+Shift+Delete → Select "All time" → Check all boxes → Clear data
2. **Firefox**: Ctrl+Shift+Delete → Select "Everything" → Check all boxes → Clear Now
3. Hard refresh the page (Ctrl+Shift+R)

## What Each Cache Type Contains

### Server-Side Caches:

- **.next/**: Next.js build artifacts, compiled pages, and optimization data
- **npm cache**: Downloaded npm packages and metadata
- **node_modules/.cache**: Various tool caches (Babel, webpack, etc.)
- **tsconfig.tsbuildinfo**: TypeScript incremental compilation cache
- **.eslintcache**: ESLint linting results cache

### Client-Side Caches:

- **localStorage**: Persistent data stored by the application
- **sessionStorage**: Session-specific data
- **IndexedDB**: Large structured data storage
- **Service Worker caches**: Offline-capable cached resources
- **Browser cache**: HTTP cached resources (images, CSS, JS)
- **Cookies**: Authentication and preference data

## When to Clear Cache

### Clear Server-Side Cache When:

- ✅ Build errors that seem inconsistent
- ✅ Changes not appearing in production build
- ✅ Upgrading dependencies
- ✅ Switching between branches with different dependencies
- ✅ TypeScript errors that don't make sense
- ✅ Deployment issues

### Clear Client-Side Cache When:

- ✅ Application behaving unexpectedly in browser
- ✅ Authentication issues
- ✅ UI not updating after code changes
- ✅ localStorage/sessionStorage corruption
- ✅ Service Worker conflicts
- ✅ Testing fresh user experience

## Files Created

1. **clear-all-cache.ps1** - PowerShell script for server-side cache clearing
2. **clear-client-cache.js** - JavaScript for client-side cache clearing
3. **CACHE_CLEARING_GUIDE.md** - This documentation file

## Verification Steps

After clearing cache, verify everything works:

1. ✅ **Build succeeds**: `npm run build`
2. ✅ **Dev server starts**: `npm run dev`
3. ✅ **Pages load correctly**: Visit main application pages
4. ✅ **Authentication works**: Login/logout functionality
5. ✅ **Data loads**: Check that API calls work
6. ✅ **No console errors**: Check browser developer console

## Troubleshooting

If issues persist after cache clearing:

1. **Delete node_modules and reinstall**:

   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. **Check for file permission issues**:

   - Ensure you have write permissions to project directory
   - Run PowerShell as Administrator if needed

3. **Verify environment files**:

   - Check `.env.local`, `.env.development`, `.env.production`
   - Ensure all required environment variables are set

4. **Check for conflicting processes**:
   - Stop any running development servers
   - Close other applications using the same ports

## Status: COMPLETE ✅

All cache clearing mechanisms are now in place and documented. Use the provided scripts and guidelines to maintain a clean development environment.

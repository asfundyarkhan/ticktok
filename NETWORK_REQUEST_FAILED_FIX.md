# 🌐 Firebase Network Request Failed - Localhost Fix Guide

## Issue: `auth/network-request-failed`

This error occurs when Firebase SDK cannot connect to Firebase servers from your localhost environment.

## 🔍 Diagnostic Steps

### Step 1: Run Network Diagnostic

```powershell
# Test basic network connectivity
ping google.com
ping firebase.googleapis.com
ping identitytoolkit.googleapis.com
```

### Step 2: Check Windows Firewall

1. **Open Windows Defender Firewall**
2. **Click "Allow an app through firewall"**
3. **Find "Node.js JavaScript Runtime"** and ensure both Private and Public are checked
4. **If not found, click "Allow another app..."** and add Node.js

### Step 3: Check Antivirus Software

- **Temporarily disable** your antivirus software
- **Test Firebase connection** again
- **If it works**, add Firebase domains to antivirus whitelist:
  - `*.googleapis.com`
  - `*.firebase.com`
  - `*.firebaseapp.com`

### Step 4: DNS Configuration

```powershell
# Flush DNS cache
ipconfig /flushdns

# Try alternative DNS servers
# Set DNS to Google DNS: 8.8.8.8, 8.8.4.4
# Or Cloudflare DNS: 1.1.1.1, 1.0.0.1
```

### Step 5: Proxy/VPN Check

- **Disable VPN** if you're using one
- **Check proxy settings** in Windows Network settings
- **Try mobile hotspot** to bypass network restrictions

## 🛠️ Quick Fixes Applied

### 1. Added Retry Logic to Firebase Operations

The AuthContext now automatically retries failed network requests with exponential backoff:

- **3 retry attempts** for network failures
- **Exponential delay** (1s, 2s, 4s)
- **Only retries** on network-related errors

### 2. Improved Error Handling

- Better error detection for network issues
- More informative error messages
- Graceful fallback behavior

## 🧪 Test the Fixes

### Method 1: Use the App

1. Start dev server: `npm run dev`
2. Try to login at: `http://localhost:3000/login`
3. Check browser console for retry messages

### Method 2: Direct Network Test

```powershell
node test-firebase-network.mjs
```

## 📊 Expected Behavior After Fix

### If Network Issues Persist:

```
Network error detected, retrying in 1000ms (attempt 1/3)
Network error detected, retrying in 2000ms (attempt 2/3)
Network error detected, retrying in 4000ms (attempt 3/3)
❌ Sign in error: auth/network-request-failed
```

### If Network Issues Are Resolved:

```
✅ Firebase Auth network request successful
✅ User authenticated successfully
```

## 🔧 Environment-Specific Solutions

### Corporate/School Networks

- **Contact IT department** to whitelist Firebase domains
- **Request firewall exceptions** for Firebase ports (443, 80)
- **Use personal mobile hotspot** for development

### Home Networks

- **Restart router/modem**
- **Check ISP restrictions** (some ISPs block certain cloud services)
- **Try different browser** to rule out browser-specific issues

### Windows-Specific

- **Run as Administrator:** Try running command prompt as admin
- **Windows Defender:** Add Firebase domains to trusted sites
- **Network Reset:** `netsh winsock reset` (requires restart)

## 🚨 Emergency Workarounds

If network issues persist and you need to continue development:

### 1. Skip Authentication Temporarily

```typescript
// In development, you can temporarily bypass auth
if (process.env.NODE_ENV === "development") {
  // Skip auth for localhost testing
  return;
}
```

### 2. Use Firebase Emulator

```powershell
# Install Firebase Tools
npm install -g firebase-tools

# Start emulator
firebase emulators:start --only auth,firestore
```

### 3. Mock Authentication

Create a mock auth provider for localhost development only.

## 📋 Solution Checklist

- [ ] Windows Firewall configured for Node.js
- [ ] Antivirus temporarily disabled for testing
- [ ] DNS cache flushed
- [ ] VPN/Proxy disabled
- [ ] Alternative network tested (mobile hotspot)
- [ ] Firebase domains whitelisted
- [ ] Retry logic implemented (✅ Done)
- [ ] Error handling improved (✅ Done)

## 📞 Support Resources

If issues persist:

1. **Firebase Support:** [Firebase Console > Support](https://console.firebase.google.com/support)
2. **Network Administrator:** Contact your IT department
3. **ISP Support:** Check if Firebase is blocked by your internet provider

---

**Note:** The `auth/network-request-failed` error is almost always related to local network configuration, not Firebase or your application code.

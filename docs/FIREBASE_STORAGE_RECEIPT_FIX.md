# Firebase Storage Unauthorized Error Fix

## Problem

When uploading receipts to Firebase Storage, you're getting an error:

```
FirebaseError: Firebase Storage: User does not have permission to access 'receipts/DJGM82I2cffSbD4oU7v7r3vnS9F2/1748375145576-1786997901_max.jpg'. (storage/unauthorized)
```

## Solution

We've implemented several fixes to address this issue:

### 1. Updated Firebase Storage Rules ✅

The storage rules have been updated to allow read access to all files and write access for authenticated users:

```
// Allow public read access to all files
match /{allPaths=**} {
  allow read: if true;
  allow write: if isAuthenticated();
}
```

### 2. Modified Receipt Upload Logic ✅

The receipt upload function has been improved to:

- Better detect and handle permission errors
- Add more metadata to uploads
- Provide clearer error messages
- Add a retry mechanism for getting download URLs

### 3. Updated Receipt Upload Form ✅

The receipt upload form now:

- Validates file size before uploading
- Shows more descriptive error messages
- Uses a loading state during upload

### 4. Added CORS Configuration

The Firebase Storage bucket needs proper CORS configuration. Use the new helper script:

```powershell
cd c:\Ticktok\ticktok
.\scripts\update-firebase-storage-cors.ps1
```

### 5. Check your Firebase Configuration

Verify that your app is using the correct Firebase Storage bucket:

1. The bucket domain should be `.firebasestorage.app` rather than `.appspot.com`
2. Your `.env.local` file should have the correct bucket name:
   ```
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ticktokshop-5f1e9.firebasestorage.app
   ```

## Testing the Fix

1. Try uploading a receipt in the application
2. Check the browser console for any CORS or permission errors
3. If errors persist, run the permission helper script:

```powershell
cd c:\Ticktok\ticktok
node scripts\fix-storage-permissions.js
```

## Additional Troubleshooting

If you continue experiencing issues:

1. Verify your Firebase authentication is working properly
2. Check if custom claims (user roles) are correctly set
3. Try uploading a smaller image file (<1MB)
4. Look for any error messages in the browser console

## References

- [Firebase Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security)
- [Firebase Storage CORS Configuration](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- [Handling Firebase Storage Permissions](https://firebase.google.com/docs/storage/web/handle-errors)

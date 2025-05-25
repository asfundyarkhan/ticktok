# Firebase Storage CORS Configuration Guide

This document explains how to configure CORS for Firebase Storage to enable uploading files from your local development environment or other domains.

## CORS Issues Overview

Cross-Origin Resource Sharing (CORS) restrictions prevent web applications from making requests to a different domain than the one that served the web application. When uploading images to Firebase Storage from localhost or other domains, you may encounter CORS errors like:

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.firebasestorage.app/o?name=products%2F12%2F1786997901_max.jpg' from origin 'http://localhost:3001' has been blocked by CORS policy
```

## Temporary Workaround

For local development, the application automatically uses placeholder images instead of actual uploads to Firebase Storage. This workaround is implemented in `ProductService.ts` in the `uploadProductImage` method.

To test with real uploads, set `isFirebaseStorageConfigured = true` and `const usePlaceholder = false` in the `uploadProductImage` method.

## Permanent Solution: Configure Firebase Storage CORS

To properly fix CORS issues, follow these steps:

### Option 1: Using Google Cloud Console (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "Cloud Storage" > "Browser"
4. Find your bucket (usually named `[PROJECT-ID].appspot.com`)
5. Click on the "Permissions" tab
6. Add CORS configuration with the following JSON:

```json
[
  {
    "origin": [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "*"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "Content-Disposition",
      "Access-Control-Allow-Origin"
    ]
  }
]
```

### Option 2: Using Firebase CLI with gsutil

If you have Google Cloud SDK installed with gsutil:

1. Create a file named `cors-config.json` with the configuration above
2. Run the following command:

```bash
gsutil cors set cors-config.json gs://YOUR-BUCKET-NAME.appspot.com
```

Replace `YOUR-BUCKET-NAME` with your actual bucket name (usually your project ID).

### Option 3: Using Firebase Storage Rules

Update your `storage.rules` file to include special handling for local development:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Your existing rules here

      // Special case for development - allow operations from localhost
      allow write: if request.resource.size < 20 * 1024 * 1024 &&
                    (request.origin == "http://localhost:3000" ||
                     request.origin == "http://localhost:3001" ||
                     request.origin == "http://localhost:3002");
    }
  }
}
```

## Verifying CORS Configuration

To verify if CORS is properly configured, use the CORS testing page at:
http://localhost:3000/cors-proxy.html or http://localhost:3003/cors-proxy.html (when running your development server)

## Technical Notes

- The Firebase Storage bucket name follows the pattern: `[PROJECT-ID].appspot.com`
- For our project, the bucket name is: `ticktokshop-5f1e9.appspot.com`
- CORS headers must be configured on the server side (Firebase Storage)
- Client-side CORS headers in metadata will not resolve server-side CORS restrictions

## Additional Resources

- [Firebase Storage CORS Configuration Documentation](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- [Google Cloud Storage CORS Documentation](https://cloud.google.com/storage/docs/configuring-cors)

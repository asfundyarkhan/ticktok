# Firebase Authentication Setup

This project uses Firebase Authentication for user management and Firestore for storing user data.

## Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication in the Authentication section
3. Set up Firestore database in the Firestore section
4. Generate a service account key from Project Settings > Service accounts > Generate new private key

## Configuration

### Client-side Firebase

The client-side Firebase configuration is stored in `src/lib/firebase/firebase.ts` and uses the following environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

### Server-side Firebase Admin

The server-side Firebase Admin SDK configuration is stored in `src/lib/firebase/firebase-admin.ts` and can be set up in two ways:

1. Using environment variables (recommended for production):

```
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

2. Using a service account key file:
   Place the service account key JSON file at `src/lib/firebase/credentials/service-account.json`

## Security

- Never commit the service account key to your repository
- The service account key is added to `.gitignore`
- For production, use environment variables instead of the file

## Firebase Rules

Ensure you have proper security rules in your Firestore database:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Products can be read by anyone but written only by sellers or admins
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null &&
                    (resource.data.sellerId == request.auth.uid ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

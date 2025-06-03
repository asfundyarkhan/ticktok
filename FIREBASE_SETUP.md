# Ticktok Firebase Authentication and Firestore Setup

This document provides instructions for setting up Firebase Authentication and Firestore in the Ticktok e-commerce application.

## Firebase Project Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable Authentication (with Email/Password at minimum)
3. Create a Firestore database in production mode
4. Add a web app to your Firebase project to get the configuration

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables (already done):

```bash
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tiktokshop.international
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ticktokshop-5f1e9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ticktokshop-5f1e9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=155434252666
NEXT_PUBLIC_FIREBASE_APP_ID=1:155434252666:web:fa5051f4cb33f3a784bec3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5BRMHTMXHR

# Firebase Admin Configuration (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=ticktokshop-5f1e9
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email@ticktokshop-5f1e9.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"
```

## Firebase Admin Setup

1. Go to your Firebase project settings
2. Navigate to the "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Use the values from the JSON file to populate the `FIREBASE_ADMIN_` environment variables

## Firestore Database Structure

The database has the following main collections:

1. `users` - User profiles and authentication data
2. `products` - Product listings
3. `orders` - User orders

### Users Collection

Each document in the `users` collection represents a user profile:

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  balance: number;
  role: "user" | "seller" | "admin";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Products Collection

Each document in the `products` collection represents a product:

```typescript
interface Product {
  id?: string;
  productCode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  sellerId: string;
  sellerName: string;
  rating: number;
  reviews: number;
  category?: string;
  listed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Orders Collection

Each document in the `orders` collection represents an order:

```typescript
interface Order {
  id?: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "credit" | "balance" | "cod";
  paymentStatus: "pending" | "paid" | "refunded";
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}
```

## Firestore Rules

The Firestore security rules are defined in `firestore.rules`. Deploy these rules using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Deployment

To deploy the app with Firebase:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase hosting: `firebase init hosting`
4. Build the Next.js app: `npm run build`
5. Deploy: `firebase deploy`

## Service Usage

The codebase includes service classes for interacting with Firebase:

- `UserService` - User data management
- `ProductService` - Product management
- `OrderService` - Order management

These services abstract the Firestore operations for consistent data management.

## Authentication Flow

Authentication is handled by the `AuthContext` provider. Key features include:

- User sign up
- User sign in
- User sign out
- Password reset
- User profile management

The middleware automatically protects routes based on authentication status.

// Firebase Admin SDK for server-side operations - SERVER COMPONENT ONLY
// Import the initialization logic (which runs automatically)
import admin from './firebase-admin-init';

// Export the admin modules
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

// Server actions for Firebase Admin operations
export async function verifySessionToken(sessionToken: string) {
  try {
    return await adminAuth.verifySessionCookie(sessionToken, true);
  } catch (error) {
    console.error('Error verifying session token:', error);
    throw new Error('Invalid session');
  }
}

export async function getFirestoreUser(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    return userDoc.exists ? userDoc.data() : null;
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    throw error;
  }
}

export async function createSessionCookie(idToken: string, expiresIn: number) {
  try {
    return await adminAuth.createSessionCookie(idToken, { expiresIn });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    throw error;
  }
}

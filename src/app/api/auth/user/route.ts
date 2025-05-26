// API route for getting the current user from the session cookie
import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionToken,
  adminAuth,
  getFirestoreUser,
} from "@/lib/firebase/firebase-admin.server";

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("firebase_auth")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify the session cookie
    const decodedClaims = await verifySessionToken(sessionCookie);

    // Get the user from Firebase Auth
    const user = await adminAuth.getUser(decodedClaims.uid);

    // Get the user profile from Firestore
    const userProfile = await getFirestoreUser(user.uid);

    // Return user info    // Check if user is suspended
    if (userProfile?.suspended) {
      const response = NextResponse.json(
        {
          user: null,
          error:
            "Your account has been suspended. Please contact support for assistance.",
        },
        { status: 403 }
      );
      response.cookies.delete("firebase_auth");
      return response;
    }

    return NextResponse.json(
      {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          ...userProfile,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting user:", error);

    // Create a response and clear the invalid cookie
    const response = NextResponse.json({ user: null }, { status: 200 });
    response.cookies.delete("firebase_auth");
    return response;
  }
}

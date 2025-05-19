"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  UserCredential,
} from "firebase/auth";
import { auth, firestore } from "../lib/firebase/firebase";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";

// Define User Profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  balance: number;
  role: "user" | "seller" | "admin" | "superadmin";
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

// Define Auth Context Type
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to format authentication errors
const formatAuthError = (error: any): string => {
  const errorCode = error?.code || "";

  // Custom error messages based on Firebase Auth error codes
  switch (errorCode) {
    case "auth/user-not-found":
      return "No account exists with this email. Please register first.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please use the sign in page instead.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Invalid email format.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    default:
      return error?.message || "An unknown error occurred";
  }
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      const userRef = doc(firestore, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const userData = {
          ...data,
          // Convert Firestore timestamps to JavaScript Date objects
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : new Date(),
        } as UserProfile;
        setUserProfile(userData);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    }
  };
  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Check if the user has a Firestore profile
          const userRef = doc(firestore, "users", currentUser.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            console.warn(
              "Authenticated user doesn't have a Firestore profile. Logging out."
            );
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
          } else {
            // User has a valid Firestore profile
            setUser(currentUser);
            await fetchUserProfile(currentUser.uid);
          }
        } catch (error) {
          console.error("Error verifying user Firestore profile:", error);
          setUser(currentUser); // Still set the user even if fetching profile fails
          setUserProfile(null);
        }
      } else {
        // No user is authenticated
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);  // Sign in function
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      console.log("Attempting to sign in with email:", email);
      
      // First authenticate with Firebase Auth
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase Auth successful, checking Firestore profile");

      // Then verify if the user exists in Firestore
      const userRef = doc(firestore, "users", result.user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.warn("User authenticated but has no Firestore profile");
        // If the user doesn't exist in Firestore, sign them out and throw an error
        await signOut(auth);
        throw new Error(
          "User account not found in our database. Please register an account first."
        );
      }

      console.log("User exists in Firestore, fetching ID token");

      try {
        // Get the ID token from Firebase
        const idToken = await result.user.getIdToken();
        console.log("ID token obtained, creating session");

        // Send the ID token to the backend to create a session cookie
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          console.error("Session API error:", await response.text());
          // We'll continue even if session creation fails
          // The user will still be authenticated with Firebase
        }
      } catch (sessionError) {
        console.error("Session creation error:", sessionError);
        // We'll continue even if session creation fails
        // The user will still be authenticated with Firebase
      }

      await fetchUserProfile(result.user.uid);
      return result.user;
    } catch (error) {
      console.error("Sign in error:", error);
      
      // Check if this is specifically an invalid credential error
      if (error && typeof error === 'object' && 'code' in error && 
          (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')) {
        console.warn("Invalid credentials or user not found");
      }
      
      // Re-throw with formatted error message
      throw new Error(formatAuthError(error));
    }
  };
  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<void> => {
    let createdUser = null;
    try {
      // Step 1: Create user in Firebase Authentication
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      createdUser = result.user;

      // Step 2: Update profile with display name
      await updateProfile(result.user, { displayName }); // Step 3: Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || email,
        displayName,
        balance: 5000, // Default starting balance
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only add photoURL if it exists to avoid undefined values
      if (result.user.photoURL) {
        userProfile.photoURL = result.user.photoURL;
      }

      await setDoc(doc(firestore, "users", result.user.uid), {
        ...userProfile,
        createdAt: Timestamp.fromDate(userProfile.createdAt),
        updatedAt: Timestamp.fromDate(userProfile.updatedAt),
      });

      setUserProfile(userProfile);

      // Step 4: Get the ID token and create a session
      const idToken = await result.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch (error) {
      console.error("Sign up error:", error);

      // Clean up: If Firebase Auth account was created but Firestore failed,
      // delete the auth account to maintain consistency
      if (createdUser) {
        try {
          await createdUser.delete();
        } catch (deleteError) {
          console.error(
            "Error cleaning up partial user registration:",
            deleteError
          );
        }
      }

      throw new Error(formatAuthError(error));
    }
  }; // Logout function
  const logout = async (): Promise<void> => {
    try {
      // First clear the session cookie by calling the logout API
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are included
      });

      // Then sign out from Firebase Authentication
      await signOut(auth);

      // Clear all local state
      setUserProfile(null);
      setUser(null);

      // Clear any local storage items that might contain auth state
      if (typeof window !== "undefined") {
        // Clear potentially cached auth data
        localStorage.removeItem("firebase:authUser");
        localStorage.removeItem("firebase:session");
        localStorage.removeItem("userProfile");

        // Remove any application-specific state
        localStorage.removeItem("cart");
        localStorage.removeItem("savedItems");
        localStorage.removeItem("userBalance");
      }

      // Force a full page reload to clear any cached authentication states
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error(formatAuthError(error));
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset password error:", error);
      throw new Error(formatAuthError(error));
    }
  };

  // Update user profile function
  const updateUserProfile = async (
    data: Partial<UserProfile>
  ): Promise<void> => {
    if (!user || !userProfile) throw new Error("No authenticated user");

    try {
      // Update displayName in Firebase Auth if provided
      if (data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }

      // Update photoURL in Firebase Auth if provided
      if (data.photoURL) {
        await updateProfile(user, { photoURL: data.photoURL });
      }

      // Update profile in Firestore
      const userRef = doc(firestore, "users", user.uid);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(userRef, updateData);

      // Update local state
      setUserProfile({
        ...userProfile,
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw new Error(formatAuthError(error));
    }
  };

  // Auth context value
  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

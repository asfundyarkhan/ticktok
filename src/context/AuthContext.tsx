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
  sendEmailVerification,
} from "firebase/auth";
import { FirebaseError } from 'firebase/app';
import { auth, firestore } from "../lib/firebase/firebase";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { UserService } from "../services/userService";
import { ActivityService } from "../services/activityService";

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
  referralCode?: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define Auth Context Type
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;  signUp: (
    email: string,
    password: string,
    displayName: string,
    referralCode: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to format authentication errors
const formatAuthError = (error: FirebaseError | Error): string => {
  // Try to cast to FirebaseError if it matches the pattern
  const firebaseError = error as FirebaseError;
  const errorCode = firebaseError.code || "";

  // Custom error messages based on Firebase Auth error codes
  switch (errorCode) {
    case "auth/user-not-found":
      return "No account exists with this email. Please register first.";    case "auth/email-already-in-use":
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
    case "auth/account-suspended":
      return "Your account has been suspended. Please contact support for assistance.";
    case "auth/email-not-verified":
      return "Please verify your email address before signing in. Check your inbox for a verification link.";
    default:
      return error.message || "An unknown error occurred";
  }
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);  // Fetch user profile from Firestore
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
        
        // Ensure admin/superadmin accounts have sufficient balance
        if (userData.role === "admin" || userData.role === "superadmin") {
          try {
            await UserService.ensureAdminBalance(uid);
            // Refresh user data to get updated balance
            const updatedUserSnap = await getDoc(userRef);
            if (updatedUserSnap.exists()) {
              const updatedData = updatedUserSnap.data();
              userData.balance = updatedData.balance || userData.balance;
            }
          } catch (adminBalanceError) {
            console.error("Error ensuring admin balance:", adminBalanceError);
            // Continue with existing balance if update fails
          }
        }
        
        setUserProfile(userData);
      } else {
        setUserProfile(null);
      }
    } catch (error: unknown) {
      console.error("Error fetching user profile:", error);
      if (error instanceof FirebaseError || error instanceof Error) {
        throw new Error(formatAuthError(error));
      }
      throw new Error("An unknown error occurred while fetching user profile");
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
            console.warn("Authenticated user doesn't have a Firestore profile. Logging out.");
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
          } else {
            // Check if user is suspended
            const userData = userDoc.data();
            if (userData?.suspended) {
              console.warn("Suspended user detected during auth state change");
              // Sign out and clean up
              await signOut(auth);
              // Clear any session cookies
              await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
              });
              setUser(null);
              setUserProfile(null);
              throw new FirebaseError(
                "auth/account-suspended",
                "Your account has been suspended. Please contact support for assistance."
              );
              return;
            }
            
            // Check email verification unless user is admin/superadmin
            if (!currentUser.emailVerified && 
                (!userData?.role || (userData.role !== "admin" && userData.role !== "superadmin"))) {
              console.warn("Unverified user detected during auth state change");
              await signOut(auth);
              await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
              });
              setUser(null);
              setUserProfile(null);
              throw new Error("Please verify your email address before signing in. Check your inbox for a verification link.");
              return;
            }

            // User has a valid Firestore profile and is not suspended
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
  }, []);

  // Helper function to retry Firebase operations with exponential backoff
  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Only retry on network errors
        const errorCode = (error as FirebaseError)?.code;
        const errorMessage = (error as Error)?.message;
        if (errorCode === 'auth/network-request-failed' || 
            errorCode === 'auth/timeout' ||
            errorMessage?.includes('network') ||
            errorMessage?.includes('Network')) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`Network error detected, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  };

  // Sign in function  
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      console.log("Attempting to sign in with email:", email);
      
      // First authenticate with Firebase Auth with retry logic
      const result = await retryOperation(async () => {
        return await signInWithEmailAndPassword(auth, email, password);
      });
      
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

      // Check if user is suspended
      const userData = userDoc.data();
      if (userData?.suspended) {
        console.warn("Suspended user attempted to log in");
        // Sign out and clean up
        await signOut(auth);
        // Clear any session cookies
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        // Clear local state
        setUser(null);
        setUserProfile(null);
        // Create a custom error that matches FirebaseError structure
        const customError = new FirebaseError(
          "auth/account-suspended",
          "Your account has been suspended. Please contact support for assistance."
        );
        throw customError;
      }      // Check if email is verified
      if (!result.user.emailVerified && userData?.role !== "admin" && userData?.role !== "superadmin") {
        console.warn("Unverified user attempted to log in");
        await signOut(auth);
        const customError = new FirebaseError(
          "auth/email-not-verified",
          "Please verify your email address before signing in. Check your inbox for a verification link."
        );
        throw customError;
      }

      console.log("User exists in Firestore and is active, fetching ID token");

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
    } catch (error: unknown) {
      console.error("Sign in error:", error);
      
      // Handle Firebase and other errors
      if (error instanceof FirebaseError || error instanceof Error) {
        throw new Error(formatAuthError(error));
      }
      throw new Error("An unknown error occurred");
    }
  };  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    referralCode: string
  ): Promise<void> => {
    let createdUser = null;
    try {
      // Step 1: Create user in Firebase Authentication with retry logic
      const result = await retryOperation(async () => {
        return await createUserWithEmailAndPassword(auth, email, password);
      });
      createdUser = result.user;
      
      // Step 2: Update profile with display name with retry logic
      await retryOperation(async () => {
        return await updateProfile(result.user, { displayName });
      });
      
      // Step 3: Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || email,
        displayName,
        balance: 0,
        role: "seller",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Validate referral code and get admin ID
      console.log("Auth Context: Validating referral code", referralCode);
      const validation = await UserService.validateReferralCode(referralCode);
      console.log("Auth Context: Validation result", validation);
      
      if (validation.isValid && validation.adminUid) {
        userProfile.referredBy = validation.adminUid;
        userProfile.referralCode = referralCode;
      } else {
        console.warn("Failed referral code validation during account creation", referralCode);
        throw new Error("Invalid referral code. Registration cannot proceed.");
      }

      // Only add photoURL if it exists
      if (result.user.photoURL) {
        userProfile.photoURL = result.user.photoURL;
      }

      // First create Firestore profile
      await setDoc(doc(firestore, "users", result.user.uid), {
        ...userProfile,
        createdAt: Timestamp.fromDate(userProfile.createdAt),
        updatedAt: Timestamp.fromDate(userProfile.updatedAt),
      });

      setUserProfile(userProfile);

      // Then create activity record after profile is created
      await ActivityService.createActivity({
        userId: result.user.uid,
        userDisplayName: displayName,
        type: "seller_account_created",
        details: {
          referralCode
        },
        status: "completed"
      });

      // Send verification email
      try {
        console.log("Sending verification email to user");
        await sendEmailVerification(result.user);
        console.log("Verification email sent successfully");
      } catch (verificationError) {
        console.error("Error sending verification email:", verificationError);
        // Continue with the signup process even if sending verification email fails
      }

      // Finally, get the ID token and create a session
      const idToken = await result.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

    } catch (error: unknown) {
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

      if (error instanceof FirebaseError || error instanceof Error) {
        throw new Error(formatAuthError(error));
      }
      throw new Error("An unknown error occurred during sign up");
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
    } catch (error: unknown) {
      console.error("Logout error:", error);
      if (error instanceof FirebaseError || error instanceof Error) {
        throw new Error(formatAuthError(error));
      }
      throw new Error("An unknown error occurred during logout");
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      console.error("Reset password error:", error);
      if (error instanceof FirebaseError || error instanceof Error) {
        throw new Error(formatAuthError(error));
      }
      throw new Error("An unknown error occurred during password reset");
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
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      if (error instanceof FirebaseError || error instanceof Error) {
        throw new Error(formatAuthError(error));
      }
      throw new Error("An unknown error occurred while updating profile");
    }
  };

  // Refresh user profile function - manually re-fetch user profile from Firestore
  const refreshUserProfile = async (): Promise<void> => {
    if (!user) throw new Error("No authenticated user");

    try {
      console.log("Refreshing user profile for:", user.uid);
      await fetchUserProfile(user.uid);
      console.log("User profile refreshed successfully");
    } catch (error: unknown) {
      console.error("Error refreshing user profile:", error);
      if (error instanceof FirebaseError || error instanceof Error) {
        throw new Error(formatAuthError(error));
      }
      throw new Error("An unknown error occurred while refreshing profile");
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
    refreshUserProfile,
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

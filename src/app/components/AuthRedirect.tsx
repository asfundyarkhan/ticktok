"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "./Loading";

/**
 * Component to redirect authenticated users away from auth pages
 * to role-appropriate destinations
 */
export default function AuthRedirect({
  redirectTo = "",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  useEffect(() => {
    // Only run after auth state is determined
    if (loading || !user || !userProfile) {
      return; // Don't redirect if still loading or not authenticated
    }

    if (
      user.emailVerified ||
      userProfile.role === "admin" ||
      userProfile.role === "superadmin"
    ) {
      // Determine target path based on role if no specific redirect provided
      let targetPath = redirectTo;
      if (!redirectTo) {
        switch (userProfile.role) {
          case "superadmin":
            targetPath = "/dashboard"; // Always redirect superadmins to dashboard
            break;
          case "admin":
            // Force admin redirect to admin dashboard in both dev and production
            targetPath = "/dashboard/admin";
            break;
          case "seller":
            targetPath = "/store";
            break;
          default:
            targetPath = "/store"; // Regular users go to store
        }
      }

      // Use replace to avoid having the auth page in history
      console.log(
        `Redirecting authenticated ${userProfile.role} to ${targetPath}`
      );
      // Force immediate redirect to prevent any execution delay
      window.location.href = targetPath;
      return;
    } else {
      // User needs to verify email
      console.log("Redirecting to email verification page");
      window.location.href = "/verify-email";
    }
  }, [user, userProfile, loading, router, redirectTo]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, render nothing (allow the child components to render)
  return null;
}

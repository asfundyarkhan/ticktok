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
    // Only redirect after auth state is determined
    if (!loading && user && userProfile) {
      let targetPath = redirectTo; // If no specific redirect provided, use role-based redirect
      
      if (!redirectTo) {
        switch (userProfile.role) {
          case "superadmin":
            // Always redirect superadmins to dashboard, never to store
            targetPath = "/dashboard"; 
            break;
          case "admin":
            targetPath = "/dashboard/admin";
            break;
          case "seller":
            // Redirect sellers to store page instead of dashboard
            targetPath = "/store";
            break;
          default:
            targetPath = "/store";
        }
      }

      // Check if email verification is required
      if (!user.emailVerified && userProfile.role !== "admin") {
        // Admin users bypass email verification requirement
        router.replace("/verify-email");
      } else {
        router.replace(targetPath);
      }
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

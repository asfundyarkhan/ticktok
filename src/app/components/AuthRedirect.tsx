"use client";

import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "./Loading";

/**
 * Component to redirect authenticated users away from auth pages
 * to role-appropriate destinations
 * 
 * This version doesn't use useEffect to avoid infinite loading issues
 * and simply renders a redirect button when appropriate
 */
export default function AuthRedirect({
  redirectTo = "",
}: {
  redirectTo?: string;
}) {
  // No longer using router as we're using direct navigation
  const { user, userProfile, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If we have a user & profile, try to redirect
  if (user && userProfile) {
    if (user.emailVerified || userProfile.role === "admin" || userProfile.role === "superadmin") {
      // Try to get any stored redirect URL first
      const storedRedirect = typeof window !== 'undefined' ? localStorage.getItem('auth_redirect') : null;
      
      // Clear stored redirect immediately to prevent future redirects
      if (storedRedirect && typeof window !== 'undefined') {
        localStorage.removeItem('auth_redirect');
      }
      
      // Determine target path based on priority
      let targetPath = redirectTo || storedRedirect;
      
      if (!targetPath) {
        // If no explicit redirect, use role-based defaults
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

      console.log(`Auth state determined. Role: ${userProfile.role}, Target: ${targetPath}`);
      
      // Perform the redirect immediately without useEffect
      // This avoids timing issues that could cause infinite loads
      if (typeof window !== 'undefined') {
        window.location.href = targetPath;
        
        // Render a loading indicator while redirecting
        return (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-50">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-700">Redirecting to your dashboard...</p>
          </div>
        );
      }
    } else if (typeof window !== 'undefined') {
      // User needs to verify email
      console.log("User needs to verify email");
      window.location.href = "/verify-email";
      
      // Render a loading indicator while redirecting
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-50">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-700">Please verify your email...</p>
        </div>
      );
    }
  }

  // If not authenticated, render nothing (allow the child components to render)
  return null;
}

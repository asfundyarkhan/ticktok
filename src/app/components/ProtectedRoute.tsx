"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner } from "./Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"user" | "seller" | "admin" | "superadmin">;
}

export function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    // Only run this effect after authentication check is complete    if (loading) return;    // Check if user is authenticated
    if (!user) {      // Use direct navigation to avoid history issues after logout
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      return;
    }    // Check if user has required role (if roles were specified)
    if (
      allowedRoles.length > 0 &&
      userProfile?.role &&
      !allowedRoles.includes(userProfile.role)
    ) {      // Redirect based on role using direct navigation
      if (userProfile.role === "superadmin") {
        window.location.href = "/dashboard"; // Superadmins go to main dashboard
      } else if (userProfile.role === "admin") {
        window.location.href = "/dashboard/admin"; // Admin's default page
      } else if (userProfile.role === "seller") {
        window.location.href = "/profile"; // Sellers go to profile
      } else {
        // Regular users go to store page
        window.location.href = "/store";
      }
      return;
    }
  }, [user, userProfile, pathname, router, allowedRoles, loading]);
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, also show loading while redirecting
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}

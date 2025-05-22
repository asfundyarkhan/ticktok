"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner } from "./Loading";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  useEffect(() => {
    // Only run this effect after authentication check is complete
    if (loading) return;

    // Check if user is authenticated
    if (!user) {
      // Use direct navigation for more reliable redirects in production
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      return;
    } // Check if user has admin or superadmin role
    if (
      !userProfile ||
      (userProfile.role !== "admin" && userProfile.role !== "superadmin")
    ) {
      // Use direct navigation for more reliable redirects in production
      window.location.href = "/store"; // Redirect non-admin/non-superadmin users to store page
      return;
    }
  }, [user, userProfile, pathname, router, loading]);

  // Show loading state while checking authentication
  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  // If we reach here, the user is authenticated and has admin or superadmin role
  return <>{children}</>;
}

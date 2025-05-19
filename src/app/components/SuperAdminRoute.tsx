"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner } from "./Loading";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    // Only run this effect after authentication check is complete
    if (loading) return;

    // Check if user is authenticated
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check if user has superadmin role
    if (!userProfile || userProfile.role !== "superadmin") {
      // Redirect non-superadmins to dashboard or store
      if (userProfile?.role === "admin") {
        router.replace("/dashboard"); // Regular admins go to main dashboard
      } else {
        router.replace("/store"); // Others go to store
      }
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

  // If we reach here, the user is authenticated and has superadmin role
  return <>{children}</>;
}

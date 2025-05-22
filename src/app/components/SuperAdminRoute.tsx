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
  const { user, userProfile, loading } = useAuth();  useEffect(() => {
    // Only run this effect after authentication check is complete
    if (loading) {
      console.log('SuperAdminRoute: Auth state loading, waiting...');
      return;
    }

    // Log path for debugging
    console.log(`SuperAdminRoute: Checking access to ${pathname}`);
    
    // Store the current path name to debug issues
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_superadmin_route_path', pathname);
    }

    // Check if user is authenticated
    if (!user) {
      console.log('SuperAdminRoute: No authenticated user, redirecting to login');
      // Add a small delay to avoid redirect race conditions
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      }, 100);
      return;
    } 
    
    // Check if user has superadmin role
    if (!userProfile) {
      console.log('SuperAdminRoute: No user profile available yet, waiting...');
      // Wait for profile to load instead of immediately redirecting
      return;
    }      if (userProfile.role !== "superadmin") {
      console.log(`SuperAdminRoute: User is ${userProfile.role}, not superadmin, redirecting`);
      // Redirect non-superadmins to appropriate locations
      setTimeout(() => {
        if (userProfile.role === "admin") {
          // Admin users get redirected to their main dashboard instead of back to admin page
          window.location.href = "/dashboard";
        } else {
          // Others go to store
          window.location.href = "/store";
        }
      }, 100);
      return;
    }
    
    // Store role in localStorage for quick access
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', userProfile.role);
    }
    
    console.log(`SuperAdminRoute: User is superadmin, access granted to ${pathname}`);
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

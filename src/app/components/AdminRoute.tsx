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
    if (loading) {
      console.log('AdminRoute: Auth state loading, waiting...');
      return;
    }

    // Log path for debugging
    console.log(`AdminRoute: Checking access to ${pathname}`);
    
    // Store the current path name to debug issues
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_admin_route_path', pathname);
    }

    // Check if user is authenticated
    if (!user) {
      console.log('AdminRoute: No authenticated user, redirecting to login');
      // Add a small delay to avoid redirect race conditions
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      }, 100);
      return;
    } 
    
    // Check if user has admin or superadmin role
    if (!userProfile) {
      console.log('AdminRoute: No user profile available yet, waiting...');
      // Wait for profile to load instead of immediately redirecting
      return;
    }
    
    if (userProfile.role !== "admin" && userProfile.role !== "superadmin") {
      console.log('AdminRoute: User is not admin or superadmin, redirecting to store');
      // Add a small delay to avoid redirect race conditions
      setTimeout(() => {
        window.location.href = "/store"; // Redirect non-admin/non-superadmin users to store page
      }, 100);
      return;
    }
    
    // Store role in localStorage for quick access
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', userProfile.role);
    }
    
    console.log(`AdminRoute: User is ${userProfile.role}, access granted to ${pathname}`);
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

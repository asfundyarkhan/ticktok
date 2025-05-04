"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Mock authentication state - replace with your actual auth logic
  const isAuthenticated = true; // This should come from your auth context/store
  const userRole = "admin"; // This should come from your auth context/store

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      router.push("/dashboard"); // Redirect to dashboard if user doesn't have required role
      return;
    }
  }, [isAuthenticated, userRole, pathname, router, allowedRoles]);

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status from localStorage
    const checkAuth = () => {
      // In a real application, you would validate the token
      // and possibly make an API call to verify the session
      const token = localStorage.getItem("userToken");
      const role = localStorage.getItem("userRole");

      setIsAuthenticated(!!token);
      setUserRole(role);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Only run this effect after authentication check is complete
    if (isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check if user has required role
    if (
      allowedRoles.length > 0 &&
      userRole &&
      !allowedRoles.includes(userRole)
    ) {
      // Redirect based on role
      if (userRole === "seller") {
        router.push("/dashboard/profile"); // Seller's default page
      } else if (userRole === "admin") {
        router.push("/dashboard/admin"); // Admin's default page
      } else {
        router.push("/store"); // Regular user's default page
      }
      return;
    }
  }, [isAuthenticated, userRole, pathname, router, allowedRoles, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // If not authenticated, also show loading while redirecting
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

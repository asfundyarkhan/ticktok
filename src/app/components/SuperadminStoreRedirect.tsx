"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

/**
 * Component to redirect superadmins away from store pages to dashboard
 */
export default function SuperadminStoreRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile, loading } = useAuth();
  
  useEffect(() => {
    // Only run after auth state is determined and for superadmins
    if (loading || !userProfile || userProfile.role !== "superadmin") {
      return;
    }

    // Define store-related paths that should redirect
    const storeRelatedPaths = [
      "/store",
      "/products",
      "/cart",
      "/checkout",
      "/wallet"
    ];
    
    // Check if current path starts with any store-related path
    const isStorePath = storeRelatedPaths.some(path => 
      pathname.startsWith(path)
    );
    
    // Redirect superadmins to dashboard if they try to access store pages
    if (isStorePath) {
      console.log("Superadmin attempted to access store page. Redirecting to dashboard.");
      router.replace("/dashboard");
    }
  }, [pathname, userProfile, loading, router]);

  // This component doesn't render anything
  return null;
}

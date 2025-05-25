"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "./Loading";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "primary" | "secondary" | "text";
  className?: string;
  redirectTo?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({
  variant = "primary",
  className = "",
  redirectTo = "/login",
  children,
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const variantStyles = {
    primary: "bg-pink-600 text-white hover:bg-pink-700",
    secondary: "bg-white border border-pink-600 text-pink-600 hover:bg-pink-50",
    text: "text-pink-600 hover:text-pink-700 hover:underline",
  };

  const baseStyles = {
    primary:
      "py-2 px-4 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500",
    secondary:
      "py-2 px-4 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500",
    text: "font-medium",
  };
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // The logout function handles the redirect and state clearing
      await logout();
      // If we're still here (redirect didn't happen), force a redirect to the login page
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${baseStyles[variant]} ${variantStyles[variant]} ${
        isLoggingOut ? "opacity-70 cursor-not-allowed" : ""
      } ${className}`}
    >
      {isLoggingOut ? (
        <span className="flex items-center justify-center">
          <span className="mr-2">
            <LoadingSpinner size="sm" />
          </span>
          Logging out...
        </span>
      ) : children ? (
        children
      ) : (
        <span className="flex items-center justify-center">
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </span>
      )}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "./Loading";
import Link from "next/link";
import { InfoIcon } from "lucide-react";

interface EmailVerificationCheckProps {
  children: React.ReactNode;
  enforceVerification?: boolean; // If true, redirects to verify-email. If false, shows warning but allows content
}

export default function EmailVerificationCheck({
  children,
  enforceVerification = false,
}: EmailVerificationCheckProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      setIsCheckingVerification(true);

      // Wait for auth to complete
      if (loading) return;

      // If no user, allow to continue (login/register should handle this)
      if (!user) {
        setIsVerified(null);
        setIsCheckingVerification(false);
        return;
      }

      // Refresh auth token to get latest verification status
      try {
        await user.reload();
        setIsVerified(user.emailVerified);

        // If enforcement is on and email is not verified, redirect
        if (enforceVerification && !user.emailVerified) {
          router.push("/verify-email");
        }
      } catch (error) {
        console.error("Error checking email verification:", error);
        setIsVerified(false);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkVerification();
  }, [user, loading, router, enforceVerification]);

  if (loading || isCheckingVerification) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // If verified or not enforcing verification, show the children
  if (isVerified || isVerified === null || !enforceVerification) {
    return (
      <>
        {/* Show warning banner if not enforcing but still unverified */}
        {user && !isVerified && !enforceVerification && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <InfoIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  Your email is not verified. Some features may be limited.{" "}
                  <Link
                    href="/verify-email"
                    className="font-medium text-amber-700 underline hover:text-amber-600"
                  >
                    Verify now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  // If enforcing verification and email isn't verified, show message
  // (this usually won't render as we redirect in the useEffect)
  return (
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Email Verification Required
      </h2>
      <p className="text-gray-600 mb-4">
        Please verify your email address before accessing this content.
      </p>
      <Link
        href="/verify-email"
        className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
      >
        Verify Email
      </Link>
    </div>
  );
}

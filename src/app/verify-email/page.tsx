"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendEmailVerification, applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "../components/Loading";
import Link from "next/link";

// Wrapper component to handle searchParams with Suspense
function VerifyEmailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "verified" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if this is an email verification action
  const mode = searchParams.get("mode");
  const actionCode = searchParams.get("oobCode");

  useEffect(() => {
    // If we have an action code and mode is verifyEmail, apply the action code
    if (actionCode && mode === "verifyEmail") {
      const verifyEmail = async () => {
        try {
          await applyActionCode(auth, actionCode);
          setStatus("verified");
        } catch (error: any) {
          console.error("Error verifying email:", error);
          setStatus("error");
          setErrorMessage(error.message || "Failed to verify email");
        }
      };

      verifyEmail();
    }
  }, [actionCode, mode]);

  // Send verification email
  const handleSendVerification = async () => {
    if (!user) {
      setStatus("error");
      setErrorMessage("You need to be logged in to verify your email");
      return;
    }

    try {
      setStatus("sending");
      console.log("Sending verification email to:", user.email);
      await sendEmailVerification(user);
      console.log("Verification email sent successfully");
      setStatus("sent");
      
      // Show success message
      setErrorMessage(
        `Verification email sent to ${user.email}. If you don't see it in your inbox, please check your spam folder.`
      );
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      setStatus("error");
      
      // More detailed error messages
      if (error.message && error.message.includes("too-many-requests")) {
        setErrorMessage(
          "You've requested too many verification emails. Please wait a while before trying again."
        );
      } else {
        setErrorMessage(
          `Error sending verification email: ${error.message || "Unknown error"}. Please try again later.`
        );
      }
    }
  };

  if (status === "verified") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. You can now use all
              features of our platform.
            </p>
            <Link
              href="/store"
              className="inline-block px-6 py-2 bg-pink-600 text-white font-medium rounded-md hover:bg-pink-700"
            >
              Go to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "verifyEmail" && status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Verifying Your Email
            </h2>
            <p className="text-red-600 mb-6">
              {errorMessage ||
                "Failed to verify your email. The link may have expired."}
            </p>
            <Link
              href="/verify-email"
              className="inline-block px-6 py-2 bg-pink-600 text-white font-medium rounded-md hover:bg-pink-700"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "verifyEmail") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Verifying Your Email
            </h2>
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
            <p className="mt-4 text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Verify Your Email Address
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We need to verify your email address to keep your account secure
          </p>
        </div>

        {errorMessage && (
          <div className={`border px-4 py-3 rounded-md ${status === "sent" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {errorMessage}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-6">
            {user?.emailVerified
              ? "Your email is already verified. You have access to all features."
              : "Please click the button below to send a verification link to your email address."}
          </p>

          {!user?.emailVerified && (
            <button
              onClick={handleSendVerification}
              disabled={status === "sending"}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300"
            >
              {status === "sending" ? (
                <span className="flex items-center">
                  <span className="mr-2">
                    <LoadingSpinner size="sm" />
                  </span>{" "}
                  Sending...
                </span>
              ) : status === "sent" ? (
                "Sent! Check Your Email"
              ) : (
                "Send Verification Email"
              )}
            </button>
          )}
          
          {user?.emailVerified ? (
            <div className="mt-4 text-center">
              <Link
                href="/store"
                className="text-sm text-pink-600 hover:text-pink-500"
              >
                Continue to Store
              </Link>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Please verify your email before continuing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export default component with Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
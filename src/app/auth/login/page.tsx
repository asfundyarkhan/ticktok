"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "../../components/Loading";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

// Component to handle search params with Suspense
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Use our enhanced Firebase Auth hook
  const { signIn, loading, error: firebaseError } = useFirebaseAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signIn(email, password);
      router.push(redirect);    } catch (error: unknown) {
      console.error("Login error:", error);
      // Handle specific Firebase auth errors
      const firebaseError = error as { code?: string; message?: string };
      switch (firebaseError.code) {
        case "auth/user-not-found":
          setError("No user found with this email. Please register first.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password");
          break;
        case "auth/invalid-email":
          setError("Invalid email format");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later");
          break;        default:
          setError(firebaseError.message || "Failed to log in. Please try again");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/auth/register"
              className="font-medium text-pink-600 hover:text-pink-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {(error || firebaseError) && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error || firebaseError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-pink-600 hover:text-pink-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LoadingSpinner size="sm" />
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-pink-500 group-hover:text-pink-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
              Sign in{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

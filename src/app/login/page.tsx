"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import { useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/app/components/Loading";
import AuthRedirect from "@/app/components/AuthRedirect";

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

interface LoginFormValues {
  email: string;
  password: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn, userProfile } = useAuth();
  const redirectParam = searchParams.get("redirect");
  const handleLogin = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Additional validation
      if (!values.email || !values.email.includes('@')) {
        setErrorMessage("Please enter a valid email address");
        return;
      }

      if (!values.password || values.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters");
        return;
      }

      console.log("Attempting to sign in with Firebase");

      // Authenticate with Firebase and verify in Firestore
      await signIn(values.email, values.password);
      
      console.log("Sign in successful, handling redirect");

      // If there's a specific redirect URL in the params, use that
      if (redirectParam) {
        router.replace(redirectParam);
        return;
      }

      // Otherwise, redirect based on user role
      // The auth state will be processed by useEffect in AuthRedirect component
      // which will redirect users based on their role
      // No need to manually redirect here
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle specific error cases
      if (errorMessage.includes("invalid-credential") || errorMessage.includes("wrong password")) {
        setErrorMessage("Invalid email or password. Please check your credentials and try again.");
      } else if (errorMessage.includes("user-not-found") || errorMessage.includes("not found")) {
        setErrorMessage("No account exists with this email. Please create an account first.");
      } else if (errorMessage.includes("too-many-requests")) {
        setErrorMessage("Too many login attempts. Please try again later or reset your password.");
      } else if (errorMessage.includes("network")) {
        setErrorMessage("Network error. Please check your internet connection and try again.");
      } else {
        setErrorMessage(errorMessage || "Failed to login. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
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
              href="/register"
              className="font-medium text-pink-600 hover:text-pink-500"
            >
              create a new account
            </Link>
          </p>
        </div>{" "}
        {errorMessage && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
            role="alert"
          >
            <p>{errorMessage}</p>
            {errorMessage.includes("No account exists") && (
              <p className="mt-2">
                <Link
                  href="/register"
                  className="font-medium text-pink-600 hover:text-pink-500"
                >
                  Create an account
                </Link>
              </p>
            )}
          </div>
        )}
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({ errors, touched }) => (
            <Form className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      errors.email && touched.email
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm`}
                    placeholder="Enter your email"
                  />
                  {errors.email && touched.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

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
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-400"
                >
                  {" "}
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="mr-2">
                        <LoadingSpinner size="sm" />
                      </span>{" "}
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {" "}
      {/* Redirect authenticated users to their appropriate dashboard */}
      <AuthRedirect />
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/app/components/Loading";
import { FirebaseError } from 'firebase/app';

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
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const { user, userProfile, signIn, loading } = useAuth();
  const redirectParam = searchParams.get("redirect");

  // Direct redirect effect when auth state is ready
  useEffect(() => {
    // Skip if still loading auth state or no user/profile
    if (loading || !user || !userProfile || !redirectInProgress) {
      return;
    }

    console.log(`Auth state ready. User role: ${userProfile.role}`);
    
    // Get redirect target based on priority
    const storedRedirect = localStorage.getItem('auth_redirect');
    if (storedRedirect) {
      localStorage.removeItem('auth_redirect');
      console.log(`Redirecting to stored path: ${storedRedirect}`);
      window.location.href = storedRedirect;
      return;
    }
    
    // If no stored redirect, use role-based default
    let targetPath = '';
    switch (userProfile.role) {
      case "superadmin":
        targetPath = "/dashboard";
        break;
      case "admin":
        targetPath = "/dashboard/admin";
        break;
      case "seller":
        targetPath = "/profile";
        break;
      default:
        targetPath = "/store";
    }
    
    console.log(`Redirecting to role-based path: ${targetPath}`);
    window.location.href = targetPath;
  }, [user, userProfile, loading, redirectInProgress]);

  const handleLogin = async (values: LoginFormValues) => {
    // Prevent multiple submissions
    if (isLoading || redirectInProgress) return;
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      console.log("Attempting to sign in with Firebase");
      await signIn(values.email, values.password);
      
      // Store the redirect parameter for the redirection effect to use
      if (redirectParam) {
        localStorage.setItem('auth_redirect', redirectParam);
      }
      
      // Mark that authentication was successful to trigger the redirect effect
      setRedirectInProgress(true);
      // Keep loading state active until redirect happens
      
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      setRedirectInProgress(false);
      
      if (error instanceof FirebaseError) {
        setErrorMessage(error.message || "Login failed");
      } else if (error instanceof Error) {
        setErrorMessage(error.message || "An unexpected error occurred");
      } else {
        setErrorMessage("Login failed");
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
            <Link href="/register" className="font-medium text-pink-600 hover:text-pink-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert">
            <p>{errorMessage}</p>
          </div>
        )}
        
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter your email"
                  />
                  {errors.email && touched.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || isSubmitting || redirectInProgress}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-400"
                >
                  {isLoading || isSubmitting || redirectInProgress ? (
                    <span className="flex items-center">
                      <span className="mr-2">
                        <LoadingSpinner size="sm" />
                      </span>
                      {redirectInProgress ? "Redirecting..." : "Signing in..."}
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
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="lg" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

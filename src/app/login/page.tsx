"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const redirectTo = searchParams.get("redirect") || "/store";

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      // Here you would typically make an API call to authenticate
      console.log("Customer login values:", values);

      // Simulate authentication delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Set authentication in localStorage/cookies/state management
      // localStorage.setItem("userToken", "example-token");
      // localStorage.setItem("userRole", "customer");

      router.push(redirectTo);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerLogin = async () => {
    try {
      setIsLoading(true);
      // Here you would make an API call to authenticate as a seller
      console.log("Authenticating as seller");

      // Simulate authentication delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Set authentication data with seller role
      localStorage.setItem("userToken", "example-seller-token");
      localStorage.setItem("userRole", "seller");

      // Navigate to seller dashboard after authentication
      router.push("/profile");
    } catch (error) {
      console.error("Seller login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      setIsLoading(true);
      // Here you would make an API call to authenticate as an admin
      console.log("Authenticating as admin");

      // Simulate authentication delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Set authentication data with admin role
      localStorage.setItem("userToken", "example-admin-token");
      localStorage.setItem("userRole", "admin");

      // Navigate to admin dashboard after authentication
      router.push("/dashboard");
    } catch (error) {
      console.error("Admin login failed:", error);
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
        </div>

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
                    href="/forgot-password"
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
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 mb-4 disabled:bg-pink-400"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
                <button
                  type="button"
                  onClick={handleSellerLogin}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-pink-600 text-sm font-medium rounded-md text-pink-600 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:text-pink-400 disabled:border-pink-400 mb-4"
                >
                  {isLoading ? "Processing..." : "Login as Seller"}
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogin}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-pink-600 text-sm font-medium rounded-md text-pink-600 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:text-pink-400 disabled:border-pink-400"
                >
                  {isLoading ? "Processing..." : "Login as Admin"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import { useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/app/components/Loading";
import AuthRedirect from "@/app/components/AuthRedirect";
import { UserService } from "@/services/userService";

const registerSchema = Yup.object().shape({
  name: Yup.string().min(2, "Name is too short").required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  referralCode: Yup.string()
    .required('Referral code is required for registration'),
  terms: Yup.boolean().oneOf(
    [true],
    "You must accept the terms and conditions"
  ),
});

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
  terms: boolean;
}

function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const { signUp } = useAuth();
    
  // Function to validate referral code
  const validateReferralCode = async (code: string) => {
    if (!code) {
      setErrorMessage("Referral code is required for registration");
      setReferralCodeValid(false);
      return false;
    }
    
    setValidatingReferral(true);
    try {
      // Skip the format check - allow any format that admin users have created
      // This makes the system more flexible for different referral code formats
      console.log("Validating referral code:", code);
      
      const validation = await UserService.validateReferralCode(code);
      console.log("Validation result:", validation);
      
      if (!validation.isValid) {
        setErrorMessage("Invalid admin referral code. Please contact an administrator for a valid code.");
        setReferralCodeValid(false);
        return false;
      }
      
      setReferralCodeValid(validation.isValid);
      return validation.isValid;
    } catch (error) {
      console.error("Error validating referral code:", error);
      setErrorMessage("Error validating referral code. Please try again.");
      setReferralCodeValid(false);
      return false;
    } finally {
      setValidatingReferral(false);
    }
  };
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Validate the referral code
      console.log("Starting referral code validation");
      const isReferralValid = await validateReferralCode(values.referralCode);
      if (!isReferralValid) {
        setErrorMessage("Invalid referral code. Please enter a valid code from an admin user.");
        setIsLoading(false);
        return;
      }
      
      console.log("Referral code valid, proceeding with registration");
      // Register with Firebase Auth and create Firestore profile
      await signUp(values.email, values.password, values.name, values.referralCode);

      // Redirect to the email verification page after successful registration
      router.push("/verify-email");
    } catch (error) {
      console.error("Registration failed:", error);
      const errorObj = error as { code?: string; message?: string };
      const errorCode = errorObj.code || "";
      if (errorCode === "auth/email-already-in-use") {
        setErrorMessage(
          "An account with this email already exists. Please sign in instead."
        );
      } else {
        setErrorMessage(
          errorObj.message || "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back button */}
        <div className="flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-pink-600 hover:text-pink-500"
            >
              Sign in
            </Link>
          </p>
        </div>{" "}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{errorMessage}</p>
            {errorMessage.includes("already exists") && (
              <p className="mt-2">
                <Link
                  href="/login"
                  className="font-medium text-pink-600 hover:text-pink-500"
                >
                  Go to sign in page
                </Link>
              </p>
            )}
          </div>
        )}        <Formik
          initialValues={{
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            referralCode: "",
            terms: false,
          }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({ errors, touched }) => (
            <Form className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <Field
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      errors.name && touched.name
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && touched.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

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
                      autoComplete="new-password"
                      className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm`}
                      placeholder="Create a password"
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

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                        errors.confirmPassword && touched.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>                <div>
                  <label
                    htmlFor="referralCode"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Admin Referral Code <span className="text-red-500">*</span>
                  </label>                  <Field
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    autoComplete="off"
                    required
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      errors.referralCode && touched.referralCode
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm`}
                    placeholder="Enter admin referral code (required)"
                  />
                  {errors.referralCode && touched.referralCode && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.referralCode}
                    </p>
                  )}
                  {validatingReferral && (
                    <p className="mt-1 text-sm text-gray-500">
                      Validating referral code...
                    </p>
                  )}
                  {referralCodeValid === false && (
                    <p className="mt-1 text-sm text-red-500">
                      Invalid referral code. Please enter a valid code from an admin user.
                    </p>
                  )}
                  {referralCodeValid === true && (
                    <p className="mt-1 text-sm text-green-500">
                      Referral code valid!
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <Field
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-900"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-pink-600 hover:text-pink-500"
                  >
                    Terms and Conditions
                  </Link>
                </label>
              </div>
              {errors.terms && touched.terms && (
                <p className="mt-1 text-sm text-red-500">{errors.terms}</p>
              )}

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
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {/* Redirect authenticated users based on their role */}
      <AuthRedirect />
      <RegisterForm />
    </Suspense>
  );
}

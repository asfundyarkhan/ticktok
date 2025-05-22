"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SuperAdminRoute } from "../../components/SuperAdminRoute";
import { LoadingSpinner } from "../../components/Loading";
import { checkEmailVerificationConfig } from "@/utils/emailVerificationTest";
import { sendEmailVerification } from "firebase/auth";

function EmailVerificationDebugger() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const checkConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check the email verification configuration
      const configCheck = checkEmailVerificationConfig();
      setResult(configCheck);
      
    } catch (err) {
      console.error("Error checking configuration:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const testVerificationEmail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error("No user is currently logged in");
      }
      
      // Send a test verification email to the current user
      await sendEmailVerification(user);
      
      setResult({
        success: true,
        message: `Verification email sent to ${user.email}`
      });
      
    } catch (err) {
      console.error("Error sending test email:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Email Verification Debug Tool</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-medium mb-2">Current User Status</h2>
        {user ? (
          <div className="space-y-2">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Email verified:</strong> {user.emailVerified ? "Yes" : "No"}</p>
            <p><strong>User ID:</strong> {user.uid}</p>
            <p><strong>Role:</strong> {userProfile?.role}</p>
          </div>
        ) : (
          <p className="text-red-600">No user is currently logged in</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-3">Check Configuration</h2>
          <button
            onClick={checkConfiguration}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Checking..." : "Check Email Configuration"}
          </button>
        </div>
        
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-3">Test Verification Email</h2>
          <button
            onClick={testVerificationEmail}
            disabled={loading || !user}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300"
          >
            {loading ? "Sending..." : "Send Test Verification Email"}
          </button>
          {!user && (
            <p className="mt-2 text-sm text-red-500">You must be logged in to test verification emails</p>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {result && !error && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-600 mb-2">Result</h3>
          <pre className="bg-white p-3 rounded-md overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Troubleshooting Tips</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Make sure your Firebase project has email/password authentication enabled</li>
          <li>Check that your Firebase auth domain is properly configured</li>
          <li>Ensure that your project's email sending quota hasn't been exceeded</li>
          <li>Verify the email templates in the Firebase Console are properly set up</li>
          <li>Check your spam folder if verification emails are not appearing in your inbox</li>
        </ul>
      </div>
    </div>
  );
}

export default function EmailVerificationDebugPage() {
  return (
    <SuperAdminRoute>
      <EmailVerificationDebugger />
    </SuperAdminRoute>
  );
}

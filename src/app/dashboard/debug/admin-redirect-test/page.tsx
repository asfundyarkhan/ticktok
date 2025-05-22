"use client";

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";

/**
 * This page is used to test admin role redirections in production.
 * It will display the current user's role and redirection behavior.
 */
export default function AdminRedirectTest() {
  const { user, userProfile, loading } = useAuth();
  const [environment, setEnvironment] = useState<string>("unknown");
  const [isVercel, setIsVercel] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [redirectHistory, setRedirectHistory] = useState<string[]>([]);

  // Check environment on client side
  useEffect(() => {
    const isProduction = process.env.NODE_ENV === "production";
    setEnvironment(process.env.NODE_ENV || "unknown");
    setIsVercel(window.location.hostname.includes('vercel.app'));
    setCurrentPath(window.location.pathname);

    // Record this page visit in the history
    setRedirectHistory(prev => [...prev, window.location.pathname]);
  }, []);

  // Test manual redirection
  const testRedirectTo = (path: string) => {
    window.location.href = path;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Redirection Test</h1>
        <p>Loading authentication state...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Redirection Test</h1>
        <p className="mb-4 text-orange-500">You are not logged in. Please log in to test admin redirections.</p>
        <button 
          onClick={() => testRedirectTo('/login')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Login Page
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Redirection Test</h1>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Environment Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Environment: <span className="font-mono">{environment}</span></li>
          <li>Vercel Deployment: <span className="font-mono">{isVercel ? 'Yes' : 'No'}</span></li>
          <li>Current Path: <span className="font-mono">{currentPath}</span></li>
        </ul>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Email: <span className="font-mono">{user.email}</span></li>
          <li>Email Verified: <span className="font-mono">{user.emailVerified ? 'Yes' : 'No'}</span></li>
          <li>User Role: <span className="font-mono">{userProfile?.role || 'Unknown'}</span></li>
        </ul>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Admin Redirection</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => testRedirectTo('/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Dashboard
          </button>
          <button
            onClick={() => testRedirectTo('/dashboard/admin')}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
          >
            Test Admin Dashboard
          </button>
          <button
            onClick={() => testRedirectTo('/store')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Store
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Expected Behavior</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Admin users should be redirected to <span className="font-mono">/dashboard/admin</span> when logging in</li>
          <li>Superadmin users should be redirected to <span className="font-mono">/dashboard</span> when logging in</li>
          <li>Regular users should be redirected to <span className="font-mono">/store</span> when logging in</li>
        </ul>
      </div>
      
      {redirectHistory.length > 1 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Navigation History</h2>
          <ol className="list-decimal pl-5 space-y-1">
            {redirectHistory.map((path, index) => (
              <li key={index} className="font-mono">{path}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

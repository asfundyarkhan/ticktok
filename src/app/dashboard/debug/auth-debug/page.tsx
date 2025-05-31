"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthDebugPage() {
  const { user, userProfile, logout, loading } = useAuth();
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');
  const [authState, setAuthState] = useState<string>('checking');
  const [isVercelEnv, setIsVercelEnv] = useState<boolean>(false);
  const [authFlow, setAuthFlow] = useState<string[]>([]);

  useEffect(() => {
    // Update timestamp every second to show page is alive
    const interval = setInterval(() => {
      setCurrentTimestamp(new Date().toISOString());
    }, 1000);

    // Record page load in auth flow
    setAuthFlow(prev => [...prev, `Page loaded at ${new Date().toISOString()}`]);
    
    // Check if running on Vercel
    setIsVercelEnv(
      window.location.hostname.includes('vercel.app') || 
      process.env.NEXT_PUBLIC_APP_ENV === 'production'
    );

    return () => clearInterval(interval);
  }, []);

  // Update auth state when loading completes
  useEffect(() => {
    if (!loading) {
      if (user && userProfile) {
        setAuthState('authenticated');
        setAuthFlow(prev => [
          ...prev, 
          `Auth state loaded at ${new Date().toISOString()}`,
          `User authenticated: ${user.email} (${userProfile.role})`
        ]);
      } else {
        setAuthState('unauthenticated');
        setAuthFlow(prev => [
          ...prev, 
          `Auth state loaded at ${new Date().toISOString()}`,
          'User not authenticated'
        ]);
      }
    }
  }, [loading, user, userProfile]);

  const handleLogout = async () => {
    try {
      setAuthFlow(prev => [...prev, `Logout initiated at ${new Date().toISOString()}`]);
      await logout();
      setAuthFlow(prev => [...prev, `Logout completed at ${new Date().toISOString()}`]);
    } catch (error) {
      setAuthFlow(prev => [
        ...prev, 
        `Logout error at ${new Date().toISOString()}: ${error instanceof Error ? error.message : String(error)}`
      ]);
    }
  };

  const triggerRoleBasedRedirect = () => {
    setAuthFlow(prev => [...prev, `Manual redirect triggered at ${new Date().toISOString()}`]);
    
    if (!userProfile) {
      window.location.href = '/login';
      return;
    }
    
    // Similar logic to AuthRedirect component
    switch (userProfile.role) {
      case 'superadmin':
        window.location.href = '/dashboard';
        break;
      case 'admin':
        window.location.href = '/dashboard/admin';
        break;      case 'seller':
        window.location.href = '/profile';
        break;
      default:
        window.location.href = '/store';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="grid gap-6 mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Timestamp:</div>
            <div className="font-mono text-sm">{currentTimestamp}</div>
            
            <div className="font-medium">Environment:</div>
            <div className="font-mono text-sm">
              {process.env.NODE_ENV || 'Unknown'} 
              {isVercelEnv ? ' (Vercel)' : ''}
            </div>
            
            <div className="font-medium">Auth State:</div>
            <div className="font-mono text-sm">{authState}</div>
          </div>
        </div>
        
        {user && userProfile && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Email:</div>
              <div className="font-mono text-sm">{user.email}</div>
              
              <div className="font-medium">User ID:</div>
              <div className="font-mono text-sm">{user.uid}</div>
              
              <div className="font-medium">Email Verified:</div>
              <div className="font-mono text-sm">{user.emailVerified ? 'Yes' : 'No'}</div>
              
              <div className="font-medium">Role:</div>
              <div className="font-mono text-sm">{userProfile.role}</div>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
              
              <button
                onClick={triggerRoleBasedRedirect}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Test Role Redirect
              </button>
            </div>
          </div>
        )}
        
        {!user && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Not Authenticated</h2>
            <p>You are not currently logged in.</p>
            <Link 
              href="/login" 
              className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Go to Login
            </Link>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Auth Flow Log</h2>
          <div className="max-h-60 overflow-y-auto bg-gray-50 p-4 rounded">
            <ul className="list-none space-y-1">
              {authFlow.map((entry, index) => (
                <li key={index} className="font-mono text-sm">{entry}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Expected Redirect Behavior</h2>
          <ul className="list-disc ml-5 space-y-1">
            <li><span className="font-medium">Superadmin</span>: Redirected to <code>/dashboard</code></li>
            <li><span className="font-medium">Admin</span>: Redirected to <code>/dashboard/admin</code></li>
            <li><span className="font-medium">Seller</span>: Redirected to <code>/profile</code></li>
            <li><span className="font-medium">Regular User</span>: Redirected to <code>/store</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

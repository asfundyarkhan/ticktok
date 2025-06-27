'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/firebase';
import { onAuthStateChanged, signInAnonymously, signOut, User, AuthError, signInWithEmailAndPassword } from 'firebase/auth';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: string;
}

export default function FirebaseTestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  useEffect(() => {
    addLog('Setting up Firebase auth listener...', 'info');
    
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          addLog(`Auth state changed: ${user ? 'User signed in' : 'No user'}`, 'success');
          setUser(user);
          setLoading(false);
          setError(null);
        },
        (error) => {
          addLog(`Auth error: ${error.message}`, 'error');
          setError(error as AuthError);
          setLoading(false);
        }
      );

      return () => {
        addLog('Cleaning up auth listener...', 'info');
        unsubscribe();
      };
    } catch (error) {
      const authError = error as AuthError;
      addLog(`Auth setup error: ${authError.message}`, 'error');
      setError(authError);
      setLoading(false);
    }
  }, []);

  const handleSignInAnonymously = async () => {
    try {
      addLog('Attempting anonymous sign in...', 'info');
      await signInAnonymously(auth);
      addLog('Anonymous sign in successful!', 'success');
    } catch (error) {
      const authError = error as AuthError;
      addLog(`Sign in error: ${authError.message} (${authError.code})`, 'error');
      setError(authError);
    }
  };

  const handleSignOut = async () => {
    try {
      addLog('Attempting sign out...', 'info');
      await signOut(auth);
      addLog('Sign out successful!', 'success');
    } catch (error) {
      const authError = error as AuthError;
      addLog(`Sign out error: ${authError.message} (${authError.code})`, 'error');
      setError(authError);
    }
  };

  const handleTestSignInWithEmail = async () => {
    try {
      addLog('Testing sign-in with email (will fail - this is expected)...', 'info');
      await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword');
      addLog('Unexpected: Sign-in should have failed', 'error');
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
        addLog(`Expected auth error: ${authError.code}`, 'success');
      } else if (authError.code === 'auth/network-request-failed') {
        addLog(`Network error detected: ${authError.message}`, 'error');
        setError(authError);
      } else {
        addLog(`Unexpected error: ${authError.message} (${authError.code})`, 'error');
        setError(authError);
      }
    }
  };

  const handleTestSessionAPI = async () => {
    try {
      addLog('Testing session API endpoint...', 'info');
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'test-token' }),
      });
      
      if (response.ok) {
        addLog('Unexpected: Session API should have rejected invalid token', 'error');
      } else {
        const data = await response.json();
        addLog(`Session API working correctly: ${data.error}`, 'success');
      }
    } catch (error) {
      addLog(`Session API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleTestNetworkConnectivity = async () => {
    try {
      addLog('Testing network connectivity to Firebase domains...', 'info');
      
      // Test Firebase Auth domain
      const authResponse = await fetch(`https://${auth.config.authDomain}/.well-known/openid_configuration`, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (authResponse.ok) {
        addLog('✓ Firebase Auth domain accessible', 'success');
      } else {
        addLog(`✗ Firebase Auth domain error: ${authResponse.status}`, 'error');
      }
      
      // Test Firebase API endpoint
      const apiResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${auth.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test',
          returnSecureToken: true,
        }),
      });
      
      // This should fail with invalid credentials, not network error
      if (apiResponse.status === 400) {
        const data = await apiResponse.json();
        if (data.error && data.error.message) {
          addLog('✓ Firebase API accessible (got expected auth error)', 'success');
        } else {
          addLog('✗ Unexpected API response format', 'error');
        }
      } else {
        addLog(`✗ Unexpected API response status: ${apiResponse.status}`, 'error');
      }
      
    } catch (error) {
      addLog(`Network connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        addLog('This suggests a network connectivity or CORS issue', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Firebase Authentication Test
          </h1>
          
          {/* Status Section */}
          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Loading</h3>
                <p className={`text-lg font-bold ${loading ? 'text-yellow-600' : 'text-green-600'}`}>
                  {loading ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">User</h3>
                <p className={`text-lg font-bold ${user ? 'text-green-600' : 'text-gray-500'}`}>
                  {user ? 'Signed In' : 'Not Signed In'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Error</h3>
                <p className={`text-lg font-bold ${error ? 'text-red-600' : 'text-green-600'}`}>
                  {error ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-green-800 mb-4">User Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">UID:</span> {user.uid}</p>
                <p><span className="font-medium">Anonymous:</span> {user.isAnonymous ? 'Yes' : 'No'}</p>
                <p><span className="font-medium">Email:</span> {user.email || 'None'}</p>
                <p><span className="font-medium">Provider:</span> {user.providerData.length ? user.providerData[0].providerId : 'Anonymous'}</p>
              </div>
            </div>
          )}

          {/* Error Info */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-red-800 mb-4">Error Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Code:</span> {error.code}</p>
                <p><span className="font-medium">Message:</span> {error.message}</p>
                {error.code === 'auth/network-request-failed' && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h3 className="font-medium text-yellow-800 mb-2">Troubleshooting Network Error:</h3>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      <li>Check internet connectivity</li>
                      <li>Verify Firebase project configuration</li>
                      <li>Check firewall/proxy settings</li>
                      <li>Try refreshing the page</li>
                      <li>Check browser console for additional errors</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <button
              onClick={handleSignInAnonymously}
              disabled={loading || !!user}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Sign In Anonymously
            </button>
            <button
              onClick={handleSignOut}
              disabled={loading || !user}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Sign Out
            </button>
            <button
              onClick={handleTestSignInWithEmail}
              disabled={loading}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Test Email Sign-In
            </button>
            <button
              onClick={handleTestSessionAPI}
              disabled={loading}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Test Session API
            </button>
            <button
              onClick={handleTestNetworkConnectivity}
              disabled={loading}
              className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Test Network
            </button>
            <button
              onClick={() => setLogs([])}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              Clear Logs
            </button>
          </div>

          {/* Logs */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Event Logs</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 italic">No events logged yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      log.type === 'error'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : log.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    <span className="font-mono text-xs text-gray-500">[{log.timestamp}]</span>{' '}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

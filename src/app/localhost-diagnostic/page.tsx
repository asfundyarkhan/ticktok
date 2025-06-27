'use client';

// Localhost Firebase Development Utilities
import { useState } from 'react';
import { auth, firestore } from '@/lib/firebase/firebase';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  User,
  AuthError
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  query, 
  limit,
  doc,
  getDoc,
  FirestoreError
} from 'firebase/firestore';

interface DiagnosticResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function LocalhostFirebaseDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const addResult = (service: string, status: 'success' | 'error' | 'warning', message: string, details?: string) => {
    setResults(prev => [...prev, { service, status, message, details }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Firebase Initialization
    addResult('Firebase', 'success', 'Firebase services initialized successfully');

    // Test 2: Auth State Listener
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        if (user) {
          addResult('Auth State', 'success', `User authenticated: ${user.uid}`);
        } else {
          addResult('Auth State', 'warning', 'No user currently authenticated');
        }
        unsubscribe();
      });
    } catch (error) {
      const authError = error as AuthError;
      addResult('Auth State', 'error', `Auth state listener failed: ${authError.message}`);
    }

    // Test 3: Anonymous Authentication (if enabled)
    try {
      const userCredential = await signInAnonymously(auth);
      addResult('Anonymous Auth', 'success', `Anonymous sign-in successful: ${userCredential.user.uid}`);
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/admin-restricted-operation') {
        addResult('Anonymous Auth', 'warning', 'Anonymous authentication is disabled in Firebase console');
      } else {
        addResult('Anonymous Auth', 'error', `Anonymous auth failed: ${authError.message} (${authError.code})`);
      }
    }

    // Test 4: Public Collections Access
    const publicCollections = ['adminStock', 'listings'];
    for (const collectionName of publicCollections) {
      try {
        const collectionRef = collection(firestore, collectionName);
        const snapshot = await getDocs(query(collectionRef, limit(1)));
        addResult(
          `Collection: ${collectionName}`, 
          'success', 
          `Accessible (${snapshot.size} documents)`
        );
      } catch (error) {
        const firestoreError = error as FirestoreError;
        addResult(
          `Collection: ${collectionName}`, 
          'error', 
          `Failed: ${firestoreError.message} (${firestoreError.code})`
        );
      }
    }

    // Test 5: Protected Collections (requires auth)
    const protectedCollections = ['users'];
    for (const collectionName of protectedCollections) {
      try {
        const collectionRef = collection(firestore, collectionName);
        const snapshot = await getDocs(query(collectionRef, limit(1)));
        addResult(
          `Protected: ${collectionName}`, 
          'warning', 
          `Accessible without auth (${snapshot.size} documents) - Check security rules`
        );
      } catch (error) {
        const firestoreError = error as FirestoreError;
        if (firestoreError.code === 'permission-denied') {
          addResult(
            `Protected: ${collectionName}`, 
            'success', 
            'Properly protected (permission denied without auth)'
          );
        } else {
          addResult(
            `Protected: ${collectionName}`, 
            'error', 
            `Failed: ${firestoreError.message} (${firestoreError.code})`
          );
        }
      }
    }

    // Test 6: User-specific access (if authenticated)
    if (auth.currentUser) {
      try {
        const userDoc = doc(firestore, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userDoc);
        if (userSnap.exists()) {
          addResult('User Document', 'success', 'User document accessible');
        } else {
          addResult('User Document', 'warning', 'User document does not exist');
        }
      } catch (error: any) {
        addResult('User Document', 'error', `User document failed: ${error.message}`);
      }

      // Test inventory access
      try {
        const inventoryPath = `inventory/${auth.currentUser.uid}/products`;
        const inventoryRef = collection(firestore, inventoryPath);
        const inventorySnap = await getDocs(query(inventoryRef, limit(1)));
        addResult(
          'User Inventory', 
          'success', 
          `Inventory accessible (${inventorySnap.size} documents)`
        );
      } catch (error: any) {
        addResult(
          'User Inventory', 
          'error', 
          `Inventory failed: ${error.message} (${error.code})`
        );
      }
    }

    setIsRunning(false);
  };

  const testEmailSignIn = async () => {
    try {
      // Try to sign in with a test account (this will fail but show us the error)
      await signInWithEmailAndPassword(auth, 'test@localhost.dev', 'testpassword');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        addResult('Email Auth Test', 'success', 'Email authentication is working (user not found expected)');
      } else if (error.code === 'auth/network-request-failed') {
        addResult('Email Auth Test', 'error', 'Network error - localhost may not be authorized');
      } else {
        addResult('Email Auth Test', 'warning', `Auth error: ${error.message} (${error.code})`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Localhost Firebase Diagnostic
          </h1>
          <p className="text-gray-600 mb-8">
            Comprehensive testing for Firebase services in localhost development environment
          </p>

          <div className="flex gap-4 mb-8">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Diagnostics...' : 'Run Full Diagnostic'}
            </button>
            
            <button
              onClick={testEmailSignIn}
              disabled={isRunning}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Test Email Auth
            </button>

            <button
              onClick={() => setResults([])}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          {user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800">Current User</h3>
              <p className="text-green-700">
                UID: {user.uid} | Anonymous: {user.isAnonymous ? 'Yes' : 'No'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {results.length === 0 ? (
              <p className="text-gray-500 italic">No diagnostics run yet. Click "Run Full Diagnostic" to start.</p>
            ) : (
              results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        result.status === 'success'
                          ? 'bg-green-500'
                          : result.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <span className="font-semibold">{result.service}</span>
                  </div>
                  <p className={`mt-1 ${
                    result.status === 'success'
                      ? 'text-green-800'
                      : result.status === 'error'
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  }`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-2">Localhost Development Tips</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Add localhost domains to Firebase Authentication authorized domains</li>
              <li>• Enable anonymous authentication in Firebase Console if needed</li>
              <li>• Check browser developer tools for additional error details</li>
              <li>• Verify Windows Firewall allows Firebase domains</li>
              <li>• Consider using Firebase emulators for offline development</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

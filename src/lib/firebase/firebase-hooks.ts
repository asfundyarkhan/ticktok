// A hook for initializing Firebase safely in Next.js
// This ensures Firebase initializes only once on the client

import { useEffect, useState } from 'react';
import { app, auth } from './firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

export function useFirebaseAuth() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user: authUser, loading };
}

// Is Firebase initialized?
let initialized = false;

export function useFirebaseInit() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only initialize on the client side, and only once
    if (typeof window !== 'undefined' && !initialized) {
      initialized = true;
      setIsReady(true);
    }
  }, []);

  return { isReady, app };
}

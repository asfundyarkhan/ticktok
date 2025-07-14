"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { firestore } from "../../lib/firebase/firebase";
import { TransactionService } from "../../services/transactionService";

interface UserBalanceContextType {
  balance: number;
  setBalance: (newBalance: number) => void;
  addToBalance: (amount: number, description?: string) => Promise<{ success: boolean; message: string }>;
  deductFromBalance: (amount: number) => Promise<boolean>; // Returns false if insufficient funds
  loading: boolean;
}

const UserBalanceContext = createContext<UserBalanceContextType | undefined>(
  undefined
);

import { getFromLocalStorage, setToLocalStorage } from "../utils/localStorage";

// Safe localStorage helper functions
const getStoredBalance = (): number | null => {
  const savedBalance = getFromLocalStorage<string | null>("userBalance", null);
  return savedBalance ? parseFloat(savedBalance) : null;
};

const setStoredBalance = (balance: number): void => {
  setToLocalStorage("userBalance", balance.toString());
};

export function UserBalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0); // Default starting balance
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, userProfile } = useAuth?.() || {
    user: null,
    userProfile: null,
  };

  // Set isClient flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  // Load balance from Firestore when user is authenticated with real-time updates
  // Or from localStorage when not authenticated
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupBalanceListener = () => {
      setLoading(true);
      try {
        if (user && userProfile) {
          // Set up real-time listener for user's balance
          const userRef = doc(firestore, "users", user.uid);
          
          unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const userData = doc.data();
              const currentBalance = userData.balance || 0;
              setBalance(currentBalance);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error listening to balance updates:", error);
            setLoading(false);
          });
          
        } else if (isClient) {
          // User is not logged in, use localStorage balance
          const savedBalance = getStoredBalance();
          if (savedBalance !== null) {
            setBalance(savedBalance);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error setting up balance listener:", error);
        setLoading(false);
      }
    };

    setupBalanceListener();

    // Cleanup listener on unmount or user change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, userProfile, isClient]);
  // Save balance to localStorage when not authenticated
  // Use a ref to track previous balance to prevent unnecessary updates
  const prevBalanceRef = useRef(balance);
  useEffect(() => {
    if (isClient && !user && prevBalanceRef.current !== balance) {
      setStoredBalance(balance);
      prevBalanceRef.current = balance;
    }
  }, [balance, isClient, user]);
  const addToBalance = async (amount: number, description?: string) => {
    try {
      if (user) {
        // User is logged in, process through TransactionService
        const result = await TransactionService.processTopUp(
          user.uid, 
          amount,
          description || "Balance top-up"
        );

        if (result.success) {
          // TransactionService already updated the balance in Firestore
          // We just need to update our local state
          setBalance(prevBalance => prevBalance + amount);
        }
        return result;
      } else {
        // User is not logged in, update locally
        setBalance((prevBalance) => prevBalance + amount);
        return { success: true, message: "Balance updated locally" };
      }
    } catch (error) {
      console.error("Error adding to balance:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to process top-up" 
      };
    }
  };

  const deductFromBalance = async (amount: number) => {
    if (balance < amount) {
      return false; // Insufficient funds
    }

    try {
      if (user) {
        // User is logged in, update in Firestore
        const newBalance = balance - amount;
        const userRef = doc(firestore, "users", user.uid);
        await updateDoc(userRef, {
          balance: newBalance,
          updatedAt: new Date(),
        });
        setBalance(newBalance);
      } else {
        // User is not logged in, update locally
        setBalance((prevBalance) => prevBalance - amount);
      }
      return true; // Deduction successful
    } catch (error) {
      console.error("Error deducting from balance:", error);
      return false; // Deduction failed
    }
  };

  return (
    <UserBalanceContext.Provider
      value={{ balance, setBalance, addToBalance, deductFromBalance, loading }}
    >
      {children}
    </UserBalanceContext.Provider>
  );
}

export function useUserBalance() {
  const context = useContext(UserBalanceContext);
  if (context === undefined) {
    throw new Error("useUserBalance must be used within a UserBalanceProvider");
  }
  return context;
}

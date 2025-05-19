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
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../lib/firebase/firebase";

interface UserBalanceContextType {
  balance: number;
  setBalance: (newBalance: number) => void;
  addToBalance: (amount: number) => Promise<void>;
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
  const [balance, setBalance] = useState(5000); // Default starting balance
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

  // Load balance from Firestore when user is authenticated
  // Or from localStorage when not authenticated
  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      try {
        if (user && userProfile) {
          // User is logged in, use Firestore balance
          setBalance(userProfile.balance);
        } else if (isClient) {
          // User is not logged in, use localStorage balance
          const savedBalance = getStoredBalance();
          if (savedBalance !== null) {
            setBalance(savedBalance);
          }
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
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

  const addToBalance = async (amount: number) => {
    try {
      if (user) {
        // User is logged in, update in Firestore
        const newBalance = balance + amount;
        const userRef = doc(firestore, "users", user.uid);
        await updateDoc(userRef, {
          balance: newBalance,
          updatedAt: new Date(),
        });
        setBalance(newBalance);
      } else {
        // User is not logged in, update locally
        setBalance((prevBalance) => prevBalance + amount);
      }
    } catch (error) {
      console.error("Error adding to balance:", error);
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

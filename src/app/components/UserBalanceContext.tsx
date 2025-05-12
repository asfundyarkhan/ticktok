"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

interface UserBalanceContextType {
  balance: number;
  setBalance: (newBalance: number) => void;
  addToBalance: (amount: number) => void;
  deductFromBalance: (amount: number) => boolean; // Returns false if insufficient funds
}

const UserBalanceContext = createContext<UserBalanceContextType | undefined>(
  undefined
);

// Safe localStorage helper functions
const getStoredBalance = (): number | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedBalance = localStorage.getItem("userBalance");
    return savedBalance ? parseFloat(savedBalance) : null;
  } catch (error) {
    console.error("Error reading balance from localStorage:", error);
    return null;
  }
};

const setStoredBalance = (balance: number): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem("userBalance", balance.toString());
  } catch (error) {
    console.error("Error saving balance to localStorage:", error);
  }
};

export function UserBalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(5000); // Default starting balance
  const [isClient, setIsClient] = useState(false);

  // Set isClient flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load balance from localStorage on client-side only
  useEffect(() => {
    if (isClient) {
      const savedBalance = getStoredBalance();
      if (savedBalance !== null) {
        setBalance(savedBalance);
      }
    }
  }, [isClient]);

  // Save balance to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (isClient) {
      setStoredBalance(balance);
    }
  }, [balance, isClient]);

  const addToBalance = (amount: number) => {
    setBalance((prevBalance) => prevBalance + amount);
  };

  const deductFromBalance = (amount: number) => {
    if (balance >= amount) {
      setBalance((prevBalance) => prevBalance - amount);
      return true; // Sufficient funds, deduction successful
    }
    return false; // Insufficient funds
  };

  return (
    <UserBalanceContext.Provider
      value={{ balance, setBalance, addToBalance, deductFromBalance }}
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

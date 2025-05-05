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

export function UserBalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(5000); // Default starting balance

  // Load balance from localStorage on mount
  useEffect(() => {
    const savedBalance = localStorage.getItem("userBalance");
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }
  }, []);

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("userBalance", balance.toString());
  }, [balance]);

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

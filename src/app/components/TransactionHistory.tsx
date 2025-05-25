"use client";

import { useState, useEffect } from "react";
import { onSnapshot, query, collection, where, orderBy, DocumentData, Timestamp } from "firebase/firestore";
import { firestore } from "../../lib/firebase/firebase";
import { CreditTransaction } from "../../types/transactions";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner } from "./Loading";

interface TransactionHistoryProps {
  userId?: string;
  showCommissions?: boolean;
  maxItems?: number;
}

export default function TransactionHistory({ 
  userId, 
  showCommissions = false, 
  maxItems = 10 
}: TransactionHistoryProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    // Query for transactions involving this user (either as user or referrer)
    const transactionsQuery = showCommissions 
      ? query(
          collection(firestore, "credit_transactions"),
          where("referrerId", "==", targetUserId),
          orderBy("createdAt", "desc")
        )
      : query(
          collection(firestore, "credit_transactions"),
          where("userId", "==", targetUserId),
          orderBy("createdAt", "desc")
        );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionData: CreditTransaction[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        transactionData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as CreditTransaction);
      });

      // Limit the number of items if specified
      const limitedTransactions = maxItems ? transactionData.slice(0, maxItems) : transactionData;
      setTransactions(limitedTransactions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetUserId, showCommissions, maxItems]);
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  };

  const formatTime = (timestamp: Timestamp | undefined) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleTimeString();
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        {showCommissions ? "No commission transactions found" : "No transaction history found"}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {showCommissions ? "Commission History" : "Transaction History"}
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {transaction.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-900 mt-1">
                  {transaction.description}
                </p>
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{formatDate(transaction.createdAt)}</span>
                  <span>{formatTime(transaction.createdAt)}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-medium text-gray-900">
                  {showCommissions ? (
                    <span className="text-green-600">+${transaction.commission.toFixed(2)}</span>
                  ) : (
                    <span className="text-blue-600">+${transaction.amount.toFixed(2)}</span>
                  )}
                </div>
                {!showCommissions && transaction.commission > 0 && (
                  <div className="text-xs text-gray-500">
                    Commission: ${transaction.commission.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {transactions.length === maxItems && (
        <div className="px-4 py-3 bg-gray-50 text-center">
          <span className="text-sm text-gray-500">
            Showing {maxItems} most recent transactions
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { CommissionService } from "../../services/commissionService";
import { CommissionSummary } from "../../types/commission";

interface TransactionBalancePanelProps {
  adminId?: string;
}

export default function TransactionBalancePanel({ adminId }: TransactionBalancePanelProps) {
  const { user } = useAuth();
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const targetAdminId = adminId || user?.uid;

  useEffect(() => {
    if (!targetAdminId) {
      setLoading(false);
      return;
    }

    const loadCommissionSummary = async () => {
      try {
        const summary = await CommissionService.getAdminCommissionSummary(targetAdminId);
        setCommissionSummary(summary);
      } catch (error) {
        console.error("Error loading commission summary:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCommissionSummary();
  }, [targetAdminId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = commissionSummary?.totalCommissionBalance || 0;
  const depositCommissions = commissionSummary?.totalFromSuperadminDeposits || 0;
  const receiptCommissions = commissionSummary?.totalFromReceiptApprovals || 0;

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold text-gray-900">
            ${totalBalance.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Commission balance</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-yellow-800">Admin Deposits</p>
            <p className="text-xs text-yellow-600">Commission earned</p>
          </div>
          <span className="text-lg font-bold text-yellow-700">
            ${depositCommissions.toFixed(2)}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-green-800">Receipt Approvals</p>
            <p className="text-xs text-green-600">Commission earned</p>
          </div>
          <span className="text-lg font-bold text-green-700">
            ${receiptCommissions.toFixed(2)}
          </span>
        </div>
        
        {commissionSummary && (
          <div className="text-xs text-gray-500 pt-2">
            <p>{commissionSummary.transactionCount} total transactions</p>
            {commissionSummary.lastTransaction && (
              <p>Last transaction: {commissionSummary.lastTransaction.toLocaleDateString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

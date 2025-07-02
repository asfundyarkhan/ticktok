"use client";

import { useState, useEffect } from "react";
import { Clock, DollarSign } from "lucide-react";
import { SellerWalletService } from "../../services/sellerWalletService";
import { PendingProfit } from "../../types/wallet";
import { toast } from "react-hot-toast";

interface PendingProfitsSectionProps {
  sellerId: string;
}

export default function PendingProfitsSection({ sellerId }: PendingProfitsSectionProps) {
  const [pendingProfits, setPendingProfits] = useState<PendingProfit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPendingProfits = async () => {
      if (!sellerId) return;
      
      try {
        setLoading(true);
        const profits = await SellerWalletService.getPendingProfits(sellerId);
        setPendingProfits(profits);
      } catch (error) {
        console.error("Error loading pending profits:", error);
        toast.error("Failed to load pending profits");
      } finally {
        setLoading(false);
      }
    };

    loadPendingProfits();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Profits</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (pendingProfits.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Profits</h3>
        <p className="text-gray-500 text-center py-4">No pending profits at this time</p>
      </div>
    );
  }

  const totalPendingProfit = pendingProfits.reduce((sum, profit) => sum + profit.profitAmount, 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Pending Profits</h3>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-green-600">${totalPendingProfit.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-3">
        {pendingProfits.map((profit) => (
          <div 
            key={profit.id} 
            className={`border rounded-lg p-3 ${
              profit.status === 'pending' 
                ? 'border-yellow-200 bg-yellow-50' 
                : profit.status === 'deposit_made'
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{profit.productName}</h4>
                
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Profit:</span>
                    <div className="font-semibold text-green-600">${profit.profitAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Base Cost:</span>
                    <div className="font-semibold text-blue-600">${profit.baseCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <div className="font-semibold">{profit.quantitySold}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className={`font-semibold capitalize ${
                      profit.status === 'pending' ? 'text-yellow-600' :
                      profit.status === 'deposit_made' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {profit.status === 'pending' && 'Needs Deposit'}
                      {profit.status === 'deposit_made' && 'Ready'}
                      {profit.status !== 'pending' && profit.status !== 'deposit_made' && profit.status}
                    </div>
                  </div>
                </div>

                {profit.status === 'pending' && (
                  <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded p-2">
                    <p className="text-xs text-yellow-800 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Deposit Required: ${profit.depositRequired.toFixed(2)} to unlock this profit
                    </p>
                    <button
                      onClick={() => window.location.href = `/receipts-v2?deposit=${profit.id}&amount=${profit.depositRequired}`}
                      className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded"
                    >
                      Submit Deposit Receipt
                    </button>
                  </div>
                )}

                {profit.status === 'deposit_made' && (
                  <div className="mt-3 bg-green-100 border border-green-300 rounded p-2">
                    <p className="text-xs text-green-800 flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Profit approved and available in your wallet!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Showing {pendingProfits.length} pending profit{pendingProfits.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => window.location.href = '/receipts-v2'}
            className="text-[#FF0059] hover:text-[#FF0059]/80 font-medium"
          >
            View All Receipts →
          </button>
        </div>
      </div>
    </div>
  );
}

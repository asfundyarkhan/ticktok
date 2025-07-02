"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Clock, CheckCircle } from "lucide-react";
import { SellerWalletService } from "../../services/sellerWalletService";
import { NewReceiptService, NewReceipt } from "../../services/newReceiptService";
import { WalletBalance, PendingProfit } from "../../types/wallet";
import WithdrawalModal from "./WithdrawalModal";
import { toast } from "react-hot-toast";

interface SellerWalletDashboardProps {
  sellerId: string;
}

export default function SellerWalletDashboard({ sellerId }: SellerWalletDashboardProps) {
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({ available: 0, pending: 0, total: 0 });
  const [pendingProfits, setPendingProfits] = useState<PendingProfit[]>([]);
  const [depositReceipts, setDepositReceipts] = useState<NewReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedPendingProfit, setSelectedPendingProfit] = useState<PendingProfit | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const profits = await SellerWalletService.getPendingProfits(sellerId);
      setPendingProfits(profits);
      
      // Load deposit receipts for this user
      const receipts = await NewReceiptService.getUserReceipts(sellerId);
      const depositReceiptsOnly = receipts.filter((r: NewReceipt) => r.isDepositPayment);
      setDepositReceipts(depositReceiptsOnly);

      // Load user profile for withdrawal modal
      try {
        const { UserService } = await import("../../services/userService");
        const profile = await UserService.getUserProfile(sellerId);
        if (profile) {
          setSellerName(profile.displayName || profile.email?.split("@")[0] || "Unknown Seller");
          setSellerEmail(profile.email || "");
        }
      } catch (error) {
        console.warn("Could not load user profile:", error);
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    const unsubscribe = SellerWalletService.subscribeToWalletBalance(sellerId, setWalletBalance);
    loadData();
    
    // Subscribe to receipt updates
    const unsubscribeReceipts = NewReceiptService.subscribeToUserReceipts(sellerId, (receipts) => {
      const depositReceiptsOnly = receipts.filter((r: NewReceipt) => r.isDepositPayment);
      setDepositReceipts(depositReceiptsOnly);
    });
    
    return () => {
      unsubscribe();
      unsubscribeReceipts();
    };
  }, [sellerId, loadData]);

  // Get receipt status for a pending deposit
  const getDepositReceiptStatus = (depositId: string) => {
    const receipt = depositReceipts.find(r => r.pendingDepositId === depositId);
    return receipt;
  };

  const handleDeposit = async () => {
    if (!selectedPendingProfit || !depositAmount) {
      toast.error("Please select a pending profit and enter deposit amount");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < selectedPendingProfit.depositRequired) {
      toast.error(`Minimum deposit required: $${selectedPendingProfit.depositRequired}`);
      return;
    }

    try {
      await SellerWalletService.submitDeposit(sellerId, selectedPendingProfit.id, amount);
      toast.success("Deposit submitted successfully!");
      setShowDepositModal(false);
      setDepositAmount("");
      setSelectedPendingProfit(null);
      loadData();
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast.error("Failed to submit deposit");
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Wallet</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Available</p>
                <p className="text-2xl font-bold text-green-600">${walletBalance.available.toFixed(2)}</p>
                <p className="text-xs text-green-700">Ready to withdraw</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">${walletBalance.pending.toFixed(2)}</p>
                <p className="text-xs text-yellow-700">Requires deposit</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Earned</p>
                <p className="text-2xl font-bold text-blue-600">${walletBalance.total.toFixed(2)}</p>
                <p className="text-xs text-blue-700">All time profits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add explanation of how the deposit system works */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">How the seller wallet works:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>When you sell an item, your <strong className="text-green-600">profit</strong> is added to your pending balance.</li>
            <li>To withdraw the profit, you need to deposit the <strong className="text-blue-600">base cost</strong> of the sold item.</li>
            <li>After making a deposit, your profit becomes available to withdraw.</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = '/receipts-v2'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Make Deposit
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* Pending Profits */}
      {pendingProfits.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales & Profits</h3>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-800 mb-1">Pending Profits</h4>
              <p className="text-xs text-yellow-700">These profits require a deposit before they can be withdrawn</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-800 mb-1">Available Profits</h4>
              <p className="text-xs text-green-700">These profits have deposits confirmed and are ready to withdraw</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {pendingProfits.map((profit) => (
              <div 
                key={profit.id} 
                className={`border rounded-lg p-4 ${
                  profit.status === 'pending' 
                    ? 'border-yellow-200 bg-yellow-50' 
                    : profit.status === 'deposit_made'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{profit.productName}</h4>
                    <p className="text-sm text-gray-600">Sale Date: {profit.saleDate.toLocaleDateString()}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="text-gray-600">Sale Amount:</span>
                        <span className="font-medium ml-2">${profit.saleAmount.toFixed(2)}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-600">Your Profit:</span>
                        <span className="font-medium text-green-600 ml-2">${profit.profitAmount.toFixed(2)}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-600">Base Cost:</span>
                        <span className="font-medium text-blue-600 ml-2">${profit.baseCost.toFixed(2)}</span>
                      </p>
                      
                      {profit.status === 'pending' && (
                        <div className="mt-3">
                          {(() => {
                            const receipt = getDepositReceiptStatus(profit.id);
                            if (receipt) {
                              if (receipt.status === 'pending') {
                                return (
                                  <div className="bg-blue-100 border border-blue-300 rounded p-2">
                                    <p className="text-xs text-blue-800 flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Deposit receipt submitted - awaiting approval
                                    </p>
                                  </div>
                                );
                              } else if (receipt.status === 'rejected') {
                                return (
                                  <div className="bg-red-100 border border-red-300 rounded p-2">
                                    <p className="text-xs text-red-800">
                                      Deposit receipt rejected. Please submit a new receipt.
                                    </p>
                                    <button
                                      onClick={() => window.location.href = `/receipts-v2?deposit=${profit.id}`}
                                      className="mt-1 text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                                    >
                                      Resubmit Receipt
                                    </button>
                                  </div>
                                );
                              }
                            }
                            
                            return (
                              <div className="bg-yellow-100 border border-yellow-300 rounded p-2">
                                <p className="text-xs text-yellow-800">
                                  <strong>Deposit Required:</strong> ${profit.depositRequired.toFixed(2)} to unlock profit
                                </p>
                                <button
                                  onClick={() => window.location.href = `/receipts-v2?deposit=${profit.id}&amount=${profit.depositRequired}`}
                                  className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded"
                                >
                                  Submit Deposit Receipt
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Receipt status section */}
                      {profit.status === 'deposit_made' && (
                        <div className="mt-3 bg-green-100 border border-green-300 rounded p-2">
                          <p className="text-xs text-green-800 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Deposit successful! Your profit is now available.
                          </p>
                        </div>
                      )}
                      
                      {profit.status === 'pending' && (
                        <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded p-2">
                          <p className="text-xs text-yellow-800 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Deposit pending. Please complete the deposit to unlock your profit.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profit.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : profit.status === 'deposit_made'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profit.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {profit.status === 'deposit_made' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {profit.status === 'pending' 
                        ? 'DEPOSIT NEEDED' 
                        : profit.status === 'deposit_made'
                        ? 'AVAILABLE' 
                        : profit.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Make Deposit to Unlock Profit</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  To unlock your pending profit, you need to deposit the base cost of the item.
                  This ensures that you&apos;ve covered the cost of the sold product.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pending Profit
                  </label>
                  <select
                    value={selectedPendingProfit?.id || ""}
                    onChange={(e) => {
                      const profit = pendingProfits.find(p => p.id === e.target.value);
                      setSelectedPendingProfit(profit || null);
                      if (profit) {
                        setDepositAmount(profit.depositRequired.toString());
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a pending profit...</option>
                    {pendingProfits.filter(p => p.status === 'pending').map((profit) => (
                      <option key={profit.id} value={profit.id}>
                        {profit.productName} - ${profit.profitAmount.toFixed(2)} profit
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPendingProfit && (
                  <div className="space-y-2">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-800">Sale Details</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                          <p className="text-gray-600">Product:</p>
                          <p className="font-medium">{selectedPendingProfit.productName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Sale Date:</p>
                          <p className="font-medium">{selectedPendingProfit.saleDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Sale Amount:</p>
                          <p className="font-medium">${selectedPendingProfit.saleAmount.toFixed(2)}</p>
                        </div>
                        <div className="text-green-700">
                          <p className="text-gray-600">Your Profit:</p>
                          <p className="font-medium">${selectedPendingProfit.profitAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Amount
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          min={selectedPendingProfit.depositRequired}
                          step="0.01"
                          className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Minimum required: ${selectedPendingProfit.depositRequired.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowDepositModal(false);
                      setSelectedPendingProfit(null);
                      setDepositAmount("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={!selectedPendingProfit || !depositAmount || parseFloat(depositAmount) < (selectedPendingProfit?.depositRequired || 0)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Confirm Deposit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        availableBalance={walletBalance.available}
        sellerName={sellerName}
        sellerEmail={sellerEmail}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { SellerWalletService } from "../../../services/sellerWalletService";
import { NewReceiptService, NewReceipt } from "../../../services/newReceiptService";
import { PendingProfit } from "../../../types/wallet";
import { toast } from "react-hot-toast";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { createImageLogger } from "../../utils/logger";

// Create specialized loggers
const imgLogger = createImageLogger();

export default function PendingProductsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingProfits, setPendingProfits] = useState<PendingProfit[]>([]);
  const [depositReceipts, setDepositReceipts] = useState<NewReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Check authentication and permissions
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    
    if (!authLoading && userProfile) {
      if (userProfile.role === "admin") {
        router.push("/dashboard/admin");
        return;
      } else if (userProfile.role === "superadmin") {
        router.push("/dashboard");
        return;
      } else if (userProfile.role !== "seller") {
        router.push("/");
        return;
      }
    }
  }, [authLoading, user, userProfile, router]);

  // Load data using the exact same logic as profile page
  const loadData = useCallback(async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      // Use exact same service call as profile page
      const profits = await SellerWalletService.getPendingProfits(userProfile.uid);
      setPendingProfits(profits);
      
      // Load deposit receipts for this user (exact same logic)
      const receipts = await NewReceiptService.getUserReceipts(userProfile.uid);
      const depositReceiptsOnly = receipts.filter((r: NewReceipt) => r.isDepositPayment);
      setDepositReceipts(depositReceiptsOnly);
    } catch (error) {
      console.error("Error loading orders data:", error);
      toast.error("Failed to load orders data");
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    if (userProfile?.uid) {
      loadData();
      
      // Subscribe to receipt updates (exact same logic as profile page)
      const unsubscribeReceipts = NewReceiptService.subscribeToUserReceipts(userProfile.uid, (receipts) => {
        const depositReceiptsOnly = receipts.filter((r: NewReceipt) => r.isDepositPayment);
        setDepositReceipts(depositReceiptsOnly);
      });
      
      return () => {
        unsubscribeReceipts();
      };
    }
  }, [userProfile?.uid, loadData]);

  // Get receipt status for a pending deposit (exact same logic as profile page)
  const getDepositReceiptStatus = (depositId: string) => {
    const receipt = depositReceipts.find(r => r.pendingDepositId === depositId);
    return receipt;
  };

  // Filter profits based on search and status
  const filteredProfits = pendingProfits.filter(profit => {
    const matchesSearch = profit.productName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "pending") return matchesSearch && profit.status === 'pending';
    if (statusFilter === "available") return matchesSearch && profit.status === 'deposit_made';
    if (statusFilter === "submitted") {
      const receipt = getDepositReceiptStatus(profit.id);
      return matchesSearch && receipt?.status === 'pending';
    }
    
    return matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your sales and manage deposit requirements
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/receipts-v2"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Submit Receipt
              </Link>
              <Link
                href="/profile"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                View Wallet
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">All Orders</option>
                <option value="pending">Deposit Needed</option>
                <option value="submitted">Deposit Submitted</option>
                <option value="available">Available</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredProfits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 mb-4">
              <AlertCircle className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "You haven't made any sales yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProfits.map((profit) => (
              <div key={profit.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {profit.productImage && profit.productImage.trim() !== "" ? (
                        <Image
                          src={profit.productImage}
                          alt={profit.productName || "Product"}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            try {
                              imgLogger.error(`Failed to load image for ${profit.productName || 'unknown product'}`, {
                                originalSrc: profit.productImage || "no image",
                                attemptedSrc: target.src || "no src",
                                productId: profit.id || "unknown"
                              });
                            } catch (logError) {
                              console.warn('Failed to log image error:', logError);
                            }
                            // Hide the image element on error and show fallback
                            target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      {/* Always show fallback text - image will overlay if loaded successfully */}
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center">
                        📦<br />Product
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {profit.productName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Sale Date: {profit.saleDate.toLocaleDateString()}
                        </p>
                        
                        {/* Sale Information */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Sale Amount:</span>
                            <span className="font-medium ml-2">${profit.saleAmount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Your Profit:</span>
                            <span className="font-medium text-green-600 ml-2">${profit.profitAmount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Base Cost:</span>
                            <span className="font-medium text-blue-600 ml-2">${profit.baseCost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0 ml-4">
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

                    {/* Deposit Status Section (exact same logic as profile page) */}
                    {profit.status === 'pending' && (
                      <div className="mt-4">
                        {(() => {
                          const receipt = getDepositReceiptStatus(profit.id);
                          if (receipt) {
                            if (receipt.status === 'pending') {
                              return (
                                <div className="bg-blue-100 border border-blue-300 rounded p-3">
                                  <p className="text-sm text-blue-800 flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Deposit receipt submitted - awaiting approval
                                  </p>
                                </div>
                              );
                            } else if (receipt.status === 'rejected') {
                              return (
                                <div className="bg-red-100 border border-red-300 rounded p-3">
                                  <p className="text-sm text-red-800 mb-2">
                                    Deposit receipt rejected. Please submit a new receipt.
                                  </p>
                                  <button
                                    onClick={() => router.push(`/receipts-v2?deposit=${profit.id}`)}
                                    className="text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
                                  >
                                    Resubmit Receipt
                                  </button>
                                </div>
                              );
                            }
                          }
                          
                          return (
                            <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                              <p className="text-sm text-yellow-800 mb-2">
                                <strong>Deposit Required:</strong> ${profit.depositRequired.toFixed(2)} to unlock profit
                              </p>
                              <button
                                onClick={() => router.push(`/receipts-v2?deposit=${profit.id}&amount=${profit.depositRequired}`)}
                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                              >
                                Submit Deposit Receipt
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Success message for available profits */}
                    {profit.status === 'deposit_made' && (
                      <div className="mt-4 bg-green-100 border border-green-300 rounded p-3">
                        <p className="text-sm text-green-800 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Deposit successful! Your profit is now available in your wallet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {pendingProfits.length}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingProfits.filter(p => p.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending Deposits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {pendingProfits.filter(p => p.status === 'deposit_made').length}
              </div>
              <div className="text-sm text-gray-600">Available Profits</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

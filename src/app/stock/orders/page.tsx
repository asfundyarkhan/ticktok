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
import { AlertCircle } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingProfits, setPendingProfits] = useState<PendingProfit[]>([]);
  const [depositReceipts, setDepositReceipts] = useState<NewReceipt[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Filter profits based on search
  const filteredProfits = pendingProfits.filter(profit => {
    return profit.productName.toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Track your sales and manage deposit requirements
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
          <Link href="/profile" className="px-3 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-sm sm:text-base">
            General
          </Link>
          <Link href="/receipts-v2" className="px-3 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-sm sm:text-base">
            Receipts
          </Link>
          <Link href="/stock" className="px-3 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-sm sm:text-base">
            Product Pool
          </Link>
          <Link href="/stock/listings" className="px-3 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-sm sm:text-base">
            My Listings
          </Link>
          <Link href="/stock/orders" className="px-3 sm:px-4 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-medium -mb-[2px] whitespace-nowrap text-sm sm:text-base">
            Orders
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent text-base sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Orders Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredProfits.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <AlertCircle className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? "Try adjusting your search criteria."
                  : "You haven't made any sales yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProfits.map((profit) => (
                      <tr key={profit.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                {profit.productImage && profit.productImage.trim() !== "" ? (
                                  <Image
                                    src={profit.productImage}
                                    alt={profit.productName || "Product"}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs text-gray-400">No image</span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {profit.productName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {profit.saleDate.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${profit.saleAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600">
                            +${profit.profitAmount.toFixed(2)} profit
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getDepositReceiptStatus(profit.id)?.status === 'pending' && !getDepositReceiptStatus(profit.id)?.isAutoProcessed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pending Approval
                              </span>
                            ) : getDepositReceiptStatus(profit.id)?.status === 'pending' && getDepositReceiptStatus(profit.id)?.isAutoProcessed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Payment Transferred
                              </span>
                            ) : getDepositReceiptStatus(profit.id)?.status === 'rejected' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Rejected
                              </span>
                            ) : getDepositReceiptStatus(profit.id)?.status === 'approved' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Payment Transferred
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                Payment Required
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {profit.saleDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!getDepositReceiptStatus(profit.id) ? (
                            <div className="flex flex-col items-end space-y-1">
                              <div className="text-xs text-blue-600 font-medium">
                                Deposit: ${profit.depositRequired.toFixed(2)}
                              </div>
                              <button
                                onClick={() => window.location.href = `/receipts-v2?deposit=${profit.id}&amount=${profit.depositRequired}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                Pay Now
                              </button>
                            </div>
                          ) : getDepositReceiptStatus(profit.id)?.status === 'pending' && !getDepositReceiptStatus(profit.id)?.isAutoProcessed ? (
                            <div className="flex flex-col items-end space-y-1">
                              <div className="text-xs text-blue-600 font-medium">
                                Deposit: ${profit.depositRequired.toFixed(2)}
                              </div>
                              <button
                                disabled
                                className="bg-gray-400 text-gray-600 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed inline-flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Processing...
                              </button>
                            </div>
                          ) : getDepositReceiptStatus(profit.id)?.status === 'pending' && getDepositReceiptStatus(profit.id)?.isAutoProcessed ? (
                            <span></span>
                          ) : getDepositReceiptStatus(profit.id)?.status === 'rejected' ? (
                            <div className="flex flex-col items-end space-y-1">
                              <div className="text-xs text-blue-600 font-medium">
                                Deposit: ${profit.depositRequired.toFixed(2)}
                              </div>
                              <button
                                onClick={() => window.location.href = `/receipts-v2?deposit=${profit.id}&amount=${profit.depositRequired}`}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                Pay Now
                              </button>
                            </div>
                          ) : getDepositReceiptStatus(profit.id)?.status === 'approved' ? (
                            // Button disappears when approved
                            <span></span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Under Review
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Visible on mobile */}
              <div className="lg:hidden">
                <div className="divide-y divide-gray-200">
                  {filteredProfits.map((profit) => (
                    <div key={profit.id} className="p-4 sm:p-6">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {profit.productImage && profit.productImage.trim() !== "" ? (
                              <Image
                                src={profit.productImage}
                                alt={profit.productName || "Product"}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">No image</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                {profit.productName}
                              </h3>
                              <div className="mt-1 flex items-center text-xs sm:text-sm text-gray-500">
                                <span>Sale Date: {profit.saleDate.toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0">
                              {getDepositReceiptStatus(profit.id)?.status === 'pending' && !getDepositReceiptStatus(profit.id)?.isAutoProcessed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Pending Approval
                                </span>
                              ) : getDepositReceiptStatus(profit.id)?.status === 'pending' && getDepositReceiptStatus(profit.id)?.isAutoProcessed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Payment Transferred
                                </span>
                              ) : getDepositReceiptStatus(profit.id)?.status === 'rejected' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Rejected
                                </span>
                              ) : getDepositReceiptStatus(profit.id)?.status === 'approved' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Payment Transferred
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  Payment Required
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">${profit.saleAmount.toFixed(2)}</span>
                              <span className="text-green-600 ml-2">+${profit.profitAmount.toFixed(2)} profit</span>
                            </div>
                            {!getDepositReceiptStatus(profit.id) ? (
                              <div className="flex flex-col items-end space-y-1">
                                <div className="text-xs text-blue-600 font-medium">
                                  Deposit: ${profit.depositRequired.toFixed(2)}
                                </div>
                                <button
                                  onClick={() => window.location.href = `/receipts-v2?deposit=${profit.id}&amount=${profit.depositRequired}`}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  Pay Now
                                </button>
                              </div>
                            ) : getDepositReceiptStatus(profit.id)?.status === 'pending' && !getDepositReceiptStatus(profit.id)?.isAutoProcessed ? (
                              <div className="flex flex-col items-end space-y-1">
                                <div className="text-xs text-blue-600 font-medium">
                                  Deposit: ${profit.depositRequired.toFixed(2)}
                                </div>
                                <button
                                  disabled
                                  className="bg-gray-400 text-gray-600 px-3 py-1 rounded-md text-sm font-medium cursor-not-allowed inline-flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Processing...
                                </button>
                              </div>
                            ) : getDepositReceiptStatus(profit.id)?.status === 'pending' && getDepositReceiptStatus(profit.id)?.isAutoProcessed ? (
                              <span></span>
                            ) : getDepositReceiptStatus(profit.id)?.status === 'rejected' ? (
                              <div className="flex flex-col items-end space-y-1">
                                <div className="text-xs text-blue-600 font-medium">
                                  Deposit: ${profit.depositRequired.toFixed(2)}
                                </div>
                                <button
                                  onClick={() => window.location.href = `/receipts-v2?deposit=${profit.id}&amount=${profit.depositRequired}`}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  Pay Now
                                </button>
                              </div>
                            ) : getDepositReceiptStatus(profit.id)?.status === 'approved' ? (
                              // Button disappears when approved
                              <span></span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Under Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

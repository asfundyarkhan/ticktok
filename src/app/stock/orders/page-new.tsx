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
import { AlertCircle, Search, RefreshCw, DollarSign, Package, Clock } from "lucide-react";

// Order Status Component
const OrderStatus = ({ receipt }: { receipt?: NewReceipt }) => {
  if (!receipt) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        • Payment Required
      </span>
    );
  }

  if (receipt.status === 'approved' || (receipt.status === 'pending' && receipt.isWalletPayment)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✓ Payment Transferred
      </span>
    );
  }

  if (receipt.status === 'pending') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        ⏳ Pending Approval
      </span>
    );
  }

  if (receipt.status === 'rejected') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        ✗ Rejected
      </span>
    );
  }

  return null;
};

// Action Button Component
const ActionButton = ({ profit, receipt, onPayClick }: { 
  profit: PendingProfit; 
  receipt?: NewReceipt; 
  onPayClick: () => void;
}) => {
  // If no receipt exists, show Pay Now button
  if (!receipt) {
    return (
      <button
        onClick={onPayClick}
        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <DollarSign className="h-4 w-4" />
        Pay Now
      </button>
    );
  }

  // If receipt is approved or wallet payment, show success state
  if (receipt.status === 'approved' || (receipt.status === 'pending' && receipt.isWalletPayment)) {
    return (
      <div className="text-sm text-green-600 font-medium">
        ✓ Paid
      </div>
    );
  }

  // If receipt is pending approval, show processing state
  if (receipt.status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600">
        <Clock className="h-4 w-4" />
        Processing...
      </div>
    );
  }

  // If receipt is rejected, allow retry
  if (receipt.status === 'rejected') {
    return (
      <button
        onClick={onPayClick}
        className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Retry Payment
      </button>
    );
  }

  return null;
};

// Order Row Component
const OrderRow = ({ 
  profit, 
  receipt, 
  isSelected, 
  onToggleSelect, 
  onPayClick,
  canSelect 
}: { 
  profit: PendingProfit; 
  receipt?: NewReceipt; 
  isSelected: boolean; 
  onToggleSelect: () => void; 
  onPayClick: () => void;
  canSelect: boolean;
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Checkbox (mobile: top, desktop: left) */}
        {canSelect && (
          <div className="flex justify-center sm:justify-start">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        )}

        {/* Product Image */}
        <div className="flex justify-center sm:justify-start">
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {profit.imageUrl ? (
              <Image
                src={profit.imageUrl}
                alt={profit.productName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
            {profit.productName}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            {new Date(profit.saleDate).toLocaleDateString()}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">
              ${profit.price.toFixed(2)}
            </span>
            <span className="text-sm text-green-600">
              +${profit.profitAmount.toFixed(2)} profit
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-center sm:justify-end">
          <OrderStatus receipt={receipt} />
        </div>

        {/* Action */}
        <div className="flex justify-center sm:justify-end">
          <ActionButton 
            profit={profit} 
            receipt={receipt} 
            onPayClick={onPayClick} 
          />
        </div>
      </div>
    </div>
  );
};

// Bulk Payment Section Component
const BulkPaymentSection = ({ 
  selectedOrders, 
  onSelectAll, 
  onClearSelection, 
  onBulkPay,
  totalAmount,
  canSelectAll,
  isAllSelected 
}: {
  selectedOrders: string[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkPay: () => void;
  totalAmount: number;
  canSelectAll: boolean;
  isAllSelected: boolean;
}) => {
  if (selectedOrders.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-700 text-sm">
          Select multiple orders to enable bulk payment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-lg font-semibold text-gray-900">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
          
          <div className="flex gap-2">
            {canSelectAll && (
              <button
                onClick={onSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
            <button
              onClick={onClearSelection}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Selection
            </button>
          </div>
        </div>

        <button
          onClick={onBulkPay}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Pay {selectedOrders.length} Orders
        </button>
      </div>
    </div>
  );
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingProfits, setPendingProfits] = useState<PendingProfit[]>([]);
  const [depositReceipts, setDepositReceipts] = useState<NewReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Authentication check
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

  // Load data function
  const loadData = useCallback(async () => {
    if (!userProfile?.uid) return;

    try {
      console.log('🔄 Loading orders data...');
      setLoading(true);
      
      // Load pending profits
      const profits = await SellerWalletService.getPendingProfits(userProfile.uid);
      console.log(`📦 Loaded ${profits.length} pending profits`);
      setPendingProfits(profits);
      
      // Load deposit receipts
      const receipts = await NewReceiptService.getUserReceipts(userProfile.uid);
      const depositReceiptsOnly = receipts.filter((r: NewReceipt) => r.isDepositPayment);
      console.log(`📋 Loaded ${depositReceiptsOnly.length} deposit receipts`);
      setDepositReceipts(depositReceiptsOnly);
      
    } catch (error) {
      console.error("❌ Error loading orders data:", error);
      toast.error("Failed to load orders data");
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid]);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  // Set up data loading and subscriptions
  useEffect(() => {
    if (userProfile?.uid) {
      loadData();
      
      // Subscribe to receipt updates
      const unsubscribeReceipts = NewReceiptService.subscribeToUserReceipts(
        userProfile.uid, 
        (receipts) => {
          const depositReceiptsOnly = receipts.filter((r: NewReceipt) => r.isDepositPayment);
          console.log(`🔄 Real-time update: ${depositReceiptsOnly.length} deposit receipts`);
          setDepositReceipts(depositReceiptsOnly);
        }
      );
      
      return () => {
        unsubscribeReceipts();
      };
    }
  }, [userProfile?.uid, loadData]);

  // Helper function to get receipt status for a deposit
  const getDepositReceiptStatus = useCallback((depositId: string): NewReceipt | undefined => {
    console.log(`🔍 Checking receipt status for deposit: ${depositId}`);
    
    // Check for single deposit receipts
    const singleReceipt = depositReceipts.find(r => r.pendingDepositId === depositId);
    if (singleReceipt) {
      console.log(`✅ Found single receipt: ${singleReceipt.id} (${singleReceipt.status})`);
      return singleReceipt;
    }
    
    // Check for bulk payment receipts
    const bulkReceipt = depositReceipts.find(r => 
      r.isBulkPayment && 
      r.pendingDepositIds && 
      r.pendingDepositIds.includes(depositId)
    );
    
    if (bulkReceipt) {
      console.log(`✅ Found bulk receipt: ${bulkReceipt.id} (${bulkReceipt.status})`);
      return bulkReceipt;
    }
    
    console.log(`❌ No receipt found for deposit: ${depositId}`);
    return undefined;
  }, [depositReceipts]);

  // Helper function to check if an order can be selected
  const canOrderBeSelected = useCallback((profit: PendingProfit): boolean => {
    if (profit.status !== 'pending') return false;
    const receipt = getDepositReceiptStatus(profit.id);
    return !receipt; // Can only select if no receipt exists
  }, [getDepositReceiptStatus]);

  // Filter profits based on search
  const filteredProfits = pendingProfits.filter(profit =>
    profit.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selectable orders
  const selectableOrders = filteredProfits.filter(canOrderBeSelected);
  const canSelectAll = selectableOrders.length > 0;
  const isAllSelected = canSelectAll && selectedOrders.length === selectableOrders.length;

  // Calculate total amount for selected orders
  const totalSelectedAmount = selectedOrders.reduce((total, orderId) => {
    const profit = pendingProfits.find(p => p.id === orderId);
    return total + (profit?.price || 0);
  }, 0);

  // Handle order selection
  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(selectableOrders.map(p => p.id));
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedOrders([]);
  };

  // Handle single payment
  const handleSinglePayment = (orderId: string) => {
    const profit = pendingProfits.find(p => p.id === orderId);
    if (!profit) return;

    // Navigate to payment page with single order
    const params = new URLSearchParams({
      orders: JSON.stringify([{
        id: profit.id,
        productName: profit.productName,
        price: profit.price,
        imageUrl: profit.imageUrl || ""
      }]),
      totalAmount: profit.price.toString()
    });
    
    router.push(`/stock/deposit-payment?${params.toString()}`);
  };

  // Handle bulk payment
  const handleBulkPayment = () => {
    if (selectedOrders.length === 0) return;

    const selectedProfits = selectedOrders
      .map(id => pendingProfits.find(p => p.id === id))
      .filter(Boolean);

    const params = new URLSearchParams({
      orders: JSON.stringify(selectedProfits.map(p => ({
        id: p!.id,
        productName: p!.productName,
        price: p!.price,
        imageUrl: p!.imageUrl || ""
      }))),
      totalAmount: totalSelectedAmount.toString()
    });
    
    router.push(`/stock/deposit-payment?${params.toString()}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 text-sm mt-1">
                Track your sales and manage deposit requirements
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link 
                href="/stock"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← Back to Stock
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Bulk Payment Section */}
        {selectableOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Bulk Payment</h2>
            <BulkPaymentSection
              selectedOrders={selectedOrders}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkPay={handleBulkPayment}
              totalAmount={totalSelectedAmount}
              canSelectAll={canSelectAll}
              isAllSelected={isAllSelected}
            />
          </div>
        )}

        {/* Orders List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              All Orders ({filteredProfits.length})
            </h2>
          </div>

          {filteredProfits.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {searchQuery ? "Try adjusting your search terms" : "You don't have any orders yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProfits.map((profit) => {
                const receipt = getDepositReceiptStatus(profit.id);
                const canSelect = canOrderBeSelected(profit);
                const isSelected = selectedOrders.includes(profit.id);

                return (
                  <OrderRow
                    key={profit.id}
                    profit={profit}
                    receipt={receipt}
                    isSelected={isSelected}
                    onToggleSelect={() => handleOrderSelection(profit.id)}
                    onPayClick={() => handleSinglePayment(profit.id)}
                    canSelect={canSelect}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

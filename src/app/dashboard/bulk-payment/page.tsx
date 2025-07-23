"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import BulkDepositPaymentService, { BulkDepositPayment } from "@/services/bulkDepositPaymentService";
import { PendingDeposit } from "@/services/pendingDepositService";
import { toast } from "react-hot-toast";
import {
  DollarSign,
  Package,
  CreditCard
} from "lucide-react";

export default function BulkPaymentPage() {
  const [user] = useAuthState(auth);
  const [soldOrders, setSoldOrders] = useState<PendingDeposit[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkPayments, setBulkPayments] = useState<BulkDepositPayment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedBulkPayment, setSelectedBulkPayment] = useState<BulkDepositPayment | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDescription, setReceiptDescription] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const orders = await BulkDepositPaymentService.getSoldOrdersForBulkPayment(user.uid);
        setSoldOrders(orders);
      } catch (error) {
        console.error("Error loading sold orders:", error);
        toast.error("Failed to load sold orders");
      }
    };

    loadData();

    // Subscribe to bulk payments
    const unsubscribe = BulkDepositPaymentService.subscribeToBulkPayments(
      user.uid,
      (payments) => {
        setBulkPayments(payments);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const loadSoldOrders = async () => {
    if (!user) return;
    
    try {
      const orders = await BulkDepositPaymentService.getSoldOrdersForBulkPayment(user.uid);
      setSoldOrders(orders);
    } catch (error) {
      console.error("Error loading sold orders:", error);
      toast.error("Failed to load sold orders");
    }
  };

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const calculateTotals = () => {
    const selectedOrderData = soldOrders.filter(order => selectedOrders.includes(order.id!));
    return {
      totalDeposit: selectedOrderData.reduce((sum, order) => sum + order.totalDepositRequired, 0),
      totalProfit: selectedOrderData.reduce((sum, order) => sum + (order.pendingProfitAmount || 0), 0),
      orderCount: selectedOrderData.length
    };
  };

  const createBulkPayment = async () => {
    if (!user || selectedOrders.length === 0) return;

    setSubmitting(true);
    try {
      const result = await BulkDepositPaymentService.createBulkPayment(
        user.uid,
        user.email || "",
        user.displayName || user.email || "",
        selectedOrders
      );

      if (result.success) {
        toast.success(result.message);
        setSelectedOrders([]);
        loadSoldOrders(); // Refresh the list
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error creating bulk payment:", error);
      toast.error("Failed to create bulk payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiptSubmit = async () => {
    if (!selectedBulkPayment || !receiptFile) return;

    setSubmitting(true);
    try {
      const result = await BulkDepositPaymentService.submitBulkPaymentReceipt(
        selectedBulkPayment.id!,
        receiptFile,
        receiptDescription
      );

      if (result.success) {
        toast.success(result.message);
        setShowReceiptModal(false);
        setSelectedBulkPayment(null);
        setReceiptFile(null);
        setReceiptDescription("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error submitting receipt:", error);
      toast.error("Failed to submit receipt");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: "bg-yellow-50 text-yellow-800 border-yellow-200", text: "Pending" },
      receipt_submitted: { color: "bg-blue-50 text-blue-800 border-blue-200", text: "Receipt Submitted" },
      approved: { color: "bg-green-50 text-green-800 border-green-200", text: "Approved" },
      rejected: { color: "bg-red-50 text-red-800 border-red-200", text: "Rejected" }
    };
    
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const totals = calculateTotals();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Bulk Deposit Payment</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Pay for multiple sold orders in a single transaction
          </p>
        </div>

        {/* Selection Summary */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">{totals.orderCount} Orders Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Total: ${totals.totalDeposit.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedOrders([])}
                  className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900"
                >
                  Clear
                </button>
                <button
                  onClick={createBulkPayment}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Bulk Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Orders */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Available Sold Orders</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select orders to include in bulk payment (max 10)
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {soldOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No sold orders</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Orders will appear here when they are sold and ready for deposit payment.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {soldOrders.map((order) => (
                    <div key={order.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id!)}
                          onChange={() => handleOrderSelection(order.id!)}
                          disabled={selectedOrders.length >= 10 && !selectedOrders.includes(order.id!)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {order.productName}
                          </h4>
                          <div className="mt-1 text-xs text-gray-500 space-y-1">
                            <div>Quantity: {order.quantityListed}</div>
                            <div>Sold: {formatDate(order.saleDate!)}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              ${order.totalDepositRequired.toFixed(2)}
                            </span>
                            <span className="text-xs text-green-600">
                              +${(order.pendingProfitAmount || 0).toFixed(2)} profit
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bulk Payment History */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Bulk Payment History</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your previous bulk payments and their status
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {bulkPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bulk payments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your bulk payments will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {bulkPayments.map((payment) => {
                    const statusBadge = getStatusBadge(payment.status);
                    return (
                      <div key={payment.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                                {statusBadge.text}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {payment.totalOrdersCount} Orders - ${payment.totalDepositAmount.toFixed(2)}
                            </h4>
                            <div className="mt-1 text-xs text-gray-500">
                              <div>Created: {formatDate(payment.createdAt)}</div>
                              <div>Profit: ${payment.totalProfitAmount.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            {payment.status === "pending" && (
                              <button
                                onClick={() => {
                                  setSelectedBulkPayment(payment);
                                  setShowReceiptModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Upload Receipt
                              </button>
                            )}
                            <button className="text-xs text-gray-500 hover:text-gray-700">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Upload Modal */}
      {showReceiptModal && selectedBulkPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Upload Receipt for Bulk Payment
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 space-y-1">
                  <div><span className="font-medium">Orders:</span> {selectedBulkPayment.totalOrdersCount}</div>
                  <div><span className="font-medium">Total Amount:</span> ${selectedBulkPayment.totalDepositAmount.toFixed(2)}</div>
                  <div><span className="font-medium">Expected Profit:</span> ${selectedBulkPayment.totalProfitAmount.toFixed(2)}</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Receipt
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={receiptDescription}
                  onChange={(e) => setReceiptDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Add any notes about this payment..."
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedBulkPayment(null);
                    setReceiptFile(null);
                    setReceiptDescription("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReceiptSubmit}
                  disabled={!receiptFile || submitting}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Uploading..." : "Submit Receipt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { WithdrawalRequestService } from "@/services/withdrawalRequestService";
import { useAuth } from "@/context/AuthContext";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  sellerName: string;
  sellerEmail: string;
  onSuccess?: () => void;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  availableBalance,
  sellerName,
  sellerEmail,
  onSuccess,
}: WithdrawalModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [usdtId, setUsdtId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; usdtId?: string }>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setUsdtId("");
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (amountValue: string, usdtValue: string): boolean => {
    const numValue = parseFloat(amountValue);
    const newErrors: { amount?: string; usdtId?: string } = {};

    // Validate amount
    if (!amountValue.trim()) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(numValue) || numValue <= 0) {
      newErrors.amount = "Amount must be a positive number";
    } else if (numValue > availableBalance) {
      newErrors.amount = `Amount cannot exceed available balance ($${availableBalance.toFixed(2)})`;
    } else if (numValue < 5) {
      newErrors.amount = "Minimum withdrawal amount is $5.00";
    }

    // Validate USDT address (now required)
    if (!usdtValue.trim()) {
      newErrors.usdtId = "USDT wallet address is required";
    } else if (usdtValue.trim().length < 20) {
      newErrors.usdtId = "Please enter a valid USDT TRC20 wallet address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (value) {
        validateForm(value, usdtId);
      } else {
        setErrors({});
      }
    }
  };

  const handleSetMaxAmount = () => {
    const maxAmount = Math.max(0, availableBalance);
    setAmount(maxAmount.toFixed(2));
    validateForm(maxAmount.toFixed(2), usdtId);
  };

  const handleUsdtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdtId(value);
    validateForm(amount, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to make a withdrawal request");
      return;
    }

    if (!validateForm(amount, usdtId)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await WithdrawalRequestService.createWithdrawalRequest(
        user.uid,
        sellerName,
        sellerEmail,
        parseFloat(amount),
        usdtId.trim()
      );

      if (result.success) {
        toast.success("Withdrawal request submitted successfully!");
        onSuccess?.(); // Call the callback if provided
        onClose();
        // Note: The admin dashboard will automatically update via real-time subscription
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error submitting withdrawal request:", error);
      toast.error("Failed to submit withdrawal request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Request Withdrawal
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Balance Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Available Balance</div>
            <div className="text-2xl font-bold text-green-600">
              ${availableBalance.toFixed(2)}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg">$</span>
                </div>
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent transition-all ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleSetMaxAmount}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-[#FF0059] hover:text-[#E6004F] font-medium"
                  disabled={isSubmitting}
                >
                  MAX
                </button>
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* USDT ID Field */}
            <div>
              <label htmlFor="usdtId" className="block text-sm font-medium text-gray-700 mb-2">
                USDT Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="usdtId"
                value={usdtId}
                onChange={handleUsdtChange}
                placeholder="Enter your USDT TRC20 wallet address"
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent transition-all font-mono text-sm ${
                  errors.usdtId ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
                required
              />
              {errors.usdtId && (
                <p className="mt-1 text-sm text-red-600">{errors.usdtId}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Your USDT TRC20 wallet address is required for withdrawal processing
              </p>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Minimum withdrawal amount: $5.00</p>
              <p>• Withdrawal requests are processed within 1-3 business days</p>
              <p>• You can only have one pending withdrawal request at a time</p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !amount || !usdtId || !!errors.amount || !!errors.usdtId}
                className="flex-1 px-4 py-2 bg-[#FF0059] text-white rounded-lg hover:bg-[#E6004F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

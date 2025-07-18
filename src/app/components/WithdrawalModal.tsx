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

type Currency = "USDT" | "USD" | "EUR" | "GBP" | "MYR";

interface PaymentDetails {
  usdtWalletAddress: string;
  accountOwner: string;
  bankName: string;
  accountNumber: string;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  availableBalance,
  sellerName,
  sellerEmail,
  onSuccess,
}: WithdrawalModalProps) {
  const { user, userProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USDT");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    usdtWalletAddress: "",
    accountOwner: "",
    bankName: "",
    accountNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    usdtWalletAddress?: string;
    accountOwner?: string;
    bankName?: string;
    accountNumber?: string;
  }>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setCurrency("USDT");
      setPaymentDetails({
        usdtWalletAddress: "",
        accountOwner: "",
        bankName: "",
        accountNumber: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  // Reset payment details when currency changes
  useEffect(() => {
    setPaymentDetails({
      usdtWalletAddress: "",
      accountOwner: "",
      bankName: "",
      accountNumber: "",
    });
    setErrors({});
  }, [currency]);

  const validateForm = (): boolean => {
    const numValue = parseFloat(amount);
    const newErrors: {
      amount?: string;
      usdtWalletAddress?: string;
      accountOwner?: string;
      bankName?: string;
      accountNumber?: string;
    } = {};

    // Validate amount
    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(numValue) || numValue <= 0) {
      newErrors.amount = "Amount must be a positive number";
    } else if (numValue > availableBalance) {
      newErrors.amount = `Amount cannot exceed available balance ($${availableBalance.toFixed(2)})`;
    } else if (numValue < 5) {
      newErrors.amount = "Minimum withdrawal amount is $5.00";
    }

    // Validate payment details based on currency
    if (currency === "USDT") {
      if (!paymentDetails.usdtWalletAddress.trim()) {
        newErrors.usdtWalletAddress = "USDT wallet address is required";
      } else if (paymentDetails.usdtWalletAddress.trim().length < 20) {
        newErrors.usdtWalletAddress = "Please enter a valid USDT TRC20 wallet address";
      }
    } else {
      // Bank transfer validation
      if (!paymentDetails.accountOwner.trim()) {
        newErrors.accountOwner = "Account owner name is required";
      }
      if (!paymentDetails.bankName.trim()) {
        newErrors.bankName = "Bank name is required";
      }
      if (!paymentDetails.accountNumber.trim()) {
        newErrors.accountNumber = "Account number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSetMaxAmount = () => {
    const maxAmount = Math.max(0, availableBalance);
    setAmount(maxAmount.toFixed(2));
  };

  const handlePaymentDetailChange = (field: keyof PaymentDetails, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const autoFillPaymentDetails = () => {
    if (!userProfile?.paymentInfo) {
      toast.error("No saved payment information found in your profile");
      return;
    }

    const { paymentInfo } = userProfile;

    if (currency === "USDT") {
      if (paymentInfo.usdtWalletAddress) {
        setPaymentDetails(prev => ({
          ...prev,
          usdtWalletAddress: paymentInfo.usdtWalletAddress || ""
        }));
        toast.success("USDT wallet address auto-filled from profile");
      } else {
        toast.error("No USDT wallet address found in your profile");
      }
    } else {
      // For fiat currencies, use bank information
      if (paymentInfo.bankInfo?.accountName && paymentInfo.bankInfo?.bankName && paymentInfo.bankInfo?.accountNumber) {
        setPaymentDetails(prev => ({
          ...prev,
          accountOwner: paymentInfo.bankInfo?.accountName || "",
          bankName: paymentInfo.bankInfo?.bankName || "",
          accountNumber: paymentInfo.bankInfo?.accountNumber || "",
        }));
        toast.success("Bank details auto-filled from profile");
      } else {
        toast.error("Incomplete bank information in your profile. Please complete your payment details in your profile page.");
      }
    }
  };

  const hasPaymentInfo = () => {
    if (!userProfile?.paymentInfo) return false;
    
    if (currency === "USDT") {
      return !!userProfile.paymentInfo.usdtWalletAddress;
    } else {
      return !!(
        userProfile.paymentInfo.bankInfo?.accountName &&
        userProfile.paymentInfo.bankInfo?.bankName &&
        userProfile.paymentInfo.bankInfo?.accountNumber
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to make a withdrawal request");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await WithdrawalRequestService.createWithdrawalRequest(
        user.uid,
        sellerName,
        sellerEmail,
        parseFloat(amount),
        currency,
        paymentDetails
      );

      if (result.success) {
        toast.success("Withdrawal request submitted successfully!");
        onSuccess?.(); // Call the callback if provided
        onClose();
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
            {/* Currency Selection */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent transition-all"
                disabled={isSubmitting}
              >
                <option value="USDT">USDT</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="MYR">MYR</option>
              </select>
            </div>

            {/* Dynamic Payment Details */}
            {currency === "USDT" ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="usdtWallet" className="block text-sm font-medium text-gray-700">
                    USDT Wallet Address <span className="text-red-500">*</span>
                  </label>
                  {hasPaymentInfo() && (
                    <button
                      type="button"
                      onClick={autoFillPaymentDetails}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      disabled={isSubmitting}
                    >
                      Auto-fill from Profile
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  id="usdtWallet"
                  value={paymentDetails.usdtWalletAddress}
                  onChange={(e) => handlePaymentDetailChange("usdtWalletAddress", e.target.value)}
                  placeholder="Enter your USDT TRC20 wallet address"
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent transition-all font-mono text-sm ${
                    errors.usdtWalletAddress ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                  required
                />
                {errors.usdtWalletAddress && (
                  <p className="mt-1 text-sm text-red-600">{errors.usdtWalletAddress}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  <strong>Blockchain:</strong> USDT-TRC20
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Auto-fill button for bank details */}
                {hasPaymentInfo() && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={autoFillPaymentDetails}
                      className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      disabled={isSubmitting}
                    >
                      Auto-fill Bank Details from Profile
                    </button>
                  </div>
                )}
                
                {/* Account Owner */}
                <div>
                  <label htmlFor="accountOwner" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Owner <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="accountOwner"
                    value={paymentDetails.accountOwner}
                    onChange={(e) => handlePaymentDetailChange("accountOwner", e.target.value)}
                    placeholder="Full name on bank account"
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent transition-all ${
                      errors.accountOwner ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.accountOwner && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountOwner}</p>
                  )}
                </div>

                {/* Bank Name */}
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    value={paymentDetails.bankName}
                    onChange={(e) => handlePaymentDetailChange("bankName", e.target.value)}
                    placeholder="Name of your bank"
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent transition-all ${
                      errors.bankName ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    value={paymentDetails.accountNumber}
                    onChange={(e) => handlePaymentDetailChange("accountNumber", e.target.value)}
                    placeholder="Your bank account number"
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent transition-all ${
                      errors.accountNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                  )}
                </div>
              </div>
            )}

            {/* Withdrawal Amount */}
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
                disabled={isSubmitting || !amount || Object.keys(errors).length > 0}
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

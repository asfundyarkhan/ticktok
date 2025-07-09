"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { NewReceiptService } from "../../services/newReceiptService";
import { SellerWalletService } from "../../services/sellerWalletService";
import { toast } from "react-hot-toast";
import { Upload, DollarSign, FileText, Camera, Check, Wallet } from "lucide-react";
import Image from "next/image";
import USDTPaymentInfo from "./USDTPaymentInfo";

interface ReceiptSubmissionProps {
  // For deposit payments
  isDepositPayment?: boolean;
  pendingDepositId?: string;
  pendingProductId?: string;
  productName?: string;
  requiredAmount?: number;
  onSubmitted?: () => void;
  className?: string;
}

export default function ReceiptSubmission({
  isDepositPayment = false,
  pendingDepositId,
  pendingProductId,
  productName,
  requiredAmount,
  onSubmitted,
  className = ""
}: ReceiptSubmissionProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(requiredAmount?.toString() || "");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"receipt" | "wallet">("receipt");

  // Load wallet balance for deposit payments
  useEffect(() => {
    if (isDepositPayment && user?.uid) {
      const unsubscribe = SellerWalletService.subscribeToWalletBalance(user.uid, (balance) => {
        setWalletBalance(balance.available);
      });
      return unsubscribe;
    }
  }, [isDepositPayment, user?.uid]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to submit a receipt");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (isDepositPayment && requiredAmount && amountNum < requiredAmount) {
      toast.error(`Minimum deposit amount is $${requiredAmount.toFixed(2)}`);
      return;
    }

    // For wallet payments, check if sufficient balance
    if (paymentMethod === "wallet") {
      if (walletBalance < amountNum) {
        toast.error(`Insufficient wallet balance. Available: $${walletBalance.toFixed(2)}, Required: $${amountNum.toFixed(2)}`);
        return;
      }
      // For wallet payments, we don't need a receipt image
    } else {
      // For regular receipt submissions, require image
      if (!selectedFile) {
        toast.error("Please select a receipt image");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create deposit info with proper validation
      let depositInfo = undefined;
      if (isDepositPayment && pendingDepositId) {
        depositInfo = {
          pendingDepositId,
          ...(pendingProductId && { pendingProductId }),
          ...(productName && { productName })
        };
      }

      // Create wallet payment info
      let walletPayment = undefined;
      if (paymentMethod === "wallet") {
        walletPayment = {
          isWalletPayment: true,
          walletBalanceUsed: amountNum
        };
      }

      // For wallet payments, create a dummy receipt file
      let receiptFile = selectedFile;
      if (paymentMethod === "wallet" && !selectedFile) {
        // Create a small text file as a placeholder
        const dummyContent = `Wallet Payment Receipt\nAmount: $${amountNum.toFixed(2)}\nDate: ${new Date().toISOString()}\nPaid via wallet balance`;
        receiptFile = new File([dummyContent], "wallet-payment-receipt.txt", { type: "text/plain" });
      }

      const result = await NewReceiptService.submitReceipt(
        user.uid,
        user.email || "",
        user.displayName || user.email || "User",
        amountNum,
        receiptFile!,
        description,
        depositInfo,
        walletPayment
      );

      if (result.success) {
        toast.success(result.message);
        setIsSubmitted(true);
        onSubmitted?.();
        
        // Reset form
        setAmount("");
        setDescription("");
        setSelectedFile(null);
        setPreviewUrl("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error submitting receipt:", error);
      toast.error("Failed to submit receipt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          {paymentMethod === "wallet" ? "Payment Processed!" : "Receipt Submitted!"}
        </h3>
        <p className="text-green-700">
          {paymentMethod === "wallet" 
            ? "Your deposit has been processed and profits have been added to your wallet balance."
            : "Your receipt has been submitted for review. You'll receive a notification once it's processed."
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {isDepositPayment ? "Submit Deposit Receipt" : "Submit Withdrawal Receipt"}
        </h3>
        <p className="text-gray-600">
          {isDepositPayment 
            ? "Upload your deposit payment receipt to activate your profits"
            : "Upload your payment receipt for withdrawal approval"
          }
        </p>
      </div>

      {/* USDT Payment Information */}
      <USDTPaymentInfo />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
            {isDepositPayment && requiredAmount && (
              <span className="text-gray-500 ml-2">(Min: ${requiredAmount.toFixed(2)})</span>
            )}
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0059] focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Payment Method Selection - Only for deposit payments */}
        {isDepositPayment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Receipt Upload Option */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === "receipt" 
                    ? "border-[#FF0059] bg-pink-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPaymentMethod("receipt")}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="receipt-method"
                    name="paymentMethod"
                    value="receipt"
                    checked={paymentMethod === "receipt"}
                    onChange={(e) => setPaymentMethod(e.target.value as "receipt" | "wallet")}
                    className="text-[#FF0059] focus:ring-[#FF0059]"
                  />
                  <div className="flex-1">
                    <label htmlFor="receipt-method" className="text-sm font-medium text-gray-900 cursor-pointer">
                      PAY WITH USDT
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Submit payment receipt for admin approval
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Payment Option */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === "wallet" 
                    ? "border-[#FF0059] bg-pink-50" 
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  walletBalance < parseFloat(amount || "0") ? "opacity-50" : ""
                }`}
                onClick={() => {
                  if (walletBalance >= parseFloat(amount || "0")) {
                    setPaymentMethod("wallet");
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="wallet-method"
                    name="paymentMethod"
                    value="wallet"
                    checked={paymentMethod === "wallet"}
                    onChange={(e) => setPaymentMethod(e.target.value as "receipt" | "wallet")}
                    className="text-[#FF0059] focus:ring-[#FF0059]"
                    disabled={walletBalance < parseFloat(amount || "0")}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-gray-600" />
                      <label htmlFor="wallet-method" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Pay with Wallet Balance
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Available: ${walletBalance.toFixed(2)}
                    </p>
                    {walletBalance < parseFloat(amount || "0") && (
                      <p className="text-xs text-red-600 mt-1">
                        Insufficient balance
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Info for Deposit Payments */}
        {isDepositPayment && productName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-1">Deposit For:</h4>
            <p className="text-blue-800">{productName}</p>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description {!isDepositPayment && "*"}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isDepositPayment 
              ? "Additional notes (optional)..." 
              : "Describe the payment/transaction..."
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0059] focus:border-transparent"
            rows={3}
            required={!isDepositPayment}
          />
        </div>

        {/* File Upload - Only show for receipt payment method */}
        {(!isDepositPayment || paymentMethod === "receipt") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Image *
            </label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Upload a clear photo of your receipt
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: JPG, PNG, GIF (Max 5MB)
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF0059] text-white rounded-lg cursor-pointer hover:bg-[#E6004F] transition-colors">
                  <Upload className="w-4 h-4" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt="Receipt preview"
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>File:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isSubmitting || 
            (!selectedFile && (!isDepositPayment || paymentMethod === "receipt")) ||
            (isDepositPayment && paymentMethod === "wallet" && walletBalance < parseFloat(amount || "0"))
          }
          className="w-full bg-[#FF0059] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#E6004F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Submitting...
            </span>
          ) : (
            `Submit ${isDepositPayment ? "Deposit" : "Withdrawal"} Receipt`
          )}
        </button>
        
        {/* Insufficient balance message */}
        {isDepositPayment && paymentMethod === "wallet" && walletBalance < parseFloat(amount || "0") && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              <strong>Insufficient wallet balance.</strong> You need ${parseFloat(amount || "0").toFixed(2)} but only have ${walletBalance.toFixed(2)} available. 
              Please choose &quot;Upload Receipt&quot; or add funds to your wallet.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { NewReceiptService } from "../../services/newReceiptService";
import { toast } from "react-hot-toast";
import { Upload, DollarSign, FileText, Camera, Check } from "lucide-react";
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

    if (!selectedFile) {
      toast.error("Please select a receipt image");
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

      const result = await NewReceiptService.submitReceipt(
        user.uid,
        user.email || "",
        user.displayName || user.email || "User",
        amountNum,
        selectedFile,
        description,
        depositInfo
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
        <h3 className="text-lg font-semibold text-green-900 mb-2">Receipt Submitted!</h3>
        <p className="text-green-700">
          Your receipt has been submitted for review. You&apos;ll receive a notification once it&apos;s processed.
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

        {/* File Upload */}
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedFile}
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
      </form>
    </div>
  );
}

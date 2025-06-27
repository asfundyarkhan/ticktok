"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "../components/Loading";
import { ReceiptService } from "@/services/receiptService";
import { PendingProductService } from "@/services/pendingProductService";
import { toast } from "react-hot-toast";
import { Upload, DollarSign, Package } from "lucide-react";

function DepositsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  
  // Get parameters from URL
  const productId = searchParams.get("product");
  const suggestedAmount = searchParams.get("amount");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/deposits");
      return;
    }

    if (!authLoading && userProfile && userProfile.role !== "seller") {
      toast.error("Only sellers can access deposits page");
      router.push("/store");
      return;
    }

    // Set suggested amount if provided
    if (suggestedAmount) {
      setAmount(suggestedAmount);
    }
  }, [user, userProfile, authLoading, router, suggestedAmount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, or WebP)");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      toast.error("You must be logged in to submit a deposit");
      return;
    }

    if (!receiptFile) {
      toast.error("Please select a receipt image");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await ReceiptService.submitReceipt(
        user.uid,
        parseFloat(amount),
        receiptFile,
        referenceNumber || undefined
      );

      if (result.success) {
        toast.success("Deposit receipt submitted successfully!");
        
        // If this deposit is for a specific pending product, link them
        if (productId && result.receiptId) {
          try {
            await PendingProductService.linkReceiptToPendingProduct(
              productId,
              result.receiptId
            );
          } catch (error) {
            console.error("Error linking receipt to pending product:", error);
            // Don't show error to user as the receipt was submitted successfully
          }
        }

        // Clear form
        setReceiptFile(null);
        setAmount("");
        setReferenceNumber("");
        
        // Redirect to pending products page if this was for a specific product
        if (productId) {
          router.push("/stock/pending");
        }
      } else {
        toast.error(result.message || "Failed to submit deposit receipt");
      }
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast.error("An error occurred while submitting the deposit");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Upload className="h-6 w-6 mr-2 text-[#FF0059]" />
              Submit Deposit Receipt
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Upload a receipt to confirm your payment deposit
              {productId ? " for the sold product" : ""}
            </p>
          </div>

          {/* Bank Details Section */}
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-blue-900 uppercase mb-3">
              Payment Instructions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-800">Bank Name:</p>
                <p className="text-blue-700">TickTok Shop Bank</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Account Number:</p>
                <p className="text-blue-700">1234567890</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Account Name:</p>
                <p className="text-blue-700">TickTok Shop Ltd</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Swift Code:</p>
                <p className="text-blue-700">TTSHOP123</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-100 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Please ensure you transfer the exact amount and upload
                the receipt for verification. Include your seller ID in the transfer reference if possible.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-6">
              {/* Amount Field */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Deposit Amount ($)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Enter the amount you deposited"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#FF0059] focus:border-[#FF0059]"
                  disabled={isSubmitting}
                />
                {suggestedAmount && (
                  <p className="text-xs text-gray-600 mt-1">
                    Suggested amount: ${suggestedAmount} (for pending product)
                  </p>
                )}
              </div>

              {/* Reference Number Field */}
              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  id="reference"
                  name="reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Transaction reference number from your bank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#FF0059] focus:border-[#FF0059]"
                  disabled={isSubmitting}
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Image *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#FF0059] transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-[#FF0059] hover:text-[#E0004D] focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt"
                          name="receipt"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                          disabled={isSubmitting}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                    {receiptFile && (
                      <p className="text-sm text-green-600 font-medium">
                        Selected: {receiptFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !receiptFile || !amount}
                  className="px-6 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium hover:bg-[#E0004D] focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2">
                        <LoadingSpinner size="sm" />
                      </div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Submit Deposit Receipt
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900">What happens after I submit?</h4>
              <p>Your deposit receipt will be reviewed by our team. Once approved, the funds will be added to your account balance.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">How long does approval take?</h4>
              <p>Most deposits are approved within 24-48 hours during business days.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">What if my deposit is rejected?</h4>
              <p>You will receive a notification with the reason for rejection and can resubmit with the correct information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DepositsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="lg" /></div>}>
      <DepositsPageContent />
    </Suspense>
  );
}

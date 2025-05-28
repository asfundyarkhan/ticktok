"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ReceiptService } from '../../services/receiptService';
import { useAuth } from '../../context/AuthContext';

export default function ReceiptUploadForm() {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle receipt image selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Create preview for the selected image
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setReceiptFile(file);
    } else {
      setReceiptFile(null);
      setPreviewUrl(null);
    }
  };
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to upload a receipt');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!referenceNumber.trim()) {
      toast.error('Please enter a reference number');
      return;
    }
    
    if (!receiptFile) {
      toast.error('Please select a receipt image');
      return;
    }
    
    // Check image file size
    if (receiptFile.size > 5 * 1024 * 1024) {
      toast.error('Receipt image is too large. Maximum size is 5MB');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      toast.loading('Uploading receipt...');
      
      const result = await ReceiptService.submitReceipt(
        user.uid,
        parseFloat(amount),
        referenceNumber.trim(),
        receiptFile
      );
      
      toast.dismiss(); // Clear loading toast
      
      if (result.success) {
        toast.success(result.message);
        // Reset form
        setAmount('');
        setReferenceNumber('');
        setReceiptFile(null);
        setPreviewUrl(null);
      } else {
        // Check for specific errors in the message
        if (result.message.includes("upload") || !result.message) {
          toast.error('Failed to upload receipt image. Please check your internet connection and try again.');
          console.error('Upload failure details might be in the browser console');
        } else {
          toast.error(result.message);
        }
      }    } catch (error) {
      console.error('Error submitting receipt:', error);
      toast.dismiss(); // Clear loading toast
      
      // More specific error messages based on error properties
      const err = error as { code?: string };
      if (err?.code === 'storage/unauthorized') {
        toast.error('Permission denied when uploading receipt. Please contact support.');
      } else {
        toast.error('Failed to submit receipt. Please try again later.');
      }
    }finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload Payment Receipt</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Amount ($)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter payment amount"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF0059]"
            step="0.01"
            min="0.01"
            required
          />
        </div>
        
        {/* Reference Number Input */}
        <div>
          <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Reference Number
          </label>
          <input
            type="text"
            id="referenceNumber"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Enter payment reference number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF0059]"
            required
          />
        </div>
        
        {/* Receipt Image Upload */}
        <div>
          <label htmlFor="receiptImage" className="block text-sm font-medium text-gray-700 mb-1">
            Receipt Image
          </label>
          <input
            type="file"
            id="receiptImage"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            required
          />
          <div className="flex items-center mt-1">
            <label
              htmlFor="receiptImage"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200"
            >
              {receiptFile ? 'Change Image' : 'Select Image'}
            </label>
            {receiptFile && (
              <span className="ml-3 text-sm text-gray-600 truncate max-w-xs">
                {receiptFile.name}
              </span>
            )}
          </div>
        </div>
        
        {/* Image Preview */}
        {previewUrl && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 mb-1">Receipt Preview</p>            <div className="border border-gray-300 rounded-md p-2 max-w-md">
              <div className="relative h-64 w-full flex items-center justify-center">
                {/* Use regular img for data URL previews */}
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Receipt Preview"
                    className="max-h-64 object-contain mx-auto"
                    style={{ maxWidth: "100%" }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 bg-[#FF0059] text-white rounded-md ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#D9004D]'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Receipt for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}

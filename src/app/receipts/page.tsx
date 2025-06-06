"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useUserBalance } from "../components/UserBalanceContext";
import UserReceiptList from "../components/UserReceiptList";
import ReceiptUploadForm from "../components/ReceiptUploadForm";
import Image from "next/image";
import { ActivityService } from "@/services/activityService";
import { toast } from "react-hot-toast";

export default function ReceiptsPage() {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { balance } = useUserBalance();
  const { user } = useAuth();

  const handleWithdraw = async () => {
    if (!user || !balance || balance <= 0) {
      toast.error("No funds available to withdraw");
      return;
    }

    try {
      // Create withdrawal request activity
      await ActivityService.createActivity({
        userId: user.uid,
        userDisplayName: user.displayName || user.email || "Unknown User",
        type: "withdrawal_request",
        details: {
          amount: balance
        },
        status: "pending"
      });
      toast.success("Withdrawal request submitted successfully.");
    } catch (error) {
      console.error("Error submitting withdrawal request:", error);
      toast.error("Failed to submit withdrawal request. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access this page</p>
          <Link href="/login" className="mt-4 inline-block px-4 py-2 bg-[#FF0059] text-white rounded-md">
            Log In
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white pt-16">
      
      <div className="p-6">
        <h1 className="text-xl font-medium mb-6 text-gray-900">Account</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <Link href="/profile" className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium">
            General
          </Link>
          <Link href="/receipts" className="px-4 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-medium -mb-[2px]">
            Wallet
          </Link>
          <Link href="/stock" className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium">
            Buy stock
          </Link>
          <Link href="/stock/inventory" className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium">
            Inventory
          </Link>
          <Link href="/stock/listings" className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium">
            My Listings
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-l-4 border-[#FF0059] flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-gray-500">
              CURRENT BALANCE
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              ${balance.toFixed(2)}
            </p>
          </div>
          <button
            className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium hover:bg-[#e00051] flex items-center"
            onClick={handleWithdraw}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Withdraw
          </button>
          <div className="text-sm text-gray-600">
            Add funds to your account by uploading a payment receipt below
          </div>
        </div>
        
        {/* Three-column deposit process with bank details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left column - Bank Details */}
          <div className="bg-white p-6 rounded-md shadow-sm">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-800 uppercase mb-4">
                STEP 1: TRANSFER TO OUR ACCOUNT
              </h3>
              <div className="space-y-2">
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-800 mb-2">USDT Payment Option:</p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Your USDT TRC20 Wallet Address:</span>
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Wallet Address:</span>
                  </p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 select-all mb-3">
                    TSTRhivi8wpe22LR3eHTo3ZEkTZyZmLipd
                  </p>
                  <div className="flex justify-center my-3">
                    <Image 
                      src="/USDT_QR.png" 
                      alt="USDT QR Code" 
                      width={300}
                      height={300}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-800 uppercase mb-4">
                STEP 2: ADD REFERENCE CODE (OPTIONAL)
              </h3>
              <div className="flex items-start mb-2">
                <span className="text-amber-500 mr-2 text-lg font-bold"></span>
                <p className="text-sm text-gray-900">
                  You can optionally add your unique user ID or username in your bank&apos;s transfer reference/message field to help us identify your deposit faster.
                </p>
              </div>
              <p className="text-sm text-gray-900 mb-4">
                While not required, this can help speed up the approval process.
              </p>

              <div className="mb-2">
                <p className="text-xs uppercase text-gray-800 font-semibold">
                  EXAMPLE:
                </p>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                John DOE
              </p>
            </div>
          </div>

          {/* Right column - Receipt Management */}
          <div className="bg-white p-6 rounded-md shadow-sm">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-800 uppercase mb-4">
                STEP 3: SUBMIT PROOF
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-900 font-semibold">
                  After transferring:
                </p>
                <ul className="list-disc ml-5 text-sm text-gray-900">
                  <li>Upload your receipt</li>
                  <li>
                    Wait for admin approval{" "}
                    <span className="text-xs text-gray-700">
                      (USUALLY WITHIN 24 HOURS)
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Receipt Management Tabs */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex mb-4">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "upload"
                      ? "text-[#FF0059] border-b-2 border-[#FF0059]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Upload Receipt
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "history"
                      ? "text-[#FF0059] border-b-2 border-[#FF0059]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Receipt History
                </button>
              </div>

              {activeTab === "upload" ? (
                <ReceiptUploadForm />
              ) : (
                <UserReceiptList />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

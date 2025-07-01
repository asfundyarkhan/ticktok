"use client";

import Image from "next/image";

export default function USDTPaymentInfo() {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">
        USDT Payment Details
      </h4>
      <p className="text-sm text-gray-900">
        <span className="font-semibold">USDT TRC20 Wallet Address:</span>
      </p>
      <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 select-all mb-3 break-all">
        TSTRhivi8wpe22LR3eHTo3ZEkTZyZmLipd
      </p>
      <div className="flex justify-center my-3">
        <Image 
          src="/USDT_QR.png" 
          alt="USDT QR Code" 
          width={200}
          height={200}
          className="object-contain max-w-full w-32 h-32 sm:w-40 sm:h-40"
        />
      </div>
      <div className="mt-3 p-3 bg-blue-100 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Important:</strong> Please ensure you transfer the exact amount and upload
          the receipt for verification. Include your user ID in the transfer reference if possible.
        </p>
      </div>
    </div>
  );
}

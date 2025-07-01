"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OldReceiptsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/receipts-v2");
  }, [router]);
  
  // This content will be shown while the redirect is happening
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0059] mx-auto"></div>
        <h2 className="text-xl font-medium text-gray-800 mb-2">Redirecting to New Receipts Page</h2>
        <p className="text-gray-600 mb-4">Please wait...</p>
        <a 
          href="/receipts-v2"
          className="text-[#FF0059] underline"
        >
          Click here if you&apos;re not redirected automatically
        </a>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-3xl font-bold text-red-500 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        We apologize for the inconvenience. Please try again later.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}

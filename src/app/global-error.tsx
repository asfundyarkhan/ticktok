"use client";

import Link from "next/link";

export default function Custom500() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-4xl font-bold text-pink-600 mb-2">500</h1>
      <h2 className="text-2xl font-semibold mb-4">Server Error</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        We're experiencing some technical difficulties. Please try again later.
      </p>
      <Link
        href="/"
        className="px-6 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}

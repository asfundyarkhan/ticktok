"use client";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-pink-500"></div>
    </div>
  );
}

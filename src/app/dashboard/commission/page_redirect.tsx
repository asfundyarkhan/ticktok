"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "../../components/Loading";

export default function CommissionDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new transaction dashboard
    router.replace("/dashboard/transactions");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-600 font-medium">
          Redirecting to Transaction Dashboard...
        </p>
        <p className="mt-2 text-sm text-slate-500">
          The Commission Dashboard has been renamed to Transaction Dashboard for better clarity.
        </p>
      </div>
    </div>
  );
}

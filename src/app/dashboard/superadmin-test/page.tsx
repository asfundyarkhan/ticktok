"use client";

import { useAuth } from "../../../context/AuthContext";
import { SuperAdminRoute } from "../../components/SuperAdminRoute";
import Link from "next/link";

// Component to test superadmin-only access
function SuperAdminTestContent() {
  const { userProfile } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Superadmin-Only Access Testing
      </h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Current User</h2>
        <p className="mb-2">Email: {userProfile?.email || "Not logged in"}</p>
        <p className="mb-2">Role: {userProfile?.role || "No role"}</p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Navigation</h2>
        <ul className="space-y-3">
          <li>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Back to Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/admin-test"
              className="text-blue-600 hover:underline"
            >
              Admin Test Page (Admin/Superadmin)
            </Link>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="font-medium">
          This page is only accessible by superadmins!
        </p>
        <p className="text-sm mt-2">
          If you can see this, you have superadmin privileges.
        </p>
      </div>
    </div>
  );
}

// Export a wrapper component that applies the SuperAdminRoute protection
export default function SuperAdminTestPage() {
  return (
    <SuperAdminRoute>
      <SuperAdminTestContent />
    </SuperAdminRoute>
  );
}

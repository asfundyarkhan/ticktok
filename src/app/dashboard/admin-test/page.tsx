"use client";

import { useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { SuperAdminRoute } from "../../components/SuperAdminRoute";
import { AdminRoute } from "../../components/AdminRoute";
import Link from "next/link";

// Component to test role-based routing
function AdminTestContent() {
  const { userProfile } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Role-Based Access Testing</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Current User</h2>
        <p className="mb-2">Email: {userProfile?.email || "Not logged in"}</p>
        <p className="mb-2">Role: {userProfile?.role || "No role"}</p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Permission Test Links</h2>
        <ul className="space-y-3">
          <li>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Main Dashboard (Admin/Superadmin)
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/admin"
              className="text-blue-600 hover:underline"
            >
              Admin Page (Superadmin only)
            </Link>
          </li>
          <li>
            <Link href="/store" className="text-blue-600 hover:underline">
              Store (All users)
            </Link>
          </li>
        </ul>
      </div>

      <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
        <p className="font-medium">
          This page is accessible by both admins and superadmins
        </p>
      </div>
    </div>
  );
}

// Export a wrapper component that applies the AdminRoute protection
export default function AdminTestPage() {
  return (
    <AdminRoute>
      <AdminTestContent />
    </AdminRoute>
  );
}

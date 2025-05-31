"use client";

import Sidebar from "../components/Sidebar";
import { AdminRoute } from "../components/AdminRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4">
            {children}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}

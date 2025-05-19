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
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </AdminRoute>
  );
}

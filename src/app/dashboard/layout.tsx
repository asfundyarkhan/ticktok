"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              iconTheme: {
                primary: "#4ade80",
                secondary: "#fff",
              },
            },
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

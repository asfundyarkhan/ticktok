"use client";

import { useState } from "react";
import { UserService } from "../../../services/userService";
import { useAuth } from "../../../context/AuthContext";
import { AdminRoute } from "../../components/AdminRoute";
import { LoadingSpinner } from "../../components/Loading";

function RoleManagerContent() {
  // Only use the loading state from useAuth
  const { loading } = useAuth();const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "seller" | "admin" | "superadmin">("user");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: "Please enter an email", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      // First, find the user by email to get their uid
      const userByEmail = await UserService.getUserByEmail(email);
      
      if (!userByEmail) {
        throw new Error(`User with email ${email} not found`);
      }
      
      // Update the user's role based on the selected role
      if (role === "seller") {
        // Use the dedicated method for upgrading to seller
        await UserService.upgradeToSeller(userByEmail.uid);
      } else {
        // Use the general update method for other roles
        await UserService.updateUserProfile(userByEmail.uid, { role });
      }
      
      setMessage({
        text: `User ${email} has been updated to ${role} role`,
        type: "success",
      });
      setEmail("");} catch (error: unknown) {
      console.error("Error updating role:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update role";
      setMessage({
        text: `Error: ${errorMessage}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Role Manager</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Update User Role</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "user" | "seller" | "admin" | "superadmin")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="user">User</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Role"}
          </button>
        </form>

        {message.text && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-700">
          <strong>Note:</strong> This page is for testing purposes only. In a
          production environment, role management should have additional
          security measures and validations.
        </p>
      </div>
    </div>
  );
}

export default function RoleManager() {
  return (
    <AdminRoute>
      <RoleManagerContent />
    </AdminRoute>
  );
}

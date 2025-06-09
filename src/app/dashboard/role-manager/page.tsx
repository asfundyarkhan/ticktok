"use client";

import { useState } from "react";
import { UserService } from "../../../services/userService";
import { useAuth } from "../../../context/AuthContext";
import { SuperAdminRoute } from "../../components/SuperAdminRoute";
import { LoadingSpinner } from "../../components/Loading";

function RoleManagerContent() {  // Use both loading and refreshUserProfile from useAuth
  const { loading, userProfile, refreshUserProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "seller" | "admin" | "superadmin">("user");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state for balance management
  const [balanceEmail, setBalanceEmail] = useState("");
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [balanceMessage, setBalanceMessage] = useState({ text: "", type: "" });const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      } else if (role === "admin") {
        // Use the dedicated method for upgrading to admin (includes balance)
        await UserService.upgradeToAdmin(userByEmail.uid);
      } else if (role === "superadmin") {
        // Use the dedicated method for upgrading to superadmin (includes balance)
        await UserService.upgradeToSuperAdmin(userByEmail.uid);
      } else {
        // Use the general update method for user role
        await UserService.updateUserProfile(userByEmail.uid, { role });
      }
        setMessage({
        text: `User ${email} has been updated to ${role} role`,
        type: "success",
      });
      setEmail("");

      // Check if the updated user is the current logged-in user
      // If so, refresh their profile to update navigation immediately
      if (userProfile && userProfile.email === email.toLowerCase()) {
        console.log("Role updated for current user, refreshing profile...");
        try {
          await refreshUserProfile();
          console.log("Current user profile refreshed successfully");
        } catch (refreshError) {
          console.error("Error refreshing current user profile:", refreshError);
          // Don't show error to user since the role update was successful
        }
      }} catch (error: unknown) {
      console.error("Error updating role:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update role";
      setMessage({
        text: `Error: ${errorMessage}`,
        type: "error",
      });    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBalanceUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!balanceEmail) {
      setBalanceMessage({ text: "Please enter an email", type: "error" });
      return;
    }

    setIsUpdatingBalance(true);
    setBalanceMessage({ text: "", type: "" });

    try {
      // First, find the user by email to get their uid
      const userByEmail = await UserService.getUserByEmail(balanceEmail);
      
      if (!userByEmail) {
        throw new Error(`User with email ${balanceEmail} not found`);
      }

      // Check if user is admin or superadmin
      if (userByEmail.role !== 'admin' && userByEmail.role !== 'superadmin') {
        throw new Error(`User ${balanceEmail} is not an admin or superadmin`);
      }
      
      // Update their balance to 99999
      await UserService.ensureAdminBalance(userByEmail.uid);
        setBalanceMessage({
        text: `Admin balance updated for ${balanceEmail} (set to 99999)`,
        type: "success",
      });
      setBalanceEmail("");

      // Check if the updated user is the current logged-in user
      // If so, refresh their profile to update balance immediately
      if (userProfile && userProfile.email === balanceEmail.toLowerCase()) {
        console.log("Balance updated for current user, refreshing profile...");
        try {
          await refreshUserProfile();
          console.log("Current user profile refreshed successfully");
        } catch (refreshError) {
          console.error("Error refreshing current user profile:", refreshError);
          // Don't show error to user since the balance update was successful
        }
      }
    } catch (error: unknown) {
      console.error("Error updating balance:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update balance";
      setBalanceMessage({
        text: `Error: ${errorMessage}`,
        type: "error",
      });
    } finally {
      setIsUpdatingBalance(false);
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
          </div>          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "user" | "seller" | "admin" | "superadmin")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="user">User</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin (includes 99999 balance)</option>
              <option value="superadmin">Superadmin (includes 99999 balance)</option>
            </select>
            {(role === "admin" || role === "superadmin") && (
              <p className="text-sm text-blue-600 mt-1">
                💰 This role includes automatic assignment of 99999 balance for admin purchases
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Role"}
          </button>
        </form>        {message.text && (
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

      {/* Admin Balance Update Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Update Admin Balance</h2>
        <p className="text-sm text-gray-600 mb-4">
          Manually update the balance for existing admin or superadmin accounts to 99999.
        </p>

        <form onSubmit={handleBalanceUpdate}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={balanceEmail}
              onChange={(e) => setBalanceEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
              placeholder="admin@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingBalance}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isUpdatingBalance ? "Updating Balance..." : "Update Balance to 99999"}
          </button>
        </form>

        {balanceMessage.text && (
          <div
            className={`mt-4 p-3 rounded-md ${
              balanceMessage.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {balanceMessage.text}
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
    <SuperAdminRoute>
      <RoleManagerContent />
    </SuperAdminRoute>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { SuperAdminRoute } from "../../components/SuperAdminRoute";
import { UserService } from "../../../services/userService";
import { LoadingSpinner } from "../../components/Loading";

// Modified User interface to match our Firebase structure
interface User {
  uid: string;
  displayName?: string;
  email: string;
  balance: number;
  suspended?: boolean;
}

// Updated CreditInput to use uid instead of sellerId
interface CreditInput {
  uid: string;
  amount: string;
}

// Wrap the content in the AdminPage component
function AdminPageContent() {
  // We don't need userProfile here but we keep the auth hook for later use
  const { } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [creditInput, setCreditInput] = useState<CreditInput>({
    uid: "",
    amount: "",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch seller accounts from Firebase
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const sellers = await UserService.getUsersByRole("seller");

        // Map Firestore data to our User interface
        const formattedSellers = sellers.map((seller) => ({
          uid: seller.uid,
          displayName: seller.displayName || seller.email.split("@")[0],
          email: seller.email,
          balance: seller.balance || 0,
          suspended: seller.suspended || false,
        }));

        setUsers(formattedSellers);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch sellers:", err);
        setError("Failed to load seller accounts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openConfirmation = (user: User) => {
    setSelectedUser(user);
    setShowConfirmation(true);
  };

  const closeConfirmation = () => {
    setShowConfirmation(false);
    setSelectedUser(null);
  };

  // Update to use UserService for updating balance
  const handleCreditChange = async (uid: string) => {
    const amount = parseFloat(creditInput.amount);
    if (isNaN(amount)) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      // Update the user's balance in Firestore
      const newBalance = await UserService.updateUserBalance(uid, amount);

      // Update local state
      setUsers(
        users.map((user) =>
          user.uid === uid
            ? {
                ...user,
                balance: newBalance,
              }
            : user
        )
      );

      setCreditInput({ uid: "", amount: "" });
      closeConfirmation();
    } catch (err) {
      console.error("Failed to update user balance:", err);
      alert("Failed to update credit. Please try again.");
    }
  };

  const toggleSuspension = async (uid: string) => {
    try {
      const user = users.find((u) => u.uid === uid);
      if (!user) return;

      const newSuspendedState = !user.suspended;

      // Update user profile in Firestore
      await UserService.updateUserProfile(uid, {
        suspended: newSuspendedState,
      });

      // Update local state
      setUsers(
        users.map((user) =>
          user.uid === uid
            ? { ...user, suspended: newSuspendedState }
            : user
        )
      );
    } catch (err) {
      console.error("Failed to update suspension status:", err);
      alert("Failed to update user status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Seller Credit Management</h1>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search seller"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700">
            No seller accounts found. To add a seller, use the Role Manager to
            change a user&apos;s role to seller.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.uid}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.displayName || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.uid}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ${user.balance.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          className="pl-8 pr-4 py-1 border border-gray-300 rounded-md w-full focus:outline-none focus:border-pink-500"
                          value={
                            creditInput.uid === user.uid
                              ? creditInput.amount
                              : ""
                          }
                          onChange={(e) =>
                            setCreditInput({
                              uid: user.uid,
                              amount: e.target.value,
                            })
                          }
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (
                            creditInput.uid === user.uid &&
                            creditInput.amount
                          ) {
                            openConfirmation(user);
                          }
                        }}
                        className="whitespace-nowrap text-pink-600 hover:text-pink-900 bg-pink-50 px-3 py-1 rounded-md"
                        disabled={
                          creditInput.uid !== user.uid ||
                          !creditInput.amount
                        }
                      >
                        Add Credit
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!user.suspended}
                        onChange={() => toggleSuspension(user.uid)}
                        className="sr-only"
                      />
                      <div
                        className={`relative inline-block w-10 h-5 rounded-full transition-colors ${
                          user.suspended ? "bg-red-500" : "bg-green-500"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                            user.suspended ? "" : "translate-x-5"
                          }`}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-700">
                        {user.suspended ? "Suspended" : "Active"}
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              Confirm Credit Addition
            </h3>
            <p>
              Are you sure you want to add ${creditInput.amount} to{" "}
              <span className="font-semibold">
                {selectedUser.displayName || selectedUser.email}
              </span>
              &apos;s account?
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeConfirmation}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreditChange(selectedUser.uid)}
                className="px-4 py-2 bg-pink-600 text-white rounded-md text-sm font-medium hover:bg-pink-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export a wrapper component that applies the SuperAdminRoute protection
export default function AdminPage() {
  return (
    <SuperAdminRoute>
      <AdminPageContent />
    </SuperAdminRoute>
  );
}

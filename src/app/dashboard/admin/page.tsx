"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { SuperAdminRoute } from "../../components/SuperAdminRoute";
import { UserService } from "../../../services/userService";
import { LoadingSpinner } from "../../components/Loading";
import toast from "react-hot-toast";
import { WithdrawalRequestService } from "../../../services/withdrawalRequestService";
import WithdrawalNotification from "../../components/WithdrawalNotification";

// Modified User interface to match our Firebase structure
interface User {
  uid: string;
  displayName?: string;
  email: string;
  balance: number;
  suspended?: boolean;
  referralCode?: string;
}

// Updated CreditInput to include operation type
interface CreditInput {
  uid: string;
  amount: string;
  operation: 'add' | 'subtract';
}

// Wrap the content in the AdminPage component
function AdminPageContent() {
  // Get current user for tracking deposits
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");  const [creditInput, setCreditInput] = useState<CreditInput>({
    uid: "",
    amount: "",
    operation: 'add',
  });  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditOperationLoading, setCreditOperationLoading] = useState(false);
  
  // Referral code generation state
  const [generatingReferralCode, setGeneratingReferralCode] = useState(false);
  const [referralCodeGeneratedFor, setReferralCodeGeneratedFor] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Withdrawal requests state
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);
  const [showWithdrawalNotification, setShowWithdrawalNotification] = useState(false);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);

  // Fetch seller accounts from Firebase
  useEffect(() => {
    const fetchSellers = async () => {      try {
        setLoading(true);
        const sellers = await UserService.getUsersByRole("seller");
        // Map Firestore data to our User interface
        const formattedSellers = sellers.map((seller) => ({
          uid: seller.uid,
          displayName: seller.displayName || seller.email.split("@")[0],
          email: seller.email,
          balance: seller.balance || 0,
          suspended: seller.suspended || false,
          referralCode: seller.referralCode || "",
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

  // Fetch pending withdrawals count
  useEffect(() => {
    const fetchPendingWithdrawals = async () => {
      try {
        const unsubscribe = WithdrawalRequestService.subscribeToWithdrawalRequests(
          (requests) => {
            const pendingCount = requests.filter(r => r.status === 'pending').length;
            
            // Show notification if there are new pending requests
            if (previousPendingCount > 0 && pendingCount > previousPendingCount) {
              setShowWithdrawalNotification(true);
            }
            
            setPendingWithdrawalsCount(pendingCount);
            setPreviousPendingCount(pendingCount);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up withdrawal requests subscription:", error);
      }
    };

    fetchPendingWithdrawals();
  }, [previousPendingCount]);

  const filteredUsers = users.filter(
    (user) =>
      (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Pagination controls
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const changeRowsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const openConfirmation = (user: User) => {
    setSelectedUser(user);
    setShowConfirmation(true);
  };

  const closeConfirmation = () => {
    setShowConfirmation(false);
    setSelectedUser(null);
  };  // Handle both adding and subtracting credits
  const handleCreditChange = async (uid: string) => {
    const amount = parseFloat(creditInput.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    setCreditOperationLoading(true);
    const loadingToast = toast.loading(`${creditInput.operation === 'add' ? 'Adding' : 'Subtracting'} credits...`);

    try {
      let newBalance: number;
      let commissionMessage = "";
      
      if (creditInput.operation === 'add') {
        // Add credits using new method that tracks commissions
        const result = await UserService.addUserBalance(
          uid, 
          amount, 
          user?.uid || "unknown", // depositedBy (current admin/superadmin)
          `Admin deposit by ${user?.email || "admin"}`
        );
        
        if (result.success && result.newBalance !== undefined) {
          newBalance = result.newBalance;
          if (result.commissionPaid && result.commissionPaid > 0) {
            commissionMessage = ` (Commission paid: $${result.commissionPaid.toFixed(2)})`;
          }
        } else {
          throw new Error(result.message);
        }
      } else {
        // Subtract credits using existing method
        newBalance = await UserService.subtractUserBalance(uid, amount);
      }

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

      setCreditInput({ uid: "", amount: "", operation: 'add' });
      closeConfirmation();
      
      const operationText = creditInput.operation === 'add' ? 'added to' : 'subtracted from';
      toast.dismiss(loadingToast);
      toast.success(`Successfully ${operationText} user balance. New balance: $${newBalance.toFixed(2)}${commissionMessage}`, {
        duration: 4000,
      });
    } catch (err) {
      console.error("Failed to update user balance:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      toast.dismiss(loadingToast);
      toast.error(`Failed to update credit: ${errorMessage}`);
    } finally {
      setCreditOperationLoading(false);
    }
  };
  const toggleSuspension = async (uid: string) => {
    try {
      const user = users.find((u) => u.uid === uid);
      if (!user) return;

      const newSuspendedState = !user.suspended;
      const loadingToast = toast.loading(`${newSuspendedState ? 'Suspending' : 'Unsuspending'} user...`);

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

      toast.dismiss(loadingToast);
      toast.success(`User ${newSuspendedState ? 'suspended' : 'unsuspended'} successfully`);
    } catch (err) {
      console.error("Failed to update suspension status:", err);
      toast.error("Failed to update user status. Please try again.");
    }
  };
  // Function to generate a referral code for a user
  const generateReferralCode = async (uid: string) => {
    try {
      setGeneratingReferralCode(true);
      setReferralCodeGeneratedFor(uid);
      const loadingToast = toast.loading("Generating referral code...");
      
      // Generate a referral code through the UserService
      const code = await UserService.generateReferralCode(uid);
      
      // Update the user in the local state
      setUsers(
        users.map((user) =>
          user.uid === uid
            ? { ...user, referralCode: code }
            : user
        )
      );
      
      // Show a success message
      toast.dismiss(loadingToast);
      toast.success(`Referral code generated successfully: ${code}`, {
        duration: 4000,
      });
    } catch (error) {
      console.error("Error generating referral code:", error);
      toast.error("Failed to generate referral code. Please try again.");
    } finally {
      setGeneratingReferralCode(false);
      setReferralCodeGeneratedFor(null);
    }
  };

  const navigateToReceipts = () => {
    window.location.href = "/dashboard/admin/receipts";
  };

  const navigateToWithdrawals = () => {
    window.location.href = "/dashboard/admin/withdrawals";
  };

  const handleDismissWithdrawalNotification = () => {
    setShowWithdrawalNotification(false);
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
    <div className="p-4 sm:p-6">
      {/* Withdrawal Notification */}
      <WithdrawalNotification
        newRequestsCount={showWithdrawalNotification ? pendingWithdrawalsCount : 0}
        onDismiss={handleDismissWithdrawalNotification}
        onViewRequests={navigateToWithdrawals}
      />
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Seller Management</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={navigateToReceipts}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
          >
            Manage Payment Receipts
          </button>
          <button
            onClick={navigateToWithdrawals}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 relative"
          >
            Withdrawal Requests
            {pendingWithdrawalsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingWithdrawalsCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search seller"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700">            No seller accounts found. To add a seller, use the Role Manager to
            change a user&apos;s role to seller.
          </p>
        </div>      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">{paginatedUsers.map((user) => (
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
                    <td className="px-6 py-4 text-sm">
                      {user.referralCode ? (
                        <div className="flex items-center">
                          <span className="font-medium text-pink-600">{user.referralCode}</span>                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(user.referralCode || "");
                              toast.success("Referral code copied to clipboard!");
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                            title="Copy to clipboard"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateReferralCode(user.uid)}
                          className="text-pink-600 hover:text-pink-800 font-medium bg-pink-50 px-2 py-1 rounded-md text-xs"
                          disabled={generatingReferralCode && referralCodeGeneratedFor === user.uid}
                        >
                          {generatingReferralCode && referralCodeGeneratedFor === user.uid ? (
                            <span className="flex items-center">
                              <LoadingSpinner size="sm" />
                              <span className="ml-1">Generating...</span>
                            </span>
                          ) : (
                            "Generate Code"
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1" style={{ minWidth: "120px", width: "100%" }}>
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Amount"
                            className="pl-8 pr-4 py-1 border border-gray-300 rounded-md w-full focus:outline-none focus:border-pink-500"
                            style={{ minWidth: "120px" }}                            value={
                              creditInput.uid === user.uid
                                ? creditInput.amount
                                : ""
                            }
                            onChange={(e) =>
                              setCreditInput({
                                uid: user.uid,
                                amount: e.target.value,
                                operation: creditInput.operation,
                              })
                            }
                          />
                        </div>
                        
                        {/* Operation Selection */}
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => setCreditInput({
                              ...creditInput,
                              uid: user.uid,
                              operation: 'add'
                            })}
                            className={`px-3 py-1 text-sm rounded ${
                              creditInput.uid === user.uid && creditInput.operation === 'add'
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setCreditInput({
                              ...creditInput,
                              uid: user.uid,
                              operation: 'subtract'
                            })}
                            className={`px-3 py-1 text-sm rounded ${
                              creditInput.uid === user.uid && creditInput.operation === 'subtract'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Subtract
                          </button>
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
                          className={`whitespace-nowrap px-3 py-1 rounded-md ${
                            creditInput.uid === user.uid && creditInput.operation === 'add'
                              ? 'text-green-600 hover:text-green-900 bg-green-50'
                              : creditInput.uid === user.uid && creditInput.operation === 'subtract'
                              ? 'text-red-600 hover:text-red-900 bg-red-50'
                              : 'text-pink-600 hover:text-pink-900 bg-pink-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={
                            creditInput.uid !== user.uid ||
                            !creditInput.amount ||
                            creditOperationLoading
                          }
                        >
                          {creditOperationLoading && creditInput.uid === user.uid ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </div>
                          ) : (
                            creditInput.uid === user.uid && creditInput.operation === 'subtract' 
                              ? 'Subtract Credit' 
                              : 'Add Credit'
                          )}
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

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {paginatedUsers.map((user) => (
              <div key={user.uid} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex flex-col space-y-4">
                  {/* User Info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {user.displayName || "Unknown"}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: {user.uid}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${user.balance.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500">Balance</p>
                    </div>
                  </div>

                  {/* Referral Code Section */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Referral Code
                    </p>
                    {user.referralCode ? (
                      <div className="flex items-center justify-between bg-gray-50 rounded-md p-2">
                        <span className="font-medium text-pink-600">{user.referralCode}</span>                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.referralCode || "");
                            toast.success("Referral code copied to clipboard!");
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateReferralCode(user.uid)}
                        className="w-full text-pink-600 hover:text-pink-800 font-medium bg-pink-50 px-3 py-2 rounded-md text-sm border border-pink-200"
                        disabled={generatingReferralCode && referralCodeGeneratedFor === user.uid}
                      >
                        {generatingReferralCode && referralCodeGeneratedFor === user.uid ? (
                          <span className="flex items-center justify-center">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Generating...</span>
                          </span>
                        ) : (
                          "Generate Code"
                        )}
                      </button>
                    )}
                  </div>                  {/* Add/Subtract Credit Section */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Manage Credit
                    </p>
                    
                    {/* Operation Selection for Mobile */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setCreditInput({
                          ...creditInput,
                          uid: user.uid,
                          operation: 'add'
                        })}
                        className={`flex-1 px-3 py-2 text-sm rounded ${
                          creditInput.uid === user.uid && creditInput.operation === 'add'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setCreditInput({
                          ...creditInput,
                          uid: user.uid,
                          operation: 'subtract'
                        })}
                        className={`flex-1 px-3 py-2 text-sm rounded ${
                          creditInput.uid === user.uid && creditInput.operation === 'subtract'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Subtract
                      </button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          className="pl-8 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:border-pink-500"
                          value={
                            creditInput.uid === user.uid
                              ? creditInput.amount
                              : ""
                          }
                          onChange={(e) =>
                            setCreditInput({
                              uid: user.uid,
                              amount: e.target.value,
                              operation: creditInput.operation,
                            })
                          }
                        />
                      </div>                      <button
                        onClick={() => {
                          if (
                            creditInput.uid === user.uid &&
                            creditInput.amount
                          ) {
                            openConfirmation(user);
                          }
                        }}
                        className={`px-4 py-2 rounded-md font-medium border ${
                          creditInput.uid === user.uid && creditInput.operation === 'add'
                            ? 'text-green-600 hover:text-green-900 bg-green-50 border-green-200'
                            : creditInput.uid === user.uid && creditInput.operation === 'subtract'
                            ? 'text-red-600 hover:text-red-900 bg-red-50 border-red-200'
                            : 'text-pink-600 hover:text-pink-900 bg-pink-50 border-pink-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={
                          creditInput.uid !== user.uid ||
                          !creditInput.amount ||
                          creditOperationLoading
                        }
                      >
                        {creditOperationLoading && creditInput.uid === user.uid ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          creditInput.uid === user.uid && creditInput.operation === 'subtract' 
                            ? 'Subtract' 
                            : 'Add'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Account Status
                    </p>
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
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {user.suspended ? "Suspended" : "Active"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>          {/* Pagination controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 px-2 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={changeRowsPerPage}
                className="border border-gray-300 rounded py-1 px-2 text-sm min-w-[60px] appearance-none bg-white"
                style={{ paddingRight: "24px" }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <div className="relative" style={{ marginLeft: "-20px", pointerEvents: "none" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
              <span className="text-sm text-gray-700 sm:mr-4 text-center sm:text-left">
                Page {currentPage} of {totalPages || 1}
                {" | "}
                Showing {paginatedUsers.length} of {filteredUsers.length} sellers
              </span>
              <div className="flex justify-center sm:justify-start space-x-1">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-pink-600 hover:bg-pink-50"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                  className={`p-2 rounded-md ${
                    currentPage >= totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-pink-600 hover:bg-pink-50"
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}      {/* Confirmation Dialog */}
      {showConfirmation && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full mx-4">            <h3 className="text-lg font-medium mb-4">
              Confirm Credit {creditInput.operation === 'add' ? 'Addition' : 'Subtraction'}
            </h3>
            <p className="text-sm sm:text-base">
              Are you sure you want to {creditInput.operation === 'add' ? 'add' : 'subtract'} ${creditInput.amount} {creditInput.operation === 'add' ? 'to' : 'from'}{" "}              <span className="font-semibold">
                {selectedUser.displayName || selectedUser.email}
              </span>
              &apos;s account?
            </p>
            
            {creditInput.operation === 'subtract' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will reduce the seller&apos;s balance, but will not affect the Total Referral Balance displayed to admins (it only increases).
                </p>
              </div>
            )}            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={closeConfirmation}
                disabled={creditOperationLoading}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreditChange(selectedUser.uid)}
                disabled={creditOperationLoading}
                className="w-full sm:w-auto px-4 py-2 bg-pink-600 text-white rounded-md text-sm font-medium hover:bg-pink-700 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creditOperationLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Confirm'
                )}
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
  // Add debugging to help identify when admin page renders
  console.log('Admin page component mounted');
  
  // Store in localStorage that we reached the admin page component
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_page_loaded', 'true');
    localStorage.setItem('admin_page_loaded_time', new Date().toString());
  }    return (
    <SuperAdminRoute>
      <AdminPageContent />
    </SuperAdminRoute>
  );
}

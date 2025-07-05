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
import RecentActivityPanel from "../../components/RecentActivityPanel";

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
          displayName: seller.displayName || seller.email.split("@")[0] || `User_${seller.uid.slice(-6)}`,
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
      let transactionMessage = "";
      
      if (creditInput.operation === 'add') {
        // Add credits using new method that tracks transactions
        const result = await UserService.addUserBalance(
          uid, 
          amount, 
          user?.uid || "unknown", // depositedBy (current admin/superadmin)
          `Admin deposit by ${user?.email || "admin"}`
        );
        
        if (result.success && result.newBalance !== undefined) {
          newBalance = result.newBalance;
          if (result.commissionPaid && result.commissionPaid > 0) {
            transactionMessage = ` (Transaction fee paid: $${result.commissionPaid.toFixed(2)})`;
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
      toast.success(`Successfully ${operationText} user balance. New balance: $${newBalance.toFixed(2)}${transactionMessage}`, {
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
      const targetUser = users.find((u) => u.uid === uid);
      if (!targetUser) return;

      const newSuspendedState = !targetUser.suspended;
      const loadingToast = toast.loading(`${newSuspendedState ? 'Suspending' : 'Unsuspending'} user...`);

      // Update user profile in Firestore with admin info for activity logging
      await UserService.updateUserProfile(
        uid, 
        {
          suspended: newSuspendedState,
        },
        user?.uid, // Current admin's UID
        user?.email || user?.displayName || "Admin" // Current admin's name
      );

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

  const navigateToMigration = () => {
    window.location.href = "/dashboard/admin/migration";
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
          <button
            onClick={navigateToMigration}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Migration Tools
          </button>
        </div>
      </div>
      
      {/* Dashboard Summary Section - 2x2 Grid Layout */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Top Left: Total Earnings */}
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start space-x-3 lg:space-x-4 mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 118 0H9l-1 1H8m6-1h1a3 3 0 118 0h-2m-4-4v4m0-4V4a1 1 0 011-1h2a1 1 0 011 1v4M9 4h6m-6 0V3m6 1V3" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">Total Earnings</h3>
                <p className="text-xs lg:text-sm text-gray-500">Your accumulated transaction earnings</p>
              </div>
            </div>
            
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-baseline space-x-2 lg:space-x-3">
                <span className="text-2xl lg:text-4xl font-bold text-green-600">
                  ${users.reduce((sum, u) => sum + u.balance, 0).toFixed(2)}
                </span>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="text-xs lg:text-sm font-medium text-green-600">+12.5%</span>
                </div>
              </div>
              
              <p className="text-xs lg:text-sm text-gray-600 mb-4 lg:mb-6">From deposits and receipt approvals • Updated in real-time</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="bg-blue-50 p-3 lg:p-4 rounded-xl">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xs lg:text-sm">$</span>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm font-medium text-gray-700">Admin Deposit</p>
                      <p className="text-sm lg:text-lg font-bold text-gray-900">$0.00</p>
                      <p className="text-xs text-gray-500">From manual deposits</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-3 lg:p-4 rounded-xl">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 lg:w-4 lg:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm font-medium text-gray-700">Receipt Approval</p>
                      <p className="text-sm lg:text-lg font-bold text-gray-900">${users.reduce((sum, u) => sum + u.balance, 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">From approved receipts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: Monthly Revenue */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Monthly Revenue</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">2026</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-600 p-4 rounded-xl text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">July 2025</span>
                  <span className="text-sm">54 transactions</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Revenue</p>
                    <p className="text-2xl font-bold">$9,351.18</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">$9,351.18</p>
                    <p className="text-xs opacity-75">Avg: $173.17</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Last updated: 05/07/2025</span>
              </div>
            </div>
          </div>

          {/* Bottom Left: User ID & Total Earnings */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">User ID</h3>
              <div className="inline-block">
                <span className="text-2xl font-bold text-pink-500 bg-pink-50 px-3 py-1 rounded-lg">
                  {user?.uid?.slice(0, 8) || 'DysgDHFt'}
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-3">
                    <div className="grid grid-cols-3 gap-4">
                      <span>DATE</span>
                      <span>ACTIVITY</span>
                      <span>STATUS</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 118 0H9l-1 1H8m6-1h1a3 3 0 118 0h-2m-4-4v4m0-4V4a1 1 0 011-1h2a1 1 0 011 1v4M9 4h6m-6 0V3m6 1V3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Total Earnings</h4>
                    <p className="text-sm text-gray-600 mb-2">Your accumulated transaction earnings</p>
                    <div className="flex items-baseline space-x-3 mb-2">
                      <span className="text-3xl font-bold text-green-600">$9351.18</span>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="text-sm font-medium text-green-600">+12.5%</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">From deposits and receipt approvals Updated in real-time</p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-xs">$</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">Admin Deposit</p>
                            <p className="text-lg font-bold text-gray-900">$0.00</p>
                            <p className="text-xs text-gray-500">From manual deposits</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                            <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">Transactions</p>
                            <p className="text-lg font-bold text-gray-900">54</p>
                            <p className="text-xs text-gray-500">Last 03/07/2025</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-200 text-green-800 px-2 py-1 rounded-md text-xs font-medium mb-2">
                      Active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right: Recent Activity */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              <div className="space-y-1">
                <div className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-3">
                  <div className="grid grid-cols-3 gap-4">
                    <span>DATE</span>
                    <span>ACTIVITY</span>
                    <span>STATUS</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <RecentActivityPanel maxItems={3} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search seller by name, email, or ID..."
            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Showing {filteredUsers.length} of {users.length} sellers matching &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      {users.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700">            No seller accounts found. To add a seller, use the Role Manager to
            change a user&apos;s role to seller.
          </p>
        </div>      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seller Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referral Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Management
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-pink-600">
                                {user.displayName?.charAt(0) || user.email.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400 font-mono">
                              {user.uid.slice(0, 8)}...{user.uid.slice(-4)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${user.balance.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.referralCode ? (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              {user.referralCode}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(user.referralCode || "");
                                toast.success("Referral code copied!");
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Copy to clipboard"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => generateReferralCode(user.uid)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-pink-700 bg-pink-100 hover:bg-pink-200 transition-colors"
                            disabled={generatingReferralCode && referralCodeGeneratedFor === user.uid}
                          >
                            {generatingReferralCode && referralCodeGeneratedFor === user.uid ? (
                              <>
                                <LoadingSpinner size="sm" />
                                <span className="ml-1">Generating...</span>
                              </>
                            ) : (
                              "Generate"
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {/* Operation Selection */}
                          <div className="flex rounded-md shadow-sm">
                            <button
                              onClick={() => setCreditInput({
                                ...creditInput,
                                uid: user.uid,
                                operation: 'add'
                              })}
                              className={`relative inline-flex items-center px-3 py-1 rounded-l-md border text-xs font-medium ${
                                creditInput.uid === user.uid && creditInput.operation === 'add'
                                  ? 'bg-green-100 border-green-300 text-green-700'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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
                              className={`relative inline-flex items-center px-3 py-1 rounded-r-md border text-xs font-medium ${
                                creditInput.uid === user.uid && creditInput.operation === 'subtract'
                                  ? 'bg-red-100 border-red-300 text-red-700'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Subtract
                            </button>
                          </div>
                          
                          {/* Amount Input */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="block w-20 pl-7 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                              value={creditInput.uid === user.uid ? creditInput.amount : ""}
                              onChange={(e) =>
                                setCreditInput({
                                  uid: user.uid,
                                  amount: e.target.value,
                                  operation: creditInput.operation,
                                })
                              }
                            />
                          </div>
                          
                          {/* Action Button */}
                          <button
                            onClick={() => {
                              if (creditInput.uid === user.uid && creditInput.amount) {
                                openConfirmation(user);
                              }
                            }}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md transition-colors ${
                              creditInput.uid === user.uid && creditInput.operation === 'add'
                                ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                : creditInput.uid === user.uid && creditInput.operation === 'subtract'
                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                : 'text-pink-700 bg-pink-100 hover:bg-pink-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={
                              creditInput.uid !== user.uid ||
                              !creditInput.amount ||
                              creditOperationLoading
                            }
                          >
                            {creditOperationLoading && creditInput.uid === user.uid ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
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
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {paginatedUsers.map((user) => (
              <div key={user.uid} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 space-y-4">
                  {/* User Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-pink-600">
                          {user.displayName?.charAt(0) || user.email.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {user.displayName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${user.balance.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500">Balance</p>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">ID:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {user.uid.slice(0, 8)}...{user.uid.slice(-4)}
                    </span>
                  </div>

                  {/* Referral Code Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referral Code
                      </p>
                      {user.referralCode && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.referralCode || "");
                            toast.success("Referral code copied!");
                          }}
                          className="p-1 text-pink-600 hover:text-pink-800 hover:bg-pink-50 rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {user.referralCode ? (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 border border-pink-200">
                        {user.referralCode}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">No code generated</span>
                        <button
                          onClick={() => generateReferralCode(user.uid)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-pink-700 bg-pink-100 hover:bg-pink-200 transition-colors"
                          disabled={generatingReferralCode && referralCodeGeneratedFor === user.uid}
                        >
                          {generatingReferralCode && referralCodeGeneratedFor === user.uid ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-1">Generating...</span>
                            </>
                          ) : (
                            "Generate"
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Credit Management Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Credit Management
                    </p>
                    
                    {/* Operation Selection */}
                    <div className="flex rounded-lg border border-gray-200 mb-3">
                      <button
                        onClick={() => setCreditInput({
                          ...creditInput,
                          uid: user.uid,
                          operation: 'add'
                        })}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                          creditInput.uid === user.uid && creditInput.operation === 'add'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Add Credit
                      </button>
                      <button
                        onClick={() => setCreditInput({
                          ...creditInput,
                          uid: user.uid,
                          operation: 'subtract'
                        })}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg border-l transition-colors ${
                          creditInput.uid === user.uid && creditInput.operation === 'subtract'
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Subtract Credit
                      </button>
                    </div>
                    
                    {/* Amount Input and Action */}
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Enter amount"
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          value={creditInput.uid === user.uid ? creditInput.amount : ""}
                          onChange={(e) =>
                            setCreditInput({
                              uid: user.uid,
                              amount: e.target.value,
                              operation: creditInput.operation,
                            })
                          }
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (creditInput.uid === user.uid && creditInput.amount) {
                            openConfirmation(user);
                          }
                        }}
                        className={`px-6 py-2 rounded-md font-medium transition-colors ${
                          creditInput.uid === user.uid && creditInput.operation === 'add'
                            ? 'text-green-700 bg-green-100 hover:bg-green-200 border border-green-300'
                            : creditInput.uid === user.uid && creditInput.operation === 'subtract'
                            ? 'text-red-700 bg-red-100 hover:bg-red-200 border border-red-300'
                            : 'text-pink-700 bg-pink-100 hover:bg-pink-200 border border-pink-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={
                          creditInput.uid !== user.uid ||
                          !creditInput.amount ||
                          creditOperationLoading
                        }
                      >
                        {creditOperationLoading && creditInput.uid === user.uid ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          className={`relative inline-block w-11 h-6 rounded-full transition-colors ${
                            user.suspended ? "bg-red-500" : "bg-green-500"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transform transition-transform ${
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
              </div>
            ))}
          </div>          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 bg-white rounded-lg border border-gray-200 p-4 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Show:</span>
                <select
                  value={rowsPerPage}
                  onChange={changeRowsPerPage}
                  className="border border-gray-300 rounded-md py-1 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * rowsPerPage) + 1}</span> to{" "}
                <span className="font-medium">{Math.min(currentPage * rowsPerPage, filteredUsers.length)}</span> of{" "}
                <span className="font-medium">{filteredUsers.length}</span> sellers
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages || 1}</span>
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50 hover:text-pink-600"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors ${
                    currentPage >= totalPages
                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50 hover:text-pink-600"
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}      {/* Confirmation Dialog */}
      {showConfirmation && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Confirm Credit {creditInput.operation === 'add' ? 'Addition' : 'Subtraction'}
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-pink-600">
                    {selectedUser.displayName?.charAt(0) || selectedUser.email.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedUser.displayName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Current Balance:</span>
                  <span className="text-sm font-semibold text-gray-900">${selectedUser.balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-gray-700">
                    {creditInput.operation === 'add' ? 'Amount to Add:' : 'Amount to Subtract:'}
                  </span>
                  <span className={`text-sm font-semibold ${
                    creditInput.operation === 'add' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {creditInput.operation === 'add' ? '+' : '-'}${creditInput.amount}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">New Balance:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${(selectedUser.balance + (creditInput.operation === 'add' ? 1 : -1) * parseFloat(creditInput.amount || '0')).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {creditInput.operation === 'subtract' && (
                <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This will reduce the seller&apos;s balance, but will not affect the Total Referral Balance displayed to admins (it only increases).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={closeConfirmation}
                disabled={creditOperationLoading}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreditChange(selectedUser.uid)}
                disabled={creditOperationLoading}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
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
                  `Confirm ${creditInput.operation === 'add' ? 'Addition' : 'Subtraction'}`
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
  return (
    <SuperAdminRoute>
      <AdminPageContent />
    </SuperAdminRoute>
  );
}

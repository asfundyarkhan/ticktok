"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminRoute } from "../../../components/SuperAdminRoute";
import { useAuth } from "../../../../context/AuthContext";
import { LoadingSpinner } from "../../../components/Loading";
import toast from "react-hot-toast";
import {
  SellerManagementService,
  SellerInfo,
  AdminInfo,
  MigrationResult,
  DummyAccountResult,
} from "../../../../services/sellerManagementService";
import {
  ArrowRightLeft,
  Search,
  Users,
  Shield,
  ShieldOff,
  History,
  UserCheck,
  UserX,
  Eye,
  RefreshCw,
} from "lucide-react";

export default function SellerManagementPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  
  // Seller data
  const [sellers, setSellers] = useState<SellerInfo[]>([]);
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<SellerInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Migration dialog state
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerInfo | null>(null);
  const [targetAdminId, setTargetAdminId] = useState("");
  const [migrationReason, setMigrationReason] = useState("");
  const [migrationLoading, setMigrationLoading] = useState(false);

  // Dummy account dialog state
  const [dummyDialogOpen, setDummyDialogOpen] = useState(false);
  const [dummyReason, setDummyReason] = useState("");
  const [dummyLoading, setDummyLoading] = useState(false);

  // Seller details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [migrationHistory, setMigrationHistory] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalSellers: 0,
    dummyAccounts: 0,
    sellersWithAdmins: 0,
    sellersWithoutAdmins: 0,
    referredButUnassigned: 0,
  });

  // Load data
  useEffect(() => {
    if (!loading && userProfile?.role === "superadmin") {
      loadData();
    }
  }, [loading, userProfile]);

  // Filter sellers
  useEffect(() => {
    let filtered = sellers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (seller) =>
          seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seller.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seller.currentAdminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seller.currentAdminEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Admin filter
    if (selectedAdmin !== "all") {
      if (selectedAdmin === "none") {
        filtered = filtered.filter((seller) => !seller.currentAdminId);
      } else {
        filtered = filtered.filter((seller) => seller.currentAdminId === selectedAdmin);
      }
    }

    // Account type filter
    if (accountTypeFilter !== "all") {
      if (accountTypeFilter === "dummy") {
        filtered = filtered.filter((seller) => seller.isDummyAccount);
      } else if (accountTypeFilter === "regular") {
        filtered = filtered.filter((seller) => !seller.isDummyAccount);
      }
    }

    setFilteredSellers(filtered);
  }, [sellers, searchTerm, selectedAdmin, accountTypeFilter]);

  // Calculate stats
  useEffect(() => {
    const referredButUnassigned = sellers.filter(
      (s) => !s.currentAdminId && s.referredByAdminId
    ).length;
    
    setStats({
      totalSellers: sellers.length,
      dummyAccounts: sellers.filter((s) => s.isDummyAccount).length,
      sellersWithAdmins: sellers.filter((s) => s.currentAdminId).length,
      sellersWithoutAdmins: sellers.filter((s) => !s.currentAdminId).length,
      referredButUnassigned, // New stat
    });
  }, [sellers]);

  const loadData = async () => {
    try {
      setDataLoading(true);
      const [sellersData, adminsData] = await Promise.all([
        SellerManagementService.getAllSellers(),
        SellerManagementService.getAllAdmins(),
      ]);
      setSellers(sellersData);
      setAdmins(adminsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load seller management data");
    } finally {
      setDataLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await loadData();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleMigration = async () => {
    if (!selectedSeller || !targetAdminId || !migrationReason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setMigrationLoading(true);
      const result: MigrationResult = await SellerManagementService.migrateSeller(
        selectedSeller.id,
        targetAdminId,
        migrationReason
      );

      if (result.success) {
        toast.success(result.message);
        setMigrationDialogOpen(false);
        setTargetAdminId("");
        setMigrationReason("");
        setSelectedSeller(null);
        await loadData(); // Refresh data
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Migration error:", error);
      toast.error("Migration failed. Please try again.");
    } finally {
      setMigrationLoading(false);
    }
  };

  const handleDummyAccountToggle = async () => {
    if (!selectedSeller || !dummyReason.trim()) {
      toast.error("Please provide a reason for this action");
      return;
    }

    try {
      setDummyLoading(true);
      const result: DummyAccountResult = await SellerManagementService.toggleDummyAccount(
        selectedSeller.id,
        !selectedSeller.isDummyAccount,
        dummyReason
      );

      if (result.success) {
        toast.success(result.message);
        setDummyDialogOpen(false);
        setDummyReason("");
        setSelectedSeller(null);
        await loadData(); // Refresh data
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Dummy account toggle error:", error);
      toast.error("Failed to update account status. Please try again.");
    } finally {
      setDummyLoading(false);
    }
  };

  const handleViewDetails = async (seller: SellerInfo) => {
    setSelectedSeller(seller);
    try {
      const history = await SellerManagementService.getSellerMigrationHistory(seller.id);
      setMigrationHistory(history);
    } catch (error) {
      console.error("Error loading migration history:", error);
      setMigrationHistory([]);
    }
    setDetailsDialogOpen(true);
  };

  const openMigrationDialog = (seller: SellerInfo) => {
    setSelectedSeller(seller);
    setMigrationDialogOpen(true);
  };

  const openDummyDialog = (seller: SellerInfo) => {
    setSelectedSeller(seller);
    setDummyDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!userProfile || userProfile.role !== "superadmin") {
    return (
      <SuperAdminRoute>
        <div className="p-4">Loading superadmin content...</div>
      </SuperAdminRoute>
    );
  }

  if (dataLoading) {
    return (
      <div className="p-8 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading seller management data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminRoute>
      <div className="p-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Seller Management</h1>
            <p className="text-gray-600 mt-2">
              Manage seller accounts, admin assignments, and account types
            </p>
          </div>
          <button 
            onClick={refreshData} 
            disabled={refreshing}
            className="px-4 py-2 border rounded-md flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-500">Total Sellers</div>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold mt-2">{stats.totalSellers}</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-500">With Admins</div>
              <UserCheck className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold mt-2">{stats.sellersWithAdmins}</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-500">Without Admins</div>
              <UserX className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold mt-2">{stats.sellersWithoutAdmins}</div>
          </div>

          <div className="border rounded-lg p-4 bg-yellow-50">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-yellow-700">Referred Only</div>
              <History className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold mt-2 text-yellow-700">{stats.referredButUnassigned}</div>
            <div className="text-xs text-yellow-600 mt-1">Referred but no current admin</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-500">Dummy Accounts</div>
              <ShieldOff className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold mt-2">{stats.dummyAccounts}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-4">Filters</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="search"
                  placeholder="Search by seller name, email, or admin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full border rounded-md p-2"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <label htmlFor="admin-filter" className="block text-sm font-medium mb-1">
                Admin
              </label>
              <select 
                id="admin-filter"
                value={selectedAdmin} 
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="all">All Admins</option>
                <option value="none">No Admin</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:w-48">
              <label htmlFor="account-type" className="block text-sm font-medium mb-1">
                Account Type
              </label>
              <select 
                id="account-type"
                value={accountTypeFilter} 
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="all">All Types</option>
                <option value="regular">Regular</option>
                <option value="dummy">Dummy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sellers Table */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Sellers ({filteredSellers.length})</h2>
            <p className="text-sm text-gray-500">
              Manage seller accounts and their admin assignments
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{seller.displayName}</div>
                        <div className="text-sm text-gray-500">{seller.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {seller.currentAdminName ? (
                        <div>
                          <div className="font-medium">{seller.currentAdminName}</div>
                          <div className="text-sm text-gray-500">{seller.currentAdminEmail}</div>
                        </div>
                      ) : seller.referredByAdminId ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Users className="h-3 w-3 mr-1" />
                          Referred but Unassigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {seller.isDummyAccount ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <ShieldOff className="h-3 w-3 mr-1" />
                          Dummy
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">₦{seller.balance?.toLocaleString() || "0"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {seller.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-50 flex items-center"
                          onClick={() => handleViewDetails(seller)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-50 flex items-center"
                          onClick={() => openMigrationDialog(seller)}
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Migrate
                        </button>
                        <button
                          className={`px-2 py-1 text-xs rounded flex items-center ${
                            seller.isDummyAccount
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "border hover:bg-gray-50"
                          }`}
                          onClick={() => openDummyDialog(seller)}
                        >
                          {seller.isDummyAccount ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Enable
                            </>
                          ) : (
                            <>
                              <ShieldOff className="h-3 w-3 mr-1" />
                              Dummy
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSellers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No sellers found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Migration Dialog */}
        {migrationDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Migrate Seller</h3>
                <button
                  onClick={() => setMigrationDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  &times;
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Move {selectedSeller?.displayName} to a different admin
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Admin</label>
                  <div className="text-sm text-gray-600">
                    {selectedSeller?.currentAdminName || "No admin assigned"}
                  </div>
                </div>

                <div>
                  <label htmlFor="target-admin" className="block text-sm font-medium mb-1">
                    New Admin
                  </label>
                  <select
                    id="target-admin"
                    value={targetAdminId}
                    onChange={(e) => setTargetAdminId(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">Select new admin</option>
                    {admins
                      .filter((admin) => admin.id !== selectedSeller?.currentAdminId)
                      .map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.displayName} ({admin.totalSellers} sellers)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium mb-1">
                    Reason for Migration
                  </label>
                  <textarea
                    id="reason"
                    placeholder="Explain why this seller is being migrated..."
                    value={migrationReason}
                    onChange={(e) => setMigrationReason(e.target.value)}
                    rows={3}
                    className="w-full border rounded-md p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 border rounded-md"
                  onClick={() => setMigrationDialogOpen(false)}
                  disabled={migrationLoading}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" 
                  onClick={handleMigration} 
                  disabled={migrationLoading}
                >
                  {migrationLoading ? "Migrating..." : "Migrate Seller"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dummy Account Dialog */}
        {dummyDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {selectedSeller?.isDummyAccount ? "Enable" : "Set as Dummy"} Account
                </h3>
                <button
                  onClick={() => setDummyDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  &times;
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                {selectedSeller?.isDummyAccount
                  ? "This will restore the seller account to regular status and include it in revenue tracking."
                  : "This will mark the seller account as dummy and exclude it from all revenue tracking."}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Seller</label>
                  <div className="text-sm text-gray-600">
                    {selectedSeller?.displayName} ({selectedSeller?.email})
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Current Status</label>
                  <div>
                    {selectedSeller?.isDummyAccount ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Dummy Account
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Regular Account
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="dummy-reason" className="block text-sm font-medium mb-1">
                    Reason
                  </label>
                  <textarea
                    id="dummy-reason"
                    placeholder="Explain why this account status is being changed..."
                    value={dummyReason}
                    onChange={(e) => setDummyReason(e.target.value)}
                    rows={3}
                    className="w-full border rounded-md p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 border rounded-md"
                  onClick={() => setDummyDialogOpen(false)}
                  disabled={dummyLoading}
                >
                  Cancel
                </button>
                <button 
                  className={`px-4 py-2 text-white rounded-md ${
                    selectedSeller?.isDummyAccount
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                  onClick={handleDummyAccountToggle} 
                  disabled={dummyLoading}
                >
                  {dummyLoading
                    ? "Updating..."
                    : selectedSeller?.isDummyAccount
                    ? "Enable Account"
                    : "Set as Dummy"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seller Details Dialog */}
        {detailsDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Seller Details</h3>
                <button
                  onClick={() => setDetailsDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  &times;
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Detailed information for {selectedSeller?.displayName}
              </p>

              <div className="border-b mb-4">
                <div className="flex space-x-2 mb-2">
                  <button
                    className="px-4 py-2 border-b-2 border-blue-500 font-medium"
                    onClick={() => {}}
                  >
                    Overview
                  </button>
                  <button
                    className="px-4 py-2"
                    onClick={() => {}}
                  >
                    Migration History
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-4">Account Information</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="text-sm">{selectedSeller?.displayName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="text-sm">{selectedSeller?.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Account Type</div>
                      <div className="text-sm">
                        {selectedSeller?.isDummyAccount ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Dummy Account
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Regular Account
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Created</div>
                      <div className="text-sm">{selectedSeller?.createdAt.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-4">Admin Assignment</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Current Admin</div>
                      <div className="text-sm">
                        {selectedSeller?.currentAdminName || "No admin assigned"}
                      </div>
                    </div>
                    {selectedSeller?.currentAdminEmail && (
                      <div>
                        <div className="text-xs text-gray-500">Admin Email</div>
                        <div className="text-sm">{selectedSeller.currentAdminEmail}</div>
                      </div>
                    )}
                    {selectedSeller?.referralCode && (
                      <div>
                        <div className="text-xs text-gray-500">Referral Code</div>
                        <div className="text-sm">{selectedSeller.referralCode}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-4">Financial Information</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Balance</div>
                      <div className="text-sm font-medium">
                        ₦{selectedSeller?.balance?.toLocaleString() || "0"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Sales</div>
                      <div className="text-sm">
                        ₦{selectedSeller?.totalSales?.toLocaleString() || "0"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Commissions</div>
                      <div className="text-sm">
                        ₦{selectedSeller?.totalCommissions?.toLocaleString() || "0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  className="px-4 py-2 border rounded-md" 
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminRoute>
  );
}

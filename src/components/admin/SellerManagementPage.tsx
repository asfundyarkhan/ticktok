"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  SellerManagementService,
  SellerInfo,
  AdminInfo,
  MigrationResult,
  DummyAccountResult,
} from "@/services/sellerManagementService";
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
  const [sellers, setSellers] = useState<SellerInfo[]>([]);
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<SellerInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
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
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

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
    setStats({
      totalSellers: sellers.length,
      dummyAccounts: sellers.filter((s) => s.isDummyAccount).length,
      sellersWithAdmins: sellers.filter((s) => s.currentAdminId).length,
      sellersWithoutAdmins: sellers.filter((s) => !s.currentAdminId).length,
    });
  }, [sellers]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading seller management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seller Management</h1>
          <p className="text-gray-600 mt-2">
            Manage seller accounts, admin assignments, and account types
          </p>
        </div>
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSellers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Admins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sellersWithAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Without Admins</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sellersWithoutAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dummy Accounts</CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dummyAccounts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by seller name, email, or admin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <Label>Admin</Label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  <SelectItem value="none">No Admin</SelectItem>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:w-48">
              <Label>Account Type</Label>
              <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="dummy">Dummy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sellers ({filteredSellers.length})</CardTitle>
          <CardDescription>
            Manage seller accounts and their admin assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Current Admin</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{seller.displayName}</div>
                      <div className="text-sm text-gray-500">{seller.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {seller.currentAdminName ? (
                      <div>
                        <div className="font-medium">{seller.currentAdminName}</div>
                        <div className="text-sm text-gray-500">{seller.currentAdminEmail}</div>
                      </div>
                    ) : (
                      <Badge variant="secondary">No Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={seller.isDummyAccount ? "outline" : "default"}>
                      {seller.isDummyAccount ? (
                        <>
                          <ShieldOff className="h-3 w-3 mr-1" />
                          Dummy
                        </>
                      ) : (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Regular
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">₦{seller.balance?.toLocaleString() || "0"}</span>
                  </TableCell>
                  <TableCell>
                    {seller.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(seller)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMigrationDialog(seller)}
                      >
                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                        Migrate
                      </Button>
                      <Button
                        size="sm"
                        variant={seller.isDummyAccount ? "default" : "outline"}
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
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSellers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sellers found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Dialog */}
      <Dialog open={migrationDialogOpen} onOpenChange={setMigrationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migrate Seller</DialogTitle>
            <DialogDescription>
              Move {selectedSeller?.displayName} to a different admin. This will transfer management, referral status, and all future commissions to the new admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Current Admin</Label>
              <div className="text-sm text-gray-600 mt-1">
                {selectedSeller?.currentAdminName || "No admin assigned"}
              </div>
            </div>

            <div>
              <Label htmlFor="target-admin">New Admin</Label>
              <Select value={targetAdminId} onValueChange={setTargetAdminId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new admin" />
                </SelectTrigger>
                <SelectContent>
                  {admins
                    .filter((admin) => admin.id !== selectedSeller?.currentAdminId)
                    .map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.displayName} ({admin.totalSellers} sellers)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Migration</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this seller is being migrated..."
                value={migrationReason}
                onChange={(e) => setMigrationReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Migration Impact Warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Migration Impact:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Seller will appear in the new admin&apos;s referral list</li>
                <li>• All future commissions will go to the new admin</li>
                <li>• Pending deposits will be transferred to the new admin</li>
                <li>• Original referrer information will be preserved for history</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMigrationDialogOpen(false)}
              disabled={migrationLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleMigration} disabled={migrationLoading}>
              {migrationLoading ? "Migrating..." : "Migrate Seller"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dummy Account Dialog */}
      <Dialog open={dummyDialogOpen} onOpenChange={setDummyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSeller?.isDummyAccount ? "Enable" : "Set as Dummy"} Account
            </DialogTitle>
            <DialogDescription>
              {selectedSeller?.isDummyAccount
                ? "This will restore the seller account to regular status and include it in revenue tracking."
                : "This will mark the seller account as dummy and exclude it from all revenue tracking."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Seller</Label>
              <div className="text-sm text-gray-600 mt-1">
                {selectedSeller?.displayName} ({selectedSeller?.email})
              </div>
            </div>

            <div>
              <Label>Current Status</Label>
              <div className="mt-1">
                <Badge variant={selectedSeller?.isDummyAccount ? "outline" : "default"}>
                  {selectedSeller?.isDummyAccount ? "Dummy Account" : "Regular Account"}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="dummy-reason">Reason</Label>
              <Textarea
                id="dummy-reason"
                placeholder="Explain why this account status is being changed..."
                value={dummyReason}
                onChange={(e) => setDummyReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDummyDialogOpen(false)}
              disabled={dummyLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleDummyAccountToggle} disabled={dummyLoading}>
              {dummyLoading
                ? "Updating..."
                : selectedSeller?.isDummyAccount
                ? "Enable Account"
                : "Set as Dummy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seller Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Seller Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedSeller?.displayName}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Migration History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Name</Label>
                      <div className="text-sm">{selectedSeller?.displayName}</div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <div className="text-sm">{selectedSeller?.email}</div>
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <div className="text-sm">
                        <Badge variant={selectedSeller?.isDummyAccount ? "outline" : "default"}>
                          {selectedSeller?.isDummyAccount ? "Dummy Account" : "Regular Account"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <div className="text-sm">{selectedSeller?.createdAt.toLocaleString()}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Admin Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Current Admin</Label>
                      <div className="text-sm">
                        {selectedSeller?.currentAdminName || "No admin assigned"}
                      </div>
                    </div>
                    {selectedSeller?.currentAdminEmail && (
                      <div>
                        <Label>Admin Email</Label>
                        <div className="text-sm">{selectedSeller.currentAdminEmail}</div>
                      </div>
                    )}
                    {selectedSeller?.referralCode && (
                      <div>
                        <Label>Referral Code</Label>
                        <div className="text-sm">{selectedSeller.referralCode}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Referral Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Current Referrer (Commission Recipient)</Label>
                      <div className="text-sm">
                        {selectedSeller?.referredByAdminId ? (
                          <Badge variant="default">
                            {admins.find(a => a.id === selectedSeller?.referredByAdminId)?.displayName || 'Unknown Admin'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No referrer</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        This admin receives commissions from this seller&apos;s activities
                      </div>
                    </div>
                    {selectedSeller?.originalReferredBy && selectedSeller.originalReferredBy !== selectedSeller.referredByAdminId && (
                      <div>
                        <Label>Original Referrer</Label>
                        <div className="text-sm">
                          <Badge variant="outline">
                            {admins.find(a => a.id === selectedSeller?.originalReferredBy)?.displayName || 'Unknown Admin'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          The admin who originally referred this seller
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Balance</Label>
                      <div className="text-sm font-medium">
                        ₦{selectedSeller?.balance?.toLocaleString() || "0"}
                      </div>
                    </div>
                    <div>
                      <Label>Total Sales</Label>
                      <div className="text-sm">
                        ₦{selectedSeller?.totalSales?.toLocaleString() || "0"}
                      </div>
                    </div>
                    <div>
                      <Label>Total Commissions</Label>
                      <div className="text-sm">
                        ₦{selectedSeller?.totalCommissions?.toLocaleString() || "0"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Migration History</CardTitle>
                  <CardDescription>
                    All admin migrations for this seller
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {migrationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {migrationHistory.map((migration, index) => (
                        <div key={migration.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <History className="h-4 w-4" />
                              <span className="font-medium">Migration #{index + 1}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {migration.timestamp?.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <strong>From:</strong> {migration.oldAdminName || "No Admin"}
                            </div>
                            <div>
                              <strong>To:</strong> {migration.newAdminName}
                            </div>
                            <div>
                              <strong>Reason:</strong> {migration.reason}
                            </div>
                            {migration.migratedData && (
                              <div>
                                <strong>Migrated:</strong> {migration.migratedData.pendingDeposits} deposits, {migration.migratedData.commissionHistory} commissions
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No migration history found for this seller.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

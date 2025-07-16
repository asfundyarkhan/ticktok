"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Copy, Check, RefreshCcw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { SuperAdminRoute } from "../../components/SuperAdminRoute";
import { UserService } from "../../../services/userService";
import { LoadingSpinner } from "../../components/Loading";
import Link from "next/link";

interface Admin {
  uid: string;
  displayName?: string;
  email: string;
  referralCode?: string;
  createdAt?: Date;
}

function ReferralManagerContent() {
  // The userProfile is required for authentication but not used in this component
  const { /* userProfile */ } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReferralCode, setGeneratingReferralCode] = useState(false);
  const [referralCodeGeneratedFor, setReferralCodeGeneratedFor] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch admin accounts from Firebase
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const adminUsers = await UserService.getUsersByRole("admin");
        
        // Format admin data
        const formattedAdmins = adminUsers.map((admin) => ({
          uid: admin.uid,
          displayName: admin.displayName || admin.email.split("@")[0],
          email: admin.email,
          referralCode: admin.referralCode || "",
          createdAt: admin.createdAt
        }));

        setAdmins(formattedAdmins);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch admins:", err);
        setError("Failed to load admin accounts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  // Filter admins based on search
  const filteredAdmins = admins.filter(
    (admin) =>
      (admin.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin.referralCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false)
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);
  const paginatedAdmins = filteredAdmins.slice(
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

  // Function to generate a referral code for an admin
  const generateReferralCode = async (uid: string) => {
    try {
      setGeneratingReferralCode(true);
      setReferralCodeGeneratedFor(uid);
      
      // Use the new history-aware method
      const code = await UserService.generateReferralCodeWithHistory(uid);
      
      // Update the admin in the local state
      setAdmins(
        admins.map((admin) =>
          admin.uid === uid
            ? { ...admin, referralCode: code }
            : admin
        )
      );
      
      alert(`New referral code generated: ${code}\n\nIMPORTANT: All previous referral codes for this admin remain valid and active. Existing referred sellers will not be affected.`);
    } catch (error) {
      console.error("Error generating referral code:", error);
      alert("Failed to generate referral code. Please try again.");
    } finally {
      setGeneratingReferralCode(false);
      setReferralCodeGeneratedFor(null);
    }
  };

  // Function to migrate existing codes to history system
  const migrateReferralCodes = async () => {
    try {
      const confirm = window.confirm(
        "This will migrate all existing referral codes to the new history system.\n\n" +
        "✅ All existing referral relationships will be preserved\n" +
        "✅ All old referral codes will remain valid\n" +
        "✅ Admins can generate new codes without breaking old ones\n\n" +
        "Continue with migration?"
      );
      
      if (!confirm) return;

      await UserService.migrateExistingReferralCodes();
      alert("Migration completed successfully!\n\nAll existing referral codes have been preserved and will remain valid forever.");
    } catch (error) {
      console.error("Error migrating referral codes:", error);
      alert("Migration failed. Please check console for details.");
    }
  };

  // Function to fix broken referral chains
  const fixBrokenReferralChains = async () => {
    try {
      const confirm = window.confirm(
        "This will repair broken referral relationships.\n\n" +
        "🔧 Finds sellers with broken referral code links\n" +
        "✅ Restores them to their original admin (via adminUid)\n" +
        "🔄 Updates their referral codes to current valid ones\n" +
        "📊 Preserves all balances and transaction history\n\n" +
        "Continue with repair?"
      );
      
      if (!confirm) return;

      const result = await UserService.fixBrokenReferralChains();
      
      let message = `Referral Chain Repair Complete!\n\n`;
      message += `✅ Fixed: ${result.fixed} sellers\n`;
      message += `⏭️ Already valid: ${result.alreadyFixed} sellers\n`;
      message += `❌ Errors: ${result.errors} sellers\n\n`;
      
      if (result.details.length > 0) {
        message += `Details:\n`;
        result.details.slice(0, 10).forEach(detail => {
          message += `• ${detail.sellerEmail} → ${detail.adminEmail}: ${detail.action}\n`;
        });
        if (result.details.length > 10) {
          message += `... and ${result.details.length - 10} more`;
        }
      }
      
      alert(message);
    } catch (error) {
      console.error("Error fixing referral chains:", error);
      alert("Repair failed. Please check console for details.");
    }
  };

  // Function to validate all referral relationships
  const validateAllReferrals = async () => {
    try {
      const result = await UserService.validateAllReferralRelationships();
      
      let message = `Referral Validation Report:\n\n`;
      message += `✅ Valid relationships: ${result.valid}\n`;
      message += `❌ Broken relationships: ${result.broken}\n`;
      message += `👤 Orphaned sellers: ${result.orphaned}\n\n`;
      
      if (result.broken > 0) {
        message += `Broken relationships found! Use "Fix Broken Chains" to repair them.\n\n`;
        message += `Sample broken relationships:\n`;
        const brokenDetails = result.details.filter(d => d.type === "broken").slice(0, 5);
        brokenDetails.forEach(detail => {
          message += `• ${detail.sellerEmail}: ${detail.issue}\n`;
        });
      } else {
        message += `🎉 All referral relationships are healthy!`;
      }
      
      alert(message);
    } catch (error) {
      console.error("Error validating referrals:", error);
      alert("Validation failed. Please check console for details.");
    }
  };

  // Function to copy referral code to clipboard
  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Admin Referral Code Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={validateAllReferrals}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Validate All
          </button>
          <button
            onClick={fixBrokenReferralChains}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Fix Broken Chains
          </button>
          <button
            onClick={migrateReferralCodes}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Migrate Codes
          </button>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <h3 className="text-green-800 font-medium">Enhanced Referral System</h3>
          <p className="text-green-700 text-sm mt-1">
            <strong>New Feature:</strong> Referral codes now use a history system. When admins generate new codes, 
            all previous codes remain valid forever. This ensures existing referred sellers are never disconnected.
          </p>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <h3 className="text-red-800 font-medium">🔧 Repair Broken Chains</h3>
          <p className="text-red-700 text-sm mt-1">
            <strong>Fix Available:</strong> If some sellers were disconnected due to referral code changes, 
            use &quot;Fix Broken Chains&quot; to restore them to their original admins. All relationships are tracked by admin ID.
          </p>
        </div>
      </div>
        <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search admins"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-3 ml-4">
          <Link 
            href="/dashboard/referral-debug" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Debug Codes
          </Link>
          <Link 
            href="/dashboard/role-manager" 
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            Manage Roles
          </Link>
        </div>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
        <p className="text-yellow-700">
          <strong>Note:</strong> Only admins can receive referral codes. Use the Role Manager to first assign a user as an admin.
        </p>
      </div>

      {admins.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700">
            No admin accounts found. Use the Role Manager to assign users as admins first.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedAdmins.map((admin) => (
                  <tr key={admin.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {admin.displayName || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {admin.uid}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {admin.referralCode ? (
                        <div className="flex items-center">
                          <span className="font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded">
                            {admin.referralCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">No code assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {admin.referralCode ? (
                        <button
                          onClick={() => copyReferralCode(admin.referralCode || "")}
                          className="mr-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-pink-700 bg-pink-100 hover:bg-pink-200"
                        >
                          {copiedCode === admin.referralCode ? (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" /> Copy Code
                            </>
                          )}
                        </button>
                      ) : null}
                      
                      <button
                        onClick={() => generateReferralCode(admin.uid)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                          admin.referralCode
                            ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                            : "text-pink-700 bg-pink-100 hover:bg-pink-200"
                        }`}
                        disabled={generatingReferralCode && referralCodeGeneratedFor === admin.uid}
                      >
                        {generatingReferralCode && referralCodeGeneratedFor === admin.uid ? (
                          <>
                            <LoadingSpinner size="sm" /> <span className="ml-1">Generating...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCcw className="h-4 w-4 mr-1" />
                            {admin.referralCode ? "Generate New Code" : "Generate Code"}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="flex items-center space-x-2">
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
            </div>
            
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                Page {currentPage} of {totalPages || 1}
                {" | "}
                Showing {paginatedAdmins.length} of {filteredAdmins.length} admins
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`p-1 rounded-md ${
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
                  className={`p-1 rounded-md ${
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
      )}
    </div>
  );
}

export default function ReferralManagerPage() {
  return (
    <SuperAdminRoute>
      <ReferralManagerContent />
    </SuperAdminRoute>
  );
}

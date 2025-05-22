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
  const { userProfile } = useAuth();
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
      
      // Generate a referral code through the UserService
      const code = await UserService.generateReferralCode(uid);
      
      // Update the admin in the local state
      setAdmins(
        admins.map((admin) =>
          admin.uid === uid
            ? { ...admin, referralCode: code }
            : admin
        )
      );
    } catch (error) {
      console.error("Error generating referral code:", error);
      alert("Failed to generate referral code. Please try again.");
    } finally {
      setGeneratingReferralCode(false);
      setReferralCodeGeneratedFor(null);
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
      <h1 className="text-2xl font-semibold mb-6">Admin Referral Code Manager</h1>
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
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
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
                            {admin.referralCode ? "Regenerate Code" : "Generate Code"}
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

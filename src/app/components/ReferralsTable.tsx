"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "./Loading";
import { UserService } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";

interface Referral {
  uid: string;
  name: string;
  email: string;
  role: string;
  dateJoined: Date;
  balance: number;
}

interface ReferralsTableProps {
  adminId?: string; // Optional - if provided, only shows referrals by this admin
  showAllReferrals?: boolean; // For super admins to show all referral relationships
  loading?: boolean;
}

export default function ReferralsTable({
  adminId,
  showAllReferrals = false,
  loading: initialLoading = false,
}: ReferralsTableProps) {
  const { userProfile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let fetchedReferrals: Referral[] = [];
        
        if (showAllReferrals) {
          // For super admins - get all referral relationships
          const relationships = await UserService.getAllReferralRelationships();
          fetchedReferrals = relationships.map(rel => ({
            uid: rel.user.uid,
            name: rel.user.displayName || rel.user.email.split('@')[0],
            email: rel.user.email,
            role: rel.user.role,
            dateJoined: rel.user.createdAt,
            balance: rel.user.balance || 0,
          }));
        } else {
          // For regular admins - get only their referrals
          const id = adminId || userProfile?.uid;
          if (!id) {
            setError("User authentication required");
            setLoading(false);
            return;
          }
          
          const referredUsers = await UserService.getUsersReferredByAdmin(id);
          fetchedReferrals = referredUsers.map(user => ({
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: user.role,
            dateJoined: user.createdAt,
            balance: user.balance || 0,        }));
        }
        
        setReferrals(fetchedReferrals);
      } catch (err) {
        console.error("Error fetching referrals:", err);
        setError("Failed to load referrals. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferrals();
  }, [adminId, showAllReferrals, userProfile]);
  // Calculate pagination
  const totalPages = Math.ceil(referrals.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, referrals.length);
  const paginatedReferrals = referrals.slice(startIndex, endIndex);
  
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

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };
  
  return (
    <div className="bg-white rounded-lg">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No referrals found.</p>
          </div>
        ) : (
          <table className="min-w-full">            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReferrals.map((referral) => (
                <tr key={referral.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{referral.name}</div>
                    <div className="text-xs text-gray-500">
                      {referral.uid.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {referral.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      referral.role === 'seller' ? 'bg-blue-100 text-blue-800' : 
                      referral.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {referral.role.charAt(0).toUpperCase() + referral.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {referral.dateJoined.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${referral.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {referrals.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Rows per page:</span>
            <select 
              className="text-sm border rounded px-1 py-0.5"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {startIndex + 1}-{endIndex} of {referrals.length}
            </span>
            <div className="flex">
              <button 
                className="p-1" 
                disabled={currentPage === 1}
                onClick={goToPrevPage}
              >
                <ChevronLeft className={`h-4 w-4 ${currentPage === 1 ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <button 
                className="p-1"
                disabled={currentPage === totalPages}
                onClick={goToNextPage}
              >
                <ChevronRight className={`h-4 w-4 ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

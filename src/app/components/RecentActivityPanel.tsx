"use client";

import { useState, useEffect } from "react";
import { ActivityService, ActivityItem } from "../../services/activityService";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RecentActivityPanelProps {
  maxItems?: number;
  showPagination?: boolean;
  itemsPerPage?: number;
}

export default function RecentActivityPanel({ 
  maxItems = 50, 
  showPagination = true, 
  itemsPerPage = 3 
}: RecentActivityPanelProps) {
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(allActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = allActivities.slice(startIndex, endIndex);

  useEffect(() => {
    // Subscribe to all activities for the admin dashboard
    const unsubscribe = ActivityService.subscribeToActivities(
      (newActivities) => {
        setAllActivities(newActivities.slice(0, maxItems));
        setLoading(false);
      },
      (error) => {
        console.error("Error loading activities:", error);
        setLoading(false);
      },
      maxItems
    );

    return () => unsubscribe();
  }, [maxItems]);

  // Reset to first page when activities change
  useEffect(() => {
    setCurrentPage(1);
  }, [allActivities.length]);

  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusColor = (activity: ActivityItem) => {
    switch (activity.status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "balance_updated":
        const amount = activity.details.amount || 0;
        return `Balance ${amount >= 0 ? 'increased' : 'decreased'} by $${Math.abs(amount).toFixed(2)}`;
      case "deposit_approved":
        return "Payment deposit approved";
      case "user_suspended":
        return "User account suspended";
      case "user_activated":
        return "User account activated";
      case "referral_code_generated":
        return "Referral code generated";
      default:
        return ActivityService.formatActivityMessage(activity).replace(/^\[\d+:\d+\s*[AP]M\]\s*/, '');
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(itemsPerPage)].map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 py-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (allActivities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">No recent activities</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activities List */}
      <div className="space-y-2">
        {currentActivities.map((activity) => (
          <div key={activity.id} className="grid grid-cols-3 gap-4 py-2 text-sm border-b border-gray-100 last:border-b-0">
            <div className="text-gray-600">
              {activity.createdAt.toLocaleDateString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric' 
              })}
            </div>
            <div className="text-gray-900 font-medium">
              {formatActivityText(activity)}
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(activity)}`}>
                {activity.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, allActivities.length)} of {allActivities.length}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`p-1 rounded-md transition-colors ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600">
              {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`p-1 rounded-md transition-colors ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ActivityService, ActivityItem } from "../../services/activityService";

interface RecentActivityPanelProps {
  maxItems?: number;
}

export default function RecentActivityPanel({ maxItems = 3 }: RecentActivityPanelProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to all activities for the admin dashboard
    const unsubscribe = ActivityService.subscribeToActivities(
      (newActivities) => {
        setActivities(newActivities.slice(0, maxItems));
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
        {[...Array(3)].map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 py-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">No recent activities</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
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
  );
}

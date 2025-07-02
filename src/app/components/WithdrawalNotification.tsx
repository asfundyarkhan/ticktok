"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, DollarSign } from "lucide-react";

interface WithdrawalNotificationProps {
  newRequestsCount: number;
  onDismiss: () => void;
  onViewRequests: () => void;
}

export default function WithdrawalNotification({
  newRequestsCount,
  onDismiss,
  onViewRequests,
}: WithdrawalNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (newRequestsCount > 0) {
      setIsVisible(true);

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [newRequestsCount, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  const handleViewRequests = () => {
    setIsVisible(false);
    onViewRequests();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="fixed top-5 right-5 z-50 max-w-sm bg-white shadow-xl rounded-lg border-l-4 border-purple-500 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center"
                >
                  <Bell className="h-5 w-5 text-purple-600" />
                </motion.div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  New Withdrawal Request{newRequestsCount > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {newRequestsCount} seller{newRequestsCount > 1 ? "s" : ""} requesting withdrawal
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleViewRequests}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    View Requests
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={handleDismiss}
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 px-4 py-2 flex items-center text-xs text-purple-700">
            <DollarSign className="h-3 w-3 mr-1" />
            Admin action required
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

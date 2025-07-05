"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { MonthlyRevenueService, MonthlyRevenue } from "../../services/monthlyRevenueService";

interface TotalRevenuePanelProps {
  adminId?: string;
}

export default function TotalRevenuePanel({ adminId }: TotalRevenuePanelProps) {
  const { user } = useAuth();
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  const targetAdminId = adminId || user?.uid;

  useEffect(() => {
    if (!targetAdminId) {
      setLoading(false);
      return;
    }

    const loadMonthlyRevenue = async () => {
      try {
        const revenues = await MonthlyRevenueService.getMonthlyRevenue(
          targetAdminId,
          "admin",
          3
        );
        setMonthlyRevenues(revenues);
      } catch (error) {
        console.error("Error loading monthly revenue:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMonthlyRevenue();
  }, [targetAdminId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const currentMonth = monthlyRevenues[0];
  const previousMonth = monthlyRevenues[1];
  const totalRevenue = currentMonth?.totalRevenue || 0;
  
  let changePercentage = null;
  if (previousMonth && previousMonth.totalRevenue > 0) {
    changePercentage = ((totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100;
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold text-gray-900">
            ${totalRevenue.toFixed(2)}
          </span>
          {changePercentage !== null && (
            <span className={`text-lg font-medium ${changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">vs last month</p>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {changePercentage !== null && changePercentage >= 0 ? 'Trending Up' : 'Stable Growth'}
          </span>
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="flex items-center space-x-1 mt-2">
          {/* Simple trending chart representation */}
          {monthlyRevenues.slice(0, 3).reverse().map((revenue, index) => (
            <div
              key={index}
              className="bg-blue-400 rounded-sm"
              style={{
                width: '8px',
                height: `${Math.max(8, (revenue.totalRevenue / Math.max(...monthlyRevenues.map(r => r.totalRevenue))) * 24)}px`
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 flex items-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Last updated: {currentMonth?.lastUpdated?.toLocaleDateString() || new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}

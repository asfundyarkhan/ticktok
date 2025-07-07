"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { MonthlyRevenueService, MonthlyRevenue } from "../../services/monthlyRevenueService";
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface TransactionHistoryProps {
  adminId?: string;
  maxItems?: number;
  showTitle?: boolean;
}

export default function TransactionHistory({ 
  adminId, 
  maxItems = 10,
  showTitle = true 
}: TransactionHistoryProps) {
  const { user, userProfile } = useAuth();
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const targetAdminId = adminId || user?.uid;

  useEffect(() => {
    if (!targetAdminId) {
      setLoading(false);
      return;
    }

    const loadMonthlyRevenue = async () => {
      try {
        setLoading(true);
        // Determine user role for revenue calculation
        const userRole = userProfile?.role === "superadmin" ? "superadmin" : "admin";
        const revenues = await MonthlyRevenueService.getMonthlyRevenue(
          targetAdminId,
          userRole,
          maxItems
        );
        setMonthlyRevenues(revenues);
      } catch (error) {
        console.error("Error loading monthly revenue:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadMonthlyRevenue();

    // Set up real-time updates for live data
    const interval = setInterval(loadMonthlyRevenue, 30 * 1000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [targetAdminId, maxItems, selectedYear, userProfile?.role]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getMonthChangePercentage = (currentMonth: MonthlyRevenue, previousMonth: MonthlyRevenue | null) => {
    if (!previousMonth || previousMonth.totalRevenue === 0) return null;
    
    const change = ((currentMonth.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100;
    return change;
  };

  const getRevenueIcon = (revenue: MonthlyRevenue, previousRevenue: MonthlyRevenue | null) => {
    const change = getMonthChangePercentage(revenue, previousRevenue);
    if (change === null) return <BarChart3 className="w-5 h-5 text-blue-600" />;
    return change >= 0 
      ? <ArrowUpRight className="w-5 h-5 text-green-600" />
      : <ArrowDownRight className="w-5 h-5 text-red-600" />;
  };

  const getRevenueColor = (revenue: MonthlyRevenue, previousRevenue: MonthlyRevenue | null) => {
    const change = getMonthChangePercentage(revenue, previousRevenue);
    if (change === null) return "from-blue-500 to-indigo-600";
    return change >= 0 
      ? "from-green-500 to-emerald-600"
      : "from-red-500 to-rose-600";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          {showTitle && (
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-slate-200 rounded-lg w-48"></div>
            </div>
          )}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl">
              <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {showTitle && (
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Monthly Revenue</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
              >
                {[...Array(3)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 overflow-hidden">
        {monthlyRevenues.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {monthlyRevenues.map((revenue, index) => {
              const previousRevenue = index < monthlyRevenues.length - 1 ? monthlyRevenues[index + 1] : null;
              const changePercentage = getMonthChangePercentage(revenue, previousRevenue);
              
              return (
                <div
                  key={revenue.month}
                  className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-4 border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${getRevenueColor(revenue, previousRevenue)} rounded-xl flex items-center justify-center shrink-0`}>
                    {getRevenueIcon(revenue, previousRevenue)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
                        {revenue.monthName} {revenue.year}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium self-start shrink-0">
                          {revenue.transactionCount} transaction{revenue.transactionCount !== 1 ? 's' : ''}
                        </span>
                        {changePercentage !== null && (
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            changePercentage >= 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total Revenue</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(revenue.totalRevenue)}</span>
                      </div>
                      {revenue.commissionRevenue > 0 && (
                        <div>
                          <span className="text-slate-500 block">Commission</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(revenue.commissionRevenue)}</span>
                        </div>
                      )}
                      {revenue.profitRevenue > 0 && (
                        <div>
                          <span className="text-slate-500 block">Profit</span>
                          <span className="font-semibold text-green-600">{formatCurrency(revenue.profitRevenue)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        <span>Last updated: {revenue.lastUpdated.toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right shrink-0">
                    <div className="flex items-center gap-1 text-slate-900 font-bold text-base sm:text-lg">
                      <DollarSign className="w-4 h-4 shrink-0" />
                      <span>{formatCurrency(revenue.totalRevenue)}</span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      Avg: {formatCurrency(revenue.totalRevenue / Math.max(1, revenue.transactionCount))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">
              No revenue data yet
            </h4>
            <p className="text-slate-500 max-w-md mx-auto">
              Revenue will appear here once you start earning commissions from deposits and receipt approvals.
            </p>
          </div>
        )}
      </div>

      {monthlyRevenues.length >= maxItems && maxItems < 10 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Showing latest {maxItems} months of revenue data
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/admin/revenue'}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View Detailed Revenue Report
            </button>
          </div>
        </div>
      )}

      {monthlyRevenues.length >= maxItems && maxItems >= 10 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Showing latest {maxItems} months
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

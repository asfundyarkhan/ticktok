"use client";

import { useEffect, useState } from "react";
import { Users, ShoppingBag, CreditCard } from "lucide-react";
import StatsCard from "../components/StatsCard";
import ActivityTable from "../components/ActivityTable";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "../components/Loading";
import { OrderService } from "../../services/orderService";
import { ProductService } from "../../services/productService";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
      return;
    }    // Check if user is an admin or superadmin, redirect to store page if they're a seller or regular user
    if (
      !authLoading &&
      userProfile &&
      userProfile.role !== "admin" &&
      userProfile.role !== "superadmin"
    ) {
      // Non-admin/superadmin users should be redirected to store
      router.replace("/store");
      return;
    }

    // Load dashboard data
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get user orders
        const orders = await OrderService.getUserOrders(user.uid);
        setOrderCount(orders.length); // If user is a seller, admin or superadmin, get their products
        if (
          userProfile &&
          (userProfile.role === "seller" ||
            userProfile.role === "admin" ||
            userProfile.role === "superadmin")
        ) {
          const products = await ProductService.getProductsBySeller(user.uid);
          setProductCount(products.length);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, userProfile, authLoading, router]);

  // Stats to display on the dashboard
  const stats = [
    {
      title: "User ID",
      value: user?.uid?.substring(0, 8) || "...",
      icon: Users,
    },
    {
      title: "My Orders",
      value: orderCount.toString(),
      icon: ShoppingBag,
    },
    {
      title: "Balance",
      value: `$${userProfile?.balance?.toFixed(2) || "0.00"}`,
      icon: CreditCard,
    },
  ];

  // Add product count stat for sellers
  if (userProfile?.role === "seller" || userProfile?.role === "admin") {
    stats.push({
      title: "My Products",
      value: productCount.toString(),
      icon: ShoppingBag,
    });
  }

  // Show loading spinner while loading
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* User Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            {userProfile?.displayName || "User Dashboard"}
          </h1>
          <span className="px-2 py-1 text-sm bg-gray-100 rounded-md">
            {userProfile?.role || "user"}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Activity Table */}
      <div className="mb-8">
        <ActivityTable title="Recent Activity" />
      </div>
    </div>
  );
}

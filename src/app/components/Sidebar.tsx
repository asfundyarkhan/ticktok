"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layout,
  ShoppingBag,
  Settings,
  Share2,  ChevronRight,
  Shield,
  CreditCard,
  LucideIcon,
  LogOut,
  Users,
} from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  superadminOnly?: boolean;
}

const navigation: NavItem[] = [  { name: "Dashboard", href: "/dashboard", icon: Layout, adminOnly: true },
  { name: "My Profile", href: "/dashboard/profile", icon: Settings },
  { name: "My Referrals", href: "/dashboard/admin/referrals", icon: Share2, adminOnly: true },
  { name: "Stock Listing", href: "/dashboard/stock", icon: ShoppingBag },
  {
    name: "Seller Credit",
    href: "/dashboard/admin",
    icon: CreditCard,
    superadminOnly: true, // Changed from adminOnly to superadminOnly to restrict access
  },
  {
    name: "Referral Codes",
    href: "/dashboard/referral-manager",
    icon: Share2,
    superadminOnly: true,
  },
  {
    name: "All Referrals",
    href: "/dashboard/admin/all-referrals",
    icon: Users,
    superadminOnly: true,
  },
  {
    name: "Role Manager",
    href: "/dashboard/role-manager",
    icon: Shield,
    superadminOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center">
          {!isCollapsed && (
            <span className="text-lg font-semibold text-gray-900">
              TikTok Shop
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ChevronRight
            className={`h-5 w-5 transform transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>{" "}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {" "}
          {navigation.map((item) => {
            // Skip admin-only items if user is not an admin or superadmin
            if (
              item.adminOnly &&
              (!userProfile ||
                (userProfile.role !== "admin" &&
                  userProfile.role !== "superadmin"))
            ) {
              return null;
            }

            // Skip superadmin-only items if user is not a superadmin
            if (
              item.superadminOnly &&
              (!userProfile || userProfile.role !== "superadmin")
            ) {
              return null;
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-pink-600 bg-pink-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center ${isCollapsed ? "hidden" : "block"}`}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {userProfile?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <Link href="/dashboard/profile" className="text-xs text-pink-600 hover:text-pink-700">
                View Profile
              </Link>
            </div>{" "}
          </div>
          <LogoutButton
            variant="text"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
          </LogoutButton>
        </div>
      </div>
    </div>
  );
}

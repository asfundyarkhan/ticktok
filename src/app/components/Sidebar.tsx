"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "My Profile", href: "/dashboard/profile" },
  { name: "My Referrals", href: "/dashboard/referrals" },
  { name: "Transfer Money", href: "/dashboard/transfer" },
  { name: "Orders", href: "/dashboard/orders" },
  { name: "Payment", href: "/dashboard/payment" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 min-h-screen bg-white">
      <div className="p-6">
        <Link href="/dashboard" className="text-2xl font-semibold">
          TikTok Shop
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "block px-4 py-2 text-sm rounded-lg transition-colors",
                isActive
                  ? "bg-pink-50 text-[#FF2C55] font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

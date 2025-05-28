"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useUserBalance } from "./UserBalanceContext";
import { useCart } from "./CartContext";
import CartDrawer from "./CartDrawer";
import AnimatedCartIcon from "./AnimatedCartIcon";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const { balance } = useUserBalance();
  const { isCartOpen, setIsCartOpen } = useCart();
  // We will use the LogoutButton component instead of this function
  // which correctly handles all logout logic

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;

      // Hide navbar when at the very top
      if (currentScrollPos === 0) {
        setVisible(false);
        setIsScrolled(false);
        return;
      }

      // Show navbar when scrolling
      setVisible(true);
      setIsScrolled(true);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isMainPage = pathname === "/";

  // Don't show navbar on auth and dashboard pages
  if (isAuthPage || pathname.startsWith("/dashboard")) return null;

  // Display different navigation based on the path
  const isLoggedInPage =
    pathname.startsWith("/store") ||
    pathname.startsWith("/stock") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/receipts");

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        !visible && isMainPage ? "-translate-y-full" : "translate-y-0"
      } ${
        isScrolled || !isMainPage
          ? "bg-white shadow-sm"
          : isMainPage
          ? "opacity-0"
          : "bg-white shadow-sm"
      }`}
      style={{ transition: "transform 0.3s ease-in-out" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link
              href={isLoggedInPage ? "/store" : "/"}
              className="flex items-center"
            >
              <span
                className={`text-lg font-bold ${
                  isScrolled || !isMainPage ? "text-[#FF0059]" : "text-white"
                }`}
              >
                TikTok
              </span>
              <span
                className={`ml-1 text-lg font-semibold ${
                  isScrolled || !isMainPage ? "text-gray-900" : "text-white"
                }`}
              >
                Shop
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isLoggedInPage ? (
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link
                href="/store"
                className={`text-sm font-medium ${
                  pathname.startsWith("/store")
                    ? "text-[#FF0059]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Store
              </Link>
              <Link
                href="/stock"
                className={`text-sm font-medium ${
                  pathname.startsWith("/stock")
                    ? "text-[#FF0059]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Stock
              </Link>              <Link
                href="/receipts"
                className={`text-sm font-medium ${
                  pathname.startsWith("/receipts")
                    ? "text-[#FF0059]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Wallet
              </Link>{" "}
              <div className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-800">
                Balance: ${balance.toFixed(2)}
              </div>{" "}
              <AnimatedCartIcon
                className="p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsCartOpen(true)}
              />
              <Link
                href="/profile"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
              >
                Profile
              </Link>{" "}
              {/* New Logout Button */}
              <LogoutButton
                variant="secondary"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </LogoutButton>
            </div>
          ) : (
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link
                href="/features"
                className={`text-sm font-medium ${
                  isScrolled || !isMainPage
                    ? "text-gray-600 hover:text-gray-900"
                    : "text-gray-200 hover:text-white"
                }`}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className={`text-sm font-medium ${
                  isScrolled || !isMainPage
                    ? "text-gray-600 hover:text-gray-900"
                    : "text-gray-200 hover:text-white"
                }`}
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className={`text-sm font-medium ${
                  isScrolled || !isMainPage
                    ? "text-gray-600 hover:text-gray-900"
                    : "text-gray-200 hover:text-white"
                }`}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="ml-8 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isScrolled || !isMainPage
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-200 hover:text-white"
              }`}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          {isLoggedInPage ? (
            <>
              <Link
                href="/store"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
              >
                Store
              </Link>
              <Link
                href="/stock"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
              >
                Stock
              </Link>
              <Link
                href="/wallet"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
              >
                Wallet
              </Link>{" "}
              <div className="px-3 py-2 text-base font-medium text-gray-800 bg-gray-100 rounded-md">
                Balance: ${balance.toFixed(2)}
              </div>
              <div className="px-3 py-2 flex items-center">
                <AnimatedCartIcon onClick={() => setIsCartOpen(true)} />
                <span className="ml-2 text-base font-medium text-gray-600">
                  Cart
                </span>
              </div>
              <Link
                href="/profile"
                className="block px-3 py-2 text-base font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md"
              >
                Profile
              </Link>{" "}
              {/* New Logout Button for mobile */}
              <LogoutButton
                variant="text"
                className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </LogoutButton>
            </>
          ) : (
            <>
              <Link
                href="/features"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>{" "}
              <Link
                href="/register"
                className="block px-3 py-2 text-base font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
}

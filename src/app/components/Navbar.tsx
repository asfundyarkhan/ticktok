"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, Wallet } from "lucide-react";
import { useUserBalance } from "./UserBalanceContext";
import { useCart } from "./NewCartContext";
import { useAuth } from "@/context/AuthContext";
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
  const { userProfile } = useAuth();
  
  const isSeller = userProfile?.role === "seller";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const visible = prevScrollPos > currentScrollPos || currentScrollPos < 10;
      setVisible(visible);
      setIsScrolled(currentScrollPos > 0);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isMainPage = pathname === "/";

  if (isAuthPage || pathname.startsWith("/dashboard")) return null;

  const isLoggedInPage =
    pathname.startsWith("/store") ||
    pathname.startsWith("/stock") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/receipts");

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          visible ? "translate-y-0" : "-translate-y-full"
        } ${
          isScrolled || !isMainPage
            ? "bg-white/95 backdrop-blur-sm shadow-sm"
            : "bg-white/90 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">            {/* Left section with logo and navigation */}
            <div className="flex items-center space-x-8">
              <Link
                href={isLoggedInPage ? (isSeller ? "/profile" : "/store") : "/"}
                className="flex items-center"
              >
                <span className="text-lg font-bold text-[#FF0059]">TikTok</span>
                <span className="ml-1 text-lg font-semibold text-gray-900">Shop</span>
              </Link>
              
              {/* Store navigation link */}
              <div className="hidden md:flex">
                <Link
                  href="/store"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/store" 
                      ? "text-[#FF0059] bg-pink-50" 
                      : "text-gray-700 hover:text-[#FF0059] hover:bg-gray-50"
                  }`}
                >
                  Store
                </Link>
              </div>
            </div>
            
            {/* Right section */}
            <div className="flex items-center space-x-4">              {/* Cart icon (if logged in and not a seller) */}
              {isLoggedInPage && !isSeller && (
                <AnimatedCartIcon
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsCartOpen(true)}
                />
              )}

              {/* Auth buttons with integrated balance */}                {isLoggedInPage ? (
                <div className="hidden md:flex items-center space-x-2">
                  {/* Balance display - show for all logged in users */}
                  <Link
                    href="/wallet"
                    className="flex items-center px-3 py-2 bg-gradient-to-r from-pink-50 to-pink-100 rounded-md transition-all hover:shadow-md border border-pink-100"
                  >
                    <Wallet className="h-4 w-4 text-[#FF0059] mr-2" />
                    <span className="text-sm font-medium text-gray-900">${balance.toFixed(2)}</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                  >
                    Profile
                  </Link>
                  <LogoutButton
                    variant="secondary"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors inline-flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </LogoutButton>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open menu</span>
                {isMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        className={`fixed inset-x-0 top-[64px] z-40 transform transition-all duration-200 ease-in-out md:hidden ${
          isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white shadow-lg border-t">
          <div className="max-w-7xl mx-auto divide-y divide-gray-200">
            {isLoggedInPage ? (
              <>
                {/* Store link for mobile */}
                <div className="py-2 px-4">
                  <Link
                    href="/store"
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === "/store" 
                        ? "text-[#FF0059] bg-pink-50" 
                        : "text-gray-600 hover:text-[#FF0059] hover:bg-gray-50"
                    }`}
                  >
                    Store
                  </Link>
                </div>
                
                <div className="py-3 px-4 space-y-3">
                  {/* Balance card for mobile - always show for logged in users */}
                  <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Wallet className="h-5 w-5 text-[#FF0059] mr-2" />
                        <div>
                          <div className="text-xs text-gray-600">Current Balance</div>
                          <div className="text-lg font-semibold text-gray-900">${balance.toFixed(2)}</div>
                        </div>
                      </div>                      <Link
                        href="/wallet"
                        className="px-3 py-1 text-sm font-medium text-[#FF0059] bg-white rounded-md shadow-sm hover:bg-pink-50 transition-colors"
                      >
                        Add Funds
                      </Link>
                    </div>
                  </div>                  {/* Cart icon for mobile (non-sellers only) */}
                  {!isSeller && (
                    <div className="flex items-center px-3 py-2">
                      <AnimatedCartIcon onClick={() => setIsCartOpen(true)} />
                      <span className="ml-2 text-base font-medium text-gray-600">Cart</span>
                    </div>
                  )}
                </div>
                <div className="py-3 px-4 space-y-3">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-base font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                  >
                    Profile
                  </Link>
                  <LogoutButton
                    variant="text"
                    className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </LogoutButton>
                </div>
              </>
            ) : (
              <div className="py-3 px-4 space-y-3">
                {/* Store link for unauthenticated mobile users */}
                <Link
                  href="/store"
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    pathname === "/store" 
                      ? "text-[#FF0059] bg-pink-50" 
                      : "text-gray-600 hover:text-[#FF0059] hover:bg-gray-50"
                  }`}
                >
                  Browse Store
                </Link>
                
                <Link
                  href="/login"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 text-base font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>      {/* Cart Drawer - only show for non-sellers */}
      {isLoggedInPage && !isSeller && (
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
    </>
  );
}

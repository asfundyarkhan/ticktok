"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Menu, X, LogOut, Wallet } from "lucide-react";
import { useUserBalance } from "./UserBalanceContext";
import { useCart } from "./NewCartContext";
import { useAuth } from "@/context/AuthContext";
import CartDrawer from "./CartDrawer";
import AnimatedCartIcon from "./AnimatedCartIcon";
import LogoutButton from "./LogoutButton";
import { StockService } from "@/services/stockService";
import type { StockItem } from "@/types/marketplace";
import { getBestProductImage } from "../utils/imageHelpers";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const { balance } = useUserBalance();
  const { isCartOpen, setIsCartOpen } = useCart();
  const { user, userProfile } = useAuth();
  
  const isSeller = userProfile?.role === "seller";
  const isAuthenticated = !!user; // Check if user is actually logged in

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

  // Search functionality
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const searchProducts = async () => {
        try {
          const products = await StockService.getAllStockItems();
          const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSearchResults(filtered.slice(0, 5)); // Show top 5 results
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        }
      };
      
      const timeoutId = setTimeout(searchProducts, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Handle click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isMainPage = pathname === "/";

  if (isAuthPage || pathname.startsWith("/dashboard")) return null;

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
                href="/main"
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
            
            {/* Center search bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 2) {
                      setShowSearchResults(true);
                    } else {
                      setShowSearchResults(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setShowSearchResults(true);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (searchQuery.trim()) {
                        setShowSearchResults(false);
                        window.location.href = `/store?search=${encodeURIComponent(searchQuery)}`;
                      }
                    }
                  }}
                  className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF0059] focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                {/* Live Search Results */}
                {searchQuery && searchQuery.length >= 2 && showSearchResults && searchResults.length > 0 && (
                  <div 
                    ref={searchResultsRef}
                    className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-auto"
                  >
                    {searchResults.map(product => (
                      <div 
                        key={product.id} 
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery("");
                          window.location.href = `/store/${product.id}`;
                        }}
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                          {(() => {
                            const imageUrl = getBestProductImage(product);
                            return imageUrl ? (
                              <img 
                                src={imageUrl}
                                alt={product.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 text-center border-t">
                      <button 
                        onClick={() => {
                          setShowSearchResults(false);
                          window.location.href = `/store?search=${encodeURIComponent(searchQuery)}`;
                        }}
                        className="text-sm text-pink-600 hover:text-pink-800 font-medium"
                      >
                        View all results for &ldquo;{searchQuery}&rdquo;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right section */}
            <div className="flex items-center space-x-4">              {/* Cart icon (if logged in) */}
              {isAuthenticated && (
                <AnimatedCartIcon
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsCartOpen(true)}
                />
              )}

              {/* Auth buttons with integrated balance */}
              {isAuthenticated ? (
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
            {isAuthenticated ? (
              <>
                {/* Mobile search bar */}
                <div className="py-2 px-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          if (searchQuery.trim()) {
                            setIsMenuOpen(false);
                            window.location.href = `/store?search=${encodeURIComponent(searchQuery)}`;
                          }
                        }
                      }}
                      className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF0059] focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
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
                {/* Mobile search bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (searchQuery.trim()) {
                          setIsMenuOpen(false);
                          window.location.href = `/store?search=${encodeURIComponent(searchQuery)}`;
                        }
                      }
                    }}
                    className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF0059] focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
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
      {isAuthenticated && !isSeller && (
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
    </>
  );
}

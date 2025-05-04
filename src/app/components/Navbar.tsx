"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

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
  if (isAuthPage || pathname.startsWith("/dashboard")) return null;

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        !visible ? "-translate-y-full" : "translate-y-0"
      } ${isScrolled ? "bg-white shadow-sm" : "opacity-0"}`}
      style={{ transition: "transform 0.3s ease-in-out" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span
                className={`text-lg font-bold ${
                  isScrolled ? "text-[#FF0059]" : "text-white"
                }`}
              >
                TikTok
              </span>
              <span
                className={`ml-1 text-lg font-semibold ${
                  isScrolled ? "text-gray-900" : "text-white"
                }`}
              >
                Shop
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link
              href="/features"
              className={`text-sm font-medium ${
                isScrolled
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-200 hover:text-white"
              }`}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium ${
                isScrolled
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-200 hover:text-white"
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className={`text-sm font-medium ${
                isScrolled
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isScrolled
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
          </Link>
          <Link
            href="/register"
            className="block px-3 py-2 text-base font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

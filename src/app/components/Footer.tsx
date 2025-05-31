"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage || pathname.startsWith("/dashboard")) return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Platform
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  href="/how-it-works"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/seller-center"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Seller Center
                </Link>
              </li>
              <li>
                <Link
                  href="/business"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  TikTok for Business
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Marketplace
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Support
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  href="/help-center"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/safety-center"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Safety Center
                </Link>
              </li>
              <li>
                <Link
                  href="/community-guidelines"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Company
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  href="/about"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/newsroom"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Newsroom
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/impact"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Social Impact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  href="/terms"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            © {currentYear} TikTok Shop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { UserBalanceProvider } from "./components/UserBalanceContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TikTok Shop - Sell and Grow Your Business",
  description:
    "Join TikTok Shop to reach millions of potential customers and grow your business with our powerful e-commerce platform.",
  keywords: "tiktok shop, ecommerce, online business, selling platform",
  themeColor: "#ec4899",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className={`${inter.className} h-full`}>
        <UserBalanceProvider>
          <Navbar />
          <main className="min-h-full">{children}</main>
          <Footer />
        </UserBalanceProvider>
      </body>
    </html>
  );
}

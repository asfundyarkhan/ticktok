import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { UserBalanceProvider } from "./components/UserBalanceContext";
import { NewCartProvider } from "./components/NewCartContext";
import CartNotification from "./components/CartNotification";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import SuperadminStoreRedirect from "./components/SuperadminStoreRedirect";
import StockCleanupService from "./components/StockCleanupService";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TikTok Shop - Sell and Grow Your Business",
  description:
    "Join TikTok Shop to reach millions of potential customers and grow your business with our powerful e-commerce platform.",
  keywords: "tiktok shop, ecommerce, online business, selling platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <UserBalanceProvider>
            <NewCartProvider>
              <SuperadminStoreRedirect />
              <Navbar />
              <main className="min-h-screen pt-16 flex flex-col">
                {children}
              </main>
              <Footer />
              <CartNotification />
              <StockCleanupService />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                    maxWidth: "90vw",
                    margin: "0 auto",
                  },
                  success: {
                    iconTheme: {
                      primary: "#FF0059",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </NewCartProvider>
          </UserBalanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { UserBalanceProvider } from "./components/UserBalanceContext";
import { CartProvider } from "./components/CartContext";
import CartNotification from "./components/CartNotification";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import SuperadminStoreRedirect from "./components/SuperadminStoreRedirect";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className={`${inter.className} h-full`}>
        <AuthProvider>
          <UserBalanceProvider>
            <CartProvider>              <SuperadminStoreRedirect />
              <Navbar />
              <main className="min-h-full">{children}</main>
              <Footer />
              <CartNotification />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    iconTheme: {
                      primary: "#FF0059",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </CartProvider>
          </UserBalanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

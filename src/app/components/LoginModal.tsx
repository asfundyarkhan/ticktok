"use client";

import { useState } from "react";
import { X, User, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

export default function LoginModal({ isOpen, onClose, productName }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  // Show a message if opened from a product click
  const infoMessage = productName
    ? `Please log in to access full features.`
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
      } else {
        await signUp(email, password, displayName, "");
        toast.success("Account created successfully!");
      }
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-2 text-center">
          {isLogin ? "Sign In" : "Sign Up"}
        </h2>
        {infoMessage && (
          <div className="mb-4 text-center text-blue-600 font-medium">
            {infoMessage}
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 font-medium text-pink-600 hover:text-pink-700"
              >
                {isLogin ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Info about store access */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Why sign in?
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Access full product details and reviews</li>
              <li>• Add items to your cart and checkout</li>
              <li>• Track your orders and purchase history</li>
              <li>• Get personalized recommendations</li>
              {!isLogin && (
                <li>• Become a seller and list your own products</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

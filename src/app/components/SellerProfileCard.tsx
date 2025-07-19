"use client";

import React, { useState, useEffect } from "react";
import { User, Star, Package, Calendar, MapPin, Verified } from "lucide-react";
import { UserService } from "@/services/userService";
import { UserProfile } from "@/context/AuthContext";
import Link from "next/link";

interface SellerProfileCardProps {
  sellerId: string;
  sellerName?: string;
  className?: string;
  showStats?: boolean;
  compact?: boolean;
}

interface SellerStats {
  totalProducts: number;
  rating: number;
  reviewCount: number;
  joinDate: string;
}

export default function SellerProfileCard({
  sellerId,
  sellerName,
  className = "",
  showStats = true,
  compact = false,
}: SellerProfileCardProps) {
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSellerProfile = async () => {
      if (!sellerId) return;
      
      setLoading(true);
      try {
        const profile = await UserService.getUserProfile(sellerId);
        setSellerProfile(profile);
        
        if (showStats) {
          // Mock stats for now - you can implement actual stats fetching
          setStats({
            totalProducts: Math.floor(Math.random() * 50) + 10,
            rating: 4.5 + Math.random() * 0.5,
            reviewCount: Math.floor(Math.random() * 100) + 20,
            joinDate: profile?.createdAt?.toDate?.()?.toLocaleDateString() || "Recently",
          });
        }
      } catch (error) {
        console.error("Error loading seller profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSellerProfile();
  }, [sellerId, showStats]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = sellerProfile?.displayName || sellerName || "Unknown Seller";
  const isVerified = sellerProfile?.role === "seller" || sellerProfile?.role === "admin" || sellerProfile?.role === "superadmin";

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span className="font-medium">{displayName}</span>
          {isVerified && (
            <Verified className="w-4 h-4 text-blue-500" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Seller Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {displayName}
            </h3>
            {isVerified && (
              <Verified className="w-5 h-5 text-blue-500 flex-shrink-0" title="Verified Seller" />
            )}
          </div>

          {/* Seller Stats */}
          {showStats && stats && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{stats.rating.toFixed(1)}</span>
                  <span>({stats.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{stats.totalProducts} products</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Joined {stats.joinDate}</span>
              </div>

              {sellerProfile?.location && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{sellerProfile.location}</span>
                </div>
              )}
            </div>
          )}

          {/* View Store Button */}
          <div className="mt-3">
            <Link 
              href={`/store?seller=${sellerId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="w-4 h-4" />
              View Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

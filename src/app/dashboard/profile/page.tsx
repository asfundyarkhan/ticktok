"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "../../components/Loading";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const {
    user,
    userProfile,
    loading: authLoading,
    updateUserProfile,
  } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard/profile");
    }
  }, [user, authLoading, router]);

  // Load user profile data when available
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.displayName || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUserProfile({
        displayName: profileData.fullName,
        phone: profileData.phone,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };
  // Show loading while checking auth or loading profile
  if (authLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // This should never render because of the redirect, but just in case
  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
          Please sign in to view and edit your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {profileData.fullName || "My Profile"}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-600">user_id:</span>
          <span className="px-2 py-1 text-sm bg-gray-100 rounded-md">
            {user?.uid || ""}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">My Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Full name
            </label>
            <input
              type="text"
              id="fullName"
              value={profileData.fullName}
              onChange={(e) =>
                setProfileData({ ...profileData, fullName: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone number
            </label>
            <input
              type="tel"
              id="phone"
              value={profileData.phone}
              onChange={(e) =>
                setProfileData({ ...profileData, phone: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Update"}
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

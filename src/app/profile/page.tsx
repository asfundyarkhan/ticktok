"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "../components/Loading";
import EmailVerificationCheck from "../components/EmailVerificationCheck";
import { Save, Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  return (
    <EmailVerificationCheck enforceVerification={false}>
      <UserProfileContent />
    </EmailVerificationCheck>
  );
}

function UserProfileContent() {
  const { user, userProfile, loading, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });

  // Handle unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      // Redirect unauthenticated users to login
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }, [loading, user]);

  // Initialize form data from user profile
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        address: {
          street: userProfile.address?.street || "",
          city: userProfile.address?.city || "",
          state: userProfile.address?.state || "",
          zip: userProfile.address?.zip || "",
          country: userProfile.address?.country || "",
        },
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Handle nested address fields
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setProfileData({
        ...profileData,
        address: {
          ...profileData.address,
          [addressField]: value,
        },
      });
    } else {
      setProfileData({
        ...profileData,
        [name]: value,
      });
    }
  };

  const handleSave = async () => {
    if (!user || !userProfile) return;

    try {
      setIsSaving(true);

      // Update the user profile in Firestore and Auth
      await updateUserProfile({
        displayName: profileData.displayName,
        phone: profileData.phone,
        address: profileData.address,
        updatedAt: new Date(),
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile header */}
          <div className="relative h-48 bg-gradient-to-r from-pink-500 to-purple-600">
            <div className="absolute bottom-0 left-0 transform translate-y-1/2 ml-6">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white">
                {userProfile.photoURL ? (
                  <Image
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || "User"}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-500">
                      {userProfile.displayName?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile content */}
          <div className="pt-20 pb-6 px-6">
            {/* User info */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userProfile.displayName || "User Profile"}
                </h1>
                <p className="text-sm text-gray-500">
                  Member since {userProfile.createdAt.toLocaleDateString()}
                </p>
                <div className="mt-1 flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userProfile.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : userProfile.role === "seller"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {userProfile.role.charAt(0).toUpperCase() +
                      userProfile.role.slice(1)}
                  </span>

                  {user?.emailVerified ? (
                    <span className="ml-2 inline-flex items-center text-xs text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3 mr-1" />{" "}
                      <Link href="/verify-email" className="hover:underline">
                        Verify email
                      </Link>
                    </span>
                  )}
                </div>
              </div>              <div className="flex space-x-2">
                {userProfile.role === "seller" && (
                  <Link
                    href="/stock/inventory"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    Inventory
                  </Link>
                )}
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none disabled:bg-pink-300"
                  >
                    {isSaving ? (
                      <span className="flex items-center">
                        <span className="mr-2">
                          <LoadingSpinner size="sm" />
                        </span>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Save className="h-4 w-4 mr-1" /> Save
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Profile form */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    id="displayName"
                    value={profileData.displayName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={profileData.email}
                    disabled={true} // Email can't be changed
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="balance"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Account Balance
                  </label>
                  <div className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-50 rounded-md shadow-sm text-sm text-gray-700">
                    ${userProfile.balance.toFixed(2)}
                  </div>
                </div>

                {/* Address fields */}
                <div className="sm:col-span-2 border-t border-gray-200 pt-6 mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Shipping Address
                  </h3>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address.street"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    id="address.street"
                    value={profileData.address.street}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address.city"
                    className="block text-sm font-medium text-gray-700"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    id="address.city"
                    value={profileData.address.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address.state"
                    className="block text-sm font-medium text-gray-700"
                  >
                    State / Province
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    id="address.state"
                    value={profileData.address.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address.zip"
                    className="block text-sm font-medium text-gray-700"
                  >
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    name="address.zip"
                    id="address.zip"
                    value={profileData.address.zip}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address.country"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Country
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    id="address.country"
                    value={profileData.address.country}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Security section */}
            <div className="mt-10 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-gray-500" /> Security
              </h3>

              <div className="mt-4 space-y-4">
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-pink-600 hover:text-pink-500"
                >
                  Change password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { LoadingSpinner } from "../components/Loading";
import EmailVerificationCheck from "../components/EmailVerificationCheck";
import SellerWalletDashboard from "../components/SellerWalletDashboard";
import ProfileReceiptsSection from "../components/ProfileReceiptsSection";
import { Save, Shield, CheckCircle, AlertCircle, Camera } from "lucide-react";
import { StorageService } from "@/services/storageService";
import { toast } from "react-hot-toast";

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  
  const [paymentInfo, setPaymentInfo] = useState({
    usdtWalletAddress: "",
    bankInfo: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      routingNumber: "",
      iban: "",
      swiftCode: "",
    },
  });
  // Handle unauthenticated users and admin/superadmin redirection
  useEffect(() => {
    if (!loading && !user) {
      // Redirect unauthenticated users to login
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    // Redirect admin and superadmin users to their respective dashboards
    if (!loading && userProfile) {
      if (userProfile.role === 'admin') {
        console.log('Admin user attempting to access profile page, redirecting to admin dashboard');
        window.location.href = '/dashboard/admin';
        return;
      } else if (userProfile.role === 'superadmin') {
        console.log('Superadmin user attempting to access profile page, redirecting to main dashboard');
        window.location.href = '/dashboard';
        return;
      }
    }
  }, [loading, user, userProfile]);

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
      
      setPaymentInfo({
        usdtWalletAddress: userProfile.paymentInfo?.usdtWalletAddress || "",
        bankInfo: {
          accountName: userProfile.paymentInfo?.bankInfo?.accountName || "",
          accountNumber: userProfile.paymentInfo?.bankInfo?.accountNumber || "",
          bankName: userProfile.paymentInfo?.bankInfo?.bankName || "",
          routingNumber: userProfile.paymentInfo?.bankInfo?.routingNumber || "",
          iban: userProfile.paymentInfo?.bankInfo?.iban || "",
          swiftCode: userProfile.paymentInfo?.bankInfo?.swiftCode || "",
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

      const updateData: Partial<UserProfile> = {
        displayName: profileData.displayName,
        phone: profileData.phone,
        address: profileData.address,
        updatedAt: new Date(),
      };

      // Include payment info for sellers, admins, and superadmins
      if (userProfile.role === 'seller' || userProfile.role === 'admin' || userProfile.role === 'superadmin') {
        updateData.paymentInfo = paymentInfo;
      }

      // Update the user profile in Firestore and Auth
      await updateUserProfile(updateData);

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingPhoto(true);
      
      // Upload image to Firebase Storage
      const photoURL = await StorageService.uploadProfilePicture(user.uid, file);
      
      // Update user profile with new photo URL
      await updateUserProfile({
        photoURL: photoURL,
        updatedAt: new Date(),
      });

      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload profile picture");
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile header */}
          <div className="relative h-32 sm:h-48 bg-gradient-to-r from-pink-500 to-purple-600">
            <div className="absolute bottom-0 left-4 sm:left-6 transform translate-y-1/2">
              <div className="relative">
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-white overflow-hidden bg-white">
                  {userProfile.photoURL ? (
                    <Image
                      src={userProfile.photoURL}
                      alt={userProfile.displayName || "User"}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl sm:text-4xl font-bold text-gray-500">
                        {userProfile.displayName?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Camera icon for photo upload */}
                <button
                  onClick={triggerFileInput}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-pink-600 hover:bg-pink-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:bg-gray-400"
                  title="Change profile picture"
                >
                  {isUploadingPhoto ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Profile content */}
          <div className="pt-12 sm:pt-20 pb-6 px-4 sm:px-6">
            {/* User info */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 space-y-4 sm:space-y-0">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userProfile.displayName || "User Profile"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Member since {userProfile.createdAt.toLocaleDateString()}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
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
                    <span className="inline-flex items-center text-xs text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      <Link href="/verify-email" className="hover:underline">
                        Verify email
                      </Link>
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action buttons - Mobile responsive */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                {userProfile.role === "seller" && (
                  <>
                    <Link
                      href="/stock/listings"
                      className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none text-center"
                    >
                      My Listings
                    </Link>
                    <Link
                      href="/stock/orders"
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none text-center"
                    >
                      Orders
                    </Link>
                  </>
                )}
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none disabled:bg-pink-300"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center">
                        <span className="mr-2">
                          <LoadingSpinner size="sm" />
                        </span>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
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

            {/* Payment Information Section - Only for sellers, admins, and superadmins */}
            {(userProfile.role === 'seller' || userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
              <div className="mt-10 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Information
                </h3>
                
                <div className="space-y-6">
                  {/* USDT Wallet Address */}
                  <div>
                    <label
                      htmlFor="usdtWallet"
                      className="block text-sm font-medium text-gray-700"
                    >
                      USDT Wallet Address (TRC20)
                    </label>
                    <input
                      type="text"
                      id="usdtWallet"
                      value={paymentInfo.usdtWalletAddress}
                      onChange={(e) => setPaymentInfo({
                        ...paymentInfo,
                        usdtWalletAddress: e.target.value
                      })}
                      disabled={!isEditing}
                      placeholder="Enter your USDT wallet address"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  {/* Bank Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 mt-6">Bank Information (Optional)</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="accountName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Account Name
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        value={paymentInfo.bankInfo.accountName}
                        onChange={(e) => setPaymentInfo({
                          ...paymentInfo,
                          bankInfo: { ...paymentInfo.bankInfo, accountName: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Account Number
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={paymentInfo.bankInfo.accountNumber}
                        onChange={(e) => setPaymentInfo({
                          ...paymentInfo,
                          bankInfo: { ...paymentInfo.bankInfo, accountNumber: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="bankName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Bank Name
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        value={paymentInfo.bankInfo.bankName}
                        onChange={(e) => setPaymentInfo({
                          ...paymentInfo,
                          bankInfo: { ...paymentInfo.bankInfo, bankName: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="routingNumber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Routing Number
                      </label>
                      <input
                        type="text"
                        id="routingNumber"
                        value={paymentInfo.bankInfo.routingNumber}
                        onChange={(e) => setPaymentInfo({
                          ...paymentInfo,
                          bankInfo: { ...paymentInfo.bankInfo, routingNumber: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="iban"
                        className="block text-sm font-medium text-gray-700"
                      >
                        IBAN (International)
                      </label>
                      <input
                        type="text"
                        id="iban"
                        value={paymentInfo.bankInfo.iban}
                        onChange={(e) => setPaymentInfo({
                          ...paymentInfo,
                          bankInfo: { ...paymentInfo.bankInfo, iban: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="swiftCode"
                        className="block text-sm font-medium text-gray-700"
                      >
                        SWIFT Code
                      </label>
                      <input
                        type="text"
                        id="swiftCode"
                        value={paymentInfo.bankInfo.swiftCode}
                        onChange={(e) => setPaymentInfo({
                          ...paymentInfo,
                          bankInfo: { ...paymentInfo.bankInfo, swiftCode: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

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

        {/* Seller Wallet Dashboard */}
        {userProfile.role === "seller" && (
          <div className="mt-6">
            <SellerWalletDashboard sellerId={userProfile.uid} />
          </div>
        )}

        {/* Payment Receipts Section */}
        <div className="mt-6">
          <ProfileReceiptsSection userId={userProfile.uid} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "../../components/Loading";
import { UserProfile } from "../../../context/AuthContext";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: Partial<UserProfile> = {
        displayName: profileData.fullName,
        phone: profileData.phone,
      };

      // Only include payment info for sellers, admins, and superadmins
      if (userProfile?.role === 'seller' || userProfile?.role === 'admin' || userProfile?.role === 'superadmin') {
        updateData.paymentInfo = paymentInfo;
      }

      await updateUserProfile(updateData);

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

          {/* Payment Information Section - Show role info and fields */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Information
              </h3>
              <p className="text-sm text-gray-600">
                Current Role: {userProfile?.role || 'No role'} 
                {(userProfile?.role === 'seller' || userProfile?.role === 'admin' || userProfile?.role === 'superadmin') 
                  ? ' - Payment fields available' 
                  : ' - Payment fields not available for this role'}
              </p>
            </div>
            
            {/* Always show for testing - remove role restriction temporarily */}
            <div className="space-y-6">
                {/* USDT Wallet Address */}
                <div>
                  <label htmlFor="usdtWallet" className="block text-sm font-medium text-gray-700">
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
                    placeholder="Enter your USDT wallet address"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>

                {/* Bank Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3 mt-6">Bank Information (Optional)</h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>
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

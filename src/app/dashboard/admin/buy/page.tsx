"use client";

import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Eye, User, Package } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { AdminRoute } from '../../../components/AdminRoute';
import { StockService } from '../../../../services/stockService';
import { UserService } from '../../../../services/userService';
import { StockListing } from '../../../../types/marketplace';
import { LoadingSpinner } from '../../../components/Loading';
import { toast } from 'react-hot-toast';

interface ListingWithSeller extends StockListing {
  sellerName: string;
  sellerEmail: string;
}

function AdminBuyPageContent() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [filteredListings, setFilteredListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = StockService.subscribeToAllListings(
      async (stockListings) => {
        try {
          const listingsWithSellers: ListingWithSeller[] = [];
            for (const listing of stockListings) {
            try {
              const sellerProfile = await UserService.getUserProfile(listing.sellerId);
              listingsWithSellers.push({
                ...listing,
                sellerName: sellerProfile?.displayName || sellerProfile?.email?.split('@')[0] || 'Unknown Seller',
                sellerEmail: sellerProfile?.email || 'No email'
              });
            } catch (error) {
              console.error(`Error fetching seller profile for ${listing.sellerId}:`, error);
              listingsWithSellers.push({
                ...listing,
                sellerName: 'Unknown Seller',
                sellerEmail: 'No email'
              });
            }
          }
          
          setListings(listingsWithSellers);
          setLoading(false);
        } catch (error) {
          console.error('Error processing listings:', error);
          toast.error('Failed to load listings');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error subscribing to listings:', error);
        toast.error('Failed to load listings');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredListings(listings);
    } else {
      const filtered = listings.filter(listing =>        listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredListings(filtered);
    }
  }, [searchQuery, listings]);

  const handleViewDetails = (listing: ListingWithSeller) => {
    setSelectedListing(listing);
    setShowModal(true);
  };
  const handleAdminPurchase = async (listing: ListingWithSeller) => {
    if (!user || !listing.id) {
      toast.error('Unable to process purchase. Please try again.');
      return;
    }

    if (listing.quantity <= 0) {
      toast.error('This item is out of stock.');
      return;
    }
    
    try {
      setPurchasing(listing.id);
      
      // Call admin-specific purchase method
      const result = await StockService.processAdminPurchase(
        user.uid,
        listing.id,
        1, // Always buy 1 item
        listing.sellerId,
        listing.price
      );
      
      if (result.success) {
        toast.success(`Successfully purchased ${listing.name} from ${listing.sellerName}`);
        setShowModal(false);
      } else {
        toast.error(result.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error during admin purchase:', error);
      if (error instanceof Error) {
        toast.error(`Purchase failed: ${error.message}`);
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Buy</h1>
        <p className="text-gray-600">Purchase any listing created by sellers</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by product name, code, seller, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Listings</p>
              <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Sellers</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(listings.map(l => l.sellerId)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900">{filteredListings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={listing.mainImage || listing.images?.[0] || '/images/placeholders/t-shirt.svg'}
                          alt={listing.name}
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholders/t-shirt.svg';
                          }}
                        />
                      </div>                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                        <div className="text-sm text-gray-500">{listing.productId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{listing.sellerName}</div>
                    <div className="text-sm text-gray-500">{listing.sellerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {listing.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${listing.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {listing.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewDetails(listing)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleAdminPurchase(listing)}
                      disabled={purchasing === listing.id || listing.quantity === 0}
                      className="text-green-600 hover:text-green-900 inline-flex items-center disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {purchasing === listing.id ? 'Buying...' : 'Buy'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No listings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No sellers have created listings yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal for viewing details */}
      {showModal && selectedListing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <img
                  src={selectedListing.mainImage || selectedListing.images?.[0] || '/images/placeholders/t-shirt.svg'}
                  alt={selectedListing.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholders/t-shirt.svg';
                  }}
                />
                  <div>
                  <h4 className="font-medium text-gray-900">{selectedListing.name}</h4>
                  <p className="text-sm text-gray-500">{selectedListing.productId}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Seller</p>
                  <p className="font-medium">{selectedListing.sellerName}</p>
                  <p className="text-sm text-gray-500">{selectedListing.sellerEmail}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm">{selectedListing.description || 'No description available'}</p>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="text-lg font-bold text-green-600">${selectedListing.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available</p>
                    <p className="text-lg font-bold">{selectedListing.quantity}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => handleAdminPurchase(selectedListing)}
                  disabled={purchasing === selectedListing.id || selectedListing.quantity === 0}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {purchasing === selectedListing.id ? 'Purchasing...' : 'Buy 1 Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBuyPage() {
  return (
    <AdminRoute>
      <AdminBuyPageContent />
    </AdminRoute>
  );
}

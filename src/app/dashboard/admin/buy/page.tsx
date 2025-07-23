"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
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
  // Additional fields for grouped instances
  totalQuantity?: number;
  instances?: StockListing[];
  availableQuantity?: number;
}

function AdminBuyPageContent() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = StockService.subscribeToAllListings(
      async (stockListings) => {
        try {
          setLoading(true);
          
          // Show listings immediately without seller info
          const basicListings: ListingWithSeller[] = stockListings.map(listing => ({
            ...listing,
            sellerName: 'Loading...',
            sellerEmail: 'Loading...'
          }));
          setListings(basicListings);
          setLoading(false); // Set loading to false early for better UX
          
          // Get unique seller IDs to minimize API calls
          const uniqueSellerIds = [...new Set(stockListings.map(listing => listing.sellerId))];
          
          // Batch fetch seller profiles using Promise.allSettled for better error handling
          const sellerProfilePromises = uniqueSellerIds.map(async (sellerId) => {
            try {
              const profile = await UserService.getUserProfile(sellerId);
              return {
                sellerId,
                sellerName: profile?.displayName || profile?.email?.split('@')[0] || 'Unknown Seller',
                sellerEmail: profile?.email || 'No email'
              };
            } catch (error) {
              console.error(`Error fetching seller profile for ${sellerId}:`, error);
              return {
                sellerId,
                sellerName: 'Unknown Seller',
                sellerEmail: 'No email'
              };
            }
          });
          
          const sellerResults = await Promise.allSettled(sellerProfilePromises);
          
          // Create seller info map for quick lookup
          const sellerInfoMap = new Map();
          sellerResults.forEach((result) => {
            if (result.status === 'fulfilled') {
              const { sellerId, sellerName, sellerEmail } = result.value;
              sellerInfoMap.set(sellerId, { sellerName, sellerEmail });
            }
          });
          
          // Update listings with seller information
          const listingsWithSellers: ListingWithSeller[] = stockListings.map(listing => ({
            ...listing,
            sellerName: sellerInfoMap.get(listing.sellerId)?.sellerName || 'Unknown Seller',
            sellerEmail: sellerInfoMap.get(listing.sellerId)?.sellerEmail || 'No email'
          }));
          
          // Group product instances for better display while preserving seller info
          const groupedListings = StockService.groupProductInstances(listingsWithSellers).map(groupedListing => ({
            ...groupedListing,
            sellerName: sellerInfoMap.get(groupedListing.sellerId)?.sellerName || 'Unknown Seller',
            sellerEmail: sellerInfoMap.get(groupedListing.sellerId)?.sellerEmail || 'No email'
          })) as ListingWithSeller[];
          
          setListings(groupedListings);
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
  // Memoized filtered listings for better performance
  const filteredListings = useMemo(() => {
    if (!debouncedSearchQuery.trim() && selectedCategory === "all") {
      return listings;
    }
    
    return listings.filter(listing => {
      const matchesSearch = !debouncedSearchQuery.trim() || (
        listing.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        listing.productId.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        listing.sellerName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        listing.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
      
      const matchesCategory = selectedCategory === "all" || 
        listing.category?.toLowerCase() === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [debouncedSearchQuery, selectedCategory, listings]);

  const handleViewDetails = (listing: ListingWithSeller) => {
    setSelectedListing(listing);
    setShowModal(true);
  };
  const handleAdminPurchase = async (listing: ListingWithSeller) => {
    if (!user || !listing.id) {
      toast.error('Unable to process purchase. Please try again.');
      return;
    }

    // Check availability - use availableQuantity for instances, quantity for regular listings
    const availableQty = listing.availableQuantity !== undefined ? listing.availableQuantity : listing.quantity;
    
    if (availableQty <= 0) {
      toast.error('This item is out of stock.');
      return;
    }
    
    try {
      setPurchasing(listing.id);
      
      let result;
      
      // Check if this is a product instance (grouped display)
      if (listing.isInstance || listing.instances) {
        // Use instance purchase method for products with instances
        const originalProductId = listing.originalProductId || 
                                listing.instances?.[0]?.originalProductId || 
                                listing.productId;
        
        result = await StockService.processAdminInstancePurchase(
          user.uid,
          originalProductId,
          1, // Always buy 1 instance
          listing.sellerId,
          listing.price
        );
      } else {
        // Use legacy purchase method for traditional listings
        result = await StockService.processAdminPurchase(
          user.uid,
          listing.id,
          1, // Always buy 1 item
          listing.sellerId,
          listing.price
        );
      }
      
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
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Admin Buy</h1>
        <p className="text-gray-600 text-sm sm:text-base">Purchase any listing created by sellers</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 sm:mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by product name, code, seller, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
              Category:
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="clothing">Clothing</option>
              <option value="electronics">Electronics</option>
              <option value="home">Home & Kitchen</option>
              <option value="beauty">Beauty</option>
              <option value="toys">Toys & Games</option>
              <option value="books">Books</option>
              <option value="accessories">Accessories</option>
              <option value="sports">Sports</option>
              <option value="liquor">Liquor</option>
              <option value="gym">Gym</option>
              <option value="sex">Sex</option>
              <option value="makeup">Makeup</option>
              <option value="luxury">Luxury</option>
              <option value="general">General</option>
              <option value="other">Other</option>
            </select>
          </div>          
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="w-full sm:w-auto px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>
        
        {(searchQuery || selectedCategory !== "all") && (
          <div className="text-sm text-gray-600">
            Showing {filteredListings.length} of {listings.length} listings
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategory !== "all" && ` in ${selectedCategory}`}
          </div>
        )}
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
      </div>      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                        <Image
                          className="h-12 w-12 rounded-lg object-cover"
                          src={listing.mainImage || listing.images?.[0] || '/images/placeholders/t-shirt.svg'}
                          alt={listing.name}
                          width={48}
                          height={48}
                          priority={false}
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
                    {listing.availableQuantity !== undefined ? (
                      <div>
                        <span className="font-medium">{listing.availableQuantity}</span>
                        {listing.totalQuantity !== listing.availableQuantity && (
                          <span className="text-gray-500 ml-1">/ {listing.totalQuantity}</span>
                        )}
                        {listing.instances && (
                          <div className="text-xs text-gray-500">
                            {listing.instances.length} instances
                          </div>
                        )}
                      </div>
                    ) : (
                      listing.quantity
                    )}
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
                      disabled={purchasing === listing.id || (listing.availableQuantity !== undefined ? listing.availableQuantity : listing.quantity) === 0}
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

        {filteredListings.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No listings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No sellers have created listings yet.'}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Total listings in database: {listings.length}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredListings.map((listing) => (
          <div key={listing.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {/* Product Header */}
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0">
                <Image
                  className="h-16 w-16 rounded-lg object-cover"
                  src={listing.mainImage || listing.images?.[0] || '/images/placeholders/t-shirt.svg'}
                  alt={listing.name}
                  width={64}
                  height={64}
                  priority={false}
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholders/t-shirt.svg';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{listing.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{listing.productId}</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {listing.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-t border-gray-100 pt-3 mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Seller</p>
              <p className="text-sm font-medium text-gray-900">{listing.sellerName}</p>
              <p className="text-xs text-gray-500">{listing.sellerEmail}</p>
            </div>

            {/* Price and Quantity */}
            <div className="border-t border-gray-100 pt-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Price</p>
                  <p className="text-lg font-bold text-green-600">${listing.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Available</p>
                  <div className="text-lg font-bold text-gray-900">
                    {listing.availableQuantity !== undefined ? (
                      <div>
                        <span>{listing.availableQuantity}</span>
                        {listing.totalQuantity !== listing.availableQuantity && (
                          <span className="text-gray-500 text-sm ml-1">/ {listing.totalQuantity}</span>
                        )}
                        {listing.instances && (
                          <div className="text-xs text-gray-500 font-normal">
                            {listing.instances.length} instances
                          </div>
                        )}
                      </div>
                    ) : (
                      listing.quantity
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleViewDetails(listing)}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center justify-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button
                  onClick={() => handleAdminPurchase(listing)}
                  disabled={purchasing === listing.id || (listing.availableQuantity !== undefined ? listing.availableQuantity : listing.quantity) === 0}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center justify-center"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {purchasing === listing.id ? 'Buying...' : 'Buy Now'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredListings.length === 0 && !loading && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No listings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No sellers have created listings yet.'}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Total listings in database: {listings.length}
            </p>
          </div>
        )}
      </div>      {/* Mobile-Friendly Modal for viewing details */}
      {showModal && selectedListing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-md mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="w-full">
                  <Image
                    src={selectedListing.mainImage || selectedListing.images?.[0] || '/images/placeholders/t-shirt.svg'}
                    alt={selectedListing.name}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg"
                    priority={false}
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholders/t-shirt.svg';
                    }}
                  />
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Product</p>
                  <h4 className="font-medium text-gray-900 text-base">{selectedListing.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">ID: {selectedListing.productId}</p>
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Seller</p>
                  <p className="font-medium text-gray-900">{selectedListing.sellerName}</p>
                  <p className="text-sm text-gray-500">{selectedListing.sellerEmail}</p>
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Category</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {selectedListing.category}
                  </span>
                </div>
                
                {selectedListing.description && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm text-gray-700">{selectedListing.description}</p>
                  </div>
                )}
                
                <div className="border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Price</p>
                      <p className="text-xl font-bold text-green-600">${selectedListing.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Available</p>
                      <div className="text-xl font-bold text-gray-900">
                        {selectedListing.availableQuantity !== undefined ? (
                          <div>
                            <span>{selectedListing.availableQuantity}</span>
                            {selectedListing.totalQuantity !== selectedListing.availableQuantity && (
                              <span className="text-gray-500 text-sm ml-1">/ {selectedListing.totalQuantity}</span>
                            )}
                            {selectedListing.instances && (
                              <div className="text-xs text-gray-500 font-normal">
                                {selectedListing.instances.length} instances
                              </div>
                            )}
                          </div>
                        ) : (
                          selectedListing.quantity
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleAdminPurchase(selectedListing)}
                    disabled={purchasing === selectedListing.id || (selectedListing.availableQuantity !== undefined ? selectedListing.availableQuantity : selectedListing.quantity) === 0}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {purchasing === selectedListing.id ? 'Purchasing...' : 'Buy 1 Item'}
                  </button>
                </div>
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

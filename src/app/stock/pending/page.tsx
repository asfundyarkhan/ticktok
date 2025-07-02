"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import PaginationWithCustomRows from "../../components/PaginationWithCustomRows";
import ReceiptSubmission from "../../components/ReceiptSubmission";
// Previously imported PendingProduct, now using our own interface
import { toast } from "react-hot-toast";
import { Clock, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { getFirestoreImage } from "../../utils/imageHelpers";
import { createImageLogger, createPerfLogger } from "../../utils/logger";

// Create specialized loggers
const imgLogger = createImageLogger();
const perfLogger = createPerfLogger();

// Define our own interface without extending PendingProduct
interface PendingProductWithProfit {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  productId: string;
  productName: string;
  productImage: string | null; // Allow null for image
  mainImage: string | null; // Allow null for mainImage
  images?: string[] | undefined; // Images array can be undefined
  quantitySold: number;
  pricePerUnit: number;
  totalAmount: number;
  buyerId: string;
  buyerName?: string;
  buyerEmail?: string;
  saleDate: Date;
  status: string;
  receiptId?: string;
  createdAt: Date;
  updatedAt: Date;
  actualProfit?: number;
  depositRequired?: number;
  depositId?: string;
}

export default function PendingProductsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingProducts, setPendingProducts] = useState<PendingProductWithProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductForDeposit, setSelectedProductForDeposit] = useState<PendingProductWithProfit | null>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);

  // Check authentication and seller role
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/stock/pending");
      return;
    }

    if (!authLoading && userProfile && userProfile.role !== "seller") {
      toast.error("Only sellers can access orders");
      if (userProfile.role === "admin" || userProfile.role === "superadmin") {
        router.push("/dashboard");
      } else {
        router.push("/store");
      }
      return;
    }
  }, [user, userProfile, authLoading, router]);

  // Subscribe to real-time orders updates using the same data source as profile page
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let isComponentMounted = true;
    const endPerfTracking = perfLogger.perf('Loading pending profits');
    
    // Use PendingProductService to get actual orders with complete financial data
    const loadPendingProfits = async () => {
      try {
        const { PendingProductService } = await import("../../../services/pendingProductService");
        const endFetchTracking = perfLogger.perf('Data fetch');
        const pendingProducts = await PendingProductService.getSellerPendingProductsWithValidatedDeposits(user.uid);
        endFetchTracking();
        
        // Don't update state if component is unmounted
        if (!isComponentMounted) return;
        
        // Convert PendingProduct data to PendingProductWithProfit format
        const endMapTracking = perfLogger.perf('Data mapping');
        const productsWithProfit: PendingProductWithProfit[] = pendingProducts.map(product => {
          const quantitySold = product.quantitySold || 1;
          const pricePerUnit = product.pricePerUnit || 0;
          
          // Process product image for consistent format with other pages
          let productImage = product.productImage || null;
          
          // Log the image info for debugging
          imgLogger.debug(`Product ${product.productName} image:`, productImage);
          
          // Make sure Firebase URLs are properly formatted and only use valid URLs
          if (productImage && productImage.trim() !== "") {
            if (!productImage.startsWith("http") && !productImage.startsWith("data:")) {
              if (productImage.startsWith("/")) {
                // Convert relative paths to absolute Firebase Storage URLs
                productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(productImage.substring(1))}?alt=media`;
              } else {
                // Assume it's a Firebase Storage path
                productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(productImage)}?alt=media`;
              }
              imgLogger.debug(`Formatted Firebase image URL:`, productImage);
            } else {
              imgLogger.debug(`Using existing full URL:`, productImage);
            }
          } else {
            // If no valid image, set to null to avoid Next.js warnings
            productImage = null;
            imgLogger.warn(`No valid image found for product ${product.productName}`);
          }
          
          return {
            id: product.id || '',
            sellerId: product.sellerId,
            sellerName: product.sellerName || "", 
            sellerEmail: product.sellerEmail || "", 
            productId: product.productId,
            productName: product.productName,
            productImage: productImage, // Include product image from product data, can be null
            mainImage: productImage, // Also set as mainImage for compatibility with image helpers
            images: productImage ? [productImage] : undefined, // Only include images array if we have a valid image
            quantitySold: quantitySold,
            pricePerUnit: pricePerUnit,
            totalAmount: product.totalAmount,
            buyerId: product.buyerId || "", 
            buyerName: product.buyerName || "Admin", 
            buyerEmail: product.buyerEmail || "", 
            saleDate: product.saleDate,
            status: product.status, // Use the status directly from PendingProduct
            receiptId: product.receiptId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            actualProfit: product.actualProfit || 0, // Now available from enhanced data
            depositRequired: product.depositRequired || 0, // Now available from enhanced data
            depositId: product.depositId // Now available from enhanced data
          };
        });
        
        endMapTracking();
        
        // Use a single batch state update
        setPendingProducts(productsWithProfit);
        setLoading(false);
        
        endPerfTracking();
      } catch (error) {
        perfLogger.error("Error loading orders:", error);
        // Only show toast if this is the initial load, not during polling
        if (loading) {
          toast.error("Failed to load orders");
        }
        setLoading(false);
      }
    };

    // Initial load
    loadPendingProfits();

    // Set up polling for real-time updates (every 30 seconds instead of 15 for better performance)
    const interval = setInterval(loadPendingProfits, 30000);

    return () => {
      clearInterval(interval);
      isComponentMounted = false;
      perfLogger.info('Component cleanup executed');
    };
  }, [user?.uid, loading]);

  // Filter products based on search query
  const filteredProducts = pendingProducts.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.buyerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredProducts.length;
  const validRowsPerPage = isNaN(rowsPerPage) || rowsPerPage <= 0 ? 5 : rowsPerPage;
  const totalPages = Math.ceil(totalItems / validRowsPerPage);
  const startIndex = (currentPage - 1) * validRowsPerPage;
  const endIndex = Math.min(startIndex + validRowsPerPage, totalItems);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_deposit":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "deposit_submitted":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "deposit_approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-700" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending_deposit":
        return "Deposit Required";
      case "deposit_submitted":
        return "Deposit Submitted";
      case "deposit_approved":
        return "Deposit Approved";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_deposit":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "deposit_submitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "deposit_approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-green-200 text-green-900 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleUploadDeposit = async (pendingProduct: PendingProductWithProfit) => {
    try {
      // Since we now have the deposit info directly from the data, just set it
      setSelectedProductForDeposit({
        ...pendingProduct,
        depositRequired: pendingProduct.depositRequired || 0,
        actualProfit: pendingProduct.actualProfit || 0,
        depositId: pendingProduct.depositId // We already have the deposit ID
      });
      setShowDepositForm(true);
    } catch (error) {
      console.error("Error preparing deposit form:", error);
      toast.error("Error preparing deposit form");
    }
  };

  const handleDepositSubmitted = async () => {
    setShowDepositForm(false);
    setSelectedProductForDeposit(null);
    toast.success("Deposit receipt submitted successfully!");
    
    // Trigger a data refresh to show the updated status
    if (user?.uid) {
      try {
        const { PendingProductService } = await import("../../../services/pendingProductService");
        const pendingProducts = await PendingProductService.getSellerPendingProductsWithValidatedDeposits(user.uid);
        
        // Convert data as before
        const productsWithProfit: PendingProductWithProfit[] = pendingProducts.map(product => {
          const quantitySold = product.quantitySold || 1;
          const pricePerUnit = product.pricePerUnit || 0;
          
          let productImage = product.productImage || null;
          
          if (productImage && productImage.trim() !== "") {
            if (!productImage.startsWith("http") && !productImage.startsWith("data:")) {
              if (productImage.startsWith("/")) {
                productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(productImage.substring(1))}?alt=media`;
              } else {
                productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(productImage)}?alt=media`;
              }
            }
          } else {
            productImage = null;
          }
          
          return {
            id: product.id || '',
            sellerId: product.sellerId,
            sellerName: product.sellerName || "", 
            sellerEmail: product.sellerEmail || "", 
            productId: product.productId,
            productName: product.productName,
            productImage: productImage,
            mainImage: productImage,
            images: productImage ? [productImage] : undefined,
            quantitySold: quantitySold,
            pricePerUnit: pricePerUnit,
            totalAmount: product.totalAmount,
            buyerId: product.buyerId || "", 
            buyerName: product.buyerName || "Admin", 
            buyerEmail: product.buyerEmail || "", 
            saleDate: product.saleDate,
            status: product.status,
            receiptId: product.receiptId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            actualProfit: product.actualProfit || 0,
            depositRequired: product.depositRequired || 0,
            depositId: product.depositId
          };
        });
        
        setPendingProducts(productsWithProfit);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0059] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6">
        <h1 className="text-xl font-medium mb-6 text-gray-900">Account</h1>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:space-x-8 border-b border-gray-200 mb-6 overflow-x-auto">
          <Link
            href="/profile"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            General
          </Link>
          <Link
            href="/receipts-v2"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            Receipts
          </Link>
          <Link
            href="/stock"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            Product Pool
          </Link>
          <Link
            href="/stock/listings"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            Listings
          </Link>
          <Link
            href="/stock/pending"
            className="px-1 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-semibold whitespace-nowrap"
          >
            Orders
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
              Orders
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              View your past and current orders, including total cost and deposit details.
            </p>
          </div>
          <Link
            href="/stock"
            className="mt-4 sm:mt-0 px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium hover:bg-[#E0004D] transition-colors"
          >
            Buy More Stock
          </Link>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Orders Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>View your past and current orders, including total cost and deposit details.</p>
                </div>
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search by product name, buyer, or status..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#FF0059] focus:border-[#FF0059]"
          />
        </div>

        {/* Products List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {currentProducts.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 text-left px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="py-3 text-left px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buyer
                      </th>
                      <th className="py-3 text-left px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Sold
                      </th>
                      <th className="py-3 text-left px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount & Profit
                      </th>
                      <th className="py-3 text-left px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 text-left px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Date
                      </th>
                      <th className="py-3 text-left px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentProducts.map((product) => (
                      <tr key={product.id} className="text-sm">
                        <td className="py-4 pl-2 pr-6">
                          <div className="flex items-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden mr-4">
                              {(() => {
                                const imageConfig = getFirestoreImage(product);
                                return imageConfig ? (
                                  <Image
                                    src={imageConfig.src}
                                    unoptimized={imageConfig.unoptimized}
                                    alt={product.productName}
                                    width={64}
                                    height={64}
                                    style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                                    className="object-cover"
                                    onError={(e) => {
                                      imgLogger.error("Desktop image failed to load:", e.currentTarget.src);
                                    }}
                                    priority
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-xs text-gray-400">No image</span>
                                  </div>
                                );
                              })()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{product.productName}</div>
                              <div className="text-sm text-gray-500">ID: {product.productId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          <div>
                            <div className="font-medium">{product.buyerName || "Unknown Buyer"}</div>
                            <div className="text-sm text-gray-500">{product.buyerEmail}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          <div className="flex items-center">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                              {product.quantitySold} units
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-green-600">
                              ${product.totalAmount.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Sale: ${product.pricePerUnit.toFixed(2)} × {product.quantitySold}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              Your Profit: ${(product.actualProfit || 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-orange-600 font-medium">
                              Deposit Required: ${(product.depositRequired || 0).toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(
                              product.status
                            )}`}
                          >
                            {getStatusIcon(product.status)}
                            <span className="ml-2">{getStatusText(product.status)}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {product.saleDate.toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          {product.status === "pending_deposit" && (
                            <button
                              onClick={() => handleUploadDeposit(product)}
                              className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium hover:bg-[#E0004D] transition-colors"
                            >
                              Submit Deposit Receipt
                            </button>
                          )}
                          {product.status === "deposit_submitted" && (
                            <div className="flex items-center text-sm">
                              <Clock className="w-4 h-4 text-blue-500 mr-2" />
                              <span className="text-blue-600">Receipt Submitted - Awaiting Approval</span>
                            </div>
                          )}
                          {(product.status === "deposit_approved" || product.status === "completed") && (
                            <div className="flex items-center text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              <span className="text-green-600">
                                {product.status === "completed" ? "Completed - Profit Added" : "Approved - Profit Added"}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {currentProducts.map((product) => (
                  <div key={product.id} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {(() => {
                          const imageConfig = getFirestoreImage(product);
                          return imageConfig ? (
                            <Image
                              src={imageConfig.src}
                              unoptimized={imageConfig.unoptimized}
                              alt={product.productName}
                              width={80}
                              height={80}
                              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                              className="object-cover"
                              onError={(e) => {
                                imgLogger.error("Mobile image failed to load:", e.currentTarget.src);
                              }}
                              priority
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-gray-400">No image</span>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          {product.productName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">ID: {product.productId}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-lg font-semibold text-green-600">
                            Total Sale: ${product.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-blue-600 font-medium">
                            Your Profit: ${(product.actualProfit || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-orange-600 font-medium">
                            Deposit Required: ${(product.depositRequired || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Buyer:</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{product.buyerName || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{product.buyerEmail}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {product.quantitySold} units
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium border ${getStatusColor(
                            product.status
                          )}`}
                        >
                          {getStatusIcon(product.status)}
                          <span className="ml-1">{getStatusText(product.status)}</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sale Date:</span>
                        <span className="text-sm">{product.saleDate.toLocaleDateString()}</span>
                      </div>

                      {product.status === "pending_deposit" && (
                        <button
                          onClick={() => handleUploadDeposit(product)}
                          className="w-full mt-3 px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium hover:bg-[#E0004D] transition-colors"
                        >
                          Submit Deposit Receipt
                        </button>
                      )}
                      {product.status === "deposit_submitted" && (
                        <div className="w-full mt-3 flex items-center justify-center text-sm text-blue-600 bg-blue-50 py-2 rounded-md">
                          <Clock className="w-4 h-4 mr-2" />
                          Receipt Submitted - Awaiting Approval
                        </div>
                      )}
                      {(product.status === "deposit_approved" || product.status === "completed") && (
                        <div className="w-full mt-3 flex items-center justify-center text-sm text-green-600 bg-green-50 py-2 rounded-md">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {product.status === "completed" ? "Completed - Profit Added" : "Approved - Profit Added"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-white border rounded">
              {searchQuery ? (
                "No orders found matching your search."
              ) : (
                <div>
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders</h3>
                  <p className="text-gray-600 mb-4">
                    You don&apos;t have any products pending payment.
                  </p>
                  <Link
                    href="/stock"
                    className="inline-flex items-center px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium hover:bg-[#E0004D] transition-colors"
                  >
                    Start Selling Products
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="mt-4">
            <PaginationWithCustomRows
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page: number) => setCurrentPage(page)}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(newRowsPerPage: number) => {
                setRowsPerPage(newRowsPerPage);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Deposit Receipt Submission Modal */}
      {showDepositForm && selectedProductForDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Submit Deposit Payment</h3>
                  <p className="text-gray-600 mt-1">
                    Product: {selectedProductForDeposit.productName}
                  </p>
                </div>
                <button
                  onClick={() => setShowDepositForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Sale Amount:</span>
                    <span className="font-semibold ml-2">${selectedProductForDeposit.totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Your Profit:</span>
                    <span className="font-semibold ml-2 text-green-600">
                      ${(selectedProductForDeposit.actualProfit || 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Deposit Required:</span>
                    <span className="font-semibold ml-2 text-blue-600">
                      ${(selectedProductForDeposit.depositRequired || 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity Sold:</span>
                    <span className="font-semibold ml-2">{selectedProductForDeposit.quantitySold}</span>
                  </div>
                </div>
              </div>

              <ReceiptSubmission
                isDepositPayment={true}
                pendingDepositId={selectedProductForDeposit.depositId} // Use actual deposit ID
                pendingProductId={selectedProductForDeposit.id}
                productName={selectedProductForDeposit.productName}
                requiredAmount={selectedProductForDeposit.depositRequired}
                onSubmitted={handleDepositSubmitted}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

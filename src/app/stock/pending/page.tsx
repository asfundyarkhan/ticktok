"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import PaginationWithCustomRows from "../../components/PaginationWithCustomRows";
import ReceiptSubmission from "../../components/ReceiptSubmission";
import { PendingProductService, PendingProduct } from "../../../services/pendingProductService";
import { toast } from "react-hot-toast";
import { Clock, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

interface PendingProductWithProfit extends PendingProduct {
  actualProfit?: number;
  depositRequired?: number;
  depositId?: string; // Add deposit ID for proper linking
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
      toast.error("Only sellers can access pending products");
      if (userProfile.role === "admin" || userProfile.role === "superadmin") {
        router.push("/dashboard");
      } else {
        router.push("/store");
      }
      return;
    }
  }, [user, userProfile, authLoading, router]);

  // Subscribe to real-time pending products updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = PendingProductService.subscribeToSellerPendingProducts(
      user.uid,
      async (products) => {
        // Fetch corresponding deposit data for each product
        const productsWithProfit: PendingProductWithProfit[] = [];
        
        for (const product of products) {
          try {
            const { PendingDepositService } = await import("../../../services/pendingDepositService");
            const { deposit, found } = await PendingDepositService.findPendingDepositByProduct(
              product.sellerId,
              product.productId
            );
            
            if (found && deposit) {
              productsWithProfit.push({
                ...product,
                actualProfit: deposit.pendingProfitAmount || deposit.profitPerUnit * product.quantitySold,
                depositRequired: deposit.totalDepositRequired,
                depositId: deposit.id // Store the actual deposit ID
              });
            } else {
              // Fallback to estimation if no deposit found
              productsWithProfit.push({
                ...product,
                actualProfit: product.totalAmount * 0.23, // 23% estimate
                depositRequired: product.totalAmount * 0.77 // 77% estimate
              });
            }
          } catch (error) {
            console.error("Error fetching deposit data for product:", product.productId, error);
            // Fallback to estimation
            productsWithProfit.push({
              ...product,
              actualProfit: product.totalAmount * 0.23,
              depositRequired: product.totalAmount * 0.77
            });
          }
        }
        
        setPendingProducts(productsWithProfit);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading pending products:", error);
        toast.error("Failed to load pending products");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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
      // First, try to find the associated pending deposit to get the correct deposit amount
      const { PendingDepositService } = await import("../../../services/pendingDepositService");
      const { deposit, found } = await PendingDepositService.findPendingDepositByProduct(
        pendingProduct.sellerId,
        pendingProduct.productId
      );

      if (found && deposit) {
        // Set the selected product with deposit info
        setSelectedProductForDeposit({
          ...pendingProduct,
          depositRequired: deposit.totalDepositRequired,
          actualProfit: deposit.pendingProfitAmount || deposit.profitPerUnit * pendingProduct.quantitySold,
          depositId: deposit.id // Store the actual deposit ID
        });
        setShowDepositForm(true);
      } else {
        toast.error("Could not find deposit information for this product");
      }
    } catch (error) {
      console.error("Error fetching deposit information:", error);
      toast.error("Failed to load deposit information");
    }
  };

  const handleDepositSubmitted = () => {
    setShowDepositForm(false);
    setSelectedProductForDeposit(null);
    toast.success("Deposit receipt submitted successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0059] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
              Products Pending Payment
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Products sold that require deposit confirmation
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
                <h3 className="text-sm font-medium text-blue-800">How Pending Products Work</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>These products were sold and the profit has been added to your wallet</li>
                    <li>To complete the transaction, you need to pay the original stock deposit</li>
                    <li>The deposit amount is the original cost of the stock, not the sale price</li>
                    <li>Once paid, you&apos;ll receive the full profit and can withdraw funds</li>
                  </ul>
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
                              <Image
                                src={product.productImage || "/images/placeholders/product.svg"}
                                alt={product.productName}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  console.log("Image failed to load:", e.currentTarget.src);
                                  e.currentTarget.src = "/images/placeholders/product.svg";
                                }}
                                unoptimized={true}
                                priority
                              />
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
                        <Image
                          src={product.productImage || "/images/placeholders/product.svg"}
                          alt={product.productName}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholders/product.svg";
                          }}
                          unoptimized
                          priority
                        />
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
                "No pending products found matching your search."
              ) : (
                <div>
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Products</h3>
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

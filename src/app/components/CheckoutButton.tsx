"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./NewCartContext";
import { useAuth } from "../../context/AuthContext";
import { SellerWalletService } from "../../services/sellerWalletService";
import { toast } from "react-hot-toast";
import { PendingDepositService } from "../../services/pendingDepositService";
import { PendingProductService } from "../../services/pendingProductService";

interface CheckoutButtonProps {
  className?: string;
}

export default function CheckoutButton({
  className = "",
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!user) {
      toast.error("Please log in to complete your purchase");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate checkout process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Record sales for each seller in the cart
      const salesByseller = new Map<string, { items: typeof cartItems, totalAmount: number }>();
      
      // Group cart items by seller
      cartItems.forEach(item => {
        if (!salesByseller.has(item.sellerId)) {
          salesByseller.set(item.sellerId, { items: [], totalAmount: 0 });
        }
        const sellerData = salesByseller.get(item.sellerId)!;
        sellerData.items.push(item);
        sellerData.totalAmount += item.price * item.quantity;
      });

      // Record sales for each seller
      for (const [sellerId, { items }] of salesByseller) {
        for (const item of items) {
          console.log(`Processing sale for seller ${sellerId}, product ${item.productId}, item:`, item);
          
          // Check if this product has a pending deposit entry (new system)
          const { deposit, found } = await PendingDepositService.findPendingDepositByProduct(
            sellerId,
            item.productId
          );

          console.log(`Pending deposit search result - found: ${found}, deposit:`, deposit);

          if (found && deposit) {
            console.log(`Using new pending deposit system for product ${item.productId}`);
            // Use new pending deposit system
            const saleResult = await PendingDepositService.markProductSold(
              deposit.id!,
              sellerId,
              item.price, // Sale price
              item.quantity // Actual quantity sold
            );

            if (saleResult.success) {
              console.log(`Successfully marked product as sold, creating pending product entry`);
              // Also create pending product entry for receipt upload workflow
              await PendingProductService.createPendingProduct(
                sellerId,
                item.productId,
                item.name,
                item.quantity,
                item.price,
                user.uid // buyerId
              );
            } else {
              console.error("Failed to mark product as sold:", saleResult.message);
              // Continue with other items even if one fails
            }
          } else {
            console.log(`Using old system for product ${item.productId} - no pending deposit found`);
            // Fall back to existing system for products without pending deposits
            const baseCost = item.price * 0.8 * item.quantity;
            const profitAmount = (item.price * item.quantity) - baseCost;

            await SellerWalletService.recordSale({
              productId: item.productId,
              productName: item.name,
              buyerId: user.uid,
              sellerId: sellerId,
              quantity: item.quantity,
              unitPrice: item.price,
              totalAmount: item.price * item.quantity,
              profitAmount: profitAmount,
              baseCost: baseCost,
              status: 'completed'
            });
          }
        }
      }

      // On success
      toast.success("Order placed successfully! Seller profits are now pending.");
      clearCart();
      router.push("/checkout/success");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || cartItems.length === 0}
      className={`w-full py-3 px-4 rounded-md font-semibold text-white transition-all duration-200 
        ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : cartItems.length === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#FF0059] hover:bg-[#E0004D] active:transform active:scale-95"
        } ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      ) : (
        "Proceed to Checkout"
      )}
    </button>
  );
}

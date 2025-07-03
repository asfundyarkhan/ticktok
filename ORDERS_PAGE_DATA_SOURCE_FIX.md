# Orders Page Data Source Fix

## Problem

After admin purchases from seller listings, the orders page was not showing these items. The page appeared empty even though admin had bought products from sellers.

## Root Cause Analysis

The orders page was using `SellerWalletService.getPendingProfits()` which queries the `pending_deposits` collection. However:

1. **Admin purchase flow** creates entries in the `pendingProducts` collection (via `PendingProductService.createPendingProduct`)
2. **Orders page** was looking at `pending_deposits` collection instead of `pendingProducts`
3. **Data mismatch** meant actual orders weren't displayed

## Two Different Systems

### 1. `pending_deposits` Collection

- Tracks deposit requirements for sellers
- Used for profit calculations and wallet management
- Status: `"pending"`, `"sold"`, `"receipt_submitted"`, `"deposit_paid"`

### 2. `pendingProducts` Collection

- Tracks actual orders and receipt workflow
- Used for displaying orders to sellers
- Status: `"pending_deposit"`, `"deposit_submitted"`, `"deposit_approved"`, `"completed"`

## Solution

Changed the orders page data source from `pending_deposits` to `pendingProducts`:

### Before (Incorrect):

```typescript
// Used SellerWalletService.getPendingProfits() -> pending_deposits collection
const { SellerWalletService } = await import(
  "../../../services/sellerWalletService"
);
const profits = await SellerWalletService.getPendingProfits(user.uid);
```

### After (Correct):

```typescript
// Use PendingProductService.getSellerPendingProducts() -> pendingProducts collection
const { PendingProductService } = await import(
  "../../../services/pendingProductService"
);
const pendingProducts = await PendingProductService.getSellerPendingProducts(
  user.uid
);
```

## Data Mapping Changes

Updated the mapping from `PendingProfit` interface to `PendingProduct` interface:

```typescript
// Convert PendingProduct data to PendingProductWithProfit format
const productsWithProfit: PendingProductWithProfit[] = pendingProducts.map(
  (product) => {
    return {
      id: product.id || "",
      sellerId: product.sellerId,
      sellerName: product.sellerName || "",
      sellerEmail: product.sellerEmail || "",
      productId: product.productId,
      productName: product.productName,
      productImage: productImage,
      quantitySold: product.quantitySold,
      pricePerUnit: product.pricePerUnit,
      totalAmount: product.totalAmount,
      buyerId: product.buyerId,
      buyerName: product.buyerName || "Admin",
      saleDate: product.saleDate,
      status: product.status, // Directly use PendingProduct status
      receiptId: product.receiptId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // ... other fields
    };
  }
);
```

## Expected Flow

1. **Admin buys from seller** → Creates `PendingProduct` entry
2. **Orders page loads** → Queries `pendingProducts` collection
3. **Seller sees order** → Can upload receipt and manage deposit workflow
4. **Receipt workflow** → Updates status in `pendingProducts` collection

## Impact

- ✅ Orders page now shows admin purchases immediately after they occur
- ✅ Receipt upload workflow functions correctly
- ✅ Sellers can see and manage their orders properly
- ✅ Data consistency between admin purchases and orders display
- ✅ No breaking changes to existing functionality

## Testing

- Build successful ✅
- TypeScript compilation successful ✅
- Data mapping verified ✅

---

**Status**: ✅ COMPLETE - Orders page now correctly displays admin purchases using the proper data source.

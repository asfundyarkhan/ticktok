# Image Data Not Reaching Orders Page - Root Cause and Fix

## Root Cause Identified

The issue was that **product images were not being stored in the `pending_deposits` collection** when orders were created. The flow was:

1. When a product is sold, a record is created in `pending_deposits`
2. The orders page reads from `pending_deposits` via `SellerWalletService.getPendingProfits()`
3. **BUT** the `PendingDeposit` interface didn't include image fields
4. **AND** the calls to `createPendingDeposit()` weren't passing image data

This meant the orders page had to fall back to fetching images from the `products` collection, but this was unreliable and often failed.

## The Complete Fix

### 1. Updated PendingDeposit Interface
Added image fields to the `PendingDeposit` interface in `pendingDepositService.ts`:

```typescript
export interface PendingDeposit {
  // ...existing fields...
  productImage?: string; // Main product image URL
  productImages?: string[]; // Array of product image URLs  
  mainImage?: string; // Alternative main image field
  // ...rest of fields...
}
```

### 2. Enhanced createPendingDeposit Method
Updated the method to accept and store image data:

```typescript
static async createPendingDeposit(
  sellerId: string,
  productId: string,
  productName: string,
  listingId: string,
  quantityListed: number,
  originalCostPerUnit: number,
  listingPrice: number,
  productImage?: string,        // NEW: Main product image
  productImages?: string[]      // NEW: Array of product images
): Promise<{ success: boolean; message: string; depositId?: string }>
```

The method now:
- Accepts image parameters
- Falls back to fetching from `products` collection if images not provided
- Stores image data directly in the `pending_deposits` record

### 3. Updated All Calls to createPendingDeposit

**In `src/app/stock/page.tsx`:**
```typescript
const depositResult = await PendingDepositService.createPendingDeposit(
  user.uid,
  listingResult.productId,
  product.name,
  listingResult.listingId,
  quantity,
  product.price,
  listingPrice,
  product.mainImage || (product.images && product.images[0]) || "", // NEW: Product image
  product.images || (product.mainImage ? [product.mainImage] : [])   // NEW: Product images array
);
```

**In `src/services/stockService.ts`:**
```typescript
const createResult = await PendingDepositService.createPendingDeposit(
  sellerId,
  productId,
  listingData.name || "Unknown Product",
  listingId,
  quantity,
  originalCost,
  price,
  listingData.mainImage || listingData.image || (listingData.images && listingData.images[0]) || "", // NEW: Product image
  listingData.images || (listingData.mainImage ? [listingData.mainImage] : []) || (listingData.image ? [listingData.image] : []) // NEW: Product images array
);
```

### 4. Simplified SellerWalletService.getPendingProfits
Updated the method to prioritize image data from `pending_deposits` and only fall back to `products` collection if needed:

```typescript
// First, try to get image from the pending_deposits data itself
if (data.productImage && typeof data.productImage === 'string') {
  productImage = data.productImage;
  console.log(`Using productImage from pending_deposits: ${productImage}`);
} else if (data.mainImage && typeof data.mainImage === 'string') {
  productImage = data.mainImage;
  console.log(`Using mainImage from pending_deposits: ${productImage}`);
} else if (data.productImages && Array.isArray(data.productImages) && data.productImages.length > 0) {
  productImage = data.productImages[0];
  console.log(`Using first image from productImages array: ${productImage}`);
}

// Only fallback to products collection if no image in pending_deposits
if (!productImage && data.productId) {
  // ...fallback logic...
}
```

## Why This Fix Works

1. **Single Source of Truth**: Image data is now stored directly in `pending_deposits` where the orders page reads from
2. **No More Network Calls**: Orders page doesn't need to fetch images from `products` collection
3. **Reliable Data**: Images are captured at the time of order creation, so they're always available
4. **Backward Compatibility**: Still falls back to `products` collection for existing records without image data

## Expected Results

- Orders page will now display product images correctly
- No more "No image found" warnings in console
- Faster loading since fewer database queries needed
- More reliable image display even if product data changes later

## Testing

To verify the fix:
1. Create a new product listing with images
2. Purchase the product to create a pending deposit
3. Check the orders page - images should now display properly
4. Check browser console - should see logs like "Using productImage from pending_deposits: [URL]"

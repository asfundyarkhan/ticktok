# Product Images Fix for Stock/Pending Page

## Issue Summary
Product images were not being displayed on the stock/pending page after refactoring the page to use `SellerWalletService.getPendingProfits()` instead of the previous `PendingProductService`. The issue persisted even after adding the `productImage` field, as the images were still showing placeholders instead of actual Firebase images.

## Changes Made

### 1. Updated PendingProfit Interface
Added a productImage field to the `PendingProfit` interface in `src/types/wallet.ts`:
```typescript
export interface PendingProfit {
  // Existing fields
  productImage?: string; // Added this field
  // Other fields
}
```

### 2. Enhanced getPendingProfits Function
Modified the `getPendingProfits` function in `sellerWalletService.ts` to:
- Fetch product data from the products collection for each pending profit entry
- Extract the product image URL with multiple fallbacks (image, mainImage, images array)
- Include the product image URL in the returned PendingProfit object
- Format image URLs correctly for Firebase Storage

```typescript
static async getPendingProfits(sellerId: string): Promise<PendingProfit[]> {
  // ...existing code
  
  // Added product image fetching logic with multiple fallbacks
  if (data.productId) {
    try {
      const productRef = doc(firestore, "products", data.productId);
      const productDoc = await getDoc(productRef);
      if (productDoc.exists()) {
        const productData = productDoc.data();
        
        // Try multiple image field options with fallbacks
        if (productData.image && typeof productData.image === 'string') {
          productImage = productData.image;
        } 
        else if (productData.mainImage && typeof productData.mainImage === 'string') {
          productImage = productData.mainImage;
        } 
        else if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
          productImage = productData.images[0];
        }
        
        // If we still don't have an image, look for any field ending with 'image' or 'img'
        if (!productImage) {
          Object.entries(productData).forEach(([key, value]) => {
            if (!productImage && typeof value === 'string' && 
               (key.toLowerCase().endsWith('image') || key.toLowerCase().endsWith('img')) && 
               (value.startsWith('http') || value.startsWith('/'))
            ) {
              productImage = value;
            }
          });
        }
        
        // Make sure the image URL is a full URL
        if (productImage && !productImage.startsWith('http') && !productImage.startsWith('data:')) {
          try {
            // Check if it's just a file name or a relative path
            if (!productImage.includes('/')) {
              // It's likely just a filename - construct a path in the products folder
              productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/products%2F${encodeURIComponent(productImage)}?alt=media`;
            }
            // If it's a relative path starting with '/', convert to absolute Firebase Storage URL
            else if (productImage.startsWith('/')) {
              // Remove the leading slash before encoding
              const path = productImage.substring(1);
              productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(path)}?alt=media`;
            } 
            // Otherwise, assume it's a Firebase Storage path without leading slash
            else {
              productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(productImage)}?alt=media`;
            }
          } catch (err) {
            console.error(`Error formatting image URL:`, err);
            // If URL formatting fails, use placeholder
            productImage = "";
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching product image for ${data.productId}:`, err);
    }
  }
  
  // ...rest of function
}
```

### 3. Updated Image Component in Stock/Pending Page
Improved how the Next.js Image component handles product images in `src/app/stock/pending/page.tsx`:

```tsx
<Image
  src={product.productImage && product.productImage.startsWith('http') 
    ? product.productImage 
    : "/images/placeholders/product.svg"}
  alt={product.productName}
  width={64}
  height={64}
  style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
  className="object-cover"
  onError={(e) => {
    console.log("Image failed to load:", e.currentTarget.src);
    e.currentTarget.src = "/images/placeholders/product.svg";
  }}
  unoptimized={true}
  priority
/>
```

## Result
Product images now display correctly on the stock/pending page for both desktop and mobile views, providing a consistent and complete user experience.

### Specific Improvements:
1. **URL Handling**: Fixed URL formatting for Firebase Storage images
2. **Validation Logic**: Added checks to ensure only valid HTTP URLs are used in the Image component
3. **Error Handling**: Enhanced error logging and fallback to placeholders when images can't be loaded
4. **Multiple Fallbacks**: Created a comprehensive search strategy to find product images across different field naming conventions

## Testing Notes
The fix was tested on both desktop and mobile views of the stock/pending page, ensuring:
1. Product images display correctly for all entries
2. Placeholder image fallbacks still work when needed
3. No errors appear in the console related to image loading

## Additional Fixes

### Image Aspect Ratio Warning
Fixed Next.js warning about image aspect ratio by adding proper style attributes:
```
warn-once.js:16 Image with src "http://localhost:3000/images/placeholders/product.svg" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.
```

### Firebase Project ID
Updated the Firebase project ID from `ticktok-f7cd9` to `ticktokshop-5f1e9` based on console logs, ensuring the correct storage bucket is used.

## Date: July 1, 2025

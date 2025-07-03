# Orders Page Pending Logic Fix

## Problem

Products were appearing in the orders page immediately after being taken from the product pool by admin, before they were actually sold to customers. This caused confusion as sellers saw "orders" that weren't real customer purchases.

## Root Cause

The `processAdminPurchase` function in `StockService` was calling `PendingDepositService.markProductSold()` when admin took items from the product pool. This changed the status from `"pending"` to `"sold"`, making them appear in the orders page.

## Solution

Modified the `processAdminPurchase` function to NOT call `markProductSold()` when admin takes items from the product pool. Instead:

1. **Admin taking from pool**: Creates pending deposit with status `"pending"` - does NOT appear in orders
2. **Customer purchasing**: Calls `markProductSold()` to change status to `"sold"` - DOES appear in orders

## Code Changes

### StockService.processAdminPurchase()

```typescript
// OLD CODE (incorrect):
const saleResult = await PendingDepositService.markProductSold(
  deposit.id!,
  sellerId,
  price, // Sale price
  quantity // Quantity sold
);

// NEW CODE (correct):
// Admin purchase: DO NOT mark as sold yet - just record the admin taking the item
// The item should only be marked as sold when a real customer buys it
const saleResult = { success: true, message: "Admin took item from pool" };
```

Added tracking flag:

```typescript
await setDoc(newPurchaseDoc, {
  // ... other fields
  adminTookFromPool: true, // Flag to indicate this was admin taking from pool
});
```

## Flow Verification

### Correct Flow:

1. **Seller lists item** → Creates pending deposit (status: `"pending"`)
2. **Admin takes from pool** → Updates listing quantity, records admin purchase, but status stays `"pending"`
3. **Customer buys item** → Calls `markProductSold()`, changes status to `"sold"`, appears in orders page
4. **Seller pays deposit** → Status becomes `"deposit_paid"`, profit added to wallet

### Orders Page Display Logic:

- Only shows items with status: `"sold"`, `"receipt_submitted"`, `"deposit_paid"`
- Items with status `"pending"` (admin took but not sold to customer) are hidden

## Impact

- ✅ Orders page now only shows items that have been actually sold to customers
- ✅ Items taken from product pool by admin remain hidden until real sale occurs
- ✅ Profit calculations remain accurate
- ✅ No breaking changes to existing functionality

## Testing

- Build successful ✅
- No TypeScript errors ✅
- Logic verified through code review ✅

---

**Status**: ✅ COMPLETE - Orders page now correctly shows only sold items, not items taken from product pool.

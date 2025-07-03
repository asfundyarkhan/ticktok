# Admin Purchase Customer Parity Implementation

## Summary

Updated admin purchase logic to act exactly like customer purchases in terms of profit, deposit, and wallet logic.

## Problem Fixed

Previously, when admin purchased items from sellers:

- Items were marked as "taken from pool" but NOT as "sold"
- Pending deposits remained in "pending" status
- Profits did not show up in seller's pending profits until a real customer purchased
- Sellers could not see expected profits immediately after admin purchase

## Solution Implemented

Modified `StockService.processAdminPurchase()` to:

1. **Mark item as sold immediately** when admin purchases (same as customer purchase)
2. **Calculate and track profit** immediately using `PendingDepositService.markProductSold()`
3. **Update purchase tracking** to reflect that item was sold immediately

## Changes Made

### 1. StockService.processAdminPurchase()

**File**: `src/services/stockService.ts` (lines ~816-830)

**Before**:

```typescript
// Admin purchase: DO NOT mark as sold yet - just record the admin taking the item
// The item should only be marked as sold when a real customer buys it
console.log(
  `Admin took item from product pool - NOT marking as sold (item stays pending until real customer purchase)`
);

const saleResult = { success: true, message: "Admin took item from pool" }; // Mock success since we're not marking as sold
```

**After**:

```typescript
// Admin purchase: Mark as sold immediately - admin purchases should act exactly like customer purchases
console.log(
  `Admin purchased item - marking as sold immediately (admin purchases act like customer purchases)`
);

// Mark the pending deposit as sold
if (!deposit.id) {
  throw new Error("Pending deposit ID is missing");
}

const saleResult = await PendingDepositService.markProductSold(
  deposit.id,
  sellerId,
  price,
  quantity
);
```

### 2. Purchase Record Tracking

**File**: `src/services/stockService.ts` (lines ~845)

**Before**:

```typescript
adminTookFromPool: true, // Flag to indicate this was admin taking from pool
```

**After**:

```typescript
soldImmediately: true, // Flag to indicate this was marked as sold immediately (like customer purchase)
```

## Expected Behavior Now

### Admin Purchase Flow:

1. **Admin buys item** → `processAdminPurchase()` called
2. **Item marked as sold** → `PendingDepositService.markProductSold()` called
   - Pending deposit status: `"pending"` → `"sold"`
   - Profit calculated and stored in `pendingProfitAmount`
   - Item appears in seller's pending profits immediately
3. **Purchase recorded** with `isAdminPurchase: true` and `soldImmediately: true`
4. **Pending product created** with status `"pending_deposit"` (seller needs to upload receipt)

### Subsequent Flow (Same as Customer Purchases):

5. **Seller uploads receipt** → Deposit status: `"sold"` → `"receipt_submitted"`
6. **Admin approves receipt** → `PendingDepositService.markDepositPaid()` called
   - Deposit status: `"receipt_submitted"` → `"deposit_paid"`
   - Profit moved from pending to seller's wallet balance
   - All systems synchronized via `updateStatusAcrossSystems()`

## Verification Points

### ✅ Seller should see pending profit immediately after admin purchase

- **Profile page**: Shows pending profit amount
- **Orders page**: Shows sold item with correct profit amount
- **Product pool**: Shows item as sold with profit info
- **Wallet dashboard**: Shows pending profit

### ✅ Status consistency across all pages

- **Orders page**: Item shows as sold with pending deposit required
- **Product pool**: Item shows as sold (removed from available stock)
- **Receipts page**: Item available for receipt upload
- **Profile page**: Profit shows in pending section

### ✅ Receipt and approval flow works same as customer purchases

- Seller can upload receipt for deposit
- Admin can approve/reject receipt
- Upon approval, profit moves to wallet balance
- All status updates propagate across systems

## Technical Details

### Key Methods Modified:

- `StockService.processAdminPurchase()` - Now calls `markProductSold()`
- Uses existing `PendingDepositService.markProductSold()` for profit calculation
- Uses existing status synchronization system

### No Breaking Changes:

- All existing customer purchase flows unchanged
- All existing receipt/approval flows unchanged
- Only admin purchase behavior modified to match customer purchase behavior

### Profit Calculation:

```typescript
profitAmount = (salePrice - originalCostPerUnit) * quantitySold;
```

- Same calculation used for both admin and customer purchases
- Immediately stored in `pendingProfitAmount` when marked as sold
- Moved to wallet balance when deposit approved

## Testing Recommendations

1. **Admin purchases item** → Verify profit appears immediately in all seller views
2. **Seller uploads receipt** → Verify status updates across all pages
3. **Admin approves receipt** → Verify profit moves to wallet balance
4. **Compare with customer purchase** → Verify identical behavior in all aspects
5. **Check all seller pages** → Orders, profile, product pool, wallet dashboard should all show consistent data

## Files Changed

- `src/services/stockService.ts` - Modified `processAdminPurchase()` method

## Files Using Admin Purchase Logic

- Admin buy page: `src/app/dashboard/admin/buy/page.tsx`
- Stock service: `src/services/stockService.ts`
- Profit display: `src/services/sellerWalletService.ts`
- Orders page: `src/app/stock/pending/page.tsx`
- Profile page: `src/app/profile/page.tsx`

# Receipt History Fix

## Problem
Two related issues were identified with receipt history tracking:

1. Deposit receipts were not showing up in the history tracking for superadmins, even though wallet/automatic transfer receipts were working properly.
2. USDT payment receipts were missing from the history while wallet payments were showing correctly.

This created inconsistencies in the financial reporting and made it difficult to track the full history of payments.

## Root Cause
The issues were caused by:

1. Missing Firestore indexes for the `receipts_v2` collection, specifically for queries that filter on `status`, `isDepositPayment`, and order by `submittedAt`. 
2. Inconsistent handling of payment method types where USDT payments (non-wallet payments) weren't properly tagged with `isWalletPayment: false`.
3. Missing indexes for filtering by payment method type when querying receipts.

Additionally, the `pending_deposits` collection also needed proper indexes to ensure accurate history tracking.

## Solution

### 1. Added Firestore Indexes
We added five important indexes to the `receipts_v2` collection:

```json
{
  "collectionGroup": "receipts_v2",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "submittedAt",
      "order": "DESCENDING"
    }
  ]
},
{
  "collectionGroup": "receipts_v2",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "isDepositPayment",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "submittedAt",
      "order": "DESCENDING"
    }
  ]
},
{
  "collectionGroup": "receipts_v2",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "isDepositPayment",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "submittedAt",
      "order": "DESCENDING"
    }
  ]
},
{
  "collectionGroup": "receipts_v2",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "isWalletPayment",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "submittedAt",
      "order": "DESCENDING"
    }
  ]
},
{
  "collectionGroup": "receipts_v2",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "userId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "isWalletPayment",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "submittedAt",
      "order": "DESCENDING"
    }
  ]
}
```

These indexes support the various queries used in the history views:
1. Filtering by status and sorting by date
2. Filtering by deposit type and sorting by date
3. Filtering by both status and deposit type together
4. Filtering by wallet payment flag for payment method filtering
5. Filtering by user ID and wallet payment flag for user-specific payment history

### 2. Added Indexes for Pending Deposits
We also added indexes for the `pending_deposits` collection:

```json
{
  "collectionGroup": "pending_deposits",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    }
  ]
},
{
  "collectionGroup": "pending_deposits",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "sellerId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    }
  ]
}
```

### 3. Created Fix Scripts for Existing Data
We created two fix scripts:

#### `fix-deposit-receipts.js`
- Updates all existing deposit receipts to ensure they have the proper tracking flags
- Updates all pending deposits to ensure history tracking is enabled
- Corrects any timestamp format inconsistencies

#### `fix-receipt-payment-types.js`
- Identifies all receipts without explicit payment method tags
- Sets `isWalletPayment: false` and `paymentMethod: 'USDT'` for non-wallet payments
- This ensures USDT payments are properly identified and displayed in history

## Deployment

The fix was deployed using the `deploy-receipt-fixes.ps1` script which:
1. Deploys the updated Firestore indexes
2. Waits for indexes to be created (they take time to propagate)
3. Optionally runs both fix scripts for existing data

## Verification
To verify that the fix is working properly:
1. Log in as a superadmin
2. Check the receipts history page
3. Verify that both USDT receipts and wallet payments are visible in the history
4. Confirm that deposit receipts also appear alongside regular receipts

## Technical Notes

- The `NewReceiptService` uses different query patterns depending on the type of receipt being retrieved
- The index on `isWalletPayment` field allows efficient filtering between USDT and wallet payments
- The `PendingDepositService` handles marking deposits as paid when receipts are approved
- Both services now have proper indexes to support all query patterns

## Payment Method Handling

The receipt system distinguishes between two payment types:
1. **Wallet Payments** (`isWalletPayment: true`) - Automatic payments from user's wallet balance
2. **USDT Payments** (`isWalletPayment: false`) - Manual payments made via USDT transfers

Both payment types must appear in the history for proper financial tracking.

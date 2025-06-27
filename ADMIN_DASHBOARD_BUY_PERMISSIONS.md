# Admin Dashboard Buy Permission Update

## Changes Made

### 1. Updated Firestore Rules

Added and updated specific permissions for admins and superadmins to:

- Create purchases with the `isAdminPurchase` flag in the purchases collection
- Update user balances during admin purchases
- Access and manage the `adminBuyRequests` collection

### 2. Admin Purchase Process

The existing admin purchase process already includes:

- A specific method `StockService.processAdminPurchase()` for admin purchases
- Handling balance transfers between admin and seller accounts
- Recording the purchase with an `isAdminPurchase` flag

### 3. Added Deployment Scripts

Created two deployment scripts to easily apply the Firestore rule changes:

- `deploy-admin-buy-rules.ps1` (PowerShell for Windows)
- `deploy-admin-buy-rules.sh` (Bash for Linux/Mac)

## How to Deploy the Changes

### Windows:

```powershell
./deploy-admin-buy-rules.ps1
```

### Linux/Mac:

```bash
chmod +x ./deploy-admin-buy-rules.sh
./deploy-admin-buy-rules.sh
```

## What This Enables

- Admins and superadmins can now purchase products from sellers via the dashboard buy page
- The purchase process will correctly update both the admin and seller balances
- Purchases will be properly recorded with the `isAdminPurchase` flag
- All required security rules are in place to maintain data integrity and access controls

## Testing

After deploying the changes, you should verify that:

1. Admins and superadmins can access the dashboard buy page
2. They can successfully purchase items from sellers
3. The admin's balance decreases and the seller's balance increases by the correct amount
4. Purchase records are properly created with the `isAdminPurchase` flag

The security model now properly allows admins and superadmins to buy seller products from the dashboard while maintaining appropriate access controls.

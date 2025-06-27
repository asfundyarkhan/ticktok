# Admin and SuperAdmin Buy Permissions Update

## Changes Made

### 1. Updated Firestore Rules

Added specific permissions for admins and superadmins to:

- Create/update purchases and sales records
- Access seller wallets and pending profits
- Make deposits for pending profits
- Process withdrawal requests

The following collections now have explicit rules:

- `pending_profits`
- `sales`
- `seller_deposits`
- `withdrawal_requests`

### 2. Removed Restrictions on Store Access

Previously, the store page (`src/app/store/page.tsx`) would redirect sellers to their profile page. This check remains in place to prevent regular sellers from accessing the store as buyers, but would have also prevented admins and superadmins who are also sellers from purchasing.

### 3. Added Deployment Scripts

Created two deployment scripts to easily apply the Firestore rule changes:

- `deploy-firestore-rules.ps1` (PowerShell for Windows)
- `deploy-firestore-rules.sh` (Bash for Linux/Mac)

## How to Deploy the Changes

### Windows:

```powershell
./deploy-firestore-rules.ps1
```

### Linux/Mac:

```bash
chmod +x ./deploy-firestore-rules.sh
./deploy-firestore-rules.sh
```

## What This Enables

- Admins and superadmins can now purchase products from sellers.
- The purchase process will create the necessary sales records and pending profits in the seller's account.
- Admins and superadmins can make deposits for sellers, enabling them to withdraw their profits.
- All wallet operations are now accessible by admins and superadmins.

## Testing

After deploying the changes, you should verify that:

1. Admins and superadmins can access the store page
2. They can add products to cart and complete purchases
3. Sales records are properly created
4. Pending profits are recorded for sellers
5. Admins can make deposits for sellers' pending profits
6. Profit becomes available for withdrawal after deposit

The security model now properly distinguishes between different user types while maintaining appropriate access controls.

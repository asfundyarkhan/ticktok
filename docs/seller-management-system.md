# Seller Management System

This document details the implementation of the Seller Management System for superadmins. The system allows for managing seller accounts, specifically:

1. Migrating sellers between admin referrers
2. Converting seller accounts to dummy accounts

## Features

### Admin Migration

Superadmins can change which admin a seller is assigned to. This affects:

- Commission tracking
- Revenue allocation
- Admin dashboards

When a seller is migrated from one admin to another:

- All future transactions will be attributed to the new admin
- Historical data remains with the original admin
- Complete audit trail is maintained

### Dummy Account Conversion

Superadmins can convert any seller account to a "dummy account" which:

- Functions normally as a seller account
- Is excluded from admin revenue tracking
- Does not appear in admin commission calculations
- Does not affect admin performance metrics

## Implementation

### Data Structure

```typescript
// User document fields related to seller management
interface UserDocument {
  // Existing fields
  uid: string;
  email: string;
  displayName?: string;
  role: 'seller' | 'admin' | 'superadmin' | 'user';
  balance: number;
  
  // New fields
  adminId?: string;           // The admin this seller belongs to
  isDummyAccount?: boolean;   // Whether this is a dummy account
}

// Migration history record
interface MigrationRecord {
  id: string;
  sellerId: string;
  sellerName: string;
  oldAdminId: string;
  oldAdminName: string;
  newAdminId: string;
  newAdminName: string;
  reason: string;
  timestamp: Date;
  performedBy: string;
}

// Dummy account history record
interface DummyAccountRecord {
  id: string;
  sellerId: string;
  sellerName: string;
  previousAdminId?: string;
  previousAdminName?: string;
  reason: string;
  isDummyAccount: boolean;
  timestamp: Date;
  performedBy: string;
}
```

### Key Functions

#### Migrating Sellers

The migration process involves:

1. Updating the seller's `adminId` field
2. Creating a migration record for audit purposes
3. Ensuring all future transactions are attributed to the new admin

#### Converting to Dummy Account

The dummy account conversion involves:

1. Setting the `isDummyAccount` flag on the seller
2. Creating an audit record
3. Ensuring the account is excluded from admin metrics

### Admin Dashboard Integration

The system modifies how seller data is retrieved across the platform:

- Admin dashboards filter out dummy accounts
- Commission calculations exclude dummy accounts
- Revenue reports attribute sellers to their current admins

### Audit and Compliance

All changes are fully audited with:

- Complete history of migrations
- Reasons for each change
- Timestamps and user information
- Historical performance data maintained

## Security

- Only superadmins can access the seller management features
- All operations require confirmation
- Comprehensive validation prevents errors
- Changes are executed in transactions for data integrity

## UI Components

- Seller Management dashboard in superadmin interface
- Admin selection dropdowns
- Confirmation dialogs with reason fields
- Audit history tables

## How to Use

1. Navigate to Superadmin Dashboard > Seller Management
2. Search for the seller to manage
3. Use the "Migrate Seller" or "Convert to Dummy Account" actions
4. Complete the required information and submit
5. Changes take effect immediately

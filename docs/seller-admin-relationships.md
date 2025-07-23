# Seller-Admin Relationship System Documentation

## Overview

This document explains the dual relationship tracking system between sellers and admins in the application:

1. **Referral Relationship (permanent)**: Tracked via the `referredBy` field
2. **Admin Assignment (changeable)**: Tracked via the `adminId` field

## Key Concepts

### Referral Relationship

- **Field**: `referredBy` in the user document
- **Purpose**: Tracks which admin originally referred a seller
- **Behavior**: Never changes, establishes a permanent link for historical tracking
- **When Set**: When a seller registers using an admin's referral code
- **Usage**: Used for referral history and commission calculations

### Admin Assignment

- **Field**: `adminId` in the user document
- **Purpose**: Identifies the current admin managing the seller
- **Behavior**: Can change through migrations performed by superadmins
- **Usage**: Used for operational features like deposits and sale management

## Seller Management Display

The seller management page has been updated to:

1. Consider both relationships when displaying seller information
2. Show a "Referred but Unassigned" indicator for sellers that have a `referredBy` value but no `adminId`
3. Include statistics to track sellers with different relationship statuses

## Technical Implementation

### In the Seller Management Service

```typescript
/**
 * When getting sellers, we check both adminId and referredBy fields:
 * - First try to use adminId (current assignment)
 * - If not found, fallback to referredBy (original referrer)
 */
const adminIdentifier = data.adminId || data.referredBy;

if (adminIdentifier) {
  // Get admin information...
}

// When displaying seller info
sellers.push({
  // ...
  currentAdminId: data.adminId || data.referredBy || undefined,
  referredByAdminId: data.referredBy || undefined,
  // ...
});
```

### During Migration

When migrating a seller to a new admin:

```typescript
// Update adminId but preserve referredBy
transaction.update(sellerRef, {
  adminId: newAdminId,
  updatedAt: Timestamp.now(),
  migrationHistory: [...existingHistory, migrationHistoryEntry]
  // Deliberately NOT updating referredBy - original relationship remains
});
```

## Indicators in the UI

- **Green**: Regular seller with a current admin assignment
- **Yellow**: Seller who was referred but has no current admin assignment
- **Gray**: Seller with no admin connection at all

## Future Considerations

1. Migration history should track both the change in `adminId` and preserve the original `referredBy` value
2. Commission calculations should respect the permanent `referredBy` relationship
3. Admin dashboards should clearly differentiate between referred sellers and currently assigned sellers

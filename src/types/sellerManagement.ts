/**
 * Types for the Seller Management system
 */

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Seller {
  id: string;
  email: string;
  displayName?: string;
  adminId?: string;
  adminName?: string;
  adminEmail?: string;
  referredBy?: string; // Current admin who gets commissions
  originalReferredBy?: string; // Original referrer (preserved for history)
  isDummyAccount?: boolean;
  balance?: number;
  createdAt?: Date;
}

export interface MigrationRecord {
  id: string;
  sellerId: string;
  sellerName: string;
  oldAdminId: string;
  oldAdminName: string;
  newAdminId: string;
  newAdminName: string;
  oldReferredBy?: string; // Previous referrer
  newReferredBy: string; // New referrer for commissions
  reason: string;
  timestamp: Date;
  performedBy: string;
  migrationScope?: {
    transferredManagement: boolean;
    transferredCommissions: boolean;
    transferredReferralStatus: boolean;
    preservedOriginalReferrer: boolean;
  };
}

export interface DummyAccountRecord {
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

export interface MigrationRequest {
  sellerId: string;
  oldAdminId: string;
  newAdminId: string;
  reason: string;
}

export interface DummyAccountRequest {
  sellerId: string;
  isDummyAccount: boolean;
  reason: string;
}

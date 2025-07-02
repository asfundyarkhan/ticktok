// Transaction Helper Service for handling Firestore transaction conflicts
// This service provides retry logic with exponential backoff to handle concurrent updates

import { runTransaction, Firestore, Transaction } from "firebase/firestore";

export interface TransactionOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface RetryableTransactionResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
  retryCount?: number;
}

export class TransactionHelperService {
  private static readonly DEFAULT_MAX_RETRIES = 5;
  private static readonly DEFAULT_BASE_DELAY_MS = 100;
  private static readonly DEFAULT_MAX_DELAY_MS = 5000;

  /**
   * Execute a Firestore transaction with retry logic for version conflicts
   */
  static async executeWithRetry<T>(
    firestore: Firestore,
    transactionFunction: (transaction: Transaction) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<RetryableTransactionResult<T>> {
    const {
      maxRetries = this.DEFAULT_MAX_RETRIES,
      baseDelayMs = this.DEFAULT_BASE_DELAY_MS,
      maxDelayMs = this.DEFAULT_MAX_DELAY_MS,
    } = options;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await runTransaction(firestore, transactionFunction);
        
        if (attempt > 0) {
          console.log(`✅ Transaction succeeded after ${attempt} retries`);
        }
        
        return {
          success: true,
          result,
          retryCount: attempt,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Check if this is a transaction version conflict
        const isVersionConflict = this.isVersionConflictError(error);
        const isTransactionConflict = this.isTransactionConflictError(error);
        
        if (!isVersionConflict && !isTransactionConflict) {
          // If it's not a conflict error, don't retry
          console.error(`❌ Non-retryable error in transaction:`, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            retryCount: attempt,
          };
        }
        
        if (attempt === maxRetries) {
          // Last attempt failed
          console.error(`❌ Transaction failed after ${maxRetries} retries:`, error);
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt) + Math.random() * baseDelayMs,
          maxDelayMs
        );
        
        console.warn(
          `⚠️ Transaction conflict (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`
        );
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }
    
    return {
      success: false,
      error: lastError?.message || "Transaction failed after all retries",
      retryCount: maxRetries,
    };
  }

  /**
   * Check if error is a Firestore version conflict
   */
  private static isVersionConflictError(error: unknown): boolean {
    if (!error) return false;
    
    const errorObj = error as { message?: string; code?: string };
    const errorMessage = errorObj.message?.toLowerCase() || "";
    const errorCode = errorObj.code?.toLowerCase() || "";
    
    return (
      errorMessage.includes("stored version") ||
      errorMessage.includes("does not match") ||
      errorMessage.includes("base version") ||
      errorCode.includes("aborted") ||
      errorCode.includes("already-exists")
    );
  }

  /**
   * Check if error is a transaction conflict/contention error
   */
  private static isTransactionConflictError(error: unknown): boolean {
    if (!error) return false;
    
    const errorObj = error as { message?: string; code?: string };
    const errorMessage = errorObj.message?.toLowerCase() || "";
    const errorCode = errorObj.code?.toLowerCase() || "";
    
    return (
      errorMessage.includes("transaction") ||
      errorMessage.includes("contention") ||
      errorMessage.includes("concurrent") ||
      errorCode.includes("unavailable") ||
      errorCode.includes("deadline-exceeded")
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry statistics for monitoring
   */
  static getRetryRecommendations(retryCount: number): {
    performance: string;
    action?: string;
  } {
    if (retryCount === 0) {
      return { performance: "excellent" };
    }
    
    if (retryCount <= 2) {
      return { 
        performance: "good",
        action: "Normal transaction contention - no action needed"
      };
    }
    
    if (retryCount <= 4) {
      return { 
        performance: "concerning",
        action: "High transaction contention - consider reducing concurrent operations"
      };
    }
    
    return { 
      performance: "poor",
      action: "Very high contention - investigate concurrent access patterns and consider batching operations"
    };
  }
}

// Utility functions for handling duplicate product IDs
export interface ProductWithId {
  id: string;
  productId: string;
  saleDate?: Date;
  totalAmount?: number;
  quantitySold?: number;
  productName?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Ensures that products with duplicate productIds get unique identifiers
 * This prevents React key conflicts and UI bugs when the same product appears multiple times
 */
export function ensureUniqueProductIds<T extends ProductWithId>(
  products: T[]
): T[] {
  const idCount: { [key: string]: number } = {};
  const seenCombinations = new Set<string>();

  return products.map((product) => {
    const originalId = product.productId;

    // Create a unique combination key based on product details
    const combinationKey = `${originalId}-${product.saleDate?.getTime()}-${
      product.totalAmount
    }-${product.quantitySold}`;

    // If this exact combination has been seen, it's a true duplicate
    if (seenCombinations.has(combinationKey)) {
      // Count occurrences of this ID
      if (idCount[originalId]) {
        idCount[originalId]++;
      } else {
        idCount[originalId] = 1;
      }

      // Create a unique ID using multiple factors
      const timestamp = Date.now();
      const uniqueId = `${originalId}-inst-${
        idCount[originalId]
      }-${timestamp}-${product.id?.slice(-4) || "xxxx"}`;

      console.log(
        `Duplicate productId combination detected: ${originalId} -> ${uniqueId}`
      );

      seenCombinations.add(
        `${uniqueId}-${product.saleDate?.getTime()}-${product.totalAmount}-${
          product.quantitySold
        }`
      );

      return {
        ...product,
        productId: uniqueId,
      };
    }

    // Mark this combination as seen
    seenCombinations.add(combinationKey);
    return product;
  });
}

/**
 * Generates a unique key for React rendering that combines multiple identifiers
 */
export function generateUniqueKey(product: ProductWithId): string {
  return `${product.id}-${product.productId}-${
    product.saleDate?.getTime() || "no-date"
  }`;
}

/**
 * Detects if there are duplicate product IDs in an array
 */
export function hasDuplicateProductIds<T extends ProductWithId>(
  products: T[]
): boolean {
  const ids = products.map((p) => p.productId);
  return ids.length !== new Set(ids).size;
}

/**
 * Groups products by their productId and returns statistics
 */
export function getProductIdStats<T extends ProductWithId>(
  products: T[]
): { [productId: string]: { count: number; products: T[] } } {
  const stats: { [productId: string]: { count: number; products: T[] } } = {};

  products.forEach((product) => {
    const id = product.productId;
    if (!stats[id]) {
      stats[id] = { count: 0, products: [] };
    }
    stats[id].count++;
    stats[id].products.push(product);
  });

  return stats;
}

/**
 * Image helper utility functions for handling product images consistently
 */

/**
 * Gets the best available image URL from a product or listing
 * Handles all the different ways images might be stored
 *
 * @param item - Product or listing object with image fields
 * @returns The most appropriate image URL or null if no image is found
 */
export function getBestProductImage(
  item:
    | {
        mainImage?: string | null;
        image?: string | null;
        images?: string[] | null;
        productImage?: string | null;
      }
    | null
    | undefined
): string | null {
  if (!item) return null;

  // Check productImage first (specific to orders/pending page)
  if (item.productImage && item.productImage.trim() !== "")
    return item.productImage;

  // Check mainImage next
  if (item.mainImage && item.mainImage.trim() !== "") return item.mainImage;

  // Then check images array
  if (item.images?.length && item.images[0]?.trim() !== "")
    return item.images[0];

  // Then check legacy image field
  if (item.image && item.image.trim() !== "") return item.image;

  // Log the missing image for debugging without breaking the UI
  console.warn(`No image found for item: ${JSON.stringify(item)}`);

  // Return null to allow the caller to handle this case
  return null;
}

/**
 * Normalize an array of image URLs, filtering out empty values
 *
 * @param images - Array of image URLs that might contain null/undefined values
 * @param mainImage - Optional main image to include if not in the array
 * @returns Clean array of image URLs
 */
export function normalizeProductImages(
  images?: (string | null | undefined)[] | null,
  mainImage?: string | null
): string[] {
  const result: string[] = [];

  // Add main image if provided and not empty
  if (mainImage) {
    result.push(mainImage);
  }

  // Add all non-empty images from the array
  if (images?.length) {
    images.forEach((img) => {
      if (img && !result.includes(img)) {
        result.push(img);
      }
    });
  }

  return result;
}

/**
 * Gets the best available image URL from a Firestore listing or product
 * Handles Firestore storage URLs specifically
 *
 * @param item - Product or listing object with image fields
 * @returns The most appropriate image URL configuration or null if no image found
 */
export function getFirestoreImage(
  item:
    | {
        mainImage?: string | null;
        image?: string | null;
        images?: string[] | null;
        productImage?: string | null;
      }
    | null
    | undefined
): { src: string; unoptimized: boolean } | null {
  // This may return null if no image is found
  const imageUrl = getBestProductImage(item);

  // If no image URL was found, return null
  if (!imageUrl) {
    return null;
  }

  // Check if it's a Firestore storage URL
  const isFirestoreUrl =
    imageUrl.includes("firebasestorage.googleapis.com") ||
    imageUrl.includes("storage.googleapis.com");

  // Log the image URL for debugging
  console.debug(`Using image URL: ${imageUrl} (Firebase: ${isFirestoreUrl})`);

  return {
    src: imageUrl,
    unoptimized: isFirestoreUrl, // Only unoptimize Firebase Storage URLs
  };
}

/**
 * Image helper utility functions for handling product images consistently
 */

/**
 * Gets the best available image URL from a product or listing
 * Handles all the different ways images might be stored
 *
 * @param item - Product or listing object with image fields
 * @param placeholder - Optional custom placeholder image
 * @returns The most appropriate image URL
 */
export function getBestProductImage(
  item:
    | {
        mainImage?: string | null;
        image?: string | null;
        images?: string[] | null;
      }
    | null
    | undefined,
  placeholder: string = "/images/placeholders/product.svg"
): string {
  if (!item) return placeholder;

  // Check mainImage first
  if (item.mainImage && item.mainImage.trim() !== "") return item.mainImage;

  // Then check images array
  if (item.images?.length && item.images[0]?.trim() !== "")
    return item.images[0];

  // Then check legacy image field
  if (item.image && item.image.trim() !== "") return item.image;

  // Default to placeholder
  return placeholder;
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
 * @returns The most appropriate image URL
 */
export function getFirestoreImage(
  item:
    | {
        mainImage?: string | null;
        image?: string | null;
        images?: string[] | null;
      }
    | null
    | undefined
): { src: string; unoptimized: boolean } {
  const imageUrl = getBestProductImage(item);

  // Check if it's a Firestore storage URL
  const isFirestoreUrl =
    imageUrl.includes("firebasestorage.googleapis.com") ||
    imageUrl.includes("storage.googleapis.com");

  return {
    src: imageUrl,
    unoptimized: isFirestoreUrl, // Only unoptimize Firebase Storage URLs
  };
}

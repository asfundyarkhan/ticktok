import { StockService } from "./stockService";
import type { StockItem } from "../types/marketplace";

export interface CategoryWithImage {
  id: string;
  name: string;
  description: string;
  image: string | null;
  productCount: number;
  color: string;
}

export interface BestSellerProduct extends StockItem {
  salesCount?: number;
  trending?: boolean;
}

export class MainPageService {
  // Predefined category colors and descriptions
  private static categoryStyles: Record<
    string,
    { color: string; description: string }
  > = {
    casual: {
      color: "from-blue-400 to-blue-600",
      description: "Comfortable everyday clothing",
    },
    formal: {
      color: "from-gray-600 to-gray-800",
      description: "Professional and elegant attire",
    },
    party: {
      color: "from-purple-500 to-pink-600",
      description: "Special occasion outfits",
    },
    gym: {
      color: "from-green-400 to-teal-600",
      description: "Sports and fitness clothing",
    },
    sports: {
      color: "from-green-400 to-teal-600",
      description: "Athletic wear and gear",
    },
    accessories: {
      color: "from-yellow-400 to-orange-500",
      description: "Complete your look",
    },
    shoes: {
      color: "from-red-400 to-red-600",
      description: "Shoes for every occasion",
    },
    bags: {
      color: "from-amber-400 to-orange-600",
      description: "Stylish bags and purses",
    },
    watches: {
      color: "from-slate-400 to-slate-600",
      description: "Timepieces and smart watches",
    },
    jewelry: {
      color: "from-pink-400 to-rose-600",
      description: "Beautiful jewelry pieces",
    },
    electronics: {
      color: "from-indigo-400 to-purple-600",
      description: "Latest tech and gadgets",
    },
    home: {
      color: "from-emerald-400 to-cyan-600",
      description: "Home decor and essentials",
    },
    beauty: {
      color: "from-pink-400 to-rose-600",
      description: "Skincare and cosmetics",
    },
    books: {
      color: "from-blue-400 to-indigo-600",
      description: "Books and literature",
    },
    toys: {
      color: "from-orange-400 to-red-500",
      description: "Fun toys and games",
    },
    other: {
      color: "from-gray-400 to-gray-600",
      description: "Various other products",
    },
  };

  /**
   * Get all categories with their first product image
   */
  static async getCategoriesWithImages(): Promise<CategoryWithImage[]> {
    try {
      // Get all products
      const products = await StockService.getAllStockItems();

      // Group products by category
      const categoryMap = new Map<string, StockItem[]>();

      products.forEach((product) => {
        if (product.category && product.listed && product.stock > 0) {
          const category = product.category.toLowerCase();
          if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
          }
          categoryMap.get(category)!.push(product);
        }
      });

      // Create category objects with first product image
      const categories: CategoryWithImage[] = [];

      categoryMap.forEach((categoryProducts, categoryId) => {
        if (categoryProducts.length > 0) {
          // Get first product with an image
          const productWithImage = categoryProducts.find(
            (p) => p.mainImage || (p.images && p.images.length > 0)
          );

          const firstImage =
            productWithImage?.mainImage ||
            (productWithImage?.images && productWithImage.images[0]) ||
            null;

          const style = this.categoryStyles[categoryId] || {
            color: "from-gray-400 to-gray-600",
            description: "Various products",
          };

          categories.push({
            id: categoryId,
            name: this.formatCategoryName(categoryId),
            description: style.description,
            image: firstImage,
            productCount: categoryProducts.length,
            color: style.color,
          });
        }
      });

      // Sort by product count (most products first)
      return categories.sort((a, b) => b.productCount - a.productCount);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  /**
   * Get best selling products
   */
  static async getBestSellingProducts(
    limit: number = 8
  ): Promise<BestSellerProduct[]> {
    try {
      const products = await StockService.getAllStockItems();

      // Filter for available products and sort by rating and other criteria
      const availableProducts = products.filter(
        (product) =>
          product.listed &&
          product.stock > 0 &&
          (product.mainImage || (product.images && product.images.length > 0))
      );

      // Sort by rating first, then by reviews count, then by created date
      const sortedProducts = availableProducts.sort((a, b) => {
        // First criteria: rating
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;

        // Second criteria: number of reviews
        const reviewsDiff = (b.reviews?.length || 0) - (a.reviews?.length || 0);
        if (reviewsDiff !== 0) return reviewsDiff;

        // Third criteria: newer products (assuming they might be trending)
        // Simple fallback - just use current timestamp for comparison
        return 0; // Keep original order if no clear date preference
      });

      // Add trending flag for newer products with good ratings
      const bestSellers: BestSellerProduct[] = sortedProducts
        .slice(0, limit)
        .map((product, index) => ({
          ...product,
          trending: index < 3 && (product.rating || 0) >= 4, // Top 3 with good ratings are trending
          salesCount: (product.reviews?.length || 0) * 2, // Simulate sales count
        }));

      return bestSellers;
    } catch (error) {
      console.error("Error fetching best selling products:", error);
      return [];
    }
  }

  /**
   * Format category name for display
   */
  private static formatCategoryName(categoryId: string): string {
    const nameMap: Record<string, string> = {
      gym: "Activewear",
      party: "Party & Events",
      beauty: "Beauty & Care",
      electronics: "Electronics",
      accessories: "Accessories",
      shoes: "Footwear",
      bags: "Bags & Purses",
      watches: "Watches",
      jewelry: "Jewelry",
      home: "Home & Living",
      books: "Books",
      toys: "Toys & Games",
      other: "Other",
    };

    return (
      nameMap[categoryId] ||
      categoryId.charAt(0).toUpperCase() + categoryId.slice(1)
    );
  }
}

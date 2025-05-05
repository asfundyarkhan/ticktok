"use client";

import { useState, useMemo, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ShoppingBag } from "lucide-react";
import ProductGrid from "@/app/components/ProductGrid";
import CategoryBar from "@/app/components/CategoryBar";
import CartDrawer from "@/app/components/CartDrawer";
import FilterSidebar from "@/app/components/FilterSidebar";
import "rc-pagination/assets/index.css";
import { Product, CartItem } from "@/types/product";

const categories = [
  { id: "all", name: "All" },
  { id: "casual", name: "Casual" },
  { id: "formal", name: "Formal" },
  { id: "party", name: "Party" },
  { id: "gym", name: "Gym" },
];

// Default products as fallback
const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Gradient Graphic T-shirt",
    price: 145,
    category: "casual",
    rating: 4.5,
    image: "/images/placeholders/t-shirt.svg",
    reviews: 128,
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "2",
    name: "Polo with Taping Details",
    price: 180,
    category: "casual",
    rating: 4.8,
    image: "/images/placeholders/t-shirt.svg",
    reviews: 89,
    sizes: ["M", "L", "XL", "2XL"],
  },
  {
    id: "3",
    name: "Black Striped T-shirt",
    price: 160,
    salePrice: 130,
    isSale: true,
    category: "casual",
    rating: 4.7,
    image: "/images/placeholders/t-shirt.svg",
    reviews: 156,
    sizes: ["XS", "S", "M", "L"],
  },
  {
    id: "4",
    name: "Skinny Fit Jeans",
    price: 260,
    salePrice: 240,
    isSale: true,
    category: "casual",
    rating: 4.6,
    image: "/images/placeholders/t-shirt.svg",
    reviews: 234,
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "5",
    name: "Checkered Shirt",
    price: 180,
    category: "casual",
    rating: 4.8,
    image: "/images/placeholders/t-shirt.svg",
    reviews: 89,
    sizes: ["M", "L", "XL", "2XL"],
  },
];

export default function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const itemsPerPage = 6;

  // Load products from localStorage (those listed by sellers)
  useEffect(() => {
    const loadProducts = () => {
      try {
        const storeProducts = localStorage.getItem("storeProducts");
        if (storeProducts) {
          const parsedProducts = JSON.parse(storeProducts);

          // Convert the seller-listed products to the expected Product format
          const formattedProducts = parsedProducts.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            description: p.description,
            price: p.price,
            category: "casual", // Default category
            rating: p.rating || 4.5,
            image: p.image,
            reviews: p.reviews || 0,
            sizes: ["S", "M", "L", "XL"], // Default sizes
            stock: p.stock,
            sellerName: p.sellerName,
            productCode: p.productCode,
          }));

          setProducts([...formattedProducts, ...defaultProducts]);
        } else {
          setProducts(defaultProducts);
        }
      } catch (err) {
        console.error("Error loading products:", err);
        setProducts(defaultProducts);
      }
    };

    loadProducts();

    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "storeProducts") {
        loadProducts();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      const matchesPrice =
        product.price >= priceRange[0] && product.price <= priceRange[1];

      const matchesSize =
        selectedSizes.length === 0 ||
        (product.sizes &&
          product.sizes.some((size) => selectedSizes.includes(size)));

      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category &&
          product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description &&
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesPrice && matchesSize && matchesSearch;
    });
  }, [selectedCategory, priceRange, selectedSizes, searchQuery, products]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-1 flex items-center">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full max-w-lg px-4 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="ml-4 relative p-2 rounded-full hover:bg-gray-100"
            >
              <ShoppingBag className="h-6 w-6 text-gray-600" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryBar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="mt-6 flex gap-8">
          <FilterSidebar
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
          />

          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-800">
                Showing {paginatedProducts.length} of {filteredProducts.length}{" "}
                products
              </p>
              <select
                className="border rounded-md px-3 py-1.5 text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                onChange={() => {
                  // Sort functionality can be added here
                }}
              >
                <option>Most Popular</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>

            {filteredProducts.length > 0 ? (
              <ProductGrid
                products={paginatedProducts}
                onAddToCart={addToCart}
              />
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow">
                <p className="text-gray-500">
                  No products found matching your criteria.
                </p>
              </div>
            )}

            {filteredProducts.length > itemsPerPage && (
              <div className="mt-8 flex justify-center items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({
                  length: Math.ceil(filteredProducts.length / itemsPerPage),
                }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${
                      currentPage === i + 1
                        ? "bg-pink-500 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        Math.ceil(filteredProducts.length / itemsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(filteredProducts.length / itemsPerPage)
                  }
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(id: string, qty: number) => {
          setCartItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, quantity: qty } : item
            )
          );
        }}
        onRemoveItem={(id: string) => {
          setCartItems((prev) => prev.filter((item) => item.id !== id));
        }}
      />
    </div>
  );
}

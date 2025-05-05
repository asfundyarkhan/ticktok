"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserBalance } from "../components/UserBalanceContext";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  image: string;
  productCode?: string;
}

export default function StockPage() {
  const router = useRouter();
  const { balance, deductFromBalance } = useUserBalance();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<number, number>
  >({});
  const [highlightedProductCode, setHighlightedProductCode] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Load admin stock products from localStorage or use defaults
    const storedAdminProducts = localStorage.getItem("adminStockProducts");

    if (storedAdminProducts) {
      setAdminProducts(JSON.parse(storedAdminProducts));
    } else {
      // Default admin stock if none exists
      const defaultAdminProducts: Product[] = [
        {
          id: 1,
          name: "T-Shirt Nike",
          description: "100% cotton, unisex",
          price: 300,
          image: "/images/placeholders/t-shirt.svg",
          productCode: "SHRT-NIKE-001",
        },
        {
          id: 2,
          name: "Long Pants Nike",
          description: "100% cotton, unisex",
          price: 500,
          image: "/images/placeholders/t-shirt.svg",
          productCode: "PNT-NIKE-001",
        },
        {
          id: 3,
          name: "Hoodie Adidas",
          description: "Premium quality, unisex",
          price: 450,
          image: "/images/placeholders/t-shirt.svg",
          productCode: "HOOD-ADIDAS-001",
        },
        {
          id: 4,
          name: "Cap Nike",
          description: "Adjustable size",
          price: 150,
          image: "/images/placeholders/t-shirt.svg",
          productCode: "CAP-NIKE-001",
        },
      ];

      setAdminProducts(defaultAdminProducts);
      localStorage.setItem(
        "adminStockProducts",
        JSON.stringify(defaultAdminProducts)
      );
    }

    // Initialize quantities
    const initialQuantities: Record<number, number> = {};
    JSON.parse(storedAdminProducts || "[]").forEach((product: Product) => {
      initialQuantities[product.id] = 0;
    });
    setSelectedQuantities(initialQuantities);

    // Check if there's a product to highlight (coming from restock button)
    const productToRestock = localStorage.getItem("productToRestock");
    if (productToRestock) {
      setHighlightedProductCode(productToRestock);
      // Remove it after use
      localStorage.removeItem("productToRestock");
    }
  }, []);

  // Filter products based on search query
  const filteredProducts = adminProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.productCode &&
        product.productCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleQuantityChange = (productId: number, quantity: number) => {
    setSelectedQuantities({
      ...selectedQuantities,
      [productId]: quantity,
    });
  };

  const handleBuyStock = (productId: number) => {
    const product = adminProducts.find((p) => p.id === productId);
    const quantity = selectedQuantities[productId];

    if (!product || !quantity) {
      alert("Please select a quantity");
      return;
    }

    const totalPrice =
      typeof product.price === "string"
        ? parseFloat(product.price.replace(/[^0-9.-]+/g, "")) * quantity
        : product.price * quantity;

    // Use our balance context to deduct the amount
    if (!deductFromBalance(totalPrice)) {
      alert("Insufficient balance. Please add funds to your wallet.");
      return;
    }

    // Add to inventory
    const inventoryProducts = JSON.parse(
      localStorage.getItem("inventoryProducts") || "[]"
    );

    interface InventoryProduct {
      productCode: string;
      stock: number;
      [key: string]: any;
    }

    const existingProduct = inventoryProducts.find(
      (p: InventoryProduct) => p.productCode === product.productCode
    );

    if (existingProduct) {
      // Update existing product
      const updatedInventory = inventoryProducts.map((p: InventoryProduct) =>
        p.productCode === product.productCode
          ? { ...p, stock: p.stock + quantity }
          : p
      );
      localStorage.setItem(
        "inventoryProducts",
        JSON.stringify(updatedInventory)
      );
    } else {
      // Add new product to inventory
      const newProduct = {
        id: Date.now(),
        name: product.name,
        description: product.description,
        stock: quantity,
        productCode: product.productCode,
        image: product.image,
        price:
          typeof product.price === "string"
            ? parseFloat(product.price.replace(/[^0-9.-]+/g, ""))
            : product.price,
        listed: false,
      };

      localStorage.setItem(
        "inventoryProducts",
        JSON.stringify([...inventoryProducts, newProduct])
      );
    }

    // Reset quantity
    handleQuantityChange(productId, 0);

    alert(`Successfully purchased ${quantity} units of ${product.name}!`);
  };

  useEffect(() => {
    // Highlight row if needed
    if (highlightedProductCode) {
      const element = document.getElementById(
        `product-${highlightedProductCode}`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("bg-yellow-50");

        // Remove highlight after 3 seconds
        setTimeout(() => {
          element.classList.remove("bg-yellow-50");
        }, 3000);
      }
    }
  }, [highlightedProductCode]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with TikTok Shop and search */}
      <div className="bg-white py-4 px-6 border-b flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-black">TikTok Shop</h1>
          <div className="relative">
            <button className="px-3 py-1 border rounded-md text-sm flex items-center text-black">
              Category <span className="ml-1">▼</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              className="pl-10 pr-4 py-2 rounded-full bg-gray-100 w-96 text-black placeholder-gray-500 border border-gray-300"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <div className="text-sm font-medium text-gray-700">
            Balance: ${balance.toFixed(2)}
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="text-gray-700 font-medium">Your Name</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h1 className="text-xl font-medium mb-6 text-gray-900">Account</h1>

        {/* Tabs */}
        <div className="flex space-x-8 border-b border-gray-200 mb-6">
          <Link
            href="/profile"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            General
          </Link>
          <Link
            href="/wallet"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            Wallet
          </Link>
          <Link
            href="/stock"
            className="px-1 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-semibold"
          >
            Buy stock
          </Link>
          <Link
            href="/stock/inventory"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            Inventory
          </Link>
        </div>

        {/* Current Balance Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-l-4 border-[#FF0059]">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                CURRENT BALANCE
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                ${balance.toFixed(2)}
              </p>
            </div>
            <Link
              href="/wallet"
              className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium"
            >
              Add Funds
            </Link>
          </div>
        </div>

        {/* Search stock */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search available stock"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-3 pl-10 border border-gray-300 rounded-md w-full text-gray-900 bg-white placeholder-gray-500"
            />
            <div className="absolute left-3 top-3.5 text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-gray-100 p-4 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-800 uppercase">
          <div className="col-span-2">Product Image</div>
          <div className="col-span-2">Product Name</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Prices</div>
          <div className="col-span-2">Units</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Products List */}
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              id={
                product.productCode
                  ? `product-${product.productCode}`
                  : `product-${product.id}`
              }
              className="border-b p-4 grid grid-cols-12 gap-4 items-center bg-white transition-all duration-300"
            >
              <div className="col-span-2">
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="col-span-2 font-semibold text-gray-900">
                {product.name}
              </div>
              <div className="col-span-3 text-gray-800">
                {product.description}
              </div>
              <div className="col-span-2 font-semibold text-gray-900">
                {typeof product.price === "number"
                  ? `$${product.price.toFixed(2)}`
                  : product.price}
              </div>
              <div className="col-span-2">
                <div className="relative">
                  <select
                    className="w-full appearance-none border border-gray-300 bg-white p-2 pr-8 rounded-md text-gray-900"
                    value={selectedQuantities[product.id] || 0}
                    onChange={(e) =>
                      handleQuantityChange(product.id, parseInt(e.target.value))
                    }
                  >
                    <option value={0}>Choose unit</option>
                    <option value={50}>50pcs</option>
                    <option value={100}>100pcs</option>
                    <option value={200}>200pcs</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <button
                  onClick={() => handleBuyStock(product.id)}
                  disabled={!selectedQuantities[product.id]}
                  className={`py-2 px-6 text-white rounded-md text-sm font-semibold ${
                    selectedQuantities[product.id]
                      ? "bg-[#FF0059] hover:bg-[#E0004D]"
                      : "bg-gray-400"
                  }`}
                >
                  Buy
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500 bg-white border-b">
            No products found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}

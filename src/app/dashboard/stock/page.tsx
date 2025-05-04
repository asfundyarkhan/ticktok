"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

interface Product {
  id: string;
  image: string;
  name: string;
  description: string;
  price: number;
  units: number;
}

export default function StockPage() {
  const products: Product[] = [
    {
      id: "1",
      image: "/placeholder.jpg",
      name: "T-Shirt Nike",
      description: "100% cotton, unisex",
      price: 300.0,
      units: 50,
    },
    {
      id: "2",
      image: "/placeholder.jpg",
      name: "Long Pants Nike",
      description: "100% cotton, unisex",
      price: 500.0,
      units: 10,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-semibold">John Doe</h1>
          <span className="px-2 py-1 text-sm bg-gray-200 rounded">ref002</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <Link
            href="/dashboard/stock"
            className="px-1 py-4 text-pink-500 border-b-2 border-pink-500"
          >
            Stock
          </Link>
          <Link
            href="/dashboard/stock/add"
            className="px-1 py-4 text-gray-500 hover:text-gray-700"
          >
            List a Stock
          </Link>
        </nav>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search available stock"
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                PRODUCT IMAGE
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                PRODUCT NAME
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                DESCRIPTION
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                PRICES
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                UNITS
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b last:border-b-0">
                <td className="px-6 py-4">
                  <div className="w-20 h-20 bg-gray-100 rounded"></div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium">{product.name}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {product.description}
                </td>
                <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">{product.units}pcs</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <button className="px-4 py-1 text-white bg-pink-500 rounded-md hover:bg-pink-600">
                      Delete
                    </button>
                    <button className="px-4 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

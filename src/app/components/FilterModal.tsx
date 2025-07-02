"use client";

import React from "react";
import * as Slider from "@radix-ui/react-slider";
import { X, Filter } from "lucide-react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[]) => void;
  categories: Array<{ id: string; name: string }>;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const sizes = ["XS", "S", "M", "L", "XL", "2XL"];

export default function FilterModal({
  isOpen,
  onClose,
  priceRange,
  setPriceRange,
  selectedSizes,
  setSelectedSizes,
  categories,
  selectedCategory,
  setSelectedCategory,
}: FilterModalProps) {
  const handleSizeClick = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const clearAllFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedSizes([]);
    setSelectedCategory("all");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-end sm:items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? "bg-pink-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={priceRange}
                max={1000}
                step={10}
                onValueChange={setPriceRange}
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
                  <Slider.Range className="absolute bg-pink-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-5 h-5 bg-white border-2 border-pink-500 rounded-full hover:bg-pink-50 focus:outline-none"
                  aria-label="Min price"
                />
                <Slider.Thumb
                  className="block w-5 h-5 bg-white border-2 border-pink-500 rounded-full hover:bg-pink-50 focus:outline-none"
                  aria-label="Max price"
                />
              </Slider.Root>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-600">${priceRange[0]}</span>
                <span className="text-sm text-gray-600">${priceRange[1]}</span>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Size</h3>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeClick(size)}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                      selectedSizes.includes(size)
                        ? "bg-pink-500 text-white border-pink-500"
                        : "border-gray-300 text-gray-700 hover:border-pink-500"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={clearAllFilters}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

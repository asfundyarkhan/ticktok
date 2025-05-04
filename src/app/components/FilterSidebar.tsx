import * as Slider from "@radix-ui/react-slider";
import React from "react";

interface FilterSidebarProps {
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[]) => void;
}

const sizes = ["XS", "S", "M", "L", "XL", "2XL"];

export default function FilterSidebar({
  priceRange,
  setPriceRange,
  selectedSizes,
  setSelectedSizes,
}: FilterSidebarProps) {
  const handleSizeClick = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  return (
    <div className="w-64 flex-shrink-0 pr-8">
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price</h3>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={priceRange}
          max={300}
          step={1}
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
          <span className="text-gray-800">${priceRange[0]}</span>
          <span className="text-gray-800">${priceRange[1]}</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Size</h3>
        <div className="grid grid-cols-2 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => handleSizeClick(size)}
              className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                selectedSizes.includes(size)
                  ? "bg-pink-500 text-white border-pink-500"
                  : "border-gray-300 text-gray-800 hover:border-pink-500"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CategoryBarProps {
  categories: { id: string; name: string }[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryBar({
  categories,
  selected,
  onSelect,
}: CategoryBarProps) {
  return (
    <div className="mb-8">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
              selected === category.id
                ? "bg-pink-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}

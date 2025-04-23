import toast from "react-hot-toast";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: {
    label?: string;
    value?: string;
  };
  className?: string;
  copyable?: boolean;
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  className = "",
  copyable = false,
  isLoading = false,
}: StatsCardProps) {
  const handleCopy = async () => {
    if (copyable) {
      try {
        await navigator.clipboard.writeText(value.toString());
        toast.success("Referral ID copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy referral ID");
        console.error("Failed to copy text: ", err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-50 p-6 rounded-lg animate-pulse ${className}`}>
        <div className="h-5 w-24 bg-gray-200 rounded mb-3"></div>
        <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
        {subtitle && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 p-6 rounded-lg ${
        copyable ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
      } ${className}`}
      onClick={copyable ? handleCopy : undefined}
    >
      <h3 className="text-gray-800 text-lg font-medium mb-3">{title}</h3>
      <p className="text-[#FF2C55] text-3xl font-semibold mb-2">{value}</p>
      {subtitle && (
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">{subtitle.label}</span>
          <span className="text-gray-900 text-sm font-medium">
            {subtitle.value}
          </span>
        </div>
      )}
    </div>
  );
}

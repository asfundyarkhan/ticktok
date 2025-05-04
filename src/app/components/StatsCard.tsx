import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

export default function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-semibold text-pink-500">{value}</p>
    </div>
  );
}

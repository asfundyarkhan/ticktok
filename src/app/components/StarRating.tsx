interface StarRatingProps {
  rating: number;
  starColor?: string;
  size?: string;
}

export default function StarRating({
  rating,
  starColor = "#f59e0b",
  size = "16px",
}: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const starId = `star-${i}`;
    const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));

    return (
      <div
        key={i}
        className="inline-block"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 51 48">
          <defs>
            <linearGradient id={starId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset={`${fillPercentage}%`}
                style={{ stopColor: starColor, stopOpacity: 1 }}
              />
              <stop
                offset={`${fillPercentage}%`}
                style={{ stopColor: "#d1d5db", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            fill={`url(#${starId})`}
            d="m25,1 6,17h18l-14,11 5,17-15-10-15,10 5-17-14-11h18z"
            style={{ transition: "fill .2s ease-in-out" }}
          />
        </svg>
      </div>
    );
  });

  return (
    <div className="flex items-center gap-0.5">
      {stars}
      <span className="ml-1 text-sm text-gray-500">({rating})</span>
    </div>
  );
}

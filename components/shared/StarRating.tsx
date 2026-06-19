import { Star, StarHalf } from 'lucide-react';

export default function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalf ? 1 : 0));

  return (
    <div className="flex items-center gap-0.5 text-yellow-500">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} size={size} fill="currentColor" className="text-yellow-500" />
      ))}
      {hasHalf && <StarHalf size={size} fill="currentColor" className="text-yellow-500" />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-muted-foreground/30" />
      ))}
    </div>
  );
}

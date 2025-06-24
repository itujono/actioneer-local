import { TravelSectionSkeletonProps } from "./types";

// Skeleton loading components
export function TravelSectionSkeleton({
  title,
  subtitle,
}: TravelSectionSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-concrete">
        <h3 className="text-lg font-medium text-thunder">{title}</h3>
        <div className="mt-1">
          <div className="h-4 bg-concrete rounded animate-pulse w-48"></div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <TravelCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TravelCardSkeleton() {
  return (
    <div className="border border-concrete rounded-lg p-4">
      <div className="mb-3">
        {/* Title skeleton */}
        <div className="h-5 bg-concrete rounded animate-pulse w-3/4 mb-2"></div>
        {/* Subtitle skeleton */}
        <div className="h-4 bg-concrete rounded animate-pulse w-1/2"></div>
      </div>

      <div className="flex items-center justify-between">
        {/* Price skeleton */}
        <div className="h-6 bg-concrete rounded animate-pulse w-20"></div>
        {/* Button skeleton */}
        <div className="h-8 bg-concrete rounded animate-pulse w-20"></div>
      </div>
    </div>
  );
}

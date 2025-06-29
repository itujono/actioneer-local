function DashboardCardSkeleton() {
  return (
    <div className="bg-white overflow-hidden rounded-lg border-2 border-gray-light flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex items-center">
          {/* Icon skeleton */}
          <div className="flex-shrink-0 rounded-md p-3 bg-concrete/50">
            <div className="h-6 w-6 bg-concrete rounded animate-pulse"></div>
          </div>
          <div className="ml-5 w-0 flex-1">
            {/* Title skeleton */}
            <div className="h-4 bg-concrete rounded animate-pulse w-32 mb-2"></div>
            {/* Value skeleton */}
            <div className="h-6 bg-concrete rounded animate-pulse w-20"></div>
          </div>
        </div>
      </div>
      {/* Button area skeleton */}
      <div className="bg-concrete/30 px-5 py-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-concrete rounded animate-pulse w-28"></div>
          <div className="h-4 w-4 bg-concrete rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for welcome banner
function WelcomeBannerSkeleton() {
  return (
    <div className="rounded-lg shadow-md overflow-hidden mt-6">
      <div className="bg-daisy px-6 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-6 bg-white/20 rounded animate-pulse w-64 mb-2"></div>
            <div className="h-4 bg-white/20 rounded animate-pulse w-96"></div>
          </div>
        </div>
      </div>
      <div className="border-t border-heliotrope/20 bg-daisy px-6 py-2">
        <div className="h-4 bg-white/20 rounded animate-pulse w-80"></div>
      </div>
    </div>
  );
}

// Skeleton for recent activity item
function RecentActivityItemSkeleton() {
  return (
    <li className="px-4 py-4">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-concrete/50 animate-pulse"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-concrete rounded animate-pulse w-48 mb-2"></div>
          <div className="h-3 bg-concrete rounded animate-pulse w-32"></div>
        </div>
        <div className="h-4 bg-concrete rounded animate-pulse w-16"></div>
      </div>
    </li>
  );
}

// Skeleton for section with list items
function SectionSkeleton({
  title,
  itemCount = 3,
}: {
  title: string;
  itemCount?: number;
}) {
  return (
    <div className="bg-white overflow-hidden rounded-lg border-2 border-gray-light">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-black">{title}</h3>
        <div className="h-5 w-5 bg-concrete rounded animate-pulse"></div>
      </div>
      <div className="border-t border-concrete">
        <ul className="divide-y divide-concrete">
          {Array.from({ length: itemCount }, (_, index) => (
            <RecentActivityItemSkeleton key={index} />
          ))}
        </ul>
      </div>
    </div>
  );
}

// Skeleton for when Gmail processing is not enabled (simplified version)
export function DashboardSkeletonSimple() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner Skeleton */}
      <WelcomeBannerSkeleton />

      {/* Gmail OAuth Setup Skeleton */}
      <div className="bg-white rounded-lg border-2 border-gray-light p-6">
        <div className="h-5 bg-concrete rounded animate-pulse w-40 mb-3"></div>
        <div className="h-4 bg-concrete rounded animate-pulse w-64 mb-4"></div>
        <div className="h-10 bg-concrete rounded animate-pulse w-32"></div>
      </div>
    </div>
  );
}

// Main dashboard skeleton component (full version when Gmail is enabled)
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner Skeleton */}
      <WelcomeBannerSkeleton />

      {/* Gmail OAuth Setup Skeleton */}
      <div className="bg-white rounded-lg border-2 border-gray-light p-6">
        <div className="h-5 bg-concrete rounded animate-pulse w-40 mb-3"></div>
        <div className="h-4 bg-concrete rounded animate-pulse w-64 mb-4"></div>
        <div className="h-10 bg-concrete rounded animate-pulse w-32"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>

      {/* Recent Actionable Insights Skeleton */}
      <div className="mt-8">
        <div className="h-6 bg-concrete rounded animate-pulse w-48 mb-2"></div>
        <div className="overflow-hidden border-2 border-gray-light sm:rounded-lg">
          <div className="bg-white">
            <ul className="divide-y divide-concrete">
              {Array.from({ length: 4 }, (_, index) => (
                <RecentActivityItemSkeleton key={index} />
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Grid Sections Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionSkeleton title="Upcoming Events" itemCount={2} />
        <SectionSkeleton title="Recent Expenses" itemCount={3} />
      </div>
    </div>
  );
}

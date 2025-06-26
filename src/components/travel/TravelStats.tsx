export interface TravelStatsProps {
  travelEmails?: any[];
  isLoading: boolean;
}

export function TravelStats({ travelEmails, isLoading }: TravelStatsProps) {
  if (!travelEmails || travelEmails.length === 0) {
    return null; // Don't show stats if no data
  }

  // Calculate basic travel metrics
  const totalEmails = travelEmails.length;

  // Get unique destinations
  const uniqueDestinations = new Set(
    travelEmails
      .map((email) => email.destination)
      .filter((dest) => dest && dest.trim() !== "")
  ).size;

  // Get emails from this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const thisMonthEmails = travelEmails.filter(
    (email) => new Date(email.created_at) >= thisMonth
  ).length;

  const stats = [
    {
      title: "Total Travel Emails",
      value: totalEmails,
      icon: <span className="text-2xl">📧</span>,
    },
    {
      title: "Destinations Discovered",
      value: uniqueDestinations,
      icon: <span className="text-2xl">🌍</span>,
    },
    {
      title: "This Month",
      value: thisMonthEmails,
      icon: <span className="text-2xl">📅</span>,
    },
  ];

  return (
    <div className="mt-8">
      <div className="bg-white overflow-hidden rounded-md border-2 border-gray-light">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x lg:divide-x divide-gray-light">
          {stats.map((stat) => (
            <TravelStatsCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TravelStatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function TravelStatsCard({
  title,
  value,
  icon,
  isLoading,
}: TravelStatsCardProps) {
  return (
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-thunder truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-thunder">
              {isLoading ? "..." : value}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

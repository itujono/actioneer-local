import { BriefcaseIcon, Clock, AlertCircle, CheckCircle } from "lucide-react";
import type { JobsStatsProps, JobApplication } from "./types";

export function JobsStats({ jobApplications, isLoading }: JobsStatsProps) {
  const stats: Array<{
    title: JobStatsTitle;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
  }> = [
    {
      title: "Total Applications" as const,
      value: jobApplications?.length || 0,
      icon: <BriefcaseIcon className="h-6 w-6 text-bittersweet" />,
      colorClass: "text-bittersweet",
    },
    {
      title: "Pending" as const,
      value:
        jobApplications?.filter(
          (app: JobApplication) => app.status.toLowerCase() === "applied"
        ).length || 0,
      icon: <Clock className="h-6 w-6 text-bittersweet" />,
      colorClass: "text-bittersweet",
    },
    {
      title: "Next Step" as const,
      value:
        jobApplications?.filter(
          (app: JobApplication) => app.status.toLowerCase() === "next_step"
        ).length || 0,
      icon: <AlertCircle className="h-6 w-6 text-jade" />,
      colorClass: "text-jade",
    },
    {
      title: "Interviews" as const,
      value:
        jobApplications?.filter((app: JobApplication) =>
          app.status.toLowerCase().includes("interview")
        ).length || 0,
      icon: <AlertCircle className="h-6 w-6 text-jade" />,
      colorClass: "text-jade",
    },
    {
      title: "Success Rate" as const,
      value:
        jobApplications?.filter((app: JobApplication) =>
          ["offer", "accepted"].includes(app.status.toLowerCase())
        ).length || 0,
      icon: <CheckCircle className="h-6 w-6 text-jade" />,
      colorClass: "text-jade",
    },
  ];

  return (
    <div className="mt-8">
      <div className="bg-white overflow-hidden rounded-md border-2 border-gray-light">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x lg:divide-x divide-gray-light">
          {stats.map((stat) => (
            <JobStatsCard
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

type JobStatsTitle =
  | "Total Applications"
  | "Pending"
  | "Next Step"
  | "Interviews"
  | "Success Rate";

interface JobStatsCardProps {
  title: JobStatsTitle;
  value: number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function JobStatsCard({ title, value, icon, isLoading }: JobStatsCardProps) {
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

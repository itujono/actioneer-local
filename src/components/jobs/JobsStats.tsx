import { BriefcaseIcon, Clock, AlertCircle, CheckCircle } from "lucide-react";
import type { JobsStatsProps, JobApplication } from "./types";

export function JobsStats({ jobApplications, isLoading }: JobsStatsProps) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      <JobStatsCard
        title="Total Applications"
        value={jobApplications?.length || 0}
        icon={<BriefcaseIcon className="h-6 w-6 text-bittersweet" />}
        isLoading={isLoading}
      />
      <JobStatsCard
        title="Pending"
        value={
          jobApplications?.filter(
            (app: JobApplication) => app.status.toLowerCase() === "applied"
          ).length || 0
        }
        icon={<Clock className="h-6 w-6 text-bittersweet" />}
        isLoading={isLoading}
      />
      <JobStatsCard
        title="Next Step"
        value={
          jobApplications?.filter(
            (app: JobApplication) => app.status.toLowerCase() === "next_step"
          ).length || 0
        }
        icon={<AlertCircle className="h-6 w-6 text-bittersweet" />}
        isLoading={isLoading}
      />
      <JobStatsCard
        title="Interviews"
        value={
          jobApplications?.filter((app: JobApplication) =>
            app.status.toLowerCase().includes("interview")
          ).length || 0
        }
        icon={<AlertCircle className="h-6 w-6 text-bittersweet" />}
        isLoading={isLoading}
      />
      <JobStatsCard
        title="Success Rate"
        value={
          jobApplications?.filter((app: JobApplication) =>
            ["offer", "accepted"].includes(app.status.toLowerCase())
          ).length || 0
        }
        icon={<CheckCircle className="h-6 w-6 text-bittersweet" />}
        isLoading={isLoading}
      />
    </div>
  );
}

interface JobStatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function JobStatsCard({ title, value, icon, isLoading }: JobStatsCardProps) {
  return (
    <div className="bg-white overflow-hidden rounded-md border-2 border-gray-light">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 [&>svg]:text-bittersweet">{icon}</div>
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
    </div>
  );
}

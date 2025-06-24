import React from "react";
import { BriefcaseIcon, Clock, AlertCircle, CheckCircle } from "lucide-react";
import type { JobsStatsProps, JobApplication } from "./types";

export function JobsStats({ jobApplications, isLoading }: JobsStatsProps) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BriefcaseIcon className="h-6 w-6 text-bittersweet" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-thunder truncate">
                  Total Applications
                </dt>
                <dd className="text-lg font-medium text-thunder">
                  {isLoading ? "..." : jobApplications?.length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-thunder truncate">
                  Pending
                </dt>
                <dd className="text-lg font-medium text-thunder">
                  {isLoading
                    ? "..."
                    : jobApplications?.filter(
                        (app: JobApplication) =>
                          app.status.toLowerCase() === "applied"
                      ).length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-thunder truncate">
                  Next Step
                </dt>
                <dd className="text-lg font-medium text-thunder">
                  {isLoading
                    ? "..."
                    : jobApplications?.filter(
                        (app: JobApplication) =>
                          app.status.toLowerCase() === "next_step"
                      ).length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-thunder truncate">
                  Interviews
                </dt>
                <dd className="text-lg font-medium text-thunder">
                  {isLoading
                    ? "..."
                    : jobApplications?.filter((app: JobApplication) =>
                        app.status.toLowerCase().includes("interview")
                      ).length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-thunder truncate">
                  Success Rate
                </dt>
                <dd className="text-lg font-medium text-thunder">
                  {isLoading
                    ? "..."
                    : jobApplications && jobApplications.length > 0
                    ? `${Math.round(
                        (jobApplications.filter((app: JobApplication) =>
                          ["offer", "accepted"].includes(
                            app.status.toLowerCase()
                          )
                        ).length /
                          jobApplications.length) *
                          100
                      )}%`
                    : "0%"}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

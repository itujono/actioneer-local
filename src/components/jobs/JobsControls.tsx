import React from "react";
import { Search } from "lucide-react";
import { Select, Input, Checkbox } from "../ui";
import type { JobsControlsProps } from "./types";

export function JobsControls({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  uniqueStatuses,
  pageSize,
  setPageSize,
  groupSimilarApplications,
  setGroupSimilarApplications,
}: JobsControlsProps) {
  return (
    <div className="mt-8 bg-white rounded-md border-2 border-gray-light">
      <div className="p-6 border-gray-light">
        <div className="flex flex-col space-y-4">
          {/* Top row: Search and primary controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <Input
                type="text"
                leftIcon={<Search className="h-4 w-4" />}
                placeholder="Search companies or positions..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Escape") {
                    setSearchTerm("");
                  }
                }}
                containerClassName="max-w-sm"
              />
            </div>

            {/* Status Filter and Page Size */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(e.target.value)
                  }
                  options={[
                    { value: "all", label: "All Statuses" },
                    ...uniqueStatuses.map((status: string) => ({
                      value: status,
                      label: status.charAt(0).toUpperCase() + status.slice(1),
                    })),
                  ]}
                  size="sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-thunder">Show:</span>
                <Select
                  value={pageSize.toString()}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setPageSize(Number(e.target.value))
                  }
                  options={[
                    { value: "10", label: "10" },
                    { value: "20", label: "20" },
                    { value: "50", label: "50" },
                    { value: "100", label: "100" },
                  ]}
                  size="sm"
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Bottom row: Grouping option */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-light">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="group-similar"
                checked={groupSimilarApplications}
                onChange={(checked: boolean) =>
                  setGroupSimilarApplications(checked)
                }
              />
              <label
                htmlFor="group-similar"
                className="text-sm font-medium text-thunder cursor-pointer"
              >
                Group similar applications
              </label>
              <span className="text-xs text-thunder/60">
                Combine multiple applications to the same company and position
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

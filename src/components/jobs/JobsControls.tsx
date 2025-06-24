import React from "react";
import { Search } from "lucide-react";
import { Select } from "../ui";
import type { JobsControlsProps } from "./types";

export function JobsControls({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  uniqueStatuses,
  pageSize,
  setPageSize,
}: JobsControlsProps) {
  return (
    <div className="mt-8 bg-white shadow rounded-lg">
      <div className="p-6 border-b border-concrete">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-concrete" />
            </div>
            <input
              type="text"
              className="block w-full max-w-sm pl-10 pr-3 py-2 border border-concrete rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
      </div>
    </div>
  );
}

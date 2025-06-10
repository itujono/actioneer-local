import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  BriefcaseIcon,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Plus,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "../supabase/client";
import { formatDistanceToNow } from "date-fns";

export const jobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs",
  component: JobsDashboard,
});

type JobApplication = {
  id: string;
  email_id: string;
  company: string;
  position: string;
  status: string;
  applied_date: string;
  details: any;
  created_at: string;
};

type SortConfig = {
  key: keyof JobApplication;
  direction: "asc" | "desc";
};

function JobsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "applied_date",
    direction: "desc",
  });

  // Fetch job applications
  const {
    data: jobApplications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["job-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("applied_date", { ascending: false });

      if (error) throw error;
      return data as JobApplication[];
    },
  });

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    if (!jobApplications) return [];

    let filtered = jobApplications.filter((app: JobApplication) => {
      const matchesSearch =
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort the filtered results
    filtered.sort((a: JobApplication, b: JobApplication) => {
      let aValue: string | number = a[sortConfig.key] as string | number;
      let bValue: string | number = b[sortConfig.key] as string | number;

      // Handle date sorting
      if (
        sortConfig.key === "applied_date" ||
        sortConfig.key === "created_at"
      ) {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [jobApplications, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key: keyof JobApplication) => {
    setSortConfig((current: SortConfig) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "interview":
      case "interviewing":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "offer":
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "interview":
      case "interviewing":
        return "bg-yellow-100 text-yellow-800";
      case "offer":
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const uniqueStatuses = useMemo(() => {
    if (!jobApplications) return [];
    const statuses = jobApplications.map((app: JobApplication) => app.status);
    return Array.from(new Set(statuses));
  }, [jobApplications]);

  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading job applications
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {error instanceof Error
                    ? error.message
                    : "An unexpected error occurred"}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Job Applications
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage your job applications
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Applications
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
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
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
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
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Interviews
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
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
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Success Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
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

        {/* Filters and Search */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search companies or positions..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-400 mr-2" />
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setStatusFilter(e.target.value)
                    }
                  >
                    <option value="all">All Statuses</option>
                    {uniqueStatuses.map((status: string) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden">
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">
                  Loading applications...
                </p>
              </div>
            ) : filteredAndSortedApplications.length === 0 ? (
              <div className="py-12 text-center">
                <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {jobApplications?.length === 0
                    ? "No job applications yet"
                    : "No applications match your filters"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {jobApplications?.length === 0
                    ? "Job application emails will automatically appear here when detected."
                    : "Try adjusting your search or filters to find what you're looking for."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("company")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Company</span>
                          {sortConfig.key === "company" &&
                            (sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("position")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Position</span>
                          {sortConfig.key === "position" &&
                            (sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {sortConfig.key === "status" &&
                            (sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("applied_date")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Applied Date</span>
                          {sortConfig.key === "applied_date" &&
                            (sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Last Updated
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedApplications.map(
                      (application: JobApplication) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-gray-500" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {application.company}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {application.position}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(application.status)}
                              <span
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                                  application.status
                                )}`}
                              >
                                {application.status.charAt(0).toUpperCase() +
                                  application.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {new Date(
                                application.applied_date
                              ).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDistanceToNow(
                              new Date(application.created_at),
                              { addSuffix: true }
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

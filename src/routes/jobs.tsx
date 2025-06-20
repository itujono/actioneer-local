import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  BriefcaseIcon,
  Search,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  Mail,
  Columns,
  GripVertical,
} from "lucide-react";
import { supabase } from "../supabase/client";
import { formatDistanceToNow } from "date-fns";
import { CustomFieldsManager } from "../components/CustomFieldsManager";
import { EditableCustomFieldCell } from "../components/CustomFieldInput";
import { useCustomFields } from "../hooks/useCustomFields";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useColumnOrder, ColumnConfig } from "../hooks/useColumnOrder";
import { DraggableTableHeader } from "../components/DraggableTableHeader";

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
  country_code?: string;
  country?: string;
  details: any;
  created_at: string;
};

type SortConfig = {
  key: keyof JobApplication;
  direction: "asc" | "desc";
};

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode?: string): string => {
  if (!countryCode) return "";

  const flags: Record<string, string> = {
    US: "🇺🇸",
    GB: "🇬🇧",
    CA: "🇨🇦",
    AU: "🇦🇺",
    DE: "🇩🇪",
    FR: "🇫🇷",
    JP: "🇯🇵",
    KR: "🇰🇷",
    IN: "🇮🇳",
    BR: "🇧🇷",
    MX: "🇲🇽",
    NL: "🇳🇱",
    SE: "🇸🇪",
    CH: "🇨🇭",
    IT: "🇮🇹",
    ES: "🇪🇸",
    ID: "🇮🇩",
    NZ: "🇳🇿",
    SG: "🇸🇬",
    HK: "🇭🇰",
    TW: "🇹🇼",
    PH: "🇵🇭",
    ZA: "🇿🇦",
    MY: "🇲🇾",
    TH: "🇹🇭",
    VN: "🇻🇳",
    NG: "🇳🇬",
  };

  return flags[countryCode.toUpperCase()] || "";
};

// Helper function to construct Gmail URL from message ID
const getGmailUrl = (emailId: string, application?: JobApplication): string => {
  console.log("🔗 Constructing Gmail URL for email ID:", emailId);

  if (!emailId) {
    console.warn("⚠️ No email ID provided, redirecting to inbox");
    return "https://mail.google.com/mail/u/0/#inbox";
  }

  // Since Gmail API message IDs (msg-f:123456789) don't work with Gmail web URLs,
  // we'll use a search-based approach that's more reliable

  if (application?.company && application?.position) {
    // Create a search query using company and position which should be unique enough
    const searchTerms = [];

    // Add company name (clean it up for search)
    const cleanCompany = application.company.replace(/[^\w\s]/g, "").trim();
    if (cleanCompany) {
      searchTerms.push(`"${cleanCompany}"`);
    }

    // Add position keywords
    const cleanPosition = application.position.replace(/[^\w\s]/g, "").trim();
    if (cleanPosition) {
      // Split position into words and add the most meaningful ones
      const positionWords = cleanPosition
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 2 &&
            !["the", "and", "for", "with"].includes(word.toLowerCase())
        );
      if (positionWords.length > 0) {
        searchTerms.push(`"${positionWords.slice(0, 2).join(" ")}"`);
      }
    }

    // Add "job" or "application" to narrow down results
    searchTerms.push("(job OR application OR position OR role)");

    const searchQuery = searchTerms.join(" ");
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://mail.google.com/mail/u/0/#search/${encodedQuery}`;

    console.log("🔍 Generated search query:", searchQuery);
    console.log("🌐 Generated search URL:", searchUrl);
    return searchUrl;
  }

  // Fallback: Search for just the message ID (though this format likely won't match)
  console.log("🔍 Using message ID fallback search");
  const fallbackQuery = encodeURIComponent(`"${emailId}"`);
  const fallbackUrl = `https://mail.google.com/mail/u/0/#search/${fallbackQuery}`;
  console.log("🌐 Generated fallback URL:", fallbackUrl);
  return fallbackUrl;
};

// Helper function to handle Gmail URL opening with error handling
const openGmailUrl = (emailId: string, application?: JobApplication) => {
  try {
    const url = getGmailUrl(emailId, application);
    console.log("🚀 Opening Gmail URL:", url);

    // Open in new tab
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!newWindow) {
      console.error("❌ Failed to open new window - popup blocked?");
      // Fallback: try to navigate in current tab
      window.location.href = url;
    } else {
      console.log("✅ Successfully opened Gmail search in new tab");
    }
  } catch (error) {
    console.error("❌ Error opening Gmail URL:", error);
    // Ultimate fallback: just go to Gmail inbox
    window.open("https://mail.google.com/mail/u/0/#inbox", "_blank");
  }
};

function JobsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "applied_date",
    direction: "desc",
  });
  const [showCustomFieldsManager, setShowCustomFieldsManager] = useState(false);

  // Use TanStack Query for auth management
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Custom fields hook
  const { customFields, getCustomFieldValue, setCustomFieldValue } =
    useCustomFields({
      tableName: "job_applications",
      userId: user?.id,
    });

  // Define default columns configuration
  const defaultColumns: ColumnConfig[] = [
    { id: "company", label: "Company", key: "company", sortable: true },
    { id: "position", label: "Position", key: "position", sortable: true },
    { id: "status", label: "Status", key: "status", sortable: true },
    // Custom fields will be added dynamically
    {
      id: "applied_date",
      label: "Applied Date",
      key: "applied_date",
      sortable: true,
    },
    {
      id: "created_at",
      label: "Last Updated",
      key: "created_at",
      sortable: true,
    },
    // { id: "actions", label: "Find Email", key: "actions", fixed: true }, // Fixed column
  ];

  // Add custom fields to columns
  const columnsWithCustomFields = React.useMemo(() => {
    const baseColumns = defaultColumns.filter(
      (col) =>
        col.id !== "applied_date" &&
        col.id !== "created_at" &&
        col.id !== "actions"
    );
    const customFieldColumns: ColumnConfig[] = customFields.map((field) => ({
      id: `custom-${field.id}`,
      label: field.field_label,
      key: field.field_name,
      sortable: false, // Custom fields aren't sortable yet
    }));

    // Add back the date columns and actions at the end
    const endColumns = defaultColumns.filter(
      (col) =>
        col.id === "applied_date" ||
        col.id === "created_at" ||
        col.id === "actions"
    );

    return [...baseColumns, ...customFieldColumns, ...endColumns];
  }, [customFields]);

  // Column order hook
  const { columnOrder, handleDragEnd, resetColumnOrder } = useColumnOrder({
    defaultColumns: columnsWithCustomFields,
    storageKey: "job-applications-column-order",
  });

  // Handle drag end for columns
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      handleDragEnd(String(active.id), String(over.id));
    }
  };

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Mutation to update job application custom fields
  const updateJobApplicationMutation = useMutation({
    mutationFn: async ({
      jobId,
      fieldName,
      newValue,
    }: {
      jobId: string;
      fieldName: string;
      newValue: any;
    }) => {
      // Find the job application to update
      const jobApp = jobApplications?.find((app) => app.id === jobId);
      if (!jobApp) {
        throw new Error("Job application not found");
      }

      // Update the custom field value in the details JSON
      const updatedDetails = setCustomFieldValue(
        jobApp.details,
        fieldName,
        newValue
      );

      // Update in database
      const { data, error } = await supabase
        .from("job_applications")
        .update({ details: updatedDetails })
        .eq("id", jobId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch job applications
      queryClient.invalidateQueries({
        queryKey: ["job-applications", user?.id],
      });
    },
  });

  // Fetch job applications only when authenticated
  const {
    data: jobApplications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["job-applications", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("📊 Fetching job applications for user:", user.id);
      console.log("📧 User email:", user.email);

      // Let's also check what users exist in the custom users table with this email
      const { data: customUsers, error: customUsersError } = await supabase
        .from("users")
        .select("id, email, source, created_at")
        .eq("email", user.email);

      console.log("🔍 Custom users with this email:", customUsers);

      // Let's also check if there are ANY job applications in the database
      const { data: allJobApps, error: allJobAppsError } = await supabase
        .from("job_applications")
        .select("id, user_id, company, position, created_at");

      console.log(
        "🔍 All job applications in database (first 10):",
        allJobApps?.slice(0, 10)
      );

      // Let's specifically look for job applications with the custom user ID we saw in logs
      const { data: customUserJobApps, error: customUserJobAppsError } =
        await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", "5591725b-bd0e-4651-abf2-5fdb00b1a7fb");

      console.log(
        "🔍 Job applications with custom user ID 5591725b-bd0e-4651-abf2-5fdb00b1a7fb:",
        customUserJobApps
      );

      // First try direct query with Supabase auth user ID
      const { data: directData, error: directError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("applied_date", { ascending: false });

      if (directError) {
        console.error("❌ Direct query error:", directError);
        throw directError;
      }

      console.log("🔍 Direct query results:", directData?.length || 0);

      // Also try querying with custom user ID as fallback for old data
      let customUserData = [];
      if (customUsers && customUsers.length > 0) {
        const { data: customData, error: customError } = await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", customUsers[0].id)
          .order("applied_date", { ascending: false });

        if (!customError && customData) {
          customUserData = customData;
          console.log("🔍 Custom user query results:", customData?.length || 0);
        }
      }

      // Combine both results and remove duplicates
      const allData = [...(directData || []), ...customUserData];
      const uniqueData = allData.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );

      const data = uniqueData;
      const error = directError;

      if (error) {
        console.error("❌ Query error:", error);
        throw error;
      }

      console.log("✅ Job applications fetched:", data?.length || 0);
      return data as JobApplication[];
    },
    enabled: !!user && !authLoading, // Only run when user is authenticated
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

  const handleSort = (key: string) => {
    // Type guard to ensure we only sort by valid JobApplication keys
    const validKeys: (keyof JobApplication)[] = [
      "company",
      "position",
      "status",
      "applied_date",
      "created_at",
    ];

    if (validKeys.includes(key as keyof JobApplication)) {
      setSortConfig((current: SortConfig) => ({
        key: key as keyof JobApplication,
        direction:
          current.key === key && current.direction === "asc" ? "desc" : "asc",
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "next_step":
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
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
      case "next_step":
        return "bg-purple-100 text-purple-800";
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

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">
              Checking authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, the useEffect above will redirect to /auth
  // Show loading while redirect happens
  if (!user) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                <div className="mt-2 text-xs text-red-600">
                  User ID: {user?.id || "Not authenticated"}
                  <br />
                  Email: {user?.email || "Not authenticated"}
                </div>
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
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => setShowCustomFieldsManager(true)}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Manage custom columns"
            >
              <Columns className="h-4 w-4 mr-2" />
              Manage Custom Fields
            </button>
            <button
              onClick={resetColumnOrder}
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Reset column order to default"
            >
              <GripVertical className="h-4 w-4" />
            </button>
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
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Next Step
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
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
                  className="block w-full max-w-sm pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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

              {/* Status Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
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
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <SortableContext
                        items={columnOrder.map((col) => col.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        <tr>
                          {columnOrder.map((column) => (
                            <DraggableTableHeader
                              key={column.id}
                              column={column}
                              sortConfig={sortConfig}
                              onSort={handleSort}
                            />
                          ))}
                        </tr>
                      </SortableContext>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedApplications.map(
                        (application: JobApplication) => (
                          <tr key={application.id} className="hover:bg-gray-50">
                            {columnOrder.map((column) => {
                              const cellKey = `${application.id}-${column.id}`;

                              // Render different cell types based on column
                              switch (column.id) {
                                case "company":
                                  return (
                                    <td
                                      key={cellKey}
                                      className="px-6 py-4 whitespace-nowrap"
                                    >
                                      <div className="flex">
                                        {/* <div className="flex-shrink-0 h-10 w-10">
                                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-gray-500" />
                                          </div>
                                        </div> */}
                                        <div className="text-sm font-medium text-gray-900 flex items-center">
                                          {application.company}
                                          {getFlagEmoji(
                                            application.country_code
                                          ) && (
                                            <span className="ml-2 text-base">
                                              {getFlagEmoji(
                                                application.country_code
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  );

                                case "position":
                                  return (
                                    <td
                                      key={cellKey}
                                      className="px-6 py-4 whitespace-nowrap"
                                    >
                                      <div className="text-sm text-gray-900">
                                        {application.position}
                                      </div>
                                    </td>
                                  );

                                case "status":
                                  return (
                                    <td
                                      key={cellKey}
                                      className="px-6 py-4 whitespace-nowrap"
                                    >
                                      <div className="flex items-center">
                                        {getStatusIcon(application.status)}
                                        <span
                                          className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                                            application.status
                                          )}`}
                                        >
                                          {application.status === "next_step"
                                            ? "Next Step"
                                            : application.status
                                                .charAt(0)
                                                .toUpperCase() +
                                              application.status.slice(1)}
                                        </span>
                                      </div>
                                    </td>
                                  );

                                case "applied_date":
                                  return (
                                    <td
                                      key={cellKey}
                                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                        {new Date(
                                          application.applied_date
                                        ).toLocaleDateString()}
                                      </div>
                                    </td>
                                  );

                                case "created_at":
                                  return (
                                    <td
                                      key={cellKey}
                                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                    >
                                      {formatDistanceToNow(
                                        new Date(application.created_at)
                                      )}
                                    </td>
                                  );

                                case "actions":
                                  return (
                                    <td
                                      key={cellKey}
                                      className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                                    >
                                      <button
                                        onClick={() =>
                                          openGmailUrl(
                                            application.email_id,
                                            application
                                          )
                                        }
                                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        title="Search for this email in Gmail"
                                      >
                                        <Mail className="h-3 w-3 mr-1" />
                                        Find in Gmail
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                      </button>
                                    </td>
                                  );

                                default:
                                  // Handle custom fields
                                  if (column.id.startsWith("custom-")) {
                                    const fieldId = column.id.replace(
                                      "custom-",
                                      ""
                                    );
                                    const field = customFields.find(
                                      (f) => f.id === fieldId
                                    );

                                    if (field) {
                                      return (
                                        <td
                                          key={cellKey}
                                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                        >
                                          <EditableCustomFieldCell
                                            field={field}
                                            value={getCustomFieldValue(
                                              application.details,
                                              field.field_name
                                            )}
                                            onSave={async (newValue) => {
                                              await updateJobApplicationMutation.mutateAsync(
                                                {
                                                  jobId: application.id,
                                                  fieldName: field.field_name,
                                                  newValue,
                                                }
                                              );
                                            }}
                                            disabled={
                                              updateJobApplicationMutation.isPending
                                            }
                                          />
                                        </td>
                                      );
                                    }
                                  }

                                  // Fallback for unknown columns
                                  return (
                                    <td
                                      key={cellKey}
                                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                    >
                                      —
                                    </td>
                                  );
                              }
                            })}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </DndContext>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Fields Manager Modal */}
      <CustomFieldsManager
        isOpen={showCustomFieldsManager}
        onClose={() => setShowCustomFieldsManager(false)}
        tableName="job_applications"
        userId={user?.id || ""}
      />

      {/* Debug info for custom fields (to be removed) */}
      {process.env.NODE_ENV === "development" && (
        <div style={{ display: "none" }}>
          {/* This prevents linter errors while we're developing */}
          {customFields.length} {getCustomFieldValue({}, "test")}
        </div>
      )}
    </div>
  );
}

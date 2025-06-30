import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { XCircle } from "lucide-react";
import { supabase } from "../supabase/client";
import { CustomFieldForm, CustomFieldsManager, JobsEmpty } from "../components/jobs";
import { useCustomFields } from "../hooks/useCustomFields";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DragEndEvent } from "@dnd-kit/core";
import { useColumnOrder, ColumnConfig } from "../hooks/useColumnOrder";
import { JobsStats, JobsControls, JobsTable } from "../components/jobs";
import { DashboardContainer } from "../components/dashboard";
import type { JobApplication, SortConfig } from "../components/jobs/types";
import { groupJobApplications } from "../components/jobs/constants";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui";

export const jobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs",
  component: JobsDashboard,
});

function JobsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "applied_date",
    direction: "desc",
  });
  const [editingCustomFieldId, setEditingCustomFieldId] = useState<string | null>(null);
  const [showCustomFieldsManager, setShowCustomFieldsManager] = useState(false);
  const [groupSimilarApplications, setGroupSimilarApplications] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { user, isLoading: authLoading } = useAuth();

  // Custom fields hook
  const { customFields, getCustomFieldValue, setCustomFieldValue, updateField, isUpdating } = useCustomFields({
    tableName: "job_applications",
    userId: user?.id,
  });

  // Find the custom field being edited
  const editingCustomField = customFields.find((field) => field.id === editingCustomFieldId);

  // Handler for editing a specific custom field
  const handleEditCustomField = (fieldId: string) => {
    setEditingCustomFieldId(fieldId);
  };

  // Handler for saving custom field changes
  const handleSaveCustomField = (formData: any) => {
    if (!editingCustomFieldId) return;

    const updates = {
      field_label: formData.field_label,
      field_type: formData.field_type,
      field_options: formData.field_options,
      is_required: formData.is_required,
    };

    updateField({ id: editingCustomFieldId, updates });
    setEditingCustomFieldId(null);
  };

  // Handler for cancelling custom field edit
  const handleCancelEditCustomField = () => {
    setEditingCustomFieldId(null);
  };

  // Define default columns configuration
  const defaultColumns: ColumnConfig[] = [
    { id: "company", label: "Company", key: "company", sortable: true },
    { id: "position", label: "Position", key: "position", sortable: true },
    { id: "status", label: "Status", key: "status", sortable: true },
    { id: "website", label: "Website", key: "website", sortable: true },
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
    { id: "actions", label: "", key: "actions", fixed: true }, // Fixed column with no header name
  ];

  // Add custom fields to columns
  const columnsWithCustomFields = React.useMemo(() => {
    const baseColumns = defaultColumns.filter(
      (col) => col.id !== "applied_date" && col.id !== "created_at" && col.id !== "actions"
    );
    const customFieldColumns: ColumnConfig[] = customFields.map((field) => ({
      id: `custom-${field.id}`,
      label: field.field_label,
      key: field.field_name,
      sortable: false, // Custom fields aren't sortable yet
    }));

    // Add back the date columns and actions at the end
    const endColumns = defaultColumns.filter(
      (col) => col.id === "applied_date" || col.id === "created_at" || col.id === "actions"
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
    mutationFn: async ({ jobId, fieldName, newValue }: { jobId: string; fieldName: string; newValue: any }) => {
      // Find the job application to update
      const jobApp = jobApplications?.find((app) => app.id === jobId);
      if (!jobApp) {
        throw new Error("Job application not found");
      }

      // Update the custom field value in the details JSON
      const updatedDetails = setCustomFieldValue(jobApp.details, fieldName, newValue);

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
      queryClient.invalidateQueries({ queryKey: ["job-applications", user?.id] });
    },
  });

  // Mutation to delete job application
  const deleteJobApplicationMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Delete from database
      const { error } = await supabase.from("job_applications").delete().eq("id", jobId).eq("user_id", user.id); // Extra safety check

      if (error) {
        throw error;
      }

      return jobId;
    },
    onSuccess: () => {
      // Invalidate and refetch job applications
      queryClient.invalidateQueries({ queryKey: ["job-applications", user?.id] });
    },
  });

  // Handler for deleting job application
  const handleDeleteApplication = (applicationId: string) => {
    deleteJobApplicationMutation.mutate(applicationId);
  };

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

      // Let's also check what users exist in the custom users table with this email
      const { data: customUsers } = await supabase
        .from("users")
        .select("id, email, source, created_at")
        .eq("email", user.email);

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
        }
      }

      // Combine both results and remove duplicates
      const allData: JobApplication[] = [...(directData || []), ...customUserData];
      const uniqueData = allData.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));

      const data = uniqueData;
      const error = directError;

      if (error) {
        console.error("❌ Query error:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !authLoading, // Only run when user is authenticated
  });

  // Filter and sort applications with grouping support
  const filteredAndSortedApplications = useMemo(() => {
    if (!jobApplications) return { data: [], totalCount: 0, groups: [] };

    let filtered = jobApplications.filter((app: JobApplication) => {
      const matchesSearch =
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort the filtered results
    filtered.sort((a: JobApplication, b: JobApplication) => {
      let aValue: string | number = a[sortConfig.key] as string | number;
      let bValue: string | number = b[sortConfig.key] as string | number;

      // Handle date sorting
      if (sortConfig.key === "applied_date" || sortConfig.key === "created_at") {
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

    // Apply grouping if enabled, otherwise use individual applications
    if (groupSimilarApplications) {
      const groups = groupJobApplications(filtered);

      // Sort groups by the latest application date
      groups.sort((a, b) => {
        const aDate = new Date(a.latestDate).getTime();
        const bDate = new Date(b.latestDate).getTime();
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      });

      // Apply pagination to groups
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedGroups = groups.slice(startIndex, endIndex);

      return {
        data: [],
        totalCount: groups.length, // Total number of groups
        groups: paginatedGroups,
      };
    } else {
      // Apply pagination to individual applications
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedApplications = filtered.slice(startIndex, endIndex);

      return {
        data: paginatedApplications,
        totalCount: filtered.length, // Total number of individual applications
        groups: [],
      };
    }
  }, [
    jobApplications,
    searchTerm,
    statusFilter,
    sortConfig.key,
    sortConfig.direction,
    currentPage,
    pageSize,
    groupSimilarApplications,
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredAndSortedApplications.totalCount / pageSize);

  // Calculate pagination display values based on what we're actually showing
  const actualItemsOnPage = groupSimilarApplications
    ? filteredAndSortedApplications.groups?.length || 0
    : filteredAndSortedApplications.data.length;

  const startItem = filteredAndSortedApplications.totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min((currentPage - 1) * pageSize + actualItemsOnPage, filteredAndSortedApplications.totalCount);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const handleSort = (key: string) => {
    // Type guard to ensure we only sort by valid JobApplication keys
    const validKeys: (keyof JobApplication)[] = ["company", "position", "status", "applied_date", "created_at"];

    if (validKeys.includes(key as keyof JobApplication)) {
      setSortConfig((current: SortConfig) => ({
        key: key as keyof JobApplication,
        direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
      }));
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bittersweet"></div>
            <p className="mt-2 text-sm text-thunder">Checking authentication...</p>
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bittersweet"></div>
            <p className="mt-2 text-sm text-thunder">Redirecting to login...</p>
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
                <h3 className="text-sm font-medium text-red-800">Error loading job applications</h3>
                <p className="mt-1 text-sm text-red-700">
                  {error instanceof Error ? error.message : "An unexpected error occurred"}
                </p>
                <div className="mt-2 text-xs text-red-600">
                  User ID: {user?.id || "Not authenticated"}
                  <br />
                  Email: {user?.email || "Not authenticated"}
                </div>
                <div className="mt-3">
                  <Button
                    onClick={() => refetch()}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardContainer
      title="Job Applications"
      description="Track and manage your job search progress"
      headerActions={
        <>
          <Button onClick={() => setShowCustomFieldsManager(true)} variant="outline" size="sm">
            Custom Fields...
          </Button>
          <Button onClick={resetColumnOrder} variant="outline" size="sm">
            Reset Layout
          </Button>
        </>
      }
    >
      <JobsStats jobApplications={jobApplications} isLoading={isLoading} />

      {/* Check if we have any job applications at all */}
      {!isLoading && (!jobApplications || jobApplications.length === 0) ? (
        <JobsEmpty />
      ) : (
        <>
          {/* Only show controls when there are job applications */}
          {jobApplications && jobApplications.length > 0 && (
            <JobsControls
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              uniqueStatuses={uniqueStatuses}
              pageSize={pageSize}
              setPageSize={setPageSize}
              groupSimilarApplications={groupSimilarApplications}
              setGroupSimilarApplications={setGroupSimilarApplications}
            />
          )}

          <div className="mt-8 bg-concrete/50">
            <JobsTable
              isLoading={isLoading}
              filteredAndSortedApplications={filteredAndSortedApplications}
              sortConfig={sortConfig}
              handleSort={handleSort}
              columnOrder={columnOrder}
              onDragEnd={onDragEnd}
              customFields={customFields}
              getCustomFieldValue={getCustomFieldValue}
              updateJobApplicationMutation={updateJobApplicationMutation}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              startItem={startItem}
              endItem={endItem}
              onEditCustomField={handleEditCustomField}
              onDeleteApplication={handleDeleteApplication}
            />
          </div>
        </>
      )}

      {/* Custom Field Edit Form Modal */}
      <Dialog
        open={!!editingCustomFieldId}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCustomFieldId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Custom Field</DialogTitle>
          </DialogHeader>
          {editingCustomField && (
            <CustomFieldForm
              mode="edit"
              field={editingCustomField}
              onSave={handleSaveCustomField}
              onCancel={handleCancelEditCustomField}
              isLoading={isUpdating}
              tableName="job_applications"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Fields Manager Modal */}
      <CustomFieldsManager
        isOpen={showCustomFieldsManager}
        onClose={() => setShowCustomFieldsManager(false)}
        tableName="job_applications"
        userId={user?.id || ""}
      />
    </DashboardContainer>
  );
}

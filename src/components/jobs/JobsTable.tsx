import React from "react";
import { BriefcaseIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  DraggableTableHeader,
  DraggableCustomFieldHeader,
} from "./DraggableTableHeader";
import { JobTableRow, GroupedJobTableRow } from "./JobTableRow";
import { Button } from "../ui/button";
import type { JobsTableProps, JobApplicationGroup } from "./types";
import Loading from "../Loading";

// Update JobsTableProps to support grouped data
export interface ExtendedJobsTableProps
  extends Omit<JobsTableProps, "filteredAndSortedApplications"> {
  filteredAndSortedApplications: {
    data: any[]; // Can be JobApplication[] or empty when grouped
    totalCount: number;
    groups?: JobApplicationGroup[]; // Optional grouped data
  };
}

export function JobsTable({
  isLoading,
  filteredAndSortedApplications,
  sortConfig,
  handleSort,
  columnOrder,
  onDragEnd,
  customFields,
  getCustomFieldValue,
  updateJobApplicationMutation,
  currentPage,
  setCurrentPage,
  totalPages,
  startItem,
  endItem,
  onEditCustomField,
  onDeleteApplication,
}: ExtendedJobsTableProps) {
  const isGroupedMode =
    filteredAndSortedApplications.groups &&
    filteredAndSortedApplications.groups.length > 0;
  const hasData = isGroupedMode
    ? filteredAndSortedApplications.groups!.length > 0
    : filteredAndSortedApplications.data.length > 0;

  if (isLoading) {
    return <Loading message="Loading applications..." />;
  }

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border-2 border-concrete/30 p-8 text-center mt-8">
        <BriefcaseIcon className="mx-auto h-12 w-12 text-thunder/50 mb-4" />
        <h3 className="text-lg font-semibold text-black mb-2">
          No applications match your filters
        </h3>
        <p className="text-thunder text-sm">
          Try adjusting your search terms or filters to find what you're looking
          for.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto border-2 border-b-0 border-gray-light rounded-t-md">
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <table className="min-w-full divide-y divide-gray-light">
              <thead className="bg-transparent">
                <SortableContext
                  items={columnOrder.map((col) => col.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <tr>
                    {/* Tree connector column header */}
                    <th className="w-8 py-3 text-left text-xs font-medium text-thunder/70 uppercase tracking-wider border-b border-concrete/20">
                      {/* Empty header for tree connector */}
                    </th>
                    {columnOrder.map((column) => {
                      // Check if this is a custom field column
                      if (column.id.startsWith("custom-")) {
                        const customFieldId = column.id.replace("custom-", "");
                        const customField = customFields.find(
                          (field) => field.id === customFieldId
                        );

                        return (
                          <DraggableCustomFieldHeader
                            key={column.id}
                            fieldId={customFieldId}
                            fieldLabel={
                              customField?.field_label || column.label
                            }
                            columnOrder={columnOrder}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            onEditCustomField={onEditCustomField}
                          />
                        );
                      }

                      // Regular column
                      return (
                        <DraggableTableHeader
                          key={column.id}
                          column={column}
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      );
                    })}
                  </tr>
                </SortableContext>
              </thead>
              <tbody className="bg-white divide-y divide-gray-light">
                {isGroupedMode
                  ? // Render grouped rows
                    filteredAndSortedApplications.groups!.map((group) => (
                      <GroupedJobTableRow
                        key={group.groupKey}
                        group={group}
                        columnOrder={columnOrder}
                        customFields={customFields}
                        getCustomFieldValue={getCustomFieldValue}
                        updateJobApplicationMutation={
                          updateJobApplicationMutation
                        }
                        onDeleteApplication={onDeleteApplication}
                      />
                    ))
                  : // Render individual rows
                    filteredAndSortedApplications.data.map((application) => (
                      <JobTableRow
                        key={application.id}
                        application={application}
                        columnOrder={columnOrder}
                        customFields={customFields}
                        getCustomFieldValue={getCustomFieldValue}
                        updateJobApplicationMutation={
                          updateJobApplicationMutation
                        }
                        onDeleteApplication={onDeleteApplication}
                      />
                    ))}
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>

      {/* Pagination */}
      {filteredAndSortedApplications.totalCount > 0 && (
        <div className="bg-white px-4 py-3 border-2 border-gray-light rounded-b-md sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-thunder">
                  Showing{" "}
                  <span className="font-medium">
                    {filteredAndSortedApplications.totalCount > 0
                      ? startItem
                      : 0}
                  </span>{" "}
                  to <span className="font-medium">{endItem}</span> of{" "}
                  <span className="font-medium">
                    {filteredAndSortedApplications.totalCount}
                  </span>{" "}
                  {isGroupedMode ? "groups" : "results"}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="rounded-r-none"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current page
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-concrete bg-white text-sm font-medium text-thunder rounded-none">
                              ...
                            </span>
                          )}
                          <Button
                            onClick={() => setCurrentPage(page)}
                            variant={
                              page === currentPage ? "primary" : "outline"
                            }
                            size="sm"
                            className="rounded-none"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      );
                    })}

                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="rounded-l-none"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

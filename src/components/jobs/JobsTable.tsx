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
import { JobTableRow } from "./JobTableRow";
import { Button } from "../ui/button";
import type { JobsTableProps } from "./types";

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
}: JobsTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden">
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-jade"></div>
          <p className="mt-2 text-sm text-thunder">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (filteredAndSortedApplications.data.length === 0) {
    return (
      <div className="overflow-hidden">
        <div className="py-12 text-center">
          <BriefcaseIcon className="mx-auto h-12 w-12 text-concrete" />
          <h3 className="mt-2 text-sm font-medium text-thunder">
            {filteredAndSortedApplications.totalCount === 0
              ? "No job applications yet"
              : "No applications match your filters"}
          </h3>
          <p className="mt-1 text-sm text-thunder">
            {filteredAndSortedApplications.totalCount === 0
              ? "Job application emails will automatically appear here when detected."
              : "Try adjusting your search or filters to find what you're looking for."}
          </p>
        </div>
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
                {filteredAndSortedApplications.data.map((application) => (
                  <JobTableRow
                    key={application.id}
                    application={application}
                    columnOrder={columnOrder}
                    customFields={customFields}
                    getCustomFieldValue={getCustomFieldValue}
                    updateJobApplicationMutation={updateJobApplicationMutation}
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
                  results
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

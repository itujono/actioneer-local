import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortAsc, SortDesc, GripVertical } from "lucide-react";
import { ColumnConfig } from "../hooks/useColumnOrder";

interface DraggableTableHeaderProps {
  column: ColumnConfig;
  sortConfig?: {
    key: string;
    direction: "asc" | "desc";
  };
  onSort?: (key: string) => void;
  children?: React.ReactNode;
}

export function DraggableTableHeader({
  column,
  sortConfig,
  onSort,
  children,
}: DraggableTableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled: column.fixed,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Only trigger sort if we're not dragging and the column is sortable
    if (!isDragging && column.sortable && onSort && !e.defaultPrevented) {
      onSort(column.key);
    }
  };

  const isCurrentSortColumn = sortConfig?.key === column.key;
  const sortDirection = isCurrentSortColumn ? sortConfig.direction : null;

  return (
    <th
      ref={setNodeRef}
      style={style}
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group ${
        column.sortable && !column.fixed
          ? "cursor-pointer hover:bg-gray-100"
          : ""
      } ${isDragging ? "bg-blue-50 shadow-lg z-10" : ""} ${
        column.fixed ? "bg-gray-50" : ""
      }`}
      onClick={handleHeaderClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="select-none">{column.label}</span>
            {children}
          </div>
          {/* Drag handle - only show for non-fixed columns */}
          {!column.fixed && (
            <div
              {...attributes}
              {...listeners}
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-gray-200 rounded"
              onClick={(e) => e.stopPropagation()} // Prevent sort when clicking drag handle
            >
              <GripVertical className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* Sort indicator */}
        {column.sortable && isCurrentSortColumn && (
          <div className="ml-2">
            {sortDirection === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </div>
        )}
      </div>

      {/* Visual indicator for fixed columns */}
      {column.fixed && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gray-300"></div>
      )}
    </th>
  );
}

// Wrapper component for custom field headers
interface DraggableCustomFieldHeaderProps {
  fieldId: string;
  fieldLabel: string;
  columnOrder: ColumnConfig[];
  sortConfig?: {
    key: string;
    direction: "asc" | "desc";
  };
  onSort?: (key: string) => void;
}

export function DraggableCustomFieldHeader({
  fieldId,
  fieldLabel,
  columnOrder,
  sortConfig,
  onSort,
}: DraggableCustomFieldHeaderProps) {
  // Find the column config for this custom field
  const column = columnOrder.find((col) => col.id === `custom-${fieldId}`);

  if (!column) {
    // Fallback for custom fields not in column order
    return (
      <th
        scope="col"
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
      >
        {fieldLabel}
      </th>
    );
  }

  return (
    <DraggableTableHeader
      column={column}
      sortConfig={sortConfig}
      onSort={onSort}
    />
  );
}
